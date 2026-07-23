import React from 'react';
import { AgentRole, CrewExecutionState } from '../types';
import { Search, Building2, FileCheck2, Mic, ArrowRight, ShieldCheck, Cpu, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface CrewFlowVisualizerProps {
  crewState: CrewExecutionState;
  activeAgent: AgentRole | 'idle';
  onSelectAgent: (agent: AgentRole) => void;
  onRunPipeline: () => void;
}

export const CrewFlowVisualizer: React.FC<CrewFlowVisualizerProps> = ({
  crewState,
  activeAgent,
  onSelectAgent,
  onRunPipeline
}) => {
  const agents = [
    {
      id: 'scout' as AgentRole,
      title: 'Scouting & Triage Agent',
      nodeType: 'Router Node',
      role: 'Discovers target leads matching criteria & enforces hard salary/visa guardrails.',
      tools: ['job_board_search', 'salary_benchmark_lookup', 'agent_handoff_tool'],
      guardrail: 'Hard salary & authorization filter',
      color: 'blue',
      badgeClass: 'bg-blue-50 text-blue-600 border-blue-100',
      icon: Search
    },
    {
      id: 'intel' as AgentRole,
      title: 'Company Intel Agent',
      nodeType: 'Research Node',
      role: 'Gathers research on tech stack, corporate news, culture & candidate questions.',
      tools: ['web_search_engine', 'glassdoor_scraper', 'tech_stack_analyzer'],
      guardrail: 'Fact-verified source filtering',
      color: 'amber',
      badgeClass: 'bg-amber-50 text-amber-600 border-amber-100',
      icon: Building2
    },
    {
      id: 'tailor' as AgentRole,
      title: 'Resume & Cover Tailor',
      nodeType: 'Optimizer Node',
      role: 'Tailors resume experience bullets to target ATS keywords with zero hallucination.',
      tools: ['resume_formatter', 'ats_keyword_matcher', 'jd_parser'],
      guardrail: 'Zero-hallucination metric rule',
      color: 'emerald',
      badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      icon: FileCheck2
    },
    {
      id: 'interviewer' as AgentRole,
      title: 'STAR Mock Coach',
      nodeType: 'Coach Node',
      role: 'Simulates interactive STAR mock interviews with real-time feedback & voice output.',
      tools: ['star_evaluator', 'concept_checker', 'voice_tts_synthesis'],
      guardrail: 'Strict STAR rubric scoring',
      color: 'purple',
      badgeClass: 'bg-purple-50 text-purple-600 border-purple-100',
      icon: Mic
    }
  ];

  return (
    <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs relative overflow-hidden">
      <div className="relative z-10">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Architecture</span>
              <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold rounded uppercase tracking-wider text-gray-600">v2.4.1</span>
            </div>
            <h2 className="text-xl font-light text-gray-900 tracking-tight mt-0.5">
              Multi-Agent <span className="font-semibold">Orchestration Graph</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Sequential 4-agent pipeline with memory handoffs, evaluator-optimizer loops, and safety guardrails.
            </p>
          </div>

          <button
            onClick={onRunPipeline}
            disabled={crewState.isExecuting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {crewState.isExecuting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Executing Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Run Full Crew Pipeline</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Bar if Executing */}
        {crewState.isExecuting && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-3.5">
            <div className="flex justify-between items-center text-xs text-gray-700 mb-2">
              <span className="font-semibold text-gray-900 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                Active Task: {crewState.activeTaskDescription || 'Processing...'}
              </span>
              <span className="font-mono font-bold text-gray-900">{crewState.progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gray-900 h-full transition-all duration-500 rounded-full"
                style={{ width: `${crewState.progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Agent Cards Graph Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {agents.map((agent, index) => {
            const Icon = agent.icon;
            const isActive = activeAgent === agent.id;
            const isCompleted = crewState.progressPercentage >= (index + 1) * 25;

            return (
              <div
                key={agent.id}
                onClick={() => onSelectAgent(agent.id)}
                className={`relative rounded-2xl border p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-white border-gray-900 shadow-md ring-1 ring-gray-900'
                    : isCompleted
                    ? 'bg-gray-50/80 border-gray-200 hover:border-gray-400'
                    : 'bg-white border-gray-200/80 hover:border-gray-300'
                }`}
              >
                {/* Connector Arrow for Desktop */}
                {index < agents.length - 1 && (
                  <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-20">
                    <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shadow-2xs">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                )}

                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`p-2 rounded-xl border ${agent.badgeClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200/60">
                        {agent.nodeType}
                      </span>
                      {isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-1" />
                      )}
                    </div>
                  </div>

                  {/* Agent Title */}
                  <h3 className="font-semibold text-sm text-gray-900 leading-tight mb-1">
                    {agent.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">
                    {agent.role}
                  </p>
                </div>

                <div>
                  {/* Tools list */}
                  <div className="mb-3">
                    <div className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-1.5 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-gray-400" />
                      Agent Tools:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {agent.tools.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-mono bg-gray-50 border border-gray-200/80 text-gray-600 px-1.5 py-0.5 rounded-md"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Guardrail */}
                  <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span className="truncate">{agent.guardrail}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

