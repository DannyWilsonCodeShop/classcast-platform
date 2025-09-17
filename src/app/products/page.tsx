'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function ProductsPage() {
  const features = [
    {
      title: 'AI-Powered Learning',
      description: 'Revolutionary AI features that personalize learning experiences and provide intelligent feedback.',
      icon: '🤖',
      features: ['AI tutoring assistant', 'Smart content recommendations', 'Automated essay grading', 'Personalized learning paths'],
      trending: true
    },
    {
      title: 'Advanced Assignment Management',
      description: 'Create, distribute, and grade assignments with AI-enhanced tools and comprehensive analytics.',
      icon: '📝',
      features: ['AI-powered grading', 'Plagiarism detection', 'Rubric creation', 'Due date management'],
      trending: false
    },
    {
      title: 'Immersive Video Learning',
      description: 'Next-generation video submissions with AI transcription, real-time collaboration, and VR support.',
      icon: '🎥',
      features: ['AI transcription', 'Real-time collaboration', 'VR/AR support', 'Cloud storage'],
      trending: true
    },
    {
      title: 'Smart Community Platform',
      description: 'AI-enhanced community features that foster meaningful connections and collaborative learning.',
      icon: '👥',
      features: ['AI study group matching', 'Smart Q&A system', 'Peer review automation', 'Real-time chat'],
      trending: true
    },
    {
      title: 'Predictive Analytics',
      description: 'Advanced analytics and machine learning to predict student success and optimize learning outcomes.',
      icon: '📊',
      features: ['Predictive modeling', 'Risk identification', 'Performance analytics', 'Custom dashboards'],
      trending: true
    },
    {
      title: 'Seamless Integrations',
      description: 'Connect with 100+ educational tools and platforms through our comprehensive API and integrations.',
      icon: '🔗',
      features: ['LMS integrations', 'API access', 'Single sign-on', 'Third-party tools'],
      trending: false
    }
  ];

  const pricingTiers = [
    {
      name: 'Student',
      price: 'Free',
      description: 'Perfect for students getting started with AI-powered learning',
      features: [
        'AI tutoring assistant (5 hours/month)',
        'Submit assignments',
        'View grades & feedback',
        'Access community',
        'Basic video submissions',
        'Mobile app access',
        'AI study recommendations'
      ],
      cta: 'Get Started',
      popular: false,
      aiFeatures: 2
    },
    {
      name: 'Instructor Pro',
      price: '$39',
      period: '/month',
      description: 'Advanced AI tools for modern educators',
      features: [
        'Unlimited AI tutoring hours',
        'AI-powered grading & feedback',
        'Predictive analytics dashboard',
        'Smart content recommendations',
        'Advanced video tools with AI transcription',
        'Priority support',
        'Custom AI prompts',
        'Plagiarism detection'
      ],
      cta: 'Start Free Trial',
      popular: true,
      aiFeatures: 8
    },
    {
      name: 'Institution AI',
      price: 'Custom',
      description: 'Enterprise AI solution for educational institutions',
      features: [
        'Unlimited users & AI features',
        'Custom AI model training',
        'Advanced predictive analytics',
        'White-label AI branding',
        'API access & integrations',
        'Dedicated AI support team',
        'SSO & security compliance',
        'Custom AI workflows'
      ],
      cta: 'Contact Sales',
      popular: false,
      aiFeatures: 12
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              ClassCast Products
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Everything you need for modern education
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                href="#features"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Education
            </h2>
            <p className="text-xl text-gray-600">
              Built specifically for modern learning environments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className={`bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                feature.trending ? 'ring-2 ring-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50' : ''
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">{feature.icon}</div>
                  {feature.trending && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                      🔥 Trending
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center text-sm text-gray-600">
                      <span className="text-green-500 mr-2">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that's right for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-lg p-8 ${
                  tier.popular ? 'ring-2 ring-blue-500 relative' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {tier.name}
                  </h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {tier.price}
                    {tier.period && (
                      <span className="text-lg text-gray-600">{tier.period}</span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{tier.description}</p>
                  {tier.aiFeatures && (
                    <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                      🤖 {tier.aiFeatures} AI Features
                    </div>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <span className="text-green-500 mr-3">✓</span>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    tier.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Showcase Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Experience the future of education with cutting-edge artificial intelligence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold text-white mb-3">Smart Learning</h3>
              <p className="text-purple-100">AI adapts to each student's learning style and pace</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-3">Instant Feedback</h3>
              <p className="text-purple-100">Get immediate, personalized feedback on assignments</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-3">Predictive Analytics</h3>
              <p className="text-purple-100">Identify at-risk students and optimize learning outcomes</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Education?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of educators and students already using ClassCast AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
