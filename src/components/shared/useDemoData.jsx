import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook to manage demo/mock data with entity fallback
 * @param {string} entityName - Name of the entity to fetch
 * @param {Array} mockData - Fallback mock data
 * @param {boolean} forceMock - Force use of mock data (dev flag)
 */
export function useDemoData(entityName, mockData = [], forceMock = false) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [source, setSource] = useState('loading');

    useEffect(() => {
        const fetchData = async () => {
            // Check dev flag
            const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
            const useMock = forceMock || (isDev && window.localStorage.getItem('USE_MOCK_DATA') === 'true');

            if (useMock && mockData.length > 0) {
                setData(mockData);
                setSource('mock');
                setLoading(false);
                return;
            }

            try {
                const response = await base44.entities[entityName].list();
                const fetchedData = response.data || response;

                if (fetchedData.length > 0) {
                    setData(fetchedData);
                    setSource('entity');
                } else {
                    // Fallback to mock if no entity data
                    setData(mockData);
                    setSource('mock_fallback');
                }
                setLoading(false);
            } catch (err) {
                console.error(`Failed to fetch ${entityName}:`, err);
                setError(err);
                setData(mockData);
                setSource('mock_error');
                setLoading(false);
            }
        };

        fetchData();
    }, [entityName, forceMock]);

    return { data, loading, error, source };
}

/**
 * Dev tools for toggling mock data
 */
export function toggleMockData() {
    const current = window.localStorage.getItem('USE_MOCK_DATA') === 'true';
    window.localStorage.setItem('USE_MOCK_DATA', (!current).toString());
    window.location.reload();
}

export function isMockDataEnabled() {
    return window.localStorage.getItem('USE_MOCK_DATA') === 'true';
}