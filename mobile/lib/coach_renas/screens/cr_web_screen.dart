// The Coach Renas app: the full approved page (3D body, supplement
// encyclopedia, 513 animated exercises, food & training guides, the
// "why isn't my body changing?" check) bundled as one HTML file in
// assets/coach_renas/web/index.html and shown in a WebView. No internet needed.
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../cr_core.dart';
import '../cr_reminders.dart';

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
      // Only remember it for the native reminders. Changing the Flutter
      // locale here would rebuild this screen and reload the page.
      if (['ar', 'ku', 'en'].contains(l) && CrI18n.lang != l) {
        CrI18n.lang = l; // reminders pick it up when the reminders screen opens
      }
      return;
    }
    if (msg == 'nav:notif') {
      CrReminders.instance.syncLanguage();
      context.push('/renas/notif');
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
