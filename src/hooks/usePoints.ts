import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function usePoints(userId: string | null) {
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = async () => {
    if (!userId) {
      setPoints(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.user.getPoints(userId);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Handle both response formats (remain_points or remaining_points)
      const pointsValue = response.remain_points ?? response.remaining_points ?? 0;
      setPoints(pointsValue);
    } catch (err) {
      console.error('Error fetching points:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch points');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPoints();
    } else {
      setPoints(null);
      setLoading(false);
    }
  }, [userId]);

  return { points, loading, error, refetchPoints: fetchPoints };
}