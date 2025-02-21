import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessNotificationProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function SuccessNotification({ message, onClose, duration = 5000 }: SuccessNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="gradient-card p-4 rounded-xl shadow-fun flex items-center space-x-3">
        <CheckCircle className="h-6 w-6 text-fun-mint bounce-fun" />
        <p className="text-gray-800 font-medium">{message}</p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>
    </div>
  );
}