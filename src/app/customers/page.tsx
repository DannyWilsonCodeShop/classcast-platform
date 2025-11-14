'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
  const router = useRouter();
  
  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Super Smart Teacher! 👩‍🏫',
      institution: 'Stanford University',
      image: '/api/placeholder/80/80',
      quote: 'ClassCast makes teaching so much fun! My students love creating videos and sharing their learning journey. It\'s like social media but for education! 🎉',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Awesome High School Teacher! 🏫',
      institution: 'Lincoln High School',
      image: '/api/placeholder/80/80',
      quote: 'Grading is now super easy and fun! I can give helpful feedback really fast, and the cool charts help me see how my students are doing! 📊✨',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Happy Student! 🎓',
      institution: 'UC Berkeley',
      image: '/api/placeholder/80/80',
      quote: 'I love how easy it is to turn in my homework and see my grades! The community features help me make friends and study together! 🤝🌟',
      rating: 5
    },
    {
      name: 'Prof. David Kim',
      role: 'School Leader! 🏆',
      institution: 'MIT',
      image: '/api/placeholder/80/80',
      quote: 'ClassCast helps our whole school work together! We can manage lots of classes and see how everyone is learning. It\'s amazing! 🚀',
      rating: 5
    }
  ];

  const institutions = [
    { name: 'Stanford University', logo: '/api/placeholder/120/60', students: '15,000+', emoji: '🎓' },
    { name: 'MIT', logo: '/api/placeholder/120/60', students: '12,000+', emoji: '🧠' },
    { name: 'UC Berkeley', logo: '/api/placeholder/120/60', students: '18,000+', emoji: '🌟' },
    { name: 'Harvard University', logo: '/api/placeholder/120/60', students: '20,000+', emoji: '🏆' },
    { name: 'Yale University', logo: '/api/placeholder/120/60', students: '8,000+', emoji: '📚' },
    { name: 'Princeton University', logo: '/api/placeholder/120/60', students: '6,000+', emoji: '⭐' }
  ];

  const stats = [
    { number: '500+', label: 'Super Cool Schools! 🏫', emoji: '🏫' },
    { number: '2M+', label: 'Happy Students! 😊', emoji: '😊' },
    { number: '50K+', label: 'Awesome Teachers! 👩‍🏫', emoji: '👩‍🏫' },
    { number: '99.9%', label: 'Always Working! ⚡', emoji: '⚡' }
  ];

  const useCases = [
    {
      title: 'College & University Fun! 🎓',
      description: 'Big schools use ClassCast to help lots of students learn together and have fun!',
      features: ['Help lots of students at once', 'Cool charts and graphs', 'Works with other school apps', 'Students can work together on projects'],
      icon: '🎓'
    },
    {
      title: 'Elementary & High School! 🏫',
      description: 'Schools use ClassCast to make learning super fun and help parents see how kids are doing!',
      features: ['Parents can see progress', 'Track how well kids are doing', 'Fun interactive homework', 'Safe way to talk to teachers'],
      icon: '🏫'
    },
    {
      title: 'Company Learning! 💼',
      description: 'Companies use ClassCast to help their workers learn new skills and get better at their jobs!',
      features: ['Track new skills learned', 'Get certificates for learning', 'Work together as a team', 'See how everyone is improving'],
      icon: '💼'
    },
    {
      title: 'Online Learning Fun! 🌐',
      description: 'Online schools use ClassCast to make learning on the computer super exciting!',
      features: ['Make cool videos for homework', 'Help each other learn', 'Chat about school stuff', 'Learn anywhere on your phone'],
      icon: '🌐'
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
          {/* Header with Logo and Home Button */}
          <div className="absolute top-4 right-4 flex items-center space-x-4">
            <img
              src="/MyClassCast (800 x 200 px).png"
              alt="MyClassCast"
              className="h-8 w-auto object-contain"
            />
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
              🎓 Trusted by Schools Everywhere! 🎓
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Successful
              <span className="block bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
                Schools & Students! 🎯
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              See how ClassCast makes learning engaging and effective for everyone! 🌟
            </p>
          </div>
        </div>
      </div>

      {/* Kid-Friendly Stats Section */}
      <section className="py-20 bg-gradient-to-br from-yellow-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-full text-sm font-bold mb-8 shadow-lg border-2 border-yellow-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-bounce"></div>
              📊 Amazing Numbers! 📊
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Look How Many People Love
              <span className="block bg-gradient-to-r from-yellow-400 to-blue-500 bg-clip-text text-transparent">
                ClassCast! 🌟
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-yellow-300/30 text-center hover:shadow-xl transition-all duration-300">
                <div className="text-4xl mb-3">{stat.emoji}</div>
                <div className="text-4xl md:text-5xl font-bold text-blue-500 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-700 font-bold text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kid-Friendly Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-full text-sm font-bold mb-8 shadow-lg border-2 border-blue-300">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-bounce"></div>
              💬 What People Say About Us! 💬
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Super Happy
              <span className="block bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Teachers & Students! 😊
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from awesome people who love ClassCast! 🌟
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-gray-200/30 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-2xl">⭐</span>
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 font-medium text-lg leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mr-4 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-lg">{testimonial.name}</div>
                    <div className="text-gray-600 font-medium">{testimonial.role}</div>
                    <div className="text-gray-500 text-sm">{testimonial.institution}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kid-Friendly Use Cases Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-full text-sm font-bold mb-8 shadow-lg border-2 border-purple-300">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 animate-bounce"></div>
              🎯 Perfect for Everyone! 🎯
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Works Great for
              <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                All Kinds of Learning! 🌟
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              From little kids to big companies, ClassCast makes learning fun for everyone! 😊
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-200/30 text-center hover:shadow-xl transition-all duration-300">
                <div className="text-6xl mb-4">{useCase.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 mb-4 font-medium">
                  {useCase.description}
                </p>
                <ul className="text-sm text-gray-700 space-y-2 font-medium">
                  {useCase.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <span className="text-green-500 mr-2">✨</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kid-Friendly Institutions Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-full text-sm font-bold mb-8 shadow-lg border-2 border-green-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-bounce"></div>
              🏫 Super Cool Schools! 🏫
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Trusted by Amazing
              <span className="block bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Schools Everywhere! 🌟
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of happy teachers and students around the world! 🌍
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {institutions.map((institution, index) => (
              <div key={index} className="text-center">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-2 border-gray-200/30">
                  <div className="text-4xl mb-3">{institution.emoji}</div>
                  <div className="text-sm font-bold text-gray-800 mb-1">
                    {institution.name}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    {institution.students} happy students! 😊
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kid-Friendly CTA Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-400 via-green-500 to-blue-500 relative overflow-hidden">
        {/* Fun Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/30 rounded-full blur-xl animate-bounce"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-white/30 rounded-full blur-xl animate-bounce delay-1000"></div>
          <div className="absolute bottom-10 left-1/3 w-40 h-40 bg-white/30 rounded-full blur-xl animate-bounce delay-2000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-8">
            <div className="w-2 h-2 bg-white rounded-full mr-3 animate-bounce"></div>
            🎉 Ready to Join the Fun? 🎉
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Learning
            <span className="block bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
              & Having Fun? 🌟
            </span>
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start your free trial today and see why thousands of happy students love ClassCast! 😊
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth/signup"
              className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold hover:bg-yellow-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              🚀 Start Learning Free!
            </a>
            <a
              href="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-lg"
            >
              💬 Ask Questions
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
