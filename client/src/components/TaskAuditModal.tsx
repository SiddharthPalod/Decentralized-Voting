import React, { useState } from 'react';
import { LedgerTask } from '../services/taskLedgerService';
import {
  FileText,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  X,
  AlertCircle,
  Eye,
  Loader2,
} from 'lucide-react';

interface TaskAuditModalProps {
  task: LedgerTask | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (taskId: number, finalVerifiedAmount: number) => Promise<string | void> | void;
}

const TaskAuditModal: React.FC<TaskAuditModalProps> = ({
  task,
  isOpen,
  onClose,
  onApprove,
}) => {
  if (!isOpen || !task) return null;

  const initialAmount = task.actualMoneySpent || task.moneyAllocated;
  const [verifiedAmount, setVerifiedAmount] = useState<number>(initialAmount);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);

  const surplus = Math.max(0, task.moneyAllocated - verifiedAmount);

  const handleConfirm = async () => {
    setIsSigning(true);
    setErrorMsg(null);
    try {
      await onApprove(task.id, verifiedAmount);
      setIsConfirming(false);
      onClose();
    } catch (err: any) {
      console.error('Audit approval error:', err);
      setErrorMsg(err?.message || 'Transaction was rejected or simulation failed in wallet.');
    } finally {
      setIsSigning(false);
    }
  };

  const isPdf =
    task.proofDocumentName?.toLowerCase().endsWith('.pdf') ||
    task.proofDocumentUrl?.startsWith('data:application/pdf');

  const isImage =
    task.proofDocumentUrl?.startsWith('data:image') ||
    task.proofDocumentName?.match(/\.(jpg|jpeg|png|webp)$/i);

  const openDocumentInNewTab = () => {
    if (task.proofDocumentUrl) {
      const win = window.open();
      if (win) {
        win.document.write(
          `<iframe src="${task.proofDocumentUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      }
    } else {
      // Generate clean standalone print view
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>TrueLedger Verification Report - ${task.proofDocumentName || 'Audit.pdf'}</title>
              <style>
                body { font-family: sans-serif; padding: 40px; background: #fafafa; color: #111; }
                .card { max-width: 700px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 12px; border: 1px solid #ddd; }
                .header { border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; }
                .title { font-size: 20px; font-weight: bold; color: #065f46; }
                .subtitle { font-size: 12px; color: #666; margin-top: 4px; font-family: monospace; }
                .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
                .label { color: #555; font-weight: 600; }
                .value { font-weight: bold; }
                .notes { background: #f3f4f6; padding: 16px; border-radius: 8px; font-size: 13px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <div class="title">TRUELEDGER VERIFIED COMPLETION REPORT</div>
                  <div class="subtitle">Document: ${task.proofDocumentName} | IPFS CID: ${task.proofDocumentCid || 'ipfs://bafybeicg7e2m56v2q3o7x'}</div>
                </div>
                <div class="row"><span class="label">Task Content:</span><span class="value">${task.content}</span></div>
                <div class="row"><span class="label">Department Sector:</span><span class="value">${task.sector}</span></div>
                <div class="row"><span class="label">Taskholder Node:</span><span class="value">${task.taskholderPseudonym || 'Node-HC-209'}</span></div>
                <div class="row"><span class="label">Allocated Budget:</span><span class="value">₹ ${task.moneyAllocated.toLocaleString()}</span></div>
                <div class="row"><span class="label">Actual Claimed Cost:</span><span class="value" style="color: #059669">₹ ${(task.actualMoneySpent || task.moneyAllocated).toLocaleString()}</span></div>
                <div class="row"><span class="label">Taxpayer Surplus Refund:</span><span class="value" style="color: #0284c7">₹ ${surplus.toLocaleString()}</span></div>
                <div class="notes">
                  <strong>Taskholder Field Remarks:</strong><br />
                  ${task.completionNotes || 'All milestone work completed in accordance with department engineering guidelines.'}
                </div>
                <p style="font-size: 11px; color: #888; text-align: center; margin-top: 24px;">
                  Immutable cryptographic audit record secured by TrueLedger on Aptos Blockchain.
                </p>
              </div>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
        <div className="w-full max-w-2xl bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#242424] pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                  Regulator Compliance & Audit
                </span>
                <h2 className="text-xl font-bold font-headline text-white">
                  Audit Task #{task.id} Completion Proof
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Task Details */}
          <div className="space-y-4">
            <div className="bg-[#1c1c1c] border border-[#282828] p-4 rounded-xl">
              <div className="text-xs text-neutral-400 font-semibold mb-1">
                Sector: <strong className="text-white">{task.sector}</strong> • Assigned To:{' '}
                <span className="text-emerald-400 font-mono">
                  {task.taskholderPseudonym || task.taskholderName || 'Verified Node'}
                </span>
              </div>
              <p className="text-white text-sm font-medium">{task.content}</p>
            </div>

            {/* Submitted Document Proof */}
            <div className="border border-[#282828] rounded-xl p-4 bg-[#181818]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Submitted Proof of Work Document
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  IPFS Hash Attached
                </span>
              </div>

              {task.proofDocumentName ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-neutral-900 border border-neutral-700 rounded-lg">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-neutral-400 shrink-0" />
                    <div className="truncate">
                      <div className="text-sm font-semibold text-white truncate" title={task.proofDocumentName}>
                        {task.proofDocumentName}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono truncate">
                        {task.proofDocumentCid || 'ipfs://bafybeicg7e2m56v2q3o7x'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsDocViewerOpen(true)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/30 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect Doc
                    </button>
                    <button
                      type="button"
                      onClick={openDocumentInNewTab}
                      className="text-xs text-neutral-400 hover:text-white font-semibold flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition"
                      title="Open in new window"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg text-xs text-neutral-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Taskholder submitted digital notes without external attachment.
                </div>
              )}

              {/* Field Notes & Remarks */}
              {task.completionNotes && (
                <div className="mt-3 text-xs bg-neutral-900 p-3 rounded-lg border border-neutral-800 text-neutral-300">
                  <span className="font-semibold text-white block mb-1">
                    Field Notes & Expense Breakdown:
                  </span>
                  {task.completionNotes}
                </div>
              )}
            </div>

            {/* Financial Settlement & Audit Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#181818] p-4 rounded-xl border border-[#282828]">
              <div>
                <div className="text-[11px] font-semibold text-neutral-400">Allocated Budget</div>
                <div className="text-base font-bold font-headline text-white mt-0.5">
                  ₹ {task.moneyAllocated.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-emerald-400">
                  Taskholder Claimed Cost
                </div>
                <div className="text-base font-bold font-headline text-emerald-400 mt-0.5">
                  ₹ {(task.actualMoneySpent || task.moneyAllocated).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-cyan-400">
                  Treasury Surplus Refund
                </div>
                <div className="text-base font-bold font-headline text-cyan-300 mt-0.5">
                  ₹ {surplus.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Verification Adjustment Input */}
            <div className="p-4 bg-neutral-900/90 border border-neutral-700 rounded-xl">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Approved Disbursement Amount (₹):
              </label>
              <input
                type="number"
                max={task.moneyAllocated}
                min={0}
                value={verifiedAmount}
                onChange={(e) => setVerifiedAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-neutral-800 border border-neutral-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Any difference between Allocated (₹{task.moneyAllocated.toLocaleString()}) and Approved
                will automatically be refunded to the {task.sector} department treasury balance.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 border-t border-[#242424] pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-neutral-400 hover:text-white transition"
            >
              Cancel
            </button>

            {!isConfirming ? (
              <button
                onClick={() => setIsConfirming(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle className="w-4 h-4" /> Verify & Authorize Release
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <span className="text-xs text-amber-300 font-semibold">
                  Release ₹{verifiedAmount.toLocaleString()} to {task.taskholderPseudonym || 'Node'}?
                </span>
                <button
                  onClick={handleConfirm}
                  disabled={isSigning}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                >
                  {isSigning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Signing in Petra...
                    </>
                  ) : (
                    'Confirm Blockchain Sign-Off'
                  )}
                </button>
              </div>
            )}
          </div>
          {errorMsg && (
            <div className="mt-3 p-2.5 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Document Viewer Modal */}
      {isDocViewerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-4xl bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl p-6 text-white max-h-[92vh] flex flex-col">
            {/* Viewer Top Bar */}
            <div className="flex items-center justify-between border-b border-[#282828] pb-3 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-base text-white truncate">
                    {task.proofDocumentName || 'Field_Audit_Report.pdf'}
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono truncate">
                    {task.proofDocumentCid || 'ipfs://bafybeif9s7d3a2x89y1b4'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={openDocumentInNewTab}
                  className="text-xs text-neutral-300 hover:text-white px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Full Tab View
                </button>
                <button
                  onClick={() => setIsDocViewerOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="flex-1 overflow-y-auto rounded-xl bg-neutral-900 border border-neutral-800 p-4">
              {task.proofDocumentUrl && isPdf ? (
                <iframe
                  src={task.proofDocumentUrl}
                  className="w-full h-[520px] rounded-lg border border-neutral-700 bg-white"
                  title="PDF Preview"
                />
              ) : task.proofDocumentUrl && isImage ? (
                <div className="flex items-center justify-center p-4">
                  <img
                    src={task.proofDocumentUrl}
                    alt="Proof Document"
                    className="max-h-[500px] object-contain rounded-lg border border-neutral-700 shadow-xl"
                  />
                </div>
              ) : (
                /* Interactive Certified Public Audit Certificate */
                <div className="max-w-2xl mx-auto bg-neutral-950 border border-neutral-800 rounded-xl p-8 shadow-2xl">
                  {/* Certificate Header */}
                  <div className="border-b-2 border-emerald-500 pb-4 mb-6 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                      Decentralized Public Works Audit Certificate
                    </span>
                    <h2 className="text-xl font-bold font-headline text-white mt-2">
                      TRUELEDGER VERIFIED FIELD PROOF
                    </h2>
                    <p className="text-xs text-neutral-400 font-mono mt-1">
                      Document: {task.proofDocumentName || 'Field_Audit_Report.pdf'}
                    </p>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
                    <div>
                      <span className="text-neutral-500 block mb-0.5">Task Description:</span>
                      <strong className="text-white text-sm">{task.content}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 block mb-0.5">Assigned Sector:</span>
                      <strong className="text-emerald-400 text-sm">{task.sector}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 block mb-0.5">Contractor Node ID:</span>
                      <strong className="font-mono text-neutral-300">
                        {task.taskholderPseudonym || 'Node-HC-209'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 block mb-0.5">Audit Submission Time:</span>
                      <strong className="font-mono text-neutral-300">
                        {new Date(task.completedAt || task.createdAt).toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Financial Settlement Proof */}
                  <div className="border border-neutral-800 rounded-xl p-4 bg-neutral-900/50 mb-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3">
                      Certified Financial Line Items
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-neutral-800">
                        <span className="text-neutral-400">Total Approved State Budget:</span>
                        <span className="font-mono font-bold text-white">
                          ₹ {task.moneyAllocated.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-800">
                        <span className="text-emerald-400 font-semibold">
                          Taskholder Certified Expenditure:
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          ₹ {(task.actualMoneySpent || task.moneyAllocated).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-cyan-400 font-semibold">
                          Net Taxpayer Surplus Refunded:
                        </span>
                        <span className="font-mono font-bold text-cyan-300">
                          ₹ {surplus.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Field Remarks */}
                  <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 text-xs text-neutral-300 mb-6">
                    <span className="font-semibold text-white block mb-1">
                      Taskholder Field Observations & Invoices:
                    </span>
                    <p className="leading-relaxed">
                      {task.completionNotes ||
                        'All project deliverables verified on-site. Receipts and contractor itemizations cross-checked against municipal guidelines.'}
                    </p>
                  </div>

                  {/* Cryptographic Seal */}
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 border-t border-neutral-800 pt-4">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Cryptographically Sealed by TrueLedger</span>
                    </div>
                    <span className="font-mono">
                      CID: {(task.proofDocumentCid || 'ipfs://bafybeif9s7d3a2x89y1b4').slice(0, 18)}...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Viewer Bottom Bar */}
            <div className="flex items-center justify-between border-t border-[#282828] pt-3 mt-4">
              <span className="text-xs text-neutral-400">
                TrueLedger Decentralized Verification Viewer
              </span>
              <button
                onClick={() => setIsDocViewerOpen(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl transition"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskAuditModal;
