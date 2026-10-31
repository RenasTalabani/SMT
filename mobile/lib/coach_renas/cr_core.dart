// Coach Renas ("مع الكوتش ريناس") — shared theme, data, i18n and local state.
//
// Design source: Claude artifact "Trainer App Design" (20 boards) and the
// working prototype "مع الكوتش ريناس". Colours, fonts and wording follow them.
// Texts are written in Iraqi Arabic (like the design) and translated with the
// prototype's own Kurdish (Sorani) and English dictionaries
// (assets/coach_renas/i18n_ku.json / i18n_en.json).
import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ── Colours (exact values from the design) ───────────────────────────────────
class CrColors {
  CrColors._();
  static const bg = Color(0xFF0E1113);
  static const surface = Color(0xFF171B1E);
  static const raised = Color(0xFF20262A);
  static const line = Color(0xFF262D31);
  static const line2 = Color(0xFF23292D);
  static const line3 = Color(0xFF2A3135);
  static const nav = Color(0xFF121618);
  static const ink = Color(0xFFF2F4F3);
  static const muted = Color(0xFF9AA3A8);
  static const soft = Color(0xFFC9D0D3);
  static const faint = Color(0xFF7D878C);
  static const dim = Color(0xFF4A5459);
  static const teal = Color(0xFF2BC4BE);
  static const tealInk = Color(0xFF06201F);
  static const tealWash = Color(0xFF12302F);
  static const tealLine = Color(0xFF1D4A47);
  static const amber = Color(0xFFF5A524);
  static const amberInk = Color(0xFF2A1A00);
  static const amberWash = Color(0xFF2A2112);
  static const amberLine = Color(0xFF4A3713);
  static const amberSoft = Color(0xFFE6D5B5);
  static const blue = Color(0xFF8FB8FF);
  static const blueWash = Color(0xFF1C2A3D);
  static const red = Color(0xFFF08A8A);
  static const redWash = Color(0xFF2E1717);
  static const redLine = Color(0xFF5A2626);
}

const kCrBody = 'IBMPlexSansArabic';
const kCrDisplay = 'Cairo';

ThemeData crTheme() {
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: CrColors.bg,
    fontFamily: kCrBody,
    colorScheme: const ColorScheme.dark(
      primary: CrColors.teal,
      onPrimary: CrColors.tealInk,
      secondary: CrColors.amber,
      onSecondary: CrColors.amberInk,
      surface: CrColors.surface,
      onSurface: CrColors.ink,
      error: CrColors.red,
    ),
  );
  return base.copyWith(
    textTheme: base.textTheme.apply(bodyColor: CrColors.ink, displayColor: CrColors.ink, fontFamily: kCrBody),
    appBarTheme: const AppBarTheme(backgroundColor: CrColors.bg, foregroundColor: CrColors.ink, elevation: 0),
    snackBarTheme: const SnackBarThemeData(
      backgroundColor: CrColors.raised,
      contentTextStyle: TextStyle(color: CrColors.ink, fontFamily: kCrBody),
      behavior: SnackBarBehavior.floating,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: CrColors.surface,
      hintStyle: const TextStyle(color: CrColors.faint),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: CrColors.line3)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: CrColors.line3)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: CrColors.teal)),
    ),
  );
}

// ── i18n ─────────────────────────────────────────────────────────────────────
class CrI18n {
  CrI18n._();
  static String lang = 'ar'; // 'ar' | 'ku' | 'en'
  static Map<String, dynamic> ku = const {};
  static Map<String, dynamic> en = const {};
  static bool get isKu => lang == 'ku';
  static bool get isEn => lang == 'en';
  static TextDirection get dir => isEn ? TextDirection.ltr : TextDirection.rtl;
}

/// Translate an Arabic source string (same keys as the prototype's T()).
String T(String s, [Map<String, Object?>? v]) {
  String o;
  if (CrI18n.isKu) {
    o = (CrI18n.ku[s] ?? CrI18n.en[s] ?? s).toString();
  } else if (CrI18n.isEn) {
    o = (CrI18n.en[s] ?? s).toString();
  } else {
    o = s;
  }
  if (v != null) {
    o = o.replaceAllMapped(RegExp(r'\{(\w+)\}'), (m) => '${v[m.group(1)] ?? m.group(0)}');
  }
  return o;
}

/// Three-language text for strings that are not in the prototype dictionaries.
String tr3(String ar, String en, String ku) => CrI18n.isKu ? ku : CrI18n.isEn ? en : ar;

/// Pick from a {ar, ku, en} map (backend plan names etc.).
String pickL(dynamic o) {
  if (o == null) return '';
  if (o is String) return o;
  final m = Map<String, dynamic>.from(o as Map);
  return (m[CrI18n.lang] ?? m['en'] ?? m['ar'] ?? '').toString();
}

String fmt(num n) {
  final s = n.round().abs().toString();
  final b = StringBuffer(n < 0 ? '-' : '');
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) b.write(',');
    b.write(s[i]);
  }
  return b.toString();
}

String kg() => T('كغ');
String da() => T('د.ع');
double r05(double x, double step) => (x / step).round() * step;
double e1rm(num w, num r) => w * (1 + r / 30);
String num1(double v) => v == v.roundToDouble() ? v.toInt().toString() : v.toStringAsFixed(1);

// ── Static data (assets/coach_renas/*.json) ──────────────────────────────────
class CrData {
  CrData({
    required this.core,
    required this.lib,
    required this.libKu,
    required this.libEn,
    required this.foods,
  }) {
    for (final e in exercises) {
      exMap[e['id'] as int] = e;
    }
    for (final f in foods) {
      foodMap[f['k'] as String] = f;
    }
  }

  final Map<String, dynamic> core;
  final Map<String, dynamic> lib;
  final Map<String, dynamic> libKu;
  final Map<String, dynamic> libEn;
  final List<Map<String, dynamic>> foods;
  final Map<int, Map<String, dynamic>> exMap = {};
  final Map<String, Map<String, dynamic>> foodMap = {};

  List<Map<String, dynamic>> get exercises => (lib['ex'] as List).cast<Map<String, dynamic>>();
  Map<String, dynamic> get groups => Map<String, dynamic>.from(lib['groups'] as Map);
  List<Map<String, dynamic>> list(String k) => ((core[k] as List?) ?? const []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  List<dynamic> raw(String k) => (core[k] as List?) ?? const [];
  Map<String, dynamic> map(String k) => Map<String, dynamic>.from((core[k] as Map?) ?? const {});

  /// Exercise field in the current language (prototype X()).
  String x(Map<String, dynamic> e, String f) {
    final id = '${e['id']}';
    final ku = ((libKu['ex'] as Map?)?[id] as Map?)?[f];
    final enEx = ((libEn['ex'] as Map?)?[id] as Map?)?[f] ?? (f == 'ar' ? e['en'] : null);
    if (CrI18n.isKu) return (ku ?? enEx ?? e[f] ?? '').toString();
    if (CrI18n.isEn) return (enEx ?? e[f] ?? '').toString();
    return (e[f] ?? '').toString();
  }

  String group(String k) {
    if (CrI18n.isKu) return ((libKu['groups'] as Map?)?[k] ?? groups[k] ?? k).toString();
    if (CrI18n.isEn) return ((libEn['groups'] as Map?)?[k] ?? groups[k] ?? k).toString();
    return (groups[k] ?? k).toString();
  }

  String foodName(Map<String, dynamic> f) =>
      CrI18n.isKu ? (f['ku'] ?? f['en'] ?? f['n']).toString() : CrI18n.isEn ? (f['en'] ?? f['n']).toString() : f['n'].toString();
  String foodPortion(Map<String, dynamic> f) =>
      CrI18n.isKu ? (f['puku'] ?? f['puen'] ?? f['pu']).toString() : CrI18n.isEn ? (f['puen'] ?? f['pu']).toString() : f['pu'].toString();

  static Future<CrData> load() async {
    Future<dynamic> j(String n) async => jsonDecode(await rootBundle.loadString('assets/coach_renas/$n.json'));
    final r = await Future.wait([
      j('core'), j('lib'), j('lib_ku'), j('lib_en'), j('foods'), j('i18n_ku'), j('i18n_en'),
    ]);
    CrI18n.ku = Map<String, dynamic>.from(r[5] as Map);
    CrI18n.en = Map<String, dynamic>.from(r[6] as Map);
    return CrData(
      core: Map<String, dynamic>.from(r[0] as Map),
      lib: Map<String, dynamic>.from(r[1] as Map),
      libKu: Map<String, dynamic>.from(r[2] as Map),
      libEn: Map<String, dynamic>.from(r[3] as Map),
      foods: (r[4] as List).map((e) => Map<String, dynamic>.from(e as Map)).toList(),
    );
  }
}

final crDataProvider = FutureProvider<CrData>((ref) => CrData.load());

// ── Local state (kept on this phone; synced to the server where it matters) ──
class CrState extends ChangeNotifier {
  static const _key = 'coach_renas_state_v1';
  Map<String, dynamic> s = {};
  bool loaded = false;
  bool _loading = false;

  static Map<String, dynamic> seed(CrData d) {
    final seed = Map<String, dynamic>.from(jsonDecode(jsonEncode(d.core['SEED'])) as Map);
    seed['activity'] = <String>[];
    seed['checkins'] = <dynamic>[];
    seed['plan'] = 'str12';
    seed['logDate'] = today();
    return seed;
  }

  Future<void> load(CrData d) async {
    if (loaded || _loading) return;
    _loading = true;
    try {
      final p = await SharedPreferences.getInstance();
      final raw = p.getString(_key);
      s = raw == null ? seed(d) : Map<String, dynamic>.from(jsonDecode(raw) as Map);
    } catch (_) {
      s = seed(d);
    }
    // New day -> fresh food log.
    if (s['logDate'] != today()) {
      s['log'] = <dynamic>[];
      s['logDate'] = today();
    }
    loaded = true;
    notifyListeners();
  }

  Future<void> save() async {
    notifyListeners();
    try {
      final p = await SharedPreferences.getInstance();
      await p.setString(_key, jsonEncode(s));
    } catch (_) {}
  }

  Future<void> reset(CrData d) async {
    s = seed(d);
    await save();
  }

  // helpers
  Map<String, dynamic> get lifts => Map<String, dynamic>.from(s['lifts'] as Map);
  Map<String, dynamic> lift(String k) => Map<String, dynamic>.from((s['lifts'] as Map)[k] as Map);
  List<Map<String, dynamic>> get hist => ((s['hist'] as List?) ?? []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  Map<String, dynamic> get goal => Map<String, dynamic>.from(s['goal'] as Map);
  Map<String, dynamic> get body => Map<String, dynamic>.from(s['body'] as Map);
  List<Map<String, dynamic>> get log => ((s['log'] as List?) ?? []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  Map<String, int> get cart => ((s['cart'] as Map?) ?? {}).map((k, v) => MapEntry(k.toString(), (v as num).toInt()));
  Map<String, dynamic> get mode => Map<String, dynamic>.from((s['mode'] as Map?) ?? {});
  List<Map<String, dynamic>> get checkins => ((s['checkins'] as List?) ?? []).map((e) => Map<String, dynamic>.from(e as Map)).toList();

  void logActivity() {
    final a = List<String>.from((s['activity'] as List?) ?? []);
    if (!a.contains(today())) a.add(today());
    s['activity'] = a;
  }

  int streak() {
    final set = Set<String>.from((s['activity'] as List?) ?? []);
    var n = 0;
    var d = DateTime.now();
    if (!set.contains(today())) d = d.subtract(const Duration(days: 1));
    while (set.contains(_iso(d))) {
      n++;
      d = d.subtract(const Duration(days: 1));
    }
    return n;
  }

  Map<String, num> targets() {
    final b = body;
    final kgv = (b['kg'] as num).toDouble(), cm = (b['cm'] as num).toDouble(), age = (b['age'] as num).toDouble();
    final bmr = 10 * kgv + 6.25 * cm - 5 * age + (b['sex'] == 'm' ? 5 : -161);
    final tdee = bmr * (b['act'] as num).toDouble();
    final f = b['aim'] == 'cut' ? 0.8 : b['aim'] == 'gain' ? 1.1 : 1.0;
    final floor = b['sex'] == 'm' ? 1500 : 1200;
    final kcal = math.max(floor, ((tdee * f) / 10).round() * 10);
    return {
      'kcal': kcal,
      'floored': tdee * f < floor ? 1 : 0,
      'pLo': (kgv * 1.6).round(),
      'pHi': (kgv * 2.2).round(),
      'fat': (kgv * 0.8).round(),
    };
  }

  Map<String, num> logTotals(CrData d) {
    num kcal = 0, p = 0;
    for (final it in log) {
      final f = d.foodMap[it['f']];
      final q = (it['q'] as num?) ?? 1;
      if (f != null) {
        kcal += (f['kcal'] as num) * q;
        p += (f['p'] as num) * q;
      } else {
        kcal += (it['kcal'] as num?) ?? 0;
        p += (it['p'] as num?) ?? 0;
      }
    }
    return {'kcal': kcal, 'p': p};
  }

  void addCart(String k, [int by = 1]) {
    final c = cart;
    c[k] = (c[k] ?? 0) + by;
    if ((c[k] ?? 0) <= 0) c.remove(k);
    s['cart'] = c;
    save();
  }
}

String _iso(DateTime d) => '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
String today() => _iso(DateTime.now());

final crStateProvider = ChangeNotifierProvider<CrState>((ref) => CrState());

// ── Small UI kit following the design's cards/buttons ───────────────────────
TextStyle crH1([double size = 24]) => TextStyle(fontFamily: kCrDisplay, fontSize: size, fontWeight: FontWeight.w800, height: 1.35, color: CrColors.ink);
const crH3 = TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: CrColors.ink);
const crMuted = TextStyle(fontSize: 13, color: CrColors.muted, height: 1.5);
const crSmall = TextStyle(fontSize: 12, color: CrColors.muted, height: 1.5);

class CrCard extends StatelessWidget {
  const CrCard({super.key, required this.child, this.onTap, this.color, this.border, this.padding = 14, this.radius = 18});
  final Widget child;
  final VoidCallback? onTap;
  final Color? color;
  final Color? border;
  final double padding;
  final double radius;
  @override
  Widget build(BuildContext context) {
    final box = Container(
      width: double.infinity,
      padding: EdgeInsets.all(padding),
      decoration: BoxDecoration(
        color: color ?? CrColors.surface,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: border ?? CrColors.line),
      ),
      child: child,
    );
    if (onTap == null) return box;
    return Material(
      color: Colors.transparent,
      child: InkWell(borderRadius: BorderRadius.circular(radius), onTap: onTap, child: box),
    );
  }
}

/// Teal hero card with the ring decoration (design: section with ring).
class CrHero extends StatelessWidget {
  const CrHero({super.key, required this.children, this.color = CrColors.teal, this.ink = CrColors.tealInk});
  final List<Widget> children;
  final Color color;
  final Color ink;
  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: Container(
        width: double.infinity,
        color: color,
        child: Stack(children: [
          PositionedDirectional(
            end: -40,
            top: -40,
            child: Container(
              width: 170,
              height: 170,
              decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: ink.withValues(alpha: 0.08), width: 22)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: DefaultTextStyle(
              style: TextStyle(color: ink, fontFamily: kCrBody, fontSize: 14, fontWeight: FontWeight.w500, height: 1.5),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: _gap(children, 8)),
            ),
          ),
        ]),
      ),
    );
  }
}

List<Widget> _gap(List<Widget> c, double g) => [
      for (var i = 0; i < c.length; i++) ...[if (i > 0) SizedBox(height: g), c[i]],
    ];
List<Widget> gap(List<Widget> c, [double g = 12]) => _gap(c, g);

class CrButton extends StatelessWidget {
  const CrButton(this.label, {super.key, this.onTap, this.icon, this.kind = 'teal', this.height = 50, this.busy = false});
  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final String kind; // teal | dark | ghost | amber | red
  final double height;
  final bool busy;
  @override
  Widget build(BuildContext context) {
    final (bg, fg, br) = switch (kind) {
      'dark' => (CrColors.tealInk, CrColors.ink, CrColors.tealInk),
      'ghost' => (Colors.transparent, CrColors.ink, CrColors.line3),
      'amber' => (CrColors.amber, CrColors.amberInk, CrColors.amber),
      'red' => (CrColors.red, CrColors.redWash, CrColors.red),
      _ => (CrColors.teal, CrColors.tealInk, CrColors.teal),
    };
    return SizedBox(
      width: double.infinity,
      height: height,
      child: Material(
        color: onTap == null ? bg.withValues(alpha: 0.4) : bg,
        shape: StadiumBorder(side: BorderSide(color: br)),
        child: InkWell(
          customBorder: const StadiumBorder(),
          onTap: busy ? null : onTap,
          child: Center(
            child: busy
                ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: fg))
                : Row(mainAxisSize: MainAxisSize.min, children: [
                    if (icon != null) ...[Icon(icon, size: 18, color: fg), const SizedBox(width: 8)],
                    Flexible(child: Text(label, textAlign: TextAlign.center, style: TextStyle(color: fg, fontWeight: FontWeight.w700, fontSize: 15))),
                  ]),
          ),
        ),
      ),
    );
  }
}

class CrChip extends StatelessWidget {
  const CrChip(this.label, {super.key, this.on = false, this.onTap, this.light = true});
  final String label;
  final bool on;
  final VoidCallback? onTap;
  final bool light; // on = light pill (design) or teal pill
  @override
  Widget build(BuildContext context) {
    final bg = on ? (light ? CrColors.ink : CrColors.teal) : CrColors.surface;
    final fg = on ? (light ? CrColors.bg : CrColors.tealInk) : CrColors.soft;
    return Semantics(
      button: true,
      selected: on,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 36,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          alignment: Alignment.center,
          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(18), border: on ? null : Border.all(color: CrColors.line2)),
          child: Text(label, style: TextStyle(color: fg, fontSize: 13, fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }
}

class CrTag extends StatelessWidget {
  const CrTag(this.label, {super.key, this.fg = CrColors.teal, this.bg = CrColors.tealWash});
  final String label;
  final Color fg;
  final Color bg;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10)),
        child: Text(label, style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w700)),
      );
}

class CrMeter extends StatelessWidget {
  const CrMeter(this.value, {super.key, this.color = CrColors.teal});
  final double value;
  final Color color;
  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: LinearProgressIndicator(
          value: value.isNaN ? 0 : value.clamp(0, 1).toDouble(),
          minHeight: 8,
          backgroundColor: CrColors.raised,
          valueColor: AlwaysStoppedAnimation(color),
        ),
      );
}

class CrRow extends StatelessWidget {
  const CrRow({super.key, required this.title, this.sub, this.icon, this.iconColor = CrColors.teal, this.trailing, this.onTap, this.titleColor});
  final String title;
  final String? sub;
  final IconData? icon;
  final Color iconColor;
  final Widget? trailing;
  final VoidCallback? onTap;
  final Color? titleColor;
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(children: [
          if (icon != null) ...[Icon(icon, color: iconColor, size: 20), const SizedBox(width: 12)],
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: titleColor ?? CrColors.ink)),
              if (sub != null && sub!.isNotEmpty) Text(sub!, style: crMuted),
            ]),
          ),
          if (trailing != null) trailing! else if (onTap != null) const Icon(Icons.chevron_left_rounded, color: CrColors.muted, textDirection: TextDirection.ltr),
        ]),
      ),
    );
  }
}

/// A grouped list box (design `.list`).
class CrList extends StatelessWidget {
  const CrList(this.children, {super.key});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(color: CrColors.surface, borderRadius: BorderRadius.circular(18), border: Border.all(color: CrColors.line)),
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) const Divider(height: 1, color: CrColors.line),
            children[i],
          ],
        ]),
      );
}

/// Page scaffold with the design's top bar (back button + title + subtitle).
class CrPage extends StatelessWidget {
  const CrPage({super.key, required this.title, required this.children, this.sub, this.back = true, this.actions = const [], this.bottom, this.eyebrow});
  final String title;
  final String? sub;
  final String? eyebrow;
  final bool back;
  final List<Widget> actions;
  final List<Widget> children;
  final Widget? bottom;
  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: CrI18n.dir,
      child: Scaffold(
        backgroundColor: CrColors.bg,
        body: SafeArea(
          bottom: false,
          child: Column(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
              child: Row(children: [
                if (back && Navigator.of(context).canPop()) ...[
                  CrRoundIcon(icon: CrI18n.isEn ? Icons.chevron_left_rounded : Icons.chevron_right_rounded, label: T('رجوع'), onTap: () => Navigator.of(context).maybePop()),
                  const SizedBox(width: 10),
                ],
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    if (eyebrow != null) Text(eyebrow!, style: const TextStyle(fontSize: 12, color: CrColors.muted, fontWeight: FontWeight.w500)),
                    Text(title, style: crH1(), maxLines: 2, overflow: TextOverflow.ellipsis),
                    if (sub != null) Text(sub!, style: crMuted),
                  ]),
                ),
                ...actions,
              ]),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
                children: gap(children),
              ),
            ),
            if (bottom != null) Padding(padding: const EdgeInsets.fromLTRB(20, 4, 20, 16), child: SafeArea(top: false, child: bottom!)),
          ]),
        ),
      ),
    );
  }
}

class CrRoundIcon extends StatelessWidget {
  const CrRoundIcon({super.key, required this.icon, required this.onTap, required this.label});
  final IconData icon;
  final VoidCallback onTap;
  final String label;
  @override
  Widget build(BuildContext context) => Semantics(
        label: label,
        button: true,
        child: InkWell(
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(shape: BoxShape.circle, color: CrColors.surface, border: Border.all(color: CrColors.line3)),
            child: Icon(icon, color: CrColors.ink, size: 20),
          ),
        ),
      );
}


class CrStat extends StatelessWidget {
  const CrStat(this.value, this.label, {super.key, this.color = CrColors.ink, this.onTap});
  final String value;
  final String label;
  final Color color;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => CrCard(
        onTap: onTap,
        padding: 12,
        radius: 16,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(value, style: crH1(22).copyWith(color: color, height: 1.3)),
          Text(label, style: crSmall, maxLines: 2),
        ]),
      );
}

void crToast(BuildContext context, String msg) {
  ScaffoldMessenger.maybeOf(context)
    ?..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(msg, textDirection: CrI18n.dir)));
}

/// Wraps a screen that needs the data + state loaded.
class CrLoader extends ConsumerWidget {
  const CrLoader({super.key, required this.builder});
  final Widget Function(BuildContext context, CrData d, CrState st) builder;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(crDataProvider);
    final st = ref.watch(crStateProvider);
    return data.when(
      loading: () => const Scaffold(backgroundColor: CrColors.bg, body: Center(child: CircularProgressIndicator(color: CrColors.teal))),
      error: (e, _) => Scaffold(
        backgroundColor: CrColors.bg,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.error_outline_rounded, color: CrColors.amber, size: 40),
              const SizedBox(height: 12),
              Text(tr3('صار خطأ بتحميل البيانات', 'Could not load the data', 'هەڵەیەک لە بارکردنی داتا ڕوویدا'), style: crH3, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              CrButton(tr3('جرّب مرة ثانية', 'Try again', 'دووبارە هەوڵ بدەرەوە'), height: 44, onTap: () => ref.invalidate(crDataProvider)),
            ]),
          ),
        ),
      ),
      data: (d) {
        if (!st.loaded) {
          st.load(d);
          return const Scaffold(backgroundColor: CrColors.bg, body: Center(child: CircularProgressIndicator(color: CrColors.teal)));
        }
        return builder(context, d, st);
      },
    );
  }
}
