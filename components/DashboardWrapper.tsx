'use client';

import { useState } from 'react';
import { NetworkSelector } from './NetworkSelector';
import MemeDashboard from './dashboard';
import { UniDashboard } from './Unidashboard';
import { Button } from './ui/button';

export const DashboardWrapper = () => {
    const [selectedChainId, setSelectedChainId] = useState<number | null>(null);

    const handleNetworkSelect = (chainId: number) => {
        setSelectedChainId(chainId);
    };

    if (!selectedChainId) {
        return <NetworkSelector onSelect={handleNetworkSelect} />;
    }

    return (
        <>
            <div className="fixed top-14 right-56 z-10">
                <Button 
                    onClick={() => setSelectedChainId(null)}
                    className={`h-12 px-6 relative overflow-hidden rounded-lg font-semibold transition-all duration-300 
                        ${selectedChainId === 84532 
                            ? 'bg-gradient-to-r from-[#0066FF] via-[#0099FF] to-[#00CCFF] hover:shadow-[0_0_20px_rgba(0,153,255,0.5)]' 
                            : 'bg-gradient-to-r from-[#FF1A75] via-[#FF3366] to-[#FF4D4D] hover:shadow-[0_0_20px_rgba(255,51,102,0.5)]'
                        } transform hover:-translate-y-1`}
                >
                    <span className="text-white text-lg">
                        Switch Network
                    </span>
                </Button>
            </div>
            {selectedChainId === 84532 ? <MemeDashboard /> : <UniDashboard />}
        </>
    );
}; 