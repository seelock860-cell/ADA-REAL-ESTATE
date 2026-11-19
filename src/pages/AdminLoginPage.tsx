import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { SupabaseSettingsPanel } from '../components/admin/SupabaseSettingsPanel';
import { SeoHead } from '../components/SeoHead';

export function AdminLoginPage() {
  const {
    connectionStatus,
    isAdmin,
    authLoading,
    signInAdmin,
  } = useSupabase();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConnectionConfig, setShowConnectionConfig] = useState(
    connectionStatus !== 'Connected'
  );

  useEffect(() => {
    if (!authLoading && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (connectionStatus !== 'Connected') {
      setShowConnectionConfig(true);
    }
  }, [connectionStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    const result = await signInAdmin(email, password);
    setSubmitting(false);

    if (result.ok) {
      navigate('/admin', { replace: true });
    } else {
      setErrorMsg(result.error || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between">
      <SeoHead
        title="Administrator Login | ADA REAL ESTATE"
        description="Secure Supabase administrator portal for ADA REAL ESTATE property, media, and enquiry management."
      />

      {/* Minimal Header */}
      <div className="border-b border-neutral-800 px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <span className="w-7 h-7 border border-[#D4AF37] flex items-center justify-center text-xs font-serif font-bold text-[#D4AF37]">
            A
          </span>
          <span className="font-serif text-lg font-semibold tracking-[0.14em] text-white">
            ADA REAL ESTATE
          </span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-[#D4AF37] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Public Website
        </Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Login Card */}
          <div className="lg:col-span-6 bg-white text-neutral-950 border border-neutral-200 p-7 sm:p-9 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#99711C]">
                <Lock className="w-3.5 h-3.5" />
                Authorized Personnel Only
              </div>
              <h1 className="font-serif text-3xl font-semibold text-neutral-950">
                Administrator Sign In
              </h1>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Sign in with your Supabase administrator account to manage listings, upload property
                media, and review client enquiries.
              </p>
            </div>

            {/* Connection Indicator */}
            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-[#FAF9F6] border border-neutral-200 text-xs">
              <div className="flex items-center gap-2">
                {connectionStatus === 'Connected' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                )}
                {connectionStatus === 'Connection Error' && (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                {connectionStatus === 'Not Connected' && (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                <span className="font-medium text-neutral-800">
                  Supabase: {connectionStatus}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowConnectionConfig((prev) => !prev)}
                className="text-[#99711C] font-semibold hover:underline"
              >
                {showConnectionConfig ? 'Hide Settings' : 'Configure'}
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700 mb-1.5">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@adarealestate.com"
                  className="w-full bg-[#FAF9F6] border border-neutral-300 px-4 py-3 text-sm text-neutral-950 focus:outline-none focus:border-[#B5892E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#FAF9F6] border border-neutral-300 px-4 py-3 text-sm text-neutral-950 focus:outline-none focus:border-[#B5892E]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || connectionStatus !== 'Connected'}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] bg-neutral-950 text-[#D4AF37] hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Verifying Credentials...' : 'Sign In to Dashboard'}
              </button>
            </form>

            <p className="text-[11px] text-neutral-500 leading-relaxed pt-2 border-t border-neutral-200">
              Admin access requires an active Supabase Auth account whose row in{' '}
              <code>public.profiles</code> has <code>role = &apos;admin&apos;</code>.
            </p>
          </div>

          {/* Supabase Connection Panel */}
          <div className="lg:col-span-6 space-y-4">
            {showConnectionConfig ? (
              <div className="bg-white text-neutral-950 border border-neutral-200 p-6 sm:p-7 space-y-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#99711C]">
                  <Database className="w-4 h-4" />
                  Supabase Connection Settings
                </div>
                <SupabaseSettingsPanel />
              </div>
            ) : (
              <div className="border border-neutral-800 bg-neutral-900/80 p-7 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
                  Supabase Security Architecture
                </p>
                <h2 className="font-serif text-2xl font-semibold text-white">
                  Protected by Row Level Security
                </h2>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  All property uploads, image and video storage mutations, enquiries, and customer
                  testimonials are guarded by Supabase Auth and PostgreSQL RLS policies.
                </p>
                <button
                  type="button"
                  onClick={() => setShowConnectionConfig(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border border-neutral-700 text-neutral-200 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >
                  <Database className="w-4 h-4" />
                  Manage Supabase Connection
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
