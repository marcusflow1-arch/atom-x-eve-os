import React, { useState, useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { base44 } from '@/api/base44Client';

// Mock Admin page component (simplified)
function MockAdminPage() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <div data-testid="no-access">Please sign in</div>;
  }

  if (user.role !== 'admin') {
    return <div data-testid="forbidden">Access Denied: Admin Only</div>;
  }

  return <div data-testid="admin-content">Admin Dashboard</div>;
}

describe('Admin Page Gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show access denied for non-admin users', async () => {
    const mockUser = { 
      id: '1', 
      email: 'user@example.com',
      role: 'user' 
    };
    
    base44.auth.me.mockResolvedValue(mockUser);

    render(
      <MemoryRouter>
        <MockAdminPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('forbidden')).toBeInTheDocument();
    });

    expect(screen.getByTestId('forbidden')).toHaveTextContent('Access Denied: Admin Only');
  });

  it('should show admin content for admin users', async () => {
    const mockAdmin = { 
      id: '1', 
      email: 'admin@example.com',
      role: 'admin' 
    };
    
    base44.auth.me.mockResolvedValue(mockAdmin);

    render(
      <MemoryRouter>
        <MockAdminPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });
  });

  it('should show sign in prompt for unauthenticated users', async () => {
    base44.auth.me.mockResolvedValue(null);

    render(
      <MemoryRouter>
        <MockAdminPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('no-access')).toBeInTheDocument();
    });
  });
});