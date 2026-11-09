import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft, ShieldCheck, Sparkles, BarChart3 } from 'lucide-react';
import WalletSelector from '../components/WalletSelector';
import DomainLeaderboard from '../components/DomainLeaderboard';
import { taskLedger, LedgerTask, DepartmentBudget } from '../services/taskLedgerService';
import Logo from '../assets/logo.png';
import bgtexture from '../assets/bgTexture.jpg';

const LeaderboardPg: React.FC = () => {
  const [tasks, setTasks] = useState<LedgerTask[]>(() => taskLedger.getAllTasks());
  const [budgets, setBudgets] = useState<DepartmentBudget[]>(() => taskLedger.getAllBudgets());

  const loadData = () => {
    setTasks(taskLedger.getAllTasks());
    setBudgets(taskLedger.getAllBudgets());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = taskLedger.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const totalCompleted = tasks.filter((t) => t.status === 'Approved' || t.status === 'Completed').length;
  const totalSaved = tasks
    .filter((t) => t.status === 'Approved' && t.actualMoneySpent)
    .reduce((sum, t) => sum + Math.max(0, t.moneyAllocated - (t.actualMoneySpent || t.moneyAllocated)), 0);
  const totalApproved = tasks
    .filter((t) => t.status === 'Approved')
    .reduce((sum, t) => sum + (t.actualMoneySpent || t.moneyAllocated), 0);

  return (
    <section
      className="relative flex flex-col items-center min-h-screen px-4 md:px-8 py-6 w-full overflow-x-hidden font-primary selection:bg-emerald-500 selection:text-black"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, rgba(20, 30, 25, 0.7) 0%, rgba(5, 5, 5, 0.95) 75%), url(${bgtexture})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top Navbar */}
      <div id="navbar" className="flex flex-row justify-between w-full max-w-7xl items-center py-4 z-40">
        <Link to="/serverpg" className="flex items-center gap-3">
          <img src={Logo} className="h-10 md:h-12" alt="TrueLedger Logo" />
          <span className="text-xl md:text-2xl font-headline font-bold text-white tracking-wider">
            TRUELEDGER
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/serverpg"
            className="text-xs font-semibold px-3.5 py-2 bg-[#1c1c1c] hover:bg-[#242424] text-neutral-200 rounded-xl border border-[#282828] shadow-sm transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Regulator Portal
          </Link>
          <WalletSelector />
        </div>
      </div>

      {/* Hero Header */}
      <div className="w-full max-w-7xl my-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Decentralized Domain Leaderboard</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold font-headline text-white tracking-tight">
          Department Performance & Integrity
        </h1>
        <p className="mt-2 text-sm md:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Decentralized ranking benchmarks domains by execution milestone efficiency and fiscal surplus returned. 
          Individual regulators and taskholders remain pseudonymous to preserve zero-knowledge integrity.
        </p>

        {/* Global Key Metrics Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-4xl mx-auto text-left">
          <div className="bg-[#141414]/90 border border-[#282828] p-4 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Tasks Audited</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-headline text-white mt-1">
              {totalCompleted} Milestones
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">100% On-Chain Verified</span>
          </div>

          <div className="bg-[#141414]/90 border border-[#282828] p-4 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Verified Disbursed</span>
              <BarChart3 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-headline text-white mt-1">
              ₹ {totalApproved.toLocaleString()}
            </div>
            <span className="text-[11px] text-blue-300 font-medium">Direct Settlement</span>
          </div>

          <div className="bg-[#141414]/90 border border-[#282828] p-4 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Treasury Funds Saved</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-headline text-amber-400 mt-1">
              ₹ {totalSaved.toLocaleString()}
            </div>
            <span className="text-[11px] text-amber-300 font-medium">Refunded to Treasury Pools</span>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Content */}
      <div className="w-full max-w-7xl mt-4 mb-16">
        <DomainLeaderboard tasks={tasks} budgets={budgets} />
      </div>
    </section>
  );
};

export default LeaderboardPg;
