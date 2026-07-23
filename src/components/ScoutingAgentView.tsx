import React, { useState } from 'react';
import { CandidateProfile, JobLead } from '../types';
import { Search, ShieldAlert, CheckCircle2, XCircle, ArrowRight, DollarSign, MapPin, Building2, Sparkles } from 'lucide-react';

interface ScoutingAgentViewProps {
  candidate: CandidateProfile;
  leads: JobLead[];
  onRunScout: (searchQuery?: string) => void;
  isLoading: boolean;
  onRouteToIntel: (lead: JobLead) => void;
  onRouteToTailor: (lead: JobLead) => void;
}

export const ScoutingAgentView: React.FC<ScoutingAgentViewProps> = ({
  candidate,
  leads,
  onRunScout,
  isLoading,
  onRouteToIntel,
  onRouteToTailor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const filteredLeads = leads.filter((lead) => {
    if (selectedFilter === 'passed') return lead.status !== 'failed_guardrails';
    if (selectedFilter === 'failed') return lead.status === 'failed_guardrails';
    return true;
  });

  const passedCount = leads.filter((l) => l.status !== 'failed_guardrails').length;
  const failedCount = leads.filter((l) => l.status === 'failed_guardrails').length;

  return (
    <div className="space-y-6">
      {/* Top Description Card */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Router Node</span>
                <h2 className="text-lg font-semibold text-gray-900">Scouting & Triage Agent</h2>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl">
              Discovers role opportunities, evaluates fit against candidate profile, enforces hard criteria guardrails, and routes viable leads.
            </p>
          </div>

          {/* Active Guardrail Badge */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <div className="font-semibold text-gray-900 text-[11px]">Active Hard Guardrails:</div>
              <div className="text-[11px] text-gray-500 font-medium">
                Min Salary: <span className="text-emerald-600 font-mono font-bold">${(candidate.minSalary / 1000).toFixed(0)}k</span> • Auth: <span className="text-gray-900 font-semibold">{candidate.workAuthorization.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search roles e.g. Senior AI Platform Engineer, Staff Software Engineer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all font-medium"
            />
          </div>
          <button
            onClick={() => onRunScout(searchQuery)}
            disabled={isLoading}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs rounded-2xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>{isLoading ? 'Scouting Leads...' : 'Run Scouting Router'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Lead Counter */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200/80 rounded-2xl p-1 text-xs">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all ${
              selectedFilter === 'all' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            All Leads ({leads.length})
          </button>
          <button
            onClick={() => setSelectedFilter('passed')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
              selectedFilter === 'passed' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Passed Guardrails ({passedCount})
          </button>
          <button
            onClick={() => setSelectedFilter('failed')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
              selectedFilter === 'failed' ? 'bg-white text-amber-700 shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-amber-600" />
            Guardrail Failures ({failedCount})
          </button>
        </div>

        <div className="text-xs text-gray-400 font-mono hidden sm:block">
          Candidate Target: {candidate.targetTitles[0]}
        </div>
      </div>

      {/* Job Lead Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredLeads.map((lead) => {
          const isFailed = lead.status === 'failed_guardrails';

          return (
            <div
              key={lead.id}
              className={`rounded-3xl border p-5 transition-all relative overflow-hidden ${
                isFailed
                  ? 'bg-amber-50/30 border-amber-200 text-gray-800'
                  : 'bg-white border-gray-200/80 hover:border-gray-300 text-gray-900 shadow-xs'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-2xl ${isFailed ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-900 text-white'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-gray-900 flex items-center gap-2">
                      {lead.title}
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        {lead.company}
                      </span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {lead.location} ({lead.workType})
                      </span>
                      <span className="flex items-center gap-1 font-mono text-emerald-600 font-semibold">
                        <DollarSign className="w-3.5 h-3.5" />
                        {lead.salaryRange}
                      </span>
                      <span className="text-gray-400">• Posted {lead.postedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Match Score Badge */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className={`text-right ${isFailed ? 'text-amber-600' : 'text-emerald-600'}`}>
                    <div className="text-lg font-bold font-mono leading-none">
                      {lead.matchScore}%
                    </div>
                    <div className="text-[10px] text-gray-400 font-sans">Role Match</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-2">
                {lead.description}
              </p>

              {/* Match Reasoning or Guardrail Failure */}
              {isFailed ? (
                <div className="bg-amber-100/60 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 mb-4 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">Guardrail Failure Reason:</div>
                    <div className="mt-0.5 font-medium">{lead.rejectionReason || lead.matchReasoning}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-xs text-gray-700 mb-4 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-gray-900 uppercase tracking-wider text-[10px]">Triage Analysis & Match Fit:</div>
                    <div className="mt-0.5 text-gray-600 font-medium">{lead.matchReasoning}</div>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              {!isFailed && (
                <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={lead.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-gray-500 hover:text-gray-900 underline font-medium"
                  >
                    View Original Listing ({lead.source})
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRouteToIntel(lead)}
                      className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span>Route to Company Intel</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRouteToTailor(lead)}
                      className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <span>Route to Resume Tailor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

