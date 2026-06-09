import React from 'react';
import { View } from '@/src/types';
import { motion } from 'motion/react';
import { User, Briefcase, Wallet, MessageCircle, ShoppingBag } from 'lucide-react';

interface NavbarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export function Navbar({ currentView, onNavigate }: NavbarProps) {
  const items: { id: View; label: string; icon: React.ElementType }[] = [
    { id: 'Helper', label: 'Helper', icon: User },
    { id: 'GiGs', label: 'GiGs', icon: Briefcase },
    { id: 'Market', label: 'Market', icon: ShoppingBag },
    { id: 'Chat', label: 'Chat', icon: MessageCircle },
    { id: 'Cwallet', label: 'Wallet', icon: Wallet },
  ];

  return (
    <nav id="bottom-navbar" className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200/80 flex items-center z-50 w-full shadow-lg">
      <div className="flex justify-around items-center w-full max-w-lg mx-auto h-full px-1">
        {items.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className="group relative flex-1 flex flex-col items-center justify-center h-full py-1 focus:outline-none select-none cursor-pointer"
            >
              <div className={`
                flex flex-col items-center gap-0.5 w-full relative z-10 transition-colors duration-300
                ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}
              `}>
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isActive ? 'bg-slate-100' : 'bg-transparent'}`}
                >
                  <item.icon className={`w-6 h-6 transition-colors ${
                    isActive
                      ? item.id === 'Helper' ? 'text-blue-600' :
                        item.id === 'GiGs' ? 'text-emerald-600' :
                        item.id === 'Market' ? 'text-purple-600' :
                        item.id === 'Chat' ? 'text-purple-600' :
                        'text-amber-600'
                      : 'text-slate-400'
                  }`} strokeWidth={2} />
                </motion.div>
                <span className={`text-[9.5px] tracking-tight font-extrabold ${isActive ? 'text-slate-900 font-black' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </div>
              
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-1.5 inset-y-1.5 bg-slate-100/80 rounded-xl -z-0 border border-slate-200/40"
                  transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
