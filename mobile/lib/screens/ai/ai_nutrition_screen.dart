import '../../core/i18n/trv.dart';
import 'package:easy_localization/easy_localization.dart';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import '../../providers/ai_provider.dart';

const _teal = Color(0xFF26BDB8);

class AiNutritionScreen extends ConsumerStatefulWidget {
  const AiNutritionScreen({super.key});

  @override
  ConsumerState<AiNutritionScreen> createState() => _AiNutritionScreenState();
}

class _AiNutritionScreenState extends ConsumerState<AiNutritionScreen> {
  final _weightCtrl = TextEditingController();
  final _heightCtrl = TextEditingController();
  final _ageCtrl = TextEditingController();
  String _goal = 'muscle gain';
  String _gender = 'male';
  String _activity = 'moderate';

  static const _goals = ['muscle gain', 'fat loss', 'maintain weight', 'improve endurance'];
  static const _activities = ['sedentary', 'light', 'moderate', 'active', 'very active'];

  @override
  void dispose() {
    _weightCtrl.dispose();
    _heightCtrl.dispose();
    _ageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(aiNutritionProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('ai_nutrition_advisor'.tr(), style: const TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        actions: [
          if (state.plan != null)
            TextButton.icon(
              onPressed: () => ref.read(aiNutritionProvider.notifier).reset(),
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: Text('reset'.tr()),
              style: TextButton.styleFrom(foregroundColor: _teal),
            ),
        ],
      ),
      body: state.plan != null
          ? _PlanResult(plan: state.plan!)
          : _InputForm(
              weightCtrl: _weightCtrl,
              heightCtrl: _heightCtrl,
              ageCtrl: _ageCtrl,
              goal: _goal,
              gender: _gender,
              activity: _activity,
              goals: _goals,
              activities: _activities,
              isLoading: state.isLoading,
              error: state.error,
              onGoalChanged: (v) => setState(() => _goal = v),
              onGenderChanged: (v) => setState(() => _gender = v),
              onActivityChanged: (v) => setState(() => _activity = v),
              onAnalyze: () {
                final w = double.tryParse(_weightCtrl.text);
                final h = double.tryParse(_heightCtrl.text);
                if (w == null || h == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('enter_valid_weight_and_height'.tr())),
                  );
                  return;
                }
                ref.read(aiNutritionProvider.notifier).analyze(
                  weight: w,
                  height: h,
                  goal: _goal,
                  age: int.tryParse(_ageCtrl.text),
                  gender: _gender,
                  activityLevel: _activity,
                );
              },
            ),
    );
  }
}

// ── Input form ─────────────────────────────────────────────────────────────────

class _InputForm extends StatelessWidget {
  final TextEditingController weightCtrl;
  final TextEditingController heightCtrl;
  final TextEditingController ageCtrl;
  final String goal;
  final String gender;
  final String activity;
  final List<String> goals;
  final List<String> activities;
  final bool isLoading;
  final String? error;
  final ValueChanged<String> onGoalChanged;
  final ValueChanged<String> onGenderChanged;
  final ValueChanged<String> onActivityChanged;
  final VoidCallback onAnalyze;

  const _InputForm({
    required this.weightCtrl,
    required this.heightCtrl,
    required this.ageCtrl,
    required this.goal,
    required this.gender,
    required this.activity,
    required this.goals,
    required this.activities,
    required this.isLoading,
    required this.error,
    required this.onGoalChanged,
    required this.onGenderChanged,
    required this.onActivityChanged,
    required this.onAnalyze,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Header banner
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF10B981), Color(0xFF059669)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(children: [
            const Text('🥗', style: TextStyle(fontSize: 32)),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('nutrition_advisor'.tr(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 17)),
              const SizedBox(height: 4),
              Text('get_a_personalized_diet_plan_based'.tr(),
                  style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.4)),
            ])),
          ]),
        ),
        const SizedBox(height: 24),

        _sectionLabel('your_body'.tr()),
        const SizedBox(height: 10),
        Row(children: [
          Expanded(child: _field(weightCtrl, 'weight_kg'.tr(), TextInputType.number)),
          const SizedBox(width: 10),
          Expanded(child: _field(heightCtrl, 'height_cm'.tr(), TextInputType.number)),
          const SizedBox(width: 10),
          Expanded(child: _field(ageCtrl, 'age'.tr(), TextInputType.number)),
        ]),
        const SizedBox(height: 18),

        _sectionLabel('gender'.tr()),
        const SizedBox(height: 10),
        Row(children: [
          _genderChip('male', 'male'.tr(), gender, onGenderChanged),
          const SizedBox(width: 10),
          _genderChip('female', 'female'.tr(), gender, onGenderChanged),
        ]),
        const SizedBox(height: 18),

        _sectionLabel('goal'.tr()),
        const SizedBox(height: 10),
        Wrap(spacing: 8, runSpacing: 8, children: goals.map((g) {
          final selected = g == goal;
          return GestureDetector(
            onTap: () => onGoalChanged(g),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: selected ? _teal : Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: selected ? _teal : const Color(0xFFE2E8F0)),
              ),
              child: Text(
                trv(g),
                style: TextStyle(
                  color: selected ? Colors.white : const Color(0xFF475569),
                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                  fontSize: 13,
                ),
              ),
            ),
          );
        }).toList()),
        const SizedBox(height: 18),

        _sectionLabel('activity_level'.tr()),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: activity,
              isExpanded: true,
              onChanged: (v) => v != null ? onActivityChanged(v) : null,
              items: activities.map((a) => DropdownMenuItem(
                value: a,
                child: Text(trv(a),
                    style: const TextStyle(fontSize: 14)),
              )).toList(),
            ),
          ),
        ),
        const SizedBox(height: 28),

        if (error != null)
          Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFFCA5A5)),
            ),
            child: Row(children: [
              const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(error!, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13))),
            ]),
          ),

        ElevatedButton.icon(
          onPressed: isLoading ? null : onAnalyze,
          icon: isLoading
              ? const SizedBox(width: 18, height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
              : const Text('🥗', style: TextStyle(fontSize: 18)),
          label: Text(isLoading ? 'analyzing'.tr() : 'get_my_nutrition_plan'.tr(),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF10B981),
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 54),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _sectionLabel(String t) =>
      Text(t, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: Color(0xFF0F172A)));

  Widget _field(TextEditingController ctrl, String hint, TextInputType type) =>
      TextField(
        controller: ctrl,
        keyboardType: type,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: _teal, width: 1.5)),
          filled: true, fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        ),
      );

  Widget _genderChip(String value, String label, String current, ValueChanged<String> onChange) =>
      Expanded(
        child: GestureDetector(
          onTap: () => onChange(value),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: current == value ? _teal : Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: current == value ? _teal : const Color(0xFFE2E8F0)),
            ),
            child: Text(label, textAlign: TextAlign.center,
                style: TextStyle(
                  color: current == value ? Colors.white : const Color(0xFF475569),
                  fontWeight: current == value ? FontWeight.w600 : FontWeight.normal,
                  fontSize: 14,
                )),
          ),
        ),
      );
}

// ── Plan result ────────────────────────────────────────────────────────────────

class _PlanResult extends StatelessWidget {
  final String plan;
  const _PlanResult({required this.plan});

  void _copy(BuildContext context) {
    Clipboard.setData(ClipboardData(text: plan));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('nutrition_plan_copied_to_clipboard'.tr()),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _share() {
    Share.share('my_city_gym_nutrition_plan_x'.tr(namedArgs: {'plan': plan}), subject: 'city_gym_nutrition_plan'.tr());
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF10B981).withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
          ),
          child: Row(children: [
            const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 20),
            const SizedBox(width: 8),
            Text('your_personalized_nutrition_plan'.tr(),
                style: const TextStyle(color: Color(0xFF065F46), fontWeight: FontWeight.w600)),
          ]),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Text(
            plan,
            style: const TextStyle(fontSize: 14.5, height: 1.7, color: Color(0xFF1E293B)),
          ),
        ),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => _copy(context),
              icon: const Icon(Icons.copy_rounded, size: 18),
              label: Text('copy'.tr()),
              style: OutlinedButton.styleFrom(
                foregroundColor: _teal,
                side: const BorderSide(color: _teal),
                minimumSize: const Size(0, 48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: _share,
              icon: const Icon(Icons.share_rounded, size: 18),
              label: Text('share'.tr()),
              style: ElevatedButton.styleFrom(
                backgroundColor: _teal,
                foregroundColor: Colors.white,
                minimumSize: const Size(0, 48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ]),
        const SizedBox(height: 32),
      ],
    );
  }
}
