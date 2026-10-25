import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

/// A centred error widget displaying an error icon, a message, and an
/// optional "Try Again" button.
///
/// ```dart
/// ErrorView(
///   message: 'Failed to load data. Check your connection.',
///   onRetry: () => ref.invalidate(someProvider),
/// )
/// ```
class ErrorView extends StatelessWidget {
  const ErrorView({
    super.key,
    required this.message,
    this.onRetry,
  });

  /// Human-readable error description shown below the icon.
  final String message;

  /// Optional callback invoked when the user taps "Try Again".
  /// If `null`, the retry button is not rendered.
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40.0, vertical: 32.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Error icon container
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: colorScheme.errorContainer.withValues(alpha: 0.6),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.error_outline_rounded,
                size: 44,
                color: colorScheme.error,
              ),
            ),

            const SizedBox(height: 20),

            // Title
            Text(
              'error'.tr(),
              textAlign: TextAlign.center,
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurface.withValues(alpha: 0.9),
              ),
            ),

            const SizedBox(height: 10),

            // Error message
            Text(
              message,
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface.withValues(alpha: 0.55),
                height: 1.5,
              ),
            ),

            // Retry button
            if (onRetry != null) ...[
              const SizedBox(height: 28),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded, size: 20),
                label: Text('try_again'.tr()),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF26BDB8),
                  side: const BorderSide(color: Color(0xFF26BDB8), width: 1.5),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
