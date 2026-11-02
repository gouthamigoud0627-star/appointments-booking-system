import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Star, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  Plus, 
  Clock, 
  FileText,
  BadgePercent
} from 'lucide-react';
import { ClientProfile } from '../types';

interface ClientDirectoryProps {
  clients: ClientProfile[];
  onSelectClientForBooking?: (client: ClientProfile) => void;
}

export const ClientDirectory: React.FC<ClientDirectoryProps> = ({
  clients,
  onSelectClientForBooking,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 font-display">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Client Relationship Management (CRM)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Retain loyalty, monitor historical lifetime spend, and log client-specific preferences.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client) => (
          <div
            key={client.id}
            onClick={() => setSelectedClient(client)}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-white font-bold text-sm flex items-center justify-center">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{client.name}</h3>
                    <div className="text-[11px] text-slate-400">{client.email}</div>
                  </div>
                </div>

                {client.isVip && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    VIP
                  </span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Sessions</span>
                  <span className="font-extrabold text-slate-800">{client.totalBookings} visits</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Lifetime Spend</span>
                  <span className="font-extrabold text-emerald-700">${client.totalSpent}</span>
                </div>
              </div>

              {client.notes && (
                <div className="mt-3 p-2 rounded-xl bg-slate-50 text-[11px] text-slate-600 line-clamp-2">
                  "{client.notes}"
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Last: {client.lastVisit || 'Recent'}
              </span>
              <span className="text-indigo-600 font-semibold hover:underline">
                View Profile →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center">
                  {selectedClient.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{selectedClient.name}</h3>
                  <p className="text-xs text-slate-400">{selectedClient.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Phone</span>
                <span className="font-semibold text-slate-800">{selectedClient.phone || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Client Status</span>
                <span className="font-semibold text-indigo-700">
                  {selectedClient.isVip ? 'VIP Member' : 'Regular Client'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                Client Preferences & Notes
              </span>
              <p className="text-slate-700 leading-relaxed">{selectedClient.notes || 'No notes added yet.'}</p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
