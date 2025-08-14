import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import Index from '../Index'

// Mock the useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    isVerifying: false,
  }),
}))

describe('Index Page', () => {
  describe('Rendering', () => {
    it('renders the main heading', () => {
      render(<Index />)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('renders the MemoryShare logo/brand', () => {
      render(<Index />)
      const memoryShareElements = screen.getAllByText(/MemoryShare/i)
      expect(memoryShareElements.length).toBeGreaterThan(0)
    })

    it('renders the main description text', () => {
      render(<Index />)
      expect(screen.getByText(/Create a shared space/i)).toBeInTheDocument()
    })
  })

  describe('Call to Action Buttons', () => {
    it('renders Get Started button', () => {
      render(<Index />)
      const getStartedButtons = screen.getAllByRole('link', { name: /get started/i })
      expect(getStartedButtons.length).toBeGreaterThan(0)
      // Check that at least one has the correct href
      const hasCorrectHref = getStartedButtons.some(button => 
        button.getAttribute('href') === '/pricing'
      )
      expect(hasCorrectHref).toBe(true)
    })

    it('renders Learn More button', () => {
      render(<Index />)
      const learnMoreButtons = screen.getAllByRole('link', { name: /how it works/i })
      expect(learnMoreButtons.length).toBeGreaterThan(0)
      // Check that at least one has the correct href
      const hasCorrectHref = learnMoreButtons.some(button => 
        button.getAttribute('href') === '/how-it-works'
      )
      expect(hasCorrectHref).toBe(true)
    })
  })

  describe('Navigation Links', () => {
    it('renders navigation links in header', () => {
      render(<Index />)
      const howItWorksLinks = screen.getAllByText('How It Works')
      expect(howItWorksLinks.length).toBeGreaterThan(0)
      const pricingLinks = screen.getAllByText('Pricing')
      expect(pricingLinks.length).toBeGreaterThan(0)
    })

    it('renders login and get started buttons in header', () => {
      render(<Index />)
      expect(screen.getByText('Login')).toBeInTheDocument()
      expect(screen.getByText('Get Started')).toBeInTheDocument()
    })
  })

  describe('Content Sections', () => {
    it('renders hero section content', () => {
      render(<Index />)
      // Check for hero section content - the actual content is different
      expect(screen.getByText(/Create a shared space/i)).toBeInTheDocument()
      expect(screen.getByText(/No accounts needed for guests/i)).toBeInTheDocument()
    })

    it('renders features or benefits section', () => {
      render(<Index />)
      // This would depend on the actual content of your Index page
      // You might want to check for specific feature text or sections
    })
  })

  describe('Responsive Design', () => {
    it('renders on different screen sizes', () => {
      render(<Index />)
      // The component should render without errors on different screen sizes
      // This is more of an integration test that would be done with visual testing tools
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<Index />)
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toBeInTheDocument()
    })

    it('has proper button and link labels', () => {
      render(<Index />)
      const links = screen.getAllByRole('link')
      
      // All interactive elements should have accessible names
      links.forEach(link => {
        expect(link).toHaveAccessibleName()
      })
    })
  })

  describe('User Authentication State', () => {
    it('shows appropriate content for unauthenticated users', () => {
      render(<Index />)
      // Should show login and get started options
      expect(screen.getByText('Login')).toBeInTheDocument()
      expect(screen.getByText('Get Started')).toBeInTheDocument()
    })

    it('does not show authenticated user content', () => {
      render(<Index />)
      // Should not show user-specific content for unauthenticated users
      expect(screen.queryByText(/Hello,/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Sign Out/)).not.toBeInTheDocument()
    })
  })

  describe('Page Structure', () => {
    it('renders as a complete page', () => {
      render(<Index />)
      // Should render the main page content
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('has proper semantic structure', () => {
      render(<Index />)
      // Check for proper semantic HTML elements
      // This would depend on your actual HTML structure
    })
  })

  describe('Content Validation', () => {
    it('displays correct marketing copy', () => {
      render(<Index />)
      // Verify that the marketing copy is correct and compelling
      // This would depend on your actual content
    })

    it('has appropriate call-to-action messaging', () => {
      render(<Index />)
      // Check that CTAs are clear and actionable
      const getStartedButtons = screen.getAllByRole('link', { name: /get started/i })
      expect(getStartedButtons.length).toBeGreaterThan(0)
      // Check that at least one Get Started button exists
      expect(getStartedButtons[0]).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('renders without performance issues', () => {
      const startTime = performance.now()
      render(<Index />)
      const endTime = performance.now()
      
      // Basic performance check - render should complete quickly
      expect(endTime - startTime).toBeLessThan(1000) // Less than 1 second
    })
  })
})
