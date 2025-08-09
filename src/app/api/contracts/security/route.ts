import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface Vulnerability {
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  line?: number
  code?: string
  recommendation: string
  cve?: string
  references?: string[]
}

interface AuditConfig {
  checkReentrancy: boolean
  checkOverflow: boolean
  checkAccessControl: boolean
  checkLogicFlaws: boolean
  checkGasOptimization: boolean
  enableStaticAnalysis: boolean
  enableDynamicAnalysis: boolean
}

interface SecurityAuditResult {
  score: number
  vulnerabilities: Vulnerability[]
  recommendations: string[]
  gasOptimizations: string[]
  complexityMetrics: {
    cyclomaticComplexity: number
    linesOfCode: number
    functionsCount: number
    dependenciesCount: number
  }
  auditMetadata: {
    duration: number
    toolsUsed: string[]
    auditDate: Date
    auditor: string
  }
}

class SecurityAuditService {
  private vulnerabilityPatterns = {
    reentrancy: {
      pattern: /(?:\.call\s*\(|\.delegatecall\s*\(|\.callcode\s*\(|\.staticcall\s*\()/g,
      severity: 'HIGH' as const,
      description: 'Potential reentrancy vulnerability detected',
      recommendation: 'Use checks-effects-interactions pattern or reentrancy guards'
    },
    overflow: {
      pattern: /(?:\+\s*\w+\s*;|\w+\s*\+\s*;|-\s*\w+\s*;|\w+\s*-\s*;)/g,
      severity: 'MEDIUM' as const,
      description: 'Potential integer overflow/underflow detected',
      recommendation: 'Use SafeMath or built-in overflow checks'
    },
    accessControl: {
      pattern: /(?:public|external)\s+function\s+\w+\s*\([^)]*\)\s*(?!.*onlyOwner)/g,
      severity: 'MEDIUM' as const,
      description: 'Function lacks access control',
      recommendation: 'Add appropriate access control modifiers'
    },
    unhandledCall: {
      pattern: /\.call\s*\([^)]*\)\s*(?!\.wait\(\))/g,
      severity: 'MEDIUM' as const,
      description: 'Call result not handled',
      recommendation: 'Always check the return value of low-level calls'
    },
    txOrigin: {
      pattern: /tx\.origin/g,
      severity: 'HIGH' as const,
      description: 'Use of tx.origin for authentication',
      recommendation: 'Use msg.sender instead of tx.origin'
    },
    suicide: {
      pattern: /(?:suicide|selfdestruct)\s*\(/g,
      severity: 'MEDIUM' as const,
      description: 'Use of selfdestruct detected',
      recommendation: 'Use selfdestruct carefully and only when necessary'
    }
  }

  async performStaticAnalysis(
    contractId: string,
    bytecode: string,
    sourceCode?: string
  ): Promise<SecurityAuditResult> {
    const startTime = Date.now()
    const vulnerabilities: Vulnerability[] = []
    const recommendations: string[] = []
    const gasOptimizations: string[] = []

    try {
      // Get contract details
      const contract = await db.smartContract.findUnique({
        where: { id: contractId },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      if (!contract) {
        throw new Error('Contract not found')
      }

      // Analyze source code if provided
      if (sourceCode) {
        const sourceAnalysis = this.analyzeSourceCode(sourceCode)
        vulnerabilities.push(...sourceAnalysis.vulnerabilities)
        recommendations.push(...sourceAnalysis.recommendations)
        gasOptimizations.push(...sourceAnalysis.gasOptimizations)
      }

      // Analyze bytecode patterns
      const bytecodeAnalysis = this.analyzeBytecode(bytecode)
      vulnerabilities.push(...bytecodeAnalysis.vulnerabilities)
      recommendations.push(...bytecodeAnalysis.recommendations)

      // Calculate security score
      const score = this.calculateSecurityScore(vulnerabilities)

      // Generate complexity metrics
      const complexityMetrics = this.calculateComplexityMetrics(sourceCode || bytecode)

      const auditDuration = Date.now() - startTime

      return {
        score,
        vulnerabilities,
        recommendations,
        gasOptimizations,
        complexityMetrics,
        auditMetadata: {
          duration: auditDuration,
          toolsUsed: ['StaticAnalyzer', 'BytecodeAnalyzer', 'PatternMatcher'],
          auditDate: new Date(),
          auditor: 'Automated Security Auditor'
        }
      }
    } catch (error) {
      console.error('Error performing static analysis:', error)
      throw new Error('Failed to perform static analysis')
    }
  }

  private analyzeSourceCode(sourceCode: string): {
    vulnerabilities: Vulnerability[]
    recommendations: string[]
    gasOptimizations: string[]
  } {
    const vulnerabilities: Vulnerability[] = []
    const recommendations: string[] = []
    const gasOptimizations: string[] = []

    const lines = sourceCode.split('\n')

    // Check for vulnerability patterns
    Object.entries(this.vulnerabilityPatterns).forEach(([type, pattern]) => {
      const matches = sourceCode.match(pattern.pattern)
      if (matches) {
        matches.forEach((match, index) => {
          const lineNumber = this.findLineNumber(sourceCode, match, index)
          vulnerabilities.push({
            type,
            severity: pattern.severity,
            description: pattern.description,
            line: lineNumber,
            code: this.extractLine(sourceCode, lineNumber),
            recommendation: pattern.recommendation
          })
        })
      }
    })

    // Additional checks
    this.checkForGasOptimizations(sourceCode, gasOptimizations)
    this.checkForBestPractices(sourceCode, recommendations)

    return { vulnerabilities, recommendations, gasOptimizations }
  }

  private analyzeBytecode(bytecode: string): {
    vulnerabilities: Vulnerability[]
    recommendations: string[]
  } {
    const vulnerabilities: Vulnerability[] = []
    const recommendations: string[] = []

    // Basic bytecode analysis patterns
    const dangerousOpcodes = [
      { opcode: 'SELFDESTRUCT', severity: 'MEDIUM' as const, description: 'Selfdestruct opcode detected' },
      { opcode: 'CALLCODE', severity: 'MEDIUM' as const, description: 'Callcode opcode detected' },
      { opcode: 'DELEGATECALL', severity: 'MEDIUM' as const, description: 'Delegatecall opcode detected' }
    ]

    dangerousOpcodes.forEach(({ opcode, severity, description }) => {
      if (bytecode.includes(opcode.toLowerCase())) {
        vulnerabilities.push({
          type: 'DANGEROUS_OPCODE',
          severity,
          description,
          recommendation: `Review usage of ${opcode} opcode for potential security issues`
        })
      }
    })

    // Check for obvious patterns
    if (bytecode.length < 100) {
      vulnerabilities.push({
        type: 'SMALL_BYTECODE',
        severity: 'LOW' as const,
        description: 'Bytecode size is unusually small',
        recommendation: 'Verify contract integrity and functionality'
      })
    }

    return { vulnerabilities, recommendations }
  }

  private findLineNumber(sourceCode: string, match: string, occurrenceIndex: number): number {
    const lines = sourceCode.split('\n')
    let foundCount = 0
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match)) {
        if (foundCount === occurrenceIndex) {
          return i + 1
        }
        foundCount++
      }
    }
    
    return -1
  }

  private extractLine(sourceCode: string, lineNumber: number): string {
    const lines = sourceCode.split('\n')
    return lines[lineNumber - 1] || ''
  }

  private checkForGasOptimizations(sourceCode: string, gasOptimizations: string[]): void {
    // Check for common gas optimization opportunities
    if (sourceCode.includes('uint256')) {
      gasOptimizations.push('Consider using smaller uint types (uint32, uint64, etc.) where possible')
    }

    if (sourceCode.includes('storage')) {
      gasOptimizations.push('Minimize storage usage to reduce gas costs')
    }

    if (sourceCode.includes('require(')) {
      gasOptimizations.push('Use custom errors instead of require() statements for gas efficiency')
    }

    if (sourceCode.includes('.length > 0')) {
      gasOptimizations.push('Use != 0 instead of > 0 for empty checks')
    }
  }

  private checkForBestPractices(sourceCode: string, recommendations: string[]): void {
    // Check for best practices
    if (!sourceCode.includes('pragma solidity ^0.8.0')) {
      recommendations.push('Consider using Solidity 0.8.0 or higher for built-in overflow protection')
    }

    if (sourceCode.includes('transfer(')) {
      recommendations.push('Consider using call() instead of transfer() for better gas efficiency')
    }

    if (!sourceCode.includes('SPDX-License-Identifier')) {
      recommendations.push('Add SPDX license identifier for better compliance')
    }
  }

  private calculateSecurityScore(vulnerabilities: Vulnerability[]): number {
    let score = 100
    const severityWeights = {
      LOW: 5,
      MEDIUM: 15,
      HIGH: 30,
      CRITICAL: 50
    }

    vulnerabilities.forEach(vuln => {
      score -= severityWeights[vuln.severity]
    })

    return Math.max(0, Math.min(100, score))
  }

  private calculateComplexityMetrics(code: string): {
    cyclomaticComplexity: number
    linesOfCode: number
    functionsCount: number
    dependenciesCount: number
  } {
    const lines = code.split('\n')
    const linesOfCode = lines.filter(line => line.trim() !== '').length
    
    // Count function declarations
    const functionsCount = (code.match(/function\s+\w+/g) || []).length
    
    // Count control structures for cyclomatic complexity
    const controlStructures = (code.match(/(?:if|else|while|for|do|switch|case|catch)\s*\(/g) || []).length
    const cyclomaticComplexity = controlStructures + 1
    
    // Count external calls/dependencies
    const dependenciesCount = (code.match(/(?:\.call|\.transfer|\.send|\.delegatecall|\.staticcall)/g) || []).length

    return {
      cyclomaticComplexity,
      linesOfCode,
      functionsCount,
      dependenciesCount
    }
  }

  async createSecurityAudit(
    contractId: string,
    auditResult: SecurityAuditResult,
    auditType: string = 'STATIC',
    auditorId?: string
  ): Promise<void> {
    try {
      await db.securityAudit.create({
        data: {
          contractId,
          auditType: auditType as any,
          status: 'COMPLETED',
          score: auditResult.score,
          vulnerabilities: JSON.stringify(auditResult.vulnerabilities),
          recommendations: JSON.stringify(auditResult.recommendations),
          auditorId,
          auditDate: new Date(),
          report: JSON.stringify({
            ...auditResult,
            auditType,
            auditorId
          }),
          autoGenerated: !auditorId
        }
      })
    } catch (error) {
      console.error('Error creating security audit:', error)
      throw new Error('Failed to create security audit')
    }
  }

  async getContractAudits(contractId: string): Promise<any[]> {
    try {
      const audits = await db.securityAudit.findMany({
        where: { contractId },
        include: {
          auditor: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          auditDate: 'desc'
        }
      })

      return audits.map(audit => ({
        ...audit,
        vulnerabilities: audit.vulnerabilities ? JSON.parse(audit.vulnerabilities) : [],
        recommendations: audit.recommendations ? JSON.parse(audit.recommendations) : [],
        report: audit.report ? JSON.parse(audit.report) : null
      }))
    } catch (error) {
      console.error('Error getting contract audits:', error)
      throw new Error('Failed to get contract audits')
    }
  }

  async getAuditSummary(contractId: string): Promise<{
    totalAudits: number
    averageScore: number
    latestAudit: any
    vulnerabilityCount: {
      low: number
      medium: number
      high: number
      critical: number
    }
  }> {
    try {
      const audits = await db.securityAudit.findMany({
        where: { contractId },
        select: {
          score: true,
          vulnerabilities: true,
          auditDate: true
        },
        orderBy: {
          auditDate: 'desc'
        }
      })

      if (audits.length === 0) {
        return {
          totalAudits: 0,
          averageScore: 0,
          latestAudit: null,
          vulnerabilityCount: { low: 0, medium: 0, high: 0, critical: 0 }
        }
      }

      const totalScore = audits.reduce((sum, audit) => sum + audit.score, 0)
      const averageScore = totalScore / audits.length

      const vulnerabilityCount = { low: 0, medium: 0, high: 0, critical: 0 }
      audits.forEach(audit => {
        const vulnerabilities = audit.vulnerabilities ? JSON.parse(audit.vulnerabilities) : []
        vulnerabilities.forEach((vuln: any) => {
          switch (vuln.severity) {
            case 'LOW':
              vulnerabilityCount.low++
              break
            case 'MEDIUM':
              vulnerabilityCount.medium++
              break
            case 'HIGH':
              vulnerabilityCount.high++
              break
            case 'CRITICAL':
              vulnerabilityCount.critical++
              break
          }
        })
      })

      return {
        totalAudits: audits.length,
        averageScore,
        latestAudit: audits[0],
        vulnerabilityCount
      }
    } catch (error) {
      console.error('Error getting audit summary:', error)
      throw new Error('Failed to get audit summary')
    }
  }
}

const securityAuditService = new SecurityAuditService()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { action, ...params } = await request.json()

    switch (action) {
      case 'performAudit':
        const { contractId, bytecode, sourceCode, auditType } = params
        if (!contractId || !bytecode) {
          return NextResponse.json({ success: false, error: 'Contract ID and bytecode required' }, { status: 400 })
        }

        // Check if user has permission to audit this contract
        const contract = await db.smartContract.findUnique({
          where: { id: contractId },
          select: { userId: true }
        })

        if (!contract) {
          return NextResponse.json({ success: false, error: 'Contract not found' }, { status: 404 })
        }

        // Only contract owner, admin, or auditor can perform audits
        if (contract.userId !== session.user.id && 
            session.user.role !== 'ADMIN' && 
            session.user.role !== 'AUDITOR') {
          return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
        }

        const auditResult = await securityAuditService.performStaticAnalysis(
          contractId,
          bytecode,
          sourceCode
        )

        await securityAuditService.createSecurityAudit(
          contractId,
          auditResult,
          auditType || 'STATIC',
          session.user.id
        )

        return NextResponse.json({ success: true, data: auditResult })

      case 'getAudits':
        const { contractId: auditContractId } = params
        if (!auditContractId) {
          return NextResponse.json({ success: false, error: 'Contract ID required' }, { status: 400 })
        }

        const audits = await securityAuditService.getContractAudits(auditContractId)
        return NextResponse.json({ success: true, data: audits })

      case 'getAuditSummary':
        const { contractId: summaryContractId } = params
        if (!summaryContractId) {
          return NextResponse.json({ success: false, error: 'Contract ID required' }, { status: 400 })
        }

        const summary = await securityAuditService.getAuditSummary(summaryContractId)
        return NextResponse.json({ success: true, data: summary })

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Security audit error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'getAudits':
        const contractId = searchParams.get('contractId')
        if (!contractId) {
          return NextResponse.json({ success: false, error: 'Contract ID required' }, { status: 400 })
        }

        const audits = await securityAuditService.getContractAudits(contractId)
        return NextResponse.json({ success: true, data: audits })

      case 'getAuditSummary':
        const summaryContractId = searchParams.get('contractId')
        if (!summaryContractId) {
          return NextResponse.json({ success: false, error: 'Contract ID required' }, { status: 400 })
        }

        const summary = await securityAuditService.getAuditSummary(summaryContractId)
        return NextResponse.json({ success: true, data: summary })

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Security audit error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}