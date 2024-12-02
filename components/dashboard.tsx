'use client';

import { useState, useEffect, useCallback } from 'react';
import { ContractService } from '@/utils/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wallet, Coins, PiggyBank, ArrowDownUp, LayoutGrid } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import { DepositBorrow } from './deposit-borrow';
import { LendingRepayment } from './lending-repayment';

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

export default function MemeDashboard() {
    const { toast } = useToast();
    const [contractService] = useState(() => new ContractService());
    const [userAddress, setUserAddress] = useState<string>('');
    const [isConnected, setIsConnected] = useState(false);
    const [chainId, setChainId] = useState<number>(0);

    const [repaymentDetails, setRepaymentDetails] = useState({
        repaymentAmount: '0',
        principal: '0',
        interest: '0',
        deadline: 0,
        status: 'No active loan'
    });

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
        collateralRatio: '0'
    });

    const loadData = useCallback(async () => {
        if (!isConnected || !userAddress) return;

        try {
            const [userData, platformData, repaymentInfo] = await Promise.allSettled([
                contractService.getUserData(userAddress),
                contractService.getPlatformStats(),
                contractService.getFormattedRepaymentAmount(userAddress)
            ]);

            if (userData.status === 'fulfilled') {
                setUserStats(prev => ({
                    ...prev,
                    collateral: userData.value.collateralAmount,
                    borrowed: userData.value.borrowedAmount,
                    deposited: userData.value.stableDeposited
                }));
            }

            if (platformData.status === 'fulfilled') {
                setPlatformStats(prev => ({
                    ...prev,
                    totalDeposits: platformData.value.totalDeposits,
                    totalBorrowed: platformData.value.totalBorrowed,
                    currentPrice: platformData.value.currentPrice,
                    isEmergency: platformData.value.isEmergency,
                    collateralRatio: platformData.value.collateralRatio
                }));
            }

            if (repaymentInfo.status === 'fulfilled') {
                setRepaymentDetails(repaymentInfo.value);
            }

        } catch (error) {
            console.error('Error loading data:', error);
            if (error instanceof Error && !error.message.includes('user rejected')) {
                toast({
                    title: 'Error loading data',
                    description: 'Some data may be outdated',
                    variant: 'destructive'
                });
            }
        }
    }, [userAddress, isConnected, contractService, toast]);

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

            const retryCount = 3;
            for (let i = 0; i < retryCount; i++) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
                    await loadData();
                    break;
                } catch (err) {
                    if (i === retryCount - 1) console.error('Failed to refresh data:', err);
                }
            }

            toast({
                title: 'Transaction Successful',
                description: `${type.charAt(0).toUpperCase() + type.slice(1)} completed successfully`
            });

        } catch (error) {
            console.error(`${type} error:`, error);
            toast({
                title: 'Transaction Failed',
                description: error instanceof Error ? error.message : 'Please try again later',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(prev => ({ ...prev, [type]: false }));
        }
    };

    useEffect(() => {
        if (isConnected) {
            const fetchData = async () => {
                try {
                    await loadData();
                    const initialPrice = await contractService.getOraclePrice();
                    if (initialPrice !== '0') {
                        setPlatformStats(prev => ({
                            ...prev,
                            currentPrice: initialPrice
                        }));
                    }
                } catch (error) {
                    console.error('Error in initial data fetch:', error);
                }
            };

            fetchData();

            const dataInterval = setInterval(loadData, 30000);
            const priceInterval = setInterval(async () => {
                try {
                    const price = await contractService.getOraclePrice();
                    if (price !== '0') {
                        setPlatformStats(prev => ({
                            ...prev,
                            currentPrice: price
                        }));
                    }
                } catch (error) {
                    console.error('Error updating price:', error);
                }
            }, 5000);

            return () => {
                clearInterval(dataInterval);
                clearInterval(priceInterval);
            };
        }
    }, [isConnected, loadData, contractService]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (value === '' || Number(value) >= 0) {
            setInputAmounts(prev => ({ ...prev, [name]: value }));
        }
    };

    const connectWallet = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const network = await provider.getNetwork();

            setUserAddress(address);
            setChainId(Number(network.chainId));
            setIsConnected(true);
        } catch (error) {
            console.error('Error connecting wallet:', error);
            toast({
                title: 'Connection Failed',
                description: 'Failed to connect wallet',
                variant: 'destructive'
            });
        }
    };

    const stats = [
        { title: 'Collateral', value: userStats.collateral, subtitle: 'DOGE', icon: Wallet },
        { title: 'Borrowed', value: userStats.borrowed, subtitle: 'USDT', icon: Coins },
        { title: 'Deposited', value: userStats.deposited, subtitle: 'USDT', icon: PiggyBank },
        {
            title: 'DOGE Price',
            value: platformStats.currentPrice && platformStats.currentPrice !== '0'
                ? `$${Number(platformStats.currentPrice).toFixed(6)}`
                : 'Loading...',
            subtitle: 'DOGE/USDT',
            icon: ArrowDownUp
        }
    ];

    const formatAddress = (address: string) => {
        return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
    };

    return (
        <div className="min-h-screen bg-[#030712]">
            {/* Animated Background */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center">
                            <div className="flex items-center gap-2">
                                <LayoutGrid className="h-8 w-8 text-blue-500" />
                                <span className="text-xl font-bold text-white">MEMEBANK</span>
                            </div>
                        </div>

                        {!isConnected ? (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    onClick={connectWallet}
                                    className="bg-gradient-to-r from-[#0066FF] to-[#00CCFF] text-white px-6 h-10 rounded-lg
                                                flex items-center gap-2 transition-all duration-300
                                                hover:shadow-[0_0_20px_rgba(0,153,255,0.5)]"
                                >
                                    <Wallet className="w-4 h-4" />
                                    Connect Wallet
                                </Button>
                            </motion.div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <div>
                                            <p className="text-white font-medium">
                                                {formatAddress(userAddress)}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {chainId === 84532 ? 'Base Sepolia' : `Chain ID: ${chainId}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <main className="pt-24 p-4 max-w-7xl mx-auto">
                {isConnected ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <Card className="bg-white/5 border-white/10 hover:border-white/20 
                                                    transition-all duration-300">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-sm font-medium text-gray-400">
                                                {stat.title}
                                            </CardTitle>
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                <stat.icon className="h-4 w-4 text-blue-400" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-white">
                                                {stat.value}
                                            </div>
                                            <p className="text-sm text-gray-400">
                                                {stat.subtitle}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Transaction Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DepositBorrow
                                inputFields={inputFields}
                                inputAmounts={inputAmounts}
                                handleInputChange={handleInputChange}
                                handleTransaction={handleTransaction}
                                isConnected={isConnected}
                                isLoading={isLoading}
                            />
                            <LendingRepayment
                                inputFields={inputFields}
                                inputAmounts={inputAmounts}
                                handleInputChange={handleInputChange}
                                handleTransaction={handleTransaction}
                                isConnected={isConnected}
                                isLoading={isLoading}
                                repaymentDetails={repaymentDetails}
                                calculateRepayment={async () => {
                                    const details = await contractService.calculateRepaymentAmount(userAddress);
                                    setRepaymentDetails({
                                        ...repaymentDetails,
                                        repaymentAmount: details.totalRepayment,
                                        principal: details.principal,
                                        interest: details.interestAmount
                                    });
                                }}
                            />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="max-w-lg mx-auto bg-white/5 border-white/10 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
                            <CardContent className="relative z-10 flex flex-col items-center gap-6 p-12">
                                <div className="text-center space-y-4">
                                    <h2 className="text-2xl font-bold text-white">
                                        Welcome to MemeBank
                                    </h2>
                                    <p className="text-lg text-gray-400">
                                        Connect your wallet to access MemeBank features and start managing your assets.
                                    </p>
                                    <Button
                                        onClick={connectWallet}
                                        className="bg-gradient-to-r from-[#0066FF] to-[#00CCFF] text-white px-8 py-4 rounded-lg
                                                    flex items-center justify-center gap-2 transition-all duration-300
                                                    hover:shadow-[0_0_20px_rgba(0,153,255,0.5)] w-full"
                                    >
                                        <Wallet className="w-5 h-5" />
                                        Connect Wallet
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </main>
        </div>
    );
}

