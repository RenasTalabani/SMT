import '../core/i18n/trv.dart';
class BodyPartModel {
  final String id;
  final String partId;
  final String name;
  final String? nameAr;
  final String? nameKu;
  final String type; // muscle | joint | artery | nerve | organ
  final String? region; // upper_body | lower_body | core | head_neck | full_body
  final String? side;
  final String? description;
  final String? function;
  final String? origin;
  final String? insertion;
  final String? innervation;
  final List<String> relatedExercises;
  final List<String> antagonistMuscles;
  final List<String> synergistMuscles;
  final List<String> injuryRisks;
  final List<String> symptoms;
  final List<String> recoveryTips;
  final List<String> warmUpTips;
  final String? videoUrl;
  final String? imageUrl;

  const BodyPartModel({
    required this.id,
    required this.partId,
    required this.name,
    this.nameAr,
    this.nameKu,
    required this.type,
    this.region,
    this.side,
    this.description,
    this.function,
    this.origin,
    this.insertion,
    this.innervation,
    this.relatedExercises = const [],
    this.antagonistMuscles = const [],
    this.synergistMuscles = const [],
    this.injuryRisks = const [],
    this.symptoms = const [],
    this.recoveryTips = const [],
    this.warmUpTips = const [],
    this.videoUrl,
    this.imageUrl,
  });

  factory BodyPartModel.fromJson(Map<String, dynamic> j) => BodyPartModel(
        id: j['_id'] ?? j['id'] ?? '',
        partId: j['partId'] ?? '',
        name: j['name'] ?? '',
        nameAr: j['nameAr'],
        nameKu: j['nameKu'],
        type: j['type'] ?? 'muscle',
        region: j['region'],
        side: j['side'],
        description: j['description'],
        function: j['function'],
        origin: j['origin'],
        insertion: j['insertion'],
        innervation: j['innervation'],
        relatedExercises: _list(j['relatedExercises']),
        antagonistMuscles: _list(j['antagonistMuscles']),
        synergistMuscles: _list(j['synergistMuscles']),
        injuryRisks: _list(j['injuryRisks']),
        symptoms: _list(j['symptoms']),
        recoveryTips: _list(j['recoveryTips']),
        warmUpTips: _list(j['warmUpTips']),
        videoUrl: j['videoUrl'],
        imageUrl: j['imageUrl'],
      );

  static List<String> _list(dynamic v) =>
      v == null ? [] : (v as List).map((e) => e.toString()).toList();

  String get typeLabel {
    switch (type) {
      case 'muscle': return trv('Muscle');
      case 'joint':  return trv('Joint');
      case 'artery': return trv('Artery');
      case 'nerve':  return trv('Nerve');
      case 'organ':  return trv('Organ');
      default:       return type;
    }
  }

  String get regionLabel {
    switch (region) {
      case 'upper_body': return trv('Upper Body');
      case 'lower_body': return trv('Lower Body');
      case 'core':       return trv('Core');
      case 'head_neck':  return trv('Head & Neck');
      case 'full_body':  return trv('Full Body');
      default:           return region ?? '';
    }
  }
}
