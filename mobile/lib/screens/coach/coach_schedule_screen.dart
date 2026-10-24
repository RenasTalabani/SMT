import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';

/// Coach weekly schedule — members can only book the hours opened here.
/// Backed by GET /bookings/availability/me and PUT /bookings/availability.
class CoachScheduleScreen extends StatefulWidget {
  const CoachScheduleScreen({super.key});

  @override
  State<CoachScheduleScreen> createState() => _CoachScheduleScreenState();
}

class _Slot {
  TimeOfDay start;
  TimeOfDay end;
  _Slot(this.start, this.end);
}

class _CoachScheduleScreenState extends State<CoachScheduleScreen> {
  static const _days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  final Map<String, bool> _enabled = {};
  final Map<String, List<_Slot>> _slots = {};
  int _duration = 60;
  int _buffer = 0;
  double _price = 0;
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    for (final d in _days) {
      _enabled[d] = d != 'friday';
      _slots[d] = [_Slot(const TimeOfDay(hour: 16, minute: 0), const TimeOfDay(hour: 21, minute: 0))];
    }
    _load();
  }

  TimeOfDay _parse(String s) {
    final p = s.split(':');
    return TimeOfDay(hour: int.parse(p[0]), minute: int.parse(p[1]));
  }

  String _fmt(TimeOfDay t) => '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  Future<void> _load() async {
    try {
      final res = await ApiClient().get('/bookings/availability/me');
      final a = res.data['data']['availability'];
      if (a is Map<String, dynamic>) {
        final ws = (a['weeklySchedule'] ?? {}) as Map<String, dynamic>;
        for (final d in _days) {
          final day = ws[d];
          if (day is Map<String, dynamic>) {
            _enabled[d] = day['enabled'] == true;
            _slots[d] = ((day['slots'] ?? []) as List)
                .map((s) => _Slot(_parse(s['startTime']), _parse(s['endTime'])))
                .toList();
          }
        }
        _duration = (a['sessionDurationMin'] ?? 60) as int;
        _buffer = (a['bufferMin'] ?? 0) as int;
        _price = ((a['sessionPrice'] ?? 0) as num).toDouble();
      }
    } catch (e) {
      _error = 'Could not load your schedule';
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ApiClient().put('/bookings/availability', data: {
        'weeklySchedule': {
          for (final d in _days)
            d: {
              'enabled': _enabled[d],
              'slots': _slots[d]!.map((s) => {'startTime': _fmt(s.start), 'endTime': _fmt(s.end)}).toList(),
            }
        },
        'sessionDurationMin': _duration,
        'bufferMin': _buffer,
        'sessionPrice': _price,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Schedule saved')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not save — check the times')));
      }
    }
    if (mounted) setState(() => _saving = false);
  }

  Future<void> _pick(_Slot slot, bool start) async {
    final t = await showTimePicker(context: context, initialTime: start ? slot.start : slot.end);
    if (t != null) setState(() => start ? slot.start = t : slot.end = t);
  }

  String _title(String d) => d[0].toUpperCase() + d.substring(1);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My schedule')),
      floatingActionButton: _loading
          ? null
          : FloatingActionButton.extended(
              onPressed: _saving ? null : _save,
              icon: const Icon(Icons.save_rounded),
              label: Text(_saving ? 'Saving…' : 'Save'),
            ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              children: [
                if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
                const Text('Members can only book the hours you open here.', style: TextStyle(color: Color(0xFF64748B))),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(
                    child: DropdownButtonFormField<int>(
                      key: ValueKey('d$_duration'),
                      initialValue: _duration,
                      decoration: const InputDecoration(labelText: 'Session (min)', border: OutlineInputBorder(), isDense: true),
                      items: ({30, 45, 60, 75, 90, 120, _duration}.toList()..sort())
                          .map((m) => DropdownMenuItem(value: m, child: Text('$m')))
                          .toList(),
                      onChanged: (v) => setState(() => _duration = v ?? 60),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DropdownButtonFormField<int>(
                      key: ValueKey('b$_buffer'),
                      initialValue: _buffer,
                      decoration: const InputDecoration(labelText: 'Break (min)', border: OutlineInputBorder(), isDense: true),
                      items: ({0, 5, 10, 15, 30, _buffer}.toList()..sort())
                          .map((m) => DropdownMenuItem(value: m, child: Text('$m')))
                          .toList(),
                      onChanged: (v) => setState(() => _buffer = v ?? 0),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      initialValue: _price.toStringAsFixed(0),
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Price', border: OutlineInputBorder(), isDense: true),
                      onChanged: (v) => _price = double.tryParse(v) ?? 0,
                    ),
                  ),
                ]),
                const SizedBox(height: 12),
                for (final d in _days)
                  Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFFE2E8F0))),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      child: Column(children: [
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(_title(d), style: const TextStyle(fontWeight: FontWeight.w600)),
                          value: _enabled[d]!,
                          onChanged: (v) => setState(() => _enabled[d] = v),
                        ),
                        if (_enabled[d]!)
                          ..._slots[d]!.map((s) => Row(children: [
                                TextButton(onPressed: () => _pick(s, true), child: Text(_fmt(s.start))),
                                const Text('→'),
                                TextButton(onPressed: () => _pick(s, false), child: Text(_fmt(s.end))),
                                const Spacer(),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                                  onPressed: () => setState(() => _slots[d]!.remove(s)),
                                ),
                              ])),
                        if (_enabled[d]!)
                          Align(
                            alignment: AlignmentDirectional.centerStart,
                            child: TextButton.icon(
                              onPressed: () => setState(() => _slots[d]!.add(
                                  _Slot(const TimeOfDay(hour: 9, minute: 0), const TimeOfDay(hour: 12, minute: 0)))),
                              icon: const Icon(Icons.add),
                              label: const Text('Add hours'),
                            ),
                          ),
                      ]),
                    ),
                  ),
              ],
            ),
    );
  }
}
