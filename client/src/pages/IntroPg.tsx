import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import WalletSelector from '../components/WalletSelector';
import ThemeToggle from '../components/ThemeToggle';
import RegisterModal from '../components/RegisterModal';
import Logo from '../assets/logo.png';
import bgtexture from '../assets/bgTexture.jpg';

type RoleType = 'taskholder' | 'regulator' | 'government';

function IntroPg() {
  const { connected, account } = useWallet();
  const navigate = useNavigate();

  const [showRegister, setShowRegister] = useState(false);
  const [registerRole, setRegisterRole] = useState<RoleType>('taskholder');

  const handleEnter = (role: RoleType) => {
    if (!connected || !account) {
      alert('Please connect your Petra wallet first using the button in the top right.');
      return;
    }

    // Check if this wallet already has a registered profile in localStorage
    const addr = account.address.toString().toLowerCase();
    const existing = localStorage.getItem(`trueledger_user_${addr}`);
    if (existing) {
      // Already registered — route straight to the selected portal
      if (role === 'taskholder') navigate('/clientpg');
      else if (role === 'regulator') navigate('/serverpg');
      else navigate('/govtpg');
      return;
    }

    // First time — show registration modal
    setRegisterRole(role);
    setShowRegister(true);
  };

  const getRoute = (role: RoleType) => {
    if (role === 'taskholder') return '/clientpg';
    if (role === 'regulator') return '/serverpg';
    return '/govtpg';
  };

  return (
    <section
      className="flex flex-col items-center p-4 sm:p-8 min-h-screen text-white bg-[#0B0D11]"
      style={{
        backgroundImage: `url(${bgtexture})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Top bar */}
      <div className="flex justify-between items-center w-full mb-8 max-w-6xl">
        <div className="flex items-center gap-3">
          <img
            src={Logo}
            className="h-9 md:h-10 w-auto object-contain shrink-0"
            alt="TrueLedger Logo"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
          />
          <span className="text-xl font-headline font-bold text-white tracking-wider">TRUELEDGER</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <WalletSelector />
        </div>
      </div>

      {/* Hero */}
      <div className="text-center mt-4 mb-10">
        <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold mb-3 tracking-tight">
          TRUELEDGER
        </h1>
        <p className="font-primary text-neutral-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Blockchain-secured government fund allocation. Zero corruption. Domain-specific isolation. Sovereign solvency.
        </p>
        {!connected && (
          <p className="mt-4 text-amber-400 text-xs sm:text-sm font-semibold animate-pulse">
            ↗ Connect your Petra wallet above to get started
          </p>
        )}
      </div>

      {/* 3-Member Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full max-w-6xl mb-12">
        {/* 1. Field Taskholder Card */}
        <div className="bg-[#141414]/95 border border-[#282828] shadow-2xl rounded-2xl p-6 backdrop-blur-xl hover:border-emerald-500/50 transition group flex flex-col justify-between">
          <div>
            <div className="relative mb-4 overflow-hidden rounded-xl">
              <img
                src="https://plus.unsplash.com/premium_vector-1725434321937-4b3432d64d36?q=80&w=800&auto=format&fit=crop"
                alt="Field Taskholder"
                className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
              />
              <span className="absolute top-2.5 left-2.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/80 text-white shadow backdrop-blur-md">
                Execution Tier
              </span>
            </div>

            <h2 className="font-bold text-xl mb-1 text-white flex items-center gap-2">
              <span>Field Taskholder</span>
            </h2>
            <p className="text-neutral-400 text-xs mb-5 leading-relaxed">
              Execute domain-accredited public tasks, upload verifiable proof documents to IPFS, and return unspent surplus balance back to the department pool on Aptos.
            </p>
          </div>

          <button
            onClick={() => handleEnter('taskholder')}
            disabled={!connected}
            className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-600/20 text-white"
          >
            {connected ? 'Enter as Taskholder →' : 'Connect Wallet to Enter'}
          </button>
        </div>

        {/* 2. Department Regulator Card */}
        <div className="bg-[#141414]/95 border border-[#282828] shadow-2xl rounded-2xl p-6 backdrop-blur-xl hover:border-blue-500/50 transition group flex flex-col justify-between">
          <div>
            <div className="relative mb-4 overflow-hidden rounded-xl">
              <img
                src="https://plus.unsplash.com/premium_vector-1720601640744-a80ffc4ec893?q=80&w=800&auto=format&fit=crop"
                alt="Department Regulator"
                className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
              />
              <span className="absolute top-2.5 left-2.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/80 text-white shadow backdrop-blur-md">
                Department Oversight
              </span>
            </div>

            <h2 className="font-bold text-xl mb-1 text-white flex items-center gap-2">
              <span>Department Regulator</span>
            </h2>
            <p className="text-neutral-400 text-xs mb-5 leading-relaxed">
              Administer department budget pools, broadcast domain-scoped tasks, audit work completion proofs, and request top-up budget allocations from the State Government.
            </p>
          </div>

          <button
            onClick={() => handleEnter('regulator')}
            disabled={!connected}
            className="w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-blue-600/20 text-white"
          >
            {connected ? 'Enter as Regulator →' : 'Connect Wallet to Enter'}
          </button>
        </div>

        {/* 3. State Government Card */}
        <div className="bg-[#141414]/95 border border-[#282828] shadow-2xl rounded-2xl p-6 backdrop-blur-xl hover:border-amber-500/50 transition group flex flex-col justify-between">
          <div>
            <div className="relative mb-4 overflow-hidden rounded-xl">
              <img
                src="https://plus.unsplash.com/premium_vector-1756311603186-1474d804a7ff?q=80&w=435&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"
                alt="State Government"
                className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
              />
              <span className="absolute top-2.5 left-2.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/80 text-white shadow backdrop-blur-md">
                Apex Sovereign Tier
              </span>
            </div>

            <h2 className="font-bold text-xl mb-1 text-white flex items-center gap-2">
              <span>State Government</span>
            </h2>
            <p className="text-neutral-400 text-xs mb-5 leading-relaxed">
              Administer master sovereign treasury reserves (₹5,000,000+), mathematically enforce zero negative balances, and adjudicate regulator budget increase requisitions.
            </p>
          </div>

          <button
            onClick={() => handleEnter('government')}
            disabled={!connected}
            className="w-full py-3 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-amber-600/20 text-white"
          >
            {connected ? 'Enter as Government →' : 'Connect Wallet to Enter'}
          </button>
        </div>
      </div>

      {/* Registration / direct-entry modal */}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => navigate(getRoute(registerRole))}
          initialRole={registerRole}
          initialField="Healthcare"
        />
      )}
    </section>
  );
}

export default IntroPg;
