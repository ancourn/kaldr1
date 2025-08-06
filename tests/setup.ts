import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: vi.fn(),
      pop: vi.fn(),
      reload: vi.fn(),
      back: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      beforePopState: vi.fn(),
      events: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js image optimization
vi.mock('next/image', () => ({
  default: (props: any) => {
    // Return a simple img element mock for testing
    return {
      type: 'img',
      props: props,
    }
  },
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}))

// Mock fetch API
global.fetch = vi.fn()

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Set up global test utilities
global.describe = describe
global.it = it
global.test = test
global.expect = expect
global.vi = vi

// Mock CSS imports
vi.mock('*.css', () => ({
  default: '',
}))

// Mock shadcn/ui components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => ({
    type: 'button',
    props: { children, ...props },
  }),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => ({
    type: 'div',
    props: { children, ...props },
  }),
  CardHeader: ({ children, ...props }: any) => ({
    type: 'div',
    props: { children, ...props },
  }),
  CardContent: ({ children, ...props }: any) => ({
    type: 'div',
    props: { children, ...props },
  }),
  CardTitle: ({ children, ...props }: any) => ({
    type: 'h3',
    props: { children, ...props },
  }),
  CardDescription: ({ children, ...props }: any) => ({
    type: 'p',
    props: { children, ...props },
  }),
}))

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, ...props }: any) => ({
    type: 'div',
    props: { children, ...props },
  }),
  TabsList: ({ children, ...props }: any) => ({
    type: 'div',
    props: { children, ...props },
  }),
  TabsTrigger: ({ children, ...props }: any) => ({
    type: 'button',
    props: { children, ...props },
  }),
  TabsContent: ({ children, ...props }: any) => ({
    type: 'div',
    props: { children, ...props },
  }),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => ({
    type: 'span',
    props: { children, ...props },
  }),
}))

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ ...props }: any) => ({
    type: 'div',
    props: { ...props },
  }),
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => ({
    type: 'div',
    props: { children, ...props },
  }),
  AlertDescription: ({ children, ...props }: any) => ({
    type: 'div',
    props: { children, ...props },
  }),
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ ...props }: any) => ({
    type: 'div',
    props: { ...props },
  }),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Activity: () => ({ type: 'svg', props: {} }),
  Network: () => ({ type: 'svg', props: {} }),
  Shield: () => ({ type: 'svg', props: {} }),
  Zap: () => ({ type: 'svg', props: {} }),
  Database: () => ({ type: 'svg', props: {} }),
  TrendingUp: () => ({ type: 'svg', props: {} }),
  Cpu: () => ({ type: 'svg', props: {} }),
  Coins: () => ({ type: 'svg', props: {} }),
  Users: () => ({ type: 'svg', props: {} }),
  ArrowRightLeft: () => ({ type: 'svg', props: {} }),
  ExternalLink: () => ({ type: 'svg', props: {} }),
}))