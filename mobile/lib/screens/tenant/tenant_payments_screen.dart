import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/tenant_not_linked_placeholder.dart';

class TenantPaymentsScreen extends StatefulWidget {
  const TenantPaymentsScreen({super.key});

  @override
  State<TenantPaymentsScreen> createState() => _TenantPaymentsScreenState();
}

class _TenantPaymentsScreenState extends State<TenantPaymentsScreen> {
  List<dynamic> _list = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await ApiService().get('/payments');
      if (!mounted) return;
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        setState(() {
          _list = decoded is List ? decoded : [];
          _loading = false;
          _error = null;
        });
      } else {
        setState(() {
          _loading = false;
          _error = ApiService.parseErrorMessage(res.body) ?? 'Failed to load payments';
        });
      }
    } catch (e) {
      if (mounted) setState(() {
        _loading = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
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

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
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
            Icon(Icons.payment_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text('No payments yet', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.onSurfaceVariant)),
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
          final p = _list[i] as Map<String, dynamic>;
          final amount = _num(p['amount']);
          final method = p['paymentMethod']?.toString() ?? '—';
          final status = p['status']?.toString() ?? '—';
          final date = _formatDate(p['paymentDate']);
          final inv = p['invoiceId'];
          final invNum = inv is Map ? inv['invoiceNumber']?.toString() : null;
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              title: Text(_formatMoney(amount)),
              subtitle: Text('$date · $method · $status${invNum != null ? ' · Inv. $invNum' : ''}'),
              leading: CircleAvatar(backgroundColor: AppTheme.primary.withValues(alpha: 0.2), child: const Icon(Icons.payment, color: AppTheme.primary)),
            ),
          );
        },
      ),
    );
  }
}
