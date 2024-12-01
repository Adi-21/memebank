'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface VideoBackgroundProps {
    videoSrc: string;
}

export const VideoBackground = ({ videoSrc }: VideoBackgroundProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    
    const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });
    
    const scaleY = useTransform(springY, [0, 1], [1, 1.1]);
    const opacityY = useTransform(springY, [0, 1], [1, 0.8]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;

            if (videoRef.current) {
                const duration = videoRef.current.duration;
                videoRef.current.currentTime = duration * x;
            }

            mouseX.set(x);
            mouseY.set(y);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <motion.div 
            className="fixed top-0 left-0 w-screen h-screen overflow-hidden -z-10"
            style={{
                scale: scaleY,
                opacity: opacityY
            }}
        >
            <video
                ref={videoRef}
                className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
                src={videoSrc}
                muted
                loop
                playsInline
                autoPlay
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
        </motion.div>
    );
}; 