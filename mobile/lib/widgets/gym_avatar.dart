import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

/// A circular avatar widget that shows a [CachedNetworkImage] when [imageUrl]
/// is provided, or falls back to a coloured circle with [initials].
class GymAvatar extends StatelessWidget {
  const GymAvatar({
    super.key,
    this.imageUrl,
    required this.initials,
    this.size = 48.0,
    this.backgroundColor,
  });

  /// Remote URL of the avatar image. If `null`, initials are shown instead.
  final String? imageUrl;

  /// One or two capital letters shown when no image is available.
  final String initials;

  /// Diameter of the avatar circle.
  final double size;

  /// Background colour of the initials circle. Defaults to the theme's
  /// primary colour when not supplied.
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final bgColor = backgroundColor ?? Theme.of(context).colorScheme.primary;
    final radius = size / 2;

    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return ClipOval(
        child: CachedNetworkImage(
          imageUrl: imageUrl!,
          width: size,
          height: size,
          fit: BoxFit.cover,
          placeholder: (context, url) => _InitialsCircle(
            initials: initials,
            size: size,
            backgroundColor: bgColor,
            radius: radius,
            isLoading: true,
          ),
          errorWidget: (context, url, error) => _InitialsCircle(
            initials: initials,
            size: size,
            backgroundColor: bgColor,
            radius: radius,
          ),
        ),
      );
    }

    return _InitialsCircle(
      initials: initials,
      size: size,
      backgroundColor: bgColor,
      radius: radius,
    );
  }
}

// ── Private helpers ──────────────────────────────────────────────────────────

class _InitialsCircle extends StatelessWidget {
  const _InitialsCircle({
    required this.initials,
    required this.size,
    required this.backgroundColor,
    required this.radius,
    this.isLoading = false,
  });

  final String initials;
  final double size;
  final Color backgroundColor;
  final double radius;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final fontSize = size * 0.36;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: backgroundColor,
        shape: BoxShape.circle,
      ),
      child: isLoading
          ? Padding(
              padding: EdgeInsets.all(size * 0.28),
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white.withValues(alpha: 0.8),
              ),
            )
          : Center(
              child: Text(
                initials.length > 2 ? initials.substring(0, 2) : initials,
                style: TextStyle(
                  fontSize: fontSize,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  height: 1.0,
                ),
              ),
            ),
    );
  }
}
