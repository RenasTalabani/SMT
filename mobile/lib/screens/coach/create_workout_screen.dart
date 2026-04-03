import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_client.dart';
import '../../models/exercise_model.dart';

// ---------------------------------------------------------------------------
// Exercise library provider
// ---------------------------------------------------------------------------

final _exercisesProvider = FutureProvider<List<ExerciseModel>>((ref) async {
  final res = await ApiClient().get('/exercises', params: {'limit': '100'});
  final data = res.data['data'];
  final list = data is Map ? (data['exercises'] ?? []) : data;
  return (list as List).map((e) => ExerciseModel.fromJson(e as Map<String, dynamic>)).toList();
});

// ---------------------------------------------------------------------------
// Data classes for in-progress plan building
// ---------------------------------------------------------------------------

class _ExEntry {
  ExerciseModel exercise;
  int sets = 3;
  int reps = 10;
  double weight = 0;
  int restTime = 60;
  String notes = '';

  _ExEntry({
    required this.exercise,
  });
}

class _DayEntry {
  String name;
  List<_ExEntry> exercises;

  _DayEntry({required this.name}) : exercises = [];
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class CreateWorkoutScreen extends ConsumerStatefulWidget {
  const CreateWorkoutScreen({super.key});

  @override
  ConsumerState<CreateWorkoutScreen> createState() => _CreateWorkoutScreenState();
}

class _CreateWorkoutScreenState extends ConsumerState<CreateWorkoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();

  String _difficulty = 'beginner';
  String _category = 'strength';
  int _durationWeeks = 4;
  int _frequency = 3;

  final List<_DayEntry> _days = [];
  bool _submitting = false;

  static const _bg = Color(0xFFF8FAFC);
  static const _blue = Color(0xFF2563EB);

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  // ── build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'Create Workout Plan',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: Color(0xFF0F172A)),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: _submitting
                ? const SizedBox(
                    width: 20, height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: _blue),
                  )
                : TextButton(
                    onPressed: _submit,
                    child: const Text('Save', style: TextStyle(color: _blue, fontWeight: FontWeight.w700)),
                  ),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _sectionCard(
              title: 'Plan Details',
              child: Column(
                children: [
                  _field(_titleCtrl, 'Plan Title', validator: (v) =>
                      v == null || v.trim().length < 3 ? 'Min 3 characters' : null),
                  const SizedBox(height: 12),
                  _field(_descCtrl, 'Description', maxLines: 3, validator: (v) =>
                      v == null || v.trim().length < 10 ? 'Min 10 characters' : null),
                  const SizedBox(height: 12),
                  _dropdown('Difficulty', _difficulty, ['beginner', 'intermediate', 'advanced'],
                      (v) => setState(() => _difficulty = v!)),
                  const SizedBox(height: 12),
                  _dropdown('Category', _category,
                      ['strength', 'cardio', 'mixed', 'weight_loss', 'muscle_gain', 'endurance', 'flexibility'],
                      (v) => setState(() => _category = v!)),
                  const SizedBox(height: 12),
                  Row(children: [
                    Expanded(child: _numberField('Duration (weeks)', _durationWeeks,
                        (v) => setState(() => _durationWeeks = v), 1, 52)),
                    const SizedBox(width: 12),
                    Expanded(child: _numberField('Days / week', _frequency,
                        (v) => setState(() => _frequency = v), 1, 7)),
                  ]),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Days
            ..._days.asMap().entries.map((entry) => _DayCard(
              index: entry.key,
              day: entry.value,
              exercisesAsync: ref.watch(_exercisesProvider),
              onRemove: () => setState(() => _days.removeAt(entry.key)),
              onChanged: () => setState(() {}),
            )),

            // Add day button
            if (_days.length < 7)
              OutlinedButton.icon(
                onPressed: () => setState(() =>
                    _days.add(_DayEntry(name: 'Day ${_days.length + 1}'))),
                icon: const Icon(Icons.add_rounded, color: _blue),
                label: const Text('Add Workout Day', style: TextStyle(color: _blue)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: _blue),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  // ── submit ─────────────────────────────────────────────────────────────────

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_days.isEmpty) {
      _snack('Add at least one workout day.');
      return;
    }

    setState(() => _submitting = true);
    try {
      final workoutsPayload = _days.asMap().entries.map((e) => {
        'day': e.key + 1,
        'name': e.value.name.trim().isEmpty ? 'Day ${e.key + 1}' : e.value.name.trim(),
        'exercises': e.value.exercises.asMap().entries.map((ex) => {
          'exercise': ex.value.exercise.id,
          'sets': ex.value.sets,
          'reps': ex.value.reps,
          if (ex.value.weight > 0) 'weight': ex.value.weight,
          'restTime': ex.value.restTime,
          if (ex.value.notes.trim().isNotEmpty) 'notes': ex.value.notes.trim(),
          'order': ex.key,
        }).toList(),
      }).toList();

      await ApiClient().post('/workouts', data: {
        'title': _titleCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'difficulty': _difficulty,
        'category': _category,
        'duration': _durationWeeks,
        'frequency': _frequency,
        'workouts': workoutsPayload,
        'status': 'active',
      });

      if (mounted) {
        _snack('Workout plan created!');
        context.pop();
      }
    } catch (e) {
      _snack(ApiClient.extractError(e));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating),
    );
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  Widget _sectionCard({required String title, required Widget child}) => Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)],
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
          const SizedBox(height: 14),
          child,
        ]),
      );

  Widget _field(TextEditingController ctrl, String hint,
      {int maxLines = 1, String? Function(String?)? validator}) =>
      TextFormField(
        controller: ctrl,
        maxLines: maxLines,
        validator: validator,
        decoration: InputDecoration(
          hintText: hint,
          filled: true,
          fillColor: const Color(0xFFF8FAFC),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      );

  Widget _dropdown(String label, String selected, List<String> options,
      ValueChanged<String?> onChanged) =>
      DropdownButtonFormField<String>(
        initialValue: selected,
        onChanged: onChanged,
        decoration: InputDecoration(
          labelText: label,
          filled: true,
          fillColor: const Color(0xFFF8FAFC),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
        items: options.map((o) => DropdownMenuItem(
              value: o,
              child: Text(o.replaceAll('_', ' '),
                  style: const TextStyle(fontSize: 14, textBaseline: TextBaseline.alphabetic)),
            )).toList(),
      );

  Widget _numberField(String label, int value, ValueChanged<int> onChanged, int min, int max) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
        const SizedBox(height: 6),
        Row(children: [
          _stepBtn(Icons.remove, () { if (value > min) onChanged(value - 1); }),
          Expanded(child: Center(child: Text('$value',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)))),
          _stepBtn(Icons.add, () { if (value < max) onChanged(value + 1); }),
        ]),
      ]);

  Widget _stepBtn(IconData icon, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: Container(
          width: 32, height: 32,
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: const Color(0xFF475569)),
        ),
      );
}

// ---------------------------------------------------------------------------
// Day card widget
// ---------------------------------------------------------------------------

class _DayCard extends StatefulWidget {
  const _DayCard({
    required this.index,
    required this.day,
    required this.exercisesAsync,
    required this.onRemove,
    required this.onChanged,
  });

  final int index;
  final _DayEntry day;
  final AsyncValue<List<ExerciseModel>> exercisesAsync;
  final VoidCallback onRemove;
  final VoidCallback onChanged;

  @override
  State<_DayCard> createState() => _DayCardState();
}

class _DayCardState extends State<_DayCard> {
  late TextEditingController _nameCtrl;
  bool _expanded = true;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.day.name);
    _nameCtrl.addListener(() {
      widget.day.name = _nameCtrl.text;
      widget.onChanged();
    });
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)],
      ),
      child: Column(children: [
        // Day header
        Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            Container(
              width: 28, height: 28,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: const Color(0xFF2563EB), borderRadius: BorderRadius.circular(8)),
              child: Text('${widget.index + 1}',
                  style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _nameCtrl,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                decoration: const InputDecoration(
                  isDense: true,
                  border: InputBorder.none,
                  hintText: 'Day name...',
                  hintStyle: TextStyle(color: Color(0xFF94A3B8)),
                ),
              ),
            ),
            GestureDetector(
              onTap: () => setState(() => _expanded = !_expanded),
              child: Icon(_expanded ? Icons.expand_less : Icons.expand_more,
                  color: const Color(0xFF94A3B8)),
            ),
            const SizedBox(width: 4),
            GestureDetector(
              onTap: widget.onRemove,
              child: const Icon(Icons.delete_outline_rounded, color: Color(0xFFEF4444), size: 20),
            ),
          ]),
        ),

        if (_expanded) ...[
          const Divider(height: 1, color: Color(0xFFE2E8F0)),
          // Exercises list
          if (widget.day.exercises.isNotEmpty)
            ...widget.day.exercises.asMap().entries.map((e) => _ExerciseEntry(
              entry: e.value,
              onRemove: () => setState(() {
                widget.day.exercises.removeAt(e.key);
                widget.onChanged();
              }),
              onChanged: widget.onChanged,
            )),
          // Add exercise button
          Padding(
            padding: const EdgeInsets.all(12),
            child: GestureDetector(
              onTap: () => _pickExercise(context),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB).withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF2563EB).withValues(alpha: 0.3)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add_rounded, size: 16, color: Color(0xFF2563EB)),
                    SizedBox(width: 6),
                    Text('Add Exercise', style: TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF2563EB))),
                  ],
                ),
              ),
            ),
          ),
        ],
      ]),
    );
  }

  void _pickExercise(BuildContext context) {
    widget.exercisesAsync.whenData((exercises) {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (_) => _ExercisePicker(
          exercises: exercises,
          onPick: (ex) {
            setState(() {
              widget.day.exercises.add(_ExEntry(exercise: ex));
              widget.onChanged();
            });
          },
        ),
      );
    });
  }
}

// ---------------------------------------------------------------------------
// Exercise entry row (sets/reps/weight/rest editable)
// ---------------------------------------------------------------------------

class _ExerciseEntry extends StatefulWidget {
  const _ExerciseEntry({
    required this.entry,
    required this.onRemove,
    required this.onChanged,
  });
  final _ExEntry entry;
  final VoidCallback onRemove;
  final VoidCallback onChanged;

  @override
  State<_ExerciseEntry> createState() => _ExerciseEntryState();
}

class _ExerciseEntryState extends State<_ExerciseEntry> {
  late TextEditingController _notesCtrl;

  @override
  void initState() {
    super.initState();
    _notesCtrl = TextEditingController(text: widget.entry.notes);
    _notesCtrl.addListener(() {
      widget.entry.notes = _notesCtrl.text;
    });
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final e = widget.entry;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
            child: Text(e.exercise.name,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
          ),
          GestureDetector(
            onTap: widget.onRemove,
            child: const Icon(Icons.close_rounded, size: 16, color: Color(0xFF94A3B8)),
          ),
        ]),
        const SizedBox(height: 8),
        Row(children: [
          _NumField('Sets', e.sets, (v) => setState(() { e.sets = v; widget.onChanged(); }), 1, 10),
          const SizedBox(width: 8),
          _NumField('Reps', e.reps, (v) => setState(() { e.reps = v; widget.onChanged(); }), 1, 100),
          const SizedBox(width: 8),
          _NumField('kg', e.weight.toInt(), (v) => setState(() { e.weight = v.toDouble(); widget.onChanged(); }), 0, 500),
          const SizedBox(width: 8),
          _NumField('Rest(s)', e.restTime, (v) => setState(() { e.restTime = v; widget.onChanged(); }), 0, 600),
        ]),
        const SizedBox(height: 6),
        TextField(
          controller: _notesCtrl,
          style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
          decoration: const InputDecoration(
            hintText: 'Notes (optional)',
            hintStyle: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
            isDense: true,
            border: InputBorder.none,
          ),
        ),
      ]),
    );
  }
}

class _NumField extends StatelessWidget {
  const _NumField(this.label, this.value, this.onChanged, this.min, this.max);
  final String label;
  final int value;
  final ValueChanged<int> onChanged;
  final int min;
  final int max;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(children: [
        Text(label, style: const TextStyle(fontSize: 9, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600)),
        const SizedBox(height: 2),
        Row(mainAxisSize: MainAxisSize.min, children: [
          GestureDetector(
            onTap: () { if (value > min) onChanged(value - 1); },
            child: const Icon(Icons.remove, size: 12, color: Color(0xFF94A3B8)),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text('$value', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          ),
          GestureDetector(
            onTap: () { if (value < max) onChanged(value + 1); },
            child: const Icon(Icons.add, size: 12, color: Color(0xFF94A3B8)),
          ),
        ]),
      ]),
    );
  }
}

// ---------------------------------------------------------------------------
// Exercise picker bottom sheet
// ---------------------------------------------------------------------------

class _ExercisePicker extends StatefulWidget {
  const _ExercisePicker({required this.exercises, required this.onPick});
  final List<ExerciseModel> exercises;
  final ValueChanged<ExerciseModel> onPick;

  @override
  State<_ExercisePicker> createState() => _ExercisePickerState();
}

class _ExercisePickerState extends State<_ExercisePicker> {
  String _search = '';
  String _filter = 'all';

  List<ExerciseModel> get _filtered => widget.exercises.where((ex) {
    final matchSearch = _search.isEmpty ||
        ex.name.toLowerCase().contains(_search.toLowerCase()) ||
        ex.muscleGroupsLabel.toLowerCase().contains(_search.toLowerCase());
    final matchFilter = _filter == 'all' || ex.category == _filter;
    return matchSearch && matchFilter;
  }).toList();

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.8,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      expand: false,
      builder: (_, controller) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(children: [
          Center(
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40, height: 4,
              decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(2)),
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text('Select Exercise', style: TextStyle(
              fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              onChanged: (v) => setState(() => _search = v),
              decoration: InputDecoration(
                hintText: 'Search exercises...',
                prefixIcon: const Icon(Icons.search_rounded, size: 20),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              ),
            ),
          ),
          const SizedBox(height: 8),
          // Category filter chips
          SizedBox(
            height: 36,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: ['all', 'strength', 'cardio', 'flexibility', 'functional']
                  .map((c) => GestureDetector(
                    onTap: () => setState(() => _filter = c),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: _filter == c ? const Color(0xFF2563EB) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        c == 'all' ? 'All' : c[0].toUpperCase() + c.substring(1),
                        style: TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w600,
                          color: _filter == c ? Colors.white : const Color(0xFF475569),
                        ),
                      ),
                    ),
                  )).toList(),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.separated(
              controller: controller,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _filtered.length,
              separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFE2E8F0)),
              itemBuilder: (_, i) {
                final ex = _filtered[i];
                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
                  leading: Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.fitness_center_rounded, color: Color(0xFF2563EB), size: 18),
                  ),
                  title: Text(ex.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  subtitle: Text(ex.muscleGroupsLabel,
                      style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(ex.difficultyLabel,
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF2563EB))),
                  ),
                  onTap: () {
                    widget.onPick(ex);
                    Navigator.pop(context);
                  },
                );
              },
            ),
          ),
        ]),
      ),
    );
  }
}
