import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Caches API GET responses in SharedPreferences as JSON strings.
/// Keys are derived from the request path + sorted query parameters.
class CacheService {
  static const _prefix = 'api_cache_';

  static String keyFor(String path, Map<String, dynamic>? params) {
    if (params == null || params.isEmpty) return '$_prefix$path';
    final sorted = (params.entries.toList()
          ..sort((a, b) => a.key.compareTo(b.key)))
        .map((e) => '${e.key}=${e.value}')
        .join('&');
    return '$_prefix${path}_$sorted';
  }

  static Future<void> set(String key, dynamic data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(key, jsonEncode(data));
    } catch (_) {}
  }

  static Future<dynamic> get(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(key);
      if (raw == null) return null;
      return jsonDecode(raw);
    } catch (_) {
      return null;
    }
  }

  static Future<void> clear(String key) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(key);
  }

  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys().where((k) => k.startsWith(_prefix)).toList();
    for (final k in keys) {
      await prefs.remove(k);
    }
  }
}
