'use client';

import { useState, useEffect, useCallback } from 'react';
import { UniContractService } from '@/utils/UniContractService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wallet, Coins, PiggyBank, ArrowDownUp } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';

interface InputField {
    label: string;
    name: string;
    type: 'deposit' | 'borrow' | 'repay' | 'depositStable';
    buttonColor: string;
    buttonText: string;
    loadingText: string;
}

const inputFields: InputField[] = [
    {
        label: 'Deposit Collateral',
        name: 'depositCollateral',
        type: 'deposit',
        buttonColor: 'bg-blue-500 hover:bg-blue-600',
        buttonText: 'Deposit',
        loadingText: 'Depositing...'
    },
    {
        label: 'Borrow Stablecoins',
        name: 'borrowAmount',
        type: 'borrow',
        buttonColor: 'bg-green-500 hover:bg-green-600',
        buttonText: 'Borrow',
        loadingText: 'Borrowing...'
    },
    {
        label: 'Deposit Stablecoins',
        name: 'depositStable',
        type: 'depositStable',
        buttonColor: 'bg-purple-500 hover:bg-purple-600',
        buttonText: 'Deposit',
        loadingText: 'Depositing...'
    },
    {
        label: 'Repay Loan',
        name: 'repayAmount',
        type: 'repay',
        buttonColor: 'bg-red-500 hover:bg-red-600',
        buttonText: 'Repay',
        loadingText: 'Repaying...'
    }
];

export const UniDashboard = () => {
    const { toast } = useToast();
    const [isConnected, setIsConnected] = useState(false);
    const [userAddress, setUserAddress] = useState('');
    const [contractService] = useState(() => new UniContractService());

    useEffect(() => {
        contractService.initialize();
    }, [contractService]);

    const [isLoading, setIsLoading] = useState({
        deposit: false,
        borrow: false,
        repay: false,
        depositStable: false
    });

    const [inputAmounts, setInputAmounts] = useState({
        depositCollateral: '',
        borrowAmount: '',
        repayAmount: '',
        depositStable: ''
    });

    const [userStats, setUserStats] = useState({
        collateral: '0',
        borrowed: '0',
        deposited: '0',
        borrowInterest: '0',
        lendingInterest: '0'
    });

    const [platformStats, setPlatformStats] = useState({
        totalDeposits: '0',
        totalBorrowed: '0',
        currentPrice: '0',
        isEmergency: false,
        collateralRatio: '150'
    });

    const [repaymentDetails, setRepaymentDetails] = useState({
        repaymentAmount: '0',
        principal: '0',
        interest: '0',
        deadline: 0,
        status: 'No active loan'
    });

    const loadData = useCallback(async () => {
        if (!isConnected || !userAddress) return;

        try {
            const [userData, platformData] = await Promise.all([
                contractService.getUserData(userAddress),
                contractService.getPlatformStats(),
                contractService.getFormattedRepaymentAmount(userAddress)
            ]);

            setUserStats({
                collateral: userData.collateralAmount,
                borrowed: userData.borrowedAmount,
                deposited: userData.stableDeposited,
                borrowInterest: '0',
                lendingInterest: '0'
            });

            setPlatformStats({
                totalDeposits: platformData.totalDeposits,
                totalBorrowed: platformData.totalBorrowed,
                currentPrice: platformData.currentPrice,
                isEmergency: platformData.isEmergency,
                collateralRatio: platformData.collateralRatio
            });
        } catch (error) {
            console.error('Error loading data:', error);
            toast({
                title: 'Error loading data',
                description: 'Please try again later',
                variant: 'destructive'
            });
        }
    }, [isConnected, userAddress, contractService, toast]);

    const handleTransaction = async (type: InputField['type'], amount: string) => {
        if (!amount || Number(amount) <= 0) {
            toast({
                title: 'Invalid amount',
                description: 'Please enter a valid amount',
                variant: 'destructive'
            });
            return;
        }

        setIsLoading(prev => ({ ...prev, [type]: true }));

        try {
            let tx;
            switch (type) {
                case 'deposit':
                    tx = await contractService.depositCollateral(amount);
                    break;
                case 'borrow':
                    tx = await contractService.borrowStablecoins(amount);
                    break;
                case 'repay':
                    tx = await contractService.repayLoan(amount);
                    break;
                case 'depositStable':
                    tx = await contractService.depositStable(amount);
                    break;
            }

            toast({
                title: 'Transaction Submitted',
                description: 'Please wait for confirmation...'
            });

            await tx.wait();

            setInputAmounts(prev => ({
                ...prev,
                [type === 'deposit' ? 'depositCollateral' : `${type}Amount`]: ''
            }));

            await loadData();

            toast({
                title: 'Transaction Successful',
                description: `${type.charAt(0).toUpperCase() + type.slice(1)} completed successfully`
            });

        } catch (error: any) {
            console.error(`${type} error:`, error);
            toast({
                title: 'Transaction Failed',
                description: error.message || 'Please try again',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(prev => ({ ...prev, [type]: false }));
        }
    };

    const handleConnect = async () => {
        try {
            // First check if MetaMask is installed
            if (!window.ethereum) {
                toast({
                    title: 'MetaMask Required',
                    description: 'Please install MetaMask to continue',
                    variant: 'destructive'
                });
                return;
            }

            // Request account access
            await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            // Then connect through contract service
            const { address } = await contractService.connectWallet();
            setUserAddress(address);
            setIsConnected(true);

            // Load data after successful connection
            await loadData();

            toast({
                title: 'Connected Successfully',
                description: `Connected to address: ${address.slice(0, 6)}...${address.slice(-4)}`
            });
        } catch (error: any) {
            console.error('Connection error:', error);
            toast({
                title: 'Connection Failed',
                description: error.message || 'Please try again',
                variant: 'destructive'
            });
        }
    };

    const renderInputField = (field: InputField) => (
        <div key={field.name} className="space-y-2">
            <label className="text-pink-400 text-sm font-medium">
                {field.label}
            </label>
            <div className="flex gap-2">
                <input
                    type="number"
                    value={inputAmounts[field.name as keyof typeof inputAmounts]}
                    onChange={(e) => setInputAmounts(prev => ({ ...prev, [field.name]: e.target.value }))}
                    className="flex-1 p-3 bg-gray-800/50 border border-pink-500/20 
                              rounded-xl text-white focus:outline-none focus:ring-2 
                              focus:ring-pink-500"
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                />
                <Button
                    onClick={() => handleTransaction(field.type, inputAmounts[field.name as keyof typeof inputAmounts])}
                    disabled={isLoading[field.type]}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-6 
                              rounded-xl transition-all duration-300"
                >
                    {isLoading[field.type] ? field.loadingText : field.buttonText}
                </Button>
            </div>
        </div>
    );

    useEffect(() => {
        if (isConnected) {
            loadData();
        }
    }, [isConnected, loadData]);

    return (
        <div className="min-h-screen bg-[#0d1117] p-6 max-w-full mx-auto">
            <div className="flex justify-between items-center mb-8 p-6 
                      bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-pink-500/20">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text 
                             bg-gradient-to-r from-pink-400 to-pink-600">
                        Unichain Memebank Dashboard
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Deposit memecoin collateral and borrow stablecoins
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {!isConnected ? (
                        <Button
                            onClick={handleConnect}
                            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white 
                                 px-6 py-6 font-bold text-lg rounded-xl font-medium hover:shadow-lg 
                                 hover:shadow-pink-500/25 transition-all duration-300
                                 hover:scale-105 flex items-center gap-2"
                        >
                            <Wallet className="w-4 h-4" />
                            Connect Wallet
                        </Button>
                    ) : (
                        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-pink-500/20 px-4 py-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                                <span className="text-white">
                                    {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {!isConnected ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                >
                    <Card className="bg-gray-900/40 backdrop-blur-xl border border-pink-500/20 
                               rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5" />
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

                        <CardContent className="relative flex flex-col items-center gap-6 p-16">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 p-[2px]"
                            >
                                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                                    <AlertCircle className="h-8 w-8 text-pink-500" />
                                </div>
                            </motion.div>

                            <div className="text-center space-y-3">
                                <h2 className="text-2xl font-bold text-transparent bg-clip-text 
                                         bg-gradient-to-r from-pink-400 to-pink-600">
                                    Connect Wallet to Continue
                                </h2>
                                <p className="text-gray-400">
                                    Please connect your wallet to access Memebank features
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Your Collateral"
                            value={`${userStats.collateral} DOGE`}
                            subtitle="Total Collateral"
                            icon={Coins}
                            gradient="bg-gradient-to-r from-pink-500/20 to-pink-600/20"
                        />
                        <StatCard
                            title="Your Borrowed"
                            value={`${userStats.borrowed} USDT`}
                            subtitle="Current Loan"
                            icon={ArrowDownUp}
                            gradient="bg-gradient-to-r from-rose-500/20 to-rose-600/20"
                        />
                        <StatCard
                            title="Your Deposits"
                            value={`${userStats.deposited} USDT`}
                            subtitle="Total Deposits"
                            icon={PiggyBank}
                            gradient="bg-gradient-to-r from-fuchsia-500/20 to-fuchsia-600/20"
                        />
                        <Card className="bg-[#0d1117] backdrop-blur-xl border border-pink-500/20 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-pink-400">Platform Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Total Deposits</span>
                                    <span className="text-white font-medium">
                                        {platformStats.totalDeposits} USDT
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">DOGE Price</span>
                                    <span className="text-white font-medium">
                                        ${platformStats.currentPrice}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Collateral Ratio</span>
                                    <span className="text-white font-medium">
                                        {platformStats.collateralRatio}%
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-[#0d1117] backdrop-blur-xl border border-pink-500/20 rounded-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5" />
                            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-transparent bg-clip-text 
                                           bg-gradient-to-r from-pink-400 to-pink-600">
                                    Deposit & Borrow
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative space-y-6">
                                {inputFields.slice(0, 2).map(field => (
                                    <div key={field.name} className="space-y-2">
                                        <label className="text-pink-400 text-sm font-medium">
                                            {field.label}
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                className="flex-1 p-3 bg-gray-800/50 border border-pink-500/20 
                                                 rounded-xl text-white focus:outline-none focus:ring-2 
                                                 focus:ring-pink-500"
                                                placeholder="Enter amount"
                                            />
                                            <Button className="bg-pink-500 hover:bg-pink-600 text-white px-6 
                                                     rounded-xl transition-all duration-300">
                                                {field.buttonText}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="bg-[#0d1117] backdrop-blur-xl border border-pink-500/20 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-transparent bg-clip-text 
                             bg-gradient-to-r from-pink-400 to-pink-600">
                                    Lending & Repayment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative space-y-6">
                                {inputFields.slice(2).map(renderInputField)}

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-8 p-6 rounded-xl bg-[#161b22] border border-pink-500/20"
                                >
                                    <h3 className="text-lg font-semibold text-pink-400 mb-4">Repayment Details</h3>
                                    <div className="space-y-3 text-gray-300">
                                        <div className="flex justify-between items-center">
                                            <span>Total Amount Due:</span>
                                            <span className="font-mono text-pink-400">{repaymentDetails.repaymentAmount} USDT</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Principal:</span>
                                            <span className="font-mono text-pink-400">{repaymentDetails.principal} USDT</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Interest:</span>
                                            <span className="font-mono text-pink-400">{repaymentDetails.interest} USDT</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Deadline:</span>
                                            <span className="font-mono text-pink-400">
                                                {repaymentDetails.deadline > 0 ?
                                                    new Date(repaymentDetails.deadline).toLocaleString() :
                                                    'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Status:</span>
                                            <span className="font-mono text-pink-400">{repaymentDetails.status}</span>
                                        </div>

                                        <Button
                                            onClick={async () => {
                                                const details = await contractService.calculateRepaymentAmount(userAddress);
                                                setRepaymentDetails(prev => ({
                                                    ...prev,
                                                    repaymentAmount: details.totalRepayment,
                                                    principal: details.principal,
                                                    interest: details.interestAmount
                                                }));
                                            }}
                                            className="w-full mt-6 bg-gradient-to-r from-pink-500 to-pink-600 
                             text-white font-semibold py-3 rounded-xl
                             transform hover:scale-[1.02] transition-all duration-300 
                             hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]"
                                        >
                                            Calculate Latest Repayment
                                        </Button>
                                    </div>
                                </motion.div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    gradient: string;
}

const StatCard = ({ title, value, subtitle, icon: Icon, gradient }: StatCardProps) => (
    <Card className="bg-[#0d1117] backdrop-blur-xl border border-pink-500/20 rounded-2xl 
                    hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300 
                    hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-pink-400">
                {title}
            </CardTitle>
            <div className={`w-10 h-10 rounded-xl ${gradient} p-2 
                           flex items-center justify-center`}>
                <Icon className="h-5 w-5 text-pink-400" />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-white">
                {value}
            </div>
            <p className="text-xs text-gray-400 mt-1">
                {subtitle}
            </p>
        </CardContent>
    </Card>
);

export default UniDashboard;