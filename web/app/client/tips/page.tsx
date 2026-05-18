"use client";

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTips, setFilters, resetFilters, fetchTipCategories } from '@/store/tipsSlice';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import TipCard from '@/components/TipCard';
import SearchBar from '@/components/SearchBar';
import FilterDropdown from '@/components/FilterDropdown';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function TipsPage() {
  const dispatch = useAppDispatch();
  const { tips, categories, loading, error, pagination, filters } = useAppSelector(state => state.tips);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');

  useEffect(() => {
    dispatch(fetchTipCategories());
    dispatch(fetchTips({}));
  }, [dispatch]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    dispatch(setFilters({ search: query, page: 1 }));
    dispatch(fetchTips({ ...filters, search: query, page: 1 }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...filters, [filterType]: value, page: 1 };
    dispatch(setFilters(newFilters));
    dispatch(fetchTips(newFilters));
  };

  const handlePageChange = (page: number) => {
    dispatch(setFilters({ page }));
    dispatch(fetchTips({ ...filters, page }));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    setSearchQuery('');
    dispatch(fetchTips({}));
  };

  return (
    <ProtectedRoute allowedRoles={['client', 'coach', 'admin']}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Fitness Tips</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Discover helpful fitness tips, techniques, and advice from experts.
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search tips..."
                value={searchQuery}
                onSearch={handleSearch}
              />
            </div>
            <div className="flex gap-2">
              <FilterDropdown
                label="Category"
                options={categories.map(cat => ({ value: cat, label: cat }))}
                value={filters.category || ''}
                onChange={(value) => handleFilterChange('category', value)}
              />
              <FilterDropdown
                label="Type"
                options={[
                  { value: 'article', label: 'Article' },
                  { value: 'video', label: 'Video' },
                  { value: 'infographic', label: 'Infographic' },
                  { value: 'exercise', label: 'Exercise' }
                ]}
                value={filters.type || ''}
                onChange={(value) => handleFilterChange('type', value)}
              />
              <FilterDropdown
                label="Difficulty"
                options={[
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' }
                ]}
                value={filters.difficulty || ''}
                onChange={(value) => handleFilterChange('difficulty', value)}
              />
              <FilterDropdown
                label="Sort By"
                options={[
                  { value: 'newest', label: 'Newest' },
                  { value: 'oldest', label: 'Oldest' },
                  { value: 'popular', label: 'Most Popular' },
                  { value: 'likes', label: 'Most Liked' },
                  { value: 'views', label: 'Most Viewed' }
                ]}
                value={filters.sortBy || 'newest'}
                onChange={(value) => handleFilterChange('sortBy', value)}
              />
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && <LoadingSpinner />}

          {/* Tips Grid */}
          {!loading && tips.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tips.map((tip) => (
                <TipCard key={tip._id} tip={tip} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && tips.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No tips found</h3>
              <p className="text-slate-600 dark:text-slate-300">
                {filters.search || filters.category || filters.type || filters.difficulty
                  ? 'Try adjusting your search or filters.'
                  : 'No tips are available at the moment.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}