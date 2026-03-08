import { useState, useEffect } from 'react';
import { requestsAPI } from '@/api';
import {
  User, PawPrint, Calendar, Clock, MessageSquare,
  CheckCircle, XCircle, ArrowRightLeft, AlertTriangle, Inbox, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

const statusStyles = {
  pending: { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'Pending' },
  accepted: { bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', label: 'Accepted' },
  declined: { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', label: 'Declined' },
  counter_offered: { bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'Counter Offered' },
  expired: { bg: 'bg-slate-50 border-slate-200', badge: 'bg-slate-100 text-slate-600', label: 'Expired' },
};

export default function BookingRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState('pending');
  const [actionModal, setActionModal] = useState({ open: false, request: null, action: '' });
  const [responseMsg, setResponseMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadRequests = async () => {
    try {
      const { data } = await requestsAPI.list({});
      setRequests(data);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const handleAction = async (action) => {
    const req = actionModal.request;
    if (!req) return;
    setActionLoading(true);
    try {
      await requestsAPI.action(req.id, {
        action,
        response_message: responseMsg || undefined,
        decline_reason: action === 'decline' ? (responseMsg || 'Schedule conflict') : undefined,
      });
      await loadRequests();
      setActionModal({ open: false, request: null, action: '' });
      setResponseMsg('');
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = requests.filter((r) => {
    if (tabFilter === 'all') return true;
    return r.status === tabFilter;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const tabs = [
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'accepted', label: 'Accepted' },
    { key: 'declined', label: 'Declined' },
    { key: 'all', label: 'All' },
  ];

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="h-10 w-96 bg-slate-200 rounded animate-pulse" />
      {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-slate-200 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Booking Requests</h1>
        <p className="text-sm text-slate-500">Manage incoming requests from customers</p>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setTabFilter(tab.key)} className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
            tabFilter === tab.key ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
          )}>
            {tab.label}
            {tab.count > 0 && <span className="bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{tab.count}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center py-16 text-center">
          <Inbox className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">{tabFilter === 'pending' ? 'No pending requests' : 'No requests found'}</p>
          <p className="text-xs text-slate-400 mt-1">{tabFilter === 'pending' ? "You're all caught up!" : 'Try a different filter'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onAccept={() => { setActionModal({ open: true, request: req, action: 'accept' }); setResponseMsg(''); }}
              onDecline={() => { setActionModal({ open: true, request: req, action: 'decline' }); setResponseMsg(''); }}
              onCounter={() => { setActionModal({ open: true, request: req, action: 'counter_offer' }); setResponseMsg(''); }}
            />
          ))}
        </div>
      )}

      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {actionModal.action === 'accept' && 'Accept Request'}
                {actionModal.action === 'decline' && 'Decline Request'}
                {actionModal.action === 'counter_offer' && 'Counter Offer'}
              </h3>
              <button onClick={() => setActionModal({ open: false, request: null, action: '' })} className="p-1 rounded hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">{actionModal.request?.customer_name} - {actionModal.request?.service_name || 'Service'}</p>
            <textarea
              placeholder={
                actionModal.action === 'accept' ? 'Optional confirmation message...' :
                actionModal.action === 'decline' ? 'Reason for declining...' :
                'Your counter offer message...'
              }
              value={responseMsg}
              onChange={(e) => setResponseMsg(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setActionModal({ open: false, request: null, action: '' })} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={() => handleAction(actionModal.action)}
                disabled={actionLoading}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-50',
                  actionModal.action === 'accept' && 'bg-emerald-600 hover:bg-emerald-700',
                  actionModal.action === 'decline' && 'bg-red-600 hover:bg-red-700',
                  actionModal.action === 'counter_offer' && 'bg-provider-primary hover:bg-blue-700',
                )}
              >
                {actionLoading ? 'Processing...' :
                  actionModal.action === 'accept' ? 'Accept' :
                  actionModal.action === 'decline' ? 'Decline' :
                  'Send Counter Offer'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestCard({ request, onAccept, onDecline, onCounter }) {
  const style = statusStyles[request.status] || statusStyles.pending;
  const timeAgo = request.created_at ? formatDistanceToNow(parseISO(request.created_at), { addSuffix: true }) : '';

  return (
    <div className={cn("bg-white rounded-xl border p-5 transition-all", style.bg)}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", style.badge)}>{style.label}</span>
            {request.is_urgent && <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Urgent</span>}
            <span className="text-xs text-slate-400">{timeAgo}</span>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-slate-400" /><span className="font-medium text-slate-900">{request.customer_name}</span></div>
            <div className="flex items-center gap-2 text-sm"><PawPrint className="w-4 h-4 text-slate-400" /><span className="text-slate-700">{request.pet_name} ({request.pet_species})</span></div>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <div className="flex items-center gap-2 text-sm text-slate-600"><Calendar className="w-4 h-4 text-slate-400" />{request.preferred_date ? format(parseISO(request.preferred_date), 'MMM d, yyyy') : '-'}</div>
            {request.preferred_time_start && <div className="flex items-center gap-2 text-sm text-slate-600"><Clock className="w-4 h-4 text-slate-400" />{request.preferred_time_start}{request.preferred_time_end ? ` - ${request.preferred_time_end}` : ''}</div>}
            {request.service_name && <div className="text-sm font-medium text-slate-700">{request.service_name}{request.service_price ? ` \u00b7 \u20AC${request.service_price.toFixed(2)}` : ''}</div>}
          </div>

          {request.customer_message && (
            <div className="flex gap-2 bg-white/60 rounded-lg p-3 border border-slate-200/60">
              <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-600">{request.customer_message}</p>
            </div>
          )}

          {request.provider_response && request.status !== 'pending' && (
            <div className="bg-white/80 rounded-lg p-3 border border-slate-200/60">
              <p className="text-xs text-slate-500 mb-1">Your response:</p>
              <p className="text-sm text-slate-700">{request.provider_response}</p>
            </div>
          )}
        </div>

        {request.status === 'pending' && (
          <div className="flex sm:flex-col gap-2 flex-shrink-0">
            <button onClick={onAccept} className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1"><CheckCircle className="w-4 h-4" />Accept</button>
            <button onClick={onDecline} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"><XCircle className="w-4 h-4" />Decline</button>
            <button onClick={onCounter} className="px-4 py-2 rounded-lg text-sm font-medium bg-white border text-slate-700 hover:bg-slate-50 flex items-center gap-1"><ArrowRightLeft className="w-4 h-4" />Counter</button>
          </div>
        )}
      </div>
    </div>
  );
}
