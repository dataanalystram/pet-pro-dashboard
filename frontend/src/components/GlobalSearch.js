import { useState, useEffect, useRef, useCallback } from 'react';
import { searchAPI } from '@/api';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, User, Calendar, Package, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const { data } = await searchAPI.query(q);
      setResults(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => doSearch(val), 300);
  };

  const goTo = (path) => { onClose(); navigate(path); };

  const totalResults = results ? (results.customers?.length || 0) + (results.bookings?.length || 0) + (results.services?.length || 0) : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg p-0 gap-0" data-testid="global-search-dialog">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search customers, bookings, services..."
            className="flex-1 text-sm outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
            data-testid="global-search-input"
          />
          <kbd className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto" data-testid="search-results">
          {loading && <div className="px-4 py-8 text-center text-sm text-slate-500">Searching...</div>}

          {!loading && query.length >= 2 && totalResults === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">No results for "{query}"</div>
          )}

          {results && results.customers?.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-1 text-[10px] font-medium text-slate-400 uppercase">Customers</p>
              {results.customers.map((c) => (
                <button key={c.email} onClick={() => goTo('/dashboard/customers')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-left">
                  <User className="w-4 h-4 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.email}</p>
                  </div>
                  {c.pet && <Badge variant="secondary" className="text-[10px]">{c.pet}</Badge>}
                </button>
              ))}
            </div>
          )}

          {results && results.bookings?.length > 0 && (
            <div className="py-2 border-t border-slate-100">
              <p className="px-4 py-1 text-[10px] font-medium text-slate-400 uppercase">Bookings</p>
              {results.bookings.map((b) => (
                <button key={b.id} onClick={() => goTo('/dashboard/appointments')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-left">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{b.customer_name}</p>
                    <p className="text-xs text-slate-500">{b.service_name} · {b.booking_date}</p>
                  </div>
                  <Badge className={cn("text-[10px]",
                    b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                  )}>{b.status}</Badge>
                </button>
              ))}
            </div>
          )}

          {results && results.services?.length > 0 && (
            <div className="py-2 border-t border-slate-100">
              <p className="px-4 py-1 text-[10px] font-medium text-slate-400 uppercase">Services</p>
              {results.services.map((s) => (
                <button key={s.id} onClick={() => goTo('/dashboard/services')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-left">
                  <Package className="w-4 h-4 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">€{s.base_price?.toFixed(2)} · {s.duration_minutes}min</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!query && (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              Type to search customers, bookings, or services
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
