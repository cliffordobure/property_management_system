import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/tenant_not_linked_placeholder.dart';

class TenantInvoicesScreen extends StatefulWidget {
  const TenantInvoicesScreen({super.key});

  @override
  State<TenantInvoicesScreen> createState() => _TenantInvoicesScreenState();
}

class _TenantInvoicesScreenState extends State<TenantInvoicesScreen> {
  List<dynamic> _list = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiService().get('/invoices');
      if (!mounted) return;
      if (res.statusCode == 200) {
        final data = res.body;
        final decoded = _decodeList(data);
        setState(() {
          _list = decoded;
          _loading = false;
          _error = null;
        });
      } else {
        setState(() {
          _loading = false;
          _error = ApiService.parseErrorMessage(res.body) ?? 'Failed to load invoices';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  List<dynamic> _decodeList(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is List) return decoded;
      return [];
    } catch (_) {
      return [];
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      if (TenantNotLinkedPlaceholder.isNotLinkedError(_error)) {
        return TenantNotLinkedPlaceholder(
          userEmail: context.read<AuthProvider>().user?.email,
          onRefresh: _load,
          onLogout: () async {
            if (!context.mounted) return;
            await context.read<AuthProvider>().logout();
          },
        );
      }
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.error)),
              const SizedBox(height: 16),
              FilledButton(onPressed: _load, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }
    if (_list.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.receipt_long_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text('No invoices yet', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.onSurfaceVariant)),
            const SizedBox(height: 8),
            TextButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Refresh')),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _list.length,
        itemBuilder: (context, i) {
          final inv = _list[i] as Map<String, dynamic>;
          final number = inv['invoiceNumber']?.toString() ?? '—';
          final total = _num(inv['total']);
          final status = inv['status']?.toString() ?? '—';
          final date = inv['invoiceDate'] != null ? _formatDate(inv['invoiceDate']) : '—';
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              title: Text('Invoice $number'),
              subtitle: Text('$date · ${_formatMoney(total)} · $status'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => _showInvoiceDetail(inv),
            ),
          );
        },
      ),
    );
  }

  void _showInvoiceDetail(Map<String, dynamic> inv) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        expand: false,
        builder: (ctx, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Invoice ${inv['invoiceNumber'] ?? '—'}', style: Theme.of(ctx).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text('Date: ${_formatDate(inv['invoiceDate'])}'),
              Text('Status: ${inv['status'] ?? '—'}'),
              Text('Total: ${_formatMoney(_num(inv['total']))}'),
              if (inv['items'] is List) ...[
                const SizedBox(height: 16),
                const Text('Items', style: TextStyle(fontWeight: FontWeight.bold)),
                ...((inv['items'] as List).map((e) {
                  final m = e is Map ? e : {};
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(m['itemName']?.toString() ?? '—'),
                        Text(_formatMoney(_num(m['amount']))),
                      ],
                    ),
                  );
                })),
              ],
            ],
          ),
        ),
      ),
    );
  }

  num _num(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v;
    if (v is String) return num.tryParse(v) ?? 0;
    return 0;
  }

  String _formatDate(dynamic v) {
    if (v == null) return '—';
    try {
      if (v is String) return DateFormat.yMMMd().format(DateTime.parse(v));
      return '—';
    } catch (_) {
      return '—';
    }
  }

  String _formatMoney(num n) => NumberFormat.currency(symbol: 'KES ', decimalDigits: 0).format(n);
}
