'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      closeMenu();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-[#0065a3]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/MyClassCast (800 x 200 px).png"
                alt="ClassCast Logo"
                width={200}
                height={50}
                className="h-12 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {isAuthenticated && (
                <>
                  <Link
                    href="/dashboard"
                    className="text-[#0065a3] hover:text-[#005a8f] px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/assignments"
                    className="text-[#0065a3] hover:text-[#005a8f] px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Assignments
                  </Link>
                  <Link
                    href="/community"
                    className="text-[#0065a3] hover:text-[#005a8f] px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Community
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* User Menu & Auth - Hidden on mobile */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {isAuthenticated ? (
                <div className="relative">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-[#0065a3] font-medium">
                      Welcome, {user?.firstName}!
                    </span>
                    <button
                      onClick={handleLogout}
                      className="bg-[#0065a3] hover:bg-[#005a8f] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/login"
                    className="text-[#0065a3] hover:text-[#005a8f] px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-[#0065a3] hover:bg-[#005a8f] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#0065a3] hover:text-[#005a8f] hover:bg-[#0065a3]/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0065a3] transition-colors duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Close icon */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden bg-white/95 backdrop-blur-sm border-t border-[#0065a3]/20`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            href="/"
            className="text-[#0065a3] hover:text-[#005a8f] block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            onClick={closeMenu}
          >
            Home
          </Link>
          {isAuthenticated && (
            <>
              <Link
                href="/dashboard"
                className="text-[#0065a3] hover:text-[#005a8f] block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={closeMenu}
              >
                Dashboard
              </Link>
              <Link
                href="/assignments"
                className="text-[#0065a3] hover:text-[#005a8f] block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={closeMenu}
              >
                Assignments
              </Link>
              <Link
                href="/community"
                className="text-[#0065a3] hover:text-[#005a8f] block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={closeMenu}
              >
                Community
              </Link>
            </>
          )}
        </div>
        
        {/* Mobile user menu */}
        <div className="pt-4 pb-3 border-t border-[#0065a3]/20">
          {isAuthenticated ? (
            <div className="px-4 space-y-3">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-[#0065a3]">
                  Welcome, {user?.firstName}!
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left bg-[#0065a3] hover:bg-[#005a8f] text-white px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="px-4 space-y-3">
              <Link
                href="/auth/login"
                className="text-[#0065a3] hover:text-[#005a8f] block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={closeMenu}
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-[#0065a3] hover:bg-[#005a8f] text-white px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 block text-center"
                onClick={closeMenu}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
