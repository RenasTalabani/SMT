// Offline web module: the full Coach Renas knowledge base (3D body, supplement
// encyclopedia, 513 animated exercises, food & training guides, the
// "why isn't my body changing?" check) bundled as one HTML file in
// assets/coach_renas/web/index.html and shown in a WebView. No internet needed.
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../cr_core.dart';

class CrWebScreen extends StatefulWidget {
  const CrWebScreen({super.key, required this.route});

  /// A route of the web module, e.g. `body`, `supps`, `supp-creatine`, `lib`, `ex-34`, `fguide`, `tguide`, `why`.
  final String route;

  @override
  State<CrWebScreen> createState() => _CrWebScreenState();
}

class _CrWebScreenState extends State<CrWebScreen> {
  late final WebViewController _c;
  bool _loading = true;

  static const _nav = {
    'home': '/renas',
    'shop': '/renas/shop',
    'checkout': '/renas/checkout',
    'coach': '/renas/coach',
    'me': '/renas/me',
    'plans': '/renas/plans',
    'start': '/renas/start',
    'panel': '/renas/panel',
    'notif': '/renas/notif',
    'done': '/renas/shop',
    'login': '/renas/me',
    'tour': '/renas',
  };

  @override
  void initState() {
    super.initState();
    final route = widget.route.replaceAll(RegExp(r'[^a-zA-Z0-9_\-]'), '');
    _c = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0E1113))
      ..addJavaScriptChannel('CR', onMessageReceived: (m) => _onMessage(m.message))
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (_) async {
          await _c.runJavaScript("crEmbed('${CrI18n.lang}', '$route')");
          if (mounted) setState(() => _loading = false);
        },
        onNavigationRequest: (r) {
          // Research-source links open in the phone's browser; the module itself stays offline.
          final u = r.url;
          if (u.startsWith('http://') || u.startsWith('https://')) {
            launchUrl(Uri.parse(u), mode: LaunchMode.externalApplication);
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ))
      ..loadFlutterAsset('assets/coach_renas/web/index.html');
  }

  void _onMessage(String msg) {
    if (!mounted) return;
    if (msg == 'close') {
      if (context.canPop()) {
        context.pop();
      } else {
        context.go('/renas');
      }
      return;
    }
    if (msg.startsWith('nav:')) {
      final target = _nav[msg.substring(4)];
      if (target != null) context.go(target);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        if (await _c.canGoBack()) {
          await _c.goBack();
        } else if (mounted) {
          _onMessage('close');
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF0E1113),
        body: SafeArea(
          bottom: false,
          child: Stack(children: [
            WebViewWidget(controller: _c),
            if (_loading) const Center(child: CircularProgressIndicator(color: Color(0xFF2BC4BE))),
          ]),
        ),
      ),
    );
  }
}

/// The whole Coach Renas app as approved (the bundled page with its own
/// bottom bar, languages, 3D body, exercises, food, supplements, coach).
/// Native only for phone reminders (`nav:notif`) and keeping the app language
/// in sync (`lang:xx`) so reminder texts match.
class CrAppScreen extends StatefulWidget {
  const CrAppScreen({super.key});
  @override
  State<CrAppScreen> createState() => _CrAppScreenState();
}

class _CrAppScreenState extends State<CrAppScreen> {
  late final WebViewController _c;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _c = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0E1113))
      ..setUserAgent('Mozilla/5.0 (Linux; Android) CoachRenasFull')
      ..addJavaScriptChannel('CR', onMessageReceived: (m) => _onMessage(m.message))
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (_) {
          if (mounted) setState(() => _loading = false);
        },
        onNavigationRequest: (r) {
          final u = r.url;
          if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('mailto:') || u.startsWith('tel:') || u.startsWith('whatsapp:')) {
            launchUrl(Uri.parse(u), mode: LaunchMode.externalApplication);
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ))
      ..loadFlutterAsset('assets/coach_renas/web/index.html');
  }

  void _onMessage(String msg) {
    if (!mounted) return;
    if (msg.startsWith('lang:')) {
      final l = msg.substring(5);
      if (['ar', 'ku', 'en'].contains(l) && CrI18n.lang != l) {
        CrI18n.lang = l;
        context.setLocale(Locale(l));
      }
      return;
    }
    if (msg == 'nav:notif') context.push('/renas/notif');
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        if (await _c.canGoBack()) {
          await _c.goBack();
        } else {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF0E1113),
        body: SafeArea(
          child: Stack(children: [
            WebViewWidget(controller: _c),
            if (_loading) const Center(child: CircularProgressIndicator(color: Color(0xFF2BC4BE))),
          ]),
        ),
      ),
    );
  }
}
