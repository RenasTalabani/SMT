import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/network/api_client.dart';
import '../models/tip_model.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class TipsState {
  final List<TipModel> tips;
  final bool isLoading;
  final String? error;
  final int page;
  final bool hasMore;

  const TipsState({
    this.tips = const [],
    this.isLoading = false,
    this.error,
    this.page = 1,
    this.hasMore = true,
  });

  TipsState copyWith({
    List<TipModel>? tips,
    bool? isLoading,
    String? error,
    bool clearError = false,
    int? page,
    bool? hasMore,
  }) {
    return TipsState(
      tips: tips ?? this.tips,
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

class TipNotifier extends StateNotifier<TipsState> {
  final ApiClient _api;

  static const int _pageSize = 10;

  TipNotifier(this._api) : super(const TipsState());

  // ── fetchTips ─────────────────────────────────────────────────────────────
  /// Fetches tips with optional [search] and [category] filters.
  ///
  /// Pass [refresh] = true to restart from page 1.
  Future<void> fetchTips({
    bool refresh = false,
    String? search,
    String? category,
  }) async {
    if (state.isLoading) return;
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

      final response = await _api.get('/tips', params: params);
      final data = response.data['data'];

      List<dynamic> rawList;
      int total = 0;

      if (data is Map) {
        rawList = (data['tips'] ?? data['items'] ?? []) as List;
        total = data['total'] ?? data['totalCount'] ?? rawList.length;
      } else if (data is List) {
        rawList = data;
        total = rawList.length;
      } else {
        rawList = [];
      }

      final fetched = rawList
          .map((e) => TipModel.fromJson(e as Map<String, dynamic>))
          .toList();

      final updatedTips = refresh ? fetched : [...state.tips, ...fetched];
      final hasMore =
          updatedTips.length < total && fetched.length == _pageSize;

      state = state.copyWith(
        isLoading: false,
        tips: updatedTips,
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

  // ── toggleLike ────────────────────────────────────────────────────────────
  /// Optimistically toggles the like state for [tipId], then calls the API.
  /// Reverts the local change on failure.
  Future<void> toggleLike(String tipId) async {
    final index = state.tips.indexWhere((t) => t.id == tipId);
    if (index == -1) return;

    final original = state.tips[index];
    final isNowLiked = !original.isLiked;
    final updatedTip = TipModel.fromJson({
      ...original._toMap(),
      'isLiked': isNowLiked,
      'likesCount': original.likesCount + (isNowLiked ? 1 : -1),
    });

    _replaceTip(index, updatedTip);

    try {
      await _api.post('/tips/$tipId/like');
    } catch (e) {
      // Revert on error.
      _replaceTip(index, original);
      state = state.copyWith(error: ApiClient.extractError(e));
    }
  }

  // ── toggleBookmark ────────────────────────────────────────────────────────
  /// Optimistically toggles the bookmark state for [tipId], then calls the API.
  /// Reverts the local change on failure.
  Future<void> toggleBookmark(String tipId) async {
    final index = state.tips.indexWhere((t) => t.id == tipId);
    if (index == -1) return;

    final original = state.tips[index];
    final isNowBookmarked = !original.isBookmarked;
    final updatedTip = TipModel.fromJson({
      ...original._toMap(),
      'isBookmarked': isNowBookmarked,
      'bookmarksCount': original.bookmarksCount + (isNowBookmarked ? 1 : -1),
    });

    _replaceTip(index, updatedTip);

    try {
      await _api.post('/tips/$tipId/bookmark');
    } catch (e) {
      // Revert on error.
      _replaceTip(index, original);
      state = state.copyWith(error: ApiClient.extractError(e));
    }
  }

  // ── helpers ───────────────────────────────────────────────────────────────
  void _replaceTip(int index, TipModel tip) {
    final updated = [...state.tips];
    updated[index] = tip;
    state = state.copyWith(tips: updated);
  }
}

// ---------------------------------------------------------------------------
// Extension – converts TipModel back to a plain map for local state updates.
// This avoids an extra copyWith on TipModel (which lives in the models layer).
// ---------------------------------------------------------------------------

extension _TipModelMapper on TipModel {
  Map<String, dynamic> _toMap() => {
        '_id': id,
        'title': title,
        'content': content,
        'category': category,
        'type': type,
        'difficulty': difficulty,
        'author': author,
        'likesCount': likesCount,
        'bookmarksCount': bookmarksCount,
        'viewsCount': viewsCount,
        'isLiked': isLiked,
        'isBookmarked': isBookmarked,
        'isPublished': isPublished,
        'media': media,
        'tags': tags,
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final tipProvider = StateNotifierProvider<TipNotifier, TipsState>(
  (ref) => TipNotifier(ApiClient()),
);
