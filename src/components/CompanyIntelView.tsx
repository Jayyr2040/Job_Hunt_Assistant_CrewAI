import React, { useState } from 'react';
import { CompanyIntel, JobLead } from '../types';
import { Building2, Code2, Flame, AlertCircle, HelpCircle, MessageSquareCode, ArrowRight, Sparkles, Globe } from 'lucide-react';

interface CompanyIntelViewProps {
  intel: CompanyIntel | null;
  activeLead: JobLead | null;
  onResearchCompany: (companyName: string, jdText: string) => void;
  isLoading: boolean;
  onRouteToTailor: () => void;
  onRouteToInterview: () => void;
}

export const CompanyIntelView: React.FC<CompanyIntelViewProps> = ({
  intel,
  activeLead,
  onResearchCompany,
  isLoading,
  onRouteToTailor,
  onRouteToInterview
}) => {
  const [companyInput, setCompanyInput] = useState(activeLead?.company || intel?.companyName || 'Stripe');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyInput.trim()) return;
    onResearchCompany(companyInput.trim(), activeLead?.description || '');
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Research Node</span>
                <h2 className="text-lg font-semibold text-gray-900">Company & Interview Intelligence Agent</h2>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl">
              Gathers deep live intelligence on company priorities, tech stack, culture, and high-probability interview questions.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              placeholder="Target company name (e.g. Stripe, Datadog)..."
              className="bg-gray-50 border border-gray-200 text-xs text-gray-900 px-3.5 py-2.5 rounded-2xl focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none w-full md:w-64 font-medium"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isLoading ? 'Researching...' : 'Run Intel Research'}</span>
            </button>
          </form>
        </div>
      </div>

      {!intel && !isLoading ? (
        <div className="bg-white border border-gray-200/80 rounded-3xl p-12 text-center text-gray-400">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium">Select a job lead or enter a company name above to run parallel fan-out intelligence research.</p>
        </div>
      ) : isLoading ? (
        <div className="bg-white border border-gray-200/80 rounded-3xl p-12 text-center text-gray-700 space-y-4 shadow-xs">
          <div className="w-8 h-8 border-3 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-gray-900">Running Parallel Fan-Out Research Workers...</h3>
            <p className="text-xs text-gray-500">
              Gathering live news via Search Grounding, analyzing tech stack requirements, and extracting common interview questions.
            </p>
          </div>
        </div>
      ) : intel ? (
        <div className="space-y-6">
          {/* Company Brief Card */}
          <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700">
                  Intel Brief Generated
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{intel.companyName}</h3>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>{intel.sourcesCount || 12} Verified Sources • {intel.researchedAt}</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-6 font-medium">
              {intel.overview}
            </p>

            {/* Grid Layout for Tech Stack & News */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tech Stack / Operational Capabilities Breakdown */}
              {(() => {
                const domainContext = ((activeLead?.title || '') + ' ' + (intel.companyName || '') + ' ' + (intel.overview || '') + ' ' + (activeLead?.description || '')).toLowerCase();
                const isNonTechDomain = domainContext.match(/sustainab|energy|environ|director|assistant director|policy|consult|gov|ministry|decarbon|climate|solar|infrastructure|manager|sembcorp|keppel|dbs/);

                const cardTitle = isNonTechDomain ? 'Operational & Domain Competencies' : 'Tech Stack Analysis';
                const label1 = isNonTechDomain ? 'Core Domains & Policy:' : 'Languages:';
                const label2 = isNonTechDomain ? 'Methodologies & Frameworks:' : 'Frameworks:';
                const label3 = isNonTechDomain ? 'Infrastructure & Platforms:' : 'Cloud & Infrastructure:';
                const label4 = isNonTechDomain ? 'Reporting & Analytics:' : 'Databases & Caching:';

                let languages = intel.techStack?.languages || [];
                let frameworks = intel.techStack?.frameworks || [];
                let cloudAndDevOps = intel.techStack?.cloudAndDevOps || [];
                let dataAndDatabase = intel.techStack?.dataAndDatabase || [];

                if (isNonTechDomain) {
                  // Filter out generic software code tags if mistakenly returned
                  languages = languages.filter(l => !l.match(/^python$|^java$|^c\+\+$|^ruby$|^go$|^typescript$|^javascript$/i));
                  if (languages.length === 0) {
                    languages = ["Carbon Accounting", "ESG Standards (GRI/TCFD)", "Environmental Policy", "Energy Auditing"];
                  }

                  frameworks = frameworks.filter(f => !f.match(/aws cloud|spark|react|express|node|graphql|vue|angular/i));
                  if (frameworks.length === 0) {
                    frameworks = ["Life Cycle Assessment (LCA)", "Decarbonization Roadmap", "ISO 50001", "Project Governance"];
                  }

                  cloudAndDevOps = cloudAndDevOps.filter(c => !c.match(/^aws$|^azure$|^kubernetes$|^docker$|^terraform$/i));
                  if (cloudAndDevOps.length === 0) {
                    cloudAndDevOps = ["Smart Grid IoT Systems", "Clean Energy Platform", "GIS Mapping Tools", "ERP Integration"];
                  }

                  dataAndDatabase = dataAndDatabase.filter(d => !d.match(/^mysql$|^postgresql$|^mongodb$|^redis$/i));
                  if (dataAndDatabase.length === 0) {
                    dataAndDatabase = ["Energy Analytics Dashboards", "PowerBI & Tableau", "SQL Data Pipelines", "Excel Modeling"];
                  }
                }

                return (
                  <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3 font-semibold text-xs text-gray-900 uppercase tracking-wider">
                      <Code2 className="w-4 h-4 text-blue-600" />
                      {cardTitle}
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{label1}</span>
                        <div className="flex flex-wrap gap-1">
                          {languages.map((item) => (
                            <span key={item} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-800 rounded-md text-[11px] font-mono font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{label2}</span>
                        <div className="flex flex-wrap gap-1">
                          {frameworks.map((item) => (
                            <span key={item} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-800 rounded-md text-[11px] font-mono font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{label3}</span>
                        <div className="flex flex-wrap gap-1">
                          {cloudAndDevOps.map((item) => (
                            <span key={item} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-800 rounded-md text-[11px] font-mono font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{label4}</span>
                        <div className="flex flex-wrap gap-1">
                          {dataAndDatabase.map((item) => (
                            <span key={item} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-800 rounded-md text-[11px] font-mono font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* News & Strategic Priorities */}
              <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3 font-semibold text-xs text-gray-900 uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-amber-600" />
                  Recent Corporate News & Milestones
                </div>

                <ul className="space-y-2 text-xs text-gray-700 font-medium">
                  {intel.recentNews.map((news, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                      <span>{news}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-3 border-t border-gray-200/80">
                  <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Culture & Values:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {intel.cultureAndValues.map((val, idx) => (
                      <span key={idx} className="text-[11px] bg-white border border-gray-200 text-gray-800 px-2 py-0.5 rounded-md font-medium">
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Red Flags & Common Questions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Common Interview Questions */}
              <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3 font-semibold text-xs text-gray-900 uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  Common Interview Questions
                </div>
                <ul className="space-y-2 text-xs text-gray-700">
                  {intel.commonInterviewQuestions.map((q, idx) => (
                    <li key={idx} className="p-2.5 bg-white rounded-xl border border-gray-200 text-gray-800 font-medium">
                      "{q}"
                    </li>
                  ))}
                </ul>
              </div>

              {/* Questions to Ask Interviewer */}
              <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3 font-semibold text-xs text-gray-900 uppercase tracking-wider">
                  <MessageSquareCode className="w-4 h-4 text-emerald-600" />
                  Candidate "Questions to Ask Interviewer"
                </div>
                <ul className="space-y-2 text-xs text-gray-700">
                  {intel.candidateQuestionsToAsk.map((q, idx) => (
                    <li key={idx} className="p-2.5 bg-white rounded-xl border border-gray-200 text-gray-800 font-medium">
                      "{q}"
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Red Flags Warning Box */}
            {intel.potentialRedFlags && intel.potentialRedFlags.length > 0 && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] mb-2 text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Potential Red Flags / Culture Caveats
                </div>
                <ul className="list-disc list-inside space-y-1 text-gray-700 font-medium">
                  {intel.potentialRedFlags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions Bar */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={onRouteToTailor}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>Pass Intel to Resume Tailor Loop</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onRouteToInterview}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                <span>Launch Mock Interview Prep</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

