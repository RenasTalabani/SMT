'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  fetchUsersAnalytics,
  fetchCoursesAnalytics,
  fetchTipsAnalytics,
  fetchWorkoutsAnalytics,
  fetchRevenueAnalytics
} from '@/store/analyticsSlice';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminAnalytics() {
  const dispatch = useAppDispatch();
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  const {
    users,
    courses,
    tips,
    workouts,
    revenue
  } = useAppSelector(state => state.analytics);

  useEffect(() => {
    dispatch(fetchUsersAnalytics(selectedPeriod));
    dispatch(fetchCoursesAnalytics(selectedPeriod));
    dispatch(fetchTipsAnalytics(selectedPeriod));
    dispatch(fetchWorkoutsAnalytics(selectedPeriod));
    dispatch(fetchRevenueAnalytics(selectedPeriod));
  }, [dispatch, selectedPeriod]);

  const handlePeriodChange = (period: number) => {
    setSelectedPeriod(period);
  };

  const OverviewCard = ({ title, value, subtitle, loading }: {
    title: string;
    value: string | number;
    subtitle?: string;
    loading: boolean;
  }) => (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</h3>
      {loading ? (
        <div className="mt-2 h-8 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
      ) : (
        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      )}
      {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  );

  const ChartCard = ({ title, children, loading }: {
    title: string;
    children: React.ReactNode;
    loading: boolean;
  }) => (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {loading ? (
        <div className="h-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
      ) : (
        <div className="h-64">{children}</div>
      )}
    </div>
  );

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics Dashboard</h1>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Monitor platform performance and user engagement metrics
              </p>
            </div>

            {/* Period Selector */}
            <div className="flex space-x-2">
              {[7, 30, 90].map((period) => (
                <button
                  key={period}
                  onClick={() => handlePeriodChange(period)}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    selectedPeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {period === 7 ? '7 days' : period === 30 ? '30 days' : '90 days'}
                </button>
              ))}
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <OverviewCard
              title="Total Users"
              value={users.data?.overview?.totalUsers || 0}
              subtitle={`${users.data?.overview?.activeUsers || 0} active`}
              loading={users.loading}
            />
            <OverviewCard
              title="Course Enrollments"
              value={courses.data?.overview?.totalEnrollments || 0}
              subtitle={`${courses.data?.overview?.completionRate || 0}% completion rate`}
              loading={courses.loading}
            />
            <OverviewCard
              title="Tips Engagement"
              value={tips.data?.overview?.totalViews || 0}
              subtitle={`${tips.data?.overview?.totalLikes || 0} likes, ${tips.data?.overview?.totalComments || 0} comments`}
              loading={tips.loading}
            />
            <OverviewCard
              title="Revenue"
              value={`$${revenue.data?.overview?.totalRevenue || 0}`}
              subtitle="Total earnings"
              loading={revenue.loading}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* User Growth Chart */}
            <ChartCard title="User Growth" loading={users.loading}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={users.data?.growth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="New Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Course Enrollments Chart */}
            <ChartCard title="Course Enrollments" loading={courses.loading}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courses.data?.growth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" name="Enrollments" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Tips Engagement Chart */}
            <ChartCard title="Tips Engagement" loading={tips.loading}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tips.data?.engagement || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="likes"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Likes"
                  />
                  <Line
                    type="monotone"
                    dataKey="comments"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="Comments"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Revenue Chart */}
            <ChartCard title="Revenue Trend" loading={revenue.loading}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenue.data?.growth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ff7300"
                    strokeWidth={2}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* User Distribution by Role */}
            <ChartCard title="Users by Role" loading={users.loading}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={users.data?.distribution?.byRole || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(users.data?.distribution?.byRole || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Courses by Category */}
            <ChartCard title="Courses by Category" loading={courses.loading}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courses.data?.distribution?.byCategory || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#ffc658" name="Courses" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Top Performing Content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="Top Tips by Engagement" loading={tips.loading}>
              <div className="space-y-3">
                {(tips.data?.topTips || []).slice(0, 5).map((tip: any, index: number) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{tip.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {tip.views} views • {tip.likesCount} likes • {tip.commentsCount} comments
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Top Revenue Courses" loading={revenue.loading}>
              <div className="space-y-3">
                {(revenue.data?.topCourses || []).slice(0, 5).map((course: any, index: number) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{course.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        ${course.revenue} revenue • {course.enrollmentCount} enrollments
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
