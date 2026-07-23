import React, { useState } from 'react';
import { CandidateProfile, JobLead, CompanyIntel, InterviewQuestionTurn, STARAnswerEvaluation } from '../types';
import { Mic, Volume2, VolumeX, Send, RefreshCw, Award, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, HelpCircle, FileText, ChevronRight } from 'lucide-react';
import { generateTTSAudio } from '../services/api';

interface MockInterviewViewProps {
  candidate: CandidateProfile;
  activeLead: JobLead | null;
  companyIntel: CompanyIntel | null;
  currentTurn: InterviewQuestionTurn | null;
  onGenerateQuestion: (index: number) => void;
  onEvaluateAnswer: (userAnswer: string) => void;
  isQuestionLoading: boolean;
  isEvaluating: boolean;
}

export const MockInterviewView: React.FC<MockInterviewViewProps> = ({
  candidate,
  activeLead,
  companyIntel,
  currentTurn,
  onGenerateQuestion,
  onEvaluateAnswer,
  isQuestionLoading,
  isEvaluating
}) => {
  const [userAnswerInput, setUserAnswerInput] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const handleNextQuestion = () => {
    const nextIdx = questionIndex + 1;
    setQuestionIndex(nextIdx);
    setUserAnswerInput('');
    onGenerateQuestion(nextIdx);
  };

  const handlePlayVoice = async () => {
    if (!currentTurn?.questionText) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    setIsAudioLoading(true);

    try {
      const audioBase64 = await generateTTSAudio(currentTurn.questionText);
      if (audioBase64) {
        // Play PCM / Base64 or Audio Blob
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        audio.onended = () => setIsPlayingAudio(false);
        audio.play();
        setIsPlayingAudio(true);
        setIsAudioLoading(false);
        return;
      }
    } catch (err) {
      console.warn('TTS API error, using SpeechSynthesis fallback:', err);
    }

    // Web Speech API Fallback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentTurn.questionText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
    setIsAudioLoading(false);
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswerInput.trim()) return;
    onEvaluateAnswer(userAnswerInput.trim());
  };

  return (
    <div className="space-y-6">
      {/* Banner Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
                <Mic className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">4. Interview Prep & Mock Simulator Agent (Supervisor Node)</h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Interactive STAR-method mock interview simulator with real-time audio voice questions and rubric-driven scorecards.
            </p>
          </div>

          <button
            onClick={() => onGenerateQuestion(questionIndex)}
            disabled={isQuestionLoading}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isQuestionLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Question...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{currentTurn ? 'Restart Question Turn' : 'Start Mock Interview'}</span>
              </>
            )}
          </button>
        </div>

        {activeLead && (
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-200">Role Context:</span>
            <span className="text-purple-300 font-bold">{activeLead.title}</span> at{' '}
            <span className="text-slate-200 font-semibold">{activeLead.company}</span>
          </div>
        )}
      </div>

      {!currentTurn && !isQuestionLoading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Mic className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm">Click "Start Mock Interview" to launch your first STAR interview question turn.</p>
        </div>
      ) : isQuestionLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-300 space-y-4">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div>
            <h3 className="font-bold text-sm text-white">Interviewer Agent Synthesizing Role Rubric...</h3>
            <p className="text-xs text-slate-400">Formulating a targeted question based on company intelligence and STAR framework.</p>
          </div>
        </div>
      ) : currentTurn ? (
        <div className="space-y-6">
          {/* Question Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold font-mono">
                  Question #{currentTurn.questionNumber}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  {currentTurn.category}
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  Focus: {currentTurn.focusArea}
                </span>
              </div>

              {/* TTS Voice Speaker Toggle */}
              <button
                onClick={handlePlayVoice}
                disabled={isAudioLoading}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-slate-800 text-purple-300 hover:bg-slate-700'
                }`}
              >
                {isAudioLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : isPlayingAudio ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
                <span>{isPlayingAudio ? 'Stop Speaker' : 'Listen Voice'}</span>
              </button>
            </div>

            <h3 className="text-lg font-bold text-white mb-4 leading-snug">
              "{currentTurn.questionText}"
            </h3>

            {/* STAR Rubric Requirement Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
              <div className="font-bold text-purple-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Interviewer Expectation Rubric:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300">
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <strong className="text-purple-400 block mb-0.5">1. Situation & Task:</strong>
                  {currentTurn.starRubric.situationTaskGoal}
                </div>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <strong className="text-purple-400 block mb-0.5">2. Action:</strong>
                  {currentTurn.starRubric.actionRequirement}
                </div>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <strong className="text-purple-400 block mb-0.5">3. Result & Metrics:</strong>
                  {currentTurn.starRubric.resultMetricRequirement}
                </div>
              </div>
            </div>
          </div>

          {/* User Answer Form */}
          <form onSubmit={handleSubmitAnswer} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <label className="block font-bold text-sm text-white mb-2 flex items-center justify-between">
              <span>Your Practice Response (STAR Method)</span>
              <span className="text-xs font-normal text-slate-400">
                Tip: Clearly separate Situation, Task, Action, and Result with quantifiable metrics!
              </span>
            </label>

            <textarea
              rows={6}
              value={userAnswerInput}
              onChange={(e) => setUserAnswerInput(e.target.value)}
              placeholder="Structure your answer using STAR:&#10;&#10;Situation: At my previous company...&#10;Task: I was responsible for...&#10;Action: I designed and implemented...&#10;Result: This reduced operational latency by 38% and scaled throughput to 45k req/sec."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 focus:ring-1 focus:ring-purple-500 outline-none font-sans leading-relaxed"
            />

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                Skip / Next Question
              </button>

              <button
                type="submit"
                disabled={isEvaluating || !userAnswerInput.trim()}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Grading STAR Response...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Evaluate My Answer</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Evaluation Scorecard Display */}
          {currentTurn.evaluation && (
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-2xl space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300">
                    STAR Evaluator Scorecard
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">Response Assessment & Critique</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-3xl font-black font-mono text-purple-400">
                      {currentTurn.evaluation.overallScore}/100
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">STAR Rating</div>
                  </div>
                </div>
              </div>

              {/* STAR Scorecard Bars */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Situation / Task</div>
                  <div className="text-lg font-bold font-mono text-white mt-1">
                    {currentTurn.evaluation.starScorecard.situationTask}/25
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Action Clarity</div>
                  <div className="text-lg font-bold font-mono text-white mt-1">
                    {currentTurn.evaluation.starScorecard.actionClarity}/25
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Result Metrics</div>
                  <div className="text-lg font-bold font-mono text-white mt-1">
                    {currentTurn.evaluation.starScorecard.resultMetrics}/25
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Role Relevance</div>
                  <div className="text-lg font-bold font-mono text-white mt-1">
                    {currentTurn.evaluation.starScorecard.relevanceToRole}/25
                  </div>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Response Strengths
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {currentTurn.evaluation.keyStrengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Actionable Improvements Needed
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {currentTurn.evaluation.areasForImprovement.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Gold Standard STAR Rewrite Sample */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-purple-400" /> Rewritten 100-Point Exemplar Response
                </div>
                <pre className="font-sans text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {currentTurn.evaluation.revisedSTARSample}
                </pre>
              </div>

              {/* Follow up Grilling Question */}
              {currentTurn.evaluation.followUpQuestion && (
                <div className="bg-purple-950/20 border border-purple-500/40 rounded-xl p-4 text-xs text-purple-200">
                  <div className="font-bold text-purple-300 uppercase tracking-wider text-[10px] mb-1">
                    Interviewer Follow-Up Grilling Question:
                  </div>
                  <div className="italic text-slate-200">"{currentTurn.evaluation.followUpQuestion}"</div>
                </div>
              )}

              {/* Next Question Turn */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/25 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>Proceed to Next Question Turn</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
