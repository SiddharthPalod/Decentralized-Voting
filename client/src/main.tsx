import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network, NetworkToNodeAPI, NetworkToFaucetAPI } from "@aptos-labs/ts-sdk";

// Normalize wallet network names so wallet-adapter recognizes Devnet from Petra / Pontem
if (NetworkToNodeAPI) {
  (NetworkToNodeAPI as any)["Devnet"] = NetworkToNodeAPI[Network.DEVNET];
  (NetworkToNodeAPI as any)["DEVNET"] = NetworkToNodeAPI[Network.DEVNET];
  (NetworkToNodeAPI as any)["Aptos Devnet"] = NetworkToNodeAPI[Network.DEVNET];
  (NetworkToNodeAPI as any)["Testnet"] = NetworkToNodeAPI[Network.TESTNET];
  (NetworkToNodeAPI as any)["TESTNET"] = NetworkToNodeAPI[Network.TESTNET];
  (NetworkToNodeAPI as any)["Mainnet"] = NetworkToNodeAPI[Network.MAINNET];
}
if (NetworkToFaucetAPI) {
  (NetworkToFaucetAPI as any)["Devnet"] = NetworkToFaucetAPI[Network.DEVNET];
  (NetworkToFaucetAPI as any)["DEVNET"] = NetworkToFaucetAPI[Network.DEVNET];
}

// Initialize light/dark theme class immediately before first paint
try {
  const savedTheme = localStorage.getItem('trueledger_theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }
} catch {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{ network: Network.DEVNET }}
      optInWallets={["Petra", "Nightly", "Pontem Wallet", "Mizu Wallet"]}
    >
      <App />
    </AptosWalletAdapterProvider>
  </StrictMode>,
)
