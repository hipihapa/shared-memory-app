import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'

describe('useIsMobile Hook', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Get the mocked matchMedia function
    mockMatchMedia = vi.mocked(window.matchMedia)
    mockMatchMedia.mockClear()
  })

  afterEach(() => {
    // Reset the mock to default behavior
    mockMatchMedia.mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  describe('Mobile Detection', () => {
    it('should return true for mobile breakpoint', () => {
      // Mock matchMedia to return true for mobile breakpoint
      mockMatchMedia.mockImplementation(query => ({
        matches: query === '(max-width: 767px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      const { result } = renderHook(() => useIsMobile())
      expect(result.current).toBe(true)
    })

    it('should return false for desktop breakpoint', () => {
      // Mock matchMedia to return false for mobile breakpoint
      mockMatchMedia.mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      const { result } = renderHook(() => useIsMobile())
      expect(result.current).toBe(false)
    })
  })

  describe('Breakpoint Matching', () => {
    it('should match max-width: 767px breakpoint', () => {
      // Mock matchMedia to return true for the specific breakpoint
      mockMatchMedia.mockImplementation(query => ({
        matches: query === '(max-width: 767px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
      
      const { result } = renderHook(() => useIsMobile())
      
      expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)')
      expect(result.current).toBe(true)
    })

    it('should not match other breakpoints', () => {
      // Mock matchMedia to return false for all breakpoints
      mockMatchMedia.mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
      
      const { result } = renderHook(() => useIsMobile())
      
      expect(result.current).toBe(false)
    })
  })

  describe('Event Handling', () => {
    it('should handle resize events and update state', () => {
      let changeCallback: (event: any) => void
      
      // Mock matchMedia to capture the change callback
      mockMatchMedia.mockImplementation(query => ({
        matches: query === '(max-width: 767px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event, callback) => {
          if (event === 'change') {
            changeCallback = callback
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
      
      const { result } = renderHook(() => useIsMobile())
      
      // Initially should match the breakpoint
      expect(result.current).toBe(true)
      
      // Simulate a resize event that changes the match
      if (changeCallback) {
        changeCallback({ matches: false })
      }
      
      // The hook should update based on the new match
      expect(result.current).toBe(false)
    })
  })

  describe('Cleanup', () => {
    it('should remove event listener on unmount', () => {
      const mockRemoveEventListener = vi.fn()
      
      mockMatchMedia.mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      }))
      
      const { unmount } = renderHook(() => useIsMobile())
      
      unmount()
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined matchMedia gracefully', () => {
      // Mock matchMedia to return undefined
      mockMatchMedia.mockImplementation(() => undefined as any)

      const { result } = renderHook(() => useIsMobile())
      expect(result.current).toBe(false)
    })

    it('should handle null matchMedia gracefully', () => {
      // Mock matchMedia to return null
      mockMatchMedia.mockImplementation(() => null as any)

      const { result } = renderHook(() => useIsMobile())
      expect(result.current).toBe(false)
    })

    it('should handle matchMedia that throws errors', () => {
      // Mock matchMedia to throw an error
      mockMatchMedia.mockImplementation(() => {
        throw new Error('matchMedia not supported')
      })

      const { result } = renderHook(() => useIsMobile())
      expect(result.current).toBe(false)
    })
  })

  describe('Multiple Hook Instances', () => {
    it('should work independently across multiple instances', () => {
      // Mock matchMedia to return true for mobile breakpoint
      mockMatchMedia.mockImplementation(query => ({
        matches: query === '(max-width: 767px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      const { result: result1 } = renderHook(() => useIsMobile())
      const { result: result2 } = renderHook(() => useIsMobile())

      expect(result1.current).toBe(true)
      expect(result2.current).toBe(true)
      expect(result1.current).toBe(result2.current)
    })
  })

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const mockAddEventListener = vi.fn()
      
      mockMatchMedia.mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
      
      renderHook(() => useIsMobile())
      
      // Should only add one event listener
      expect(mockAddEventListener).toHaveBeenCalledTimes(1)
    })

    it('should handle rapid resize events efficiently', () => {
      let changeCallback: (event: any) => void
      
      mockMatchMedia.mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event, callback) => {
          if (event === 'change') {
            changeCallback = callback
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
      
      const { result } = renderHook(() => useIsMobile())
      
      // Simulate rapid resize events
      if (changeCallback) {
        changeCallback({ matches: true })
        changeCallback({ matches: false })
        changeCallback({ matches: true })
      }
      
      // Should handle the events without crashing
      expect(result.current).toBe(true)
    })
  })
})
