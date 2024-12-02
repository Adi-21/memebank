'use client';

import { useState, useEffect, useCallback } from 'react';
import { ContractService } from '@/utils/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wallet, Coins, PiggyBank, ArrowDownUp } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ethers } from 'ethers';
import { AnimatePresence, motion } from 'framer-motion';
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
            // Get all data in parallel with error handling for each call
            const [userData, platformData, repaymentInfo] = await Promise.allSettled([
                contractService.getUserData(userAddress),
                contractService.getPlatformStats(),
                contractService.getFormattedRepaymentAmount(userAddress)
            ]);

            // Update states only for successful calls
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
            // Only show toast for critical errors
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

            // Wait for transaction confirmation
            await tx.wait();

            // Clear input
            setInputAmounts(prev => ({
                ...prev,
                [type === 'deposit' ? 'depositCollateral' : `${type}Amount`]: ''
            }));

            // Update data with retries
            const retryCount = 3;
            for (let i = 0; i < retryCount; i++) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // Increasing delays
                    await loadData();
                    break; // Exit loop if successful
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
                    // Get initial price
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

            // Update data every 30 seconds
            const dataInterval = setInterval(loadData, 30000);

            // Update price every 5 seconds
            const priceInterval = setInterval(async () => {
                try {
                    const price = await contractService.getOraclePrice();
                    console.log('Price update:', price); // Debug log
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
        {
            title: 'Collateral',
            value: userStats.collateral,
            subtitle: 'DOGE',
            icon: Wallet,
            gradient: 'from-blue-500/20 to-blue-600/20',
            textColor: 'text-blue-400'
        },
        {
            title: 'Borrowed',
            value: userStats.borrowed,
            subtitle: 'USDT',
            icon: Coins,
            gradient: 'from-purple-500/20 to-purple-600/20',
            textColor: 'text-purple-400'
        },
        {
            title: 'Deposited',
            value: userStats.deposited,
            subtitle: 'USDT',
            icon: PiggyBank,
            gradient: 'from-green-500/20 to-green-600/20',
            textColor: 'text-green-400'
        },
        {
            title: 'DOGE Price',
            value: platformStats.currentPrice && platformStats.currentPrice !== '0'
                ? `$${Number(platformStats.currentPrice).toFixed(6)}`
                : 'Loading...',
            subtitle: 'DOGE/USDT',
            icon: ArrowDownUp,
            gradient: 'from-cyan-500/20 to-cyan-600/20',
            textColor: 'text-cyan-400'
        }
    ];

    // const renderInputField = ({ label, name, type, buttonColor, buttonText, loadingText }: InputField) => (
    //     <div key={name}>
    //         <label htmlFor={name} className="block text-sm font-medium mb-1">
    //             {label}
    //         </label>
    //         <div className="flex gap-2">
    //             <input
    //                 type="number"
    //                 id={name}
    //                 name={name}
    //                 value={inputAmounts[name as keyof typeof inputAmounts]}
    //                 onChange={handleInputChange}
    //                 className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    //                 placeholder="Amount"
    //                 disabled={!isConnected || isLoading[type]}
    //                 min="0"
    //                 step="any"
    //             />
    //             <Button
    //                 onClick={() => handleTransaction(type, inputAmounts[name as keyof typeof inputAmounts])}
    //                 disabled={!isConnected || isLoading[type] || !inputAmounts[name as keyof typeof inputAmounts]}
    //                 className={`${buttonColor} w-28`}
    //             >
    //                 {isLoading[type] ? loadingText : buttonText}
    //             </Button>
    //         </div>
    //     </div>
    // );

    const formatAddress = (address: string) => {
        return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-center mb-8 p-6 
                         bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-blue-500/20"
            >
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text 
                                 bg-gradient-to-r from-blue-400 to-blue-600">
                        Memebank Dashboard
                    </h1>
                    <p className="text-gray-400">
                        Deposit memecoin collateral and borrow stablecoins
                    </p>
                </div>

                {/* Connection Status */}
                <div className="mt-4 md:mt-0">
                    {isConnected ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-3 px-4 py-2 bg-gray-700/50 
                                     backdrop-blur-lg rounded-xl border border-blue-500/20"
                        >
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <div>
                                <p className="text-white font-medium">{formatAddress(userAddress)}</p>
                                <p className="text-sm text-blue-400">
                                    {chainId === 84532 ? 'Base Sepolia' : `Chain ID: ${chainId}`}
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <Button
                            onClick={connectWallet}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white 
                                        px-6 py-6 mb-2 font-bold text-lg rounded-xl hover:shadow-lg 
                                        hover:shadow-blue-500/25 transition-all duration-300
                                        hover:scale-105"
                        >
                            <Wallet className="w-4 h-4" />
                            Connect Wallet
                        </Button>
                    )}
                </div>
            </motion.div>

            {isConnected ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <AnimatePresence>
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <Card className="group bg-gray-800/40 backdrop-blur-xl border border-blue-500/20 
                                         rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-blue-500/10 
                                         transition-all duration-300 hover:-translate-y-1">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className={`text-sm font-medium ${stat.textColor}`}>
                                                {stat.title}
                                            </CardTitle>
                                            <motion.div
                                                whileHover={{ rotate: 15 }}
                                                className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.gradient} 
                                                p-2 flex items-cent er justify-center group-hover:shadow-lg 
                                                transition-all duration-300`}
                                            >
                                                <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                                            </motion.div>
                                        </CardHeader>
                                        <CardContent>
                                            <motion.div
                                                initial={{ scale: 1 }}
                                                whileHover={{ scale: 1.02 }}
                                                className="text-2xl font-bold text-white"
                                            >
                                                {stat.value}
                                            </motion.div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {stat.subtitle}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
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
                    <Card className="bg-black/40 backdrop-blur-lg border border-[#0066FF]/20 overflow-hidden relative">
                        <motion.div
                            className="absolute inset-0 opacity-10"
                            animate={{
                                background: [
                                    'radial-gradient(circle at 0% 0%, #0066FF, transparent)',
                                    'radial-gradient(circle at 100% 100%, #0066FF, transparent)',
                                    'radial-gradient(circle at 0% 0%, #0066FF, transparent)'
                                ]
                            }}
                            transition={{ duration: 10, repeat: Infinity }}
                        />
                        <CardContent className="relative z-10 flex flex-col items-center gap-6 p-12">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 rounded-full bg-gradient-to-r from-[#0066FF] to-[#0066FF] p-[2px]"
                            >
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                    <AlertCircle className="h-8 w-8 text-[#0099FF]" />
                                </div>
                            </motion.div>
                            <div className="text-center space-y-3">
                                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0066FF] to-[#0066FF]">
                                    Connect Wallet to Continue
                                </h2>
                                <p className="text-lg text-white/60">
                                    Please connect your wallet to access Memebank features
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}