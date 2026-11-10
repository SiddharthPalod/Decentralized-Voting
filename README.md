# TrueLedger — Decentralized Fund & Task Allocation System

[![Aptos Devnet](https://img.shields.io/badge/Aptos-Devnet-blue?logo=aptos)](https://explorer.aptoslabs.com/account/0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b?network=devnet)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

**TrueLedger** is a corruption-resistant, transparent fund allocation and task auditing platform built on the **Aptos Blockchain**. It bridges government authorities (**Regulators**) and field executors (**Taskholders**), ensuring that every rupee of public budget allocated, spent, and refunded is immutably recorded on-chain.

---

## 🌟 Key Highlights

- **Dual Governance Lifecycles**:
  - **Top-Down Tasks**: Regulators allocate department budgets and broadcast new initiatives with cryptographic on-chain verification.
  - **Bottom-Up Field Proposals**: Field taskholders submit proposals for urgent local needs; Regulators inspect, approve, and broadcast on-chain with automatic budget reservation.
- **Full Verification & Audit Loop**:
  - Taskholders submit completion proofs (PDFs, images, or IPFS hashes) and actual expenditures.
  - **Independent Proof Viewer**: Safe public document viewer with cryptographic TrueLedger Certificate inspection.
  - **Audit Compliance Modal**: Regulators can **Verify & Authorize Release** or **Deny & Request Revision** with structured feedback.
- **Surplus Treasury Return**: Taskholders return unspent allocated budget back to the public pool via live `return_surplus` smart contract calls.
- **Micro-Gas Optimization**: All transactions configured with minimum gas unit price (`100 Octas`), costing `< 0.005 APT` (~$0.04 USD / < ₹3 INR) per transaction.
- **SOLID Architecture & Design Patterns**: Built with Repository, Observer, State Machine, and Facade design patterns ensuring strict CRUD integrity and real-time UI synchronization.

---

## 🏛️ System Architecture

```
                                      +------------------------------+
                                      |         Landing Page         |
                                      |          (Intro.tsx)         |
                                      +---------------+--------------+
                                                      |
                             +------------------------+------------------------+
                             |                                                 |
                             v                                                 v
               +---------------------------+                     +---------------------------+
               |     Regulator Portal      |                     |    Taskholder Portal      |
               |      (ServerIntroPg)      |                     |      (ClientIntroPg)      |
               +-------------+-------------+                     +-------------+-------------+
                             |                                                 |
                             | Top-down Broadcast / Bottom-up Approval         | Submit Proofs / Return Surplus
                             v                                                 v
      +-----------------------------------------------------------------------------------------------+
      |                                     Aptos Devnet                                              |
      |                           Contract: 0x3c6d4...ce6b                                            |
      |                                                                                               |
      |   +---------------------------------------+   +-------------------------------------------+   |
      |   |             user Module               |   |            task_manager Module            |   |
      |   | - Profile registration (Name, Sector) |   | - Self-initializing managers              |   |
      |   | - Sector classification               |   | - add_notification, create_task          |   |
      |   | - create_user_with_info, get_field    |   | - approve_task, return_surplus            |   |
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
git clone https://github.com/your-username/DecentralizedVote.git
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

### 🛡️ As a Regulator (`/regulator`)
1. **Connect Wallet**: Click **"Connect Wallet"** in the top navigation bar and select **Petra**.
2. **Review Department Pools**: Check budget allocations across *Healthcare*, *Infrastructure*, *Education*, *Agriculture*, and *Technology*.
3. **Review Bottom-Up Proposals**: If taskholders have submitted field proposals, review them in the **"Incoming Field Proposals"** card:
   - Click **"Approve & Broadcast"** ➔ Confirms in Petra wallet ➔ Commits department funds and notifies taskholders.
   - Click **"Reject"** ➔ Marks the proposal rejected with zero financial commitment.
4. **Broadcast New Task (Top-Down)**: Use the task assignment form to allocate budget and broadcast a new initiative on-chain.
5. **Audit Completed Tasks**:
   - In the **Transparent Task & Fund Audit** table, click the **Proof Doc** link to view submitted receipts or deliverables.
   - Click **"Audit & Release"**:
     - **Verify & Authorize Release**: Approves the audit on-chain and releases funds to the taskholder.
     - **Deny & Request Revision**: Rejects the audit with notes (e.g. *"Missing invoice #4"*), returning the task to **Ongoing** status so the taskholder can resubmit.

---

### 👷 As a Taskholder (`/taskholder`)
1. **Connect Wallet & Register Profile**:
   - Connect Petra wallet. If it is your first time, complete the one-time registration modal (choose Name & Sector, e.g., *Healthcare*).
2. **Accept Notifications**: Click the notification bell to review newly broadcasted tasks and click **"Accept Task"**.
3. **Execute Work**: Task status moves from **Pending** to **Ongoing**.
4. **Submit Completion Proof**:
   - Click **"Complete"** on an ongoing task.
   - In the **Task Proof Submission Modal**, enter the actual money spent and upload work proof (receipts, photos, or document URL/IPFS CID).
   - Task enters **Completed** status and awaits regulator audit.
5. **Return Surplus Funds**:
   - If actual spending was below allocation, your dashboard shows an available **Surplus Balance**.
   - Click **"Return Surplus Balance to Treasury"** ➔ Approves in Petra ➔ Executes `return_surplus` on Aptos Devnet, returning unspent funds to the department pool.
6. **Submit Bottom-Up Proposal**:
   - Use the **"Propose New Task"** form to request funding for an unlisted urgent task.
   - Once approved by a Regulator, the proposal automatically converts into an active assigned task.

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
| `task_manager` | `add_notification(content, money_allocated)` | Broadcasts a new task notification; auto-initializes table storage if needed. |
| `task_manager` | `approve_task(task_id)` | Regulator signs off task completion, disburses funds, and returns surplus. |
| `task_manager` | `create_task(content, money_allocated)` | Creates a new task directly. |
| `task_manager` | `accept_notification(notification_id)` | Moves a notification into the taskholder's active tasks. |
| `task_manager` | `update_task_status(task_id, new_status)` | Validates and updates task lifecycle state. |
| `task_manager` | `submit_task_proof(task_id, actual_spent, cid)` | Submits proof CID and actual expenditure for audit. |
| `task_manager` | `return_surplus(sector, amount)` | Returns unused taskholder funds back to the department pool. |
| `user` | `create_user_with_info(name, field)` | Registers an on-chain taskholder profile and assigned sector. |

---

## 🛠️ Compiling & Deploying Contracts (Developers)

The contracts are already compiled and published to Devnet. If you want to deploy your own instance:

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

- **Single Responsibility Principle (SRP)**: Dedicated classes for data persistence (`LocalStorageProvider`), unique pseudonym generation (`PseudonymGenerator`), and state validation (`TaskLifecycleGuard`).
- **Open/Closed Principle (OCP)**: Pluggable `StorageProvider` interface allowing seamless swapping from LocalStorage to IndexedDB or backend APIs without touching business logic.
- **Repository Pattern**: `TaskRepository` and `BudgetRepository` isolate storage queries and updates.
- **Observer Pattern**: `LedgerEventBus` publishes and subscribes to ledger state changes, keeping the Regulator and Taskholder dashboards in sync without expensive polling.
- **Facade Pattern**: `TaskLedgerService` provides a unified, high-level API consumed by React components.

---

## 📁 Repository Structure

```
DecentralizedVote/
├── client/
│   ├── src/
│   │   ├── assets/               # Logos and background textures
│   │   ├── components/
│   │   │   ├── MoneyCard.tsx                # Metric indicator cards
│   │   │   ├── NotificationsList.tsx        # Notification bell & task claim
│   │   │   ├── ProofDocViewerModal.tsx      # Clean proof document & certificate viewer
│   │   │   ├── ProtectedRoute.tsx           # Wallet auth route guard
│   │   │   ├── RegisterModal.tsx            # Taskholder profile onboarding
│   │   │   ├── RequestInput.tsx             # Task broadcast & proposal creation form
│   │   │   ├── TaskAuditModal.tsx           # Regulator compliance verification modal
│   │   │   ├── TaskProofSubmissionModal.tsx # Proof submission with expense tracking
│   │   │   ├── TodoItem.tsx                 # Task row with status actions
│   │   │   ├── TodoList.tsx                 # Searchable task list
│   │   │   └── WalletSelector.tsx           # Petra wallet selector with Devnet faucet link
│   │   ├── lib/
│   │   │   └── aptosClient.ts               # Aptos TS SDK singleton & low-gas options
│   │   ├── pages/
│   │   │   ├── IntroPg.tsx                  # Landing portal & role router
│   │   │   ├── ClientIntroPg.tsx            # Taskholder dashboard & surplus return
│   │   │   └── ServerIntroPg.tsx            # Regulator command center & proposal approvals
│   │   ├── services/
│   │   │   └── taskLedgerService.ts         # SOLID ledger service (Repository + Observer + Facade)
│   │   ├── App.tsx                          # Application routes
│   │   └── main.tsx                         # Wallet adapter provider mount
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── contracts/
│   ├── .aptos/config.yaml        # Aptos CLI network configuration
│   ├── Move.toml                 # Package manifest
│   ├── sources/
│   │   ├── task_manager.move     # Task lifecycle, audit, & budget manager
│   │   └── user.move             # On-chain profile registry
│   └── bin/
│       └── aptos.exe             # Official Aptos CLI (v9.6.0)
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
