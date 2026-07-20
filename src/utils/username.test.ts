import { describe, expect, it } from 'vitest'
import {
  classifyLoginIdentifier,
  isValidUsername,
  normalizeUsername,
} from './username'

describe('normalizeUsername', () => {
  it('przycina spacje i obniża wielkość liter', () => {
    expect(normalizeUsername('  MikoLaj_88 ')).toBe('mikolaj_88')
  })
})

describe('isValidUsername', () => {
  it('akceptuje poprawne nazwy (także po normalizacji)', () => {
    expect(isValidUsername('mikolaj')).toBe(true)
    expect(isValidUsername('MIKOLAJ')).toBe(true)
    expect(isValidUsername('miko.laj-88_x')).toBe(true)
    expect(isValidUsername('abc')).toBe(true)
    expect(isValidUsername('a'.repeat(20))).toBe(true)
  })

  it('odrzuca za krótkie, za długie i zły charset', () => {
    expect(isValidUsername('ab')).toBe(false)
    expect(isValidUsername('a'.repeat(21))).toBe(false)
    expect(isValidUsername('.start-kropka')).toBe(false)
    expect(isValidUsername('miko laj')).toBe(false)
    expect(isValidUsername('miko@laj')).toBe(false)
    expect(isValidUsername('żółty')).toBe(false)
    expect(isValidUsername('')).toBe(false)
  })
})

describe('classifyLoginIdentifier', () => {
  it('wszystko z @ traktuje jako e-mail', () => {
    expect(classifyLoginIdentifier('user@example.com')).toBe('email')
    expect(classifyLoginIdentifier('  user@example.com  ')).toBe('email')
  })

  it('poprawną nazwę traktuje jako username', () => {
    expect(classifyLoginIdentifier('mikolaj')).toBe('username')
    expect(classifyLoginIdentifier(' MikoLaj ')).toBe('username')
  })

  it('puste i niepoprawne wartości oznacza jako invalid', () => {
    expect(classifyLoginIdentifier('')).toBe('invalid')
    expect(classifyLoginIdentifier('   ')).toBe('invalid')
    expect(classifyLoginIdentifier('ab')).toBe('invalid')
    expect(classifyLoginIdentifier('miko laj')).toBe('invalid')
  })
})
