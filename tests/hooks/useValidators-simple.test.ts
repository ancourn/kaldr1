import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useValidators } from '@/hooks/useValidators'

// Mock React hooks
vi.mock('react', () => ({
  useState: (initial: any) => {
    const state = initial
    const setState = vi.fn()
    return [state, setState]
  },
  useEffect: vi.fn(),
}))

describe('useValidators Simple', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useValidators).toBeDefined()
  })

  it('should return expected structure', () => {
    const result = useValidators()
    
    expect(result).toHaveProperty('validators')
    expect(result).toHaveProperty('stats')
    expect(result).toHaveProperty('loading')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('refetch')
  })
})