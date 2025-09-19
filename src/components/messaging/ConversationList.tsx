'use client';

import React from 'react';
import { Conversation } from '@/types/messaging';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onConversationSelect: (conversation: Conversation) => void;
  isLoading: boolean;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onConversationSelect,
  isLoading
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="p-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mb-2">No conversations yet</p>
          <p className="text-xs text-gray-400">Start a conversation with your peers or instructors</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">Conversations</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onConversationSelect(conversation)}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedConversation?.id === conversation.id ? 'bg-slate-50 border-l-4 border-l-slate-500' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {conversation.participants
                  .filter(p => p.id !== conversation.participants[0]?.id)
                  .map(p => p.name.charAt(0))
                  .join('')
                  .slice(0, 2)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {conversation.participants
                      .filter(p => p.id !== conversation.participants[0]?.id)
                      .map(p => p.name)
                      .join(', ')}
                  </h3>
                  {conversation.unreadCount > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                
                {conversation.lastMessage && (
                  <p className="text-xs text-gray-600 truncate mt-1">
                    {conversation.lastMessage.senderName}: {conversation.lastMessage.content}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {conversation.lastMessage 
                      ? new Date(conversation.lastMessage.timestamp).toLocaleDateString()
                      : new Date(conversation.updatedAt).toLocaleDateString()
                    }
                  </span>
                  
                  {conversation.courseId && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
                      Course
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
