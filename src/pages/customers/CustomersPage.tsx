import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Search, Crown, Star, PawPrint, Calendar, DollarSign, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCustomers } from '@/hooks/use-supabase-data';

const tierColors: Record<string, string> = {
  new: 'bg-slate-100 text-slate-600',
  regular: 'bg-blue-100 text-blue-700',
  loyal: 'bg-violet-100 text-violet-700',
  vip: 'bg-amber-100 text-amber-700',
};

function StatBox({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="bg-muted rounded-lg p-3 text-center">
      <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('total_spent');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const filtered = customers
    .filter((c) => {
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
        <h1 className="text-2xl font-heading font-bold">Customers</h1>
        <p className="text-sm text-muted-foreground">{customers.length} customers total</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['new', 'regular', 'loyal', 'vip'] as const).map((tier) => {
          const count = customers.filter((c) => c.tier === tier).length;
          return (
            <Card key={tier}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", tierColors[tier])}>
                  {tier === 'vip' ? <Crown className="w-4 h-4" /> : <Users className="w-4 h-4" />}
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {[{ key: 'total_spent', label: 'Revenue' }, { key: 'total_bookings', label: 'Bookings' }, { key: 'name', label: 'Name' }].map((s) => (
            <Button key={s.key} variant={sortBy === s.key ? 'default' : 'outline'} size="sm" onClick={() => setSortBy(s.key)}>
              <ArrowUpDown className="w-3 h-3 mr-1" /> {s.label}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No customers found</div>
            ) : filtered.map((c) => (
              <button key={c.id} onClick={() => setSelectedCustomer(c)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors text-left">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {c.customer_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{c.customer_name}</p>
                    <Badge className={cn("text-[10px]", tierColors[c.tier])}>{c.tier}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.customer_email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-right">
                  <div>
                    <p className="text-sm font-semibold">${Number(c.total_spent)}</p>
                    <p className="text-xs text-muted-foreground">spent</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{c.total_bookings}</p>
                    <p className="text-xs text-muted-foreground">bookings</p>
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

      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-lg">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {selectedCustomer.customer_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <DialogTitle>{selectedCustomer.customer_name}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.customer_email}</p>
                  </div>
                  <Badge className={cn("ml-auto", tierColors[selectedCustomer.tier])}>{selectedCustomer.tier}</Badge>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-3 py-3">
                <StatBox icon={DollarSign} label="Total Spent" value={`$${Number(selectedCustomer.total_spent)}`} />
                <StatBox icon={Calendar} label="Bookings" value={selectedCustomer.total_bookings} />
                <StatBox icon={Star} label="Avg Value" value={`$${selectedCustomer.total_bookings ? Math.round(Number(selectedCustomer.total_spent) / selectedCustomer.total_bookings) : 0}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Pets</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.pets?.map((p: string) => (
                    <Badge key={p} variant="secondary"><PawPrint className="w-3 h-3 mr-1" />{p}</Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">First Visit</p>
                  <p className="font-medium">{selectedCustomer.first_booking_date}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Last Visit</p>
                  <p className="font-medium">{selectedCustomer.last_booking_date}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
