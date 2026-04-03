import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { TipComment } from '@/store/tipsSlice';

interface TipCommentsProps {
  comments: TipComment[];
  onLoadComments: () => void;
}

export default function TipComments({ comments, onLoadComments }: TipCommentsProps) {
  const { user } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (comments.length === 0) {
      onLoadComments();
    }
  }, [comments.length, onLoadComments]);

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-slate-600 dark:text-slate-300">No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment._id} className="flex gap-4">
          <img
            src={comment.author.avatar || '/default-avatar.png'}
            alt={comment.author.name}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
          <div className="flex-1">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {comment.author.name}
                </span>
                {user && comment.author._id === user._id && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded">
                    You
                  </span>
                )}
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                {comment.content}
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-3">
              {new Date(comment.createdAt).toLocaleDateString()} at{' '}
              {new Date(comment.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}