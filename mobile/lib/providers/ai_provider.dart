import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';

// ══════════════════════════════════════════════════════════════════════════════
// CHAT
// ══════════════════════════════════════════════════════════════════════════════

class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime time;

  const ChatMessage({
    required this.text,
    required this.isUser,
    required this.time,
  });
}

class AiChatState {
  final List<ChatMessage> messages;
  final bool isTyping;
  final bool isLoadingHistory;
  final String? error;

  const AiChatState({
    this.messages = const [],
    this.isTyping = false,
    this.isLoadingHistory = false,
    this.error,
  });

  AiChatState copyWith({
    List<ChatMessage>? messages,
    bool? isTyping,
    bool? isLoadingHistory,
    String? error,
  }) =>
      AiChatState(
        messages: messages ?? this.messages,
        isTyping: isTyping ?? this.isTyping,
        isLoadingHistory: isLoadingHistory ?? this.isLoadingHistory,
        error: error,
      );
}

class AiChatNotifier extends StateNotifier<AiChatState> {
  static final _welcome = ChatMessage(
    text: "Hi! I'm your AI Coach 💪 Ask me anything about workouts, nutrition, or training tips!",
    isUser: false,
    time: DateTime.fromMillisecondsSinceEpoch(0),
  );

  AiChatNotifier() : super(AiChatState(messages: [_welcome]));

  Future<void> loadHistory() async {
    state = state.copyWith(isLoadingHistory: true);
    try {
      final res = await ApiClient().get(ApiConstants.aiChatHistory);
      final raw = (res.data['data']['messages'] as List<dynamic>? ?? []);
      if (raw.isEmpty) {
        state = state.copyWith(isLoadingHistory: false);
        return;
      }
      final loaded = raw.map((m) {
        final isUser = m['role'] == 'user';
        return ChatMessage(
          text: m['content'] as String,
          isUser: isUser,
          time: m['createdAt'] != null
              ? DateTime.tryParse(m['createdAt'] as String) ?? DateTime.now()
              : DateTime.now(),
        );
      }).toList();

      state = state.copyWith(
        messages: [_welcome, ...loaded],
        isLoadingHistory: false,
      );
    } catch (_) {
      state = state.copyWith(isLoadingHistory: false);
    }
  }

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    final userMsg = ChatMessage(text: text.trim(), isUser: true, time: DateTime.now());
    state = state.copyWith(
      messages: [...state.messages, userMsg],
      isTyping: true,
      error: null,
    );

    try {
      final res = await ApiClient().post(ApiConstants.aiChat, data: {'message': text.trim()});
      final reply = res.data['data']['reply'] as String;
      state = state.copyWith(
        messages: [...state.messages, ChatMessage(text: reply, isUser: false, time: DateTime.now())],
        isTyping: false,
      );
    } catch (e) {
      state = state.copyWith(
        isTyping: false,
        error: ApiClient.extractError(e),
      );
    }
  }

  Future<void> clearHistory() async {
    try {
      await ApiClient().delete(ApiConstants.aiChatHistoryClear);
    } catch (_) {}
    state = AiChatState(messages: [_welcome]);
  }

  void clearError() => state = state.copyWith(error: null);
}

final aiChatProvider = StateNotifierProvider<AiChatNotifier, AiChatState>(
  (_) => AiChatNotifier(),
);

// ══════════════════════════════════════════════════════════════════════════════
// WORKOUT GENERATOR
// ══════════════════════════════════════════════════════════════════════════════

class AiWorkoutState {
  final bool isLoading;
  final Map<String, dynamic>? generatedPlan;
  final String? savedPlanId;
  final bool isSaving;
  final String? error;

  const AiWorkoutState({
    this.isLoading = false,
    this.generatedPlan,
    this.savedPlanId,
    this.isSaving = false,
    this.error,
  });

  AiWorkoutState copyWith({
    bool? isLoading,
    Map<String, dynamic>? generatedPlan,
    String? savedPlanId,
    bool? isSaving,
    String? error,
  }) =>
      AiWorkoutState(
        isLoading: isLoading ?? this.isLoading,
        generatedPlan: generatedPlan ?? this.generatedPlan,
        savedPlanId: savedPlanId ?? this.savedPlanId,
        isSaving: isSaving ?? this.isSaving,
        error: error,
      );
}

class AiWorkoutNotifier extends StateNotifier<AiWorkoutState> {
  AiWorkoutNotifier() : super(const AiWorkoutState());

  Future<void> generate({
    required String goal,
    required String level,
    required int daysPerWeek,
  }) async {
    state = const AiWorkoutState(isLoading: true);
    try {
      final res = await ApiClient().post(ApiConstants.aiGenerateWorkout, data: {
        'goal': goal,
        'level': level,
        'daysPerWeek': daysPerWeek,
      });
      final data = res.data['data'] as Map<String, dynamic>;
      state = AiWorkoutState(
        generatedPlan: Map<String, dynamic>.from(data['raw'] as Map),
        savedPlanId: data['plan']?['_id'] as String?,
      );
    } catch (e) {
      state = AiWorkoutState(error: ApiClient.extractError(e));
    }
  }

  void reset() => state = const AiWorkoutState();
}

final aiWorkoutProvider =
    StateNotifierProvider<AiWorkoutNotifier, AiWorkoutState>(
  (_) => AiWorkoutNotifier(),
);

// ══════════════════════════════════════════════════════════════════════════════
// NUTRITION
// ══════════════════════════════════════════════════════════════════════════════

class AiNutritionState {
  final bool isLoading;
  final String? plan;
  final String? error;

  const AiNutritionState({this.isLoading = false, this.plan, this.error});

  AiNutritionState copyWith({bool? isLoading, String? plan, String? error}) =>
      AiNutritionState(
        isLoading: isLoading ?? this.isLoading,
        plan: plan ?? this.plan,
        error: error,
      );
}

class AiNutritionNotifier extends StateNotifier<AiNutritionState> {
  AiNutritionNotifier() : super(const AiNutritionState());

  Future<void> analyze({
    required double weight,
    required double height,
    required String goal,
    int? age,
    String gender = 'male',
    String activityLevel = 'moderate',
  }) async {
    state = const AiNutritionState(isLoading: true);
    try {
      final res = await ApiClient().post(ApiConstants.aiNutrition, data: {
        'weight': weight,
        'height': height,
        'goal': goal,
        if (age != null) 'age': age,
        'gender': gender,
        'activityLevel': activityLevel,
      });
      state = AiNutritionState(plan: res.data['data']['plan'] as String);
    } catch (e) {
      state = AiNutritionState(error: ApiClient.extractError(e));
    }
  }

  void reset() => state = const AiNutritionState();
}

final aiNutritionProvider =
    StateNotifierProvider<AiNutritionNotifier, AiNutritionState>(
  (_) => AiNutritionNotifier(),
);

// ══════════════════════════════════════════════════════════════════════════════
// PROGRESS ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════

class AiProgressState {
  final bool isLoading;
  final String? analysis;
  final List<String> suggestions;
  final String? error;

  const AiProgressState({
    this.isLoading = false,
    this.analysis,
    this.suggestions = const [],
    this.error,
  });
}

class AiProgressNotifier extends StateNotifier<AiProgressState> {
  AiProgressNotifier() : super(const AiProgressState());

  Future<void> analyze() async {
    state = const AiProgressState(isLoading: true);
    try {
      final res = await ApiClient().post(ApiConstants.aiAnalyzeProgress, data: {});
      final data = res.data['data'] as Map<String, dynamic>;
      state = AiProgressState(
        analysis: data['analysis'] as String,
        suggestions: (data['suggestions'] as List).cast<String>(),
      );
    } catch (e) {
      state = AiProgressState(error: ApiClient.extractError(e));
    }
  }
}

final aiProgressProvider =
    StateNotifierProvider<AiProgressNotifier, AiProgressState>(
  (_) => AiProgressNotifier(),
);

// ══════════════════════════════════════════════════════════════════════════════
// DAILY TIP  (cached per day on the server; we cache locally per session)
// ══════════════════════════════════════════════════════════════════════════════

class AiDailyTipState {
  final bool isLoading;
  final String? tip;
  final String? error;

  const AiDailyTipState({this.isLoading = false, this.tip, this.error});

  AiDailyTipState copyWith({bool? isLoading, String? tip, String? error}) =>
      AiDailyTipState(
        isLoading: isLoading ?? this.isLoading,
        tip: tip ?? this.tip,
        error: error,
      );
}

class AiDailyTipNotifier extends StateNotifier<AiDailyTipState> {
  AiDailyTipNotifier() : super(const AiDailyTipState());

  Future<void> loadTip() async {
    if (state.tip != null) return; // already loaded this session
    state = const AiDailyTipState(isLoading: true);
    try {
      final res = await ApiClient().get(ApiConstants.aiDailyTip);
      final tip = res.data['data']['tip'] as String;
      state = AiDailyTipState(tip: tip);
    } catch (_) {
      // Fallback — show static tip rather than an error card
      state = const AiDailyTipState(
        tip: 'Consistency beats perfection. Show up today, even for 20 minutes.',
      );
    }
  }

  void refresh() => state = const AiDailyTipState();
}

final aiDailyTipProvider =
    StateNotifierProvider<AiDailyTipNotifier, AiDailyTipState>(
  (_) => AiDailyTipNotifier(),
);

// ══════════════════════════════════════════════════════════════════════════════
// COACHING INSIGHTS  (motivation + action_plan + tips)
// ══════════════════════════════════════════════════════════════════════════════

class AiInsightsState {
  final bool isLoading;
  final String? motivation;
  final List<String> actionPlan;
  final List<String> tips;
  final String coachingLevel; // 'gentle' | 'moderate' | 'intense'
  final String? error;

  const AiInsightsState({
    this.isLoading = false,
    this.motivation,
    this.actionPlan = const [],
    this.tips = const [],
    this.coachingLevel = 'moderate',
    this.error,
  });

  AiInsightsState copyWith({
    bool? isLoading,
    String? motivation,
    List<String>? actionPlan,
    List<String>? tips,
    String? coachingLevel,
    String? error,
  }) =>
      AiInsightsState(
        isLoading: isLoading ?? this.isLoading,
        motivation: motivation ?? this.motivation,
        actionPlan: actionPlan ?? this.actionPlan,
        tips: tips ?? this.tips,
        coachingLevel: coachingLevel ?? this.coachingLevel,
        error: error,
      );
}

class AiInsightsNotifier extends StateNotifier<AiInsightsState> {
  AiInsightsNotifier() : super(const AiInsightsState());

  Future<void> loadInsights() async {
    if (state.motivation != null) return; // already loaded this session
    state = const AiInsightsState(isLoading: true);
    try {
      final res = await ApiClient().get(ApiConstants.aiInsights);
      final data = res.data['data'] as Map<String, dynamic>;
      state = AiInsightsState(
        motivation: data['motivation'] as String? ?? '',
        actionPlan: (data['action_plan'] as List? ?? []).cast<String>(),
        tips: (data['tips'] as List? ?? []).cast<String>(),
        coachingLevel: data['coachingLevel'] as String? ?? 'moderate',
      );
    } catch (e) {
      state = AiInsightsState(error: ApiClient.extractError(e));
    }
  }

  void refresh() => state = const AiInsightsState();
}

final aiInsightsProvider =
    StateNotifierProvider<AiInsightsNotifier, AiInsightsState>(
  (_) => AiInsightsNotifier(),
);

// ══════════════════════════════════════════════════════════════════════════════
// AI USER PROFILE  (behavior stats — streak, weeklyRate, coachingLevel)
// ══════════════════════════════════════════════════════════════════════════════

class AiProfileState {
  final bool isLoading;
  final int streak;
  final int weeklyRate;      // 0-100 %
  final int inactiveDays;
  final bool isInactive;
  final bool isConsistent;
  final bool readyForProgression;
  final String coachingLevel;
  final String? error;

  const AiProfileState({
    this.isLoading = false,
    this.streak = 0,
    this.weeklyRate = 0,
    this.inactiveDays = 0,
    this.isInactive = false,
    this.isConsistent = false,
    this.readyForProgression = false,
    this.coachingLevel = 'moderate',
    this.error,
  });

  AiProfileState copyWith({
    bool? isLoading,
    int? streak,
    int? weeklyRate,
    int? inactiveDays,
    bool? isInactive,
    bool? isConsistent,
    bool? readyForProgression,
    String? coachingLevel,
    String? error,
  }) =>
      AiProfileState(
        isLoading: isLoading ?? this.isLoading,
        streak: streak ?? this.streak,
        weeklyRate: weeklyRate ?? this.weeklyRate,
        inactiveDays: inactiveDays ?? this.inactiveDays,
        isInactive: isInactive ?? this.isInactive,
        isConsistent: isConsistent ?? this.isConsistent,
        readyForProgression: readyForProgression ?? this.readyForProgression,
        coachingLevel: coachingLevel ?? this.coachingLevel,
        error: error,
      );
}

class AiProfileNotifier extends StateNotifier<AiProfileState> {
  AiProfileNotifier() : super(const AiProfileState());

  Future<void> load() async {
    state = state.copyWith(isLoading: true);
    try {
      final res = await ApiClient().get(ApiConstants.aiProfile);
      final p = res.data['data']['profile'] as Map<String, dynamic>;
      final c = p['trainingConsistency'] as Map<String, dynamic>? ?? {};
      final b = p['behavior'] as Map<String, dynamic>? ?? {};
      state = AiProfileState(
        streak:              (c['currentStreak'] as num? ?? 0).toInt(),
        weeklyRate:          (c['weeklyRate']    as num? ?? 0).toInt(),
        inactiveDays:        (b['inactiveDays']  as num? ?? 0).toInt(),
        isInactive:          b['isInactive']          as bool? ?? false,
        isConsistent:        b['isConsistent']         as bool? ?? false,
        readyForProgression: b['readyForProgression']  as bool? ?? false,
        coachingLevel:       p['coachingLevel']  as String? ?? 'moderate',
      );
    } catch (e) {
      state = AiProfileState(error: ApiClient.extractError(e));
    }
  }

  Future<void> trackWorkout(String event) async {
    try {
      final res = await ApiClient().post(
        ApiConstants.aiTrackWorkout,
        data: {'event': event},
      );
      final d = res.data['data'] as Map<String, dynamic>;
      final b = d['behavior'] as Map<String, dynamic>? ?? {};
      state = state.copyWith(
        streak:              (d['streak']     as num? ?? 0).toInt(),
        weeklyRate:          (d['weeklyRate'] as num? ?? 0).toInt(),
        coachingLevel:       d['coachingLevel'] as String? ?? state.coachingLevel,
        isInactive:          b['isInactive']         as bool? ?? state.isInactive,
        isConsistent:        b['isConsistent']        as bool? ?? state.isConsistent,
        readyForProgression: b['readyForProgression'] as bool? ?? state.readyForProgression,
        inactiveDays:        (b['inactiveDays'] as num? ?? 0).toInt(),
      );
    } catch (_) {}
  }
}

final aiProfileProvider =
    StateNotifierProvider<AiProfileNotifier, AiProfileState>(
  (_) => AiProfileNotifier(),
);
