import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AptosClient } from 'aptos';
import { InputTransactionData } from '@aptos-labs/wallet-adapter-react'; // Correct import
import TodoItem from './TodoItem';
import { Loader2 } from "lucide-react";


export const moduleAddress =
  '0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b';

// Initialize the Aptos client
const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1');

// Define task interface
export interface Task {
  id: number;
  content: string;
  status: 'Pending' | 'Ongoing' | 'Completed';
  moneyAllocated: number;
}

const TodoList: React.FC = () => {
  const [text, setText] = useState('');
  const [moneyAllocated, setMoneyAllocated] = useState<number>(0);

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
  const addTask = async () => {
    if (!account || !text || moneyAllocated <= 0) return; // Ensure text and money are provided

    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::task_manager::create_task`,
        functionArguments: [text, moneyAllocated],
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
    <div className="p-2 min-h-96 min-w-fit text-black bg-white shadow-md rounded-lg">
      <div>
        <p className="text-center text-2xl mb-2 font-bold">Tasks List</p>
        {taskList.map((task) => (
          <div key={task.id}>
            <TodoItem
              task={task}
              deleteTask={deleteTask}
              updateStatus={updateStatus}
            />
          </div>
        ))}
      </div>

      {/* Add task form */}
      <div className="mt-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter task content"
          className="p-2 rounded-md"
        />
        <input
          type="number"
          value={moneyAllocated}
          onChange={(e) => setMoneyAllocated(Number(e.target.value))}
          placeholder="Enter allocated money"
          className="p-2 rounded-md mt-2"
        />
        <button
          onClick={addTask}
          className={`bg-blue-500 text-white px-6 py-2 rounded mt-4 ${transactionInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={transactionInProgress}
        >
        {transactionInProgress && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>)}
        Add Task
        </button>
      </div>
    </div>
  );
};

export default TodoList;
