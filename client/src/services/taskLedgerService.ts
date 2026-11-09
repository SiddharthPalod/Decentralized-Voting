export interface LedgerTask {
  id: number;
  content: string;
  sector: string;
  moneyAllocated: number;
  actualMoneySpent?: number;
  proofDocumentCid?: string;
  proofDocumentName?: string;
  proofDocumentUrl?: string;
  completionNotes?: string;
  status: 'Pending' | 'Ongoing' | 'Completed' | 'Approved';
  isProposal?: boolean; // Bottom-up taskholder proposal
  regulatorAddress: string;
  regulatorName: string;
  taskholderAddress: string; // specific address or 'ALL' for broadcast
  taskholderName?: string;
  taskholderPseudonym?: string; // Privacy-preserving identifier
  txHash?: string;
  createdAt: number;
  completedAt?: number;
  approvedAt?: number;
}

export interface DepartmentBudget {
  sector: string;
  percentage: number;
  totalBudget: number;
  disbursedFunds: number;
  committedFunds: number;
}

const STORAGE_KEY = 'trueledger_tasks_v3';
const BUDGET_STORAGE_KEY = 'trueledger_budgets_v3';

// Set VITE_USE_MOCK_LEDGER=true in .env to seed demo data; production always starts empty.
const USE_MOCK = import.meta.env.VITE_USE_MOCK_LEDGER === 'true';

export const MACRO_BUDGETS: DepartmentBudget[] = [
  {
    sector: 'Healthcare',
    percentage: 12,
    totalBudget: 200000,
    disbursedFunds: 45000,
    committedFunds: 0,
  },
  {
    sector: 'Infrastructure',
    percentage: 24,
    totalBudget: 400000,
    disbursedFunds: 0,
    committedFunds: 85000,
  },
  {
    sector: 'Education',
    percentage: 15,
    totalBudget: 250000,
    disbursedFunds: 0,
    committedFunds: 32000,
  },
  {
    sector: 'Agriculture',
    percentage: 12,
    totalBudget: 200000,
    disbursedFunds: 0,
    committedFunds: 0,
  },
  {
    sector: 'Technology',
    percentage: 9,
    totalBudget: 150000,
    disbursedFunds: 0,
    committedFunds: 0,
  },
  {
    sector: 'Contingency & Reserves',
    percentage: 28,
    totalBudget: 466667,
    disbursedFunds: 0,
    committedFunds: 0,
  },
];

const INITIAL_TASKS: LedgerTask[] = [
  {
    id: 101,
    content: 'Deliver Medical Supplies to District Primary Health Center',
    sector: 'Healthcare',
    moneyAllocated: 45000,
    actualMoneySpent: 42500,
    proofDocumentName: 'Supply_Delivery_Receipts_PHC.pdf',
    proofDocumentCid: 'ipfs://bafybeicg7e2m56v2q3o7x',
    completionNotes: 'All 15 crates of antibiotics and pediatric kits inspected and handed over to Chief Medical Officer.',
    status: 'Approved',
    regulatorAddress: '0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b',
    regulatorName: 'Dr. Rajesh Verma (Class-1 Regulator)',
    taskholderAddress: '0xTaskholderHealth',
    taskholderName: 'National Health Task Force',
    taskholderPseudonym: 'Node-HC-104',
    createdAt: Date.now() - 86400000 * 3,
    completedAt: Date.now() - 86400000 * 2,
    approvedAt: Date.now() - 86400000,
  },
  {
    id: 102,
    content: 'Emergency Repair for Donnavalli Community Clinic Generator Unit',
    sector: 'Healthcare',
    moneyAllocated: 15000,
    actualMoneySpent: 8200,
    proofDocumentName: 'Donnavalli_Repair_Invoice_Report.pdf',
    proofDocumentCid: 'ipfs://bafybeif9s7d3a2x89y1b4',
    completionNotes: 'Replaced dynamo armature and copper coil wiring. Total component cost ₹8,200 (budget surplus of ₹6,800 returned to state pool).',
    status: 'Completed',
    regulatorAddress: '0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b',
    regulatorName: 'Dr. Rajesh Verma (Class-1 Regulator)',
    taskholderAddress: 'ALL',
    taskholderName: 'Field Medical Engineering Team',
    taskholderPseudonym: 'Node-HC-209',
    createdAt: Date.now() - 86400000 * 2,
    completedAt: Date.now() - 3600000 * 5,
  },
  {
    id: 103,
    content: 'Audit Rural Solar Microgrid Installation and Inverter Units',
    sector: 'Infrastructure',
    moneyAllocated: 85000,
    status: 'Ongoing',
    regulatorAddress: '0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b',
    regulatorName: 'Shri V. Sharma (Central Auditor)',
    taskholderAddress: 'ALL',
    taskholderName: 'Apex Engineering Corp',
    taskholderPseudonym: 'Node-INF-055',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 104,
    content: 'Distribute Digital Literacy Tablets to Secondary Schools in Sector 4',
    sector: 'Education',
    moneyAllocated: 32000,
    status: 'Pending',
    regulatorAddress: '0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b',
    regulatorName: 'Central Planning Directorate',
    taskholderAddress: 'ALL',
    createdAt: Date.now() - 3600000 * 4,
  },
];

class TaskLedgerService {
  private getStorage(): LedgerTask[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Only seed demo tasks when the mock flag is explicitly enabled
        const seed = USE_MOCK ? INITIAL_TASKS : [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        return seed;
      }
      return JSON.parse(data);
    } catch {
      return USE_MOCK ? INITIAL_TASKS : [];
    }
  }

  private setStorage(tasks: LedgerTask[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new Event('trueledger_sync'));
  }

  // --- Department Budgets (Synchronized Across Regulators) ---
  getAllBudgets(): DepartmentBudget[] {
    try {
      const data = localStorage.getItem(BUDGET_STORAGE_KEY);
      if (!data) {
        // Only seed macro budgets in mock/demo mode; in production these come from on-chain allocations
        const seed = USE_MOCK ? MACRO_BUDGETS : [];
        localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(seed));
        return seed;
      }
      return JSON.parse(data);
    } catch {
      return USE_MOCK ? MACRO_BUDGETS : [];
    }
  }

  getDepartmentBudget(sectorName: string): DepartmentBudget {
    const budgets = this.getAllBudgets();
    const found = budgets.find(
      (b) => b.sector.toLowerCase() === sectorName.toLowerCase()
    );
    return (
      found || {
        sector: sectorName,
        percentage: 10,
        totalBudget: 200000,
        disbursedFunds: 0,
        committedFunds: 0,
      }
    );
  }

  private updateDepartmentBudget(
    sectorName: string,
    committedDelta: number,
    disbursedDelta: number
  ) {
    const budgets = this.getAllBudgets();
    const idx = budgets.findIndex(
      (b) => b.sector.toLowerCase() === sectorName.toLowerCase()
    );
    if (idx !== -1) {
      budgets[idx].committedFunds = Math.max(
        0,
        budgets[idx].committedFunds + committedDelta
      );
      budgets[idx].disbursedFunds = Math.max(
        0,
        budgets[idx].disbursedFunds + disbursedDelta
      );
      localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
      window.dispatchEvent(new Event('trueledger_sync'));
    }
  }

  // --- Task Queries ---
  getAllTasks(): LedgerTask[] {
    return this.getStorage();
  }

  getTasksBySector(sector: string): LedgerTask[] {
    const all = this.getStorage();
    if (!sector || sector === 'ALL') return all;
    return all.filter((t) => t.sector.toLowerCase() === sector.toLowerCase());
  }

  getTasksForTaskholder(address?: string): LedgerTask[] {
    const all = this.getStorage();
    if (!address) return all;
    const lower = address.toLowerCase();
    return all.filter(
      (t) =>
        t.taskholderAddress === 'ALL' ||
        t.taskholderAddress.toLowerCase() === lower ||
        t.status === 'Ongoing' ||
        t.status === 'Completed' ||
        t.status === 'Approved'
    );
  }

  getPendingNotifications(address?: string): LedgerTask[] {
    const all = this.getStorage();
    if (!address) return all.filter((t) => t.status === 'Pending');
    const lower = address.toLowerCase();
    return all.filter(
      (t) =>
        t.status === 'Pending' &&
        (t.taskholderAddress === 'ALL' || t.taskholderAddress.toLowerCase() === lower)
    );
  }

  // Generate pseudonymous node identifier
  private generatePseudonym(sector: string, address: string): string {
    const code = sector.slice(0, 3).toUpperCase();
    const suffix = address ? address.slice(-4).toUpperCase() : Math.floor(100 + Math.random() * 900).toString();
    return `Node-${code}-${suffix}`;
  }

  // --- Task Mutations ---
  assignTask(params: {
    content: string;
    sector: string;
    moneyAllocated: number;
    regulatorAddress: string;
    regulatorName: string;
    taskholderAddress: string;
    txHash?: string;
  }): LedgerTask {
    const tasks = this.getStorage();
    const newTask: LedgerTask = {
      id: Date.now(),
      content: params.content,
      sector: params.sector || 'Healthcare',
      moneyAllocated: params.moneyAllocated,
      status: 'Pending',
      regulatorAddress: params.regulatorAddress,
      regulatorName: params.regulatorName,
      taskholderAddress: params.taskholderAddress || 'ALL',
      txHash: params.txHash,
      createdAt: Date.now(),
    };
    tasks.unshift(newTask);
    this.setStorage(tasks);

    // Commit funds in the synchronized department budget
    this.updateDepartmentBudget(newTask.sector, newTask.moneyAllocated, 0);

    return newTask;
  }

  // Bottom-up proposal by Taskholder
  proposeTask(params: {
    content: string;
    sector: string;
    estimatedBudget: number;
    taskholderAddress: string;
    taskholderName: string;
  }): LedgerTask {
    const tasks = this.getStorage();
    const newTask: LedgerTask = {
      id: Date.now(),
      content: params.content,
      sector: params.sector || 'Healthcare',
      moneyAllocated: params.estimatedBudget,
      status: 'Pending',
      isProposal: true,
      regulatorAddress: 'Pending Review',
      regulatorName: 'Department Regulators',
      taskholderAddress: params.taskholderAddress,
      taskholderName: params.taskholderName,
      taskholderPseudonym: this.generatePseudonym(params.sector, params.taskholderAddress),
      createdAt: Date.now(),
    };
    tasks.unshift(newTask);
    this.setStorage(tasks);
    return newTask;
  }

  acceptTask(taskId: number, taskholderAddress: string, taskholderName: string) {
    const tasks = this.getStorage();
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      tasks[idx].status = 'Ongoing';
      tasks[idx].taskholderAddress = taskholderAddress;
      tasks[idx].taskholderName = taskholderName;
      tasks[idx].taskholderPseudonym = this.generatePseudonym(tasks[idx].sector, taskholderAddress);
      this.setStorage(tasks);
    }
  }

  declineTask(taskId: number) {
    const tasks = this.getStorage();
    const target = tasks.find((t) => t.id === taskId);
    if (target && target.status === 'Pending') {
      this.updateDepartmentBudget(target.sector, -target.moneyAllocated, 0);
    }
    const updated = tasks.filter((t) => t.id !== taskId);
    this.setStorage(updated);
  }

  updateTaskStatus(taskId: number, newStatus: 'Pending' | 'Ongoing' | 'Completed') {
    const tasks = this.getStorage();
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      tasks[idx].status = newStatus;
      if (newStatus === 'Completed') {
        tasks[idx].completedAt = Date.now();
      }
      this.setStorage(tasks);
    }
  }

  // Taskholder submits completion proof with document and actual money spent
  submitTaskProof(params: {
    taskId: number;
    actualMoneySpent: number;
    proofDocumentName: string;
    proofDocumentCid?: string;
    proofDocumentUrl?: string;
    completionNotes: string;
  }) {
    const tasks = this.getStorage();
    const idx = tasks.findIndex((t) => t.id === params.taskId);
    if (idx !== -1) {
      tasks[idx].status = 'Completed';
      tasks[idx].actualMoneySpent = params.actualMoneySpent;
      tasks[idx].proofDocumentName = params.proofDocumentName;
      tasks[idx].proofDocumentCid = params.proofDocumentCid || `ipfs://bafybei${Math.random().toString(36).substring(2, 15)}`;
      if (params.proofDocumentUrl) {
        tasks[idx].proofDocumentUrl = params.proofDocumentUrl;
      }
      tasks[idx].completionNotes = params.completionNotes;
      tasks[idx].completedAt = Date.now();
      this.setStorage(tasks);
    }
  }

  deleteTask(taskId: number) {
    const tasks = this.getStorage();
    const target = tasks.find((t) => t.id === taskId);
    if (target && target.status === 'Pending') {
      this.updateDepartmentBudget(target.sector, -target.moneyAllocated, 0);
    }
    const updated = tasks.filter((t) => t.id !== taskId);
    this.setStorage(updated);
  }

  // Regulator approves audit and releases verified funds
  approveAndReleaseFunds(taskId: number, verifiedAmount?: number) {
    const tasks = this.getStorage();
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      const task = tasks[idx];
      const finalDisbursed = verifiedAmount !== undefined ? verifiedAmount : (task.actualMoneySpent || task.moneyAllocated);
      
      // Update department funds: remove commitment, record actual disbursed
      this.updateDepartmentBudget(task.sector, -task.moneyAllocated, finalDisbursed);

      tasks[idx].status = 'Approved';
      tasks[idx].actualMoneySpent = finalDisbursed;
      tasks[idx].approvedAt = Date.now();
      this.setStorage(tasks);
    }
  }

  // Taskholder returns unspent surplus funds back to the department pool
  returnSurplusToDepartment(sector?: string, amount?: number): number {
    const tasks = this.getStorage();
    let refundedTotal = 0;

    for (const t of tasks) {
      if (
        t.actualMoneySpent !== undefined &&
        t.actualMoneySpent > 0 &&
        t.moneyAllocated > t.actualMoneySpent
      ) {
        const surplus = t.moneyAllocated - t.actualMoneySpent;
        t.moneyAllocated = t.actualMoneySpent; // Align allocated with actual spent!
        refundedTotal += surplus;
        // Release from department committed funds so unspent funds become available in the pool
        this.updateDepartmentBudget(t.sector, -surplus, 0);
      }
    }

    // If tasks had not yet aligned but an amount was specified
    if (refundedTotal === 0 && amount && amount > 0) {
      refundedTotal = amount;
      if (sector) {
        this.updateDepartmentBudget(sector, -amount, 0);
      }
    }

    this.setStorage(tasks);
    window.dispatchEvent(new Event('trueledger_sync'));
    return refundedTotal;
  }

  subscribe(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener('trueledger_sync', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('trueledger_sync', handler);
      window.removeEventListener('storage', handler);
    };
  }
}

export const taskLedger = new TaskLedgerService();
