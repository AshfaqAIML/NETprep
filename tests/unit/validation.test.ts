/**
 * Unit tests for validation logic.
 *
 * Tests input validation for:
 * - User registration (email, password)
 * - Question creation (required fields)
 * - Book upload (file type, size)
 * - API parameter validation
 *
 * Run: bun test tests/unit/validation.test.ts
 */
import { describe, test, expect } from 'bun:test'

// --- Validation functions ---

function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' }
  }
  return { valid: true }
}

function validateQuestion(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.questionText?.trim()) {
    errors.push('questionText is required')
  }
  if (!data.optionA?.trim()) {
    errors.push('optionA is required')
  }
  if (!data.optionB?.trim()) {
    errors.push('optionB is required')
  }
  if (!['A', 'B', 'C', 'D'].includes(data.correctAnswer)) {
    errors.push('correctAnswer must be A, B, C, or D')
  }
  if (!['easy', 'medium', 'hard'].includes(data.difficulty)) {
    errors.push('difficulty must be easy, medium, or hard')
  }

  return { valid: errors.length === 0, errors }
}

function validateFileUpload(file: { name: string; type: string; size: number }): { valid: boolean; error?: string } {
  const allowedExtensions = ['.pdf']
  const maxSize = 50 * 1024 * 1024 // 50MB

  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()
  if (!allowedExtensions.includes(ext)) {
    return { valid: false, error: 'Only PDF files are allowed' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 50MB limit' }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' }
  }

  return { valid: true }
}

function validateExamDate(dateStr: string): boolean {
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

function validateSubjectCode(code: string): boolean {
  // UGC NET subject codes are 2-3 character alphanumeric
  const regex = /^[A-Z0-9]{2,3}$/i
  return regex.test(code)
}

// --- Tests ---

describe('Validation Logic', () => {
  describe('Email validation', () => {
    test('valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.user@domain.co.in')).toBe(true)
      expect(validateEmail('a@b.io')).toBe(true)
    })

    test('invalid emails', () => {
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('notanemail')).toBe(false)
      expect(validateEmail('missing@domain')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('spaces @domain.com')).toBe(false)
    })
  })

  describe('Password validation', () => {
    test('valid passwords', () => {
      expect(validatePassword('123456').valid).toBe(true)
      expect(validatePassword('securePassword123!').valid).toBe(true)
    })

    test('too short', () => {
      expect(validatePassword('12345').valid).toBe(false)
      expect(validatePassword('').valid).toBe(false)
    })

    test('returns error message', () => {
      const result = validatePassword('ab')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('at least 6')
    })
  })

  describe('Question validation', () => {
    test('valid question', () => {
      const result = validateQuestion({
        questionText: 'What is 2+2?',
        optionA: '3',
        optionB: '4',
        optionC: '5',
        optionD: '6',
        correctAnswer: 'B',
        difficulty: 'easy',
      })
      expect(result.valid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    test('missing questionText', () => {
      const result = validateQuestion({
        optionA: 'A',
        optionB: 'B',
        correctAnswer: 'A',
        difficulty: 'easy',
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('questionText is required')
    })

    test('missing options', () => {
      const result = validateQuestion({
        questionText: 'Test?',
        correctAnswer: 'A',
        difficulty: 'easy',
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('optionA is required')
      expect(result.errors).toContain('optionB is required')
    })

    test('invalid correctAnswer', () => {
      const result = validateQuestion({
        questionText: 'Test?',
        optionA: 'A',
        optionB: 'B',
        correctAnswer: 'E',
        difficulty: 'easy',
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('correctAnswer'))).toBe(true)
    })

    test('invalid difficulty', () => {
      const result = validateQuestion({
        questionText: 'Test?',
        optionA: 'A',
        optionB: 'B',
        correctAnswer: 'A',
        difficulty: 'impossible',
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('difficulty'))).toBe(true)
    })
  })

  describe('File upload validation', () => {
    test('valid PDF file', () => {
      const result = validateFileUpload({
        name: 'document.pdf',
        type: 'application/pdf',
        size: 1024 * 1024, // 1MB
      })
      expect(result.valid).toBe(true)
    })

    test('non-PDF file rejected', () => {
      const result = validateFileUpload({
        name: 'document.docx',
        type: 'application/octet-stream',
        size: 1024,
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('PDF')
    })

    test('file too large', () => {
      const result = validateFileUpload({
        name: 'large.pdf',
        type: 'application/pdf',
        size: 60 * 1024 * 1024, // 60MB
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('50MB')
    })

    test('empty file rejected', () => {
      const result = validateFileUpload({
        name: 'empty.pdf',
        type: 'application/pdf',
        size: 0,
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('empty')
    })
  })

  describe('Exam date validation', () => {
    test('valid ISO date', () => {
      expect(validateExamDate('2024-08-21')).toBe(true)
      expect(validateExamDate('2024-12-31T23:59:59Z')).toBe(true)
    })

    test('invalid date', () => {
      expect(validateExamDate('not-a-date')).toBe(false)
      expect(validateExamDate('')).toBe(false)
      expect(validateExamDate('2024-13-45')).toBe(false)
    })
  })

  describe('Subject code validation', () => {
    test('valid subject codes', () => {
      expect(validateSubjectCode('87')).toBe(true)
      expect(validateSubjectCode('08')).toBe(true)
      expect(validateSubjectCode('17B')).toBe(true)
      expect(validateSubjectCode('30')).toBe(true)
    })

    test('invalid subject codes', () => {
      expect(validateSubjectCode('')).toBe(false)
      expect(validateSubjectCode('1')).toBe(false)
      expect(validateSubjectCode('ABCD')).toBe(false) // Too long
      expect(validateSubjectCode('8!')).toBe(false) // Special char
    })
  })
})
