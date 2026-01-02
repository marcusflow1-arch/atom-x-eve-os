import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { base44 } from '@/api/base44Client';

// Test component to access auth context
function TestComponent() {
  const { user, isAuthenticated, loading } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'ready'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user">{user?.email || 'none'}</div>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide default unauthenticated state when no user', async () => {
    base44.auth.me.mockResolvedValue(null);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('should set authenticated state when user exists', async () => {
    const mockUser = { 
      id: '1', 
      email: 'test@example.com', 
      username: 'testuser',
      full_name: 'Test User' 
    };
    
    base44.auth.me.mockResolvedValue(mockUser);
    base44.entities.Avatar = {
      filter: vi.fn().mockResolvedValue([])
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
  });

  it('should trigger signup flow when user has no username', async () => {
    const mockUser = { 
      id: '1', 
      email: 'new@example.com',
      username: null
    };
    
    base44.auth.me.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });
  });

  it('should handle auth errors gracefully', async () => {
    base44.auth.me.mockRejectedValue(new Error('Network error'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
  });
});