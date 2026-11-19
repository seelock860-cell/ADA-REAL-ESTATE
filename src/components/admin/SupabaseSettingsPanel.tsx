import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Database,
  Copy,
  Check,
  Unplug,
  ShieldAlert,
} from 'lucide-react';
import { useSupabase } from '../../context/SupabaseContext';
import schemaSql from '../../../supabase/schema.sql?raw';

export function SupabaseSettingsPanel() {
  const {
    config,
    connectionStatus,
    connectionMessage,
    schemaMissing,
    isValidatingConnection,
    connectToSupabase,
    disconnectSupabase,
    showToast,
  } = useSupabase();

  const [projectUrl, setProjectUrl] = useState(config.url);
  const [publishableKey, setPublishableKey] = useState(config.publishableKey);
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    await connectToSupabase(projectUrl, publishableKey);
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(schemaSql);
      setCopiedSql(true);
      showToast('success', 'SQL Schema Copied', 'Paste and run it in your Supabase SQL Editor.');
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      showToast('error', 'Copy Failed', 'Please select and copy the SQL manually.');
    }
  };

  const statusConfig =
    connectionStatus === 'Connected'
      ? {
          icon: CheckCircle2,
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          badge: 'text-emerald-700',
          label: 'Connected',
        }
      : connectionStatus === 'Connection Error'
        ? {
            icon: XCircle,
            bg: 'bg-red-50 border-red-200 text-red-900',
            badge: 'text-red-700',
            label: 'Connection Error',
          }
        : {
            icon: AlertTriangle,
            bg: 'bg-amber-50 border-amber-200 text-amber-900',
            badge: 'text-amber-700',
            label: 'Not Connected',
          };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Connection Status Banner */}
      <div className={`border p-4 sm:p-5 flex items-start gap-3.5 ${statusConfig.bg}`}>
        <StatusIcon className={`w-5 h-5 shrink-0 mt-0.5 ${statusConfig.badge}`} />
        <div className="space-y-1 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
              Connection Status: <span className={statusConfig.badge}>{statusConfig.label}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{connectionMessage}</p>
        </div>
      </div>

      {/* Security Reminder */}
      <div className="border border-neutral-200 bg-[#FAF9F6] p-4 flex items-start gap-3 text-xs text-neutral-700">
        <ShieldAlert className="w-4 h-4 text-[#99711C] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Enter only your <strong>Supabase Project URL</strong> and public{' '}
          <strong>Publishable Key</strong> (or <code>anon</code> key). Never paste a{' '}
          <code>service_role</code> or secret key in frontend settings.
        </p>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleConnect} className="bg-white border border-neutral-200 p-6 space-y-5">
        <div>
          <label
            htmlFor="supabase-project-url"
            className="block text-xs font-semibold uppercase tracking-[0.14em] text-neutral-700 mb-1.5"
          >
            Supabase Project URL
          </label>
          <input
            id="supabase-project-url"
            type="url"
            required
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
            placeholder="https://your-project-ref.supabase.co"
            className="w-full bg-[#FAF9F6] border border-neutral-300 px-4 py-2.5 text-sm font-mono text-neutral-950 focus:outline-none focus:border-[#B5892E]"
          />
        </div>

        <div>
          <label
            htmlFor="supabase-publishable-key"
            className="block text-xs font-semibold uppercase tracking-[0.14em] text-neutral-700 mb-1.5"
          >
            Supabase Publishable Key
          </label>
          <input
            id="supabase-publishable-key"
            type="password"
            required
            value={publishableKey}
            onChange={(e) => setPublishableKey(e.target.value)}
            placeholder="sb_publishable_... or eyJhbGci..."
            className="w-full bg-[#FAF9F6] border border-neutral-300 px-4 py-2.5 text-sm font-mono text-neutral-950 focus:outline-none focus:border-[#B5892E]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isValidatingConnection}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] bg-neutral-950 text-[#D4AF37] hover:bg-neutral-800 disabled:opacity-60 transition-colors"
          >
            {isValidatingConnection ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            {isValidatingConnection ? 'Validating Connection...' : 'Connect to Supabase'}
          </button>

          {connectionStatus === 'Connected' && (
            <button
              type="button"
              onClick={() => {
                disconnectSupabase();
                setProjectUrl('');
                setPublishableKey('');
              }}
              className="inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border border-neutral-300 text-neutral-700 hover:border-red-500 hover:text-red-700 transition-colors"
            >
              <Unplug className="w-4 h-4" />
              Disconnect
            </button>
          )}
        </div>
      </form>

      {/* Schema & Storage Setup Guide */}
      <div className="border border-neutral-200 bg-white">
        <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200">
          <div>
            <h3 className="font-serif text-lg font-semibold text-neutral-950">
              Supabase Database Schema, RLS &amp; Storage Setup
            </h3>
            <p className="text-xs text-neutral-600 mt-0.5">
              {schemaMissing
                ? 'Action Required: Run this SQL script in your Supabase SQL Editor to create all required tables and storage buckets.'
                : 'Creates tables (properties, property_images, property_videos, enquiries, testimonials, profiles) and storage buckets.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider bg-[#D4AF37] text-neutral-950 hover:bg-[#e2c276]"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSql ? 'Copied' : 'Copy SQL'}
            </button>
            <button
              type="button"
              onClick={() => setShowSql((prev) => !prev)}
              className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border border-neutral-300 text-neutral-800 hover:border-neutral-950"
            >
              {showSql ? 'Hide SQL' : 'View SQL'}
            </button>
          </div>
        </div>

        {showSql && (
          <div className="p-4 bg-neutral-950 text-neutral-200 overflow-x-auto max-h-96">
            <pre className="text-xs font-mono leading-relaxed whitespace-pre">{schemaSql}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
