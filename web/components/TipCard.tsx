import Link from 'next/link';
import { Tip } from '@/store/tipsSlice';

interface TipCardProps {
  tip: Tip;
}

export default function TipCard({ tip }: TipCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* Media */}
      {tip.media && tip.media.length > 0 && (
        <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
          {tip.media[0].type === 'image' ? (
            <img
              src={tip.media[0].url}
              alt={tip.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={tip.media[0].url}
              className="w-full h-full object-cover"
              muted
            />
          )}
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              tip.type === 'video' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
              tip.type === 'infographic' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
              tip.type === 'exercise' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
              'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
            }`}>
              {tip.type.charAt(0).toUpperCase() + tip.type.slice(1)}
            </span>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Tags */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            tip.difficulty === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
            tip.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
          }`}>
            {tip.difficulty.charAt(0).toUpperCase() + tip.difficulty.slice(1)}
          </span>
          <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 rounded-full">
            {tip.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">
          {tip.title}
        </h3>

        {/* Content Preview */}
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 line-clamp-3">
          {tip.content.length > 150 ? `${tip.content.substring(0, 150)}...` : tip.content}
        </p>

        {/* Author */}
        <div className="flex items-center gap-2 mb-4">
          <img
            src={tip.author.avatar || '/default-avatar.png'}
            alt={tip.author.name}
            className="w-6 h-6 rounded-full"
          />
          <span className="text-sm text-slate-600 dark:text-slate-300">
            by {tip.author.name}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <span>{tip.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span>{tip.likesCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span>{tip.commentsCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>{tip.estimatedTime}m</span>
          </div>
        </div>

        {/* View Tip Button */}
        <Link
          href={`/client/tips/${tip._id}`}
          className="w-full block text-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Read More
        </Link>
      </div>
    </div>
  );
}