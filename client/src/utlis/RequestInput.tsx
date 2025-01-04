import React, { useState, useEffect } from 'react';
import { AptosClient } from 'aptos';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { InputTransactionData } from '@aptos-labs/wallet-adapter-react'; // Correct import

export interface Notification {
  id: number;
  text: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  moneyAllocated: number;
}

const moduleAddress = '0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b';
const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1');

const RequestInput: React.FC = () => {
  const [notificationList, setNotificationList] = useState<Notification[]>([]);
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  const { account, signAndSubmitTransaction } = useWallet();
  
  const [text, setText] = useState('');
  const [moneyAllocated, setMoneyAllocated] = useState(0);

  const fetchNotifications = async () => {
    if (!account) return;
    try {
      const events = await client.getEventsByEventHandle(
        account.address,
        `${moduleAddress}::task_manager::NotificationManager`,
        'NotificationAdded'
      );

      const notifications: Notification[] = events.map((event: any) => ({
        id: event.data.id,
        text: event.data.content,
        status: 'Pending', // Default status
        moneyAllocated: event.data.money_allocated,
      }));

      setNotificationList(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const addNotification = async () => {
    if (transactionInProgress) return; // Prevent multiple transactions
    setTransactionInProgress(true);

    try {
    const transaction: InputTransactionData = {
      data:{

        function: `${moduleAddress}::task_manager::add_notification`,
        functionArguments: [text, moneyAllocated],
      },
    };

      const response = await signAndSubmitTransaction(transaction);
      await client.waitForTransaction(response.hash); // Wait for the transaction to be mined

      setText(''); // Reset the text after successful notification creation
      setMoneyAllocated(0);
    } catch (error) {
      console.error('Error adding notification:', error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  const deleteNotification = (id: number) => {
    setNotificationList((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
  };

  return (
    <div className="mt-6 text-black bg-white p-2 w-fit rounded-xl">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Assign New Task</h2>
      <div className="flex flex-row gap-4">
        <input
          className="col-span-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={text}
          placeholder="Task description..."
          onChange={(e) => setText(e.target.value)}
        />
        <input
          type="number"
          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={moneyAllocated}
          placeholder="Money Allocated"
          onChange={(e) => setMoneyAllocated(Number(e.target.value))}
        />
      </div>
      <button
        className="w-full mt-4 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        onClick={addNotification}
        disabled={transactionInProgress}
      >
        {transactionInProgress ? 'Notifying...' : 'Notify Taskholder'}
      </button>
    </div>
  );
};

export default RequestInput;
