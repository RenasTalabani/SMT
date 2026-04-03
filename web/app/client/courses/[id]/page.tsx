"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCourseById, enrollInCourse, updateProgress, clearCurrentCourse } from '@/store/coursesSlice';
import { fetchMyProgress } from '@/store/coursesSlice';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import CourseProgress from '@/components/CourseProgress';
import CourseContent from '@/components/CourseContent';
import CourseReviews from '@/components/CourseReviews';
import toast from 'react-hot-toast';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentCourse, enrolledCourses, loading, error } = useAppSelector(state => state.courses);
  const { user } = useAppSelector(state => state.auth);

  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'progress' | 'reviews'>('overview');
  const [enrolling, setEnrolling] = useState(false);

  const courseId = params.id as string;
  const isEnrolled = enrolledCourses.some(ec => ec.courseId === courseId);
  const enrollment = enrolledCourses.find(ec => ec.courseId === courseId);

  useEffect(() => {
    if (courseId) {
      dispatch(fetchCourseById(courseId));
      if (user) {
        dispatch(fetchMyProgress());
      }
    }

    return () => {
      dispatch(clearCurrentCourse());
    };
  }, [courseId, dispatch, user]);

  const handleEnroll = async () => {
    if (!currentCourse) return;

    setEnrolling(true);
    try {
      await dispatch(enrollInCourse(courseId)).unwrap();
      toast.success('Successfully enrolled in the course!');
      dispatch(fetchMyProgress());
    } catch (error: any) {
      toast.error(error || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const handleProgressUpdate = async (progress: any) => {
    try {
      await dispatch(updateProgress({ courseId, progress })).unwrap();
      toast.success('Progress updated successfully!');
    } catch (error: any) {
      toast.error(error || 'Failed to update progress');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['client', 'coach', 'admin']}>
        <AppShell>
          <LoadingSpinner />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (error || !currentCourse) {
    return (
      <ProtectedRoute allowedRoles={['client', 'coach', 'admin']}>
        <AppShell>
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              {error || 'Course not found'}
            </h3>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'content', label: 'Content', icon: '📚' },
    ...(isEnrolled ? [{ id: 'progress', label: 'My Progress', icon: '📊' }] : []),
    { id: 'reviews', label: 'Reviews', icon: '⭐' },
  ];

  return (
    <ProtectedRoute allowedRoles={['client', 'coach', 'admin']}>
      <AppShell>
        <div className="space-y-6">
          {/* Course Header */}
          <div className="relative">
            {currentCourse.thumbnail && (
              <div className="h-64 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg overflow-hidden">
                <img
                  src={currentCourse.thumbnail}
                  alt={currentCourse.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40" />
              </div>
            )}
            <div className="relative -mt-32 px-6">
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        currentCourse.level === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                        currentCourse.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {currentCourse.level.charAt(0).toUpperCase() + currentCourse.level.slice(1)}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 rounded-full">
                        {currentCourse.category}
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {currentCourse.title}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                      {currentCourse.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        <span>{currentCourse.enrollmentCount} enrolled</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>{currentCourse.averageRating.toFixed(1)} ({currentCourse.totalRatings} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span>{currentCourse.duration} weeks</span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:text-right">
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      ${currentCourse.price}
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <img
                        src={currentCourse.instructor.avatar || '/default-avatar.png'}
                        alt={currentCourse.instructor.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        by {currentCourse.instructor.name}
                      </span>
                    </div>
                    {!isEnrolled ? (
                      <button
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="w-full lg:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {enrolling ? 'Enrolling...' : 'Enroll Now'}
                      </button>
                    ) : (
                      <div className="text-green-600 dark:text-green-400 font-medium">
                        ✓ Enrolled
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="py-6">
            {activeTab === 'overview' && (
              <div className="prose dark:prose-invert max-w-none">
                <h3>About this course</h3>
                <p>{currentCourse.description}</p>

                <h4>What you'll learn</h4>
                <ul>
                  {currentCourse.content.weeks.map((week, index) => (
                    <li key={index}>Week {index + 1}: {week.title}</li>
                  ))}
                </ul>

                <h4>Prerequisites</h4>
                <ul>
                  {currentCourse.prerequisites.map((prereq, index) => (
                    <li key={index}>{prereq}</li>
                  ))}
                </ul>

                <h4>Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {currentCourse.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <CourseContent course={currentCourse} />
            )}

            {activeTab === 'progress' && enrollment && (
              <CourseProgress
                enrollment={enrollment}
                course={currentCourse}
                onProgressUpdate={handleProgressUpdate}
              />
            )}

            {activeTab === 'reviews' && (
              <CourseReviews course={currentCourse} />
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}