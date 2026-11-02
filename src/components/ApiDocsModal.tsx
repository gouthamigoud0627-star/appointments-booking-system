import React, { useState } from 'react';
import { 
  Code2, 
  Play, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Server, 
  ExternalLink,
  Lock,
  Layers
} from 'lucide-react';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  parameters?: Array<{ name: string; type: string; in: string; required: boolean; description: string }>;
  requestBody?: any;
  responseSample: any;
}

export const ApiDocsModal: React.FC = () => {
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState<number>(0);
  const [liveResponse, setLiveResponse] = useState<any>(null);
  const [liveStatus, setLiveStatus] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const endpoints: ApiEndpoint[] = [
    {
      method: 'GET',
      path: '/api/services',
      summary: 'List all active business services & rates',
      description: 'Returns the catalog of bookable services with durations, base prices, and deposit policies.',
      responseSample: [
        {
          id: 'srv-1',
          name: 'Comprehensive Health & Wellness Consultation',
          durationMinutes: 45,
          price: 95,
          depositRequired: 25,
          cancellationFee: 30,
        },
      ],
    },
    {
      method: 'GET',
      path: '/api/availability',
      summary: 'Query open scheduling slots',
      description: 'Calculates real-time open slots for a specific date, accounting for staff working hours and active bookings.',
      parameters: [
        { name: 'date', type: 'string', in: 'query', required: true, description: 'ISO date (YYYY-MM-DD)' },
        { name: 'serviceId', type: 'string', in: 'query', required: true, description: 'Target Service ID' },
        { name: 'staffId', type: 'string', in: 'query', required: false, description: 'Optional specific staff ID' },
      ],
      responseSample: {
        date: '2026-09-17',
        fullyBooked: false,
        slots: [
          { time: '10:00', available: true, availableStaff: [{ id: 'st-1', name: 'Dr. Elena Rostova' }] },
          { time: '11:30', available: true, availableStaff: [{ id: 'st-1', name: 'Dr. Elena Rostova' }] },
        ],
      },
    },
    {
      method: 'POST',
      path: '/api/suggest-slots',
      summary: 'AI-assisted alternative date suggestion',
      description: 'Detects schedule conflicts and finds optimal alternative slots across the next 7 business days using heuristic analysis and Gemini intelligence.',
      requestBody: {
        date: '2026-09-17',
        serviceId: 'srv-1',
        staffId: 'any',
      },
      responseSample: {
        originalRequestedDate: '2026-09-17',
        suggestions: [
          {
            date: '2026-09-18',
            startTime: '10:00',
            endTime: '10:45',
            staffName: 'Dr. Elena Rostova',
            confidenceScore: 88,
            reason: 'Next day immediate availability: Beat the queue with Dr. Elena Rostova!',
          },
        ],
      },
    },
    {
      method: 'POST',
      path: '/api/appointments',
      summary: 'Create appointment & trigger confirmation workflow',
      description: 'Submits a client booking request, charges deposit authorization, queues automated notifications, and notifies business owner.',
      requestBody: {
        serviceId: 'srv-1',
        clientName: 'Julian Miller',
        clientEmail: 'julian@example.com',
        clientPhone: '+1 (555) 441-2099',
        date: '2026-09-18',
        startTime: '10:00',
        paymentMethod: 'card',
      },
      responseSample: {
        id: 'apt-901',
        confirmationCode: 'APX-7712',
        status: 'pending',
        payment: { depositPaid: 25, status: 'paid_deposit' },
      },
    },
    {
      method: 'GET',
      path: '/api/appointments',
      summary: 'Retrieve appointments with filter & search',
      description: 'Returns scheduled appointments filtered by status (pending, confirmed, completed) or keyword search.',
      parameters: [
        { name: 'status', type: 'string', in: 'query', required: false, description: 'all | pending | confirmed | completed' },
        { name: 'search', type: 'string', in: 'query', required: false, description: 'Client name or code query' },
      ],
      responseSample: [
        { id: 'apt-101', clientName: 'Alexander Hayes', date: '2026-09-17', status: 'confirmed' },
      ],
    },
    {
      method: 'PATCH',
      path: '/api/appointments/apt-102/status',
      summary: 'Transition appointment state (Owner Action)',
      description: 'Owner approves, reschedules, marks complete, or cancels appointment, triggering client email & SMS notification.',
      requestBody: {
        status: 'confirmed',
        note: 'Approved by business owner via Quick Actions',
        by: 'owner',
      },
      responseSample: {
        id: 'apt-102',
        status: 'confirmed',
        updatedAt: '2026-09-17T07:15:00Z',
      },
    },
    {
      method: 'POST',
      path: '/api/reminders/send',
      summary: 'Dispatch automated email/SMS reminder',
      description: 'Dispatches custom template session reminders for 24-hour or 2-hour upcoming window.',
      requestBody: {
        appointmentId: 'apt-101',
        reminderType: '24h',
        medium: 'both',
      },
      responseSample: {
        success: true,
        sentCount: 2,
        logs: [
          { type: 'sms', recipient: '+1 (555) 832-1920', status: 'delivered' },
          { type: 'email', recipient: 'alex@example.com', status: 'delivered' },
        ],
      },
    },
    {
      method: 'GET',
      path: '/api/analytics',
      summary: 'Real-time revenue, deposits & trend analytics',
      description: 'Calculates financial metrics, busiest hourly windows, weekly revenue trajectory, and category demand.',
      responseSample: {
        totalRevenue: 3450,
        depositCollected: 980,
        completionRate: 94,
        busiestHours: [{ hour: '11:00', count: 12 }],
      },
    },
    {
      method: 'GET',
      path: '/api/calendar.ics',
      summary: 'iCalendar RFC 5545 subscription feed',
      description: 'Provides live calendar subscription endpoint compatible with Apple Calendar, Google Calendar, and Microsoft Outlook.',
      responseSample: 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Schedula Core//EN\n...',
    },
  ];

  const currentEp = endpoints[selectedEndpointIndex];

  const handleExecuteLive = async () => {
    setTesting(true);
    setLiveResponse(null);
    setLiveStatus(null);
    try {
      let url = currentEp.path;
      const opts: RequestInit = {
        method: currentEp.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (currentEp.method === 'GET' && currentEp.path === '/api/availability') {
        url = '/api/availability?serviceId=srv-1&date=2026-09-18';
      }

      if (currentEp.method !== 'GET' && currentEp.requestBody) {
        opts.body = JSON.stringify(currentEp.requestBody);
      }

      const res = await fetch(url, opts);
      setLiveStatus(res.status);
      const text = await res.text();
      try {
        setLiveResponse(JSON.parse(text));
      } catch {
        setLiveResponse(text);
      }
    } catch (err: any) {
      setLiveStatus(500);
      setLiveResponse({ error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const copyCurl = () => {
    const curl = `curl -X ${currentEp.method} "https://your-domain.com${currentEp.path}" \\
  -H "Content-Type: application/json"${
    currentEp.requestBody ? ` \\\n  -d '${JSON.stringify(currentEp.requestBody)}'` : ''
  }`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodBadge = (m: string) => {
    switch (m) {
      case 'GET':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">GET</span>;
      case 'POST':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">POST</span>;
      case 'PATCH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">PATCH</span>;
      case 'PUT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">PUT</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">DEL</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 font-display">
              <Code2 className="w-5 h-5 text-emerald-600" />
              <span>Interactive REST API Documentation</span>
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              OpenAPI 3.1 Spec
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete API reference for automated scheduling, booking lifecycle webhooks, and calendar feeds.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono">Base URL:</span>
          <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-lg border text-slate-800 font-semibold">
            /api
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Endpoint List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
            Available API Routes ({endpoints.length})
          </div>

          <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
            {endpoints.map((ep, idx) => {
              const isSelected = selectedEndpointIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedEndpointIndex(idx);
                    setLiveResponse(null);
                    setLiveStatus(null);
                  }}
                  className={`w-full p-3.5 text-left transition-colors flex items-start gap-2.5 hover:bg-slate-50 ${
                    isSelected ? 'bg-indigo-50/60 border-l-4 border-indigo-600' : ''
                  }`}
                >
                  <div className="shrink-0 mt-0.5">{getMethodBadge(ep.method)}</div>
                  <div className="truncate flex-1">
                    <div className="text-xs font-mono font-bold text-slate-900 truncate">
                      {ep.path}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {ep.summary}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Endpoint Inspector & Live Tester */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {getMethodBadge(currentEp.method)}
                <span className="font-mono font-extrabold text-sm text-slate-900">
                  {currentEp.path}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyCurl}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy cURL'}</span>
                </button>

                <button
                  onClick={handleExecuteLive}
                  disabled={testing}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-lg shadow-sm transition-all hover:scale-105 disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Executing...' : 'Try It Live'}</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed">
              {currentEp.description}
            </p>

            {/* Parameters if any */}
            {currentEp.parameters && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Query Parameters
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Required</th>
                        <th className="p-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentEp.parameters.map((p, i) => (
                        <tr key={i}>
                          <td className="p-2 font-mono font-bold text-slate-800">{p.name}</td>
                          <td className="p-2 text-slate-500 font-mono">{p.type}</td>
                          <td className="p-2">{p.required ? <span className="text-rose-600 font-bold">Yes</span> : 'No'}</td>
                          <td className="p-2 text-slate-600">{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Request Body sample */}
            {currentEp.requestBody && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Request Payload (JSON)
                </h4>
                <pre className="p-3 bg-slate-900 text-emerald-400 text-xs rounded-xl font-mono overflow-x-auto">
                  {JSON.stringify(currentEp.requestBody, null, 2)}
                </pre>
              </div>
            )}

            {/* Response Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {liveStatus ? `Live Response (Status ${liveStatus})` : 'Sample Response (200 OK)'}
                </h4>
                {liveStatus && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    liveStatus < 300 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    HTTP {liveStatus}
                  </span>
                )}
              </div>

              <pre className="p-3 bg-slate-900 text-slate-200 text-xs rounded-xl font-mono overflow-x-auto max-h-64">
                {JSON.stringify(liveResponse || currentEp.responseSample, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
