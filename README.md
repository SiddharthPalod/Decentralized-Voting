# TrueLedger — Decentralized Fund & Task Allocation System

A decentralized, transparent platform built on the **Aptos Blockchain** designed to prevent corruption and fund misappropriation in government and organizational public budgets.

---

## 🌟 Overview

TrueLedger enforces complete financial transparency between government authorities (**Regulators**) and project executors (**Taskholders**):

- **Regulators** allocate verified project tasks and track budgeted public expenditure.
- **Taskholders** register on-chain profiles, receive task notifications, accept/decline tasks, execute work, and record fund utilization transparently.
- **Aptos Move Smart Contracts** provide immutable audit trails, event emission, and decentralized state management without centralized intermediaries.

---

## 🏗️ Architecture

```
                                  +------------------------------+
                                  |         Landing Page         |
                                  |           (IntroPg)          |
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
                         | Allocates Tasks & Budget                        | Accepts Tasks & Reports Status
                         v                                                 v
  +-----------------------------------------------------------------------------------------------+
  |                                     Aptos Devnet                                              |
  |                           Contract Address: 0x3c6d4...ce6b                                    |
  |                                                                                               |
  |   +---------------------------------------+   +-------------------------------------------+   |
  |   |             user Module               |   |            task_manager Module            |   |
  |   | - User profile (Name, Sector, Addr)   |   | - NotificationManager (add/accept/decline)|   |
  |   | - create_user, update_name, update... |   | - TaskManager (create, delete, status)    |   |
  |   | - UserCreated event                   |   | - NotificationAdded & TaskCreated events  |   |
  |   +---------------------------------------+   +-------------------------------------------+   |
  +-----------------------------------------------------------------------------------------------+
```

---

## 🚀 Key Features

1. **Modern Aptos TS SDK (`@aptos-labs/ts-sdk` v1.32+)**:
   - High-performance interaction with Aptos Devnet fullnodes.
   - Standardized transaction payload structures and event polling via `getAccountEventsByEventType`.

2. **Unified Wallet Adapter**:
   - Single standard integration using `@aptos-labs/wallet-adapter-react` and `@aptos-labs/wallet-adapter-ant-design`.
   - Native support for **Petra Wallet**, **Nightly**, **Pontem**, and **Mizu**.

3. **Dynamic On-Chain Fund Accounting**:
   - Real-time aggregation of allocated funds, utilized funds, and completed task milestones.
   - Interactive progress indicators via `MoneyCard` dynamically calculated from task transactions.

4. **On-Chain User Profiles & Registration**:
   - User sector classification (Healthcare, Infrastructure, Education, Agriculture, Technology).
   - Auto-checks on-chain existence and provides modal registration for new wallets.

5. **Role-Based Protected Routing**:
   - `ProtectedRoute` component ensures users connect wallets before accessing specialized Regulator or Taskholder interfaces.

---

## 🛠️ Project Structure

```
DecentralizedVote/
├── client/
│   ├── src/
│   │   ├── assets/               # Branding, background imagery, logos
│   │   ├── components/
│   │   │   ├── MoneyCard.tsx         # Metric display for funds & utilization %
│   │   │   ├── NotificationsList.tsx # Notification bell & task approval dropdown
│   │   │   ├── ProtectedRoute.tsx    # Wallet connection route guard
│   │   │   ├── RegisterModal.tsx     # On-chain profile registration dialog
│   │   │   ├── RequestInput.tsx      # Regulator task assignment form
│   │   │   ├── TodoItem.tsx          # Task item row with status transitions
│   │   │   └── TodoList.tsx          # Real-time task manager list
│   │   ├── lib/
│   │   │   └── aptosClient.ts        # Singleton Aptos client & contract addresses
│   │   ├── pages/
│   │   │   ├── IntroPg.tsx           # Role selector and initial landing
│   │   │   ├── ClientIntroPg.tsx     # Taskholder execution dashboard
│   │   │   └── ServerIntroPg.tsx     # Regulator control center
│   │   ├── App.tsx                   # Main router configuration
│   │   ├── config.ts                 # Devnet node and module constants
│   │   └── main.tsx                  # Root mount with AptosWalletAdapterProvider
│   ├── package.json
│   └── vite.config.ts
└── contracts/
    ├── Move.toml                     # Move package manifest
    └── sources/
        └── notifications.move        # user & task_manager Move modules
```

---

## 💻 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Petra Wallet extension](https://petra.app/) installed in your browser
  - Set network to **Aptos Devnet**
  - Claim testnet APT via Petra's "Faucet" button

### Running the Frontend

```bash
# Navigate to the client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Building for Production

```bash
cd client
npm run build
```

---

## 🔗 Smart Contract Reference

- **Network**: Aptos Devnet
- **Contract Address**: `0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b`
- **Modules**:
  - `user`: Manages taskholder profiles and sector assignment.
  - `task_manager`: Manages fund allocations, notifications, and task lifecycle (`Pending` -> `Ongoing` -> `Completed`).
