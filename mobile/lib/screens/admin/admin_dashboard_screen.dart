import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../core/network/api_client.dart';
import '../../widgets/gym_avatar.dart';
import '../../widgets/loading_shimmer.dart';

// ---------------------------------------------------------------------------
// Analytics state & notifier (local to admin)
// ---------------------------------------------------------------------------

class _AnalyticsData {
  final int totalUsers;
  final int totalClients;
  final int totalCoaches;
  final int totalAdmins;
  final int totalWorkouts;
  final int activeSubscriptions;

  const _AnalyticsData({
    this.totalUsers = 0,
    this.totalClients = 0,
    this.totalCoaches = 0,
    this.totalAdmins = 0,
    this.totalWorkouts = 0,
    this.activeSubscriptions = 0,
  });

  factory _AnalyticsData.fromJson(Map<String, dynamic> json) {
    final users = json['users'] as Map<String, dynamic>? ?? {};
    final byRole = users['byRole'] as Map<String, dynamic>? ??
        json['byRole'] as Map<String, dynamic>? ?? {};

    return _AnalyticsData(
      totalUsers: users['total'] as int? ??
          json['totalUsers'] as int? ?? 0,
      totalClients: byRole['client'] as int? ?? 0,
      totalCoaches: byRole['coach'] as int? ?? 0,
      totalAdmins: byRole['admin'] as int? ?? 0,
      totalWorkouts: (json['workouts'] as Map<String, dynamic>?)?['total']
              as int? ??
          json['totalWorkouts'] as int? ?? 0,
      activeSubscriptions:
          (json['subscriptions'] as Map<String, dynamic>?)?['active']
                  as int? ??
              json['activeSubscriptions'] as int? ?? 0,
    );
  }
}

class _AdminState {
  final _AnalyticsData? analytics;
  final bool isLoading;
  final String? error;

  const _AdminState({
    this.analytics,
    this.isLoading = false,
    this.error,
  });

  _AdminState copyWith({
    _AnalyticsData? analytics,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return _AdminState(
      analytics: analytics ?? this.analytics,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class _AdminNotifier extends StateNotifier<_AdminState> {
  final ApiClient _api;

  _AdminNotifier(this._api) : super(const _AdminState());

  Future<void> fetchAnalytics() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _api.get('/admin/analytics');
      final data = response.data['data'];
      final json = data is Map<String, dynamic> ? data : <String, dynamic>{};
      state = state.copyWith(
        isLoading: false,
        analytics: _AnalyticsData.fromJson(json),
      );
    } catch (e) {
      // Use placeholder data on error so dashboard still renders
      state = state.copyWith(
        isLoading: false,
        analytics: const _AnalyticsData(),
        error: ApiClient.extractError(e),
      );
    }
  }
}

final _adminProvider =
    StateNotifierProvider.autoDispose<_AdminNotifier, _AdminState>(
  (ref) => _AdminNotifier(ApiClient()),
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() =>
      _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  static const _primaryBlue = Color(0xFF2563EB);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(_adminProvider.notifier).fetchAnalytics();
    });
  }

  Future<void> _onRefresh() async {
    await ref.read(_adminProvider.notifier).fetchAnalytics();
  }

  Future<void> _logout() async {
    await ref.read(authProvider.notifier).logout();
  }

  void _showAnnouncement() {
    showDialog<void>(
      context: context,
      builder: (ctx) => const _AnnouncementDialog(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final adminState = ref.watch(_adminProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Row(
          children: [
            GymAvatar(
              imageUrl: user?.avatar,
              initials: user?.initials ?? '?',
              size: 34,
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'admin_panel'.tr(),
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: Color(0xFF0F172A),
                  ),
                ),
                Text(
                  user?.name ?? 'administrator'.tr(),
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded,
                color: Color(0xFFEF4444), size: 22),
            tooltip: 'logout'.tr(),
            onPressed: _logout,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        color: _primaryBlue,
        onRefresh: _onRefresh,
        child: adminState.isLoading && adminState.analytics == null
            ? const Padding(
                padding: EdgeInsets.all(16),
                child: LoadingShimmer(count: 5, height: 84),
              )
            : _buildBody(adminState),
      ),
    );
  }

  Widget _buildBody(_AdminState adminState) {
    final analytics = adminState.analytics ?? const _AnalyticsData();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Error banner
        if (adminState.error != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFFCA5A5)),
            ),
            child: Row(
              children: [
                const Icon(Icons.warning_amber_rounded,
                    color: Color(0xFFEF4444), size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'could_not_load_live_data_showing'.tr(),
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF991B1B),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Platform overview
        _SectionHeader(title: 'platform_overview'.tr()),
        const SizedBox(height: 12),
        _OverviewGrid(analytics: analytics),
        const SizedBox(height: 20),

        // Users by role
        _SectionHeader(title: 'users_by_role'.tr()),
        const SizedBox(height: 12),
        _UsersByRoleCard(analytics: analytics),
        const SizedBox(height: 20),

        // Quick actions
        _SectionHeader(title: 'quick_actions'.tr()),
        const SizedBox(height: 12),
        _QuickActionsTile(
          icon: Icons.manage_accounts_rounded,
          label: 'manage_users'.tr(),
          color: const Color(0xFF2563EB),
          onTap: () => context.push('/admin/users'),
        ),
        const SizedBox(height: 10),
        _QuickActionsTile(
          icon: Icons.campaign_rounded,
          label: 'send_announcement'.tr(),
          color: const Color(0xFF7C3AED),
          onTap: _showAnnouncement,
        ),
        const SizedBox(height: 10),
        _QuickActionsTile(
          icon: Icons.bar_chart_rounded,
          label: 'view_reports'.tr(),
          color: const Color(0xFF10B981),
          onTap: () => context.push('/admin/reports'),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Overview grid
// ---------------------------------------------------------------------------

class _OverviewGrid extends StatelessWidget {
  const _OverviewGrid({required this.analytics});
  final _AnalyticsData analytics;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.55,
      children: [
        _StatCard(
          icon: Icons.people_rounded,
          label: 'total_users'.tr(),
          value: '${analytics.totalUsers}',
          color: const Color(0xFF2563EB),
        ),
        _StatCard(
          icon: Icons.fitness_center_rounded,
          label: 'workout_plans'.tr(),
          value: '${analytics.totalWorkouts}',
          color: const Color(0xFF7C3AED),
        ),
        _StatCard(
          icon: Icons.subscriptions_rounded,
          label: 'active_subs'.tr(),
          value: '${analytics.activeSubscriptions}',
          color: const Color(0xFF10B981),
        ),
        _StatCard(
          icon: Icons.admin_panel_settings_rounded,
          label: 'admins'.tr(),
          value: '${analytics.totalAdmins}',
          color: const Color(0xFFF59E0B),
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
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(
              fontSize: 22,
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
// Users by role card
// ---------------------------------------------------------------------------

class _UsersByRoleCard extends StatelessWidget {
  const _UsersByRoleCard({required this.analytics});
  final _AnalyticsData analytics;

  @override
  Widget build(BuildContext context) {
    final total = analytics.totalUsers == 0 ? 1 : analytics.totalUsers;

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
        children: [
          _RoleRow(
            label: 'clients'.tr(),
            count: analytics.totalClients,
            total: total,
            color: const Color(0xFF2563EB),
          ),
          const SizedBox(height: 12),
          _RoleRow(
            label: 'nav_coaches'.tr(),
            count: analytics.totalCoaches,
            total: total,
            color: const Color(0xFF10B981),
          ),
          const SizedBox(height: 12),
          _RoleRow(
            label: 'admins'.tr(),
            count: analytics.totalAdmins,
            total: total,
            color: const Color(0xFFF59E0B),
          ),
        ],
      ),
    );
  }
}

class _RoleRow extends StatelessWidget {
  const _RoleRow({
    required this.label,
    required this.count,
    required this.total,
    required this.color,
  });

  final String label;
  final int count;
  final int total;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final fraction = count / total;

    return Row(
      children: [
        SizedBox(
          width: 60,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Color(0xFF475569),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: fraction.clamp(0.0, 1.0),
              backgroundColor: const Color(0xFFF1F5F9),
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 8,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Text(
          '$count',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Quick action tile
// ---------------------------------------------------------------------------

class _QuickActionsTile extends StatelessWidget {
  const _QuickActionsTile({
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
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(9),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0F172A),
                ),
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded,
                size: 14, color: Color(0xFF94A3B8)),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: Color(0xFF0F172A),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Announcement dialog
// ---------------------------------------------------------------------------

class _AnnouncementDialog extends StatefulWidget {
  const _AnnouncementDialog();

  @override
  State<_AnnouncementDialog> createState() => _AnnouncementDialogState();
}

class _AnnouncementDialogState extends State<_AnnouncementDialog> {
  final _titleController = TextEditingController();
  final _messageController = TextEditingController();
  bool _isSending = false;

  @override
  void dispose() {
    _titleController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final title = _titleController.text.trim();
    final message = _messageController.text.trim();
    if (title.isEmpty || message.isEmpty) return;

    setState(() => _isSending = true);
    try {
      await ApiClient().post(
        '/admin/announcements',
        data: {'title': title, 'message': message},
      );
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('announcement_sent_successfully'.tr()),
            behavior: SnackBarBehavior.floating,
            backgroundColor: const Color(0xFF10B981),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(ApiClient.extractError(e)),
            behavior: SnackBarBehavior.floating,
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(
        'send_announcement'.tr(),
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Color(0xFF0F172A),
        ),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _titleController,
            decoration: InputDecoration(
              labelText: 'title'.tr(),
              hintText: 'enter_announcement_title'.tr(),
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _messageController,
            maxLines: 4,
            decoration: InputDecoration(
              labelText: 'message'.tr(),
              hintText: 'enter_your_message'.tr(),
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed:
              _isSending ? null : () => Navigator.of(context).pop(),
          child: Text(
            'cancel'.tr(),
            style: const TextStyle(color: Color(0xFF64748B)),
          ),
        ),
        FilledButton(
          onPressed: _isSending ? null : _send,
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFF7C3AED),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          child: _isSending
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : Text('send'.tr()),
        ),
      ],
    );
  }
}
