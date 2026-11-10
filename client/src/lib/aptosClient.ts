import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Shared Aptos client — use this everywhere instead of new AptosClient(...)
export const aptos = new Aptos(new AptosConfig({ network: Network.DEVNET }));

// The deployed contract address on devnet
export const MODULE_ADDRESS =
  "0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b";

// Module names
export const MODULES = {
  taskManager: "task_manager",
  user: "user",
} as const;

// Ultra-low minimum gas options for all Aptos transactions
// Minimum Aptos gasUnitPrice = 100 Octas (0.000001 APT)
// Max gas units = 20,000 units (ample budget for storage writes & table operations)
// Max total transaction ceiling = 2,000,000 Octas = 0.02 APT (~$0.15 USD max cap)
// Actual gas consumed on-chain is typically 40 to 4,500 units (~0.004 APT / < $0.04 USD)
export const MIN_GAS_OPTIONS = {
  maxGasAmount: 20000,
  gasUnitPrice: 100,
} as const;
