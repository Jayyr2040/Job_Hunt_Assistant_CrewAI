import React from 'react';
import { CandidateProfile, CrewExecutionState } from '../types';
import { Bot, UserCheck, Sparkles, Sliders, Activity, Workflow } from 'lucide-react';

interface HeaderProps {
  candidate: CandidateProfile;
  crewState: CrewExecutionState;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenVault: () => void;
  autoPilot: boolean;
  setAutoPilot: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  candidate,
  crewState,
  activeTab,
  setActiveTab,
  onOpenVault,
  autoPilot,
  setAutoPilot
}) => {
  return (
    <header className="bg-white border-b border-gray-200 text-gray-900 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 pt-2">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-xl text-white font-bold flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase block leading-tight">
                Multi-Agent Orchestrator
              </span>
              <h1 className="text-xl font-light text-gray-900 tracking-tight flex items-center gap-1.5">
                JobHunt<span className="font-bold text-gray-900">OS</span>
                <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold rounded uppercase tracking-wider text-gray-600 border border-gray-200 ml-1">
                  CrewAI
                </span>
              </h1>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-6 text-xs font-medium">
            {/* System Health Status Indicator */}
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-gray-400 uppercase text-[9px] tracking-widest mb-0.5">System Health</span>
              <div className="flex items-center space-x-1.5 text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>4 Agents Ready</span>
              </div>
            </div>

            <div className="hidden lg:block h-8 w-[1px] bg-gray-200"></div>

            {/* Candidate Vault Button */}
            <button
              onClick={onOpenVault}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-gray-800 transition-all cursor-pointer group"
              title="Click to view & edit Master Candidate Profile"
            >
              <UserCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-semibold text-gray-900 leading-none">{candidate.name}</div>
                <div className="text-[10px] text-gray-500 leading-none mt-1">
                  ${(candidate.minSalary / 1000).toFixed(0)}k+ Min • {candidate.workAuthorization.split(' ')[0]}
                </div>
              </div>
              <Sliders className="w-3.5 h-3.5 text-gray-400 ml-1 group-hover:text-gray-700" />
            </button>

            {/* Mode Switcher Pill */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200/80">
              <button
                onClick={() => setAutoPilot(true)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  autoPilot
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Auto-Pilot: Run full crew pipeline end-to-end automatically"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Crew Auto-Pilot</span>
              </button>
              <button
                onClick={() => setAutoPilot(false)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  !autoPilot
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Interactive Mode: Inspect and trigger each agent individually"
              >
                <Workflow className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Interactive</span>
              </button>
            </div>
          </div>
        </div>

        {/* Minimalist Tabs */}
        <div className="flex space-x-1 border-t border-gray-100 pt-2 pb-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('crew-flow')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'crew-flow'
                ? 'bg-gray-900 text-white font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Crew Architecture
          </button>
          <button
            onClick={() => setActiveTab('scout')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'scout'
                ? 'bg-gray-900 text-white font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            1. Scouting & Triage
          </button>
          <button
            onClick={() => setActiveTab('intel')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'intel'
                ? 'bg-gray-900 text-white font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            2. Company Intel
          </button>
          <button
            onClick={() => setActiveTab('tailor')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'tailor'
                ? 'bg-gray-900 text-white font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            3. Resume Tailor Loop
          </button>
          <button
            onClick={() => setActiveTab('interview')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'interview'
                ? 'bg-gray-900 text-white font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            4. STAR Mock Coach
          </button>
        </div>
      </div>
    </header>
  );
};

