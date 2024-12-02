'use client';

import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { createConfig } from 'wagmi';
import { http } from 'viem';
import { sepolia, baseSepolia } from 'viem/chains';

export const wagmiConfig = createConfig({
    chains: [baseSepolia, sepolia],
    multiInjectedProviderDiscovery: false,
    transports: {
        [baseSepolia.id]: http(),
        [sepolia.id]: http()
    }
});

export const dynamicSettings = {
    environmentId: "4840b453-3349-41c8-a9bc-915534506cb9",
    walletConnectors: [EthereumWalletConnectors],
    walletConnectorExtensions: []
};