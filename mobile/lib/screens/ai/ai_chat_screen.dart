import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../providers/ai_provider.dart';
import '../../widgets/auth_guard_modal.dart';

const _teal = Color(0xFF26BDB8);

class AiChatScreen extends ConsumerStatefulWidget {
  const AiChatScreen({super.key});

  @override
  ConsumerState<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends ConsumerState<AiChatScreen> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final allowed = await AuthGuard.check(context, ref, feature: 'ai_chat');
      if (!mounted) return;
      if (!allowed) { context.go('/client'); return; }
      ref.read(aiChatProvider.notifier).loadHistory();
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _confirmClear(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Clear Chat'),
        content: const Text('Delete all chat history with AI Coach?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: const Color(0xFFEF4444)),
            child: const Text('Clear'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(aiChatProvider.notifier).clearHistory();
    }
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    _ctrl.clear();
    await ref.read(aiChatProvider.notifier).sendMessage(text);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(aiChatProvider);

    ref.listen(aiChatProvider, (_, next) {
      if (!next.isTyping) _scrollToBottom();
    });

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: _teal,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Row(children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.smart_toy_rounded, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('AI Coach', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              Text(
                state.isLoadingHistory ? 'Loading history...' : 'Always here to help',
                style: const TextStyle(fontSize: 11, color: Colors.white70),
              ),
            ],
          ),
        ]),
        actions: [
          if (state.messages.length > 1)
            IconButton(
              icon: const Icon(Icons.delete_outline_rounded, size: 22),
              tooltip: 'Clear chat',
              onPressed: () => _confirmClear(context),
            ),
        ],
      ),
      body: Column(children: [
        // Messages list
        Expanded(
          child: ListView.builder(
            controller: _scroll,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
            itemCount: state.messages.length + (state.isTyping ? 1 : 0),
            itemBuilder: (context, i) {
              if (i == state.messages.length && state.isTyping) {
                return _TypingBubble();
              }
              final msg = state.messages[i];
              return _MessageBubble(message: msg);
            },
          ),
        ),

        // Error banner
        if (state.error != null)
          Container(
            width: double.infinity,
            color: const Color(0xFFFEF2F2),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(children: [
              const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 16),
              const SizedBox(width: 6),
              Expanded(child: Text(state.error!, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13))),
              GestureDetector(
                onTap: () => ref.read(aiChatProvider.notifier).clearError(),
                child: const Icon(Icons.close_rounded, color: Color(0xFFEF4444), size: 16),
              ),
            ]),
          ),

        // Quick suggestion chips
        if (state.messages.length <= 1)
          _QuickSuggestions(onTap: (s) {
            _ctrl.text = s;
            _send();
          }),

        // Input bar
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(12, 8, 8, 12),
          child: SafeArea(
            top: false,
            child: Row(children: [
              Expanded(
                child: TextField(
                  controller: _ctrl,
                  maxLines: 4,
                  minLines: 1,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _send(),
                  decoration: InputDecoration(
                    hintText: 'Ask your AI coach...',
                    hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: state.isTyping ? null : _send,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 46, height: 46,
                  decoration: BoxDecoration(
                    color: state.isTyping ? const Color(0xFFCBD5E1) : _teal,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                ),
              ),
            ]),
          ),
        ),
      ]),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;
    final timeStr = message.time.year > 2020
        ? DateFormat('h:mm a').format(message.time)
        : '';

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Container(
              width: 28, height: 28,
              decoration: const BoxDecoration(color: _teal, shape: BoxShape.circle),
              child: const Icon(Icons.smart_toy_rounded, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 6),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isUser ? _teal : Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isUser ? 16 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 16),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.06),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Text(
                    message.text,
                    style: TextStyle(
                      color: isUser ? Colors.white : const Color(0xFF1E293B),
                      fontSize: 14.5,
                      height: 1.4,
                    ),
                  ),
                ),
                if (timeStr.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 3),
                    child: Text(timeStr, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10)),
                  ),
              ],
            ),
          ),
          if (isUser) const SizedBox(width: 6),
        ],
      ),
    );
  }
}

class _TypingBubble extends StatefulWidget {
  @override
  State<_TypingBubble> createState() => _TypingBubbleState();
}

class _TypingBubbleState extends State<_TypingBubble>
    with SingleTickerProviderStateMixin {
  late AnimationController _anim;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat();
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
        Container(
          width: 28, height: 28,
          decoration: const BoxDecoration(color: _teal, shape: BoxShape.circle),
          child: const Icon(Icons.smart_toy_rounded, color: Colors.white, size: 16),
        ),
        const SizedBox(width: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(16), topRight: Radius.circular(16),
              bottomLeft: Radius.circular(4), bottomRight: Radius.circular(16),
            ),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 4)],
          ),
          child: AnimatedBuilder(
            animation: _anim,
            builder: (_, __) => Row(mainAxisSize: MainAxisSize.min, children: [
              _dot(0),
              const SizedBox(width: 4),
              _dot(0.3),
              const SizedBox(width: 4),
              _dot(0.6),
            ]),
          ),
        ),
      ]),
    );
  }

  Widget _dot(double delay) {
    final val = ((_anim.value - delay) % 1.0).clamp(0.0, 1.0);
    final opacity = val < 0.5 ? val * 2 : (1 - val) * 2;
    return Container(
      width: 8, height: 8,
      decoration: BoxDecoration(
        color: _teal.withValues(alpha: 0.3 + opacity * 0.7),
        shape: BoxShape.circle,
      ),
    );
  }
}

class _QuickSuggestions extends StatelessWidget {
  final ValueChanged<String> onTap;
  const _QuickSuggestions({required this.onTap});

  static const _suggestions = [
    'Give me a chest workout',
    'How much protein do I need?',
    'Best exercises for weight loss',
    'How to improve my squat form?',
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 4),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: _suggestions.map((s) => Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => onTap(s),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: _teal.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: _teal.withValues(alpha: 0.3)),
                ),
                child: Text(s, style: const TextStyle(color: _teal, fontSize: 12, fontWeight: FontWeight.w500)),
              ),
            ),
          )).toList(),
        ),
      ),
    );
  }
}
