import React, { useState } from 'react';
import { AgentLog } from '../types';
import { Terminal, Shield, Wrench, ArrowRightLeft, Sparkles, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface AgentThoughtLogProps {
  logs: AgentLog[];
  onClearLogs: () => void;
}

export const AgentThoughtLog: React.FC<AgentThoughtLogProps> = ({ logs, onClearLogs }) => {
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = logs.filter(
    (log) => filterAgent === 'all' || log.agent === filterAgent
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-xs">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-700" />
          <h3 className="font-semibold text-sm text-gray-900 tracking-tight">Agent Execution & Memory Stream</h3>
          <span className="text-[10px] font-mono bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">
            {logs.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Agent */}
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl px-2.5 py-1 focus:ring-1 focus:ring-gray-900 outline-none font-medium"
          >
            <option value="all">All Agents</option>
            <option value="scout">Scouting Agent</option>
            <option value="intel">Company Intel Agent</option>
            <option value="tailor">Tailor Agent</option>
            <option value="interviewer">Mock Interviewer</option>
          </select>

          <button
            onClick={onClearLogs}
            className="text-xs text-gray-500 hover:text-gray-900 px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors font-medium cursor-pointer"
          >
            Clear Stream
          </button>
        </div>
      </div>

      {/* Logs Stream */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-400 italic text-xs font-sans">
            No agent memory logs recorded yet. Execute an agent action or full crew pipeline.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedId === log.id;

            return (
              <div
                key={log.id}
                className={`rounded-2xl border transition-all p-3 ${
                  log.type === 'guardrail'
                    ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                    : log.type === 'handoff'
                    ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                    : log.type === 'tool_call'
                    ? 'bg-gray-50/80 border-gray-200 text-gray-800'
                    : 'bg-white border-gray-200/80 text-gray-800'
                }`}
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {/* Log Type Icon */}
                    {log.type === 'guardrail' && <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />}
                    {log.type === 'handoff' && <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                    {log.type === 'tool_call' && <Wrench className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />}
                    {log.type === 'thought' && <Sparkles className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />}
                    {log.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                    {log.type === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />}

                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
                      {log.agent}
                    </span>

                    <span className="font-semibold text-gray-900 truncate">{log.action}</span>

                    {log.toolUsed && (
                      <span className="text-[10px] font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 hidden sm:inline">
                        tool: {log.toolUsed}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-mono">{log.timestamp}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200/80 space-y-2 text-[11px]">
                    {log.inputSnippet && (
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Input Snippet:</div>
                        <pre className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-gray-800 overflow-x-auto whitespace-pre-wrap">
                          {log.inputSnippet}
                        </pre>
                      </div>
                    )}

                    {log.outputSnippet && (
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase font-bold mb-1">
                          <span>Output & Memory State:</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(log.outputSnippet!, log.id);
                            }}
                            className="text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer font-sans"
                          >
                            {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === log.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="bg-gray-900 p-3 rounded-xl border border-gray-800 text-gray-200 overflow-x-auto whitespace-pre-wrap max-h-48">
                          {log.outputSnippet}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

