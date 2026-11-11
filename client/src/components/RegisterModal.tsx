import { useState } from 'react';
import { useWallet, InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { MODULE_ADDRESS, MODULES, aptos, MIN_GAS_OPTIONS } from '../lib/aptosClient';
import { Loader2, ShieldCheck, X } from 'lucide-react';

interface RegisterModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialRole?: 'taskholder' | 'regulator' | 'government';
  initialField?: string;
}

const FIELDS = [
  'Healthcare',
  'Infrastructure',
  'Education',
  'Agriculture',
  'Technology',
  'Defense',
  'Finance',
  'Environment',
];

const RegisterModal: React.FC<RegisterModalProps> = ({
  onClose,
  onSuccess,
  initialRole = 'taskholder',
  initialField = 'Healthcare',
}) => {
  const { account, signAndSubmitTransaction, network } = useWallet();
  const [name, setName] = useState(
    initialRole === 'government' ? 'State Comptroller General' : ''
  );
  const [field, setField] = useState(
    initialRole === 'government' ? 'Finance' : initialField
  );
  const [role] = useState<'taskholder' | 'regulator' | 'government'>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!account || !name.trim()) return;
    setLoading(true);
    setError(null);

    const userAddr = account.address.toString();

    // Primary: Submit real on-chain transaction to Aptos Devnet (deducts gas fee in Petra)
    if (signAndSubmitTransaction) {
      try {
        const tx: InputTransactionData = {
          data: {
            function: `${MODULE_ADDRESS}::${MODULES.user}::create_user_with_info`,
            functionArguments: [name.trim(), field],
          },
          options: MIN_GAS_OPTIONS,
        };
        const response = await signAndSubmitTransaction(tx);
        if (response?.hash) {
          await aptos.waitForTransaction({ transactionHash: response.hash });
        }
      } catch (err: any) {
        const errMsg = err?.message || err?.name || String(err);
        if (
          errMsg.toLowerCase().includes('reject') ||
          errMsg.toLowerCase().includes('cancel') ||
          errMsg.toLowerCase().includes('declined')
        ) {
          alert('Registration was cancelled in Petra wallet.');
          setLoading(false);
          return;
        }
        console.warn('On-chain user creation notice:', err);
      }
    }

    // 2. Persist profile in TrueLedger storage
    try {
      localStorage.setItem(
        `trueledger_user_${userAddr.toLowerCase()}`,
        JSON.stringify({
          name: name.trim(),
          field,
          role,
          address: userAddr,
          createdAt: Date.now(),
        })
      );
    } catch {
      // ignore
    }

    setLoading(false);
    onSuccess();
    onClose();
  };

  const isTestnet = network?.name?.toLowerCase().includes('testnet');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#141414] border border-[#282828] rounded-2xl shadow-2xl w-full max-w-md p-6 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-[#1c1c1c] text-emerald-400 border border-[#282828] rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Create Your Profile</h2>
            <p className="text-gray-400 text-xs">Register your wallet identity on TrueLedger</p>
          </div>
        </div>

        {isTestnet && (
          <div className="my-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
            <span className="font-bold">Notice:</span> Petra is connected to <strong>Testnet</strong>. TrueLedger will create your profile and sync your tasks immediately. For on-chain execution, switch Petra to <strong>Devnet</strong>.
          </div>
        )}

        {error && (
          <div className="my-4 p-3 bg-red-950/70 border border-red-800/80 rounded-xl text-red-300 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-4 mt-5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vikram Sharma"
              className="w-full p-3 bg-[#1A1D24] border border-[#272A33] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#10B981] text-sm transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Sector / Department
            </label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="w-full p-3 bg-[#1A1D24] border border-[#272A33] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#10B981] text-sm transition"
              disabled={loading}
            >
              {FIELDS.map((f) => (
                <option key={f} value={f} className="bg-[#13151A] text-white">
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 px-4 border border-[#272A33] rounded-xl text-gray-300 font-medium hover:bg-[#1A1D24] transition text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRegister}
            disabled={loading || !name.trim()}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registering...
              </>
            ) : (
              'Create Profile'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
