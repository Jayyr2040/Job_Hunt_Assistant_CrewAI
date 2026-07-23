import { CandidateProfile, JobLead, CompanyIntel } from '../types';

export const DEFAULT_CANDIDATE_PROFILE: CandidateProfile = {
  name: "Alex Tan",
  email: "alex.tan.dev@gmail.com",
  targetTitles: [
    "Senior Full Stack Engineer",
    "Staff Software Engineer",
    "AI Platform Engineer",
    "Engineering Manager"
  ],
  locations: ["San Francisco, CA", "Singapore", "Remote (US/Global)"],
  minSalary: 160000,
  currency: "USD",
  workAuthorization: "US Citizen / Green Card Holder (No Sponsorship Needed)",
  skills: [
    "TypeScript", "React", "Node.js", "Express", "Python",
    "PostgreSQL", "Redis", "Docker", "Kubernetes", "AWS",
    "Gemini GenAI SDK", "GraphQL", "Tailwind CSS", "Distributed Systems",
    "CI/CD Pipelines", "System Architecture"
  ],
  experienceSummary: "8+ years of engineering experience scaling high-concurrency web applications, building multi-agent AI workflows, and leading cross-functional teams.",
  masterExperienceBullets: [
    {
      company: "Apex Tech Labs",
      role: "Lead Full Stack & AI Solutions Engineer",
      period: "2023 - Present",
      bullets: [
        "Architected multi-agent orchestration engine handling 1.2M daily workflow requests with Gemini API, reducing operational latency by 38%.",
        "Led a team of 6 engineers to build React 19 micro-frontend dashboard with TypeScript and Tailwind CSS.",
        "Optimized PostgreSQL query performance and Redis caching layers, scaling throughput from 5,000 to 45,000 requests/sec under load."
      ]
    },
    {
      company: "Nexus Cloud Systems",
      role: "Senior Software Engineer",
      period: "2020 - 2023",
      bullets: [
        "Designed containerized CI/CD deployment pipeline with Docker & Kubernetes, cutting deployment rollback times from 25 minutes to under 2 minutes.",
        "Mentored 8 junior and mid-level engineers, establishing code review guidelines and automated static analysis tools.",
        "Engineered real-time collaboration canvas using WebSockets and Node.js backend supporting 500+ simultaneous session editors."
      ]
    },
    {
      company: "Vanguard Digital",
      role: "Software Engineer",
      period: "2018 - 2020",
      bullets: [
        "Developed customer-facing dashboard in React & Express serving 250,000 active monthly users.",
        "Implemented OAuth 2.0 and JWT authentication security frameworks across 12 microservices."
      ]
    }
  ],
  education: "B.S. in Computer Science & Applied Mathematics, UC Berkeley (3.8 GPA)",
  portfolioUrl: "https://github.com/alextan-dev"
};

export const SAMPLE_JOB_LEADS: JobLead[] = [
  {
    id: "job-101",
    title: "Senior AI Platform & Full Stack Engineer",
    company: "Stripe",
    location: "San Francisco, CA (Hybrid)",
    salaryRange: "$180,000 - $220,000 USD",
    estimatedSalaryMin: 180000,
    estimatedSalaryMax: 220000,
    workType: "Hybrid",
    visaSupported: true,
    source: "LinkedIn Jobs",
    url: "https://linkedin.com/jobs/view/stripe-senior-ai-engineer",
    description: "We are seeking a Senior AI Platform Engineer to build scalable infrastructure for developer tools and generative AI workflows. You will lead design for high-throughput APIs, collaborate with product teams on LLM agent integration, and optimize React/TypeScript interfaces.",
    matchScore: 96,
    matchReasoning: "Strong match with candidate's 8+ years experience, Gemini SDK background, Node.js distributed systems, and salary expectations ($180k > $160k min threshold).",
    status: "routed_to_intel",
    postedDate: "2 days ago"
  },
  {
    id: "job-102",
    title: "Staff Software Engineer - Systems & Cloud",
    company: "Datadog",
    location: "Remote (US)",
    salaryRange: "$200,000 - $245,000 USD",
    estimatedSalaryMin: 200000,
    estimatedSalaryMax: 245000,
    workType: "Remote",
    visaSupported: true,
    source: "Glassdoor",
    url: "https://glassdoor.com/job/datadog-staff-engineer",
    description: "Datadog is building next-generation observability engines. Looking for Staff Engineers experienced in Go/Node.js, distributed caching, Kubernetes, and high-frequency backend metrics pipelines.",
    matchScore: 92,
    matchReasoning: "Excellent fit for distributed systems background, Docker/K8s expertise, and high performance tuning achievements.",
    status: "passed_guardrails",
    postedDate: "1 day ago"
  },
  {
    id: "job-103",
    title: "Junior Frontend Developer",
    company: "Startup Co",
    location: "Austin, TX",
    salaryRange: "$80,000 - $95,000 USD",
    estimatedSalaryMin: 80000,
    estimatedSalaryMax: 95000,
    workType: "On-site",
    visaSupported: false,
    source: "Indeed",
    url: "https://indeed.com/job/junior-dev-103",
    description: "Looking for entry-level HTML/CSS dev to build landing pages.",
    matchScore: 30,
    matchReasoning: "Failed hard criteria: Salary $80k is below candidate's $160k minimum threshold; level is junior vs target Senior/Staff.",
    status: "failed_guardrails",
    rejectionReason: "Guardrail Failure: Salary ($80k) below minimum threshold ($160k) & role seniority mismatch.",
    postedDate: "3 days ago"
  }
];

export const SAMPLE_COMPANY_INTEL: Record<string, CompanyIntel> = {
  "Stripe": {
    companyName: "Stripe",
    overview: "Stripe is a financial infrastructure platform for businesses. Millions of companies use Stripe's software to accept payments, grow their revenue, and accelerate new business opportunities.",
    recentNews: [
      "Launched Stripe Agent Toolkit for LLM AI commerce and payment automation.",
      "Expanded enterprise developer suite with high-speed webhooks and sub-millisecond API response optimizations.",
      "Achieved $1 Trillion in total processed volume annually."
    ],
    cultureAndValues: [
      "Operating at low latency & high precision",
      "Macro scope, micro detail - obsessing over product craft",
      "Users first, direct honest communication",
      "Rigorous technical ownership"
    ],
    techStack: {
      languages: ["TypeScript", "Ruby", "Go", "Python"],
      frameworks: ["React", "Express", "GraphQL"],
      cloudAndDevOps: ["AWS", "Kubernetes", "Envoy", "Terraform"],
      dataAndDatabase: ["PostgreSQL", "Redis", "RocksDB"],
      tooling: ["Sorbet", "Vite", "Datadog", "GitHub Actions"]
    },
    leadershipStyle: "Data-driven, engineering-led decision making with extreme emphasis on documentation and API ergonomics.",
    potentialRedFlags: [
      "Fast-paced environment with high workload expectations during major API launches.",
      "High bar for technical interviews requiring granular system design tradeoffs."
    ],
    commonInterviewQuestions: [
      "How would you design a distributed rate limiter for millions of API calls per second?",
      "Describe a scenario where you debugged a subtle memory leak or race condition in production.",
      "How do you evaluate multi-agent reliability and failover when integrating LLM APIs?"
    ],
    candidateQuestionsToAsk: [
      "How does the AI Platform team measure model execution safety and fallback routing when primary LLM endpoints degrade?",
      "What are the key technical milestones for the developer tools division over the next 2 quarters?",
      "How does Stripe balance rapid feature shipping with maintaining 99.999% payment system availability?"
    ],
    sourcesCount: 14,
    researchedAt: "Just now (Live Search Grounded)"
  }
};
