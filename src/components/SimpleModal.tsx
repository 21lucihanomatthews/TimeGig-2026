import React from 'react';

export function SimpleModal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        {children}
        <button onClick={onClose} className="mt-4 w-full p-2 bg-gray-100 rounded-lg font-bold">Close</button>
      </div>
    </div>
  );
}
