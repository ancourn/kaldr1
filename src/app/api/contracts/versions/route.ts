import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface ContractVersionData {
  version: string
  bytecode: string
  abi: string
  changelog?: string
  deploymentTx?: string
  deployedBy?: string
}

interface VersionDiff {
  version: string
  changes: {
    added: string[]
    removed: string[]
    modified: string[]
  }
  sizeChange: number
  breakingChanges: string[]
}

class VersionControlService {
  async createVersion(
    contractId: string,
    versionData: ContractVersionData,
    createdBy?: string
  ): Promise<void> {
    try {
      // Check if version already exists
      const existingVersion = await db.contractVersion.findUnique({
        where: {
          contractId_version: {
            contractId,
            version: versionData.version
          }
        }
      })

      if (existingVersion) {
        throw new Error('Version already exists for this contract')
      }

      // Update previous versions to not be latest
      await db.contractVersion.updateMany({
        where: { contractId },
        data: { isLatest: false }
      })

      // Create new version
      await db.contractVersion.create({
        data: {
          contractId,
          version: versionData.version,
          bytecode: versionData.bytecode,
          abi: versionData.abi,
          changelog: versionData.changelog,
          deploymentTx: versionData.deploymentTx,
          deployedBy: versionData.deployedBy || createdBy,
          isLatest: true,
          createdAt: new Date()
        }
      })

      // Update main contract record
      await db.smartContract.update({
        where: { id: contractId },
        data: {
          version: versionData.version,
          bytecode: versionData.bytecode,
          abi: versionData.abi,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error creating contract version:', error)
      throw new Error('Failed to create contract version')
    }
  }

  async getContractVersions(contractId: string): Promise<any[]> {
    try {
      const versions = await db.contractVersion.findMany({
        where: { contractId },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return versions.map(version => ({
        ...version,
        abi: version.abi ? JSON.parse(version.abi) : null
      }))
    } catch (error) {
      console.error('Error getting contract versions:', error)
      throw new Error('Failed to get contract versions')
    }
  }

  async getVersion(contractId: string, version: string): Promise<any | null> {
    try {
      const versionData = await db.contractVersion.findUnique({
        where: {
          contractId_version: {
            contractId,
            version
          }
        }
      })

      if (!versionData) {
        return null
      }

      return {
        ...versionData,
        abi: versionData.abi ? JSON.parse(versionData.abi) : null
      }
    } catch (error) {
      console.error('Error getting contract version:', error)
      throw new Error('Failed to get contract version')
    }
  }

  async getLatestVersion(contractId: string): Promise<any | null> {
    try {
      const versionData = await db.contractVersion.findFirst({
        where: { contractId, isLatest: true }
      })

      if (!versionData) {
        return null
      }

      return {
        ...versionData,
        abi: versionData.abi ? JSON.parse(versionData.abi) : null
      }
    } catch (error) {
      console.error('Error getting latest contract version:', error)
      throw new Error('Failed to get latest contract version')
    }
  }

  async compareVersions(
    contractId: string,
    version1: string,
    version2: string
  ): Promise<VersionDiff> {
    try {
      const v1 = await this.getVersion(contractId, version1)
      const v2 = await this.getVersion(contractId, version2)

      if (!v1 || !v2) {
        throw new Error('One or both versions not found')
      }

      // Simple bytecode comparison
      const bytecode1 = v1.bytecode
      const bytecode2 = v2.bytecode

      const changes = {
        added: [] as string[],
        removed: [] as string[],
        modified: [] as string[]
      }

      // Calculate size difference
      const sizeChange = bytecode2.length - bytecode1.length

      // Detect breaking changes (simplified)
      const breakingChanges: string[] = []
      
      try {
        const abi1 = v1.abi || []
        const abi2 = v2.abi || []

        // Check for removed functions
        const functions1 = abi1.filter((item: any) => item.type === 'function')
        const functions2 = abi2.filter((item: any) => item.type === 'function')

        functions1.forEach((func: any) => {
          const funcExists = functions2.some((f: any) => f.name === func.name)
          if (!funcExists) {
            breakingChanges.push(`Function ${func.name} removed`)
            changes.removed.push(`function ${func.name}`)
          }
        })

        // Check for modified function signatures
        functions1.forEach((func: any) => {
          const matchingFunc = functions2.find((f: any) => f.name === func.name)
          if (matchingFunc && JSON.stringify(func.inputs) !== JSON.stringify(matchingFunc.inputs)) {
            breakingChanges.push(`Function ${func.name} signature changed`)
            changes.modified.push(`function ${func.name}`)
          }
        })

        // Check for added functions
        functions2.forEach((func: any) => {
          const funcExists = functions1.some((f: any) => f.name === func.name)
          if (!funcExists) {
            changes.added.push(`function ${func.name}`)
          }
        })
      } catch (error) {
        console.warn('Error comparing ABIs:', error)
      }

      return {
        version: `${version1} -> ${version2}`,
        changes,
        sizeChange,
        breakingChanges
      }
    } catch (error) {
      console.error('Error comparing contract versions:', error)
      throw new Error('Failed to compare contract versions')
    }
  }

  async rollbackVersion(
    contractId: string,
    targetVersion: string,
    rollbackBy: string
  ): Promise<void> {
    try {
      const targetVersionData = await this.getVersion(contractId, targetVersion)
      if (!targetVersionData) {
        throw new Error('Target version not found')
      }

      // Create new version for rollback
      const rollbackVersion = `${targetVersion}-rollback-${Date.now()}`
      
      await this.createVersion({
        version: rollbackVersion,
        bytecode: targetVersionData.bytecode,
        abi: JSON.stringify(targetVersionData.abi),
        changelog: `Rollback to version ${targetVersion}`,
        deployedBy: rollbackBy
      }, rollbackBy)

      // Update contract status
      await db.smartContract.update({
        where: { id: contractId },
        data: {
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error rolling back contract version:', error)
      throw new Error('Failed to rollback contract version')
    }
  }

  async deleteVersion(contractId: string, version: string, deletedBy: string): Promise<void> {
    try {
      // Cannot delete latest version
      const versionData = await this.getVersion(contractId, version)
      if (!versionData) {
        throw new Error('Version not found')
      }

      if (versionData.isLatest) {
        throw new Error('Cannot delete the latest version')
      }

      await db.contractVersion.delete({
        where: {
          contractId_version: {
            contractId,
            version
          }
        }
      })
    } catch (error) {
      console.error('Error deleting contract version:', error)
      throw new Error('Failed to delete contract version')
    }
  }

  async getVersionHistory(contractId: string): Promise<{
    totalVersions: number
    latestVersion: string
    oldestVersion: string
    averageSize: number
    deploymentTimeline: Array<{
      version: string
      deployedAt: Date
      deployedBy: string
      size: number
    }>
  }> {
    try {
      const versions = await db.contractVersion.findMany({
        where: { contractId },
        orderBy: {
          createdAt: 'asc'
        }
      })

      if (versions.length === 0) {
        return {
          totalVersions: 0,
          latestVersion: '',
          oldestVersion: '',
          averageSize: 0,
          deploymentTimeline: []
        }
      }

      const totalSize = versions.reduce((sum, v) => sum + v.bytecode.length, 0)
      const averageSize = totalSize / versions.length

      const deploymentTimeline = versions.map(v => ({
        version: v.version,
        deployedAt: v.createdAt,
        deployedBy: v.deployedBy || 'Unknown',
        size: v.bytecode.length
      }))

      return {
        totalVersions: versions.length,
        latestVersion: versions[versions.length - 1].version,
        oldestVersion: versions[0].version,
        averageSize,
        deploymentTimeline
      }
    } catch (error) {
      console.error('Error getting version history:', error)
      throw new Error('Failed to get version history')
    }
  }

  async validateVersion(contractId: string, version: string): Promise<{
    isValid: boolean
    issues: string[]
    warnings: string[]
  }> {
    try {
      const versionData = await this.getVersion(contractId, version)
      if (!versionData) {
        return {
          isValid: false,
          issues: ['Version not found'],
          warnings: []
        }
      }

      const issues: string[] = []
      const warnings: string[] = []

      // Validate bytecode
      if (!versionData.bytecode || versionData.bytecode.length < 10) {
        issues.push('Invalid bytecode')
      }

      // Validate ABI
      try {
        const abi = JSON.parse(versionData.abi)
        if (!Array.isArray(abi)) {
          issues.push('Invalid ABI format')
        }
      } catch (error) {
        issues.push('Invalid ABI JSON')
      }

      // Check for potential issues
      if (versionData.bytecode.includes('00')) {
        warnings.push('Bytecode contains zero padding - may indicate incomplete compilation')
      }

      if (versionData.bytecode.length > 24576) {
        warnings.push('Contract size exceeds Ethereum limit (24KB)')
      }

      return {
        isValid: issues.length === 0,
        issues,
        warnings
      }
    } catch (error) {
      console.error('Error validating contract version:', error)
      throw new Error('Failed to validate contract version')
    }
  }
}

const versionControlService = new VersionControlService()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { action, ...params } = await request.json()

    switch (action) {
      case 'createVersion':
        const { contractId, versionData } = params
        if (!contractId || !versionData || !versionData.version || !versionData.bytecode) {
          return NextResponse.json({ 
            success: false, 
            error: 'Contract ID, version, and bytecode are required' 
          }, { status: 400 })
        }

        // Check if user has permission to create version
        const contract = await db.smartContract.findUnique({
          where: { id: contractId },
          select: { userId: true }
        })

        if (!contract) {
          return NextResponse.json({ success: false, error: 'Contract not found' }, { status: 404 })
        }

        if (contract.userId !== session.user.id && session.user.role !== 'ADMIN') {
          return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
        }

        await versionControlService.createVersion(
          contractId,
          versionData,
          session.user.email
        )

        return NextResponse.json({ success: true, message: 'Version created successfully' })

      case 'getVersions':
        const { contractId: versionsContractId } = params
        if (!versionsContractId) {
          return NextResponse.json({ success: false, error: 'Contract ID required' }, { status: 400 })
        }

        const versions = await versionControlService.getContractVersions(versionsContractId)
        return NextResponse.json({ success: true, data: versions })

      case 'getVersion':
        const { contractId: versionContractId, version } = params
        if (!versionContractId || !version) {
          return NextResponse.json({ success: false, error: 'Contract ID and version required' }, { status: 400 })
        }

        const versionData = await versionControlService.getVersion(versionContractId, version)
        if (!versionData) {
          return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: versionData })

      case 'getLatestVersion':
        const { contractId: latestContractId } = params
        if (!latestContractId) {
          return NextResponse.json({ success: false, error: 'Contract ID required' }, { status: 400 })
        }

        const latestVersion = await versionControlService.getLatestVersion(latestContractId)
        return NextResponse.json({ success: true, data: latestVersion })

      case 'compareVersions':
        const { contractId: compareContractId, version1, version2 } = params
        if (!compareContractId || !version1 || !version2) {
          return NextResponse.json({ success: false, error: 'Contract ID and both versions required' }, { status: 400 })
        }

        const diff = await versionControlService.compareVersions(compareContractId, version1, version2)
        return NextResponse.json({ success: true, data: diff })

      case 'rollback':
        const { contractId: rollbackContractId, targetVersion } = params
        if (!rollbackContractId || !targetVersion) {
          return NextResponse.json({ success: false, error: 'Contract ID and target version required' }, { status: 400 })
        }

        const rollbackContract = await db.smartContract.findUnique({
          where: { id: rollbackContractId },
          select: { userId: true }
        })

        if (!rollbackContract) {
          return NextResponse.json({ success: false, error: 'Contract not found' }, { status: 404 })
        }

        if (rollbackContract.userId !== session.user.id && session.user.role !== 'ADMIN') {
          return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
        }

        await versionControlService.rollbackVersion(
          rollbackContractId,
          targetVersion,
          session.user.email
        )

        return NextResponse.json({ success: true, message: 'Rollback completed successfully' })

      case 'deleteVersion':
        const { contractId: deleteContractId, version: deleteVersion } = params
        if (!deleteContractId || !deleteVersion) {
          return NextResponse.json({ success: false, error: 'Contract ID and version required' }, { status: 400 })
        }

        const deleteContract = await db.smartContract.findUnique({
          where: { id: deleteContractId },
          select: { userId: true }
        })

        if (!deleteContract) {
          return NextResponse.json({ success: false, error: 'Contract not found' }, { status: 404 })
        }

        if (deleteContract.userId !== session.user.id && session.user.role !== 'ADMIN') {
          return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
        }

        await versionControlService.deleteVersion(deleteContractId, deleteVersion, session.user.email)
        return NextResponse.json({ success: true, message: 'Version deleted successfully' })

      case 'getVersionHistory':
        const { contractId: historyContractId } = params
        if (!historyContractId) {
          return NextResponse.json({ success: false, error: 'Contract ID required' }, { status: 400 })
        }

        const history = await versionControlService.getVersionHistory(historyContractId)
        return NextResponse.json({ success: true, data: history })

      case 'validateVersion':
        const { contractId: validateContractId, version: validateVersion } = params
        if (!validateContractId || !validateVersion) {
          return NextResponse.json({ success: false, error: 'Contract ID and version required' }, { status: 400 })
        }

        const validation = await versionControlService.validateVersion(validateContractId, validateVersion)
        return NextResponse.json({ success: true, data: validation })

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Version control error:', error)
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
      case 'getVersions':
        const contractId = searchParams.get('contractId')
        if (!contractId) {
          return NextResponse.json({ success: false, error: 'Contract ID required' }, { status: 400 })
        }

        const versions = await versionControlService.getContractVersions(contractId)
        return NextResponse.json({ success: true, data: versions })

      case 'getVersion':
        const versionContractId = searchParams.get('contractId')
        const version = searchParams.get('version')
        if (!versionContractId || !version) {
          return NextResponse.json({ success: false, error: 'Contract ID and version required' }, { status: 400 })
        }

        const versionData = await versionControlService.getVersion(versionContractId, version)
        if (!versionData) {
          return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: versionData })

      case 'getLatestVersion':
        const latestContractId = searchParams.get('contractId')
        if (!latestContractId) {
          return NextResponse.json({ success: false, error: 'Contract ID required' }, { status: 400 })
        }

        const latestVersion = await versionControlService.getLatestVersion(latestContractId)
        return NextResponse.json({ success: true, data: latestVersion })

      case 'getVersionHistory':
        const historyContractId = searchParams.get('contractId')
        if (!historyContractId) {
          return NextResponse.json({ success: false, error: 'Contract ID required' }, { status: 400 })
        }

        const history = await versionControlService.getVersionHistory(historyContractId)
        return NextResponse.json({ success: true, data: history })

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Version control error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}