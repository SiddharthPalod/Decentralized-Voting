import React from 'react';

interface MoneyCardProps {
  title: string;
  percentage: number;
  amount: number;
}

const MoneyCard: React.FC<MoneyCardProps> = ({ title, percentage, amount }) => {
  const safePercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="bg-[#141414]/95 border border-[#282828] p-3.5 w-full shadow-2xl rounded-xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <p className="text-gray-300 text-sm font-medium">{title}</p>
        <p className="text-[#10B981] font-bold text-sm flex items-center">
          {safePercentage}%
        </p>
      </div>
      <div className="flex flex-col justify-start mt-2">
        <p className="text-left text-xl font-bold font-headline text-white tracking-wide mb-2">
          ₹ {amount.toLocaleString()}
        </p>
        <div className="relative bg-[#1c1c1c] w-full h-2 rounded-full overflow-hidden border border-[#282828]">
          <div
            className="absolute top-0 left-0 bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${safePercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default MoneyCard;
