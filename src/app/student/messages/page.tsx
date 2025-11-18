'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Avatar from '@/components/common/Avatar';

interface Message {
  id: string;
  fromUserId: string;
  fromName: string;
  fromAvatar: string;
  toUserId: string;
  toName: string;
  toAvatar: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadConversations();
      
      // Check if there's a userId parameter in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const targetUserId = urlParams.get('userId');
      
      if (targetUserId) {
        // Load messages for this specific user
        loadMessages(targetUserId);
      }
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user?.id) return;
    
    try {
      // Load conversations from API
      const response = await fetch(`/api/messaging/conversations?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success && data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/messaging/messages?userId1=${user.id}&userId2=${otherUserId}`);
      const data = await response.json();
      
      if (data.success && data.messages) {
        setMessages(data.messages);
        setSelectedConversation(otherUserId);
        
        // If we don't have a conversation with this user yet, create a placeholder
        if (data.messages.length === 0 && !conversations.find(c => c.userId === otherUserId)) {
          // Fetch user details for the placeholder
          try {
            const userResponse = await fetch(`/api/profile?userId=${otherUserId}`);
            const userData = await userResponse.json();
            
            if (userData.success && userData.data) {
              const placeholderConversation: Conversation = {
                userId: otherUserId,
                userName: `${userData.data.firstName || ''} ${userData.data.lastName || ''}`.trim() || userData.data.email,
                userAvatar: userData.data.avatar || '/api/placeholder/40/40',
                lastMessage: '',
                lastTimestamp: new Date().toISOString(),
                unreadCount: 0
              };
              
              setConversations(prev => [placeholderConversation, ...prev]);
            }
          } catch (err) {
            console.error('Error fetching user details:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;
    
    try {
      setSending(true);
      const response = await fetch('/api/messaging/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user?.id,
          toUserId: selectedConversation,
          content: newMessage.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setNewMessage('');
        // Reload messages
        if (selectedConversation) {
          loadMessages(selectedConversation);
        }
        // Reload conversations to update last message
        loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getOtherUser = (conversation: Conversation) => {
    return {
      id: conversation.userId,
      name: conversation.userName,
      avatar: conversation.userAvatar
    };
  };

  if (loading) {
    return (
      <StudentRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-3 p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages Yet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Connect with your Study Buddies to start messaging
              </p>
              <button
                onClick={() => router.push('/student/profile')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Study Buddies
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-140px)]">
              {/* Conversations List */}
              <div className="bg-white border-r border-gray-200 overflow-y-auto">
                <div className="divide-y divide-gray-200">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.userId}
                      onClick={() => loadMessages(conversation.userId)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation.userId ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                          onClick={() => conversation.userId && router.push(`/student/profile/${conversation.userId}`)}
                        >
                          {conversation.userAvatar && !conversation.userAvatar.includes('placeholder') ? (
                            <img 
                              src={conversation.userAvatar} 
                              alt={conversation.userName} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 font-semibold">
                              {conversation.userName.split(' ').map(n => n[0]).join('')}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p 
                              className="font-semibold text-sm text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => conversation.userId && router.push(`/student/profile/${conversation.userId}`)}
                            >
                              {conversation.userName}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.lastMessage}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTimestamp(conversation.lastTimestamp)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="hidden md:col-span-2 md:flex flex-col bg-white">
                {selectedConversation ? (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => {
                        const isMine = message.fromUserId === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 ${
                                isMine
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                isMine ? 'text-blue-200' : 'text-gray-500'
                              }`}>
                                {formatTimestamp(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Message Input */}
                    <div className="border-t border-gray-200 p-4">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={sending}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || sending}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {sending ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Select a conversation to start messaging
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
};

export default MessagesPage;

