// Coach Renas — Food guide, Training guide and Coach tips (common mistakes),
// from the prototype's FOODG / TRAING / TIPS content (assets/coach_renas/guides.json).
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../cr_core.dart';

final crGuidesProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return Map<String, dynamic>.from(jsonDecode(await rootBundle.loadString('assets/coach_renas/guides.json')) as Map);
});

/// Tip of the day (same day -> same tip), Arabic source translated with T().
String? crTipOfDay(Map<String, dynamic>? guides) {
  final daily = (guides?['tips'] as Map?)?['daily'] as List?;
  if (daily == null || daily.isEmpty) return null;
  final n = DateTime.now();
  final day = DateTime(n.year, n.month, n.day).difference(DateTime(n.year)).inDays;
  return T(daily[day % daily.length].toString());
}

class CrGuideScreen extends ConsumerStatefulWidget {
  const CrGuideScreen({super.key, required this.kind});
  final String kind; // food | train
  @override
  ConsumerState<CrGuideScreen> createState() => _CrGuideScreenState();
}

class _CrGuideScreenState extends ConsumerState<CrGuideScreen> {
  String q = '';
  @override
  Widget build(BuildContext context) {
    final g = ref.watch(crGuidesProvider);
    final title = widget.kind == 'food' ? tr3('دليل الأكل', 'Food guide', 'ڕێبەری خواردن') : tr3('دليل التمرين', 'Training guide', 'ڕێبەری ڕاهێنان');
    return CrLoader(builder: (context, d, st) {
      return g.when(
        loading: () => CrPage(title: title, children: const [LinearProgressIndicator(color: CrColors.teal)]),
        error: (e, _) => CrPage(title: title, children: [Text('$e', style: crMuted)]),
        data: (all) {
          final part = Map<String, dynamic>.from(all[widget.kind] as Map);
          final ql = q.trim().toLowerCase();
          bool hit(Map it) => ql.isEmpty || '${pickL(it['t'])} ${pickL(it['d'])}'.toLowerCase().contains(ql);
          final sections = (part['sections'] as List).cast<Map>();
          final faq = (part['faq'] as List? ?? const []).cast<Map>();
          return CrPage(title: title, children: [
            TextField(
              onChanged: (v) => setState(() => q = v),
              decoration: InputDecoration(prefixIcon: const Icon(Icons.search_rounded, color: CrColors.muted), hintText: T('ابحث')),
            ),
            for (final s in sections)
              if ((s['items'] as List).cast<Map>().any(hit))
                Theme(
                  data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                  child: Container(
                    decoration: BoxDecoration(color: CrColors.surface, borderRadius: BorderRadius.circular(18), border: Border.all(color: CrColors.line)),
                    child: ExpansionTile(
                      initiallyExpanded: ql.isNotEmpty,
                      iconColor: CrColors.teal,
                      collapsedIconColor: CrColors.muted,
                      leading: Text('${s['icon'] ?? ''}', style: const TextStyle(fontSize: 22)),
                      title: Text(pickL(s['title']), style: crH3),
                      subtitle: Text(pickL(s['intro']), style: crSmall, maxLines: ql.isEmpty ? 2 : 6, overflow: TextOverflow.ellipsis),
                      childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
                      expandedCrossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        for (final it in (s['items'] as List).cast<Map>().where(hit))
                          Padding(
                            padding: const EdgeInsets.only(top: 10),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(pickL(it['t']), style: const TextStyle(fontWeight: FontWeight.w700, color: CrColors.teal)),
                              const SizedBox(height: 2),
                              Text(pickL(it['d']), style: const TextStyle(fontSize: 14, height: 1.6)),
                            ]),
                          ),
                      ],
                    ),
                  ),
                ),
            if (faq.isNotEmpty) Text(tr3('أسئلة شائعة', 'Common questions', 'پرسیارە باوەکان'), style: crH3),
            for (final f in faq.where((f) => ql.isEmpty || '${pickL(f['q'])} ${pickL(f['a'])}'.toLowerCase().contains(ql)))
              CrCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(pickL(f['q']), style: const TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(pickL(f['a']), style: crMuted.copyWith(color: CrColors.soft)),
              ])),
            Text(T('هذي معلومات عامة مو نصيحة طبية. إذا عندك مرض أو تاخذ دوا، اسأل طبيبك أول.'), style: crSmall),
          ]);
        },
      );
    });
  }
}

class CrTipsScreen extends ConsumerWidget {
  const CrTipsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final g = ref.watch(crGuidesProvider).valueOrNull;
    final title = tr3('نصايح الكوتش والأغلاط الشائعة', 'Coach tips and common mistakes', 'ئامۆژگارییەکانی کۆچ و هەڵە باوەکان');
    return CrLoader(builder: (context, d, st) {
      final cats = (((g?['tips'] as Map?)?['cats'] as List?) ?? const []).cast<Map>();
      final today = crTipOfDay(g);
      return CrPage(title: title, children: [
        if (g == null) const LinearProgressIndicator(color: CrColors.teal),
        if (today != null)
          CrCard(
            color: CrColors.amberWash,
            border: CrColors.amberLine,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(T('نصيحة اليوم من الكوتش'), style: const TextStyle(color: CrColors.amber, fontSize: 12, fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              Text(today, style: const TextStyle(fontWeight: FontWeight.w600)),
            ]),
          ),
        for (final c in cats) ...[
          Text(T('${c['t']}'), style: crH3),
          for (final it in (c['items'] as List).cast<Map>())
            CrCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Icon(Icons.close_rounded, color: CrColors.red, size: 18),
                  const SizedBox(width: 6),
                  Expanded(child: Text(T('${it['wrong']}'), style: const TextStyle(fontWeight: FontWeight.w600))),
                ]),
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Icon(Icons.check_rounded, color: CrColors.teal, size: 18),
                  const SizedBox(width: 6),
                  Expanded(child: Text(T('${it['right']}'))),
                ]),
                if (it['why'] != null) Text(T('${it['why']}'), style: crSmall),
                if (it['ex'] is List)
                  Wrap(spacing: 6, runSpacing: 6, children: [
                    for (final id in (it['ex'] as List))
                      if (d.exMap[id] != null) CrChip(d.x(d.exMap[id]!, 'ar'), light: false, onTap: () => context.push('/renas/ex/$id')),
                  ]),
              ], 6)),
            ),
        ],
      ]);
    });
  }
}
