import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../../core/storage/secure_storage.dart';
import '../../providers/auth_provider.dart';
import '../../services/biometric_service.dart';
import '../../widgets/city_gym_logo.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _biometricAvailable = false;
  bool _biometricEnabled = false;

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  Future<void> _checkBiometric() async {
    final available = await BiometricService.isAvailable();
    final enabled = await SecureStorage.getBiometricEnabled();
    if (mounted) {
      setState(() {
        _biometricAvailable = available;
        _biometricEnabled = enabled;
      });
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) return 'email_required'.tr();
    final emailRegex = RegExp(r'^[\w\-.]+@([\w\-]+\.)+[\w\-]{2,}$');
    if (!emailRegex.hasMatch(value.trim())) return 'email_invalid'.tr();
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) return 'password_required'.tr();
    return null;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authProvider.notifier).login(
          _emailController.text.trim(),
          _passwordController.text,
        );
    _navigateIfLoggedIn();
  }

  Future<void> _loginWithGoogle() async {
    await ref.read(authProvider.notifier).loginWithGoogle();
    _navigateIfLoggedIn();
  }

  Future<void> _loginWithFacebook() async {
    await ref.read(authProvider.notifier).loginWithFacebook();
    _navigateIfLoggedIn();
  }

  Future<void> _loginWithApple() async {
    await ref.read(authProvider.notifier).loginWithApple();
    _navigateIfLoggedIn();
  }

  Future<void> _loginWithBiometric() async {
    await ref.read(authProvider.notifier).loginWithBiometric();
    _navigateIfLoggedIn();
  }

  void _navigateIfLoggedIn() {
    if (!mounted) return;
    final auth = ref.read(authProvider);
    if (auth.isLoggedIn && auth.user != null) {
      final role = auth.user!.role;
      if (role == 'admin') {
        context.go('/admin');
      } else if (role == 'coach') {
        context.go('/coach');
      } else {
        context.go('/client');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLoading = auth.isLoading;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28.0, vertical: 24.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ── Logo ────────────────────────────────────────────────────
                  const Center(child: CityGymLogo(size: 130, showTagline: true))
                      .animate()
                      .fadeIn(duration: 700.ms, curve: Curves.easeOut)
                      .scale(
                        begin: const Offset(0.8, 0.8),
                        end: const Offset(1.0, 1.0),
                        duration: 700.ms,
                        curve: Curves.easeOutBack,
                      ),

                  const SizedBox(height: 36),

                  Text(
                    'sign_in_to_account'.tr(),
                    textAlign: TextAlign.center,
                    style: textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 300.ms, duration: 500.ms)
                      .slideY(begin: 0.15, end: 0, duration: 500.ms),

                  const SizedBox(height: 40),

                  // ── Email ────────────────────────────────────────────────────
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    autocorrect: false,
                    validator: _validateEmail,
                    decoration: InputDecoration(
                      labelText: 'email'.tr(),
                      hintText: 'email_hint'.tr(),
                      prefixIcon: const Icon(Icons.email_outlined),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 400.ms, duration: 500.ms)
                      .slideY(begin: 0.1, end: 0, duration: 500.ms),

                  const SizedBox(height: 16),

                  // ── Password ─────────────────────────────────────────────────
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _submit(),
                    validator: _validatePassword,
                    decoration: InputDecoration(
                      labelText: 'password'.tr(),
                      hintText: 'password_hint'.tr(),
                      prefixIcon: const Icon(Icons.lock_outline_rounded),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                        ),
                        onPressed: () =>
                            setState(() => _obscurePassword = !_obscurePassword),
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 480.ms, duration: 500.ms)
                      .slideY(begin: 0.1, end: 0, duration: 500.ms),

                  // ── Forgot password ──────────────────────────────────────────
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => context.push('/auth/forgot-password'),
                      child: Text('forgot_password'.tr()),
                    ),
                  ).animate().fadeIn(delay: 540.ms, duration: 400.ms),

                  // ── Error ────────────────────────────────────────────────────
                  if (auth.error != null) ...[
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: colorScheme.errorContainer,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.error_outline_rounded,
                              color: colorScheme.onErrorContainer, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              auth.error!,
                              style: textTheme.bodySmall?.copyWith(
                                  color: colorScheme.onErrorContainer),
                            ),
                          ),
                        ],
                      ),
                    )
                        .animate()
                        .fadeIn(duration: 300.ms)
                        .shake(hz: 3, offset: const Offset(4, 0)),
                    const SizedBox(height: 8),
                  ],

                  const SizedBox(height: 8),

                  // ── Login button ─────────────────────────────────────────────
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: isLoading ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF26BDB8),
                        foregroundColor: Colors.white,
                        disabledBackgroundColor:
                            const Color(0xFF26BDB8).withValues(alpha: 0.6),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                      ),
                      child: isLoading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2.5, color: Colors.white),
                            )
                          : Text('login'.tr(),
                              style: const TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 600.ms, duration: 500.ms)
                      .slideY(begin: 0.1, end: 0, duration: 500.ms),

                  const SizedBox(height: 28),

                  // ── OR divider ───────────────────────────────────────────────
                  Row(
                    children: [
                      Expanded(
                          child: Divider(color: colorScheme.outlineVariant, height: 1)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        child: Text(
                          'or'.tr(),
                          style: textTheme.bodySmall?.copyWith(
                              color: colorScheme.outline,
                              fontWeight: FontWeight.w500),
                        ),
                      ),
                      Expanded(
                          child: Divider(color: colorScheme.outlineVariant, height: 1)),
                    ],
                  ).animate().fadeIn(delay: 650.ms, duration: 400.ms),

                  const SizedBox(height: 20),

                  // ── Social buttons ───────────────────────────────────────────
                  Row(
                    children: [
                      Expanded(
                        child: _SocialButton(
                          label: 'Google',
                          icon: _GoogleIcon(),
                          onPressed: isLoading ? null : _loginWithGoogle,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _SocialButton(
                          label: 'Facebook',
                          icon: const Icon(Icons.facebook_rounded,
                              color: Color(0xFF1877F2), size: 22),
                          onPressed: isLoading ? null : _loginWithFacebook,
                        ),
                      ),
                      if (!kIsWeb) ...[
                        const SizedBox(width: 10),
                        Expanded(
                          child: FutureBuilder<bool>(
                            future: SignInWithApple.isAvailable(),
                            builder: (context, snap) {
                              if (snap.data != true) return const SizedBox.shrink();
                              return _SocialButton(
                                label: 'Apple',
                                icon: const Icon(Icons.apple_rounded,
                                    color: Colors.black, size: 22),
                                onPressed: isLoading ? null : _loginWithApple,
                              );
                            },
                          ),
                        ),
                      ],
                    ],
                  ).animate().fadeIn(delay: 700.ms, duration: 400.ms),

                  // ── Biometric button ─────────────────────────────────────────
                  if (_biometricAvailable && _biometricEnabled) ...[
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 48,
                      child: OutlinedButton.icon(
                        onPressed: isLoading ? null : _loginWithBiometric,
                        icon: const Icon(Icons.fingerprint_rounded, size: 22),
                        label: Text('biometric_login'.tr()),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF26BDB8),
                          side: const BorderSide(color: Color(0xFF26BDB8)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ).animate().fadeIn(delay: 750.ms, duration: 400.ms),
                  ],

                  const SizedBox(height: 28),

                  // ── Continue as Guest ─────────────────────────────────────────
                  TextButton(
                    onPressed: isLoading
                        ? null
                        : () => ref.read(authProvider.notifier).continueAsGuest(),
                    child: Text(
                      'continue_as_guest'.tr(),
                      style: TextStyle(
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withValues(alpha: 0.45),
                        fontSize: 13,
                      ),
                    ),
                  ).animate().fadeIn(delay: 820.ms, duration: 400.ms),

                  // ── Register link ─────────────────────────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'no_account'.tr(),
                        style: textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurface.withValues(alpha: 0.6),
                        ),
                      ),
                      TextButton(
                        onPressed: () => context.push('/auth/register'),
                        child: Text('register'.tr(),
                            style: const TextStyle(fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ).animate().fadeIn(delay: 800.ms, duration: 400.ms),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Social Button ────────────────────────────────────────────────────────────

class _SocialButton extends StatelessWidget {
  final String label;
  final Widget icon;
  final VoidCallback? onPressed;

  const _SocialButton({
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 12),
        side: BorderSide(color: colorScheme.outlineVariant),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        backgroundColor: colorScheme.surface,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          icon,
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: colorScheme.onSurface.withValues(alpha: 0.75),
                ),
          ),
        ],
      ),
    );
  }
}

// ─── Google "G" icon (multi-colour) ─────────────────────────────────────────

class _GoogleIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 22,
      height: 22,
      child: CustomPaint(painter: _GooglePainter()),
    );
  }
}

class _GooglePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final r = size.width / 2;
    final center = Offset(r, r);

    // Circle segments (simplified Google G)
    const colors = [
      Color(0xFF4285F4), // blue
      Color(0xFF34A853), // green
      Color(0xFFFBBC05), // yellow
      Color(0xFFEA4335), // red
    ];
    const sweeps = [1.6, 1.6, 1.6, 1.45];
    const starts = [-0.3, 1.3, 2.9, 4.4];

    final paint = Paint()
      ..strokeWidth = size.width * 0.22
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.butt;

    for (int i = 0; i < 4; i++) {
      paint.color = colors[i];
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: r * 0.72),
        starts[i],
        sweeps[i],
        false,
        paint,
      );
    }

    // Horizontal bar of "G"
    final barPaint = Paint()
      ..color = const Color(0xFF4285F4)
      ..strokeWidth = size.width * 0.22
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    canvas.drawLine(
      Offset(r, r),
      Offset(r + r * 0.65, r),
      barPaint,
    );
  }

  @override
  bool shouldRepaint(_GooglePainter old) => false;
}
