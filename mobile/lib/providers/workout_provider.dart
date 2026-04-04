import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/network/api_client.dart';
import '../models/workout_model.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class WorkoutsState {
  final List<WorkoutPlanModel> plans;
  final List<WorkoutPlanModel> templates;
  final bool isLoading;
  final bool isLoadingTemplates;
  final String? error;
  final bool requestSent;

  const WorkoutsState({
    this.plans = const [],
    this.templates = const [],
    this.isLoading = false,
    this.isLoadingTemplates = false,
    this.error,
    this.requestSent = false,
  });

  WorkoutsState copyWith({
    List<WorkoutPlanModel>? plans,
    List<WorkoutPlanModel>? templates,
    bool? isLoading,
    bool? isLoadingTemplates,
    String? error,
    bool clearError = false,
    bool? requestSent,
  }) {
    return WorkoutsState(
      plans: plans ?? this.plans,
      templates: templates ?? this.templates,
      isLoading: isLoading ?? this.isLoading,
      isLoadingTemplates: isLoadingTemplates ?? this.isLoadingTemplates,
      error: clearError ? null : (error ?? this.error),
      requestSent: requestSent ?? this.requestSent,
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class WorkoutNotifier extends StateNotifier<WorkoutsState> {
  final ApiClient _api;

  WorkoutNotifier(this._api) : super(const WorkoutsState());

  // ── fetchPlans ────────────────────────────────────────────────────────────
  Future<void> fetchPlans() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _api.get('/workouts');
      final data = response.data['data'];

      List<dynamic> rawList;
      if (data is List) {
        rawList = data;
      } else if (data is Map && data['plans'] is List) {
        rawList = data['plans'] as List;
      } else if (data is Map && data['workoutPlans'] is List) {
        rawList = data['workoutPlans'] as List;
      } else {
        rawList = [];
      }

      final plans = rawList
          .map((e) => WorkoutPlanModel.fromJson(e as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        isLoading: false,
        plans: plans,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ApiClient.extractError(e),
      );
    }
  }

  // ── requestPlan ───────────────────────────────────────────────────────────
  /// Sends a workout-plan request to a specific coach.
  Future<void> requestPlan({
    required String coachId,
    required String planType,
    String? notes,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true, requestSent: false);
    try {
      await _api.post(
        '/workouts/request',
        data: {
          'coachId': coachId,
          'planType': planType,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      );

      state = state.copyWith(
        isLoading: false,
        requestSent: true,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ApiClient.extractError(e),
      );
    }
  }

  // ── fetchTemplates ────────────────────────────────────────────────────────
  Future<void> fetchTemplates() async {
    state = state.copyWith(isLoadingTemplates: true);
    try {
      final response = await _api.get('/workouts/templates');
      final data = response.data['data'];

      List<dynamic> rawList;
      if (data is List) {
        rawList = data;
      } else if (data is Map && data['templates'] is List) {
        rawList = data['templates'] as List;
      } else if (data is Map && data['workoutPlans'] is List) {
        rawList = data['workoutPlans'] as List;
      } else {
        rawList = [];
      }

      final templates = rawList
          .map((e) => WorkoutPlanModel.fromJson(e as Map<String, dynamic>))
          .toList();

      state = state.copyWith(isLoadingTemplates: false, templates: templates);
    } catch (_) {
      state = state.copyWith(isLoadingTemplates: false);
    }
  }

  /// Resets the [requestSent] flag so forms can be reused.
  void resetRequestSent() {
    state = state.copyWith(requestSent: false);
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final workoutProvider = StateNotifierProvider<WorkoutNotifier, WorkoutsState>(
  (ref) => WorkoutNotifier(ApiClient()),
);
