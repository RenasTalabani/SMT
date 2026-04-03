import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _accessToken = 'access_token';
  static const _refreshToken = 'refresh_token';
  static const _userId = 'user_id';
  static const _userRole = 'user_role';
  static const _biometricEnabled = 'biometric_enabled';
  static const _guestMode = 'guest_mode';

  static Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    await _storage.write(key: _accessToken, value: accessToken);
    if (refreshToken != null) {
      await _storage.write(key: _refreshToken, value: refreshToken);
    }
  }

  static Future<String?> getAccessToken() => _storage.read(key: _accessToken);
  static Future<String?> getRefreshToken() => _storage.read(key: _refreshToken);

  static Future<void> saveUserInfo({required String id, required String role}) async {
    await _storage.write(key: _userId, value: id);
    await _storage.write(key: _userRole, value: role);
  }

  static Future<String?> getUserId() => _storage.read(key: _userId);
  static Future<String?> getUserRole() => _storage.read(key: _userRole);

  static Future<void> saveBiometricEnabled(bool enabled) =>
      _storage.write(key: _biometricEnabled, value: enabled.toString());

  static Future<bool> getBiometricEnabled() async {
    final val = await _storage.read(key: _biometricEnabled);
    return val == 'true';
  }

  static Future<void> saveGuestMode(bool enabled) =>
      _storage.write(key: _guestMode, value: enabled.toString());

  static Future<bool> isGuestMode() async {
    final val = await _storage.read(key: _guestMode);
    return val == 'true';
  }

  static Future<void> clearAll() async => _storage.deleteAll();
}
