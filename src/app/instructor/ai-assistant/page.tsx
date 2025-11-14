'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import AutoGradingSystem from '@/components/instructor/AutoGradingSystem';

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
  const [showAutoGrading, setShowAutoGrading] = useState(false);

  const aiFeatures: AIFeature[] = [
    {
      id: 'auto-grade',
      title: 'Auto-Grade Assignments',
      description: 'Automatically grade video assignments using AI analysis',
      icon: '🤖',
      status: 'available',
      action: () => setShowAutoGrading(true)
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
    const lowerMessage = message.toLowerCase();
    
    // Assignment ideas based on subject/topic
    if (lowerMessage.includes('math') || lowerMessage.includes('calculus') || lowerMessage.includes('algebra')) {
      return `Great! Here are some engaging math assignment ideas for your students:

📊 **Video Problem-Solving Assignment**
- Students record themselves solving 3-5 problems step-by-step
- Include explanation of their thought process and methodology
- 10-15 minutes per video, due in 1 week

📈 **Real-World Application Project**
- Find a real-world scenario that uses the math concept
- Create a 5-minute video explaining the application
- Include visual aids and examples

🎯 **Peer Teaching Challenge**
- Students teach a concept to their classmates via video
- Must include examples and practice problems
- 8-12 minutes, with Q&A session

Would you like me to elaborate on any of these or suggest specific problems for your topic?`;
    }
    
    if (lowerMessage.includes('science') || lowerMessage.includes('biology') || lowerMessage.includes('chemistry') || lowerMessage.includes('physics')) {
      return `Excellent! Here are some creative science assignment ideas:

🔬 **Lab Demonstration Video**
- Students perform a lab experiment and explain the process
- Include hypothesis, procedure, observations, and conclusions
- 10-15 minutes with clear audio and visuals

🌍 **Scientific Concept Explainer**
- Choose a complex scientific concept and break it down
- Use analogies, diagrams, and real-world examples
- 8-12 minutes, suitable for peer learning

📊 **Data Analysis Presentation**
- Analyze experimental data and present findings
- Include graphs, charts, and statistical analysis
- 10-15 minutes with clear explanations

Would you like specific experiment ideas or help structuring any of these assignments?`;
    }
    
    if (lowerMessage.includes('english') || lowerMessage.includes('writing') || lowerMessage.includes('literature')) {
      return `Perfect! Here are some engaging English assignment ideas:

📝 **Literary Analysis Video**
- Students analyze a text and present their interpretation
- Include quotes, analysis, and personal insights
- 8-12 minutes with clear structure

✍️ **Creative Writing Showcase**
- Students read their creative work and explain their process
- Include inspiration, techniques used, and revision process
- 5-10 minutes per piece

🎭 **Character Study Presentation**
- Deep dive into a character's development and motivations
- Use visual aids and textual evidence
- 10-15 minutes with engaging delivery

Would you like help with specific texts or writing prompts for your class?`;
    }
    
    if (lowerMessage.includes('history') || lowerMessage.includes('social studies')) {
      return `Great choice! Here are some dynamic history assignment ideas:

📚 **Historical Documentary**
- Students create a mini-documentary about a historical event
- Include primary sources, analysis, and historical context
- 10-15 minutes with engaging visuals

🎭 **Historical Role-Play**
- Students take on historical personas and explain their perspective
- Include period-appropriate context and motivations
- 8-12 minutes per character

📊 **Timeline Analysis**
- Create an interactive timeline with video explanations
- Connect events and show cause-and-effect relationships
- 10-15 minutes with clear chronological flow

Would you like specific historical periods or events to focus on?`;
    }
    
    if (lowerMessage.includes('computer') || lowerMessage.includes('programming') || lowerMessage.includes('coding')) {
      return `Awesome! Here are some tech-focused assignment ideas:

💻 **Code Walkthrough Video**
- Students explain their code line by line
- Include problem-solving process and debugging
- 10-15 minutes with screen recording

🛠️ **Project Showcase**
- Demonstrate a completed project and explain the development process
- Include challenges faced and solutions implemented
- 8-12 minutes with live demo

📊 **Algorithm Explanation**
- Break down complex algorithms in simple terms
- Use visual aids and step-by-step examples
- 10-15 minutes with clear explanations

Would you like help with specific programming languages or project ideas?`;
    }
    
    // General assignment ideas for any subject
    return `Here are some versatile assignment ideas that work for any subject:

🎯 **Concept Explanation Video**
- Students teach a key concept to their peers
- Include examples, analogies, and visual aids
- 8-12 minutes with clear structure

📊 **Research Presentation**
- Students research a topic and present findings
- Include sources, analysis, and personal insights
- 10-15 minutes with engaging delivery

🤝 **Peer Interview Project**
- Students interview each other about course topics
- Include thoughtful questions and follow-ups
- 5-8 minutes per interview

💡 **Problem-Solving Challenge**
- Present a real-world problem related to your subject
- Students explain their solution process
- 8-12 minutes with step-by-step breakdown

What specific topic or skill would you like your students to focus on? I can provide more targeted suggestions!`;
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
                    Assignment Ideas AI
                  </h1>
                  <p className="text-gray-600">
                    Get creative assignment ideas tailored to your subject and student needs
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
              <h2 className="text-xl font-bold text-gray-800 mb-4">Assignment Ideas Generator</h2>
              
              {/* Chat History */}
              <div className="h-96 overflow-y-auto mb-4 space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-2">🤖</div>
                    <p>Need assignment ideas? I'm here to help! What topic are your students working on?</p>
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
                  placeholder="What topic are your students working on?"
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

        {/* Auto-Grading System Modal */}
        {showAutoGrading && (
          <AutoGradingSystem
            courseId="course-1" // In real app, this would come from props or context
            onClose={() => setShowAutoGrading(false)}
          />
        )}
      </div>
    </InstructorRoute>
  );
};

export default AIAssistantPage;
