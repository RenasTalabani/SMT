import 'package:easy_localization/easy_localization.dart';
import '../../core/i18n/dates.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/booking_provider.dart';
import '../../models/booking_model.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';

// ── Entry point: pick a coach slot and book ───────────────────────────────────

class BookingScreen extends ConsumerStatefulWidget {
  const BookingScreen({
    super.key,
    required this.coachId,
    required this.coachName,
    this.coachAvatar,
    this.sessionPrice = 0,
  });

  final String coachId;
  final String coachName;
  final String? coachAvatar;
  final double sessionPrice;

  @override
  ConsumerState<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends ConsumerState<BookingScreen> {
  AvailableDay? _selectedDay;
  BookingSlot?  _selectedSlot;
  String _type  = 'personal_training';
  final _notesCtrl = TextEditingController();
  bool _submitting = false;

  static List<(String, String)> get _types => [
    ('personal_training', 'personal_training'.tr()),
    ('nutrition_consult', 'nutrition_consult'.tr()),
    ('assessment',        'assessment'.tr()),
    ('online',            'online_session'.tr()),
  ];

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _book() async {
    if (_selectedSlot == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('please_select_a_time_slot'.tr())),
      );
      return;
    }
    setState(() => _submitting = true);
    final ok = await ref.read(bookingProvider.notifier).create(
      coachId:   widget.coachId,
      date:      _selectedSlot!.date,
      startTime: _selectedSlot!.startTime,
      endTime:   _selectedSlot!.endTime,
      type:      _type,
      notes:     _notesCtrl.text.trim(),
    );
    if (!mounted) return;
    setState(() => _submitting = false);
    if (ok) {
      Navigator.of(context).pop(true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('booking_request_sent'.tr()),
          backgroundColor: AppColors.success,
        ),
      );
    } else {
      final err = ref.read(bookingProvider).error ?? 'booking_failed'.tr();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(err), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final slotsState = ref.watch(slotsProvider(widget.coachId));
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text('book_with_x'.tr(namedArgs: {'n0': widget.coachName})),
      ),
      body: slotsState.isLoading
          ? const Padding(
              padding: EdgeInsets.all(16),
              child: LoadingShimmer(count: 4, height: 80),
            )
          : slotsState.error != null
              ? _ErrorView(
                  message: slotsState.error!,
                  onRetry: () =>
                      ref.read(slotsProvider(widget.coachId).notifier).fetch(widget.coachId),
                )
              : slotsState.days.isEmpty
                  ? const _NoSlots()
                  : Column(
                      children: [
                        Expanded(
                          child: ListView(
                            padding: const EdgeInsets.all(16),
                            children: [
                              // Session type picker
                              _SectionHeader('session_type'.tr()),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: _types.map((t) {
                                  final selected = t.$1 == _type;
                                  return ChoiceChip(
                                    label: Text(t.$2),
                                    selected: selected,
                                    onSelected: (_) => setState(() => _type = t.$1),
                                    selectedColor: AppColors.primary.withValues(alpha: 0.15),
                                    labelStyle: TextStyle(
                                      color: selected ? AppColors.primary : null,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  );
                                }).toList(),
                              ),
                              const SizedBox(height: 24),

                              // Day selector
                              _SectionHeader('select_a_date'.tr()),
                              const SizedBox(height: 8),
                              SizedBox(
                                height: 80,
                                child: ListView.separated(
                                  scrollDirection: Axis.horizontal,
                                  itemCount: slotsState.days.length,
                                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                                  itemBuilder: (_, i) {
                                    final day = slotsState.days[i];
                                    final isSelected = _selectedDay?.date.day == day.date.day;
                                    return GestureDetector(
                                      onTap: () => setState(() {
                                        _selectedDay  = day;
                                        _selectedSlot = null;
                                      }),
                                      child: AnimatedContainer(
                                        duration: const Duration(milliseconds: 180),
                                        width: 62,
                                        decoration: BoxDecoration(
                                          color: isSelected
                                              ? AppColors.primary
                                              : (isDark ? AppColors.surfaceDark : Colors.white),
                                          borderRadius: BorderRadius.circular(14),
                                          border: Border.all(
                                            color: isSelected
                                                ? AppColors.primary
                                                : (isDark ? AppColors.borderDark : AppColors.borderLight),
                                          ),
                                        ),
                                        child: Column(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              fmtDate(context, day.date, 'EEE'),
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                                color: isSelected ? Colors.white : AppColors.textHint,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              fmtDate(context, day.date, 'd'),
                                              style: TextStyle(
                                                fontSize: 20,
                                                fontWeight: FontWeight.w800,
                                                color: isSelected ? Colors.white : null,
                                              ),
                                            ),
                                            Text(
                                              'x_slots'.tr(namedArgs: {'n0': '${day.slots.length}'}),
                                              style: TextStyle(
                                                fontSize: 9,
                                                color: isSelected
                                                    ? Colors.white70
                                                    : AppColors.textHint,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                              const SizedBox(height: 24),

                              // Time slots
                              if (_selectedDay != null) ...[
                                _SectionHeader(
                                  'available_times_x'.tr(namedArgs: {'n0': fmtDate(context, _selectedDay!.date, 'EEEE, MMM d')}),
                                ),
                                const SizedBox(height: 8),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: _selectedDay!.slots.map((slot) {
                                    final isSelected = _selectedSlot?.startTime == slot.startTime;
                                    return GestureDetector(
                                      onTap: () => setState(() => _selectedSlot = slot),
                                      child: AnimatedContainer(
                                        duration: const Duration(milliseconds: 180),
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 14, vertical: 10),
                                        decoration: BoxDecoration(
                                          color: isSelected
                                              ? AppColors.primary
                                              : (isDark ? AppColors.surfaceDark : Colors.white),
                                          borderRadius: BorderRadius.circular(10),
                                          border: Border.all(
                                            color: isSelected
                                                ? AppColors.primary
                                                : (isDark ? AppColors.borderDark : AppColors.borderLight),
                                            width: isSelected ? 1.5 : 1,
                                          ),
                                        ),
                                        child: Text(
                                          slot.label,
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: isSelected ? Colors.white : null,
                                          ),
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                ),
                                const SizedBox(height: 24),
                              ],

                              // Notes
                              _SectionHeader('notes_optional'.tr()),
                              const SizedBox(height: 8),
                              TextField(
                                controller: _notesCtrl,
                                maxLines: 3,
                                maxLength: 300,
                                decoration: InputDecoration(
                                  hintText: 'any_specific_goals_or_requests_for'.tr(),
                                ),
                              ),
                              const SizedBox(height: 100),
                            ],
                          ),
                        ),

                        // Bottom CTA
                        _BookingBar(
                          slot:        _selectedSlot,
                          price:       widget.sessionPrice,
                          submitting:  _submitting,
                          onBook:      _book,
                        ),
                      ],
                    ),
    );
  }
}

// ── My Bookings screen ────────────────────────────────────────────────────────

class MyBookingsScreen extends ConsumerStatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  ConsumerState<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends ConsumerState<MyBookingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  static const _statuses = ['', 'pending', 'confirmed', 'completed', 'cancelled'];
  static List<String> get _labels => ['all'.tr(), 'pending'.tr(), 'confirmed'.tr(), 'completed'.tr(), 'cancelled'.tr()];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: _labels.length, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(bookingProvider.notifier).fetchMine();
    });
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(bookingProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('my_bookings'.tr()),
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textHint,
          indicatorColor: AppColors.primary,
          tabs: _labels.map((l) => Tab(text: l)).toList(),
          onTap: (i) {
            ref.read(bookingProvider.notifier).fetchMine(
              status: _statuses[i].isEmpty ? null : _statuses[i],
            );
          },
        ),
      ),
      body: state.isLoading
          ? const Padding(
              padding: EdgeInsets.all(16),
              child: LoadingShimmer(count: 5, height: 90),
            )
          : state.items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.calendar_today_rounded,
                          size: 56, color: AppColors.textHint),
                      const SizedBox(height: 12),
                      Text('no_bookings_yet'.tr(),
                          style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textHint)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: () =>
                      ref.read(bookingProvider.notifier).fetchMine(),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: state.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _BookingCard(
                      booking: state.items[i],
                      onCancel: (reason) =>
                          ref.read(bookingProvider.notifier)
                              .cancel(state.items[i].id, reason),
                      onRate: (score, review) =>
                          ref.read(bookingProvider.notifier)
                              .rate(state.items[i].id, score, review),
                    ),
                  ),
                ),
    );
  }
}

// ── Widgets ───────────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
        ),
      );
}

class _BookingBar extends StatelessWidget {
  const _BookingBar({
    required this.slot,
    required this.price,
    required this.submitting,
    required this.onBook,
  });

  final BookingSlot? slot;
  final double price;
  final bool submitting;
  final VoidCallback onBook;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: EdgeInsets.fromLTRB(
          16, 12, 16, 12 + MediaQuery.of(context).padding.bottom),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        border: Border(
            top: BorderSide(
                color: isDark ? AppColors.borderDark : AppColors.borderLight)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (slot != null) ...[
                  Text(
                    fmtDate(context, slot!.date, 'EEE, MMM d'),
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  Text(
                    slot!.label,
                    style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 15),
                  ),
                ] else
                  Text('no_slot_selected'.tr(),
                      style: const TextStyle(color: AppColors.textHint, fontSize: 13)),
                if (price > 0)
                  Text('\$${price.toStringAsFixed(0)}',
                      style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                          color: AppColors.primary)),
              ],
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 140,
            child: ElevatedButton(
              onPressed: submitting ? null : onBook,
              child: submitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : Text('book_now'.tr()),
            ),
          ),
        ],
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  const _BookingCard({
    required this.booking,
    required this.onCancel,
    required this.onRate,
  });

  final BookingModel booking;
  final void Function(String reason) onCancel;
  final void Function(int score, String? review) onRate;

  Color _statusColor() {
    switch (booking.status) {
      case 'confirmed': return AppColors.success;
      case 'cancelled': return AppColors.error;
      case 'completed': return AppColors.primary;
      case 'no_show':   return AppColors.warning;
      default:          return AppColors.accent;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: isDark ? AppColors.borderDark : AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  booking.coachName ?? 'coach'.tr(),
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 15),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor().withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  booking.statusLabel,
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: _statusColor()),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.calendar_today_rounded,
                  size: 13, color: AppColors.textHint),
              const SizedBox(width: 5),
              Text(
                fmtDate(context, booking.slot.date, 'EEE, MMM d'),
                style: const TextStyle(
                    fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(width: 14),
              const Icon(Icons.access_time_rounded,
                  size: 13, color: AppColors.textHint),
              const SizedBox(width: 5),
              Text(
                booking.slot.label,
                style: const TextStyle(
                    fontSize: 13, color: AppColors.textSecondary),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.fitness_center_rounded,
                  size: 13, color: AppColors.textHint),
              const SizedBox(width: 5),
              Text(booking.typeLabel,
                  style: const TextStyle(
                      fontSize: 13, color: AppColors.textSecondary)),
              if (booking.price > 0) ...[
                const Spacer(),
                Text(
                  '\$${booking.price.toStringAsFixed(0)}',
                  style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: AppColors.primary),
                ),
              ],
            ],
          ),
          if (booking.isPending || booking.isConfirmed) ...[
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => _showCancelDialog(context),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 40),
                side: const BorderSide(color: AppColors.error),
                foregroundColor: AppColors.error,
              ),
              child: Text('cancel_booking'.tr()),
            ),
          ],
          if (booking.canRate) ...[
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () => _showRatingDialog(context),
              icon: const Icon(Icons.star_rounded, size: 16),
              label: Text('rate_session'.tr()),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 40),
                backgroundColor: AppColors.accent,
              ),
            ),
          ],
          if (booking.rating != null) ...[
            const SizedBox(height: 8),
            Row(
              children: List.generate(
                5,
                (i) => Icon(
                  i < booking.rating!.score
                      ? Icons.star_rounded
                      : Icons.star_outline_rounded,
                  size: 16,
                  color: AppColors.accent,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showCancelDialog(BuildContext context) {
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('cancel_booking'.tr()),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('please_provide_a_reason_for_cancellation'.tr()),
            const SizedBox(height: 12),
            TextField(
              controller: ctrl,
              maxLines: 2,
              decoration:
                  InputDecoration(hintText: 'reason'.tr()),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('back'.tr())),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error),
            onPressed: () {
              Navigator.pop(context);
              if (ctrl.text.trim().isNotEmpty) {
                onCancel(ctrl.text.trim());
              }
            },
            child: Text('confirm_cancel'.tr()),
          ),
        ],
      ),
    );
  }

  void _showRatingDialog(BuildContext context) {
    int score = 5;
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: Text('rate_your_session'.tr()),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  5,
                  (i) => GestureDetector(
                    onTap: () => setState(() => score = i + 1),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Icon(
                        i < score
                            ? Icons.star_rounded
                            : Icons.star_outline_rounded,
                        size: 32,
                        color: AppColors.accent,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: ctrl,
                maxLines: 2,
                decoration: InputDecoration(
                    hintText: 'write_a_review_optional'.tr()),
              ),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text('skip'.tr())),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                onRate(score, ctrl.text.trim().isEmpty ? null : ctrl.text.trim());
              },
              child: Text('submit'.tr()),
            ),
          ],
        ),
      ),
    );
  }
}

class _NoSlots extends StatelessWidget {
  const _NoSlots();

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.event_busy_rounded,
                  size: 56, color: AppColors.textHint),
              const SizedBox(height: 12),
              Text(
                'no_available_slots'.tr(),
                style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecondary),
              ),
              const SizedBox(height: 6),
              Text(
                'this_coach_has_no_open_slots'.tr(),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: AppColors.textHint),
              ),
            ],
          ),
        ),
      );
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.wifi_off_rounded,
                  size: 48, color: AppColors.textHint),
              const SizedBox(height: 12),
              Text(message,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: onRetry, child: Text('retry'.tr())),
            ],
          ),
        ),
      );
}
