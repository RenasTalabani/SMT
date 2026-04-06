import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/coach_model.dart';
import '../../providers/coach_provider.dart';
import '../../widgets/gym_avatar.dart';

// ---------------------------------------------------------------------------
// Coaches screen
// ---------------------------------------------------------------------------

class CoachesScreen extends ConsumerStatefulWidget {
  const CoachesScreen({super.key});

  @override
  ConsumerState<CoachesScreen> createState() => _CoachesScreenState();
}

class _CoachesScreenState extends ConsumerState<CoachesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(coachProvider.notifier).fetchCoaches();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(coachProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'Our Coaches',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      body: state.isLoading && state.coaches.isEmpty
          ? _CoachListShimmer()
          : state.error != null && state.coaches.isEmpty
              ? _ErrorState(
                  message: state.error!,
                  onRetry: () =>
                      ref.read(coachProvider.notifier).fetchCoaches(),
                )
              : state.coaches.isEmpty
                  ? const _EmptyState()
                  : RefreshIndicator(
                      color: const Color(0xFF26BDB8),
                      onRefresh: () =>
                          ref.read(coachProvider.notifier).fetchCoaches(),
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                        children: [
                          // Header banner
                          _TeamBanner(),
                          const SizedBox(height: 20),

                          // Coach cards
                          ...state.coaches.map((c) => Padding(
                                padding: const EdgeInsets.only(bottom: 16),
                                child: _CoachCard(coach: c),
                              )),
                        ],
                      ),
                    ),
    );
  }
}

// ---------------------------------------------------------------------------
// Team banner
// ---------------------------------------------------------------------------

class _TeamBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF26BDB8), Color(0xFF1A9E99)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Meet Our Expert Team',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Professional coaches dedicated to your fitness journey.',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.sports_gymnastics_rounded,
              color: Colors.white,
              size: 28,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Coach card
// ---------------------------------------------------------------------------

class _CoachCard extends StatelessWidget {
  const _CoachCard({required this.coach});
  final CoachModel coach;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/client/coaches/${coach.id}'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Avatar
            GymAvatar(
              imageUrl: coach.avatar,
              initials: coach.initials,
              size: 68,
            ),
            const SizedBox(width: 14),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    coach.name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    coach.primarySpecialty,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF26BDB8),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Stats row
                  Row(
                    children: [
                      _Stat(
                        icon: Icons.star_rounded,
                        iconColor: const Color(0xFFF59E0B),
                        label: coach.rating.toStringAsFixed(1),
                      ),
                      const SizedBox(width: 14),
                      if (coach.experienceYears != null) ...[
                        _Stat(
                          icon: Icons.workspace_premium_rounded,
                          iconColor: const Color(0xFF26BDB8),
                          label: '${coach.experienceYears}yr exp',
                        ),
                        const SizedBox(width: 14),
                      ],
                      if (coach.reviewCount > 0)
                        _Stat(
                          icon: Icons.people_outline_rounded,
                          iconColor: const Color(0xFF64748B),
                          label: '${coach.reviewCount} reviews',
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Specialty chips
                  Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: coach.formattedSpecialties
                        .take(3)
                        .map(
                          (s) => Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFF26BDB8)
                                  .withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              s,
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF26BDB8),
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),

            // Arrow
            const SizedBox(width: 8),
            const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFFCBD5E1),
              size: 22,
            ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({
    required this.icon,
    required this.iconColor,
    required this.label,
  });

  final IconData icon;
  final Color iconColor;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: iconColor, size: 13),
        const SizedBox(width: 3),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: Color(0xFF475569),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Shimmer placeholder
// ---------------------------------------------------------------------------

class _CoachListShimmer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      separatorBuilder: (_, __) => const SizedBox(height: 14),
      itemBuilder: (_, __) => Container(
        height: 110,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
            ),
          ],
        ),
        child: Row(
          children: [
            const SizedBox(width: 16),
            Container(
              width: 68,
              height: 68,
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(34),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 14,
                    width: 120,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(7),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 10,
                    width: 80,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(5),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    height: 8,
                    width: 160,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
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
// Error / empty states
// ---------------------------------------------------------------------------

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded,
                color: Color(0xFFCBD5E1), size: 52),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onRetry,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF26BDB8),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text(
        'No coaches available right now.',
        style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
      ),
    );
  }
}
