import { useEffect, useState } from "react";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { AptosClient } from "aptos";
import { Loader2 } from "lucide-react";
import { FaBell } from "react-icons/fa";

export const moduleAddress =
  "0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b";

const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1');

// Define Notification type for consistency
export interface Notification {
  id: number;
  text: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  moneyAllocated: number;
}

function NotificationList() {
  const [notificationList, setNotificationList] = useState<Notification[]>([]);
  const [transactionInProgress, setTransactionInProgress] = useState(false);  // Track if transaction is in progress
  const [isBellClicked, setIsBellClicked] = useState(false); // To toggle notification list visibility
  const { account, signAndSubmitTransaction } = useWallet();

  // Fetch notifications using the smart contract function
  const fetchNotifications = async () => {
    if (!account) return;
    try {
      // Fetch events for NotificationAdded from NotificationManager
      const events = await client.getEventsByEventHandle(
        account.address,
        `${moduleAddress}::task_manager::NotificationManager`,
        'NotificationAdded'
      );
  
      // Map through the events and format the notifications
      const notifications: Notification[] = events.map((event: any) => ({
        id: event.data.id,
        text: event.data.content,
        status: 'Pending' as 'Pending', // Default to Pending
        moneyAllocated: event.data.money_allocated,
      }));
  
      setNotificationList(notifications); // Set the notification list state
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications(); // Initial fetch when the component mounts
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  const addNotification = (notification: Notification) => {
    setNotificationList((prevNotifications) => [...prevNotifications, notification]);
  };

  const deleteNotification = (id: number) => {
    setNotificationList((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
  };

  const acceptNotification = async (notification: Notification) => {
    if (transactionInProgress) return;  // Prevent submitting multiple transactions at once
    setTransactionInProgress(true);  // Set transaction in progress state
  
    try {
      // Correcting the transaction structure
      const transactionData: InputTransactionData = {
        data: {
          function: `${moduleAddress}::task_manager::accept_notification`,
          functionArguments: [notification.id],  // Using functionArguments correctly
        },
      };
  
      const response = await signAndSubmitTransaction(transactionData);
      await client.waitForTransaction(response.hash);
  
      addNotification({
        id: notification.id,
        text: notification.text,
        status: 'Accepted',
        moneyAllocated: notification.moneyAllocated,
      });
      deleteNotification(notification.id);
    } catch (error) {
      console.error('Error accepting notification:', error);
    } finally {
      setTransactionInProgress(false);  // Reset transaction in progress state
    }
  };

  const declineNotification = async (id: number) => {
    if (transactionInProgress) return;  // Prevent submitting multiple transactions at once
    setTransactionInProgress(true);  // Set transaction in progress state
  
    try {
      // Correcting the transaction structure
      const transactionData: InputTransactionData = {
        data: {
          function: `${moduleAddress}::task_manager::decline_notification`,
          functionArguments: [id],  // Using functionArguments correctly
        },
      };
  
      const response = await signAndSubmitTransaction(transactionData);
      await client.waitForTransaction(response.hash);
  
      deleteNotification(id);
    } catch (error) {
      console.error('Error declining notification:', error);
    } finally {
      setTransactionInProgress(false);  // Reset transaction in progress state
    }
  };

  return (
    <div className="bg-dark text-white overflow-hidden relative">
      {transactionInProgress && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Bell Icon */}
      <div className="z-20 cursor-pointer">
        <FaBell
          onClick={() => setIsBellClicked((prev) => !prev)}
          className="w-4 h-4 text-white hover:text-yellow-500 transition-transform transform hover:scale-125"
        />
      </div>

      {/* Notification Dropdown */}
      {isBellClicked && (
        <div className="absolute top-16 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-10 w-64 max-h-80 overflow-y-auto">
          <div className="space-y-2">
            {notificationList.length === 0 ? (
              <p>No notifications available.</p>
            ) : (
              notificationList.map((notification) => (
                <div key={notification.id} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{notification.text}</div>
                    <div className="text-sm text-gray-500">Money Allocated: ₹ {notification.moneyAllocated}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptNotification(notification)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => declineNotification(notification.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
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
