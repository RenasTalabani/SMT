// Coach Renas — training screens: Home (2), All exercises (3), Strength goal (4),
// Sport (5), Workout the coach's way (6), Exercise library (7) + exercise detail.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../cr_api.dart';
import '../cr_core.dart';
import '../cr_shell.dart';

// ─────────────────────────────── 2 · Home ───────────────────────────────────
class CrHomeScreen extends ConsumerWidget {
  const CrHomeScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return CrLoader(builder: (context, d, st) {
      final lifts = d.map('LIFTS');
      final lb = st.lift('bench');
      final inc = (lifts['bench']['inc'] as num);
      final tw = (lb['w'] as num) + inc;
      final g = st.goal;
      final cur = (e1rm(lb['w'] as num, lb['r'] as num) * 2).round() / 2;
      final gw = (g['w'] as num).toDouble(), gt = (g['target'] as num).toDouble();
      final pct = ((cur - gw) / (gt - gw)).clamp(0.0, 1.0);
      final tg = st.targets(), eaten = st.logTotals(d);
      final mode = st.mode;
      final seasonal = mode['ramadan'] == true
          ? ['وضع رمضان مفعّل', 'تمرّن بعد الفطور بساعة إلى ساعتين · 20–30 دقيقة', Icons.nightlight_round]
          : mode['summer'] == true
              ? ['وضع الصيف مفعّل', 'تمرّن داخل أو الصبح كلش وكت · اشرب مي', Icons.wb_sunny_outlined]
              : null;
      final programs = d.list('PROGRAMS');
      final plan = programs.firstWhere((p) => p['id'] == st.s['plan'], orElse: () => programs.first);
      return CrPage(
        back: false,
        eyebrow: tr3('أهلاً بيك', 'Welcome', 'بەخێربێیت'),
        title: T('مع الكوتش ريناس'),
        actions: [
          const CrLangButton(),
          const SizedBox(width: 8),
          CrRoundIcon(icon: Icons.person_outline_rounded, label: T('حسابي'), onTap: () => context.push('/renas/me')),
        ],
        children: [
          CrHero(children: [
            Text('${T('اليوم · طريقة الكوتش')} · ${T(lifts['bench']['n'] as String)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
            Text(T('سِت القمة: {w} كغ', {'w': num1(tw.toDouble())}), style: crH1(28).copyWith(color: CrColors.tealInk)),
            Text(T('آخر مرة {w} كغ × {r}. اليوم تزيد {i} كغ وتسوي أكثر عدد تقدر.', {'w': lb['w'], 'r': lb['r'], 'i': inc})),
            CrButton(T('ابدأ التمرين'), kind: 'dark', icon: Icons.play_arrow_rounded, onTap: () => context.push('/renas/workout')),
          ]),
          CrCard(
            onTap: () => context.go('/renas/food'),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
              Row(children: [
                Expanded(child: Text(T('أكلك اليوم'), style: crH3)),
                Text('${fmt(eaten['kcal']!)} / ${fmt(tg['kcal']!)} ${T('سعرة')}', style: crMuted),
              ]),
              CrMeter(eaten['kcal']! / tg['kcal']!),
              Text('${T('بروتين')} ${fmt(eaten['p']!)} / ${tg['pLo']}–${tg['pHi']} ${T('غ')}', style: crMuted),
            ], 8)),
          ),
          CrCard(
            onTap: () => context.push('/renas/goal'),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
              Row(children: [
                Expanded(child: Text('${T('هدفك:')} ${T(lifts[g['lift']]['n'] as String)} ${num1(gt)} ${kg()}', style: crH3)),
                Text('${g['weeks']} ${T('أسبوع')}', style: crMuted),
              ]),
              Row(children: [
                Text(num1(gw), style: crSmall),
                const SizedBox(width: 8),
                Expanded(child: CrMeter(pct)),
                const SizedBox(width: 8),
                Text(num1(gt), style: crSmall.copyWith(color: CrColors.teal)),
              ]),
              Text.rich(TextSpan(style: crMuted, children: [
                TextSpan(text: '${T('أقصى رفعة مقدّرة هسه:')} '),
                TextSpan(text: '${num1(cur)} ${kg()}', style: const TextStyle(color: CrColors.ink, fontWeight: FontWeight.w700)),
              ])),
            ], 8)),
          ),
          Row(children: [
            Expanded(child: CrStat('${st.streak()}', T('يوم ورا بعض'), color: CrColors.amber)),
            const SizedBox(width: 10),
            Expanded(child: CrStat('✓', T('التقرير الأسبوعي'), color: CrColors.teal, onTap: () => context.push('/renas/checkin'))),
            const SizedBox(width: 10),
            Expanded(child: CrStat('★', T('اشتراكي'), color: CrColors.teal, onTap: () => context.push('/renas/plans'))),
          ]),
          CrCard(
            onTap: () => context.push('/renas/program/${plan['id']}'),
            child: Row(children: [
              const Icon(Icons.menu_book_rounded, color: CrColors.teal),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(T('برنامجي'), style: crH3),
                Text(T(plan['t'] as String), style: crMuted),
              ])),
              const Icon(Icons.chevron_left_rounded, color: CrColors.muted, textDirection: TextDirection.ltr),
            ]),
          ),
          if (seasonal != null)
            CrCard(
              color: CrColors.amberWash,
              border: CrColors.amberLine,
              child: Row(children: [
                Icon(seasonal[2] as IconData, color: CrColors.amber),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(T(seasonal[0] as String), style: crH3),
                  Text(T(seasonal[1] as String), style: crMuted.copyWith(color: CrColors.amberSoft)),
                ])),
              ]),
            ),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.45,
            children: [
              _tile(Icons.medication_outlined, CrColors.blue, T('دليل المكملات'), T('شنو يفيد وشنو فلوس ضايعة'), () => context.push('/renas/supps')),
              _tile(Icons.warning_amber_rounded, CrColors.red, T('خطر الهرمونات'), T('الحقيقة عن المنشطات'), () => context.push('/renas/hormones'), danger: true),
              _tile(Icons.menu_book_rounded, CrColors.teal, T('مكتبة التمارين'), T('{n} تمرين بالتكنيك الصح', {'n': d.exercises.length}), () => context.push('/renas/lib')),
              _tile(Icons.auto_awesome, CrColors.amber, T('اسأل المدرب الذكي'), T('تمرين، أكل عراقي، مكملات'), () => context.go('/renas/coach')),
            ],
          ),
        ],
      );
    });
  }

  Widget _tile(IconData ic, Color c, String t, String s, VoidCallback onTap, {bool danger = false}) => CrCard(
        onTap: onTap,
        padding: 12,
        color: danger ? CrColors.redWash : null,
        border: danger ? CrColors.redLine : null,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(ic, color: c, size: 22),
          const SizedBox(height: 4),
          Text(t, style: crH3.copyWith(fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis),
          Text(s, style: crSmall, maxLines: 2, overflow: TextOverflow.ellipsis),
        ]),
      );
}

// ─────────────────────────── 3 · All exercises ─────────────────────────────
class CrTrainScreen extends ConsumerStatefulWidget {
  const CrTrainScreen({super.key});
  @override
  ConsumerState<CrTrainScreen> createState() => _CrTrainScreenState();
}

class _CrTrainScreenState extends ConsumerState<CrTrainScreen> {
  String cat = 'gym';
  static const _icons = {
    'gym': Icons.fitness_center_rounded,
    'home': Icons.home_rounded,
    'cali': Icons.sports_gymnastics_rounded,
    'cardio': Icons.monitor_heart_outlined,
    'sport': Icons.sports_basketball_rounded,
    'special': Icons.person_outline_rounded,
  };
  @override
  Widget build(BuildContext context) {
    return CrLoader(builder: (context, d, st) {
      final cats = d.raw('CATS');
      final programs = d.list('PROGRAMS').where((p) => p['cat'] == cat).toList();
      final sports = d.list('SPORTS');
      return CrPage(
        back: false,
        title: T('كل التمارين'),
        sub: T('أي نوع تمرين، أي مكان، أي هدف'),
        actions: const [CrLangButton()],
        children: [
          TextField(
            readOnly: true,
            onTap: () => context.push('/renas/lib'),
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.search_rounded, color: CrColors.muted),
              hintText: T('دوّر: بنچ، عقلة، جري، كرة سلة...'),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(23)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(23), borderSide: const BorderSide(color: CrColors.line3)),
            ),
          ),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 1.6,
            children: [
              for (final c in cats)
                _CatBox(
                  icon: _icons[c[0]] ?? Icons.circle_outlined,
                  label: T(c[1] as String),
                  on: cat == c[0],
                  onTap: () => setState(() => cat = c[0] as String),
                ),
            ],
          ),
          Text(T('حسب رياضتك'), style: crH3.copyWith(fontSize: 14, color: CrColors.soft)),
          SizedBox(
            height: 36,
            child: ListView(scrollDirection: Axis.horizontal, children: [
              for (final s in sports)
                Padding(
                  padding: const EdgeInsetsDirectional.only(end: 8),
                  child: CrChip(T(s['n'] as String), onTap: () => context.push('/renas/sport/${s['id']}')),
                ),
            ]),
          ),
          Row(children: [
            Expanded(
              child: CrCard(
                color: CrColors.teal,
                border: CrColors.teal,
                radius: 16,
                padding: 12,
                onTap: () => context.push('/renas/goal'),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(T('أريد أصير أقوى'), style: const TextStyle(color: CrColors.tealInk, fontWeight: FontWeight.w700, fontSize: 15)),
                  Text(T('خطة لرفع أي وزن'), style: const TextStyle(color: CrColors.tealInk, fontSize: 12)),
                ]),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: CrCard(
                radius: 16,
                padding: 12,
                onTap: () => context.push('/renas/start'),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(T('حسب جسمك'), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  Text(T('نحيف، متوسط، وزن زايد'), style: crSmall),
                ]),
              ),
            ),
          ]),
          if (cat == 'sport')
            for (final s in sports)
              CrCard(
                onTap: () => context.push('/renas/sport/${s['id']}'),
                child: Text(T(s['n'] as String), style: crH3),
              )
          else ...[
            Text('${T('البرامج')} · ${T((cats.firstWhere((c) => c[0] == cat, orElse: () => ['', ''])[1]) as String)}',
                style: crH3.copyWith(fontSize: 14, color: CrColors.soft)),
            for (final p in programs)
              CrCard(
                radius: 16,
                padding: 12,
                onTap: () => context.push('/renas/program/${p['id']}'),
                child: Row(children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(T(p['t'] as String), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                      Text(T((p['d'] ?? '') as String), style: crSmall),
                    ]),
                  ),
                  const SizedBox(width: 8),
                  p['own'] == true ? CrTag(T('مجاني'), fg: CrColors.amber, bg: const Color(0xFF3A2A12)) : CrTag(T('للمشتركين'), fg: CrColors.soft, bg: CrColors.raised),
                ]),
              ),
          ],
        ],
      );
    });
  }
}

class _CatBox extends StatelessWidget {
  const _CatBox({required this.icon, required this.label, required this.on, required this.onTap});
  final IconData icon;
  final String label;
  final bool on;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Semantics(
        selected: on,
        button: true,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            decoration: BoxDecoration(
              color: on ? CrColors.ink : CrColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: on ? null : Border.all(color: CrColors.line2),
            ),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(icon, size: 22, color: on ? CrColors.bg : CrColors.ink),
              const SizedBox(height: 4),
              Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: on ? CrColors.bg : CrColors.ink)),
            ]),
          ),
        ),
      );
}

// ─────────────────────────── Program detail ────────────────────────────────
class CrProgramScreen extends ConsumerWidget {
  const CrProgramScreen({super.key, required this.id});
  final String id;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(crMeProvider).valueOrNull;
    return CrLoader(builder: (context, d, st) {
      final p = d.list('PROGRAMS').firstWhere((x) => x['id'] == id, orElse: () => d.list('PROGRAMS').first);
      final isMine = st.s['plan'] == p['id'];
      // Paid programs need a subscription (free ones are marked own:true in the prototype).
      // The last known tier is remembered so a paying member can still train offline.
      if (me != null) st.s['tierCache'] = (me['access'] as Map?)?['tier'];
      final tier = (me?['access'] as Map?)?['tier'] ?? st.s['tierCache'];
      final locked = p['own'] != true && tier == null;
      if (locked) {
        return CrPage(
          title: T(p['t'] as String),
          sub: T((p['d'] ?? '') as String),
          bottom: CrButton(T('اشتراكي'), icon: Icons.lock_open_rounded, onTap: () => context.push('/renas/plans')),
          children: [
            CrCard(
              color: CrColors.amberWash,
              border: CrColors.amberLine,
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
                const Icon(Icons.lock_outline_rounded, color: CrColors.amber),
                Text(T('للمشتركين'), style: crH3),
                Text(tr3('هذا البرنامج ضمن الاشتراك. جرّب كل شي مجاناً 7 أيام.', 'This program is part of the subscription. Try everything free for 7 days.', 'ئەم پرۆگرامە بەشێکە لە بەشداری. هەموو شت 7 ڕۆژ بەخۆڕایی تاقی بکەرەوە.'), style: crMuted.copyWith(color: CrColors.amberSoft)),
              ], 6)),
            ),
            if (p['how'] != null) CrCard(child: Text(T(p['how'] as String), style: crMuted.copyWith(color: CrColors.soft))),
          ],
        );
      }
      return CrPage(
        title: T(p['t'] as String),
        sub: T((p['d'] ?? '') as String),
        bottom: CrButton(
          isMine ? tr3('هذا برنامجك', 'This is your program', 'ئەمە پرۆگرامەکەتە') : T('ضيف الخطة لبرنامجي'),
          onTap: isMine
              ? null
              : () {
                  st.s['plan'] = p['id'];
                  st.save();
                  crToast(context, T('انحفظ'));
                },
        ),
        children: [
          if (p['how'] != null) CrCard(child: Text(T(p['how'] as String), style: crMuted.copyWith(color: CrColors.soft))),
          if (p['days'] is List)
            for (final day in (p['days'] as List))
              CrCard(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(T(day[0] as String), style: crH3),
                  const SizedBox(height: 6),
                  for (final exId in (day[1] as List))
                    if (d.exMap[exId] != null)
                      InkWell(
                        onTap: () => context.push('/renas/ex/$exId'),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          child: Row(children: [
                            const Icon(Icons.fitness_center_rounded, size: 16, color: CrColors.teal),
                            const SizedBox(width: 8),
                            Expanded(flex: 3, child: Text(d.x(d.exMap[exId]!, 'ar'))),
                            const SizedBox(width: 6),
                            Flexible(flex: 2, child: Text(d.x(d.exMap[exId]!, 'lv'), style: crSmall, maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.end)),
                          ]),
                        ),
                      ),
                ]),
              ),
          if (p['ladder'] is List)
            CrList([
              for (var i = 0; i < (p['ladder'] as List).length; i++)
                CrRow(title: '${i + 1}. ${T((p['ladder'] as List)[i] as String)}'),
            ]),
          if (p['table'] is List)
            CrList([
              for (final r in (p['table'] as List))
                CrRow(title: T(r[0] as String), trailing: Flexible(child: Text(T(r[1] as String), style: crMuted, textAlign: TextAlign.end))),
            ]),
          Text(T('بالأوزان الثقيلة خلي واحد يساعدك (سبوتر)'), style: crSmall, textAlign: TextAlign.center),
        ],
      );
    });
  }
}

// ─────────────────────────── 4 · Strength goal ─────────────────────────────
class CrGoalScreen extends ConsumerStatefulWidget {
  const CrGoalScreen({super.key});
  @override
  ConsumerState<CrGoalScreen> createState() => _CrGoalScreenState();
}

class _CrGoalScreenState extends ConsumerState<CrGoalScreen> {
  String? lift;
  int weeks = 12;
  String mode = 'basic';
  static const _targets = {'bench': [25, 35], 'squat': [40, 55], 'dead': [50, 70], 'pull': [2, 8]};
  static const _labels = {'bench': 'بنچ برس', 'squat': 'سكوات', 'dead': 'ديدلفت', 'pull': 'عقلة'};
  static const _basic = [
    ['زيادة تدريجية', 'زيد 0.5–1.25 كغ كل أسبوع'],
    ['تكرارات ذكية', 'يوم ثقيل 5×5 ويوم خفيف 3×8'],
    ['تكنيك صح', 'قبضة ثابتة، كتوف لورا، دفع بالرجلين'],
    ['تمارين مساعدة', 'ترايسبس، كتف، ضغط، دمبل بنچ'],
    ['مرتين بالأسبوع', 'كل ما تكرر الحركة تتقنها أكثر'],
    ['أكل وبروتين', '1.6–2.2 غ بروتين لكل كيلو من وزنك'],
    ['نوم 7–9 ساعات', 'العضلة تقوى وانت نايم'],
    ['أسبوع راحة', 'كل 4 أسابيع خفّف الوزن 10%'],
  ];
  static const _adv = [
    ['السِت الإضافي', 'بعد 4 سِتات، زيد 1–2 كغ وسوّي أكثر عدد تقدر'],
    ['راحة وكمّل', 'لما تتعب ارتاح 15 ثانية وكمّل عدات'],
    ['هرم', 'كل سِت زيد الوزن ونزّل العدات: 10·8·6·4'],
    ['توقّف عالصدر', 'ثانيتين ثابت على الصدر بعدين ادفع'],
    ['نزول بطيء', 'نزّل بـ 4–5 ثواني · ويه سبوتر بس'],
    ['دروب سِت', 'آخر سِت نزّل 20% من الوزن وكمّل فوراً'],
    ['زيادة مزدوجة', 'أول زيد العدات 6→10، بعدين زيد الوزن'],
    ['اختبر أقصى وزن', 'كل 4 أسابيع اختبر 3 عدات ثقيلة ويه سبوتر'],
  ];

  @override
  Widget build(BuildContext context) {
    return CrLoader(builder: (context, d, st) {
      final g = st.goal;
      lift ??= _targets.containsKey(g['lift']) ? g['lift'] as String : 'bench';
      final l = lift!;
      final now = (l == 'bench' ? (g['w'] as num) : _targets[l]![0]).toDouble();
      final target = (l == 'bench' ? (g['target'] as num) : _targets[l]![1]).toDouble();
      final unit = l == 'pull' ? ' ${T('عقلة')}' : ' ${kg()}';
      final lo = now * 0.85;
      final bars = <Widget>[];
      for (var w = 1; w <= weeks; w++) {
        var v = now + (target - now) * (w / weeks);
        final deload = w % 4 == 0 && w != weeks;
        if (deload) v *= 0.9;
        final h = ((v - lo) / (target - lo) * 64).clamp(8, 64).toDouble();
        final col = w == weeks ? CrColors.teal : deload ? CrColors.dim : w <= 5 ? const Color(0xFF1F7F7B) : CrColors.line3;
        bars.add(Expanded(child: Padding(padding: const EdgeInsets.symmetric(horizontal: 1.5), child: Container(height: h, decoration: BoxDecoration(color: col, borderRadius: const BorderRadius.vertical(top: Radius.circular(4), bottom: Radius.circular(2)))))));
      }
      final per = (target - now) / weeks;
      final pace = l == 'pull' ? 'حوالي +${per.toStringAsFixed(1)}$unit بالأسبوع' : 'حوالي +${per.toStringAsFixed(2)} كغ بالأسبوع';
      final verdict = weeks == 8
          ? ['طموح · يحتاج التزام', CrColors.amber, const Color(0xFF3A2A12)]
          : weeks == 12
              ? ['واقعي', CrColors.teal, CrColors.tealWash]
              : ['مريح', CrColors.blue, CrColors.blueWash];
      final ways = mode == 'adv' ? _adv : _basic;
      return CrPage(
        title: T('خطة هدف القوة'),
        bottom: Column(mainAxisSize: MainAxisSize.min, children: [
          Text(T('بالأوزان الثقيلة خلي واحد يساعدك (سبوتر)'), style: crSmall.copyWith(fontSize: 11)),
          const SizedBox(height: 6),
          CrButton(T('ضيف الخطة لبرنامجي'), height: 52, onTap: () {
            if (l != 'pull') {
              st.s['goal'] = {...g, 'lift': l, 'w': now, 'target': target, 'weeks': weeks};
              st.save();
            }
            crToast(context, T('انحفظ'));
            context.go('/renas');
          }),
        ]),
        children: [
          Row(children: [
            for (final k in _labels.keys)
              Expanded(child: Padding(padding: const EdgeInsets.symmetric(horizontal: 3), child: CrChip(T(_labels[k]!), on: l == k, onTap: () => setState(() => lift = k)))),
          ]),
          CrCard(
            radius: 20,
            border: CrColors.line2,
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: gap([
              Row(children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(T('هسه'), style: crSmall),
                  Text('${num1(now)}$unit', style: crH1(26)),
                ]),
                const Expanded(child: Icon(Icons.arrow_back_rounded, color: CrColors.dim)),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text(T('الهدف'), style: crSmall),
                  Text('${num1(target)}$unit', style: crH1(26).copyWith(color: CrColors.teal)),
                ]),
              ]),
              Row(children: [
                for (final w in [8, 12, 16])
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: InkWell(
                        onTap: () => setState(() => weeks = w),
                        child: Container(
                          height: 34,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(color: weeks == w ? CrColors.teal : CrColors.raised, borderRadius: BorderRadius.circular(10)),
                          child: Text('$w ${T('أسبوع')}', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: weeks == w ? CrColors.tealInk : CrColors.soft)),
                        ),
                      ),
                    ),
                  ),
              ]),
              SizedBox(height: 64, child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: bars)),
              Row(children: [
                Expanded(child: Text(T(pace), style: crSmall.copyWith(color: CrColors.soft))),
                CrTag(T(verdict[0] as String), fg: verdict[1] as Color, bg: verdict[2] as Color),
              ]),
            ], 10)),
          ),
          Row(children: [
            Expanded(child: Text(T('طرق حتى تصير أقوى'), style: crH3.copyWith(fontSize: 15))),
            for (final m in [['basic', 'الأساسيات'], ['adv', 'متقدم']])
              Padding(
                padding: const EdgeInsetsDirectional.only(start: 4),
                child: InkWell(
                  onTap: () => setState(() => mode = m[0]),
                  child: Container(
                    height: 28,
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: mode == m[0] ? CrColors.amber : CrColors.surface, borderRadius: BorderRadius.circular(13)),
                    child: Text(T(m[1]), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: mode == m[0] ? CrColors.amberInk : CrColors.muted)),
                  ),
                ),
              ),
          ]),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 2.0,
            children: [
              for (var i = 0; i < ways.length; i++)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: mode == 'adv' && i == 0 ? CrColors.amberWash : CrColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: mode == 'adv' && i == 0 ? CrColors.amber : CrColors.line2),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      CircleAvatar(radius: 9, backgroundColor: CrColors.tealWash, child: Text('${i + 1}', style: const TextStyle(fontSize: 11, color: CrColors.teal))),
                      const SizedBox(width: 6),
                      Expanded(child: Text(T(ways[i][0]), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis)),
                    ]),
                    Text(T(ways[i][1]), style: const TextStyle(fontSize: 11, color: CrColors.muted, height: 1.4), maxLines: 2, overflow: TextOverflow.ellipsis),
                  ]),
                ),
            ],
          ),
        ],
      );
    });
  }
}

// ─────────────────────────── 5 · Sport ─────────────────────────────────────
class CrSportScreen extends ConsumerStatefulWidget {
  const CrSportScreen({super.key, required this.id});
  final String id;
  @override
  ConsumerState<CrSportScreen> createState() => _CrSportScreenState();
}

class _CrSportScreenState extends ConsumerState<CrSportScreen> {
  bool inSeason = false;
  @override
  Widget build(BuildContext context) {
    return CrLoader(builder: (context, d, st) {
      final sports = d.list('SPORTS');
      final s = sports.firstWhere((x) => x['id'] == widget.id, orElse: () => sports.first);
      final rows = (inSeason ? s['in'] : s['off']) as List;
      return CrPage(
        title: T('تمارين لرياضتك'),
        sub: T(s['n'] as String),
        children: [
          SizedBox(
            height: 36,
            child: ListView(scrollDirection: Axis.horizontal, children: [
              for (final x in sports)
                Padding(
                  padding: const EdgeInsetsDirectional.only(end: 8),
                  child: CrChip(T(x['n'] as String), on: x['id'] == s['id'], light: false, onTap: () => context.replace('/renas/sport/${x['id']}')),
                ),
            ]),
          ),
          Wrap(spacing: 8, runSpacing: 8, children: [
            for (final w in (s['why'] as List)) CrTag(T(w as String)),
          ]),
          Row(children: [
            Expanded(child: CrChip(T('برّه الموسم'), on: !inSeason, onTap: () => setState(() => inSeason = false))),
            const SizedBox(width: 8),
            Expanded(child: CrChip(T('بالموسم'), on: inSeason, onTap: () => setState(() => inSeason = true))),
          ]),
          CrList([
            for (final r in rows)
              CrRow(
                title: r[0] is int ? (d.exMap[r[0]] != null ? d.x(d.exMap[r[0]]!, 'ar') : '#${r[0]}') : T(r[0] as String),
                trailing: Text(T(r[1] as String), style: const TextStyle(fontWeight: FontWeight.w700, color: CrColors.teal)),
                onTap: r[0] is int ? () => context.push('/renas/ex/${r[0]}') : null,
              ),
          ]),
          if (s['prev'] != null)
            CrCard(color: CrColors.amberWash, border: CrColors.amberLine, child: Text(T(s['prev'] as String), style: crMuted.copyWith(color: CrColors.amberSoft))),
        ],
      );
    });
  }
}

// ─────────────────────── 6 · Workout the coach's way ───────────────────────
class CrWorkoutScreen extends ConsumerStatefulWidget {
  const CrWorkoutScreen({super.key});
  @override
  ConsumerState<CrWorkoutScreen> createState() => _CrWorkoutScreenState();
}

class _CrWorkoutScreenState extends ConsumerState<CrWorkoutScreen> {
  int step = 0;
  double? w;
  int reps = 6;
  bool spotter = true;
  Map<String, dynamic>? last;

  Widget _table(List<List<num>> rows) => Container(
        decoration: BoxDecoration(border: Border.all(color: CrColors.line), borderRadius: BorderRadius.circular(14)),
        clipBehavior: Clip.antiAlias,
        child: Table(
          border: const TableBorder(horizontalInside: BorderSide(color: CrColors.line)),
          children: [
            TableRow(children: [for (final h in ['السِت', 'الوزن', 'العدات']) _cell(T(h), head: true)]),
            for (var i = 0; i < rows.length; i++)
              TableRow(children: [_cell('${i + 1}'), _cell('${num1(rows[i][0].toDouble())} ${kg()}'), _cell('${rows[i][1]}')]),
          ],
        ),
      );
  Widget _cell(String t, {bool head = false}) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        child: Text(t, style: TextStyle(fontSize: 13, color: head ? CrColors.muted : CrColors.ink, fontWeight: head ? FontWeight.w600 : FontWeight.w400)),
      );

  Widget _stepper(String value, VoidCallback minus, VoidCallback plus, String lm, String lp) => Row(children: [
        IconButton.filled(onPressed: minus, tooltip: lm, icon: const Icon(Icons.remove), style: IconButton.styleFrom(backgroundColor: CrColors.raised, foregroundColor: CrColors.ink)),
        Expanded(child: Text(value, textAlign: TextAlign.center, style: crH1(22))),
        IconButton.filled(onPressed: plus, tooltip: lp, icon: const Icon(Icons.add), style: IconButton.styleFrom(backgroundColor: CrColors.raised, foregroundColor: CrColors.ink)),
      ]);

  @override
  Widget build(BuildContext context) {
    return CrLoader(builder: (context, d, st) {
      final lifts = d.map('LIFTS');
      final lift = Map<String, dynamic>.from(lifts['bench'] as Map);
      last ??= st.lift('bench');
      w ??= (last!['w'] as num).toDouble() + (lift['inc'] as num);
      if (step == 0 && reps == 6) reps = ((last!['r'] as num).toInt()).clamp(3, 20);
      final ex = d.exMap[lift['ex']]!;
      final ww = w!;
      if (step == 0) {
        return CrPage(title: T('تمرين اليوم'), children: [
          CrCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
              Text(T('طريقة الكوتش ريناس'), style: const TextStyle(color: CrColors.teal, fontSize: 12, fontWeight: FontWeight.w700)),
              Text('${d.x(ex, 'ar')}  (${ex['en']})', style: crH3),
              Text(d.x(ex, 'cue'), style: crMuted),
            ], 6)),
          ),
          CrCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
              Text(T('قبل لا تبدي: عندك سبوتر أو قضبان أمان؟'), style: crH3),
              Text(T('بسِت القمة تروح لأكثر عدد. إذا ماكو أحد يساعدك، توقف وانت باقيلك عدتين.'), style: crMuted),
              Row(children: [
                Expanded(child: CrButton(T('إي، عندي'), onTap: () => setState(() { spotter = true; step = 1; }))),
                const SizedBox(width: 10),
                Expanded(child: CrButton(T('لا، وحدي'), kind: 'ghost', onTap: () => setState(() { spotter = false; step = 1; }))),
              ]),
            ], 8)),
          ),
          Text(T('إذا عندك ألم صدر أو دوخة أو ضغط عالي ما مسيطر عليه، لا تتمرن وراجع طبيب.'), style: crSmall),
        ]);
      }
      final warm = <List<num>>[[20, 8]];
      for (final p in [[0.5, 5], [0.7, 3], [0.85, 1]]) {
        final v = r05(ww * p[0], 0.5);
        if (v > warm.last[0]) warm.add([v, p[1]]);
      }
      if (step == 1) {
        return CrPage(title: T('تمرين اليوم'), children: [
          CrCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
            Text(T('1. الإحماء'), style: crH3),
            _table(warm),
            Text(T('ارتاح دقيقة لدقيقتين بين سِتات الإحماء.'), style: crSmall),
          ], 8))),
          CrCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
            Text(T('2. سِت القمة'), style: crH3),
            Text(T('آخر مرة {w} كغ × {r}. اليوم:', {'w': last!['w'], 'r': last!['r']}), style: crMuted),
            _stepper('${num1(ww)} ${kg()}', () => setState(() => w = (ww - 0.5).clamp(20, 500).toDouble()), () => setState(() => w = ww + 0.5), T('نقص الوزن'), T('زيد الوزن')),
            Text(spotter
                ? T('سوّي أكثر عدد تقدر بتكنيك نظيف، وخلي عدة وحدة بالخزان. بعدين سجّل كم سويت:')
                : T('سوّي أكثر عدد تقدر بتكنيك نظيف، وخلي عدتين بالخزان. بعدين سجّل كم سويت:'), style: crMuted),
            _stepper('$reps ${T('عدات')}', () => setState(() => reps = (reps - 1).clamp(1, 20)), () => setState(() => reps = (reps + 1).clamp(1, 20)), T('نقص العدات'), T('زيد العدات')),
            CrButton(T('سجّل سِت القمة'), onTap: () => setState(() => step = 2)),
          ], 10))),
        ]);
      }
      final est = (e1rm(ww, reps) * 2).round() / 2;
      final prev = (e1rm(last!['w'] as num, last!['r'] as num) * 2).round() / 2;
      final bo = r05(ww * 0.875, 0.5);
      final boR = (reps - (reps >= 6 ? 2 : 1)).clamp(1, 20);
      final inc = lift['inc'] as num;
      double next;
      String why;
      if (reps >= 8) {
        next = ww + 2;
        why = T('وصلت 8 عدات أو أكثر: المرة الجاية +2 كغ.');
      } else if (reps >= 3) {
        next = ww + inc;
        why = T('داخل النافذة (3–8): المرة الجاية +{i} كغ.', {'i': inc});
      } else if (reps == 2) {
        next = ww;
        why = T('أقل من 3 عدات: نفس الوزن المرة الجاية.');
      } else {
        next = r05(ww * 0.92, 0.5);
        why = T('فشل واضح: نزّل 8% وابدي من جديد.');
      }
      return CrPage(
        title: T('تمرين اليوم'),
        bottom: CrButton(T('احفظ التمرين'), onTap: () {
          final n = DateTime.now();
          final hist = List<dynamic>.from((st.s['hist'] as List?) ?? []);
          hist.add({'d': '${n.day}/${n.month}', 'l': 'bench', 'w': ww, 'r': reps});
          st.s['hist'] = hist;
          final ls = Map<String, dynamic>.from(st.s['lifts'] as Map);
          ls['bench'] = {'w': ww, 'r': reps};
          st.s['lifts'] = ls;
          st.logActivity();
          st.save();
          crToast(context, T('انحفظ التمرين'));
          context.pushReplacement('/renas/me');
        }),
        children: [
          CrHero(children: [
            Text(T('نتيجتك · طريقة الكوتش ريناس'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
            Text('${num1(ww)} ${kg()} × $reps', style: crH1(30).copyWith(color: CrColors.tealInk)),
            Text('${T('أقصى رفعة مقدّرة:')} ${num1(est)} ${kg()}${est > prev ? ' (+${num1(est - prev)})' : ''}', style: const TextStyle(fontWeight: FontWeight.w600)),
          ]),
          CrCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
            Text(T('3. سِتات التخفيف'), style: crH3),
            _table([[bo, boR], [bo, boR], [bo, boR]]),
            Text(T('87.5% من وزن القمة. خلي عدتين بالخزان. راحة 2–3 دقايق.'), style: crSmall),
          ], 8))),
          CrCard(
            color: CrColors.amberWash,
            border: CrColors.amberLine,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${T('المرة الجاية:')} ${num1(next)} ${kg()}', style: crH3),
              Text(why, style: crMuted.copyWith(color: CrColors.amberSoft)),
            ]),
          ),
          CrButton(T('عدّل الأرقام'), kind: 'ghost', onTap: () => setState(() => step = 1)),
        ],
      );
    });
  }
}

// ─────────────────────────── 7 · Exercise library ──────────────────────────
class CrLibraryScreen extends ConsumerStatefulWidget {
  const CrLibraryScreen({super.key});
  @override
  ConsumerState<CrLibraryScreen> createState() => _CrLibraryScreenState();
}

class _CrLibraryScreenState extends ConsumerState<CrLibraryScreen> {
  String q = '';
  String group = 'all';
  @override
  Widget build(BuildContext context) {
    return CrLoader(builder: (context, d, st) {
      final ql = q.trim().toLowerCase();
      final list = d.exercises.where((e) {
        if (group != 'all' && e['g'] != group) return false;
        if (ql.isEmpty) return true;
        return '${e['ar']} ${e['en']} ${d.x(e, 'ar')} ${e['m']}'.toLowerCase().contains(ql);
      }).toList();
      return CrPage(
        title: T('مكتبة التمارين'),
        sub: T('{n} تمرين بالتكنيك الصح', {'n': d.exercises.length}),
        children: [
          TextField(
            onChanged: (v) => setState(() => q = v),
            decoration: InputDecoration(prefixIcon: const Icon(Icons.search_rounded, color: CrColors.muted), hintText: T('ابحث')),
          ),
          SizedBox(
            height: 36,
            child: ListView(scrollDirection: Axis.horizontal, children: [
              Padding(padding: const EdgeInsetsDirectional.only(end: 8), child: CrChip(T('الكل'), on: group == 'all', onTap: () => setState(() => group = 'all'))),
              for (final g in d.groups.keys)
                Padding(padding: const EdgeInsetsDirectional.only(end: 8), child: CrChip(d.group(g), on: group == g, onTap: () => setState(() => group = g))),
            ]),
          ),
          Text('${list.length}', style: crSmall),
          CrList([
            for (final e in list.take(120))
              CrRow(
                title: d.x(e, 'ar'),
                sub: '${d.x(e, 'm')} · ${d.x(e, 'eq')}',
                trailing: e['star'] == true ? const Icon(Icons.star_rounded, color: CrColors.amber, size: 18) : null,
                onTap: () => context.push('/renas/ex/${e['id']}'),
              ),
          ]),
          if (list.length > 120) Text(tr3('دوّر حتى تشوف الباقي', 'Search to see the rest', 'بگەڕێ بۆ بینینی ئەوانی تر'), style: crSmall, textAlign: TextAlign.center),
        ],
      );
    });
  }
}

class CrExerciseScreen extends ConsumerWidget {
  const CrExerciseScreen({super.key, required this.id});
  final int id;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return CrLoader(builder: (context, d, st) {
      final e = d.exMap[id];
      if (e == null) return CrPage(title: T('مكتبة التمارين'), children: [Text('#$id', style: crMuted)]);
      const fields = {'m': 'العضلات', 'eq': 'الأدوات', 'lv': 'المستوى', 'cue': 'التكنيك الصح', 'err': 'الخطأ الشائع', 'easy': 'أسهل', 'hard': 'أصعب', 'sup': 'يخدم رفعة'};
      return CrPage(
        title: d.x(e, 'ar'),
        sub: '${e['en']} · ${d.group(e['g'] as String)}',
        children: [
          for (final f in fields.entries)
            if ((e[f.key] ?? '').toString().isNotEmpty)
              CrCard(
                color: f.key == 'err' ? CrColors.redWash : null,
                border: f.key == 'err' ? CrColors.redLine : null,
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(T(f.value), style: crSmall.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(d.x(e, f.key), style: const TextStyle(fontSize: 15)),
                ]),
              ),
          CrButton(T('اسأل المدرب الذكي'), kind: 'ghost', icon: Icons.auto_awesome, onTap: () => context.go('/renas/coach')),
        ],
      );
    });
  }
}
