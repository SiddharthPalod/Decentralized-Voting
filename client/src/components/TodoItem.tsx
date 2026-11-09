import React from 'react';
import { LedgerTask } from '../services/taskLedgerService';
import { FileText, Clock, Upload, Trash2, ShieldCheck } from 'lucide-react';

interface TodoItemProps {
  task: LedgerTask;
  deleteTask?: (id: number) => void;
  updateStatus: (id: number, newStatus: 'Pending' | 'Completed' | 'Ongoing') => void;
  onOpenProofModal?: (task: LedgerTask) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({
  task,
  deleteTask,
  updateStatus,
  onOpenProofModal,
}) => {
  const isApproved = task.status === 'Approved';
  const isCompleted = task.status === 'Completed';

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as 'Pending' | 'Completed' | 'Ongoing';
    if (next === 'Completed' && onOpenProofModal) {
      onOpenProofModal(task);
    } else {
      updateStatus(task.id, next);
    }
  };

  return (
    <div className="px-4 py-3.5 font-primary text-white border bg-[#141414]/95 shadow-xl border-[#282828] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2.5 backdrop-blur-md hover:border-neutral-700 transition">
      {/* Task Details */}
      <div className="flex-1 min-w-0 overflow-hidden pr-2">
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
            {task.sector || 'General'}
          </span>
          {task.isProposal && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
              Bottom-Up Proposal
            </span>
          )}
          {task.proofDocumentName && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full font-mono max-w-[140px] md:max-w-[180px] truncate shrink-0"
              title={task.proofDocumentName}
            >
              <FileText className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{task.proofDocumentName}</span>
            </span>
          )}
        </div>
        <p className="font-para text-sm text-neutral-100 font-medium truncate" title={task.content}>
          {task.content}
        </p>
      </div>

      {/* Financials: Allocated vs Spent */}
      <div className="flex items-center gap-3 text-xs shrink-0 bg-neutral-900/90 px-3.5 py-2 rounded-xl border border-neutral-800">
        <div className="text-left">
          <label className="block text-neutral-400 text-[9px] font-semibold uppercase tracking-wider">
            Budget
          </label>
          <span className="font-headline text-xs md:text-sm font-bold text-white">
            ₹ {task.moneyAllocated.toLocaleString()}
          </span>
        </div>

        <div className="h-6 w-px bg-neutral-800" />

        <div className="text-left">
          <label className="block text-neutral-400 text-[9px] font-semibold uppercase tracking-wider">
            Actual Spent
          </label>
          <span className="font-headline text-xs md:text-sm font-bold text-emerald-400">
            {task.actualMoneySpent ? `₹ ${task.actualMoneySpent.toLocaleString()}` : '—'}
          </span>
        </div>
      </div>

      {/* Status Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        {isApproved ? (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/70 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Settled & Disbursed
          </span>
        ) : isCompleted ? (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-600/70 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Awaiting Audit
            </span>
            {onOpenProofModal && (
              <button
                onClick={() => onOpenProofModal(task)}
                className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-800"
                title="Edit Proof"
              >
                Edit Doc
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <select
              className="px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer outline-none transition bg-neutral-800 border border-neutral-700 text-neutral-200 focus:border-emerald-500"
              value={task.status}
              onChange={handleStatusChange}
            >
              <option value="Pending">Pending</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Submit Completed Proof</option>
            </select>

            {onOpenProofModal && task.status === 'Ongoing' && (
              <button
                onClick={() => onOpenProofModal(task)}
                className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
              >
                <Upload className="w-3 h-3" /> Submit Proof
              </button>
            )}
          </div>
        )}

        {!isApproved && (
          <button
            className="text-neutral-500 hover:text-red-400 transition p-1"
            onClick={() => deleteTask?.(task.id)}
            title="Remove from my list"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TodoItem;
