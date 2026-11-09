import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import WalletSelector from '../components/WalletSelector';
import RegisterModal from '../components/RegisterModal';
import bgtexture from '../assets/bgTexture.jpg';
import Logo from '../assets/logo.png';

function IntroPg() {
  const { connected, account } = useWallet();
  const navigate = useNavigate();
  const [showRegister, setShowRegister] = useState(false);
  const [registerRole, setRegisterRole] = useState<'taskholder' | 'regulator'>('taskholder');

  const handleEnter = (role: 'taskholder' | 'regulator') => {
    if (!connected || !account) {
      alert('Please connect your Petra wallet first using the button in the top right.');
      return;
    }

    // Check if this wallet already has a registered profile in localStorage
    const addr = account.address.toString().toLowerCase();
    const existing = localStorage.getItem(`trueledger_user_${addr}`);
    if (existing) {
      // Already registered — go straight to the portal
      navigate(role === 'taskholder' ? '/clientpg' : '/serverpg');
      return;
    }

    // First time — show registration form
    setRegisterRole(role);
    setShowRegister(true);
  };

  return (
    <section
      className="flex flex-col items-center p-8 min-h-screen text-white bg-[#0B0D11]"
      style={{
        backgroundImage: `url(${bgtexture})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top bar */}
      <div className="flex justify-between items-center w-full mb-8">
        <div className="flex items-center gap-3">
          <img src={Logo} className="h-9" alt="TrueLedger Logo" />
          <span className="text-xl font-headline font-bold text-white tracking-wider">TRUELEDGER</span>
        </div>
        <WalletSelector />
      </div>

      {/* Hero */}
      <div className="text-center mt-8 mb-12">
        <h1 className="font-headline text-5xl md:text-6xl font-bold mb-3 tracking-tight">TRUELEDGER</h1>
        <p className="font-primary text-neutral-400 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
          Blockchain-secured government fund allocation. Zero corruption. Full transparency.
        </p>
        {!connected && (
          <p className="mt-4 text-amber-400 text-sm font-semibold animate-pulse">
            ↗ Connect your Petra wallet above to get started
          </p>
        )}
      </div>

      {/* Role cards */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-3xl">

        {/* Taskholder Card */}
        <div className="w-full md:w-80 bg-black/40 backdrop-blur-lg p-6 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition group">
          <img
            src="https://plus.unsplash.com/premium_vector-1725434321937-4b3432d64d36?q=80&w=800&auto=format&fit=crop"
            alt="Taskholder"
            className="rounded-xl w-full h-40 object-cover mb-4"
          />
          <h2 className="font-bold text-xl mb-1">Field Taskholder</h2>
          <p className="text-neutral-400 text-xs mb-5 leading-relaxed">
            Execute government tasks, submit proof of work, and earn recognition in your domain — all on-chain.
          </p>
          <button
            onClick={() => handleEnter('taskholder')}
            disabled={!connected}
            className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-600/20"
          >
            {connected ? 'Enter as Taskholder →' : 'Connect Wallet to Enter'}
          </button>
        </div>

        <span className="font-primary text-2xl font-bold text-neutral-500">OR</span>

        {/* Regulator Card */}
        <div className="w-full md:w-80 bg-black/40 backdrop-blur-lg p-6 rounded-2xl border border-white/10 hover:border-blue-500/40 transition group">
          <img
            src="https://plus.unsplash.com/premium_vector-1720601640744-a80ffc4ec893?q=80&w=800&auto=format&fit=crop"
            alt="Regulator"
            className="rounded-xl w-full h-40 object-cover mb-4"
          />
          <h2 className="font-bold text-xl mb-1">Department Regulator</h2>
          <p className="text-neutral-400 text-xs mb-5 leading-relaxed">
            Allocate department budgets, assign tasks, audit completions, and sign off fund disbursements on Aptos.
          </p>
          <button
            onClick={() => handleEnter('regulator')}
            disabled={!connected}
            className="w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-blue-600/20"
          >
            {connected ? 'Enter as Regulator →' : 'Connect Wallet to Enter'}
          </button>
        </div>
      </div>

      {/* Registration / direct-entry modal */}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => navigate(registerRole === 'taskholder' ? '/clientpg' : '/serverpg')}
        />
      )}
    </section>
  );
}

export default IntroPg;
