import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PawPrint, Eye, EyeOff, Stethoscope, Home, Scissors, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';

const PRODUCT_CONFIG = {
  service_provider: {
    title: 'Service Provider',
    icon: Scissors,
    gradient: 'from-blue-600 to-indigo-700',
    accent: 'bg-blue-600 hover:bg-blue-700',
    ring: 'focus:ring-blue-500/20 focus:border-blue-500',
    demo: { email: 'demo@pawparadise.com', password: 'demo123' },
    dashPath: '/dashboard',
  },
  vet_clinic: {
    title: 'Veterinary Clinic',
    icon: Stethoscope,
    gradient: 'from-cyan-600 to-teal-700',
    accent: 'bg-teal-600 hover:bg-teal-700',
    ring: 'focus:ring-teal-500/20 focus:border-teal-500',
    demo: { email: 'vet@pawparadise.com', password: 'demo123' },
    dashPath: '/vet',
  },
  shelter: {
    title: 'Animal Shelter',
    icon: Home,
    gradient: 'from-emerald-600 to-green-700',
    accent: 'bg-emerald-600 hover:bg-emerald-700',
    ring: 'focus:ring-emerald-500/20 focus:border-emerald-500',
    demo: { email: 'shelter@pawparadise.com', password: 'demo123' },
    dashPath: '/shelter',
  },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productKey = searchParams.get('product') || 'service_provider';
  const config = PRODUCT_CONFIG[productKey] || PRODUCT_CONFIG.service_provider;
  const ProductIcon = config.icon;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Pre-fill demo credentials when product changes
  useEffect(() => {
    if (config.demo) {
      setEmail(config.demo.email);
      setPassword(config.demo.password);
    }
  }, [productKey, config.demo]);

  const doLogin = useCallback(async (loginEmail, loginPassword) => {
    setError('');
    setLoading(true);
    try {
      const result = await login(loginEmail, loginPassword);
      const pt = result.user?.product_type;
      if (pt === 'vet_clinic') navigate('/vet');
      else if (pt === 'shelter') navigate('/shelter');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please check your email and password.');
      setLoading(false);
    }
  }, [login, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setEmail(config.demo.email);
    setPassword(config.demo.password);
    await doLogin(config.demo.email, config.demo.password);
    setDemoLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-3xl" />
      </div>

      {/* Back button */}
      <div className="relative z-10 px-4 sm:px-6 pt-6">
        <button
          onClick={() => navigate('/select-product')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>
      </div>

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Product Badge + Logo */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} mb-4 shadow-2xl`}>
              <ProductIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Paw Paradise
            </h1>
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-white/10 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm font-medium text-white/80">{config.title}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* One-Click Demo */}
            <div className={`bg-gradient-to-r ${config.gradient} px-6 py-5`}>
              <div className="text-center">
                <p className="text-white/80 text-sm mb-3">Try {config.title} instantly</p>
                <button
                  onClick={handleDemoLogin}
                  disabled={demoLoading || loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-white rounded-xl text-slate-900 font-bold text-sm hover:bg-white/95 transition-all shadow-lg disabled:opacity-70"
                >
                  {demoLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <PawPrint className="w-4 h-4" />
                      One-Click Demo Login
                    </>
                  )}
                </button>
                <p className="text-white/50 text-xs mt-2">{config.demo.email}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="relative px-6 py-4">
              <div className="absolute inset-0 flex items-center px-6">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">or sign in with email</span>
              </div>
            </div>

            {/* Login Form */}
            <div className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className={`h-11 ${config.ring}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className={`h-11 pr-10 ${config.ring}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className={`w-full h-11 ${config.accent} text-white font-bold`}
                  disabled={loading || demoLoading}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing in...</>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-5">
                Don't have an account?{' '}
                <Link to="/register" className="text-slate-900 font-semibold hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          </div>

          {/* Other products */}
          <div className="mt-6 text-center">
            <p className="text-xs text-white/30 mb-3">Or try another product</p>
            <div className="flex items-center justify-center gap-3">
              {Object.entries(PRODUCT_CONFIG)
                .filter(([key]) => key !== productKey)
                .map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => navigate(`/login?product=${key}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all"
                    >
                      <Icon className="w-4 h-4" />
                      {cfg.title}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
