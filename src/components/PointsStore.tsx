import React, { useState, useEffect } from 'react';
import { Coins, Package, CreditCard, Loader, X } from 'lucide-react';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

interface Package {
  id: string;
  package_name: string;
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
  const { t } = useLanguage();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await api.points.getPackages();
        
        if (response.error) {
          throw new Error(response.error);
        }

        if (!response.packages || !Array.isArray(response.packages)) {
          throw new Error('Invalid response format');
        }

        setPackages(response.packages);
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError(err instanceof Error ? err.message : t('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [t]);

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
        throw new Error(t('error_no_checkout_url'));
      }

      // Open Stripe checkout in the same window
      window.location.href = data.sessionUrl;
    } catch (err) {
      console.error('Payment setup error:', err);
      setError(err instanceof Error ? err.message : t('error_payment_setup'));
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="gradient-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-fun">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-primary-100 p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Coins className="h-6 w-6 sm:h-8 sm:w-8 text-fun-yellow bounce-fun" />
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-fun-yellow to-fun-mint bg-clip-text text-transparent">
              {t('get_points')} ✨
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-100 rounded-full transition-all duration-300"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="h-12 w-12 text-fun-mint animate-spin" />
              <p className="mt-4 text-gray-600 text-lg">{t('loading_packages')} ✨</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 text-red-600 text-sm bg-red-50 p-4 rounded-xl">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`fun-card p-4 sm:p-6 relative overflow-hidden transform hover:scale-105 transition-all duration-300 ${
                      pkg.popular ? 'ring-4 ring-fun-yellow ring-offset-4' : ''
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute top-3 right-3">
                        <span className="badge-fun bg-fun-yellow/20 text-fun-yellow text-sm">
                          {t('most_popular')}
                        </span>
                      </div>
                    )}
                    
                    <Package className="h-10 w-10 sm:h-12 sm:w-12 text-fun-mint mb-4 float-animation" />
                    
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {pkg.package_name}
                    </h3>
                    
                    <div className="flex items-baseline mb-4">
                      <span className="text-2xl sm:text-3xl font-bold text-fun-red">
                        ฿{pkg.price}
                      </span>
                      <span className="text-gray-500 ml-2">THB</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-600 mb-4">
                      <Coins className="h-5 w-5 text-fun-yellow" />
                      <span className="font-medium">{pkg.points.toLocaleString()} {t('points')}</span>
                    </div>
                    
                    {pkg.description && (
                      <p className="text-gray-600 mb-4 text-sm sm:text-base">
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
                          <span>{t('processing')}</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5" />
                          <span>{t('purchase_now')}</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center text-sm text-gray-500">
                <p className="flex items-center justify-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t('secure_payment_stripe')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}