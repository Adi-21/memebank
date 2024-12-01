'use client';

import { useState } from 'react';
import { ContractService } from '@/utils/contract';

interface ConnectWalletProps {
    contractService: ContractService;
    setUserAddress: (address: string) => void;
    setIsConnected: (connected: boolean) => void;
}

export default function ConnectWallet({
    contractService,
    setUserAddress,
    setIsConnected
}: ConnectWalletProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [networkInfo, setNetworkInfo] = useState({
        name: '',
        chainId: ''
    });
    const [displayAddress, setDisplayAddress] = useState('');

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const connectWallet = async () => {
        setIsLoading(true);
        setError('');
        try {
            const { address, network } = await contractService.connectWallet();
            setUserAddress(address);
            setDisplayAddress(formatAddress(address));
            setNetworkInfo({
                name: network.name,
                chainId: network.chainId.toString()
            });
            setIsConnected(true);
        } catch (err) {
            setError('Failed to connect wallet');
            console.error(err);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <button
                onClick={connectWallet}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </button>
            {displayAddress && (
                <div className="text-center">
                    <p className="text-sm font-medium">Connected Address: {displayAddress}</p>
                    <p className="text-sm text-gray-600">
                        Network: {networkInfo.name} (Chain ID: {networkInfo.chainId})
                    </p>
                </div>
            )}
            {error && <p className="text-red-500">{error}</p>}
        </div>
    );
} 