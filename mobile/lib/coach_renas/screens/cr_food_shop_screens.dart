// Coach Renas — Food & calories (8), Supplements guide (9), Hormone danger (10),
// AI coach (11), Shop (12), Checkout (13).
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../cr_core.dart';
import '../cr_shell.dart';

Widget _foodTabs(BuildContext context, String on) => Row(children: [
      for (final t in [['food', 'السعرات', '/renas/food'], ['supps', 'المكملات', '/renas/supps'], ['hormones', 'الهرمونات', '/renas/hormones']])
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: CrChip(T(t[1]), on: on == t[0], light: false, onTap: on == t[0]
                ? null
                : () {
                    if (t[0] == 'food') {
                      context.go(t[2]);
                    } else {
                      context.push(t[2]);
                    }
                  }),
          ),
        ),
    ]);

// ─────────────────────────── 8 · Food & calories ───────────────────────────
class CrFoodScreen extends ConsumerStatefulWidget {
  const CrFoodScreen({super.key});
  @override
  ConsumerState<CrFoodScreen> createState() => _CrFoodScreenState();
}

class _CrFoodScreenState extends ConsumerState<CrFoodScreen> {
  String q = '';
  final _ctl = TextEditingController();
  @override
  void dispose() {
    _ctl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CrLoader(builder: (context, d, st) {
      final tg = st.targets(), eaten = st.logTotals(d), b = st.body;
      final ql = q.trim().toLowerCase();
      final found = ql.isEmpty
          ? <Map<String, dynamic>>[]
          : d.foods.where((f) => '${f['n']} ${f['ku'] ?? ''} ${f['en'] ?? ''}'.toLowerCase().contains(ql)).take(8).toList();
      final aim = b['aim'] == 'cut' ? 'هدفك: تنشيف' : b['aim'] == 'gain' ? 'هدفك: زيادة عضل' : 'هدفك: تثبيت الوزن';
      final log = st.log;
      return CrPage(
        back: false,
        title: T('الأكل والسعرات'),
        actions: const [CrLangButton()],
        children: [
          _foodTabs(context, 'food'),
          CrHero(children: [
            Text(T(aim), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
            Text('${fmt(tg['kcal']!)} ${T('سعرة باليوم')}', style: crH1(28).copyWith(color: CrColors.tealInk)),
            Text(T('بروتين {a}–{b} غ · دهون {f} غ على الأقل', {'a': tg['pLo'], 'b': tg['pHi'], 'f': tg['fat']}), style: const TextStyle(fontWeight: FontWeight.w600)),
            Wrap(spacing: 6, children: [
              for (final a in [['cut', 'تنشيف'], ['keep', 'تثبيت'], ['gain', 'زيادة عضل']])
                ChoiceChip(
                  label: Text(T(a[1])),
                  selected: b['aim'] == a[0],
                  onSelected: (_) {
                    st.s['body'] = {...b, 'aim': a[0]};
                    st.save();
                  },
                ),
            ]),
          ]),
          if ((b['age'] as num) < 18)
            CrCard(color: CrColors.amberWash, border: CrColors.amberLine, child: Text(T('عمرك أقل من 18: ما نعطيك رجيم بنقص سعرات. ركّز على أكل متوازن وبروتين وتمرين، واسأل أهلك أو طبيب.'), style: crMuted)),
          if (tg['floored'] == 1)
            CrCard(color: CrColors.amberWash, border: CrColors.amberLine, child: Text(T('ما ننزل تحت 1,200 سعرة للنساء و1,500 للرجال بدون طبيب أو أخصائي تغذية.'), style: crMuted)),
          CrCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
              Row(children: [
                Expanded(child: Text(T('أكلك اليوم'), style: crH3)),
                Text('${fmt(eaten['kcal']!)} / ${fmt(tg['kcal']!)}', style: crH1(18)),
              ]),
              CrMeter(eaten['kcal']! / tg['kcal']!),
              Row(children: [Expanded(child: Text(T('بروتين'), style: crSmall)), Text('${fmt(eaten['p']!)} / ${tg['pLo']} ${T('غ')}', style: crSmall)]),
              CrMeter(eaten['p']! / tg['pLo']!, color: CrColors.blue),
              for (var i = 0; i < log.length; i++) _logRow(d, st, log, i),
            ], 8)),
          ),
          CrCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
              Text(T('ضيف أكل عراقي'), style: crH3),
              TextField(controller: _ctl, onChanged: (v) => setState(() => q = v), decoration: InputDecoration(hintText: T('دوّر: صمون، تمن، دولمة، كبة…'))),
              if (found.isNotEmpty)
                for (final f in found)
                  InkWell(
                    onTap: () {
                      final l = List<dynamic>.from((st.s['log'] as List?) ?? []);
                      l.add({'f': f['k'], 'q': 1});
                      st.s['log'] = l;
                      st.logActivity();
                      st.save();
                      _ctl.clear();
                      setState(() => q = '');
                      crToast(context, T('انضاف'));
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(children: [
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(d.foodName(f), style: const TextStyle(fontWeight: FontWeight.w600)),
                          Text('${d.foodPortion(f)} · ${fmt(f['kcal'] as num)} ${T('سعرة')} · ${fmt(f['p'] as num)} ${T('غ بروتين')}', style: crSmall),
                        ])),
                        const CrTag('+'),
                      ]),
                    ),
                  )
              else if (ql.isNotEmpty)
                Text(T('ما لقيناها. جرّب المدرب الذكي تحت.'), style: crSmall)
              else
                Wrap(spacing: 6, runSpacing: 6, children: [
                  for (final f in d.foods.take(8))
                    CrChip(d.foodName(f), onTap: () {
                      final l = List<dynamic>.from((st.s['log'] as List?) ?? []);
                      l.add({'f': f['k'], 'q': 1});
                      st.s['log'] = l;
                      st.save();
                      crToast(context, T('انضاف'));
                    }),
                ]),
              Text(T('السعرات تقديرية حسب الحصة العراقية المعتادة. الزيت يغيّر الرقم كثير.'), style: crSmall),
            ], 8)),
          ),
        ],
      );
    });
  }

  Widget _logRow(CrData d, CrState st, List<Map<String, dynamic>> log, int i) {
    final it = log[i];
    final f = d.foodMap[it['f']];
    final q = (it['q'] as num?) ?? 1;
    final name = f != null ? d.foodName(f) : (it['n'] ?? '').toString();
    final kc = f != null ? (f['kcal'] as num) * q : (it['kcal'] as num? ?? 0);
    final pr = f != null ? (f['p'] as num) * q : (it['p'] as num? ?? 0);
    return Row(children: [
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('$name${f != null ? ' × $q' : ''}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          Text('${fmt(kc)} ${T('سعرة')} · ${fmt(pr)} ${T('غ بروتين')}${it['ex'] == true ? ' · ${T('مثال')}' : ''}', style: crSmall),
        ]),
      ),
      IconButton(
        tooltip: T('شيل'),
        icon: const Icon(Icons.close_rounded, size: 18, color: CrColors.muted),
        onPressed: () {
          final l = List<dynamic>.from((st.s['log'] as List?) ?? []);
          l.removeAt(i);
          st.s['log'] = l;
          st.save();
        },
      ),
    ]);
  }
}

// ─────────────────────────── 9 · Supplements ───────────────────────────────
class CrSuppsScreen extends ConsumerWidget {
  const CrSuppsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return CrLoader(builder: (context, d, st) {
      final supps = d.list('SUPPS');
      final tagFor = {
        'A': [T('مثبت'), CrColors.teal, CrColors.tealWash],
        'B': [T('دليل أضعف'), CrColors.blue, CrColors.blueWash],
        'C': [T('ما يفيد'), CrColors.red, CrColors.redWash],
      };
      return CrPage(
        title: T('دليل المكملات'),
        sub: T('شنو يفيد وشنو فلوس ضايعة'),
        children: [
          _foodTabs(context, 'supps'),
          CrCard(color: CrColors.tealWash, border: CrColors.tealLine, child: Text(T('أول شي الأكل والنوم والتمرين. المكملات تضيف شوية بس، وأغلبها ما تحتاجه.'), style: crMuted.copyWith(color: CrColors.soft))),
          for (final s in supps)
            CrCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
                Row(children: [
                  Expanded(child: Text(T(s['n'] as String), style: crH3)),
                  if (tagFor[s['t']] != null) CrTag(tagFor[s['t']]![0] as String, fg: tagFor[s['t']]![1] as Color, bg: tagFor[s['t']]![2] as Color),
                ]),
                if ((s['short'] ?? '') != '') Text(T(s['short'] as String), style: const TextStyle(fontWeight: FontWeight.w600)),
                if ((s['dose'] ?? '') != '') Text('${T('الجرعة')}: ${T(s['dose'] as String)}', style: crMuted.copyWith(color: CrColors.teal)),
                if ((s['why'] ?? '') != '') Text(T(s['why'] as String), style: crMuted),
                if ((s['warn'] ?? '') != '')
                  Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Icon(Icons.warning_amber_rounded, size: 16, color: CrColors.amber),
                    const SizedBox(width: 6),
                    Expanded(child: Text(T(s['warn'] as String), style: crSmall.copyWith(color: CrColors.amberSoft))),
                  ]),
                if (s['shop'] == true) CrButton(T('شوفها بالمتجر'), kind: 'ghost', height: 40, onTap: () => context.go('/renas/shop')),
              ], 6)),
            ),
          Text(T('كيف تعرف المكمل المغشوش؟'), style: crH3),
          CrList([for (final f in d.raw('FAKE_CHECK')) CrRow(title: T(f as String), icon: Icons.verified_outlined)]),
          Text(T('هذي معلومات عامة مو نصيحة طبية. إذا عندك مرض أو تاخذ دوا، اسأل طبيبك أول.'), style: crSmall),
        ],
      );
    });
  }
}

// ─────────────────────────── 10 · Hormone danger ───────────────────────────
class CrHormonesScreen extends ConsumerWidget {
  const CrHormonesScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return CrLoader(builder: (context, d, st) {
      final head = d.map('HORMONE_HEAD');
      return CrPage(
        title: T('خطر الهرمونات'),
        sub: T('الحقيقة عن المنشطات'),
        children: [
          _foodTabs(context, 'hormones'),
          CrCard(
            color: CrColors.redWash,
            border: CrColors.redLine,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(T(head['title'] as String), style: crH1(20).copyWith(color: CrColors.red)),
              const SizedBox(height: 6),
              Text(T(head['body'] as String)),
            ]),
          ),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.5,
            children: [for (final f in d.list('HORMONE_FACTS')) CrStat(f['n'] as String, T(f['t'] as String), color: CrColors.red)],
          ),
          for (final h in d.list('HORMONES'))
            CrCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
                Text(T(h['n'] as String), style: crH3),
                Text(T(h['short'] as String), style: crMuted),
                for (final r in (h['risks'] as List))
                  Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Padding(padding: EdgeInsets.only(top: 6), child: Icon(Icons.circle, size: 6, color: CrColors.red)),
                    const SizedBox(width: 8),
                    Expanded(child: Text(T(r as String), style: const TextStyle(fontSize: 14))),
                  ]),
              ], 6)),
            ),
          Text(T('إذا تستخدم هسه أو استخدمت قبل'), style: crH3),
          CrList([for (final x in d.raw('HORMONE_HELP')) CrRow(title: T(x as String), icon: Icons.health_and_safety_outlined)]),
        ],
      );
    });
  }
}

// ─────────────────────────── 11 · AI coach ─────────────────────────────────
class CrCoachScreen extends ConsumerStatefulWidget {
  const CrCoachScreen({super.key});
  @override
  ConsumerState<CrCoachScreen> createState() => _CrCoachScreenState();
}

class _CrCoachScreenState extends ConsumerState<CrCoachScreen> {
  final msgs = <(bool, String)>[]; // (isUser, text)
  final _ctl = TextEditingController();
  bool busy = false;
  @override
  void dispose() {
    _ctl.dispose();
    super.dispose();
  }

  Future<void> _send(String q, {String? canned}) async {
    q = q.trim();
    if (q.isEmpty || busy) return;
    setState(() {
      msgs.add((true, q));
      busy = true;
    });
    _ctl.clear();
    String reply;
    try {
      // City Gym AI coach (OpenAI when a key is set, otherwise the built-in engine).
      final langHint = CrI18n.isKu ? ' (جاوب بالكوردي السوراني)' : CrI18n.isEn ? ' (answer in English)' : ' (جاوب باللهجة العراقية)';
      final res = await ApiClient().post('/ai/chat', data: {'message': '$q$langHint'});
      reply = (res.data['data']['reply'] ?? '').toString();
    } catch (_) {
      reply = canned ?? T('هاي نسخة تجريبية. افتح الصفحة داخل Claude حتى أجاوبك جواب حقيقي. جرّب الأسئلة الجاهزة.')
          .replaceAll('Claude', tr3('التطبيق ويه الإنترنت وحساب', 'the app online with an account', 'ئەپەکە بە ئینتەرنێت و هەژمار'));
    }
    if (!mounted) return;
    setState(() {
      msgs.add((false, reply));
      busy = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return CrLoader(builder: (context, d, st) {
      final canned = d.raw('CANNED');
      return Directionality(
        textDirection: CrI18n.dir,
        child: Scaffold(
          backgroundColor: CrColors.bg,
          body: SafeArea(
            bottom: false,
            child: Column(children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                child: Row(children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: const BoxDecoration(shape: BoxShape.circle, color: CrColors.teal),
                    child: const Icon(Icons.auto_awesome, color: CrColors.tealInk),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(T('المدرب الذكي'), style: crH1(26)),
                    Text(T('يتعلم من طريقة الكوتش ريناس · 24 ساعة'), style: crSmall),
                  ])),
                  const CrLangButton(),
                ]),
              ),
              Expanded(
                child: ListView(padding: const EdgeInsets.fromLTRB(16, 4, 16, 12), children: gap([
                  if (msgs.isEmpty)
                    CrCard(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
                        Text(T('اسألني أي شي عن التمرين والأكل والمكملات'), style: crH3),
                        Text(T('مثلاً:'), style: crMuted),
                        Wrap(spacing: 6, runSpacing: 6, children: [
                          for (final c in canned)
                            ActionChip(
                              label: Text(T(c[0] as String), style: const TextStyle(fontSize: 13)),
                              backgroundColor: CrColors.raised,
                              side: const BorderSide(color: CrColors.line2),
                              onPressed: () => _send(T(c[0] as String), canned: T(c[1] as String)),
                            ),
                        ]),
                      ], 8)),
                    ),
                  for (final m in msgs)
                    Align(
                      alignment: m.$1 ? AlignmentDirectional.centerStart : AlignmentDirectional.centerEnd,
                      child: Container(
                        constraints: const BoxConstraints(maxWidth: 330),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: m.$1 ? CrColors.line3 : CrColors.surface,
                          border: m.$1 ? null : Border.all(color: CrColors.line2),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: SelectableText(m.$2, style: const TextStyle(fontSize: 14, height: 1.6)),
                      ),
                    ),
                  if (busy) Text(T('يفكر…'), style: crMuted),
                  // Upsell to real 1-on-1 coaching (design board 11).
                  CrCard(
                    onTap: () => context.push('/renas/plans'),
                    radius: 16,
                    child: Row(children: [
                      const CircleAvatar(radius: 18, backgroundColor: CrColors.amber, child: Text('ر', style: TextStyle(color: CrColors.amberInk, fontWeight: FontWeight.w700))),
                      const SizedBox(width: 10),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(T('تريد مدرب حقيقي وياك؟'), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                        Text(T('تدريب شخصي مباشر مع الكوتش ريناس'), style: crSmall),
                      ])),
                      const Icon(Icons.chevron_left_rounded, color: CrColors.muted, textDirection: TextDirection.ltr),
                    ]),
                  ),
                  Text(T('هذي معلومات عامة مو نصيحة طبية. إذا عندك مرض أو تاخذ دوا، اسأل طبيبك أول.'), style: crSmall),
                ], 10)),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
                child: Row(children: [
                  Expanded(
                    child: TextField(
                      controller: _ctl,
                      enabled: !busy,
                      textInputAction: TextInputAction.send,
                      onSubmitted: _send,
                      inputFormatters: [LengthLimitingTextInputFormatter(900)],
                      decoration: InputDecoration(
                        hintText: T('اسأل أي شي · عربي، کوردی، English'),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: const BorderSide(color: CrColors.line3)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    tooltip: T('إرسال'),
                    onPressed: busy ? null : () => _send(_ctl.text),
                    style: IconButton.styleFrom(backgroundColor: CrColors.teal, foregroundColor: CrColors.tealInk, fixedSize: const Size(48, 48)),
                    icon: const Icon(Icons.arrow_upward_rounded),
                  ),
                ]),
              ),
            ]),
          ),
        ),
      );
    });
  }
}

// ─────────────────────────── 12 · Shop ─────────────────────────────────────
const _pStyle = {
  'supp': [Color(0xFF1C2A3D), CrColors.blue, Icons.science_outlined],
  'food': [Color(0xFF3A2A12), CrColors.amber, Icons.local_drink_outlined],
  'gear': [CrColors.tealWash, CrColors.teal, Icons.fitness_center_rounded],
  'wear': [Color(0xFF2A1F2A), Color(0xFFE6A6E6), Icons.checkroom_rounded],
};
const kStackPrice = 89000;

int crCartTotal(CrData d, Map<String, int> cart) {
  var t = 0;
  final pm = {for (final p in d.list('PRODUCTS')) p['k']: p};
  cart.forEach((k, q) {
    t += (k == 'stack' ? kStackPrice : ((pm[k]?['p'] as num?) ?? 0).toInt()) * q;
  });
  return t;
}

class CrShopScreen extends ConsumerStatefulWidget {
  const CrShopScreen({super.key});
  @override
  ConsumerState<CrShopScreen> createState() => _CrShopScreenState();
}

class _CrShopScreenState extends ConsumerState<CrShopScreen> {
  String cat = 'all';
  @override
  Widget build(BuildContext context) {
    return CrLoader(builder: (context, d, st) {
      final items = d.list('PRODUCTS').where((p) => cat == 'all' || p['c'] == cat).toList();
      final cart = st.cart;
      final n = cart.values.fold<int>(0, (a, b) => a + b);
      return CrPage(
        back: false,
        title: T('المتجر'),
        sub: T('يوصلك لكل العراق · الدفع عند الاستلام'),
        actions: const [CrLangButton()],
        bottom: n == 0
            ? null
            : InkWell(
                onTap: () => context.push('/renas/checkout'),
                borderRadius: BorderRadius.circular(28),
                child: Container(
                  height: 56,
                  padding: const EdgeInsetsDirectional.only(start: 22, end: 8),
                  decoration: BoxDecoration(color: CrColors.teal, borderRadius: BorderRadius.circular(28), boxShadow: const [BoxShadow(color: Color(0x80000000), blurRadius: 30, offset: Offset(0, 10))]),
                  child: Row(children: [
                    Expanded(child: Text('${T('{n} أغراض', {'n': n})} · ${fmt(crCartTotal(d, cart))} ${da()}', style: const TextStyle(color: CrColors.tealInk, fontWeight: FontWeight.w700))),
                    Container(
                      height: 40,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(color: CrColors.tealInk, borderRadius: BorderRadius.circular(20)),
                      child: Text(T('اطلب'), style: const TextStyle(color: CrColors.ink, fontWeight: FontWeight.w700, fontSize: 13)),
                    ),
                  ]),
                ),
              ),
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(color: const Color(0xFF12201F), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF1D3B39))),
            child: Row(children: [
              const Icon(Icons.verified_user_outlined, size: 16, color: CrColors.teal),
              const SizedBox(width: 8),
              Expanded(child: Text(T('بضاعة أصلية من مستورد مرخّص · مع تاريخ الإنتاج والانتهاء'), style: crSmall.copyWith(color: CrColors.soft))),
            ]),
          ),
          SizedBox(
            height: 36,
            child: ListView(scrollDirection: Axis.horizontal, children: [
              for (final c in [['all', 'الكل'], ['supp', 'مكملات'], ['food', 'أكل وشرب'], ['gear', 'أدوات'], ['wear', 'ملابس']])
                Padding(padding: const EdgeInsetsDirectional.only(end: 8), child: CrChip(T(c[1]), on: cat == c[0], onTap: () => setState(() => cat = c[0]))),
            ]),
          ),
          if (cat == 'all' || cat == 'supp')
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(color: CrColors.amber, borderRadius: BorderRadius.circular(20)),
              child: Row(children: [
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(T('باكج الكوتش للمبتدئين'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: CrColors.amberInk)),
                    Text('${T('واي + كرياتين')} · ${fmt(kStackPrice)} ${da()}', style: crH1(20).copyWith(color: CrColors.amberInk)),
                    Text(T('توفّر 6,000 د.ع'), style: const TextStyle(fontSize: 12, color: CrColors.amberInk)),
                  ]),
                ),
                FilledButton(
                  style: FilledButton.styleFrom(backgroundColor: CrColors.amberInk, foregroundColor: const Color(0xFFFFF4DE)),
                  onPressed: () {
                    st.addCart('stack');
                    crToast(context, T('انضاف'));
                  },
                  child: Text(T('ضيف')),
                ),
              ]),
            ),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 0.78,
            children: [
              for (final p in items)
                Builder(builder: (context) {
                  final s = _pStyle[p['c']] ?? _pStyle['gear']!;
                  final q = cart[p['k']] ?? 0;
                  return Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: CrColors.surface, borderRadius: BorderRadius.circular(18), border: Border.all(color: CrColors.line2)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Expanded(
                        child: Container(
                          width: double.infinity,
                          decoration: BoxDecoration(color: s[0] as Color, borderRadius: BorderRadius.circular(12)),
                          child: Icon(s[2] as IconData, size: 36, color: s[1] as Color),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(T(p['n'] as String), maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, height: 1.4)),
                      Text('${T('متوفر')} ${p['s']}', style: const TextStyle(fontSize: 11, color: CrColors.muted)),
                      Row(children: [
                        Expanded(child: Text('${fmt(p['p'] as num)} ${da()}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700))),
                        InkWell(
                          onTap: () => st.addCart(p['k'] as String),
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            height: 32,
                            constraints: const BoxConstraints(minWidth: 32),
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(color: q > 0 ? CrColors.teal : CrColors.raised, borderRadius: BorderRadius.circular(16)),
                            child: Text(q > 0 ? '$q' : '+', style: TextStyle(fontWeight: FontWeight.w700, color: q > 0 ? CrColors.tealInk : CrColors.ink)),
                          ),
                        ),
                      ]),
                    ]),
                  );
                }),
            ],
          ),
          CrCard(
            onTap: () => context.push('/renas/supps'),
            child: Row(children: [
              const Icon(Icons.medication_outlined, color: CrColors.blue),
              const SizedBox(width: 10),
              Expanded(child: Text(T('قبل لا تشتري: شوف دليل المكملات، شنو يفيد وشنو لا'), style: crSmall.copyWith(color: CrColors.soft))),
            ]),
          ),
          Text(tr3('منتجات وأسعار المتجر أمثلة لحد ما يحدّثها الكوتش.', 'Shop products and prices are samples until the coach updates them.', 'بەرهەم و نرخەکانی فرۆشگا نموونەن تا کۆچ نوێیان بکاتەوە.'), style: crSmall),
        ],
      );
    });
  }
}

// ─────────────────────────── 13 · Checkout ─────────────────────────────────
class CrCheckoutScreen extends ConsumerStatefulWidget {
  const CrCheckoutScreen({super.key});
  @override
  ConsumerState<CrCheckoutScreen> createState() => _CrCheckoutScreenState();
}

class _CrCheckoutScreenState extends ConsumerState<CrCheckoutScreen> {
  String method = 'cod';
  String? gov;
  final _tel = TextEditingController();
  bool done = false;
  int doneTotal = 0;
  @override
  void dispose() {
    _tel.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CrLoader(builder: (context, d, st) {
      final pm = {for (final p in d.list('PRODUCTS')) p['k']: p};
      final govs = d.raw('GOVS').cast<String>();
      gov ??= govs.first;
      const delivery = 5000;
      if (done) {
        return CrPage(title: T('تم الطلب'), children: [
          CrHero(children: [Text(T('طلبك وصلنا'), style: crH1(26).copyWith(color: CrColors.tealInk)), Text('${fmt(doneTotal)} ${da()}')]),
          Text(T('راح نراسلك واتساب أو نتصل بيك حتى نأكد الطلب قبل الشحن. يوصلك خلال 1–3 أيام.'), style: crMuted),
          Text(tr3('ملاحظة: الطلب ينحفظ على جهازك لحد ما يتربط المتجر بالسيرفر.', 'Note: the order is kept on this phone until the shop is connected to the server.', 'تێبینی: داواکاری لەسەر مۆبایلەکەت دەمێنێتەوە تا فرۆشگا بە سێرڤەر دەبەسترێتەوە.'), style: crSmall),
          CrButton(T('رجوع للرئيسية'), onTap: () => context.go('/renas')),
        ]);
      }
      final lines = st.cart.entries.where((e) => e.value > 0).toList();
      if (lines.isEmpty) {
        return CrPage(title: T('إتمام الطلب'), children: [Text(T('السلة فارغة.'), style: crMuted), CrButton(T('روح للمتجر'), onTap: () => context.go('/renas/shop'))]);
      }
      final sub = crCartTotal(d, st.cart);
      final total = sub + delivery;
      final methods = [
        ['cod', 'الدفع عند الاستلام', 'ادفع كاش للمندوب على باب البيت'],
        ['qi', 'كي كارد / ماستر / فيزا', 'ادفع هسه · أسرع بالتجهيز'],
        ['wallet', 'زين كاش / FIB', 'ادفع من المحفظة بثواني'],
      ];
      return CrPage(
        title: T('إتمام الطلب'),
        bottom: CrButton(method == 'cod' ? T('أكّد الطلب') : '${T('ادفع')} ${fmt(total)} ${da()}', height: 56, onTap: () {
          final t = _tel.text.replaceAll(RegExp(r'\D'), '');
          if (t.length < 10 || !t.startsWith('07')) {
            crToast(context, T('اكتب رقم موبايل صحيح يبدي بـ 07'));
            return;
          }
          final orders = List<dynamic>.from((st.s['orders'] as List?) ?? []);
          orders.add({'at': DateTime.now().toIso8601String(), 'cart': st.cart, 'total': total, 'gov': gov, 'tel': t, 'method': method, 'status': 'pending'});
          st.s['orders'] = orders;
          st.s['cart'] = <String, int>{};
          st.save();
          setState(() {
            done = true;
            doneTotal = total;
          });
        }),
        children: [
          CrCard(
            radius: 18,
            border: CrColors.line2,
            child: Column(children: gap([
              for (final l in lines)
                Row(children: [
                  Expanded(child: Text('${l.key == 'stack' ? T('باكج الكوتش للمبتدئين') : T((pm[l.key]?['n'] ?? l.key) as String)} × ${l.value}')),
                  Text(fmt(l.value * (l.key == 'stack' ? kStackPrice : ((pm[l.key]?['p'] as num?) ?? 0))), style: const TextStyle(fontWeight: FontWeight.w600)),
                  IconButton(tooltip: T('شيل وحدة'), visualDensity: VisualDensity.compact, onPressed: () => st.addCart(l.key, -1), icon: const Icon(Icons.remove_circle_outline, size: 18, color: CrColors.muted)),
                ]),
              Row(children: [Expanded(child: Text('${T('التوصيل')} · ${T(gov!)}', style: crMuted)), Text(fmt(delivery), style: crMuted)]),
              const Divider(height: 1, color: CrColors.line2),
              Row(children: [Expanded(child: Text(T('المجموع'), style: const TextStyle(fontWeight: FontWeight.w600))), Text('${fmt(total)} ${da()}', style: crH1(24))]),
            ], 8)),
          ),
          Row(children: [
            Expanded(
              child: DropdownButtonFormField<String>(
                initialValue: gov,
                dropdownColor: CrColors.surface,
                decoration: InputDecoration(labelText: T('المحافظة')),
                items: [for (final g in govs) DropdownMenuItem(value: g, child: Text(T(g)))],
                onChanged: (v) => setState(() => gov = v),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _tel,
                keyboardType: TextInputType.phone,
                textDirection: TextDirection.ltr,
                decoration: InputDecoration(labelText: T('رقم الموبايل'), hintText: '07XX XXX XXXX'),
              ),
            ),
          ]),
          Text(T('شلون تريد تدفع؟'), style: crH3.copyWith(fontSize: 14, color: CrColors.soft)),
          for (final m in methods)
            InkWell(
              onTap: () => setState(() => method = m[0]),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: method == m[0] ? const Color(0xFF12201F) : CrColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: method == m[0] ? CrColors.teal : CrColors.line2, width: 1.5),
                ),
                child: Row(children: [
                  Icon(method == m[0] ? Icons.radio_button_checked : Icons.radio_button_off, color: method == m[0] ? CrColors.teal : CrColors.dim),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(T(m[1]), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                    Text(T(m[2]), style: crSmall),
                  ])),
                ]),
              ),
            ),
          CrCard(
            color: CrColors.amberWash,
            border: CrColors.amberLine,
            radius: 14,
            padding: 12,
            child: Text(
              method == 'cod'
                  ? T('راح نراسلك واتساب أو نتصل بيك حتى نأكد الطلب قبل الشحن. يوصلك خلال 1–3 أيام.')
                  : '${T('الدفع آمن. بعد الدفع نجهّز طلبك ويوصلك خلال 1–3 أيام.')}\n${tr3('(الدفع الإلكتروني مو مربوط بعد — الكوتش يأكد الطلب ويتواصل وياك.)', '(Online payment is not connected yet — the coach confirms the order and contacts you.)', '(پارەدانی ئەلیکترۆنی هێشتا نەبەستراوە — کۆچ داواکارییەکە پشتڕاست دەکاتەوە و پەیوەندیت پێوە دەکات.)')}',
              style: const TextStyle(fontSize: 13, color: Color(0xFFF2E6CF), height: 1.5),
            ),
          ),
        ],
      );
    });
  }
}
