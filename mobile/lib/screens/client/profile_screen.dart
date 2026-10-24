import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/auth_guard_modal.dart';
import '../../widgets/gym_avatar.dart';

// Alias so the router can refer to either name.
typedef ProfileScreen = ClientProfileScreen;

class ClientProfileScreen extends ConsumerStatefulWidget {
  const ClientProfileScreen({super.key});

  @override
  ConsumerState<ClientProfileScreen> createState() => _ClientProfileScreenState();
}

class _ClientProfileScreenState extends ConsumerState<ClientProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final allowed = await AuthGuard.check(context, ref, feature: 'profile');
      if (!allowed && mounted) context.go('/client');
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'Profile',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Avatar + name card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
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
                GymAvatar(
                  imageUrl: user?.avatar,
                  initials: user?.initials ?? '?',
                  size: 80,
                ),
                const SizedBox(height: 12),
                Text(
                  user?.name ?? 'Loading...',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user?.email ?? '',
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF64748B),
                  ),
                ),
                if (user?.experienceLevel != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF26BDB8).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      user!.experienceLevel!.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF26BDB8),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Stats row
          if (user != null)
            Row(
              children: [
                if (user.height != null)
                  Expanded(
                    child: _StatTile(
                      label: 'Height',
                      value: '${user.height!.toStringAsFixed(0)} cm',
                    ),
                  ),
                if (user.height != null && user.weight != null)
                  const SizedBox(width: 10),
                if (user.weight != null)
                  Expanded(
                    child: _StatTile(
                      label: 'Weight',
                      value: '${user.weight!.toStringAsFixed(0)} kg',
                    ),
                  ),
              ],
            ),

          if (user?.fitnessGoals.isNotEmpty == true) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Fitness Goals',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: user!.fitnessGoals
                        .map(
                          (g) => Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF22C55E)
                                  .withValues(alpha: 0.1),
                              borderRadius:
                                  BorderRadius.circular(20),
                            ),
                            child: Text(
                              g,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF22C55E),
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 16),

          // Actions
          _ActionTile(
            icon: Icons.language_rounded,
            label: 'language'.tr(),
            trailing: Text(
              _currentLanguageLabel(context),
              style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF26BDB8),
                  fontWeight: FontWeight.w600),
            ),
            onTap: () => _showLanguagePicker(context),
          ),
          const SizedBox(height: 8),
          _ActionTile(
            icon: Icons.notifications_outlined,
            label: 'notifications'.tr(),
            onTap: () => context.push('/client/notifications'),
          ),
          const SizedBox(height: 8),
          _ActionTile(
            icon: Icons.monitor_heart_outlined,
            label: 'Health tools',
            onTap: () => context.push('/client/health'),
          ),
          const SizedBox(height: 8),
          _ActionTile(
            icon: Icons.event_note_outlined,
            label: 'My bookings',
            onTap: () => context.push('/client/bookings'),
          ),
          const SizedBox(height: 8),
          _ActionTile(
            icon: Icons.lock_outline_rounded,
            label: 'change_password'.tr(),
            onTap: () => context.push('/client/change-password'),
          ),
          const SizedBox(height: 8),
          _ActionTile(
            icon: Icons.help_outline_rounded,
            label: 'help_support'.tr(),
            onTap: () {},
          ),
          const SizedBox(height: 24),

          // Logout
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: authState.isLoading
                  ? null
                  : () => ref.read(authProvider.notifier).logout(),
              icon: const Icon(Icons.logout_rounded,
                  color: Color(0xFFEF4444)),
              label: Text(
                'sign_out'.tr(),
                style: const TextStyle(
                    color: Color(0xFFEF4444),
                    fontWeight: FontWeight.w600),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFEF4444)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _currentLanguageLabel(BuildContext context) {
    switch (context.locale.languageCode) {
      case 'ar': return 'العربية';
      case 'ku': return 'کوردی';
      default:   return 'English';
    }
  }

  void _showLanguagePicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40, height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Text(
                'select_language'.tr(),
                style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 12),
              _LangTile(
                flag: '🇬🇧',
                label: 'English',
                locale: const Locale('en'),
                current: context.locale,
              ),
              _LangTile(
                flag: '🇮🇶',
                label: 'العربية',
                locale: const Locale('ar'),
                current: context.locale,
              ),
              _LangTile(
                flag: '🏔️',
                label: 'کوردی',
                locale: const Locale('ku'),
                current: context.locale,
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}

class _LangTile extends StatelessWidget {
  const _LangTile({
    required this.flag,
    required this.label,
    required this.locale,
    required this.current,
  });
  final String flag;
  final String label;
  final Locale locale;
  final Locale current;

  @override
  Widget build(BuildContext context) {
    final isSelected = current.languageCode == locale.languageCode;
    return ListTile(
      leading: Text(flag, style: const TextStyle(fontSize: 24)),
      title: Text(label,
          style: TextStyle(
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected
                ? const Color(0xFF26BDB8)
                : const Color(0xFF0F172A),
          )),
      trailing: isSelected
          ? const Icon(Icons.check_circle_rounded, color: Color(0xFF26BDB8))
          : null,
      onTap: () {
        context.setLocale(locale);
        Navigator.of(context).pop();
      },
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
                fontSize: 12, color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.trailing,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final children = <Widget>[
      Icon(icon, color: const Color(0xFF475569), size: 22),
      const SizedBox(width: 12),
      Expanded(
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      if (trailing != null) trailing!,
      const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1)),
    ];
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
            ),
          ],
        ),
        child: Row(children: children),
      ),
    );
  }
}
