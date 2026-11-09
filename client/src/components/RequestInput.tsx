import React, { useState } from 'react';
import { useWallet, InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { MODULE_ADDRESS, MODULES, aptos } from '../lib/aptosClient';
import { taskLedger } from '../services/taskLedgerService';
import { Loader2, Sparkles } from 'lucide-react';

interface RequestInputProps {
  onTaskCreated?: () => void;
  regulatorName?: string;
  mode?: 'regulator' | 'taskholder';
  availableSurplus?: number;
}

const RequestInput: React.FC<RequestInputProps> = ({
  onTaskCreated,
  regulatorName = 'Authorized Regulator',
  mode = 'regulator',
  availableSurplus = 0,
}) => {
  const [text, setText] = useState('');
  const [moneyAllocated, setMoneyAllocated] = useState<number>(0);
  const [sector, setSector] = useState('Healthcare');
  const [targetAddress, setTargetAddress] = useState('');
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  const { account, signAndSubmitTransaction, network } = useWallet();

  const isTaskholder = mode === 'taskholder';

  const addNotification = async () => {
    if (transactionInProgress) return;
    if (!text.trim() || moneyAllocated <= 0) {
      alert('Please enter a task description and a budget amount.');
      return;
    }

    setTransactionInProgress(true);
    const callerAddr = account?.address ? account.address.toString() : '0xUser';

    if (!isTaskholder && network?.name?.toLowerCase() === 'devnet') {
      try {
        const tx: InputTransactionData = {
          data: {
            function: `${MODULE_ADDRESS}::${MODULES.taskManager}::add_notification`,
            functionArguments: [text.trim(), moneyAllocated.toString()],
          },
          options: { maxGasAmount: 2000 },
        };
        const response = await signAndSubmitTransaction(tx);
        if (response?.hash) {
          await aptos.waitForTransaction({ transactionHash: response.hash });
        }
      } catch (error) {
        console.warn('On-chain notification skipped/fallback:', error);
      }
    }

    if (isTaskholder) {
      // Taskholder proposing task (can use remaining surplus or request dept funds)
      taskLedger.proposeTask({
        content: text.trim(),
        sector,
        estimatedBudget: moneyAllocated,
        taskholderAddress: callerAddr,
        taskholderName: regulatorName || 'Verified Taskholder',
      });
    } else {
      // Regulator assigning task
      taskLedger.assignTask({
        content: text.trim(),
        sector,
        moneyAllocated,
        regulatorAddress: callerAddr,
        regulatorName,
        taskholderAddress: targetAddress.trim() || 'ALL',
      });
    }

    setText('');
    setMoneyAllocated(0);
    setTargetAddress('');
    setTransactionInProgress(false);

    if (onTaskCreated) {
      onTaskCreated();
    }
  };

  return (
    <div className="mt-4 text-white bg-[#141414]/95 border border-[#282828] p-5 w-full rounded-2xl shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-1.5">
        <h2 className="text-lg md:text-xl font-bold font-headline text-white">
          {isTaskholder ? '✨ Propose New Field Task' : 'Assign & Broadcast New Task'}
        </h2>
        {isTaskholder ? (
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
            Bottom-Up Proposal
          </span>
        ) : (
          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
            Regulator Broadcast
          </span>
        )}
      </div>

      <p className="text-xs text-neutral-400 mb-3.5">
        {isTaskholder
          ? 'Observed an urgent community need? Submit a proposal to department regulators. If approved, funds are committed and assigned directly to your node.'
          : 'Create and broadcast an official department task. Any qualified taskholder in the sector can review and accept via decentralized notification.'}
      </p>

      {isTaskholder && availableSurplus > 0 && (
        <button
          type="button"
          onClick={() => setMoneyAllocated(availableSurplus)}
          className="mb-3 text-[11px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/70 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-cyan-900/60 transition w-full text-left"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            Use Unspent Surplus Balance: <strong>₹ {availableSurplus.toLocaleString()}</strong> (Click to fill)
          </span>
        </button>
      )}

      <div className="flex flex-col gap-3">
        <input
          className="p-3 bg-[#1c1c1c] border border-[#282828] rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] transition"
          value={text}
          placeholder={isTaskholder ? 'e.g. Repair Donnavalli Clinic Generator Unit...' : 'Enter task description...'}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="number"
            className="p-3 bg-[#1c1c1c] border border-[#282828] rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] transition font-mono"
            value={moneyAllocated || ''}
            placeholder={isTaskholder ? 'Estimated budget (₹)' : 'Money Alloc (₹)'}
            onChange={(e) => setMoneyAllocated(Number(e.target.value))}
          />
          <select
            className="p-3 bg-[#1c1c1c] border border-[#282828] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] transition"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          >
            <option value="Healthcare" className="bg-[#141414] text-white">Healthcare</option>
            <option value="Infrastructure" className="bg-[#141414] text-white">Infrastructure</option>
            <option value="Education" className="bg-[#141414] text-white">Education</option>
            <option value="Agriculture" className="bg-[#141414] text-white">Agriculture</option>
            <option value="Technology" className="bg-[#141414] text-white">Technology</option>
          </select>
        </div>

        {isTaskholder ? (
          <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-[11px] text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>
              Routing: <strong className="text-white">Department Regulators</strong> (Assigned directly to your node upon approval)
            </span>
          </div>
        ) : (
          <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-[11px] text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
            <span>
              Broadcast Scope: <strong className="text-white">All {sector} Domain Taskholders</strong> (Zero-Knowledge Privacy)
            </span>
          </div>
        )}
      </div>

      <button
        className={`w-full mt-4 py-3.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${
          transactionInProgress ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={addNotification}
        disabled={transactionInProgress}
      >
        {transactionInProgress ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> {isTaskholder ? 'Submitting Proposal...' : 'Broadcasting Task...'}
          </>
        ) : isTaskholder ? (
          '🚀 Submit Field Proposal to Regulator'
        ) : (
          '📢 Broadcast Task to Department'
        )}
      </button>
    </div>
  );
};

export default RequestInput;
