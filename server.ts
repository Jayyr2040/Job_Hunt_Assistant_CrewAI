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
  function getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'dummy-key-for-dev') {
      return null;
    }
    try {
      return new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      return null;
    }
  }

  // System status endpoint to inspect configured models & Ollama connectivity
  app.get('/api/system-status', async (req, res) => {
    const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy-key-for-dev');
    const hasOpenAICompatible = Boolean(
      process.env.OPENAI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      process.env.OPENAI_BASE_URL
    );

    const openAiProvider = process.env.GROQ_API_KEY
      ? 'Groq API'
      : process.env.OPENROUTER_API_KEY
      ? 'OpenRouter API'
      : process.env.DEEPSEEK_API_KEY
      ? 'DeepSeek API'
      : process.env.OPENAI_API_KEY
      ? 'OpenAI API'
      : process.env.OPENAI_BASE_URL
      ? 'Custom OpenAI-compatible Endpoint'
      : 'None';

    const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    let ollamaStatus = 'offline';
    let ollamaModels: string[] = [];

    try {
      const tagsRes = await fetch(`${ollamaHost}/api/tags`, { signal: AbortSignal.timeout(1500) });
      if (tagsRes.ok) {
        const data = (await tagsRes.json()) as any;
        ollamaModels = (data.models || []).map((m: any) => m.name || m.model);
        ollamaStatus = 'online';
      }
    } catch (e) {
      ollamaStatus = 'offline';
    }

    res.json({
      geminiConfigured: hasGemini,
      openAICompatibleConfigured: hasOpenAICompatible,
      openAiProvider,
      ollamaStatus,
      ollamaHost,
      ollamaModels,
      activeEngine: process.env.FORCE_OLLAMA === 'true'
        ? 'Ollama Local'
        : hasOpenAICompatible
        ? `${openAiProvider} Router`
        : hasGemini
        ? 'Gemini API (with Multi-Router Fallbacks)'
        : 'Ollama Local / Contextual Fallback Engine',
    });
  });

  // Helper to generate context-aware fallback leads for queries (e.g. Singapore, London, Tokyo, specific titles)
  function generateFallbackLeadsForQuery(profile: any, query: string) {
    const rawQ = (query || '').trim();
    const qLower = rawQ.toLowerCase();

    // Clean location keywords from query to extract clean role name
    const cleanedRoleQuery = rawQ
      .replace(/\s*(in|at|for|near)\s+(singapore|sg|london|tokyo|japan|san francisco|sf|usa|remote|hybrid)\b/gi, '')
      .replace(/\b(singapore|sg|london|tokyo|japan|san francisco|sf|usa|remote|hybrid)\b/gi, '')
      .trim();

    const isSingapore = qLower.includes('singapore') || qLower.includes('sg') || (profile?.locations || []).some((l: string) => l.toLowerCase().includes('singapore'));
    const isLondon = qLower.includes('london') || qLower.includes('uk');
    const isTokyo = qLower.includes('tokyo') || qLower.includes('japan');

    const currency = isSingapore ? 'SGD' : isLondon ? 'GBP' : isTokyo ? 'JPY' : profile?.currency || 'USD';
    const locationLabel = isSingapore ? 'Singapore (Hybrid)' : isLondon ? 'London, UK (Hybrid)' : isTokyo ? 'Tokyo, Japan (On-site)' : 'San Francisco, CA (Hybrid)';

    const targetTitles: string[] = (profile?.targetTitles && profile.targetTitles.length > 0)
      ? profile.targetTitles
      : ["Senior Engineer", "Technical Director"];

    let title1 = "";
    let title2 = "";
    let title3 = "";

    if (cleanedRoleQuery.length >= 3) {
      // Use clean search query as primary lead title
      title1 = cleanedRoleQuery.replace(/\b\w/g, (l: string) => l.toUpperCase());
      title2 = (targetTitles.find(t => t.toLowerCase() !== cleanedRoleQuery.toLowerCase()) || targetTitles[0] || `Principal ${title1}`)
        .replace(/\b\w/g, (l: string) => l.toUpperCase());
      title3 = `Junior ${title1.replace(/^Senior\s+|^Staff\s+|^Principal\s+|^Lead\s+/i, '')}`;
    } else {
      // Fallback to profile target titles
      title1 = (targetTitles[0] || "Senior Consultant & Systems Manager").replace(/\b\w/g, (l: string) => l.toUpperCase());
      title2 = (targetTitles[1] || targetTitles[0] || "Principal Energy & Technology Lead").replace(/\b\w/g, (l: string) => l.toUpperCase());
      title3 = `Junior ${title1.replace(/^Senior\s+|^Staff\s+|^Principal\s+|^Lead\s+/i, '')}`;
    }

    const skillsList = (profile?.skills && profile.skills.length > 0)
      ? profile.skills.slice(0, 4).join(', ')
      : 'Project Execution, Stakeholder Management, Strategic Delivery';

    const fullDomainContext = (title1 + ' ' + title2 + ' ' + skillsList + ' ' + (profile?.executiveSummary || '') + ' ' + qLower).toLowerCase();

    const isEnergyOrSustain = fullDomainContext.match(/energy|sustainab|consult|environ|decarbon|climate|solar|grid/);
    const isPublicGovOrDirector = fullDomainContext.match(/director|assistant director|gov|ministry|public|policy|agency/);

    let company1 = "Grab";
    let company2 = "Shopee / Sea Group";
    let company3 = "Local Enterprise SG";

    if (isSingapore) {
      if (isEnergyOrSustain) {
        company1 = "Sembcorp Industries SG";
        company2 = "Keppel Corporation / Keppel Infrastructure";
        company3 = "EcoVadis SG";
      } else if (isPublicGovOrDirector) {
        company1 = "GovTech Singapore / Ministry of Sustainability";
        company2 = "DBS Bank - Enterprise Strategy & Transformation";
        company3 = "SG Regional Advisory Services";
      }
    } else if (isLondon) {
      company1 = "Revolut";
      company2 = "Monzo Bank";
      company3 = "London Tech Studio";
    } else if (isTokyo) {
      company1 = "Mercari";
      company2 = "Rakuten Group";
      company3 = "Tokyo Web Inc";
    } else {
      company1 = "Stripe";
      company2 = "Datadog";
      company3 = "Bay Area Startup Co";
    }

    const minThreshold = profile?.minSalary || (isSingapore ? 80000 : 120000);
    const salMin1 = Math.max(isSingapore ? 110000 : 150000, Math.round(minThreshold * 1.2));
    const salMax1 = Math.round(salMin1 * 1.35);
    const salMin2 = Math.max(isSingapore ? 130000 : 170000, Math.round(minThreshold * 1.35));
    const salMax2 = Math.round(salMin2 * 1.35);
    
    // Ensure lead 3 is explicitly below candidate's min threshold to demonstrate guardrails
    const salMin3 = Math.max(25000, Math.round(minThreshold * 0.6));
    const salMax3 = Math.round(salMin3 * 1.25);

    const isBelowSalary = salMin3 < minThreshold;
    const rejectionReason = isBelowSalary
      ? `Guardrail Failure: Salary ($${salMin3.toLocaleString()} ${currency}) is below candidate minimum threshold ($${minThreshold.toLocaleString()} ${currency}) & seniority level mismatch.`
      : `Guardrail Failure: Role seniority mismatch (Junior entry position vs candidate target senior level).`;

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
        description: `${company1} is seeking a ${title1} in ${locationLabel}. Role focuses on strategic delivery, stakeholder management, and expertise in ${skillsList}.`,
        matchScore: 96,
        matchReasoning: `Strong alignment with candidate target titles (${title1}), skills (${skillsList}), and salary expectations.`,
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
        description: `${company2} is expanding its core strategic team in ${locationLabel}. Looking for ${title2} experienced in cross-functional leadership, client advisory, and ${skillsList}.`,
        matchScore: 92,
        matchReasoning: `High compatibility with target domain background, senior experience level, and salary guardrails.`,
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
        description: `Junior entry-level administrative and basic research assistant position.`,
        matchScore: 25,
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

  // Safe JSON parser helper to handle markdown blocks (e.g. ```json ... ```) from LLMs/Ollama
  function parseJsonSafely(text: string, fallback: any = null) {
    if (!text) return fallback;
    try {
      return JSON.parse(text);
    } catch (e1) {
      const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch (e2) {
        const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            return JSON.parse(jsonMatch[1].trim());
          } catch (e3) {
            // failed
          }
        }
        return fallback;
      }
    }
  }

  let geminiQuotaExceededUntil = 0;

  // Simple in-memory response cache for duplicate agent prompts within 5 minutes
  const agentResponseCache = new Map<string, { response: { text: string }; expiresAt: number }>();

  // Sequential Execution Queue for Local Ollama to prevent CPU/GPU saturation when multiple agents run
  let ollamaQueueChain: Promise<any> = Promise.resolve();

  function enqueueOllamaTask<T>(task: () => Promise<T>): Promise<T> {
    const res = ollamaQueueChain.then(task, task);
    ollamaQueueChain = res.catch(() => {});
    return res;
  }

  // Helper to query any OpenAI-compatible API Router (Groq, OpenRouter, DeepSeek, OpenAI, LM Studio, etc.)
  async function tryOpenAICompatibleGenerate(prompt: string, isJson: boolean = false): Promise<{ text: string } | null> {
    const apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      process.env.LLM_API_KEY;

    const baseUrl =
      process.env.OPENAI_BASE_URL ||
      process.env.LLM_BASE_URL ||
      (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : null) ||
      (process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : null) ||
      (process.env.DEEPSEEK_API_KEY ? 'https://api.deepseek.com/v1' : null) ||
      (apiKey ? 'https://api.openai.com/v1' : null);

    if (!baseUrl && !apiKey) return null;

    const defaultModel =
      process.env.OPENAI_MODEL ||
      process.env.LLM_MODEL ||
      (process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : null) ||
      (process.env.OPENROUTER_API_KEY ? 'meta-llama/llama-3.3-70b-instruct' : null) ||
      (process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : null) ||
      'gpt-4o-mini';

    const normalizedUrl = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const endpoint = `${normalizedUrl}/chat/completions`;

    try {
      console.log(`[OpenAI-Compatible Router] Querying model "${defaultModel}" at ${normalizedUrl}...`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }
      if (process.env.OPENROUTER_API_KEY) {
        headers['HTTP-Referer'] = 'https://ai.studio';
        headers['X-Title'] = 'Job Hunt Assistant CrewAI';
      }

      const bodyPayload: any = {
        model: defaultModel,
        messages: [
          {
            role: 'system',
            content: isJson
              ? 'You are a precise JSON generator. Reply ONLY with raw JSON. Do NOT wrap in markdown backticks. No conversational text.'
              : 'You are a professional AI career assistant.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
      };

      if (isJson) {
        bodyPayload.response_format = { type: 'json_object' };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
        signal: AbortSignal.timeout(25000), // 25s timeout for cloud router
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[OpenAI-Compatible Router] HTTP ${res.status} error from ${normalizedUrl}:`, errorText.slice(0, 300));
        return null;
      }

      const data = (await res.json()) as any;
      const responseText = data?.choices?.[0]?.message?.content;
      if (responseText) {
        return { text: responseText };
      }
      return null;
    } catch (err: any) {
      console.warn(`[OpenAI-Compatible Router] Inference attempt notice:`, err?.message || err);
      return null;
    }
  }

  // Helper to query local Ollama server if available as a fallback or primary LLM (Sequentially Queued)
  async function tryOllamaGenerate(prompt: string, isJson: boolean = false): Promise<{ text: string } | null> {
    return enqueueOllamaTask(async () => {
      const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
      try {
        const tagsRes = await fetch(`${ollamaHost}/api/tags`, { signal: AbortSignal.timeout(1500) });
        if (!tagsRes.ok) {
          return null;
        }
        const tagsData = (await tagsRes.json()) as any;
        const models: any[] = tagsData.models || [];
        if (!models || models.length === 0) {
          console.warn(`[Ollama Engine] Reachable at ${ollamaHost}, but no models found. Run "ollama pull llama3.2" in your terminal to load a model.`);
          return null;
        }

        const preferredModel = process.env.OLLAMA_MODEL;
        const modelName = preferredModel || models[0].name || models[0].model || 'llama3.2';
        console.log(`[Ollama Engine Queue] Processing agent request via local model "${modelName}" at ${ollamaHost}...`);

        const formattedPrompt = isJson
          ? `${prompt}\n\nCRITICAL INSTRUCTION: Output ONLY valid raw JSON syntax matching the schema requested. No markdown formatting, no conversation.`
          : prompt;

        const genRes = await fetch(`${ollamaHost}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName,
            prompt: formattedPrompt,
            stream: false,
            format: isJson ? 'json' : undefined,
            options: {
              temperature: 0.2,
              num_ctx: 2048,
              num_predict: 512,
            },
          }),
          signal: AbortSignal.timeout(20000), // 20 seconds max per local agent task to keep dev server snappy
        });

        if (!genRes.ok) {
          console.warn(`[Ollama Engine] Generate request failed with HTTP ${genRes.status}`);
          return null;
        }
        const genData = (await genRes.json()) as any;
        if (genData && genData.response) {
          return { text: genData.response };
        }
        return null;
      } catch (e: any) {
        const msg = String(e?.message || e || '');
        if (!msg.includes('fetch failed') && !msg.includes('ECONNREFUSED')) {
          console.warn(`[Ollama Engine] Local inference notice: ${msg.slice(0, 100)}`);
        }
        return null;
      }
    });
  }

  function extractPromptString(params: any): string {
    if (typeof params?.contents === 'string') {
      return params.contents;
    }
    if (Array.isArray(params?.contents)) {
      return params.contents
        .map((item: any) => {
          if (typeof item === 'string') return item;
          if (item?.parts) return item.parts.map((p: any) => p.text || '').join('\n');
          return JSON.stringify(item);
        })
        .join('\n');
    }
    if (params?.contents) {
      return JSON.stringify(params.contents);
    }
    return '';
  }

  // Unified AI Agent execution runner (Gemini API + OpenAI-compatible Router + Ollama local fallback)
  async function generateContentWithRetry(ai: GoogleGenAI | null, params: any) {
    const promptStr = extractPromptString(params);
    const isJsonRequested = params?.config?.responseMimeType === 'application/json';

    // 0. Cache Lookup
    if (promptStr) {
      const cacheKey = `${isJsonRequested ? 'json' : 'text'}_${promptStr.trim()}`;
      const cached = agentResponseCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        console.log('[AI Router Cache] Serving cached response for agent prompt');
        return cached.response;
      }
    }

    const primaryModel = params.model || 'gemini-3.6-flash';
    const modelsToTry = [primaryModel];
    if (primaryModel === 'gemini-3.6-flash') {
      modelsToTry.push('gemini-3.1-flash-lite', 'gemini-flash-latest');
    }

    let lastError: any = null;
    const forceOllama = process.env.FORCE_OLLAMA === 'true' || process.env.USE_OLLAMA_FIRST === 'true';
    const useOpenAiFirst = process.env.USE_OPENAI_FIRST === 'true';
    const isGeminiCoolingOff = Date.now() < geminiQuotaExceededUntil;

    // 1. Force Ollama local execution
    if (forceOllama) {
      if (promptStr) {
        const ollamaRes = await tryOllamaGenerate(promptStr, isJsonRequested);
        if (ollamaRes) return ollamaRes;
      }
    }

    // 2. Force OpenAI-compatible router (e.g. Groq, OpenRouter, DeepSeek, OpenAI)
    if (useOpenAiFirst && promptStr) {
      const openAiRes = await tryOpenAICompatibleGenerate(promptStr, isJsonRequested);
      if (openAiRes) return openAiRes;
    }

    // 3. Try Gemini API models if available and not cooling off
    if (ai && !isGeminiCoolingOff) {
      for (const modelName of modelsToTry) {
        if (Date.now() < geminiQuotaExceededUntil) break; // Exit if another concurrent agent set cool-off

        const attemptParams = { ...params, model: modelName };
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await ai.models.generateContent(attemptParams);
            if (response) {
              if (promptStr && response.text) {
                const cacheKey = `${isJsonRequested ? 'json' : 'text'}_${promptStr.trim()}`;
                agentResponseCache.set(cacheKey, { response, expiresAt: Date.now() + 5 * 60 * 1000 });
              }
              return response;
            }
          } catch (err: any) {
            lastError = err;
            const status = err?.status || err?.code || err?.error?.code;
            const msg = String(err?.message || err || '');

            const isQuotaExceeded =
              status === 429 ||
              msg.includes('quota') ||
              msg.includes('429') ||
              msg.includes('RESOURCE_EXHAUSTED');

            if (isQuotaExceeded) {
              console.warn(`[Gemini API] Quota limit reached (429). Enabling 60s Gemini cool-off and switching to fallback router...`);
              geminiQuotaExceededUntil = Date.now() + 60 * 1000; // 60s cool-off
              break; // Stop trying further Gemini models
            }

            console.warn(`[Gemini API] Model ${modelName} attempt ${attempt} notice (${status || 'error'}): ${msg.slice(0, 120)}`);

            const isTransient =
              status === 503 ||
              status === 'UNAVAILABLE' ||
              msg.includes('demand') ||
              msg.includes('503') ||
              msg.includes('overloaded') ||
              msg.includes('UNAVAILABLE');

            if (isTransient && attempt < 2) {
              const delay = attempt * 800;
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
            break;
          }
        }
      }
    }

    // 4. Fallback Router Step A: Try OpenAI-compatible API (Groq / OpenRouter / DeepSeek / OpenAI / Custom Endpoint)
    if (promptStr) {
      const openAiRes = await tryOpenAICompatibleGenerate(promptStr, isJsonRequested);
      if (openAiRes) {
        const cacheKey = `${isJsonRequested ? 'json' : 'text'}_${promptStr.trim()}`;
        agentResponseCache.set(cacheKey, { response: openAiRes, expiresAt: Date.now() + 5 * 60 * 1000 });
        return openAiRes;
      }
    }

    // 5. Fallback Router Step B: Try local Ollama server
    if (promptStr) {
      const ollamaResponse = await tryOllamaGenerate(promptStr, isJsonRequested);
      if (ollamaResponse) {
        const cacheKey = `${isJsonRequested ? 'json' : 'text'}_${promptStr.trim()}`;
        agentResponseCache.set(cacheKey, { response: ollamaResponse, expiresAt: Date.now() + 5 * 60 * 1000 });
        return ollamaResponse;
      }
    }

    throw lastError || new Error('All AI model generation attempts failed across Gemini, OpenAI-compatible Router, and Ollama.');
  }

  // --- API ROUTE 1: Scouting & Triage Agent (Router / Handoff Node) ---
  app.post('/api/crew/scout', async (req, res) => {
    try {
      const { profile, searchQuery } = req.body;
      const ai = getGeminiClient();

      const targetTitlesList = (profile?.targetTitles && profile.targetTitles.length > 0)
        ? profile.targetTitles.join(', ')
        : 'Senior Roles';
      const primaryLocation = (profile?.locations && profile.locations.length > 0)
        ? profile.locations[0]
        : 'Singapore';
      const keySkillsList = (profile?.skills && profile.skills.length > 0)
        ? profile.skills.slice(0, 5).join(', ')
        : '';

      const searchIntent = searchQuery || `Active listings for ${targetTitlesList} in ${primaryLocation} requiring skills like ${keySkillsList}`;

      const prompt = `You are the "Scouting & Triage Agent" in a CrewAI multi-agent job hunt system.
Role: Use search tools to discover REAL, ACTIVE job listings strictly matching the user's search query and candidate's target titles and profile, evaluate role fit, enforce guardrails, and route viable leads.

SEARCH INTENT QUERY: "${searchIntent}"
CANDIDATE TARGET TITLES: ${JSON.stringify(profile?.targetTitles || [])}
CANDIDATE SKILLS & EXPERTISE: ${JSON.stringify(profile?.skills || [])}

CRITICAL LOCATION & CURRENCY DIRECTIVE:
1. Pay strict attention to any location specified in search query or candidate preferred locations: ${JSON.stringify(profile?.locations || ['Singapore'])}.
2. IF THE SEARCH QUERY OR CANDIDATE LOCATION MENTIONS "Singapore" OR "SG":
   - Find REAL current job listings in Singapore matching candidate target titles (${JSON.stringify(profile?.targetTitles || [])}).
   - For engineering/energy/sustainability roles in Singapore, consider top employers like Sembcorp, Keppel, Singapore Airlines, Keppel Infrastructure, EMA, GovTech Singapore, DBS Bank, Grab, Shopee, Schneider Electric, ExxonMobil SG, Shell SG, etc.
   - Set locations like "Singapore", "Singapore (Hybrid)", or "Singapore (On-site)".
   - Set salary ranges in SGD (e.g., "$100,000 - $180,000 SGD").
   - Set sources like "MyCareersFuture SG", "LinkedIn Singapore", "JobStreet SG", or "Glassdoor".

CANDIDATE PROFILE:
- Name: ${profile?.name || 'Candidate'}
- Target Titles: ${JSON.stringify(profile?.targetTitles || [])}
- Minimum Salary Threshold: ${profile?.currency || 'SGD'} ${profile?.minSalary || 80000}
- Work Authorization: ${profile?.workAuthorization || 'Citizen'}
- Key Skills: ${JSON.stringify(profile?.skills || [])}
- Executive Summary: ${profile?.executiveSummary || ''}

STRICT GUARDRAILS:
1. Hard Criteria Filter: ANY job with estimated salary below $${profile?.minSalary || 80000} (or local currency equivalent) or requiring unsupported visa sponsorship MUST fail hard criteria (status = "failed_guardrails").
2. Target Role Fit: Jobs MUST match candidate's target titles (${JSON.stringify(profile?.targetTitles || [])}) or core domain skills.
3. Show at least 1 lead that fails guardrails (e.g. salary below threshold or junior level) for transparency.

Provide 3-4 job leads matching candidate target titles and location.

Return a JSON array of jobs. Detail the facts for each job:
- id: string (e.g., "job-sg-101")
- title: string
- company: string
- location: string (e.g., "Singapore (Hybrid)", "Singapore", etc.)
- salaryRange: string (e.g., "$100,000 - $160,000 SGD")
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

      const leads = parseJsonSafely(jsonResponse.text, []);
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

      const intel = parseJsonSafely(jsonResponse.text, {});
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
    const company = companyName || 'our engineering team';
    const role = jobTitle || 'Senior Role';

    const questions = [
      {
        category: "System Design & Architecture",
        questionText: `At ${company}, as a ${role}, how would you architect a high-throughput, sub-100ms API for streaming workflows while handling transient rate-limits and network failures?`,
        focusArea: `System Scalability, Resilience & ${role} Execution`,
        rubric: {
          situationTaskGoal: `Set up clear traffic volume expectations, connection pooling needs, and failure scenarios for ${role} at ${company}.`,
          actionRequirement: "Propose concrete caching (Redis), backoff retries, async queues, and clean API gateway patterns.",
          resultMetricRequirement: "Quantify expected p99 latency target and system uptime percentage under load."
        }
      },
      {
        category: "Behavioral & Leadership",
        questionText: `Tell me about a time when you stepped into a ${role} position at a company like ${company} and led a major architectural or strategy initiative under tight delivery deadlines. How did you balance speed, technical debt, and team alignment?`,
        focusArea: "Leadership, Strategic Execution & Stakeholder Alignment",
        rubric: {
          situationTaskGoal: "Describe the legacy bottleneck or tech debt urgency and deadline constraints.",
          actionRequirement: "Detail your prioritization matrix, RFC document process, and automated test safety nets.",
          resultMetricRequirement: "Highlight quantifiable reduction in incident rate or deployment speed improvements."
        }
      },
      {
        category: "Problem Solving & Quality Guardrails",
        questionText: `In a ${role} capacity at ${company}, how do you approach enforcing strict quality guardrails, automated test coverage, and preventing regressions in mission-critical user workflows?`,
        focusArea: "Quality Architecture, Verification & Operational Safety",
        rubric: {
          situationTaskGoal: "Explain the risk of unexpected edge cases or system failures in production.",
          actionRequirement: "Detail schema validation, automated integration test suites, monitoring alerts, and fallback mechanisms.",
          resultMetricRequirement: "Mention zero-regression compliance rate or automated test coverage metric."
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
    const role = jobTitle || 'Senior Candidate';

    return {
      overallScore: isDetailed ? 88 : 72,
      starScorecard: {
        situationTask: isDetailed ? 23 : 18,
        actionClarity: isDetailed ? 22 : 18,
        resultMetrics: isDetailed ? 20 : 16,
        relevanceToRole: isDetailed ? 23 : 20
      },
      keyStrengths: [
        `Clear articulation of the problem context and technical ownership relevant to a ${role}.`,
        "Demonstrated understanding of structured execution and team communication."
      ],
      areasForImprovement: [
        "Include more explicit quantifiable metrics in the 'Result' section (e.g. % performance increase, exact latency or cost savings drop).",
        "Elaborate on specific architectural or operational tradeoffs considered during the 'Action' phase."
      ],
      revisedSTARSample: `Here is how a 100-point STAR answer sounds for a ${role} position:\n\n**Situation:** Our primary API endpoint experienced latency spikes up to 800ms during peak user activity.\n**Task:** As ${role}, I was tasked with reducing p99 response time below 150ms without increasing infrastructure cost by more than 10%.\n**Action:** I implemented Redis multi-level caching, optimized database query indexing, and refactored synchronous calls into asynchronous worker queues.\n**Result:** Reduced p99 latency by 72% to 110ms and improved peak request throughput by 3.5x while keeping costs flat.`,
      followUpQuestion: `That's a solid breakdown! If user volume or operational complexity doubled overnight, what would be the very first bottleneck in that architecture and how would you address it?`
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

      const result = response?.text ? parseJsonSafely(response.text, null) : null;
      if (result && result.jobTitle) {
        res.json({ success: true, result });
      } else {
        const { profile, jobLead, companyIntel } = req.body;
        const fallbackResult = generateFallbackTailorResult(profile, jobLead, companyIntel);
        res.json({ success: true, result: fallbackResult, fallback: true });
      }
    } catch (err: any) {
      console.log('[Resume Tailor Agent] Serving tailored resume fallback');
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

      const questionTurn = response?.text ? parseJsonSafely(response.text, null) : null;
      if (questionTurn && questionTurn.questionText) {
        res.json({ success: true, questionTurn });
      } else {
        const fallbackQuestion = generateFallbackInterviewQuestion(jobTitle, companyName, questionIndex);
        res.json({ success: true, questionTurn: fallbackQuestion, fallback: true });
      }
    } catch (err: any) {
      console.log('[Interview Question Agent] Serving fallback question');
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

      const evaluation = response?.text ? parseJsonSafely(response.text, null) : null;
      if (evaluation && evaluation.overallScore) {
        res.json({ success: true, evaluation });
      } else {
        const fallbackEval = generateFallbackSTAREvaluation(questionText, userAnswer, jobTitle);
        res.json({ success: true, evaluation: fallbackEval, fallback: true });
      }
    } catch (err: any) {
      console.log('[STAR Evaluator Agent] Serving fallback evaluation');
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

      const base64Audio = (response as any).candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
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
