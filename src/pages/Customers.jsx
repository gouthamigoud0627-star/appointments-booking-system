/**
 * Customer CRM & Profiles (/customers)
 * Tenant-scoped client directory with visit histories, total spend metrics,
 * VIP tagging, customized preferences, and internal staff notes.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Star,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  PlusCircle,
  FileText,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Tag,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getBookingsByBusiness } from '../lib/bookings.js';

export default function Customers() {
  const { currentBusiness } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientNotes, setClientNotes] = useState({});

  useEffect(() => {
    async function load() {
      if (!currentBusiness) return;
      setLoading(true);
      try {
        const list = await getBookingsByBusiness(currentBusiness.id);
        setBookings(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentBusiness]);

  // Aggregate customer records from tenant bookings
  const clientsMap = {};
  bookings.forEach((b) => {
    const key = (b.customerEmail || b.customerName).toLowerCase().trim();
    if (!clientsMap[key]) {
      clientsMap[key] = {
        name: b.customerName,
        email: b.customerEmail,
        phone: b.customerPhone || 'Not on file',
        totalBookings: 0,
        totalSpent: 0,
        lastVisit: b.date,
        history: [],
        notes: b.notes || '',
        isVip: false,
      };
    }

    clientsMap[key].totalBookings += 1;
    if (b.status !== 'cancelled') {
      clientsMap[key].totalSpent += Number(b.price) || 0;
    }
    if (b.date > clientsMap[key].lastVisit) {
      clientsMap[key].lastVisit = b.date;
    }
    clientsMap[key].history.push(b);
  });

  const clients = Object.values(clientsMap).map((c) => ({
    ...c,
    isVip: c.totalBookings >= 2 || c.totalSpent >= 150,
  }));

  const filteredClients = clients.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/80 text-indigo-300 text-xs font-semibold border border-indigo-700/60">
              <Users className="w-3.5 h-3.5" />
              <span>Customer Relationship Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Customer Profiles & CRM
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200">
              Client directories, lifetime spend, appointment histories, and customized care notes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur border border-white/15 text-center">
              <span className="text-[10px] uppercase font-bold text-indigo-200 block">Total Clients</span>
              <span className="text-xl font-black text-white">{clients.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search clients by name, email address, or phone number..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white shadow-xs focus:border-indigo-600 focus:outline-none text-sm transition-colors"
        />
      </div>

      {/* Clients Table & Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Table List (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-900">Client Directory</h2>
            <span className="text-xs text-slate-500 font-semibold">{filteredClients.length} records</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 font-semibold">Loading clients...</div>
          ) : filteredClients.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">No client profiles match your search query.</div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {filteredClients.map((client, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedClient(client)}
                  className={`p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                    selectedClient?.email === client.email ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-sm">
                      {client.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{client.name}</h4>
                        {client.isVip && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{client.email} · {client.phone}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 block">${client.totalSpent}</span>
                    <span className="text-[11px] text-slate-400">{client.totalBookings} visit(s)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Client Detail Sidebar (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 sticky top-20">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
              Client Snapshot
            </h3>

            {selectedClient ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{selectedClient.name}</h4>
                    <span className="text-slate-500">{selectedClient.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Visits</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedClient.totalBookings}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Spent</span>
                    <span className="font-bold text-indigo-600 text-sm">${selectedClient.totalSpent}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Visit</span>
                    <span className="font-semibold text-slate-800">{selectedClient.lastVisit}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                    <span className="font-semibold text-emerald-600">Active Patron</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Client Preferences & Notes
                  </span>
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-amber-900">
                    {selectedClient.notes || 'No special preferences recorded. Prefers standard schedule.'}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                    Recent Reservations
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedClient.history.map((h) => (
                      <div key={h.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-900">{h.serviceName}</p>
                          <p className="text-[11px] text-slate-500">{h.date} at {h.startTime}</p>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-indigo-600">{h.token}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400">Select any client row to review lifetime visits, notes, and appointment history.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
