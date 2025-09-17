'use client';

import Link from 'next/link';

export default function ResourcesPage() {
  const resources = [
    {
      category: 'Documentation',
      items: [
        {
          title: 'Getting Started Guide',
          description: 'Learn the basics of ClassCast in under 10 minutes',
          type: 'Guide',
          readTime: '5 min read',
          link: '#'
        },
        {
          title: 'API Documentation',
          description: 'Complete API reference for developers',
          type: 'Technical',
          readTime: '15 min read',
          link: '#'
        },
        {
          title: 'Video Tutorials',
          description: 'Step-by-step video guides for all features',
          type: 'Video',
          readTime: '20 min watch',
          link: '#'
        },
        {
          title: 'Best Practices',
          description: 'Tips and tricks from experienced educators',
          type: 'Guide',
          readTime: '8 min read',
          link: '#'
        }
      ]
    },
    {
      category: 'Support',
      items: [
        {
          title: 'Help Center',
          description: 'Find answers to common questions',
          type: 'FAQ',
          readTime: '2 min read',
          link: '#'
        },
        {
          title: 'Contact Support',
          description: 'Get help from our support team',
          type: 'Support',
          readTime: '1 min',
          link: '#'
        },
        {
          title: 'System Status',
          description: 'Check current system status and uptime',
          type: 'Status',
          readTime: '1 min',
          link: '#'
        },
        {
          title: 'Feature Requests',
          description: 'Suggest new features and improvements',
          type: 'Feedback',
          readTime: '3 min',
          link: '#'
        }
      ]
    },
    {
      category: 'Community',
      items: [
        {
          title: 'User Forum',
          description: 'Connect with other ClassCast users',
          type: 'Community',
          readTime: '5 min',
          link: '#'
        },
        {
          title: 'Success Stories',
          description: 'Read how others are using ClassCast',
          type: 'Case Study',
          readTime: '10 min read',
          link: '#'
        },
        {
          title: 'Webinars',
          description: 'Join our monthly educational webinars',
          type: 'Event',
          readTime: '60 min',
          link: '#'
        },
        {
          title: 'Blog',
          description: 'Latest news and insights from our team',
          type: 'Blog',
          readTime: '7 min read',
          link: '#'
        }
      ]
    }
  ];

  const quickLinks = [
    { title: 'Download Mobile App', description: 'iOS and Android apps available', icon: '📱' },
    { title: 'Integration Guide', description: 'Connect with your existing tools', icon: '🔗' },
    { title: 'Security & Privacy', description: 'Learn about our security measures', icon: '🔒' },
    { title: 'Pricing Calculator', description: 'Estimate your monthly costs', icon: '💰' }
  ];

  const faqs = [
    {
      question: 'How do I get started with ClassCast?',
      answer: 'Simply sign up for a free account, verify your email, and you can start creating assignments or enrolling in courses immediately.'
    },
    {
      question: 'Is there a mobile app available?',
      answer: 'Yes! We have mobile apps for both iOS and Android that provide full functionality for students and instructors.'
    },
    {
      question: 'Can I integrate ClassCast with my existing LMS?',
      answer: 'Absolutely! ClassCast offers integrations with popular LMS platforms including Canvas, Blackboard, and Moodle.'
    },
    {
      question: 'What file types are supported for assignments?',
      answer: 'We support all major file types including documents, images, videos, audio files, and code files.'
    },
    {
      question: 'How secure is my data?',
      answer: 'We use enterprise-grade security including encryption at rest and in transit, regular security audits, and SOC 2 compliance.'
    },
    {
      question: 'Do you offer training for instructors?',
      answer: 'Yes! We provide comprehensive training resources including video tutorials, documentation, and live webinars.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Resources & Support
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100">
              Everything you need to succeed with ClassCast
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#documentation"
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Browse Documentation
              </a>
              <a
                href="#support"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
              >
                Get Support
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="text-4xl mb-3">{link.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{link.title}</h3>
                <p className="text-sm text-gray-600">{link.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section id="documentation" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Learning Resources
            </h2>
            <p className="text-xl text-gray-600">
              Find the help you need, when you need it
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {resources.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-purple-600 text-white p-6">
                  <h3 className="text-xl font-semibold">{category.category}</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 hover:text-purple-600 cursor-pointer">
                            {item.title}
                          </h4>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{item.readTime}</span>
                          <a href={item.link} className="text-purple-600 text-sm font-medium hover:text-purple-700">
                            Read more →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Quick answers to common questions
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section id="support" className="py-20 bg-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Still Need Help?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Our support team is here to help you succeed
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">Get instant help from our support team</p>
              <a href="#" className="text-purple-600 font-medium hover:text-purple-700">
                Start Chat →
              </a>
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4">Send us a detailed message</p>
              <a href="mailto:support@classcast.com" className="text-purple-600 font-medium hover:text-purple-700">
                support@classcast.com →
              </a>
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="text-4xl mb-4">📞</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Support</h3>
              <p className="text-gray-600 mb-4">Speak directly with our team</p>
              <a href="tel:+1-800-CLASS-CAST" className="text-purple-600 font-medium hover:text-purple-700">
                +1 (800) 252-7727 →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
