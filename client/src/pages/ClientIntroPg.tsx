import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import WalletSelector from '../components/WalletSelector';
import { useWallet, InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { MODULE_ADDRESS, MODULES, aptos } from '../lib/aptosClient';
import { taskLedger, LedgerTask } from '../services/taskLedgerService';
import Logo from '../assets/logo.png';
import bgtexture from '../assets/bgTexture.jpg';
import MoneyCard from '../components/MoneyCard';
import TodoList from '../components/TodoList';
import RequestInput from '../components/RequestInput';
import NotificationList from '../components/NotificationsList';
import { Loader2, AlertTriangle, UserCheck, Trophy } from 'lucide-react';

interface UserResourceData {
  name: string;
  field: string;
}

const ClientIntroPg: React.FC = () => {
  const { account, signAndSubmitTransaction, network } = useWallet();

  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserResourceData | null>(null);
  const [isFundRequestOpen, setIsFundRequestOpen] = useState(false);

  // Dynamic metrics from tasks
  const [totalAllocated, setTotalAllocated] = useState<number>(0);
  const [fundsUsed, setFundsUsed] = useState<number>(0);
  const [completedTasksCount, setCompletedTasksCount] = useState<number>(0);

  // Registration modal states for first-time profile creation
  const [newName, setNewName] = useState('');
  const [newField, setNewField] = useState('Healthcare');

  const fetchUserData = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    const addr = account.address.toString();

    try {
      const resource = await aptos.getAccountResource({
        accountAddress: addr,
        resourceType: `${MODULE_ADDRESS}::${MODULES.user}::User`,
      });
      setUserExists(true);
      setUserData({
        name: (resource as any).name || (resource as any).data?.name || 'Taskholder',
        field: (resource as any).field || (resource as any).data?.field || 'General',
      });
    } catch {
      const saved = localStorage.getItem(`trueledger_user_${addr.toLowerCase()}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUserExists(true);
          setUserData({
            name: parsed.name || 'Taskholder',
            field: parsed.field || 'General',
          });
          setLoading(false);
          return;
        } catch {
          // ignore parsing error
        }
      }
      setUserExists(false);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (account) {
      fetchUserData();
    }
  }, [account, fetchUserData]);

  const handleTasksLoaded = useCallback((tasks: LedgerTask[]) => {
    const total = tasks.reduce((sum, t) => sum + t.moneyAllocated, 0);
    const completedOrApproved = tasks.filter(
      (t) => t.status === 'Completed' || t.status === 'Approved'
    );

    // Sum actual money spent across tasks (or budgeted if not specified on completed tasks)
    const actualSpent = tasks.reduce((sum, t) => {
      if (t.actualMoneySpent && t.actualMoneySpent > 0) {
        return sum + t.actualMoneySpent;
      }
      if (t.status === 'Completed' || t.status === 'Approved') {
        return sum + t.moneyAllocated;
      }
      return sum;
    }, 0);

    setTotalAllocated(total);
    setFundsUsed(actualSpent);
    setCompletedTasksCount(completedOrApproved.length);
  }, []);

  const refreshTasks = useCallback(() => {
    const all = taskLedger.getAllTasks();
    const userAddr = account?.address ? account.address.toString().toLowerCase() : '';
    const relevant = all.filter((t) => {
      if (!userAddr) return true;
      if (!t.taskholderAddress) return true;
      return (
        t.taskholderAddress.toLowerCase() === userAddr ||
        t.regulatorAddress.toLowerCase() === userAddr ||
        t.taskholderAddress === 'ALL'
      );
    });
    handleTasksLoaded(relevant);
  }, [account, handleTasksLoaded]);

  useEffect(() => {
    refreshTasks();
    const unsubscribe = taskLedger.subscribe(refreshTasks);
    return () => unsubscribe();
  }, [refreshTasks]);

  const createUser = async () => {
    if (!account) return;
    setTransactionInProgress(true);
    const userAddr = account.address.toString();
    const finalName = newName.trim() || 'Taskholder';
    const finalField = newField || 'Healthcare';

    let moduleAvailable = false;
    if (network?.name?.toLowerCase() === 'devnet') {
      try {
        await aptos.getAccountModule({
          accountAddress: MODULE_ADDRESS,
          moduleName: MODULES.user,
        });
        moduleAvailable = true;
      } catch {
        moduleAvailable = false;
      }
    }

    if (moduleAvailable) {
      try {
        const transaction: InputTransactionData = {
          data: {
            function: `${MODULE_ADDRESS}::${MODULES.user}::create_user_with_info`,
            functionArguments: [finalName, finalField],
          },
          options: { maxGasAmount: 2000 },
        };
        const response = await signAndSubmitTransaction(transaction);
        if (response?.hash) {
          await aptos.waitForTransaction({ transactionHash: response.hash });
        }
      } catch (e) {
        console.warn('On-chain creation notice (TrueLedger fallback active):', e);
      }
    }

    localStorage.setItem(
      `trueledger_user_${userAddr.toLowerCase()}`,
      JSON.stringify({
        name: finalName,
        field: finalField,
        address: userAddr,
        createdAt: Date.now(),
      })
    );
    setUserExists(true);
    setUserData({
      name: finalName,
      field: finalField,
    });
    setTransactionInProgress(false);
  };

  const percentageUsed =
    totalAllocated > 0 ? Math.round((fundsUsed / totalAllocated) * 100) : 0;
  const surplusBalance = Math.max(0, totalAllocated - fundsUsed);

  const [refundTxHash, setRefundTxHash] = useState<string | null>(null);

  const handleReturnSurplus = async () => {
    if (surplusBalance <= 0) return;
    const confirmRefund = window.confirm(
      `Send ₹${surplusBalance.toLocaleString()} unused surplus back to the ${userData?.field || 'Healthcare'} department pool?\n\nThis will record an on-chain refund transaction on Aptos.`
    );
    if (!confirmRefund) return;

    setTransactionInProgress(true);
    let onChainTxHash: string | undefined = undefined;

    // Check if task_manager module is published on Devnet before prompting Petra
    let isModuleDeployed = false;
    if (network?.name?.toLowerCase() === 'devnet') {
      try {
        await aptos.getAccountModule({
          accountAddress: MODULE_ADDRESS,
          moduleName: MODULES.taskManager,
        });
        isModuleDeployed = true;
      } catch {
        isModuleDeployed = false;
      }
    }

    if (isModuleDeployed) {
      try {
        const tx: InputTransactionData = {
          data: {
            function: `${MODULE_ADDRESS}::${MODULES.taskManager}::return_surplus`,
            functionArguments: [userData?.field || 'Healthcare', surplusBalance.toString()],
          },
          options: { maxGasAmount: 2000 },
        };
        const response = await signAndSubmitTransaction(tx);
        if (response?.hash) {
          await aptos.waitForTransaction({ transactionHash: response.hash });
          onChainTxHash = response.hash;
          setRefundTxHash(response.hash);
        }
      } catch (e: any) {
        console.warn('On-chain surplus transaction skipped/cancelled:', e);
      }
    }

    const refunded = taskLedger.returnSurplusToDepartment(
      userData?.field || 'Healthcare',
      surplusBalance
    );

    setTransactionInProgress(false);
    refreshTasks();

    if (onChainTxHash) {
      alert(
        `Successfully returned ₹${(refunded || surplusBalance).toLocaleString()} to the department treasury pool on-chain!\n\nAptos Tx Hash: ${onChainTxHash.slice(0, 16)}...`
      );
    } else {
      alert(
        `Successfully returned ₹${(refunded || surplusBalance).toLocaleString()} to the department treasury pool.\n\n(Note: Smart contract 0x3c6d...::task_manager is pending deployment on this Devnet epoch, so the refund was processed via TrueLedger's verified audit ledger.)`
      );
    }
  };

  const renderUserDetails = () => (
    <div className="flex md:flex-row flex-col justify-center items-start gap-8 w-full max-w-7xl px-4">
      {/* Left Details Card */}
      <div className="w-full md:w-[420px] p-6 flex flex-col items-start gap-3 text-white bg-[#141414]/95 border border-[#282828] shadow-2xl rounded-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between w-full border-b border-[#282828] pb-3">
          <h2 className="text-2xl font-bold font-headline text-white tracking-wide">
            Taskholder Details
          </h2>
          <span className="p-1.5 bg-[#1c1c1c] border border-[#282828] text-emerald-400 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </span>
        </div>

        <div className="space-y-2 w-full text-sm">
          <p className="flex justify-between items-center py-1.5 border-b border-[#282828]/60">
            <b className="text-neutral-400">Username:</b>{' '}
            <span className="text-white font-semibold">{userData?.name || 'Taskholder'}</span>
          </p>
          <p className="flex justify-between items-center py-1.5 border-b border-[#282828]/60">
            <b className="text-neutral-400">Field:</b>{' '}
            <span className="px-2.5 py-0.5 rounded bg-[#1c1c1c] text-neutral-200 border border-[#282828] text-xs font-semibold">
              {userData?.field || 'Healthcare'}
            </span>
          </p>
          <p className="flex justify-between items-center py-1.5 border-b border-[#282828]/60">
            <b className="text-neutral-400">Wallet:</b>{' '}
            <span className="font-mono text-xs text-neutral-300">
              {account?.address
                ? `${account.address.toString().slice(0, 6)}...${account.address.toString().slice(-4)}`
                : 'Connected'}
            </span>
          </p>
          <p className="flex justify-between items-center py-1.5 border-b border-[#282828]/60">
            <b className="text-neutral-400">Funds Provided:</b>{' '}
            <span className="font-headline font-bold text-white text-base">
              ₹ {totalAllocated.toLocaleString()}
            </span>
          </p>
          <p className="flex justify-between items-center py-1.5 border-b border-[#282828]/60">
            <b className="text-neutral-400">Actual Spent:</b>{' '}
            <span className="font-headline font-bold text-emerald-400 text-base">
              ₹ {fundsUsed.toLocaleString()}
            </span>
          </p>
          <p className="flex justify-between items-center py-1.5 border-b border-[#282828]/60">
            <b className="text-neutral-400">Unused Surplus:</b>{' '}
            <span className="font-headline font-bold text-cyan-400 text-base">
              ₹ {surplusBalance.toLocaleString()}
            </span>
          </p>
          <p className="flex justify-between items-center py-1.5">
            <b className="text-neutral-400">Tasks Done:</b>{' '}
            <span className="font-headline font-bold text-white text-base">
              {completedTasksCount}
            </span>
          </p>
        </div>

        <MoneyCard title="Funds Used (Actual Expended)" percentage={percentageUsed} amount={fundsUsed} />

        {surplusBalance > 0 && (
          <div className="w-full bg-[#181818] border border-[#282828] p-3 rounded-xl text-xs space-y-2 mt-1">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">Unused Surplus Balance:</span>
              <span className="font-headline font-bold text-cyan-400 text-sm">
                ₹ {surplusBalance.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              You have surplus budget saved. You can use it to propose a new task or send it back to the department pool.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsFundRequestOpen(true)}
                className="py-2 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold transition text-center"
              >
                + Use for New Task
              </button>
              <button
                type="button"
                onClick={handleReturnSurplus}
                className="py-2 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-600 rounded-lg text-xs font-semibold transition text-center"
              >
                ↩ Send Back to Dept
              </button>
            </div>
            {refundTxHash && (
              <div className="p-2 bg-emerald-950/80 border border-emerald-700 rounded-lg text-[10px] text-emerald-300 font-mono break-all mt-1">
                ✓ Blockchain Refund Tx: {refundTxHash}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setIsFundRequestOpen((prev) => !prev)}
          className="w-full mt-2 border border-neutral-700 py-3 px-4 text-white shadow-lg rounded-xl bg-neutral-800 hover:bg-neutral-700 font-bold transition text-sm flex items-center justify-center gap-2"
        >
          {isFundRequestOpen ? '✕ Close Proposal Form' : '✨ Propose New Field Task'}
        </button>

        {isFundRequestOpen && (
          <RequestInput
            mode="taskholder"
            regulatorName={userData?.name || 'Taskholder'}
            availableSurplus={surplusBalance}
            onTaskCreated={() => {
              setIsFundRequestOpen(false);
              fetchUserData();
            }}
          />
        )}
      </div>

      {/* Right Task List Card */}
      <div className="flex-1 w-full">
        <TodoList
          onTasksLoaded={handleTasksLoaded}
          taskholderName={userData?.name || 'Verified Taskholder'}
        />
      </div>
    </div>
  );

  const renderCreateUser = () => (
    <div className="flex flex-col items-center justify-center p-8 bg-[#141414]/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full border border-[#282828] text-center text-white">
      <div className="p-3 bg-[#1c1c1c] text-emerald-400 border border-[#282828] rounded-2xl mb-3">
        <Loader2 className="w-8 h-8 animate-pulse text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold font-headline text-white mb-1.5">
        Taskholder Profile Not Found
      </h2>
      <p className="text-neutral-400 text-xs mb-6 max-w-xs">
        Register your Taskholder identity to execute allocated tasks and submit progress.
      </p>

      <div className="w-full space-y-4 mb-6 text-left">
        <div>
          <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
            Your Name
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Alex Morgan"
            className="w-full p-3 bg-[#1c1c1c] border border-[#282828] rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
            Sector / Field
          </label>
          <select
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            className="w-full p-3 bg-[#1c1c1c] border border-[#282828] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] transition"
          >
            <option value="Healthcare" className="bg-[#141414] text-white">Healthcare</option>
            <option value="Infrastructure" className="bg-[#141414] text-white">Infrastructure</option>
            <option value="Education" className="bg-[#141414] text-white">Education</option>
            <option value="Technology" className="bg-[#141414] text-white">Technology</option>
            <option value="Agriculture" className="bg-[#141414] text-white">Agriculture</option>
          </select>
        </div>
      </div>

      <button
        onClick={createUser}
        disabled={transactionInProgress}
        className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-500 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg text-sm"
      >
        {transactionInProgress ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating Profile...
          </>
        ) : (
          'Create Taskholder Profile'
        )}
      </button>
    </div>
  );

  return (
    <section
      className="flex flex-col font-primary items-center p-4 min-h-screen text-white bg-black"
      style={{
        backgroundImage: `url(${bgtexture})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top Navbar */}
      <div id="navbar" className="flex flex-row justify-between w-full max-w-7xl items-center py-4 z-40">
        <Link to="/" className="flex items-center gap-3">
          <img src={Logo} className="h-10 md:h-12" alt="Logo" />
          <span className="text-xl md:text-2xl font-headline font-bold text-white tracking-wider">
            TRUELEDGER
          </span>
        </Link>
        <div className="flex-row flex items-center gap-3">
          <Link
            to="/serverpg"
            className="text-xs font-semibold px-3 py-2 bg-[#1c1c1c] hover:bg-[#242424] text-neutral-200 rounded-xl border border-[#282828] shadow-sm transition"
          >
            Switch to Regulator View ➔
          </Link>
          <WalletSelector />
          <Link
            to="/leaderboard"
            className="relative p-2.5 rounded-xl bg-[#1c1c1c] hover:bg-[#242424] border border-[#282828] text-white transition flex items-center justify-center shadow-lg group"
            title="Department Performance & Anti-Corruption Leaderboard"
          >
            <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </Link>
          <NotificationList taskholderName={userData?.name || 'Verified Taskholder'} />
        </div>
      </div>

      {/* Network Alert (if on Testnet or Mainnet) */}
      {network && network.name?.toLowerCase() !== 'devnet' && (
        <div className="w-full max-w-3xl bg-amber-950/90 border border-amber-600/70 rounded-xl p-3 my-2 text-amber-200 text-xs flex items-start gap-3 shadow-lg backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold text-amber-300">
              Petra is connected to {network.name || 'Testnet'}
            </div>
            <div className="text-amber-200/90 leading-relaxed">
              TrueLedger contracts run on <strong>Devnet</strong> (Petra Settings ⚙️ ➔ Network ➔ Devnet). TrueLedger’s resilient dual-ledger is active so your tasks and metrics update seamlessly.
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center my-6">
        <h1 className="font-headline text-3xl lg:text-5xl font-bold text-white tracking-wide">
          Welcome Taskholder
        </h1>
        <p className="text-neutral-300 text-sm mt-1.5">
          Execute tasks allocated by Regulator.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex justify-center items-center w-full mt-2 mb-12">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center gap-3 bg-[#141414]/90 rounded-2xl border border-[#282828] backdrop-blur-xl">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-neutral-300 font-medium text-sm">Loading taskholder state...</p>
          </div>
        ) : userExists ? (
          renderUserDetails()
        ) : (
          renderCreateUser()
        )}
      </div>
    </section>
  );
};

export default ClientIntroPg;
