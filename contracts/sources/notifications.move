module account_addr::user {
    use std::signer;
    use std::string::{Self, String};
    use aptos_framework::event;

    #[event]
    struct UserCreated has store, drop, copy {
        name: String,
        field: String,
        address: address,
    }

    struct User has key {
        name: String,
        field: String,
        address: address,
    }

    public fun get_name(account: address): String acquires User {
        let user = borrow_global<User>(account);
        user.name
    }

    public fun get_field(account: address): String acquires User {
        let user = borrow_global<User>(account);
        user.field
    }

    public entry fun create_user(account: &signer) {
        let init_name = string::utf8(b"John Doe");
        let init_field = string::utf8(b"Healthcare");
        let signer_address = signer::address_of(account);

        let user = User {
            name: init_name,
            field: init_field,
            address: signer_address,
        };

        move_to(account, user);
        
        let user_event = UserCreated {
            name: init_name,
            field: init_field,
            address: signer_address,
        };
        event::emit(user_event);
    }
}

module account_addr::task_manager {
    use std::signer;
    use aptos_std::table::{Self, Table};
    use std::string::{Self, String};
    use aptos_framework::event;

    // Error messages
    const E_NOT_INITIALIZED: u64 = 1;       // Not initialized error
    const E_ALREADY_INITIALIZED: u64 = 2;  // Already initialized error
    const E_TASK_NOT_FOUND: u64 = 3;       // Task not found error
    const E_NOTIFICATION_NOT_FOUND: u64 = 4; // Notification not found error
    const E_INVALID_STATUS_UPDATE: u64 = 5; // Invalid status update error


    #[event]
    struct NotificationAdded has store, drop, copy {
        id: u64,
        content: String,
        money_allocated: u64,
        created_at: u64,
    }

    #[event]
    struct TaskCreated has store, drop, copy {
        id: u64,
        content: String,
        money_allocated: u64,
    }

    struct Notification has store, drop, copy {
        id: u64,
        content: String,
        status: String,
        money_allocated: u64,
        created_at: u64,
    }

    struct Task has store, drop, copy {
        id: u64,
        content: String,
        status: String,
        money_allocated: u64,
    }

    struct NotificationManager has key {
        notifications: Table<u64, Notification>,
        notification_counter: u64,
    }

    struct TaskManager has key {
        tasks: Table<u64, Task>,
        task_counter: u64,
    }

    public entry fun initialize_notification_manager(account: &signer) {
        assert!(!exists<NotificationManager>(signer::address_of(account)), E_ALREADY_INITIALIZED);
        let notification_manager = NotificationManager {
            notifications: table::new(),
            notification_counter: 0,
        };
        move_to(account, notification_manager);
    }

    public entry fun initialize_task_manager(account: &signer) {
        assert!(!exists<TaskManager>(signer::address_of(account)), E_ALREADY_INITIALIZED);
        let task_manager = TaskManager {
            tasks: table::new(),
            task_counter: 0,
        };
        move_to(account, task_manager);
    }

    public entry fun add_notification(account: &signer, content: String, money_allocated: u64, created_at: u64) acquires NotificationManager {
        let addr = signer::address_of(account);
        assert!(exists<NotificationManager>(addr), E_NOT_INITIALIZED);

        let notification_manager = borrow_global_mut<NotificationManager>(addr);
        let new_id = notification_manager.notification_counter + 1;

        let new_notification = Notification {
            id: new_id,
            content,
            status: string::utf8(b"Pending"),
            money_allocated,
            created_at,
        };

        table::upsert(&mut notification_manager.notifications, new_id, new_notification);
        notification_manager.notification_counter = new_id;

        let event_notification = NotificationAdded {
            id: new_id,
            content,
            money_allocated,
            created_at,
        };
        event::emit(event_notification);
    }

    public entry fun create_task(account: &signer, content: String, money_allocated: u64) acquires TaskManager {
        let addr = signer::address_of(account);
        assert!(exists<TaskManager>(addr), E_NOT_INITIALIZED);

        let task_manager = borrow_global_mut<TaskManager>(addr);
        let new_id = task_manager.task_counter + 1;

        let new_task = Task {
            id: new_id,
            content,
            status: string::utf8(b"Pending"),
            money_allocated,
        };

        table::upsert(&mut task_manager.tasks, new_id, new_task);
        task_manager.task_counter = new_id;

        let task_event = TaskCreated {
            id: new_id,
            content,
            money_allocated,
        };
        event::emit(task_event);
    }

    public entry fun accept_notification(account: &signer, notification_id: u64) acquires NotificationManager, TaskManager {
        let addr = signer::address_of(account);
        assert!(exists<NotificationManager>(addr), E_NOT_INITIALIZED);
        assert!(exists<TaskManager>(addr), E_NOT_INITIALIZED);

        let notification_manager = borrow_global_mut<NotificationManager>(addr);
        let task_manager = borrow_global_mut<TaskManager>(addr);

        assert!(table::contains(&mut notification_manager.notifications, notification_id), E_NOTIFICATION_NOT_FOUND);

        let notification = table::remove(&mut notification_manager.notifications, notification_id);
        let new_task_id = task_manager.task_counter + 1;

        let new_task = Task {
            id: new_task_id,
            content: notification.content,
            status: string::utf8(b"Pending"),
            money_allocated: notification.money_allocated,
        };

        table::upsert(&mut task_manager.tasks, new_task_id, new_task);
        task_manager.task_counter = new_task_id;
    }

    public entry fun decline_notification(account: &signer, notification_id: u64) acquires NotificationManager {
        let addr = signer::address_of(account);
        assert!(exists<NotificationManager>(addr), E_NOT_INITIALIZED);

        let notification_manager = borrow_global_mut<NotificationManager>(addr);
        assert!(table::contains(&mut notification_manager.notifications, notification_id), E_NOTIFICATION_NOT_FOUND);

        table::remove(&mut notification_manager.notifications, notification_id);
    }

    public entry fun delete_task(account: &signer, task_id: u64) acquires TaskManager {
        let addr = signer::address_of(account);
        assert!(exists<TaskManager>(addr), E_NOT_INITIALIZED);

        let task_manager = borrow_global_mut<TaskManager>(addr);
        assert!(table::contains(&mut task_manager.tasks, task_id), E_TASK_NOT_FOUND);

        table::remove(&mut task_manager.tasks, task_id);
    }

    public entry fun update_task_status(account: &signer, task_id: u64, new_status: String) acquires TaskManager {
        let addr = signer::address_of(account);
        assert!(exists<TaskManager>(addr), E_NOT_INITIALIZED);

        let task_manager = borrow_global_mut<TaskManager>(addr);
        assert!(table::contains(&mut task_manager.tasks, task_id), E_TASK_NOT_FOUND);

        assert!(
            new_status == string::utf8(b"Pending") ||
            new_status == string::utf8(b"Ongoing") ||
            new_status == string::utf8(b"Completed"),
            E_INVALID_STATUS_UPDATE
        );

        let task = table::borrow_mut(&mut task_manager.tasks, task_id);
        task.status = new_status;
    }

}
