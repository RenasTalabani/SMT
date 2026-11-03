// Coach Renas reminders: local notifications scheduled on the phone (no server,
// no internet needed). Workout days, water, food log, weekly check-in, sleep,
// supplements, tip of the day and Ramadan (suhoor). Settings are kept on the phone.
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

import 'cr_core.dart';

class CrReminder {
  const CrReminder(this.key, this.id, this.times, {this.days, this.onByDefault = true});
  final String key; // settings key
  final int id; // base notification id
  final List<String> times; // default "HH:MM" list
  final List<int>? days; // default weekdays (1=Mon … 7=Sun); null = every day
  final bool onByDefault;
}

class CrReminders extends ChangeNotifier {
  CrReminders._();
  static final CrReminders instance = CrReminders._();

  static const _prefsKey = 'coach_renas_reminders_v1';
  static const _planKey = 'coach_renas_plan_v1';

  /// Dated reminders sent by the plan page: {d: "YYYY-MM-DD", kind: "day"|"miss", t, b}.
  List<Map<String, dynamic>> plan = [];
  static const all = <CrReminder>[
    CrReminder('workout', 100, ['18:00'], days: [6, 1, 3]), // Sat, Mon, Wed
    CrReminder('water', 200, ['11:00', '14:00', '17:00', '20:00']),
    CrReminder('food', 300, ['15:00']),
    CrReminder('checkin', 400, ['11:00'], days: [5]), // Friday
    CrReminder('sleep', 500, ['23:00']),
    CrReminder('supps', 600, ['09:00'], onByDefault: false),
    CrReminder('tip', 700, ['10:00']),
    CrReminder('ramadan', 800, ['03:15'], onByDefault: false),
  ];

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  bool _ready = false;
  Map<String, dynamic> settings = {};

  bool isOn(String k) => (settings[k]?['on'] as bool?) ?? all.firstWhere((r) => r.key == k).onByDefault;
  String time(String k, [int i = 0]) {
    final r = all.firstWhere((r) => r.key == k);
    final t = (settings[k]?['times'] as List?)?.cast<String>() ?? r.times;
    return i < t.length ? t[i] : r.times[i];
  }
  List<String> times(String k) => (settings[k]?['times'] as List?)?.cast<String>() ?? all.firstWhere((r) => r.key == k).times;
  List<int> days(String k) => (settings[k]?['days'] as List?)?.cast<int>() ?? all.firstWhere((r) => r.key == k).days ?? [1, 2, 3, 4, 5, 6, 7];

  /// Call once at app start. Never throws (tests / desktop have no plugin).
  Future<void> init() async {
    try {
      tzdata.initializeTimeZones();
      tz.setLocalLocation(tz.getLocation('Asia/Baghdad'));
      await _plugin.initialize(const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(requestAlertPermission: false, requestBadgePermission: false, requestSoundPermission: false),
      ));
      final p = await SharedPreferences.getInstance();
      final raw = p.getString(_prefsKey);
      if (raw != null) settings = Map<String, dynamic>.from(jsonDecode(raw) as Map);
      final pr = p.getString(_planKey);
      if (pr != null) plan = (jsonDecode(pr) as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
      _ready = true;
    } catch (_) {
      _ready = false;
    }
  }

  Future<bool> requestPermission() async {
    if (!_ready) return false;
    try {
      final a = await _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()?.requestNotificationsPermission();
      final i = await _plugin.resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>()?.requestPermissions(alert: true, badge: true, sound: true);
      return (a ?? true) && (i ?? true);
    } catch (_) {
      return false;
    }
  }

  Future<void> update(String k, {bool? on, List<String>? times, List<int>? days}) async {
    final m = Map<String, dynamic>.from((settings[k] as Map?) ?? {});
    if (on != null) m['on'] = on;
    if (times != null) m['times'] = times;
    if (days != null) m['days'] = days;
    settings[k] = m;
    notifyListeners();
    try {
      final p = await SharedPreferences.getInstance();
      await p.setString(_prefsKey, jsonEncode(settings));
    } catch (_) {}
    await reschedule();
  }

  /// The plan page sends the coming training days. Replaces the old ones.
  Future<void> setPlan(List items) async {
    plan = items.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    try {
      final p = await SharedPreferences.getInstance();
      final had = p.getBool('coach_renas_plan_asked') ?? false;
      await p.setString(_planKey, jsonEncode(plan));
      if (!had && plan.isNotEmpty) {
        await p.setBool('coach_renas_plan_asked', true);
        await requestPermission();
      }
    } catch (_) {}
    await reschedule();
  }

  // Texts in the app's language at the moment of scheduling.
  List<String> _text(String k, int i) {
    switch (k) {
      case 'workout':
        return [tr3('وقت التمرين 💪', 'Workout time 💪', 'کاتی ڕاهێنانە 💪'), tr3('اليوم يوم تمرين. افتح التطبيق وشوف سِت القمة مالتك.', "It's a training day. Open the app to see today's top set.", 'ئەمڕۆ ڕۆژی ڕاهێنانە. ئەپەکە بکەرەوە و سێتی لووتکەت ببینە.')];
      case 'water':
        return [tr3('اشرب ماي 💧', 'Drink water 💧', 'ئاو بخۆرەوە 💧'), tr3('كوب ماي هسه. بحر العراق يحتاج 3 لتر باليوم أو أكثر.', 'Have a glass of water now. In the Iraqi heat aim for 3 litres a day or more.', 'ئێستا پەرداخێک ئاو. لە گەرمای عێراقدا ڕۆژانە 3 لیتر یان زیاتر.')];
      case 'food':
        return [tr3('سجّل أكلك 🍽️', 'Log your food 🍽️', 'خواردنەکەت تۆمار بکە 🍽️'), tr3('شكد بروتين أكلت اليوم؟ سجّل وجباتك حتى توصل هدفك.', 'How much protein so far? Log your meals to hit your target.', 'تا ئێستا چەند پرۆتینت خواردووە؟ ژەمەکانت تۆمار بکە.')];
      case 'checkin':
        return [tr3('التقرير الأسبوعي 📋', 'Weekly check-in 📋', 'ڕاپۆرتی هەفتانە 📋'), tr3('دقيقتين: وزنك ونومك وطاقتك. الكوتش يقراه ويرد عليك.', 'Two minutes: weight, sleep and energy. Your coach reads it and replies.', 'دوو خولەک: کێش، خەو و وزە. کۆچ دەیخوێنێتەوە و وەڵام دەداتەوە.')];
      case 'sleep':
        return [tr3('وقت النوم 😴', 'Time to sleep 😴', 'کاتی خەوە 😴'), tr3('العضل ينبني وإنت نايم. 7–9 ساعات نوم.', 'Muscle is built while you sleep. Aim for 7–9 hours.', 'ماسولکە لە کاتی خەودا دروست دەبێت. 7–9 کاتژمێر.')];
      case 'supps':
        return [tr3('مكملاتك 💊', 'Your supplements 💊', 'تەواوکەرەکانت 💊'), tr3('لا تنسى الكرياتين أو مكملاتك اليومية ويه كوب ماي.', "Don't forget your creatine or daily supplements, with a glass of water.", 'کرێاتین یان تەواوکەرە ڕۆژانەکانت لەبیر مەکە، لەگەڵ پەرداخێک ئاو.')];
      case 'tip':
        return [tr3('نصيحة اليوم من الكوتش', "Coach's tip of the day", 'ئامۆژگاریی ئەمڕۆی کۆچ'), tr3('نصيحة جديدة تنتظرك بالتطبيق.', 'A new tip is waiting for you in the app.', 'ئامۆژگارییەکی نوێ لە ئەپدا چاوەڕێتە.')];
      case 'ramadan':
        return [tr3('السحور 🌙', 'Suhoor 🌙', 'پارشێو 🌙'), tr3('سحور فيه بروتين وماي هواية: بيض، لبن، تمر. وتمرينك بعد الفطور بساعتين.', 'Suhoor with protein and plenty of water: eggs, yogurt, dates. Train two hours after iftar.', 'پارشێو بە پرۆتین و ئاوی زۆر: هێلکە، ماست، خورما. دوو کاتژمێر دوای بەربانگ ڕاهێنان بکە.')];
    }
    return ['Coach Renas', ''];
  }

  NotificationDetails get _details => const NotificationDetails(
        android: AndroidNotificationDetails('cr_reminders', 'Reminders', channelDescription: 'Coach Renas reminders: workout, water, food, sleep, check-in', importance: Importance.defaultImportance, priority: Priority.defaultPriority, color: CrColors.teal),
        iOS: DarwinNotificationDetails(),
      );

  /// Cancel everything we own and schedule again from the settings.
  Future<void> reschedule() async {
    if (!_ready) return;
    try {
      for (final r in all) {
        for (var i = 0; i < 40; i++) {
          await _plugin.cancel(r.id + i);
        }
      }
      for (var i = 0; i < 60; i++) {
        await _plugin.cancel(2000 + i);
      }
      final now = tz.TZDateTime.now(tz.local);
      // Plan reminders: training-day nudge at the workout time, and a kind
      // "you missed yesterday" message the next morning (sent only for days
      // not yet logged; the page resends after every workout).
      final hasPlan = plan.isNotEmpty;
      if (hasPlan && isOn('workout')) {
        final wt = time('workout').split(':');
        final wh = int.tryParse(wt[0]) ?? 18, wm = int.tryParse(wt.length > 1 ? wt[1] : '0') ?? 0;
        var n = 0;
        for (final it in plan) {
          if (n >= 60) break;
          final ds = (it['d'] as String? ?? '').split('-');
          if (ds.length != 3) continue;
          final miss = it['kind'] == 'miss';
          final at = tz.TZDateTime(tz.local, int.parse(ds[0]), int.parse(ds[1]), int.parse(ds[2]), miss ? 10 : wh, miss ? 0 : wm);
          if (!at.isAfter(now)) continue;
          await _plugin.zonedSchedule(2000 + n, it['t'] as String? ?? 'Coach Renas', it['b'] as String? ?? '', at, _details,
              androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
              uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime);
          n++;
        }
      }
      for (final r in all) {
        if (!isOn(r.key)) continue;
        if (hasPlan && r.key == 'workout') continue; // the plan's own days replace the fixed ones
        final ts = times(r.key);
        final everyDay = r.days == null;
        for (var ti = 0; ti < ts.length; ti++) {
          final hm = ts[ti].split(':');
          final h = int.tryParse(hm[0]) ?? 9, m = int.tryParse(hm.length > 1 ? hm[1] : '0') ?? 0;
          final txt = _text(r.key, ti);
          if (everyDay) {
            var d = tz.TZDateTime(tz.local, now.year, now.month, now.day, h, m);
            if (!d.isAfter(now)) d = d.add(const Duration(days: 1));
            await _plugin.zonedSchedule(r.id + ti, txt[0], txt[1], d, _details,
                androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
                uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
                matchDateTimeComponents: DateTimeComponents.time);
          } else {
            for (final wd in days(r.key)) {
              var d = tz.TZDateTime(tz.local, now.year, now.month, now.day, h, m);
              while (d.weekday != wd || !d.isAfter(now)) {
                d = d.add(const Duration(days: 1));
              }
              await _plugin.zonedSchedule(r.id + ti * 10 + wd, txt[0], txt[1], d, _details,
                  androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
                  uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
                  matchDateTimeComponents: DateTimeComponents.dayOfWeekAndTime);
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Coach Renas reminders: $e');
    }
  }

  String? _schedLang;

  /// Re-schedule once per language so the reminder texts match the app language.
  void syncLanguage() {
    if (!_ready || _schedLang == CrI18n.lang) return;
    _schedLang = CrI18n.lang;
    reschedule();
  }

  Future<void> test() async {
    if (!_ready) return;
    await requestPermission();
    try {
      await _plugin.show(999, tr3('مع الكوتش ريناس', 'Coach Renas', 'لەگەڵ کۆچ ڕێناس'), tr3('الإشعارات تشتغل ✅', 'Notifications are working ✅', 'ئاگادارکردنەوەکان کار دەکەن ✅'), _details);
    } catch (_) {}
  }
}
