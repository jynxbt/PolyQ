import { describe, it, expect } from 'vitest'
import { runSync } from '../src/workspace/process'

describe('runSync', () => {
  it('captures stdout from a successful command', () => {
    const result = runSync('echo hello')
    expect(result.ok).toBe(true)
    expect(result.output).toBe('hello')
  })

  it('returns ok=false for failing commands', () => {
    const result = runSync('false')
    expect(result.ok).toBe(false)
  })

  it('respects timeout', () => {
    const result = runSync('sleep 10', { timeout: 100 })
    expect(result.ok).toBe(false)
  })
})
