import React, { useState } from 'react';
import { CandidateProfile, JobLead, CompanyIntel, TailoredAssetResult } from '../types';
import { FileCheck2, ShieldCheck, RefreshCw, Copy, Check, Download, Sparkles, ArrowRight, TrendingUp, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface ResumeTailorViewProps {
  candidate: CandidateProfile;
  activeLead: JobLead | null;
  companyIntel: CompanyIntel | null;
  result: TailoredAssetResult | null;
  onRunTailorLoop: () => void;
  isLoading: boolean;
  onRouteToInterview: () => void;
}

export const ResumeTailorView: React.FC<ResumeTailorViewProps> = ({
  candidate,
  activeLead,
  companyIntel,
  result,
  onRunTailorLoop,
  isLoading,
  onRouteToInterview
}) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'cover' | 'loop'>('resume');
  const [copiedResume, setCopiedResume] = useState(false);
  const [copiedCover, setCopiedCover] = useState(false);

  const handleCopy = (text: string, type: 'resume' | 'cover') => {
    navigator.clipboard.writeText(text);
    if (type === 'resume') {
      setCopiedResume(true);
      setTimeout(() => setCopiedResume(false), 2000);
    } else {
      setCopiedCover(true);
      setTimeout(() => setCopiedCover(false), 2000);
    }
  };

  const handleDownloadMarkdown = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-emerald-400">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">3. Resume & Cover Letter Tailor Agent (Evaluator-Optimizer Loop)</h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Customizes master candidate experience bullets to match target role ATS keywords while enforcing zero hallucination guardrails.
            </p>
          </div>

          <button
            onClick={onRunTailorLoop}
            disabled={isLoading || !activeLead}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Evaluator-Optimizer Loop...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Tailor Loop</span>
              </>
            )}
          </button>
        </div>

        {activeLead && (
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <span className="font-semibold text-slate-200">Target Role:</span>
            <span className="text-emerald-300 font-bold">{activeLead.title}</span> at{' '}
            <span className="text-slate-200 font-semibold">{activeLead.company}</span>
          </div>
        )}
      </div>

      {!result && !isLoading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm">Select a job lead and click "Run Tailor Loop" to execute the Evaluator-Optimizer Node.</p>
        </div>
      ) : isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-300 space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div>
            <h3 className="font-bold text-sm text-white">Executing Evaluator-Optimizer Iterations...</h3>
            <p className="text-xs text-slate-400">
              Drafting initial asset -&gt; Evaluating ATS keywords & guardrails -&gt; Refining until ATS Score &gt;= 94.
            </p>
          </div>
        </div>
      ) : result ? (
        <div className="space-y-6">
          {/* Loop Metrics Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">{result.finalAtsScore}/100</div>
                <div className="text-[11px] text-slate-400">Final ATS Optimization</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">{result.keywordMatchPercentage}%</div>
                <div className="text-[11px] text-slate-400">JD Keyword Match</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">{result.iterations.length}</div>
                <div className="text-[11px] text-slate-400">Optimizer Cycles</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{result.guardrailStatus}</div>
                <div className="text-[11px] text-slate-400">Zero-Hallucination Guardrail</div>
              </div>
            </div>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('resume')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'resume'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Tailored ATS Resume
              </button>
              <button
                onClick={() => setActiveTab('cover')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'cover'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Tailored Cover Letter
              </button>
              <button
                onClick={() => setActiveTab('loop')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'loop'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Evaluator-Optimizer Iteration Logs
              </button>
            </div>

            <button
              onClick={onRouteToInterview}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-purple-600/20 cursor-pointer hidden sm:flex"
            >
              <span>Pass Assets to Mock Interview Simulator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Content 1: Tailored Resume */}
          {activeTab === 'resume' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300">ATS Optimized Resume (Markdown Format)</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(result.tailoredResumeMarkdown, 'resume')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedResume ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedResume ? 'Copied!' : 'Copy Resume'}</span>
                  </button>
                  <button
                    onClick={() => handleDownloadMarkdown(`${result.company}_Resume.md`, result.tailoredResumeMarkdown)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md</span>
                  </button>
                </div>
              </div>

              <pre className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                {result.tailoredResumeMarkdown}
              </pre>
            </div>
          )}

          {/* Tab Content 2: Cover Letter */}
          {activeTab === 'cover' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300">Targeted Cover Letter</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(result.coverLetterMarkdown, 'cover')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCover ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCover ? 'Copied!' : 'Copy Cover Letter'}</span>
                  </button>
                  <button
                    onClick={() => handleDownloadMarkdown(`${result.company}_Cover_Letter.md`, result.coverLetterMarkdown)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md</span>
                  </button>
                </div>
              </div>

              <pre className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                {result.coverLetterMarkdown}
              </pre>
            </div>
          )}

          {/* Tab Content 3: Evaluator-Optimizer Log */}
          {activeTab === 'loop' && (
            <div className="space-y-4">
              {result.iterations.map((iter) => (
                <div key={iter.version} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 text-xs font-bold">
                        Iteration #{iter.version}
                      </span>
                      <h4 className="font-bold text-sm text-white">Evaluator Scorecard</h4>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span>ATS Score: <strong className={iter.atsScore >= 90 ? 'text-emerald-400' : 'text-amber-400'}>{iter.atsScore}/100</strong></span>
                      <span>Keywords: <strong className="text-indigo-300">{iter.keywordMatchPercentage}%</strong></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Evaluator Strengths Identified
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {iter.feedback.strengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Optimizer Suggestions
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {iter.feedback.improvementSuggestions.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
