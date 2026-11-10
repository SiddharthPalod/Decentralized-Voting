import React from 'react';
import { LedgerTask } from '../services/taskLedgerService';
import { FileText, Clock, Upload, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';

interface TodoItemProps {
  task: LedgerTask;
  deleteTask?: (id: number) => void;
  updateStatus?: (id: number, newStatus: 'Pending' | 'Completed' | 'Ongoing') => void;
  onOpenProofModal?: (task: LedgerTask) => void;
  onOpenDocViewer?: (task: LedgerTask) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({
  task,
  deleteTask,
  onOpenProofModal,
  onOpenDocViewer,
}) => {
  const isApproved = task.status === 'Approved';
  const isCompleted = task.status === 'Completed';
  const isProposed = task.status === 'Proposed';

  return (
    <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 font-primary text-white border bg-[#141414]/95 shadow-xl border-[#282828] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2.5 backdrop-blur-md hover:border-neutral-700 transition">
      {/* Task Details */}
      <div className="flex-1 min-w-0 overflow-hidden pr-2">
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
            {task.sector || 'General'}
          </span>
          {task.isProposal && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
              {isProposed ? 'Proposal • Under Review' : 'Bottom-Up Task'}
            </span>
          )}
          {task.proofDocumentName && (
            <button
              type="button"
              onClick={() => onOpenDocViewer?.(task)}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-800/80 px-2 py-0.5 rounded-full font-mono max-w-[140px] md:max-w-[180px] truncate shrink-0 transition"
              title={task.proofDocumentName}
            >
              <FileText className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{task.proofDocumentName}</span>
            </button>
          )}
        </div>
        <p className="font-para text-xs sm:text-sm text-neutral-100 font-medium truncate" title={task.content}>
          {task.content}
        </p>
        {task.auditFeedback && task.status === 'Ongoing' && (
          <div className="mt-2 p-2 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-200 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-red-300 block text-[10px]">
                Regulator Revision Request / Audit Feedback:
              </span>
              <p className="text-[11px] text-neutral-300 mt-0.5 leading-relaxed">{task.auditFeedback}</p>
            </div>
          </div>
        )}
      </div>

      {/* Financials: Allocated vs Spent */}
      <div className="flex items-center gap-2.5 text-xs shrink-0 bg-neutral-900/90 px-3 py-1.5 rounded-xl border border-neutral-800">
        <div className="text-left">
          <label className="block text-neutral-400 text-[9px] font-semibold uppercase tracking-wider">
            {isProposed ? 'Est. Budget' : 'Budget'}
          </label>
          <span className="font-headline text-xs sm:text-sm font-bold text-white">
            ₹ {task.moneyAllocated.toLocaleString()}
          </span>
        </div>

        <div className="h-5 w-px bg-neutral-800" />

        <div className="text-left">
          <label className="block text-neutral-400 text-[9px] font-semibold uppercase tracking-wider">
            Actual Spent
          </label>
          <span className="font-headline text-xs sm:text-sm font-bold text-emerald-400">
            {task.actualMoneySpent ? `₹ ${task.actualMoneySpent.toLocaleString()}` : '—'}
          </span>
        </div>
      </div>

      {/* Status Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {isProposed ? (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/70 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> Under Review
          </span>
        ) : isApproved ? (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/70 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Audited & Settled
          </span>
        ) : isCompleted ? (
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-600/70 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Audit Pending
            </span>
            {onOpenProofModal && (
              <button
                onClick={() => onOpenProofModal(task)}
                className="text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700"
                title="Edit Proof"
              >
                Edit
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-600/70 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" /> In Progress
            </span>

            {onOpenProofModal && (
              <button
                onClick={() => onOpenProofModal(task)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow shadow-emerald-700/30"
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
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TodoItem;
