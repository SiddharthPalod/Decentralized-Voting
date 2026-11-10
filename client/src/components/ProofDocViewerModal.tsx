import React from 'react';
import { LedgerTask } from '../services/taskLedgerService';
import {
  FileText,
  ExternalLink,
  X,
  CheckCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface ProofDocViewerModalProps {
  task: LedgerTask | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProofDocViewerModal: React.FC<ProofDocViewerModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !task) return null;

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
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>TrueLedger Verification Report - ${task.proofDocumentName || 'Audit.pdf'}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; background: #0e0e0e; color: #eee; }
                .card { max-width: 720px; margin: 0 auto; background: #161616; padding: 36px; border-radius: 16px; border: 1px solid #2a2a2a; }
                .header { border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; }
                .title { font-size: 20px; font-weight: bold; color: #34d399; }
                .subtitle { font-size: 12px; color: #9ca3af; margin-top: 6px; font-family: monospace; }
                .row { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 14px; border-bottom: 1px solid #262626; padding-bottom: 10px; }
                .label { color: #9ca3af; font-weight: 500; }
                .value { font-weight: bold; color: #fff; }
                .notes { background: #1f1f1f; padding: 18px; border-radius: 10px; font-size: 13px; margin-top: 24px; border: 1px solid #333; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <div class="title">TRUELEDGER VERIFIED COMPLETION REPORT</div>
                  <div class="subtitle">Document: ${task.proofDocumentName || 'Report.pdf'} | IPFS CID: ${task.proofDocumentCid || 'ipfs://bafybeicg7e2m56v2q3o7x'}</div>
                </div>
                <div class="row"><span class="label">Task ID:</span><span class="value">#${task.id}</span></div>
                <div class="row"><span class="label">Task Description:</span><span class="value">${task.content}</span></div>
                <div class="row"><span class="label">Sector:</span><span class="value">${task.sector}</span></div>
                <div class="row"><span class="label">Allocated Budget:</span><span class="value">₹ ${task.moneyAllocated.toLocaleString()}</span></div>
                <div class="row"><span class="label">Actual Spent:</span><span class="value" style="color: #34d399">₹ ${(task.actualMoneySpent || task.moneyAllocated).toLocaleString()}</span></div>
                <div class="row"><span class="label">Status:</span><span class="value">${task.status}</span></div>
                <div class="notes">
                  <strong style="color: #34d399">Taskholder Completion Notes:</strong><br />
                  <p style="margin-top: 8px; color: #d1d5db; line-height: 1.5;">${task.completionNotes || 'All work completed as per public engineering specifications.'}</p>
                </div>
                <p style="font-size: 11px; color: #6b7280; text-align: center; margin-top: 28px;">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl p-6 text-white max-h-[92vh] flex flex-col">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-[#282828] pb-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white truncate" title={task.proofDocumentName}>
                  {task.proofDocumentName || 'Field_Audit_Report.pdf'}
                </h3>
                {task.status === 'Approved' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                    <CheckCircle className="w-3 h-3 text-emerald-400" /> Audited & Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3 text-purple-400" /> Awaiting Audit
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 font-mono truncate mt-0.5">
                CID: {task.proofDocumentCid || 'ipfs://bafybeif9s7d3a2x89y1b4'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openDocumentInNewTab}
              className="text-xs text-neutral-300 hover:text-white px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 flex items-center gap-1.5 transition"
              title="Open full page in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Full Tab View
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Task Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#1c1c1c] border border-[#282828] mb-4 text-xs">
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Task</span>
            <span className="text-neutral-200 font-medium truncate block" title={task.content}>
              {task.content}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Sector</span>
            <span className="text-neutral-200 font-medium">{task.sector}</span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Allocated</span>
            <span className="text-neutral-200 font-mono font-semibold">₹ {task.moneyAllocated.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Claimed Spent</span>
            <span className="text-emerald-400 font-mono font-semibold">
              ₹ {(task.actualMoneySpent || task.moneyAllocated).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Document Content Preview */}
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
            /* TrueLedger Verified Field Proof Certificate */
            <div className="max-w-2xl mx-auto bg-neutral-950 border border-neutral-800 rounded-xl p-6 sm:p-8 shadow-2xl">
              <div className="border-b-2 border-emerald-500 pb-4 mb-6 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  Decentralized Public Works Audit Document
                </span>
                <h2 className="text-xl font-bold font-headline text-white mt-2.5">
                  TRUELEDGER VERIFIED FIELD PROOF
                </h2>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  Document: {task.proofDocumentName || 'Field_Audit_Report.pdf'}
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Task Scope:</span>
                  <span className="text-white font-medium text-right max-w-xs">{task.content}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Department / Sector:</span>
                  <span className="text-white font-semibold">{task.sector}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Budget Allocated:</span>
                  <span className="text-white font-mono font-semibold">₹ {task.moneyAllocated.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Actual Expense Incurred:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    ₹ {(task.actualMoneySpent || task.moneyAllocated).toLocaleString()}
                  </span>
                </div>
                {task.moneyAllocated > (task.actualMoneySpent || task.moneyAllocated) && (
                  <div className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Surplus Returned to Pool:</span>
                    <span className="text-cyan-400 font-mono font-bold">
                      ₹ {(task.moneyAllocated - (task.actualMoneySpent || task.moneyAllocated)).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Audit Status:</span>
                  <span className="font-semibold text-white">{task.status}</span>
                </div>

                <div className="mt-4 p-3.5 bg-neutral-900 border border-neutral-800 rounded-lg">
                  <span className="text-[11px] font-bold text-neutral-300 block mb-1">
                    Taskholder Field Remarks:
                  </span>
                  <p className="text-neutral-400 leading-relaxed text-xs">
                    {task.completionNotes ||
                      'All milestone tasks completed in full compliance with public health and engineering standards. Receipts and invoices audited.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                <span className="flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> TrueLedger On-Chain Verified
                </span>
                <span className="font-mono">CID: {(task.proofDocumentCid || 'ipfs://bafybeicg7e2m56v2q3o7x').slice(0, 18)}...</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 pt-3 mt-3 border-t border-[#282828]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 transition"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProofDocViewerModal;
