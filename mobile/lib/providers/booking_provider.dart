import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../models/booking_model.dart';

// ── Available slots ───────────────────────────────────────────────────────────

class SlotsState {
  final List<AvailableDay> days;
  final bool isLoading;
  final String? error;

  const SlotsState({this.days = const [], this.isLoading = false, this.error});

  SlotsState copyWith({List<AvailableDay>? days, bool? isLoading, String? error, bool clearError = false}) =>
      SlotsState(
        days:      days      ?? this.days,
        isLoading: isLoading ?? this.isLoading,
        error:     clearError ? null : (error ?? this.error),
      );
}

class SlotsNotifier extends StateNotifier<SlotsState> {
  final ApiClient _api;
  SlotsNotifier(this._api) : super(const SlotsState());

  Future<void> fetch(String coachId, {int lookaheadDays = 14}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final from = DateTime.now();
      final to   = from.add(Duration(days: lookaheadDays));
      final res  = await _api.get('/bookings/slots', params: {
        'coachId': coachId,
        'from':    from.toIso8601String(),
        'to':      to.toIso8601String(),
      });
      final raw = (res.data['data']['slots'] as List<dynamic>? ?? []);
      final days = raw
          .map((d) => AvailableDay.fromJson(d as Map<String, dynamic>))
          .where((d) => d.slots.isNotEmpty)
          .toList();
      state = state.copyWith(isLoading: false, days: days);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: ApiClient.extractError(e));
    }
  }

  void reset() => state = const SlotsState();
}

final slotsProvider = StateNotifierProvider.autoDispose
    .family<SlotsNotifier, SlotsState, String>(
  (ref, coachId) {
    final n = SlotsNotifier(ApiClient());
    n.fetch(coachId);
    return n;
  },
);

// ── Client bookings ───────────────────────────────────────────────────────────

class BookingsState {
  final List<BookingModel> items;
  final bool isLoading;
  final bool isCreating;
  final String? error;
  final String? successMessage;

  const BookingsState({
    this.items = const [],
    this.isLoading = false,
    this.isCreating = false,
    this.error,
    this.successMessage,
  });

  BookingsState copyWith({
    List<BookingModel>? items,
    bool? isLoading,
    bool? isCreating,
    String? error,
    String? successMessage,
    bool clearMessages = false,
  }) => BookingsState(
        items:          items          ?? this.items,
        isLoading:      isLoading      ?? this.isLoading,
        isCreating:     isCreating     ?? this.isCreating,
        error:          clearMessages ? null : (error ?? this.error),
        successMessage: clearMessages ? null : (successMessage ?? this.successMessage),
      );
}

class BookingsNotifier extends StateNotifier<BookingsState> {
  final ApiClient _api;
  BookingsNotifier(this._api) : super(const BookingsState());

  Future<void> fetchMine({String? status}) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final res = await _api.get('/bookings/my',
          params: status != null ? {'status': status} : null);
      final raw = (res.data['data']['items'] as List<dynamic>? ?? []);
      state = state.copyWith(
        isLoading: false,
        items: raw.map((e) => BookingModel.fromJson(e as Map<String, dynamic>)).toList(),
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: ApiClient.extractError(e));
    }
  }

  Future<bool> create({
    required String coachId,
    required DateTime date,
    required String startTime,
    required String endTime,
    String type = 'personal_training',
    String? notes,
  }) async {
    state = state.copyWith(isCreating: true, clearMessages: true);
    try {
      await _api.post('/bookings', data: {
        'coachId':   coachId,
        'date':      date.toIso8601String(),
        'startTime': startTime,
        'endTime':   endTime,
        'type':      type,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      });
      state = state.copyWith(
        isCreating: false,
        successMessage: 'Booking request sent! Awaiting coach confirmation.',
      );
      await fetchMine();
      return true;
    } catch (e) {
      state = state.copyWith(
        isCreating: false,
        error: ApiClient.extractError(e),
      );
      return false;
    }
  }

  Future<void> cancel(String bookingId, String reason) async {
    try {
      await _api.put('/bookings/$bookingId/status', data: {
        'status':       'cancelled',
        'cancelReason': reason,
      });
      state = state.copyWith(
        items: state.items.map((b) {
          if (b.id == bookingId) {
            return BookingModel.fromJson({
              '_id': b.id, 'client': b.clientId, 'coach': b.coachId,
              'slot': {'date': b.slot.date.toIso8601String(), 'startTime': b.slot.startTime, 'endTime': b.slot.endTime},
              'type': b.type, 'status': 'cancelled', 'price': b.price,
              'currency': b.currency, 'paymentStatus': b.paymentStatus,
              'createdAt': b.createdAt.toIso8601String(),
            });
          }
          return b;
        }).toList(),
      );
    } catch (e) {
      state = state.copyWith(error: ApiClient.extractError(e));
    }
  }

  Future<void> rate(String bookingId, int score, String? review) async {
    try {
      await _api.post('/bookings/$bookingId/rate', data: {
        'score':  score,
        if (review != null && review.isNotEmpty) 'review': review,
      });
      await fetchMine();
    } catch (e) {
      state = state.copyWith(error: ApiClient.extractError(e));
    }
  }

  void clearMessages() => state = state.copyWith(clearMessages: true);
}

final bookingProvider =
    StateNotifierProvider<BookingsNotifier, BookingsState>(
  (_) => BookingsNotifier(ApiClient()),
);
