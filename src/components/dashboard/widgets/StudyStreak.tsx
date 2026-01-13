'use client';

import React from 'react';
import { FireIcon, CalendarDaysIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { FireIcon as FireIconSolid } from '@heroicons/react/24/solid';

interface StudyStreakProps {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  weeklyGoal: number;
  weeklyProgress: number;
  streakHistory: boolean[]; // Last 7 days
}

const StudyStreak: React.FC<StudyStreakProps> = ({
  currentStreak,
  longestStreak,
  todayCompleted,
  weeklyGoal,
  weeklyProgress,
  streakHistory
}) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();

  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return "Start your learning streak today!";
    } else if (currentStreak === 1) {
      return "Great start! Keep it going tomorrow.";
    } else if (currentStreak < 7) {
      return `${currentStreak} days strong! You're building momentum.`;
    } else if (currentStreak < 30) {
      return `Amazing ${currentStreak}-day streak! You're on fire! 🔥`;
    } else {
      return `Incredible ${currentStreak}-day streak! You're a learning champion! 🏆`;
    }
  };

  const getStreakColor = () => {
    if (currentStreak === 0) return 'text-gray-400';
    if (currentStreak < 7) return 'text-orange-500';
    if (currentStreak < 30) return 'text-red-500';
    return 'text-purple-500';
  };

  const weeklyPercentage = Math.min((weeklyProgress / weeklyGoal) * 100, 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {currentStreak > 0 ? (
            <FireIconSolid className={`w-8 h-8 ${getStreakColor()}`} />
          ) : (
            <FireIcon className="w-8 h-8 text-gray-300" />
          )}
          <div>
            <h3 className="text-lg font-bold text-gray-900">Study Streak</h3>
            <p className="text-sm text-gray-600">{getStreakMessage()}</p>
          </div>
        </div>
      </div>

      {/* Current Streak */}
      <div className="text-center mb-6">
        <div className={`text-4xl font-bold ${getStreakColor()} mb-2`}>
          {currentStreak}
        </div>
        <p className="text-sm text-gray-600">
          {currentStreak === 1 ? 'day' : 'days'} in a row
        </p>
        {longestStreak > currentStreak && (
          <p className="text-xs text-gray-500 mt-1">
            Personal best: {longestStreak} days
          </p>
        )}
      </div>

      {/* Weekly Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Weekly Goal</span>
          <span className="text-sm text-gray-600">{weeklyProgress}/{weeklyGoal} days</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${weeklyPercentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {weeklyPercentage >= 100 ? 'Goal achieved! 🎉' : `${Math.round(weeklyPercentage)}% complete`}
        </p>
      </div>

      {/* 7-Day History */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">This Week</h4>
        <div className="flex justify-between">
          {days.map((day, index) => {
            const isToday = index === today;
            const isCompleted = streakHistory[index];
            const isFuture = index > today;
            
            return (
              <div key={index} className="flex flex-col items-center space-y-2">
                <span className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                  {day}
                </span>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isToday && todayCompleted
                    ? 'bg-blue-500 text-white'
                    : isToday
                    ? 'bg-blue-100 text-blue-600 border-2 border-blue-500'
                    : isFuture
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-red-100 text-red-500'
                  }
                `}>
                  {isCompleted || (isToday && todayCompleted) ? '✓' : day}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Button */}
      {!todayCompleted ? (
        <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105">
          Complete Today's Learning
        </button>
      ) : (
        <div className="w-full bg-green-50 text-green-800 py-3 rounded-lg font-medium text-center border border-green-200">
          <div className="flex items-center justify-center space-x-2">
            <TrophyIcon className="w-5 h-5" />
            <span>Today's goal completed!</span>
          </div>
        </div>
      )}

      {/* Motivational Quote */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 italic text-center">
          "Success is the sum of small efforts repeated day in and day out."
        </p>
      </div>
    </div>
  );
};

export default StudyStreak;