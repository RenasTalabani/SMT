// Coach Renas — server calls (backend: /api/coach-renas, see
// backend/src/modules/coach-renas). Every call fails soft: screens fall back
// to the built-in price list / local data when the server can't be reached.
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/network/api_client.dart';

class CrApi {
  CrApi._();
  static final _c = ApiClient();
  static const _b = '/coach-renas';

  static Map<String, dynamic> _data(dynamic res) {
    final body = res.data;
    if (body is Map && body['data'] is Map) return Map<String, dynamic>.from(body['data'] as Map);
    return const {};
  }

  static String error(Object e) => ApiClient.extractError(e);

  static Future<Map<String, dynamic>> plans() async => _data(await _c.get('$_b/plans'));
  static Future<Map<String, dynamic>> me() async => _data(await _c.get('$_b/me'));
  static Future<Map<String, dynamic>> startTrial() async => _data(await _c.post('$_b/trial'));
  static Future<Map<String, dynamic>> purchase(Map<String, dynamic> body) async => _data(await _c.post('$_b/purchase', data: body));
  static Future<Map<String, dynamic>> saveProfile(Map<String, dynamic> body) async => _data(await _c.put('$_b/profile', data: body));
  static Future<Map<String, dynamic>> sendCheckIn(Map<String, dynamic> body) async => _data(await _c.post('$_b/checkins', data: body));
  static Future<List<dynamic>> myCheckIns() async => (_data(await _c.get('$_b/checkins/me'))['checkIns'] as List?) ?? const [];

  // coach panel
  static Future<Map<String, dynamic>> panelSummary() async => _data(await _c.get('$_b/panel/summary'));
  static Future<List<dynamic>> panelClients() async => (_data(await _c.get('$_b/panel/clients'))['clients'] as List?) ?? const [];
  static Future<Map<String, dynamic>> panelClient(String id) async => _data(await _c.get('$_b/panel/clients/$id'));
  static Future<Map<String, dynamic>> panelUpdateClient(String id, Map<String, dynamic> body) async => _data(await _c.put('$_b/panel/clients/$id', data: body));
  static Future<List<dynamic>> panelPayments([String status = 'pending']) async =>
      (_data(await _c.get('$_b/panel/payments', params: {'status': status}))['payments'] as List?) ?? const [];
  static Future<Map<String, dynamic>> panelDecide(String id, String decision) async =>
      _data(await _c.patch('$_b/panel/payments/$id', data: {'decision': decision}));
  static Future<Map<String, dynamic>> panelReply(String checkInId, String reply) async =>
      _data(await _c.post('$_b/panel/checkins/$checkInId/reply', data: {'reply': reply}));
  static Future<List<dynamic>> contentList() async => (_data(await _c.get('$_b/panel/content'))['items'] as List?) ?? const [];
  static Future<Map<String, dynamic>> contentAdd(Map<String, dynamic> body) async => _data(await _c.post('$_b/panel/content', data: body));
  static Future<Map<String, dynamic>> contentUpdate(String id, Map<String, dynamic> body) async => _data(await _c.put('$_b/panel/content/$id', data: body));
  static Future<void> contentDelete(String id) async => _c.delete('$_b/panel/content/$id');
}

/// Built-in copy of backend/src/modules/coach-renas/plans.js — used when the
/// server is offline so the price screen never shows empty. Keep in sync.
const Map<String, dynamic> kCrPlansFallback = {
  'currency': 'IQD',
  'freeTrialDays': 7,
  'tiers': [
    {
      'key': 'training',
      'name': {'ar': 'التمرين', 'ku': 'ڕاهێنان', 'en': 'Training'},
      'includes': {
        'ar': 'برامج التمرين، سجل التمارين، مكتبة التمارين كاملة بالحركة، الجسم 3D',
        'ku': 'پرۆگرامەکانی ڕاهێنان، تۆماری ڕاهێنان، کتێبخانەی تەواوی ڕاهێنانەکان بە جووڵە، جەستەی 3D',
        'en': 'Training programs, workout log, full exercise library with animations, 3D body',
      },
      'prices': {'m1': 7500, 'm3': 19500, 'm12': 59000},
    },
    {
      'key': 'food',
      'name': {'ar': 'التمرين + الأكل', 'ku': 'ڕاهێنان + خواردن', 'en': 'Training + Food'},
      'includes': {
        'ar': 'كل شي بالتمرين، وخطط أكل، حساب السعرات، دليل الأكل، موسوعة المكملات كاملة',
        'ku': 'هەموو شتێکی ڕاهێنان، لەگەڵ پلانی خواردن، ژماردنی کالۆری، ڕێبەری خواردن، ئینسایکلۆپیدیای تەواوی تەواوکەرەکان',
        'en': 'Everything in Training, plus meal plans, calorie tracking, food guide, full supplement encyclopedia',
      },
      'prices': {'m1': 15000, 'm3': 39000, 'm12': 109000},
    },
    {
      'key': 'all',
      'highlight': true,
      'name': {'ar': 'كل شي (All-Access)', 'ku': 'هەموو شت (All-Access)', 'en': 'All-Access'},
      'includes': {
        'ar': 'كل شي، والمدرب الذكي، كل الكورسات الخاصة، خصم 10% بالمتجر، جلسة أسئلة شهرية ويه الكوتش',
        'ku': 'هەموو شت، لەگەڵ ڕاهێنەری زیرەک، هەموو کۆرسە تایبەتەکان، 10% داشکاندن لە فرۆشگا، دانیشتنی پرسیاری مانگانە لەگەڵ کۆچ',
        'en': 'Everything, plus the AI coach, all special courses, 10% off the shop, a monthly group Q&A with the coach',
      },
      'prices': {'m1': 22500, 'm3': 59000, 'm12': 159000},
    },
  ],
  'programs': [
    {'key': 'fatloss', 'weeks': 8, 'price': 25000, 'name': {'ar': 'خسارة الدهون', 'ku': 'کەمکردنەوەی چەوری', 'en': 'Fat loss'}},
    {'key': 'muscle', 'weeks': 10, 'price': 32000, 'name': {'ar': 'بناء العضل', 'ku': 'دروستکردنی ماسولکە', 'en': 'Muscle building'}},
    {'key': 'transform', 'weeks': 12, 'price': 39000, 'name': {'ar': 'تحول كامل', 'ku': 'گۆڕانی تەواو', 'en': 'Full transformation'}},
    {'key': 'ramadan', 'weeks': 4, 'price': 15000, 'name': {'ar': 'برنامج رمضان', 'ku': 'پرۆگرامی ڕەمەزان', 'en': 'Ramadan program'}},
    {'key': 'women-home', 'weeks': 6, 'price': 20000, 'name': {'ar': 'النساء بالبيت', 'ku': 'ئافرەتان لە ماڵەوە', 'en': 'Women at home'}},
    {'key': 'beginner', 'weeks': 6, 'price': 20000, 'name': {'ar': 'مبتدئ من الصفر', 'ku': 'سەرەتایی لە سفرەوە', 'en': 'Total beginner'}},
    {'key': 'football', 'weeks': 8, 'price': 25000, 'name': {'ar': 'لاعبين كرة القدم', 'ku': 'یاریزانانی تۆپی پێ', 'en': 'Football players'}},
  ],
  'coaching': {
    'key': 'coaching',
    'name': {'ar': 'تدريب شخصي 1-على-1 ويه الكوتش ريناس', 'ku': 'ڕاهێنانی تایبەتی 1-بۆ-1 لەگەڵ کۆچ ڕێناس', 'en': '1-on-1 coaching with Coach Renas'},
    'includes': {
      'ar': 'برنامج وسعرات وبروتين خاص إلك، تقرير أسبوعي ومراجعة فيديوهات التكنيك، دردشة ويه الكوتش، و All-Access مجاناً',
      'ku': 'پرۆگرام و کالۆری و پرۆتینی تایبەت بە تۆ، ڕاپۆرتی هەفتانە و پێداچوونەوەی ڤیدیۆی تەکنیک، چات لەگەڵ کۆچ، و All-Access بەخۆڕایی',
      'en': 'A custom program and calorie/protein targets, weekly check-in and form-video review, chat with the coach, All-Access included',
    },
    'prices': {'m1': 100000, 'm3': 270000, 'm6': 510000},
    'spots': 40,
  },
};

final crPlansProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  try {
    final p = await CrApi.plans();
    if (p['tiers'] is List) return p;
  } catch (_) {}
  return kCrPlansFallback;
});

final crMeProvider = FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  try {
    return await CrApi.me();
  } catch (_) {
    return null; // guest or offline
  }
});
