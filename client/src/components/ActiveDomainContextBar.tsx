import React from 'react';
import { ShieldCheck, Layers, ChevronDown } from 'lucide-react';

export const ACCREDITED_DOMAINS = [
  'Healthcare',
  'Infrastructure',
  'Education',
  'Agriculture',
  'Technology',
] as const;

export type AccreditedDomain = (typeof ACCREDITED_DOMAINS)[number];

interface ActiveDomainContextBarProps {
  activeDomain: string;
  onDomainChange: (domain: string) => void;
  role: 'taskholder' | 'regulator' | 'government';
  userName?: string;
}

const DOMAIN_ICONS: Record<string, string> = {
  Healthcare: '🩺',
  Infrastructure: '🏗️',
  Education: '📚',
  Agriculture: '🌾',
  Technology: '💻',
};

const ActiveDomainContextBar: React.FC<ActiveDomainContextBarProps> = ({
  activeDomain,
  onDomainChange,
  role,
  userName,
}) => {
  const isGovt = role === 'government';

  return (
    <div className="w-full bg-[#141414]/95 border border-[#282828] rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-white">
      {/* Left: Role & Identity Scope */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
              {role === 'taskholder'
                ? 'Field Taskholder'
                : role === 'regulator'
                ? 'Department Regulator'
                : 'State Sovereign Government'}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              On-Chain Verified
            </span>
          </div>
          <div className="text-sm font-bold text-white">
            {userName || (role === 'taskholder' ? 'Field Operator' : role === 'regulator' ? 'Department Official' : 'Comptroller General')}
          </div>
        </div>
      </div>

      {/* Right: Domain Context & Single-Wallet Switcher */}
      <div className="flex items-center gap-3 self-end md:self-auto">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Operating Domain:</span>
        </div>

        {isGovt ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1c1c1c] border border-[#282828] rounded-xl text-xs font-semibold text-amber-300 shadow-sm">
            <span>🏛️ Macro Sovereign Oversight (All Domains)</span>
          </div>
        ) : (
          <div className="relative group">
            <select
              value={activeDomain}
              onChange={(e) => onDomainChange(e.target.value)}
              className="appearance-none bg-[#1c1c1c] hover:bg-[#242424] border border-[#282828] hover:border-emerald-500/60 transition text-white text-xs font-bold py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer shadow-inner"
              title="Domain Enforcement Active: Switch domain perspective for single-wallet testing"
            >
              {ACCREDITED_DOMAINS.map((domain) => (
                <option key={domain} value={domain} className="bg-[#141414] text-white">
                  {DOMAIN_ICONS[domain] || '📁'} {domain} Sector
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveDomainContextBar;
