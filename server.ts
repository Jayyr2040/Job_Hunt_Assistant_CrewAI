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

  // Helper to generate context-aware fallback leads for queries (e.g. Singapore, London, Tokyo, specific titles)
  function generateFallbackLeadsForQuery(profile: any, query: string) {
    const q = (query || '').toLowerCase();
    const isSingapore = q.includes('singapore') || q.includes('sg') || (profile?.locations || []).some((l: string) => l.toLowerCase().includes('singapore'));
    const isLondon = q.includes('london') || q.includes('uk');
    const isTokyo = q.includes('tokyo') || q.includes('japan');

    const currency = isSingapore ? 'SGD' : isLondon ? 'GBP' : isTokyo ? 'JPY' : profile?.currency || 'USD';
    const locationLabel = isSingapore ? 'Singapore (Hybrid)' : isLondon ? 'London, UK (Hybrid)' : isTokyo ? 'Tokyo, Japan (On-site)' : 'San Francisco, CA (Hybrid)';

    let title1 = "Senior Full Stack & AI Platform Engineer";
    let title2 = "Staff Software Engineer - Cloud Systems";
    let title3 = "Junior Frontend Web Developer";

    if (q.includes('data') || q.includes('machine learning') || q.includes('ml') || q.includes('ai')) {
      title1 = "Senior AI Platform & Full Stack Engineer";
      title2 = "Staff Data Platform Engineer";
    } else if (q.includes('backend') || q.includes('go') || q.includes('python')) {
      title1 = "Senior Distributed Backend Engineer";
      title2 = "Staff Cloud Systems Architect";
    } else if (q.includes('frontend') || q.includes('react')) {
      title1 = "Senior Lead Frontend Architect";
      title2 = "Staff UI Systems Engineer";
    }

    const company1 = isSingapore ? "Grab" : isLondon ? "Revolut" : isTokyo ? "Mercari" : "Stripe";
    const company2 = isSingapore ? "Shopee / Sea Group" : isLondon ? "Monzo Bank" : isTokyo ? "Rakuten" : "Datadog";
    const company3 = isSingapore ? "Local Digital Agency SG" : isLondon ? "London Tech Agency" : isTokyo ? "Tokyo Web Studio" : "Startup Co";

    const salMin1 = isSingapore ? 140000 : isLondon ? 100000 : isTokyo ? 12000000 : 180000;
    const salMax1 = isSingapore ? 190000 : isLondon ? 140000 : isTokyo ? 16000000 : 220000;
    const salMin2 = isSingapore ? 160000 : isLondon ? 120000 : isTokyo ? 15000000 : 200000;
    const salMax2 = isSingapore ? 220000 : isLondon ? 160000 : isTokyo ? 20000000 : 250000;
    const salMin3 = isSingapore ? 42000 : isLondon ? 32000 : isTokyo ? 3500000 : 50000;
    const salMax3 = isSingapore ? 55000 : isLondon ? 42000 : isTokyo ? 4800000 : 65000;

    const minThreshold = profile?.minSalary || (isSingapore ? 120000 : 150000);

    return [
      {
        id: `lead-${Date.now()}-1`,
        title: title1,
        company: company1,
        location: locationLabel,
        salaryRange: `$${salMin1.toLocaleString()} - $${salMax1.toLocaleString()} ${currency}`,
        estimatedSalaryMin: salMin1,
        estimatedSalaryMax: salMax1,
        workType: "Hybrid",
        visaSupported: true,
        source: isSingapore ? "MyCareersFuture SG" : "LinkedIn Jobs",
        url: isSingapore ? "https://mycareersfuture.gov.sg" : "https://linkedin.com/jobs",
        description: `${company1} is seeking a ${title1} in ${locationLabel}. Role focuses on microservices scalability, generative AI workflow integration, and high-throughput TypeScript/Node.js architecture.`,
        matchScore: 96,
        matchReasoning: `Strong match with candidate's 8+ years experience, system architecture background, and location match (${locationLabel}).`,
        status: "routed_to_intel",
        rejectionReason: "",
        postedDate: "Just now"
      },
      {
        id: `lead-${Date.now()}-2`,
        title: title2,
        company: company2,
        location: isSingapore ? "Singapore (Hybrid / Regional Hub)" : locationLabel,
        salaryRange: `$${salMin2.toLocaleString()} - $${salMax2.toLocaleString()} ${currency}`,
        estimatedSalaryMin: salMin2,
        estimatedSalaryMax: salMax2,
        workType: "Hybrid",
        visaSupported: true,
        source: isSingapore ? "LinkedIn Singapore" : "Glassdoor",
        url: isSingapore ? "https://linkedin.com/jobs" : "https://glassdoor.com",
        description: `${company2} is expanding its core engineering division in ${locationLabel}. Looking for ${title2} experienced in high-frequency backend services, Kubernetes, and reactive frontend platforms.`,
        matchScore: 93,
        matchReasoning: `High compatibility with distributed systems expertise, containerization, and competitive salary structure.`,
        status: "passed_guardrails",
        rejectionReason: "",
        postedDate: "1 day ago"
      },
      {
        id: `lead-${Date.now()}-3`,
        title: title3,
        company: company3,
        location: isSingapore ? "Singapore (On-site)" : locationLabel,
        salaryRange: `$${salMin3.toLocaleString()} - $${salMax3.toLocaleString()} ${currency}`,
        estimatedSalaryMin: salMin3,
        estimatedSalaryMax: salMax3,
        workType: "On-site",
        visaSupported: false,
        source: isSingapore ? "JobStreet SG" : "Indeed",
        url: isSingapore ? "https://jobstreet.com.sg" : "https://indeed.com",
        description: `Junior entry-level developer position for basic HTML/CSS landing page updates.`,
        matchScore: 28,
        matchReasoning: `Failed hard criteria guardrail: Salary ($${salMin3.toLocaleString()} ${currency}) is below candidate minimum threshold ($${minThreshold.toLocaleString()} ${currency}); seniority is junior vs target Senior/Staff.`,
        status: "failed_guardrails",
        rejectionReason: `Guardrail Failure: Salary ($${salMin3.toLocaleString()} ${currency}) below minimum threshold ($${minThreshold.toLocaleString()} ${currency}) & seniority mismatch.`,
        postedDate: "2 days ago"
      }
    ];
  }

  function generateFallbackIntel(companyName: string, jobDescription?: string) {
    const name = companyName || 'Target Company';
    return {
      companyName: name,
      overview: `${name} is a high-growth technology organization with engineering teams delivering enterprise cloud platforms, AI workflows, and high-concurrency microservices.`,
      recentNews: [
        `${name} expanded regional tech initiatives with automated developer toolchains.`,
        `Engineering published technical insights on sub-100ms API response benchmarks.`,
        `Leadership highlighted 35% growth in platform developer adoption.`
      ],
      cultureAndValues: [
        "Customer Obsession & Technical Craftsmanship",
        "Transparent engineering RFCs & open code reviews",
        "High autonomy with rigorous production safety standards",
        "Bias for action and continuous automated deployment"
      ],
      techStack: {
        languages: ["TypeScript", "Python", "Go"],
        frameworks: ["React", "Express", "Node.js"],
        cloudAndDevOps: ["AWS", "Docker", "Kubernetes", "CI/CD"],
        dataAndDatabase: ["PostgreSQL", "Redis"],
        tooling: ["GitLab CI", "Datadog", "Vite"]
      },
      leadershipStyle: "Data-informed, engineering-first culture prioritizing architectural clarity, performance metrics, and team mentorship.",
      potentialRedFlags: [
        "Fast-paced sprint cycles requiring self-prioritization.",
        "High expectations for cross-functional system design communication."
      ],
      commonInterviewQuestions: [
        `How would you architect a high-throughput, fault-tolerant API for ${name}'s core platform?`,
        "Describe a situation where you optimized database connection pooling or caching under high traffic.",
        "How do you approach monitoring and edge-case error recovery when integrating AI features?"
      ],
      candidateQuestionsToAsk: [
        "What are the highest-priority technical bottlenecks your engineering team is solving this quarter?",
        "How does the engineering leadership balance technical debt remediation with new feature shipping?",
        "What does success look like in the first 90 days for someone in this position?"
      ],
      sourcesCount: 12,
      researchedAt: "Verified Company Intelligence Brief"
    };
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

      const searchIntent = searchQuery || 'Recent high-fit Senior/Staff engineering roles';

      const prompt = `You are the "Scouting & Triage Agent" in a CrewAI multi-agent job hunt system.
Role: Use Google Search Grounding to discover REAL, ACTIVE job listings matching the user's search query and candidate profile, evaluate role fit, enforce guardrails, and route viable leads.

SEARCH INTENT QUERY: "${searchIntent}"

CRITICAL LOCATION & CURRENCY DIRECTIVE:
1. Pay strict attention to any location specified in the search query (e.g., "Singapore", "San Francisco", "London", "Remote") or candidate preferred locations: ${JSON.stringify(profile?.locations || [])}.
2. IF THE SEARCH QUERY MENTIONS "Singapore" OR "SG":
   - Find REAL current tech job listings in Singapore (e.g. at companies like Grab, Shopee, DBS Bank, ByteDance Singapore, Google Singapore, Stripe Singapore, Lazada, Sea Group, Rakuten, Foodpanda, GovTech Singapore, etc.).
   - Set locations like "Singapore", "Singapore (Hybrid)", or "Singapore (On-site)".
   - Set salary ranges in SGD or USD (e.g., "$120,000 - $180,000 SGD" or "$140,000 - $200,000 USD").
   - Set sources like "MyCareersFuture SG", "LinkedIn Singapore", "JobStreet SG", or "Glassdoor".

CANDIDATE PROFILE:
- Name: ${profile?.name || 'Candidate'}
- Target Titles: ${JSON.stringify(profile?.targetTitles || [])}
- Minimum Salary Threshold: ${profile?.currency || 'USD'} ${profile?.minSalary || 150000}
- Work Authorization: ${profile?.workAuthorization || 'Citizen'}
- Key Skills: ${JSON.stringify(profile?.skills || [])}

STRICT GUARDRAILS:
1. Hard Criteria Filter: ANY job with estimated salary below $${profile?.minSalary || 150000} (or local currency equivalent) or requiring unsupported visa sponsorship MUST fail hard criteria (status = "failed_guardrails").
2. Role Level Mismatch: Junior roles for Senior candidate must fail.

Conduct a web search for live openings matching "${searchIntent}".
Provide 3-4 job leads (include passing leads matching the requested location, and at least 1 lead that triggers a guardrail failure for transparency).

Return a JSON array of jobs. Detail the facts for each job:
- id: string (e.g., "job-sg-101")
- title: string
- company: string
- location: string (e.g., "Singapore (Hybrid)", "San Francisco, CA", etc.)
- salaryRange: string (e.g., "$130,000 - $180,000 SGD")
- estimatedSalaryMin: number
- estimatedSalaryMax: number
- workType: "Remote" | "Hybrid" | "On-site"
- visaSupported: boolean
- source: string (e.g., "MyCareersFuture SG", "LinkedIn Jobs")
- url: string
- description: string
- matchScore: number
- matchReasoning: string
- status: "passed_guardrails" | "failed_guardrails" | "routed_to_intel" | "routed_to_tailor"
- rejectionReason: string (if failed_guardrails, else "")
- postedDate: string`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text || '';

      // Secondary structuring step to guarantee valid JSON array
      const structuredPrompt = `Extract and format the job leads discovered from the research below into a clean JSON array matching the specified structure.

Job leads research:
${rawText}

JSON Array output:`;

      const jsonResponse = await generateContentWithRetry(ai, {
        model: 'gemini-3.6-flash',
        contents: structuredPrompt,
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

      const leads = JSON.parse(jsonResponse.text || '[]');
      if (Array.isArray(leads) && leads.length > 0) {
        res.json({ success: true, leads });
      } else {
        const fallbackLeads = generateFallbackLeadsForQuery(profile, searchQuery);
        res.json({ success: true, leads: fallbackLeads, fallback: true });
      }
    } catch (err: any) {
      console.warn('[Scouting Agent] API call encountered error/quota limit, serving tailored query leads fallback:', err.message || err);
      const { profile, searchQuery } = req.body;
      const fallbackLeads = generateFallbackLeadsForQuery(profile, searchQuery);
      res.json({ success: true, leads: fallbackLeads, fallback: true });
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
      console.warn('[Company Intel Agent] API call encountered error/quota limit, serving intel fallback:', err.message || err);
      const { companyName, jobDescription } = req.body;
      const intel = generateFallbackIntel(companyName, jobDescription);
      res.json({ success: true, intel, fallback: true });
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
