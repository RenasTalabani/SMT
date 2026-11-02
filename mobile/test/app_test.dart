import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

// The phone app shows the approved Coach Renas page; make sure the bundled
// copy is the full app with the phone hooks in it.
void main() {
  final page = File('assets/coach_renas/web/index.html').readAsStringSync();

  test('bundled page is the full Coach Renas app', () {
    expect(page.length, greaterThan(10 * 1024 * 1024));
    expect(page, startsWith('<!doctype html>'));
    expect(page, contains('name="viewport" content="width=device-width'));
    expect(page, contains('../../fonts/Cairo-Bold.ttf'));
    expect(page, contains('CoachRenasFull'));
    expect(page, contains('crPost("nav:notif")'));
    expect(page, contains('ريناس'));
    expect(page, isNot(contains('T("لاما")')));
  });

  test('Kurdish and English reminder texts exist', () {
    for (final f in ['i18n_ku.json', 'i18n_en.json']) {
      expect(File('assets/coach_renas/$f').existsSync(), isTrue, reason: f);
    }
  });
}
