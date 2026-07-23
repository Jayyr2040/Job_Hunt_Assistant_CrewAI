import React, { useState, useEffect } from 'react';
import { CandidateProfile, JobLead, CompanyIntel, TailoredAssetResult, InterviewQuestionTurn, AgentLog, CrewExecutionState, AgentRole } from './types';
import { DEFAULT_CANDIDATE_PROFILE, SAMPLE_JOB_LEADS, SAMPLE_COMPANY_INTEL } from './data/mockData';
import { scoutJobs, fetchCompanyIntel, runTailorLoop, generateInterviewQuestion, evaluateInterviewAnswer } from './services/api';
import { Header } from './components/Header';
import { CrewFlowVisualizer } from './components/CrewFlowVisualizer';
import { AgentThoughtLog } from './components/AgentThoughtLog';
import { CandidateVaultModal } from './components/CandidateVaultModal';
import { ScoutingAgentView } from './components/ScoutingAgentView';
import { CompanyIntelView } from './components/CompanyIntelView';
import { ResumeTailorView } from './components/ResumeTailorView';
import { MockInterviewView } from './components/MockInterviewView';

export default function App() {
  // State
  const [candidate, setCandidate] = useState<CandidateProfile>(DEFAULT_CANDIDATE_PROFILE);
  const [jobLeads, setJobLeads] = useState<JobLead[]>(SAMPLE_JOB_LEADS);
  const [selectedLead, setSelectedLead] = useState<JobLead | null>(SAMPLE_JOB_LEADS[0]);
  const [companyIntel, setCompanyIntel] = useState<CompanyIntel | null>(SAMPLE_COMPANY_INTEL["Stripe"]);
  const [tailorResult, setTailorResult] = useState<TailoredAssetResult | null>(null);
  const [interviewTurn, setInterviewTurn] = useState<InterviewQuestionTurn | null>(null);

  const [activeTab, setActiveTab] = useState<string>('crew-flow');
  const [autoPilot, setAutoPilot] = useState<boolean>(true);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);

  // Execution States
  const [crewState, setCrewState] = useState<CrewExecutionState>({
    currentAgent: 'idle',
    isExecuting: false,
    activeTaskDescription: undefined,
    progressPercentage: 0
  });

  const [isScoutingLoading, setIsScoutingLoading] = useState(false);
  const [isIntelLoading, setIsIntelLoading] = useState(false);
  const [isTailorLoading, setIsTailorLoading] = useState(false);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);

  // Agent Thought Memory Stream
  const [logs, setLogs] = useState<AgentLog[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString(),
      agent: 'scout',
      action: 'Initialized Scouting & Triage Agent Router',
      toolUsed: 'agent_handoff_tool',
      inputSnippet: `Candidate min salary: $${DEFAULT_CANDIDATE_PROFILE.minSalary}, Auth: ${DEFAULT_CANDIDATE_PROFILE.workAuthorization}`,
      outputSnippet: 'Loaded hard criteria guardrails and candidate master experience profile.',
      type: 'info'
    }
  ]);

  const addLog = (
    agent: AgentRole,
    action: string,
    type: AgentLog['type'] = 'info',
    toolUsed?: string,
    inputSnippet?: string,
    outputSnippet?: string
  ) => {
    const newLog: AgentLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      agent,
      action,
      type,
      toolUsed,
      inputSnippet,
      outputSnippet
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // --- HANDLER 1: Run Scouting Router ---
  const handleRunScout = async (searchQuery?: string) => {
    setIsScoutingLoading(true);
    addLog(
      'scout',
      'Executing Scouting & Triage Agent Router',
      'tool_call',
      'job_board_search',
      `Query: "${searchQuery || 'Default Target Roles'}", Salary Min: $${candidate.minSalary}`,
      'Scanning job listings on LinkedIn, MyCareersFuture, Glassdoor...'
    );

    try {
      const leads = await scoutJobs(candidate, searchQuery);
      setJobLeads(leads);

      const passedLeads = leads.filter((l) => l.status !== 'failed_guardrails');
      const failedLeads = leads.filter((l) => l.status === 'failed_guardrails');

      if (passedLeads.length > 0) {
        setSelectedLead(passedLeads[0]);
      }

      addLog(
        'scout',
        `Scouting complete: Discovered ${leads.length} jobs (${passedLeads.length} passed, ${failedLeads.length} failed guardrails)`,
        'handoff',
        'agent_handoff_tool',
        `Scouted ${leads.length} leads`,
        `Passed Guardrails Lead #1: ${passedLeads[0]?.title || 'None'}.\nFailed Reasons: ${failedLeads.map((f) => f.rejectionReason).join('; ')}`
      );
    } catch (err: any) {
      addLog('scout', `Scouting Error: ${err.message}`, 'error');
    } finally {
      setIsScoutingLoading(false);
    }
  };

  // --- HANDLER 2: Run Company Intel ---
  const handleResearchCompany = async (companyName: string, jdText: string) => {
    setIsIntelLoading(true);
    addLog(
      'intel',
      `Parallel Fan-Out Researching Company: ${companyName}`,
      'tool_call',
      'web_search_engine',
      `Target: ${companyName}`,
      'Invoking Gemini Search Grounding for live tech stack, leadership news, and interview questions...'
    );

    try {
      const intel = await fetchCompanyIntel(companyName, jdText);
      setCompanyIntel(intel);

      addLog(
        'intel',
        `Company Intel Brief generated for ${companyName}`,
        'success',
        'tech_stack_analyzer',
        `Sources consulted: ${intel.sourcesCount}`,
        `Tech Stack: ${intel.techStack.languages.join(', ')} | ${intel.techStack.frameworks.join(', ')}`
      );
    } catch (err: any) {
      addLog('intel', `Company Intel Error: ${err.message}`, 'error');
    } finally {
      setIsIntelLoading(false);
    }
  };

  // --- HANDLER 3: Run Resume Tailor Loop ---
  const handleRunTailorLoop = async () => {
    if (!selectedLead) return;
    setIsTailorLoading(true);

    addLog(
      'tailor',
      'Executing Evaluator-Optimizer Resume Tailor Loop',
      'thought',
      'ats_keyword_matcher',
      `Master Profile: ${candidate.name}, Target Role: ${selectedLead.title}`,
      'Drafting initial ATS resume & checking zero-hallucination guardrail...'
    );

    try {
      const result = await runTailorLoop(candidate, selectedLead, companyIntel || undefined);
      setTailorResult(result);

      addLog(
        'tailor',
        `Evaluator-Optimizer Loop Complete: ATS Score ${result.finalAtsScore}/100, Keywords ${result.keywordMatchPercentage}%`,
        'success',
        'resume_formatting_tool',
        `Iterations: ${result.iterations.length}`,
        `Guardrail Verification: ${result.guardrailStatus}. Zero hallucinated metrics or skills detected.`
      );
    } catch (err: any) {
      addLog('tailor', `Tailor Loop Error: ${err.message}`, 'error');
    } finally {
      setIsTailorLoading(false);
    }
  };

  // --- HANDLER 4: Generate Mock Interview Question ---
  const handleGenerateQuestion = async (qIndex: number) => {
    if (!selectedLead) return;
    setIsQuestionLoading(true);

    addLog(
      'interviewer',
      `Interviewer Agent Generating STAR Question #${qIndex + 1}`,
      'tool_call',
      'star_method_evaluator',
      `Company: ${selectedLead.company}, Title: ${selectedLead.title}`,
      'Synthesizing company intel and STAR rubric expectations...'
    );

    try {
      const turn = await generateInterviewQuestion(
        selectedLead.title,
        selectedLead.company,
        companyIntel || undefined,
        qIndex
      );
      setInterviewTurn(turn);

      addLog(
        'interviewer',
        `Question #${turn.questionNumber} formulated: "${turn.questionText.substring(0, 60)}..."`,
        'info',
        'voice_audio_transcriber',
        `Category: ${turn.category}`,
        `Focus: ${turn.focusArea}`
      );
    } catch (err: any) {
      addLog('interviewer', `Question Generation Error: ${err.message}`, 'error');
    } finally {
      setIsQuestionLoading(false);
    }
  };

  // --- HANDLER 5: Evaluate Answer ---
  const handleEvaluateAnswer = async (userAnswer: string) => {
    if (!interviewTurn) return;
    setIsEvaluatingAnswer(true);

    addLog(
      'interviewer',
      'STAR Evaluator Grading Candidate Answer',
      'thought',
      'star_method_evaluator',
      `User Response: "${userAnswer.substring(0, 80)}..."`,
      'Evaluating Situation/Task, Action, Result metrics, and role relevance...'
    );

    try {
      const evaluation = await evaluateInterviewAnswer(
        interviewTurn.questionText,
        userAnswer,
        interviewTurn.starRubric,
        selectedLead?.title || 'Senior Software Engineer'
      );

      setInterviewTurn((prev) => (prev ? { ...prev, userAnswer, evaluation } : null));

      addLog(
        'interviewer',
        `STAR Answer Evaluation Complete: Score ${evaluation.overallScore}/100`,
        'success',
        'technical_concept_checker',
        `Breakdown: S/T ${evaluation.starScorecard.situationTask}, Action ${evaluation.starScorecard.actionClarity}, Result ${evaluation.starScorecard.resultMetrics}`,
        `Key Improvement: ${evaluation.areasForImprovement[0] || 'None'}`
      );
    } catch (err: any) {
      addLog('interviewer', `Evaluation Error: ${err.message}`, 'error');
    } finally {
      setIsEvaluatingAnswer(false);
    }
  };

  // --- FULL CREW AUTO-PILOT PIPELINE ---
  const handleRunFullCrewPipeline = async () => {
    setCrewState({
      currentAgent: 'scout',
      isExecuting: true,
      activeTaskDescription: 'Scouting & Triaging job leads against hard guardrails...',
      progressPercentage: 10
    });

    addLog('scout', 'Starting Full CrewAI Multi-Agent Pipeline', 'thought');

    // Step 1: Scouting Router
    const leads = await scoutJobs(candidate);
    setJobLeads(leads);
    const topLead = leads.find((l) => l.status !== 'failed_guardrails') || leads[0];
    setSelectedLead(topLead);

    setCrewState({
      currentAgent: 'intel',
      isExecuting: true,
      activeTaskDescription: `Parallel Fan-Out Researching Company Intel for ${topLead.company}...`,
      progressPercentage: 35
    });

    // Step 2: Company Intel Fan-Out
    const intel = await fetchCompanyIntel(topLead.company, topLead.description);
    setCompanyIntel(intel);

    setCrewState({
      currentAgent: 'tailor',
      isExecuting: true,
      activeTaskDescription: 'Running Evaluator-Optimizer Resume & Cover Letter Tailor Loop...',
      progressPercentage: 65
    });

    // Step 3: Evaluator-Optimizer Resume Tailor Loop
    const tailor = await runTailorLoop(candidate, topLead, intel);
    setTailorResult(tailor);

    setCrewState({
      currentAgent: 'interviewer',
      isExecuting: true,
      activeTaskDescription: 'Formulating STAR Mock Interview prep questions...',
      progressPercentage: 90
    });

    // Step 4: Mock Interview Question Generation
    const question = await generateInterviewQuestion(topLead.title, topLead.company, intel, 0);
    setInterviewTurn(question);

    setCrewState({
      currentAgent: 'idle',
      isExecuting: false,
      activeTaskDescription: undefined,
      progressPercentage: 100
    });

    addLog(
      'interviewer',
      'Full CrewAI Multi-Agent Pipeline Execution Successfully Completed!',
      'success'
    );
  };

  // Auto-run initial setup on mount
  useEffect(() => {
    // Generate initial interview question turn if not existing
    if (!interviewTurn && selectedLead) {
      generateInterviewQuestion(selectedLead.title, selectedLead.company, companyIntel || undefined, 0)
        .then((turn) => setInterviewTurn(turn))
        .catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-gray-900 font-sans antialiased flex flex-col selection:bg-gray-900 selection:text-white">
      {/* Header */}
      <Header
        candidate={candidate}
        crewState={crewState}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenVault={() => setIsVaultOpen(true)}
        autoPilot={autoPilot}
        setAutoPilot={setAutoPilot}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Crew Architecture Visualizer Graph */}
        <CrewFlowVisualizer
          crewState={crewState}
          activeAgent={crewState.currentAgent}
          onSelectAgent={(agent) => {
            if (agent === 'scout') setActiveTab('scout');
            if (agent === 'intel') setActiveTab('intel');
            if (agent === 'tailor') setActiveTab('tailor');
            if (agent === 'interviewer') setActiveTab('interview');
          }}
          onRunPipeline={handleRunFullCrewPipeline}
        />

        {/* Tab Views */}
        {activeTab === 'crew-flow' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Active Job Target Lead
                  </h3>
                  <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold rounded uppercase tracking-wider text-gray-500">TARGET</span>
                </div>
                {selectedLead ? (
                  <div className="space-y-2 text-xs text-gray-700">
                    <div className="text-sm font-semibold text-gray-900">{selectedLead.title}</div>
                    <div className="text-gray-500 font-medium">{selectedLead.company} • {selectedLead.location}</div>
                    <div className="text-emerald-600 font-mono font-semibold">{selectedLead.salaryRange}</div>
                    <p className="line-clamp-2 text-gray-500 mt-2">{selectedLead.description}</p>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">No lead selected. Run Scouting Router.</div>
                )}
              </div>

              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Tailored ATS Optimization
                  </h3>
                  <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold rounded uppercase tracking-wider text-gray-500">SCORE</span>
                </div>
                {tailorResult ? (
                  <div className="space-y-2 text-xs text-gray-700">
                    <div className="text-2xl font-bold text-gray-900 font-mono">{tailorResult.finalAtsScore}/100 ATS Score</div>
                    <div>JD Keyword Density: <strong className="text-gray-900">{tailorResult.keywordMatchPercentage}%</strong></div>
                    <div className="text-gray-500">Guardrail Status: <strong className="text-emerald-600">{tailorResult.guardrailStatus}</strong></div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">Run Resume Tailor Loop to generate ATS scores.</div>
                )}
              </div>
            </div>

            {/* Agent Thought Stream */}
            <AgentThoughtLog logs={logs} onClearLogs={() => setLogs([])} />
          </div>
        )}

        {activeTab === 'scout' && (
          <ScoutingAgentView
            candidate={candidate}
            leads={jobLeads}
            onRunScout={handleRunScout}
            isLoading={isScoutingLoading}
            onRouteToIntel={(lead) => {
              setSelectedLead(lead);
              setActiveTab('intel');
              handleResearchCompany(lead.company, lead.description);
            }}
            onRouteToTailor={(lead) => {
              setSelectedLead(lead);
              setActiveTab('tailor');
              handleRunTailorLoop();
            }}
          />
        )}

        {activeTab === 'intel' && (
          <CompanyIntelView
            intel={companyIntel}
            activeLead={selectedLead}
            onResearchCompany={handleResearchCompany}
            isLoading={isIntelLoading}
            onRouteToTailor={() => {
              setActiveTab('tailor');
              handleRunTailorLoop();
            }}
            onRouteToInterview={() => {
              setActiveTab('interview');
              handleGenerateQuestion(0);
            }}
          />
        )}

        {activeTab === 'tailor' && (
          <ResumeTailorView
            candidate={candidate}
            activeLead={selectedLead}
            companyIntel={companyIntel}
            result={tailorResult}
            onRunTailorLoop={handleRunTailorLoop}
            isLoading={isTailorLoading}
            onRouteToInterview={() => {
              setActiveTab('interview');
              handleGenerateQuestion(0);
            }}
          />
        )}

        {activeTab === 'interview' && (
          <MockInterviewView
            candidate={candidate}
            activeLead={selectedLead}
            companyIntel={companyIntel}
            currentTurn={interviewTurn}
            onGenerateQuestion={handleGenerateQuestion}
            onEvaluateAnswer={handleEvaluateAnswer}
            isQuestionLoading={isQuestionLoading}
            isEvaluating={isEvaluatingAnswer}
          />
        )}

        {/* Global Memory Stream in Tab Views */}
        {activeTab !== 'crew-flow' && (
          <div className="pt-4">
            <AgentThoughtLog logs={logs} onClearLogs={() => setLogs([])} />
          </div>
        )}
      </main>

      {/* Candidate Vault Edit Modal */}
      <CandidateVaultModal
        candidate={candidate}
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        onSave={(updated) => {
          setCandidate(updated);
          addLog(
            'scout',
            `Updated Master Candidate Profile (${updated.name})`,
            'info',
            'profile_updater',
            `New Min Salary: $${updated.minSalary}`,
            'Guardrails re-grounded.'
          );
        }}
      />
    </div>
  );
}
