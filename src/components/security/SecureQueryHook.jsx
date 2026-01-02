import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { createScopedQuery } from './RLS_GUIDE';

/**
 * Secure entity query hook with automatic RLS enforcement
 * 
 * Usage:
 *   const { data, isLoading } = useSecureQuery('Avatar', { /* filters * / });
 *   const { data } = useSecureQuery('UserAchievement', { status: 'unlocked' });
 */
export function useSecureQuery(entityName, customFilters = {}, sortBy = '-created_date', limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['secure', entityName, customFilters, sortBy, limit],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Automatically scope the query based on RLS policy
      const baseFilters = createScopedQuery(entityName, user);
      const combinedFilters = { ...baseFilters, ...customFilters };

      // Enforce pagination limit
      const safeLimit = Math.min(limit, 100);

      const results = await base44.entities[entityName].filter(
        combinedFilters,
        sortBy,
        safeLimit
      );

      return results;
    },
    enabled: !!user,
    staleTime: 30000 // 30 seconds
  });
}

/**
 * Secure backend function call with error handling
 */
export async function secureIntegrationCall(action, payload) {
  try {
    const response = await base44.functions.invoke('secureIntegrations', {
      action,
      payload
    });

    if (response.data?.error) {
      throw new Error(response.data.error);
    }

    return response.data.result;
  } catch (error) {
    // User-safe error handling
    if (error.response?.status === 401) {
      throw new Error('Please sign in to continue');
    }
    if (error.response?.status === 403) {
      throw new Error('You don\'t have permission for this action');
    }
    if (error.response?.status === 429) {
      throw new Error('Too many requests. Please wait a moment.');
    }
    throw new Error('Request failed. Please try again.');
  }
}