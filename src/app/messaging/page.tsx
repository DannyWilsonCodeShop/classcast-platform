'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation, Message } from '@/types/messaging';
import ConversationList from '@/components/messaging/ConversationList';
import MessageView from '@/components/messaging/MessageView';
import NewMessageModal from '@/components/messaging/NewMessageModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function MessagingPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConversations();
    }
  }, [isAuthenticated, user]);

  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await fetch(`/api/messaging/conversations?userId=${user?.id}&userRole=${user?.role}`);
      const data = await response.json();
      
      if (response.ok) {
        setConversations(data.conversations || []);
      } else {
        console.error('Failed to fetch conversations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      const response = await fetch(`/api/messaging/messages?conversationId=${conversationId}`);
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages || []);
      } else {
        console.error('Failed to fetch messages:', data.error);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const handleNewMessage = (message: Message) => {
    // Add the new message to the current conversation
    if (selectedConversation && message.conversationId === selectedConversation.id) {
      setMessages(prev => [message, ...prev]);
    }
    
    // Update the conversation list
    fetchConversations();
  };

  const handleNewConversation = (conversation: Conversation) => {
    setConversations(prev => [conversation, ...prev]);
    setSelectedConversation(conversation);
    setMessages([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access messaging</h2>
          <p className="text-gray-600">You need to be logged in to view your messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent">
                Messages
              </h1>
              <p className="text-xs text-gray-500">Connect with your peers and instructors</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewMessage(true)}
            className="px-4 py-2 bg-gradient-to-r from-slate-500 to-gray-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
          >
            + New Message
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div className="w-1/3 border-r border-gray-200 bg-white/50">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onConversationSelect={handleConversationSelect}
            isLoading={isLoadingConversations}
          />
        </div>

        {/* Message View */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <MessageView
              conversation={selectedConversation}
              messages={messages}
              currentUser={user}
              onNewMessage={handleNewMessage}
              isLoading={isLoadingMessages}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white/30">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessage && (
        <NewMessageModal
          currentUser={user}
          onClose={() => setShowNewMessage(false)}
          onNewConversation={handleNewConversation}
        />
      )}
    </div>
  );
}
