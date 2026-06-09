import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Lock, User, CheckCircle } from 'lucide-react';
import { playSoftChime } from '../lib/audio';

interface AuthViewProps {
  onRegisterSuccess: (email: string, isFirstTime: boolean) => void;
}

export function AuthView({ onRegisterSuccess }: AuthViewProps) {
  const [step, setStep] = useState<'splash' | 'details' | 'pin' | 'success'>('splash');
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [isGiGfalling, setIsGiGfalling] = useState(false);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleGiGClick = () => {
    setIsGiGfalling(true);
    setTimeout(() => setStep('details'), 800);
  };

  const handleApply = () => {
    if (mode === 'login') {
      if (email && password) {
        setStep('success');
        onRegisterSuccess(email, false);
      }
    } else {
      if (email && password && acceptedTerms) {
        setStep('pin');
      }
    }
  };

  const handleEnter = () => {
    if (pin.every(digit => digit !== '')) {
      setStep('success');
      playSoftChime();
      setTimeout(() => {
        onRegisterSuccess(email, true);
      }, 2000);
    }
  };

  useEffect(() => {
    if (step === 'splash') {
      const timer = setTimeout(() => {
        setIsGiGfalling(true);
        setTimeout(() => setStep('details'), 800);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans bg-gradient-to-br from-slate-900 to-indigo-950">
      <AnimatePresence mode="wait">
        {step === 'splash' && (
          <motion.div key="splash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 uppercase tracking-widest">Time<motion.span 
              animate={isGiGfalling ? { rotate: 90, y: 500, opacity: 0 } : { rotateZ: [-5, 5, -5] }} 
              transition={isGiGfalling ? { duration: 0.8, ease: "easeIn" } : { repeat: Infinity, duration: 2, ease: "easeInOut" }} 
              className="inline-block origin-top bg-amber-400 text-slate-900 px-1 rounded shadow-sm cursor-pointer"
              onClick={handleGiGClick}
            >GiG</motion.span></h1>
          </motion.div>
        )}
        {step === 'details' && (
          <motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-sm space-y-6 bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center">Time<motion.span animate={{ rotateZ: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="inline-block origin-top bg-amber-400 text-slate-900 px-1 rounded shadow-sm">GiG</motion.span></h2>
            <h1 className="text-2xl font-black text-center uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">{mode === 'register' ? 'Registration' : 'Login'}</h1>
            <div className="space-y-4">
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500" />
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500" />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-500">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {mode === 'register' && (
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="accent-blue-600" />
                  I accept terms and conditions
                </label>
              )}
            </div>
            <button onClick={handleApply} disabled={mode === 'register' ? (!acceptedTerms || !email || !password) : (!email || !password)} className="w-full py-3 bg-blue-600/80 backdrop-blur rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-colors disabled:opacity-50">{mode === 'register' ? 'Apply' : 'Login'}</button>
            <button onClick={() => setMode(mode === 'register' ? 'login' : 'register')} className="w-full text-center text-xs font-bold text-slate-400 hover:text-white">
              {mode === 'register' ? 'Already have an account? Login' : 'Don\'t have an account? Register'}
            </button>
          </motion.div>
        )}

        {step === 'pin' && (
          <motion.div key="pin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-sm space-y-6 text-center bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl">
            <h2 className="text-xl font-bold">Create 4-digit PIN</h2>
            <div className="flex gap-3 justify-center">
              {pin.map((digit, i) => (
                <input 
                  key={i} 
                  ref={(el) => (pinRefs.current[i] = el)}
                  type="text" 
                  maxLength={1} 
                  value={digit} 
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/, '');
                    const newPin = [...pin];
                    newPin[i] = value;
                    setPin(newPin);

                    if (value && i < pin.length - 1) {
                      pinRefs.current[i + 1]?.focus();
                    }
                  }} 
                  className="w-14 h-14 text-center text-2xl font-black bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 outline-none" />
              ))}
            </div>
            <button onClick={handleEnter} disabled={!pin.every(d => d !== '')} className="w-full py-3 bg-blue-600/80 backdrop-blur rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-colors disabled:opacity-50">Enter</button>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative flex flex-col items-center gap-4 text-center bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-sm">
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0.5],
                  x: Math.random() * 200 - 100,
                  y: Math.random() * -200 - 100,
                }}
                transition={{ duration: 2, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                className="absolute text-2xl"
              >
                🪙
              </motion.div>
            ))}
            <CheckCircle size={64} className="text-emerald-500" />
            <h2 className="text-2xl font-black">Congratulations!</h2>
            <p className="text-slate-400">You have been awarded 10 coins.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
