import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import 'property_detail_screen.dart';

class LandlordPropertiesScreen extends StatefulWidget {
  const LandlordPropertiesScreen({super.key});

  @override
  State<LandlordPropertiesScreen> createState() => _LandlordPropertiesScreenState();
}

class _LandlordPropertiesScreenState extends State<LandlordPropertiesScreen> {
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
      final res = await ApiService().get('/properties');
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
          _error = ApiService.parseErrorMessage(res.body) ?? 'Failed to load properties';
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
            Icon(Icons.apartment_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text('No properties', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.onSurfaceVariant)),
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
          final id = p['_id']?.toString();
          final name = p['propertyName']?.toString() ?? 'Property';
          final city = p['city']?.toString();
          final location = p['location']?.toString();
          final verified = p['isVerified'] == true;
          final numUnits = p['numberOfUnits'] is num ? (p['numberOfUnits'] as num).toInt() : null;
          final subtitle = [if (city != null && city.isNotEmpty) city, if (location != null && location.isNotEmpty) location]
              .join(' · ');
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              title: Text(name),
              subtitle: Text(subtitle.isEmpty ? (numUnits != null ? '$numUnits units' : '') : subtitle),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (verified)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text('Verified', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.green[700])),
                    ),
                  const SizedBox(width: 8),
                  const Icon(Icons.chevron_right, color: AppTheme.onSurfaceVariant),
                ],
              ),
              leading: CircleAvatar(backgroundColor: AppTheme.primary.withValues(alpha: 0.2), child: const Icon(Icons.apartment, color: AppTheme.primary)),
              onTap: id != null
                  ? () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => PropertyDetailScreen(propertyId: id),
                        ),
                      )
                  : null,
            ),
          );
        },
      ),
    );
  }
}
