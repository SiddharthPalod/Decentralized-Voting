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
