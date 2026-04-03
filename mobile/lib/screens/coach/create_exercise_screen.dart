import 'dart:io';
import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';

import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';

const _teal = Color(0xFF26BDB8);

class CreateExerciseScreen extends ConsumerStatefulWidget {
  const CreateExerciseScreen({super.key});

  @override
  ConsumerState<CreateExerciseScreen> createState() =>
      _CreateExerciseScreenState();
}

class _CreateExerciseScreenState extends ConsumerState<CreateExerciseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();

  String _category = 'strength';
  String _difficulty = 'beginner';
  final List<String> _muscleGroups = [];
  final List<Map<String, dynamic>> _instructions = [];
  final _instructionCtrl = TextEditingController();

  String? _videoPath;
  String? _uploadedVideoUrl;
  double _uploadProgress = 0;
  bool _uploading = false;
  bool _submitting = false;
  String? _error;

  VideoPlayerController? _videoCtrl;
  ChewieController? _chewieCtrl;

  static const _categories = ['strength', 'cardio', 'flexibility', 'balance', 'hiit', 'functional'];
  static const _difficulties = ['beginner', 'intermediate', 'advanced'];
  static const _allMuscles = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes', 'full_body'];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _instructionCtrl.dispose();
    _chewieCtrl?.dispose();
    _videoCtrl?.dispose();
    super.dispose();
  }

  Future<void> _pickVideo() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.video,
      allowMultiple: false,
    );
    if (result == null || result.files.single.path == null) return;

    final path = result.files.single.path!;
    setState(() {
      _videoPath = path;
      _uploadedVideoUrl = null;
      _chewieCtrl?.dispose();
      _videoCtrl?.dispose();
    });

    // Init preview
    final ctrl = VideoPlayerController.file(File(path));
    await ctrl.initialize();
    setState(() {
      _videoCtrl = ctrl;
      _chewieCtrl = ChewieController(
        videoPlayerController: ctrl,
        autoPlay: false,
        looping: false,
        aspectRatio: ctrl.value.aspectRatio,
      );
    });
  }

  Future<void> _uploadVideo() async {
    if (_videoPath == null) return;
    setState(() { _uploading = true; _uploadProgress = 0; _error = null; });

    try {
      final formData = FormData.fromMap({
        'video': await MultipartFile.fromFile(_videoPath!),
      });

      final res = await ApiClient().postFormData(
        ApiConstants.uploadVideo,
        formData,
      );

      final url = res.data['data']['url'] as String;
      setState(() { _uploadedVideoUrl = url; });
    } catch (e) {
      setState(() { _error = ApiClient.extractError(e); });
    } finally {
      setState(() { _uploading = false; });
    }
  }

  void _addInstruction() {
    final text = _instructionCtrl.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _instructions.add({'step': _instructions.length + 1, 'instruction': text});
      _instructionCtrl.clear();
    });
  }

  void _removeInstruction(int index) {
    setState(() {
      _instructions.removeAt(index);
      for (int i = 0; i < _instructions.length; i++) {
        _instructions[i]['step'] = i + 1;
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_muscleGroups.isEmpty) {
      setState(() { _error = 'Select at least one muscle group'; });
      return;
    }
    setState(() { _submitting = true; _error = null; });

    try {
      final body = {
        'name': _nameCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'category': _category,
        'difficulty': _difficulty,
        'muscleGroups': _muscleGroups,
        'equipment': ['none'],
        'instructions': _instructions,
        if (_uploadedVideoUrl != null)
          'videos': [{'url': _uploadedVideoUrl, 'title': _nameCtrl.text.trim()}],
      };

      await ApiClient().post(ApiConstants.exercises, data: body);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Exercise created!'), backgroundColor: _teal),
      );
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() { _error = ApiClient.extractError(e); });
    } finally {
      setState(() { _submitting = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Create Exercise', style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _section('Basic Info'),
            _card(Column(children: [
              _field(_nameCtrl, 'Exercise Name', 'e.g. Barbell Squat', required: true),
              const SizedBox(height: 12),
              _field(_descCtrl, 'Description', 'Describe the exercise...', required: true, maxLines: 3),
            ])),
            const SizedBox(height: 16),

            _section('Category & Difficulty'),
            _card(Column(children: [
              _dropdown('Category', _categories, _category, (v) => setState(() => _category = v!)),
              const SizedBox(height: 12),
              _dropdown('Difficulty', _difficulties, _difficulty, (v) => setState(() => _difficulty = v!)),
            ])),
            const SizedBox(height: 16),

            _section('Muscle Groups'),
            _card(Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _allMuscles.map((m) {
                final selected = _muscleGroups.contains(m);
                return FilterChip(
                  label: Text(m.replaceAll('_', ' '), style: TextStyle(
                    fontSize: 13,
                    color: selected ? Colors.white : const Color(0xFF334155),
                    fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                  )),
                  selected: selected,
                  onSelected: (val) => setState(() {
                    val ? _muscleGroups.add(m) : _muscleGroups.remove(m);
                  }),
                  selectedColor: _teal,
                  checkmarkColor: Colors.white,
                  backgroundColor: const Color(0xFFF1F5F9),
                  side: BorderSide(color: selected ? _teal : const Color(0xFFE2E8F0)),
                );
              }).toList(),
            )),
            const SizedBox(height: 16),

            _section('Instructions'),
            _card(Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ..._instructions.asMap().entries.map((e) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(children: [
                    CircleAvatar(radius: 12, backgroundColor: _teal,
                        child: Text('${e.key + 1}', style: const TextStyle(color: Colors.white, fontSize: 11))),
                    const SizedBox(width: 8),
                    Expanded(child: Text(e.value['instruction'] as String,
                        style: const TextStyle(fontSize: 14))),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 18, color: Color(0xFF94A3B8)),
                      onPressed: () => _removeInstruction(e.key),
                    ),
                  ]),
                )),
                Row(children: [
                  Expanded(child: TextFormField(
                    controller: _instructionCtrl,
                    decoration: InputDecoration(
                      hintText: 'Add step...',
                      hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: _teal, width: 1.5)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      filled: true, fillColor: const Color(0xFFF8FAFC),
                    ),
                    onFieldSubmitted: (_) => _addInstruction(),
                  )),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _addInstruction,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _teal, foregroundColor: Colors.white,
                      minimumSize: const Size(48, 48), padding: EdgeInsets.zero,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Icon(Icons.add_rounded),
                  ),
                ]),
              ],
            )),
            const SizedBox(height: 16),

            _section('Exercise Video (optional)'),
            _card(Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_chewieCtrl != null) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: AspectRatio(
                      aspectRatio: _videoCtrl!.value.aspectRatio,
                      child: Chewie(controller: _chewieCtrl!),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                if (_uploading) ...[
                  LinearProgressIndicator(value: _uploadProgress, color: _teal,
                      backgroundColor: const Color(0xFFE2E8F0)),
                  const SizedBox(height: 8),
                  const Text('Uploading...', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                  const SizedBox(height: 12),
                ],
                if (_uploadedVideoUrl != null) ...[
                  const Row(children: [
                    Icon(Icons.check_circle_rounded, color: _teal, size: 18),
                    SizedBox(width: 6),
                    Text('Video uploaded', style: TextStyle(color: _teal, fontWeight: FontWeight.w600)),
                  ]),
                  const SizedBox(height: 12),
                ],
                Row(children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _uploading ? null : _pickVideo,
                      icon: const Icon(Icons.video_library_rounded, size: 18),
                      label: Text(_videoPath == null ? 'Pick Video' : 'Change Video'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: _teal,
                        side: const BorderSide(color: _teal),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  if (_videoPath != null && _uploadedVideoUrl == null) ...[
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _uploading ? null : _uploadVideo,
                        icon: const Icon(Icons.upload_rounded, size: 18),
                        label: const Text('Upload'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _teal, foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ],
                ]),
              ],
            )),

            if (_error != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Row(children: [
                  const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_error!, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13))),
                ]),
              ),
            ],

            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _submitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: _teal, foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _submitting
                  ? const SizedBox(width: 22, height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                  : const Text('Create Exercise',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _section(String title) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(title, style: const TextStyle(
      fontWeight: FontWeight.w700, fontSize: 15, color: Color(0xFF0F172A))),
  );

  Widget _card(Widget child) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: const Color(0xFFE2E8F0)),
    ),
    child: child,
  );

  Widget _field(TextEditingController ctrl, String label, String hint,
      {bool required = false, int maxLines = 1}) =>
      TextFormField(
        controller: ctrl,
        maxLines: maxLines,
        validator: required ? (v) => (v == null || v.trim().isEmpty) ? '$label is required' : null : null,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: _teal, width: 1.5)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          filled: true, fillColor: const Color(0xFFF8FAFC),
        ),
      );

  Widget _dropdown(String label, List<String> items, String value, ValueChanged<String?> onChanged) =>
      DropdownButtonFormField<String>(
        initialValue: value,
        onChanged: onChanged,
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: _teal, width: 1.5)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          filled: true, fillColor: const Color(0xFFF8FAFC),
        ),
        items: items.map((e) => DropdownMenuItem(
          value: e,
          child: Text(e[0].toUpperCase() + e.substring(1).replaceAll('_', ' ')),
        )).toList(),
      );
}
