'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Wifi, 
  WifiOff, 
  Users, 
  MessageCircle,
  Bot,
  User,
  Loader2
} from 'lucide-react'
import { io, Socket } from 'socket.io-client'

interface ChatMessage {
  text: string;
  senderId: string;
  timestamp?: string;
  type?: 'user' | 'assistant' | 'system';
}

interface TypingIndicator {
  userId: string;
  isTyping: boolean;
  timestamp: string;
}

interface WebSocketChatProps {
  serverUrl?: string
  room?: string
  title?: string
  height?: string
}

export function WebSocketChat({
  serverUrl = 'http://localhost:3000',
  room = 'general',
  title = "Real-time Chat",
  height = "400px"
}: WebSocketChatProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [usersCount, setUsersCount] = useState(0)
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const socketInstance = io(serverUrl, {
      transports: ['websocket', 'polling']
    })

    socketInstance.on('connect', () => {
      setIsConnected(true)
      socketInstance.emit('join-room', room)
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })

    socketInstance.on('message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
    })

    socketInstance.on('user-typing', (typing: TypingIndicator) => {
      setTypingUsers(prev => {
        const existing = prev.find(t => t.userId === typing.userId)
        if (existing) {
          return prev.map(t => t.userId === typing.userId ? typing : t)
        } else {
          return [...prev, typing]
        }
      })

      // Remove typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(t => t.userId !== typing.userId))
      }, 3000)
    })

    socketInstance.on('status-update', (status: any) => {
      if (status.type === 'server-health') {
        setUsersCount(status.data.connectedClients || 0)
      }
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [serverUrl, room])

  const handleSendMessage = () => {
    if (!input.trim() || !socket || !isConnected) return

    const message: ChatMessage = {
      text: input.trim(),
      senderId: socket.id || 'user',
      timestamp: new Date().toISOString(),
      type: 'user'
    }

    socket.emit('message', message)
    setInput('')
    setIsTyping(false)
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleTyping = () => {
    if (!socket || !isConnected) return

    if (!isTyping) {
      setIsTyping(true)
      socket.emit('typing', { isTyping: true, room })
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket.emit('typing', { isTyping: false, room })
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getActiveTypingUsers = () => {
    return typingUsers.filter(t => t.isTyping && t.userId !== socket?.id)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {usersCount}
            </Badge>
            <div className={`flex items-center gap-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Messages Container */}
          <div 
            className="border rounded-lg p-4 space-y-4 overflow-y-auto"
            style={{ height, maxHeight: height }}
          >
            {messages.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.senderId === socket?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start gap-2 max-w-[80%]">
                  {message.senderId !== socket?.id && (
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'system' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-blue-100 dark:bg-blue-900'
                      }`}>
                        {message.type === 'system' ? (
                          <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        ) : (
                          <User className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.senderId === socket?.id
                        ? 'bg-blue-600 text-white'
                        : message.type === 'system'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <div className="text-sm">{message.text}</div>
                    {message.timestamp && (
                      <div className={`text-xs mt-1 opacity-70 ${
                        message.senderId === socket?.id ? 'text-blue-100' : 'text-slate-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    )}
                  </div>
                  
                  {message.senderId === socket?.id && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicators */}
            {getActiveTypingUsers().length > 0 && (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  {getActiveTypingUsers().length === 1 
                    ? 'Someone is typing...' 
                    : `${getActiveTypingUsers().length} people are typing...`
                  }
                </span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={handleTyping}
              onKeyPress={handleKeyPress}
              disabled={!isConnected}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!isConnected || !input.trim()}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Room Info */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <Badge variant="outline" className="text-xs">
              Room: {room}
            </Badge>
            <div className="flex items-center gap-2">
              <span>{messages.length} messages</span>
              <span>•</span>
              <span>Socket ID: {socket?.id ? socket.id.substring(0, 8) + '...' : 'N/A'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}