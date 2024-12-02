'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InputField {
    label: string;
    name: string;
    type: 'deposit' | 'borrow' | 'repay' | 'depositStable';
    buttonText: string;
    loadingText: string;
}

interface DepositBorrowProps {
    inputFields: InputField[];
    inputAmounts: Record<string, string>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleTransaction: (type: 'deposit' | 'borrow' | 'repay' | 'depositStable', amount: string) => Promise<void>;
    isConnected: boolean;
    isLoading: Record<string, boolean>;
}

export function DepositBorrow({
    inputFields,
    inputAmounts,
    handleInputChange,
    handleTransaction,
    isConnected,
    isLoading
}: DepositBorrowProps) {
    const renderInputField = ({ label, name, type, buttonText, loadingText }: InputField) => (
        <motion.div
            key={name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
        >
            <label className="block text-sm font-medium text-blue-400">
                {label}
            </label>
            <div className="flex gap-2">
                <input
                    type="number"
                    id={name}
                    name={name}
                    value={inputAmounts[name]}
                    onChange={handleInputChange}
                    className="flex-1 p-3 bg-[#1a1b23] border border-blue-500/20 rounded-xl text-white 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             placeholder-gray-400 transition-all duration-300"
                    placeholder="Enter amount"
                    disabled={!isConnected || isLoading[type]}
                    min="0"
                    step="any"
                />
                <Button
                    onClick={() => handleTransaction(type, inputAmounts[name])}
                    disabled={!isConnected || isLoading[type] || !inputAmounts[name]}
                    className="px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl
                             transform hover:scale-105 transition-all duration-300 
                             hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isLoading[type] ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="flex items-center gap-2"
                        >
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            {loadingText}
                        </motion.div>
                    ) : (
                        buttonText
                    )}
                </Button>
            </div>
        </motion.div>
    );

    return (
        <Card className="relative overflow-hidden bg-[#0d1117] backdrop-blur-xl border border-blue-500/20 rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
            
            <CardHeader className="relative">
                <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                    Deposit & Borrow
                </CardTitle>
            </CardHeader>
            
            <CardContent className="relative space-y-6">
                <div className="space-y-6">
                    {/* Deposit Collateral Section */}
                    <div>
                        {renderInputField(inputFields[0])}
                    </div>

                    {/* Borrow Stablecoins Section */}
                    <div>
                        {renderInputField(inputFields[1])}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 