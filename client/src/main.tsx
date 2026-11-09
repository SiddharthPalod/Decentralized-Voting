import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

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
