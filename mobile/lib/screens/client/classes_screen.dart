import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';
import '../../core/storage/secure_storage.dart';

/// Group classes — members join/leave scheduled classes (limited spots).
/// Backed by GET /classes, POST /classes/:id/join|leave.
class ClassesScreen extends StatefulWidget {
  const ClassesScreen({super.key});

  @override
  State<ClassesScreen> createState() => _ClassesScreenState();
}

class _ClassesScreenState extends State<ClassesScreen> {
  List<Map<String, dynamic>> _classes = [];
  String? _myId;
  bool _loading = true;
  String? _busy;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      _myId ??= await _readMyId();
      final res = await ApiClient().get('/classes');
      _classes = List<Map<String, dynamic>>.from(res.data['data']['classes'] as List);
      _error = null;
    } catch (e) {
      _error = ApiClient.extractError(e);
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<String?> _readMyId() => SecureStorage.getUserId();

  Future<void> _toggle(Map<String, dynamic> c, bool joined) async {
    setState(() => _busy = c['_id']);
    try {
      await ApiClient().post('/classes/${c['_id']}/${joined ? 'leave' : 'join'}');
      await _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiClient.extractError(e))));
    }
    if (mounted) setState(() => _busy = null);
  }

  String _fmt(DateTime d) {
    final days = ['mon'.tr(), 'tue'.tr(), 'wed'.tr(), 'thu'.tr(), 'fri'.tr(), 'sat'.tr(), 'sun'.tr()];
    final hh = d.hour.toString().padLeft(2, '0');
    final mm = d.minute.toString().padLeft(2, '0');
    return '${days[d.weekday - 1]} ${d.day}/${d.month} · $hh:$mm';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('group_classes'.tr())),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
                  if (_classes.isEmpty && _error == null) Text('no_classes_scheduled_yet'.tr()),
                  ..._classes.map((c) {
                    final attendees = (c['attendees'] ?? []) as List;
                    final joined = attendees.any((a) => (a is String ? a : a['_id']) == _myId);
                    final left = ((c['capacity'] ?? 0) as int) - attendees.length;
                    final starts = DateTime.parse(c['startsAt'] as String).toLocal();
                    final coach = c['coach'] is Map ? c['coach']['name'] : '';
                    return Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: Color(0xFFE2E8F0))),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Expanded(child: Text(c['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
                            Chip(label: Text(left > 0 ? 'x_spots'.tr(namedArgs: {'left': '$left'}) : 'full'.tr())),
                          ]),
                          Text('${_fmt(starts)} · ${c['durationMin']} min · $coach', style: const TextStyle(color: Color(0xFF64748B))),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            child: joined
                                ? OutlinedButton(onPressed: _busy == c['_id'] ? null : () => _toggle(c, true), child: Text('joined_leave'.tr()))
                                : FilledButton(onPressed: _busy == c['_id'] || left <= 0 ? null : () => _toggle(c, false), child: Text('join'.tr())),
                          ),
                        ]),
                      ),
                    );
                  }),
                ],
              ),
            ),
    );
  }
}
