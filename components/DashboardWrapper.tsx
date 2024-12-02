'use client';

import { useState, useCallback } from 'react';
import { NetworkSelector } from './NetworkSelector';
import MemeDashboard from './dashboard';
import { UniDashboard } from './Unidashboard';
import { Button } from './ui/button';
import { ArrowLeftRight } from 'lucide-react';

export const DashboardWrapper: React.FC = () => {
    const [selectedChainId, setSelectedChainId] = useState<number | null>(null);

    const handleNetworkSelect = useCallback((chainId: number) => {
        setSelectedChainId(chainId);
    }, []);

    const handleNetworkSwitch = useCallback(() => {
        setSelectedChainId(null);
    }, []);

    if (!selectedChainId) {
        return <NetworkSelector onSelect={handleNetworkSelect} />;
    }

    const isBaseSepolia = selectedChainId === 84532;

    return (
        <div className="relative min-h-screen bg-gradient-to-b from-gray-900 to-black">
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                <Button
                    onClick={() => setSelectedChainId(null)}
                    className={`h-12 px-6 rounded-lg font-semibold transition-all duration-300 
                        ${selectedChainId === 84532
                            ? 'bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500'
                            : 'bg-gradient-to-r from-pink-600 to-red-400 hover:from-pink-700 hover:to-red-500'
                        } transform hover:-translate-y-1 hover:shadow-lg`}
                    aria-label="Switch Network"
                >
                    <ArrowLeftRight className="mr-2 h-5 w-5" />
                    <span className="text-white text-sm md:text-base">
                        Switch Network
                    </span>
                </Button>
            </div>
            <main className="pt-4 pb-24 px-4 max-w-7xl mx-auto">
                {isBaseSepolia ? <MemeDashboard /> : <UniDashboard />}
            </main>
        </div>
    );
};

