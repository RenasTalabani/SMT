import '../core/i18n/trv.dart';
import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../core/storage/secure_storage.dart';
import '../models/user_model.dart';
import '../services/biometric_service.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class AuthState {
  final UserModel? user;
  final bool isLoading;
  final String? error;
  final bool isLoggedIn;
  final bool isGuest;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.isLoggedIn = false,
    this.isGuest = false,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    String? error,
    bool clearError = false,
    bool? isLoggedIn,
    bool clearUser = false,
    bool? isGuest,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      isGuest: isGuest ?? this.isGuest,
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _api;

  AuthNotifier(this._api) : super(const AuthState());

  // ── init ──────────────────────────────────────────────────────────────────
  /// Called at app startup. Checks for a stored token; if found, loads profile.
  Future<void> init() async {
    state = state.copyWith(isLoading: true, clearError: true);
    final wasGuest = await SecureStorage.isGuestMode();
    try {
      final token = await SecureStorage.getAccessToken();
      if (token == null) {
        state = state.copyWith(isLoading: false, isLoggedIn: false, isGuest: wasGuest);
        return;
      }
      await fetchProfile();
      await SecureStorage.saveGuestMode(false);
      state = state.copyWith(isLoading: false, isLoggedIn: true, isGuest: false);
    } on DioException catch (e) {
      // Network/timeout error — tokens may still be valid; don't wipe them.
      // Only clear on 401 (token truly invalid).
      if (e.response?.statusCode == 401) {
        await SecureStorage.clearAll();
        state = state.copyWith(
          isLoading: false,
          isLoggedIn: false,
          isGuest: false,
          clearUser: true,
          clearError: true,
        );
      } else {
        // Re-check guest flag — user may have tapped "Continue as Guest"
        // while init was running in the background.
        final stillGuest = await SecureStorage.isGuestMode();
        state = state.copyWith(
          isLoading: false,
          isLoggedIn: false,
          isGuest: stillGuest,
          clearUser: true,
          clearError: true,
        );
      }
    } catch (_) {
      // Non-Dio error (parse error etc.) — clear everything.
      await SecureStorage.clearAll();
      state = state.copyWith(
        isLoading: false,
        isLoggedIn: false,
        isGuest: false,
        clearUser: true,
        clearError: true,
      );
    }
  }

  // ── continueAsGuest ──────────────────────────────────────────────────────
  Future<void> continueAsGuest() async {
    await SecureStorage.saveGuestMode(true);
    state = state.copyWith(isGuest: true, isLoggedIn: false, isLoading: false, clearError: true);
  }

  // ── login ─────────────────────────────────────────────────────────────────
  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _api.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );

      final data = response.data['data'] as Map<String, dynamic>;
      final accessToken = data['accessToken'] as String;
      final refreshToken = data['refreshToken'] as String?;
      final userJson = data['user'] as Map<String, dynamic>;
      final user = UserModel.fromJson(userJson);

      await SecureStorage.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );
      await SecureStorage.saveUserInfo(id: user.id, role: user.role);
      await SecureStorage.saveGuestMode(false);

      state = state.copyWith(
        isLoading: false,
        isLoggedIn: true,
        isGuest: false,
        user: user,
        clearError: true,
      );
      _registerFcmToken();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ApiClient.extractError(e),
      );
    }
  }

  // ── register ──────────────────────────────────────────────────────────────
  Future<void> register(
    String name,
    String email,
    String password,
    String role,
  ) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _api.post(
        '/auth/register',
        data: {
          'name': name,
          'email': email,
          'password': password,
          'role': role,
        },
      );

      final data = response.data['data'] as Map<String, dynamic>;
      final accessToken = data['accessToken'] as String;
      final refreshToken = data['refreshToken'] as String?;
      final userJson = data['user'] as Map<String, dynamic>;
      final user = UserModel.fromJson(userJson);

      await SecureStorage.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );
      await SecureStorage.saveUserInfo(id: user.id, role: user.role);

      state = state.copyWith(
        isLoading: false,
        isLoggedIn: true,
        user: user,
        clearError: true,
      );
      _registerFcmToken();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ApiClient.extractError(e),
      );
    }
  }

  // ── logout ────────────────────────────────────────────────────────────────
  Future<void> logout() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _api.post('/auth/logout');
    } catch (_) {
      // Even if the server call fails, clear local state.
    } finally {
      await SecureStorage.clearAll();
      state = const AuthState(
        isLoading: false,
        isLoggedIn: false,
        isGuest: false,
      );
    }
  }

  // ── fetchProfile ──────────────────────────────────────────────────────────
  Future<void> fetchProfile() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _api.get('/auth/me');
      final data = response.data['data'] as Map<String, dynamic>;
      final user = UserModel.fromJson(data['user'] ?? data);

      state = state.copyWith(
        isLoading: false,
        isLoggedIn: true,
        user: user,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ApiClient.extractError(e),
      );
      rethrow;
    }
  }

  // ── FCM token ─────────────────────────────────────────────────────────────
  Future<void> _registerFcmToken() async {
    try {
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(alert: true, badge: true, sound: true);
      final token = await messaging.getToken();
      if (token != null) {
        await _api.post(ApiConstants.fcmToken, data: {'token': token});
      }
    } catch (_) {
      // Non-critical — don't block login if FCM fails
    }
  }

  // ── loginWithGoogle ──────────────────────────────────────────────────────
  Future<void> loginWithGoogle() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final googleSignIn = GoogleSignIn();
      final account = await googleSignIn.signIn();
      if (account == null) {
        state = state.copyWith(isLoading: false);
        return;
      }
      final auth = await account.authentication;
      final idToken = auth.idToken;
      if (idToken == null) throw Exception('Google sign-in failed: no idToken');
      await _socialLogin(ApiConstants.socialGoogle, {'idToken': idToken});
    } catch (e) {
      state = state.copyWith(isLoading: false, error: ApiClient.extractError(e));
    }
  }

  // ── loginWithFacebook ────────────────────────────────────────────────────
  Future<void> loginWithFacebook() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await FacebookAuth.instance.login();
      if (result.status != LoginStatus.success) {
        state = state.copyWith(isLoading: false);
        return;
      }
      final token = result.accessToken?.tokenString;
      if (token == null) throw Exception('Facebook sign-in failed: no token');
      await _socialLogin(ApiConstants.socialFacebook, {'accessToken': token});
    } catch (e) {
      state = state.copyWith(isLoading: false, error: ApiClient.extractError(e));
    }
  }

  // ── loginWithApple ───────────────────────────────────────────────────────
  Future<void> loginWithApple() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );
      final identityToken = credential.identityToken;
      if (identityToken == null) throw Exception('Apple sign-in failed: no token');
      final nameParts = [credential.givenName, credential.familyName]
          .whereType<String>()
          .join(' ')
          .trim();
      await _socialLogin(ApiConstants.socialApple, {
        'identityToken': identityToken,
        if (nameParts.isNotEmpty) 'name': nameParts,
      });
    } catch (e) {
      state = state.copyWith(isLoading: false, error: ApiClient.extractError(e));
    }
  }

  // ── _socialLogin (shared helper) ─────────────────────────────────────────
  Future<void> _socialLogin(String endpoint, Map<String, dynamic> data) async {
    final response = await _api.post(endpoint, data: data);
    final resData = response.data['data'] as Map<String, dynamic>;
    final accessToken = resData['accessToken'] as String;
    final refreshToken = resData['refreshToken'] as String?;
    final user = UserModel.fromJson(resData['user'] as Map<String, dynamic>);

    await SecureStorage.saveTokens(accessToken: accessToken, refreshToken: refreshToken);
    await SecureStorage.saveUserInfo(id: user.id, role: user.role);
    await SecureStorage.saveGuestMode(false);

    state = state.copyWith(
      isLoading: false,
      isLoggedIn: true,
      isGuest: false,
      user: user,
      clearError: true,
    );
    _registerFcmToken();
  }

  // ── loginWithBiometric ───────────────────────────────────────────────────
  Future<void> loginWithBiometric() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final authenticated = await BiometricService.authenticate(
        reason: 'Login to City GYM',
      );
      if (!authenticated) {
        state = state.copyWith(isLoading: false);
        return;
      }
      // Reuse stored token — init() handles refresh if needed
      await init();
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: trv('Biometric authentication failed'),
      );
    }
  }

  // ── enableBiometric ──────────────────────────────────────────────────────
  Future<void> enableBiometric(bool enabled) =>
      SecureStorage.saveBiometricEnabled(enabled);

  // ── changePassword ────────────────────────────────────────────────────────
  Future<void> changePassword(String currentPassword, String newPassword) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _api.post(
        '/auth/change-password',
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );
      state = state.copyWith(isLoading: false, clearError: true);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ApiClient.extractError(e),
      );
      rethrow;
    }
  }
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(ApiClient()),
);

/// Convenience provider that exposes only the current user.
final currentUserProvider = Provider<UserModel?>(
  (ref) => ref.watch(authProvider).user,
);

/// Convenience provider for guest state.
final isGuestProvider = Provider<bool>(
  (ref) => ref.watch(authProvider).isGuest,
);
