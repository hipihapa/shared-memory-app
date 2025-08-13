import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { configureStore } from '@reduxjs/toolkit'
import uploadFilesReducer from '@/store/slices/uploadFileSlice'

// Mock AuthContext to avoid import issues
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="auth-provider">{children}</div>
)

// Create a mock store for testing
const createTestStore = () => {
  return configureStore({
    reducer: {
      uploadFiles: uploadFilesReducer,
    },
    preloadedState: {
      uploadFiles: {
        files: [],
      },
    },
  })
}

// Create a test query client
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
  withRouter?: boolean
  withRedux?: boolean
  withQueryClient?: boolean
  withAuth?: boolean
}

const AllTheProviders = ({ 
  children, 
  withRouter = true, 
  withRedux = true, 
  withQueryClient = true, 
  withAuth = true 
}: { 
  children: React.ReactNode
  withRouter?: boolean
  withRedux?: boolean
  withQueryClient?: boolean
  withAuth?: boolean
}) => {
  let element = children

  if (withAuth) {
    element = <MockAuthProvider>{element}</MockAuthProvider>
  }

  if (withQueryClient) {
    const queryClient = createTestQueryClient()
    element = <QueryClientProvider client={queryClient}>{element}</QueryClientProvider>
  }

  if (withRedux) {
    const store = createTestStore()
    element = <Provider store={store}>{element}</Provider>
  }

  if (withRouter) {
    element = <BrowserRouter>{element}</BrowserRouter>
  }

  return element
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    withRouter = true,
    withRedux = true,
    withQueryClient = true,
    withAuth = true,
    ...renderOptions
  } = options

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders
      withRouter={withRouter}
      withRedux={withRedux}
      withQueryClient={withQueryClient}
      withAuth={withAuth}
    >
      {children}
    </AllTheProviders>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
export { createTestStore, createTestQueryClient }
