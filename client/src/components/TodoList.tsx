import React, { useState, useEffect, useCallback } from 'react';
import { useWallet, InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { MODULE_ADDRESS, MODULES, aptos, MIN_GAS_OPTIONS } from '../lib/aptosClient';
import { taskLedger, LedgerTask } from '../services/taskLedgerService';
import TodoItem from './TodoItem';
import TaskProofSubmissionModal from './TaskProofSubmissionModal';
import ProofDocViewerModal from './ProofDocViewerModal';

interface TodoListProps {
  onTasksLoaded?: (tasks: LedgerTask[]) => void;
  taskholderName?: string;
  activeDomain?: string;
}

const TodoList: React.FC<TodoListProps> = ({
  onTasksLoaded,
  activeDomain = 'Healthcare',
}) => {
  const [taskList, setTaskList] = useState<LedgerTask[]>([]);
  const { account, signAndSubmitTransaction } = useWallet();

  // Selected task for proof submission
  const [selectedTaskForProof, setSelectedTaskForProof] = useState<LedgerTask | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  // Selected task for proof doc viewer
  const [selectedTaskForViewer, setSelectedTaskForViewer] = useState<LedgerTask | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const fetchTasks = useCallback(() => {
    const all = taskLedger.getAllTasks();
    const userAddr = account?.address ? account.address.toString().toLowerCase() : '';
    const relevant = all.filter((t) => {
      // Broadcast tasks in Pending status should only appear in the notification bell until accepted.
      // Bottom-up tasks in Proposed status should wait for regulator review.
      if (t.status === 'Pending' || t.status === 'Proposed') return false;
      // Strict Domain Enforcement: Only show tasks matching the taskholder's active domain
      if (activeDomain && !taskLedger.validateDomainAccess(activeDomain, t.sector)) return false;
      if (!userAddr) return true;
      if (!t.taskholderAddress) return false;
      return (
        t.taskholderAddress.toLowerCase() === userAddr ||
        t.regulatorAddress.toLowerCase() === userAddr
      );
    });

    setTaskList(relevant);
    if (onTasksLoaded) {
      onTasksLoaded(relevant);
    }
  }, [account, onTasksLoaded, activeDomain]);

  useEffect(() => {
    fetchTasks();
    const unsubscribe = taskLedger.subscribe(fetchTasks);
    return () => unsubscribe();
  }, [fetchTasks]);

  const deleteTask = async (taskId: number) => {
    taskLedger.deleteTask(taskId);
    fetchTasks();
  };

  const updateStatus = async (id: number, newStatus: 'Pending' | 'Completed' | 'Ongoing') => {
    taskLedger.updateTaskStatus(id, newStatus);
    fetchTasks();
  };

  const handleOpenProofModal = (task: LedgerTask) => {
    setSelectedTaskForProof(task);
    setIsProofModalOpen(true);
  };

  const handleSubmitProof = async (params: {
    taskId: number;
    actualMoneySpent: number;
    proofDocumentName: string;
    proofDocumentCid?: string;
    completionNotes: string;
  }) => {
    // Primary: Submit real on-chain transaction to Aptos Devnet (deducts gas fee in Petra)
    if (signAndSubmitTransaction && account) {
      try {
        const tx: InputTransactionData = {
          data: {
            function: `${MODULE_ADDRESS}::${MODULES.taskManager}::submit_task_proof`,
            functionArguments: [
              params.taskId.toString(),
              params.actualMoneySpent.toString(),
              params.proofDocumentCid || '',
            ],
          },
          options: MIN_GAS_OPTIONS,
        };
        const response = await signAndSubmitTransaction(tx);
        if (response?.hash) {
          await aptos.waitForTransaction({ transactionHash: response.hash });
        }
      } catch (err: any) {
        const errMsg = err?.message || err?.name || String(err);
        if (
          errMsg.toLowerCase().includes('reject') ||
          errMsg.toLowerCase().includes('cancel') ||
          errMsg.toLowerCase().includes('declined')
        ) {
          alert('Proof submission was cancelled in Petra wallet.');
          return;
        }
        console.warn('On-chain submit_task_proof notice:', err);
      }
    }

    taskLedger.submitTaskProof(params);
    fetchTasks();
  };

  return (
    <div className="w-full min-h-[340px] p-4 sm:p-5 text-white bg-[#141414]/95 border border-[#282828] shadow-2xl rounded-2xl backdrop-blur-xl">
      <div>
        <div className="flex items-center justify-between border-b border-[#282828] pb-3 mb-4">
          <h2 className="text-xl font-bold font-headline text-white">
            Active Task Executions & Assignments
          </h2>
          <span className="text-xs text-neutral-400 font-mono">
            {taskList.length} active assignments
          </span>
        </div>

        {taskList.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-sm max-w-md mx-auto leading-relaxed">
            No active task assignments yet. Click the 🔔 notification bell above to review and accept incoming broadcasts, or propose a new field task.
          </div>
        ) : (
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {taskList.map((task) => (
              <TodoItem
                key={task.id}
                task={task}
                deleteTask={deleteTask}
                updateStatus={updateStatus}
                onOpenProofModal={handleOpenProofModal}
                onOpenDocViewer={(t) => {
                  setSelectedTaskForViewer(t);
                  setIsViewerOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Proof Submission Modal */}
      <TaskProofSubmissionModal
        task={selectedTaskForProof}
        isOpen={isProofModalOpen}
        onClose={() => {
          setIsProofModalOpen(false);
          setSelectedTaskForProof(null);
        }}
        onSubmitProof={handleSubmitProof}
      />

      {/* Proof Document Viewer Modal */}
      <ProofDocViewerModal
        task={selectedTaskForViewer}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedTaskForViewer(null);
        }}
      />
    </div>
  );
};

export default TodoList;
