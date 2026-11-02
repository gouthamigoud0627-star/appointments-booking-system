/**
 * Tasks and Follow-ups (/tasks)
 * Implements Section 8.D: Decision-to-Action Tracking.
 * Records meeting decisions, assignable follow-up action items, due dates, priority, and completion status.
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  User,
  Calendar,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  Check,
} from 'lucide-react';
import { UniversalSchedulingService, FollowUpTask, Meeting } from '../lib/universalScheduling';

export default function TasksFollowUps() {
  const activeOrg = UniversalSchedulingService.getActiveOrganization();
  const [tasks, setTasks] = useState<FollowUpTask[]>(() => UniversalSchedulingService.getTasks(activeOrg.id));
  const meetings = UniversalSchedulingService.getMeetings(activeOrg.id);

  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToName, setAssignedToName] = useState('Dr. Marcus Chen');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<any>('high');
  const [relatedMeetingId, setRelatedMeetingId] = useState(meetings[0]?.id || '');

  // AI Action Extraction state
  const [aiNotes, setAiNotes] = useState('');
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiProposedTasks, setAiProposedTasks] = useState<any[]>([]);

  const reloadTasks = () => {
    setTasks(UniversalSchedulingService.getTasks(activeOrg.id));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleStatus = (task: FollowUpTask) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    UniversalSchedulingService.updateTaskStatus(task.id, nextStatus);
    reloadTasks();
    showToast(nextStatus === 'completed' ? 'Task marked complete!' : 'Task reopened');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const relatedMeeting = meetings.find((m) => m.id === relatedMeetingId);
    UniversalSchedulingService.createTask({
      organizationId: activeOrg.id,
      meetingId: relatedMeetingId || undefined,
      meetingTitle: relatedMeeting?.title,
      title: title.trim(),
      description: description.trim(),
      assignedTo: 'user-assignee',
      assignedToName,
      dueDate,
      priority,
      status: 'pending',
    });

    setTitle('');
    setDescription('');
    setShowAddModal(false);
    reloadTasks();
    showToast('Follow-up task created and assigned.');
  };

  // AI Action Item Extraction
  const handleExtractAiTasks = () => {
    if (!aiNotes.trim()) {
      alert('Please enter meeting notes or transcript to extract action items.');
      return;
    }
    setAiExtracting(true);
    setTimeout(() => {
      // Heuristic extraction
      const lines = aiNotes
        .split('\n')
        .map((l) => l.trim().replace(/^[-*•0-9.]+\s*/, ''))
        .filter((l) => l.length > 5);

      const proposals = lines.slice(0, 3).map((line, idx) => ({
        title: line,
        assignedToName: idx % 2 === 0 ? 'Dr. Marcus Chen' : 'Elena Rostova',
        dueDate: new Date(Date.now() + 86400000 * (idx + 2)).toISOString().split('T')[0],
        priority: idx === 0 ? 'high' : 'medium',
      }));

      setAiProposedTasks(proposals);
      setAiExtracting(false);
    }, 600);
  };

  const handleAcceptAiTask = (proposed: any) => {
    const relatedMeeting = meetings[0];
    UniversalSchedulingService.createTask({
      organizationId: activeOrg.id,
      meetingId: relatedMeeting?.id,
      meetingTitle: relatedMeeting?.title,
      title: proposed.title,
      assignedTo: 'user-assignee',
      assignedToName: proposed.assignedToName,
      dueDate: proposed.dueDate,
      priority: proposed.priority,
      status: 'pending',
    });
    setAiProposedTasks(aiProposedTasks.filter((p) => p.title !== proposed.title));
    reloadTasks();
    showToast('AI-suggested action finalized and added.');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Decision-to-Action Tracking
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Record meeting decisions, track assignees, due dates, and prevent post-meeting dropped balls.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Action Item</span>
        </button>
      </div>

      {/* AI Meeting Summary & Action Extraction Assistant (Section 8.D) */}
      <div className="bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-indigo-900/5 dark:from-indigo-950/40 dark:to-purple-950/30 p-5 rounded-3xl border border-indigo-200/80 dark:border-indigo-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
              AI Action Extraction Assistant
            </h3>
          </div>
          <span className="text-[10px] text-slate-500">Requires user review before finalizing</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <textarea
            rows={2}
            value={aiNotes}
            onChange={(e) => setAiNotes(e.target.value)}
            placeholder="Paste meeting transcript or notes (e.g. 'Marcus to verify Supabase RLS indexes by Friday. Elena to update presentation')..."
            className="md:col-span-3 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={handleExtractAiTasks}
            disabled={aiExtracting}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 self-center"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{aiExtracting ? 'Analyzing Notes...' : 'Extract Tasks'}</span>
          </button>
        </div>

        {/* Proposed AI tasks list for user review */}
        {aiProposedTasks.length > 0 && (
          <div className="p-3 bg-white dark:bg-slate-850 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-2 animate-in fade-in">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Review Proposed Actions ({aiProposedTasks.length}):
            </span>
            <div className="space-y-2">
              {aiProposedTasks.map((prop, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-indigo-50/50 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-white">{prop.title}</span>
                    <div className="text-[10px] text-slate-500">
                      Assign to: <strong>{prop.assignedToName}</strong> • Due: {prop.dueDate}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAcceptAiTask(prop)}
                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 transition-colors shrink-0"
                  >
                    Accept & Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Filters */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
            filterStatus === 'all'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
            filterStatus === 'pending'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          In Progress ({tasks.filter((t) => t.status !== 'completed').length})
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
            filterStatus === 'completed'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Completed ({tasks.filter((t) => t.status === 'completed').length})
        </button>
      </div>

      {/* Tasks Table */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <CheckSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-bold">No follow-up action items in this view.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(task)}
                    className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                      task.status === 'completed'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                    }`}
                  >
                    {task.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="space-y-1">
                    <h3
                      className={`font-bold text-slate-900 dark:text-white ${
                        task.status === 'completed' ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{task.description}</p>
                    )}
                    {task.meetingTitle && (
                      <span className="inline-block text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                        Origin: {task.meetingTitle}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{task.assignedToName}</span>
                  </span>

                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due {task.dueDate}</span>
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      task.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-800'
                        : task.priority === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Action Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Record Meeting Decision & Action Item
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Action Item Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Finalize integration docs for Google Calendar sync"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Description / Decision Context</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Context discussed during meeting..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Assign To</label>
                  <input
                    type="text"
                    value={assignedToName}
                    onChange={(e) => setAssignedToName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Related Meeting</label>
                  <select
                    value={relatedMeetingId}
                    onChange={(e) => setRelatedMeetingId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl truncate"
                  >
                    {meetings.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Create & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
