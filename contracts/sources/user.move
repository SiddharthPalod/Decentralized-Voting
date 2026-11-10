module account_addr::user {
    use std::signer;
    use std::string::{Self, String};
    use aptos_framework::event;
    use aptos_framework::timestamp;

    /// =========================================================================
    /// Error Codes
    /// =========================================================================
    const EUSER_NOT_FOUND: u64 = 1;
    const EUSER_ALREADY_EXISTS: u64 = 2;
    const E_UNAUTHORIZED_DOMAIN: u64 = 11;

    /// =========================================================================
    /// Events (Observer Pattern)
    /// =========================================================================
    #[event]
    struct UserCreated has store, drop, copy {
        name: String,
        field: String,
        address: address,
        timestamp: u64,
    }

    /// =========================================================================
    /// Resources
    /// =========================================================================
    struct User has key {
        name: String,
        field: String,
        address: address,
        created_at: u64,
    }

    /// =========================================================================
    /// View Functions (Interface Segregation: Query API)
    /// =========================================================================
    #[view]
    public fun get_name(account: address): String acquires User {
        assert!(exists<User>(account), EUSER_NOT_FOUND);
        let user = borrow_global<User>(account);
        user.name
    }

    #[view]
    public fun get_field(account: address): String acquires User {
        assert!(exists<User>(account), EUSER_NOT_FOUND);
        let user = borrow_global<User>(account);
        user.field
    }

    #[view]
    public fun user_exists(account: address): bool {
        exists<User>(account)
    }

    #[view]
    public fun is_authorized_for_domain(account: address, sector: String): bool acquires User {
        if (!exists<User>(account)) {
            return false
        };
        let user = borrow_global<User>(account);
        user.field == sector || user.field == string::utf8(b"Universal") || user.field == string::utf8(b"Government")
    }

    /// =========================================================================
    /// Entry Functions (Interface Segregation: Mutation API)
    /// =========================================================================

    /// Create user profile with default attributes
    public entry fun create_user(account: &signer) {
        let signer_address = signer::address_of(account);
        assert!(!exists<User>(signer_address), EUSER_ALREADY_EXISTS);

        let init_name = string::utf8(b"John Doe");
        let init_field = string::utf8(b"Healthcare");
        let current_time = timestamp::now_microseconds();

        let user = User {
            name: init_name,
            field: init_field,
            address: signer_address,
            created_at: current_time,
        };

        move_to(account, user);
        
        event::emit(UserCreated {
            name: init_name,
            field: init_field,
            address: signer_address,
            timestamp: current_time,
        });
    }

    /// Create user profile with custom name and field
    public entry fun create_user_with_info(account: &signer, name: String, field: String) {
        let signer_address = signer::address_of(account);
        assert!(!exists<User>(signer_address), EUSER_ALREADY_EXISTS);

        let current_time = timestamp::now_microseconds();

        let user = User {
            name,
            field,
            address: signer_address,
            created_at: current_time,
        };

        move_to(account, user);

        event::emit(UserCreated {
            name,
            field,
            address: signer_address,
            timestamp: current_time,
        });
    }

    /// Update user's name
    public entry fun update_name(account: &signer, new_name: String) acquires User {
        let signer_address = signer::address_of(account);
        assert!(exists<User>(signer_address), EUSER_NOT_FOUND);
        
        let user = borrow_global_mut<User>(signer_address);
        user.name = new_name;
    }

    /// Update user's field
    public entry fun update_field(account: &signer, new_field: String) acquires User {
        let signer_address = signer::address_of(account);
        assert!(exists<User>(signer_address), EUSER_NOT_FOUND);
        
        let user = borrow_global_mut<User>(signer_address);
        user.field = new_field;
    }
}
