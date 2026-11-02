import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  Clock,
  Bell,
  User,
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Scissors,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavigationProps {
  onOpenNotifications?: () => void;
  unreadCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onOpenNotifications,
  unreadCount = 0,
}) => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  // If in business admin portal
  const isBusinessPortal = location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/calendar') ||
    location.pathname.startsWith('/bookings') ||
    location.pathname.startsWith('/services') ||
    location.pathname.startsWith('/availability') ||
    location.pathname.startsWith('/staff') ||
    location.pathname.startsWith('/customers') ||
    location.pathname.startsWith('/analytics');

  if (isBusinessPortal && isAuthenticated) {
    return (
      <nav
        aria-label="Mobile Business Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 shadow-lg px-2 py-1 flex items-center justify-around transition-colors"
      >
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors ${
              isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/bookings"
          className={({ isActive }) =>
            `flex flex-col items-center py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors ${
              isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <CalendarCheck className="w-5 h-5 mb-0.5" />
          <span>Appointments</span>
        </NavLink>

        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            `flex flex-col items-center py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors ${
              isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <CalendarDays className="w-5 h-5 mb-0.5" />
          <span>Calendar</span>
        </NavLink>

        <NavLink
          to="/services"
          className={({ isActive }) =>
            `flex flex-col items-center py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors ${
              isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Scissors className="w-5 h-5 mb-0.5" />
          <span>Services</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex flex-col items-center py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors ${
              isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </NavLink>
      </nav>
    );
  }

  // Customer Navigation: Home | Book | Appointments | Notifications | Profile
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 shadow-lg px-2 py-1 flex items-center justify-around transition-colors"
    >
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors ${
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`
        }
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/book"
        className={({ isActive }) =>
          `flex flex-col items-center py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors ${
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`
        }
      >
        <Calendar className="w-5 h-5 mb-0.5" />
        <span>Book</span>
      </NavLink>

      <NavLink
        to="/my-bookings"
        className={({ isActive }) =>
          `flex flex-col items-center py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors ${
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`
        }
      >
        <Clock className="w-5 h-5 mb-0.5" />
        <span>Appointments</span>
      </NavLink>

      <NavLink
        to="/notifications"
        className={({ isActive }) =>
          `flex flex-col items-center py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors relative ${
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`
        }
      >
        <div className="relative">
          <Bell className="w-5 h-5 mb-0.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
          )}
        </div>
        <span>Notifications</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex flex-col items-center py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors ${
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`
        }
      >
        <User className="w-5 h-5 mb-0.5" />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};

export default BottomNavigation;
