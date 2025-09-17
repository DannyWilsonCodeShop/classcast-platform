'use client';

import Image from 'next/image';

export default function CustomersPage() {
  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Professor of Computer Science',
      institution: 'Stanford University',
      image: '/api/placeholder/80/80',
      quote: 'ClassCast has revolutionized how I manage my courses. The video submission feature is particularly impressive, and my students love the intuitive interface.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'High School Teacher',
      institution: 'Lincoln High School',
      image: '/api/placeholder/80/80',
      quote: 'The grading system is incredibly efficient. I can provide detailed feedback quickly, and the analytics help me understand student progress better.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Student',
      institution: 'UC Berkeley',
      image: '/api/placeholder/80/80',
      quote: 'As a student, I love how easy it is to submit assignments and track my grades. The community features help me connect with classmates for study groups.',
      rating: 5
    },
    {
      name: 'Prof. David Kim',
      role: 'Department Head',
      institution: 'MIT',
      image: '/api/placeholder/80/80',
      quote: 'The institutional features are exactly what we needed. The ability to manage multiple courses and track department-wide analytics is invaluable.',
      rating: 5
    }
  ];

  const institutions = [
    { name: 'Stanford University', logo: '/api/placeholder/120/60', students: '15,000+' },
    { name: 'MIT', logo: '/api/placeholder/120/60', students: '12,000+' },
    { name: 'UC Berkeley', logo: '/api/placeholder/120/60', students: '18,000+' },
    { name: 'Harvard University', logo: '/api/placeholder/120/60', students: '20,000+' },
    { name: 'Yale University', logo: '/api/placeholder/120/60', students: '8,000+' },
    { name: 'Princeton University', logo: '/api/placeholder/120/60', students: '6,000+' }
  ];

  const stats = [
    { number: '500+', label: 'Educational Institutions' },
    { number: '2M+', label: 'Students Served' },
    { number: '50K+', label: 'Instructors' },
    { number: '99.9%', label: 'Uptime' }
  ];

  const useCases = [
    {
      title: 'Higher Education',
      description: 'Universities and colleges use ClassCast to manage large-scale course delivery and student engagement.',
      features: ['Large class management', 'Advanced analytics', 'Integration with LMS', 'Research collaboration'],
      icon: '🎓'
    },
    {
      title: 'K-12 Education',
      description: 'Schools leverage ClassCast for interactive learning and parent-teacher communication.',
      features: ['Parent portals', 'Progress tracking', 'Interactive assignments', 'Safe communication'],
      icon: '🏫'
    },
    {
      title: 'Corporate Training',
      description: 'Companies use ClassCast for employee training and professional development programs.',
      features: ['Skill tracking', 'Certification management', 'Team collaboration', 'Progress reporting'],
      icon: '💼'
    },
    {
      title: 'Online Learning',
      description: 'Online education platforms integrate ClassCast for enhanced student experience.',
      features: ['Video submissions', 'Peer reviews', 'Discussion forums', 'Mobile learning'],
      icon: '🌐'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Trusted by Leading Institutions
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100">
              See how ClassCast is transforming education worldwide
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Real feedback from educators and students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600">{testimonial.role}</div>
                    <div className="text-gray-500 text-sm">{testimonial.institution}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perfect for Every Learning Environment
            </h2>
            <p className="text-xl text-gray-600">
              From K-12 to corporate training, ClassCast adapts to your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="text-center">
                <div className="text-6xl mb-4">{useCase.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {useCase.description}
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  {useCase.features.map((feature, featureIndex) => (
                    <li key={featureIndex}>• {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutions Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Leading Institutions
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of educators worldwide
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {institutions.map((institution, index) => (
              <div key={index} className="text-center">
                <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="w-24 h-12 bg-gray-200 rounded mx-auto mb-3 flex items-center justify-center">
                    <span className="text-gray-500 text-xs font-semibold">
                      {institution.name.split(' ')[0]}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {institution.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {institution.students} students
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Start your free trial today and see why thousands trust ClassCast
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth/signup"
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Free Trial
            </a>
            <a
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
