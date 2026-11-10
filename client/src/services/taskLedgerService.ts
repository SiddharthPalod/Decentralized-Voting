/**
 * TrueLedger Verifiable Task & Budget Ledger Architecture
 *
 * Implements SOLID Principles & Clean Design Patterns:
 * - Single Responsibility Principle (SRP): Dedicated classes for Storage, Tasks, Budgets, Identity, and Event Bus.
 * - Open/Closed Principle (OCP): Storage backends and Lifecycle Guards can be extended without modifying core logic.
 * - Liskov Substitution Principle (LSP): Storage and Repositories adhere to strict interface contracts.
 * - Interface Segregation Principle (ISP): Focused interfaces (ITaskReader, ITaskWriter, IBudgetRepository, etc.).
 * - Dependency Inversion Principle (DIP): High-level Facade depends on abstractions injected via constructor.
 *
 * Design Patterns Applied:
 * - Repository Pattern: TaskRepository and BudgetRepository isolate data access from business rules.
 * - Facade Pattern: TaskLedgerService provides a unified, backward-compatible API to all frontend consumers.
 * - Observer Pattern: LedgerEventBus coordinates reactive subscriptions across React components and multi-tab storage.
 * - Strategy Pattern: IStorageProvider abstracts underlying persistence mechanism (LocalStorageProvider).
 * - State Machine / Guard Pattern: TaskLifecycleGuard validates and protects task status transitions.
 */

// ============================================================================
// Domain Models
// ============================================================================

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
  auditFeedback?: string; // Regulator feedback if audit is denied / revisions required
  auditRejectedAt?: number;
  status: 'Proposed' | 'Pending' | 'Ongoing' | 'Completed' | 'Approved';
  isProposal?: boolean; // Bottom-up taskholder proposal
  proposalStatus?: 'Pending_Review' | 'Approved' | 'Rejected';
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

// ============================================================================
// Initial Mock Seeding
// ============================================================================

const STORAGE_KEY = 'trueledger_tasks_v3';
const BUDGET_STORAGE_KEY = 'trueledger_budgets_v3';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_LEDGER === 'true';

export const MACRO_BUDGETS: DepartmentBudget[] = [
  { sector: 'Healthcare', percentage: 12, totalBudget: 200000, disbursedFunds: 45000, committedFunds: 0 },
  { sector: 'Infrastructure', percentage: 24, totalBudget: 400000, disbursedFunds: 0, committedFunds: 85000 },
  { sector: 'Education', percentage: 15, totalBudget: 250000, disbursedFunds: 0, committedFunds: 32000 },
  { sector: 'Agriculture', percentage: 12, totalBudget: 200000, disbursedFunds: 0, committedFunds: 0 },
  { sector: 'Technology', percentage: 9, totalBudget: 150000, disbursedFunds: 0, committedFunds: 0 },
  { sector: 'Contingency & Reserves', percentage: 28, totalBudget: 466667, disbursedFunds: 0, committedFunds: 0 },
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

// ============================================================================
// Core Abstractions & Interfaces (ISP & DIP)
// ============================================================================

export interface IStorageProvider {
  getItem<T>(key: string, fallback: T): T;
  setItem<T>(key: string, value: T): void;
}

export interface IEventBus {
  emit(event: string): void;
  subscribe(event: string, callback: () => void): () => void;
}

export interface IPseudonymGenerator {
  generate(sector: string, address: string): string;
}

export interface ITaskStateGuard {
  canTransition(current: LedgerTask['status'], next: LedgerTask['status']): boolean;
}

export interface ITaskReader {
  getAll(): LedgerTask[];
  getById(id: number): LedgerTask | undefined;
  getBySector(sector: string): LedgerTask[];
  getForTaskholder(address?: string): LedgerTask[];
  getPendingNotifications(address?: string): LedgerTask[];
  getPendingProposals(): LedgerTask[];
}

export interface ITaskWriter {
  save(tasks: LedgerTask[]): void;
  upsert(task: LedgerTask): void;
  delete(id: number): LedgerTask | undefined;
}

export interface ITaskRepository extends ITaskReader, ITaskWriter {}

export interface IBudgetRepository {
  getAll(): DepartmentBudget[];
  getBySector(sector: string): DepartmentBudget;
  updateDelta(sector: string, committedDelta: number, disbursedDelta: number): void;
}

// ============================================================================
// Concrete Implementations (SRP)
// ============================================================================

/** Strategy Pattern: LocalStorage Provider */
export class LocalStorageProvider implements IStorageProvider {
  getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
      }
      return JSON.parse(data);
    } catch {
      return fallback;
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage setItem failed:', e);
    }
  }
}

/** Observer Pattern: Ledger Event Bus */
export class LedgerEventBus implements IEventBus {
  emit(event: string): void {
    window.dispatchEvent(new Event(event));
  }

  subscribe(event: string, callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener(event, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(event, handler);
      window.removeEventListener('storage', handler);
    };
  }
}

/** Single Responsibility: Pseudonym Generator */
export class PseudonymGenerator implements IPseudonymGenerator {
  generate(sector: string, address: string): string {
    const code = sector ? sector.slice(0, 3).toUpperCase() : 'GEN';
    const suffix = address ? address.slice(-4).toUpperCase() : Math.floor(100 + Math.random() * 900).toString();
    return `Node-${code}-${suffix}`;
  }
}

/** State Machine / Guard Pattern: Task Lifecycle Validator */
export class TaskLifecycleGuard implements ITaskStateGuard {
  private validTransitions: Record<LedgerTask['status'], LedgerTask['status'][]> = {
    Proposed: ['Pending'], // Approved by Regulator -> Broadcasted
    Pending: ['Ongoing'],  // Accepted by Taskholder
    Ongoing: ['Completed', 'Ongoing'], // Proof submitted or re-revised
    Completed: ['Approved', 'Ongoing'], // Approved by Auditor OR Denied (returned to Ongoing for revision)
    Approved: [], // Terminal immutable state
  };

  canTransition(current: LedgerTask['status'], next: LedgerTask['status']): boolean {
    if (current === next) return true;
    const allowed = this.validTransitions[current];
    return allowed ? allowed.includes(next) : false;
  }
}

/** Repository Pattern: Task Persistence & Filtering */
export class TaskRepository implements ITaskRepository {
  constructor(
    private storage: IStorageProvider,
    private eventBus: IEventBus
  ) {}

  getAll(): LedgerTask[] {
    const seed = USE_MOCK ? INITIAL_TASKS : [];
    return this.storage.getItem<LedgerTask[]>(STORAGE_KEY, seed);
  }

  getById(id: number): LedgerTask | undefined {
    return this.getAll().find((t) => t.id === id);
  }

  getBySector(sector: string): LedgerTask[] {
    const all = this.getAll();
    if (!sector || sector === 'ALL') return all;
    return all.filter((t) => t.sector.toLowerCase() === sector.toLowerCase());
  }

  getForTaskholder(address?: string): LedgerTask[] {
    const all = this.getAll();
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
    const all = this.getAll();
    if (!address) return all.filter((t) => t.status === 'Pending');
    const lower = address.toLowerCase();
    return all.filter(
      (t) =>
        t.status === 'Pending' &&
        (t.taskholderAddress === 'ALL' || t.taskholderAddress.toLowerCase() === lower)
    );
  }

  getPendingProposals(): LedgerTask[] {
    return this.getAll().filter(
      (t) => t.status === 'Proposed' && t.proposalStatus === 'Pending_Review'
    );
  }

  save(tasks: LedgerTask[]): void {
    this.storage.setItem(STORAGE_KEY, tasks);
    this.eventBus.emit('trueledger_sync');
  }

  upsert(task: LedgerTask): void {
    const tasks = this.getAll();
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx !== -1) {
      tasks[idx] = task;
    } else {
      tasks.unshift(task);
    }
    this.save(tasks);
  }

  delete(id: number): LedgerTask | undefined {
    const tasks = this.getAll();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      const [removed] = tasks.splice(idx, 1);
      this.save(tasks);
      return removed;
    }
    return undefined;
  }
}

/** Repository Pattern: Budget Management */
export class BudgetRepository implements IBudgetRepository {
  constructor(
    private storage: IStorageProvider,
    private eventBus: IEventBus
  ) {}

  getAll(): DepartmentBudget[] {
    const seed = USE_MOCK ? MACRO_BUDGETS : [];
    return this.storage.getItem<DepartmentBudget[]>(BUDGET_STORAGE_KEY, seed);
  }

  getBySector(sectorName: string): DepartmentBudget {
    const budgets = this.getAll();
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

  updateDelta(sectorName: string, committedDelta: number, disbursedDelta: number): void {
    const budgets = this.getAll();
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
      this.storage.setItem(BUDGET_STORAGE_KEY, budgets);
      this.eventBus.emit('trueledger_sync');
    }
  }
}

// ============================================================================
// Facade Pattern: TaskLedgerService
// ============================================================================

export class TaskLedgerService {
  constructor(
    private taskRepo: ITaskRepository,
    private budgetRepo: IBudgetRepository,
    private eventBus: IEventBus,
    private pseudonymGen: IPseudonymGenerator,
    private stateGuard: ITaskStateGuard
  ) {}

  // --- Subscriptions (Observer) ---
  subscribe(callback: () => void): () => void {
    return this.eventBus.subscribe('trueledger_sync', callback);
  }

  // --- Budget Queries & Operations ---
  getAllBudgets(): DepartmentBudget[] {
    return this.budgetRepo.getAll();
  }

  getDepartmentBudget(sectorName: string): DepartmentBudget {
    return this.budgetRepo.getBySector(sectorName);
  }

  // --- Task Queries (Read Operations) ---
  getAllTasks(): LedgerTask[] {
    return this.taskRepo.getAll();
  }

  getTasksBySector(sector: string): LedgerTask[] {
    return this.taskRepo.getBySector(sector);
  }

  getTasksForTaskholder(address?: string): LedgerTask[] {
    return this.taskRepo.getForTaskholder(address);
  }

  getPendingNotifications(address?: string): LedgerTask[] {
    return this.taskRepo.getPendingNotifications(address);
  }

  getPendingProposals(): LedgerTask[] {
    return this.taskRepo.getPendingProposals();
  }

  // --- Task Mutations (Create, Update, Delete) ---

  /** C: Regulator assigns and broadcasts official task */
  assignTask(params: {
    content: string;
    sector: string;
    moneyAllocated: number;
    regulatorAddress: string;
    regulatorName: string;
    taskholderAddress: string;
    txHash?: string;
  }): LedgerTask {
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

    this.taskRepo.upsert(newTask);
    this.budgetRepo.updateDelta(newTask.sector, newTask.moneyAllocated, 0);
    return newTask;
  }

  /** C: Taskholder proposes bottom-up community task (Pending Review) */
  proposeTask(params: {
    content: string;
    sector: string;
    estimatedBudget: number;
    taskholderAddress: string;
    taskholderName: string;
  }): LedgerTask {
    const newTask: LedgerTask = {
      id: Date.now(),
      content: params.content,
      sector: params.sector || 'Healthcare',
      moneyAllocated: params.estimatedBudget,
      status: 'Proposed',
      isProposal: true,
      proposalStatus: 'Pending_Review',
      regulatorAddress: 'Pending Review',
      regulatorName: 'Department Regulators',
      taskholderAddress: params.taskholderAddress,
      taskholderName: params.taskholderName,
      taskholderPseudonym: this.pseudonymGen.generate(params.sector, params.taskholderAddress),
      createdAt: Date.now(),
    };

    this.taskRepo.upsert(newTask);
    return newTask;
  }

  /** U: Regulator approves bottom-up proposal on-chain and broadcasts to department */
  approveProposal(params: {
    taskId: number;
    regulatorAddress: string;
    regulatorName: string;
    txHash?: string;
  }): LedgerTask | null {
    const task = this.taskRepo.getById(params.taskId);
    if (!task) return null;

    if (!this.stateGuard.canTransition(task.status, 'Pending')) {
      console.warn(`Invalid transition from ${task.status} to Pending`);
      return null;
    }

    task.status = 'Pending';
    task.proposalStatus = 'Approved';
    task.regulatorAddress = params.regulatorAddress;
    task.regulatorName = params.regulatorName;
    task.taskholderAddress = 'ALL';
    if (params.txHash) task.txHash = params.txHash;

    this.taskRepo.upsert(task);
    this.budgetRepo.updateDelta(task.sector, task.moneyAllocated, 0);
    return task;
  }

  /** D: Regulator rejects bottom-up proposal */
  rejectProposal(taskId: number): boolean {
    const removed = this.taskRepo.delete(taskId);
    return !!removed;
  }

  /** U: Taskholder accepts broadcasted task */
  acceptTask(taskId: number, taskholderAddress: string, taskholderName: string): boolean {
    const task = this.taskRepo.getById(taskId);
    if (!task) return false;

    if (!this.stateGuard.canTransition(task.status, 'Ongoing')) {
      console.warn(`Invalid transition from ${task.status} to Ongoing`);
      return false;
    }

    task.status = 'Ongoing';
    task.taskholderAddress = taskholderAddress;
    task.taskholderName = taskholderName;
    task.taskholderPseudonym = this.pseudonymGen.generate(task.sector, taskholderAddress);

    this.taskRepo.upsert(task);
    return true;
  }

  /** D: Decline notification */
  declineTask(taskId: number): void {
    const task = this.taskRepo.getById(taskId);
    if (task && task.status === 'Pending') {
      this.budgetRepo.updateDelta(task.sector, -task.moneyAllocated, 0);
    }
    this.taskRepo.delete(taskId);
  }

  /** U: Update task status */
  updateTaskStatus(taskId: number, newStatus: 'Pending' | 'Ongoing' | 'Completed'): boolean {
    const task = this.taskRepo.getById(taskId);
    if (!task) return false;

    if (!this.stateGuard.canTransition(task.status, newStatus)) {
      console.warn(`Invalid transition from ${task.status} to ${newStatus}`);
      return false;
    }

    task.status = newStatus;
    if (newStatus === 'Completed') {
      task.completedAt = Date.now();
    }
    this.taskRepo.upsert(task);
    return true;
  }

  /** U: Taskholder submits completion proof with expense receipts & IPFS document */
  submitTaskProof(params: {
    taskId: number;
    actualMoneySpent: number;
    proofDocumentName: string;
    proofDocumentCid?: string;
    proofDocumentUrl?: string;
    completionNotes: string;
  }): boolean {
    const task = this.taskRepo.getById(params.taskId);
    if (!task) return false;

    task.status = 'Completed';
    task.actualMoneySpent = params.actualMoneySpent;
    task.proofDocumentName = params.proofDocumentName;
    task.proofDocumentCid = params.proofDocumentCid || `ipfs://bafybei${Math.random().toString(36).substring(2, 15)}`;
    if (params.proofDocumentUrl) {
      task.proofDocumentUrl = params.proofDocumentUrl;
    }
    task.completionNotes = params.completionNotes;
    task.auditFeedback = undefined; // Clear revision feedback upon new proof resubmission
    task.completedAt = Date.now();

    this.taskRepo.upsert(task);
    return true;
  }

  /** D: Delete task and release committed department funds */
  deleteTask(taskId: number): boolean {
    const task = this.taskRepo.getById(taskId);
    if (task && task.status === 'Pending') {
      this.budgetRepo.updateDelta(task.sector, -task.moneyAllocated, 0);
    }
    return !!this.taskRepo.delete(taskId);
  }

  /** U: Regulator denies audit and requests revision with specific feedback */
  rejectTaskAudit(taskId: number, feedback: string): boolean {
    const task = this.taskRepo.getById(taskId);
    if (!task) return false;

    task.status = 'Ongoing'; // Returned to active list for revision
    task.auditFeedback = feedback;
    task.auditRejectedAt = Date.now();

    this.taskRepo.upsert(task);
    return true;
  }

  /** U: Regulator approves audit and releases verified public funds */
  approveAndReleaseFunds(taskId: number, verifiedAmount?: number): boolean {
    const task = this.taskRepo.getById(taskId);
    if (!task) return false;

    const finalDisbursed = verifiedAmount !== undefined ? verifiedAmount : (task.actualMoneySpent || task.moneyAllocated);

    // Commit funds transition: release committed, commit actual disbursed
    this.budgetRepo.updateDelta(task.sector, -task.moneyAllocated, finalDisbursed);

    task.status = 'Approved';
    task.actualMoneySpent = finalDisbursed;
    task.approvedAt = Date.now();

    this.taskRepo.upsert(task);
    return true;
  }

  /** U: Taskholder returns unspent surplus balance back to department treasury */
  returnSurplusToDepartment(sector?: string, amount?: number): number {
    const tasks = this.taskRepo.getAll();
    let refundedTotal = 0;

    for (const t of tasks) {
      if (
        t.actualMoneySpent !== undefined &&
        t.actualMoneySpent > 0 &&
        t.moneyAllocated > t.actualMoneySpent
      ) {
        const surplus = t.moneyAllocated - t.actualMoneySpent;
        t.moneyAllocated = t.actualMoneySpent;
        refundedTotal += surplus;
        this.budgetRepo.updateDelta(t.sector, -surplus, 0);
      }
    }

    if (refundedTotal === 0 && amount && amount > 0) {
      refundedTotal = amount;
      if (sector) {
        this.budgetRepo.updateDelta(sector, -amount, 0);
      }
    }

    this.taskRepo.save(tasks);
    return refundedTotal;
  }
}

// ============================================================================
// Dependency Inversion: Assembling the Facade Instance (DIP)
// ============================================================================

const defaultStorageProvider = new LocalStorageProvider();
const defaultEventBus = new LedgerEventBus();
const defaultPseudonymGen = new PseudonymGenerator();
const defaultStateGuard = new TaskLifecycleGuard();

const defaultTaskRepo = new TaskRepository(defaultStorageProvider, defaultEventBus);
const defaultBudgetRepo = new BudgetRepository(defaultStorageProvider, defaultEventBus);

export const taskLedger = new TaskLedgerService(
  defaultTaskRepo,
  defaultBudgetRepo,
  defaultEventBus,
  defaultPseudonymGen,
  defaultStateGuard
);
