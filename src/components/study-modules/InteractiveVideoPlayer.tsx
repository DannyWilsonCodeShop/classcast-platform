'use client';

import React, { useState, useEffect, useRef } from 'react';
import { parseVideoUrl, getEmbedUrl } from '@/lib/urlUtils';
import { InteractiveVideoMarker, QuizQuestion } from '@/types/study-modules';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  Cog6ToothIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface InteractiveVideoPlayerProps {
  videoUrl: string;
  lessonId: string;
  onComplete: () => void;
  isCompleted: boolean;
}

// Mock interactive markers for demo
const mockMarkers: InteractiveVideoMarker[] = [
  {
    id: 'marker-1',
    videoId: 'lesson-1-1',
    timeStamp: 120, // 2 minutes
    type: 'question',
    title: 'Quick Check',
    content: 'Let\'s test your understanding so far',
    isRequired: true,
    completed: false,
    question: {
      id: 'q1',
      type: 'multiple-choice',
      question: 'What is the main purpose of calculus?',
      options: [
        'To solve algebraic equations',
        'To study rates of change and accumulation',
        'To graph linear functions',
        'To factor polynomials'
      ],
      correctAnswer: 'To study rates of change and accumulation',
      explanation: 'Calculus is primarily concerned with rates of change (derivatives) and accumulation (integrals).',
      points: 5
    }
  },
  {
    id: 'marker-2',
    videoId: 'lesson-1-1',
    timeStamp: 300, // 5 minutes
    type: 'note',
    title: 'Key Concept',
    content: 'Remember: Limits are the foundation of all calculus concepts',
    isRequired: false,
    completed: false
  },
  {
    id: 'marker-3',
    videoId: 'lesson-1-1',
    timeStamp: 480, // 8 minutes
    type: 'checkpoint',
    title: 'Progress Checkpoint',
    content: 'You\'re halfway through this lesson! Keep going!',
    isRequired: false,
    completed: false
  }
];

const InteractiveVideoPlayer: React.FC<InteractiveVideoPlayerProps> = ({
  videoUrl,
  lessonId,
  onComplete,
  isCompleted
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [activeMarker, setActiveMarker] = useState<InteractiveVideoMarker | null>(null);
  const [completedMarkers, setCompletedMarkers] = useState<Set<string>>(new Set());
  const [watchTime, setWatchTime] = useState(0);
  const [hasWatchedEnough, setHasWatchedEnough] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const videoUrlInfo = parseVideoUrl(videoUrl);
  const isYouTube = videoUrlInfo?.type === 'youtube';
  const embedUrl = getEmbedUrl(videoUrl);

  useEffect(() => {
    // Check for markers at current time
    const currentMarker = mockMarkers.find(
      marker => 
        marker.videoId === lessonId &&
        Math.abs(marker.timeStamp - currentTime) < 1 &&
        !completedMarkers.has(marker.id)
    );

    if (currentMarker && currentMarker.isRequired) {
      setActiveMarker(currentMarker);
      setIsPlaying(false);
    }
  }, [currentTime, lessonId, completedMarkers]);

  useEffect(() => {
    // Track watch time and determine if user has watched enough to complete
    if (isPlaying && duration > 0) {
      const watchPercentage = (watchTime / duration) * 100;
      if (watchPercentage >= 80) { // 80% watch threshold
        setHasWatchedEnough(true);
      }
    }
  }, [watchTime, duration, isPlaying]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && videoRef.current) {
      interval = setInterval(() => {
        setWatchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    hideControlsAfterDelay();
  };

  const handlePause = () => {
    setIsPlaying(false);
    setShowControls(true);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const hideControlsAfterDelay = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    hideControlsAfterDelay();
  };

  const handleMarkerComplete = (markerId: string, isCorrect?: boolean) => {
    setCompletedMarkers(prev => new Set(prev).add(markerId));
    setActiveMarker(null);
    
    // Resume video if it was paused for a required marker
    if (videoRef.current && !isPlaying) {
      videoRef.current.play();
    }
  };

  const handleVideoComplete = () => {
    if (hasWatchedEnough && !isCompleted) {
      onComplete();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      {isYouTube && embedUrl ? (
        <iframe
          src={`${embedUrl}?autoplay=0&controls=0&rel=0&modestbranding=1&enablejsapi=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Study Video"
        />
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleVideoComplete}
          onClick={togglePlay}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Interactive Markers on Timeline */}
      <div className="absolute bottom-20 left-4 right-4">
        <div className="relative h-1 bg-gray-600 rounded">
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 rounded"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          {mockMarkers
            .filter(marker => marker.videoId === lessonId)
            .map(marker => (
              <div
                key={marker.id}
                className={`absolute top-0 w-3 h-3 -mt-1 rounded-full transform -translate-x-1/2 cursor-pointer ${
                  completedMarkers.has(marker.id)
                    ? 'bg-green-500'
                    : marker.type === 'question'
                    ? 'bg-yellow-500'
                    : marker.type === 'checkpoint'
                    ? 'bg-purple-500'
                    : 'bg-blue-500'
                }`}
                style={{ left: `${(marker.timeStamp / duration) * 100}%` }}
                onClick={() => handleSeek(marker.timeStamp)}
                title={marker.title}
              />
            ))}
        </div>
      </div>

      {/* Video Controls */}
      {showControls && !isYouTube && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors"
            >
              {isPlaying ? (
                <PauseIcon className="w-8 h-8" />
              ) : (
                <PlayIcon className="w-8 h-8" />
              )}
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isMuted ? (
                  <SpeakerXMarkIcon className="w-6 h-6" />
                ) : (
                  <SpeakerWaveIcon className="w-6 h-6" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20"
              />
            </div>

            <div className="flex-1 flex items-center space-x-2">
              <span className="text-white text-sm">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-white text-sm">{formatTime(duration)}</span>
            </div>

            <button className="text-white hover:text-blue-400 transition-colors">
              <Cog6ToothIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Interactive Marker Overlay */}
      {activeMarker && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${
                activeMarker.type === 'question' ? 'bg-yellow-500' :
                activeMarker.type === 'checkpoint' ? 'bg-purple-500' : 'bg-blue-500'
              }`} />
              <h3 className="text-lg font-bold text-gray-900">{activeMarker.title}</h3>
            </div>

            {activeMarker.type === 'question' && activeMarker.question ? (
              <QuestionOverlay
                question={activeMarker.question}
                onAnswer={(isCorrect) => handleMarkerComplete(activeMarker.id, isCorrect)}
              />
            ) : (
              <div>
                <p className="text-gray-700 mb-4">{activeMarker.content}</p>
                <button
                  onClick={() => handleMarkerComplete(activeMarker.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completion Overlay */}
      {hasWatchedEnough && !isCompleted && (
        <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
          <CheckCircleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Ready to complete!</span>
          <button
            onClick={onComplete}
            className="ml-2 bg-green-700 hover:bg-green-800 px-3 py-1 rounded text-sm transition-colors"
          >
            Mark Complete
          </button>
        </div>
      )}
    </div>
  );
};

// Question Overlay Component
const QuestionOverlay: React.FC<{
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
}> = ({ question, onAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    const correct = selectedAnswer === question.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
  };

  const handleContinue = () => {
    onAnswer(isCorrect);
  };

  if (showResult) {
    return (
      <div>
        <div className={`p-4 rounded-lg mb-4 ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircleIcon className={`w-5 h-5 ${isCorrect ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
          </div>
          {question.explanation && (
            <p className="text-sm text-gray-700">{question.explanation}</p>
          )}
        </div>
        <button
          onClick={handleContinue}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
        >
          Continue Video
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-gray-900 mb-4 font-medium">{question.question}</p>
      
      {question.type === 'multiple-choice' && question.options && (
        <div className="space-y-2 mb-4">
          {question.options.map((option, index) => (
            <label
              key={index}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name="answer"
                value={option}
                checked={selectedAnswer === option}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedAnswer}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
      >
        Submit Answer
      </button>
    </div>
  );
};

export default InteractiveVideoPlayer;