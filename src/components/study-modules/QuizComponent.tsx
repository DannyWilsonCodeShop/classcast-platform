'use client';

import React, { useState, useEffect } from 'react';
import { Quiz, QuizQuestion, QuizAttempt } from '@/types/study-modules';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrophyIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface QuizComponentProps {
  quiz: Quiz;
  onComplete: () => void;
  isCompleted: boolean;
}

const QuizComponent: React.FC<QuizComponentProps> = ({ quiz, onComplete, isCompleted }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const attemptsUsed = quiz.attempts.length;
  const canRetake = attemptsUsed < quiz.maxAttempts;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (quizStarted && timeLeft !== null && timeLeft > 0 && !showResults) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev !== null && prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizStarted, timeLeft, showResults]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    let totalPoints = 0;
    let earnedPoints = 0;

    quiz.questions.forEach(question => {
      totalPoints += question.points;
      const userAnswer = answers[question.id];
      
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        if (userAnswer === question.correctAnswer) {
          earnedPoints += question.points;
        }
      } else if (question.type === 'fill-blank') {
        // Simple string comparison for fill-in-the-blank
        if (typeof userAnswer === 'string' && typeof question.correctAnswer === 'string') {
          if (userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
            earnedPoints += question.points;
          }
        }
      }
    });

    return Math.round((earnedPoints / totalPoints) * 100);
  };

  const handleSubmitQuiz = () => {
    const finalScore = calculateScore();
    const quizPassed = finalScore >= quiz.passingScore;
    
    setScore(finalScore);
    setPassed(quizPassed);
    setShowResults(true);

    // Create attempt record
    const newAttempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      userId: 'current-user', // In real app, get from auth context
      quizId: quiz.id,
      answers,
      score: finalScore,
      passed: quizPassed,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      timeSpent: quiz.timeLimit ? (quiz.timeLimit * 60) - (timeLeft || 0) : 0
    };

    setAttempt(newAttempt);

    // If passed and not already completed, mark as complete
    if (quizPassed && !isCompleted) {
      onComplete();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getQuestionResult = (question: QuizQuestion) => {
    const userAnswer = answers[question.id];
    if (!userAnswer) return null;
    
    const isCorrect = userAnswer === question.correctAnswer;
    return { isCorrect, userAnswer, correctAnswer: question.correctAnswer };
  };

  // Quiz Start Screen
  if (!quizStarted && !showResults) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrophyIcon className="w-8 h-8 text-purple-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{quiz.title}</h1>
            <p className="text-gray-600 mb-8">{quiz.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{totalQuestions}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{quiz.passingScore}%</div>
                <div className="text-sm text-gray-600">Passing Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {quiz.timeLimit ? `${quiz.timeLimit} min` : 'No limit'}
                </div>
                <div className="text-sm text-gray-600">Time Limit</div>
              </div>
            </div>

            {attemptsUsed > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  You have used {attemptsUsed} of {quiz.maxAttempts} attempts.
                  {quiz.attempts.length > 0 && (
                    <span className="block mt-1">
                      Best score: {Math.max(...quiz.attempts.map(a => a.score))}%
                    </span>
                  )}
                </p>
              </div>
            )}

            <button
              onClick={handleStartQuiz}
              disabled={!canRetake}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              {attemptsUsed > 0 ? 'Retake Quiz' : 'Start Quiz'}
            </button>

            {!canRetake && (
              <p className="text-red-600 text-sm mt-4">
                You have used all available attempts for this quiz.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz Results Screen
  if (showResults && attempt) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl p-8 max-w-4xl w-full">
          <div className="text-center mb-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {passed ? (
                <CheckCircleIconSolid className="w-10 h-10 text-green-600" />
              ) : (
                <XCircleIcon className="w-10 h-10 text-red-600" />
              )}
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {passed ? 'Congratulations!' : 'Keep Trying!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {passed 
                ? 'You have successfully completed this quiz.'
                : `You need ${quiz.passingScore}% to pass. You can retake the quiz.`
              }
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className={`text-3xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  {score}%
                </div>
                <div className="text-sm text-gray-600">Your Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {quiz.questions.filter(q => getQuestionResult(q)?.isCorrect).length}/{totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {formatTime(attempt.timeSpent)}
                </div>
                <div className="text-sm text-gray-600">Time Spent</div>
              </div>
            </div>
          </div>

          {/* Question Review */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Question Review</h3>
            {quiz.questions.map((question, index) => {
              const result = getQuestionResult(question);
              return (
                <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      result?.isCorrect ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {result?.isCorrect ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Question {index + 1}: {question.question}
                      </h4>
                      
                      {question.type === 'multiple-choice' && question.options && (
                        <div className="space-y-2 mb-4">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`p-2 rounded border ${
                                option === question.correctAnswer
                                  ? 'bg-green-50 border-green-200 text-green-800'
                                  : option === result?.userAnswer && option !== question.correctAnswer
                                  ? 'bg-red-50 border-red-200 text-red-800'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              {option}
                              {option === question.correctAnswer && (
                                <span className="ml-2 text-green-600 font-medium">(Correct)</span>
                              )}
                              {option === result?.userAnswer && option !== question.correctAnswer && (
                                <span className="ml-2 text-red-600 font-medium">(Your answer)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {question.explanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <p className="text-blue-800 text-sm">
                            <strong>Explanation:</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center space-x-4 mt-8">
            {!passed && canRetake && (
              <button
                onClick={() => {
                  setQuizStarted(false);
                  setShowResults(false);
                  setTimeLeft(quiz.timeLimit ? quiz.timeLimit * 60 : null);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Retake Quiz
              </button>
            )}
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Lesson
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Taking Screen
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Quiz Header */}
        <div className="bg-white rounded-t-xl p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
              <p className="text-gray-600">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              {timeLeft !== null && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <ClockIcon className="w-5 h-5" />
                  <span className={`font-mono ${timeLeft < 300 ? 'text-red-600' : ''}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                Progress: {Object.keys(answers).length}/{totalQuestions} answered
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="bg-white p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">
            {currentQuestion.question}
          </h3>

          {/* Multiple Choice */}
          {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-700 text-lg">{option}</span>
                </label>
              ))}
            </div>
          )}

          {/* True/False */}
          {currentQuestion.type === 'true-false' && (
            <div className="space-y-3">
              {['true', 'false'].map((option) => (
                <label
                  key={option}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-700 text-lg capitalize">{option}</span>
                </label>
              ))}
            </div>
          )}

          {/* Fill in the Blank */}
          {currentQuestion.type === 'fill-blank' && (
            <div>
              <input
                type="text"
                value={answers[currentQuestion.id] as string || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-b-xl p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Previous</span>
            </button>

            <div className="flex space-x-3">
              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  <span>Next</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizComponent;