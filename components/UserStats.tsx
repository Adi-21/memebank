'use client';

import { useState, useEffect } from 'react';
import { ContractService } from '@/utils/contract';
import { ethers } from 'ethers';

interface UserStatsProps {
    contractService: ContractService;
    userAddress: string;
}

export default function UserStats({ contractService, userAddress }: UserStatsProps) {
    const [stats, setStats] = useState({
        collateralAmount: '0',
        borrowedAmount: '0',
        usdtBalance: '0',
        dogeBalance: '0',
        collateralValue: '0'
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const userInfo = await contractService.getUserInfo(userAddress);
                const usdtBalance = await contractService.getUSDTBalance(userAddress);
                const dogeBalance = await contractService.getDOGEBalance(userAddress);
                const collateralValue = await contractService.getCollateralValue(userAddress);

                setStats({
                    collateralAmount: contractService.parseAmount(userInfo.collateralAmount),
                    borrowedAmount: contractService.parseAmount(userInfo.borrowedAmount),
                    usdtBalance: contractService.parseAmount(usdtBalance, 6), // USDT uses 6 decimals
                    dogeBalance: contractService.parseAmount(dogeBalance),
                    collateralValue: contractService.parseAmount(collateralValue)
                });
            } catch (err) {
                console.error('Error fetching user stats:', err);
            }
        };

        if (userAddress) {
            fetchStats();
        }
    }, [userAddress, contractService]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Your Position</h2>
            <div className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-gray-600">Collateral:</span>
                    <span className="font-medium">{stats.collateralAmount} DOGE</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Borrowed:</span>
                    <span className="font-medium">{stats.borrowedAmount} USDT</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">USDT Balance:</span>
                    <span className="font-medium">{stats.usdtBalance} USDT</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">DOGE Balance:</span>
                    <span className="font-medium">{stats.dogeBalance} DOGE</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Collateral Value:</span>
                    <span className="font-medium">${stats.collateralValue}</span>
                </div>
            </div>
        </div>
    );
} 