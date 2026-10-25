import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';

/// Gym shop — order supplements / drinks / gear, pay & collect at reception.
/// Backed by /shop/products, /shop/orders, /shop/orders/my.
class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _orders = [];
  final Map<String, int> _cart = {};
  bool _loading = true;
  bool _ordering = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final p = await ApiClient().get('/shop/products');
      final o = await ApiClient().get('/shop/orders/my');
      _products = List<Map<String, dynamic>>.from(p.data['data']['products'] as List);
      _orders = List<Map<String, dynamic>>.from(o.data['data']['orders'] as List);
      _error = null;
    } catch (e) {
      _error = ApiClient.extractError(e);
    }
    if (mounted) setState(() => _loading = false);
  }

  String _money(num n) {
    final s = n.round().toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ',');
    return '$s IQD';
  }

  num get _total => _cart.entries.fold<num>(0, (sum, e) {
        final p = _products.firstWhere((x) => x['_id'] == e.key, orElse: () => {});
        return sum + ((p['price'] ?? 0) as num) * e.value;
      });

  Future<void> _order() async {
    setState(() => _ordering = true);
    try {
      await ApiClient().post('/shop/orders', data: {
        'items': _cart.entries.where((e) => e.value > 0).map((e) => {'productId': e.key, 'quantity': e.value}).toList(),
      });
      _cart.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('order_placed_pay_and_collect_at'.tr())));
      }
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiClient.extractError(e))));
      }
    }
    if (mounted) setState(() => _ordering = false);
  }

  IconData _icon(String cat) => switch (cat) {
        'supplement' => Icons.fitness_center,
        'drink' => Icons.local_drink_outlined,
        'membership' => Icons.card_membership_outlined,
        _ => Icons.shopping_bag_outlined,
      };

  @override
  Widget build(BuildContext context) {
    final count = _cart.values.fold<int>(0, (a, b) => a + b);
    return Scaffold(
      appBar: AppBar(title: Text('city_gym_shop'.tr())),
      bottomNavigationBar: count == 0
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: FilledButton(
                  onPressed: _ordering ? null : _order,
                  child: Text(_ordering ? 'ordering'.tr() : 'place_order_x_items_x'.tr(namedArgs: {'count': '$count', 'n0': _money(_total)})),
                ),
              ),
            ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
                  Text('pay_and_collect_at_reception'.tr(), style: const TextStyle(color: Color(0xFF64748B))),
                  const SizedBox(height: 8),
                  ..._products.map((p) {
                    final id = p['_id'] as String;
                    final stock = (p['stock'] ?? 0) as int;
                    final q = _cart[id] ?? 0;
                    return Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: Color(0xFFE2E8F0))),
                      child: ListTile(
                        leading: CircleAvatar(backgroundColor: const Color(0xFFFFEDD5), child: Icon(_icon(p['category'] ?? ''), color: const Color(0xFFEA580C))),
                        title: Text(p['name'] ?? ''),
                        subtitle: Text('${_money(p['price'] ?? 0)} · ${stock > 0 ? 'x_left'.tr(namedArgs: {'stock': '$stock'}) : 'out_of_stock'.tr()}'),
                        trailing: q == 0
                            ? TextButton(onPressed: stock > 0 ? () => setState(() => _cart[id] = 1) : null, child: Text('add'.tr()))
                            : Row(mainAxisSize: MainAxisSize.min, children: [
                                IconButton(icon: const Icon(Icons.remove_circle_outline), onPressed: () => setState(() => _cart[id] = q - 1)),
                                Text('$q'),
                                IconButton(icon: const Icon(Icons.add_circle_outline), onPressed: q < stock ? () => setState(() => _cart[id] = q + 1) : null),
                              ]),
                      ),
                    );
                  }),
                  if (_orders.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text('my_orders'.tr(), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    ..._orders.take(10).map((o) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(((o['items'] ?? []) as List).map((i) => '${i['quantity']}× ${i['name']}').join(', ')),
                          subtitle: Text(_money(o['total'] ?? 0)),
                          trailing: Chip(label: Text('${o['status']}')),
                        )),
                  ],
                ],
              ),
            ),
    );
  }
}
