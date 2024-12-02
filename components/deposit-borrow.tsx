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
    const renderInputField = ({ label, name, type, buttonText, loadingText }: InputField, index: number) => (
        <motion.div
            key={name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="space-y-2"
        >
            <label htmlFor={name} className="block text-sm font-medium text-white/80">
                {label}
            </label>
            <div className="flex gap-2">
                <input
                    type="number"
                    id={name}
                    name={name}
                    value={inputAmounts[name]}
                    onChange={handleInputChange}
                    className="flex-1 p-2 bg-black/40 border border-[#0066FF]/20 rounded-lg text-white 
                                focus:outline-none focus:ring-2 focus:ring-[#0099FF] focus:border-transparent
                                placeholder-white/40 transition-all duration-300 hover:border-[#0099FF]/40"
                    placeholder="Amount"
                    disabled={!isConnected || isLoading[type]}
                    min="0"
                    step="any"
                />
                <Button
                    onClick={() => handleTransaction(type, inputAmounts[name])}
                    disabled={!isConnected || isLoading[type] || !inputAmounts[name]}
                    className="h-10 px-4 bg-gradient-to-r from-[#0066FF] via-[#0099FF] to-[#00CCFF] 
                                text-white font-semibold rounded-lg
                                transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,153,255,0.5)] hover:bg-gradient-to-br hover:from-[#0099FF] hover:to-[#00CCFF]
                                disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isLoading[type] ? loadingText : buttonText}
                    </motion.div>
                </Button>
            </div>
        </motion.div>
    );

    return (
        <Card className="bg-black/40 backdrop-blur-lg border border-[#0066FF]/20">
            <CardHeader>
                <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0066FF] to-[#00CCFF]">
                    Deposit & Borrow
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {inputFields.slice(0, 2).map((field, index) => renderInputField(field, index))}
            </CardContent>
        </Card>
    );
}

