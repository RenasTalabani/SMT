import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../core/network/api_client.dart';
import '../../models/user_model.dart';
import '../../widgets/gym_avatar.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_shimmer.dart';

// ---------------------------------------------------------------------------
// Local provider for the coach's clients list
// ---------------------------------------------------------------------------

class _ClientsState {
  final List<UserModel> clients;
  final bool isLoading;
  final String? error;

  const _ClientsState({
    this.clients = const [],
    this.isLoading = false,
    this.error,
  });

  _ClientsState copyWith({
    List<UserModel>? clients,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return _ClientsState(
      clients: clients ?? this.clients,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class _ClientsNotifier extends StateNotifier<_ClientsState> {
  final ApiClient _api;
  final String coachId;

  _ClientsNotifier(this._api, this.coachId) : super(const _ClientsState());

  Future<void> fetchClients() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _api.get('/users/$coachId/clients');
      final data = response.data['data'];

      List<dynamic> rawList;
      if (data is List) {
        rawList = data;
      } else if (data is Map) {
        rawList = (data['clients'] ?? data['users'] ?? data['items'] ?? [])
            as List;
      } else {
        rawList = [];
      }

      final clients = rawList
          .map((e) => UserModel.fromJson(e as Map<String, dynamic>))
          .toList();

      state = state.copyWith(isLoading: false, clients: clients);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ApiClient.extractError(e),
      );
    }
  }
}

// Provider is created per-screen using a family, keyed on coachId
final _clientsProvider = StateNotifierProvider.autoDispose
    .family<_ClientsNotifier, _ClientsState, String>(
  (ref, coachId) => _ClientsNotifier(ApiClient(), coachId),
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class ClientsScreen extends ConsumerStatefulWidget {
  const ClientsScreen({super.key});

  @override
  ConsumerState<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends ConsumerState<ClientsScreen> {
  static const _primaryBlue = Color(0xFF26BDB8);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final id = ref.read(currentUserProvider)?.id ?? '';
      if (id.isNotEmpty) {
        ref.read(_clientsProvider(id).notifier).fetchClients();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final coachId = ref.watch(currentUserProvider.select((u) => u?.id ?? ''));
    final state = ref.watch(_clientsProvider(coachId));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'my_clients'.tr(),
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      body: RefreshIndicator(
        color: _primaryBlue,
        onRefresh: () async {
          if (coachId.isNotEmpty) {
            await ref
                .read(_clientsProvider(coachId).notifier)
                .fetchClients();
          }
        },
        child: _buildBody(state, coachId),
      ),
    );
  }

  Widget _buildBody(_ClientsState state, String coachId) {
    if (state.isLoading && state.clients.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: LoadingShimmer(count: 6, height: 84),
      );
    }

    if (state.error != null && state.clients.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded,
                  size: 48, color: Color(0xFFEF4444)),
              const SizedBox(height: 12),
              Text(
                state.error!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF475569),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref
                    .read(_clientsProvider(coachId).notifier)
                    .fetchClients(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF26BDB8),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: Text('retry'.tr()),
              ),
            ],
          ),
        ),
      );
    }

    if (state.clients.isEmpty) {
      return EmptyState(
        icon: Icons.people_outline_rounded,
        title: 'no_clients_yet'.tr(),
        subtitle:
            'once_clients_are_assigned_to_you'.tr(),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: state.clients.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final client = state.clients[index];
        return _ClientCard(client: client);
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Client card
// ---------------------------------------------------------------------------

class _ClientCard extends StatelessWidget {
  const _ClientCard({required this.client});
  final UserModel client;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
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
          GymAvatar(
            imageUrl: client.avatar,
            initials: client.initials,
            size: 48,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  client.name,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0F172A),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Text(
                  client.email,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _ActionButton(
                label: 'chat'.tr(),
                icon: Icons.chat_bubble_outline_rounded,
                color: const Color(0xFF26BDB8),
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('chat_coming_soon'.tr()),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
              ),
              const SizedBox(height: 6),
              _ActionButton(
                label: 'nav_progress'.tr(),
                icon: Icons.bar_chart_rounded,
                color: const Color(0xFF10B981),
                onTap: () {
                  // Placeholder
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('progress_view_coming_soon'.tr()),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
