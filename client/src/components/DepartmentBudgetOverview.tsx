import React, { useState } from 'react';
import { DepartmentBudget, MACRO_BUDGETS } from '../services/taskLedgerService';
import { PieChart, TrendingUp, ShieldCheck, DollarSign, Users } from 'lucide-react';

interface DepartmentBudgetOverviewProps {
  budgets?: DepartmentBudget[];
  selectedSector: string;
  onSelectSector: (sector: string) => void;
}

const SECTOR_COLORS: Record<string, { stroke: string; bg: string; text: string }> = {
  Healthcare: { stroke: '#10B981', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  Infrastructure: { stroke: '#06B6D4', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  Education: { stroke: '#8B5CF6', bg: 'bg-violet-500/10', text: 'text-violet-400' },
  Agriculture: { stroke: '#F59E0B', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  Technology: { stroke: '#F43F5E', bg: 'bg-rose-500/10', text: 'text-rose-400' },
  'Contingency & Reserves': { stroke: '#6B7280', bg: 'bg-neutral-500/10', text: 'text-neutral-400' },
};

const DepartmentBudgetOverview: React.FC<DepartmentBudgetOverviewProps> = ({
  budgets,
  selectedSector,
  onSelectSector,
}) => {
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  const safeBudgets = budgets && budgets.length > 0 ? budgets : MACRO_BUDGETS;
  const activeSectorBudget =
    safeBudgets.find((b) => b.sector.toLowerCase() === selectedSector.toLowerCase()) ||
    safeBudgets[0] || {
      sector: selectedSector,
      percentage: 10,
      totalBudget: 200000,
      disbursedFunds: 0,
      committedFunds: 0,
    };

  const totalMacroBudget = safeBudgets.reduce((sum, b) => sum + (b.totalBudget || 0), 0);

  const availableInSector = Math.max(
    0,
    (activeSectorBudget.totalBudget || 0) -
      (activeSectorBudget.disbursedFunds || 0) -
      (activeSectorBudget.committedFunds || 0)
  );

  const totalCommittedOrDisbursed =
    (activeSectorBudget.disbursedFunds || 0) + (activeSectorBudget.committedFunds || 0);

  const utilizationPercent =
    activeSectorBudget.totalBudget > 0
      ? Math.min(
          100,
          Math.round((totalCommittedOrDisbursed / activeSectorBudget.totalBudget) * 100)
        )
      : 0;

  // Calculate SVG Pie Segments
  let cumulativePercent = 0;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="w-full bg-[#141414]/95 border border-[#282828] rounded-2xl p-5 shadow-2xl backdrop-blur-xl mb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#242424] pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>Level 1 & 2 Fund Governance • Department Budget Pools</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-headline text-white mt-1">
            Macro State Allocation & Synchronized Pool
          </h2>
        </div>
        <div className="text-right">
          <div className="text-xs text-neutral-400 font-semibold">Total State Treasury</div>
          <div className="text-lg md:text-xl font-headline font-bold text-white">
            ₹ {totalMacroBudget.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Grid: Pie Chart on Left, Active Department Breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Interactive SVG Donut Chart */}
        <div className="lg:col-span-5 flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {safeBudgets.map((b) => {
                const strokeDasharray = `${(b.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((cumulativePercent / 100) * circumference);
                cumulativePercent += b.percentage;
                const isSelected = selectedSector.toLowerCase() === b.sector.toLowerCase();
                const isHovered = hoveredSector === b.sector;
                const color = SECTOR_COLORS[b.sector]?.stroke || '#6B7280';

                return (
                  <circle
                    key={b.sector}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={isSelected || isHovered ? '24' : '18'}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="cursor-pointer transition-all duration-300 hover:opacity-100 opacity-90"
                    onMouseEnter={() => setHoveredSector(b.sector)}
                    onMouseLeave={() => setHoveredSector(null)}
                    onClick={() => onSelectSector(b.sector)}
                  />
                );
              })}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                {hoveredSector || selectedSector}
              </span>
              <span className="text-xl font-headline font-bold text-white">
                {(
                  safeBudgets.find(
                    (b) =>
                      b.sector.toLowerCase() ===
                      (hoveredSector || selectedSector).toLowerCase()
                  )?.percentage || 0
                )}%
              </span>
            </div>
          </div>

          {/* Sector Badges List */}
          <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto">
            {safeBudgets.map((b) => {
              const isSelected = selectedSector.toLowerCase() === b.sector.toLowerCase();
              const colors = SECTOR_COLORS[b.sector] || {
                stroke: '#6B7280',
                bg: 'bg-neutral-800',
                text: 'text-neutral-300',
              };

              return (
                <button
                  key={b.sector}
                  onClick={() => onSelectSector(b.sector)}
                  onMouseEnter={() => setHoveredSector(b.sector)}
                  onMouseLeave={() => setHoveredSector(null)}
                  className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition ${
                    isSelected
                      ? 'bg-neutral-800 border-neutral-600 text-white shadow-md'
                      : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: colors.stroke }}
                  />
                  <span className="truncate">{b.sector}</span>
                  <span className="ml-auto text-[10px] text-neutral-500 font-mono">
                    {b.percentage}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Synchronized Department Pool Card */}
        <div className="lg:col-span-7 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#282828] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    SECTOR_COLORS[activeSectorBudget.sector]?.stroke || '#10B981',
                }}
              />
              <h3 className="font-headline font-bold text-lg text-white">
                {activeSectorBudget.sector} Department Pool
              </h3>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Users className="w-3 h-3" /> Synced Across All Regulators
              </span>
            </div>
            <div className="text-xs text-neutral-400 font-medium">
              Allocation: <strong className="text-white">{activeSectorBudget.percentage}%</strong> of State Total
            </div>
          </div>

          {/* Metric Triplet */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
            <div className="bg-[#141414] border border-[#282828] p-3 rounded-lg">
              <div className="text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-neutral-400" /> Total Dept Budget
              </div>
              <div className="text-base font-bold font-headline text-white">
                ₹ {activeSectorBudget.totalBudget.toLocaleString()}
              </div>
            </div>

            <div className="bg-[#141414] border border-[#282828] p-3 rounded-lg">
              <div className="text-[11px] font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Funds Disbursed
              </div>
              <div className="text-base font-bold font-headline text-emerald-400">
                ₹ {activeSectorBudget.disbursedFunds.toLocaleString()}
              </div>
            </div>

            <div className="bg-[#141414] border border-[#282828] p-3 rounded-lg">
              <div className="text-[11px] font-semibold text-cyan-400 mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-cyan-400" /> Remaining Available
              </div>
              <div className="text-base font-bold font-headline text-cyan-300">
                ₹ {availableInSector.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Department Budget Utilization Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>Pool Utilization & Active Commitment</span>
              <span className="font-mono text-neutral-200">{utilizationPercent}% committed/disbursed</span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{
                  width: `${(activeSectorBudget.disbursedFunds / activeSectorBudget.totalBudget) * 100}%`,
                }}
                title="Disbursed"
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{
                  width: `${(activeSectorBudget.committedFunds / activeSectorBudget.totalBudget) * 100}%`,
                }}
                title="Committed in Ongoing Tasks"
              />
            </div>
            <div className="flex gap-4 text-[10px] text-neutral-400 mt-1.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Disbursed (Audited)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Committed (Active)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-neutral-700" /> Available Pool
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentBudgetOverview;
