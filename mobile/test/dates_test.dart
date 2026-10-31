import 'package:citygym/core/i18n/dates.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Kurdish date names replace English month/day names and AM/PM', () {
    expect(kurdishDate('Mon, Oct 26'), 'دووشەممە, تشرینی یەکەم 26');
    expect(kurdishDate('Friday, May 1'), 'هەینی, ئایار 1');
    expect(kurdishDate('9:30 PM'), '9:30 د.ن');
    expect(kurdishDate('Sep 3, 2026'), contains('ئەیلوول'));
  });
}
