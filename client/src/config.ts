export const CONFIG = {
  network: {
    nodeUrl: "https://fullnode.devnet.aptoslabs.com/v1",
    faucetUrl: "https://faucet.devnet.aptoslabs.com",
  },
  moduleAddress: "0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b",
  modules: {
    taskManager: "task_manager",
    user: "user",
  },
} as const;
