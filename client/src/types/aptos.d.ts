interface PetraWallet {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  account: () => Promise<{ address: string }>;
  onAccountChange: (callback: (account: { address: string } | null) => void) => void;
  signAndSubmitTransaction: (transaction: any) => Promise<any>;
  signTransaction: (transaction: any) => Promise<any>;
  signMessage: (message: { message: string }) => Promise<{ signature: string }>;
}

declare global {
  interface Window {
    aptos?: PetraWallet;
  }
} 