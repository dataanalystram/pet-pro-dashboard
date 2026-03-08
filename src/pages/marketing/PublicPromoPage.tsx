import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tag, CheckCircle2, XCircle, AlertTriangle, Clock, DollarSign, Percent, ShoppingBag } from 'lucide-react';

interface PromoResult {
  valid: boolean;
  status: 'valid' | 'invalid' | 'expired' | 'disabled' | 'maxed_out' | 'not_started';
  campaign?: any;
  serviceNames?: string[];
}

export default function PublicPromoPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PromoResult | null>(null);

  const checkPromo = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .ilike('promo_code', code.trim())
      .single();

    if (!campaign) {
      setResult({ valid: false, status: 'invalid' });
      setLoading(false);
      return;
    }

    const now = new Date().toISOString().split('T')[0];

    if (!campaign.is_enabled) {
      setResult({ valid: false, status: 'disabled', campaign });
      setLoading(false);
      return;
    }
    if (campaign.start_date && campaign.start_date > now) {
      setResult({ valid: false, status: 'not_started', campaign });
      setLoading(false);
      return;
    }
    if (campaign.end_date && campaign.end_date < now) {
      setResult({ valid: false, status: 'expired', campaign });
      setLoading(false);
      return;
    }
    if (campaign.max_redemptions && campaign.redemptions >= campaign.max_redemptions) {
      setResult({ valid: false, status: 'maxed_out', campaign });
      setLoading(false);
      return;
    }

    // Fetch service names if applicable
    let serviceNames: string[] = [];
    if (campaign.applicable_service_ids?.length > 0) {
      const { data: services } = await supabase
        .from('services')
        .select('name')
        .in('id', campaign.applicable_service_ids);
      serviceNames = services?.map((s: any) => s.name) || [];
    }

    setResult({ valid: true, status: 'valid', campaign, serviceNames });
    setLoading(false);
  };

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    valid: { icon: <CheckCircle2 className="w-5 h-5" />, label: 'Valid & Active', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    invalid: { icon: <XCircle className="w-5 h-5" />, label: 'Invalid Code', color: 'text-destructive bg-destructive/10 border-destructive/20' },
    expired: { icon: <Clock className="w-5 h-5" />, label: 'Expired', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    disabled: { icon: <XCircle className="w-5 h-5" />, label: 'Currently Disabled', color: 'text-muted-foreground bg-muted border-border' },
    maxed_out: { icon: <AlertTriangle className="w-5 h-5" />, label: 'Fully Redeemed', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    not_started: { icon: <Clock className="w-5 h-5" />, label: 'Not Yet Active', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Tag className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Check Your Promo Code</h1>
          <p className="text-sm text-muted-foreground">Enter a promo code to see if it's valid and what discount you'll get.</p>
        </div>

        <div className="flex gap-2">
          <Input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setResult(null); }}
            placeholder="Enter promo code"
            className="text-center text-lg font-mono tracking-widest"
            onKeyDown={e => e.key === 'Enter' && checkPromo()}
          />
          <Button onClick={checkPromo} disabled={loading || !code.trim()}>
            {loading ? 'Checking...' : 'Check'}
          </Button>
        </div>

        {result && (
          <Card className={`border ${statusConfig[result.status].color}`}>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-2">
                {statusConfig[result.status].icon}
                <span className="font-semibold">{statusConfig[result.status].label}</span>
              </div>

              {result.campaign && result.valid && (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    {result.campaign.discount_type === 'percentage' ? (
                      <Percent className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">
                      {result.campaign.discount_type === 'percentage'
                        ? `${result.campaign.discount_value}% off`
                        : `$${Number(result.campaign.discount_value).toFixed(2)} off`}
                    </span>
                  </div>

                  {result.campaign.min_order_value > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ShoppingBag className="w-4 h-4" />
                      <span>Minimum order: ${Number(result.campaign.min_order_value).toFixed(2)}</span>
                    </div>
                  )}

                  {result.campaign.start_date && result.campaign.end_date && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Valid: {result.campaign.start_date} — {result.campaign.end_date}</span>
                    </div>
                  )}

                  {result.serviceNames && result.serviceNames.length > 0 ? (
                    <div>
                      <p className="text-muted-foreground mb-1.5">Applies to:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.serviceNames.map(name => (
                          <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
                        ))}
                      </div>
                    </div>
                  ) : result.valid && (
                    <p className="text-muted-foreground">Applies to all services</p>
                  )}

                  {result.campaign.max_redemptions && (
                    <p className="text-xs text-muted-foreground">
                      {result.campaign.max_redemptions - result.campaign.redemptions} uses remaining
                    </p>
                  )}
                </div>
              )}

              {result.status === 'invalid' && (
                <p className="text-sm text-muted-foreground">This promo code doesn't exist. Please double-check and try again.</p>
              )}
              {result.status === 'expired' && (
                <p className="text-sm text-muted-foreground">This promotion ended on {result.campaign?.end_date}.</p>
              )}
              {result.status === 'maxed_out' && (
                <p className="text-sm text-muted-foreground">This promotion has reached its maximum number of uses.</p>
              )}
              {result.status === 'not_started' && (
                <p className="text-sm text-muted-foreground">This promotion starts on {result.campaign?.start_date}.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
