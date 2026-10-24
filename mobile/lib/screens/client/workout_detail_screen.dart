import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import '../../models/workout_model.dart';
import '../../models/exercise_model.dart';
import '../../core/network/api_client.dart';
import '../../widgets/loading_shimmer.dart';

// ---------------------------------------------------------------------------
// Provider: fetch a single plan by ID with exercises populated
// ---------------------------------------------------------------------------

final _planDetailProvider = FutureProvider.family<WorkoutPlanModel, String>((ref, id) async {
  final response = await ApiClient().get('/workouts/$id');
  final data = response.data['data'];
  final raw = data['workoutPlan'] ?? data;
  return WorkoutPlanModel.fromJson(raw as Map<String, dynamic>);
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

class WorkoutDetailScreen extends ConsumerWidget {
  const WorkoutDetailScreen({super.key, required this.planId});
  final String planId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final planAsync = ref.watch(_planDetailProvider(planId));

    return planAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Loading...')),
        body: const Padding(
          padding: EdgeInsets.all(16),
          child: LoadingShimmer(count: 4, height: 90),
        ),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(
          title: const Text('Error'),
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF0F172A),
          elevation: 0,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(e.toString(),
                style: const TextStyle(color: Color(0xFF64748B))),
          ),
        ),
      ),
      data: (plan) => _PlanDetail(plan: plan),
    );
  }
}

class _PlanDetail extends StatefulWidget {
  const _PlanDetail({required this.plan});
  final WorkoutPlanModel plan;

  @override
  State<_PlanDetail> createState() => _PlanDetailState();
}

class _PlanDetailState extends State<_PlanDetail> {
  int _selectedDayIndex = 0;
  // "workoutIdx-exerciseIdx" → completed
  final Map<String, bool> _completed = {};

  @override
  void initState() {
    super.initState();
    for (int wi = 0; wi < widget.plan.workouts.length; wi++) {
      final day = widget.plan.workouts[wi];
      for (int ei = 0; ei < day.exercises.length; ei++) {
        _completed['$wi-$ei'] = day.exercises[ei].completed;
      }
    }
  }

  WorkoutDayModel? get _currentDay =>
      widget.plan.workouts.isEmpty ? null : widget.plan.workouts[_selectedDayIndex];

  bool _isComplete(int exerciseIdx) =>
      _completed['$_selectedDayIndex-$exerciseIdx'] ?? false;

  int get _totalCompleted => _completed.values.where((v) => v).length;
  int get _totalExercises => _completed.length;
  double get _overallProgress =>
      _totalExercises == 0 ? 0 : _totalCompleted / _totalExercises;

  Future<void> _toggleExercise(int exerciseIdx) async {
    final key = '$_selectedDayIndex-$exerciseIdx';
    final newValue = !(_completed[key] ?? false);
    setState(() => _completed[key] = newValue);
    try {
      await ApiClient().put('/workouts/${widget.plan.id}/progress', data: {
        'workoutIndex': _selectedDayIndex,
        'exerciseIndex': exerciseIdx,
        'completed': newValue,
      });
    } catch (_) {
      // Revert on error
      if (mounted) setState(() => _completed[key] = !newValue);
    }
  }

  @override
  Widget build(BuildContext context) {
    final plan = widget.plan;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          // Hero header
          SliverAppBar(
            expandedHeight: 160,
            pinned: true,
            backgroundColor: const Color(0xFF26BDB8),
            surfaceTintColor: Colors.transparent,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF26BDB8), Color(0xFF1A9E99)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 56, 16, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _Badge(label: plan.categoryLabel, color: Colors.white.withValues(alpha: 0.25)),
                        const SizedBox(height: 8),
                        Text(
                          plan.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _InfoPill(icon: Icons.fitness_center_rounded, label: plan.difficultyLabel),
                            const SizedBox(width: 8),
                            if (plan.duration != null)
                              _InfoPill(icon: Icons.calendar_today_rounded, label: '${plan.duration}w'),
                            const SizedBox(width: 8),
                            if (plan.frequency != null)
                              _InfoPill(icon: Icons.repeat_rounded, label: '${plan.frequency}×/wk'),
                            const SizedBox(width: 8),
                            _InfoPill(icon: Icons.person_rounded, label: plan.coachName),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            iconTheme: const IconThemeData(color: Colors.white),
          ),

          // Progress bar
          if (_totalExercises > 0)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: _ProgressCard(
                  completed: _totalCompleted,
                  total: _totalExercises,
                  progress: _overallProgress,
                ),
              ),
            ),

          // Day selector tabs
          if (plan.workouts.isNotEmpty)
            SliverPersistentHeader(
              pinned: true,
              delegate: _DaySelectorDelegate(
                days: plan.workouts,
                selectedIndex: _selectedDayIndex,
                onSelect: (i) => setState(() => _selectedDayIndex = i),
              ),
            ),

          // Exercise list for selected day
          if (_currentDay != null)
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    if (index == 0 && _currentDay!.warmUp != null) {
                      return _WarmupCard(text: _currentDay!.warmUp!, isWarmup: true);
                    }
                    final exIndex = _currentDay!.warmUp != null ? index - 1 : index;
                    if (exIndex < _currentDay!.exercises.length) {
                      return _ExerciseCard(
                        workoutEx: _currentDay!.exercises[exIndex],
                        index: exIndex,
                        isComplete: _isComplete(exIndex),
                        onToggle: () => _toggleExercise(exIndex),
                      );
                    }
                    if (_currentDay!.coolDown != null &&
                        exIndex == _currentDay!.exercises.length) {
                      return _WarmupCard(text: _currentDay!.coolDown!, isWarmup: false);
                    }
                    return null;
                  },
                  childCount: _currentDay!.exercises.length +
                      (_currentDay!.warmUp != null ? 1 : 0) +
                      (_currentDay!.coolDown != null ? 1 : 0),
                ),
              ),
            )
          else
            const SliverFillRemaining(
              child: Center(child: Text('No workouts in this plan yet.')),
            ),

          const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Day selector sticky header
// ---------------------------------------------------------------------------

class _DaySelectorDelegate extends SliverPersistentHeaderDelegate {
  final List<WorkoutDayModel> days;
  final int selectedIndex;
  final ValueChanged<int> onSelect;

  const _DaySelectorDelegate({
    required this.days,
    required this.selectedIndex,
    required this.onSelect,
  });

  @override
  double get minExtent => 64;
  @override
  double get maxExtent => 64;

  @override
  bool shouldRebuild(_DaySelectorDelegate old) =>
      old.selectedIndex != selectedIndex || old.days.length != days.length;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Colors.white,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        itemCount: days.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final selected = i == selectedIndex;
          return GestureDetector(
            onTap: () => onSelect(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: selected ? const Color(0xFF26BDB8) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Day ${days[i].day}',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: selected ? Colors.white : const Color(0xFF475569),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Progress card
// ---------------------------------------------------------------------------

class _ProgressCard extends StatelessWidget {
  const _ProgressCard({
    required this.completed,
    required this.total,
    required this.progress,
  });
  final int completed;
  final int total;
  final double progress;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Overall Progress',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF475569),
                ),
              ),
              Text(
                '${(progress * 100).round()}%',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF26BDB8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: const Color(0xFFE2E8F0),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF26BDB8)),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '$completed of $total exercises completed',
            style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Exercise card
// ---------------------------------------------------------------------------

class _ExerciseCard extends StatelessWidget {
  const _ExerciseCard({
    required this.workoutEx,
    required this.index,
    required this.isComplete,
    required this.onToggle,
  });
  final WorkoutExerciseModel workoutEx;
  final int index;
  final bool isComplete;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final ex = workoutEx.exercise;
    // Library exercise name, else the free-text name saved by AI plans.
    final name = ex?.name ?? workoutEx.name ?? 'Exercise ${index + 1}';
    final hasVideo = ex?.primaryVideoUrl != null;
    final hasImage = ex?.primaryImageUrl != null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Exercise icon / thumbnail
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFF26BDB8).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: hasImage
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(ex!.primaryImageUrl!, fit: BoxFit.cover),
                        )
                      : const Icon(Icons.fitness_center_rounded,
                          color: Color(0xFF26BDB8), size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      if (ex != null) ...[
                        const SizedBox(height: 3),
                        Text(
                          ex.muscleGroupsLabel,
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: onToggle,
                  child: Icon(
                    isComplete
                        ? Icons.check_circle_rounded
                        : Icons.radio_button_unchecked_rounded,
                    color: isComplete
                        ? const Color(0xFF22C55E)
                        : const Color(0xFFCBD5E1),
                    size: 26,
                  ),
                ),
              ],
            ),
          ),

          // Stats row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Row(
              children: [
                _StatPill(
                  icon: Icons.repeat_rounded,
                  label: workoutEx.setsRepsLabel,
                  color: const Color(0xFF26BDB8),
                ),
                if (workoutEx.weight != null && workoutEx.weight! > 0) ...[
                  const SizedBox(width: 8),
                  _StatPill(
                    icon: Icons.monitor_weight_rounded,
                    label: '${workoutEx.weight!.toStringAsFixed(workoutEx.weight! % 1 == 0 ? 0 : 1)} kg',
                    color: const Color(0xFF7C3AED),
                  ),
                ],
                if (workoutEx.restTime != null) ...[
                  const SizedBox(width: 8),
                  _StatPill(
                    icon: Icons.timer_rounded,
                    label: workoutEx.restLabel,
                    color: const Color(0xFFF59E0B),
                  ),
                ],
              ],
            ),
          ),

          // Notes
          if (workoutEx.notes != null && workoutEx.notes!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.notes_rounded, size: 14, color: Color(0xFF64748B)),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        workoutEx.notes!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Video / instructions button
          if (ex != null && (hasVideo || ex.instructions.isNotEmpty))
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Row(
                children: [
                  if (hasVideo)
                    Expanded(
                      child: _ActionButton(
                        icon: Icons.play_circle_rounded,
                        label: 'Watch Video',
                        color: const Color(0xFF26BDB8),
                        onTap: () => _showVideoDialog(context, ex),
                      ),
                    ),
                  if (hasVideo && ex.instructions.isNotEmpty)
                    const SizedBox(width: 8),
                  if (ex.instructions.isNotEmpty)
                    Expanded(
                      child: _ActionButton(
                        icon: Icons.list_alt_rounded,
                        label: 'Instructions',
                        color: const Color(0xFF10B981),
                        onTap: () => _showInstructionsSheet(context, ex),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _showVideoDialog(BuildContext context, ExerciseModel ex) {
    showDialog(
      context: context,
      builder: (_) => _VideoDialog(videoUrl: ex.primaryVideoUrl!, title: ex.name),
    );
  }

  void _showInstructionsSheet(BuildContext context, ExerciseModel ex) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _InstructionsSheet(exercise: ex),
    );
  }
}

// ---------------------------------------------------------------------------
// Video dialog with Chewie player
// ---------------------------------------------------------------------------

class _VideoDialog extends StatefulWidget {
  const _VideoDialog({required this.videoUrl, required this.title});
  final String videoUrl;
  final String title;

  @override
  State<_VideoDialog> createState() => _VideoDialogState();
}

class _VideoDialogState extends State<_VideoDialog> {
  late VideoPlayerController _videoController;
  ChewieController? _chewieController;

  @override
  void initState() {
    super.initState();
    _videoController = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl))
      ..initialize().then((_) {
        if (!mounted) return;
        setState(() {
          _chewieController = ChewieController(
            videoPlayerController: _videoController,
            autoPlay: true,
            looping: false,
            aspectRatio: _videoController.value.aspectRatio,
            allowFullScreen: true,
          );
        });
      });
  }

  @override
  void dispose() {
    _chewieController?.dispose();
    _videoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.black,
      insetPadding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    widget.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close_rounded, color: Colors.white),
                ),
              ],
            ),
          ),
          _chewieController != null
              ? AspectRatio(
                  aspectRatio: _videoController.value.aspectRatio,
                  child: Chewie(controller: _chewieController!),
                )
              : const AspectRatio(
                  aspectRatio: 16 / 9,
                  child: Center(
                    child: CircularProgressIndicator(color: Colors.white),
                  ),
                ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Instructions bottom sheet
// ---------------------------------------------------------------------------

class _InstructionsSheet extends StatelessWidget {
  const _InstructionsSheet({required this.exercise});
  final ExerciseModel exercise;

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      maxChildSize: 0.9,
      minChildSize: 0.4,
      expand: false,
      builder: (_, controller) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12, bottom: 16),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
              child: Text(
                exercise.name,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
            ),
            Expanded(
              child: ListView(
                controller: controller,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  if (exercise.description.isNotEmpty) ...[
                    Text(
                      exercise.description,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF475569),
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  if (exercise.instructions.isNotEmpty) ...[
                    const Text(
                      'How to do it',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 10),
                    ...exercise.instructions.map((instr) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 24,
                                height: 24,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF26BDB8),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '${instr.step}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  instr.instruction,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: Color(0xFF475569),
                                    height: 1.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )),
                  ],
                  if (exercise.tips.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    const Text(
                      'Pro Tips',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 10),
                    ...exercise.tips.map((tip) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.lightbulb_rounded,
                                  size: 16, color: Color(0xFFF59E0B)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  tip,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: Color(0xFF475569),
                                    height: 1.4,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )),
                  ],
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Warm-up / cool-down card
// ---------------------------------------------------------------------------

class _WarmupCard extends StatelessWidget {
  const _WarmupCard({required this.text, required this.isWarmup});
  final String text;
  final bool isWarmup;

  @override
  Widget build(BuildContext context) {
    final color = isWarmup ? const Color(0xFF10B981) : const Color(0xFF7C3AED);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Icon(
            isWarmup ? Icons.whatshot_rounded : Icons.ac_unit_rounded,
            color: color,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isWarmup ? 'Warm-Up' : 'Cool-Down',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: color,
                  ),
                ),
                Text(
                  text,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
}

class _InfoPill extends StatelessWidget {
  const _InfoPill({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white70),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
        ],
      );
}

class _StatPill extends StatelessWidget {
  const _StatPill({required this.icon, required this.label, required this.color});
  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      );
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      );
}
