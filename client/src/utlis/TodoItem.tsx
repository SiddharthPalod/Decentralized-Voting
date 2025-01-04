interface TodoItemProps {
  task: { id: number; content: string; status: "Pending" | "Ongoing" | "Completed"; moneyAllocated: number };
  deleteTask: (id: number) => void;
  updateStatus: (id: number, newStatus: "Pending" | "Completed" | "Ongoing") => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ task, deleteTask, updateStatus }) => {
  const statusColors = {
    "Pending": 'bg-red-100 text-red-800',
    "Ongoing": 'bg-yellow-100 text-yellow-800',
    "Completed": 'bg-green-100 text-green-800',
  };

  return (
    <div className="px-2 pt-2 pb-1 font-primary text-black border bg-white shadow-lg border-gray-300 rounded-lg flex flex-row">
      <div className="w-1/2">
        <label className="block text-gray-600 text-sm">Task:</label>
        <p className="pr-2 font-para">{task.content}</p>
      </div>
      <div className="w-1/4">
        <label className="block text-gray-600 text-sm">Funds Used:</label>
        <p className="w-full font-para p-1 rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          ₹ {task.moneyAllocated}
        </p>
      </div>
      <div>
        <label className="block text-gray-600 text-sm">Status:</label>
        <select
          className={`inline-flex items-center px-1 py-1 rounded-full text-sm font-medium ${statusColors[task.status]}`}
          value={task.status}
          onChange={(e) => updateStatus(task.id, e.target.value as "Pending" | "Completed" | "Ongoing")} // Calls updateStatus
        >
          <option value="Pending" className="bg-white text-black">
            Pending
          </option>
          <option value="Ongoing" className="bg-white text-black">
            Ongoing
          </option>
          <option value="Completed" className="bg-white text-black">
            Completed
          </option>
        </select>
      </div>
      <div>
        <button
          className="text-red-500 hover:text-red-700 transition"
          onClick={() => deleteTask(task.id)}
        >
          &#10005;
        </button>
      </div>
    </div>
  );
};

export default TodoItem;
