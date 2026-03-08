import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Search, Crown, Star, PawPrint, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCustomers } from '@/hooks/use-supabase-data';
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

export default function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('total_spent');
  const [tierFilter, setTierFilter] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

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
      return 0;
    });

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading customers...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">Customers</h1>
        <p className="text-sm text-muted-foreground">
          {customers.length} customers total
          {tierFilter && ` · Showing ${tierFilter}`}
        </p>
      </div>

      {/* Tier stat cards — clickable to filter */}
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
          {[{ key: 'total_spent', label: 'Revenue' }, { key: 'total_bookings', label: 'Bookings' }, { key: 'name', label: 'Name' }].map((s) => (
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
            ) : filtered.map((c) => (
              <button key={c.id} onClick={() => setSelectedCustomer(c)} className="w-full flex items-center gap-3 sm:gap-4 px-4 py-3 sm:py-4 hover:bg-muted/50 transition-colors text-left min-h-[56px]">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm text-primary flex-shrink-0">
                  {c.customer_name?.[0]?.toUpperCase()}
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
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.customer_email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">Last visit</p>
                    <p className="text-sm font-medium">{c.last_booking_date || '—'}</p>
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
            ))}
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
