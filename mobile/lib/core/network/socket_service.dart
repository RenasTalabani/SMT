import 'package:socket_io_client/socket_io_client.dart' as io;
import '../constants/api_constants.dart';
import '../storage/secure_storage.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect() async {
    if (isConnected) return;
    final token = await SecureStorage.getAccessToken();
    if (token == null) return;

    _socket = io.io(
      ApiConstants.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(5)
          .setReconnectionDelay(2000)
          .build(),
    );

    _socket!.onConnect((_) {
      _socket!.emit('user_online');
    });

    _socket!.onDisconnect((_) {});
    _socket!.onError((e) {});
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  void emit(String event, [dynamic data]) => _socket?.emit(event, data);

  void on(String event, Function(dynamic) handler) =>
      _socket?.on(event, handler);

  void off(String event, [Function(dynamic)? handler]) =>
      _socket?.off(event, handler);

  // Chat helpers
  void joinConversation(String conversationId) =>
      emit('join_conversation', {'conversationId': conversationId});

  void leaveConversation(String conversationId) =>
      emit('leave_conversation', {'conversationId': conversationId});

  void sendConversationMessage({
    required String conversationId,
    required String content,
    String messageType = 'text',
  }) =>
      emit('send_conversation_message', {
        'conversationId': conversationId,
        'content': content,
        'messageType': messageType,
        'attachments': [],
      });

  void typingStart(String conversationId) =>
      emit('typing_start_conversation', {'conversationId': conversationId});

  void typingStop(String conversationId) =>
      emit('typing_stop_conversation', {'conversationId': conversationId});

  void markConversationRead(String conversationId) =>
      emit('mark_conversation_read', {'conversationId': conversationId});
}
