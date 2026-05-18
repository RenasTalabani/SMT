import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../models/body_part_model.dart';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
class AnatomyState {
  final List<BodyPartModel> parts;
  final BodyPartModel? selected;
  final bool isLoading;
  final String? error;
  final String activeType;   // 'all' | 'muscle' | 'joint' | 'artery' | 'nerve'
  final String activeRegion; // 'all' | 'upper_body' | 'lower_body' | 'core'
  final String searchQuery;

  const AnatomyState({
    this.parts = const [],
    this.selected,
    this.isLoading = false,
    this.error,
    this.activeType = 'all',
    this.activeRegion = 'all',
    this.searchQuery = '',
  });

  AnatomyState copyWith({
    List<BodyPartModel>? parts,
    BodyPartModel? selected,
    bool clearSelected = false,
    bool? isLoading,
    String? error,
    bool clearError = false,
    String? activeType,
    String? activeRegion,
    String? searchQuery,
  }) =>
      AnatomyState(
        parts: parts ?? this.parts,
        selected: clearSelected ? null : (selected ?? this.selected),
        isLoading: isLoading ?? this.isLoading,
        error: clearError ? null : (error ?? this.error),
        activeType: activeType ?? this.activeType,
        activeRegion: activeRegion ?? this.activeRegion,
        searchQuery: searchQuery ?? this.searchQuery,
      );

  List<BodyPartModel> get filtered {
    return parts.where((p) {
      final typeMatch = activeType == 'all' || p.type == activeType;
      final regionMatch = activeRegion == 'all' || p.region == activeRegion;
      final searchMatch = searchQuery.isEmpty ||
          p.name.toLowerCase().contains(searchQuery.toLowerCase()) ||
          (p.nameAr?.contains(searchQuery) ?? false);
      return typeMatch && regionMatch && searchMatch;
    }).toList();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifier
// ─────────────────────────────────────────────────────────────────────────────
class AnatomyNotifier extends StateNotifier<AnatomyState> {
  final ApiClient _api;

  AnatomyNotifier(this._api) : super(const AnatomyState());

  Future<void> fetchAll() async {
    if (state.isLoading) return;
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final res = await _api.get('/anatomy', params: {'limit': '100'});
      final data = res.data['data'];
      List raw;
      if (data is List) {
        raw = data;
      } else if (data is Map) {
        final v = data['parts'] ?? data['items'] ?? data['data'] ?? [];
        raw = v is List ? v : [];
      } else {
        raw = [];
      }
      final parts = raw
          .map((e) => BodyPartModel.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(isLoading: false, parts: parts, clearError: true);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ApiClient.extractError(e),
      );
    }
  }

  void selectPart(BodyPartModel part) =>
      state = state.copyWith(selected: part);

  void clearSelected() =>
      state = state.copyWith(clearSelected: true);

  void setType(String type) =>
      state = state.copyWith(activeType: type);

  void setRegion(String region) =>
      state = state.copyWith(activeRegion: region);

  void setSearch(String query) =>
      state = state.copyWith(searchQuery: query);
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
final anatomyProvider =
    StateNotifierProvider<AnatomyNotifier, AnatomyState>(
  (ref) => AnatomyNotifier(ApiClient()),
);
