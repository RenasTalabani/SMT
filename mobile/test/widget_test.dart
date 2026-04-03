import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:citygym/widgets/city_gym_logo.dart';

void main() {
  group('CityGymLogo widget', () {
    testWidgets('renders without error', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: Center(child: CityGymLogo())),
        ),
      );
      expect(find.byType(CityGymLogo), findsOneWidget);
    });

    testWidgets('shows tagline by default (showTagline=true)', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: Center(child: CityGymLogo())),
        ),
      );
      expect(find.text("IT'S A LIFE STYLE"), findsOneWidget);
    });

    testWidgets('tagline hidden when showTagline=false', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: Center(child: CityGymLogo(showTagline: false))),
        ),
      );
      expect(find.text("IT'S A LIFE STYLE"), findsNothing);
    });
  });
}
