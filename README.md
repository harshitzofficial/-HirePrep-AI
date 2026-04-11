<div align="center">

# 🤖 HirePrep AI


<br/>

**Elevate your career with AI. Instantly generate bespoke interview strategies, targeted questions, and actionable preparation roadmaps based on your resume and target job description.**

<br/>

[🚀 Quick Start](#-quick-start) · [✨ Features](#-features) · [🏗️ Architecture](#️-architecture) · [📖 How It Works](#-how-it-works) · [🤝 Contributing](#-contributing)

<br/>

<img width="1919" height="919" alt="image" src="https://github.com/user-attachments/assets/d5aa1741-3133-4eb1-b9ff-16eb2d63dc08" />

</div>

---

## 📋 Table of Contents

- [About The Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#️-architecture)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Configuration](#️-configuration)
- [How It Works](#-how-it-works)
- [Contributing](#-contributing)
- [Roadmap](#️-roadmap)
- [License](#-license)

---

## 🎯 About The Project

**HirePrep AI** is an advanced, full-stack application that acts as your personal interview coach. Built with **React + Vite** on the frontend and **Node.js + Express** on the backend, it bridges the gap between your career history and the job you want. 

By simply uploading your resume and pasting a job description, the application uses **Google's Gemini AI** to logically map your skills to the requirements, generate a match score, formulate targeted technical and behavioral questions, and instantly build a day-by-day study roadmap.

This project is a perfect showcase of combining modern frontend glassmorphism design with powerful backend AI schemas and PDF generation.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Smart Resume Parsing** | Extracts and analyzes text directly from uploaded PDF and DOCX files. |
| 🎯 **Targeted Strategy** | Generates custom technical and behavioral questions specifically relevant to the candidate and role. |
| 📊 **Match Scoring** | Instantly evaluates how well your profile aligns with the job description. |
| ⚡ **Actionable Roadmaps** | Creates comprehensive, day-by-day preparation plans based on identified skill gaps. |
| 🖨️ **AI Resume Builder** | Re-formats and generates ATS-friendly, highly professional resumes exported as PDFs via Puppeteer. |
| 🎨 **Premium Glassmorphism UI** | A sleek, responsive, dark-themed design built with modern SCSS techniques. |
| 🛡️ **Structured Output** | Uses Zod schemas to ensure the AI always returns exact, predictable JSON responses. |

---

## 🛠 Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?style=flat-square&logo=vite&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-CC6699?style=flat-square&logo=sass&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_GenAI-API-4285F4?style=flat-square&logo=google&logoColor=white)
![Puppeteer](https://img.shields.io/badge/Puppeteer-PDFs-40B5A4?style=flat-square&logo=puppeteer&logoColor=white)

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                         USER BROWSER                          │
│                                                               │
│   ┌────────────────────────────────────────────────────────┐  │
│   │            React Frontend  (Vite + SCSS)               │  │
│   │   Provides Job Description, Resume & Self Description  │  │
│   └───────────────────────┬────────────────────────────────┘  │
│                           │  HTTP / REST API (Axios)          │
└───────────────────────────┼───────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│              Node.js + Express Backend                        │
│                                                               │
│   ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐   │
│   │ Multer + PDF  │  │  Controllers  │  │   AI Service    │   │
│   │ Parser        │→ │  Business     │→ │  ai.service.js  │   │
│   │ (Uploads)     │  │  Logic        │  │  (Zod + Gemini) │   │
│   └───────────────┘  └───────┬───────┘  └───────┬─────────┘   │
└─────────────────────────────── │─────────────── │─────────────┘
                                 │                │  HTTPS
                                 ▼                ▼
                     ┌──────────────────┐ ┌─────────────────────────┐
                     │   MongoDB        │ │   Google Gemini API     │
                     │   (DB Storage)   │ │  gemini-3-flash-preview │
                     └──────────────────┘ └─────────────────────────┘
```

### Data Flow

1. User uploads a Resume (`.pdf` / `.docx`) and inputs a Target Job Description in the React UI.
2. Frontend sends a `POST` request with the configuration to the Express backend.
3. Backend extracts the text from the uploaded file using `pdf-parse`.
4. The `ai.service.js` constructs a prompt with the parsed details alongside strict **Zod** schema instructions.
5. The Gemini API analyzes the profile vs. job description and returns a validated JSON response.
6. The Backend stores the response in MongoDB and sends it back to the Frontend.
7. The Frontend dynamically renders the preparation plan, skill gaps, and custom questions.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- **npm** v9 or higher (bundled with Node.js)
- A **Google Gemini API key** (free) → [Get one here](https://aistudio.google.com/app/apikey)
- A **MongoDB URI** (free cluster via MongoDB Atlas)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/harshitzofficial/Job-Prep-Platform.git
cd interview-ai-yt-main

# 2. Set up the Backend
cd Backend
npm install

# 3. Configure your environment variables
# Create a .env file and add your credentials (see Configuration section below)
cp .env.example .env

# 4. Start the backend server
npm run dev
# ✅ Backend running at http://localhost:3000

# 5. Open a new terminal — set up the Frontend
cd ../Frontend
npm install

# 6. Start the frontend dev server
npm run dev
# ✅ Frontend running at http://localhost:5173
```

### Verify It's Working

Open [http://localhost:5173](http://localhost:5173) in your browser. You should see the HirePrep AI home screen.

---

## interview-ai-yt-main/
├── Backend/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── src/
│       ├── app.js
│       ├── config/
│       │   ├── database.js
│       │   └── redis.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── interview.controller.js
│       │   └── job.controller.js
│       ├── middlewares/
│       │   ├── auth.middleware.js
│       │   └── file.middleware.js
│       ├── models/
│       │   ├── interviewReport.model.js
│       │   └── user.model.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── interview.routes.js
│       │   └── job.routes.js
│       └── services/
│           ├── ai.service.js
│           └── job.service.js
└── Frontend/
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── public/
    └── src/
        ├── App.jsx
        ├── app.routes.jsx
        ├── main.jsx
        ├── style.scss
        └── features/
            ├── auth/
            │   ├── auth.context.jsx
            │   ├── auth.form.scss
            │   ├── components/
            │   │   └── Protected.jsx
            │   ├── hooks/
            │   │   └── useAuth.js
            │   ├── pages/
            │   │   ├── Login.jsx
            │   │   └── Register.jsx
            │   └── services/
            │       └── auth.api.js
            ├── interview/
            │   ├── interview.context.jsx
            │   ├── hooks/
            │   │   ├── useInterview.js
            │   │   └── useSpeech.js
            │   ├── pages/
            │   │   ├── Home.jsx
            │   │   ├── Interview.jsx
            │   │   └── LiveInterview.jsx
            │   ├── services/
            │   │   └── interview.api.js
            │   └── style/
            │       ├── home.scss
            │       ├── interview.scss
            │       └── liveInterview.scss
            └── public/
                ├── pages/
                │   └── Landing.jsx
                └── style/
                    └── landing.scss
        └── style/
            └── button.scss
```

---

## ⚙️ Configuration

### Backend — `.env`

Create a `.env` file inside the `Backend/` directory:

```env
# ── Server ──────────────────────────────────────────────────
PORT=3000
NODE_ENV=development

# ── Database ────────────────────────────────────────────────
MONGODB_URI=your_mongodb_connection_string

# ── Authentication ──────────────────────────────────────────
JWT_SECRET=your_jwt_secret_key

# ── AI Provider ─────────────────────────────────────────────
GOOGLE_GENAI_API_KEY=your_google_gemini_api_key_here
```

> ⚠️ **Never commit your `.env` file.**

---

## 🧠 How It Works

### Structured AI Outputs with Zod (`ai.service.js`)

Unlike standard AI text generation, **HirePrep AI** ensures 100% predictable integration by combining the `@google/genai` library with **Zod** schema translation to enforce strict JSON output formatting:

```javascript
const interviewReportSchema = z.object({
    matchScore: z.number(),
    technicalQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),
    // ... Additional schema definitions
});

const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(interviewReportSchema),
    }
});
```
This powerful configuration guarantees your React frontend never breaks due to invalidly formatted strings.

---

## 🤝 Contributing

Contributions are what make the open-source community great. Any contribution you make is **hugely appreciated**!

1. **Fork** the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a **Pull Request**

---

## 🗺️ Roadmap

- [x] Integrate Google Gemini Flash for Interview Generation
- [x] Setup Zod Schema Validation for AI Outputs
- [x] Complete the Glassmorphism Frontend Layout
- [x] Resume Parsing via PDF-parse
- [x] Automated Resume Generation via Puppeteer
- [ ] Add Mock Audio/Video Interviews
- [ ] Implement LeetCode-style Code Execution environments
- [ ] Add real-time WebSocket integrations for peer interviews

---

## 📄 License

Distributed under the ISC License. 

---

<div align="center">

Made with ❤️ by Harshit Singh

⭐ If this project helped you, please give it a star — it really helps!

</div>



## CLI REDIS

This is the standard way to interact with Redis from the terminal.

In your PowerShell terminal, navigate to the Backend directory and start the containers if they aren't already running:
bash

cd Backend
docker-compose up -d

Execute the redis-cli inside the running Redis container:

bash
docker-compose exec redis redis-cli

Once you're inside the Redis shell (you'll see 127.0.0.1:6379>), you can run commands to inspect data:
List all keys: KEYS *
See the type of a key: TYPE "your_key_name"
Get the value of a string key: GET "your_key_name"
Get all fields & values of a hash key: HGETALL "your_hash_key"
To exit the CLI, just type exit

## GUI REDIS

Install and open RedisInsight.
Add a database connection.
Set the Host to 127.0.0.1 and Port to 6379.
Connect, and you'll be able to visually browse, search, edit, and delete the keys and values currently stored.


Time-To-Live (TTL) for data stored in Redis depends on exactly what is being stored. There are currently **two distinct TTL rules** defined in your codebase:

### 1. Cached Database & AI Responses: 24 Hours
When a user generates or retrieves an Interview Report, the result is cached in Redis to speed up future requests. The TTL for this cached data is **86,400 seconds (which is exactly 24 hours).**

This applies to:
- Cached AI service outputs (`Backend/src/services/ai.service.js`)
- Cached Interview Reports retrieved from MongoDB (`Backend/src/controllers/interview.controller.js`)

**Code snippet from your repo:**
```javascript
await redisClient.setEx(cacheKey, 86400, JSON.stringify(interviewReport));
```

### 2. Blacklisted Tokens (Logout): Dynamic TTL
When a user logs out, their current JWT token is added to a Redis "blacklist" so it can't be reused. In this case, there is no hard-coded TTL. Instead, the backend calculates the **exact time remaining before the JWT naturally expires** (`timeLeft`). 

The TTL is set to that exact `timeLeft` amount. This is a very efficient way to handle it, as the Redis key automatically cleans itself up the precise moment the token would have expired anyway.

**Code snippet from your repo (`auth.controller.js`):**
```javascript
await redisClient.setEx(`blacklist:${token}`, timeLeft, "true");
```
----------------------------------------------------------------------------------------------
## WHY MONGODB

Listed directory models
Viewed interviewReport.model.js:1-108

Based on the architecture of your `Interview-AI-YT` project, choosing MongoDB over a traditional relational database (like PostgreSQL or MySQL) is a highly strategic and natural choice. 

Here is a breakdown of why MongoDB is specifically well-suited for your application:

### 1. Handling Deeply Nested Data
If we look at your `interviewReport.model.js`, a single "Interview Report" contains **deeply nested, multi-layered data arrays**:
- `technicalQuestions` (Array of objects)
- `behavioralQuestions` (Array of objects)
- `skillGaps` (Array of objects)
- `preparationPlan` (Array of nested objects with `tasks` arrays)
- Arrays of strings (`detectedSkills`, `identifiedProjects`)

**In MongoDB (NoSQL):** You can store this entire report as a **single, unified document**. Fetching the interview report is incredibly fast because it only requires one read operation.
**In SQL (Relational DB):** You would need to create 6+ separate tables (e.g., `Reports`, `TechnicalQuestions`, `BehavioralQuestions`, `SkillGaps`, `PreparationPlans`, `Tasks`) linked by Foreign Keys. Retrieving a single report would require multiple costly `JOIN` operations across these tables, increasing complexity and query times.

### 2. Perfect Fit for AI-Generated Structured Output
Since your project relies on AI models to generate these technical questions, behavioral questions, and prep plans, the data naturally comes back from the AI (like OpenAI/Gemini) in a JSON format.
MongoDB stores data in BSON (Binary JSON). This provides a seamless, 1-to-1 mapping from the AI's JSON output directly into your database using Mongoose.

### 3. Schema Flexibility
AI responses can sometimes be unpredictable, or you might want to introduce new features quickly (like the `// 🟢 ADDED THESE TWO FIELDS` comment in your model for `detectedSkills`). MongoDB allows you to easily evolve your schema without having to run complex database migrations (like `ALTER TABLE`) that are strictly required in relational databases.

### 4. Seamless Integration with the Tech Stack
Your project uses the standard **MERN Stack** (MongoDB, Express, React, Node.js). Because the backend is built with Javascript/Node, and MongoDB uses Javascript objects inherently, the data flows seamlessly from the Database $\rightarrow$ Backend (Mongoose) $\rightarrow$ Frontend without any friction or complex ORM mapping over-head.

### Summary
You chose MongoDB because your core data (Interview Reports) is hierarchical, schema-variable, and JSON-heavy. **MongoDB optimizes for fast reads of large, complex objects**, saving you from the headache of maintaining complex SQL migrations and queries.


-----------------------------------------------------------------------------------------
### Backend documentation:
Here is a comprehensive, production-ready documentation guide for your backend architecture. You can use this as your core `README.md` or internal developer documentation. 

It highlights not just what the files are, but the enterprise-grade optimizations (like Redis caching, rate limiting, and singleton patterns) we built into the system.

---

# 🚀 Interview AI Backend Documentation

## 1. System Overview
This is the Node.js/Express backend for an AI-powered interview preparation platform. It processes user resumes (PDFs), leverages Google's Gemini AI to generate customized interview questions and dynamically tailored roadmaps, and integrates with rapid external APIs to fetch live job postings based on the user's profile.

### Core Tech Stack
* **Runtime:** Node.js (v22)
* **Framework:** Express.js
* **Primary Database:** MongoDB (via Mongoose)
* **Caching & State:** Redis (for rate-limiting, AI caching, and JWT blacklisting)
* **AI Engine:** Google Gemini GenAI SDK (`gemini-2.5-flash`)
* **File Handling:** Multer (In-memory storage) & PDF-Parse
* **PDF Generation:** Puppeteer (Headless Chromium)
* **Containerization:** Docker & Docker Compose

---

## 2. Directory Structure Breakdown

### `/src/config/` (Infrastructure Connections)
* **`database.js`**: Establishes the connection to MongoDB Atlas.
* **`redis.js`**: Initializes the Redis client. Uses a deferred connection strategy to prevent race conditions during server startup.

### `/src/middlewares/` (Gatekeepers)
* **`auth.middleware.js`**: Secures protected routes. Verifies JWTs from HTTP-only cookies or Bearer headers and checks the **Redis Blacklist** to ensure logged-out tokens are instantly invalidated.
* **`file.middleware.js`**: A Multer configuration that strictly limits uploads to **5MB** and validates the mimetype to ensure only `.pdf` files are processed, protecting the server from malicious payloads.

### `/src/routes/` (Traffic Directors)
Defines the API endpoints and applies targeted security.
* **`auth.routes.js`**: Handles login/registration. Protected by a strict `authRateLimiter` to prevent brute-force credential stuffing.
* **`interview.routes.js`**: Core application routes. Heavily protected by an `aiRateLimiter` (backed by Redis) to prevent users from burning through Gemini API quotas. Includes a custom error wrapper to gracefully handle Multer rejections.
* **`job.routes.js`**: Routes for fetching live jobs, protected by a dedicated API rate limiter.

### `/src/controllers/` (Business Logic)
Handles the requests, coordinates with services, and sends JSON responses.
* **`auth.controller.js`**: Issues highly secure, HTTP-only, `sameSite` cookies on login, and handles the Redis TTL logic for blacklisting tokens upon logout.
* **`interview.controller.js`**: Manages the core AI generation flow. Utilizes **SHA-256 Payload Hashing** to check Redis for cached interview reports before triggering expensive AI calls.
* **`job.controller.js`**: Fetches the user's latest resume from MongoDB, passes it to the AI for keyword extraction, and queries the external job API. Results are cached in Redis to save external API costs.

### `/src/services/` (External Integrations)
* **`ai.service.js`**: The heaviest file in the backend. 
    * Contains highly structured **Zod Schemas** to force Gemini to return predictable, strictly-typed JSON.
    * Implements **Graceful Degradation** (falling back to hardcoded questions if the Gemini API hits a 429 Quota limit).
    * Manages PDF generation using a **Puppeteer Singleton Pattern** to prevent server memory leaks (re-using one browser instance and opening new tabs rather than booting new browsers).
* **`job.service.js`**: Uses Gemini to extract a single, highly relevant job title string from a resume, then queries the `jsearch.p.rapidapi.com` API for live listings.

### `/src/models/` (Data Schemas)
* **`user.model.js`**: Mongoose schema for users. Automatically indexes unique emails and usernames for $O(\log n)$ lookup times, and utilizes `bcrypt` for secure password hashing.
* **`interviewReport.model.js`**: Stores the AI-generated reports linked to the specific User ID.

---

## 3. Core Workflows

### A. The Authentication Flow
1. User submits credentials to `/api/auth/login`.
2. Controller verifies the password via `bcrypt`.
3. A JWT is generated and placed inside an `httpOnly`, `secure` cookie to prevent Cross-Site Scripting (XSS) attacks.
4. On logout, the remaining lifespan (TTL) of the JWT is calculated, and the token is pushed to Redis to be blacklisted until it naturally expires.

### B. The AI Report Generation Flow (Optimized)
1. User uploads a PDF to `/api/interview/`.
2. Multer parses the file into RAM (memory buffer). `pdf-parse` extracts the text.
3. The Controller creates a unique SHA-256 hash based on the User ID, JD, and Resume text.
4. **Cache Check:** The controller checks Redis. If a matching hash exists, it instantly returns the cached report (saving time and money).
5. **AI Generation:** If no cache exists, the text is sent to `ai.service.js`, which forces Gemini 2.5 to output a structured JSON report.
6. The report is saved to MongoDB, cached in Redis for 24 hours, and returned to the user.

---

## 4. Security & Performance Highlights

This backend is built for production resilience. Key features include:

* **Redis-Backed Rate Limiting:** Prevent abusers from spamming routes. Using `RedisStore` ensures rate limits work across multiple horizontal load-balanced servers.
* **"Trust Proxy" Configured:** Express is configured to trust upstream load balancers, ensuring rate-limiters track the real user's IP, not the hosting provider's proxy IP.
* **No "N+1" Database Queries:** Data fetching is optimized using `.select()` and `.sort()` to pull only necessary fields into memory.
* **Database Connection Race Conditions Handled:** Express routes are strictly loaded *after* both MongoDB and Redis successfully connect in `server.js`.
* **Puppeteer Memory Optimization:** By passing `--disable-dev-shm-usage` and using a global browser singleton, the app safely generates PDFs even on low-memory Alpine Linux containers.

---

## 5. Deployment Guide (Docker)

The application utilizes a dual-tier Docker strategy to separate the development experience from production security.

### Local Development
To run the app locally with hot-reloading (nodemon):
```bash
docker-compose -f docker-compose.dev.yml up --build
```
*This mounts your local files into the container, allowing instant updates when you save a file.*

### Production Deployment
To build the production-hardened image:
```bash
docker-compose up -d --build
```
*This uses the optimized `Dockerfile` which runs `npm ci --omit=dev`, strips out development dependencies, switches to a low-privileged `node` user to prevent root-access exploits, and allocates sufficient shared memory (`shm_size: '1gb'`) for headless Chrome to run safely.*
----------------------------------------------------------------------------------------------
### Rate Limiting Algorithm used in the project

This project uses the **Fixed Window Counter** algorithm for rate limiting.

Here are the specific technical details of how it's implemented:

1. **Packages**: It relies on the `express-rate-limit` library for Express, coupled with `rate-limit-redis` to store the rate-limit state in a Redis database. This setup allows the rate limiting to work consistently even if backend servers are scaled to multiple instances.
2. **Algorithm Implementation**: By default, `express-rate-limit` implements the Fixed Window Counter algorithm. It defines a rigid time window (e.g., 15 minutes), and if an IP address exceeds the maximum allowed requests (`max`) within that exact window frame, subsequent requests are blocked until the next 15-minute window begins and the Redis counter resets.
3. **Usage in the Project**:
   * **Authentication Limiter (`src/routes/auth.routes.js`)**: Restricts login and registration attempts to 10 requests per 15-minute window to prevent brute-forcing.
   * **AI Feature Limiter (`src/routes/interview.routes.js`)**: Protects expensive API calls (like generating interview questions, grading tests, and creating resumes) by limiting users to 10 requests per 15-minute window.

--------------------------------------------------------------------------------------------

docker-compose up -d

 docker-compose logs -f backend

   
   Started Redis Service: I ran docker compose up -d redis to start just the Redis container. This provides the Redis server that your local backend needs to connect to, without requiring you to run the entire backend inside Docker.
