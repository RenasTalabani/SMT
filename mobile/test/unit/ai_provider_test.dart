import 'package:flutter_test/flutter_test.dart';
import 'package:citygym/providers/ai_provider.dart';

void main() {
  group('ChatMessage', () {
    test('stores text, isUser and time', () {
      final now = DateTime.now();
      final msg = ChatMessage(text: 'Hello', isUser: true, time: now);
      expect(msg.text, 'Hello');
      expect(msg.isUser, true);
      expect(msg.time, now);
    });
  });

  group('AiChatState', () {
    test('default state has no messages, not typing, no error', () {
      const state = AiChatState();
      expect(state.messages, isEmpty);
      expect(state.isTyping, false);
      expect(state.error, isNull);
    });

    test('copyWith updates messages', () {
      const state = AiChatState();
      final msg = ChatMessage(text: 'Hi', isUser: true, time: DateTime.now());
      final next = state.copyWith(messages: [msg]);
      expect(next.messages.length, 1);
      expect(next.messages.first.text, 'Hi');
      // originals untouched
      expect(state.messages, isEmpty);
    });

    test('copyWith updates isTyping', () {
      const state = AiChatState();
      final next = state.copyWith(isTyping: true);
      expect(next.isTyping, true);
      expect(state.isTyping, false);
    });

    test('copyWith clears error when not provided', () {
      const state = AiChatState(error: 'oops');
      final next = state.copyWith(isTyping: false);
      // error field is nullable and resets to null when not passed
      expect(next.error, isNull);
    });

    test('copyWith sets error', () {
      const state = AiChatState();
      final next = state.copyWith(error: 'network error');
      expect(next.error, 'network error');
    });

    test('copyWith preserves unchanged fields', () {
      final msg = ChatMessage(text: 'Hi', isUser: false, time: DateTime.now());
      final state = AiChatState(messages: [msg], isTyping: true);
      final next = state.copyWith(error: 'err');
      expect(next.messages.length, 1);
      expect(next.isTyping, true);
    });
  });

  group('AiChatNotifier initial state', () {
    test('starts with one welcome message from AI', () {
      final notifier = AiChatNotifier();
      expect(notifier.state.messages.length, 1);
      expect(notifier.state.messages.first.isUser, false);
      expect(notifier.state.messages.first.text, contains('AI Coach'));
      expect(notifier.state.isTyping, false);
      expect(notifier.state.error, isNull);
    });

    test('clearError removes error without affecting messages', () {
      final notifier = AiChatNotifier();
      // Manually inject error state
      notifier.state = notifier.state.copyWith(error: 'some error');
      expect(notifier.state.error, 'some error');

      notifier.clearError();
      expect(notifier.state.error, isNull);
      expect(notifier.state.messages.length, 1); // welcome message preserved
    });
  });
}
