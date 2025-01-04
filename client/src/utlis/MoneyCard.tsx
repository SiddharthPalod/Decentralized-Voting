import React from 'react';

interface MoneyCardProps {
    title: string;
    percentage: number;
    amount: number;
}

const MoneyCard: React.FC<MoneyCardProps> = ({ title, percentage, amount }) => {
    return (
        <div className="bg-white p-2 w-full border-2  shadow-lg rounded-xl">
            <div className="flex items-center">
                <p className="pl-2 text-gray-800">{title}</p>
                <p className="pl-2 text-[#02972f] font-semibold flex items-center">
                    {percentage}%
                </p>
            </div>
            <div className="flex flex-col justify-start p-2">
                <p className="text-left text-lg font-bold text-gray-800">
                    {amount.toLocaleString()}
                </p>
                <div className="relative bg-gray-200 w-full h-2 rounded-md">
                    <div className="absolute top-0 left-0 bg-[#10B981] h-full rounded-md" style={{ width: `${percentage}%` }}></div>
                </div>
            </div>
        </div>
    );
}

export default MoneyCard;
