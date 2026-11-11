# TrueLedger — Decentralized Fund & Task Allocation System

[![Aptos Devnet](https://img.shields.io/badge/Aptos-Devnet-blue?logo=aptos)](https://explorer.aptoslabs.com/account/0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b?network=devnet)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

**TrueLedger** is a corruption-resistant, transparent fund allocation and task auditing platform built on the **Aptos Blockchain**. It implements a complete **Three-Tier Governance Model** connecting the **Government (Sovereign Treasury)**, department authorities (**Regulators**), and field executors (**Taskholders**), ensuring that every rupee of public budget requested, allocated, spent, and refunded is immutably recorded on-chain.

[![TrueLedger Demo](https://img.youtube.com/vi/FcboaKjr3cs/maxresdefault.jpg)](https://youtu.be/FcboaKjr3cs)
[Watch the full demo on YouTube](https://youtu.be/FcboaKjr3cs)


---

## 🌟 Key Highlights

- **Three-Tier Sovereign Governance Architecture**:
  - **Level 0 (The Government)**: Oversees the sovereign master treasury, enforces macro solvency guards ($\text{Unallocated Reserves} \ge 0$), adjudicates regulator budget requisitions, and executes direct capital injections.
  - **Level 1 (Regulators)**: Manages department-specific pools, issues formal budget requisitions to Government, broadcasts top-down tasks, approves bottom-up proposals, and conducts transparent compliance audits.
  - **Level 2 (Taskholders)**: Accepts initiatives aligned with their domain, submits completion proofs & expenditures, returns unspent surplus to the department pool, and proposes urgent field initiatives.
- **Symmetric Domain-Specific Enforcement**:
  - Both Taskholders and Regulators operate strictly within their active sector (*Healthcare*, *Infrastructure*, *Education*, *Agriculture*, *Technology*).
  - Single-wallet developer testing supported via non-destructive active domain switching without redundant UI clutter.
- **Dynamic Regulator Budget Requisitions**:
  - When department reserves run low, Regulators submit on-chain requisitions with justification.
  - The State Comptroller reviews and adjudicates requisitions with live on-chain capital allocation.
- **100% Pure On-Chain Aptos Devnet Execution**:
  - All operations invoke live Move entry functions on Aptos Devnet signed through Petra wallet with real gas deduction.
  - Optimized pure event-emitting architecture eliminating table handle timeout bottlenecks (sub-second simulation times).
- **Full Verification & Audit Loop**:
  - Taskholders submit completion proofs (PDFs, images, or IPFS hashes) and actual expenditures.
  - Safe public document viewer with cryptographic TrueLedger Certificate inspection.
  - Regulators can **Verify & Authorize Release** or **Deny & Request Revision** with structured feedback.
- **Surplus Treasury Return**: Taskholders return unspent allocated budget back to the public pool via live `return_surplus` smart contract calls.
- **Micro-Gas Optimization**: All transactions configured with minimum gas unit price (`100 Octas`), costing `< 0.005 APT` per transaction.
- **SOLID Architecture & Design Patterns**: Built with Repository, Observer, State Machine, and Facade design patterns ensuring strict CRUD integrity and real-time UI synchronization.

---

## 🏛️ System Architecture

```
                                      +------------------------------+
                                      |         Landing Page         |
                                      |          (IntroPg.tsx)       |
                                      +---------------+--------------+
                                                      |
                      +-------------------------------+-------------------------------+
                      |                               |                               |
                      v                               v                               v
        +---------------------------+   +---------------------------+   +---------------------------+
        |     Government Portal     |   |     Regulator Portal      |   |    Taskholder Portal      |
        |      (GovtIntroPg)        |   |      (ServerIntroPg)      |   |      (ClientIntroPg)      |
        +-------------+-------------+   +-------------+-------------+   +-------------+-------------+
                      |                               |                               |
                      | Treasury Injections &         | Requisitions, Broadcasts &    | Proofs & Surplus
                      | Budget Adjudications          | Audit Authorizations          | Returns
                      v                               v                               v
       +-----------------------------------------------------------------------------------------------+
       |                                     Aptos Devnet                                              |
       |                           Contract: 0x3c6d4...ce6b                                            |
       |                                                                                               |
       |   +---------------------------------------+   +-------------------------------------------+   |
       |   |             user Module               |   |            task_manager Module            |   |
       |   | - Profile registration (Name, Sector) |   | - Sovereign Government Treasury & Events  |   |
       |   | - Domain authorization checks         |   | - Budget Requisitions & Adjudication      |   |
       |   | - create_user_with_info               |   | - add_notification, approve_task         |   |
       |   | - is_authorized_for_domain            |   | - submit_task_proof, return_surplus       |   |
       |   +---------------------------------------+   +-------------------------------------------+   |
       +-----------------------------------------------------------------------------------------------+
```

---

## ⚡ Quick Start Guide

Follow these steps to get TrueLedger running locally in less than 3 minutes.

### 1. Prerequisites

- **[Node.js](https://nodejs.org/)** (v18.0 or higher) and `npm`
- **[Petra Aptos Wallet Extension](https://petra.app/)** installed in Chrome / Brave / Edge

### 2. Configure Your Petra Wallet

1. Open your Petra Wallet extension.
2. Go to **Settings** (`⚙️`) ➔ **Network** ➔ Select **Devnet**.
3. In Petra's home screen, click the **"Faucet"** button (or use the in-app faucet link in TrueLedger's navbar) to receive free Devnet `APT` tokens.

### 3. Install & Run the Frontend

```bash
# Clone the repository
git clone https://github.com/SiddharthPalod/Decentralized-Voting.git
cd DecentralizedVote

# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the local development server
npm run dev
```

The application will start at: **`http://localhost:5173`**

---

## 📖 Walkthrough: Roles & Workflows

### 🏛️ As the Government (`/govtpg`)
1. **Connect Comptroller Wallet**: Connect Petra wallet with the Government role selected.
2. **Sovereign Treasury Overview**: Monitor Total Sovereign Treasury, Unallocated Reserves, and Total Disbursed Capital.
3. **Macro Solvency Guard**: Live checks guarantee unallocated reserves remain non-negative ($\ge 0$) at all times.
4. **Adjudicate Budget Requisitions**:
   - Review pending fund requisitions submitted by department Regulators in the **Requisition Inbox**.
   - Click **"Review & Adjudicate"**:
     - **Approve Requisition**: Submits `task_manager::review_budget_request` on Aptos Devnet, transferring funds from sovereign reserves directly into the department pool.
     - **Deny Requisition**: Rejects the request with official audit remarks.
5. **Direct Department Allocation**: Directly inject reserves into any sector pool (*Healthcare*, *Education*, etc.) via `allocate_department_budget`.

---

### 🛡️ As a Regulator (`/regulator`)
1. **Connect Wallet & Set Sector**: Connect Petra wallet; active domain context automatically scopes all views.
2. **Review Department Pools & Request Budget**:
   - Monitor the active department's budget allocation, committed funds, and disbursed totals.
   - If funds are depleted, click **"+ Request Additional Budget"** to open the **Budget Requisition Modal**, specify requested capital and justification, and submit to the Government on-chain.
3. **Review Bottom-Up Proposals**: Review incoming field proposals submitted by taskholders:
   - Click **"Approve & Broadcast"** ➔ Confirms in Petra wallet ➔ Commits department funds and notifies taskholders.
   - Click **"Reject"** ➔ Marks the proposal rejected with zero financial commitment.
4. **Broadcast New Task (Top-Down)**: Assign tasks with dedicated budget auto-bound to your active sector.
5. **Transparent Task & Fund Audit**:
   - Audits are strictly filtered to the regulator's active domain.
   - Click **Proof Doc** to inspect submitted receipts or deliverables.
   - Click **"Audit & Release"**:
     - **Verify & Authorize Release**: Approves on-chain and disburses funds to the taskholder.
     - **Deny & Request Revision**: Rejects with audit remarks, returning task to **Ongoing** for resubmission.

---

### 👷 As a Taskholder (`/taskholder`)
1. **Connect Wallet & Domain Context**:
   - Connect Petra wallet and register your profile (Name & Sector, e.g. *Healthcare*).
2. **Review & Accept Broadcast Tasks**:
   - Tasks from your active sector appear in the notification drawer.
   - Broadcast task cancellation protection: declining a broadcast task hides it from your view without deleting it for other domain taskholders (task is only removed if all domain taskholders decline).
3. **Execute Work & Submit Completion Proof**:
   - Click **"Complete"** on an ongoing task.
   - Enter actual expenditure and upload proof (receipts, photos, or IPFS CID) in the **Task Proof Submission Modal**.
   - Submits `task_manager::submit_task_proof` to Aptos Devnet.
4. **Return Surplus Funds**:
   - If actual spending was below allocation, click **"Return Surplus Balance to Treasury"** to trigger `task_manager::return_surplus` on Devnet, crediting unspent funds back to the department pool.
5. **Submit Bottom-Up Proposal**:
   - Use the proposal form (auto-bound to your active domain) to request funding for local urgent initiatives.

---

## ⛓️ Smart Contract Details

- **Blockchain**: Aptos Devnet
- **Contract Account Address**:
  ```
  0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b
  ```
- **Live Devnet Explorer**:
  [View Account on Aptos Explorer](https://explorer.aptoslabs.com/account/0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b?network=devnet)

### Modules & Entry Functions

| Module | Function | Description |
|---|---|---|
| `task_manager` | `initialize_government_treasury(initial_treasury)` | Initializes master sovereign treasury and emits `TreasuryInitialized`. |
| `task_manager` | `submit_budget_request(sector, amount, reason)` | Regulator submits budget requisition to Government; emits `BudgetRequested`. |
| `task_manager` | `review_budget_request(request_id, approve, remarks)` | Government adjudicates budget request and allocates funds; emits `BudgetRequestReviewed`. |
| `task_manager` | `allocate_department_budget(sector, budget_amount)` | Government directly funds department budget pool; emits `DepartmentBudgetUpdated`. |
| `task_manager` | `add_notification(content, money_allocated)` | Broadcasts a new task notification; emits `NotificationAdded`. |
| `task_manager` | `approve_task(task_id)` | Regulator signs off task completion, disburses funds, and emits `TaskApproved`. |
| `task_manager` | `create_task(content, money_allocated)` | Creates a new task directly; emits `TaskCreated`. |
| `task_manager` | `accept_notification(notification_id)` | Moves a notification into active task list; emits `TaskCreated`. |
| `task_manager` | `accept_notification_enforced(notification_id, domain)` | Enforces domain match before accepting task. |
| `task_manager` | `update_task_status(task_id, new_status)` | Validates and updates task lifecycle state; emits `TaskStatusUpdated`. |
| `task_manager` | `submit_task_proof(task_id, actual_spent, cid)` | Submits proof CID and expenditure; emits `TaskSubmittedForAudit`. |
| `task_manager` | `return_surplus(sector, amount)` | Returns unused taskholder funds back to the department pool; emits `SurplusReturned`. |
| `user` | `create_user_with_info(name, field)` | Registers an on-chain profile and assigned sector; emits `UserCreated`. |
| `user` | `is_authorized_for_domain(account, sector)` | View function verifying caller authorization for a sector. |

---

## 🛠️ Compiling & Deploying Contracts (Developers)

The Move contracts are already compiled and published to Devnet. If deploying your own instance:

```bash
# Ensure Aptos CLI is installed
contracts/bin/aptos.exe --version

# Compile Move package
contracts/bin/aptos.exe move compile --package-dir contracts

# Publish to Aptos Devnet (using configured .aptos/config.yaml)
contracts/bin/aptos.exe move publish --package-dir contracts --assume-yes
```

---

## 🧱 Design Patterns & Clean Code (SOLID)

The frontend service layer follows strict object-oriented and functional clean architecture:

- **Single Responsibility Principle (SRP)**: Dedicated classes for data persistence (`LocalStorageProvider`), unique pseudonym generation (`PseudonymGenerator`), domain access validation (`DomainValidator`), and state validation (`TaskLifecycleGuard`).
- **Open/Closed Principle (OCP)**: Pluggable `StorageProvider` and repository interfaces (`ITaskRepository`, `IBudgetRepository`, `ITreasuryRepository`) allow switching from LocalStorage to IndexedDB or remote databases without altering business logic.
- **Repository Pattern**: `TaskRepository`, `BudgetRepository`, and `TreasuryRepository` isolate storage queries and state updates.
- **Observer Pattern**: `LedgerEventBus` publishes and subscribes to ledger state changes, keeping Government, Regulator, and Taskholder dashboards synchronized in real time.
- **Facade Pattern**: `TaskLedgerService` provides a unified, high-level API consumed by React components.

---

## 📁 Repository Structure

```
DecentralizedVote/
├── client/
│   ├── src/
│   │   ├── assets/               # Logos and background textures
│   │   ├── components/
│   │   │   ├── ActiveDomainContextBar.tsx     # Domain context switcher with single-wallet testing support
│   │   │   ├── BudgetRequestModal.tsx         # Regulator fund requisition modal to Government
│   │   │   ├── DepartmentBudgetOverview.tsx   # Department pool summary & requisition launcher
│   │   │   ├── GovtRequestReviewModal.tsx     # Government budget adjudication & review modal
│   │   │   ├── GovtTreasuryOverview.tsx       # Sovereign Treasury dashboard & reserve allocation
│   │   │   ├── MoneyCard.tsx                  # Metric indicator cards
│   │   │   ├── NotificationsList.tsx          # Notification bell & domain-bound task claim
│   │   │   ├── ProofDocViewerModal.tsx        # Proof document & cryptographic certificate viewer
│   │   │   ├── ProtectedRoute.tsx             # Wallet auth route guard
│   │   │   ├── RegisterModal.tsx              # Three-role profile onboarding
│   │   │   ├── RequestInput.tsx               # Task broadcast & proposal creation (auto-bound domain)
│   │   │   ├── TaskAuditModal.tsx             # Regulator compliance verification modal
│   │   │   ├── TaskProofSubmissionModal.tsx   # Proof submission with expense tracking
│   │   │   ├── TodoItem.tsx                   # Task row with status actions
│   │   │   ├── TodoList.tsx                   # Domain-scoped task list
│   │   │   └── WalletSelector.tsx             # Petra wallet selector with Devnet faucet link
│   │   ├── lib/
│   │   │   └── aptosClient.ts                 # Aptos TS SDK singleton & low-gas options
│   │   ├── pages/
│   │   │   ├── IntroPg.tsx                    # Landing portal with 3 role cards (Taskholder, Regulator, Govt)
│   │   │   ├── GovtIntroPg.tsx                # Government sovereign treasury & requisition command center
│   │   │   ├── ServerIntroPg.tsx              # Regulator command center, budget requisitions & audit
│   │   │   └── ClientIntroPg.tsx              # Taskholder dashboard & surplus return
│   │   ├── services/
│   │   │   └── taskLedgerService.ts           # SOLID ledger service (Treasury + Task + Budget repositories)
│   │   ├── App.tsx                            # Application routes (includes /govtpg)
│   │   └── main.tsx                           # Wallet adapter provider mount
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── contracts/
│   ├── .aptos/config.yaml        # Aptos CLI network configuration
│   ├── Move.toml                 # Package manifest
│   └── sources/
│       ├── task_manager.move     # Sovereign treasury, budget requisitions, task audit, & budget manager
│       └── user.move             # On-chain profile registry & domain authorization
└── README.md
```

---

## 💡 Troubleshooting

<details>
<summary><strong>Simulation error / Module not found in Petra</strong></summary>

Ensure your Petra wallet is switched to **Devnet** (`Settings ➔ Network ➔ Devnet`). If Aptos Devnet underwent an epoch wipe, TrueLedger automatically falls back to cryptographic message authentication via `signMessage`.
</details>

<details>
<summary><strong>Transaction rejected / Cancelled</strong></summary>

If you decline or close the Petra prompt, TrueLedger safely halts the operation without modifying budgets or publishing incomplete tasks.
</details>

<details>
<summary><strong>Need more testnet APT</strong></summary>

Click the **"🚰 Request 1 APT (Devnet Faucet)"** button directly inside TrueLedger's wallet dropdown in the navbar, or use the official [Aptos Faucet](https://aptos.dev/network/faucet).
</details>

---

## 📄 License

This project is licensed under the MIT License.
