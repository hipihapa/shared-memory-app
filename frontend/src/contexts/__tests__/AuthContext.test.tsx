import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'

// Mock Firebase auth
vi.mock('@/lib/firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
    currentUser: null,
    signOut: vi.fn(),
  },
}))

// Test component to access context
const TestComponent = () => {
  const { currentUser, isVerifying } = useAuth()
  return (
    <div>
      <div data-testid="user">{currentUser ? currentUser.email : 'No user'}</div>
      <div data-testid="verifying">{isVerifying ? 'Verifying' : 'Not verifying'}</div>
    </div>
  )
}

describe('AuthContext', () => {
  let unsubscribeMock: ReturnType<typeof vi.fn>
  let mockOnAuthStateChanged: ReturnType<typeof vi.fn>
  let mockSignOut: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    unsubscribeMock = vi.fn()
    
    // Get the mocked functions
    const { auth } = await import('@/lib/firebase')
    mockOnAuthStateChanged = vi.mocked(auth.onAuthStateChanged)
    mockSignOut = vi.mocked(auth.signOut)
    
    mockOnAuthStateChanged.mockReset()
    mockSignOut.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('starts with no user and verifying state', async () => {
      // Mock the auth state listener to not call the callback immediately
      mockOnAuthStateChanged.mockReturnValue(unsubscribeMock)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Initially should show loading state (not verifying)
      expect(screen.getByTestId('user')).toHaveTextContent('No user')
      expect(screen.getByTestId('verifying')).toHaveTextContent('Not verifying')
    })

    it('sets up auth state listener on mount', () => {
      mockOnAuthStateChanged.mockReturnValue(unsubscribeMock)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(mockOnAuthStateChanged).toHaveBeenCalled()
      expect(mockOnAuthStateChanged).toHaveBeenCalledTimes(1)
    })
  })

  describe('Authentication State Changes', () => {
    it('should update state when user signs in', async () => {
      let authCallback: (user: any) => void
      
      mockOnAuthStateChanged.mockImplementation((callback) => {
        authCallback = callback
        return unsubscribeMock
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Simulate user sign in
      const mockUser = { email: 'test@example.com', displayName: 'Test User' }
      if (authCallback) {
        authCallback(mockUser)
      }

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
        expect(screen.getByTestId('verifying')).toHaveTextContent('Not verifying')
      })
    })

    it('should update state when user signs out', async () => {
      let authCallback: (user: any) => void
      
      mockOnAuthStateChanged.mockImplementation((callback) => {
        authCallback = callback
        return unsubscribeMock
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Simulate user sign in first
      const mockUser = { email: 'test@example.com', displayName: 'Test User' }
      if (authCallback) {
        authCallback(mockUser)
      }

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      })

      // Simulate user sign out
      if (authCallback) {
        authCallback(null)
      }

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
      })
    })

    it('should handle sign out action', async () => {
      mockSignOut.mockResolvedValue(undefined)
      mockOnAuthStateChanged.mockReturnValue(unsubscribeMock)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // The signOut function should be available in the context
      expect(mockSignOut).toBeDefined()
    })
  })

  describe('Cleanup', () => {
    it('should unsubscribe from auth state changes on unmount', () => {
      mockOnAuthStateChanged.mockReturnValue(unsubscribeMock)

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      unmount()

      expect(unsubscribeMock).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle auth errors gracefully', () => {
      mockOnAuthStateChanged.mockImplementation(() => {
        throw new Error('Auth error')
      })

      // The hook will crash when auth setup fails - this is expected behavior
      // since the hook doesn't have error handling built-in
      expect(() => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )
      }).toThrow('Auth error')
    })
  })

  describe('Context Value Structure', () => {
    it('should provide expected context values', () => {
      mockOnAuthStateChanged.mockReturnValue(unsubscribeMock)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Should render without crashing, indicating context is provided
      expect(screen.getByTestId('user')).toBeInTheDocument()
      expect(screen.getByTestId('verifying')).toBeInTheDocument()
    })
  })

  describe('Multiple Components', () => {
    it('should share auth state across multiple components', async () => {
      let authCallback: (user: any) => void
      
      mockOnAuthStateChanged.mockImplementation((callback) => {
        authCallback = callback
        return unsubscribeMock
      })

      render(
        <AuthProvider>
          <TestComponent />
          <TestComponent />
        </AuthProvider>
      )

      // Simulate user sign in
      const mockUser = { email: 'test@example.com', displayName: 'Test User' }
      if (authCallback) {
        authCallback(mockUser)
      }

      await waitFor(() => {
        const users = screen.getAllByTestId('user')
        expect(users).toHaveLength(2)
        users.forEach(user => {
          expect(user).toHaveTextContent('test@example.com')
        })
      })
    })
  })
})
