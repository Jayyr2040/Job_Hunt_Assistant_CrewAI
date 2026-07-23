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
  locations: ["Singapore", "San Francisco, CA", "Remote (Global)"],
  minSalary: 120000,
  currency: "SGD",
  workAuthorization: "Singapore Citizen / PR / Employment Pass",
  skills: [
    "TypeScript", "React", "Node.js", "Express", "Python",
    "PostgreSQL", "Redis", "Docker", "Kubernetes", "AWS",
    "Gemini GenAI SDK", "GraphQL", "Tailwind CSS", "Distributed Systems",
    "CI/CD Pipelines", "System Architecture"
  ],
  experienceSummary: "8+ years of engineering experience scaling high-concurrency web applications, building multi-agent AI workflows, and leading cross-functional teams across Southeast Asia and Global markets.",
  masterExperienceBullets: [
    {
      company: "Apex Tech Labs (Singapore)",
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
  education: "B.S. in Computer Science & Applied Mathematics, National University of Singapore (NUS)",
  portfolioUrl: "https://github.com/alextan-dev"
};

export const SAMPLE_JOB_LEADS: JobLead[] = [
  {
    id: "job-sg-101",
    title: "Senior AI Platform & Full Stack Engineer",
    company: "Grab",
    location: "Singapore (Hybrid)",
    salaryRange: "$140,000 - $190,000 SGD",
    estimatedSalaryMin: 140000,
    estimatedSalaryMax: 190000,
    workType: "Hybrid",
    visaSupported: true,
    source: "MyCareersFuture SG",
    url: "https://www.mycareersfuture.gov.sg/search?search=Grab%20Senior%20AI%20Engineer",
    description: "Grab is seeking a Senior AI Platform Engineer in Singapore to build scalable superapp backend infrastructure, LLM agent integration, and high-throughput real-time routing engines in React/TypeScript and Node.js/Go.",
    matchScore: 96,
    matchReasoning: "Excellent match for candidate's 8+ years experience, Gemini SDK background, Node.js microservices, and Singapore location preference ($140k > $120k min threshold).",
    status: "routed_to_intel",
    postedDate: "1 day ago"
  },
  {
    id: "job-sg-102",
    title: "Staff Software Engineer - Systems & Cloud",
    company: "Stripe Singapore",
    location: "Singapore (Hybrid)",
    salaryRange: "$160,000 - $220,000 SGD",
    estimatedSalaryMin: 160000,
    estimatedSalaryMax: 220000,
    workType: "Hybrid",
    visaSupported: true,
    source: "LinkedIn Singapore",
    url: "https://www.linkedin.com/jobs/search/?keywords=Staff%20Software%20Engineer&location=Singapore",
    description: "Stripe APAC hub in Singapore is expanding its developer tools & fintech infrastructure team. Looking for Staff Engineers experienced in TypeScript, distributed caching, Kubernetes, and high-frequency backend APIs.",
    matchScore: 94,
    matchReasoning: "Strong fit for distributed systems background, Docker/K8s expertise, and API performance tuning achievements in Singapore regional hub.",
    status: "passed_guardrails",
    postedDate: "2 days ago"
  },
  {
    id: "job-103",
    title: "Junior Web Developer",
    company: "Local Agency Co",
    location: "Singapore (On-site)",
    salaryRange: "$25,000 - $32,500 SGD",
    estimatedSalaryMin: 25000,
    estimatedSalaryMax: 32500,
    workType: "On-site",
    visaSupported: false,
    source: "JobStreet SG",
    url: "https://www.jobstreet.com.sg/jobs?keywords=Junior%20Web%20Developer%20Singapore",
    description: "Looking for entry-level HTML/CSS dev to build landing pages.",
    matchScore: 28,
    matchReasoning: "Failed hard criteria: Salary $25,000 SGD is below candidate's $40,000 SGD minimum threshold & role seniority mismatch (Junior vs target Senior/Staff).",
    status: "failed_guardrails",
    rejectionReason: "Guardrail Failure: Salary ($25,000 SGD) below minimum threshold ($40,000 SGD) & role seniority mismatch.",
    postedDate: "2 days ago"
  }
];

export const SAMPLE_COMPANY_INTEL: Record<string, CompanyIntel> = {
  "Sembcorp Industries SG": {
    companyName: "Sembcorp Industries SG",
    overview: "Sembcorp Industries is a leading energy and urban solutions provider, driving APAC clean energy transition, water treatment infrastructure, decarbonization frameworks, and sustainable urbanization.",
    recentNews: [
      "Sembcorp announced SGD 250M clean energy expansion and 200MW solar power project in Singapore.",
      "Leadership published 2026 Sustainability Roadmap detailing carbon neutrality targets and ESG governance.",
      "Formed strategic partnership with EMA for smart grid reliability and battery energy storage systems."
    ],
    cultureAndValues: [
      "Purpose-driven sustainability & environmental stewardship",
      "Rigorous project governance, safety & regulatory compliance",
      "Data-informed operational execution across regional assets",
      "Collaborative leadership and cross-functional team alignment"
    ],
    techStack: {
      languages: ["Carbon Accounting", "ESG Standards (GRI/TCFD)", "Environmental Policy", "Energy Auditing"],
      frameworks: ["Life Cycle Assessment (LCA)", "Decarbonization Roadmap", "ISO 50001", "Project Governance"],
      cloudAndDevOps: ["Smart Grid IoT Systems", "Clean Energy Platform", "GIS Mapping Tools", "ERP Integration"],
      dataAndDatabase: ["Energy Analytics Dashboards", "PowerBI & Tableau", "SQL Data Pipelines", "Excel Modeling"],
      tooling: ["SAP Energy Suite", "EcoVadis Reporting", "Jira Project Management"]
    },
    leadershipStyle: "Strategic, safety-first leadership emphasizing regulatory rigor, stakeholder alignment, and measurable decarbonization impact.",
    potentialRedFlags: [
      "Navigating multi-agency regulatory approvals requires stakeholder patience.",
      "Balancing aggressive net-zero timelines with capital expenditure allocation constraints."
    ],
    commonInterviewQuestions: [
      "How do you align multi-department stakeholders when executing strategic sustainability or infrastructure initiatives at Sembcorp Industries SG?",
      "Can you describe your methodology for monitoring operational performance, risk controls, and project milestones?",
      "How do you prioritize deliverables when facing unexpected regulatory policy updates or project timeline shifts?"
    ],
    candidateQuestionsToAsk: [
      "What are Sembcorp's top strategic decarbonization and operational priorities over the next 12-18 months?",
      "How does executive leadership measure and reward success for senior leaders driving these initiatives?",
      "What cross-functional teams will this role collaborate with most closely on a day-to-day basis?"
    ],
    sourcesCount: 15,
    researchedAt: "Live Grounded Research Brief"
  },
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
