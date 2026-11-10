import React from 'react';
import { Award, ShieldCheck, Trophy, Sparkles } from 'lucide-react';
import { LedgerTask, DepartmentBudget, MACRO_BUDGETS } from '../services/taskLedgerService';

interface DomainLeaderboardProps {
  tasks?: LedgerTask[];
  budgets?: DepartmentBudget[];
}

interface SectorScore {
  sector: string;
  completedTasks: number;
  totalTasks: number;
  fundsDisbursed: number;
  efficiencyScore: number;
}

const DomainLeaderboard: React.FC<DomainLeaderboardProps> = ({ tasks, budgets }) => {
  const safeBudgets = budgets && budgets.length > 0 ? budgets : MACRO_BUDGETS;
  const safeTasks = tasks || [];

  // Compute aggregated scores per sector
  const sectorScores: SectorScore[] = safeBudgets.map((b) => {
    const sectorTasks = safeTasks.filter(
      (t) => t.sector && t.sector.toLowerCase() === b.sector.toLowerCase()
    );
    const completed = sectorTasks.filter((t) => t.status === 'Approved' || t.status === 'Completed').length;
    const disbursed = sectorTasks
      .filter((t) => t.status === 'Approved')
      .reduce((sum, t) => sum + (t.actualMoneySpent || t.moneyAllocated), 0);

    // Efficiency score formula: (Completed * 20) + baseline bonus for verified delivery
    const efficiency = completed * 20 + (completed > 0 ? 50 : 0);

    return {
      sector: b.sector,
      completedTasks: completed,
      totalTasks: sectorTasks.length,
      fundsDisbursed: disbursed,
      efficiencyScore: efficiency,
    };
  }).sort((a, b) => b.efficiencyScore - a.efficiencyScore);

  return (
    <div className="w-full bg-[#141414]/95 border border-[#282828] rounded-2xl p-5 shadow-2xl backdrop-blur-xl mb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#242424] pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Decentralized Governance Benchmark</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-headline text-white mt-1">
            Department Performance & Anti-Corruption Leaderboard
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Ranked by task throughput and verified audit integrity (Zero individual identities exposed).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Fiscal Season 2026
          </span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="text-[11px] uppercase tracking-wider text-neutral-400 bg-neutral-900/60 border-b border-[#282828]">
            <tr>
              <th className="py-3 px-4 font-semibold">Rank</th>
              <th className="py-3 px-4 font-semibold">Department Domain</th>
              <th className="py-3 px-4 font-semibold text-center">Tasks Completed</th>
              <th className="py-3 px-4 font-semibold text-right">Funds Disbursed</th>
              <th className="py-3 px-4 font-semibold text-right">Integrity Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#242424]">
            {sectorScores.map((score, index) => {
              const rank = index + 1;
              const isFirst = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;

              return (
                <tr
                  key={score.sector}
                  className={`hover:bg-neutral-900/50 transition ${
                    isFirst ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold font-mono">
                    {isFirst ? (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Trophy className="w-4 h-4" /> #1
                      </span>
                    ) : isSecond ? (
                      <span className="flex items-center gap-1 text-neutral-300">
                        <Award className="w-4 h-4 text-neutral-400" /> #2
                      </span>
                    ) : isThird ? (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Award className="w-4 h-4 text-amber-600" /> #3
                      </span>
                    ) : (
                      <span className="text-neutral-500">#{rank}</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span>{score.sector}</span>
                      {isFirst && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                          Domain Leader
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 bg-neutral-800 rounded-lg text-xs font-mono font-bold text-white">
                      {score.completedTasks} / {score.totalTasks || 1}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-400">
                    ₹ {score.fundsDisbursed.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {score.efficiencyScore} pts
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DomainLeaderboard;
