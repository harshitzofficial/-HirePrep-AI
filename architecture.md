# 🏗️ HirePrep AI — High-Level Architecture

---

## 1. Full System Architecture

```mermaid
graph TB
    subgraph CLIENT["🖥️ CLIENT LAYER"]
        FE["⚛️ React + Vite\nFrontend\n(Vercel)"]
    end

    subgraph BACKEND["🐳 DOCKER CONTAINER (Render)"]
        direction TB

        SRV["server.js\nEntry Point\n(dotenv → DB → Redis → App)"]

        subgraph EXPRESS["🚂 Express App  ·  app.js"]
            direction LR
            CORS["Manual CORS\nMiddleware"]
            TP["trust proxy: 1"]
        end

        subgraph ROUTES["📡 Route Layer"]
            AR["/api/auth\nauth.routes.js"]
            IR["/api/interview\ninterview.routes.js"]
            JR["/api/jobs\njob.routes.js"]
        end

        subgraph MIDDLEWARE["🛡️ Middleware Layer"]
            AUTH["authMiddleware\nJWT verify +\nRedis blacklist check"]
            MULTER["fileMiddleware\nMulter memoryStorage\nPDF only · 5MB limit"]
            RL["aiRateLimiter\n10 req / 15 min\nRedisStore backed"]
        end

        subgraph CONTROLLERS["🎮 Controller Layer"]
            AC["auth.controller.js\nregister · login\nlogout · getMe"]
            IC["interview.controller.js\ngenerateReport · getReport\ngetAllReports · deleteReport\nresumePdf · liveQuestions\nevaluate · evaluateSingle\nliveHint · dynamicRoadmap\ngetAllSessions"]
            JC["job.controller.js\nsearchJobs"]
        end

        subgraph SERVICES["⚙️ Service Layer"]
            AIS["ai.service.js\nGemini API wrapper\ncallAiWithRetry (exp. backoff)\ngeneratePdfFromHtml\nPuppeteer singleton"]
            JS["job.service.js\ngetJobSearchQueryFromResume\nfetchLiveJobs"]
        end

        subgraph MODELS["🗃️ Mongoose Models"]
            UM["User\nusername · email\npassword (bcrypt)"]
            IRM["InterviewReport\njobDescription · resume\nmatchScore · detectedSkills\nidentifiedProjects\ntechnicalQuestions\nbehavioralQuestions\nskillGaps · preparationPlan"]
            ISM["InterviewSession\ntranscript · overallScore\nskills (confidence/\ncommunication/correctness)\nquestionBreakdown · aiMetrics"]
        end

        subgraph CONFIG["⚙️ Config"]
            DB_CFG["database.js\nMongoose connect"]
            R_CFG["redis.js\ncreateClient\nreconnectStrategy\npingInterval: 5min"]
        end
    end

    subgraph DATA["💾 DATA LAYER"]
        MONGO[("🍃 MongoDB Atlas\nUsers\nInterviewReports\nInterviewSessions")]
        REDIS[("⚡ Redis\n─────────────\nToken Blacklist\nReport Cache (24h)\nResume HTML Cache (24h)\nJob Listings Cache (6h)\nRate Limit Counters")]
    end

    subgraph EXTERNAL["🌐 EXTERNAL SERVICES"]
        GEMINI["🤖 Google Gemini AI\ngemini-2.5-flash-lite\nStructured JSON Output\nZod Schema Validation"]
        JSEARCH["🔍 JSearch API\n(RapidAPI)\nLive Job Listings"]
    end

    FE -- "HTTPS + httpOnly Cookie\nJWT Auth" --> SRV
    SRV --> EXPRESS
    EXPRESS --> ROUTES
    AR --> AUTH --> AC
    IR --> AUTH --> RL --> MULTER --> IC
    JR --> AUTH --> JC
    IC --> AIS
    IC --> MODELS
    JC --> JS
    JS --> JSEARCH
    JS --> REDIS
    AIS --> GEMINI
    AIS --> REDIS
    AC --> REDIS
    AUTH --> REDIS
    MODELS --> MONGO
    CONFIG --> MONGO
    CONFIG --> REDIS

    classDef clientStyle fill:#6366f1,stroke:#4338ca,color:#fff
    classDef serviceStyle fill:#0ea5e9,stroke:#0284c7,color:#fff
    classDef dataStyle fill:#10b981,stroke:#059669,color:#fff
    classDef externalStyle fill:#f59e0b,stroke:#d97706,color:#fff
    classDef controllerStyle fill:#8b5cf6,stroke:#7c3aed,color:#fff

    class FE clientStyle
    class AIS,JS serviceStyle
    class MONGO,REDIS dataStyle
    class GEMINI,JSEARCH externalStyle
    class IC,AC,JC controllerStyle
```

---

## 2. Interview Report Generation Flow (with Redis Cache)

```mermaid
sequenceDiagram
    actor User
    participant FE as ⚛️ Frontend (Vercel)
    participant MW as 🛡️ Auth + Rate Limiter
    participant IC as 🎮 interview.controller
    participant Redis as ⚡ Redis
    participant AI as ⚙️ ai.service
    participant Gemini as 🤖 Gemini API
    participant Mongo as 🍃 MongoDB

    User->>FE: Upload PDF Resume +\nJob Description + Self Bio
    FE->>MW: POST /api/interview/\n(multipart/form-data + cookie)
    MW->>MW: JWT verify + blacklist check
    MW->>MW: Rate limit check (10/15min)
    MW->>IC: Multer parses PDF → buffer
    IC->>IC: pdf-parse extracts text
    IC->>IC: SHA-256 hash(userId+resume+JD+bio)\n= cacheKey

    IC->>Redis: GET report_cache:{hash}
    alt Cache HIT ⚡
        Redis-->>IC: Cached JSON report
        IC-->>FE: 200 OK (instant response)
    else Cache MISS 🐢
        IC->>AI: generateInterviewReport(resume, JD, bio)
        AI->>AI: Build structured prompt\n(Senior Recruiter persona)
        loop Retry on 429 (max 3x, exp. backoff)
            AI->>Gemini: generateContent()\nresponseMimeType: application/json\nresponseSchema: zodToJsonSchema(interviewReportSchema)
            Gemini-->>AI: Structured JSON
        end
        AI-->>IC: {matchScore, detectedSkills,\nidentifiedProjects, technicalQuestions,\nbehavioralQuestions, skillGaps, preparationPlan}
        IC->>Mongo: InterviewReport.create({...})
        Mongo-->>IC: Saved document
        IC->>Redis: SETEX report_cache:{hash} 86400 (24h)
        IC-->>FE: 201 Created + report JSON
    end
    FE-->>User: Render Interview Report Dashboard
```

---

## 3. Authentication Flow (JWT + Redis Blacklist)

```mermaid
sequenceDiagram
    actor User
    participant FE as ⚛️ Frontend
    participant AC as 🎮 auth.controller
    participant Mongo as 🍃 MongoDB
    participant Redis as ⚡ Redis

    Note over User,Redis: ── REGISTER ──
    User->>AC: POST /api/auth/register\n{username, email, password}
    AC->>AC: Validate fields & password ≥ 8 chars
    AC->>Mongo: findOne({$or:[{username},{email}]})
    Mongo-->>AC: null (user doesn't exist)
    AC->>AC: bcrypt.hash(password, saltRounds=10)
    AC->>Mongo: User.create({username, email, hash})
    AC->>AC: jwt.sign({id, username}, SECRET, {expiresIn: "1d"})
    AC-->>FE: Set-Cookie: token=JWT\n(httpOnly, secure, sameSite=None)\n+ 201 user object

    Note over User,Redis: ── PROTECTED REQUEST ──
    User->>FE: Navigate to dashboard
    FE->>Redis: GET /api/interview/ + cookie
    Note right of FE: authMiddleware intercepts
    AC->>Redis: GET blacklist:{token}
    Redis-->>AC: null (not blacklisted)
    AC->>AC: jwt.verify(token, SECRET)
    AC->>AC: req.user = decoded payload
    Note right of AC: Passes to next() → controller

    Note over User,Redis: ── LOGOUT ──
    User->>AC: POST /api/auth/logout
    AC->>AC: jwt.verify(token) → get exp timestamp
    AC->>AC: timeLeft = exp - now
    AC->>Redis: SETEX blacklist:{token} {timeLeft} "true"
    AC->>AC: res.clearCookie("token")
    AC-->>FE: 200 "Logged out successfully"
    Note right of Redis: Token self-destructs\nwhen JWT would have expired
```

---

## 4. Live Mock Interview Session Flow

```mermaid
flowchart TD
    A([User starts Live Interview]) --> B

    subgraph SETUP["🎬 Session Setup"]
        B["POST /api/interview/live/questions\n{jobDescription, resumeText, interviewType}"]
        B --> C{"interviewType?"}
        C -->|Behavioral| D["AI: STAR-method questions\nno coding"]
        C -->|Technical| E["AI: deep-dive coding\n& framework questions"]
        C -->|System Design| F["AI: architecture,\nscaling, DB questions"]
        C -->|Mixed| G["AI: one of each type"]
        D & E & F & G --> H["Returns exactly 3 questions\nZod: liveQuestionsSchema"]
    end

    H --> I

    subgraph LIVE["🎤 Per-Question Loop (x3)"]
        I["Frontend asks Q1 via TTS"]
        I --> J["User speaks answer\n(Speech-to-Text)"]
        J --> K["POST /api/interview/live/evaluate-single\n{question, answer, jobDescription}"]
        K --> L["AI: 3-4 sentence coaching\nfeedback (no score)"]
        L --> M{"Need a hint?"}
        M -->|Yes| N["POST /api/interview/live/hint\nAI: 1-sentence mental nudge"]
        M -->|No| O["Next question"]
        N --> O
        O -->|Q2, Q3| I
    end

    O -->|All 3 done| P

    subgraph EVAL["📊 Final Evaluation"]
        P["POST /api/interview/live/evaluate\n{transcript, jobDescription, aiMetrics}"]
        P --> Q["aiMetrics:\n- avgBodyConfidence\n- eyeContactScore"]
        Q --> R["AI evaluates full transcript\nZod: evaluationSchema"]
        R --> S["Returns:\n- overallScore /10\n- summary\n- confidence /10\n- communication /10\n- correctness /10\n- questionBreakdown[]"]
        S --> T["InterviewSession.create(\n  transcript, scores, aiMetrics\n)"]
    end

    T --> U([Session saved · Results shown to User])

    style SETUP fill:#1e1b4b,stroke:#6366f1,color:#fff
    style LIVE fill:#0c1a2e,stroke:#0ea5e9,color:#fff
    style EVAL fill:#0f1f17,stroke:#10b981,color:#fff
```

---

## 5. Redis Usage Map

```mermaid
graph LR
    subgraph REDIS["⚡ Redis — Responsibilities"]
        direction TB
        BL["🔐 Token Blacklist\nKey: blacklist:{JWT}\nTTL: remaining JWT lifetime\nPurpose: instant logout invalidation"]
        RC["📋 Report Cache\nKey: report_cache:{sha256}\nTTL: 86400s (24h)\nPurpose: skip Gemini call on repeat"]
        RH["📄 Resume HTML Cache\nKey: resume_html:{sha256}\nTTL: 86400s (24h)\nPurpose: skip Gemini for PDF rebuild"]
        JC["💼 Job Listings Cache\nKey: jobs:{query}:{location}\nTTL: 21600s (6h)\nPurpose: avoid JSearch API quota"]
        RL["🚦 Rate Limit Counters\nKey: managed by rate-limit-redis\nWindow: 15 min · Limit: 10 req/IP\nPurpose: protect Gemini quota"]
    end

    AUTH_MW["Auth Middleware"] -->|READ| BL
    LOGOUT["Logout Controller"] -->|WRITE| BL
    RPT_CTRL["Report Controller"] -->|READ/WRITE| RC
    PDF_SVC["Resume PDF Service"] -->|READ/WRITE| RH
    JOB_CTRL["Job Controller"] -->|READ/WRITE| JC
    RATE_MW["Rate Limiter Middleware"] -->|INCR/READ| RL
```

---

## 6. Docker Deployment Topology

```mermaid
graph TB
    subgraph INTERNET["🌐 Internet"]
        V["☁️ Vercel\nFrontend (React + Vite)\nGlobal CDN Edge"]
        R["☁️ Render\nDocker Host"]
    end

    subgraph DOCKER["🐳 Docker Compose (on Render)"]
        direction LR
        subgraph BK["backend container"]
            N["Node.js\nExpress API\n:3000"]
            PP["Puppeteer\nChromium\n(headless PDF)"]
            N --- PP
        end
        subgraph RD["redis container"]
            RI["redis:alpine\n:6379"]
        end
        BK -- "REDIS_URL=redis://redis:6379\n(Docker internal network)" --> RD
        BK -- "shm_size: 1gb\n(Puppeteer needs shared memory)" --> BK
    end

    subgraph CLOUD["☁️ Managed Cloud Services"]
        MA["🍃 MongoDB Atlas\n(external DB)"]
        GG["🤖 Google Gemini API"]
        RA["🔍 RapidAPI JSearch"]
    end

    V -- "HTTPS + httpOnly Cookie" --> R
    R --> DOCKER
    N --> MA
    N --> GG
    N --> RA
```
