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
            <label htmlFor={name} className="block text-sm font-medium text-blue-400">
                {label}
            </label>
            <div className="flex gap-2">
                <input
                    type="number"
                    id={name}
                    name={name}
                    value={inputAmounts[name]}
                    onChange={handleInputChange}
                    className="flex-1 p-3 bg-gray-800/50 border border-blue-500/20 rounded-xl text-white 
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
                    className="px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl
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
        <Card className="relative overflow-hidden bg-gray-900/90 backdrop-blur-xl border border-blue-500/20 rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            
            <CardHeader className="relative">
                <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                    Lending & Repayment
                </CardTitle>
            </CardHeader>
            
            <CardContent className="relative space-y-6">
                {inputFields.slice(2).map(renderInputField)}
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-6 rounded-xl bg-gray-800/50 border border-blue-500/20"
                >
                    <h3 className="text-lg font-semibold text-blue-400 mb-4">Repayment Details</h3>
                    <div className="space-y-3 text-gray-300">
                        <div className="flex justify-between items-center">
                            <span>Total Amount Due:</span>
                            <span className="font-mono text-blue-400">{repaymentDetails.repaymentAmount} USDT</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Principal:</span>
                            <span className="font-mono text-blue-400">{repaymentDetails.principal} USDT</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Interest:</span>
                            <span className="font-mono text-blue-400">{repaymentDetails.interest} USDT</span>
                        </div>
                        
                        <Button
                            onClick={calculateRepayment}
                            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 
                                     text-white font-semibold py-3 rounded-xl
                                     transform hover:scale-[1.02] transition-all duration-300 
                                     hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                        >
                            Calculate Latest Repayment
                        </Button>
                    </div>
                </motion.div>
            </CardContent>
        </Card>
    );
}