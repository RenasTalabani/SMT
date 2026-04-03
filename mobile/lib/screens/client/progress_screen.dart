import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../../widgets/auth_guard_modal.dart';
const _teal = Color(0xFF26BDB8);

// ── Providers ─────────────────────────────────────────────────────────────────

final _progressListProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final res = await ApiClient().get(ApiConstants.progress, params: {'limit': '50'});
  final list = res.data['data']['progress'] as List;
  return list.cast<Map<String, dynamic>>();
});

final _progressStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final res = await ApiClient().get(ApiConstants.progressStats, params: {'period': '30'});
  return Map<String, dynamic>.from(res.data['data']['stats'] as Map);
});

// ── Screen ────────────────────────────────────────────────────────────────────

class ProgressScreen extends ConsumerStatefulWidget {
  const ProgressScreen({super.key});

  @override
  ConsumerState<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends ConsumerState<ProgressScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  bool _logging = false;

  // Log workout form
  final _weightCtrl = TextEditingController();
  final _repsCtrl = TextEditingController();
  final _setsCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final allowed = await AuthGuard.check(context, ref, feature: 'progress');
      if (!allowed && mounted) context.go('/client');
    });
  }

  @override
  void dispose() {
    _tabs.dispose();
    _weightCtrl.dispose();
    _repsCtrl.dispose();
    _setsCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _logProgress() async {
    setState(() => _logging = true);
    try {
      await ApiClient().post(ApiConstants.progress, data: {
        'type': 'body_measurement',
        'date': DateTime.now().toIso8601String(),
        'measurements': {
          if (_weightCtrl.text.isNotEmpty) 'weight': double.tryParse(_weightCtrl.text),
        },
        if (_notesCtrl.text.isNotEmpty) 'notes': _notesCtrl.text.trim(),
      });
      if (!mounted) return;
      _weightCtrl.clear(); _repsCtrl.clear(); _setsCtrl.clear(); _notesCtrl.clear();
      ref.invalidate(_progressListProvider);
      ref.invalidate(_progressStatsProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Progress logged!'), backgroundColor: _teal),
      );
      _tabs.animateTo(0);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ApiClient.extractError(e)), backgroundColor: Colors.red),
      );
    } finally {
      setState(() => _logging = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('My Progress', style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        bottom: TabBar(
          controller: _tabs,
          labelColor: _teal,
          unselectedLabelColor: const Color(0xFF64748B),
          indicatorColor: _teal,
          tabs: const [
            Tab(text: 'History'),
            Tab(text: 'Log Progress'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _HistoryTab(),
          _LogTab(
            weightCtrl: _weightCtrl,
            repsCtrl: _repsCtrl,
            setsCtrl: _setsCtrl,
            notesCtrl: _notesCtrl,
            logging: _logging,
            onSubmit: _logProgress,
          ),
        ],
      ),
    );
  }
}

// ── History Tab ───────────────────────────────────────────────────────────────

class _HistoryTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(_progressStatsProvider);
    final listAsync = ref.watch(_progressListProvider);

    return RefreshIndicator(
      color: _teal,
      onRefresh: () async {
        ref.invalidate(_progressStatsProvider);
        ref.invalidate(_progressListProvider);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Stats cards
          statsAsync.when(
            data: (stats) => _StatsRow(stats: stats),
            loading: () => const SizedBox(height: 80,
                child: Center(child: CircularProgressIndicator(color: _teal))),
            error: (_, __) => const SizedBox.shrink(),
          ),
          const SizedBox(height: 16),

          // History list
          const Text('Recent Entries',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: Color(0xFF0F172A))),
          const SizedBox(height: 10),

          listAsync.when(
            data: (list) {
              if (list.isEmpty) {
                return _EmptyState();
              }
              return Column(
                children: list.map((p) => _ProgressCard(entry: p)).toList(),
              );
            },
            loading: () => const Center(
                child: Padding(padding: EdgeInsets.all(32),
                    child: CircularProgressIndicator(color: _teal))),
            error: (err, _) => _ErrorState(message: err.toString()),
          ),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _StatsRow({required this.stats});

  @override
  Widget build(BuildContext context) {
    final workouts = stats['totalWorkouts'] ?? 0;
    final streak = stats['workoutStreak'] ?? 0;
    final weightChange = (stats['weightChange'] ?? 0.0) as num;

    return Row(children: [
      Expanded(child: _StatCard(
        icon: Icons.fitness_center_rounded,
        label: 'Workouts',
        value: '$workouts',
        sub: 'last 30 days',
      )),
      const SizedBox(width: 10),
      Expanded(child: _StatCard(
        icon: Icons.local_fire_department_rounded,
        label: 'Streak',
        value: '$streak',
        sub: 'days',
        color: const Color(0xFFF59E0B),
      )),
      const SizedBox(width: 10),
      Expanded(child: _StatCard(
        icon: Icons.monitor_weight_outlined,
        label: 'Weight Δ',
        value: '${weightChange >= 0 ? '+' : ''}${weightChange.toStringAsFixed(1)}',
        sub: 'kg',
        color: weightChange < 0 ? const Color(0xFF10B981) : _teal,
      )),
    ]);
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final String sub;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.sub,
    this.color = _teal,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 6),
        Text(value, style: TextStyle(
            fontWeight: FontWeight.w800, fontSize: 20, color: color)),
        Text(sub, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(
            color: Color(0xFF475569), fontSize: 12, fontWeight: FontWeight.w500)),
      ]),
    );
  }
}

class _ProgressCard extends StatelessWidget {
  final Map<String, dynamic> entry;
  const _ProgressCard({required this.entry});

  @override
  Widget build(BuildContext context) {
    final type = entry['type'] as String? ?? '';
    final dateStr = entry['date'] as String? ?? entry['createdAt'] as String? ?? '';
    DateTime? date;
    try { date = DateTime.parse(dateStr).toLocal(); } catch (_) {}

    final measurements = entry['measurements'] as Map<String, dynamic>?;
    final notes = entry['notes'] as String?;

    IconData icon;
    Color iconColor;
    String title;

    switch (type) {
      case 'workout_completion':
        icon = Icons.fitness_center_rounded; iconColor = _teal; title = 'Workout Completed';
        break;
      case 'body_measurement':
        icon = Icons.monitor_weight_outlined; iconColor = const Color(0xFF8B5CF6); title = 'Body Measurement';
        break;
      case 'weight':
        icon = Icons.scale_outlined; iconColor = const Color(0xFF10B981); title = 'Weight Update';
        break;
      default:
        icon = Icons.timeline_rounded; iconColor = const Color(0xFF64748B); title = type.replaceAll('_', ' ');
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: iconColor, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Color(0xFF0F172A))),
          if (date != null) ...[
            const SizedBox(height: 2),
            Text(DateFormat('MMM d, yyyy • h:mm a').format(date),
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
          ],
          if (measurements != null && measurements['weight'] != null) ...[
            const SizedBox(height: 6),
            _pill('${measurements['weight']} kg', Icons.scale_outlined, const Color(0xFF8B5CF6)),
          ],
          if (notes != null && notes.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(notes, style: const TextStyle(color: Color(0xFF475569), fontSize: 13)),
          ],
        ])),
      ]),
    );
  }

  Widget _pill(String text, IconData icon, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(8),
    ),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, color: color, size: 13),
      const SizedBox(width: 4),
      Text(text, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    ]),
  );
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(children: [
        Icon(Icons.timeline_rounded, size: 56, color: Colors.grey.shade300),
        const SizedBox(height: 12),
        const Text('No progress yet', style: TextStyle(color: Color(0xFF64748B), fontSize: 16)),
        const SizedBox(height: 4),
        const Text('Use the "Log Progress" tab to start tracking',
            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
      ]),
    ),
  );
}

class _ErrorState extends StatelessWidget {
  final String message;
  const _ErrorState({required this.message});

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Text(message, style: const TextStyle(color: Color(0xFFEF4444))),
    ),
  );
}

// ── Log Tab ───────────────────────────────────────────────────────────────────

class _LogTab extends StatelessWidget {
  final TextEditingController weightCtrl;
  final TextEditingController repsCtrl;
  final TextEditingController setsCtrl;
  final TextEditingController notesCtrl;
  final bool logging;
  final VoidCallback onSubmit;

  const _LogTab({
    required this.weightCtrl,
    required this.repsCtrl,
    required this.setsCtrl,
    required this.notesCtrl,
    required this.logging,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _teal.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _teal.withValues(alpha: 0.2)),
          ),
          child: const Row(children: [
            Icon(Icons.info_outline_rounded, color: _teal, size: 18),
            SizedBox(width: 8),
            Expanded(child: Text(
              'Log your body weight, workout notes, and track your progress over time.',
              style: TextStyle(color: _teal, fontSize: 13),
            )),
          ]),
        ),
        const SizedBox(height: 20),

        const Text('Body Weight', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: Color(0xFF0F172A))),
        const SizedBox(height: 10),
        _inputField(weightCtrl, 'Weight (kg)', Icons.monitor_weight_outlined,
            keyboardType: const TextInputType.numberWithOptions(decimal: true)),

        const SizedBox(height: 20),
        const Text('Workout Summary', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: Color(0xFF0F172A))),
        const SizedBox(height: 10),
        Row(children: [
          Expanded(child: _inputField(setsCtrl, 'Sets', Icons.layers_rounded,
              keyboardType: TextInputType.number)),
          const SizedBox(width: 10),
          Expanded(child: _inputField(repsCtrl, 'Reps', Icons.repeat_rounded,
              keyboardType: TextInputType.number)),
        ]),

        const SizedBox(height: 20),
        const Text('Notes', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: Color(0xFF0F172A))),
        const SizedBox(height: 10),
        _inputField(notesCtrl, 'How did it feel? Any observations...', Icons.notes_rounded, maxLines: 4),

        const SizedBox(height: 28),
        ElevatedButton.icon(
          onPressed: logging ? null : onSubmit,
          icon: logging
              ? const SizedBox(width: 18, height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Icon(Icons.save_rounded, size: 20),
          label: Text(logging ? 'Saving...' : 'Save Progress',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          style: ElevatedButton.styleFrom(
            backgroundColor: _teal,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 52),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _inputField(
    TextEditingController ctrl,
    String hint,
    IconData icon, {
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) =>
      TextField(
        controller: ctrl,
        keyboardType: keyboardType,
        maxLines: maxLines,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
          prefixIcon: Icon(icon, size: 20, color: const Color(0xFF64748B)),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: _teal, width: 1.5),
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      );
}
