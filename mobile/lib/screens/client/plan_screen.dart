import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/workout_provider.dart';
import '../../core/network/api_client.dart';
import '../../models/workout_model.dart';
import '../../models/user_model.dart';
import '../../widgets/gym_avatar.dart';
import '../../widgets/loading_shimmer.dart';
import '../../widgets/error_view.dart';

// ---------------------------------------------------------------------------
// Plan types definition
// ---------------------------------------------------------------------------

class _PlanType {
  final String value;
  final String label;
  final String emoji;

  const _PlanType(this.value, this.label, this.emoji);
}

List<_PlanType> get _planTypes => [
  _PlanType('HIIT', 'hiit'.tr(), '⚡'),
  _PlanType('Strength', 'strength'.tr(), '🏋️'),
  _PlanType('Muscle', 'muscle'.tr(), '💪'),
  _PlanType('Cutting', 'cutting'.tr(), '🔥'),
  _PlanType('Bulking', 'bulking'.tr(), '📈'),
  _PlanType('Endurance', 'endurance'.tr(), '🏃'),
  _PlanType('Flexibility', 'flexibility'.tr(), '🧘'),
  _PlanType('General', 'general'.tr(), '🌟'),
];

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

class PlanScreen extends ConsumerStatefulWidget {
  const PlanScreen({super.key});

  @override
  ConsumerState<PlanScreen> createState() => _PlanScreenState();
}

class _PlanScreenState extends ConsumerState<PlanScreen> {
  bool _showRequestWizard = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(workoutProvider.notifier).fetchPlans();
      ref.read(workoutProvider.notifier).fetchTemplates();
    });
  }

  @override
  Widget build(BuildContext context) {
    final workoutState = ref.watch(workoutProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'my_plan'.tr(),
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: Color(0xFF0F172A),
          ),
        ),
        actions: [
          if (!_showRequestWizard)
            IconButton(
              onPressed: () {
                ref.read(workoutProvider.notifier).resetRequestSent();
                setState(() => _showRequestWizard = true);
              },
              icon: const Icon(Icons.add_rounded, color: Color(0xFF26BDB8)),
              tooltip: 'request_a_plan'.tr(),
            ),
          if (_showRequestWizard)
            IconButton(
              onPressed: () => setState(() => _showRequestWizard = false),
              icon: const Icon(Icons.close_rounded, color: Color(0xFF475569)),
            ),
        ],
      ),
      body: workoutState.isLoading && workoutState.plans.isEmpty
          ? const Padding(
              padding: EdgeInsets.all(16),
              child: LoadingShimmer(count: 3, height: 90),
            )
          : workoutState.error != null && workoutState.plans.isEmpty
              ? ErrorView(
                  message: workoutState.error!,
                  onRetry: () =>
                      ref.read(workoutProvider.notifier).fetchPlans(),
                )
              : _showRequestWizard
                  ? _PlanRequestWizard(
                      onSuccess: () {
                        setState(() => _showRequestWizard = false);
                        ref.read(workoutProvider.notifier).fetchPlans();
                      },
                      onCancel: () =>
                          setState(() => _showRequestWizard = false),
                    )
                  : workoutState.plans.isEmpty
                      ? _NoPlansView(
                          templates: workoutState.templates,
                          isLoadingTemplates: workoutState.isLoadingTemplates,
                          onRequestPlan: () {
                            ref
                                .read(workoutProvider.notifier)
                                .resetRequestSent();
                            setState(() => _showRequestWizard = true);
                          },
                        )
                      : _PlansList(
                          plans: workoutState.plans,
                          onRequestNew: () {
                            ref
                                .read(workoutProvider.notifier)
                                .resetRequestSent();
                            setState(() => _showRequestWizard = true);
                          },
                        ),
    );
  }
}

// ---------------------------------------------------------------------------
// Plans list
// ---------------------------------------------------------------------------

class _PlansList extends StatelessWidget {
  const _PlansList({
    required this.plans,
    required this.onRequestNew,
  });

  final List<WorkoutPlanModel> plans;
  final VoidCallback onRequestNew;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: plans.length + 1,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        if (index == plans.length) {
          return Padding(
            padding: const EdgeInsets.only(top: 8),
            child: OutlinedButton.icon(
              onPressed: onRequestNew,
              icon: const Icon(Icons.add_rounded),
              label: Text('request_another_plan'.tr()),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF26BDB8),
                side:
                    const BorderSide(color: Color(0xFF26BDB8), width: 1.5),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          );
        }
        return _PlanListCard(plan: plans[index]);
      },
    );
  }
}

class _PlanListCard extends StatelessWidget {
  const _PlanListCard({required this.plan});
  final WorkoutPlanModel plan;

  Color _difficultyColor(String? d) {
    switch (d) {
      case 'beginner':
        return const Color(0xFF22C55E);
      case 'intermediate':
        return const Color(0xFFF59E0B);
      case 'advanced':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF64748B);
    }
  }

  Color _statusColor(String? s) {
    switch (s) {
      case 'active':
        return const Color(0xFF22C55E);
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'completed':
        return const Color(0xFF64748B);
      default:
        return const Color(0xFF94A3B8);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/client/plan/${plan.id}'),
      child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  plan.title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor(plan.status).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  (plan.status ?? 'unknown').toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: _statusColor(plan.status),
                  ),
                ),
              ),
            ],
          ),
          if (plan.description.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              plan.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF64748B),
                height: 1.4,
              ),
            ),
          ],
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              if (plan.categoryLabel.isNotEmpty)
                _Chip(
                    label: plan.categoryLabel,
                    color: const Color(0xFF26BDB8)),
              if (plan.difficultyLabel.isNotEmpty)
                _Chip(
                  label: plan.difficultyLabel,
                  color: _difficultyColor(plan.difficulty),
                ),
              if (plan.duration != null)
                _Chip(
                  label: 'x_weeks'.tr(namedArgs: {'n0': '${plan.duration}'}),
                  color: const Color(0xFF64748B),
                ),
              if (plan.frequency != null)
                _Chip(
                  label: 'x_x_week'.tr(namedArgs: {'n0': '${plan.frequency}'}),
                  color: const Color(0xFF64748B),
                ),
            ],
          ),
        ],
      ),
    ),
    );
  }
}

// ---------------------------------------------------------------------------
// No plans yet — shows CTA + public templates
// ---------------------------------------------------------------------------

class _NoPlansView extends StatelessWidget {
  const _NoPlansView({
    required this.templates,
    required this.isLoadingTemplates,
    required this.onRequestPlan,
  });

  final List<WorkoutPlanModel> templates;
  final bool isLoadingTemplates;
  final VoidCallback onRequestPlan;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // CTA banner
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF26BDB8), Color(0xFF1A9E99)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.fitness_center_rounded,
                  color: Colors.white, size: 32),
              const SizedBox(height: 12),
              Text(
                'no_plan_yet'.tr(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'request_a_personalised_workout_plan_from_2'.tr(),
                style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onRequestPlan,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF26BDB8),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('request_a_plan'.tr(),
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),

        // Templates section
        if (isLoadingTemplates) ...[
          const SizedBox(height: 24),
          const Center(
              child: CircularProgressIndicator(color: Color(0xFF26BDB8))),
        ] else if (templates.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text(
            'explore_templates'.tr(),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'browse_ready_made_plans_to_get'.tr(),
            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 12),
          ...templates.map((t) => _TemplateCard(plan: t)),
        ],
      ],
    );
  }
}

class _TemplateCard extends StatelessWidget {
  const _TemplateCard({required this.plan});
  final WorkoutPlanModel plan;

  Color _difficultyColor(String? d) {
    switch (d) {
      case 'beginner': return const Color(0xFF22C55E);
      case 'intermediate': return const Color(0xFFF59E0B);
      case 'advanced': return const Color(0xFFEF4444);
      default: return const Color(0xFF64748B);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/client/plan/${plan.id}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFF26BDB8).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.fitness_center_rounded,
                  color: Color(0xFF26BDB8), size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    plan.title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 6,
                    children: [
                      if (plan.categoryLabel.isNotEmpty)
                        _Chip(label: plan.categoryLabel, color: const Color(0xFF26BDB8)),
                      if (plan.difficultyLabel.isNotEmpty)
                        _Chip(label: plan.difficultyLabel, color: _difficultyColor(plan.difficulty)),
                      if (plan.workouts.isNotEmpty)
                        _Chip(
                          label: 'x_days'.tr(namedArgs: {'n0': '${plan.workouts.length}'}),
                          color: const Color(0xFF64748B),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1)),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 3-step plan request wizard
// ---------------------------------------------------------------------------

class _PlanRequestWizard extends ConsumerStatefulWidget {
  const _PlanRequestWizard({
    required this.onSuccess,
    required this.onCancel,
  });

  final VoidCallback onSuccess;
  final VoidCallback onCancel;

  @override
  ConsumerState<_PlanRequestWizard> createState() =>
      _PlanRequestWizardState();
}

class _PlanRequestWizardState extends ConsumerState<_PlanRequestWizard> {
  int _step = 0;
  String? _selectedCoachId;
  String? _selectedCoachName;
  String? _selectedPlanType;
  final TextEditingController _notesController = TextEditingController();

  List<UserModel> _coaches = [];
  bool _loadingCoaches = false;
  String? _coachError;

  @override
  void initState() {
    super.initState();
    _fetchCoaches();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _fetchCoaches() async {
    setState(() {
      _loadingCoaches = true;
      _coachError = null;
    });
    try {
      final response = await ApiClient().get('/users/coaches');
      final data = response.data['data'];
      List<dynamic> rawList;
      if (data is List) {
        rawList = data;
      } else if (data is Map) {
        rawList = (data['coaches'] ?? data['users'] ?? data['items'] ?? [])
            as List;
      } else {
        rawList = [];
      }
      final coaches = rawList
          .map((e) => UserModel.fromJson(e as Map<String, dynamic>))
          .toList();
      setState(() {
        _coaches = coaches;
        _loadingCoaches = false;
      });
    } catch (e) {
      setState(() {
        _coachError = ApiClient.extractError(e);
        _loadingCoaches = false;
      });
    }
  }

  Future<void> _submit() async {
    if (_selectedCoachId == null || _selectedPlanType == null) return;
    await ref.read(workoutProvider.notifier).requestPlan(
          coachId: _selectedCoachId!,
          planType: _selectedPlanType!,
          notes: _notesController.text.trim().isEmpty
              ? null
              : _notesController.text.trim(),
        );
    final requestSent = ref.read(workoutProvider).requestSent;
    if (requestSent) widget.onSuccess();
  }

  @override
  Widget build(BuildContext context) {
    final workoutState = ref.watch(workoutProvider);

    // Success state
    if (workoutState.requestSent) {
      return _SuccessCard(onDone: widget.onSuccess);
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step indicator
          _StepIndicator(currentStep: _step, totalSteps: 3),
          const SizedBox(height: 20),

          // Step content
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            child: _step == 0
                ? _StepChooseCoach(
                    key: const ValueKey('step0'),
                    coaches: _coaches,
                    isLoading: _loadingCoaches,
                    error: _coachError,
                    selectedCoachId: _selectedCoachId,
                    onCoachSelected: (coach) {
                      setState(() {
                        _selectedCoachId = coach.id;
                        _selectedCoachName = coach.name;
                      });
                    },
                    onRetry: _fetchCoaches,
                  )
                : _step == 1
                    ? _StepChoosePlanType(
                        key: const ValueKey('step1'),
                        selectedType: _selectedPlanType,
                        onTypeSelected: (type) =>
                            setState(() => _selectedPlanType = type),
                      )
                    : _StepNotes(
                        key: const ValueKey('step2'),
                        controller: _notesController,
                        coachName: _selectedCoachName ?? '',
                        planType: _selectedPlanType ?? '',
                        isLoading: workoutState.isLoading,
                        error: workoutState.error,
                        onSubmit: _submit,
                      ),
          ),

          const SizedBox(height: 24),

          // Navigation buttons
          Row(
            children: [
              if (_step > 0)
                Expanded(
                  child: OutlinedButton(
                    onPressed: workoutState.isLoading
                        ? null
                        : () => setState(() => _step--),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF475569),
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('back'.tr()),
                  ),
                ),
              if (_step > 0) const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: workoutState.isLoading
                      ? null
                      : () {
                          if (_step == 0 && _selectedCoachId == null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                  content:
                                      Text('please_select_a_coach_first'.tr())),
                            );
                            return;
                          }
                          if (_step == 1 && _selectedPlanType == null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                  content:
                                      Text('please_select_a_plan_type'.tr())),
                            );
                            return;
                          }
                          if (_step == 2) {
                            _submit();
                          } else {
                            setState(() => _step++);
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF26BDB8),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: workoutState.isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Text(_step == 2 ? 'submit_request'.tr() : 'next'.tr()),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Step 1 – Choose coach
// ---------------------------------------------------------------------------

class _StepChooseCoach extends StatelessWidget {
  const _StepChooseCoach({
    super.key,
    required this.coaches,
    required this.isLoading,
    required this.error,
    required this.selectedCoachId,
    required this.onCoachSelected,
    required this.onRetry,
  });

  final List<UserModel> coaches;
  final bool isLoading;
  final String? error;
  final String? selectedCoachId;
  final ValueChanged<UserModel> onCoachSelected;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'choose_a_coach'.tr(),
          style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A)),
        ),
        const SizedBox(height: 4),
        Text(
          'pick_the_coach_who_will_create'.tr(),
          style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
        ),
        const SizedBox(height: 16),
        if (isLoading)
          const Center(
              child:
                  CircularProgressIndicator(color: Color(0xFF26BDB8)))
        else if (error != null)
          ErrorView(message: error!, onRetry: onRetry)
        else if (coaches.isEmpty)
          Center(
              child: Text('no_coaches_available'.tr(),
                  style: const TextStyle(color: Color(0xFF94A3B8))))
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate:
                const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.8,
            ),
            itemCount: coaches.length,
            itemBuilder: (context, index) {
              final coach = coaches[index];
              final isSelected = coach.id == selectedCoachId;
              return GestureDetector(
                onTap: () => onCoachSelected(coach),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFF26BDB8).withValues(alpha: 0.08)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF26BDB8)
                          : const Color(0xFFE2E8F0),
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      GymAvatar(
                        imageUrl: coach.avatar,
                        initials: coach.initials,
                        size: 52,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        coach.name,
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isSelected
                              ? const Color(0xFF26BDB8)
                              : const Color(0xFF0F172A),
                        ),
                      ),
                      if (coach.specialization != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          coach.specialization!,
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 10, color: Color(0xFF94A3B8)),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Step 2 – Choose plan type
// ---------------------------------------------------------------------------

class _StepChoosePlanType extends StatelessWidget {
  const _StepChoosePlanType({
    super.key,
    required this.selectedType,
    required this.onTypeSelected,
  });

  final String? selectedType;
  final ValueChanged<String> onTypeSelected;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'choose_plan_type'.tr(),
          style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A)),
        ),
        const SizedBox(height: 4),
        Text(
          'what_kind_of_training_are_you'.tr(),
          style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate:
              const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 2.4,
          ),
          itemCount: _planTypes.length,
          itemBuilder: (context, index) {
            final pt = _planTypes[index];
            final isSelected = pt.value == selectedType;
            return GestureDetector(
              onTap: () => onTypeSelected(pt.value),
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFF26BDB8).withValues(alpha: 0.08)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected
                        ? const Color(0xFF26BDB8)
                        : const Color(0xFFE2E8F0),
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Text(pt.emoji, style: const TextStyle(fontSize: 20)),
                    const SizedBox(width: 8),
                    Text(
                      pt.label,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isSelected
                            ? const Color(0xFF26BDB8)
                            : const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Step 3 – Notes + confirm
// ---------------------------------------------------------------------------

class _StepNotes extends StatelessWidget {
  const _StepNotes({
    super.key,
    required this.controller,
    required this.coachName,
    required this.planType,
    required this.isLoading,
    required this.error,
    required this.onSubmit,
  });

  final TextEditingController controller;
  final String coachName;
  final String planType;
  final bool isLoading;
  final String? error;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'additional_notes'.tr(),
          style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A)),
        ),
        const SizedBox(height: 4),
        Text(
          'tell_your_coach_about_your_goals'.tr(),
          style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
        ),
        const SizedBox(height: 16),

        // Summary card
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF26BDB8).withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
                color: const Color(0xFF26BDB8).withValues(alpha: 0.2)),
          ),
          child: Column(
            children: [
              _SummaryRow(label: 'coach'.tr(), value: coachName),
              const SizedBox(height: 6),
              _SummaryRow(label: 'plan_type'.tr(), value: planType),
            ],
          ),
        ),
        const SizedBox(height: 16),

        TextField(
          controller: controller,
          maxLines: 5,
          decoration: InputDecoration(
            hintText:
                'e_g_i_want_to_lose'.tr(),
            hintStyle: const TextStyle(color: Color(0xFFCBD5E1)),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                  color: Color(0xFF26BDB8), width: 1.5),
            ),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.all(14),
          ),
        ),

        if (error != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline_rounded,
                    color: Color(0xFFEF4444), size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    error!,
                    style: const TextStyle(
                        color: Color(0xFFEF4444), fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          '$label: ',
          style: const TextStyle(
              fontSize: 13, color: Color(0xFF64748B)),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Color(0xFF0F172A),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Success state
// ---------------------------------------------------------------------------

class _SuccessCard extends StatelessWidget {
  const _SuccessCard({required this.onDone});
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: const Color(0xFF22C55E).withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                color: Color(0xFF22C55E),
                size: 48,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'request_sent'.tr(),
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'your_coach_will_review_your_request'.tr(),
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onDone,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF26BDB8),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: Text('back_to_plans'.tr(),
                    style: const TextStyle(fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

class _StepIndicator extends StatelessWidget {
  const _StepIndicator(
      {required this.currentStep, required this.totalSteps});
  final int currentStep;
  final int totalSteps;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(totalSteps, (index) {
        final isActive = index <= currentStep;
        return Expanded(
          child: Row(
            children: [
              Expanded(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  height: 4,
                  decoration: BoxDecoration(
                    color: isActive
                        ? const Color(0xFF26BDB8)
                        : const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              if (index < totalSteps - 1) const SizedBox(width: 4),
            ],
          ),
        );
      }),
    );
  }
}

// ---------------------------------------------------------------------------
// Shared chip
// ---------------------------------------------------------------------------

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}
