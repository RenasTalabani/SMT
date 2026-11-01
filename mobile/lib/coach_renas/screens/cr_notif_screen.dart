// Messages & reminders: the coach's messages (server inbox) + the phone
// reminders (cr_reminders.dart), in the Coach Renas design.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/notification_provider.dart';
import '../cr_core.dart';
import '../cr_reminders.dart';

class CrNotifScreen extends ConsumerStatefulWidget {
  const CrNotifScreen({super.key});
  @override
  ConsumerState<CrNotifScreen> createState() => _CrNotifScreenState();
}

class _CrNotifScreenState extends ConsumerState<CrNotifScreen> {
  final rem = CrReminders.instance;

  @override
  void initState() {
    super.initState();
    rem.addListener(_changed);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        ref.read(notificationProvider.notifier).fetchNotifications();
      } catch (_) {}
    });
  }

  @override
  void dispose() {
    rem.removeListener(_changed);
    super.dispose();
  }

  void _changed() => setState(() {});

  static const _meta = <String, List<Object>>{
    'workout': [Icons.fitness_center_rounded, 'تذكير التمرين', 'Workout reminder', 'بیرخستنەوەی ڕاهێنان', 'بأيام تمرينك', 'On your training days', 'لە ڕۆژانی ڕاهێنانت'],
    'water': [Icons.water_drop_outlined, 'شرب الماي', 'Drink water', 'ئاو خواردنەوە', '4 مرات باليوم', '4 times a day', '4 جار لە ڕۆژێکدا'],
    'food': [Icons.restaurant_rounded, 'سجّل أكلك', 'Log your food', 'خواردنەکەت تۆمار بکە', 'مرة باليوم', 'Once a day', 'ڕۆژانە جارێک'],
    'checkin': [Icons.assignment_outlined, 'التقرير الأسبوعي', 'Weekly check-in', 'ڕاپۆرتی هەفتانە', 'كل جمعة', 'Every Friday', 'هەموو هەینییەک'],
    'sleep': [Icons.bedtime_outlined, 'وقت النوم', 'Bedtime', 'کاتی خەو', '7–9 ساعات نوم', '7–9 hours of sleep', '7–9 کاتژمێر خەو'],
    'supps': [Icons.medication_outlined, 'المكملات', 'Supplements', 'تەواوکەرەکان', 'كرياتين أو مكملاتك اليومية', 'Creatine or your daily supplements', 'کرێاتین یان تەواوکەرە ڕۆژانەکانت'],
    'tip': [Icons.lightbulb_outline_rounded, 'نصيحة اليوم', 'Tip of the day', 'ئامۆژگاریی ئەمڕۆ', 'من الكوتش', 'From the coach', 'لە کۆچەوە'],
    'ramadan': [Icons.nightlight_round, 'السحور (رمضان)', 'Suhoor (Ramadan)', 'پارشێو (ڕەمەزان)', 'شغّله برمضان بس', 'Turn on during Ramadan only', 'تەنها لە ڕەمەزاندا هەڵیبکە'],
  };

  String _t(List<Object> m, int i) => tr3(m[i] as String, m[i + 1] as String, m[i + 2] as String);

  Future<void> _pickTime(String k, int i) async {
    final cur = rem.time(k, i).split(':');
    final t = await showTimePicker(context: context, initialTime: TimeOfDay(hour: int.parse(cur[0]), minute: int.parse(cur[1])));
    if (t == null) return;
    final list = [...rem.times(k)];
    list[i] = '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
    await rem.update(k, times: list);
  }

  @override
  Widget build(BuildContext context) {
    final inbox = ref.watch(notificationProvider);
    final dayNames = <int, String>{6: tr3('سبت', 'Sat', 'شەممە'), 7: tr3('أحد', 'Sun', 'یەکشەممە'), 1: tr3('اثنين', 'Mon', 'دووشەممە'), 2: tr3('ثلاثاء', 'Tue', 'سێشەممە'), 3: tr3('أربعاء', 'Wed', 'چوارشەممە'), 4: tr3('خميس', 'Thu', 'پێنجشەممە'), 5: tr3('جمعة', 'Fri', 'هەینی')};
    return CrPage(
      title: tr3('الرسائل والتذكيرات', 'Messages & reminders', 'نامە و بیرخستنەوەکان'),
      sub: tr3('رسائل الكوتش وتذكيرات تمرينك وأكلك', 'Coach messages and your training & food reminders', 'نامەکانی کۆچ و بیرخستنەوەی ڕاهێنان و خواردن'),
      children: [
        Text(tr3('رسائل الكوتش', 'From your coach', 'لە کۆچەوە'), style: crH3),
        if (inbox.isLoading && inbox.notifications.isEmpty)
          const Center(child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(color: CrColors.teal)))
        else if (inbox.notifications.isEmpty)
          CrCard(child: Text(tr3('ماكو رسائل بعد. لما الكوتش يرد على تقريرك أو يأكد دفعتك أو يشحن طلبك، توصلك هنا.', 'No messages yet. When the coach answers your check-in, confirms a payment or ships your order, it shows here.', 'هێشتا هیچ نامەیەک نییە. کاتێک کۆچ وەڵامی ڕاپۆرتەکەت دەداتەوە، پارەدانەکەت پشتڕاست دەکاتەوە یان داواکارییەکەت دەنێرێت، لێرە دەردەکەوێت.'), style: crMuted))
        else
          CrList([
            for (final n in inbox.notifications.take(20))
              CrRow(
                icon: n.isRead ? Icons.mark_email_read_outlined : Icons.mark_email_unread_outlined,
                iconColor: n.isRead ? CrColors.muted : CrColors.teal,
                title: n.title,
                sub: n.message,
                onTap: n.isRead ? null : () => ref.read(notificationProvider.notifier).markRead(n.id),
                trailing: const SizedBox.shrink(),
              ),
          ]),
        Row(children: [
          Expanded(child: Text(tr3('تذكيرات على موبايلك', 'Reminders on your phone', 'بیرخستنەوە لەسەر مۆبایلەکەت'), style: crH3)),
          TextButton.icon(
            onPressed: () => rem.test(),
            icon: const Icon(Icons.notifications_active_outlined, color: CrColors.teal, size: 18),
            label: Text(tr3('جرّب', 'Test', 'تاقیکردنەوە'), style: const TextStyle(color: CrColors.teal, fontWeight: FontWeight.w700)),
          ),
        ]),
        Text(tr3('تشتغل بدون إنترنت. غيّر الوقت بالضغط عليه.', 'They work without internet. Tap a time to change it.', 'بەبێ ئینتەرنێت کار دەکەن. دەست لە کاتەکە بدە بۆ گۆڕین.'), style: crSmall),
        for (final r in CrReminders.all)
          CrCard(
            padding: 12,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Icon(_meta[r.key]![0] as IconData, color: rem.isOn(r.key) ? CrColors.teal : CrColors.muted, size: 22),
                const SizedBox(width: 10),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(_t(_meta[r.key]!, 1), style: crH3.copyWith(fontSize: 15)),
                  Text(_t(_meta[r.key]!, 4), style: crSmall),
                ])),
                Switch(
                  value: rem.isOn(r.key),
                  activeThumbColor: CrColors.teal,
                  onChanged: (v) async {
                    if (v) await rem.requestPermission();
                    await rem.update(r.key, on: v);
                  },
                ),
              ]),
              if (rem.isOn(r.key)) ...[
                const SizedBox(height: 6),
                Wrap(spacing: 6, runSpacing: 6, children: [
                  for (var i = 0; i < rem.times(r.key).length; i++)
                    CrChip('⏰ ${rem.time(r.key, i)}', on: true, light: false, onTap: () => _pickTime(r.key, i)),
                ]),
                if (r.days != null) ...[
                  const SizedBox(height: 6),
                  Wrap(spacing: 6, runSpacing: 6, children: [
                    for (final d in [6, 7, 1, 2, 3, 4, 5])
                      CrChip(dayNames[d]!, on: rem.days(r.key).contains(d), onTap: () {
                        final ds = [...rem.days(r.key)];
                        ds.contains(d) ? ds.remove(d) : ds.add(d);
                        if (ds.isNotEmpty) rem.update(r.key, days: ds);
                      }),
                  ]),
                ],
              ],
            ]),
          ),
      ],
    );
  }
}
