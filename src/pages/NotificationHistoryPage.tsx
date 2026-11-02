/**
 * Notification & Message History Page (/notifications)
 * Allows customers and business administrators to view:
 * 1. Live In-App Alerts (Booking confirmations, 24h & 2h reminders, verified payment receipts, offers)
 * 2. Automated WhatsApp & SMS Delivery Outbox (delivery status, templates, retry counts, idempotency keys)
 * Real-time Supabase synchronization, category filtering, unread status toggles, and direct links to booking passes.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Send,
  CalendarCheck,
  DollarSign,
  Filter,
  CheckCheck,
  Check,
  Trash2,
  Tag,
  ExternalLink,
  ChevronRight,
  WifiOff,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getMessageLogs, MessageLogEntry, dispatchAutomatedMessage } from '../lib/messaging';
import {
  SchedoraNotification,
  NotificationType,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotificationChanges,
  runReminderScheduler,
} from '../lib/notifications';
import { getAllBookings } from '../lib/bookings.js';

export default function NotificationHistoryPage() {
  const { customerUser, currentBusiness, isAuthenticated } = useAuth();

  // Section Tab: In-App Alerts vs WhatsApp/SMS Delivery Queue
  const [activeSection, setActiveSection] = useState<'in_app' | 'messages'>('in_app');

  // In-app notifications state
  const [notifications, setNotifications] = useState<SchedoraNotification[]>([]);
  const [notifCategory, setNotifCategory] = useState<NotificationType | 'all'>('all');
  const [notifStatusFilter, setNotifStatusFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Messaging logs state
  const [messageLogs, setMessageLogs] = useState<MessageLogEntry[]>([]);
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Feedback banner
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const isBusinessUser = isAuthenticated && !!currentBusiness;

  const reloadData = () => {
    // 1. Reload in-app notifications
    const filter = isBusinessUser && currentBusiness?.id
      ? { businessId: currentBusiness.id }
      : { userId: customerUser?.email || 'cust-jahnavi' };
    setNotifications(getNotifications(filter));

    // 2. Reload message logs
    if (isBusinessUser && currentBusiness?.id) {
      setMessageLogs(getMessageLogs({ businessId: currentBusiness.id }));
    } else {
      setMessageLogs(getMessageLogs({ customerPhone: customerUser?.phone || '+91 98765 43210' }));
    }
  };

  useEffect(() => {
    reloadData();
    const unsubscribe = subscribeToNotificationChanges(() => {
      reloadData();
    });

    const handleOnline = () => {
      setIsOnline(true);
      reloadData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isBusinessUser, currentBusiness, customerUser]);

  // Filtered in-app notifications
  const filteredNotifications = notifications.filter((n) => {
    if (notifCategory !== 'all' && n.type !== notifCategory) return false;
    if (notifStatusFilter !== 'all' && n.status !== notifStatusFilter) return false;
    return true;
  });

  // Filtered message logs
  const filteredLogs = messageLogs.filter((log) => {
    if (filterChannel !== 'all' && log.channel !== filterChannel) return false;
    if (filterStatus !== 'all' && log.deliveryStatus !== filterStatus) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  const handleMarkAllRead = () => {
    const filter = isBusinessUser && currentBusiness?.id
      ? { businessId: currentBusiness.id }
      : { userId: customerUser?.email || 'cust-jahnavi' };
    markAllAsRead(filter);
    reloadData();
    setActionFeedback('All notifications marked as read.');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleTestReminderScheduler = async () => {
    try {
      const allBookings = getAllBookings();
      const res = await runReminderScheduler(allBookings);
      reloadData();
      setActionFeedback(`Reminder scheduler processed ${res.checkedCount} appointments. Reminders dispatched: ${res.remindersSent}.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (e: any) {
      setActionFeedback(`Scheduler check error: ${e.message}`);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleSendTestWhatsApp = async () => {
    const dummyAppt = {
      id: `BK-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      clientName: customerUser?.name || 'Jahnavi Raja',
      clientPhone: customerUser?.phone || '+91 98765 43210',
      serviceName: 'Full Grooming & Wellness',
      servicePrice: 75,
      date: 'Tomorrow',
      startTime: '10:00 AM',
      endTime: '11:00 AM',
      token: 'HP-9901',
    };

    const res = await dispatchAutomatedMessage({
      appointment: dummyAppt,
      business: currentBusiness || {
        id: 'biz-happy-paws-grooming',
        name: 'Happy Paws Grooming',
        address: '1420 Pine St',
        city: 'San Francisco',
      },
      messageType: 'booking_confirmation',
    });

    reloadData();
    setActionFeedback(`WhatsApp Booking Confirmation sent via template ${res.log.templateName}!`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const getStatusBadge = (status: MessageLogEntry['deliveryStatus']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sent</span>
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'booking':
        return <CalendarCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'payment':
        return <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'offer':
        return <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-2">
            <Bell className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Real-Time Notifications & Messaging Outbox</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time appointment alerts, 24h/2h reminders, verified payment receipts, and automated WhatsApp delivery logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestReminderScheduler}
            title="Scan confirmed bookings and dispatch due reminders"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Run Scheduler</span>
          </button>

          <button
            type="button"
            onClick={handleSendTestWhatsApp}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={reloadData}
            title="Refresh logs"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Offline Alert */}
      {!isOnline && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0 text-amber-600" />
          <span>You are currently offline. Showing local cached notifications. Changes will sync when reconnected.</span>
        </div>
      )}

      {/* Feedback Banner */}
      {actionFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Primary Section Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSection('in_app')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'in_app'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>In-App Alerts ({notifications.length})</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
              {unreadCount} new
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('messages')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'messages'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp & SMS Queue ({messageLogs.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. IN-APP NOTIFICATIONS TAB                               */}
      {/* ========================================================= */}
      {activeSection === 'in_app' && (
        <div className="space-y-4">
          {/* Sub-Filters: Category & Status */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'booking', label: 'Bookings' },
                  { id: 'reminder', label: 'Reminders' },
                  { id: 'payment', label: 'Payments' },
                  { id: 'offer', label: 'Offers' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setNotifCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    notifCategory === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right actions: Unread filter & Mark All as Read */}
            <div className="flex items-center gap-2">
              <select
                value={notifStatusFilter}
                onChange={(e) => setNotifStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All Read</span>
                </button>
              )}
            </div>
          </div>

          {/* List of in-app notifications */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center space-y-2">
                <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No notifications matching filter
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  New appointment confirmations, 24h & 2h arrival reminders, and verified payment updates will appear here automatically.
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const isUnread = n.status === 'unread';
                return (
                  <div
                    key={n.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isUnread
                        ? 'bg-white dark:bg-slate-850 border-indigo-300 dark:border-indigo-800 shadow-sm'
                        : 'bg-white/70 dark:bg-slate-850/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                        {getTypeIcon(n.type)}
                      </div>

                      {/* Main */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {n.title}
                            </h3>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            {new Date(n.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {n.message}
                        </p>

                        {/* Metadata Details & Actions */}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            {n.metadata?.bookingToken && (
                              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Pass: {n.metadata.bookingToken}
                              </span>
                            )}
                            {n.metadata?.serviceName && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                Service: <strong className="text-slate-700 dark:text-slate-200">{n.metadata.serviceName}</strong>
                              </span>
                            )}
                            {n.metadata?.appointmentDate && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                Date: {n.metadata.appointmentDate} {n.metadata.appointmentTime || ''}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isUnread && (
                              <button
                                type="button"
                                onClick={() => {
                                  markAsRead(n.id);
                                  reloadData();
                                }}
                                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark read</span>
                              </button>
                            )}

                            {n.metadata?.actionUrl && (
                              <Link
                                to={n.metadata.actionUrl}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                              >
                                <span>View Pass</span>
                                <ChevronRight className="w-3 h-3" />
                              </Link>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                deleteNotification(n.id);
                                reloadData();
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete notification"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. AUTOMATED WHATSAPP & SMS QUEUE                         */}
      {/* ========================================================= */}
      {activeSection === 'messages' && (
        <div className="space-y-4">
          {/* Messaging Filters */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Channels</option>
              <option value="whatsapp">WhatsApp Business</option>
              <option value="sms">SMS Text</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="delivered">Delivered</option>
              <option value="sent">Sent</option>
              <option value="scheduled">Scheduled</option>
              <option value="failed">Failed</option>
            </select>

            <div className="ml-auto text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredLogs.length} of {messageLogs.length} messages
            </div>
          </div>

          {/* List of message records */}
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No automated messages found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Messages dispatched via WhatsApp Business or SMS will display here with delivery status and idempotency audit tracking.
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {log.channel === 'whatsapp' ? (
                          <Smartphone className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-sky-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {log.businessName || 'Business Notification'}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                            {log.channel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Template: <span className="font-mono text-slate-700 dark:text-slate-300">{log.templateName || 'custom'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(log.deliveryStatus)}
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Body text */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap border border-slate-100 dark:border-slate-800 leading-relaxed">
                    {log.bodyContent}
                  </div>

                  {/* Footer metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <div className="flex items-center gap-3">
                      <span>Recipient: <strong className="text-slate-700 dark:text-slate-300">{log.customerPhone || log.customerName}</strong></span>
                      {log.providerMessageId && (
                        <span>ID: <code className="text-slate-600 dark:text-slate-400 font-mono">{log.providerMessageId.slice(0, 16)}...</code></span>
                      )}
                    </div>
                    {log.idempotencyKey && (
                      <span className="font-mono text-[10px] text-slate-400">
                        Idempotency: {log.idempotencyKey}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
