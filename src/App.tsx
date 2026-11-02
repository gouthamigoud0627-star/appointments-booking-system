/**
 * Main Application Routing & Providers
 * Schedora 2.0 - AI-Powered Universal Scheduling SaaS Platform
 * Multi-tenant scheduling across Corporate, Business, Education, Recruitment, and Sales.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Layouts
import Layout from './components/Layout.jsx';
import PublicLayout from './components/PublicLayout.jsx';
import AuthLayout from './components/AuthLayout.jsx';

// Public & Customer Pages
import Landing from './pages/Landing.jsx';
import GuidedBooking from './pages/GuidedBooking.tsx';
import BusinessDirectory from './pages/BusinessDirectory.tsx';
import PublicBooking from './pages/PublicBooking.jsx';
import BookingConfirmation from './pages/BookingConfirmation.jsx';
import CustomerBookings from './pages/CustomerBookings.jsx';
import CustomerSettings from './pages/CustomerSettings.tsx';
import NotificationHistoryPage from './pages/NotificationHistoryPage.tsx';
import CheckIn from './pages/CheckIn.jsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import NotFound from './pages/NotFound.jsx';

// Schedora 2.0 Universal SaaS Core Pages
import UniversalHome from './pages/UniversalHome.tsx';
import CalendarView from './pages/Calendar.jsx';
import ScheduleMeeting from './pages/ScheduleMeeting.tsx';
import FindATime from './pages/FindATime.tsx';
import MeetingsList from './pages/MeetingsList.tsx';
import TasksFollowUps from './pages/TasksFollowUps.tsx';
import PeopleTeams from './pages/PeopleTeams.tsx';
import RoomsResources from './pages/RoomsResources.tsx';
import Automations from './pages/Automations.tsx';
import Integrations from './pages/Integrations.tsx';

// Specialized Mode Workspaces
import EducationWorkspace from './pages/EducationWorkspace.tsx';
import RecruitmentWorkspace from './pages/RecruitmentWorkspace.tsx';
import SalesWorkspace from './pages/SalesWorkspace.tsx';

// Business Appointments Mode Pages (Retained & Improved)
import Bookings from './pages/Bookings.jsx';
import NewBooking from './pages/NewBooking.jsx';
import Availability from './pages/Availability.jsx';
import BusinessSettings from './pages/BusinessSettings.jsx';
import Customers from './pages/Customers.jsx';
import Services from './pages/Services.jsx';
import Staff from './pages/Staff.jsx';
import Waitlist from './pages/Waitlist.jsx';
import Analytics from './pages/Analytics.jsx';
import DoraPage from './pages/DoraPage.tsx';
import BusinessOffers from './pages/BusinessOffers.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
              {/* Public Customer & Guest Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/book" element={<GuidedBooking />} />
                <Route path="/businesses" element={<BusinessDirectory />} />
                <Route path="/discover" element={<BusinessDirectory />} />
                <Route path="/b/:businessSlug" element={<PublicBooking />} />
                <Route path="/book/:slug" element={<PublicBooking />} />
                <Route path="/business/:businessSlug" element={<PublicBooking />} />
                <Route path="/confirmation/:token" element={<BookingConfirmation />} />
                <Route path="/booking/:id" element={<BookingConfirmation />} />
                <Route path="/booking/:id/confirmation" element={<BookingConfirmation />} />
                <Route path="/my-bookings" element={<CustomerBookings />} />
                <Route path="/notifications" element={<NotificationHistoryPage />} />
                <Route path="/check-in" element={<CheckIn />} />
                <Route path="/settings" element={<CustomerSettings />} />
              </Route>

              {/* Authentication Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Protected Universal SaaS Management Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* 1. Universal Scheduling Core */}
                <Route path="/dashboard" element={<UniversalHome />} />
                <Route path="/home" element={<UniversalHome />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/meetings" element={<MeetingsList />} />
                <Route path="/meetings/new" element={<ScheduleMeeting />} />
                <Route path="/find-a-time" element={<FindATime />} />
                <Route path="/tasks" element={<TasksFollowUps />} />
                <Route path="/people" element={<PeopleTeams />} />
                <Route path="/teams" element={<PeopleTeams />} />
                <Route path="/resources" element={<RoomsResources />} />
                <Route path="/automations" element={<Automations />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/dora" element={<DoraPage />} />

                {/* 2. Specialized Organization Workspaces */}
                <Route path="/education" element={<EducationWorkspace />} />
                <Route path="/recruitment" element={<RecruitmentWorkspace />} />
                <Route path="/sales" element={<SalesWorkspace />} />

                {/* 3. Business Appointments Mode */}
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/bookings/new" element={<NewBooking />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/services" element={<Services />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="/availability" element={<Availability />} />
                <Route path="/waitlist" element={<Waitlist />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/offers" element={<BusinessOffers />} />
                <Route path="/admin/offers" element={<BusinessOffers />} />
                <Route path="/business-settings" element={<BusinessSettings />} />
                <Route path="/admin/settings" element={<BusinessSettings />} />
              </Route>

              {/* 404 Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
