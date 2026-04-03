import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/network/api_client.dart';
import '../models/course_model.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class CoursesState {
  final List<CourseModel> courses;
  final bool isLoading;
  final String? error;
  final int page;
  final bool hasMore;

  const CoursesState({
    this.courses = const [],
    this.isLoading = false,
    this.error,
    this.page = 1,
    this.hasMore = true,
  });

  CoursesState copyWith({
    List<CourseModel>? courses,
    bool? isLoading,
    String? error,
    bool clearError = false,
    int? page,
    bool? hasMore,
  }) {
    return CoursesState(
      courses: courses ?? this.courses,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class CourseNotifier extends StateNotifier<CoursesState> {
  final ApiClient _api;

  /// Number of items requested per page.
  static const int _pageSize = 10;

  CourseNotifier(this._api) : super(const CoursesState());

  // ── fetchCourses ──────────────────────────────────────────────────────────
  /// Fetches courses with optional [search] and [category] filters.
  ///
  /// Pass [refresh] = true to restart from page 1 (e.g. on pull-to-refresh or
  /// when filter parameters change). Subsequent calls without [refresh] append
  /// the next page to the existing list.
  Future<void> fetchCourses({
    bool refresh = false,
    String? search,
    String? category,
  }) async {
    // Prevent duplicate in-flight requests while already loading.
    if (state.isLoading) return;
    // Do not fetch if there are no more pages (and we are not refreshing).
    if (!refresh && !state.hasMore) return;

    final nextPage = refresh ? 1 : state.page;

    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final params = <String, dynamic>{
        'page': nextPage,
        'limit': _pageSize,
        if (search != null && search.isNotEmpty) 'search': search,
        if (category != null && category.isNotEmpty) 'category': category,
      };

      final response = await _api.get('/courses', params: params);
      final data = response.data['data'];

      List<dynamic> rawList;
      int total = 0;

      if (data is Map) {
        rawList = (data['courses'] ?? data['items'] ?? []) as List;
        total = data['total'] ?? data['totalCount'] ?? rawList.length;
      } else if (data is List) {
        rawList = data;
        total = rawList.length;
      } else {
        rawList = [];
      }

      final fetched = rawList
          .map((e) => CourseModel.fromJson(e as Map<String, dynamic>))
          .toList();

      final updatedCourses =
          refresh ? fetched : [...state.courses, ...fetched];
      final fetchedSoFar = updatedCourses.length;
      final hasMore = fetchedSoFar < total && fetched.length == _pageSize;

      state = state.copyWith(
        isLoading: false,
        courses: updatedCourses,
        page: nextPage + 1,
        hasMore: hasMore,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ApiClient.extractError(e),
      );
    }
  }

  // ── enroll ────────────────────────────────────────────────────────────────
  Future<void> enroll(String courseId) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _api.post('/courses/$courseId/enroll');
      state = state.copyWith(isLoading: false, clearError: true);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ApiClient.extractError(e),
      );
      rethrow;
    }
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final courseProvider = StateNotifierProvider<CourseNotifier, CoursesState>(
  (ref) => CourseNotifier(ApiClient()),
);
