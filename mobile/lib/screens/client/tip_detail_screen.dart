import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/tip_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/network/api_client.dart';
import '../../models/tip_model.dart';
import '../../widgets/gym_avatar.dart';
import '../../widgets/error_view.dart';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class TipDetailScreen extends ConsumerStatefulWidget {
  const TipDetailScreen({super.key, required this.tipId});

  final String tipId;

  @override
  ConsumerState<TipDetailScreen> createState() => _TipDetailScreenState();
}

class _TipDetailScreenState extends ConsumerState<TipDetailScreen> {
  TipModel? _tip;
  List<CommentModel> _comments = [];
  bool _loadingTip = true;
  bool _loadingComments = false;
  bool _postingComment = false;
  String? _tipError;

  final TextEditingController _commentController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadTip();
    _loadComments();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadTip() async {
    setState(() {
      _loadingTip = true;
      _tipError = null;
    });
    try {
      final response = await ApiClient().get('/tips/${widget.tipId}');
      final data = response.data['data'];
      final tipJson = data is Map ? (data['tip'] ?? data) : data;
      final tip = TipModel.fromJson(tipJson as Map<String, dynamic>);
      setState(() {
        _tip = tip;
        _loadingTip = false;
      });
    } catch (e) {
      setState(() {
        _tipError = ApiClient.extractError(e);
        _loadingTip = false;
      });
    }
  }

  Future<void> _loadComments() async {
    setState(() => _loadingComments = true);
    try {
      final response =
          await ApiClient().get('/tips/${widget.tipId}/comments');
      final data = response.data['data'];
      List<dynamic> rawList;
      if (data is List) {
        rawList = data;
      } else if (data is Map) {
        rawList =
            (data['comments'] ?? data['items'] ?? []) as List;
      } else {
        rawList = [];
      }
      final comments = rawList
          .map((e) =>
              CommentModel.fromJson(e as Map<String, dynamic>))
          .toList();
      setState(() {
        _comments = comments;
        _loadingComments = false;
      });
    } catch (_) {
      setState(() => _loadingComments = false);
    }
  }

  Future<void> _postComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    setState(() => _postingComment = true);
    try {
      final response = await ApiClient().post(
        '/tips/${widget.tipId}/comments',
        data: {'content': text},
      );
      final data = response.data['data'];
      final commentJson =
          data is Map ? (data['comment'] ?? data) : data;
      final comment =
          CommentModel.fromJson(commentJson as Map<String, dynamic>);
      setState(() {
        _comments = [comment, ..._comments];
        _postingComment = false;
      });
      _commentController.clear();
      if (mounted) FocusScope.of(context).unfocus();
    } catch (e) {
      setState(() => _postingComment = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to post comment: ${ApiClient.extractError(e)}'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  void _toggleLike() {
    if (_tip == null) return;
    ref.read(tipProvider.notifier).toggleLike(widget.tipId);
    // Optimistically update local tip state
    final isNowLiked = !_tip!.isLiked;
    setState(() {
      _tip = TipModel.fromJson({
        '_id': _tip!.id,
        'title': _tip!.title,
        'content': _tip!.content,
        'category': _tip!.category,
        'type': _tip!.type,
        'difficulty': _tip!.difficulty,
        'author': _tip!.author,
        'likesCount':
            _tip!.likesCount + (isNowLiked ? 1 : -1),
        'bookmarksCount': _tip!.bookmarksCount,
        'viewsCount': _tip!.viewsCount,
        'isLiked': isNowLiked,
        'isBookmarked': _tip!.isBookmarked,
        'isPublished': _tip!.isPublished,
        'media': _tip!.media,
        'tags': _tip!.tags,
        if (_tip!.createdAt != null)
          'createdAt': _tip!.createdAt!.toIso8601String(),
      });
    });
  }

  void _toggleBookmark() {
    if (_tip == null) return;
    ref.read(tipProvider.notifier).toggleBookmark(widget.tipId);
    final isNowBookmarked = !_tip!.isBookmarked;
    setState(() {
      _tip = TipModel.fromJson({
        '_id': _tip!.id,
        'title': _tip!.title,
        'content': _tip!.content,
        'category': _tip!.category,
        'type': _tip!.type,
        'difficulty': _tip!.difficulty,
        'author': _tip!.author,
        'likesCount': _tip!.likesCount,
        'bookmarksCount':
            _tip!.bookmarksCount + (isNowBookmarked ? 1 : -1),
        'viewsCount': _tip!.viewsCount,
        'isLiked': _tip!.isLiked,
        'isBookmarked': isNowBookmarked,
        'isPublished': _tip!.isPublished,
        'media': _tip!.media,
        'tags': _tip!.tags,
        if (_tip!.createdAt != null)
          'createdAt': _tip!.createdAt!.toIso8601String(),
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        iconTheme:
            const IconThemeData(color: Color(0xFF475569)),
        title: const Text(
          'Tip',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 18,
            color: Color(0xFF0F172A),
          ),
        ),
        actions: [
          if (_tip != null) ...[
            // Like action
            IconButton(
              onPressed: _toggleLike,
              icon: Icon(
                _tip!.isLiked
                    ? Icons.favorite_rounded
                    : Icons.favorite_outline_rounded,
                color: _tip!.isLiked
                    ? const Color(0xFFEF4444)
                    : const Color(0xFF475569),
              ),
            ),
            // Bookmark action
            IconButton(
              onPressed: _toggleBookmark,
              icon: Icon(
                _tip!.isBookmarked
                    ? Icons.bookmark_rounded
                    : Icons.bookmark_outline_rounded,
                color: _tip!.isBookmarked
                    ? const Color(0xFF26BDB8)
                    : const Color(0xFF475569),
              ),
            ),
          ],
        ],
      ),
      body: _loadingTip
          ? const Center(
              child: CircularProgressIndicator(
                  color: Color(0xFF26BDB8)))
          : _tipError != null
              ? ErrorView(
                  message: _tipError!,
                  onRetry: _loadTip,
                )
              : _tip == null
                  ? const Center(child: Text('Tip not found.'))
                  : Column(
                      children: [
                        Expanded(
                          child: CustomScrollView(
                            controller: _scrollController,
                            slivers: [
                              // Hero image
                              if (_tip!.media.isNotEmpty)
                                SliverToBoxAdapter(
                                  child: _HeroImage(
                                      media: _tip!.media),
                                ),

                              // Main content
                              SliverToBoxAdapter(
                                child: Padding(
                                  padding:
                                      const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      // Chips row
                                      _ChipsRow(tip: _tip!),
                                      const SizedBox(height: 12),

                                      // Title
                                      Text(
                                        _tip!.title,
                                        style: const TextStyle(
                                          fontSize: 22,
                                          fontWeight:
                                              FontWeight.w800,
                                          color: Color(0xFF0F172A),
                                          height: 1.3,
                                        ),
                                      ),
                                      const SizedBox(height: 14),

                                      // Author row
                                      _AuthorRow(tip: _tip!),
                                      const SizedBox(height: 20),

                                      const Divider(
                                          color:
                                              Color(0xFFE2E8F0)),
                                      const SizedBox(height: 16),

                                      // Content body
                                      Text(
                                        _tip!.content,
                                        style: const TextStyle(
                                          fontSize: 15,
                                          color: Color(0xFF334155),
                                          height: 1.7,
                                        ),
                                      ),

                                      // Tags
                                      if (_tip!.tags.isNotEmpty) ...[
                                        const SizedBox(height: 20),
                                        Wrap(
                                          spacing: 6,
                                          runSpacing: 6,
                                          children: _tip!.tags
                                              .map(
                                                (tag) => Container(
                                                  padding:
                                                      const EdgeInsets
                                                          .symmetric(
                                                    horizontal: 10,
                                                    vertical: 4,
                                                  ),
                                                  decoration:
                                                      BoxDecoration(
                                                    color: const Color(
                                                            0xFF64748B)
                                                        .withValues(alpha: 
                                                            0.1),
                                                    borderRadius:
                                                        BorderRadius
                                                            .circular(
                                                                20),
                                                  ),
                                                  child: Text(
                                                    '#$tag',
                                                    style:
                                                        const TextStyle(
                                                      fontSize: 11,
                                                      color: Color(
                                                          0xFF64748B),
                                                      fontWeight:
                                                          FontWeight
                                                              .w600,
                                                    ),
                                                  ),
                                                ),
                                              )
                                              .toList(),
                                        ),
                                      ],

                                      const SizedBox(height: 24),
                                      const Divider(
                                          color:
                                              Color(0xFFE2E8F0)),

                                      // Comments header
                                      Padding(
                                        padding:
                                            const EdgeInsets.symmetric(
                                                vertical: 12),
                                        child: Text(
                                          'Comments (${_comments.length})',
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight:
                                                FontWeight.w700,
                                            color: Color(0xFF0F172A),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),

                              // Comments list
                              if (_loadingComments)
                                const SliverToBoxAdapter(
                                  child: Padding(
                                    padding: EdgeInsets.symmetric(
                                        vertical: 20),
                                    child: Center(
                                      child: CircularProgressIndicator(
                                        color: Color(0xFF26BDB8),
                                      ),
                                    ),
                                  ),
                                )
                              else if (_comments.isEmpty)
                                const SliverToBoxAdapter(
                                  child: Padding(
                                    padding: EdgeInsets.fromLTRB(
                                        16, 0, 16, 24),
                                    child: Center(
                                      child: Text(
                                        'No comments yet. Be the first to comment!',
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: Color(0xFF94A3B8),
                                        ),
                                      ),
                                    ),
                                  ),
                                )
                              else
                                SliverList(
                                  delegate: SliverChildBuilderDelegate(
                                    (context, index) {
                                      if (index ==
                                          _comments.length) {
                                        return const SizedBox(
                                            height: 16);
                                      }
                                      return Padding(
                                        padding:
                                            const EdgeInsets.fromLTRB(
                                                16, 0, 16, 12),
                                        child: _CommentCard(
                                          comment: _comments[index],
                                        ),
                                      );
                                    },
                                    childCount:
                                        _comments.length + 1,
                                  ),
                                ),
                            ],
                          ),
                        ),

                        // Comment input field
                        _CommentInput(
                          controller: _commentController,
                          isPosting: _postingComment,
                          onSend: _postComment,
                        ),
                      ],
                    ),
    );
  }
}

// ---------------------------------------------------------------------------
// Hero image
// ---------------------------------------------------------------------------

class _HeroImage extends StatelessWidget {
  const _HeroImage({required this.media});
  final List<dynamic> media;

  String? get _imageUrl {
    final first = media.first;
    if (first is Map) {
      return first['url'] as String? ?? first['path'] as String?;
    }
    if (first is String) return first;
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final url = _imageUrl;
    if (url == null || url.isEmpty) return const SizedBox.shrink();

    return AspectRatio(
      aspectRatio: 16 / 9,
      child: CachedNetworkImage(
        imageUrl: url,
        fit: BoxFit.cover,
        placeholder: (_, __) => Container(
          color: const Color(0xFFE2E8F0),
          child: const Center(
            child: Icon(Icons.image_rounded,
                color: Color(0xFF94A3B8), size: 40),
          ),
        ),
        errorWidget: (_, __, ___) => Container(
          color: const Color(0xFFE2E8F0),
          child: const Center(
            child: Icon(Icons.broken_image_rounded,
                color: Color(0xFF94A3B8), size: 40),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Chips row
// ---------------------------------------------------------------------------

class _ChipsRow extends StatelessWidget {
  const _ChipsRow({required this.tip});
  final TipModel tip;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        if (tip.category != null)
          _Chip(
              label: tip.category!,
              color: const Color(0xFF26BDB8)),
        if (tip.difficulty != null)
          _Chip(
              label: tip.difficulty!,
              color: const Color(0xFF7C3AED)),
        if (tip.type != null)
          _Chip(
              label: tip.type!,
              color: const Color(0xFFF59E0B)),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Author row
// ---------------------------------------------------------------------------

class _AuthorRow extends StatelessWidget {
  const _AuthorRow({required this.tip});
  final TipModel tip;

  String _timeAgo(DateTime? date) {
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 365) {
      return '${(diff.inDays / 365).floor()}y ago';
    } else if (diff.inDays > 30) {
      return '${(diff.inDays / 30).floor()}mo ago';
    } else if (diff.inDays > 0) {
      return '${diff.inDays}d ago';
    } else if (diff.inHours > 0) {
      return '${diff.inHours}h ago';
    } else if (diff.inMinutes > 0) {
      return '${diff.inMinutes}m ago';
    }
    return 'Just now';
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        GymAvatar(
          imageUrl: tip.authorAvatar,
          initials: tip.authorName.isNotEmpty
              ? tip.authorName[0].toUpperCase()
              : '?',
          size: 40,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                tip.authorName,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0F172A),
                ),
              ),
              if (tip.createdAt != null)
                Text(
                  _timeAgo(tip.createdAt),
                  style: const TextStyle(
                      fontSize: 12, color: Color(0xFF94A3B8)),
                ),
            ],
          ),
        ),
        // Like count
        Row(
          children: [
            Icon(
              tip.isLiked
                  ? Icons.favorite_rounded
                  : Icons.favorite_outline_rounded,
              size: 16,
              color: tip.isLiked
                  ? const Color(0xFFEF4444)
                  : const Color(0xFF94A3B8),
            ),
            const SizedBox(width: 4),
            Text(
              '${tip.likesCount}',
              style: const TextStyle(
                  fontSize: 12, color: Color(0xFF64748B)),
            ),
          ],
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Comment card
// ---------------------------------------------------------------------------

class _CommentCard extends StatelessWidget {
  const _CommentCard({required this.comment});
  final CommentModel comment;

  String _timeAgo(DateTime? date) {
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
    return 'Just now';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GymAvatar(
            imageUrl: comment.userAvatar,
            initials: comment.userName.isNotEmpty
                ? comment.userName[0].toUpperCase()
                : '?',
            size: 32,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment:
                      MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      comment.userName,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    Text(
                      _timeAgo(comment.createdAt),
                      style: const TextStyle(
                          fontSize: 11, color: Color(0xFF94A3B8)),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  comment.content,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF475569),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Comment input
// ---------------------------------------------------------------------------

class _CommentInput extends ConsumerWidget {
  const _CommentInput({
    required this.controller,
    required this.isPosting,
    required this.onSend,
  });

  final TextEditingController controller;
  final bool isPosting;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return Container(
      padding: EdgeInsets.only(
        left: 12,
        right: 12,
        top: 8,
        bottom: MediaQuery.of(context).viewInsets.bottom + 8,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Color(0xFFE2E8F0)),
        ),
      ),
      child: Row(
        children: [
          GymAvatar(
            imageUrl: user?.avatar,
            initials: user?.initials ?? '?',
            size: 34,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: controller,
              decoration: InputDecoration(
                hintText: 'Add a comment...',
                hintStyle:
                    const TextStyle(color: Color(0xFFCBD5E1)),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide:
                      const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide:
                      const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: const BorderSide(
                      color: Color(0xFF26BDB8), width: 1.5),
                ),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 8),
                isDense: true,
              ),
              maxLines: 3,
              minLines: 1,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => onSend(),
            ),
          ),
          const SizedBox(width: 8),
          isPosting
              ? const SizedBox(
                  width: 36,
                  height: 36,
                  child: CircularProgressIndicator(
                    color: Color(0xFF26BDB8),
                    strokeWidth: 2,
                  ),
                )
              : IconButton(
                  onPressed: onSend,
                  icon: const Icon(Icons.send_rounded),
                  style: IconButton.styleFrom(
                    backgroundColor: const Color(0xFF26BDB8),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(36, 36),
                    padding: EdgeInsets.zero,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
        ],
      ),
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}
