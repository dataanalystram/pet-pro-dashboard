import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { providerAPI } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Scissors, Stethoscope, Dog, Home, GraduationCap, Truck,
  ArrowRight, ArrowLeft, CheckCircle, PawPrint, MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BUSINESS_TYPES = [
  { id: 'grooming', label: 'Grooming', icon: Scissors, desc: 'Baths, haircuts, nail trims' },
  { id: 'veterinary', label: 'Veterinary', icon: Stethoscope, desc: 'Medical care & checkups' },
  { id: 'walking', label: 'Dog Walking', icon: Dog, desc: 'Daily walks & exercise' },
  { id: 'boarding', label: 'Boarding', icon: Home, desc: 'Overnight & daycare' },
  { id: 'training', label: 'Training', icon: GraduationCap, desc: 'Obedience & behavior' },
  { id: 'sitting', label: 'Pet Sitting', icon: PawPrint, desc: 'In-home pet care' },
];

export default function OnboardingPage() {
  const { user, refreshProvider } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_type: '',
    business_name: '',
    phone: '',
    address_line1: '',
    city: '',
    postal_code: '',
    is_mobile: false,
    service_radius_km: 10,
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await providerAPI.onboard({
        ...form,
        email: user?.email,
      });
      await refreshProvider();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                step >= s ? "bg-provider-primary text-white" : "bg-slate-700 text-slate-400"
              )}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={cn("w-16 h-0.5", step > s ? "bg-provider-primary" : "bg-slate-700")} />}
            </div>
          ))}
        </div>

        <Card className="border-0 shadow-2xl bg-white/[0.97]" data-testid="onboarding-card">
          <CardContent className="p-6 md:p-8">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200 mb-4" data-testid="onboarding-error">
                {error}
              </div>
            )}

            {/* Step 1: Business Type */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">What type of business do you run?</h2>
                <p className="text-sm text-slate-500 mb-6">We'll customize your dashboard based on your selection</p>
                <div className="grid grid-cols-2 gap-3" data-testid="business-type-grid">
                  {BUSINESS_TYPES.map((bt) => (
                    <button
                      key={bt.id}
                      onClick={() => update('business_type', bt.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                        form.business_type === bt.id
                          ? "border-provider-primary bg-blue-50 text-provider-primary"
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                      )}
                      data-testid={`business-type-${bt.id}`}
                    >
                      <bt.icon className="w-7 h-7" />
                      <span className="text-sm font-semibold">{bt.label}</span>
                      <span className="text-xs opacity-70">{bt.desc}</span>
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => setStep(2)}
                  className="w-full mt-6 bg-provider-primary hover:bg-blue-700"
                  disabled={!form.business_type}
                  data-testid="onboarding-next-1"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Business Details */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Tell us about your business</h2>
                <p className="text-sm text-slate-500 mb-6">Basic info to get you started</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Business Name *</Label>
                    <Input
                      value={form.business_name}
                      onChange={(e) => update('business_name', e.target.value)}
                      placeholder="e.g. Happy Paws Grooming"
                      data-testid="onboarding-business-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder="+353 1 234 5678"
                      data-testid="onboarding-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={form.address_line1}
                      onChange={(e) => update('address_line1', e.target.value)}
                      placeholder="Street address"
                      data-testid="onboarding-address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={form.city}
                        onChange={(e) => update('city', e.target.value)}
                        placeholder="Dublin"
                        data-testid="onboarding-city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Postal Code</Label>
                      <Input
                        value={form.postal_code}
                        onChange={(e) => update('postal_code', e.target.value)}
                        placeholder="D02 Y728"
                        data-testid="onboarding-postal"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <MapPin className="w-5 h-5 text-slate-500" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-700">Mobile service?</span>
                      <p className="text-xs text-slate-500">You travel to customers</p>
                    </div>
                    <button
                      onClick={() => update('is_mobile', !form.is_mobile)}
                      className={cn(
                        "w-10 h-6 rounded-full transition-colors relative",
                        form.is_mobile ? "bg-provider-primary" : "bg-slate-300"
                      )}
                      data-testid="onboarding-mobile-toggle"
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                        form.is_mobile ? "translate-x-5" : "translate-x-1"
                      )} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1" data-testid="onboarding-back-2">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-provider-primary hover:bg-blue-700"
                    disabled={!form.business_name}
                    data-testid="onboarding-next-2"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Launch */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">You're all set!</h2>
                <p className="text-sm text-slate-500 mb-6">Review your info and launch your profile</p>
                <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Business Type</span>
                    <span className="font-medium text-slate-900 capitalize">{form.business_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Business Name</span>
                    <span className="font-medium text-slate-900">{form.business_name}</span>
                  </div>
                  {form.city && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Location</span>
                      <span className="font-medium text-slate-900">{form.city}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Service Type</span>
                    <span className="font-medium text-slate-900">{form.is_mobile ? 'Mobile' : 'Location-based'}</span>
                  </div>
                </div>
                <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-lg mt-4 border border-blue-200">
                  You can always update these details later in Settings. Features will be customized based on your business type.
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1" data-testid="onboarding-back-3">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-provider-primary hover:bg-blue-700"
                    disabled={loading}
                    data-testid="onboarding-launch"
                  >
                    {loading ? 'Setting up...' : 'Launch Dashboard'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
