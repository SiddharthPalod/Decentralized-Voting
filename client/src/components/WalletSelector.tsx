import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Wallet, Check, Copy, ExternalLink, LogOut, ChevronDown, X, Loader2, Coins } from 'lucide-react';
import { aptos } from '../lib/aptosClient';

interface WalletOption {
  name: string;
  icon: string;
  url: string;
  isDetected: boolean;
}

export const WalletSelector: React.FC = () => {
  const { connect, disconnect, connected, account, wallets } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aptBalance, setAptBalance] = useState<string | null>(null);
  const [isFunding, setIsFunding] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!account?.address) return;
    try {
      const amount = await aptos.getAccountAPTAmount({
        accountAddress: account.address.toString(),
      });
      setAptBalance((amount / 100_000_000).toFixed(4));
    } catch {
      setAptBalance(null);
    }
  }, [account]);

  useEffect(() => {
    if (connected && isAccountOpen) {
      fetchBalance();
    }
  }, [connected, isAccountOpen, fetchBalance]);

  const handleRequestFaucet = async () => {
    if (!account?.address) return;
    setIsFunding(true);
    try {
      await aptos.fundAccount({
        accountAddress: account.address.toString(),
        amount: 100_000_000, // 1 APT
      });
      await fetchBalance();
      alert('Successfully requested 1 APT from Devnet faucet!');
    } catch (err: any) {
      console.warn('Faucet request failed/rate-limited:', err);
      window.open(`https://aptos.dev/network/faucet?address=${account.address.toString()}`, '_blank');
    } finally {
      setIsFunding(false);
    }
  };

  // Check if Petra is in window
  const isPetraInWindow = typeof window !== 'undefined' && !!(window as any).aptos;

  const walletOptions: WalletOption[] = [
    {
      name: 'Petra',
      icon: 'https://petra.app/favicon.ico',
      url: 'https://petra.app/',
      isDetected: isPetraInWindow || wallets.some((w) => w.name.toLowerCase().includes('petra')),
    },
    {
      name: 'Pontem Wallet',
      icon: 'https://pontem.network/favicon.ico',
      url: 'https://pontem.network/',
      isDetected: typeof window !== 'undefined' && !!(window as any).pontem,
    },
    {
      name: 'Nightly',
      icon: 'https://nightly.app/favicon.ico',
      url: 'https://nightly.app/',
      isDetected: typeof window !== 'undefined' && !!(window as any).nightly,
    },
  ];

  const handleConnect = async (walletName: string) => {
    setConnecting(true);
    setError(null);
    try {
      // 1. Try connecting via wallet adapter
      const targetWallet = wallets.find(
        (w) => w.name.toLowerCase() === walletName.toLowerCase()
      );

      if (targetWallet) {
        await connect(targetWallet.name);
      } else if (walletName === 'Petra' && isPetraInWindow) {
        // Direct window fallback for Petra
        try {
          await (window as any).aptos.connect();
          await connect('Petra');
        } catch {
          // If connect fails, retry standard adapter
          await connect('Petra');
        }
      } else {
        await connect(walletName);
      }
      setIsOpen(false);
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      // If user rejected or cancelled
      if (err?.message?.includes('User rejected') || err?.code === 4001) {
        setError('Connection request cancelled by user.');
      } else {
        setError(err?.message || 'Failed to connect. Please open Petra and try again.');
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleCopy = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr?: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="relative inline-block text-left">
      {/* Trigger Button */}
      {!connected ? (
        <button
          onClick={() => {
            setIsOpen(true);
            setError(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition"
        >
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </button>
      ) : (
        <button
          onClick={() => setIsAccountOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1c1c1c] hover:bg-[#242424] text-neutral-200 text-xs font-semibold rounded-xl border border-[#282828] shadow-sm transition"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono text-neutral-200">{formatAddress(account?.address?.toString())}</span>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      )}

      {/* Account Info Dropdown */}
      {connected && isAccountOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-[#13151A] text-white rounded-2xl shadow-2xl border border-[#272A33] p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-3 border-b border-[#272A33] mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Connected Account
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Aptos Devnet
            </span>
          </div>

          <div className="bg-[#1A1D24] p-3 rounded-xl border border-[#272A33] mb-3">
            <p className="text-[11px] text-gray-400 font-medium mb-1">Wallet Address</p>
            <div className="flex items-center justify-between gap-1 mb-2.5">
              <span className="text-xs font-mono font-bold text-gray-100 truncate" title={account?.address?.toString()}>
                {account?.address?.toString()}
              </span>
              <button
                onClick={handleCopy}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#22252E] transition shrink-0"
                title="Copy Address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="pt-2 border-t border-[#272A33] flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" /> Devnet APT:
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {aptBalance !== null ? `${aptBalance} APT` : 'Checking...'}
              </span>
            </div>
          </div>

          {/* Ultra-low gas badge */}
          <div className="p-2 bg-emerald-950/40 border border-emerald-800/50 rounded-xl mb-3 text-[10px] text-emerald-300 flex items-center justify-between">
            <span>Tx Gas Cap:</span>
            <span className="font-mono font-bold text-white">~0.004 APT (&lt; $0.04)</span>
          </div>

          {/* 1-Click Devnet Faucet Request */}
          <button
            type="button"
            onClick={handleRequestFaucet}
            disabled={isFunding}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/40 transition mb-2.5 shadow-sm"
          >
            {isFunding ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Requesting 1 APT...
              </>
            ) : (
              '🚰 Request 1 APT (Devnet Faucet)'
            )}
          </button>

          <button
            onClick={() => {
              disconnect();
              setIsAccountOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-bold rounded-xl border border-red-800/60 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Disconnect Wallet
          </button>
        </div>
      )}

      {/* Wallet Selector Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#13151A] text-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-[#272A33] relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#272A33] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#1A1D24] text-emerald-400 border border-[#272A33] rounded-xl">
                  <Wallet className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-white">Connect a Wallet</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-2.5 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs">
                {error}
              </div>
            )}

            <div className="space-y-2.5">
              {walletOptions.map((wallet) => (
                <div
                  key={wallet.name}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#272A33] bg-[#1A1D24]/60 hover:border-[#10B981] hover:bg-[#1A1D24] transition cursor-pointer"
                  onClick={() => {
                    if (wallet.isDetected) {
                      handleConnect(wallet.name);
                    } else {
                      window.open(wallet.url, '_blank');
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={wallet.icon}
                      alt={wallet.name}
                      className="w-7 h-7 rounded-lg object-contain bg-neutral-800 p-0.5 border border-[#272A33]"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                    <div>
                      <h4 className="font-bold text-xs text-white">{wallet.name}</h4>
                      <p className="text-[10px] text-gray-400">
                        {wallet.isDetected ? 'Ready to connect' : 'Extension not installed'}
                      </p>
                    </div>
                  </div>

                  {wallet.isDetected ? (
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] rounded-lg">
                      Detected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:underline">
                      Install <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              ))}
            </div>

            {connecting && (
              <div className="mt-4 p-3 bg-[#1A1D24] border border-[#272A33] rounded-xl flex items-center justify-center gap-2 text-xs text-blue-300 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                Connecting to wallet extension...
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-[#272A33] text-center">
              <p className="text-[11px] text-gray-400">
                Aptos Devnet • Ensure wallet network is set to Devnet
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletSelector;
