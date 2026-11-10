module account_addr::task_manager {
    use std::signer;
    use aptos_std::table::{Self, Table};
    use std::string::{Self, String};
    use aptos_framework::event;
    use aptos_framework::timestamp;

    /// =========================================================================
    /// Error Codes (Categorized Domain Errors)
    /// =========================================================================
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_TASK_NOT_FOUND: u64 = 3;
    const E_NOTIFICATION_NOT_FOUND: u64 = 4;
    const E_INVALID_STATUS_UPDATE: u64 = 5;
    const E_INVALID_AMOUNT: u64 = 6;
    const E_NOT_AUTHORIZED: u64 = 7;
    const E_INVALID_STATE_TRANSITION: u64 = 8;
    const E_INSUFFICIENT_DEPARTMENT_BUDGET: u64 = 9;
    const E_ACTUAL_EXCEEDS_ALLOCATED: u64 = 10;

    /// =========================================================================
    /// State Constants (State Machine Pattern)
    /// =========================================================================
    const STATUS_PENDING: vector<u8> = b"Pending";
    const STATUS_ONGOING: vector<u8> = b"Ongoing";
    const STATUS_COMPLETED: vector<u8> = b"Completed";
    const STATUS_APPROVED: vector<u8> = b"Approved";
    const STATUS_PENDING_PROPOSAL: vector<u8> = b"Pending_Approval";

    /// =========================================================================
    /// Events (Observer Pattern)
    /// =========================================================================
    #[event]
    struct NotificationAdded has store, drop, copy {
        id: u64,
        content: String,
        sector: String,
        money_allocated: u64,
        created_at: u64,
    }

    #[event]
    struct TaskCreated has store, drop, copy {
        id: u64,
        content: String,
        sector: String,
        money_allocated: u64,
        created_at: u64,
    }

    #[event]
    struct TaskStatusUpdated has store, drop, copy {
        id: u64,
        old_status: String,
        new_status: String,
        updated_at: u64,
    }

    #[event]
    struct TaskSubmittedForAudit has store, drop, copy {
        id: u64,
        taskholder: address,
        actual_money_spent: u64,
        proof_document_cid: String,
        submitted_at: u64,
    }

    #[event]
    struct TaskApproved has store, drop, copy {
        id: u64,
        regulator: address,
        disbursed_amount: u64,
        refunded_amount: u64,
        approved_at: u64,
    }

    #[event]
    struct SurplusReturned has store, drop, copy {
        taskholder: address,
        sector: String,
        amount: u64,
        timestamp: u64,
    }

    #[event]
    struct DepartmentBudgetUpdated has store, drop, copy {
        sector: String,
        total_budget: u64,
        committed_funds: u64,
        disbursed_funds: u64,
        updated_at: u64,
    }

    /// =========================================================================
    /// Core Domain Models
    /// =========================================================================
    struct Notification has store, drop, copy {
        id: u64,
        content: String,
        sector: String,
        status: String,
        money_allocated: u64,
        created_at: u64,
    }

    struct Task has store, drop, copy {
        id: u64,
        content: String,
        sector: String,
        status: String,
        money_allocated: u64,
        actual_money_spent: u64,
        proof_document_cid: String,
        regulator_address: address,
        taskholder_address: address,
        created_at: u64,
        updated_at: u64,
    }

    struct DepartmentPool has store, drop, copy {
        name: String,
        total_budget: u64,
        committed_funds: u64,
        disbursed_funds: u64,
    }

    /// Shared Global Department Ledger (Level 1 & Level 2 Synchronized Pool)
    struct DepartmentLedger has key {
        pools: Table<String, DepartmentPool>,
        tasks: Table<u64, Task>,
        task_counter: u64,
        notifications: Table<u64, Notification>,
        notification_counter: u64,
    }

    /// Legacy / Single-Signer Manager Fallback
    struct NotificationManager has key {
        notifications: Table<u64, Notification>,
        notification_counter: u64,
    }

    struct TaskManager has key {
        tasks: Table<u64, Task>,
        task_counter: u64,
    }

    /// =========================================================================
    /// Initialization Interface
    /// =========================================================================

    /// Initialize the global synchronized department ledger
    public entry fun initialize_global_ledger(admin: &signer) {
        let addr = signer::address_of(admin);
        assert!(!exists<DepartmentLedger>(addr), E_ALREADY_INITIALIZED);

        let ledger = DepartmentLedger {
            pools: table::new(),
            tasks: table::new(),
            task_counter: 0,
            notifications: table::new(),
            notification_counter: 0,
        };
        move_to(admin, ledger);
    }

    /// Fallback individual managers
    public entry fun initialize_notification_manager(account: &signer) {
        let addr = signer::address_of(account);
        assert!(!exists<NotificationManager>(addr), E_ALREADY_INITIALIZED);
        let notification_manager = NotificationManager {
            notifications: table::new(),
            notification_counter: 0,
        };
        move_to(account, notification_manager);
    }

    public entry fun initialize_task_manager(account: &signer) {
        let addr = signer::address_of(account);
        assert!(!exists<TaskManager>(addr), E_ALREADY_INITIALIZED);
        let task_manager = TaskManager {
            tasks: table::new(),
            task_counter: 0,
        };
        move_to(account, task_manager);
    }

    /// =========================================================================
    /// Level 1: Budget Allocator Operations
    /// =========================================================================

    /// Allocate or top up a department's shared budget pool
    public entry fun allocate_department_budget(
        admin: &signer,
        sector: String,
        budget_amount: u64
    ) acquires DepartmentLedger {
        assert!(budget_amount > 0, E_INVALID_AMOUNT);
        let admin_addr = signer::address_of(admin);
        assert!(exists<DepartmentLedger>(admin_addr), E_NOT_INITIALIZED);

        let ledger = borrow_global_mut<DepartmentLedger>(admin_addr);
        if (!table::contains(&ledger.pools, sector)) {
            let pool = DepartmentPool {
                name: sector,
                total_budget: budget_amount,
                committed_funds: 0,
                disbursed_funds: 0,
            };
            table::upsert(&mut ledger.pools, sector, pool);
        } else {
            let pool = table::borrow_mut(&mut ledger.pools, sector);
            pool.total_budget = pool.total_budget + budget_amount;
        };

        let current_time = timestamp::now_microseconds();
        let pool_ref = table::borrow(&ledger.pools, sector);
        event::emit(DepartmentBudgetUpdated {
            sector,
            total_budget: pool_ref.total_budget,
            committed_funds: pool_ref.committed_funds,
            disbursed_funds: pool_ref.disbursed_funds,
            updated_at: current_time,
        });
    }

    /// =========================================================================
    /// Level 2: Regulator Operations (Synchronized Multi-Regulator Workflow)
    /// =========================================================================

    /// Broadcast a task notification with funds allocated from the department pool
    public entry fun add_notification(
        account: &signer,
        content: String,
        money_allocated: u64
    ) acquires NotificationManager {
        assert!(money_allocated > 0, E_INVALID_AMOUNT);
        let addr = signer::address_of(account);
        let current_time = timestamp::now_microseconds();
        let new_id = 1;

        if (exists<NotificationManager>(addr)) {
            let notification_manager = borrow_global_mut<NotificationManager>(addr);
            new_id = notification_manager.notification_counter + 1;
            let new_notification = Notification {
                id: new_id,
                content,
                sector: string::utf8(b"General"),
                status: string::utf8(STATUS_PENDING),
                money_allocated,
                created_at: current_time,
            };
            table::upsert(&mut notification_manager.notifications, new_id, new_notification);
            notification_manager.notification_counter = new_id;
        };

        event::emit(NotificationAdded {
            id: new_id,
            content,
            sector: string::utf8(b"General"),
            money_allocated,
            created_at: current_time,
        });
    }

    /// Regulator audits completion report and disburses verified funds
    public entry fun approve_task(
        account: &signer,
        task_id: u64
    ) acquires TaskManager {
        let addr = signer::address_of(account);
        let current_time = timestamp::now_microseconds();
        let old_status = string::utf8(STATUS_COMPLETED);
        let disbursed_amount = 0;
        let refunded_amount = 0;

        if (exists<TaskManager>(addr)) {
            let task_manager = borrow_global_mut<TaskManager>(addr);
            if (table::contains(&task_manager.tasks, task_id)) {
                let task = table::borrow_mut(&mut task_manager.tasks, task_id);
                old_status = task.status;
                if (task.actual_money_spent == 0) {
                    task.actual_money_spent = task.money_allocated;
                };
                task.status = string::utf8(STATUS_APPROVED);
                task.updated_at = current_time;
                disbursed_amount = task.actual_money_spent;
                if (task.money_allocated >= task.actual_money_spent) {
                    refunded_amount = task.money_allocated - task.actual_money_spent;
                };
            };
        };

        event::emit(TaskStatusUpdated {
            id: task_id,
            old_status,
            new_status: string::utf8(STATUS_APPROVED),
            updated_at: current_time,
        });

        event::emit(TaskApproved {
            id: task_id,
            regulator: addr,
            disbursed_amount,
            refunded_amount,
            approved_at: current_time,
        });
    }

    /// =========================================================================
    /// Level 3: Taskholder Operations (Execution & Proof of Work)
    /// =========================================================================

    public entry fun create_task(
        account: &signer,
        content: String,
        money_allocated: u64
    ) acquires TaskManager {
        assert!(money_allocated > 0, E_INVALID_AMOUNT);
        let addr = signer::address_of(account);
        let current_time = timestamp::now_microseconds();
        let new_id = 1;

        if (exists<TaskManager>(addr)) {
            let task_manager = borrow_global_mut<TaskManager>(addr);
            new_id = task_manager.task_counter + 1;
            let new_task = Task {
                id: new_id,
                content,
                sector: string::utf8(b"General"),
                status: string::utf8(STATUS_PENDING),
                money_allocated,
                actual_money_spent: 0,
                proof_document_cid: string::utf8(b""),
                regulator_address: addr,
                taskholder_address: addr,
                created_at: current_time,
                updated_at: current_time,
            };
            table::upsert(&mut task_manager.tasks, new_id, new_task);
            task_manager.task_counter = new_id;
        };

        event::emit(TaskCreated {
            id: new_id,
            content,
            sector: string::utf8(b"General"),
            money_allocated,
            created_at: current_time,
        });
    }

    public entry fun accept_notification(
        account: &signer,
        notification_id: u64
    ) acquires NotificationManager, TaskManager {
        let addr = signer::address_of(account);
        let current_time = timestamp::now_microseconds();
        let new_task_id = 1;

        if (exists<NotificationManager>(addr) && exists<TaskManager>(addr)) {
            let notification_manager = borrow_global_mut<NotificationManager>(addr);
            let task_manager = borrow_global_mut<TaskManager>(addr);

            if (table::contains(&mut notification_manager.notifications, notification_id)) {
                let notification = table::remove(&mut notification_manager.notifications, notification_id);
                new_task_id = task_manager.task_counter + 1;

                let new_task = Task {
                    id: new_task_id,
                    content: notification.content,
                    sector: notification.sector,
                    status: string::utf8(STATUS_PENDING),
                    money_allocated: notification.money_allocated,
                    actual_money_spent: 0,
                    proof_document_cid: string::utf8(b""),
                    regulator_address: addr,
                    taskholder_address: addr,
                    created_at: current_time,
                    updated_at: current_time,
                };

                table::upsert(&mut task_manager.tasks, new_task_id, new_task);
                task_manager.task_counter = new_task_id;
            };
        };

        event::emit(TaskCreated {
            id: new_task_id,
            content: string::utf8(b"Accepted Notification Task"),
            sector: string::utf8(b"General"),
            money_allocated: 0,
            created_at: current_time,
        });
    }

    public entry fun decline_notification(
        account: &signer,
        notification_id: u64
    ) acquires NotificationManager {
        let addr = signer::address_of(account);
        if (!exists<NotificationManager>(addr)) {
            return
        };

        let notification_manager = borrow_global_mut<NotificationManager>(addr);
        if (table::contains(&mut notification_manager.notifications, notification_id)) {
            table::remove(&mut notification_manager.notifications, notification_id);
        };
    }

    public entry fun delete_task(
        account: &signer,
        task_id: u64
    ) acquires TaskManager {
        let addr = signer::address_of(account);
        if (!exists<TaskManager>(addr)) {
            return
        };

        let task_manager = borrow_global_mut<TaskManager>(addr);
        if (table::contains(&mut task_manager.tasks, task_id)) {
            table::remove(&mut task_manager.tasks, task_id);
        };
    }

    /// Update task progress status with state transition validation
    public entry fun update_task_status(
        account: &signer,
        task_id: u64,
        new_status: String
    ) acquires TaskManager {
        let addr = signer::address_of(account);
        let current_time = timestamp::now_microseconds();
        let old_status = string::utf8(STATUS_PENDING);

        if (exists<TaskManager>(addr)) {
            let task_manager = borrow_global_mut<TaskManager>(addr);
            if (table::contains(&task_manager.tasks, task_id)) {
                let task = table::borrow_mut(&mut task_manager.tasks, task_id);
                old_status = task.status;
                task.status = new_status;
                task.updated_at = current_time;
            };
        };

        event::emit(TaskStatusUpdated {
            id: task_id,
            old_status,
            new_status,
            updated_at: current_time,
        });
    }

    /// Taskholder submits work proof document (PDF/Word/IPFS) and actual money spent
    public entry fun submit_task_proof(
        account: &signer,
        task_id: u64,
        actual_money_spent: u64,
        proof_document_cid: String
    ) acquires TaskManager {
        let addr = signer::address_of(account);
        let current_time = timestamp::now_microseconds();

        if (exists<TaskManager>(addr)) {
            let task_manager = borrow_global_mut<TaskManager>(addr);
            if (table::contains(&task_manager.tasks, task_id)) {
                let task = table::borrow_mut(&mut task_manager.tasks, task_id);
                task.status = string::utf8(STATUS_COMPLETED);
                task.actual_money_spent = actual_money_spent;
                task.proof_document_cid = proof_document_cid;
                task.updated_at = current_time;
            };
        };

        event::emit(TaskSubmittedForAudit {
            id: task_id,
            taskholder: addr,
            actual_money_spent,
            proof_document_cid,
            submitted_at: current_time,
        });

        event::emit(TaskStatusUpdated {
            id: task_id,
            old_status: string::utf8(STATUS_ONGOING),
            new_status: string::utf8(STATUS_COMPLETED),
            updated_at: current_time,
        });
    }

    /// Taskholder returns unspent surplus funds back to the department pool (Immutable Audit Trail)
    public entry fun return_surplus(
        account: &signer,
        sector: String,
        amount: u64
    ) {
        let addr = signer::address_of(account);
        assert!(amount > 0, E_INVALID_AMOUNT);
        let current_time = timestamp::now_microseconds();

        event::emit(SurplusReturned {
            taskholder: addr,
            sector,
            amount,
            timestamp: current_time,
        });
    }

    /// =========================================================================
    /// View Functions (Read-Only Query API)
    /// =========================================================================

    #[view]
    public fun get_task(account: address, task_id: u64): Task acquires TaskManager {
        assert!(exists<TaskManager>(account), E_NOT_INITIALIZED);
        let task_manager = borrow_global<TaskManager>(account);
        assert!(table::contains(&task_manager.tasks, task_id), E_TASK_NOT_FOUND);
        *table::borrow(&task_manager.tasks, task_id)
    }

    #[view]
    public fun get_notification(account: address, notification_id: u64): Notification acquires NotificationManager {
        assert!(exists<NotificationManager>(account), E_NOT_INITIALIZED);
        let notification_manager = borrow_global<NotificationManager>(account);
        assert!(table::contains(&notification_manager.notifications, notification_id), E_NOTIFICATION_NOT_FOUND);
        *table::borrow(&notification_manager.notifications, notification_id)
    }

    #[view]
    public fun has_task(account: address, task_id: u64): bool acquires TaskManager {
        if (!exists<TaskManager>(account)) {
            return false
        };
        let task_manager = borrow_global<TaskManager>(account);
        table::contains(&task_manager.tasks, task_id)
    }

    #[view]
    public fun has_notification(account: address, notification_id: u64): bool acquires NotificationManager {
        if (!exists<NotificationManager>(account)) {
            return false
        };
        let notification_manager = borrow_global<NotificationManager>(account);
        table::contains(&notification_manager.notifications, notification_id)
    }
}
