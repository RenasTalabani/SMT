import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/course_provider.dart';
import '../../providers/workout_provider.dart';
import '../../providers/tip_provider.dart';
import '../../providers/notification_provider.dart';
import '../../providers/ai_provider.dart';
import '../../providers/coach_provider.dart';
import '../../models/coach_model.dart';
import '../../models/workout_model.dart';
import '../../models/tip_model.dart';
import '../../widgets/gym_avatar.dart';
import '../../widgets/loading_shimmer.dart';
import '../../widgets/error_view.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(workoutProvider.notifier).fetchPlans();
      ref.read(courseProvider.notifier).fetchCourses();
      ref.read(tipProvider.notifier).fetchTips(refresh: true);
      ref.read(notificationProvider.notifier).fetchUnreadCount();
      // AI intelligent coaching data
      ref.read(aiDailyTipProvider.notifier).loadTip();
      ref.read(aiInsightsProvider.notifier).loadInsights();
      ref.read(aiProfileProvider.notifier).load();
      ref.read(coachProvider.notifier).fetchCoaches();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final isGuest = ref.watch(isGuestProvider);
    final workoutState = ref.watch(workoutProvider);
    final courseState = ref.watch(courseProvider);
    final tipState = ref.watch(tipProvider);
    final coachState = ref.watch(coachProvider);
    final unreadCount =
        ref.watch(notificationProvider.select((s) => s.unreadCount));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'nav_dashboard'.tr(),
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: Color(0xFF0F172A),
          ),
        ),
        actions: [
          Stack(
            children: [
              IconButton(
                onPressed: () => context.push('/client/notifications'),
                icon: const Icon(Icons.notifications_outlined,
                    color: Color(0xFF475569)),
              ),
              if (unreadCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: const BoxDecoration(
                      color: Color(0xFFEF4444),
                      shape: BoxShape.circle,
                    ),
                    constraints:
                        const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: Text(
                      unreadCount > 99 ? '99+' : '$unreadCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          Padding(
            padding: const EdgeInsetsDirectional.only(end: 12),
            child: GestureDetector(
              onTap: () => context.push('/client/profile'),
              child: GymAvatar(
                imageUrl: user?.avatar,
                initials: user?.initials ?? '?',
                size: 36,
              ),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: const Color(0xFF26BDB8),
        onRefresh: () async {
          await Future.wait([
            ref.read(workoutProvider.notifier).fetchPlans(),
            ref.read(tipProvider.notifier).fetchTips(refresh: true),
            ref.read(notificationProvider.notifier).fetchUnreadCount(),
          ]);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Guest banner
            if (isGuest) ...[
              _GuestBanner(onLogin: () => context.go('/auth/login')),
              const SizedBox(height: 12),
            ],

            // Welcome card
            _WelcomeCard(name: user?.name ?? 'there'),
            const SizedBox(height: 20),

            // Stats row
            _StatsRow(
              workoutsCount: workoutState.plans.length,
              coursesCount: courseState.courses.length,
              tipsCount: tipState.tips.length,
            ),
            const SizedBox(height: 20),

            // AI Coach section
            const _AiCoachSection(),
            const SizedBox(height: 16),

            // Daily AI tip
            const _DailyTipCard(),
            const SizedBox(height: 12),

            // AI coaching insight
            const _CoachInsightCard(),
            const SizedBox(height: 20),

            // My Plan preview
            _PlanPreviewCard(
              isLoading: workoutState.isLoading,
              plans: workoutState.plans,
            ),
            const SizedBox(height: 20),

            // Our Coaches
            if (coachState.coaches.isNotEmpty) ...[
              _SectionHeader(
                title: 'our_coaches'.tr(),
                actionLabel: 'see_all_2'.tr(),
                actionRoute: '/client/coaches',
              ),
              const SizedBox(height: 12),
              _CoachesRow(coaches: coachState.coaches),
              const SizedBox(height: 20),
            ],

            // Latest Tips
            _SectionHeader(
              title: 'latest_tips'.tr(),
              actionLabel: 'see_all_2'.tr(),
              actionRoute: '/client/tips',
            ),
            const SizedBox(height: 12),
            if (tipState.isLoading && tipState.tips.isEmpty)
              const SizedBox(
                height: 160,
                child: Center(
                  child: CircularProgressIndicator(color: Color(0xFF26BDB8)),
                ),
              )
            else if (tipState.error != null && tipState.tips.isEmpty)
              ErrorView(
                message: tipState.error!,
                onRetry: () =>
                    ref.read(tipProvider.notifier).fetchTips(refresh: true),
              )
            else
              _LatestTipsRow(tips: tipState.tips.take(3).toList()),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Welcome card
// ---------------------------------------------------------------------------

class _WelcomeCard extends StatelessWidget {
  const _WelcomeCard({required this.name});
  final String name;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF26BDB8), Color(0xFF1A9E99)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF26BDB8).withValues(alpha: 0.35),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'good_day'.tr(),
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'welcome_back_x'.tr(namedArgs: {'name': name}),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'keep_pushing_your_limits_every_rep'.tr(),
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 13,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Stats row
// ---------------------------------------------------------------------------

class _StatsRow extends StatelessWidget {
  const _StatsRow({
    required this.workoutsCount,
    required this.coursesCount,
    required this.tipsCount,
  });

  final int workoutsCount;
  final int coursesCount;
  final int tipsCount;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: Icons.fitness_center_rounded,
            label: 'workouts'.tr(),
            value: '$workoutsCount',
            color: const Color(0xFF26BDB8),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatCard(
            icon: Icons.play_circle_rounded,
            label: 'nav_courses'.tr(),
            value: '$coursesCount',
            color: const Color(0xFF7C3AED),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatCard(
            icon: Icons.lightbulb_rounded,
            label: 'nav_tips'.tr(),
            value: '$tipsCount',
            color: const Color(0xFFF59E0B),
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
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
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: Color(0xFF64748B),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Plan preview card
// ---------------------------------------------------------------------------

class _PlanPreviewCard extends StatelessWidget {
  const _PlanPreviewCard({
    required this.isLoading,
    required this.plans,
  });

  final bool isLoading;
  final List<WorkoutPlanModel> plans;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(
          title: 'my_plan'.tr(),
          actionLabel: plans.isNotEmpty ? 'see_all_2'.tr() : null,
          actionRoute: '/client/plan',
        ),
        const SizedBox(height: 12),
        if (isLoading)
          const LoadingShimmer(count: 1, height: 100)
        else if (plans.isEmpty)
          _NoPlanCard(onRequest: () => context.push('/client/plan'))
        else
          _PlanCard(plan: plans.first),
      ],
    );
  }
}

class _NoPlanCard extends StatelessWidget {
  const _NoPlanCard({required this.onRequest});
  final VoidCallback onRequest;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          const Icon(Icons.fitness_center_rounded,
              size: 40, color: Color(0xFFCBD5E1)),
          const SizedBox(height: 12),
          Text(
            'no_plan_yet'.tr(),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF475569),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'request_a_personalised_workout_plan_from'.tr(),
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onRequest,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF26BDB8),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: Text('request_plan'.tr(),
                  style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({required this.plan});
  final WorkoutPlanModel plan;

  Color _statusColor(String? status) {
    switch (status) {
      case 'active':
        return const Color(0xFF22C55E);
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'completed':
        return const Color(0xFF64748B);
      default:
        return const Color(0xFF64748B);
    }
  }

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
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF26BDB8).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.fitness_center_rounded,
                color: Color(0xFF26BDB8), size: 24),
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
                      _Chip(
                          label: plan.categoryLabel,
                          color: const Color(0xFF26BDB8)),
                    if (plan.categoryLabel.isNotEmpty)
                      const SizedBox(width: 6),
                    if (plan.difficultyLabel.isNotEmpty)
                      _Chip(
                          label: plan.difficultyLabel,
                          color: const Color(0xFF7C3AED)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: _statusColor(plan.status).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              (plan.status ?? 'unknown').toUpperCase(),
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: _statusColor(plan.status),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Latest tips row
// ---------------------------------------------------------------------------

class _LatestTipsRow extends StatelessWidget {
  const _LatestTipsRow({required this.tips});
  final List<TipModel> tips;

  @override
  Widget build(BuildContext context) {
    if (tips.isEmpty) {
      return SizedBox(
        height: 120,
        child: Center(
          child: Text('no_tips_yet'.tr(),
              style: const TextStyle(color: Color(0xFF94A3B8))),
        ),
      );
    }
    return SizedBox(
      height: 160,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: tips.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final tip = tips[index];
          return GestureDetector(
            onTap: () => context.push('/client/tips/${tip.id}'),
            child: Container(
              width: 220,
              padding: const EdgeInsets.all(14),
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
                  if (tip.category != null)
                    _Chip(
                        label: tip.category!,
                        color: const Color(0xFFF59E0B)),
                  const SizedBox(height: 8),
                  Text(
                    tip.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0F172A),
                      height: 1.3,
                    ),
                  ),
                  const Spacer(),
                  Row(
                    children: [
                      const Icon(Icons.favorite_rounded,
                          size: 14, color: Color(0xFFEF4444)),
                      const SizedBox(width: 4),
                      Text(
                        '${tip.likesCount}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// AI Coach section
// ---------------------------------------------------------------------------

class _AiCoachSection extends StatelessWidget {
  const _AiCoachSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(title: 'ai_coach'.tr()),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1E293B), Color(0xFF334155)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              Row(children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF26BDB8).withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.smart_toy_rounded, color: Color(0xFF26BDB8), size: 22),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('powered_by_ai'.tr(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                    Text('your_personal_fitness_assistant'.tr(), style: const TextStyle(color: Colors.white54, fontSize: 12)),
                  ]),
                ),
              ]),
              const SizedBox(height: 14),
              Row(children: [
                Expanded(child: _AiTile(
                  icon: Icons.chat_bubble_outline_rounded,
                  label: 'chat'.tr(),
                  route: '/client/ai/chat',
                )),
                const SizedBox(width: 10),
                Expanded(child: _AiTile(
                  icon: Icons.auto_awesome_rounded,
                  label: 'workout'.tr(),
                  route: '/client/ai/workout',
                )),
                const SizedBox(width: 10),
                Expanded(child: _AiTile(
                  icon: Icons.restaurant_menu_rounded,
                  label: 'nutrition'.tr(),
                  route: '/client/ai/nutrition',
                )),
                const SizedBox(width: 10),
                Expanded(child: _AiTile(
                  icon: Icons.bar_chart_rounded,
                  label: 'nav_progress'.tr(),
                  route: '/client/ai/progress',
                )),
              ]),
            ],
          ),
        ),
      ],
    );
  }
}

class _AiTile extends StatelessWidget {
  const _AiTile({required this.icon, required this.label, required this.route});
  final IconData icon;
  final String label;
  final String route;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push(route),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
        ),
        child: Column(children: [
          Icon(icon, color: const Color(0xFF26BDB8), size: 22),
          const SizedBox(height: 6),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
        ]),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Daily AI Tip card
// ---------------------------------------------------------------------------

class _DailyTipCard extends ConsumerWidget {
  const _DailyTipCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(aiDailyTipProvider);

    if (state.isLoading) {
      return Container(
        height: 72,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: const Center(
          child: SizedBox(
            width: 20, height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Color(0xFF26BDB8),
            ),
          ),
        ),
      );
    }

    final tip = state.tip;
    if (tip == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDFA),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF99F6E4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: const Color(0xFF26BDB8).withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.lightbulb_rounded,
                color: Color(0xFF26BDB8), size: 16),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'daily_tip'.tr(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F766E),
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  tip,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF134E4A),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () {
              ref.read(aiDailyTipProvider.notifier).refresh();
              ref.read(aiDailyTipProvider.notifier).loadTip();
            },
            child: const Icon(Icons.refresh_rounded,
                size: 16, color: Color(0xFF26BDB8)),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// AI Coach Insight card  (motivation + action plan)
// ---------------------------------------------------------------------------

class _CoachInsightCard extends ConsumerWidget {
  const _CoachInsightCard();

  Color _levelColor(String level) {
    switch (level) {
      case 'intense': return const Color(0xFFEF4444);
      case 'gentle':  return const Color(0xFF8B5CF6);
      default:        return const Color(0xFF26BDB8);
    }
  }

  IconData _levelIcon(String level) {
    switch (level) {
      case 'intense': return Icons.local_fire_department_rounded;
      case 'gentle':  return Icons.favorite_rounded;
      default:        return Icons.bolt_rounded;
    }
  }

  String _levelLabel(String level) {
    switch (level) {
      case 'intense': return 'push_mode'.tr();
      case 'gentle':  return 'gentle_mode'.tr();
      default:        return 'coach_mode'.tr();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(aiInsightsProvider);

    if (state.isLoading) {
      return Container(
        height: 100,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: const Center(
          child: SizedBox(
            width: 20, height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Color(0xFF26BDB8),
            ),
          ),
        ),
      );
    }

    // If error or no insight yet, show nothing
    if (state.motivation == null || state.motivation!.isEmpty) {
      return const SizedBox.shrink();
    }

    final color = _levelColor(state.coachingLevel);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(_levelIcon(state.coachingLevel),
                    color: color, size: 16),
              ),
              const SizedBox(width: 8),
              Text(
                'ai_coach_insights'.tr(),
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _levelLabel(state.coachingLevel),
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: color,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Motivation
          Text(
            state.motivation!,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF334155),
              height: 1.45,
            ),
          ),

          // Action plan
          if (state.actionPlan.isNotEmpty) ...[
            const SizedBox(height: 10),
            ...state.actionPlan.map((action) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.check_circle_rounded,
                      size: 14, color: color),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      action,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF475569),
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            )),
          ],

          // Tips
          if (state.tips.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.tips_and_updates_rounded,
                      size: 14, color: Color(0xFFF59E0B)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      state.tips.first,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Refresh
          const SizedBox(height: 10),
          GestureDetector(
            onTap: () {
              ref.read(aiInsightsProvider.notifier).refresh();
              ref.read(aiInsightsProvider.notifier).loadInsights();
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const Icon(Icons.refresh_rounded,
                    size: 13, color: Color(0xFF94A3B8)),
                const SizedBox(width: 4),
                Text(
                  'refresh_insights'.tr(),
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Guest Banner ─────────────────────────────────────────────────────────────

class _GuestBanner extends StatelessWidget {
  final VoidCallback onLogin;
  const _GuestBanner({required this.onLogin});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF26BDB8), Color(0xFF1A9E9A)],
        ),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded, color: Colors.white, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'guest_banner'.tr(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: onLogin,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'login_now'.tr(),
                style: const TextStyle(
                  color: Color(0xFF26BDB8),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    this.actionLabel,
    this.actionRoute,
  });

  final String title;
  final String? actionLabel;
  final String? actionRoute;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: Color(0xFF0F172A),
          ),
        ),
        if (actionLabel != null && actionRoute != null)
          GestureDetector(
            onTap: () => context.push(actionRoute!),
            child: Text(
              actionLabel!,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF26BDB8),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Coaches row (dashboard preview)
// ---------------------------------------------------------------------------

class _CoachesRow extends StatelessWidget {
  const _CoachesRow({required this.coaches});
  final List<CoachModel> coaches;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 150,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: coaches.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final coach = coaches[index];
          return GestureDetector(
            onTap: () => context.push('/client/coaches/${coach.id}'),
            child: Container(
              width: 130,
              padding: const EdgeInsets.all(14),
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
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Avatar circle
                  Container(
                    width: 52,
                    height: 52,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF26BDB8), Color(0xFF1A9E99)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        coach.initials,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    coach.name.split(' ').first,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    coach.primarySpecialty,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 10,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.star_rounded,
                          color: Color(0xFFF59E0B), size: 11),
                      const SizedBox(width: 2),
                      Text(
                        coach.rating.toStringAsFixed(1),
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF475569),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
