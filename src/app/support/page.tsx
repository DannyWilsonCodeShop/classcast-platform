'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: '',
    priority: 'medium'
  });

  const categories = [
    { id: 'general', name: 'General Questions 💬', icon: '💬' },
    { id: 'technical', name: 'Technical Support 🔧', icon: '🔧' },
    { id: 'billing', name: 'Account & Billing 💳', icon: '💳' },
    { id: 'feature', name: 'Feature Requests 💡', icon: '💡' },
    { id: 'bug', name: 'Report Issues 🐛', icon: '🐛' }
  ];

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          question: 'How do I create my first assignment?',
          answer: 'To create your first assignment, go to your instructor dashboard, click "Create Assignment", fill in the details, and publish it to your course.'
        },
        {
          question: 'Can students submit video assignments?',
          answer: 'Yes! Students can record and submit video assignments directly through the platform using our built-in video recorder.'
        },
        {
          question: 'How do I grade assignments?',
          answer: 'Navigate to the assignments section, click on an assignment, and use our grading interface to provide feedback and scores.'
        }
      ]
    },
    {
      category: 'Account & Billing',
      questions: [
        {
          question: 'How do I upgrade my account?',
          answer: 'Go to your account settings, click on "Billing", and select the plan that best fits your needs.'
        },
        {
          question: 'Can I cancel my subscription anytime?',
          answer: 'Yes, you can cancel your subscription at any time from your account settings. You\'ll retain access until the end of your billing period.'
        },
        {
          question: 'Do you offer student discounts?',
          answer: 'Yes! Students can sign up for free with a valid .edu email address and get access to all basic features.'
        }
      ]
    },
    {
      category: 'Technical Issues',
      questions: [
        {
          question: 'The video recorder isn\'t working. What should I do?',
          answer: 'Try refreshing your browser, check your camera permissions, and ensure you\'re using a supported browser (Chrome, Firefox, Safari, or Edge).'
        },
        {
          question: 'I can\'t upload files. What\'s the issue?',
          answer: 'Check that your file is under 100MB and in a supported format. If the issue persists, try clearing your browser cache.'
        },
        {
          question: 'The mobile app keeps crashing. How do I fix it?',
          answer: 'Try updating to the latest version of the app, restart your device, and if the problem continues, contact our technical support team.'
        }
      ]
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Support ticket submitted:', formData);
    alert('Support ticket submitted! We\'ll get back to you within 24 hours.');
    setFormData({
      name: '',
      email: '',
      category: 'general',
      subject: '',
      message: '',
      priority: 'medium'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white relative overflow-hidden">
        {/* Fun Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/30 rounded-full blur-xl animate-bounce"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-white/30 rounded-full blur-xl animate-bounce delay-1000"></div>
          <div className="absolute bottom-10 left-1/3 w-40 h-40 bg-white/30 rounded-full blur-xl animate-bounce delay-2000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          {/* Home Button */}
          <div className="absolute top-4 right-4">
            <button
              onClick={() => router.push('/')}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-600 hover:text-gray-800 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
              aria-label="Go to home page"
              title="Go to home page"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-8">
              <div className="w-2 h-2 bg-white rounded-full mr-3 animate-bounce"></div>
              🆘 Help & Support Center! 🆘
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="block">Need</span>
              <span className="block bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
                Help? We're Here! 🎓
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Get the support you need to succeed in your learning journey! 🌟
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Support Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border-2 border-blue-300/30">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 Submit a Support Request</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Please provide as much detail as possible about your issue or question..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-full font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  🚀 Submit Request
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 border-yellow-300/30">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📞 Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-orange-600 mr-3">📧</span>
                  <div>
                    <div className="font-medium text-gray-900">Email</div>
                    <div className="text-sm text-gray-600">support@classcast.com</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 mr-3">📞</span>
                  <div>
                    <div className="font-medium text-gray-900">Phone</div>
                    <div className="text-sm text-gray-600">+1 (800) 252-7727</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 mr-3">💬</span>
                  <div>
                    <div className="font-medium text-gray-900">Live Chat</div>
                    <div className="text-sm text-gray-600">Available 24/7</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Times */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 border-blue-300/30">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⏰ Response Times</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">General Inquiry</span>
                  <span className="font-medium">24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Technical Support</span>
                  <span className="font-medium">12 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Billing Issues</span>
                  <span className="font-medium">6 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Urgent Issues</span>
                  <span className="font-medium">2 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-8">
            {faqs.map((section, sectionIndex) => (
              <div key={sectionIndex} className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">{section.category}</h3>
                <div className="space-y-6">
                  {section.questions.map((faq, faqIndex) => (
                    <div key={faqIndex} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
