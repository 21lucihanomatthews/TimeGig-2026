import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, X, Eye } from 'lucide-react';
import { FullScreenModal } from './FullScreenModal';
import { Payment } from '@/src/types';

export function AdminView({ payments, setPayments, setBalance, profit, setProfit }: { payments: Payment[], setPayments: React.Dispatch<React.SetStateAction<Payment[]>>, setBalance: React.Dispatch<React.SetStateAction<number>>, profit: number, setProfit: React.Dispatch<React.SetStateAction<number>> }) {
    const [selectedProof, setSelectedProof] = useState<string | null>(null);

    const approvePayment = (payment: Payment) => {
        const coins = parseInt(payment.option.replace('c', ''));
        setBalance(prev => prev + coins);
        setProfit(prev => prev + parseFloat(payment.price.replace('R', '').replace(',', '.')));
        setPayments(prev => prev.filter(item => item.id !== payment.id));
    };

    const rejectPayment = (payment: Payment) => {
        setPayments(prev => prev.filter(item => item.id !== payment.id));
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
            <div className="bg-blue-600 text-white p-4 rounded-2xl mb-6 shadow-lg">
                <p className="text-blue-100 text-sm">Live Profit</p>
                <h2 className="text-3xl font-black">R{profit.toFixed(2)}</h2>
            </div>
            
            <div className="space-y-4">
                {payments.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="font-bold">{p.user} - {p.option} ({p.price})</p>
                            <p className="text-sm text-gray-500">Status: {p.status}</p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setSelectedProof(p.proofUrl || null)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Eye size={20} /></button>
                             <button onClick={() => approvePayment(p)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Check size={20} /></button>
                             <button onClick={() => rejectPayment(p)} className="p-2 bg-red-50 text-red-600 rounded-lg"><X size={20} /></button>
                        </div>
                    </div>
                ))}
            </div>
            
            <FullScreenModal isOpen={!!selectedProof} onClose={() => setSelectedProof(null)}>
                <div className="p-4">
                    <h2 className="text-xl font-bold mb-4">Proof of Payment</h2>
                    {selectedProof ? (
                        <img src={selectedProof} alt="Proof" className="w-full rounded-xl" />
                    ) : (
                        <div className="w-full h-64 bg-gray-200 rounded-xl flex items-center justify-center">No image</div>
                    )}
                </div>
            </FullScreenModal>
        </div>
    );
}
