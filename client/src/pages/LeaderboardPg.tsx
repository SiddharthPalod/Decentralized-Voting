import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, ShieldCheck, BarChart3 } from 'lucide-react';
import WalletSelector from '../components/WalletSelector';
import ThemeToggle from '../components/ThemeToggle';
import DomainLeaderboard from '../components/DomainLeaderboard';
import { taskLedger, LedgerTask, DepartmentBudget } from '../services/taskLedgerService';
import Logo from '../assets/logo.png';

const LeaderboardPg: React.FC = () => {
  const navigate = useNavigate();
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
  const totalApproved = tasks
    .filter((t) => t.status === 'Approved')
    .reduce((sum, t) => sum + (t.actualMoneySpent || t.moneyAllocated), 0);

  return (
    <section className="relative flex flex-col items-center min-h-screen px-4 md:px-8 py-6 w-full overflow-x-hidden font-primary selection:bg-emerald-500 selection:text-black app-page-bg">
      {/* Top Navbar */}
      <div id="navbar" className="flex flex-row justify-between w-full max-w-7xl items-center py-4 z-40">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={Logo}
            className="h-10 md:h-12 w-auto object-contain shrink-0"
            alt="TrueLedger Logo"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
          />
          <span className="text-xl md:text-2xl font-headline font-bold text-white tracking-wider">
            TRUELEDGER
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/clientpg');
              }
            }}
            className="p-2.5 rounded-xl bg-[#1c1c1c] hover:bg-[#242424] text-neutral-200 hover:text-white border border-[#282828] shadow-sm transition flex items-center justify-center group"
            title="Go Back"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <ThemeToggle />
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
          Decentralized ranking benchmarks domains by task throughput and verified execution milestone efficiency. 
          Individual regulators and taskholders remain pseudonymous to preserve zero-knowledge integrity.
        </p>

        {/* Global Key Metrics Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto text-left">
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
