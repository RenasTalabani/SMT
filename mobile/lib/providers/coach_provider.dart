import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/network/api_client.dart';
import '../models/coach_model.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class CoachState {
  final List<CoachModel> coaches;
  final bool isLoading;
  final String? error;

  const CoachState({
    this.coaches = const [],
    this.isLoading = false,
    this.error,
  });

  CoachState copyWith({
    List<CoachModel>? coaches,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return CoachState(
      coaches: coaches ?? this.coaches,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class CoachNotifier extends StateNotifier<CoachState> {
  final ApiClient _api;

  CoachNotifier(this._api) : super(const CoachState());

  Future<void> fetchCoaches() async {
    if (state.isLoading) return;
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await _api.get('/users/coaches');
      final data = response.data['data'];

      List<dynamic> rawList;
      if (data is Map) {
        rawList = (data['coaches'] ?? []) as List;
      } else if (data is List) {
        rawList = data;
      } else {
        rawList = [];
      }

      final coaches = rawList
          .map((e) => CoachModel.fromJson(e as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        isLoading: false,
        coaches: coaches,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ApiClient.extractError(e),
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final coachProvider = StateNotifierProvider<CoachNotifier, CoachState>(
  (ref) => CoachNotifier(ApiClient()),
);
