import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

/// BMI, calories (BMR/TDEE), protein and water calculators.
/// Pure on-device maths — same formulas as the web app's Health tools.
class HealthToolsScreen extends StatefulWidget {
  const HealthToolsScreen({super.key});

  @override
  State<HealthToolsScreen> createState() => _HealthToolsScreenState();
}

class _HealthToolsScreenState extends State<HealthToolsScreen> {
  double _weight = 75;
  double _height = 175;
  int _age = 28;
  bool _male = true;
  double _activity = 1.55;
  double _trainingHours = 1;

  static List<(double, String)> get _activities => <(double, String)>[
    (1.2, 'sedentary'.tr()),
    (1.375, 'light'.tr()),
    (1.55, 'moderate'.tr()),
    (1.725, 'active'.tr()),
    (1.9, 'very_active'.tr()),
  ];

  double get _bmi => _height > 0 ? _weight / ((_height / 100) * (_height / 100)) : 0;

  String get _bmiLabel {
    final b = _bmi;
    if (b < 18.5) return 'underweight'.tr();
    if (b < 25) return 'healthy_weight'.tr();
    if (b < 30) return 'overweight'.tr();
    return 'obese'.tr();
  }

  /// Mifflin–St Jeor
  int get _bmr => (10 * _weight + 6.25 * _height - 5 * _age + (_male ? 5 : -161)).round();
  int get _tdee => (_bmr * _activity).round();
  double get _water => ((_weight * 0.035 + _trainingHours * 0.5) * 10).round() / 10;

  Widget _num(String label, double value, ValueChanged<double> onChanged) {
    return TextFormField(
      initialValue: value % 1 == 0 ? value.toInt().toString() : value.toString(),
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: InputDecoration(labelText: label, border: const OutlineInputBorder(), isDense: true),
      onChanged: (v) {
        final n = double.tryParse(v);
        if (n != null && n > 0) setState(() => onChanged(n));
      },
    );
  }

  Widget _card(String title, String result, {Widget? extra}) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFE2E8F0))),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFFFF7ED), borderRadius: BorderRadius.circular(12)),
              child: Text(result, style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF9A3412))),
            ),
            if (extra != null) ...[const SizedBox(height: 8), extra],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('health_tools'.tr())),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(children: [
            Expanded(child: _num('weight_kg'.tr(), _weight, (v) => _weight = v)),
            const SizedBox(width: 12),
            Expanded(child: _num('height_cm'.tr(), _height, (v) => _height = v)),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _num('age'.tr(), _age.toDouble(), (v) => _age = v.round())),
            const SizedBox(width: 12),
            Expanded(
              child: SegmentedButton<bool>(
                segments: [
                  ButtonSegment(value: true, label: Text('male_2'.tr())),
                  ButtonSegment(value: false, label: Text('female_2'.tr())),
                ],
                selected: {_male},
                onSelectionChanged: (s) => setState(() => _male = s.first),
              ),
            ),
          ]),
          const SizedBox(height: 12),
          DropdownButtonFormField<double>(
            initialValue: _activity,
            decoration: InputDecoration(labelText: 'activity'.tr(), border: const OutlineInputBorder(), isDense: true),
            items: _activities.map((e) => DropdownMenuItem(value: e.$1, child: Text(e.$2))).toList(),
            onChanged: (v) => setState(() => _activity = v ?? 1.55),
          ),
          const SizedBox(height: 12),
          _num('training_hours_per_day'.tr(), _trainingHours, (v) => _trainingHours = v),
          const SizedBox(height: 16),
          _card('BMI', '${_bmi.toStringAsFixed(1)} — $_bmiLabel'),
          _card('calories'.tr(), 'resting_x_kcal_with_activity_x'.tr(namedArgs: {'_bmr': '$_bmr', '_tdee': '$_tdee'})),
          _card('daily_protein'.tr(), 'x_x_g_per_day'.tr(namedArgs: {'n0': '${(_weight * 1.6).round()}', 'n1': '${(_weight * 2.2).round()}'})),
          _card('daily_water'.tr(), 'about_x_litres_per_day'.tr(namedArgs: {'_water': '$_water'})),
        ],
      ),
    );
  }
}
