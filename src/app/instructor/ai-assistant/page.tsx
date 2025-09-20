'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'available' | 'coming-soon' | 'beta';
  action: () => void;
}

const AIAssistantPage: React.FC = () => {
  const router = useRouter();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'ai', message: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const aiFeatures: AIFeature[] = [
    {
      id: 'auto-grade',
      title: 'Auto-Grade Assignments',
      description: 'Automatically grade video assignments using AI analysis',
      icon: '🤖',
      status: 'available',
      action: () => setSelectedFeature('auto-grade')
    },
    {
      id: 'feedback-generator',
      title: 'Generate Feedback',
      description: 'AI-powered feedback suggestions for student submissions',
      icon: '💬',
      status: 'available',
      action: () => setSelectedFeature('feedback-generator')
    },
    {
      id: 'plagiarism-check',
      title: 'Plagiarism Detection',
      description: 'Detect potential plagiarism in text submissions',
      icon: '🔍',
      status: 'available',
      action: () => setSelectedFeature('plagiarism-check')
    },
    {
      id: 'transcription',
      title: 'Video Transcription',
      description: 'Convert video submissions to text for analysis',
      icon: '📝',
      status: 'available',
      action: () => setSelectedFeature('transcription')
    },
    {
      id: 'analytics',
      title: 'Learning Analytics',
      description: 'AI insights into student performance and engagement',
      icon: '📊',
      status: 'beta',
      action: () => setSelectedFeature('analytics')
    },
    {
      id: 'chat-assistant',
      title: 'AI Chat Assistant',
      description: 'Get help with teaching strategies and course management',
      icon: '💡',
      status: 'available',
      action: () => setSelectedFeature('chat-assistant')
    }
  ];

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setIsLoading(true);

    // Add user message to history
    setChatHistory(prev => [...prev, { role: 'user', message: userMessage }]);

    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiResponse = generateAIResponse(userMessage);
      setChatHistory(prev => [...prev, { role: 'ai', message: aiResponse }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        message: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (message: string): string => {
    const responses = [
      "Based on your question, I'd recommend focusing on clear learning objectives and providing regular feedback to students.",
      "That's a great question! Consider using peer review activities to increase student engagement.",
      "I suggest breaking down complex topics into smaller, manageable chunks for better student comprehension.",
      "You might want to try incorporating multimedia elements to cater to different learning styles.",
      "Based on best practices, I recommend setting clear expectations and providing rubrics for assignments."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'beta':
        return 'bg-yellow-100 text-yellow-800';
      case 'coming-soon':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'beta':
        return 'Beta';
      case 'coming-soon':
        return 'Coming Soon';
      default:
        return status;
    }
  };

  return (
    <InstructorRoute>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-yellow-300/30 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="text-2xl">←</span>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    AI Assistant
                  </h1>
                  <p className="text-gray-600">
                    Leverage AI to enhance your teaching and streamline grading
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI Features */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">AI Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiFeatures.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={feature.action}
                      disabled={feature.status === 'coming-soon'}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        selectedFeature === feature.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${feature.status === 'coming-soon' ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{feature.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {feature.description}
                          </p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                            {getStatusText(feature.status)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">AI Usage Stats</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">47</div>
                    <div className="text-sm text-gray-600">Assignments Graded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">23</div>
                    <div className="text-sm text-gray-600">Hours Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">156</div>
                    <div className="text-sm text-gray-600">Feedback Generated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">92%</div>
                    <div className="text-sm text-gray-600">Accuracy Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Assistant */}
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">AI Chat Assistant</h2>
              
              {/* Chat History */}
              <div className="h-96 overflow-y-auto mb-4 space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-2">🤖</div>
                    <p>Ask me anything about teaching, grading, or course management!</p>
                  </div>
                ) : (
                  chatHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))
                )}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask me anything about teaching..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default AIAssistantPage;
