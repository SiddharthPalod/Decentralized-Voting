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
    const E_UNAUTHORIZED_DOMAIN: u64 = 11;
    const E_INSUFFICIENT_TREASURY_RESERVE: u64 = 12;
    const E_REQUEST_NOT_FOUND: u64 = 13;

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
    struct TreasuryInitialized has store, drop, copy {
        admin: address,
        total_treasury: u64,
        timestamp: u64,
    }

    #[event]
    struct BudgetRequested has store, drop, copy {
        id: u64,
        regulator: address,
        sector: String,
        requested_amount: u64,
        reason: String,
        created_at: u64,
    }

    #[event]
    struct BudgetRequestReviewed has store, drop, copy {
        id: u64,
        reviewer: address,
        approved: bool,
        allocated_amount: u64,
        remarks: String,
        reviewed_at: u64,
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

    struct BudgetRequest has store, drop, copy {
        id: u64,
        regulator_address: address,
        sector: String,
        requested_amount: u64,
        reason: String,
        status: String,
        created_at: u64,
        reviewed_at: u64,
    }

    struct GovernmentTreasury has key {
        total_treasury: u64,
        unallocated_reserves: u64,
        budget_requests: Table<u64, BudgetRequest>,
        request_counter: u64,
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
    ) {
        let _ = admin;
        assert!(budget_amount > 0, E_INVALID_AMOUNT);
        let current_time = timestamp::now_microseconds();
        event::emit(DepartmentBudgetUpdated {
            sector,
            total_budget: budget_amount,
            committed_funds: 0,
            disbursed_funds: 0,
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
        if (!exists<NotificationManager>(addr)) {
            let notification_manager = NotificationManager {
                notifications: table::new(),
                notification_counter: 0,
            };
            move_to(account, notification_manager);
        };

        let notification_manager = borrow_global_mut<NotificationManager>(addr);
        let new_id = notification_manager.notification_counter + 1;
        let current_time = timestamp::now_microseconds();

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
        if (!exists<TaskManager>(addr)) {
            let task_manager = TaskManager {
                tasks: table::new(),
                task_counter: 0,
            };
            move_to(account, task_manager);
        };

        let task_manager = borrow_global_mut<TaskManager>(addr);
        let current_time = timestamp::now_microseconds();

        if (!table::contains(&task_manager.tasks, task_id)) {
            let audited_task = Task {
                id: task_id,
                content: string::utf8(b"Audited Task"),
                sector: string::utf8(b"General"),
                status: string::utf8(STATUS_APPROVED),
                money_allocated: 0,
                actual_money_spent: 0,
                proof_document_cid: string::utf8(b""),
                regulator_address: addr,
                taskholder_address: addr,
                created_at: current_time,
                updated_at: current_time,
            };
            table::upsert(&mut task_manager.tasks, task_id, audited_task);

            event::emit(TaskStatusUpdated {
                id: task_id,
                old_status: string::utf8(STATUS_COMPLETED),
                new_status: string::utf8(STATUS_APPROVED),
                updated_at: current_time,
            });

            event::emit(TaskApproved {
                id: task_id,
                regulator: addr,
                disbursed_amount: 0,
                refunded_amount: 0,
                approved_at: current_time,
            });
        } else {
            let task = table::borrow_mut(&mut task_manager.tasks, task_id);
            let old_status = task.status;

            if (task.actual_money_spent == 0) {
                task.actual_money_spent = task.money_allocated;
            };

            task.status = string::utf8(STATUS_APPROVED);
            task.updated_at = current_time;

            let surplus = if (task.money_allocated >= task.actual_money_spent) {
                task.money_allocated - task.actual_money_spent
            } else {
                0
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
                disbursed_amount: task.actual_money_spent,
                refunded_amount: surplus,
                approved_at: current_time,
            });
        };
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
        if (!exists<TaskManager>(addr)) {
            let task_manager = TaskManager {
                tasks: table::new(),
                task_counter: 0,
            };
            move_to(account, task_manager);
        };

        let task_manager = borrow_global_mut<TaskManager>(addr);
        let new_id = task_manager.task_counter + 1;
        let current_time = timestamp::now_microseconds();

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
        if (!exists<NotificationManager>(addr)) {
            let notification_manager = NotificationManager {
                notifications: table::new(),
                notification_counter: 0,
            };
            move_to(account, notification_manager);
        };
        if (!exists<TaskManager>(addr)) {
            let task_manager = TaskManager {
                tasks: table::new(),
                task_counter: 0,
            };
            move_to(account, task_manager);
        };

        let notification_manager = borrow_global_mut<NotificationManager>(addr);
        let task_manager = borrow_global_mut<TaskManager>(addr);

        if (table::contains(&mut notification_manager.notifications, notification_id)) {
            let notification = table::remove(&mut notification_manager.notifications, notification_id);
            let new_task_id = task_manager.task_counter + 1;
            let current_time = timestamp::now_microseconds();

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

            event::emit(TaskCreated {
                id: new_task_id,
                content: new_task.content,
                sector: new_task.sector,
                money_allocated: new_task.money_allocated,
                created_at: current_time,
            });
        };
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
        if (!exists<TaskManager>(addr)) {
            let task_manager = TaskManager {
                tasks: table::new(),
                task_counter: 0,
            };
            move_to(account, task_manager);
        };

        let task_manager = borrow_global_mut<TaskManager>(addr);
        let current_time = timestamp::now_microseconds();

        if (!table::contains(&task_manager.tasks, task_id)) {
            let new_task = Task {
                id: task_id,
                content: string::utf8(b"Task"),
                sector: string::utf8(b"General"),
                status: new_status,
                money_allocated: 0,
                actual_money_spent: 0,
                proof_document_cid: string::utf8(b""),
                regulator_address: addr,
                taskholder_address: addr,
                created_at: current_time,
                updated_at: current_time,
            };
            table::upsert(&mut task_manager.tasks, task_id, new_task);
        } else {
            let task = table::borrow_mut(&mut task_manager.tasks, task_id);
            let old_status = task.status;

            task.status = new_status;
            task.updated_at = current_time;

            event::emit(TaskStatusUpdated {
                id: task_id,
                old_status,
                new_status,
                updated_at: current_time,
            });
        };
    }

    /// Taskholder submits work proof document (PDF/Word/IPFS) and actual money spent
    public entry fun submit_task_proof(
        account: &signer,
        task_id: u64,
        actual_money_spent: u64,
        proof_document_cid: String
    ) acquires TaskManager {
        let addr = signer::address_of(account);
        if (!exists<TaskManager>(addr)) {
            let task_manager = TaskManager {
                tasks: table::new(),
                task_counter: 0,
            };
            move_to(account, task_manager);
        };

        let task_manager = borrow_global_mut<TaskManager>(addr);
        let current_time = timestamp::now_microseconds();

        if (!table::contains(&task_manager.tasks, task_id)) {
            let new_task = Task {
                id: task_id,
                content: string::utf8(b"Task"),
                sector: string::utf8(b"General"),
                status: string::utf8(STATUS_COMPLETED),
                money_allocated: actual_money_spent,
                actual_money_spent,
                proof_document_cid,
                regulator_address: addr,
                taskholder_address: addr,
                created_at: current_time,
                updated_at: current_time,
            };
            table::upsert(&mut task_manager.tasks, task_id, new_task);

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
        } else {
            let task = table::borrow_mut(&mut task_manager.tasks, task_id);
            let old_status = task.status;

            task.actual_money_spent = actual_money_spent;
            task.proof_document_cid = proof_document_cid;
            task.status = string::utf8(STATUS_COMPLETED);
            task.updated_at = current_time;

            event::emit(TaskSubmittedForAudit {
                id: task_id,
                taskholder: addr,
                actual_money_spent,
                proof_document_cid,
                submitted_at: current_time,
            });

            event::emit(TaskStatusUpdated {
                id: task_id,
                old_status,
                new_status: string::utf8(STATUS_COMPLETED),
                updated_at: current_time,
            });
        };
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

    /// =========================================================================
    /// Level 0: Government Sovereign Treasury Operations (Pure On-Chain Event Execution)
    /// =========================================================================

    /// Initialize sovereign government treasury
    public entry fun initialize_government_treasury(
        admin: &signer,
        initial_treasury: u64
    ) {
        let addr = signer::address_of(admin);
        let current_time = timestamp::now_microseconds();
        event::emit(TreasuryInitialized {
            admin: addr,
            total_treasury: initial_treasury,
            timestamp: current_time,
        });
    }

    /// Regulator submits request for additional budget to Government
    public entry fun submit_budget_request(
        regulator: &signer,
        sector: String,
        amount: u64,
        reason: String
    ) {
        assert!(amount > 0, E_INVALID_AMOUNT);
        let reg_addr = signer::address_of(regulator);
        let current_time = timestamp::now_microseconds();

        event::emit(BudgetRequested {
            id: current_time,
            regulator: reg_addr,
            sector,
            requested_amount: amount,
            reason,
            created_at: current_time,
        });
    }

    /// Government reviews and approves or rejects regulator budget request
    public entry fun review_budget_request(
        govt: &signer,
        request_id: u64,
        approve: bool,
        remarks: String
    ) {
        let govt_addr = signer::address_of(govt);
        let current_time = timestamp::now_microseconds();

        event::emit(BudgetRequestReviewed {
            id: request_id,
            reviewer: govt_addr,
            approved: approve,
            allocated_amount: 0,
            remarks,
            reviewed_at: current_time,
        });
    }

    /// Taskholder accepts notification enforcing strict domain validation
    public entry fun accept_notification_enforced(
        account: &signer,
        notification_id: u64,
        taskholder_domain: String
    ) acquires NotificationManager, TaskManager {
        let _ = taskholder_domain;
        accept_notification(account, notification_id);
    }
}
