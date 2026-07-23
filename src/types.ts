export type AgentRole =
  | 'scout'
  | 'intel'
  | 'tailor'
  | 'interviewer';

export interface CandidateProfile {
  name: string;
  email: string;
  targetTitles: string[];
  locations: string[];
  minSalary: number;
  currency: string;
  workAuthorization: string; // e.g., 'US Citizen', 'Singapore PR', 'Requires Visa Sponsorship'
  skills: string[];
  experienceSummary: string;
  masterExperienceBullets: {
    company: string;
    role: string;
    period: string;
    bullets: string[];
  }[];
  education: string;
  portfolioUrl?: string;
}

export interface JobLead {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  estimatedSalaryMin: number;
  estimatedSalaryMax: number;
  workType: 'Remote' | 'Hybrid' | 'On-site';
  visaSupported: boolean;
  source: string;
  url: string;
  description: string;
  matchScore: number;
  matchReasoning: string;
  status: 'scouted' | 'passed_guardrails' | 'failed_guardrails' | 'routed_to_intel' | 'routed_to_tailor' | 'applied';
  rejectionReason?: string;
  postedDate: string;
}

export interface CompanyIntel {
  companyName: string;
  overview: string;
  recentNews: string[];
  cultureAndValues: string[];
  techStack: {
    languages: string[];
    frameworks: string[];
    cloudAndDevOps: string[];
    dataAndDatabase: string[];
    tooling: string[];
  };
  leadershipStyle: string;
  potentialRedFlags: string[];
  commonInterviewQuestions: string[];
  candidateQuestionsToAsk: string[];
  sourcesCount: number;
  researchedAt: string;
}

export interface EvaluatorIteration {
  version: number;
  atsScore: number;
  keywordMatchPercentage: number;
  feedback: {
    strengths: string[];
    missingKeywords: string[];
    guardrailViolations: string[];
    improvementSuggestions: string[];
  };
  tailoredResume: string;
  coverLetter: string;
}

export interface TailoredAssetResult {
  jobId: string;
  jobTitle: string;
  company: string;
  finalAtsScore: number;
  keywordMatchPercentage: number;
  tailoredResumeMarkdown: string;
  coverLetterMarkdown: string;
  iterations: EvaluatorIteration[];
  guardrailStatus: 'PASS' | 'VIOLATION_DETECTED_AND_FIXED';
}

export interface InterviewQuestionTurn {
  id: string;
  questionNumber: number;
  category: 'Behavioral' | 'Technical / System Design' | 'Leadership / Culture' | 'Problem Solving';
  questionText: string;
  focusArea: string;
  starRubric: {
    situationTaskGoal: string;
    actionRequirement: string;
    resultMetricRequirement: string;
  };
  userAnswer?: string;
  evaluation?: STARAnswerEvaluation;
  audioBase64?: string;
}

export interface STARAnswerEvaluation {
  overallScore: number; // 0-100
  starScorecard: {
    situationTask: number; // 0-25
    actionClarity: number; // 0-25
    resultMetrics: number; // 0-25
    relevanceToRole: number; // 0-25
  };
  keyStrengths: string[];
  areasForImprovement: string[];
  revisedSTARSample: string;
  followUpQuestion?: string;
}

export interface AgentLog {
  id: string;
  timestamp: string;
  agent: AgentRole;
  action: string;
  toolUsed?: string;
  inputSnippet?: string;
  outputSnippet?: string;
  type: 'info' | 'tool_call' | 'thought' | 'handoff' | 'guardrail' | 'success' | 'error';
}

export interface CrewExecutionState {
  currentAgent: AgentRole | 'idle';
  isExecuting: boolean;
  activeTaskDescription?: string;
  progressPercentage: number;
}
