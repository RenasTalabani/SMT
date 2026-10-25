import '../../core/i18n/trv.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/tip_provider.dart';
import '../../models/tip_model.dart';
import '../../widgets/gym_avatar.dart';
import '../../widgets/loading_shimmer.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/error_view.dart';

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

const List<String> _tipCategories = [
  'All',
  'Nutrition',
  'Training',
  'Recovery',
  'Mindset',
  'Mobility',
  'Sleep',
  'Supplements',
  'Weight Loss',
  'Muscle Gain',
];

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

class TipsScreen extends ConsumerStatefulWidget {
  const TipsScreen({super.key});

  @override
  ConsumerState<TipsScreen> createState() => _TipsScreenState();
}

class _TipsScreenState extends ConsumerState<TipsScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String _selectedCategory = 'All';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(tipProvider.notifier).fetchTips(refresh: true);
    });
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      final state = ref.read(tipProvider);
      if (!state.isLoading && state.hasMore) {
        ref.read(tipProvider.notifier).fetchTips(
              search: _searchQuery.isEmpty ? null : _searchQuery,
              category:
                  _selectedCategory == 'All' ? null : _selectedCategory,
            );
      }
    }
  }

  void _applyFilters() {
    ref.read(tipProvider.notifier).fetchTips(
          refresh: true,
          search: _searchQuery.isEmpty ? null : _searchQuery,
          category: _selectedCategory == 'All' ? null : _selectedCategory,
        );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tipProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'tips_advice'.tr(),
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      body: Column(
        children: [
          // Search + filters header
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Column(
              children: [
                // Search bar
                TextField(
                  controller: _searchController,
                  onChanged: (value) {
                    _searchQuery = value;
                    if (value.isEmpty) _applyFilters();
                  },
                  onSubmitted: (_) => _applyFilters(),
                  decoration: InputDecoration(
                    hintText: 'search_tips'.tr(),
                    hintStyle:
                        const TextStyle(color: Color(0xFFCBD5E1)),
                    prefixIcon: const Icon(Icons.search_rounded,
                        color: Color(0xFF94A3B8)),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded,
                                color: Color(0xFF94A3B8)),
                            onPressed: () {
                              _searchController.clear();
                              _searchQuery = '';
                              _applyFilters();
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide:
                          const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide:
                          const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                          color: Color(0xFF26BDB8), width: 1.5),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                        vertical: 10, horizontal: 14),
                  ),
                ),
                const SizedBox(height: 10),

                // Category chips
                SizedBox(
                  height: 34,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _tipCategories.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final cat = _tipCategories[index];
                      final isSelected = cat == _selectedCategory;
                      return GestureDetector(
                        onTap: () {
                          setState(
                              () => _selectedCategory = cat);
                          _applyFilters();
                        },
                        child: AnimatedContainer(
                          duration:
                              const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFF26BDB8)
                                : Colors.white,
                            borderRadius:
                                BorderRadius.circular(20),
                            border: Border.all(
                              color: isSelected
                                  ? const Color(0xFF26BDB8)
                                  : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Text(
                            trv(cat),
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isSelected
                                  ? Colors.white
                                  : const Color(0xFF475569),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          // List content
          Expanded(
            child: state.isLoading && state.tips.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(16),
                    child: LoadingShimmer(count: 5, height: 110),
                  )
                : state.error != null && state.tips.isEmpty
                    ? ErrorView(
                        message: state.error!,
                        onRetry: _applyFilters,
                      )
                    : state.tips.isEmpty
                        ? EmptyState(
                            icon: Icons.lightbulb_rounded,
                            title: 'no_tips_found'.tr(),
                            subtitle:
                                'try_a_different_search_or_category'.tr(),
                          )
                        : RefreshIndicator(
                            color: const Color(0xFF26BDB8),
                            onRefresh: () async {
                              await ref
                                  .read(tipProvider.notifier)
                                  .fetchTips(
                                    refresh: true,
                                    search: _searchQuery.isEmpty
                                        ? null
                                        : _searchQuery,
                                    category:
                                        _selectedCategory == 'All'
                                            ? null
                                            : _selectedCategory,
                                  );
                            },
                            child: ListView.separated(
                              controller: _scrollController,
                              padding: const EdgeInsets.all(16),
                              itemCount: state.tips.length +
                                  (state.hasMore ? 1 : 0),
                              separatorBuilder: (_, __) =>
                                  const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                if (index >= state.tips.length) {
                                  return const Padding(
                                    padding: EdgeInsets.symmetric(
                                        vertical: 16),
                                    child: Center(
                                      child: CircularProgressIndicator(
                                        color: Color(0xFF26BDB8),
                                      ),
                                    ),
                                  );
                                }
                                return _TipCard(
                                    tip: state.tips[index]);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Tip card
// ---------------------------------------------------------------------------

class _TipCard extends ConsumerWidget {
  const _TipCard({required this.tip});
  final TipModel tip;

  String _timeAgo(DateTime? date) {
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 365) {
      return 'x_y_ago'.tr(namedArgs: {'n0': '${(diff.inDays / 365).floor()}'});
    } else if (diff.inDays > 30) {
      return 'x_mo_ago'.tr(namedArgs: {'n0': '${(diff.inDays / 30).floor()}'});
    } else if (diff.inDays > 0) {
      return 'x_d_ago'.tr(namedArgs: {'n0': '${diff.inDays}'});
    } else if (diff.inHours > 0) {
      return 'x_h_ago'.tr(namedArgs: {'n0': '${diff.inHours}'});
    } else if (diff.inMinutes > 0) {
      return 'x_m_ago'.tr(namedArgs: {'n0': '${diff.inMinutes}'});
    }
    return 'just_now'.tr();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: () => context.push('/client/tips/${tip.id}'),
      child: Container(
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
            // Category badge
            Row(
              children: [
                if (tip.category != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color:
                          const Color(0xFF26BDB8).withValues(alpha: 0.10),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      tip.category!,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF26BDB8),
                      ),
                    ),
                  ),
                if (tip.difficulty != null) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color:
                          const Color(0xFF7C3AED).withValues(alpha: 0.10),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      tip.difficulty!,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF7C3AED),
                      ),
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 8),

            // Title
            Text(
              tip.title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Color(0xFF0F172A),
                height: 1.3,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 10),

            // Author row
            Row(
              children: [
                GymAvatar(
                  imageUrl: tip.authorAvatar,
                  initials: tip.authorName.isNotEmpty
                      ? tip.authorName[0].toUpperCase()
                      : '?',
                  size: 28,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tip.authorName,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF334155),
                        ),
                      ),
                      if (tip.createdAt != null)
                        Text(
                          _timeAgo(tip.createdAt),
                          style: const TextStyle(
                            fontSize: 10,
                            color: Color(0xFF94A3B8),
                          ),
                        ),
                    ],
                  ),
                ),

                // Like button
                _ActionButton(
                  icon: tip.isLiked
                      ? Icons.favorite_rounded
                      : Icons.favorite_outline_rounded,
                  label: '${tip.likesCount}',
                  color: tip.isLiked
                      ? const Color(0xFFEF4444)
                      : const Color(0xFF94A3B8),
                  onTap: () =>
                      ref.read(tipProvider.notifier).toggleLike(tip.id),
                ),
                const SizedBox(width: 8),

                // Bookmark button
                _ActionButton(
                  icon: tip.isBookmarked
                      ? Icons.bookmark_rounded
                      : Icons.bookmark_outline_rounded,
                  label: '',
                  color: tip.isBookmarked
                      ? const Color(0xFF26BDB8)
                      : const Color(0xFF94A3B8),
                  onTap: () => ref
                      .read(tipProvider.notifier)
                      .toggleBookmark(tip.id),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
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
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: color),
          if (label.isNotEmpty) ...[
            const SizedBox(width: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: color,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
