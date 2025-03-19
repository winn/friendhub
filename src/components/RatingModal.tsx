import React, { useState } from 'react';
import { Star, X, Send } from 'lucide-react';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

interface RatingModalProps {
  agentId: string;
  agentName: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RatingModal({ agentId, agentName, userId, onClose, onSuccess }: RatingModalProps) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError(t('select_rating'));
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${api.BASE_URL}/rating-agent`, {
        method: 'POST',
        headers: api.headers,
        body: JSON.stringify({
          userId,
          agentId,
          comment,
          rating
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t('error'));
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Rating error:', err);
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="gradient-card max-w-md w-full p-6 relative rounded-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-primary-100 rounded-full transition-all duration-300"
        >
          <X className="h-5 w-5 text-primary-600" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t('rate_chat')} {agentName} ✨
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="flex flex-col items-center">
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-fun-yellow text-fun-yellow'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {rating ? `${t('you_rated')} ${rating} ${t('stars')}` : t('select_rating')}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              {t('write_review')}
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full rounded-xl border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300"
              placeholder={t('share_experience')}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-fun w-full py-3 text-white font-medium rounded-full inline-flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              t('processing')
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>{t('submit_rating')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}