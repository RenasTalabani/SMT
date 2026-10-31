// Coach Renas — account side: Me (14), subscription & prices (pricing doc),
// onboarding questions, weekly check-in, privacy, delete account.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../providers/auth_provider.dart';
import '../cr_api.dart';
import '../cr_core.dart';
import '../cr_shell.dart';

// ─────────────────────────── 14 · Me / progress ────────────────────────────
class CrMeScreen extends ConsumerWidget {
  const CrMeScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final name = auth.user?.name ?? tr3('ضيف', 'Guest', 'میوان');
    final me = ref.watch(crMeProvider).valueOrNull;
    final isCoach = me?['isCoach'] == true || auth.user?.isCoach == true || auth.user?.isAdmin == true;
    return CrLoader(builder: (context, d, st) {
      final lifts = d.map('LIFTS');
      final h = st.hist.where((x) => x['l'] == 'bench').toList();
      final pts = h.map((x) => e1rm(x['w'] as num, x['r'] as num)).toList();
      final first = pts.isEmpty ? 0.0 : pts.first, last = pts.isEmpty ? 0.0 : pts.last;
      final hasEx = h.any((x) => x['ex'] == true);
      final access = me?['access'] as Map?;
      final subLine = access == null
          ? T('برنامج القوة · طريقة الكوتش')
          : access['coaching'] == true
              ? T('تدريب شخصي 1-على-1')
              : access['tier'] != null
                  ? '${T('مشترك')} · ${access['tier']}'
                  : T('ما عندك اشتراك فعّال');
      return CrPage(
        title: T('حسابي'),
        actions: const [CrLangButton()],
        children: [
          Row(children: [
            CircleAvatar(radius: 29, backgroundColor: CrColors.teal, child: Text(name.isEmpty ? 'م' : name.characters.first, style: crH1(24).copyWith(color: CrColors.tealInk))),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              Text(subLine, style: crMuted),
            ])),
          ]),
          if (pts.isNotEmpty)
            CrCard(
              radius: 22,
              border: CrColors.line2,
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
                Row(children: [
                  Expanded(child: Text(T('أقصى رفعة مقدّرة · بنچ'), style: crMuted)),
                  CrTag('${last - first >= 0 ? '+' : ''}${(last - first).toStringAsFixed(1)} ${kg()}'),
                ]),
                Text('${num1((last * 2).round() / 2)} ${kg()}', style: crH1(30)),
                SizedBox(height: 90, width: double.infinity, child: CustomPaint(painter: _LinePainter(pts))),
                Row(children: [
                  Text(h.first['d'].toString(), style: crSmall, textDirection: TextDirection.ltr),
                  const Spacer(),
                  Text(h.last['d'].toString(), style: crSmall, textDirection: TextDirection.ltr),
                ]),
                if (hasEx) Text(T('أول 5 نقاط أمثلة. تمارينك اللي تحفظها تنضاف هنا.'), style: crSmall),
              ], 8)),
            ),
          Row(children: [
            Expanded(child: CrStat('${h.where((x) => x['ex'] != true).length}', T('تمرين'))),
            const SizedBox(width: 10),
            Expanded(child: CrStat('${st.checkins.length}', T('التقرير الأسبوعي'))),
            const SizedBox(width: 10),
            Expanded(child: CrStat('${st.streak()}', T('أيام ورا بعض'), color: CrColors.amber)),
          ]),
          if (h.isNotEmpty) ...[
            Text(T('آخر التمارين'), style: crH3),
            CrList([
              for (final x in h.reversed.take(4))
                CrRow(
                  title: '${T(lifts[x['l']]['n'] as String)} · ${x['w']} ${kg()} × ${x['r']}',
                  sub: '${x['d']}${x['ex'] == true ? ' · ${T('مثال')}' : ''}',
                  trailing: Text(num1((e1rm(x['w'] as num, x['r'] as num) * 2).round() / 2), style: crH1(15)),
                ),
            ]),
          ],
          CrList([
            CrRow(icon: Icons.workspace_premium_outlined, title: T('اشتراكي'), onTap: () => context.push('/renas/plans')),
            CrRow(icon: Icons.menu_book_rounded, title: T('برنامجي'), onTap: () => context.push('/renas/program/${st.s['plan'] ?? 'str12'}')),
            CrRow(icon: Icons.fact_check_outlined, title: T('التقرير الأسبوعي'), onTap: () => context.push('/renas/checkin')),
            CrRow(icon: Icons.quiz_outlined, title: tr3('أسئلة البداية (هدفك وصحتك)', 'Start questions (goal and health)', 'پرسیارەکانی دەستپێک (ئامانج و تەندروستی)'), onTap: () => context.push('/renas/start')),
            if (isCoach) CrRow(icon: Icons.dashboard_customize_outlined, iconColor: CrColors.amber, title: T('لوحة الكوتش'), sub: T('إلك إنت، ريناس'), onTap: () => context.push('/renas/panel')),
            if (isCoach) CrRow(icon: Icons.campaign_outlined, iconColor: CrColors.amber, title: T('خطة المحتوى - ريناس'), onTap: () => context.push('/renas/content')),
            CrRow(
              icon: Icons.wb_sunny_outlined,
              title: T('وضع الصيف مفعّل'),
              trailing: Switch(
                value: st.mode['summer'] == true,
                activeThumbColor: CrColors.teal,
                onChanged: (v) {
                  st.s['mode'] = {...st.mode, 'summer': v, if (v) 'ramadan': false};
                  st.save();
                },
              ),
            ),
            CrRow(
              icon: Icons.nightlight_round,
              title: T('وضع رمضان مفعّل'),
              trailing: Switch(
                value: st.mode['ramadan'] == true,
                activeThumbColor: CrColors.teal,
                onChanged: (v) {
                  st.s['mode'] = {...st.mode, 'ramadan': v, if (v) 'summer': false};
                  st.save();
                },
              ),
            ),
            CrRow(icon: Icons.privacy_tip_outlined, title: T('الخصوصية وصوري'), sub: T('أنت تتحكم'), onTap: () => context.push('/renas/privacy')),
            CrRow(icon: Icons.delete_outline_rounded, iconColor: CrColors.red, titleColor: CrColors.red, title: T('احذف حسابي'), onTap: () => context.push('/renas/delete')),
            CrRow(icon: Icons.exit_to_app_rounded, title: tr3('رجوع لتطبيق City Gym', 'Back to City Gym', 'گەڕانەوە بۆ City Gym'), onTap: () => context.go('/client')),
          ]),
        ],
      );
    });
  }
}

class _LinePainter extends CustomPainter {
  _LinePainter(this.pts);
  final List<double> pts;
  @override
  void paint(Canvas canvas, Size size) {
    if (pts.isEmpty) return;
    final mn = pts.reduce((a, b) => a < b ? a : b) - 1, mx = pts.reduce((a, b) => a > b ? a : b) + 1;
    final grid = Paint()..color = CrColors.line..strokeWidth = 1;
    canvas.drawLine(Offset(0, size.height), Offset(size.width, size.height), grid);
    canvas.drawLine(Offset.zero, Offset(size.width, 0), grid);
    final path = Path();
    for (var i = 0; i < pts.length; i++) {
      final x = pts.length == 1 ? size.width : i / (pts.length - 1) * size.width;
      final y = size.height - (pts[i] - mn) / (mx - mn) * size.height;
      i == 0 ? path.moveTo(x, y) : path.lineTo(x, y);
    }
    final fill = Path.from(path)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(fill, Paint()..color = CrColors.teal.withValues(alpha: 0.12));
    canvas.drawPath(path, Paint()
      ..color = CrColors.teal
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round);
    final lx = size.width, ly = size.height - (pts.last - mn) / (mx - mn) * size.height;
    canvas.drawCircle(Offset(lx, ly), 5, Paint()..color = CrColors.teal);
  }

  @override
  bool shouldRepaint(covariant _LinePainter old) => old.pts != pts;
}

// ─────────────────────────── Subscription & prices ─────────────────────────
class CrPlansScreen extends ConsumerStatefulWidget {
  const CrPlansScreen({super.key});
  @override
  ConsumerState<CrPlansScreen> createState() => _CrPlansScreenState();
}

class _CrPlansScreenState extends ConsumerState<CrPlansScreen> {
  String period = 'm12';
  String coachPeriod = 'm1';
  String coachMethod = 'fib';
  bool busy = false;
  Map<String, dynamic>? lastPurchase;

  static const _periodName = {'m1': 'شهر', 'm3': '3 أشهر', 'm6': '6 أشهر', 'm12': 'سنة'};

  Future<void> _buy(Map<String, dynamic> body) async {
    final auth = ref.read(authProvider);
    if (!auth.isLoggedIn) {
      crToast(context, tr3('سجّل دخول أول حتى تشترك', 'Log in first to subscribe', 'سەرەتا بچۆ ژوورەوە بۆ بەشداربوون'));
      return;
    }
    setState(() => busy = true);
    try {
      final r = await CrApi.purchase(body);
      if (!mounted) return;
      setState(() => lastPurchase = r);
      ref.invalidate(crMeProvider);
      crToast(context, T('ينتظر تأكيد الكوتش'));
    } catch (e) {
      if (mounted) crToast(context, CrApi.error(e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _trial() async {
    setState(() => busy = true);
    try {
      await CrApi.startTrial();
      ref.invalidate(crMeProvider);
      if (mounted) crToast(context, tr3('بدت تجربتك المجانية', 'Your free trial started', 'تاقیکردنەوەی بەخۆڕاییت دەستی پێکرد'));
    } catch (e) {
      if (mounted) crToast(context, CrApi.error(e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final plans = ref.watch(crPlansProvider).valueOrNull ?? kCrPlansFallback;
    final me = ref.watch(crMeProvider).valueOrNull;
    final access = me?['access'] as Map?;
    final subs = ((me?['subscriptions'] as List?) ?? const []).cast<Map>();
    final tiers = (plans['tiers'] as List).cast<Map>();
    final coaching = Map<String, dynamic>.from(plans['coaching'] as Map);
    final programs = (plans['programs'] as List).cast<Map>();
    final isAndroid = Theme.of(context).platform == TargetPlatform.android;
    final storeMethod = isAndroid ? 'google_play' : 'apple';
    return CrLoader(builder: (context, d, st) {
      return CrPage(
        title: T('اشتراكي'),
        children: [
          CrCard(
            color: access?['tier'] != null ? CrColors.tealWash : CrColors.amberWash,
            border: access?['tier'] != null ? CrColors.tealLine : CrColors.amberLine,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(access?['tier'] != null ? T('اشتراكك فعّال') : T('ما عندك اشتراك فعّال'), style: crH3),
              Text(access?['tier'] != null ? '${access!['tier']}${access['coaching'] == true ? ' · ${T('تدريب شخصي 1-على-1')}' : ''}' : T('البرامج المفتوحة والتحدي المجاني متاحة إلك هسه.'), style: crMuted),
              if (access?['tier'] == null && me != null && !subs.any((s) => s['kind'] == 'trial')) ...[
                const SizedBox(height: 8),
                CrButton(tr3('جرّب كل شي مجاناً {n} أيام', 'Try everything free for {n} days', 'هەموو شت {n} ڕۆژ بەخۆڕایی تاقی بکەرەوە').replaceAll('{n}', '${plans['freeTrialDays'] ?? 7}'), kind: 'amber', height: 44, busy: busy, onTap: _trial),
              ],
            ]),
          ),
          // Period switch
          Row(children: [
            for (final p in ['m1', 'm3', 'm12'])
              Expanded(child: Padding(padding: const EdgeInsets.symmetric(horizontal: 3), child: CrChip(T(_periodName[p]!), on: period == p, light: false, onTap: () => setState(() => period = p)))),
          ]),
          if (period == 'm12') Text(tr3('السنة = حوالي 7 أشهر بسعر الشهر · توفّر 40%', 'A year costs about 7 months · save 40%', 'ساڵێک = نزیکەی 7 مانگ · 40% پاشەکەوت'), style: crSmall.copyWith(color: CrColors.teal)),
          for (final t in tiers)
            CrCard(
              border: t['highlight'] == true ? CrColors.teal : CrColors.line,
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
                Row(children: [
                  Expanded(child: Text(pickL(t['name']), style: crH3)),
                  if (t['highlight'] == true) CrTag(tr3('الأفضل', 'Best value', 'باشترین')),
                ]),
                Text(pickL(t['includes']), style: crMuted),
                Row(children: [
                  Expanded(child: Text('${fmt((t['prices'] as Map)[period] as num)} ${da()} / ${T(_periodName[period]!)}', style: crH1(20))),
                ]),
                CrButton(
                  isAndroid ? tr3('اشترك عن طريق Google Play', 'Subscribe with Google Play', 'بەشداربە لە ڕێگەی Google Play') : tr3('اشترك عن طريق App Store', 'Subscribe with the App Store', 'بەشداربە لە ڕێگەی App Store'),
                  height: 44,
                  kind: t['highlight'] == true ? 'teal' : 'ghost',
                  busy: busy,
                  onTap: () => _buy({'kind': 'tier', 'key': t['key'], 'period': period, 'method': storeMethod}),
                ),
              ], 8)),
            ),
          Text(tr3('الدفع داخل التطبيق يصير عن طريق Google Play أو App Store (ممكن من رصيد زين وآسياسيل). الربط الحقيقي ينتظر حساب التاجر.',
              'In-app payment goes through Google Play or the App Store (Zain and Asiacell phone credit possible). The real connection waits for the merchant account.',
              'پارەدان لەناو ئەپ لە ڕێگەی Google Play یان App Store دەبێت (بە باڵانسی زەین و ئاسیاسێڵ). بەستنەوەی ڕاستەقینە چاوەڕێی هەژماری بازرگان دەکات.'), style: crSmall),
          // 1-on-1 coaching — paid directly.
          CrHero(children: [
            Text(T('تدريب شخصي 1-على-1'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
            Text(T('الكوتش ريناس وياك'), style: crH1(26).copyWith(color: CrColors.tealInk)),
            Text(pickL(coaching['includes'])),
            Row(children: [
              for (final p in ['m1', 'm3', 'm6'])
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: ChoiceChip(
                      label: Text('${T(_periodName[p]!)}\n${fmt((coaching['prices'] as Map)[p] as num)}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 12)),
                      selected: coachPeriod == p,
                      onSelected: (_) => setState(() => coachPeriod = p),
                    ),
                  ),
                ),
            ]),
          ]),
          CrCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
              Text(T('ادفع بالتحويل'), style: crH3),
              Text(T('حوّل المبلغ لحساب الكوتش وصوّر الإيصال. الكوتش يأكد خلال 24 ساعة.'), style: crMuted),
              Wrap(spacing: 6, runSpacing: 6, children: [
                for (final m in [['fib', 'FIB'], ['qi', 'كي كارد'], ['zaincash', 'زين كاش'], ['cash', 'كاش']])
                  CrChip(T(m[1]), on: coachMethod == m[0], light: false, onTap: () => setState(() => coachMethod = m[0])),
              ]),
              CrButton('${T('اشترك')} · ${fmt((coaching['prices'] as Map)[coachPeriod] as num)} ${da()}', busy: busy, onTap: () => _buy({'kind': 'coaching', 'key': 'coaching', 'period': coachPeriod, 'method': coachMethod})),
              if (lastPurchase != null) ...[
                for (final a in ((lastPurchase!['transferAccounts'] as List?) ?? const []))
                  Row(children: [Expanded(child: Text(T((a['label'] ?? '').toString()))), Text('${a['account']}', textDirection: TextDirection.ltr, style: crMuted)]),
                if (lastPurchase!['subscription'] != null)
                  Text('${tr3('رقم الطلب', 'Reference', 'ژمارەی داواکاری')}: ${lastPurchase!['subscription']['reference']}', style: crSmall, textDirection: TextDirection.ltr),
              ],
            ], 8)),
          ),
          Text(tr3('برامج بدفعة وحدة', 'One-time programs', 'پرۆگرامی یەکجاری'), style: crH3),
          CrList([
            for (final p in programs)
              CrRow(
                title: pickL(p['name']),
                sub: '${p['weeks']} ${T('أسبوع')}',
                trailing: Text('${fmt(p['price'] as num)} ${da()}', style: const TextStyle(fontWeight: FontWeight.w700)),
                onTap: busy ? null : () => _buy({'kind': 'program', 'key': p['key'], 'period': 'once', 'method': storeMethod}),
              ),
          ]),
          if (subs.isNotEmpty) ...[
            Text(tr3('دفعاتي', 'My payments', 'پارەدانەکانم'), style: crH3),
            CrList([
              for (final s in subs.take(10))
                CrRow(
                  title: '${s['kind']} · ${s['key']} · ${fmt((s['amount'] as num?) ?? 0)} ${da()}',
                  sub: '${s['method']}',
                  trailing: CrTag(
                    s['status'] == 'active' ? T('تأكد · انفتح الاشتراك') : s['status'] == 'rejected' ? T('انرفض') : T('ينتظر تأكيد الكوتش'),
                    fg: s['status'] == 'active' ? CrColors.teal : s['status'] == 'rejected' ? CrColors.red : CrColors.amber,
                    bg: s['status'] == 'active' ? CrColors.tealWash : s['status'] == 'rejected' ? CrColors.redWash : CrColors.amberWash,
                  ),
                ),
            ]),
          ],
          Text(tr3('الأسعار من خطة الأسعار (31 أكتوبر). الكوتش يقدر يغيّرها.', 'Prices from the pricing plan (31 Oct). The coach can change them.', 'نرخەکان لە پلانی نرخ (31ی ئۆکتۆبەر). کۆچ دەتوانێت بیانگۆڕێت.'), style: crSmall),
        ],
      );
    });
  }
}

// ─────────────────────────── Onboarding questions ──────────────────────────
class CrStartScreen extends ConsumerStatefulWidget {
  const CrStartScreen({super.key});
  @override
  ConsumerState<CrStartScreen> createState() => _CrStartScreenState();
}

class _CrStartScreenState extends ConsumerState<CrStartScreen> {
  String goal = 'strength', level = 'beg', place = 'gym';
  int days = 3;
  final inj = <String>{};
  final parq = <int>{};
  bool busy = false;

  String _pickProgram() {
    if (place == 'none') return 'home0';
    if (place == 'db') return 'homedb';
    if (place == 'bands') return 'bands';
    if (goal == 'fat') return 'cut';
    if (days >= 5 && level != 'beg') return 'ppl';
    if (days == 4) return 'ul4';
    return 'str12';
  }

  @override
  Widget build(BuildContext context) {
    return CrLoader(builder: (context, d, st) {
      final q = d.map('OBQ');
      Widget group(String title, List items, String Function(dynamic) key, bool Function(dynamic) isOn, void Function(dynamic) pick) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: crH3),
              const SizedBox(height: 8),
              Wrap(spacing: 6, runSpacing: 6, children: [
                for (final it in items) CrChip(T(it[1].toString()), on: isOn(it[0]), light: false, onTap: () => setState(() => pick(it[0]))),
              ]),
            ],
          );
      return CrPage(
        title: tr3('أسئلة البداية', 'Start questions', 'پرسیارەکانی دەستپێک'),
        sub: tr3('التطبيق يبنيلك برنامج على قياسك', 'The app builds a program that fits you', 'ئەپەکە پرۆگرامێکی گونجاوت بۆ دروست دەکات'),
        bottom: CrButton(T('احفظ'), busy: busy, onTap: () async {
          final flag = parq.isNotEmpty;
          final prog = _pickProgram();
          st.s['plan'] = prog;
          st.s['profile'] = {'goal': goal, 'level': level, 'days': days, 'place': place, 'inj': inj.toList(), 'flags': flag};
          await st.save();
          setState(() => busy = true);
          try {
            final b = st.body;
            await CrApi.saveProfile({'goal': goal, 'level': level, 'days': days, 'place': place, 'injuries': inj.where((x) => x != 'none').toList(), 'parqFlag': flag, 'sex': b['sex'], 'age': b['age'], 'kg': b['kg'], 'cm': b['cm']});
          } catch (_) {/* offline or guest: kept on the phone */}
          if (!context.mounted) return;
          setState(() => busy = false);
          crToast(context, T('انحفظ'));
          if (flag) {
            showDialog<void>(
              context: context,
              builder: (_) => AlertDialog(
                backgroundColor: CrColors.surface,
                content: Text(T('إذا عندك ألم صدر أو دوخة أو ضغط عالي ما مسيطر عليه، لا تتمرن وراجع طبيب.'), textDirection: CrI18n.dir),
                actions: [TextButton(onPressed: () => Navigator.pop(context), child: Text(T('تمام')))],
              ),
            );
          }
          context.pushReplacement('/renas/program/$prog');
        }),
        children: [
          group(T('هدفك'), q['goal'] as List, (x) => '$x', (x) => goal == x, (x) => goal = x as String),
          group(T('المستوى'), q['level'] as List, (x) => '$x', (x) => level == x, (x) => level = x as String),
          group(tr3('كم يوم بالأسبوع؟', 'How many days a week?', 'چەند ڕۆژ لە هەفتەدا؟'), q['days'] as List, (x) => '$x', (x) => days == x, (x) => days = (x as num).toInt()),
          group(tr3('وين تتمرن؟', 'Where do you train?', 'لە کوێ ڕاهێنان دەکەیت؟'), q['place'] as List, (x) => '$x', (x) => place == x, (x) => place = x as String),
          group(tr3('عندك إصابة أو ألم؟', 'Any injury or pain?', 'برینداری یان ئازارت هەیە؟'), q['inj'] as List, (x) => '$x', (x) => inj.contains(x), (x) {
            if (x == 'none') {
              inj
                ..clear()
                ..add('none');
            } else {
              inj.remove('none');
              inj.contains(x) ? inj.remove(x) : inj.add(x as String);
            }
          }),
          Text(tr3('أسئلة الصحة (PAR-Q)', 'Health questions (PAR-Q)', 'پرسیارەکانی تەندروستی (PAR-Q)'), style: crH3),
          CrList([
            for (var i = 0; i < (q['parq'] as List).length; i++)
              CheckboxListTile(
                value: parq.contains(i),
                activeColor: CrColors.amber,
                onChanged: (v) => setState(() => v == true ? parq.add(i) : parq.remove(i)),
                title: Text(T((q['parq'] as List)[i] as String), style: const TextStyle(fontSize: 14)),
              ),
          ]),
        ],
      );
    });
  }
}

// ─────────────────────────── Weekly check-in ───────────────────────────────
class CrCheckinScreen extends ConsumerStatefulWidget {
  const CrCheckinScreen({super.key});
  @override
  ConsumerState<CrCheckinScreen> createState() => _CrCheckinScreenState();
}

class _CrCheckinScreenState extends ConsumerState<CrCheckinScreen> {
  final _kg = TextEditingController();
  final _note = TextEditingController();
  int? sleep, energy, done;
  bool busy = false;
  List<dynamic> server = const [];

  @override
  void initState() {
    super.initState();
    CrApi.myCheckIns().then((v) {
      if (mounted) setState(() => server = v);
    }).catchError((_) {});
  }

  @override
  void dispose() {
    _kg.dispose();
    _note.dispose();
    super.dispose();
  }

  Widget _scale(String label, int? v, void Function(int?) set) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(T(label), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: CrColors.soft)),
        const SizedBox(height: 6),
        Row(children: [
          for (var n = 1; n <= 5; n++)
            Expanded(child: Padding(padding: const EdgeInsets.symmetric(horizontal: 3), child: CrChip('$n', on: v == n, light: false, onTap: () => setState(() => set(v == n ? null : n))))),
        ]),
      ]);

  @override
  Widget build(BuildContext context) {
    return CrLoader(builder: (context, d, st) {
      final local = st.checkins.reversed.take(3).toList();
      return CrPage(
        title: T('التقرير الأسبوعي'),
        sub: T('كل شي اختياري'),
        bottom: CrButton(T('أرسل التقرير للكوتش'), busy: busy, onTap: () async {
          final kgv = double.tryParse(_kg.text.replaceAll(',', '.'));
          final c = {'d': today(), if (kgv != null) 'kg': kgv, 'sleep': sleep, 'energy': energy, 'done': done, 'note': _note.text.trim()};
          final list = List<dynamic>.from((st.s['checkins'] as List?) ?? [])..add(c);
          st.s['checkins'] = list;
          if (kgv != null) st.s['body'] = {...st.body, 'kg': kgv};
          st.logActivity();
          await st.save();
          setState(() => busy = true);
          var sent = false;
          try {
            await CrApi.sendCheckIn({if (kgv != null) 'kg': kgv, if (sleep != null) 'sleep': sleep, if (energy != null) 'energy': energy, if (done != null) 'workoutsDone': done, 'note': _note.text.trim()});
            sent = true;
          } catch (_) {}
          if (!context.mounted) return;
          setState(() => busy = false);
          crToast(context, sent ? T('انرسل التقرير للكوتش') : tr3('انحفظ على جهازك. سجّل دخول حتى يوصل للكوتش.', 'Saved on your phone. Log in so it reaches the coach.', 'لەسەر مۆبایلەکەت پاشەکەوت کرا. بچۆ ژوورەوە بۆ ئەوەی بگاتە کۆچ.'));
          _kg.clear();
          _note.clear();
          setState(() => sleep = energy = done = null);
        }),
        children: [
          CrCard(child: Text(T('عبّي اللي تريده بس، وتگدر تتجاوز أي سؤال. الكوتش يشوف تقريرك ويرد عليك.'), style: crMuted)),
          CrCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
              TextField(controller: _kg, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: InputDecoration(labelText: T('وزنك الصبح (كغ)'))),
              _scale('نومك هالأسبوع (1 سيء · 5 ممتاز)', sleep, (v) => sleep = v),
              _scale('طاقتك', energy, (v) => energy = v),
              Text(T('كم تمرين سويت؟'), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: CrColors.soft)),
              Wrap(spacing: 6, children: [for (var n = 0; n <= 6; n++) CrChip('$n', on: done == n, light: false, onTap: () => setState(() => done = done == n ? null : n))]),
              TextField(controller: _note, maxLines: 3, maxLength: 1000, decoration: InputDecoration(labelText: T('شي تريد تگوله للكوتش؟'))),
            ], 12)),
          ),
          if (server.isNotEmpty || local.isNotEmpty) Text(T('تقاريرك السابقة'), style: crH3),
          for (final c in server.take(5))
            CrCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('${(c['createdAt'] ?? '').toString().split('T').first}${c['kg'] != null ? ' · ${c['kg']} ${kg()}' : ''}', style: const TextStyle(fontWeight: FontWeight.w600)),
                if (c['note'] != null && '${c['note']}'.isNotEmpty) Text('${c['note']}', style: crMuted),
                if (c['reply'] != null)
                  Container(
                    margin: const EdgeInsets.only(top: 8),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: CrColors.tealWash, borderRadius: BorderRadius.circular(12)),
                    child: Text('${T('رد الكوتش')}: ${c['reply']}'),
                  ),
              ]),
            ),
          if (server.isEmpty)
            for (final c in local)
              CrRow(title: '${c['d']}${c['kg'] != null ? ' · ${c['kg']} ${kg()}' : ''}', sub: c['note']?.toString()),
        ],
      );
    });
  }
}

// ─────────────────────────── Privacy & delete ──────────────────────────────
class CrPrivacyScreen extends StatelessWidget {
  const CrPrivacyScreen({super.key});
  static const sec = [
    ['شنو نجمع', 'معلوماتك اللي تكتبها: العمر والوزن والطول والهدف والتمارين والأكل والتقارير، والصور إذا اخترت ترسلها.'],
    ['ليش', 'حتى نسويلك برنامج وسعرات، والكوتش يتابعك. ما نستخدمها لأي شي ثاني.'],
    ['الصور', 'اختيارية، ويه خيار تغطية الوجه. تنحفظ مشفّرة، يشوفها الكوتش بس، وما تنعرض بأي إعلان بدون موافقتك الكتابية.'],
    ['الذكاء الاصطناعي', 'ما نرسل معلوماتك لخدمة ذكاء اصطناعي إلا بعد ما توافق، ونرسل بس اللي يحتاجه السؤال.'],
    ['ما نبيع بياناتك', 'ولا نشاركها ويه أي شركة إعلانات.'],
  ];
  @override
  Widget build(BuildContext context) => CrLoader(
        builder: (context, d, st) => CrPage(title: T('الخصوصية'), children: [
          for (final s in sec)
            CrCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(T(s[0]), style: crH3), const SizedBox(height: 4), Text(T(s[1]))])),
          Text(tr3('سياسة الخصوصية الكاملة: citygym.app/privacy (عدّل الرابط قبل النشر).', 'Full privacy policy: citygym.app/privacy (update the link before publishing).', 'سیاسەتی تەواوی تایبەتمەندی: citygym.app/privacy (پێش بڵاوکردنەوە بەستەرەکە نوێ بکەرەوە).'), style: crSmall),
          CrButton(T('احذف حسابي'), kind: 'ghost', onTap: () => context.push('/renas/delete')),
        ]),
      );
}

class CrDeleteScreen extends ConsumerStatefulWidget {
  const CrDeleteScreen({super.key});
  @override
  ConsumerState<CrDeleteScreen> createState() => _CrDeleteScreenState();
}

class _CrDeleteScreenState extends ConsumerState<CrDeleteScreen> {
  final _c = TextEditingController();
  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CrLoader(builder: (context, d, st) {
      return CrPage(title: T('احذف حسابي'), children: [
        CrCard(
          color: CrColors.redWash,
          border: CrColors.redLine,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(T('هذا ما يرجع'), style: crH3.copyWith(color: CrColors.red)),
            Text(T('راح ننمسح كل بياناتك: برنامجك، تمارينك، أكلك، تقاريرك، وصورك.')),
          ]),
        ),
        TextField(controller: _c, decoration: InputDecoration(labelText: T('اكتب كلمة «احذف» حتى تأكد'))),
        CrButton(T('احذف حسابي نهائياً'), kind: 'red', onTap: () async {
          final v = _c.text.trim();
          if (v != 'احذف' && v.toUpperCase() != T('احذف').toUpperCase()) {
            crToast(context, T('اكتب الكلمة مثل ما هي'));
            return;
          }
          await st.reset(d);
          final auth = ref.read(authProvider);
          if (auth.isLoggedIn) {
            try {
              // Deletes the account and personal data on the server (DELETE /users/me).
              await ApiClient().delete('/users/me', data: {'confirm': 'DELETE'});
              await ref.read(authProvider.notifier).logout();
            } catch (e) {
              if (context.mounted) crToast(context, CrApi.error(e));
              return;
            }
          }
          if (!context.mounted) return;
          crToast(context, T('انحذف حسابك'));
          context.go(auth.isLoggedIn ? '/auth/login' : '/renas');
        }),
        Text(tr3('إذا مسجّل دخول، ينمسح حسابك وبياناتك من السيرفر هم.', 'If you are logged in, your account and data are deleted from the server too.', 'ئەگەر چوویتە ژوورەوە، هەژمار و داتاکەت لە سێرڤەریش دەسڕدرێنەوە.'), style: crSmall),
        CrButton(T('لا، رجعني'), kind: 'ghost', onTap: () => context.pop()),
      ]);
    });
  }
}
