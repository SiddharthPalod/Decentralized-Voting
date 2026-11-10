import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WalletSelector from '../components/WalletSelector';
import ThemeToggle from '../components/ThemeToggle';
import {
  taskLedger,
  GovernmentTreasury,
  DepartmentBudget,
  BudgetRequest,
  LedgerTask,
} from '../services/taskLedgerService';
import GovtTreasuryOverview from '../components/GovtTreasuryOverview';
import GovtRequestReviewModal from '../components/GovtRequestReviewModal';
import ActiveDomainContextBar from '../components/ActiveDomainContextBar';
import Logo from '../assets/logo.png';
import {
  Landmark,
  ShieldCheck,
  TrendingUp,
  Trophy,
} from 'lucide-react';

const GovtIntroPg: React.FC = () => {
  const navigate = useNavigate();

  const [treasury, setTreasury] = useState<GovernmentTreasury>(() => taskLedger.getTreasury());
  const [budgets, setBudgets] = useState<DepartmentBudget[]>(() => taskLedger.getAllBudgets());
  const [requests, setRequests] = useState<BudgetRequest[]>(() => taskLedger.getAllBudgetRequests());
  const [tasks, setTasks] = useState<LedgerTask[]>(() => taskLedger.getAllTasks());

  const [selectedRequest, setSelectedRequest] = useState<BudgetRequest | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [requestFilter, setRequestFilter] = useState<'ALL' | 'Pending' | 'Approved' | 'Rejected'>('ALL');

  const refreshData = () => {
    setTreasury(taskLedger.getTreasury());
    setBudgets(taskLedger.getAllBudgets());
    setRequests(taskLedger.getAllBudgetRequests());
    setTasks(taskLedger.getAllTasks());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = taskLedger.subscribe(refreshData);
    return () => unsubscribe();
  }, []);

  const openReviewModal = (req: BudgetRequest) => {
    setSelectedRequest(req);
    setIsReviewModalOpen(true);
  };

  const filteredRequests = requests.filter((r) => {
    if (requestFilter === 'ALL') return true;
    return r.status === requestFilter;
  });

  const pendingRequestsCount = requests.filter((r) => r.status === 'Pending').length;

  return (
    <section className="flex flex-col font-primary items-center p-4 min-h-screen text-white bg-black app-page-bg">
      {/* Top Navbar */}
      <div id="navbar" className="flex flex-row justify-between w-full max-w-7xl items-center py-4 z-40 border-b border-[#282828] mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={Logo}
              className="h-10 md:h-12 w-auto object-contain shrink-0"
              alt="TrueLedger Logo"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-headline font-bold text-white tracking-wider">
                TRUELEDGER
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider">
                🏛️ State Government
              </span>
            </div>
          </Link>
        </div>

        <div className="flex flex-row items-center gap-3">
          {/* Global Role Switcher Dropdown */}
          <div className="relative">
            <select
              value="/govtpg"
              onChange={(e) => navigate(e.target.value)}
              className="bg-[#1c1c1c] hover:bg-[#242424] border border-[#282828] text-white text-xs font-bold py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer shadow-sm transition"
            >
              <option value="/govtpg" className="bg-[#141414] text-white">🏛️ State Government</option>
              <option value="/serverpg" className="bg-[#141414] text-white">🛡️ Department Regulator</option>
              <option value="/clientpg" className="bg-[#141414] text-white">🧑‍🔧 Field Taskholder</option>
            </select>
          </div>

          <ThemeToggle />
          <WalletSelector />

          <Link
            to="/leaderboard"
            className="relative p-2.5 rounded-xl bg-[#1c1c1c] hover:bg-[#242424] border border-[#282828] text-white transition flex items-center justify-center shadow-lg group"
            title="Department Performance & Anti-Corruption Leaderboard"
          >
            <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="w-full max-w-7xl space-y-6">
        {/* Domain Context Bar */}
        <ActiveDomainContextBar
          activeDomain="Government"
          onDomainChange={() => {}}
          role="government"
          userName="State Comptroller & Auditor General"
        />

        {/* Master Treasury Overview */}
        <GovtTreasuryOverview
          treasury={treasury}
          budgets={budgets}
          onAllocationSuccess={refreshData}
        />

        {/* Department Pools Solvency Matrix */}
        <div className="w-full bg-[#141414]/95 border border-[#282828] rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4 border-b border-[#282828] pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold font-headline text-white">Department Pool Solvency Matrix</h3>
            </div>
            <span className="text-xs text-neutral-400 font-mono">Synchronized On-Chain Ledger</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => {
              const total = b.totalBudget || 1;
              const committed = b.committedFunds || 0;
              const disbursed = b.disbursedFunds || 0;
              const free = Math.max(0, total - committed - disbursed);
              const utilizedPercent = Math.min(100, Math.round(((committed + disbursed) / total) * 100));

              return (
                <div key={b.sector} className="bg-[#1c1c1c] border border-[#282828] p-4 rounded-xl shadow">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-white">{b.sector}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141414] text-neutral-300 border border-[#282828]">
                      {utilizedPercent}% Utilized
                    </span>
                  </div>

                  <div className="text-lg font-bold font-mono text-emerald-400 mb-1">
                    ₹ {total.toLocaleString()}
                  </div>

                  <div className="w-full bg-[#141414] h-1.5 rounded-full overflow-hidden mb-3 border border-[#282828]/50">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all"
                      style={{ width: `${utilizedPercent}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[10px] text-neutral-400 border-t border-[#282828] pt-2">
                    <div>
                      <span className="block text-neutral-500">Free</span>
                      <span className="font-bold text-white font-mono">₹{free.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-neutral-500">Locked</span>
                      <span className="font-bold text-amber-400 font-mono">₹{committed.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-neutral-500">Paid</span>
                      <span className="font-bold text-violet-400 font-mono">₹{disbursed.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Regulator Budget Requests Adjudication Section */}
        <div className="w-full bg-[#141414]/95 border border-[#282828] rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#282828] pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-headline text-white">Regulator Budget Requisitions</h3>
                  {pendingRequestsCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full text-[11px] font-bold animate-pulse">
                      {pendingRequestsCount} Pending Action
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400">
                  Department regulators requesting top-up funds from State Sovereign Treasury
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-[#1c1c1c] border border-[#282828] p-1 rounded-xl">
              {(['ALL', 'Pending', 'Approved', 'Rejected'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRequestFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    requestFilter === filter
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Requests List */}
          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs bg-[#1c1c1c]/50 rounded-xl border border-[#282828]">
                No budget requisitions found matching current filter.
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isPending = req.status === 'Pending';
                const isApproved = req.status === 'Approved';

                return (
                  <div
                    key={req.id}
                    className="bg-[#1c1c1c] border border-[#282828] hover:border-neutral-700 p-4 rounded-xl transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm text-white">#{req.id}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {req.sector}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-300">
                        <strong>Requisition:</strong> {req.reason}
                      </p>

                      <div className="text-[11px] text-neutral-400 flex items-center gap-3">
                        <span>Officer: <strong className="text-white">{req.regulatorName}</strong></span>
                        {req.rejectionReason && (
                          <span className="text-rose-400 italic">Audit Note: {req.rejectionReason}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-center">
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-500 block">Requested Amount</span>
                        <span className="text-base font-bold font-mono text-amber-400">
                          ₹ {req.requestedAmount.toLocaleString()}
                        </span>
                      </div>

                      {isPending ? (
                        <button
                          onClick={() => openReviewModal(req)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-amber-600/20"
                        >
                          Adjudicate Request →
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-500 font-semibold px-3 py-1.5 bg-[#141414] rounded-lg border border-[#282828]">
                          {isApproved ? 'Funds Disbursed' : 'Closed / Denied'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Macro Sovereign Audit Stream */}
        <div className="w-full bg-[#141414]/95 border border-[#282828] rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4 border-b border-[#282828] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold font-headline text-white">Macro Zero-Corruption Transaction Ledger</h3>
            </div>
            <span className="text-xs text-neutral-400 font-mono">Total Recorded Tasks: {tasks.length}</span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {tasks.slice(0, 10).map((task) => (
              <div
                key={task.id}
                className="p-3 bg-[#1c1c1c] border border-[#282828] rounded-xl flex items-center justify-between text-xs shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">#{task.id}</span>
                    <span className="text-emerald-400 font-semibold">[{task.sector}]</span>
                    <span className="text-neutral-300">{task.content}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Regulator: {task.regulatorName} • Node: {task.taskholderPseudonym || 'Assigned'}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-white block">
                    ₹ {(task.actualMoneySpent || task.moneyAllocated).toLocaleString()}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      task.status === 'Approved'
                        ? 'text-emerald-400'
                        : task.status === 'Completed'
                        ? 'text-cyan-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {task.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Adjudication Modal */}
      <GovtRequestReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        request={selectedRequest}
        onReviewComplete={refreshData}
      />
    </section>
  );
};

export default GovtIntroPg;
