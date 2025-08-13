import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '@/test/utils/test-utils'
import Header from '../Header'

// Mock the useAuth hook
const mockUseAuth = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock the useIsMobile hook
const mockUseIsMobile = vi.fn()
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

// Mock the useLocation hook
const mockUseLocation = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
    useNavigate: () => vi.fn(),
  }
})

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock implementations
    mockUseLocation.mockReturnValue({ pathname: '/' })
    mockUseIsMobile.mockReturnValue(false)
  })

  describe('Guest User (Not Authenticated)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        isVerifying: false,
      })
    })

    it('renders MemoryShare logo as a link to home', () => {
      render(<Header />)
      
      const logo = screen.getByText('MemoryShare')
      expect(logo).toBeInTheDocument()
      expect(logo.closest('a')).toHaveAttribute('href', '/')
    })

    it('shows navigation links for guest users', () => {
      render(<Header />)
      
      expect(screen.getByText('How It Works')).toBeInTheDocument()
      expect(screen.getByText('Pricing')).toBeInTheDocument()
    })

    it('shows login and get started buttons for guest users', () => {
      render(<Header />)
      
      expect(screen.getByText('Login')).toBeInTheDocument()
      expect(screen.getByText('Get Started')).toBeInTheDocument()
    })

    it('hides navigation on upload page for private spaces', () => {
      mockUseLocation.mockReturnValue({ pathname: '/upload/private-space' })
      render(<Header spaceId="private-space" isPublic={false} />)
      
      expect(screen.queryByText('How It Works')).not.toBeInTheDocument()
      expect(screen.queryByText('Pricing')).not.toBeInTheDocument()
    })

    it('shows dashboard button on upload page for public spaces', () => {
      mockUseLocation.mockReturnValue({ pathname: '/upload/public-space' })
      render(<Header spaceId="public-space" isPublic={true} />)
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('hides navigation on dashboard page', () => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard/test-space' })
      render(<Header spaceId="test-space" />)
      
      expect(screen.queryByText('How It Works')).not.toBeInTheDocument()
      expect(screen.queryByText('Pricing')).not.toBeInTheDocument()
    })
  })

  describe('Authenticated User', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        currentUser: {
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
        },
        isVerifying: false,
      })
    })

    it('renders MemoryShare logo as text (not a link)', () => {
      render(<Header />)
      
      const logo = screen.getByText('MemoryShare')
      expect(logo).toBeInTheDocument()
      expect(logo.closest('a')).not.toBeInTheDocument()
    })

    it('shows user greeting with display name', () => {
      render(<Header />)
      
      expect(screen.getByText('Hello, Test User')).toBeInTheDocument()
    })

    it('shows gallery button when not on dashboard page', () => {
      mockUseLocation.mockReturnValue({ pathname: '/' })
      render(<Header spaceId="test-space" />)
      
      expect(screen.getByText('Gallery')).toBeInTheDocument()
    })

    it('hides gallery button when on dashboard page', () => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard/test-space' })
      render(<Header spaceId="test-space" />)
      
      expect(screen.queryByText('Gallery')).not.toBeInTheDocument()
    })

    it('shows sign out button', () => {
      render(<Header />)
      
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })

    it('shows settings icon on dashboard page', () => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard/test-space' })
      render(<Header spaceId="test-space" />)
      
      expect(screen.getByLabelText('Settings')).toBeInTheDocument()
    })

    it('calls onSettingsClick when settings button is clicked with callback', () => {
      const mockOnSettingsClick = vi.fn()
      mockUseLocation.mockReturnValue({ pathname: '/dashboard/test-space' })
      
      render(<Header spaceId="test-space" onSettingsClick={mockOnSettingsClick} />)
      
      const settingsButton = screen.getByLabelText('Settings')
      fireEvent.click(settingsButton)
      
      expect(mockOnSettingsClick).toHaveBeenCalled()
    })

    it('links to settings page when no callback provided', () => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard/test-space' })
      
      render(<Header spaceId="test-space" />)
      
      const settingsButton = screen.getByLabelText('Settings')
      expect(settingsButton.closest('a')).toHaveAttribute('href', '/dashboard/settings/test-space')
    })
  })

  describe('User Verification State', () => {
    it('treats verifying user as guest', () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        isVerifying: true,
      })
      
      render(<Header />)
      
      // Should behave like a guest user
      expect(screen.getByText('Login')).toBeInTheDocument()
      expect(screen.getByText('Get Started')).toBeInTheDocument()
    })
  })

  describe('Mobile Responsiveness', () => {
    it('applies mobile spacing when on mobile', () => {
      mockUseIsMobile.mockReturnValue(true)
      
      render(<Header />)
      
      const buttonContainer = screen.getByText('Login').closest('div')
      expect(buttonContainer).toHaveClass('space-x-2')
    })

    it('applies desktop spacing when not on mobile', () => {
      mockUseIsMobile.mockReturnValue(false)
      
      render(<Header />)
      
      const buttonContainer = screen.getByText('Login').closest('div')
      expect(buttonContainer).toHaveClass('space-x-3')
    })
  })

  describe('Navigation Visibility', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        isVerifying: false,
      })
    })

    it('hides navigation on upload page', () => {
      mockUseLocation.mockReturnValue({ pathname: '/upload/test-space' })
      render(<Header spaceId="test-space" />)
      
      expect(screen.queryByText('How It Works')).not.toBeInTheDocument()
      expect(screen.queryByText('Pricing')).not.toBeInTheDocument()
    })

    it('hides navigation on dashboard page', () => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard/test-space' })
      render(<Header spaceId="test-space" />)
      
      expect(screen.queryByText('How It Works')).not.toBeInTheDocument()
      expect(screen.queryByText('Pricing')).not.toBeInTheDocument()
    })

    it('shows navigation on other pages', () => {
      mockUseLocation.mockReturnValue({ pathname: '/how-it-works' })
      render(<Header />)
      
      expect(screen.getByText('How It Works')).toBeInTheDocument()
      expect(screen.getByText('Pricing')).toBeInTheDocument()
    })
  })

  describe('Props Handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        currentUser: {
          uid: 'user-123',
          email: 'test@example.com',
          displayName: null,
        },
        isVerifying: false,
      })
    })

    it('uses userName prop when displayName is not available', () => {
      render(<Header userName="Custom User" />)
      
      expect(screen.getByText('Hello, Custom User')).toBeInTheDocument()
    })

    it('falls back to "User" when neither displayName nor userName is available', () => {
      render(<Header />)
      
      expect(screen.getByText('Hello, User')).toBeInTheDocument()
    })

    it('handles missing spaceId gracefully', () => {
      render(<Header />)
      
      // Should render without crashing
      expect(screen.getByText('MemoryShare')).toBeInTheDocument()
    })
  })
})
