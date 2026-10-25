import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/ai_provider.dart';

const _teal = Color(0xFF26BDB8);
const _purple = Color(0xFF7C3AED);

class AiProgressScreen extends ConsumerWidget {
  const AiProgressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(aiProgressProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('ai_progress_analysis'.tr(),
            style: const TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        actions: [
          if (state.analysis != null)
            IconButton(
              onPressed: () => ref.read(aiProgressProvider.notifier).analyze(),
              icon: const Icon(Icons.refresh_rounded, color: _teal),
              tooltip: 're_analyze'.tr(),
            ),
        ],
      ),
      body: state.isLoading
          ? _Loading()
          : state.analysis != null
              ? _Result(analysis: state.analysis!, suggestions: state.suggestions)
              : _Prompt(
                  error: state.error,
                  onAnalyze: () =>
                      ref.read(aiProgressProvider.notifier).analyze(),
                ),
    );
  }
}

// ── Loading ────────────────────────────────────────────────────────────────────

class _Loading extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: _purple.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: CircularProgressIndicator(color: _purple, strokeWidth: 3),
            ),
          ),
          const SizedBox(height: 20),
          Text('analyzing_your_progress'.tr(),
              style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0F172A))),
          const SizedBox(height: 8),
          Text('this_takes_a_few_seconds'.tr(),
              style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
        ],
      ),
    );
  }
}

// ── Prompt (first visit) ───────────────────────────────────────────────────────

class _Prompt extends StatelessWidget {
  final String? error;
  final VoidCallback onAnalyze;
  const _Prompt({required this.error, required this.onAnalyze});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Header banner
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [_purple, Color(0xFF6D28D9)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(children: [
            const Text('📊', style: TextStyle(fontSize: 36)),
            const SizedBox(width: 14),
            Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                  Text('progress_analysis'.tr(),
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 17)),
                  const SizedBox(height: 4),
                  Text(
                      'ai_reviews_your_last_30_days'.tr(),
                      style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                          height: 1.4)),
                ])),
          ]),
        ),
        const SizedBox(height: 28),

        // What you'll get
        Text('what_you_get'.tr(),
            style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 15,
                color: Color(0xFF0F172A))),
        const SizedBox(height: 12),
        ...[
          ('📈', 'performance_analysis'.tr(),
              'deep_look_at_your_workout_completion'.tr()),
          ('💡', 'personalised_suggestions'.tr(),
              'specific_actions_to_improve_your_results'.tr()),
          ('🏆', 'strengths_weaknesses'.tr(),
              'know_exactly_what_you_re_doing'.tr()),
        ].map((item) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.$1, style: const TextStyle(fontSize: 22)),
                  const SizedBox(width: 12),
                  Expanded(
                      child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.$2,
                          style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                              color: Color(0xFF0F172A))),
                      const SizedBox(height: 3),
                      Text(item.$3,
                          style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF64748B),
                              height: 1.4)),
                    ],
                  )),
                ],
              ),
            )),

        const SizedBox(height: 24),

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
              const Icon(Icons.error_outline_rounded,
                  color: Color(0xFFEF4444), size: 18),
              const SizedBox(width: 8),
              Expanded(
                  child: Text(error!,
                      style: const TextStyle(
                          color: Color(0xFFEF4444), fontSize: 13))),
            ]),
          ),

        ElevatedButton.icon(
          onPressed: onAnalyze,
          icon: const Text('📊', style: TextStyle(fontSize: 18)),
          label: Text('analyse_my_progress'.tr(),
              style:
                  const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          style: ElevatedButton.styleFrom(
            backgroundColor: _purple,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 54),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 12),
        Text('analyses_your_last_30_days_of'.tr(),
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
        const SizedBox(height: 32),
      ],
    );
  }
}

// ── Result ─────────────────────────────────────────────────────────────────────

class _Result extends StatelessWidget {
  final String analysis;
  final List<String> suggestions;
  const _Result({required this.analysis, required this.suggestions});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Success header
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: _purple.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _purple.withValues(alpha: 0.3)),
          ),
          child: Row(children: [
            const Icon(Icons.check_circle_rounded, color: _purple, size: 20),
            const SizedBox(width: 8),
            Text('analysis_complete'.tr(),
                style: const TextStyle(
                    color: _purple, fontWeight: FontWeight.w600)),
          ]),
        ),
        const SizedBox(height: 16),

        // Analysis text
        Text('your_progress_report'.tr(),
            style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 15,
                color: Color(0xFF0F172A))),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Text(
            analysis,
            style: const TextStyle(
                fontSize: 14.5, height: 1.7, color: Color(0xFF1E293B)),
          ),
        ),

        // Suggestions
        if (suggestions.isNotEmpty) ...[
          const SizedBox(height: 20),
          Text('action_plan'.tr(),
              style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  color: Color(0xFF0F172A))),
          const SizedBox(height: 10),
          ...suggestions.asMap().entries.map((e) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 26,
                      height: 26,
                      decoration: BoxDecoration(
                        color: _purple,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '${e.key + 1}',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w700),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                        child: Text(e.value,
                            style: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFF475569),
                                height: 1.5))),
                  ],
                ),
              )),
        ],
        const SizedBox(height: 32),
      ],
    );
  }
}
