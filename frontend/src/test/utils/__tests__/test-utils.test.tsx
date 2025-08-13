import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { render as customRender, createTestStore, createTestQueryClient } from '../test-utils'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'

// Test component
const TestComponent = () => (
  <div>
    <h1>Test Component</h1>
    <button>Click me</button>
  </div>
)

describe('Test Utilities', () => {
  describe('customRender', () => {
    it('renders component with default providers', () => {
      customRender(<TestComponent />)
      
      expect(screen.getByText('Test Component')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders component without router when withRouter is false', () => {
      customRender(<TestComponent />, { withRouter: false })
      
      // Should still render the component
      expect(screen.getByText('Test Component')).toBeInTheDocument()
    })

    it('renders component without Redux when withRedux is false', () => {
      customRender(<TestComponent />, { withRedux: false })
      
      // Should still render the component
      expect(screen.getByText('Test Component')).toBeInTheDocument()
    })

    it('renders component without QueryClient when withQueryClient is false', () => {
      customRender(<TestComponent />, { withQueryClient: false })
      
      // Should still render the component
      expect(screen.getByText('Test Component')).toBeInTheDocument()
    })

    it('renders component without Auth when withAuth is false', () => {
      customRender(<TestComponent />, { withAuth: false })
      
      // Should still render the component
      expect(screen.getByText('Test Component')).toBeInTheDocument()
    })

    it('renders component with all providers disabled', () => {
      customRender(<TestComponent />, {
        withRouter: false,
        withRedux: false,
        withQueryClient: false,
        withAuth: false,
      })
      
      // Should still render the component
      expect(screen.getByText('Test Component')).toBeInTheDocument()
    })
  })

  describe('createTestStore', () => {
    it('creates a store with uploadFiles reducer', () => {
      const store = createTestStore()
      const state = store.getState()
      
      expect(state).toHaveProperty('uploadFiles')
      expect(state.uploadFiles).toEqual({
        files: [],
      })
    })

    it('creates a store that can dispatch actions', () => {
      const store = createTestStore()
      const initialState = store.getState().uploadFiles
      
      // Dispatch an action that actually changes the state
      store.dispatch({ type: 'uploadFiles/setFiles', payload: [new File(['test'], 'test.jpg')] })
      const newState = store.getState().uploadFiles
      
      expect(newState).not.toEqual(initialState)
    })

    it('creates independent store instances', () => {
      const store1 = createTestStore()
      const store2 = createTestStore()
      
      // Dispatch action to first store
      store1.dispatch({ type: 'uploadFiles/setFiles', payload: [new File(['test'], 'test.jpg')] })
      
      // Second store should remain unchanged
      expect(store1.getState().uploadFiles).not.toEqual(store2.getState().uploadFiles)
    })
  })

  describe('createTestQueryClient', () => {
    it('creates a QueryClient with test configuration', () => {
      const queryClient = createTestQueryClient()
      
      expect(queryClient).toBeInstanceOf(QueryClient)
    })

    it('creates QueryClient with retry disabled for queries', () => {
      const queryClient = createTestQueryClient()
      const defaultOptions = queryClient.getDefaultOptions()
      
      expect(defaultOptions.queries?.retry).toBe(false)
    })

    it('creates QueryClient with retry disabled for mutations', () => {
      const queryClient = createTestQueryClient()
      const defaultOptions = queryClient.getDefaultOptions()
      
      expect(defaultOptions.mutations?.retry).toBe(false)
    })

    it('creates independent QueryClient instances', () => {
      const queryClient1 = createTestQueryClient()
      const queryClient2 = createTestQueryClient()
      
      expect(queryClient1).not.toBe(queryClient2)
    })
  })

  describe('Provider Integration', () => {
    it('wraps components with Redux Provider', () => {
      const store = createTestStore()
      
      render(
        <Provider store={store}>
          <TestComponent />
        </Provider>
      )
      
      expect(screen.getByText('Test Component')).toBeInTheDocument()
    })

    it('wraps components with QueryClient Provider', () => {
      const queryClient = createTestQueryClient()
      
      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      )
      
      expect(screen.getByText('Test Component')).toBeInTheDocument()
    })

    it('wraps components with Auth Provider', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      expect(screen.getByText('Test Component')).toBeInTheDocument()
    })
  })

  describe('Custom Render Options', () => {
    it('handles custom render options correctly', () => {
      const customOptions = {
        withRouter: true,
        withRedux: true,
        withQueryClient: true,
        withAuth: true,
      }
      
      customRender(<TestComponent />, customOptions)
      
      expect(screen.getByText('Test Component')).toBeInTheDocument()
    })

    it('handles partial custom render options', () => {
      const partialOptions = {
        withRouter: false,
        withRedux: true,
      }
      
      customRender(<TestComponent />, partialOptions)
      
      expect(screen.getByText('Test Component')).toBeInTheDocument()
    })
  })

  describe('Component Rendering', () => {
    it('renders complex components correctly', () => {
      const ComplexComponent = () => (
        <div>
          <header>
            <h1>Header</h1>
            <nav>
              <a href="/">Home</a>
              <a href="/about">About</a>
            </nav>
          </header>
          <main>
            <section>
              <h2>Section Title</h2>
              <p>Section content</p>
            </section>
          </main>
          <footer>
            <p>Footer content</p>
          </footer>
        </div>
      )
      
      customRender(<ComplexComponent />)
      
      expect(screen.getByText('Header')).toBeInTheDocument()
      expect(screen.getByText('Section Title')).toBeInTheDocument()
      expect(screen.getByText('Footer content')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument()
    })

    it('renders components with state correctly', () => {
      const StatefulComponent = () => {
        const [count, setCount] = React.useState(0)
        
        return (
          <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>Increment</button>
          </div>
        )
      }
      
      customRender(<StatefulComponent />)
      
      expect(screen.getByText('Count: 0')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Increment' })).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles components that throw errors gracefully', () => {
      const ErrorComponent = () => {
        throw new Error('Test error')
      }
      
      // This should not crash the test
      expect(() => {
        customRender(<ErrorComponent />)
      }).toThrow('Test error')
    })
  })
})
