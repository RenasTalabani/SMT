import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:model_viewer_plus/model_viewer_plus.dart';
import 'package:url_launcher/url_launcher.dart' as url_launcher;

import '../../core/theme/app_theme.dart';
import '../../models/body_part_model.dart';
import '../../providers/anatomy_provider.dart';

// ── public URL for the 3D human body model (replace with your own GLB) ────────
const _kModelUrl =
    'https://modelviewer.dev/shared-assets/models/Astronaut.glb';

Future<void> _openUrl(String url) async {
  final uri = Uri.parse(url);
  if (await url_launcher.canLaunchUrl(uri)) {
    await url_launcher.launchUrl(uri,
        mode: url_launcher.LaunchMode.externalApplication);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Anatomy Explorer
// ─────────────────────────────────────────────────────────────────────────────
class AnatomyScreen extends ConsumerStatefulWidget {
  const AnatomyScreen({super.key});

  @override
  ConsumerState<AnatomyScreen> createState() => _AnatomyScreenState();
}

class _AnatomyScreenState extends ConsumerState<AnatomyScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  final _search = TextEditingController();
  bool _show3D = true;

  static const _types = ['all', 'muscle', 'joint', 'artery', 'nerve'];
  static const _typeLabels = ['All', 'Muscles', 'Joints', 'Arteries', 'Nerves'];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: _types.length, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(anatomyProvider.notifier).fetchAll();
    });
  }

  @override
  void dispose() {
    _tabs.dispose();
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(anatomyProvider);

    return Scaffold(
      backgroundColor: AppColors.bgLight,
      body: CustomScrollView(
        slivers: [
          // ── App bar ────────────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 56,
            pinned: true,
            backgroundColor: const Color(0xFF0D1B2A),
            foregroundColor: Colors.white,
            surfaceTintColor: Colors.transparent,
            title: const Text(
              'Human Anatomy',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w800),
            ),
            actions: [
              IconButton(
                tooltip: _show3D ? 'Hide 3D model' : 'Show 3D model',
                icon: Icon(
                  _show3D
                      ? Icons.view_in_ar_rounded
                      : Icons.view_in_ar_outlined,
                  color: _show3D ? AppColors.accent : Colors.white54,
                ),
                onPressed: () => setState(() => _show3D = !_show3D),
              ),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(44),
              child: Container(
                color: const Color(0xFF0D1B2A),
                child: TabBar(
                  controller: _tabs,
                  isScrollable: true,
                  tabAlignment: TabAlignment.start,
                  labelColor: AppColors.accent,
                  unselectedLabelColor: Colors.white54,
                  indicatorColor: AppColors.accent,
                  indicatorWeight: 3,
                  dividerColor: Colors.transparent,
                  tabs: _typeLabels.map((l) => Tab(text: l)).toList(),
                  onTap: (i) =>
                      ref.read(anatomyProvider.notifier).setType(_types[i]),
                ),
              ),
            ),
          ),

          // ── 3D Model viewer ────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: AnimatedCrossFade(
              duration: const Duration(milliseconds: 350),
              crossFadeState: _show3D
                  ? CrossFadeState.showFirst
                  : CrossFadeState.showSecond,
              firstChild: _AnatomyModelSection(
                onPartTap: (part) =>
                    context.push('/client/anatomy/${part.id}'),
              ),
              secondChild: const SizedBox.shrink(),
            ),
          ),

          // ── Search + Region chips ──────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: _search,
                    decoration: InputDecoration(
                      hintText: 'Search muscles, joints, nerves…',
                      prefixIcon: const Icon(Icons.search_rounded,
                          color: AppColors.textHint),
                      suffixIcon: _search.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded),
                              onPressed: () {
                                _search.clear();
                                ref
                                    .read(anatomyProvider.notifier)
                                    .setSearch('');
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                    ),
                    onChanged: (v) =>
                        ref.read(anatomyProvider.notifier).setSearch(v),
                  ),
                  const SizedBox(height: 12),
                  const _RegionChips(),
                  const SizedBox(height: 14),
                  Text(
                    '${state.filtered.length} body parts',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textHint,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Body parts grid ────────────────────────────────────────────────
          if (state.isLoading)
            const SliverFillRemaining(
              child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary)),
            )
          else if (state.error != null && state.parts.isEmpty)
            SliverFillRemaining(
              child: _ErrorState(
                message: state.error!,
                onRetry: () => ref.read(anatomyProvider.notifier).fetchAll(),
              ),
            )
          else if (state.filtered.isEmpty)
            const SliverFillRemaining(child: _EmptyState())
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              sliver: SliverGrid(
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.82,
                ),
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) {
                    final part = state.filtered[i];
                    return _BodyPartCard(
                      part: part,
                      onTap: () =>
                          context.push('/client/anatomy/${part.id}'),
                    );
                  },
                  childCount: state.filtered.length,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3D Model Section
// ─────────────────────────────────────────────────────────────────────────────
class _AnatomyModelSection extends ConsumerWidget {
  const _AnatomyModelSection({required this.onPartTap});
  final void Function(BodyPartModel) onPartTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final parts = ref.watch(anatomyProvider).filtered;

    return Container(
      color: const Color(0xFF0D1B2A),
      child: Column(
        children: [
          // ── 3D viewer ─────────────────────────────────────────────────────
          SizedBox(
            height: 320,
            child: Stack(
              children: [
                // Model viewer — explicit size prevents web overflow
                const Positioned.fill(
                  child: ModelViewer(
                    src: _kModelUrl,
                    alt: 'Interactive 3D human body model',
                    ar: false,
                    autoRotate: true,
                    autoRotateDelay: 2000,
                    cameraControls: true,
                    disableZoom: false,
                    backgroundColor: Color(0xFF0D1B2A),
                    rotationPerSecond: '20deg',
                    shadowIntensity: 0.6,
                  ),
                ),
                // Overlay label
                Positioned(
                  bottom: 12,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.touch_app_rounded,
                              color: Colors.white70, size: 14),
                          SizedBox(width: 6),
                          Text(
                            'Drag to rotate • Pinch to zoom',
                            style: TextStyle(
                                color: Colors.white70, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── Quick-select chips ─────────────────────────────────────────────
          if (parts.isNotEmpty)
            Container(
              height: 52,
              padding: const EdgeInsets.only(left: 16, right: 16, bottom: 10),
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: parts.length > 8 ? 8 : parts.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final part = parts[i];
                  final color = _typeColors[part.type] ?? AppColors.primary;
                  return GestureDetector(
                    onTap: () => onPartTap(part),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(20),
                        border:
                            Border.all(color: color.withValues(alpha: 0.5)),
                      ),
                      child: Text(
                        part.name,
                        style: TextStyle(
                          color: color,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}

const Map<String, Color> _typeColors = {
  'muscle': Color(0xFF26BDB8),
  'joint': Color(0xFF7C3AED),
  'artery': Color(0xFFEF4444),
  'nerve': Color(0xFFF59E0B),
  'organ': Color(0xFF10B981),
};

const Map<String, IconData> _typeIcons = {
  'muscle': Icons.fitness_center_rounded,
  'joint': Icons.rotate_right_rounded,
  'artery': Icons.favorite_rounded,
  'nerve': Icons.electric_bolt_rounded,
  'organ': Icons.monitor_heart_rounded,
};

// ─────────────────────────────────────────────────────────────────────────────
// Region chips
// ─────────────────────────────────────────────────────────────────────────────
class _RegionChips extends ConsumerWidget {
  const _RegionChips();
  static const _regions = [
    'all', 'upper_body', 'lower_body', 'core', 'head_neck'
  ];
  static const _labels = [
    'All Regions', 'Upper Body', 'Lower Body', 'Core', 'Head & Neck'
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final active = ref.watch(anatomyProvider).activeRegion;
    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.zero,
        itemCount: _regions.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final selected = _regions[i] == active;
          return GestureDetector(
            onTap: () =>
                ref.read(anatomyProvider.notifier).setRegion(_regions[i]),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: selected ? AppColors.primary : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: selected
                      ? AppColors.primary
                      : AppColors.borderLight,
                ),
              ),
              child: Text(
                _labels[i],
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: selected ? Colors.white : AppColors.textSecondary,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Body part card
// ─────────────────────────────────────────────────────────────────────────────
class _BodyPartCard extends StatelessWidget {
  const _BodyPartCard({required this.part, required this.onTap});
  final BodyPartModel part;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = _typeColors[part.type] ?? AppColors.primary;
    final icon = _typeIcons[part.type] ?? Icons.circle;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.12),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon area
            Container(
              height: 90,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    color.withValues(alpha: 0.15),
                    color.withValues(alpha: 0.05)
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(18)),
              ),
              child: Center(child: Icon(icon, color: color, size: 44)),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      part.typeLabel,
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: color),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    part.name,
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (part.region != null) ...[
                    const SizedBox(height: 4),
                    Text(part.regionLabel,
                        style: const TextStyle(
                            fontSize: 11, color: AppColors.textHint)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail screen
// ─────────────────────────────────────────────────────────────────────────────
class BodyPartDetailScreen extends ConsumerWidget {
  const BodyPartDetailScreen({super.key, required this.partId});
  final String partId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(anatomyProvider);
    BodyPartModel? part;
    try {
      part = state.parts.firstWhere((p) => p.id == partId);
    } catch (_) {
      part = null;
    }

    if (part == null) {
      // Try to fetch if not loaded
      if (state.parts.isEmpty && !state.isLoading) {
        WidgetsBinding.instance.addPostFrameCallback(
            (_) => ref.read(anatomyProvider.notifier).fetchAll());
      }
      return Scaffold(
        appBar: AppBar(title: const Text('Body Part')),
        body: Center(
          child: state.isLoading
              ? const CircularProgressIndicator()
              : const Text('Part not found'),
        ),
      );
    }

    final color = _typeColors[part.type] ?? AppColors.primary;
    final icon = _typeIcons[part.type] ?? Icons.circle;

    return Scaffold(
      backgroundColor: AppColors.bgLight,
      body: CustomScrollView(
        slivers: [
          // ── Hero header ────────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: color,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF0D1B2A),
                      color.withValues(alpha: 0.85),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 60, 20, 20),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        // Icon circle
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.15),
                            border: Border.all(
                                color: Colors.white.withValues(alpha: 0.3),
                                width: 2),
                          ),
                          child: Icon(icon, color: Colors.white, size: 36),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              // Type badge
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color:
                                      Colors.white.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  part.typeLabel.toUpperCase(),
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 1.2),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                part.name,
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900),
                              ),
                              if (part.nameAr != null)
                                Text(part.nameAr!,
                                    style: const TextStyle(
                                        color: Colors.white70,
                                        fontSize: 13)),
                              if (part.regionLabel.isNotEmpty)
                                Row(children: [
                                  const Icon(Icons.location_on_rounded,
                                      color: Colors.white70, size: 13),
                                  const SizedBox(width: 3),
                                  Text(part.regionLabel,
                                      style: const TextStyle(
                                          color: Colors.white70,
                                          fontSize: 12)),
                                ]),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // ── Content ────────────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (part.description != null)
                    _InfoCard(
                      icon: Icons.info_outline_rounded,
                      color: color,
                      title: 'Overview',
                      child: Text(part.description!, style: _bodyStyle),
                    ),
                  if (part.function != null)
                    _InfoCard(
                      icon: Icons.settings_rounded,
                      color: color,
                      title: 'Function',
                      child: Text(part.function!, style: _bodyStyle),
                    ),
                  if (part.origin != null || part.insertion != null)
                    _InfoCard(
                      icon: Icons.timeline_rounded,
                      color: color,
                      title: 'Anatomy',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (part.origin != null) ...[
                            _AnatomyRow(
                                label: 'Origin', value: part.origin!),
                            const SizedBox(height: 6),
                          ],
                          if (part.insertion != null)
                            _AnatomyRow(
                                label: 'Insertion',
                                value: part.insertion!),
                          if (part.innervation != null) ...[
                            const SizedBox(height: 6),
                            _AnatomyRow(
                                label: 'Innervation',
                                value: part.innervation!),
                          ],
                        ],
                      ),
                    ),
                  if (part.relatedExercises.isNotEmpty)
                    _InfoCard(
                      icon: Icons.fitness_center_rounded,
                      color: color,
                      title: 'Related Exercises',
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: part.relatedExercises
                            .map((e) => _Chip(label: e, color: color))
                            .toList(),
                      ),
                    ),
                  if (part.synergistMuscles.isNotEmpty ||
                      part.antagonistMuscles.isNotEmpty)
                    _InfoCard(
                      icon: Icons.compare_arrows_rounded,
                      color: color,
                      title: 'Muscle Relationships',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (part.synergistMuscles.isNotEmpty) ...[
                            const Text('Synergists',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textSecondary)),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: part.synergistMuscles
                                  .map((e) => _Chip(
                                      label: e,
                                      color: Colors.green.shade600))
                                  .toList(),
                            ),
                            const SizedBox(height: 10),
                          ],
                          if (part.antagonistMuscles.isNotEmpty) ...[
                            const Text('Antagonists',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textSecondary)),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: part.antagonistMuscles
                                  .map((e) => _Chip(
                                      label: e,
                                      color: Colors.orange.shade700))
                                  .toList(),
                            ),
                          ],
                        ],
                      ),
                    ),
                  if (part.injuryRisks.isNotEmpty)
                    _InfoCard(
                      icon: Icons.warning_amber_rounded,
                      color: const Color(0xFFEF4444),
                      title: 'Injury Risks',
                      child: Column(
                        children: part.injuryRisks
                            .map((r) => _BulletRow(
                                text: r, color: const Color(0xFFEF4444)))
                            .toList(),
                      ),
                    ),
                  if (part.symptoms.isNotEmpty)
                    _InfoCard(
                      icon: Icons.sick_rounded,
                      color: const Color(0xFFEF4444),
                      title: 'Symptoms',
                      child: Column(
                        children: part.symptoms
                            .map((s) => _BulletRow(
                                text: s, color: const Color(0xFFEF4444)))
                            .toList(),
                      ),
                    ),
                  if (part.recoveryTips.isNotEmpty)
                    _InfoCard(
                      icon: Icons.healing_rounded,
                      color: const Color(0xFF10B981),
                      title: 'Recovery Tips',
                      child: Column(
                        children: part.recoveryTips
                            .map((t) => _BulletRow(
                                text: t, color: const Color(0xFF10B981)))
                            .toList(),
                      ),
                    ),
                  if (part.warmUpTips.isNotEmpty)
                    _InfoCard(
                      icon: Icons.local_fire_department_rounded,
                      color: const Color(0xFFF59E0B),
                      title: 'Warm-up Tips',
                      child: Column(
                        children: part.warmUpTips
                            .map((t) => _BulletRow(
                                text: t, color: const Color(0xFFF59E0B)))
                            .toList(),
                      ),
                    ),
                  if (part.videoUrl != null) ...[
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.play_circle_fill_rounded),
                        label: const Text('Watch Explanation Video'),
                        onPressed: () => _openUrl(part!.videoUrl!),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: color,
                          foregroundColor: Colors.white,
                          padding:
                              const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

const _bodyStyle = TextStyle(
  fontSize: 14,
  color: AppColors.textSecondary,
  height: 1.6,
);

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-widgets
// ─────────────────────────────────────────────────────────────────────────────
class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.icon,
    required this.color,
    required this.title,
    required this.child,
  });
  final IconData icon;
  final Color color;
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 8),
              Text(title,
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: color)),
            ]),
          ),
          Divider(height: 16, color: color.withValues(alpha: 0.15)),
          Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: child),
        ],
      ),
    );
  }
}

class _AnatomyRow extends StatelessWidget {
  const _AnatomyRow({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        style: _bodyStyle,
        children: [
          TextSpan(
              text: '$label: ',
              style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary)),
          TextSpan(text: value),
        ],
      ),
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(label,
          style: TextStyle(
              fontSize: 12, fontWeight: FontWeight.w600, color: color)),
    );
  }
}

class _BulletRow extends StatelessWidget {
  const _BulletRow({required this.text, required this.color});
  final String text;
  final Color color;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 5),
            child: Container(
                width: 6,
                height: 6,
                decoration:
                    BoxDecoration(color: color, shape: BoxShape.circle)),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: _bodyStyle)),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.cloud_off_rounded,
              size: 56, color: AppColors.textHint),
          const SizedBox(height: 16),
          Text(message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textSecondary)),
          const SizedBox(height: 20),
          ElevatedButton(onPressed: onRetry, child: const Text('Try Again')),
        ]),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.search_off_rounded, size: 56, color: AppColors.textHint),
        SizedBox(height: 12),
        Text('No results found',
            style:
                TextStyle(color: AppColors.textSecondary, fontSize: 15)),
      ]),
    );
  }
}
