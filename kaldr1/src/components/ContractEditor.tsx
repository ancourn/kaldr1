'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  FileText, 
  Download, 
  Copy, 
  Play,
  Code,
  Zap,
  Clock
} from 'lucide-react'
import { contractTemplates, ContractTemplate } from '@/lib/contracts/templates'

interface ContractEditorProps {
  onDeploy?: (code: string, name: string, version: string) => void
  onEstimateGas?: (code: string, name: string) => void
}

export default function ContractEditor({ onDeploy, onEstimateGas }: ContractEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [contractCode, setContractCode] = useState('')
  const [contractName, setContractName] = useState('')
  const [contractVersion, setContractVersion] = useState('1.0.0')
  const [isEditing, setIsEditing] = useState(false)

  const handleTemplateSelect = (templateId: string) => {
    const template = contractTemplates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      setContractCode(template.code)
      setContractName(template.name)
      setIsEditing(true)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(contractCode)
  }

  const handleDownloadCode = () => {
    const blob = new Blob([contractCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${contractName.toLowerCase().replace(/\s+/g, '_')}.rs`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDeploy = () => {
    if (onDeploy && contractCode && contractName) {
      onDeploy(contractCode, contractName, contractVersion)
    }
  }

  const handleEstimateGas = () => {
    if (onEstimateGas && contractCode && contractName) {
      onEstimateGas(contractCode, contractName)
    }
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Contract Templates</span>
          </CardTitle>
          <CardDescription>
            Choose from pre-built smart contract templates to get started quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-select">Select Template</Label>
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {contractTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{template.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {template.category}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTemplate.description}
                  </p>
                </div>
                <div>
                  <Label>Complexity</Label>
                  <Badge 
                    variant={
                      selectedTemplate.complexity === 'simple' ? 'default' :
                      selectedTemplate.complexity === 'medium' ? 'secondary' : 'destructive'
                    }
                    className="mt-1"
                  >
                    {selectedTemplate.complexity}
                  </Badge>
                </div>
                <div>
                  <Label>Estimated Gas</Label>
                  <p className="text-sm font-mono mt-1">
                    {selectedTemplate.estimatedGas.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Code Editor */}
      {isEditing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="h-5 w-5" />
                  <span>Contract Editor</span>
                </CardTitle>
                <CardDescription>
                  Edit your smart contract code below
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCode}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contract-name">Contract Name</Label>
                <Input
                  id="contract-name"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  placeholder="MyContract"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract-version">Version</Label>
                <Input
                  id="contract-version"
                  value={contractVersion}
                  onChange={(e) => setContractVersion(e.target.value)}
                  placeholder="1.0.0"
                />
              </div>
              <div className="flex items-end space-x-2">
                <Button
                  onClick={handleEstimateGas}
                  variant="outline"
                  className="flex-1"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Estimate Gas
                </Button>
                <Button
                  onClick={handleDeploy}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Deploy
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-code">Contract Code</Label>
              <div className="relative">
                <Textarea
                  id="contract-code"
                  value={contractCode}
                  onChange={(e) => setContractCode(e.target.value)}
                  placeholder="// Your smart contract code here..."
                  rows={20}
                  className="font-mono text-sm bg-muted resize-none"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-xs">
                    Rust
                  </Badge>
                </div>
              </div>
            </div>

            {/* Available Functions */}
            {selectedTemplate && (
              <div className="space-y-2">
                <Label>Available Functions</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.functions.map((func, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {func}()
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}