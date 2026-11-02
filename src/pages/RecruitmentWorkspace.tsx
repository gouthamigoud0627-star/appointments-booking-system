/**
 * Recruitment and HR Mode (/recruitment)
 * Multi-stage candidate hiring pipelines, panel scheduling, interviewer availability,
 * and strictly confidential interviewer feedback forms (never exposed to candidates).
 */

import React, { useState } from 'react';
import {
  Briefcase,
  Users,
  Calendar,
  Clock,
  Star,
  ShieldCheck,
  PlusCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Filter,
  FileText,
  UserCheck,
} from 'lucide-react';
import { UniversalSchedulingService, InterviewProcess } from '../lib/universalScheduling';

export default function RecruitmentWorkspace() {
  const activeOrg = UniversalSchedulingService.getActiveOrganization();
  const [interviews, setInterviews] = useState<InterviewProcess[]>(() =>
    UniversalSchedulingService.getInterviewProcesses(activeOrg.id)
  );

  const [selectedProcess, setSelectedProcess] = useState<InterviewProcess>(interviews[0] || null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [rating, setRating] = useState(5);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [recommendation, setRecommendation] = useState<any>('strong_hire');
  const [feedbackToast, setFeedbackToast] = useState(false);

  const reloadData = () => {
    const list = UniversalSchedulingService.getInterviewProcesses(activeOrg.id);
    setInterviews(list);
    if (selectedProcess) {
      const refreshed = list.find((p) => p.id === selectedProcess.id);
      if (refreshed) setSelectedProcess(refreshed);
    }
  };

  const handleOpenFeedback = (stageId: string) => {
    setSelectedStageId(stageId);
    setFeedbackNotes('');
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProcess || !selectedStageId) return;

    UniversalSchedulingService.submitInterviewFeedback(selectedProcess.id, selectedStageId, {
      interviewerId: 'user-interviewer',
      interviewerName: 'Dr. Marcus Chen',
      rating,
      notes: feedbackNotes,
      recommendation,
      submittedAt: new Date().toISOString(),
    });

    setShowFeedbackModal(false);
    reloadData();
    setFeedbackToast(true);
    setTimeout(() => setFeedbackToast(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Toast */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Confidential feedback saved and secured!</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
          <Briefcase className="w-3.5 h-3.5" />
          <span>Recruitment & HR Scheduling Workspace</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Candidate Interview Pipelines
        </h1>
        <p className="text-xs sm:text-sm text-purple-200 max-w-2xl leading-relaxed">
          Manage multi-stage hiring processes (Screening, Technical Round, Panel Interviews),
          coordinate interviewer schedules, and submit private interviewer scorecards.
        </p>
      </div>

      {/* Main Grid: Pipeline on Left, Selected Process Detail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Candidates List */}
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
            Active Candidates ({interviews.length})
          </h2>

          <div className="space-y-2">
            {interviews.map((proc) => (
              <button
                key={proc.id}
                type="button"
                onClick={() => setSelectedProcess(proc)}
                className={`w-full text-left p-4 rounded-2xl border transition-all text-xs space-y-2 ${
                  selectedProcess?.id === proc.id
                    ? 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-400 dark:border-purple-700 shadow-xs'
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{proc.candidateName}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                    {proc.currentStage}
                  </span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">Position: {proc.jobTitle}</div>
                <div className="text-[11px] font-mono text-slate-400">{proc.candidateEmail}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Selected Candidate Stage Pipeline & Private Feedback */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProcess ? (
            <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {selectedProcess.candidateName}
                  </h3>
                  <p className="text-xs text-slate-500">Requisition: {selectedProcess.jobTitle}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Status: {selectedProcess.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Multi-Stage Pipeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Interview Stage Progression
                </h4>

                <div className="space-y-3">
                  {selectedProcess.stages.map((stage, idx) => (
                    <div
                      key={stage.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                            {stage.stageOrder}
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {stage.stageName}
                          </span>
                          <span className="text-slate-400">({stage.duration} mins)</span>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            stage.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {stage.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Panel: {stage.interviewerNames.join(', ')}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenFeedback(stage.id)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Submit Confidential Scorecard</span>
                          </button>
                        </div>
                      </div>

                      {/* Display Confidential Feedback (Restricted to hiring team) */}
                      {stage.feedback && stage.feedback.length > 0 && (
                        <div className="mt-2 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-purple-900 dark:text-purple-200">
                            <span className="flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-purple-600" />
                              <span>Interviewer Scorecard (Hidden from Candidate)</span>
                            </span>
                            <span className="capitalize px-2 py-0.2 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100">
                              {stage.feedback[0].recommendation.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= stage.feedback![0].rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-[11px] text-purple-950 dark:text-purple-100 italic">
                            "{stage.feedback[0].notes}"
                          </p>
                          <div className="text-[10px] text-purple-700 dark:text-purple-300">
                            Evaluated by {stage.feedback[0].interviewerName}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 text-xs text-slate-500">
              Select a candidate to review interview pipeline.
            </div>
          )}
        </div>
      </div>

      {/* Confidential Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                  Strictly Confidential Scorecard
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Submit Interviewer Evaluation
                </h3>
              </div>
              <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Technical & Cultural Rating (1-5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRating(val)}
                      className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center border transition-all ${
                        rating === val
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {val}★
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Overall Hiring Recommendation</label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="strong_hire">Strong Hire</option>
                  <option value="hire">Hire</option>
                  <option value="neutral">Neutral / Hold</option>
                  <option value="no_hire">No Hire</option>
                  <option value="strong_no_hire">Strong No Hire</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Private Interviewer Notes *</span>
                  <span className="text-[10px] text-slate-400">Guaranteed RLS protected</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Record strengths, code review impressions, algorithmic rigor, and team fit..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
