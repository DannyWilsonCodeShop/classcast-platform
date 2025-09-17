'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function ProductsPage() {
  const features = [
    {
      title: 'Super Smart AI Learning',
      description: 'Amazing AI that makes learning fun and helps you understand everything better!',
      icon: '🤖',
      features: ['AI study buddy that helps you learn', 'Smart suggestions for fun activities', 'Automatic grading that gives helpful tips', 'Learning paths made just for you'],
      trending: true
    },
    {
      title: 'Fun Assignment Creator',
      description: 'Create awesome assignments and projects with cool tools that make learning exciting!',
      icon: '📝',
      features: ['AI helps grade your work fairly', 'Detects when work is original', 'Create fun rubrics together', 'Never miss important dates'],
      trending: false
    },
    {
      title: 'Amazing Video Learning',
      description: 'Create and share awesome videos with friends while learning together!',
      icon: '🎥',
      features: ['AI writes down what you say', 'Work together in real-time', 'Cool VR and AR experiences', 'Store everything safely in the cloud'],
      trending: true
    },
    {
      title: 'Friends & Study Groups',
      description: 'Make friends, join study groups, and learn together in a fun community!',
      icon: '👥',
      features: ['AI helps you find study buddies', 'Smart Q&A system for questions', 'Peer review with friends', 'Chat and work together'],
      trending: true
    },
    {
      title: 'Smart Success Predictions',
      description: 'AI helps predict how well you\'ll do and gives tips to help you succeed!',
      icon: '📊',
      features: ['Predicts your success', 'Finds areas where you need help', 'Shows your progress', 'Custom dashboards for you'],
      trending: true
    },
    {
      title: 'Easy Connections',
      description: 'Connect with 100+ fun learning tools and platforms easily!',
      icon: '🔗',
      features: ['Connect with other learning apps', 'Easy API access', 'One login for everything', 'Works with your favorite tools'],
      trending: false
    }
  ];

  const pricingTiers = [
    {
      name: 'Student Explorer',
      price: 'Free',
      description: 'Perfect for students who want to start learning and having fun!',
      features: [
        'AI study buddy (5 hours/month)',
        'Submit cool assignments',
        'See your grades & get helpful feedback',
        'Join the fun community',
        'Create basic videos',
        'Use the mobile app',
        'Get smart study suggestions'
      ],
      cta: 'Start Learning Free',
      popular: false,
      aiFeatures: 2
    },
    {
      name: 'Teacher Superstar',
      price: '$39',
      period: '/month',
      description: 'Awesome AI tools for amazing teachers',
      features: [
        'Unlimited AI tutoring hours',
        'AI helps grade & give feedback',
        'Smart analytics dashboard',
        'Smart content suggestions',
        'Advanced video tools with AI help',
        'Priority support',
        'Custom AI prompts',
        'Originality detection'
      ],
      cta: 'Start Free Trial',
      popular: true,
      aiFeatures: 8
    },
    {
      name: 'School Champion',
      price: 'Custom',
      description: 'Super powerful AI solution for entire schools',
      features: [
        'Unlimited users & AI features',
        'Custom AI training for your school',
        'Advanced success predictions',
        'Custom school branding',
        'API access & integrations',
        'Dedicated AI support team',
        'Super secure login',
        'Custom AI workflows'
      ],
      cta: 'Contact Sales',
      popular: false,
      aiFeatures: 12
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      {/* Kid-Friendly Hero Section */}
      <div className="bg-gradient-to-r from-yellow-400 via-blue-500 to-purple-500 text-white relative overflow-hidden">
        {/* Fun Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/30 rounded-full blur-xl animate-bounce"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-white/30 rounded-full blur-xl animate-bounce delay-1000"></div>
          <div className="absolute bottom-10 left-1/3 w-40 h-40 bg-white/30 rounded-full blur-xl animate-bounce delay-2000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-8">
              <div className="w-2 h-2 bg-white rounded-full mr-3 animate-bounce"></div>
              ✨ Super Cool Learning Tools! ✨
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Fun Learning
              <span className="block bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
                Products! 🎉
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Everything you need to learn, create, and have fun with friends! 🌟
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold hover:bg-yellow-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                🚀 Start Learning Free!
              </Link>
              <Link
                href="#features"
                className="border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-lg"
              >
                🔍 Explore Features
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Kid-Friendly Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-yellow-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-full text-sm font-bold mb-8 shadow-lg border-2 border-yellow-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-bounce"></div>
              🎯 Amazing Learning Features! 🎯
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Super Cool Features for
              <span className="block bg-gradient-to-r from-yellow-400 to-blue-500 bg-clip-text text-transparent">
                Learning & Fun! 🌟
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Built just for kids who love to learn and create! 🎨
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className={`bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 ${
                feature.trending ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-5xl">{feature.icon}</div>
                  {feature.trending && (
                    <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-sm rounded-full font-bold shadow-lg">
                      🔥 Super Popular!
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4 font-medium">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center text-sm text-gray-700 font-medium">
                      <span className="text-green-500 mr-3 text-lg">✨</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kid-Friendly Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-full text-sm font-bold mb-8 shadow-lg border-2 border-blue-300">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-bounce"></div>
              💰 Choose Your Learning Adventure! 💰
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Fun & Fair
              <span className="block bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Pricing! 🎯
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Pick the perfect plan for your learning journey! 🌟
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 ${
                  tier.popular ? 'border-yellow-300 relative' : 'border-gray-200'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      🌟 Most Popular! 🌟
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {tier.name} 🎓
                  </h3>
                  <div className="text-4xl font-bold text-gray-800 mb-2">
                    {tier.price}
                    {tier.period && (
                      <span className="text-lg text-gray-600">{tier.period}</span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3 font-medium">{tier.description}</p>
                  {tier.aiFeatures && (
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white text-sm rounded-full font-bold shadow-lg">
                      🤖 {tier.aiFeatures} Super Smart AI Features! 🧠
                    </div>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <span className="text-green-500 mr-3 text-lg">✨</span>
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-4 px-6 rounded-full font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                    tier.popular
                      ? 'bg-gradient-to-r from-yellow-400 to-blue-500 text-white hover:from-yellow-500 hover:to-blue-600'
                      : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400'
                  }`}
                >
                  {tier.cta} 🚀
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kid-Friendly AI Showcase Section */}
      <section className="py-20 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 relative overflow-hidden">
        {/* Fun Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/30 rounded-full blur-xl animate-bounce"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-white/30 rounded-full blur-xl animate-bounce delay-1000"></div>
          <div className="absolute bottom-10 left-1/3 w-40 h-40 bg-white/30 rounded-full blur-xl animate-bounce delay-2000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-8">
              <div className="w-2 h-2 bg-white rounded-full mr-3 animate-bounce"></div>
              🤖 Super Smart AI Magic! 🤖
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powered by Super Smart
              <span className="block bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
                AI! 🧠✨
              </span>
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Experience the future of learning with amazing artificial intelligence that helps you succeed! 🌟
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl border-2 border-white/30">
              <div className="text-6xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-white mb-3">Smart Learning Buddy</h3>
              <p className="text-white/90 font-medium">AI learns how you like to study and helps you learn better! 🎯</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl border-2 border-white/30">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Help</h3>
              <p className="text-white/90 font-medium">Get super fast, helpful feedback on your work! 🚀</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl border-2 border-white/30">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-3">Smart Predictions</h3>
              <p className="text-white/90 font-medium">AI helps teachers help you succeed even better! 🌟</p>
            </div>
          </div>
        </div>
      </section>

      {/* Kid-Friendly CTA Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-400 via-blue-500 to-purple-500 relative overflow-hidden">
        {/* Fun Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/30 rounded-full blur-xl animate-bounce"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-white/30 rounded-full blur-xl animate-bounce delay-1000"></div>
          <div className="absolute bottom-10 left-1/3 w-40 h-40 bg-white/30 rounded-full blur-xl animate-bounce delay-2000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-8">
            <div className="w-2 h-2 bg-white rounded-full mr-3 animate-bounce"></div>
            🎉 Ready to Start Your Learning Adventure? 🎉
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Learn & Have Fun?
            <span className="block bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
              Join the Fun! 🌟
            </span>
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of happy students and teachers already having fun with ClassCast! 😊
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold hover:bg-yellow-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              🚀 Start Learning Free!
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-lg"
            >
              💬 Ask Questions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
