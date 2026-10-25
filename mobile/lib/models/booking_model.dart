import '../core/i18n/trv.dart';
class BookingSlot {
  final DateTime date;
  final String startTime;
  final String endTime;
  final int durationMin;

  const BookingSlot({
    required this.date,
    required this.startTime,
    required this.endTime,
    this.durationMin = 60,
  });

  factory BookingSlot.fromJson(Map<String, dynamic> j) => BookingSlot(
        date:        DateTime.parse(j['date'] as String),
        startTime:   j['startTime'] as String,
        endTime:     j['endTime'] as String,
        durationMin: (j['durationMin'] as num?)?.toInt() ?? 60,
      );

  String get label => '$startTime – $endTime';
}

class AvailableDay {
  final DateTime date;
  final List<BookingSlot> slots;
  const AvailableDay({required this.date, required this.slots});

  factory AvailableDay.fromJson(Map<String, dynamic> j) {
    final rawSlots = (j['slots'] as List<dynamic>? ?? []);
    final date = DateTime.parse(j['date'] as String);
    return AvailableDay(
      date: date,
      slots: rawSlots.map((s) {
        final m = s as Map<String, dynamic>;
        return BookingSlot(
          date:      date,
          startTime: m['startTime'] as String,
          endTime:   m['endTime'] as String,
        );
      }).toList(),
    );
  }
}

class BookingRating {
  final int score;
  final String? review;
  const BookingRating({required this.score, this.review});

  factory BookingRating.fromJson(Map<String, dynamic> j) => BookingRating(
        score:  (j['score'] as num).toInt(),
        review: j['review'] as String?,
      );
}

class BookingModel {
  final String id;
  final String clientId;
  final String coachId;
  final String? coachName;
  final String? coachAvatar;
  final String? clientName;
  final String? clientAvatar;
  final BookingSlot slot;
  final String type;
  final String status;
  final double price;
  final String currency;
  final String paymentStatus;
  final String? notes;
  final String? coachNotes;
  final String? cancelReason;
  final BookingRating? rating;
  final DateTime createdAt;

  const BookingModel({
    required this.id,
    required this.clientId,
    required this.coachId,
    this.coachName,
    this.coachAvatar,
    this.clientName,
    this.clientAvatar,
    required this.slot,
    required this.type,
    required this.status,
    required this.price,
    required this.currency,
    required this.paymentStatus,
    this.notes,
    this.coachNotes,
    this.cancelReason,
    this.rating,
    required this.createdAt,
  });

  factory BookingModel.fromJson(Map<String, dynamic> j) {
    final coach  = j['coach']  is Map ? j['coach']  as Map<String, dynamic> : null;
    final client = j['client'] is Map ? j['client'] as Map<String, dynamic> : null;
    return BookingModel(
      id:            j['_id'] as String,
      clientId:      client?['_id'] as String? ?? j['client'] as String? ?? '',
      coachId:       coach?['_id']  as String? ?? j['coach']  as String? ?? '',
      coachName:     coach?['name']   as String?,
      coachAvatar:   coach?['avatar'] as String?,
      clientName:    client?['name']   as String?,
      clientAvatar:  client?['avatar'] as String?,
      slot:          BookingSlot.fromJson(j['slot'] as Map<String, dynamic>),
      type:          j['type']          as String? ?? 'personal_training',
      status:        j['status']        as String? ?? 'pending',
      price:         (j['price']  as num?)?.toDouble() ?? 0,
      currency:      j['currency']      as String? ?? 'usd',
      paymentStatus: j['paymentStatus'] as String? ?? 'unpaid',
      notes:         j['notes']       as String?,
      coachNotes:    j['coachNotes']  as String?,
      cancelReason:  j['cancelReason'] as String?,
      rating: j['rating'] != null && (j['rating'] as Map).isNotEmpty
          ? BookingRating.fromJson(j['rating'] as Map<String, dynamic>)
          : null,
      createdAt: j['createdAt'] != null
          ? DateTime.parse(j['createdAt'] as String)
          : DateTime.now(),
    );
  }

  bool get isPending   => status == 'pending';
  bool get isConfirmed => status == 'confirmed';
  bool get isCancelled => status == 'cancelled';
  bool get isCompleted => status == 'completed';
  bool get canRate     => isCompleted && rating == null;

  String get statusLabel {
    switch (status) {
      case 'pending':   return trv('Pending');
      case 'confirmed': return trv('Confirmed');
      case 'cancelled': return trv('Cancelled');
      case 'completed': return trv('Completed');
      case 'no_show':   return trv('No Show');
      default:          return status;
    }
  }

  String get typeLabel {
    switch (type) {
      case 'personal_training':  return trv('Personal Training');
      case 'nutrition_consult':  return trv('Nutrition Consult');
      case 'assessment':         return trv('Assessment');
      case 'group_class':        return trv('Group Class');
      case 'online':             return trv('Online Session');
      default:                   return type;
    }
  }
}
