'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  ExternalLink, 
  Loader2, 
  Globe,
  Clock,
  TrendingUp
} from 'lucide-react'

interface SearchResult {
  url: string
  name: string
  snippet: string
  host_name: string
  rank: number
  date: string
  favicon: string
}

interface WebSearchProps {
  onSearch?: (query: string, num?: number) => Promise<SearchResult[]>
  title?: string
  placeholder?: string
  maxResults?: number
}

export function WebSearch({
  onSearch,
  title = "AI Web Search",
  placeholder = "Search the web...",
  maxResults = 10
}: WebSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setResults([])

    try {
      let searchResults: SearchResult[]
      
      if (onSearch) {
        searchResults = await onSearch(query.trim(), maxResults)
      } else {
        // Default API call
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query.trim(),
            num: maxResults
          })
        })

        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to perform search')
        }
        
        searchResults = data.results
      }

      setResults(searchResults)
    } catch (err) {
      console.error('Error searching:', err)
      setError(err instanceof Error ? err.message : 'Failed to perform search')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch {
      return dateString
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">Error: {error}</span>
              </div>
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Search Results</h3>
                <Badge variant="outline">
                  {results.length} results
                </Badge>
              </div>

              <div className="space-y-4">
                {results.map((result) => (
                  <Card key={result.url} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={result.favicon}
                          alt=""
                          className="w-6 h-6 mt-1 flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              #{result.rank}
                            </Badge>
                            <span className="text-sm text-slate-500 truncate">
                              {result.host_name}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(result.date)}</span>
                            </div>
                          </div>
                          
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer mb-2 block text-lg leading-tight"
                          >
                            {result.name}
                          </a>
                          
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 line-clamp-2">
                            {result.snippet}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500 truncate">
                              {result.url}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(result.url, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!results.length && !isLoading && !error && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
                Ready to Search
              </h3>
              <p className="text-sm text-slate-500">
                Enter a search query above to explore the web with AI-powered results.
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
                Searching...
              </h3>
              <p className="text-sm text-slate-500">
                Finding the most relevant results for "{query}"
              </p>
            </div>
          )}

          {/* Search Tips */}
          {!results.length && !isLoading && !error && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                Search Tips:
              </h4>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Use specific keywords for more accurate results</li>
                <li>• Try different phrasings if you don't find what you're looking for</li>
                <li>• Use quotes for exact phrase matching</li>
                <li>• Include relevant terms to narrow down results</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}