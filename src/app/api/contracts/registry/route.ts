import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface RegistryFilters {
  search?: string
  type?: string
  status?: string
  category?: string
  verified?: boolean
  featured?: boolean
  owner?: string
  tags?: string[]
  minGasUsed?: number
  maxGasUsed?: number
  dateFrom?: string
  dateTo?: string
  sortBy?: 'name' | 'createdAt' | 'usageCount' | 'popularityScore' | 'gasUsed'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface RegistryEntry {
  id: string
  contract: {
    id: string
    name: string
    address: string
    version: string
    type: string
    status: string
    creator: string
    description?: string
    tags?: string[]
    gasUsed?: string
    createdAt: Date
    updatedAt: Date
  }
  registry: {
    isPublic: boolean
    verified: boolean
    verificationDate?: Date
    verifiedBy?: string
    usageCount: number
    totalGasUsed: string
    popularityScore: number
    featured: boolean
    category?: string
    website?: string
    socialLinks?: any
    createdAt: Date
    updatedAt: Date
  }
  owner?: {
    name: string
    email: string
    role: string
  }
}

class ContractRegistryService {
  async searchContracts(filters: RegistryFilters): Promise<{
    contracts: RegistryEntry[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const {
      search,
      type,
      status,
      category,
      verified,
      featured,
      owner,
      tags,
      minGasUsed,
      maxGasUsed,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = filters

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      registry: {
        isPublic: true
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    if (category) {
      where.registry.category = category
    }

    if (verified !== undefined) {
      where.registry.verified = verified
    }

    if (featured !== undefined) {
      where.registry.featured = featured
    }

    if (owner) {
      where.creator = { contains: owner, mode: 'insensitive' }
    }

    if (tags && tags.length > 0) {
      where.tags = {
        path: '$',
        array_contains: tags
      }
    }

    if (minGasUsed !== undefined || maxGasUsed !== undefined) {
      where.gasUsed = {}
      if (minGasUsed !== undefined) {
        where.gasUsed.gte = BigInt(minGasUsed)
      }
      if (maxGasUsed !== undefined) {
        where.gasUsed.lte = BigInt(maxGasUsed)
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    // Build order by clause
    const orderBy: any = {}
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder
        break
      case 'createdAt':
        orderBy.createdAt = sortOrder
        break
      case 'usageCount':
        orderBy.registry = { usageCount: sortOrder }
        break
      case 'popularityScore':
        orderBy.registry = { popularityScore: sortOrder }
        break
      case 'gasUsed':
        orderBy.gasUsed = sortOrder
        break
      default:
        orderBy.createdAt = 'desc'
    }

    try {
      // Get total count
      const total = await db.smartContract.count({ where })

      // Get contracts with pagination
      const contracts = await db.smartContract.findMany({
        where,
        include: {
          registry: true,
          user: {
            select: {
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      })

      const totalPages = Math.ceil(total / limit)

      // Transform to registry entries
      const registryEntries: RegistryEntry[] = contracts.map(contract => ({
        id: contract.id,
        contract: {
          id: contract.id,
          name: contract.name,
          address: contract.address,
          version: contract.version,
          type: contract.type,
          status: contract.status,
          creator: contract.creator,
          description: contract.description,
          tags: contract.tags ? JSON.parse(contract.tags) : [],
          gasUsed: contract.gasUsed?.toString(),
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt
        },
        registry: {
          isPublic: contract.registry?.isPublic ?? true,
          verified: contract.registry?.verified ?? false,
          verificationDate: contract.registry?.verificationDate,
          verifiedBy: contract.registry?.verifiedBy,
          usageCount: contract.registry?.usageCount ?? 0,
          totalGasUsed: contract.registry?.totalGasUsed?.toString() ?? '0',
          popularityScore: contract.registry?.popularityScore ?? 0,
          featured: contract.registry?.featured ?? false,
          category: contract.registry?.category,
          website: contract.registry?.website,
          socialLinks: contract.registry?.socialLinks ? JSON.parse(contract.registry.socialLinks) : undefined,
          createdAt: contract.registry?.createdAt ?? contract.createdAt,
          updatedAt: contract.registry?.updatedAt ?? contract.updatedAt
        },
        owner: contract.user ? {
          name: contract.user.name || '',
          email: contract.user.email,
          role: contract.user.role
        } : undefined
      }))

      return {
        contracts: registryEntries,
        total,
        page,
        limit,
        totalPages
      }
    } catch (error) {
      console.error('Error searching contracts:', error)
      throw new Error('Failed to search contracts')
    }
  }

  async getContractById(id: string): Promise<RegistryEntry | null> {
    try {
      const contract = await db.smartContract.findUnique({
        where: { id },
        include: {
          registry: true,
          user: {
            select: {
              name: true,
              email: true,
              role: true
            }
          },
          audits: {
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
          },
          versions: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      })

      if (!contract) {
        return null
      }

      return {
        id: contract.id,
        contract: {
          id: contract.id,
          name: contract.name,
          address: contract.address,
          version: contract.version,
          type: contract.type,
          status: contract.status,
          creator: contract.creator,
          description: contract.description,
          tags: contract.tags ? JSON.parse(contract.tags) : [],
          gasUsed: contract.gasUsed?.toString(),
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt
        },
        registry: {
          isPublic: contract.registry?.isPublic ?? true,
          verified: contract.registry?.verified ?? false,
          verificationDate: contract.registry?.verificationDate,
          verifiedBy: contract.registry?.verifiedBy,
          usageCount: contract.registry?.usageCount ?? 0,
          totalGasUsed: contract.registry?.totalGasUsed?.toString() ?? '0',
          popularityScore: contract.registry?.popularityScore ?? 0,
          featured: contract.registry?.featured ?? false,
          category: contract.registry?.category,
          website: contract.registry?.website,
          socialLinks: contract.registry?.socialLinks ? JSON.parse(contract.registry.socialLinks) : undefined,
          createdAt: contract.registry?.createdAt ?? contract.createdAt,
          updatedAt: contract.registry?.updatedAt ?? contract.updatedAt
        },
        owner: contract.user ? {
          name: contract.user.name || '',
          email: contract.user.email,
          role: contract.user.role
        } : undefined
      }
    } catch (error) {
      console.error('Error getting contract by ID:', error)
      throw new Error('Failed to get contract')
    }
  }

  async addToRegistry(contractId: string, registryData: {
    isPublic?: boolean
    category?: string
    website?: string
    socialLinks?: any
  }): Promise<void> {
    try {
      await db.contractRegistry.upsert({
        where: { contractId },
        update: {
          isPublic: registryData.isPublic ?? true,
          category: registryData.category,
          website: registryData.website,
          socialLinks: registryData.socialLinks ? JSON.stringify(registryData.socialLinks) : null,
          updatedAt: new Date()
        },
        create: {
          contractId,
          isPublic: registryData.isPublic ?? true,
          category: registryData.category,
          website: registryData.website,
          socialLinks: registryData.socialLinks ? JSON.stringify(registryData.socialLinks) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error adding contract to registry:', error)
      throw new Error('Failed to add contract to registry')
    }
  }

  async verifyContract(contractId: string, verifiedBy: string): Promise<void> {
    try {
      await db.contractRegistry.update({
        where: { contractId },
        data: {
          verified: true,
          verificationDate: new Date(),
          verifiedBy,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error verifying contract:', error)
      throw new Error('Failed to verify contract')
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const contracts = await db.smartContract.findMany({
        where: {
          registry: {
            isPublic: true,
            category: {
              not: null
            }
          }
        },
        select: {
          registry: {
            select: {
              category: true
            }
          }
        }
      })

      const categories = new Set<string>()
      contracts.forEach(contract => {
        if (contract.registry?.category) {
          categories.add(contract.registry.category)
        }
      })

      return Array.from(categories).sort()
    } catch (error) {
      console.error('Error getting categories:', error)
      throw new Error('Failed to get categories')
    }
  }

  async getFeaturedContracts(): Promise<RegistryEntry[]> {
    try {
      const contracts = await db.smartContract.findMany({
        where: {
          registry: {
            isPublic: true,
            featured: true
          }
        },
        include: {
          registry: true,
          user: {
            select: {
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          registry: {
            popularityScore: 'desc'
          }
        },
        take: 10
      })

      return contracts.map(contract => ({
        id: contract.id,
        contract: {
          id: contract.id,
          name: contract.name,
          address: contract.address,
          version: contract.version,
          type: contract.type,
          status: contract.status,
          creator: contract.creator,
          description: contract.description,
          tags: contract.tags ? JSON.parse(contract.tags) : [],
          gasUsed: contract.gasUsed?.toString(),
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt
        },
        registry: {
          isPublic: contract.registry?.isPublic ?? true,
          verified: contract.registry?.verified ?? false,
          verificationDate: contract.registry?.verificationDate,
          verifiedBy: contract.registry?.verifiedBy,
          usageCount: contract.registry?.usageCount ?? 0,
          totalGasUsed: contract.registry?.totalGasUsed?.toString() ?? '0',
          popularityScore: contract.registry?.popularityScore ?? 0,
          featured: contract.registry?.featured ?? false,
          category: contract.registry?.category,
          website: contract.registry?.website,
          socialLinks: contract.registry?.socialLinks ? JSON.parse(contract.registry.socialLinks) : undefined,
          createdAt: contract.registry?.createdAt ?? contract.createdAt,
          updatedAt: contract.registry?.updatedAt ?? contract.updatedAt
        },
        owner: contract.user ? {
          name: contract.user.name || '',
          email: contract.user.email,
          role: contract.user.role
        } : undefined
      }))
    } catch (error) {
      console.error('Error getting featured contracts:', error)
      throw new Error('Failed to get featured contracts')
    }
  }
}

const registryService = new ContractRegistryService()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'search':
        const filters: RegistryFilters = {
          search: searchParams.get('search') || undefined,
          type: searchParams.get('type') || undefined,
          status: searchParams.get('status') || undefined,
          category: searchParams.get('category') || undefined,
          verified: searchParams.get('verified') === 'true',
          featured: searchParams.get('featured') === 'true',
          owner: searchParams.get('owner') || undefined,
          tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
          minGasUsed: searchParams.get('minGasUsed') ? parseInt(searchParams.get('minGasUsed')!) : undefined,
          maxGasUsed: searchParams.get('maxGasUsed') ? parseInt(searchParams.get('maxGasUsed')!) : undefined,
          dateFrom: searchParams.get('dateFrom') || undefined,
          dateTo: searchParams.get('dateTo') || undefined,
          sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
          sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
          page: parseInt(searchParams.get('page') || '1'),
          limit: parseInt(searchParams.get('limit') || '20')
        }

        const searchResults = await registryService.searchContracts(filters)
        return NextResponse.json({ success: true, data: searchResults })

      case 'getById':
        const id = searchParams.get('id')
        if (!id) {
          return NextResponse.json({ success: false, error: 'Contract ID required' }, { status: 400 })
        }

        const contract = await registryService.getContractById(id)
        if (!contract) {
          return NextResponse.json({ success: false, error: 'Contract not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: contract })

      case 'getCategories':
        const categories = await registryService.getCategories()
        return NextResponse.json({ success: true, data: categories })

      case 'getFeatured':
        const featuredContracts = await registryService.getFeaturedContracts()
        return NextResponse.json({ success: true, data: featuredContracts })

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Contract registry error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { action, ...params } = await request.json()

    switch (action) {
      case 'addToRegistry':
        const { contractId, registryData } = params
        if (!contractId) {
          return NextResponse.json({ success: false, error: 'Contract ID required' }, { status: 400 })
        }

        await registryService.addToRegistry(contractId, registryData || {})
        return NextResponse.json({ success: true, message: 'Contract added to registry' })

      case 'verify':
        const { contractId: verifyContractId } = params
        if (!verifyContractId) {
          return NextResponse.json({ success: false, error: 'Contract ID required' }, { status: 400 })
        }

        // Check if user has permission to verify (admin or auditor)
        if (session.user.role !== 'ADMIN' && session.user.role !== 'AUDITOR') {
          return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
        }

        await registryService.verifyContract(verifyContractId, session.user.email)
        return NextResponse.json({ success: true, message: 'Contract verified successfully' })

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Contract registry error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}