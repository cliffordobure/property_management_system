import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class LandlordTenantsScreen extends StatefulWidget {
  const LandlordTenantsScreen({super.key});

  @override
  State<LandlordTenantsScreen> createState() => _LandlordTenantsScreenState();
}

class _LandlordTenantsScreenState extends State<LandlordTenantsScreen> {
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
      final res = await ApiService().get('/tenants');
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
          _error = ApiService.parseErrorMessage(res.body) ?? 'Failed to load tenants';
        });
      }
    } catch (e) {
      if (mounted) setState(() {
        _loading = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
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
            Icon(Icons.people_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text('No tenants', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.onSurfaceVariant)),
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
          final t = _list[i] as Map<String, dynamic>;
          final first = t['firstName']?.toString() ?? '';
          final last = t['lastName']?.toString() ?? '';
          final name = '$first $last'.trim().isEmpty ? (t['email']?.toString() ?? 'Tenant') : '$first $last';
          final email = t['email']?.toString();
          final unit = t['unitId'];
          final unitId = unit is Map ? unit['unitId']?.toString() : null;
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              title: Text(name),
              subtitle: Text([if (email != null) email, if (unitId != null) 'Unit $unitId'].join(' · ')),
              leading: CircleAvatar(backgroundColor: AppTheme.secondary.withValues(alpha: 0.2), child: Text(name.substring(0, 1).toUpperCase(), style: const TextStyle(color: AppTheme.secondary, fontWeight: FontWeight.bold))),
            ),
          );
        },
      ),
    );
  }
}
