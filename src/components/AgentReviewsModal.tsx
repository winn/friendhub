import React, { useState, useEffect } from 'react';
import { X, Star, Loader, User } from 'lucide-react';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

interface Review {
  id: string;
  user_id: string;
  agent_id: string;
  comment: string;
  rating: number;
  created_at: string;
}

interface AgentReviewsModalProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
}

export function AgentReviewsModal({ agentId, agentName, onClose }: AgentReviewsModalProps) {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.agent.getReviews(agentId);
        if (response.error) {
          throw new Error(response.error);
        }
        setReviews(response.ratings || []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError(err instanceof Error ? err.message : t('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [agentId, t]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="gradient-card max-w-2xl w-full p-6 relative rounded-2xl shadow-fun">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-primary-100 rounded-full transition-all duration-300"
        >
          <X className="h-5 w-5 text-primary-600" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <Star className="h-6 w-6 text-fun-yellow bounce-fun" />
          <h2 className="text-xl font-bold bg-gradient-to-r from-fun-yellow to-fun-mint bg-clip-text text-transparent">
            {t('reviews')} - {agentName}
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="h-8 w-8 text-fun-mint animate-spin" />
            <p className="mt-4 text-gray-600">{t('loading')}...</p>
          </div>
        ) : error ? (
          <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl">
            {error}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">{t('no_reviews')}</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-fun-red to-fun-mint flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {t('user')} {review.user_id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? 'text-fun-yellow fill-fun-yellow'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-600 whitespace-pre-wrap">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}