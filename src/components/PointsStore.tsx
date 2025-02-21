import React, { useState, useEffect } from 'react';
import { Coins, Package, CreditCard, Loader, X } from 'lucide-react';
import { api } from '../lib/api';

interface Package {
  id: string;
  name: string;
  points: number;
  price: number;
  description?: string;
  popular?: boolean;
}

interface PointsStoreProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PointsStore({ userId, onClose, onSuccess }: PointsStoreProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const dummyPackages: Package[] = [
      {
        id: 'basic',
        name: 'Starter Pack',
        points: 100,
        price: 5,
        description: 'Perfect for getting started!'
      },
      {
        id: 'popular',
        name: 'Power Pack',
        points: 500,
        price: 20,
        description: 'Most popular choice!',
        popular: true
      },
      {
        id: 'premium',
        name: 'Premium Pack',
        points: 1200,
        price: 40,
        description: 'Best value for power users!'
      }
    ];
    setPackages(dummyPackages);
    setLoading(false);
  }, []);

  const handlePurchase = async (pkg: Package) => {
    setError(null);
    setProcessing(true);

    try {
      const response = await fetch(`${api.BASE_URL}/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': api.headers.Authorization
        },
        body: JSON.stringify({
          userId,
          amount: pkg.price,
          pointsToAdd: pkg.points
        })
      });

      const data = await response.json();
      console.log('Payment response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.sessionUrl) {
        throw new Error('No checkout URL received');
      }

      // Open Stripe checkout in the same window
      window.location.href = data.sessionUrl;
    } catch (err) {
      console.error('Payment setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup payment. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="gradient-card max-w-4xl w-full p-8 relative rounded-2xl">
          <div className="flex flex-col items-center justify-center h-64">
            <Loader className="h-12 w-12 text-fun-mint animate-spin" />
            <p className="mt-4 text-gray-600 text-lg animate-pulse">Loading packages... ✨</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="gradient-card max-w-4xl w-full p-8 relative rounded-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-primary-100 rounded-full transition-all duration-300"
        >
          <X className="h-6 w-6 text-primary-600" />
        </button>

        <div className="flex items-center space-x-3 mb-8">
          <Coins className="h-8 w-8 text-fun-yellow bounce-fun" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-fun-yellow to-fun-mint bg-clip-text text-transparent">
            Get More Power Points! ✨
          </h2>
        </div>

        {error && (
          <div className="mb-6 text-red-600 text-sm bg-red-50 p-4 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`fun-card p-6 relative overflow-hidden ${
                pkg.popular ? 'ring-4 ring-fun-yellow ring-offset-4' : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-3 right-3">
                  <span className="badge-fun bg-fun-yellow/20 text-fun-yellow">
                    Most Popular ⭐
                  </span>
                </div>
              )}
              
              <Package className="h-12 w-12 text-fun-mint mb-4 float-animation" />
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {pkg.name}
              </h3>
              
              <div className="flex items-baseline mb-4">
                <span className="text-3xl font-bold text-fun-red">
                  ${pkg.price}
                </span>
                <span className="text-gray-500 ml-2">USD</span>
              </div>
              
              <div className="flex items-center space-x-2 text-gray-600 mb-6">
                <Coins className="h-5 w-5 text-fun-yellow" />
                <span className="font-medium">{pkg.points.toLocaleString()} points</span>
              </div>
              
              {pkg.description && (
                <p className="text-gray-600 mb-6">
                  {pkg.description}
                </p>
              )}
              
              <button
                onClick={() => handlePurchase(pkg)}
                disabled={processing}
                className="btn-fun w-full py-3 text-white font-medium rounded-full inline-flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Purchase Now</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="flex items-center justify-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Secure payments powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}