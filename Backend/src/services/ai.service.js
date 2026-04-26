const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");// For defining and validating the structure of our AI responses
const { zodToJsonSchema } = require("zod-to-json-schema");// For converting Zod schemas to JSON Schema format for AI response validation
const puppeteer = require("puppeteer");// For generating PDFs
const crypto = require("crypto"); // For generating unique cache keys
const redisClient = require("../config/redis"); // Make sure you created this file!
  
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const MODEL_NAME = "gemini-2.5-flash-lite";

// 🟢 Helper function for exponential backoff retries (handles 429 errors)
async function callAiWithRetry(fn, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`⚠️ AI Rate Limit hit. Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// Helper function to create a unique fingerprint of the user's inputs
function generateCacheKey(prefix, resume, selfDescription, jobDescription) {
  // Combine inputs into one string, then hash it so it's a short, unique string
  const combinedString = `${resume}|${selfDescription}|${jobDescription}`;
  const hash = crypto.createHash("sha256").update(combinedString).digest("hex");
  return `${prefix}:${hash}`;
}

/**
 Why Zod is Important
When users send data (forms, APIs), it can be:
Missing fields ❌
Wrong types ❌
Invalid values ❌

👉 Zod helps you:

Validate data ✅
Prevent bugs ✅
Improve security ✅
 */


// this is the schema for the interview report
const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the job describe",
    ),

  detectedSkills: z
    .array(z.string())
    .describe(
      "List of core technical skills extracted from the candidate's resume",
    ),
  identifiedProjects: z
    .array(z.string())
    .describe(
      "List of specific project names or titles found in the candidate's resume",
    ),

  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Technical questions that can be asked in the interview along with their intention and how to answer them",
    ),

  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The behavioral question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Behavioral questions that can be asked in the interview along with their intention and how to answer them",
    ),

  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe(
            "The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances",
          ),
      }),
    )
    .describe(
      "List of skill gaps in the candidate's profile along with their severity",
    ),

  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe("The day number in the preparation plan, starting from 1"),
        focus: z
          .string()
          .describe(
            "The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc.",
          ),
        tasks: z
          .array(z.string())
          .describe(
            "List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.",
          ),
      }),
    )
    .describe(
      "A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively",
    ),

  title: z
    .string()
    .describe(
      "The title of the job for which the interview report is generated",
    ),
});

const dynamicRoadmapSchema = z.object({
    preparationPlan: z.array(
        z.object({
            day: z.number().describe("The day number"),
            focus: z.string().describe("Main focus for the day"),
            tasks: z.array(z.string()).describe("List of actionable tasks")
        })
    )
});


const liveQuestionsSchema = z.object({
  questions: z.array(z.string()).length(3),
});
const evaluationSchema = z.object({
  overallScore: z.number().describe("Overall score out of 10"),
  summary: z.string().describe("A brief, actionable summary of their performance"),
  skills: z.object({
    confidence: z.number().describe("Score out of 10 for vocal confidence"),
    communication: z.number().describe("Score out of 10 for clarity and structure"),
    correctness: z.number().describe("Score out of 10 for technical accuracy")
  }),
  questionBreakdown: z.array(
    z.object({
      question: z.string(),
      score: z.number().describe("Score out of 10 for this specific answer"),
      feedback: z.string().describe("Specific feedback for this answer")
    })
  )
});

//-------------------------------------------------------------------------------------
// AI Service Functions
const generateDynamicRoadmap = async ({ jobDescription, resumeText, days }) => {
    const prompt = `You are an expert technical interview coach.
    Create a strict ${days}-day interview preparation roadmap. 
    
    Candidate Resume: ${resumeText || "No resume provided"}
    Target Job: ${jobDescription}
    
    Spread the preparation out logically over EXACTLY ${days} days. 
    Day 1 should be fundamentals/planning, and Day ${days} should be mock interviews/rest.`;

    try {
        const response = await callAiWithRetry(() => 
            ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: zodToJsonSchema(dynamicRoadmapSchema),
                },
            })
        );
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Dynamic Roadmap Error:", error);
        throw error;
    }
};
async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  // 🚨 DEBUG: Check if your PDF text is actually reaching this function
  console.log("📝 RESUME TEXT LENGTH:", resume?.length || 0);
  if (!resume || resume.length < 10) {
    console.error("❌ ERROR: Resume text is empty. PDF Parsing failed.");
  }

  const prompt = `
    ACT AS: A Senior Technical Recruiter.
    DATA:
    - Resume: ${resume}
    - User Bio: ${selfDescription}
    - Target JD: ${jobDescription}

    STRICT TASK:
    1. EXTRACT 'detectedSkills': Look through the Resume and list EVERY technical skill (languages, frameworks, tools).
    2. EXTRACT 'identifiedProjects': List the titles of the Projects found in the resume.
    3. ANALYZE 'matchScore': 0-100 score vs the JD.
    4. GENERATE: technicalQuestions, behavioralQuestions, skillGaps, and preparationPlan.

    JSON RULE: You must return valid JSON matching the provided schema. Do not leave detectedSkills or identifiedProjects empty if data exists in the resume.
    `;

  try {
    const response = await callAiWithRetry(() => 
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: zodToJsonSchema(interviewReportSchema),
        },
      })
    );

    const result = JSON.parse(response.text);

    // 🚨 LOG THE RESULT: See what Gemini actually found
    console.log("💎 GEMINI FOUND SKILLS:", result.detectedSkills);
    console.log("💎 GEMINI FOUND PROJECTS:", result.identifiedProjects);

    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
//-------------------------------------------------------------------------------------
/**
 * Why this is IMPORTANT
Launching Puppeteer is very expensive (slow + heavy)
👉 Without this: New browser per request ❌ (slow, crashes server)
👉 With this: One browser reused ✅ (fast, scalable)
 */

let globalBrowser = null;

// Initialize the browser once
async function getBrowser() {
    if (!globalBrowser) {
        console.log("🌐 Launching Puppeteer Browser instance...");

        const launchOptions = {
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage", // Prevents memory crashes
                "--disable-gpu" // Extra stability on Linux servers
            ],
        };

        // 🚀 THE FIX: Don't hardcode a Linux path on Windows!
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        } else if (process.platform === 'linux') {
            // Only use this default if we're actually on a Linux server (Docker/Render)
            launchOptions.executablePath = '/usr/bin/chromium-browser';
        }

        globalBrowser = await puppeteer.launch(launchOptions);
    }
    return globalBrowser;
}

async function generatePdfFromHtml(htmlContent) {
    let page = null;
    try {
        const browser = await getBrowser();
        page = await browser.newPage();  
        
        await page.setContent(htmlContent, { waitUntil: "networkidle0" });
        
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true, // 🚀 THE FIX: Ensures AI-generated colors/borders actually render!
            margin: { top: "14mm", bottom: "14mm", left: "14mm", right: "14mm" }, // Tighter margins
        });

        return pdfBuffer;
    } catch (error) {
        console.error("📄 PDF Generation Error:", error);
        throw error;
    } finally {
        if (page) await page.close(); 
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const cacheKey = generateCacheKey(
    "resume_html",
    resume,
    selfDescription,
    jobDescription,
  );
  let jsonContent;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("⚡ Serving Resume HTML from Redis Cache!");
      jsonContent = JSON.parse(cachedData);
    }
  } catch (err) {
    console.warn("⚠️ Redis Read Error:", err);
  }

  if (!jsonContent) {
    console.log("🧠 Cache Miss: Calling Gemini AI for Resume HTML...");
    
    const resumePdfSchema = z.object({
      html: z.string().describe("The highly structured HTML content of the resume"),
    });

    // 🚀 THE FIX: A highly aggressive, structured prompt for the AI
    const prompt = `You are an expert executive resume writer and frontend developer.
    Your task is to generate a strictly ONE-PAGE, highly professional, ATS-friendly resume in HTML format.
    
    Candidate Data:
    - Resume: ${resume}
    - Self Description: ${selfDescription}
    - Target Job: ${jobDescription}

    CRITICAL HTML/CSS RULES:
    1. MUST use embedded <style> tags. Do not use external stylesheets.
    2. Base styling: Use font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.4;
    3. Font sizes: Headers (16px-18px), Job Titles (13px bold), Body Text (11px). Do NOT use huge fonts.
    4. Margins/Padding: Keep padding minimal (e.g., 2px to 5px) to ensure everything fits on ONE page.
    5. Layout: Use CSS Flexbox to align content. For example, align Job Titles to the left and Dates to the right on the same line.
    6. Structure: 
       - Header (Name, Contact Info, centered)
       - Professional Summary (3-4 concise lines tailored to the JD)
       - Core Skills (Displayed as a compact comma-separated list or small flex boxes)
       - Work Experience (Punchy, metric-driven bullet points. Max 3-4 bullets per role)
       - Education
    7. Cut the fluff. Discard irrelevant experience to ensure it strictly fits on a single A4 page.
    8. Add subtle, professional styling (e.g., a thin 1px bottom border under section headers).
    
    Return ONLY the JSON with the "html" field.`;

    const response = await callAiWithRetry(() => 
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: zodToJsonSchema(resumePdfSchema),
        },
      })
    );

    jsonContent = JSON.parse(response.text);

    try {
      await redisClient.setEx(cacheKey, 86400, JSON.stringify(jsonContent));
    } catch (err) {
      console.warn("⚠️ Redis Write Error:", err);
    }
  }

  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

  return pdfBuffer;
}

const generateLiveQuestions = async ({
  jobDescription,
  selfDescription,
  resumeText,
  userCommand,
  interviewType
}) => {
  try {
    console.log("Checking inputs...", {
      hasResume: !!resumeText,
      hasJob: !!jobDescription,
    });

    const prompt = `
    You are an expert AI Interviewer. Generate exactly 3 interview questions based on the candidate's profile.

    CRITICAL CONTEXT:
    - Target Job: ${jobDescription}
    - Candidate Resume: ${resumeText}
    - INTERVIEW ROUND TYPE: ${interviewType || "Technical Interview"} 
    - Specific User Request: ${userCommand || "None"}

    INSTRUCTIONS BASED ON ROUND TYPE:
    - If "Behavioral": Ask about past experiences, conflict resolution, leadership (STAR method). NO coding questions.
    - If "System Design": Ask about architecture, scaling, databases, bottlenecks.
    - If "Technical": Ask deep-dive coding, framework, and language-specific questions.
    - If "Mixed": Provide one of each.

    Return the output strictly in the requested JSON format.
    `;

    const response = await callAiWithRetry(() => 
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: zodToJsonSchema(liveQuestionsSchema),
        },
      })
    );

    return JSON.parse(response.text);

  } catch (error) {
    console.error("DETAILED AI ERROR:", error);

    // 🟢 GRACEFUL DEGRADATION: If we hit a 429 Quota Error (or any API crash)
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      console.log("⚠️ API Quota Reached! Silently loading default fallback questions.");
      
      const isBehavioral = interviewType?.toLowerCase().includes('behavioral');
      
      // Return dynamic fallbacks based on what they selected
      if (isBehavioral) {
        return {
          questions: [
            "Tell me about a time you had to overcome a significant challenge at work. What was the outcome?",
            "Describe a situation where you disagreed with a team member. How did you navigate that conversation?",
            "Can you share an example of a time you had to adapt to a sudden change in a project's requirements?"
          ]
        };
      } else {
        return {
          questions: [
            "Can you walk me through the architecture of a recent technical project you are proud of?",
            "How do you approach debugging a complex, undocumented issue in a production environment?",
            "What strategies do you use to ensure the quality, security, and maintainability of your code?"
          ]
        };
      }
    }

    // If it's a completely different fatal error, throw it so the frontend knows something is deeply wrong
    throw error;
  }
};

const evaluateLiveInterview = async ({ transcript, jobDescription, aiMetrics }) => {
  if (!transcript || transcript.length === 0) {
    return {
      overallScore: 0,
      summary: "Interview ended before answering any questions. No data to evaluate.",
      skills: {
        confidence: 0,
        communication: 0,
        correctness: 0
      },
      questionBreakdown: []
    };
  }

  const prompt = `You are an expert hiring manager evaluating a candidate's live interview. 
    Review the following transcript. Score them aggressively but fairly out of 10.
    Provide an overall score, scores for specific skills, and a breakdown of each question.
    
    CRITICAL BIOMETRIC DATA:
    The candidate's camera was tracked during this interview. Incorporate this data into your final "Confidence" and "Communication" scores:
    - Average Body Language Confidence: ${aiMetrics?.avgConfidence || 'Unknown'} / 100
    - Eye Contact Score: ${aiMetrics?.eyeContactScore || 'Unknown'} / 100

    Target Job: ${jobDescription}
    Interview Transcript: ${JSON.stringify(transcript)}`;

  try {
    const response = await callAiWithRetry(() => 
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: zodToJsonSchema(evaluationSchema),
        },
      })
    );
    return JSON.parse(response.text);
  } catch (error) {
    console.error("DETAILED EVALUATION ERROR:", error);
    
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      console.log("⚠️ API Quota Reached! Silently loading fallback evaluation.");
      return {
        overallScore: 0,
        summary: "Evaluation unavailable at the moment due to AI server capacity. Please try again later.",
        skills: {
          confidence: 0,
          communication: 0,
          correctness: 0
        },
        questionBreakdown: transcript.map(t => ({
          question: t.question,
          score: 0,
          feedback: "Evaluation unavailable due to high server load."
        }))
      };
    }
    throw error;
  }
};
// In ai.service.js
// In ai.service.js
async function evaluateSingleAnswer({ question, answer, jobDescription }) {
    console.log("🧠 Evaluating single answer...");
    
    const prompt = `
    You are an expert technical interviewer. Evaluate this specific answer.
    
    Role: ${jobDescription}
    Question: ${question}
    Candidate's Answer: ${answer}

    Provide a short, constructive, and highly actionable critique (max 3-4 sentences). 
    Tell the candidate exactly what they did well, and what they should mention to make the answer perfect. Do not grade them, just coach them.
    `;

    try {
        // 🟢 FIXED: Using the new SDK syntax to match the rest of your file!
        const response = await callAiWithRetry(() => 
            ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
            })
        );
        
        return { feedback: response.text };
    } catch (error) {
        console.error("Single Eval Error:", error);
        throw error;
    }
}
async function generateLiveHint({ question, jobDescription }) {
    console.log("🧠 Generating AI Copilot Hint...");
    
    const prompt = `
    You are a subtle AI Copilot helping a candidate during a live interview.
    
    Role: ${jobDescription}
    Current Question: ${question}

    Provide a very short, 1-sentence hint to help the candidate get unstuck. 
    DO NOT give them the direct answer. Just give them a mental nudge. 
    Example: "Hint: Try using the STAR method to structure your story." or "Hint: Think about how you handled the database scaling."
    `;

    try {
        const response = await callAiWithRetry(() => 
            ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
            })
        );
        return { hint: response.text };
    } catch (error) {
        console.error("Live Hint Error:", error);
        return { hint: "Hint: Take a deep breath and break the problem down into smaller steps." };
    }
}

module.exports = {
  generateInterviewReport,
  generateResumePdf,
  generateLiveQuestions,
  evaluateLiveInterview,
  evaluateSingleAnswer,
  generateLiveHint,
  generateDynamicRoadmap,
  ai,
  callAiWithRetry,
  MODEL_NAME
};

/*
You'll notice I used Redis to cache the HTML output from Gemini, rather than caching the raw PDF file buffer.
Why? Because storing binary files (like PDFs) in Redis can eat up memory very quickly. The AI text generation
is the part that takes 10+ seconds and costs money. Puppeteer is free and takes ~1 second. Caching the HTML is 
the perfect balance of saving money and keeping Redis lightning fast!
*/
