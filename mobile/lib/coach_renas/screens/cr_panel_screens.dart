// Coach Renas — coach-only screens: panel (clients, payments to confirm),
// one client (check-ins, reply, program), and the Instagram content planner.
// Server: /api/coach-renas/panel/* (admins and coaches; COACH_RENAS_COACH_EMAILS limits it).
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../cr_api.dart';
import '../cr_core.dart';

String _kindLabel(Map s) {
  final k = s['kind'];
  if (k == 'coaching') return T('تدريب شخصي 1-على-1');
  if (k == 'tier') return '${T('اشتراكي')} · ${s['key']}';
  if (k == 'program') return '${tr3('برنامج', 'Program', 'پرۆگرام')} · ${s['key']}';
  return '${s['key']}';
}

// ─────────────────────────── Panel ─────────────────────────────────────────
class CrPanelScreen extends ConsumerStatefulWidget {
  const CrPanelScreen({super.key});
  @override
  ConsumerState<CrPanelScreen> createState() => _CrPanelScreenState();
}

class _CrPanelScreenState extends ConsumerState<CrPanelScreen> {
  Map<String, dynamic>? summary;
  List<dynamic> clients = const [], payments = const [];
  String? error;
  bool loading = true;
  bool sample = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final r = await Future.wait([CrApi.panelSummary(), CrApi.panelClients(), CrApi.panelPayments()]);
      if (!mounted) return;
      setState(() {
        summary = r[0] as Map<String, dynamic>;
        clients = r[1] as List;
        payments = r[2] as List;
        sample = false;
        loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        error = CrApi.error(e);
        loading = false;
      });
    }
  }

  Future<void> _decide(String id, String decision) async {
    try {
      await CrApi.panelDecide(id, decision);
      if (mounted) crToast(context, decision == 'approve' ? T('تأكد · انفتح الاشتراك') : T('انرفض'));
      _load();
    } catch (e) {
      if (mounted) crToast(context, CrApi.error(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    return CrLoader(builder: (context, d, st) {
      // Offline / no access -> show the prototype's sample clients so the screen can be reviewed.
      final showSample = error != null;
      final sampleClients = d.list('CLIENTS');
      final samplePays = d.list('PAYS');
      final s = summary ?? const {};
      return CrPage(
        title: T('لوحة الكوتش'),
        sub: T('إلك إنت، ريناس'),
        actions: [IconButton(tooltip: tr3('تحديث', 'Refresh', 'نوێکردنەوە'), onPressed: _load, icon: const Icon(Icons.refresh_rounded))],
        children: [
          if (loading) const LinearProgressIndicator(color: CrColors.teal, backgroundColor: CrColors.raised),
          if (showSample)
            CrCard(
              color: CrColors.amberWash,
              border: CrColors.amberLine,
              child: Text('${tr3('ما وصلنا للسيرفر أو حسابك مو كوتش. هاي أمثلة.', 'Could not reach the server or your account is not a coach. These are samples.', 'نەگەیشتینە سێرڤەر یان هەژمارەکەت کۆچ نییە. ئەمانە نموونەن.')}\n$error', style: crSmall.copyWith(color: CrColors.amberSoft)),
            ),
          Row(children: [
            Expanded(child: CrStat(showSample ? '${sampleClients.length}' : '${s['clients'] ?? 0}', T('متدربين'))),
            const SizedBox(width: 10),
            Expanded(child: CrStat(showSample ? '${sampleClients.where((c) => (c['miss'] as num) >= 2 || (c['last'] as num) >= 14).length}' : '${s['needsAttention'] ?? 0}', T('يحتاجون انتباه'), color: CrColors.amber)),
            const SizedBox(width: 10),
            Expanded(child: CrStat(showSample ? '${samplePays.length}' : '${s['pendingPayments'] ?? 0}', T('دفعات تنتظر'), color: CrColors.blue)),
          ]),
          Text(T('دفعات التحويل تنتظر تأكيدك'), style: crH3),
          if (!showSample && payments.isEmpty) Text(tr3('ماكو دفعات تنتظر.', 'No payments waiting.', 'هیچ پارەدانێک چاوەڕێ ناکات.'), style: crMuted),
          CrList([
            if (showSample)
              for (final p in samplePays)
                CrRow(title: '${T(p['n'] as String)} · ${fmt(p['amt'] as num)} ${da()}', sub: '${T(p['what'] as String)} · ${T(p['via'] as String)} · ${T('مثال')}')
            else
              for (final p in payments)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('${p['user']?['name'] ?? '—'} · ${fmt((p['amount'] as num?) ?? 0)} ${da()}', style: const TextStyle(fontWeight: FontWeight.w600)),
                    Text('${_kindLabel(p as Map)} · ${p['period']} · ${p['method']} · ${p['reference'] ?? ''}', style: crSmall),
                    if (p['receiptUrl'] != null) Text('${T('الإيصال')}: ${p['receiptUrl']}', style: crSmall, textDirection: TextDirection.ltr),
                    const SizedBox(height: 6),
                    Row(children: [
                      Expanded(child: CrButton(T('أكّد'), height: 38, onTap: () => _decide(p['_id'] as String, 'approve'))),
                      const SizedBox(width: 8),
                      Expanded(child: CrButton(T('ارفض'), kind: 'ghost', height: 38, onTap: () => _decide(p['_id'] as String, 'reject'))),
                    ]),
                  ]),
                ),
          ]),
          Text(T('التقارير'), style: crH3),
          CrList([
            if (showSample)
              for (final c in sampleClients)
                CrRow(
                  title: '${T(c['n'] as String)} · ${T('مثال')}',
                  sub: '${T(c['plan'] as String)} · ${T('آخر تقرير قبل {n} يوم', {'n': c['last']})}',
                  trailing: (c['miss'] as num) >= 2 ? CrTag(T('فاته تقريرين'), fg: CrColors.amber, bg: CrColors.amberWash) : null,
                )
            else
              for (final c in clients)
                CrRow(
                  title: '${c['user']?['name'] ?? '—'}${c['coaching'] == true ? ' · 1-1' : ''}',
                  sub: c['daysSinceCheckIn'] == null
                      ? tr3('ما رسل تقرير بعد', 'No check-in yet', 'هێشتا ڕاپۆرتی نەناردووە')
                      : T('آخر تقرير قبل {n} يوم', {'n': c['daysSinceCheckIn']}),
                  trailing: c['needsAttention'] == true
                      ? CrTag(T('يحتاجون انتباه'), fg: CrColors.amber, bg: CrColors.amberWash)
                      : c['unanswered'] == true
                          ? CrTag(tr3('ينتظر ردك', 'Needs reply', 'چاوەڕێی وەڵامە'), fg: CrColors.blue, bg: CrColors.blueWash)
                          : null,
                  onTap: () => context.push('/renas/panel/client/${c['user']['_id']}'),
                ),
          ]),
          CrButton(T('خطة المحتوى - ريناس'), kind: 'ghost', icon: Icons.campaign_outlined, onTap: () => context.push('/renas/content')),
          Text(T('بالتطبيق الحقيقي هذي اللوحة بس إلك، وتشوف متدربينك الحقيقيين.'), style: crSmall),
        ],
      );
    });
  }
}

// ─────────────────────────── One client ────────────────────────────────────
class CrPanelClientScreen extends ConsumerStatefulWidget {
  const CrPanelClientScreen({super.key, required this.userId});
  final String userId;
  @override
  ConsumerState<CrPanelClientScreen> createState() => _CrPanelClientScreenState();
}

class _CrPanelClientScreenState extends ConsumerState<CrPanelClientScreen> {
  Map<String, dynamic>? data;
  String? error;
  final _reply = TextEditingController();
  final _note = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _reply.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final r = await CrApi.panelClient(widget.userId);
      if (!mounted) return;
      setState(() {
        data = r;
        _note.text = (r['profile']?['coachNote'] ?? '').toString();
      });
    } catch (e) {
      if (mounted) setState(() => error = CrApi.error(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    return CrLoader(builder: (context, d, st) {
      if (data == null) {
        return CrPage(title: T('لوحة الكوتش'), children: [
          if (error != null) Text(error!, style: crMuted) else const LinearProgressIndicator(color: CrColors.teal),
        ]);
      }
      final u = Map<String, dynamic>.from(data!['user'] as Map);
      final profile = data!['profile'] as Map?;
      final checks = (data!['checkIns'] as List).cast<Map>();
      final kgs = checks.reversed.map((c) => c['kg']).where((v) => v != null).toList();
      final lastC = checks.isEmpty ? null : checks.first;
      final programs = d.list('PROGRAMS');
      return CrPage(
        title: '${u['name']}',
        sub: '${u['email'] ?? ''} ${u['phone'] ?? ''}',
        children: [
          Row(children: [
            Expanded(child: CrStat(kgs.isEmpty ? '—' : '${kgs.last}', T('الوزن'))),
            const SizedBox(width: 10),
            Expanded(child: CrStat('${lastC?['sleep'] ?? '—'}/5', T('النوم'))),
            const SizedBox(width: 10),
            Expanded(child: CrStat('${lastC?['workoutsDone'] ?? '—'}', T('تمارين'))),
          ]),
          if (kgs.length > 1) CrCard(child: Text('${T('الوزن بآخر الأسابيع')}: ${kgs.join(' → ')}', textDirection: TextDirection.ltr)),
          if (profile != null)
            CrCard(
              child: Wrap(spacing: 6, runSpacing: 6, children: [
                for (final v in [profile['goal'], profile['level'], '${profile['days']}d', profile['place'], ...((profile['injuries'] as List?) ?? const [])])
                  if (v != null) CrTag('$v', fg: CrColors.soft, bg: CrColors.raised),
                if (profile['parqFlag'] == true) CrTag(tr3('أسئلة الصحة: انتبه', 'Health screen: check', 'پرسیاری تەندروستی: ئاگاداربە'), fg: CrColors.red, bg: CrColors.redWash),
              ]),
            ),
          DropdownButtonFormField<String>(
            initialValue: programs.any((p) => p['id'] == profile?['programKey']) ? profile!['programKey'] as String : null,
            dropdownColor: CrColors.surface,
            decoration: InputDecoration(labelText: T('برنامجي')),
            items: [for (final p in programs) DropdownMenuItem(value: p['id'] as String, child: Text(T(p['t'] as String), overflow: TextOverflow.ellipsis))],
            onChanged: (v) async {
              if (v == null) return;
              try {
                await CrApi.panelUpdateClient(widget.userId, {'programKey': v});
                if (context.mounted) crToast(context, T('انحفظ'));
              } catch (e) {
                if (context.mounted) crToast(context, CrApi.error(e));
              }
            },
          ),
          TextField(
            controller: _note,
            maxLines: 3,
            decoration: InputDecoration(labelText: tr3('ملاحظة خاصة إلك (المتدرب ما يشوفها)', 'Private note (client cannot see it)', 'تێبینیی تایبەت (ڕاهێنراو نایبینێت)')),
            onEditingComplete: () => CrApi.panelUpdateClient(widget.userId, {'coachNote': _note.text}).then((_) {
              if (context.mounted) crToast(context, T('انحفظ'));
            }).catchError((_) {}),
          ),
          Text(T('التقارير'), style: crH3),
          for (final c in checks)
            CrCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
                Text('${(c['createdAt'] ?? '').toString().split('T').first} · ${c['kg'] ?? '—'} ${kg()} · ${T('النوم')} ${c['sleep'] ?? '—'}/5 · ${T('الطاقة')} ${c['energy'] ?? '—'}/5', style: const TextStyle(fontWeight: FontWeight.w600)),
                if ((c['note'] ?? '').toString().isNotEmpty) Text('${T('ملاحظته')}: ${c['note']}', style: crMuted),
                if (c['reply'] != null)
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: CrColors.tealWash, borderRadius: BorderRadius.circular(12)),
                    child: Text('${T('ردّك')}: ${c['reply']}'),
                  )
                else if (identical(c, checks.first)) ...[
                  TextField(controller: _reply, maxLines: 4, decoration: InputDecoration(labelText: T('ردّك'))),
                  CrButton(T('أرسل الرد'), height: 44, onTap: () async {
                    final v = _reply.text.trim();
                    if (v.isEmpty) {
                      crToast(context, T('اكتب الرد أول'));
                      return;
                    }
                    try {
                      await CrApi.panelReply(c['_id'] as String, v);
                      _reply.clear();
                      if (context.mounted) crToast(context, T('انرسل الرد'));
                      _load();
                    } catch (e) {
                      if (context.mounted) crToast(context, CrApi.error(e));
                    }
                  }),
                ],
              ], 6)),
            ),
          if (checks.isEmpty) Text(tr3('ما رسل تقرير بعد', 'No check-in yet', 'هێشتا ڕاپۆرتی نەناردووە'), style: crMuted),
          Text(tr3('الاشتراكات', 'Subscriptions', 'بەشدارییەکان'), style: crH3),
          CrList([
            for (final s in (data!['subscriptions'] as List).cast<Map>())
              CrRow(title: '${_kindLabel(s)} · ${fmt((s['amount'] as num?) ?? 0)} ${da()}', sub: '${s['status']} · ${s['method']} · ${(s['endsAt'] ?? '').toString().split('T').first}'),
          ]),
        ],
      );
    });
  }
}

// ─────────────────────────── Content planner ───────────────────────────────
const _pillars = {
  'bjj': ['رحلتي في الجيو جيتسو', CrColors.teal],
  'building': ['أبني تطبيقاً', CrColors.blue],
  'discipline': ['الانضباط والتمرين', CrColors.amber],
  'life': ['حياتي وثقافتي', Color(0xFFE6A6E6)],
  'engage': ['تفاعل', CrColors.soft],
};
const _formats = {'reel': 'ريل', 'photo': 'صورة', 'carousel': 'كاروسيل', 'story': 'ستوري'};
const _statuses = {'idea': 'فكرة', 'filmed': 'متصوّر', 'posted': 'منشور'};

class CrContentScreen extends ConsumerStatefulWidget {
  const CrContentScreen({super.key});
  @override
  ConsumerState<CrContentScreen> createState() => _CrContentScreenState();
}

class _CrContentScreenState extends ConsumerState<CrContentScreen> {
  List<dynamic> items = const [];
  String? error;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await CrApi.contentList();
      if (!mounted) return;
      setState(() {
        items = r;
        loading = false;
        error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        error = CrApi.error(e);
        loading = false;
      });
    }
  }

  Future<void> _edit([Map? item]) async {
    final idea = TextEditingController(text: item?['idea']?.toString() ?? '');
    final caption = TextEditingController(text: item?['caption']?.toString() ?? '');
    final day = TextEditingController(text: item?['day']?.toString() ?? '');
    var pillar = (item?['pillar'] ?? 'discipline').toString();
    var format = (item?['format'] ?? 'reel').toString();
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: CrColors.surface,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => Directionality(
          textDirection: CrI18n.dir,
          child: Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(ctx).viewInsets.bottom + 16),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: gap([
              Text(item == null ? tr3('منشور جديد', 'New post', 'پۆستی نوێ') : tr3('عدّل المنشور', 'Edit post', 'پۆست دەستکاری بکە'), style: crH3),
              Wrap(spacing: 6, runSpacing: 6, children: [
                for (final p in _pillars.entries) CrChip(p.value[0] as String, on: pillar == p.key, light: false, onTap: () => setS(() => pillar = p.key)),
              ]),
              Wrap(spacing: 6, children: [
                for (final f in _formats.entries) CrChip(f.value, on: format == f.key, light: false, onTap: () => setS(() => format = f.key)),
              ]),
              TextField(controller: day, decoration: const InputDecoration(labelText: 'اليوم')),
              TextField(controller: idea, decoration: const InputDecoration(labelText: 'الفكرة')),
              TextField(controller: caption, maxLines: 3, decoration: const InputDecoration(labelText: 'الكابشن')),
              CrButton(T('احفظ'), onTap: () => Navigator.pop(ctx, true)),
            ], 10)),
          ),
        ),
      ),
    );
    if (ok != true || idea.text.trim().length < 2) return;
    final body = {'pillar': pillar, 'format': format, 'day': day.text.trim(), 'idea': idea.text.trim(), 'caption': caption.text.trim()};
    try {
      if (item == null) {
        await CrApi.contentAdd({...body, 'order': items.length + 1});
      } else {
        await CrApi.contentUpdate(item['_id'] as String, body);
      }
      _load();
    } catch (e) {
      if (mounted) crToast(context, CrApi.error(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    return CrLoader(builder: (context, d, st) {
      final posted = items.where((i) => i['status'] == 'posted').length;
      return CrPage(
        title: T('خطة المحتوى - ريناس'),
        sub: '5 ${tr3('منشورات بالأسبوع · 3 ريلز و2 صور', 'posts a week · 3 reels, 2 photos', 'پۆست لە هەفتەدا · 3 ڕیڵز و 2 وێنە')}',
        bottom: CrButton(tr3('ضيف فكرة', 'Add an idea', 'بیرۆکەیەک زیاد بکە'), icon: Icons.add, onTap: () => _edit()),
        children: [
          if (loading) const LinearProgressIndicator(color: CrColors.teal),
          if (error != null) Text(error!, style: crMuted),
          if (items.isNotEmpty) Row(children: [
            Expanded(child: CrStat('${items.length}', tr3('أفكار', 'Ideas', 'بیرۆکە'))),
            const SizedBox(width: 10),
            Expanded(child: CrStat('$posted', tr3('منشور', 'Posted', 'بڵاوکراوە'), color: CrColors.teal)),
          ]),
          Wrap(spacing: 6, runSpacing: 6, children: [
            for (final p in _pillars.values) CrTag(p[0] as String, fg: p[1] as Color, bg: CrColors.raised),
          ]),
          for (final it in items)
            CrCard(
              onTap: () => _edit(it as Map),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: gap([
                Row(children: [
                  CrTag('${it['day'] ?? ''} · ${_formats[it['format']] ?? it['format']}', fg: (_pillars[it['pillar']]?[1] ?? CrColors.soft) as Color, bg: CrColors.raised),
                  const Spacer(),
                  PopupMenuButton<String>(
                    color: CrColors.surface,
                    tooltip: tr3('الحالة', 'Status', 'دۆخ'),
                    initialValue: it['status'] as String?,
                    onSelected: (v) async {
                      if (v == 'delete') {
                        await CrApi.contentDelete(it['_id'] as String).catchError((_) {});
                      } else {
                        await CrApi.contentUpdate(it['_id'] as String, {'status': v}).catchError((_) => <String, dynamic>{});
                      }
                      _load();
                    },
                    itemBuilder: (_) => [
                      for (final s in _statuses.entries) PopupMenuItem(value: s.key, child: Text(s.value)),
                      const PopupMenuItem(value: 'delete', child: Text('حذف', style: TextStyle(color: CrColors.red))),
                    ],
                    child: CrTag(_statuses[it['status']] ?? '${it['status']}', fg: it['status'] == 'posted' ? CrColors.teal : CrColors.amber, bg: it['status'] == 'posted' ? CrColors.tealWash : CrColors.amberWash),
                  ),
                ]),
                Text('${it['idea']}', style: crH3.copyWith(fontSize: 15)),
                if ((it['caption'] ?? '').toString().isNotEmpty) Text('${it['caption']}', style: crMuted, textDirection: TextDirection.rtl),
              ], 6)),
            ),
        ],
      );
    });
  }
}
