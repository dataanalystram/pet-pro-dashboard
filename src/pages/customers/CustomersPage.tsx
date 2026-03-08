import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Search, Crown, Star, PawPrint, ArrowUpDown, Download, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCustomers } from '@/hooks/use-supabase-data';
import { differenceInDays, parseISO } from 'date-fns';
import CustomerDetailPanel from './components/CustomerDetailPanel';

const tierColors: Record<string, string> = {
  new: 'bg-secondary text-secondary-foreground',
  regular: 'bg-blue-100 text-blue-700',
  loyal: 'bg-violet-100 text-violet-700',
  vip: 'bg-amber-100 text-amber-700',
};

const tierIcons: Record<string, any> = {
  new: Users,
  regular: Users,
  loyal: Star,
  vip: Crown,
};

function isAtRisk(lastDate: string | null): boolean {
  if (!lastDate) return false;
  return differenceInDays(new Date(), parseISO(lastDate)) > 60;
}

function daysSince(lastDate: string | null): number | null {
  if (!lastDate) return null;
  return differenceInDays(new Date(), parseISO(lastDate));
}

export default function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('total_spent');
  const [tierFilter, setTierFilter] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const summaryStats = useMemo(() => {
    const totalRevenue = customers.reduce((s, c) => s + Number(c.total_spent), 0);
    const avgLTV = customers.length > 0 ? Math.round(totalRevenue / customers.length) : 0;
    const atRiskCount = customers.filter(c => isAtRisk(c.last_booking_date)).length;
    return { totalRevenue: Math.round(totalRevenue), avgLTV, atRiskCount };
  }, [customers]);

  const filtered = customers
    .filter((c) => {
      if (tierFilter && c.tier !== tierFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return c.customer_name?.toLowerCase().includes(q) || c.customer_email?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'total_spent') return Number(b.total_spent) - Number(a.total_spent);
      if (sortBy === 'total_bookings') return b.total_bookings - a.total_bookings;
      if (sortBy === 'name') return a.customer_name.localeCompare(b.customer_name);
      if (sortBy === 'last_visit') return (daysSince(a.last_booking_date) ?? 9999) - (daysSince(b.last_booking_date) ?? 9999);
      return 0;
    });

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Tier', 'Total Spent', 'Total Bookings', 'Pets', 'First Visit', 'Last Visit'];
    const rows = filtered.map(c => [
      c.customer_name,
      c.customer_email,
      c.tier,
      Number(c.total_spent),
      c.total_bookings,
      (c.pets || []).join('; '),
      c.first_booking_date || '',
      c.last_booking_date || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading customers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">
            {customers.length} customers total
            {tierFilter && ` · Showing ${tierFilter}`}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-emerald-50/50 border-emerald-200/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-lg font-bold">${summaryStats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-violet-50/50 border-violet-200/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-violet-700" />
            </div>
            <div>
              <p className="text-lg font-bold">${summaryStats.avgLTV}</p>
              <p className="text-xs text-muted-foreground">Avg Lifetime Value</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn("border-destructive/20", summaryStats.atRiskCount > 0 ? "bg-destructive/5" : "bg-muted/30")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", summaryStats.atRiskCount > 0 ? "bg-destructive/10" : "bg-muted")}>
              <AlertTriangle className={cn("w-4 h-4", summaryStats.atRiskCount > 0 ? "text-destructive" : "text-muted-foreground")} />
            </div>
            <div>
              <p className={cn("text-lg font-bold", summaryStats.atRiskCount > 0 && "text-destructive")}>{summaryStats.atRiskCount}</p>
              <p className="text-xs text-muted-foreground">At Risk (60d+)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['new', 'regular', 'loyal', 'vip'] as const).map((tier) => {
          const count = customers.filter((c) => c.tier === tier).length;
          const TierIcon = tierIcons[tier];
          const isActive = tierFilter === tier;
          return (
            <Card
              key={tier}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isActive && "ring-2 ring-primary"
              )}
              onClick={() => setTierFilter(isActive ? null : tier)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", tierColors[tier])}>
                  <TierIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{tier}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {[
            { key: 'total_spent', label: 'Revenue' },
            { key: 'total_bookings', label: 'Bookings' },
            { key: 'name', label: 'Name' },
            { key: 'last_visit', label: 'Recent' },
          ].map((s) => (
            <Button key={s.key} variant={sortBy === s.key ? 'default' : 'outline'} size="sm" onClick={() => setSortBy(s.key)} className="flex-shrink-0">
              <ArrowUpDown className="w-3 h-3 mr-1" /> {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Customer list */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No customers found</div>
            ) : filtered.map((c) => {
              const risk = isAtRisk(c.last_booking_date);
              const days = daysSince(c.last_booking_date);
              return (
                <button key={c.id} onClick={() => setSelectedCustomer(c)} className="w-full flex items-center gap-3 sm:gap-4 px-4 py-3 sm:py-4 hover:bg-muted/50 transition-colors text-left min-h-[56px]">
                  <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm text-primary flex-shrink-0">
                    {c.customer_name?.[0]?.toUpperCase()}
                    {risk && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-destructive border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{c.customer_name}</p>
                      <Badge className={cn("text-[10px]", tierColors[c.tier])}>{c.tier}</Badge>
                      {c.pets?.length > 0 && (
                        <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <PawPrint className="w-3 h-3" />{c.pets.length}
                        </span>
                      )}
                      {risk && (
                        <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-destructive">
                          <AlertTriangle className="w-3 h-3" /> {days}d
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.customer_email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">Last visit</p>
                      <p className={cn("text-sm font-medium", risk && "text-destructive")}>{c.last_booking_date || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">${Number(c.total_spent)}</p>
                      <p className="text-xs text-muted-foreground">spent</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{c.total_bookings}</p>
                      <p className="text-xs text-muted-foreground">bookings</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <CustomerDetailPanel
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  );
}
