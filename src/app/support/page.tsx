'use client';

import { useState } from 'react';

export default function SupportPage() {
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
    { id: 'general', name: 'General Questions! 💬', icon: '💬' },
    { id: 'technical', name: 'Tech Help! 🔧', icon: '🔧' },
    { id: 'billing', name: 'Account & Money! 💳', icon: '💳' },
    { id: 'feature', name: 'Cool Ideas! 💡', icon: '💡' },
    { id: 'bug', name: 'Something Broken! 🐛', icon: '🐛' }
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Support Center
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-orange-100">
              We're here to help you succeed
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Support Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit a Support Ticket</h2>
              
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
                  className="w-full bg-orange-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-orange-700 transition-colors"
                >
                  Submit Support Ticket
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Times</h3>
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
