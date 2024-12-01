'use client';

import { useState, useEffect, useCallback } from 'react';
import { UniContractService } from '@/utils/UniContractService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wallet, Coins, PiggyBank, ArrowDownUp } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

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
            <label className="text-sm font-medium">{field.label}</label>
            <div className="flex gap-2">
                <input
                    type="number"
                    value={inputAmounts[field.name as keyof typeof inputAmounts]}
                    onChange={(e) => setInputAmounts(prev => ({ ...prev, [field.name]: e.target.value }))}
                    className="flex-1 rounded-md border p-2"
                    placeholder="0.0"
                    min="0"
                    step="0.01"
                />
                <Button
                    onClick={() => handleTransaction(field.type, inputAmounts[field.name as keyof typeof inputAmounts])}
                    disabled={isLoading[field.type]}
                    className={field.buttonColor}
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
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Unichain Memebank</h1>
                {!isConnected ? (
                    <Button onClick={handleConnect} className="bg-blue-500 hover:bg-blue-600">
                        <Wallet className="w-4 h-4 mr-2" />
                        Connect Wallet
                    </Button>
                ) : (
                    <div className="text-sm">
                        Connected: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                    </div>
                )}
            </div>

            {!isConnected ? (
                <Card className="p-8 text-center">
                    <CardContent className="flex flex-col items-center gap-4">
                        <AlertCircle className="h-12 w-12 text-gray-400" />
                        <h2 className="text-xl font-semibold">Connect Wallet to Continue</h2>
                        <p className="text-gray-600">Please connect your wallet to access Memebank features</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            title="Your Collateral"
                            value={`${userStats.collateral} DOGE`}
                            icon={Coins}
                        />
                        <StatCard
                            title="Your Borrowed"
                            value={`${userStats.borrowed} USDT`}
                            icon={ArrowDownUp}
                        />
                        <StatCard
                            title="Your Deposits"
                            value={`${userStats.deposited} USDT`}
                            icon={PiggyBank}
                        />
                        <Card>
                            <CardHeader>
                                <CardTitle>Platform Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p>Total Deposits: {platformStats.totalDeposits} USDT</p>
                                <p>DOGE Price: ${platformStats.currentPrice}</p>
                                <p>Collateral Ratio: {platformStats.collateralRatio}%</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Deposit & Borrow</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {inputFields.slice(0, 2).map(renderInputField)}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Lending & Repayment</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {inputFields.slice(2).map(renderInputField)}
                                <div>
                                    <p className="text-sm font-medium mb-1">Repayment Details</p>
                                    <div className="text-gray-600">
                                        <p>Total Amount Due: {repaymentDetails.repaymentAmount} USDT</p>
                                        <p>Principal: {repaymentDetails.principal} USDT</p>
                                        <p>Interest: {repaymentDetails.interest} USDT</p>
                                        <p>Deadline: {repaymentDetails.deadline > 0 ? 
                                            new Date(repaymentDetails.deadline).toLocaleString() : 
                                            'N/A'}
                                        </p>
                                        <p>Status: {repaymentDetails.status}</p>
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
                                            className="mt-2 bg-blue-500 hover:bg-blue-600"
                                        >
                                            Calculate Latest Repayment
                                        </Button>
                                    </div>
                                </div>
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
    icon: any;
}

const StatCard = ({ title, value, icon: Icon }: StatCardProps) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default UniDashboard;