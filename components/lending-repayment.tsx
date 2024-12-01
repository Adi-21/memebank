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

interface LendingRepaymentProps {
    inputFields: InputField[];
    inputAmounts: Record<string, string>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleTransaction: (type: 'deposit' | 'borrow' | 'repay' | 'depositStable', amount: string) => Promise<void>;
    isConnected: boolean;
    isLoading: Record<string, boolean>;
    repaymentDetails: {
        repaymentAmount: string;
        principal: string;
        interest: string;
    };
    calculateRepayment: () => Promise<void>;
}

export function LendingRepayment({
    inputFields,
    inputAmounts,
    handleInputChange,
    handleTransaction,
    isConnected,
    isLoading,
    repaymentDetails,
    calculateRepayment
}: LendingRepaymentProps) {
    const renderInputField = ({ label, name, type, buttonText, loadingText }: InputField) => (
        <motion.div
            key={name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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
                                placeholder-white/40"
                    placeholder="Amount"
                    disabled={!isConnected || isLoading[type]}
                    min="0"
                    step="any"
                />
                <Button
                    onClick={() => handleTransaction(type, inputAmounts[name])}
                    disabled={!isConnected || isLoading[type] || !inputAmounts[name]}
                    className="h-10 px-4 bg-gradient-to-r from-[#0066FF] via-[#0099FF] to-[#00CCFF] 
                                text-white font-semibold rounded-lg transform hover:-translate-y-1 
                                transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,153,255,0.5)]
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isLoading[type] ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
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
        <Card className="bg-black/40 backdrop-blur-lg border border-[#0066FF]/20">
            <CardHeader>
                <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0066FF] to-[#00CCFF]">
                    Lending & Repayment
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {inputFields.slice(2).map(renderInputField)}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-lg bg-black/20 border border-[#0066FF]/20"
                >
                    <p className="text-sm font-medium mb-3 text-white/80">Repayment Details</p>
                    <div className="space-y-2 text-white/60">
                        <p>Total Amount Due: {repaymentDetails.repaymentAmount} USDT</p>
                        <p>Principal: {repaymentDetails.principal} USDT</p>
                        <p>Interest: {repaymentDetails.interest} USDT</p>
                        <Button
                            onClick={calculateRepayment}
                            className="mt-4 w-full bg-gradient-to-r from-[#0066FF] to-[#00CCFF] 
                                        text-white font-semibold rounded-lg transform hover:-translate-y-1 
                                        transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,153,255,0.5)]"
                        >
                            Calculate Latest Repayment
                        </Button>
                    </div>
                </motion.div>
            </CardContent>
        </Card>
    );
} 