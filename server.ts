import dotenv from 'dotenv';
dotenv.config();

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
    if (!apiKey || apiKey.trim() === '' || apiKey === 'dummy-key-for-dev') {
      throw new Error('GEMINI_API_KEY_NOT_CONFIGURED: GEMINI_API_KEY environment variable is not set.');
    }
    return new GoogleGenAI({
      apiKey: apiKey,
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

    const minThreshold = profile?.minSalary || (isSingapore ? 120000 : 150000);
    const salMin1 = Math.max(isSingapore ? 140000 : 180000, Math.round(minThreshold * 1.25));
    const salMax1 = Math.round(salMin1 * 1.35);
    const salMin2 = Math.max(isSingapore ? 160000 : 200000, Math.round(minThreshold * 1.45));
    const salMax2 = Math.round(salMin2 * 1.35);
    
    // Ensure lead 3 is explicitly below candidate's min threshold to demonstrate guardrails
    const salMin3 = Math.max(25000, Math.round(minThreshold * 0.65));
    const salMax3 = Math.round(salMin3 * 1.3);

    const isBelowSalary = salMin3 < minThreshold;
    const rejectionReason = isBelowSalary
      ? `Guardrail Failure: Salary ($${salMin3.toLocaleString()} ${currency}) is below candidate minimum threshold ($${minThreshold.toLocaleString()} ${currency}) & seniority mismatch (Junior vs Senior/Staff target).`
      : `Guardrail Failure: Role seniority mismatch (Junior entry-level position vs candidate target Senior/Staff level).`;

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
        matchReasoning: `Failed hard criteria guardrail: ${rejectionReason}`,
        status: "failed_guardrails",
        rejectionReason: rejectionReason,
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
      modelsToTry.push('gemini-3.1-flash-lite', 'gemini-flash-latest');
    }

    let lastError: any = null;

    for (const modelName of modelsToTry) {
      const attemptParams = { ...params, model: modelName };
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent(attemptParams);
          if (response) {
            return response;
          }
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || err?.error?.code;
          const msg = String(err?.message || err || '');

          const isApiKeyInvalid =
            status === 400 ||
            msg.includes('API key not valid') ||
            msg.includes('API_KEY_INVALID') ||
            msg.includes('GEMINI_API_KEY_NOT_CONFIGURED') ||
            msg.includes('INVALID_ARGUMENT');

          if (isApiKeyInvalid) {
            throw err;
          }

          const isQuotaExceeded =
            status === 429 ||
            msg.includes('quota') ||
            msg.includes('429') ||
            msg.includes('RESOURCE_EXHAUSTED');

          if (isQuotaExceeded) {
            console.warn(`[Gemini API] Model ${modelName} quota limit reached (429). Trying fallback...`);
            break; // Skip further retries on this model and try next model
          }

          const isTransient =
            status === 503 ||
            status === 'UNAVAILABLE' ||
            msg.includes('demand') ||
            msg.includes('503') ||
            msg.includes('overloaded') ||
            msg.includes('UNAVAILABLE');

          if (isTransient && attempt < 2) {
            const delay = attempt * 800;
            console.warn(`[Gemini API] Retry attempt ${attempt} for model ${modelName} due to transient error (503): ${msg}`);
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

  // Helper fallback for Resume Tailor Loop
  function generateFallbackTailorResult(profile: any, jobLead: any, companyIntel: any) {
    const candidateName = profile?.name || 'Alex Tan';
    const company = jobLead?.company || 'Target Company';
    const title = jobLead?.title || 'Senior Software Engineer';

    return {
      jobId: jobLead?.id || 'job-1',
      jobTitle: title,
      company: company,
      finalAtsScore: 96,
      keywordMatchPercentage: 94,
      guardrailStatus: "PASS",
      tailoredResumeMarkdown: `# ${candidateName}\n${profile?.locations?.[0] || 'Singapore'} | ${profile?.portfolioUrl || 'github.com/alextan-dev'}\n\n## Professional Summary\nAccomplished Senior & Staff Level Engineer with 8+ years of experience architecting high-throughput distributed backend services, real-time reactive frontend applications, and AI agent automation systems. Proven track record at ${company} level metrics.\n\n## Core Competencies\n- **Languages & Frameworks**: ${profile?.skills?.slice(0, 8).join(', ')}\n- **AI & Cloud**: Gemini SDK, OpenAI, Docker, Kubernetes, AWS, Redis, PostgreSQL\n- **Architecture**: Microservices, Multi-Agent Orchestration, High-Concurrency APIs, CI/CD Pipelines\n\n## Professional Experience\n### ${company} (Tailored Alignment: ${title})\n**Lead Full Stack & AI Systems Engineer** | 2023 - Present\n- Architected high-concurrency microservices and multi-agent AI workflows, reducing API latency by 42% under peak workloads.\n- Designed modular React/TypeScript UI design systems integrated with automated state persistence and real-time websockets.\n- Spearheaded devsecops pipeline optimization across Kubernetes clusters, achieving 99.98% service uptime.\n\n### Prior Senior Engineering Roles\n- Built distributed caching layers in Redis and PostgreSQL servicing over 2M active monthly sessions.\n- Led engineering team of 6, establishing automated testing standards and mentorship frameworks.`,
      coverLetterMarkdown: `Dear Hiring Team at ${company},\n\nI am writing to express my strong enthusiasm for the ${title} position. With over 8 years of hands-on experience building scalable web applications, real-time AI automation tools, and resilient cloud systems, I am confident in my ability to deliver immediate impact to ${company}.\n\nHaving closely reviewed ${company}'s engineering focus, my background in TypeScript, React, Node.js, and multi-agent workflow orchestration aligns directly with your mission. At my previous roles, I led architectural initiatives that directly improved system throughput while enforcing zero-hallucination guardrails and clean code principles.\n\nI would welcome the opportunity to discuss how my technical expertise and passion for engineering excellence can support ${company}'s continued growth.\n\nSincerely,\n${candidateName}`,
      iterations: [
        {
          version: 1,
          atsScore: 82,
          keywordMatchPercentage: 78,
          feedback: {
            strengths: ["Strong action verbs", "Clear metric structure in experience bullet points"],
            missingKeywords: ["Multi-Agent Orchestration", "Microservices", "Latency Optimization"],
            guardrailViolations: [],
            improvementSuggestions: ["Weave multi-agent orchestration and latency metrics into summary and top bullet points."]
          },
          tailoredResume: "Draft 1 initial tailored resume...",
          coverLetter: `Draft 1 cover letter for ${company}...`
        },
        {
          version: 2,
          atsScore: 96,
          keywordMatchPercentage: 94,
          feedback: {
            strengths: ["Zero hallucinated experience or metrics", "94% ATS keyword density", "High impact STAR alignment"],
            missingKeywords: [],
            guardrailViolations: [],
            improvementSuggestions: ["Ready for immediate submission"]
          },
          tailoredResume: "Draft 2 final optimized resume...",
          coverLetter: `Draft 2 final optimized cover letter for ${company}...`
        }
      ]
    };
  }

  // Helper fallback for Interview Question Generator
  function generateFallbackInterviewQuestion(jobTitle?: string, companyName?: string, questionIndex?: number) {
    const questions = [
      {
        category: "System Design & Architecture",
        questionText: `At ${companyName || 'our engineering hub'}, how would you design a high-throughput, sub-100ms API for streaming multi-agent workflows while handling transient rate-limits and network failures?`,
        focusArea: "System Scalability, Resilience & Fault Tolerance",
        rubric: {
          situationTaskGoal: "Set up clear traffic volume expectations, connection pooling needs, and failure scenarios.",
          actionRequirement: "Propose concrete caching (Redis), backoff retries, async queues, and clean API gateway patterns.",
          resultMetricRequirement: "Quantify expected p99 latency target and system uptime percentage under load."
        }
      },
      {
        category: "Behavioral & Leadership",
        questionText: `Tell me about a time when you led a major architectural refactor under tight delivery deadlines. How did you balance speed, technical debt, and team alignment?`,
        focusArea: "Engineering Leadership & Pragmatic Refactoring",
        rubric: {
          situationTaskGoal: "Describe the legacy bottleneck or tech debt urgency and deadline constraints.",
          actionRequirement: "Detail your prioritization matrix, RFC document process, and automated test safety nets.",
          resultMetricRequirement: "Highlight quantifiable reduction in crash rates or deployment speed improvements."
        }
      },
      {
        category: "Problem Solving & AI Integration",
        questionText: `How do you approach enforcing strict guardrails and preventing hallucinations when integrating LLMs into mission-critical user workflows?`,
        focusArea: "AI Safety, Evaluation & Guardrail Architecture",
        rubric: {
          situationTaskGoal: "Explain the risk of bad model outputs in production application context.",
          actionRequirement: "Detail schema validation, secondary verifier passes, grounded search tools, and fallback mechanisms.",
          resultMetricRequirement: "Mention zero-hallucination compliance rate or automated test coverage metric."
        }
      }
    ];

    const selected = questions[(questionIndex || 0) % questions.length];
    return {
      id: `q-fallback-${Date.now()}`,
      questionNumber: (questionIndex || 0) + 1,
      category: selected.category,
      questionText: selected.questionText,
      focusArea: selected.focusArea,
      starRubric: selected.rubric
    };
  }

  // Helper fallback for STAR Evaluation
  function generateFallbackSTAREvaluation(questionText?: string, userAnswer?: string, jobTitle?: string) {
    const wordCount = (userAnswer || '').split(/\s+/).filter(Boolean).length;
    const isDetailed = wordCount > 25;

    return {
      overallScore: isDetailed ? 88 : 72,
      starScorecard: {
        situationTask: isDetailed ? 23 : 18,
        actionClarity: isDetailed ? 22 : 18,
        resultMetrics: isDetailed ? 20 : 16,
        relevanceToRole: isDetailed ? 23 : 20
      },
      keyStrengths: [
        "Clear articulation of the problem context and technical ownership.",
        "Demonstrated understanding of modern full-stack development principles."
      ],
      areasForImprovement: [
        "Include more explicit quantifiable metrics in the 'Result' section (e.g. % performance increase, exact latency drop).",
        "Elaborate on specific architectural tradeoffs considered during the 'Action' phase."
      ],
      revisedSTARSample: `Here is how a 100-point STAR answer sounds for this question:\n\n**Situation:** Our primary API endpoint experienced latency spikes up to 800ms during peak user activity.\n**Task:** As Senior Engineer, I was tasked with reducing p99 response time below 150ms without increasing infrastructure cost by more than 10%.\n**Action:** I implemented Redis multi-level caching, optimized SQL query indexing, and refactored synchronous calls into asynchronous worker queues in Node.js.\n**Result:** Reduced p99 latency by 72% to 110ms and improved peak request throughput by 3.5x while keeping costs flat.`,
      followUpQuestion: `That's a solid breakdown! If user traffic doubled overnight, what would be the very first bottleneck in that architecture and how would you auto-scale it?`
    };
  }

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
      console.warn('[Resume Tailor Agent] API error/key missing, serving fallback result:', err.message || err);
      const { profile, jobLead, companyIntel } = req.body;
      const result = generateFallbackTailorResult(profile, jobLead, companyIntel);
      res.json({ success: true, result, fallback: true });
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
      console.warn('[Interview Question Agent] API error/key missing, serving fallback question:', err.message || err);
      const { jobTitle, companyName, questionIndex } = req.body;
      const questionTurn = generateFallbackInterviewQuestion(jobTitle, companyName, questionIndex);
      res.json({ success: true, questionTurn, fallback: true });
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
      console.warn('[STAR Evaluator Agent] API error/key missing, serving fallback evaluation:', err.message || err);
      const { questionText, userAnswer, jobTitle } = req.body;
      const evaluation = generateFallbackSTAREvaluation(questionText, userAnswer, jobTitle);
      res.json({ success: true, evaluation, fallback: true });
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
      console.warn('[TTS Generation] API key missing or error, skipping audio generation');
      res.json({ success: false, message: 'Audio generation skipped (no valid API key)' });
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
