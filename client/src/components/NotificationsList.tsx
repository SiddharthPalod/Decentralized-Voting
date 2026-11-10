import { useEffect, useState, useCallback } from 'react';
import { useWallet, InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { MODULE_ADDRESS, MODULES, aptos, MIN_GAS_OPTIONS } from '../lib/aptosClient';
import { Loader2 } from 'lucide-react';
import { FaBell } from 'react-icons/fa';
import { taskLedger, LedgerTask } from '../services/taskLedgerService';

interface NotificationListProps {
  taskholderName?: string;
  activeDomain?: string;
}

function NotificationList({
  taskholderName = 'Verified Taskholder',
  activeDomain = 'Healthcare',
}: NotificationListProps) {
  const [notificationList, setNotificationList] = useState<LedgerTask[]>([]);
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  const [isBellClicked, setIsBellClicked] = useState(false);
  const { account, signAndSubmitTransaction } = useWallet();

  const fetchNotifications = useCallback(() => {
    const all = taskLedger.getAllTasks();
    const userAddr = account?.address ? account.address.toString().toLowerCase() : '';

    const pending = all.filter((t) => {
      if (t.status !== 'Pending') return false;
      // Strict Domain Enforcement: Only show tasks matching the taskholder's active domain
      if (activeDomain && !taskLedger.validateDomainAccess(activeDomain, t.sector)) {
        return false;
      }
      // If current taskholder has already declined this broadcast, hide it from their bell
      if (userAddr && t.rejectedBy && t.rejectedBy.map((a) => a.toLowerCase()).includes(userAddr)) {
        return false;
      }
      if (!t.taskholderAddress || t.taskholderAddress === 'ALL') return true;
      return !userAddr || t.taskholderAddress.toLowerCase() === userAddr;
    });

    setNotificationList(pending);
  }, [account, activeDomain]);

  useEffect(() => {
    fetchNotifications();
    const unsubscribe = taskLedger.subscribe(fetchNotifications);
    return () => unsubscribe();
  }, [fetchNotifications]);

  const acceptNotification = async (task: LedgerTask) => {
    if (transactionInProgress) return;

    // Guard: Prevent cross-domain acceptance
    if (activeDomain && !taskLedger.validateDomainAccess(activeDomain, task.sector)) {
      alert(`Domain Enforcement Error: Your active accreditation is ${activeDomain}. You cannot claim tasks in the ${task.sector} sector.`);
      return;
    }

    setTransactionInProgress(true);

    try {
      if (signAndSubmitTransaction && account) {
        const tx: InputTransactionData = {
          data: {
            function: `${MODULE_ADDRESS}::${MODULES.taskManager}::accept_notification`,
            functionArguments: [task.id.toString()],
          },
          options: MIN_GAS_OPTIONS,
        };
        const response = await signAndSubmitTransaction(tx);
        if (response?.hash) {
          await aptos.waitForTransaction({ transactionHash: response.hash });
        }
      }
    } catch (error: any) {
      const errMsg = error?.message || error?.name || String(error);
      if (
        errMsg.toLowerCase().includes('reject') ||
        errMsg.toLowerCase().includes('cancel') ||
        errMsg.toLowerCase().includes('declined')
      ) {
        alert('Task acceptance was cancelled in Petra wallet.');
        setTransactionInProgress(false);
        return;
      }
      console.warn('On-chain accept_notification notice:', error);
    }

    try {
      const userAddr = account?.address ? account.address.toString() : '0xTaskholder';
      taskLedger.acceptTask(task.id, userAddr, taskholderName, activeDomain);
      fetchNotifications();
    } catch (error) {
      console.error('Error accepting notification:', error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  const declineNotification = async (taskId: number) => {
    if (transactionInProgress) return;
    setTransactionInProgress(true);

    try {
      const userAddr = account?.address ? account.address.toString() : '0xTaskholder';
      taskLedger.declineTask(taskId, userAddr);
      fetchNotifications();
    } catch (error) {
      console.error('Error declining notification:', error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      {transactionInProgress && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Bell Icon */}
      <button
        onClick={() => setIsBellClicked((prev) => !prev)}
        className="relative p-2.5 rounded-xl bg-[#1c1c1c] hover:bg-[#242424] border border-[#282828] text-white transition flex items-center justify-center shadow-lg"
        title={`Notifications for ${activeDomain} Domain`}
      >
        <FaBell className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-transform transform hover:scale-110" />
        {notificationList.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
            {notificationList.length}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isBellClicked && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-[#141414]/95 border border-[#282828] rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-xl max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-[#282828] pb-2 mb-3">
            <h3 className="text-sm font-bold font-headline text-white flex items-center gap-2">
              <FaBell className="text-amber-400 w-3.5 h-3.5" /> {activeDomain} Task Alerts
            </h3>
            <span className="text-xs bg-[#1c1c1c] px-2 py-0.5 rounded-full text-neutral-300 font-mono">
              {notificationList.length} pending
            </span>
          </div>

          <div className="space-y-2.5">
            {notificationList.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">
                No pending tasks broadcasted in <span className="text-white font-semibold">{activeDomain}</span>.
              </p>
            ) : (
              notificationList.map((task) => (
                <div
                  key={task.id}
                  className="bg-[#1c1c1c] border border-[#282828] p-3 rounded-xl flex flex-col gap-2 shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-white leading-snug">
                      {task.content}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shrink-0">
                      {task.sector}
                    </span>
                  </div>

                  <div className="text-xs font-headline font-bold text-emerald-400">
                    Budget: ₹ {task.moneyAllocated.toLocaleString()}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => acceptNotification(task)}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
                    >
                      Accept Task
                    </button>
                    <button
                      onClick={() => declineNotification(task.id)}
                      className="py-1.5 px-3 bg-[#242424] hover:bg-red-950/80 text-neutral-300 hover:text-red-200 rounded-lg text-xs font-medium transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationList;
