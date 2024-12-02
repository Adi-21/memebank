import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
    Rocket,
    Shield,
    Wallet,
    Coins,
    ArrowRight,
    Lock,
    BarChart3,
    PiggyBank,
    Github,
    Twitter,
    Globe,
    Zap,
    LayoutGrid
} from 'lucide-react';
import Image from 'next/image';
import { VideoBackground } from './VideoBackground';

interface NetworkSelectorProps {
    onSelect: (chainId: number) => void;
}

interface Network {
    name: string;
    chainId: number;
    description: string;
    logo: string;
    gradient: string;
    stats: {
        tvl: string;
        users: string;
        apy: string;
    };
}

const networks: Network[] = [
    {
        name: "Base Sepolia",
        chainId: 84532,
        description: "Base Network Testnet - Experience lightning-fast transactions with minimal fees",
        logo: "/baselogo.png",
        gradient: "from-[#0066FF] via-[#0099FF] to-[#00CCFF]",
        stats: {
            tvl: "$2.1M",
            users: "12.5K",
            apy: "12.8%"
        }
    },
    {
        name: "Unichain Sepolia",
        chainId: 1301,
        description: "Unichain Network Testnet - Advanced DeFi features with enhanced security",
        logo: "/unichainlogo.png",
        gradient: "from-[#FFFFFF] via-[#FFE4E9] to-[#FFD6E0]",
        stats: {
            tvl: "$1.8M",
            users: "10.2K",
            apy: "14.2%"
        }
    }
];

const Navbar = () => (
    <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-white/10"
    >
        <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-2">
                        {/* <LayoutGrid className="w-6 h-6 text-[#0066FF]" /> */}
                        <Image
                            src="/memebank.png"
                            alt="Memebank Logo"
                            width={30}
                            height={30}
                        />
                        <span className="text-xl font-bold text-white">MEMEBANK</span>
                    </div>
                    <div className="hidden md:flex space-x-6">
                        {['Features', 'Networks', 'Stats'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase()}`}
                                className="text-gray-300 hover:text-white transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>
                </div>
                <Button
                    className="bg-gradient-to-r from-[#0066FF] to-[#00CCFF] hover:opacity-90"
                >
                    <Wallet className="w-4 h-4 mr-2" />
                    Launch App
                </Button>
            </div>
        </div>
    </motion.nav>
);

const NetworkCard = ({ network, onSelect }: { network: any, onSelect: (chainId: number) => void }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
    >
        <Card
            className="bg-black/40 backdrop-blur-lg border border-[#0066FF]/20 overflow-hidden relative cursor-pointer group"
            onClick={() => onSelect(network.chainId)}
        >
            <div className={`absolute inset-0 bg-gradient-to-r ${network.gradient} opacity-10 
                            group-hover:opacity-20 transition-opacity duration-300`} />

            <div className="p-6 relative">
                <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${network.gradient} 
                                   group-hover:scale-110 transition-transform duration-300`}>
                        <Image
                            src={network.logo}
                            alt={`${network.name} logo`}
                            width={24}
                            height={24}
                            className="w-6 h-6"
                        />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">
                            {network.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm text-gray-400">Live</span>
                        </div>
                    </div>
                </div>

                <p className="text-gray-300 mb-6">
                    {network.description}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 rounded-lg bg-white/5 backdrop-blur-sm">
                        <div className="text-lg font-bold text-white">{network.stats.tvl}</div>
                        <div className="text-sm text-gray-400">TVL</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5 backdrop-blur-sm">
                        <div className="text-lg font-bold text-white">{network.stats.users}</div>
                        <div className="text-sm text-gray-400">Users</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5 backdrop-blur-sm">
                        <div className="text-lg font-bold text-white">{network.stats.apy}</div>
                        <div className="text-sm text-gray-400">APY</div>
                    </div>
                </div>

                <Button
                    className={`w-full text-[#000] bg-gradient-to-r ${network.gradient} hover:opacity-90
                               transform group-hover:-translate-y-1 transition-all duration-300`}
                >
                    Launch on {network.name}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
            </div>
        </Card>
    </motion.div>
);

const Features = () => {
    const features = [
        {
            icon: Lock,
            title: "Secure Protocol",
            description: "Multiple security audits with time-tested smart contracts"
        },
        {
            icon: Coins,
            title: "Instant Loans",
            description: "Borrow stablecoins instantly against your meme tokens"
        },
        {
            icon: BarChart3,
            title: "Analytics",
            description: "Real-time data tracking for informed decisions"
        },
        {
            icon: PiggyBank,
            title: "Yield Generation",
            description: "Earn passive income while holding your assets"
        }
    ];

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card className="bg-black/40 border-[#0066FF]/20 p-6 hover:border-[#0066FF]/40 transition-colors">
                        <feature.icon className="w-8 h-8 mb-4 text-[#0066FF]" />
                        <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-gray-400">{feature.description}</p>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
};

export const NetworkSelector = ({ onSelect }: NetworkSelectorProps) => {
    return (
        <>
            {/* <VideoBackground videoSrc="/base.mp4" /> */}
            <div className="min-h-screen bg-black/60 text-white">
                {/* Animated Background Gradient */}
                {/* <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,_#0066FF33_0%,_transparent_50%)] opacity-50" /> */}
                <VideoBackground videoSrc="/base.mp4" />

                <Navbar />

                {/* Hero Section */}
                <section className="pt-32 pb-20 relative">
                    <div className="container mx-auto px-6">
                        <div className="max-w-3xl mx-auto text-center mb-20">
                            <motion.h1
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent 
                                        bg-gradient-to-r from-[#0066FF] to-[#00CCFF]"
                            >
                                Unleash Your Meme Assets
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-xl text-gray-400"
                            >
                                Stake your favorite meme tokens as collateral and unlock their true potential
                                with instant stablecoin loans
                            </motion.p>
                        </div>

                        <Features />
                    </div>
                </section>

                {/* Networks Section */}
                <section className="py-20 bg-black/30 relative" id="networks">
                    <div className="container mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-3xl font-bold mb-4">Available Networks</h2>
                            <p className="text-gray-400">Choose your preferred network to begin</p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            {networks.map((network) => (
                                <NetworkCard
                                    key={network.chainId}
                                    network={network}
                                    onSelect={onSelect}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-12 border-t border-white/10">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="text-gray-400">
                                © 2024 Memebank. All rights reserved.
                            </div>
                            <div className="flex gap-6">
                                <Github className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                                <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                                <Globe className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default NetworkSelector;