import 'package:easy_localization/easy_localization.dart';

/// Translates a data value (an English word the app also sends to the
/// server, e.g. a category or goal) for display only.
/// Looks up the key `v_<value_slug>`; falls back to the value itself.
String trv(String value) {
  final slug = value
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]+'), '_')
      .replaceAll(RegExp(r'^_+|_+$'), '');
  final key = 'v_$slug';
  final t = key.tr();
  if (t == key) return value.isEmpty ? value : value[0].toUpperCase() + value.substring(1);
  return t;
}
