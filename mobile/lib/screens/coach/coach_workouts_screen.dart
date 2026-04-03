import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/workout_provider.dart';
import '../../models/workout_model.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_shimmer.dart';

class CoachWorkoutsScreen extends ConsumerStatefulWidget {
  const CoachWorkoutsScreen({super.key});

  @override
  ConsumerState<CoachWorkoutsScreen> createState() =>
      _CoachWorkoutsScreenState();
}

class _CoachWorkoutsScreenState extends ConsumerState<CoachWorkoutsScreen> {
  static const _blue = Color(0xFF26BDB8);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(workoutProvider.notifier).fetchPlans();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(workoutProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'Workout Plans',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          FloatingActionButton.small(
            heroTag: 'fab_exercise',
            onPressed: () => context.push('/coach/exercises/create'),
            backgroundColor: Colors.white,
            foregroundColor: _blue,
            elevation: 2,
            tooltip: 'New Exercise',
            child: const Icon(Icons.fitness_center_rounded),
          ),
          const SizedBox(height: 10),
          FloatingActionButton.extended(
            heroTag: 'fab_plan',
            onPressed: () async {
              await context.push('/coach/workouts/create');
              ref.read(workoutProvider.notifier).fetchPlans();
            },
            backgroundColor: _blue,
            foregroundColor: Colors.white,
            icon: const Icon(Icons.add_rounded),
            label: const Text('New Plan', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: _blue,
        onRefresh: () async =>
            ref.read(workoutProvider.notifier).fetchPlans(),
        child: _buildBody(state),
      ),
    );
  }

  Widget _buildBody(WorkoutsState state) {
    if (state.isLoading && state.plans.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: LoadingShimmer(count: 5, height: 84),
      );
    }

    if (state.plans.isEmpty) {
      return EmptyState(
        icon: Icons.fitness_center_rounded,
        title: 'No workout plans',
        subtitle: 'Create your first workout plan for clients.',
        actionLabel: 'Create Plan',
        onAction: () async {
          await context.push('/coach/workouts/create');
          ref.read(workoutProvider.notifier).fetchPlans();
        },
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      itemCount: state.plans.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final plan = state.plans[index];
        return _WorkoutPlanCard(
          plan: plan,
          onTap: () => context.push('/coach/workouts/${plan.id}'),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Plan card
// ---------------------------------------------------------------------------

class _WorkoutPlanCard extends StatelessWidget {
  const _WorkoutPlanCard({required this.plan, required this.onTap});
  final WorkoutPlanModel plan;
  final VoidCallback onTap;

  Color _statusColor(String? s) {
    switch (s) {
      case 'active': return const Color(0xFF22C55E);
      case 'draft': return const Color(0xFF94A3B8);
      case 'completed': return const Color(0xFF64748B);
      default: return const Color(0xFF94A3B8);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
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
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF26BDB8).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.fitness_center_rounded,
                  color: Color(0xFF26BDB8), size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    plan.title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      if (plan.categoryLabel.isNotEmpty)
                        _Tag(label: plan.categoryLabel, color: const Color(0xFF26BDB8)),
                      if (plan.categoryLabel.isNotEmpty && plan.workouts.isNotEmpty)
                        const SizedBox(width: 6),
                      if (plan.workouts.isNotEmpty)
                        _Tag(
                          label: '${plan.workouts.length} days',
                          color: const Color(0xFF64748B),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: _statusColor(plan.status).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    (plan.status ?? 'draft').toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: _statusColor(plan.status),
                    ),
                  ),
                ),
                if (plan.assignedTo != null) ...[
                  const SizedBox(height: 4),
                  const Icon(Icons.person_rounded, size: 14, color: Color(0xFF10B981)),
                ],
              ],
            ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1), size: 20),
          ],
        ),
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color),
        ),
      );
}
