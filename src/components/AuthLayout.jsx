/**
 * Auth Layout Component
 * Focused centered shell for Login and Registration flows with official Schedora logo.
 */

import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SchedoraLogo from './SchedoraLogo.jsx';

export default function AuthLayout() {
  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* 100% Fixed, stationary background that NEVER moves or shifts during questions/scrolling */}
      <div
        className="fixed inset-0 bg-mesh-pattern bg-cover bg-center pointer-events-none -z-10"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        aria-hidden="true"
      />

      {/* Top Header Bar */}
      <header className="shrink-0 h-14 sm:h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md px-4 sm:px-8 z-30 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <SchedoraLogo variant="compact" size={32} textSize="text-xl" showTagline={false} />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Public Directory</span>
            <span className="sm:hidden">Directory</span>
          </Link>
        </div>
      </header>

      {/* Main Full-Screen Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex flex-col items-center">
        <div className="w-full max-w-3xl lg:max-w-4xl my-auto">
          <div className="bg-white/95 dark:bg-slate-850/95 backdrop-blur-xl shadow-2xl shadow-indigo-100/50 dark:shadow-none border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
