"use client";

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCourses, setFilters, resetFilters, fetchCategories } from '@/store/coursesSlice';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import CourseCard from '@/components/CourseCard';
import SearchBar from '@/components/SearchBar';
import FilterDropdown from '@/components/FilterDropdown';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CoursesPage() {
  const dispatch = useAppDispatch();
  const { courses, categories, loading, error, pagination, filters } = useAppSelector(state => state.courses);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchCourses());
  }, [dispatch]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    dispatch(setFilters({ search: query, page: 1 }));
    dispatch(fetchCourses({ ...filters, search: query, page: 1 }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...filters, [filterType]: value, page: 1 };
    dispatch(setFilters(newFilters));
    dispatch(fetchCourses(newFilters));
  };

  const handlePageChange = (page: number) => {
    dispatch(setFilters({ page }));
    dispatch(fetchCourses({ ...filters, page }));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    setSearchQuery('');
    dispatch(fetchCourses());
  };

  return (
    <ProtectedRoute allowedRoles={['client', 'coach', 'admin']}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Courses</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Discover and enroll in fitness courses to enhance your training.
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search courses..."
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
                label="Level"
                options={[
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' }
                ]}
                value={filters.level || ''}
                onChange={(value) => handleFilterChange('level', value)}
              />
              <FilterDropdown
                label="Sort By"
                options={[
                  { value: 'newest', label: 'Newest' },
                  { value: 'oldest', label: 'Oldest' },
                  { value: 'rating', label: 'Highest Rated' },
                  { value: 'popular', label: 'Most Popular' },
                  { value: 'price-low', label: 'Price: Low to High' },
                  { value: 'price-high', label: 'Price: High to Low' }
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

          {/* Courses Grid */}
          {!loading && courses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && courses.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No courses found</h3>
              <p className="text-slate-600 dark:text-slate-300">
                {filters.search || filters.category || filters.level
                  ? 'Try adjusting your search or filters.'
                  : 'No courses are available at the moment.'}
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