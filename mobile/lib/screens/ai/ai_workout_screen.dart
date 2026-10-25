import '../../core/i18n/trv.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/ai_provider.dart';

const _teal = Color(0xFF26BDB8);

class AiWorkoutScreen extends ConsumerStatefulWidget {
  const AiWorkoutScreen({super.key});

  @override
  ConsumerState<AiWorkoutScreen> createState() => _AiWorkoutScreenState();
}

class _AiWorkoutScreenState extends ConsumerState<AiWorkoutScreen> {
  String _goal = 'muscle gain';
  String _level = 'beginner';
  int _days = 3;

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(aiWorkoutProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('ai_workout_generator'.tr(), style: const TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        actions: [
          if (state.generatedPlan != null)
            TextButton.icon(
              onPressed: () => ref.read(aiWorkoutProvider.notifier).reset(),
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: Text('reset'.tr()),
              style: TextButton.styleFrom(foregroundColor: _teal),
            ),
        ],
      ),
      body: state.generatedPlan != null
          ? _PlanResult(plan: state.generatedPlan!)
          : _GeneratorForm(
              goal: _goal,
              level: _level,
              days: _days,
              isLoading: state.isLoading,
              error: state.error,
              onGoalChanged: (v) => setState(() => _goal = v),
              onLevelChanged: (v) => setState(() => _level = v),
              onDaysChanged: (v) => setState(() => _days = v),
              onGenerate: () => ref.read(aiWorkoutProvider.notifier).generate(
                    goal: _goal,
                    level: _level,
                    daysPerWeek: _days,
                  ),
            ),
    );
  }
}

// ── Generator form ─────────────────────────────────────────────────────────────

class _GeneratorForm extends StatelessWidget {
  final String goal;
  final String level;
  final int days;
  final bool isLoading;
  final String? error;
  final ValueChanged<String> onGoalChanged;
  final ValueChanged<String> onLevelChanged;
  final ValueChanged<int> onDaysChanged;
  final VoidCallback onGenerate;

  const _GeneratorForm({
    required this.goal,
    required this.level,
    required this.days,
    required this.isLoading,
    required this.error,
    required this.onGoalChanged,
    required this.onLevelChanged,
    required this.onDaysChanged,
    required this.onGenerate,
  });

  static const _goals = ['muscle gain', 'fat loss', 'strength', 'endurance', 'general fitness'];
  static const _levels = ['beginner', 'intermediate', 'advanced'];

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Header
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [_teal, Color(0xFF1A9E99)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(children: [
            const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 28),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('ai_workout_generator'.tr(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 17)),
              const SizedBox(height: 4),
              Text('tell_me_your_goal_and_i'.tr(), style: const TextStyle(color: Colors.white70, fontSize: 13)),
            ])),
          ]),
        ),
        const SizedBox(height: 24),

        // Goal
        _label('your_goal'.tr()),
        const SizedBox(height: 10),
        Wrap(spacing: 8, runSpacing: 8, children: _goals.map((g) {
          final selected = g == goal;
          return GestureDetector(
            onTap: () => onGoalChanged(g),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: selected ? _teal : Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: selected ? _teal : const Color(0xFFE2E8F0)),
              ),
              child: Text(
                trv(g),
                style: TextStyle(
                  color: selected ? Colors.white : const Color(0xFF475569),
                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                  fontSize: 13,
                ),
              ),
            ),
          );
        }).toList()),
        const SizedBox(height: 20),

        // Level
        _label('experience_level'.tr()),
        const SizedBox(height: 10),
        Row(children: _levels.map((l) {
          final selected = l == level;
          return Expanded(
            child: GestureDetector(
              onTap: () => onLevelChanged(l),
              child: Container(
                margin: EdgeInsetsDirectional.only(end: l == _levels.last ? 0 : 8),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: selected ? _teal : Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: selected ? _teal : const Color(0xFFE2E8F0)),
                ),
                child: Column(children: [
                  Icon(
                    l == 'beginner' ? Icons.emoji_emotions_outlined
                        : l == 'intermediate' ? Icons.bolt_outlined
                        : Icons.local_fire_department_outlined,
                    color: selected ? Colors.white : const Color(0xFF64748B),
                    size: 20,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    trv(l),
                    style: TextStyle(
                      color: selected ? Colors.white : const Color(0xFF475569),
                      fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                      fontSize: 12,
                    ),
                  ),
                ]),
              ),
            ),
          );
        }).toList()),
        const SizedBox(height: 20),

        // Days per week
        _label('days_per_week'.tr()),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(children: [
            const Icon(Icons.calendar_today_outlined, color: _teal, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text('x_days_week'.tr(namedArgs: {'days': '$days'}), overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: Color(0xFF0F172A)))),
            Row(children: [
              _circleBtn(Icons.remove_rounded, days <= 1 ? null : () => onDaysChanged(days - 1)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text('$days', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: _teal)),
              ),
              _circleBtn(Icons.add_rounded, days >= 7 ? null : () => onDaysChanged(days + 1)),
            ]),
          ]),
        ),
        const SizedBox(height: 28),

        // Error
        if (error != null)
          Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFFCA5A5)),
            ),
            child: Row(children: [
              const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(error!, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13))),
            ]),
          ),

        // Generate button
        ElevatedButton.icon(
          onPressed: isLoading ? null : onGenerate,
          icon: isLoading
              ? const SizedBox(width: 18, height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
              : const Icon(Icons.auto_awesome_rounded, size: 20),
          label: Text(isLoading ? 'generating_your_plan'.tr() : 'generate_my_workout_plan'.tr(),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          style: ElevatedButton.styleFrom(
            backgroundColor: _teal, foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 54),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 12),
        Text('ai_generates_a_personalized_plan_in'.tr(),
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _label(String text) => Text(text,
      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: Color(0xFF0F172A)));

  Widget _circleBtn(IconData icon, VoidCallback? onTap) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 32, height: 32,
      decoration: BoxDecoration(
        color: onTap == null ? const Color(0xFFF1F5F9) : _teal.withValues(alpha: 0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, size: 16,
          color: onTap == null ? const Color(0xFFCBD5E1) : _teal),
    ),
  );
}

// ── Plan result ────────────────────────────────────────────────────────────────

class _PlanResult extends ConsumerWidget {
  final Map<String, dynamic> plan;
  const _PlanResult({required this.plan});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workouts = (plan['workouts'] as List?) ?? [];
    final savedPlanId = ref.watch(aiWorkoutProvider).savedPlanId;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Plan header
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_teal, Color(0xFF1A9E99)]),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white, size: 22),
              const SizedBox(width: 8),
              Text('plan_generated'.tr(), style: const TextStyle(color: Colors.white70, fontSize: 13)),
            ]),
            const SizedBox(height: 6),
            Text(plan['title'] ?? 'ai_workout_plan'.tr(),
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 20)),
            const SizedBox(height: 6),
            Text(plan['description'] ?? '',
                style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4)),
            const SizedBox(height: 12),
            Row(children: [
              _badge('${plan['durationWeeks'] ?? '?'} weeks'),
              const SizedBox(width: 8),
              _badge('${plan['frequency'] ?? '?'}x/week'),
              const SizedBox(width: 8),
              _badge(plan['difficulty'] ?? ''),
            ]),
          ]),
        ),
        const SizedBox(height: 12),

        // View saved plan button
        if (savedPlanId != null)
          ElevatedButton.icon(
            onPressed: () => context.push('/client/plan/$savedPlanId'),
            icon: const Icon(Icons.fitness_center_rounded, size: 18),
            label: Text('view_saved_plan'.tr(), style: const TextStyle(fontWeight: FontWeight.w600)),
            style: ElevatedButton.styleFrom(
              backgroundColor: _teal,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        if (savedPlanId != null) const SizedBox(height: 12),

        // Days
        ...workouts.asMap().entries.map((entry) {
          final day = entry.value as Map<String, dynamic>;
          final exercises = (day['exercises'] as List?) ?? [];
          return _DayCard(day: day, exercises: exercises);
        }),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _badge(String text) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: Colors.white.withValues(alpha: 0.2),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
  );
}

class _DayCard extends StatefulWidget {
  final Map<String, dynamic> day;
  final List exercises;
  const _DayCard({required this.day, required this.exercises});

  @override
  State<_DayCard> createState() => _DayCardState();
}

class _DayCardState extends State<_DayCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(children: [
        GestureDetector(
          onTap: () => setState(() => _expanded = !_expanded),
          child: Container(
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: _teal.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(child: Text(
                  'D${widget.day['day'] ?? '?'}',
                  style: const TextStyle(color: _teal, fontWeight: FontWeight.w800, fontSize: 13),
                )),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(widget.day['name'] ?? 'day'.tr(),
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: Color(0xFF0F172A))),
                Text('x_exercises_x_min'.tr(namedArgs: {'n0': '${widget.exercises.length}', 'n1': '${widget.day['estimatedDuration'] ?? '?'}'}),
                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
              ])),
              Icon(
                _expanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                color: const Color(0xFF94A3B8),
              ),
            ]),
          ),
        ),
        if (_expanded) ...[
          const Divider(height: 1),
          ...widget.exercises.map((ex) {
            final e = ex as Map<String, dynamic>;
            return Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Icon(Icons.fitness_center_rounded, color: _teal, size: 16),
                const SizedBox(width: 8),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(e['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF0F172A))),
                  const SizedBox(height: 2),
                  Row(children: [
                    _pill('${e['sets']}×${e['reps']}'),
                    const SizedBox(width: 6),
                    if ((e['weight'] ?? 0) > 0) _pill('${e['weight']}kg'),
                    const SizedBox(width: 6),
                    _pill('${e['restTime']}s rest'),
                  ]),
                  if (e['notes'] != null && (e['notes'] as String).isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(e['notes'] as String,
                          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontStyle: FontStyle.italic)),
                    ),
                  const SizedBox(height: 8),
                ])),
              ]),
            );
          }),
          if (widget.day['warmUp'] != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('🔥 ', style: TextStyle(fontSize: 14)),
                  Expanded(child: Text('warm_up_x'.tr(namedArgs: {'n0': '${widget.day['warmUp']}'}),
                      style: const TextStyle(color: Color(0xFF92400E), fontSize: 12))),
                ]),
              ),
            ),
          const SizedBox(height: 4),
        ],
      ]),
    );
  }

  Widget _pill(String t) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: _teal.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(6),
    ),
    child: Text(t, style: const TextStyle(color: _teal, fontSize: 11, fontWeight: FontWeight.w600)),
  );
}
