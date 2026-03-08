import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Stethoscope, Home, Sparkles, ArrowRight, PawPrint, Shield, Users, Heart, Calendar, FileText, Pill, Syringe, Package, ClipboardList, DollarSign, BarChart3, Scissors, Star } from 'lucide-react';

const products = [
  {
    key: 'service_provider',
    title: 'Service Provider',
    subtitle: 'For Pet Service Businesses',
    description: 'The complete platform for groomers, walkers, sitters, boarding facilities, and trainers to manage their entire business.',
    icon: Scissors,
    gradient: 'from-blue-600 to-indigo-700',
    lightGradient: 'from-blue-50 to-indigo-50',
    ring: 'ring-blue-500/30',
    iconBg: 'bg-blue-500/10 text-blue-600',
    borderAccent: 'border-blue-200 hover:border-blue-400',
    buttonGradient: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
    features: [
      { icon: Calendar, text: 'Smart booking management' },
      { icon: Users, text: 'Customer CRM & tiers' },
      { icon: BarChart3, text: 'Revenue analytics' },
      { icon: Package, text: 'Inventory tracking' },
    ],
    demo: { email: 'demo@pawparadise.com', password: 'demo123', name: 'Demo Provider' },
    dashPath: '/dashboard',
  },
  {
    key: 'vet_clinic',
    title: 'Veterinary Clinic',
    subtitle: 'Clinical Practice Management',
    description: 'Purpose-built PIMS with SOAP records, prescription management, vaccination tracking, and appointment flow boards.',
    icon: Stethoscope,
    gradient: 'from-cyan-600 to-teal-700',
    lightGradient: 'from-cyan-50 to-teal-50',
    ring: 'ring-teal-500/30',
    iconBg: 'bg-teal-500/10 text-teal-600',
    borderAccent: 'border-teal-200 hover:border-teal-400',
    buttonGradient: 'from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700',
    features: [
      { icon: FileText, text: 'SOAP medical records' },
      { icon: Pill, text: 'Prescription builder' },
      { icon: Syringe, text: 'Vaccination tracking' },
      { icon: Calendar, text: 'Appointment flow board' },
    ],
    demo: { email: 'vet@pawparadise.com', password: 'demo123', name: 'Dr. Sarah O\'Brien' },
    dashPath: '/vet',
  },
  {
    key: 'shelter',
    title: 'Animal Shelter',
    subtitle: 'Shelter & Rescue Operations',
    description: 'Complete shelter management with animal intake, adoption pipelines, volunteer coordination, and donation tracking.',
    icon: Home,
    gradient: 'from-emerald-600 to-green-700',
    lightGradient: 'from-emerald-50 to-green-50',
    ring: 'ring-emerald-500/30',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
    borderAccent: 'border-emerald-200 hover:border-emerald-400',
    buttonGradient: 'from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700',
    features: [
      { icon: Heart, text: 'Animal management' },
      { icon: ClipboardList, text: 'Adoption pipeline' },
      { icon: Users, text: 'Volunteer coordination' },
      { icon: DollarSign, text: 'Donation tracking' },
    ],
    demo: { email: 'shelter@pawparadise.com', password: 'demo123', name: 'Maria Fitzgerald' },
    dashPath: '/shelter',
  },
];

export default function ProductSelectPage() {
  const { provider, vetClinic, shelter, switchProduct, user } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (product) => {
    if (user) {
      // Already logged in
      switchProduct(product.key);
      if (product.key === 'service_provider' && provider) {
        navigate(product.dashPath);
      } else if (product.key === 'vet_clinic' && vetClinic) {
        navigate(product.dashPath);
      } else if (product.key === 'shelter' && shelter) {
        navigate(product.dashPath);
      } else {
        navigate(`/login?product=${product.key}`);
      }
    } else {
      // Not logged in - go to login with product context
      navigate(`/login?product=${product.key}`);
    }
  };

  const hasProfile = (key) => {
    if (key === 'service_provider') return !!provider;
    if (key === 'vet_clinic') return !!vetClinic;
    if (key === 'shelter') return !!shelter;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #3B82F6 0%, transparent 50%), radial-gradient(circle at 75% 50%, #059669 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6">
            <PawPrint className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-white/90">Paw Paradise Platform</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            The Complete Platform for<br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">Pet Industry Professionals</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Three purpose-built products. One unified platform.
            Choose the tool that fits your business.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8 text-sm text-white/40">
            <div className="flex items-center gap-1.5"><Shield className="w-4 h-4" /><span>Secure</span></div>
            <span>•</span>
            <div className="flex items-center gap-1.5"><Star className="w-4 h-4" /><span>Production Ready</span></div>
            <span>•</span>
            <div className="flex items-center gap-1.5"><Sparkles className="w-4 h-4" /><span>Mobile Responsive</span></div>
          </div>
        </div>
      </div>

      {/* Product Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-12 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product) => (
            <div
              key={product.key}
              className={`group relative bg-white rounded-2xl border-2 ${product.borderAccent} shadow-lg shadow-slate-200/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ring-0 hover:ring-4 ${product.ring}`}
            >
              {/* Active badge */}
              {hasProfile(product.key) && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </div>
              )}

              {/* Gradient header */}
              <div className={`bg-gradient-to-r ${product.lightGradient} px-6 pt-6 pb-4`}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${product.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                  <product.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{product.title}</h3>
                <p className="text-sm font-semibold text-slate-500 mt-0.5">{product.subtitle}</p>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 pt-4">
                <p className="text-sm text-slate-500 mb-5 leading-relaxed">{product.description}</p>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {product.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${product.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <f.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{f.text}</span>
                    </div>
                  ))}
                </div>

                {/* Demo info */}
                <div className="bg-slate-50 rounded-xl p-3 mb-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Demo Account</p>
                  <p className="text-sm font-medium text-slate-700">{product.demo.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{product.demo.email}</p>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleSelect(product)}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r ${product.buttonGradient} text-white font-bold text-sm shadow-lg transition-all duration-200 group-hover:shadow-xl`}
                >
                  {hasProfile(product.key) ? 'Open Dashboard' : 'Try Demo'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
