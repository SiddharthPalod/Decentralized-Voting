import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { AptosClient } from 'aptos';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { InputTransactionData } from '@aptos-labs/wallet-adapter-react';  

export interface Notification {
  id: number;
  text: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  moneyAllocated: number;
}

interface NotificationContextType {
  notificationList: Notification[];
  addNotification: (notification: Notification) => void;
  deleteNotification: (id: number) => void;
  acceptNotification: (notification: Notification) => void;
  declineNotification: (id: number) => void;
  setNotificationList: React.Dispatch<React.SetStateAction<Notification[]>>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const moduleAddress = '0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b';
const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1');

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notificationList, setNotificationList] = useState<Notification[]>([]);
  const [transactionInProgress, setTransactionInProgress] = useState(false);  // Track if transaction is in progress
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
    <NotificationContext.Provider
      value={{
        notificationList,
        addNotification,
        deleteNotification,
        acceptNotification,
        declineNotification,
        setNotificationList,
      }}
    >
    </NotificationContext.Provider>
  );
};
