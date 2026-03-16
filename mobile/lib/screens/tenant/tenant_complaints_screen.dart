import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/tenant_not_linked_placeholder.dart';

class TenantComplaintsScreen extends StatefulWidget {
  const TenantComplaintsScreen({super.key});

  @override
  State<TenantComplaintsScreen> createState() => _TenantComplaintsScreenState();
}

class _TenantComplaintsScreenState extends State<TenantComplaintsScreen> {
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
      final res = await ApiService().get('/complaints');
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
          _error = ApiService.parseErrorMessage(res.body) ?? 'Failed to load complaints';
        });
      }
    } catch (e) {
      if (mounted) setState(() {
        _loading = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
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
            Icon(Icons.report_problem_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text('No complaints', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.onSurfaceVariant)),
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
          final c = _list[i] as Map<String, dynamic>;
          final subject = c['subject']?.toString() ?? c['description']?.toString() ?? 'Complaint';
          final status = c['status']?.toString() ?? '—';
          final date = _formatDate(c['submittedDate']);
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              title: Text(subject.length > 60 ? '${subject.substring(0, 60)}...' : subject),
              subtitle: Text('$date · $status'),
              leading: const CircleAvatar(child: Icon(Icons.report_problem_outlined)),
            ),
          );
        },
      ),
    );
  }
}
