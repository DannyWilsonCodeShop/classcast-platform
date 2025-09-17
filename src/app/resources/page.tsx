'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResourcesPage() {
  const router = useRouter();
  
  const resources = [
    {
      category: 'Learning Guides 📚',
      items: [
        {
          title: 'How to Get Started! 🚀',
          description: 'Learn how to use ClassCast in just 10 minutes - super easy!',
          type: 'Guide',
          readTime: '5 min read',
          link: '#'
        },
        {
          title: 'Cool Developer Stuff! 💻',
          description: 'All the technical stuff for people who love coding!',
          type: 'Technical',
          readTime: '15 min read',
          link: '#'
        },
        {
          title: 'Fun Video Tutorials! 🎥',
          description: 'Watch awesome videos that show you how to do everything!',
          type: 'Video',
          readTime: '20 min watch',
          link: '#'
        },
        {
          title: 'Super Smart Tips! 💡',
          description: 'Amazing tips from teachers who know all the cool tricks!',
          type: 'Guide',
          readTime: '8 min read',
          link: '#'
        }
      ]
    },
    {
      category: 'Help & Support 🆘',
      items: [
        {
          title: 'Help Center! 🔍',
          description: 'Find answers to questions you might have!',
          type: 'FAQ',
          readTime: '2 min read',
          link: '#'
        },
        {
          title: 'Ask for Help! 💬',
          description: 'Get help from our super friendly support team!',
          type: 'Support',
          readTime: '1 min',
          link: '#'
        },
        {
          title: 'Is Everything Working? ✅',
          description: 'Check if ClassCast is working perfectly!',
          type: 'Status',
          readTime: '1 min',
          link: '#'
        },
        {
          title: 'Share Your Ideas! 💭',
          description: 'Tell us what cool new features you want!',
          type: 'Feedback',
          readTime: '3 min',
          link: '#'
        }
      ]
    },
    {
      category: 'Fun Community! 👥',
      items: [
        {
          title: 'Chat with Friends! 💬',
          description: 'Talk to other kids who love ClassCast!',
          type: 'Community',
          readTime: '5 min',
          link: '#'
        },
        {
          title: 'Amazing Success Stories! 🌟',
          description: 'Read about how other kids are doing awesome things!',
          type: 'Case Study',
          readTime: '10 min read',
          link: '#'
        },
        {
          title: 'Cool Online Classes! 🎓',
          description: 'Join our fun monthly learning sessions!',
          type: 'Event',
          readTime: '60 min',
          link: '#'
        },
        {
          title: 'Fun Blog Posts! 📝',
          description: 'Read the latest cool news and stories!',
          type: 'Blog',
          readTime: '7 min read',
          link: '#'
        }
      ]
    }
  ];

  const quickLinks = [
    { title: 'Get the Mobile App! 📱', description: 'Download our super cool app for your phone!', icon: '📱' },
    { title: 'Connect Other Apps! 🔗', description: 'Make ClassCast work with your favorite tools!', icon: '🔗' },
    { title: 'Stay Safe & Private! 🔒', description: 'Learn how we keep your information super safe!', icon: '🔒' },
    { title: 'See How Much It Costs! 💰', description: 'Find out how much fun learning costs!', icon: '💰' }
  ];

  const faqs = [
    {
      question: 'How do I start using ClassCast? 🤔',
      answer: 'It\'s super easy! Just sign up for a free account, and you can start learning and having fun right away! 🎉'
    },
    {
      question: 'Can I use ClassCast on my phone? 📱',
      answer: 'Yes! We have awesome apps for both iPhone and Android that let you do everything on your phone! 📲'
    },
    {
      question: 'Does ClassCast work with my school\'s other apps? 🔗',
      answer: 'Absolutely! ClassCast can connect with lots of other learning apps like Canvas, Blackboard, and Moodle! 🌟'
    },
    {
      question: 'What kinds of files can I turn in for homework? 📎',
      answer: 'You can turn in almost anything! Documents, pictures, videos, audio files, and even code files! 📚'
    },
    {
      question: 'Is my information safe? 🔒',
      answer: 'Yes! We use super strong security to keep all your information safe and private! 🛡️'
    },
    {
      question: 'Do teachers get help learning how to use ClassCast? 👩‍🏫',
      answer: 'Yes! We have lots of fun videos, guides, and live classes to help teachers learn everything! 🎓'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      {/* Kid-Friendly Hero Section */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-white relative overflow-hidden">
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
              📚 Help & Learning Center! 📚
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Super Helpful
              <span className="block bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
                Resources! 🌟
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Everything you need to learn and have fun with ClassCast! 😊
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#documentation"
                className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold hover:bg-yellow-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                📖 Browse Guides
              </a>
              <a
                href="#support"
                className="border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white hover:text-purple-600 transition-all duration-300 shadow-lg"
              >
                🆘 Get Help
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Kid-Friendly Quick Links */}
      <section className="py-16 bg-gradient-to-br from-yellow-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-full text-sm font-bold mb-8 shadow-lg border-2 border-yellow-300">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3 animate-bounce"></div>
              ⚡ Quick Links! ⚡
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Super Quick
              <span className="block bg-gradient-to-r from-yellow-400 to-blue-500 bg-clip-text text-transparent">
                Helpful Links! 🌟
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-gray-200/30 hover:border-yellow-300">
                <div className="text-5xl mb-4">{link.icon}</div>
                <h3 className="font-bold text-gray-800 mb-3 text-lg">{link.title}</h3>
                <p className="text-sm text-gray-600 font-medium">{link.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kid-Friendly Resources Grid */}
      <section id="documentation" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-full text-sm font-bold mb-8 shadow-lg border-2 border-blue-300">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-bounce"></div>
              📚 Learning Resources! 📚
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Find the Help You Need
              <span className="block bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                When You Need It! 🌟
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Super helpful guides and resources to make learning fun! 😊
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {resources.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200/30 hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6">
                  <h3 className="text-xl font-bold">{category.category}</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-gray-800 hover:text-purple-600 cursor-pointer text-lg">
                            {item.title}
                          </h4>
                          <span className="text-xs bg-gradient-to-r from-yellow-100 to-blue-100 text-gray-700 px-3 py-1 rounded-full font-bold">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 font-medium">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-medium">{item.readTime}</span>
                          <a href={item.link} className="text-purple-600 text-sm font-bold hover:text-purple-700">
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

      {/* Kid-Friendly FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-full text-sm font-bold mb-8 shadow-lg border-2 border-green-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-bounce"></div>
              ❓ Questions & Answers! ❓
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Super Common
              <span className="block bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Questions! 🤔
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Quick answers to questions lots of people ask! 😊
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30 hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 font-medium">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kid-Friendly Support Section */}
      <section id="support" className="py-20 bg-gradient-to-r from-yellow-400 via-green-500 to-blue-500 relative overflow-hidden">
        {/* Fun Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/30 rounded-full blur-xl animate-bounce"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-white/30 rounded-full blur-xl animate-bounce delay-1000"></div>
          <div className="absolute bottom-10 left-1/3 w-40 h-40 bg-white/30 rounded-full blur-xl animate-bounce delay-2000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-8">
            <div className="w-2 h-2 bg-white rounded-full mr-3 animate-bounce"></div>
            🆘 Need More Help? 🆘
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Still Need Help?
            <span className="block bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
              We're Here for You! 🌟
            </span>
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Our super friendly support team is here to help you succeed! 😊
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-white/30">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Live Chat! 💬</h3>
              <p className="text-gray-600 mb-4 font-medium">Get instant help from our super friendly team!</p>
              <a href="#" className="text-blue-600 font-bold hover:text-blue-700">
                Start Chat →
              </a>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-white/30">
              <div className="text-5xl mb-4">📧</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Email Us! 📧</h3>
              <p className="text-gray-600 mb-4 font-medium">Send us a message and we'll help you!</p>
              <a href="mailto:support@classcast.com" className="text-blue-600 font-bold hover:text-blue-700">
                support@classcast.com →
              </a>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-white/30">
              <div className="text-5xl mb-4">📞</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Call Us! 📞</h3>
              <p className="text-gray-600 mb-4 font-medium">Talk directly with our awesome team!</p>
              <a href="tel:+1-800-CLASS-CAST" className="text-blue-600 font-bold hover:text-blue-700">
                +1 (800) 252-7727 →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
