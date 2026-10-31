import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/widgets.dart';

/// Formats a date in the app language (English, Arabic or Kurdish Sorani).
/// intl has no Kurdish date data, so for Kurdish the English names are
/// swapped for the Sorani month/day names used in Iraqi Kurdistan.
String fmtDate(BuildContext context, DateTime d, String pattern) {
  final lang = context.locale.languageCode;
  if (lang == 'ar') {
    try {
      return DateFormat(pattern, 'ar').format(d);
    } catch (_) {/* date data not loaded: fall through */}
  }
  final en = DateFormat(pattern, 'en').format(d);
  if (lang != 'ku') return en;
  return kurdishDate(en);
}

const _kuMonths = {
  'January': 'کانوونی دووەم', 'February': 'شوبات', 'March': 'ئازار', 'April': 'نیسان', 'May': 'ئایار', 'June': 'حوزەیران',
  'July': 'تەمموز', 'August': 'ئاب', 'September': 'ئەیلوول', 'October': 'تشرینی یەکەم', 'November': 'تشرینی دووەم', 'December': 'کانوونی یەکەم',
};
const _kuDays = {
  'Sunday': 'یەکشەممە', 'Monday': 'دووشەممە', 'Tuesday': 'سێشەممە', 'Wednesday': 'چوارشەممە', 'Thursday': 'پێنجشەممە', 'Friday': 'هەینی', 'Saturday': 'شەممە',
};

/// Replace English month/day names (full or 3-letter) and AM/PM with Kurdish.
String kurdishDate(String en) {
  var out = en;
  for (final m in _kuMonths.entries) {
    out = out.replaceAll(m.key, m.value).replaceAll(RegExp('\\b${m.key.substring(0, 3)}\\b'), m.value);
  }
  for (final d in _kuDays.entries) {
    out = out.replaceAll(d.key, d.value).replaceAll(RegExp('\\b${d.key.substring(0, 3)}\\b'), d.value);
  }
  return out.replaceAll('AM', 'پ.ن').replaceAll('PM', 'د.ن');
}
