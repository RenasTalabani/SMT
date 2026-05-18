"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTipById, likeTip, bookmarkTip, fetchTipComments, addTipComment, clearCurrentTip } from '@/store/tipsSlice';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import TipComments from '@/components/TipComments';
import toast from 'react-hot-toast';

export default function TipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentTip, loading, error } = useAppSelector(state => state.tips);
  const { user } = useAppSelector(state => state.auth);

  const [liking, setLiking] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const tipId = params.id as string;
  const isLiked = currentTip?.likes.includes(user?._id || '');
  const isBookmarked = currentTip?.bookmarks.includes(user?._id || '');

  useEffect(() => {
    if (tipId) {
      dispatch(fetchTipById(tipId));
    }

    return () => {
      dispatch(clearCurrentTip());
    };
  }, [tipId, dispatch]);

  const handleLike = async () => {
    if (!currentTip || !user) return;

    setLiking(true);
    try {
      await dispatch(likeTip(tipId)).unwrap();
      toast.success(isLiked ? 'Tip unliked' : 'Tip liked!');
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to like tip');
    } finally {
      setLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (!currentTip || !user) return;

    setBookmarking(true);
    try {
      await dispatch(bookmarkTip(tipId)).unwrap();
      toast.success(isBookmarked ? 'Tip unbookmarked' : 'Tip bookmarked!');
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to bookmark tip');
    } finally {
      setBookmarking(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    setSubmittingComment(true);
    try {
      await dispatch(addTipComment({ tipId, content: commentText })).unwrap();
      setCommentText('');
      toast.success('Comment added successfully!');
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
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

  if (error || !currentTip) {
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
              {error || 'Tip not found'}
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

  return (
    <ProtectedRoute allowedRoles={['client', 'coach', 'admin']}>
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tip Header */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden">
            {/* Media Section */}
            {currentTip.media && currentTip.media.length > 0 && (
              <div className="relative">
                {currentTip.media[0].type === 'image' ? (
                  <img
                    src={currentTip.media[0].url}
                    alt={currentTip.title}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <video
                    src={currentTip.media[0].url}
                    controls
                    className="w-full h-64 object-cover"
                  />
                )}
              </div>
            )}

            <div className="p-6">
              {/* Tags and Metadata */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  currentTip.difficulty === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                  currentTip.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                }`}>
                  {currentTip.difficulty.charAt(0).toUpperCase() + currentTip.difficulty.slice(1)}
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full">
                  {currentTip.category}
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 rounded-full">
                  {currentTip.type.charAt(0).toUpperCase() + currentTip.type.slice(1)}
                </span>
              </div>

              {/* Title and Author */}
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                {currentTip.title}
              </h1>

              <div className="flex items-center gap-4 mb-6">
                <img
                  src={currentTip.author.avatar || '/default-avatar.png'}
                  alt={currentTip.author.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {currentTip.author.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {new Date(currentTip.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mb-6 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <span>{currentTip.views} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span>{currentTip.likesCount} likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  <span>{currentTip.bookmarksCount} bookmarks</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  <span>{currentTip.commentsCount} comments</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  disabled={liking}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isLiked
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {liking ? 'Liking...' : isLiked ? 'Liked' : 'Like'}
                </button>

                <button
                  onClick={handleBookmark}
                  disabled={bookmarking}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isBookmarked
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  {bookmarking ? 'Saving...' : isBookmarked ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {/* Tip Content */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6">
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: currentTip.content.replace(/\n/g, '<br>') }} />
            </div>

            {/* Tags */}
            {currentTip.tags.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {currentTip.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Estimated Time */}
            <div className="mt-6 flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Estimated time: {currentTip.estimatedTime} minutes</span>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-6">Comments ({currentTip.commentsCount})</h3>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="mb-6">
              <div className="flex gap-4">
                <img
                  src={user?.avatar || '/default-avatar.png'}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!commentText.trim() || submittingComment}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <TipComments
              comments={currentTip.comments}
              onLoadComments={() => dispatch(fetchTipComments(tipId))}
            />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}