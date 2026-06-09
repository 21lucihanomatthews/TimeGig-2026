import React from 'react';
import { motion } from 'motion/react';

interface CoinAnimationProps {
  onComplete?: () => void;
}

export function CoinAnimation({ onComplete }: CoinAnimationProps) {
  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[100]">
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0.5],
            x: Math.random() * 400 - 200,
            y: Math.random() * -400 - 100,
          }}
          transition={{ duration: 2, delay: i * 0.1, ease: "easeOut" }}
          onAnimationComplete={i === 9 ? onComplete : undefined}
          className="absolute text-3xl"
        >
          🪙
        </motion.div>
      ))}
    </div>
  );
}
