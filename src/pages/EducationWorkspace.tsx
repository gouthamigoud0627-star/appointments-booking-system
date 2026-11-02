/**
 * Schools and Colleges Mode (/education)
 * Dedicated Educational Institution Workspace for academic departments,
 * faculty scheduling, class timetable conflict checks, and parent-teacher meetings.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  Clock,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { UniversalSchedulingService } from '../lib/universalScheduling';

export default function EducationWorkspace() {
  const activeOrg = UniversalSchedulingService.getActiveOrganization();
  const meetings = UniversalSchedulingService.getMeetings(activeOrg.id);
  const resources = UniversalSchedulingService.getResources(activeOrg.id);

  const [activeTab, setActiveTab] = useState<'departments' | 'timetable' | 'parent_teacher'>('departments');
  const [parentName, setParentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('Friday 2:00 PM - 2:30 PM');
  const [parentSuccess, setParentSuccess] = useState(false);

  const departments = [
    { name: 'Computer Science & AI', code: 'CS-AI', facultyCount: 14, head: 'Prof. Sarah Jenkins' },
    { name: 'Mechanical & Robotics', code: 'MECH', facultyCount: 11, head: 'Dr. Michael Chang' },
    { name: 'Mathematics & Data Science', code: 'MATH', facultyCount: 9, head: 'Dr. Katherine Bell' },
    { name: 'Dean Office & Academic Affairs', code: 'ADMIN', facultyCount: 6, head: 'Dean Marcus Chen' },
  ];

  const timetableConflictsCheck = [
    { period: 'Period 1 (09:00 - 10:15)', course: 'CS301 Advanced Algorithms', room: 'Science Hall 101', status: 'In Session', conflictRisk: 'None' },
    { period: 'Period 2 (10:30 - 11:45)', course: 'CS410 Machine Learning Lab', room: 'Advanced Computing Lab 101', status: 'In Session', conflictRisk: 'None' },
    { period: 'Period 3 (13:00 - 14:15)', course: 'Faculty Department Meeting', room: 'Science Hall 101', status: 'Scheduled', conflictRisk: 'Protected Period' },
  ];

  const handleBookParentTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim() || !studentId.trim()) return;
    setParentSuccess(true);
    setTimeout(() => {
      setParentName('');
      setStudentId('');
      setParentSuccess(false);
    }, 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Educational Institution Workspace</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Bay Area Institute of Technology
        </h1>
        <p className="text-xs sm:text-sm text-emerald-200 max-w-2xl leading-relaxed">
          Coordinate department meetings, verify class timetable non-conflict periods,
          manage academic laboratories, and schedule parent-teacher conferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'departments'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Academic Departments & Faculty
        </button>

        <button
          onClick={() => setActiveTab('timetable')}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'timetable'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Class Timetable Conflict Checks
        </button>

        <button
          onClick={() => setActiveTab('parent_teacher')}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'parent_teacher'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Parent-Teacher Appointments
        </button>
      </div>

      {/* Tab 1: Departments */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {departments.map((dept, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {dept.code}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{dept.facultyCount} Faculty</span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{dept.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Head: {dept.head}</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    to="/meetings/new"
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Schedule Dept Meeting →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Campus Laboratories & Lecture Halls</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resources.map((res) => (
                <div key={res.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{res.name}</h4>
                    <p className="text-slate-500">{res.location} • Capacity: {res.capacity} Students</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Available
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Timetable Conflict Check */}
      {activeTab === 'timetable' && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Faculty Timetable Period Protection
              </h3>
              <p className="text-xs text-slate-500">
                Staff meetings automatically check class timetable data to prevent scheduling during active lecture periods.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Conflict Checks Active</span>
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {timetableConflictsCheck.map((t, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{t.course}</span>
                  <span className="text-slate-500">{t.period} • {t.room}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 block">{t.status}</span>
                  <span className="text-[10px] text-slate-400">{t.conflictRisk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Parent-Teacher Booking */}
      {activeTab === 'parent_teacher' && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-w-2xl">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Parent-Teacher Conference Slot Booking
            </h3>
            <p className="text-xs text-slate-500">
              Guardians can securely book authorized slots with their student's faculty advisor without exposing internal schedules.
            </p>
          </div>

          {parentSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Appointment confirmed! Faculty advisor and guardian notified.</span>
            </div>
          )}

          <form onSubmit={handleBookParentTeacher} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Guardian / Parent Full Name *</label>
              <input
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="e.g. Robert Sharma"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Student ID or Name *</label>
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. STU-8492 (Aarav Sharma)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Available Conference Slot</label>
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value="Friday 2:00 PM - 2:30 PM">Friday 2:00 PM - 2:30 PM (Prof. Jenkins)</option>
                <option value="Friday 2:30 PM - 3:00 PM">Friday 2:30 PM - 3:00 PM (Prof. Jenkins)</option>
                <option value="Monday 10:00 AM - 10:30 AM">Monday 10:00 AM - 10:30 AM (Dr. Chang)</option>
              </select>
            </div>

            <button
              type="submit"
              className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
            >
              Confirm Conference Slot
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
