import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AptosClient} from 'aptos';
import { InputTransactionData } from '@aptos-labs/wallet-adapter-react';

// Define task interface
export interface Task {
  id: number;
  content: string;
  status: 'Pending' | 'Ongoing' | 'Completed';
  moneyAllocated: number;
}

interface TaskContextType {
  taskList: Task[];
  addTask: (content: string, moneyAllocated: number) => Promise<void>;
  deleteTask: (taskId: number) => Promise<void>;
  updateStatus: (id: number, newStatus: 'Pending' | 'Completed' | 'Ongoing') => Promise<void>;
  fetchTasks: () => Promise<void>;
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined);

interface TaskProviderProps {
  children: ReactNode;
}

const moduleAddress = '0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b';
const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1');

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [taskList, setTaskList] = useState<Task[]>([]);
  const { account, signAndSubmitTransaction } = useWallet();
  const [transactionInProgress, setTransactionInProgress] = useState(false);

  // Fetch tasks from the blockchain
  const fetchTasks = async () => {
    if (!account) return;
    try {
      const events = await client.getEventsByEventHandle(
        account.address,
        `${moduleAddress}::task_manager::TaskManager`,
        'TaskCreated'
      );

      const tasks: Task[] = events.map((event: any) => ({
        id: event.data.id,
        content: event.data.content,
        status: 'Pending' as 'Pending', // Default to Pending
        moneyAllocated: event.data.money_allocated,
      }));

      setTaskList(tasks); // Set the task list state
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    fetchTasks(); // Fetch tasks on account change or mount
  }, [account]);

  // Add a new task via a Move transaction
  const addTask = async (content: string, moneyAllocated: number) => {
    if (!account) return;

    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::task_manager::create_task`,
        functionArguments: [content, moneyAllocated],
      },
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await client.waitForTransaction(response.hash); // Wait for the transaction to be mined
      fetchTasks(); // Refresh the task list after successful task creation
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  // Delete an existing task via a Move transaction
  const deleteTask = async (taskId: number) => {
    if (!account) return;

    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::task_manager::delete_task`,
        functionArguments: [taskId],
      },
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await client.waitForTransaction(response.hash); // Wait for the transaction to be mined
      // Filter out the deleted task from local state
      setTaskList((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  // Update the status of a task via a Move transaction
  const updateStatus = async (id: number, newStatus: 'Pending' | 'Completed' | 'Ongoing') => {
    if (!account) return;

    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::task_manager::update_task_status`,
        functionArguments: [id, newStatus],
      },
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await client.waitForTransaction(response.hash); // Wait for the transaction to be mined
      // Update the task status locally after the transaction is confirmed
      setTaskList((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? { ...task, status: newStatus } : task))
      );
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  return (
    <TaskContext.Provider value={{ taskList, addTask, deleteTask, updateStatus, fetchTasks }}>
      {transactionInProgress && <div>Transaction in progress...</div>}
      {children}
    </TaskContext.Provider>
  );
};
