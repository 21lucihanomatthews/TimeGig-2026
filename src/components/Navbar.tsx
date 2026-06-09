import React from 'react';
import { View } from '@/src/types';
import { motion } from 'motion/react';
import { User, Briefcase, Wallet, MessageCircle } from 'lucide-react';

interface NavbarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export function Navbar({ currentView, onNavigate }: NavbarProps) {
  const items: { id: View; label: string; icon: React.ElementType }[] = [
    { id: 'Helper', label: 'Helper', icon: User },
    { id: 'GiGs', label: 'GiGs', icon: Briefcase },
    { id: 'Chat', label: 'Chat', icon: MessageCircle },
    { id: 'Cwallet', label: 'Wallet', icon: Wallet },
  ];

  return (
    <nav id="bottom-navbar" className="fixed bottom-0 left-0 right-0 h-20 bg-white/45 backdrop-blur-xl border-t border-white/60 flex items-center px-4 z-50 w-full shadow-2xl saturate-150">
      <div className="flex justify-around w-full p-1">
        {items.map((item) => (
          <button
            key={item.id}
            id={`nav-item-${item.id}`}
            onClick={() => onNavigate(item.id)}
            className="group relative flex-1 flex justify-center"
          >
            <div className={`
              flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-500 relative z-10
              ${currentView === item.id 
                ? 'text-blue-600' 
                : 'text-gray-400 hover:text-gray-600'
              }
            `}>
              <motion.div
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`w-12 h-12 flex items-center justify-center rounded-3xl bg-gradient-to-br ${
                  item.id === 'Helper' ? 'from-blue-400 to-blue-600 shadow-blue-200/80' :
                  item.id === 'GiGs' ? 'from-emerald-400 to-emerald-600 shadow-emerald-200/80' :
                  item.id === 'Chat' ? 'from-purple-400 to-purple-600 shadow-purple-200/80' :
                  'from-amber-400 to-orange-500 shadow-amber-200/80'
                } shadow-lg transition-all duration-300 text-white`}
              >
                <item.icon className="w-6 h-6" strokeWidth={2.5} />
              </motion.div>
              <span className="text-[10px] font-bold tracking-tight transition-all duration-300">
                {item.label}
              </span>
            </div>
            
            {currentView === item.id && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-x-2 inset-y-1 bg-blue-500/5 backdrop-blur-sm border border-blue-500/10 rounded-2xl -z-0"
                transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
