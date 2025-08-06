'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useDag } from '@/hooks/useDag'
import { Network, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'

interface DagNodeVisual {
  id: string
  x: number
  y: number
  status: 'confirmed' | 'pending' | 'orphaned'
  height: number
  transactions: number
  validator: string
  size: number
}

interface DagEdgeVisual {
  from: string
  to: string
  weight: number
}

export default function DagExplorer() {
  const { nodes, edges, stats, loading, error, refetch } = useDag()
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  // Generate visual positions for nodes
  const visualNodes = useMemo(() => {
    const nodesByHeight: { [height: number]: DagNodeVisual[] } = {}
    
    nodes.forEach(node => {
      if (!nodesByHeight[node.height]) {
        nodesByHeight[node.height] = []
      }
      
      const existingNodes = nodesByHeight[node.height].length
      nodesByHeight[node.height].push({
        id: node.id,
        x: existingNodes * 120 + 50,
        y: node.height * 100 + 50,
        status: node.status,
        height: node.height,
        transactions: node.transactions,
        validator: node.validator,
        size: node.size
      })
    })

    return Object.values(nodesByHeight).flat()
  }, [nodes])

  const visualEdges = useMemo(() => {
    return edges.map(edge => ({
      from: edge.from,
      to: edge.to,
      weight: edge.weight
    }))
  }, [edges])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'orphaned': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'orphaned': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const selectedNodeData = nodes.find(node => node.id === selectedNode)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            DAG Explorer
          </CardTitle>
          <CardDescription>
            Visualizing the Directed Acyclic Graph structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            DAG Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              DAG Explorer
            </CardTitle>
            <CardDescription>
              Visualizing the Directed Acyclic Graph structure
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalNodes}</div>
              <div className="text-sm text-muted-foreground">Total Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalEdges}</div>
              <div className="text-sm text-muted-foreground">Total Edges</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.maxDepth}</div>
              <div className="text-sm text-muted-foreground">Max Depth</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.orphanRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Orphan Rate</div>
            </div>
          </div>

          {/* DAG Visualization */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="h-96 relative overflow-auto">
              <svg width="100%" height="100%" className="min-w-[600px] min-h-[400px]">
                {/* Edges */}
                {visualEdges.map((edge, index) => {
                  const fromNode = visualNodes.find(n => n.id === edge.from)
                  const toNode = visualNodes.find(n => n.id === edge.to)
                  if (!fromNode || !toNode) return null

                  return (
                    <line
                      key={index}
                      x1={fromNode.x + 20}
                      y1={fromNode.y + 20}
                      x2={toNode.x + 20}
                      y2={toNode.y + 20}
                      stroke={edge.weight > 0.5 ? '#10b981' : '#f59e0b'}
                      strokeWidth={Math.max(1, edge.weight * 3)}
                      strokeOpacity={0.6}
                    />
                  )
                })}

                {/* Nodes */}
                {visualNodes.map((node) => (
                  <g key={node.id}>
                    <circle
                      cx={node.x + 20}
                      cy={node.y + 20}
                      r={Math.max(15, Math.min(30, node.size / 5000))}
                      fill={node.status === 'confirmed' ? '#10b981' : 
                             node.status === 'pending' ? '#f59e0b' : '#ef4444'}
                      stroke={selectedNode === node.id ? '#000' : 'none'}
                      strokeWidth={selectedNode === node.id ? 2 : 0}
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => setSelectedNode(node.id)}
                    />
                    <text
                      x={node.x + 20}
                      y={node.y + 45}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#666"
                    >
                      H{node.height}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Selected Node Details */}
          {selectedNodeData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Node Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(selectedNodeData.status)}
                        <Badge className={
                          selectedNodeData.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          selectedNodeData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {selectedNodeData.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Height:</span> {selectedNodeData.height}
                    </div>
                    <div>
                      <span className="font-medium">Transactions:</span> {selectedNodeData.transactions}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {(selectedNodeData.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Validator:</span>
                      <div className="font-mono text-sm break-all">{selectedNodeData.validator}</div>
                    </div>
                    <div>
                      <span className="font-medium">Gas Used:</span> {selectedNodeData.gasUsed}
                    </div>
                    <div>
                      <span className="font-medium">Gas Limit:</span> {selectedNodeData.gasLimit}
                    </div>
                    <div>
                      <span className="font-medium">Timestamp:</span> {new Date(selectedNodeData.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Orphaned</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}