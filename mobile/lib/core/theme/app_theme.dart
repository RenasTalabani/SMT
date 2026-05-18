import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// ── Brand colours ─────────────────────────────────────────────────────────────
class AppColors {
  AppColors._();

  static const primary    = Color(0xFF26BDB8);
  static const primaryDk  = Color(0xFF1A9E99);
  static const secondary  = Color(0xFF7C3AED);
  static const accent     = Color(0xFFF59E0B);
  static const success    = Color(0xFF22C55E);
  static const error      = Color(0xFFEF4444);
  static const warning    = Color(0xFFF97316);

  // Light palette
  static const bgLight       = Color(0xFFF8FAFC);
  static const surfaceLight  = Color(0xFFFFFFFF);
  static const borderLight   = Color(0xFFE2E8F0);
  static const textPrimary   = Color(0xFF0F172A);
  static const textSecondary = Color(0xFF475569);
  static const textHint      = Color(0xFF94A3B8);

  // Dark palette
  static const bgDark            = Color(0xFF0F172A);
  static const surfaceDark       = Color(0xFF1E293B);
  static const borderDark        = Color(0xFF334155);
  static const textDarkPrimary   = Color(0xFFF1F5F9);
  static const textDarkSecondary = Color(0xFF94A3B8);
}

class AppTheme {
  AppTheme._();

  static const _fontFamily = 'Inter';

  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark  => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;

    final colorScheme = ColorScheme(
      brightness: brightness,
      primary:             AppColors.primary,
      onPrimary:           Colors.white,
      primaryContainer:    isDark
          ? AppColors.primaryDk.withValues(alpha: 0.2)
          : AppColors.primary.withValues(alpha: 0.1),
      onPrimaryContainer:  AppColors.primary,
      secondary:           AppColors.secondary,
      onSecondary:         Colors.white,
      secondaryContainer:  AppColors.secondary.withValues(alpha: 0.15),
      onSecondaryContainer:AppColors.secondary,
      error:               AppColors.error,
      onError:             Colors.white,
      errorContainer:      AppColors.error.withValues(alpha: 0.1),
      onErrorContainer:    AppColors.error,
      surface:             isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
      onSurface:           isDark ? AppColors.textDarkPrimary : AppColors.textPrimary,
      surfaceContainerHighest:
                           isDark ? AppColors.borderDark : AppColors.borderLight,
      outline:             isDark ? AppColors.borderDark : AppColors.borderLight,
    );

    return ThemeData(
      useMaterial3:            true,
      brightness:              brightness,
      colorScheme:             colorScheme,
      fontFamily:              _fontFamily,
      scaffoldBackgroundColor: isDark ? AppColors.bgDark : AppColors.bgLight,

      appBarTheme: AppBarTheme(
        backgroundColor:    isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        foregroundColor:    isDark ? AppColors.textDarkPrimary : AppColors.textPrimary,
        elevation:          0,
        scrolledUnderElevation: 0,
        surfaceTintColor:   Colors.transparent,
        centerTitle:        false,
        titleTextStyle: TextStyle(
          fontFamily:   _fontFamily,
          fontWeight:   FontWeight.w700,
          fontSize:     18,
          color: isDark ? AppColors.textDarkPrimary : AppColors.textPrimary,
        ),
        systemOverlayStyle: isDark
            ? SystemUiOverlayStyle.light
            : SystemUiOverlayStyle.dark,
      ),

      cardTheme: CardThemeData(
        color:     isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: isDark ? AppColors.borderDark : AppColors.borderLight,
          ),
        ),
        margin: EdgeInsets.zero,
      ),

      textTheme: TextTheme(
        bodyLarge: TextStyle(
          fontFamily: _fontFamily,
          fontSize: 15,
          color: isDark ? AppColors.textDarkPrimary : AppColors.textPrimary,
        ),
        bodyMedium: TextStyle(
          fontFamily: _fontFamily,
          fontSize: 14,
          color: isDark ? AppColors.textDarkPrimary : AppColors.textPrimary,
        ),
        bodySmall: TextStyle(
          fontFamily: _fontFamily,
          fontSize: 12,
          color: isDark ? AppColors.textDarkSecondary : AppColors.textSecondary,
        ),
        titleLarge: TextStyle(
          fontFamily: _fontFamily,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: isDark ? AppColors.textDarkPrimary : AppColors.textPrimary,
        ),
        titleMedium: TextStyle(
          fontFamily: _fontFamily,
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: isDark ? AppColors.textDarkPrimary : AppColors.textPrimary,
        ),
        labelLarge: TextStyle(
          fontFamily: _fontFamily,
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: isDark ? AppColors.textDarkPrimary : AppColors.textPrimary,
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled:    true,
        fillColor: isDark
            ? AppColors.borderDark.withValues(alpha: 0.3)
            : AppColors.surfaceLight,
        hintStyle: const TextStyle(color: AppColors.textHint, fontSize: 14),
        labelStyle: TextStyle(
          color: isDark ? AppColors.textDarkSecondary : AppColors.textSecondary,
          fontSize: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
              color: isDark ? AppColors.borderDark : AppColors.borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
              color: isDark ? AppColors.borderDark : AppColors.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          minimumSize:     const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14)),
          elevation: 0,
          textStyle: const TextStyle(
            fontFamily:  _fontFamily,
            fontWeight:  FontWeight.w600,
            fontSize:    15,
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          minimumSize:     const Size(double.infinity, 52),
          side:            const BorderSide(color: AppColors.primary),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(
            fontFamily: _fontFamily,
            fontWeight: FontWeight.w600,
            fontSize:   15,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          textStyle: const TextStyle(
            fontFamily: _fontFamily,
            fontWeight: FontWeight.w600,
            fontSize:   14,
          ),
        ),
      ),

      chipTheme: ChipThemeData(
        backgroundColor: isDark ? AppColors.borderDark : AppColors.bgLight,
        selectedColor:   AppColors.primary.withValues(alpha: 0.15),
        labelStyle: TextStyle(
          fontSize:   12,
          fontWeight: FontWeight.w600,
          color: isDark ? AppColors.textDarkPrimary : AppColors.textPrimary,
        ),
        side: BorderSide(
            color: isDark ? AppColors.borderDark : AppColors.borderLight),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      ),

      dividerTheme: DividerThemeData(
        color:     isDark ? AppColors.borderDark : AppColors.borderLight,
        thickness: 1,
        space:     1,
      ),

      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor:    isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        selectedItemColor:  AppColors.primary,
        unselectedItemColor:AppColors.textHint,
        elevation:          0,
        type:               BottomNavigationBarType.fixed,
        selectedLabelStyle: const TextStyle(
          fontFamily: _fontFamily, fontWeight: FontWeight.w600, fontSize: 11),
        unselectedLabelStyle: const TextStyle(
          fontFamily: _fontFamily, fontWeight: FontWeight.w500, fontSize: 11),
      ),
    );
  }
}
