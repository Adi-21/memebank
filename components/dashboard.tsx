'use client';

import { useState, useEffect, useCallback } from 'react';
import { ContractService } from '@/utils/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wallet, Coins, PiggyBank, ArrowDownUp } from 'lucide-react';
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
        <div className="p-4 max-w-full mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-black/40 p-6 rounded-2xl backdrop-blur-lg border border-[#0066FF]/20"
            >
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#0066FF] to-[#0066FF]">
                        Memebank Dashboard
                    </h1>
                    <p className="text-lg text-white/60">
                        Deposit memecoin collateral and borrow stablecoins
                    </p>
                </motion.div>
    
                <div className="flex items-center gap-4">
                    {isConnected ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-black/60 backdrop-blur-md rounded-xl border border-[#0066FF]/30 p-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
                                <div>
                                    <p className="text-white font-medium">
                                        {formatAddress(userAddress)}
                                    </p>
                                    <p className="text-[#0099FF] text-sm">
                                        {chainId === 84532 ? 'Base Sepolia' : `Chain ID: ${chainId}`}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                onClick={connectWallet}
                                className="h-12 px-8 bg-gradient-to-r from-[#0066FF] via-[#0099FF] to-[#0066FF] 
                                         text-white font-semibold rounded-lg transition-all duration-300 
                                         hover:shadow-[0_0_20px_rgba(0,153,255,0.5)]"
                            >
                                Connect Wallet
                            </Button>
                        </motion.div>
                    )}
                </div>
            </motion.div>
    
            {isConnected ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <Card className="bg-black/40 backdrop-blur-lg border border-[#0066FF]/20 hover:shadow-[0_0_20px_rgba(0,153,255,0.15)] transition-all duration-300">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-white/80">
                                            {stat.title}
                                        </CardTitle>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0066FF] to-[#0066FF] p-[1px]">
                                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                                <stat.icon className="h-4 w-4 text-[#0099FF]" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0066FF] to-[#0066FF]">
                                            {stat.value}
                                        </div>
                                        <p className="text-xs text-white/60">
                                            {stat.subtitle}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
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