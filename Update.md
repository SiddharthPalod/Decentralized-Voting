### 1. The 3-Tier Governance Hierarchy

```
       ┌────────────────────────────────────────────────────────┐
       │                 STATE GOVERNMENT (Apex)                 │
       │   • Macro Treasury Pool (₹5,000,000+)                   │
       │   • Allocates budgets to Department Regulators          │
       │   • Approves / Rejects Regulator Fund Increase Requests │
       │   • Solvency Guard: Enforces Reserve >= 0 invariant     │
       └───────────────────────────┬────────────────────────────┘
                                   │ Allocates / Top-ups
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │             DEPARTMENT REGULATORS (Class-1)            │
       │   • Manages Department Pool (Health, Infra, Edu, etc.) │
       │   • Creates & broadcasts tasks to field workers        │
       │   • Audits work proof & disburses approved funds       │
       │   • Requests Budget Increases from Government          │
       └───────────────────────────┬────────────────────────────┘
                                   │ Assigns / Verifies
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │              FIELD TASKHOLDERS (Ground Tier)           │
       │   • Executes tasks & spends funds on verified work     │
       │   • Uploads proof documents (CIDs)                     │
       │   • Returns unspent surplus back to Department Pool    │
       └────────────────────────────────────────────────────────┘
```

---

### 2. Workaround: Domain-Specific Task Enforcement with 1 Wallet

#### The Problem
If a regulator’s wallet is strictly locked on-chain to a single domain (e.g., `Healthcare`), a tester with only one Petra wallet cannot test or verify Infrastructure, Education, or Technology workflows without switching private keys or setting up multiple testnet accounts.

#### Recommended Workaround: "Active Domain Portfolio" (Capability Pattern)
Instead of hardcoding `1 Wallet = 1 Domain`, we implement an **Active Domain Context & Multi-Domain Capability** pattern:

1. **Move Contract Design**:
   - The user/regulator profile stores `authorized_domains: vector<String>` instead of a single string.
   - For demo/development mode, a wallet can be granted `["*"]` (Universal Authority) or multiple domains (e.g., `["Healthcare", "Infrastructure"]`).
2. **Frontend UI Switcher ("Acting As Domain")**:
   - In the Regulator and Government dashboards, a header selector lets the regulator choose their **Active Operating Domain**:
     ```
     [ Active Domain: Healthcare ▾ ] (Options: Healthcare, Infrastructure, Education, All Domains)
     ```
   - **Task Filter Enforcement**: When `Healthcare` is active, the regulator *only* sees Healthcare tasks, Healthcare budget pools, and Healthcare fund requests.
   - If they switch to `Infrastructure`, the interface instantly re-scopes to Infrastructure tasks and budgets.
3. **Petra Wallet Native Sub-Accounts (Optional Alternative)**:
   - Petra allows creating multiple sub-accounts under the same seed phrase in seconds (`Account 1`, `Account 2`, `Account 3`).
   - However, the **Active Domain Context** in the UI allows smooth testing without needing to disconnect and reconnect Petra wallets every time.

---

### 3. Main Page Transformation: Dropdown Role Selection

#### Current State
- `IntroPg.tsx` has two static cards (`Field Taskholder` vs `Department Regulator`) with an "OR" divider.

#### Proposed Redesign
1. **Unified Role Selector Dropdown**:
   - Replace the static binary cards with a dropdown selector:
     ```
     ┌──────────────────────────────────────────────────────────┐
     │  Select Your Governance Tier:                           │
     │  ┌────────────────────────────────────────────────────┐  │
     │  │ 🏛️ State Government (Treasury & Allocation)       ▼│  │
     │  │   🧑‍🔧 Field Taskholder (Execution & Proof)          │  │
     │  │   🛡️ Department Regulator (Audit & Sector Budget)   │  │
     │  │   🏛️ State Government (Treasury & Allocation)       │  │
     │  └────────────────────────────────────────────────────┘  │
     │                                                          │
     │  [ Enter TrueLedger Portal → ]                           │
     └──────────────────────────────────────────────────────────┘
     ```
   - Dynamic role card preview underneath the dropdown highlighting the selected role’s description, authority level, and active wallet status.
2. **Global Header Role Switcher**:
   - In all interior pages (`/clientpg`, `/serverpg`, `/govtpg`), add a discreet badge/dropdown in the top navigation:
     ```
     [ 🏛️ Govt Mode ▾ ]  -->  Easily switch between Taskholder / Regulator / Govt
     ```
3. **Blockchain Identity Pattern for Government**:
   - Government profile is registered on Aptos using the exact same pattern:
     - Cryptographic signature via `signMessage` or `user::create_user_with_info(account, "State Treasury Ministry", "Government")`.
     - Stored under `trueledger_user_<addr>` with `role: 'government'`.

---

### 4. Government Core Responsibilities & Closing the Operational Gaps

#### Gap A: Master Macro Treasury Allocation
- **State Treasury Pool**: The Government initializes or controls the master sovereign treasury (e.g., ₹5,000,000 total reserve).
- **Department Allocation Slider / Form**: Govt can allocate or top up individual department pools (`Healthcare`, `Infrastructure`, `Education`, `Agriculture`, `Technology`, `Contingency`).
- **Solvency Guard**: The contract and service strictly prevent overallocating:
  $$\text{Treasury Reserve} = \text{Total Sovereign Budget} - \sum \text{Allocated Department Budgets} \ge 0$$
  If Government attempts to allocate more than the available reserve, the transaction aborts with `E_INSUFFICIENT_TREASURY_RESERVE`.

#### Gap B: Regulator Budget Request & Re-allocation Protocol
1. **Regulator Side**:
   - In `ServerIntroPg.tsx` (Regulator Portal), add a **"Request Additional Budget"** button in `DepartmentBudgetOverview`.
   - Opens a modal where the regulator specifies:
     - Sector (e.g., `Healthcare`)
     - Requested Amount (e.g., ₹50,000)
     - Justification / Purpose (e.g., *"Emergency rural medical supply replenishment for District 4"*)
   - Submits request on-chain/in-ledger as `Pending_Govt_Review`.
2. **Government Side (`GovtIntroPg.tsx`)**:
   - **"Budget Requests Inbox"**:
     - Lists all incoming requests from regulators with current department burn rate and justification.
     - **Approve**: Automatically debits State Treasury Reserves, credits the department's `totalBudget`, emits `BudgetRequestApproved` event, and signs via Petra.
     - **Reject**: Rejects with an audit remark (e.g., *"Current quarter quota exceeded. Please return surplus first."*).

#### Gap C: Solvency & Deficit Prevention Monitor
- Real-time macro dashboard:
  - **Sovereign Reserves**: Unallocated liquid funds in government treasury.
  - **Department Commitments**: Funds locked in ongoing tasks.
  - **Disbursed Capital**: Funds paid out upon verified proof.
  - **Reclaimed Surplus**: Funds returned by honest taskholders.
- **Negative Balance Prevention**: Tasks cannot be created if `Department Available Balance < Task Money Allocated`. Regulators are forced to request more funds from Government first.

#### Gap D: Leftover Governance Features
- **Department Efficiency Leaderboard**: Ranks departments by surplus returned vs. funds disbursed.
- **Emergency Department Freeze / Pause**: Allows Government to freeze task creations in a department if fraud is flagged.

---

### 5. Move Smart Contract Updates (`task_manager.move`)

We will introduce a `GovernmentTreasury` resource and budget request flow:

```move
/// State Treasury Resource held by the Admin / Government
struct GovernmentTreasury has key {
    total_treasury: u64,
    allocated_treasury: u64,
    unallocated_reserves: u64,
    budget_requests: Table<u64, BudgetRequest>,
    request_counter: u64,
}

struct BudgetRequest has store, drop, copy {
    id: u64,
    regulator_address: address,
    sector: String,
    requested_amount: u64,
    reason: String,
    status: String, // "Pending", "Approved", "Rejected"
    created_at: u64,
    reviewed_at: u64,
}

// Key Entry Functions:
// 1. initialize_government_treasury(admin: &signer, total_budget: u64)
// 2. allocate_funds_to_department(govt: &signer, sector: String, amount: u64)
// 3. submit_budget_request(regulator: &signer, sector: String, amount: u64, reason: String)
// 4. review_budget_request(govt: &signer, request_id: u64, approve: bool, remarks: String)
```

---

### 6. Frontend Architectural Blueprint

```
client/src/
├── pages/
│   ├── IntroPg.tsx              <- Updated: Role dropdown selector (Taskholder / Regulator / Govt)
│   ├── ClientIntroPg.tsx         <- Taskholder Portal
│   ├── ServerIntroPg.tsx         <- Regulator Portal (Added: "Request Budget from Govt" modal)
│   └── GovtIntroPg.tsx           <- [NEW] Government Portal (Treasury allocation, request reviews)
├── components/
│   ├── RoleSelectorDropdown.tsx <- [NEW] Custom dropdown for IntroPg and portal headers
│   ├── BudgetRequestModal.tsx   <- [NEW] For Regulators to request additional funds
│   ├── GovtTreasuryOverview.tsx <- [NEW] Master solvency pie chart, reserves, and allocation controls
│   └── GovtRequestReviewModal.tsx <- [NEW] Review, approve, or reject regulator requests
└── services/
    └── taskLedgerService.ts     <- Updated: Treasury state, BudgetRequest models, solvency invariants
```

---

### 7. Phased Implementation Roadmap

When you are ready to proceed with the implementation, we can execute in 4 structured steps:

1. **Step 1: Move Contract & Ledger Service Expansion**:
   - Add `BudgetRequest` and `GovernmentTreasury` data structures and methods to `task_manager.move` and `taskLedgerService.ts`.
2. **Step 2: Main Page Role Dropdown & Identity**:
   - Update `IntroPg.tsx` and `RegisterModal.tsx` to support the Government role with the dropdown switcher.
3. **Step 3: Government Portal (`GovtIntroPg.tsx`)**:
   - Build the Master Treasury Dashboard, Solvency Monitor, and Budget Request Review Inbox.
4. **Step 4: Regulator Fund Request Flow & Domain Context**:
   - Add the "Request Funds" button to the Regulator dashboard and implement the "Active Domain Portfolio" dropdown workaround.


# Revised Architectural Plan: Automatic Domain Binding & Elimination of Redundant Sector Dropdowns

> **Key Update Added:** Because Domain-Specific Task Enforcement is strictly locked at the identity/session level for **both Taskholders and Regulators**, the manual **Domain/Sector `<select>` dropdown is completely eliminated** from the new task creation and proposal forms (`RequestInput.tsx`). The task domain is automatically and immutably bound to the user's active accredited domain.

---

## 1. Domain Enforcement Matrix (Symmetric Rules)

| Operational Step | Taskholder Rule (Ground Tier) | Regulator Rule (Department Tier) | Government Rule (Apex Tier) |
|---|---|---|---|
| **Identity & Scope** | Accredited specialist in active domain (e.g., `Healthcare`) | Appointed Class-1 authority over active department (e.g., `Healthcare`) | Sovereign authority over master state treasury (`Finance / Apex`) |
| **New Task Creation / Proposal** | **No Dropdown:** Sector is automatically locked to taskholder's domain. Proposes bottom-up task for department approval | **No Dropdown:** Sector is automatically locked to regulator's department. Broadcasts official task with funds from department pool | Allocates sovereign capital across department pools; sets macro fiscal ceilings |
| **Task Discovery & Bell Feed** | **Strict Filter:** Bell icon only displays broadcasts where `task.sector == taskholder.activeDomain` | Views and manages tasks strictly within appointed department | Full macro ledger transparency across all 3 tiers |
| **Task Acceptance & Execution** | **Hard Contract Guard:** Can only claim/accept tasks matching active domain. Cross-domain claims abort with `E_UNAUTHORIZED_DOMAIN` | N/A (Regulators disburse and audit, they do not execute) | N/A |
| **Audit & Fund Release** | Submits proof of work directly to appointed department regulator | Can **only** audit and release funds for tasks belonging to their appointed department | Monitors macro solvency; freezes departments flagged with audit anomalies |
| **Budget Requests** | N/A | **No Dropdown:** Requests budget increases strictly for their appointed department from Government | Reviews, approves, or rejects regulator requests based on state solvency |

---

## 2. Elimination of the Domain Dropdown in Task Creation (`RequestInput.tsx`)

### The Previous Flow (Prone to Human Error)
Previously in `RequestInput.tsx`:
- Both Taskholder and Regulator had an editable `<select>` dropdown with 5 options (`Healthcare`, `Infrastructure`, `Education`, `Agriculture`, `Technology`).
- A Healthcare regulator could accidentally pick `Education`, resulting in budget pool mismatch or contract errors.
- A Healthcare taskholder could attempt to propose an `Infrastructure` project outside their competence.

### The New Automated Flow (Zero Redundancy, Zero-Error)
With strict domain enforcement:
1. **Dropdown Removed from UI**:
   - The `<select>` dropdown in `RequestInput.tsx` is completely replaced by an **immutable, verified domain badge**:
     ```
     ┌────────────────────────────────────────────────────────┐
     │ Task Description:                                      │
     │ [ e.g. Deliver emergency pediatric vaccines to PHC... ]│
     │                                                        │
     │ Estimated Budget (₹):      Sector (Auto-Locked):       │
     │ [ 45,000                ]  [ 🩺 Healthcare 🔒       ] │
     │                            Verified Accredited Domain  │
     └────────────────────────────────────────────────────────┘
     ```
2. **Deterministic Payload Construction**:
   - `sector` is automatically derived from the active session context (`user.activeDomain`).
   - Neither the taskholder nor the regulator ever has to manually select or re-type the sector.
   - The on-chain transaction payload is bound to this immutable sector, ensuring 100% cryptographic and state integrity.

---

## 3. The Single-Wallet Workaround: "Accredited Domain Context"

### The Challenge
If a developer/tester has only 1 Petra wallet, how do they test Healthcare, Infrastructure, and Education without being permanently locked out of the other domains?

### The Solution: Multi-Domain Accreditation & Active Domain Context
1. **Decoupled Identity vs. Active Credential**:
   - The wallet address (`0x123...`) is the cryptographic signing key.
   - The user profile holds an accreditation array (`authorized_domains: vector<String>`). In demo mode, a wallet is granted universal accreditation across sectors.
2. **Header Active Domain Selector**:
   - In both `ClientIntroPg` and `ServerIntroPg`, the top bar features an **Active Domain Switcher**:
     ```
     Active Domain: [ 🩺 Healthcare ▾ ]  (Options: Healthcare, Infrastructure, Education, Agriculture, Tech)
     ```
   - When set to `Healthcare`:
     - Taskholder bell only rings for Healthcare tasks.
     - New task creation in `RequestInput.tsx` automatically displays and locks to `🩺 Healthcare 🔒`.
     - Regulator audits only Healthcare work.
   - When switched to `Infrastructure`:
     - Entire portal instantly re-scopes to Infrastructure.
     - New task creation in `RequestInput.tsx` automatically displays and locks to `🏗️ Infrastructure 🔒`.
     - All single-wallet testing works seamlessly while maintaining 100% strict domain isolation at every layer.

---

## 4. Main Page Transformation: Dropdown Role & Domain Selection

### New Entry Flow on `IntroPg.tsx`
Replace the two static cards with a centralized **Governance Onboarding Card**:

```
┌─────────────────────────────────────────────────────────────┐
│                       TRUELEDGER                             │
│       Decentralized Fund Allocation & Zero-Corruption Audit │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Select Governance Tier:                                 │
│     ┌─────────────────────────────────────────────────────┐ │
│     │ 🏛️ State Government (Treasury & Macro Solvency)   ▼ │ │
│     │   🧑‍🔧 Field Taskholder (Accredited Task Execution)   │ │
│     │   🛡️ Department Regulator (Audit & Department Pool) │ │
│     │   🏛️ State Government (Treasury & Macro Solvency)   │ │
│     └─────────────────────────────────────────────────────┘ │
│                                                             │
│  2. Select Operating Domain (for Taskholder & Regulator):   │
│     ┌─────────────────────────────────────────────────────┐ │
│     │ 🩺 Healthcare & Medical Relief                     ▼ │ │
│     │   🏗️ Infrastructure & Public Works                   │ │
│     │   📚 Education & Skill Development                  │ │
│     │   🌾 Agriculture & Rural Welfare                    │ │
│     │   💻 Technology & Digital Public Infrastructure     │ │
│     └─────────────────────────────────────────────────────┘ │
│                                                             │
│  [ Connect Wallet & Enter Portal → ]                        │
└─────────────────────────────────────────────────────────────┘
```

- **Routing**:
  - `Taskholder` + `Healthcare` $\rightarrow$ `/clientpg` (locked to Healthcare).
  - `Regulator` + `Healthcare` $\rightarrow$ `/serverpg` (locked to Healthcare).
  - `Government` $\rightarrow$ `/govtpg` (macro sovereign treasury).

---

## 5. Government Core System & Closing Operational Gaps

### Gap 1: Master Macro Treasury Allocation
- **State Treasury Pool**: Sovereign reserve (e.g., ₹5,000,000 total).
- **Hard Solvency Guard (No Negative Balance)**:
  $$\text{Unallocated Reserves} = \text{Total Sovereign Treasury} - \sum_{i} \text{DepartmentBudget}_i \ge 0$$
  $$\text{Department Free Balance} = \text{TotalBudget}_i - \text{CommittedFunds}_i - \text{DisbursedFunds}_i \ge 0$$
  - Tasks cannot be created if `Department Free Balance < Task Cost`.
  - Treasury cannot allocate to a department if `Unallocated Reserves < Allocation Amount`.

### Gap 2: Regulator Budget Increase Request Protocol
1. **Regulator Submits Request**:
   - In `ServerIntroPg.tsx`, clicking **"Request Additional Budget"** opens a modal.
   - **No Sector Dropdown:** Sector is automatically locked to the regulator's active department.
   - Regulator specifies: `Requested Amount` and `Justification`.
   - Records an on-chain `BudgetRequest` with status `Pending_Govt_Review`.
2. **Government Adjudication Dashboard (`GovtIntroPg`)**:
   - **Incoming Requests Inbox**: Reviews request, justification, and department burn rate.
   - **Approve**: Decrements `Unallocated Reserves`, increments the department's `totalBudget`, emits `BudgetRequestApproved`, and signs via Petra.
   - **Reject**: Rejects with official audit feedback.

### Gap 3: Macro Audit & Circuit Breakers
- **Live Solvency Monitor**: Real-time gauge of State Reserves vs. Locked Commitments vs. Verified Disbursements vs. Reclaimed Surplus.
- **Emergency Department Freeze**: Government can temporarily freeze task disbursements in a department if irregularities or audit failures occur.

---

## 6. Move Smart Contract Updates (`task_manager.move` & `user.move`)

### Added to `user.move`:
```move
const E_UNAUTHORIZED_DOMAIN: u64 = 11;

/// Query whether an account is authorized for a specific sector
#[view]
public fun is_authorized_for_domain(account: address, sector: String): bool acquires User {
    if (!exists<User>(account)) { return false };
    let user = borrow_global<User>(account);
    user.field == sector || user.field == string::utf8(b"Universal") || user.field == string::utf8(b"Government")
}
```

### Added to `task_manager.move`:
```move
/// Government Sovereign Treasury
struct GovernmentTreasury has key {
    total_treasury: u64,
    unallocated_reserves: u64,
    budget_requests: Table<u64, BudgetRequest>,
    request_counter: u64,
}

struct BudgetRequest has store, drop, copy {
    id: u64,
    regulator_address: address,
    sector: String,
    requested_amount: u64,
    reason: String,
    status: String, // "Pending", "Approved", "Rejected"
    created_at: u64,
    reviewed_at: u64,
}

/// Taskholder accepts notification - ENFORCING DOMAIN INTEGRITY
public entry fun accept_notification_enforced(
    account: &signer,
    notification_id: u64,
    taskholder_domain: String
) acquires NotificationManager, TaskManager {
    // Assert taskholder_domain == notification.sector
    // Prevents cross-domain task claiming
}

/// Regulator budget request entrypoints
public entry fun submit_budget_request(
    regulator: &signer,
    sector: String,
    amount: u64,
    reason: String
) acquires GovernmentTreasury;

public entry fun review_budget_request(
    govt: &signer,
    request_id: u64,
    approve: bool,
    rejection_reason: String
) acquires GovernmentTreasury, DepartmentLedger;
```

---

## 7. Frontend Architectural File Map

```
client/src/
├── pages/
│   ├── IntroPg.tsx                   <- Updated: Dropdown role & domain selector
│   ├── ClientIntroPg.tsx              <- Taskholder Portal (Domain-scoped tasks, proposals & bell)
│   ├── ServerIntroPg.tsx              <- Regulator Portal (Domain-scoped audits, tasks & budget request modal)
│   └── GovtIntroPg.tsx                <- [NEW] Government Portal (Treasury allocation & request review inbox)
├── components/
│   ├── RequestInput.tsx              <- Updated: DROPDOWN REMOVED. Sector auto-locked to active domain badge
│   ├── ActiveDomainContextBar.tsx     <- [NEW] Header selector for active accredited domain
│   ├── BudgetRequestModal.tsx        <- [NEW] Regulator form to request additional funds (Sector auto-locked)
│   ├── GovtTreasuryOverview.tsx      <- [NEW] Solvency pie chart, reserve status & emergency freeze
│   ├── GovtRequestReviewModal.tsx     <- [NEW] Govt modal to approve / reject regulator requests
│   ├── NotificationsList.tsx         <- Updated: Strictly filters by active domain
│   └── TodoList.tsx                  <- Updated: Strictly filters by active domain
└── services/
    └── taskLedgerService.ts          <- Updated: Treasury models, BudgetRequest state, domain validation guards
```

---

## 8. Verification Matrix

| Test Scenario | Action | Expected Result |
|---|---|---|
| **Domain Dropdown in Task Creation** | Open `RequestInput.tsx` as Taskholder or Regulator | ✅ **Verified**: No manual `<select>` dropdown exists; sector is displayed as an immutable badge matching the active domain. |
| **Cross-Domain Task Claim** | Taskholder in `Healthcare` attempts to claim an `Infrastructure` task | ❌ **Blocked**: Notification is hidden from bell; direct claim call rejected with `E_UNAUTHORIZED_DOMAIN`. |
| **Cross-Domain Audit** | Regulator in `Healthcare` attempts to approve an `Education` task | ❌ **Blocked**: Task does not appear in audit queue; audit button disabled. |
| **Active Domain Switching** | Single wallet switches active domain from `Healthcare` to `Infrastructure` | ✅ **Scoped**: Task list, budget, and task creation badge immediately re-scope to Infrastructure with no wallet reconnection. |
| **Treasury Solvency Check** | Govt attempts to allocate ₹600,000 when unallocated reserves are ₹400,000 | ❌ **Blocked**: Solvency guard prevents negative reserve balance. |
| **Budget Request Flow** | Regulator requests ₹50,000 for `Healthcare` $\rightarrow$ Govt reviews & approves | ✅ **Transferred**: Government unallocated reserve drops by ₹50,000; Healthcare department total budget increases by ₹50,000. |

---

Please let me know if this updated plan aligns with your vision or if you would like any additional refinements before we begin!