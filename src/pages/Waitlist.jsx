/**
 * Standby Waitlist Management (/waitlist)
 * Track clients waiting for peak time slots, notify them when cancellations open up,
 * and convert standby requests to confirmed bookings with arrival tokens.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  PlusCircle,
  Bell,
  CheckCircle2,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  User,
  ArrowRight,
  Send,
  AlertCircle,
  Trash2,
  Filter,
  Check,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getWaitlistForBusiness,
  getAllWaitlistEntries,
  addToWaitlist,
  notifyWaitlistCustomer,
  convertWaitlistBooking,
  cancelWaitlistEntry,
} from '../lib/waitlist';
import { createBooking } from '../lib/bookings.js';

export default function Waitlist() {
  const { currentBusiness } = useAuth();
  const businessId = currentBusiness?.id || 'biz-happy-paws-grooming';
  const businessName = currentBusiness?.name || 'Happy Paws Grooming';

  const [waitlist, setWaitlist] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Standby modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceName: currentBusiness?.services?.[0]?.name || 'Full Canine Spa Grooming',
    serviceId: currentBusiness?.services?.[0]?.id || 'srv-paws-1',
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTime: 'any',
    channel: 'whatsapp',
    notes: '',
  });

  // Notify Slot Open prompt/modal state
  const [notifyModalItem, setNotifyModalItem] = useState(null);
  const [notifySlotTime, setNotifySlotTime] = useState('10:00 AM');
  const [notifyDate, setNotifyDate] = useState('');
  const [notificationSuccess, setNotificationSuccess] = useState(null);

  const loadData = () => {
    const list = getWaitlistForBusiness(businessId);
    // If empty for this specific business, load all to show seeded items
    if (list.length === 0) {
      setWaitlist(getAllWaitlistEntries());
    } else {
      setWaitlist(list);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const handleAddWaitlist = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) return;

    await addToWaitlist({
      businessId,
      businessName,
      businessSlug: currentBusiness?.slug || 'happy-paws-grooming',
      serviceId: formData.serviceId,
      serviceName: formData.serviceName,
      preferredDate: formData.preferredDate,
      preferredTime: formData.preferredTime,
      customerName: formData.customerName.trim(),
      customerEmail: formData.customerEmail.trim(),
      customerPhone: formData.customerPhone.trim(),
      channel: formData.channel,
      notes: formData.notes.trim(),
    });

    setModalOpen(false);
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      serviceName: currentBusiness?.services?.[0]?.name || 'Full Canine Spa Grooming',
      serviceId: currentBusiness?.services?.[0]?.id || 'srv-paws-1',
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: 'any',
      channel: 'whatsapp',
      notes: '',
    });
    loadData();
    setNotificationSuccess('New client added to standby queue and confirmation dispatched.');
    setTimeout(() => setNotificationSuccess(null), 4000);
  };

  const handleOpenNotifyModal = (item) => {
    setNotifyModalItem(item);
    setNotifyDate(item.preferredDate);
    setNotifySlotTime('11:00 AM');
  };

  const handleConfirmNotify = async () => {
    if (!notifyModalItem) return;

    await notifyWaitlistCustomer(notifyModalItem.id, {
      date: notifyDate || notifyModalItem.preferredDate,
      startTime: notifySlotTime,
      staffName: notifyModalItem.staffName || 'Available Specialist',
    });

    setNotificationSuccess(
      `Automated ${notifyModalItem.channel.toUpperCase()} vacancy alert dispatched to ${notifyModalItem.customerName} for ${notifySlotTime} on ${notifyDate}!`
    );
    setNotifyModalItem(null);
    loadData();
    setTimeout(() => setNotificationSuccess(null), 5000);
  };

  const handleConvertToBooking = async (item) => {
    try {
      const slotTime = item.matchedSlot?.startTime || '10:00 AM';
      const booking = await createBooking({
        businessId: item.businessId,
        businessName: item.businessName,
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        staffId: item.staffId || 'any',
        staffName: item.staffName || 'Available Specialist',
        date: item.matchedSlot?.date || item.preferredDate,
        startTime: slotTime,
        price: item.servicePrice || 75,
        customerName: item.customerName,
        customerEmail: item.customerEmail,
        customerPhone: item.customerPhone || '',
        notes: `Converted from Standby Pass ${item.token}. ${item.notes || ''}`,
        waitlistId: item.id,
      });

      await convertWaitlistBooking(item.id, booking.id);
      loadData();
      setNotificationSuccess(
        `Standby client ${item.customerName} successfully converted to Confirmed Booking (Token: ${booking.token})!`
      );
      setTimeout(() => setNotificationSuccess(null), 5000);
    } catch (err) {
      alert(err.message || 'Could not convert booking.');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Remove this client from the standby queue?')) {
      await cancelWaitlistEntry(id);
      loadData();
    }
  };

  // Filtered entries
  const filteredList = useMemo(() => {
    return waitlist.filter((w) => {
      if (filterStatus !== 'all' && w.status !== filterStatus) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = w.customerName.toLowerCase().includes(q);
        const matchesService = w.serviceName.toLowerCase().includes(q);
        const matchesToken = (w.token || '').toLowerCase().includes(q);
        if (!matchesName && !matchesService && !matchesToken) return false;
      }
      return true;
    });
  }, [waitlist, filterStatus, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = waitlist.length;
    const waiting = waitlist.filter((w) => w.status === 'waiting').length;
    const notified = waitlist.filter((w) => w.status === 'notified').length;
    const converted = waitlist.filter((w) => w.status === 'converted').length;
    return { total, waiting, notified, converted };
  }, [waitlist]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/80 text-indigo-300 text-xs font-semibold border border-indigo-700/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Automated Standby Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Standby Waitlist Management
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-xl">
              Fill sudden cancellations automatically. When an appointment is cancelled or rescheduled, matching standby clients are instantly notified via WhatsApp & SMS.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Standby Client</span>
          </button>
        </div>
      </div>

      {notificationSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">{notificationSuccess}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Awaiting Slot</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.waiting}</div>
          <div className="text-[11px] text-slate-500">Ready for vacancy match</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Alerts Sent</span>
            <Bell className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.notified}</div>
          <div className="text-[11px] text-slate-500">Notified via WhatsApp/SMS</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Converted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.converted}</div>
          <div className="text-[11px] text-slate-500">Booked from standby</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Auto-Match</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">100%</div>
          <div className="text-[11px] text-emerald-600 font-semibold">Active cancellation hook</div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {/* Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {['all', 'waiting', 'notified', 'converted'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  filterStatus === st
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {st === 'all' ? `All (${stats.total})` : st === 'waiting' ? `Awaiting (${stats.waiting})` : st === 'notified' ? `Notified (${stats.notified})` : `Converted (${stats.converted})`}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by client or token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 py-2 pl-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Waitlist Rows */}
        {filteredList.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-500">No standby clients found</p>
            <p className="text-[11px] text-slate-400">
              When customers join the waitlist for fully booked slots, they will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredList.map((item) => (
              <div
                key={item.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {item.token}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                      {item.customerName}
                    </h4>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        item.status === 'converted'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : item.status === 'notified'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      }`}
                    >
                      {item.status === 'converted' ? 'Confirmed Booking' : item.status === 'notified' ? 'Slot Alert Dispatched' : `Standby #${item.queuePosition}`}
                    </span>

                    {/* Channel Badge */}
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      {item.channel === 'sms' ? (
                        <Phone className="w-3 h-3 text-indigo-500" />
                      ) : (
                        <MessageSquare className="w-3 h-3 text-emerald-500" />
                      )}
                      <span className="capitalize">{item.channel}</span>
                    </span>
                  </div>

                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {item.serviceName}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-y-1 gap-x-3">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.preferredDate} ({item.preferredTime})
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {item.customerPhone || 'No phone'}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {item.customerEmail}
                    </span>
                    {item.notes && (
                      <>
                        <span>·</span>
                        <span className="italic text-slate-400">"{item.notes}"</span>
                      </>
                    )}
                  </div>

                  {item.matchedSlot && (
                    <div className="mt-1 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
                      <div>
                        <strong>Vacancy Alert Dispatched:</strong> {item.matchedSlot.date} at {item.matchedSlot.startTime}
                      </div>
                      {item.matchedSlot.claimUrl && (
                        <a
                          href={item.matchedSlot.claimUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold underline text-amber-700 dark:text-amber-300 inline-flex items-center gap-1"
                        >
                          <span>Claim Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {item.status === 'waiting' && (
                    <button
                      onClick={() => handleOpenNotifyModal(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Notify Slot Open</span>
                    </button>
                  )}

                  {item.status === 'notified' && (
                    <button
                      onClick={() => handleConvertToBooking(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Convert to Booking</span>
                    </button>
                  )}

                  {item.status === 'notified' && (
                    <button
                      onClick={() => handleOpenNotifyModal(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Re-send</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Remove from waitlist"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notify Slot Opening Prompt Modal */}
      {notifyModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Send Slot Vacancy Alert
                </h3>
              </div>
              <button
                onClick={() => setNotifyModalItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dispatches an automated WhatsApp or SMS template with a direct 1-click claim link to{' '}
              <strong className="text-slate-800 dark:text-slate-200">{notifyModalItem.customerName}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Appointment Date
                </label>
                <input
                  type="date"
                  value={notifyDate}
                  onChange={(e) => setNotifyDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Open Time Slot
                </label>
                <input
                  type="text"
                  value={notifySlotTime}
                  onChange={(e) => setNotifySlotTime(e.target.value)}
                  placeholder="e.g. 10:00 AM"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] space-y-1">
                <div><strong>Recipient:</strong> {notifyModalItem.customerPhone || notifyModalItem.customerEmail}</div>
                <div><strong>Channel:</strong> {notifyModalItem.channel.toUpperCase()}</div>
                <div><strong>Service:</strong> {notifyModalItem.serviceName}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setNotifyModalItem(null)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmNotify}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Alert Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Standby Client Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Add Standby Client
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWaitlist} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="e.g. Rachel Adams"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    placeholder="client@email.com"
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone (WhatsApp/SMS) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Requested Service
                </label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => {
                    const srv = currentBusiness?.services?.find((s) => s.id === e.target.value);
                    setFormData({
                      ...formData,
                      serviceId: e.target.value,
                      serviceName: srv?.name || formData.serviceName,
                    });
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white focus:outline-hidden font-semibold"
                >
                  {currentBusiness?.services?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (${s.price || 50})
                    </option>
                  )) || <option value="srv-default">Standard Consultation</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Time Window
                  </label>
                  <select
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white focus:outline-hidden font-semibold"
                  >
                    <option value="any">Any Opening</option>
                    <option value="morning">Morning (8am-12pm)</option>
                    <option value="afternoon">Afternoon (12pm-5pm)</option>
                    <option value="evening">Evening (5pm+)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alert Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, channel: 'whatsapp' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      formData.channel === 'whatsapp'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, channel: 'sms' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      formData.channel === 'sms'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    SMS
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
                >
                  Add to Standby Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
