import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Subscribes to entity changes and invalidates React Query cache on events.
 * @param {string} entityName - Name of the entity to subscribe to (e.g., 'VoiceRoom')
 * @param {Array} queryKey - Query key to invalidate
 * @param {Function} [filterFn] - Optional function to filter events before invalidating
 */
export function useEntitySubscription(entityName, queryKey, filterFn) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!base44.entities[entityName]) {
            console.warn(`Entity ${entityName} not found in SDK`);
            return;
        }

        const unsubscribe = base44.entities[entityName].subscribe((event) => {
            if (filterFn && !filterFn(event)) return;
            
            // console.log(`Event received for ${entityName}:`, event.type);
            queryClient.invalidateQueries({ queryKey });
        });

        return () => unsubscribe();
    }, [entityName, JSON.stringify(queryKey), queryClient]); // stringify key to avoid loop
}