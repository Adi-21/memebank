'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { VideoBackground } from "./VideoBackground";

interface Network {
    name: string;
    logo: string;
    chainId: number;
    description: string;
    gradient: string;
}

// Define our color palette
const colors = {
    pink: '#FF3366',    // Vibrant pink
    blue: '#0099FF',    // Electric blue
    green: '#00FF9D',   // Neon green
};

const networks: Network[] = [
    {
        name: "Base Sepolia",
        logo: "/baselogo.png",
        chainId: 84532,
        description: "Base Network Testnet for Memebank",
        gradient: "from-[#0066FF] via-[#0099FF] to-[#00CCFF]" // Blue gradient
    },
    {
        name: "Unichain Sepolia",
        logo: "/unichainlogo.png",
        chainId: 1301,
        description: "Unichain Network Testnet for Memebank",
        gradient: "from-[#FF1A75] via-[#FF3366] to-[#FF4D4D]" // Pink gradient
    }
];

interface NetworkSelectorProps {
    onSelect: (chainId: number) => void;
}

export const NetworkSelector = ({ onSelect }: NetworkSelectorProps) => {
    return (
        <>
            <VideoBackground videoSrc="/base.mp4" />
            <div className="relative z-10 min-h-screen">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="container mx-auto p-4 py-12"
                >
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h1 className="text-6xl font-bold text-center mb-4 text-white drop-shadow-lg">
                            Memebank
                        </h1>
                        <h2 className="text-3xl font-semibold text-center mb-12 text-white/90">
                            Select Network
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {networks.map((network, index) => (
                            <motion.div
                                key={network.chainId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                            >
                                <NetworkCard network={network} onSelect={onSelect} />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </>
    );
};

const NetworkCard = ({ network, onSelect }: { network: Network; onSelect: (chainId: number) => void }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <Card 
                className="glass-card relative overflow-hidden cursor-pointer transform transition-all duration-300 hover:shadow-2xl"
                onClick={() => onSelect(network.chainId)}
            >
                <div className={`absolute inset-0 bg-gradient-to-r ${network.gradient} opacity-10`} />
                <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col items-center space-y-6">
                        {/* <motion.div
                            animate={{ rotate: isHovered ? 360 : 0 }}
                            transition={{ duration: 1 }}
                            className="bg-gradient-to-r from-[#FF3366] to-[#0099FF] p-[2px] rounded-full shadow-xl"
                        > */}
                            <div className="bg-black rounded-full p-4">
                                <Image
                                    src={network.logo}
                                    alt={network.name}
                                    width={80}
                                    height={80}
                                    className="rounded-full"
                                />
                            </div>
                        {/* </motion.div> */}
                        <h2 className="text-2xl font-bold bg-clip-text  from-[#FF3366] to-[#0099FF]">
                            {network.name}
                        </h2>
                        <p className="text-white/80 text-center text-lg">
                            {network.description}
                        </p>
                        <Button 
                            className={`w-full relative overflow-hidden group`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r ${network.gradient} group-hover:opacity-90 transition-opacity`} />
                            <span className="relative z-10 text-white">
                                Launch Memebank on {network.name}
                            </span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}; 