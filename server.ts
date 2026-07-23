import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Shared Gemini client helper
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set.');
    }
    return new GoogleGenAI({
      apiKey: apiKey || 'dummy-key-for-dev',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Helper to retry Gemini calls with exponential backoff & fallback models on transient errors (e.g. 503 high demand)
  async function generateContentWithRetry(ai: GoogleGenAI, params: any) {
    const primaryModel = params.model || 'gemini-3.6-flash';
    const modelsToTry = [primaryModel];
    if (primaryModel === 'gemini-3.6-flash') {
      modelsToTry.push('gemini-3.1-pro-preview', 'gemini-flash-latest');
    }

    let lastError: any = null;

    for (const modelName of modelsToTry) {
      const attemptParams = { ...params, model: modelName };
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await ai.models.generateContent(attemptParams);
          if (response) {
            return response;
          }
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || err?.error?.code;
          const msg = String(err?.message || err || '');
          const isTransient =
            status === 503 ||
            status === 429 ||
            status === 'UNAVAILABLE' ||
            msg.includes('demand') ||
            msg.includes('503') ||
            msg.includes('overloaded') ||
            msg.includes('UNAVAILABLE');

          if (isTransient && attempt < 3) {
            const delay = attempt * 1000;
            console.warn(`[Gemini API] Retry attempt ${attempt} for model ${modelName} due to transient error: ${msg}`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          console.warn(`[Gemini API] Model ${modelName} failed on attempt ${attempt}: ${msg}`);
          break;
        }
      }
    }
    throw lastError || new Error('All Gemini API attempts failed');
  }

  // --- API ROUTE 1: Scouting & Triage Agent (Router / Handoff Node) ---
  app.post('/api/crew/scout', async (req, res) => {
    try {
      const { profile, searchQuery } = req.body;
      const ai = getGeminiClient();

      const prompt = `You are the "Scouting & Triage Agent" in a CrewAI multi-agent job hunt system.
Role: Discover job listings matching candidate profile, evaluate role fit, enforce strict guardrails, and route viable leads.

CANDIDATE PROFILE:
- Name: ${profile?.name || 'Candidate'}
- Target Titles: ${JSON.stringify(profile?.targetTitles || [])}
- Minimum Salary Threshold: ${profile?.currency || 'USD'} ${profile?.minSalary || 150000}
- Work Authorization: ${profile?.workAuthorization || 'Citizen'}
- Preferred Locations: ${JSON.stringify(profile?.locations || [])}
- Key Skills: ${JSON.stringify(profile?.skills || [])}

CUSTOM SEARCH INTENT: ${searchQuery || 'Find recent high-fit Senior/Staff engineering roles'}

STRICT GUARDRAILS:
1. Hard Criteria Filter: ANY job with estimated salary below $${profile?.minSalary || 150000} or requiring visa sponsorship when not supported MUST fail hard criteria (status = "failed_guardrails").
2. Role Level Mismatch: Junior roles for Senior candidate must fail.

Generate 3-4 job leads (include both high-fit passing leads and at least 1 lead that triggers a guardrail failure for transparency).

Return JSON array of jobs matching this structure:
[
  {
    "id": "job-id-1",
    "title": "Job Title",
    "company": "Company Name",
    "location": "City, State or Remote",
    "salaryRange": "$XXX,XXX - $YYY,YYY USD",
    "estimatedSalaryMin": 180000,
    "estimatedSalaryMax": 220000,
    "workType": "Remote" | "Hybrid" | "On-site",
    "visaSupported": true,
    "source": "LinkedIn Jobs / Glassdoor",
    "url": "https://example.com/job",
    "description": "Job summary and key requirements...",
    "matchScore": 95,
    "matchReasoning": "Detailed breakdown of why this matches or fails candidate profile...",
    "status": "passed_guardrails" | "failed_guardrails" | "routed_to_intel" | "routed_to_tailor",
    "rejectionReason": "If failed_guardrails, state exact guardrail reason, else empty string",
    "postedDate": "1 day ago"
  }
]`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                company: { type: Type.STRING },
                location: { type: Type.STRING },
                salaryRange: { type: Type.STRING },
                estimatedSalaryMin: { type: Type.NUMBER },
                estimatedSalaryMax: { type: Type.NUMBER },
                workType: { type: Type.STRING },
                visaSupported: { type: Type.BOOLEAN },
                source: { type: Type.STRING },
                url: { type: Type.STRING },
                description: { type: Type.STRING },
                matchScore: { type: Type.NUMBER },
                matchReasoning: { type: Type.STRING },
                status: { type: Type.STRING },
                rejectionReason: { type: Type.STRING },
                postedDate: { type: Type.STRING },
              },
              required: ['id', 'title', 'company', 'location', 'salaryRange', 'matchScore', 'status'],
            },
          },
        },
      });

      const leads = JSON.parse(response.text || '[]');
      res.json({ success: true, leads });
    } catch (err: any) {
      console.error('Error in scouting agent:', err);
      res.status(500).json({ success: false, error: err.message || 'Scouting agent failed' });
    }
  });

  // --- API ROUTE 2: Company & Interview Intelligence Agent (Parallel Fan-Out Worker) ---
  app.post('/api/crew/intel', async (req, res) => {
    try {
      const { companyName, jobDescription } = req.body;
      const ai = getGeminiClient();

      const prompt = `You are the "Company & Interview Intelligence Agent" in CrewAI.
Role: Gather deep insights on company priorities, tech stack, leadership, culture, red flags, and interview questions.

TARGET COMPANY: ${companyName}
JOB DESCRIPTION: ${jobDescription || 'Senior Software Engineer'}

GUARDRAIL: Must distinguish verified facts from unverified rumours.

Perform research and output JSON with these exact fields:
- overview: string
- recentNews: array of 3 recent news strings
- cultureAndValues: array of 4 culture bullet points
- techStack: object with arrays for languages, frameworks, cloudAndDevOps, dataAndDatabase, tooling
- leadershipStyle: string description
- potentialRedFlags: array of 2 potential red flags / caveats
- commonInterviewQuestions: array of 3 specific interview questions
- candidateQuestionsToAsk: array of 3 sharp questions candidate should ask the interviewer
- sourcesCount: number (e.g., 12)
- researchedAt: string (e.g. "Live Search Grounded")`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text || '';
      
      // Secondary fallback structured parse if search grounding returned raw markdown
      const structuredPrompt = `Convert the following research notes on ${companyName} into clean JSON with exact structure:
{
  "companyName": "${companyName}",
  "overview": "...",
  "recentNews": ["..."],
  "cultureAndValues": ["..."],
  "techStack": {
    "languages": ["..."],
    "frameworks": ["..."],
    "cloudAndDevOps": ["..."],
    "dataAndDatabase": ["..."],
    "tooling": ["..."]
  },
  "leadershipStyle": "...",
  "potentialRedFlags": ["..."],
  "commonInterviewQuestions": ["..."],
  "candidateQuestionsToAsk": ["..."],
  "sourcesCount": 12,
  "researchedAt": "Live Grounded Research"
}

Research Notes:
${rawText}`;

      const jsonResponse = await generateContentWithRetry(ai, {
        model: 'gemini-3.6-flash',
        contents: structuredPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const intel = JSON.parse(jsonResponse.text || '{}');
      res.json({ success: true, intel });
    } catch (err: any) {
      console.error('Error in company intel agent:', err);
      res.status(500).json({ success: false, error: err.message || 'Company intel agent failed' });
    }
  });

  // --- API ROUTE 3: Resume & Cover Letter Tailor Agent (Evaluator-Optimizer Loop) ---
  app.post('/api/crew/tailor-loop', async (req, res) => {
    try {
      const { profile, jobLead, companyIntel } = req.body;
      const ai = getGeminiClient();

      const prompt = `You are the Evaluator-Optimizer Resume & Cover Letter Tailor Node in CrewAI.

INPUTS:
Candidate Name: ${profile?.name}
Master Experience: ${JSON.stringify(profile?.masterExperienceBullets || [])}
Master Skills: ${JSON.stringify(profile?.skills || [])}

Job Title: ${jobLead?.title}
Company: ${jobLead?.company}
Job Description: ${jobLead?.description}
Company Intel Brief: ${companyIntel ? JSON.stringify(companyIntel.cultureAndValues) : 'N/A'}

STRICT GUARDRAIL (#1 RULE):
- You MUST NEVER invent experience, hallucinate skills, or fabricate metrics not grounded in the candidate's master experience.
- You CAN reframe, emphasize keywords, and align STAR metrics present in master experience to the JD.

Simulate 2 iterations of the Evaluator-Optimizer loop:
- Iteration 1: Initial draft with evaluation feedback (missing keywords, initial ATS score ~82).
- Iteration 2 (Final): Optimized draft incorporating feedback, passing ATS score (>= 94).

Output JSON matching this schema:
{
  "jobId": "${jobLead?.id || 'job-1'}",
  "jobTitle": "${jobLead?.title || ''}",
  "company": "${jobLead?.company || ''}",
  "finalAtsScore": 96,
  "keywordMatchPercentage": 94,
  "guardrailStatus": "PASS",
  "tailoredResumeMarkdown": "# Candidate Name\\n\\n## Professional Summary\\n...\\n\\n## Experience\\n...",
  "coverLetterMarkdown": "Dear Hiring Team at ${jobLead?.company || 'Company'},\\n\\n...",
  "iterations": [
    {
      "version": 1,
      "atsScore": 82,
      "keywordMatchPercentage": 78,
      "feedback": {
        "strengths": ["Strong action verbs", "Clear metric structure"],
        "missingKeywords": ["GraphQL", "Distributed Systems", "Multi-Agent"],
        "guardrailViolations": [],
        "improvementSuggestions": ["Weave GraphQL and Distributed Systems into Apex Tech Labs bullet points"]
      },
      "tailoredResume": "Draft 1 content...",
      "coverLetter": "Draft 1 cover letter..."
    },
    {
      "version": 2,
      "atsScore": 96,
      "keywordMatchPercentage": 94,
      "feedback": {
        "strengths": ["Zero hallucinated metrics", "94% ATS keyword density", "High impact STAR alignment"],
        "missingKeywords": [],
        "guardrailViolations": [],
        "improvementSuggestions": ["Ready for submission"]
      },
      "tailoredResume": "Draft 2 final polished content...",
      "coverLetter": "Draft 2 final polished cover letter..."
    }
  ]
}`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const result = JSON.parse(response.text || '{}');
      res.json({ success: true, result });
    } catch (err: any) {
      console.error('Error in resume tailor loop:', err);
      res.status(500).json({ success: false, error: err.message || 'Resume tailor loop failed' });
    }
  });

  // --- API ROUTE 4: Interview Prep Question Generator ---
  app.post('/api/crew/interview/question', async (req, res) => {
    try {
      const { jobTitle, companyName, companyIntel, questionIndex } = req.body;
      const ai = getGeminiClient();

      const categories = ['Behavioral', 'Technical / System Design', 'Leadership / Culture', 'Problem Solving'];
      const currentCategory = categories[(questionIndex || 0) % categories.length];

      const prompt = `You are the "Interview Prep & Mock Simulator Agent" in CrewAI.
Role: Generate a realistic interview question tailored to ${jobTitle} at ${companyName}.

Category: ${currentCategory}
Question Number: ${(questionIndex || 0) + 1}
Company Intel Brief: ${companyIntel ? JSON.stringify(companyIntel.commonInterviewQuestions) : 'N/A'}

Return JSON object:
{
  "id": "q-${Date.now()}",
  "questionNumber": ${(questionIndex || 0) + 1},
  "category": "${currentCategory}",
  "questionText": "The exact interview question text...",
  "focusArea": "Key technical or behavioral trait being tested",
  "starRubric": {
    "situationTaskGoal": "What context/conflict candidate must set up",
    "actionRequirement": "Key engineering or leadership actions required",
    "resultMetricRequirement": "Quantifiable outcome or business impact expected"
  }
}`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const questionTurn = JSON.parse(response.text || '{}');
      res.json({ success: true, questionTurn });
    } catch (err: any) {
      console.error('Error in mock interview question agent:', err);
      res.status(500).json({ success: false, error: err.message || 'Interview question generation failed' });
    }
  });

  // --- API ROUTE 5: Interview Answer STAR Evaluator ---
  app.post('/api/crew/interview/evaluate', async (req, res) => {
    try {
      const { questionText, userAnswer, rubric, jobTitle } = req.body;
      const ai = getGeminiClient();

      const prompt = `You are the "STAR Method Evaluator Agent" in CrewAI.
Role: Evaluate candidate's mock interview response with strict STAR criteria.

QUESTION: ${questionText}
TARGET ROLE: ${jobTitle}
USER'S ANSWER: ${userAnswer}
EVALUATION RUBRIC: ${JSON.stringify(rubric || {})}

GUARDRAIL:
- Do NOT give generic praise ("Great job!").
- Strictly grade on:
  1. Situation/Task clarity (0-25)
  2. Action details & technical depth (0-25)
  3. Result metrics & quantifiable impact (0-25)
  4. Relevance to role & conciseness (0-25)

Output JSON:
{
  "overallScore": 84,
  "starScorecard": {
    "situationTask": 22,
    "actionClarity": 21,
    "resultMetrics": 18,
    "relevanceToRole": 23
  },
  "keyStrengths": ["Clear problem context", "Decisive technical ownership"],
  "areasForImprovement": ["Include explicit latency or revenue % numbers in Result section", "Be more specific on team orchestration"],
  "revisedSTARSample": "Here is how a 100-point response would sound using STAR framework:\\n\\nSituation: ...\\nTask: ...\\nAction: ...\\nResult: ...",
  "followUpQuestion": "A sharp follow-up question asking candidate to dive deeper into an edge case..."
}`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const evaluation = JSON.parse(response.text || '{}');
      res.json({ success: true, evaluation });
    } catch (err: any) {
      console.error('Error in STAR evaluator agent:', err);
      res.status(500).json({ success: false, error: err.message || 'STAR evaluator failed' });
    }
  });

  // --- API ROUTE 6: Text-To-Speech for Mock Interviewer Voice ---
  app.post('/api/crew/tts', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text required' });
      }

      const ai = getGeminiClient();
      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: `Say professionally as a senior tech interviewer: ${text}` }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ success: true, audioBase64: base64Audio });
      } else {
        res.json({ success: false, message: 'No audio generated' });
      }
    } catch (err: any) {
      console.error('Error in TTS generation:', err);
      res.status(500).json({ success: false, error: err.message || 'TTS generation failed' });
    }
  });

  // Serve frontend Vite dev or production static build
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CrewAI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
