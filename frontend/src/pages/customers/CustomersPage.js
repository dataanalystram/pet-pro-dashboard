import { useState, useEffect } from 'react';
import { customersAPI } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Search, Crown, Star, PawPrint, Calendar, DollarSign,
  Mail, ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tierColors = {
  new: 'bg-slate-100 text-slate-600',
  regular: 'bg-blue-100 text-blue-700',
  loyal: 'bg-violet-100 text-violet-700',
  vip: 'bg-amber-100 text-amber-700',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('total_spent');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    customersAPI.list().then(({ data }) => {
      setCustomers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = customers
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.customer_name?.toLowerCase().includes(q) || c.customer_email?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'total_spent') return (b.total_spent || 0) - (a.total_spent || 0);
      if (sortBy === 'total_bookings') return (b.total_bookings || 0) - (a.total_bookings || 0);
      if (sortBy === 'name') return (a.customer_name || '').localeCompare(b.customer_name || '');
      return 0;
    });

  if (loading) return (
    <div className="space-y-4" data-testid="customers-skeleton">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-96" />
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-6" data-testid="customers-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customers</h1>
        <p className="text-sm text-slate-500">{customers.length} customers total</p>
      </div>

      {/* Tier summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['new', 'regular', 'loyal', 'vip'].map((tier) => {
          const count = customers.filter((c) => c.tier === tier).length;
          return (
            <Card key={tier} className="border-slate-200" data-testid={`tier-${tier}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", tierColors[tier])}>
                  {tier === 'vip' ? <Crown className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{count}</p>
                  <p className="text-xs text-slate-500 capitalize">{tier}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="search-customers" />
        </div>
        <div className="flex gap-1">
          {[{ key: 'total_spent', label: 'Revenue' }, { key: 'total_bookings', label: 'Bookings' }, { key: 'name', label: 'Name' }].map((s) => (
            <Button key={s.key} variant={sortBy === s.key ? 'default' : 'outline'} size="sm" onClick={() => setSortBy(s.key)} data-testid={`sort-${s.key}`}>
              <ArrowUpDown className="w-3 h-3 mr-1" /> {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Customer list */}
      <Card className="border-slate-200" data-testid="customers-list">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500">No customers found</div>
            ) : filtered.map((c) => (
              <button
                key={c.customer_email}
                onClick={() => setSelectedCustomer(c)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                data-testid={`customer-${c.customer_email}`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm flex-shrink-0">
                  {c.customer_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.customer_name}</p>
                    <Badge className={cn("text-[10px]", tierColors[c.tier])}>{c.tier}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{c.customer_email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-right">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">€{(c.total_spent || 0).toFixed(0)}</p>
                    <p className="text-xs text-slate-400">spent</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{c.total_bookings || 0}</p>
                    <p className="text-xs text-slate-400">bookings</p>
                  </div>
                  <div className="flex gap-1">
                    {c.pets?.slice(0, 3).map((p) => (
                      <Badge key={p} variant="secondary" className="text-[10px]"><PawPrint className="w-3 h-3 mr-0.5" />{p}</Badge>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-lg" data-testid="customer-detail-dialog">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-provider-primary flex items-center justify-center text-white font-bold text-lg">
                    {selectedCustomer.customer_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <DialogTitle>{selectedCustomer.customer_name}</DialogTitle>
                    <p className="text-sm text-slate-500">{selectedCustomer.customer_email}</p>
                  </div>
                  <Badge className={cn("ml-auto", tierColors[selectedCustomer.tier])}>{selectedCustomer.tier}</Badge>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-3 py-3">
                <StatBox icon={DollarSign} label="Total Spent" value={`€${(selectedCustomer.total_spent || 0).toFixed(0)}`} />
                <StatBox icon={Calendar} label="Bookings" value={selectedCustomer.total_bookings || 0} />
                <StatBox icon={Star} label="Avg Value" value={`€${selectedCustomer.total_bookings ? (selectedCustomer.total_spent / selectedCustomer.total_bookings).toFixed(0) : 0}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">Pets</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.pets?.map((p) => (
                    <Badge key={p} variant="secondary"><PawPrint className="w-3 h-3 mr-1" />{p}</Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">First Visit</p>
                  <p className="font-medium text-slate-900">{selectedCustomer.first_booking_date || '-'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Last Visit</p>
                  <p className="font-medium text-slate-900">{selectedCustomer.last_booking_date || '-'}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <Icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
