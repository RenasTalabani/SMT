import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';

class AuthGuard {
  /// Returns true if the user is allowed to proceed (not a guest).
  /// If the user is a guest, shows a login bottom sheet.
  /// Returns true only if they log in during the modal.
  static Future<bool> check(
    BuildContext context,
    WidgetRef ref, {
    String feature = '',
  }) async {
    if (!ref.read(authProvider).isGuest) return true;

    final action = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AuthGuardSheet(feature: feature),
    );

    // User logged in via social button inside the modal
    if (ref.read(authProvider).isLoggedIn) return true;

    // User tapped "Sign in / Register" — navigate to login
    if (action == 'login' && context.mounted) {
      context.go('/auth/login');
    }

    return false;
  }
}

// ─── Modal Sheet ──────────────────────────────────────────────────────────────

class _AuthGuardSheet extends ConsumerWidget {
  final String feature;
  const _AuthGuardSheet({required this.feature});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final isLoading = auth.isLoading;
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(
        24, 12, 24,
        MediaQuery.of(context).viewInsets.bottom + 28,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            width: 40, height: 4,
            decoration: BoxDecoration(
              color: colorScheme.outlineVariant,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),

          // Lock icon
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              color: const Color(0xFF26BDB8).withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.lock_rounded,
              color: Color(0xFF26BDB8),
              size: 30,
            ),
          ),
          const SizedBox(height: 16),

          Text(
            'unlock_feature'.tr(),
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          Text(
            'login_to_continue'.tr(),
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.onSurface.withValues(alpha: 0.6),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 24),

          // Google quick-login
          SizedBox(
            width: double.infinity,
            height: 50,
            child: OutlinedButton.icon(
              onPressed: isLoading
                  ? null
                  : () async {
                      await ref.read(authProvider.notifier).loginWithGoogle();
                      if (ref.read(authProvider).isLoggedIn && context.mounted) {
                        Navigator.of(context).pop('success');
                      }
                    },
              icon: const Icon(Icons.g_mobiledata_rounded, size: 24),
              label: Text('google'.tr()),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: colorScheme.outlineVariant),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Full sign-in button
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: isLoading
                  ? null
                  : () => Navigator.of(context).pop('login'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF26BDB8),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                'sign_in_or_register'.tr(),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ),
          const SizedBox(height: 4),

          // Skip
          TextButton(
            onPressed: () => Navigator.of(context).pop(null),
            child: Text(
              'continue_as_guest'.tr(),
              style: TextStyle(
                color: colorScheme.onSurface.withValues(alpha: 0.5),
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
