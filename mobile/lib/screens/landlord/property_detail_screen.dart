import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class PropertyDetailScreen extends StatefulWidget {
  final String propertyId;

  const PropertyDetailScreen({super.key, required this.propertyId});

  @override
  State<PropertyDetailScreen> createState() => _PropertyDetailScreenState();
}

class _PropertyDetailScreenState extends State<PropertyDetailScreen> {
  Map<String, dynamic>? _property;
  List<dynamic> _units = [];
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
      final resProp = await ApiService().get('/properties/${widget.propertyId}');
      if (!mounted) return;
      if (resProp.statusCode != 200) {
        setState(() {
          _loading = false;
          _error = ApiService.parseErrorMessage(resProp.body) ?? 'Property not found';
        });
        return;
      }
      _property = jsonDecode(resProp.body) as Map<String, dynamic>;

      final resUnits = await ApiService().get('/units', queryParams: {'propertyId': widget.propertyId});
      if (!mounted) return;
      if (resUnits.statusCode == 200) {
        final decoded = jsonDecode(resUnits.body);
        _units = decoded is List ? decoded : [];
      }
      setState(() { _loading = false; _error = null; });
    } catch (e) {
      if (mounted) setState(() {
        _loading = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  String _formatMoney(num? n) {
    if (n == null) return '—';
    return NumberFormat.currency(symbol: 'KES ', decimalDigits: 0).format(n);
  }

  String _address(Map<String, dynamic>? p) {
    if (p == null) return '—';
    final parts = <String>[];
    if (p['streetName']?.toString().trim().isNotEmpty == true) parts.add(p['streetName'].toString().trim());
    if (p['location']?.toString().trim().isNotEmpty == true) parts.add(p['location'].toString().trim());
    if (p['city']?.toString().trim().isNotEmpty == true) parts.add(p['city'].toString().trim());
    if (p['country']?.toString().trim().isNotEmpty == true) parts.add(p['country'].toString().trim());
    return parts.isEmpty ? '—' : parts.join(', ');
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Property'), backgroundColor: AppTheme.primary, foregroundColor: Colors.white),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null || _property == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Property'), backgroundColor: AppTheme.primary, foregroundColor: Colors.white),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.error_outline, size: 48, color: Colors.grey[600]),
                const SizedBox(height: 16),
                Text(_error ?? 'Failed to load', textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.error)),
                const SizedBox(height: 16),
                FilledButton(onPressed: _load, child: const Text('Retry')),
              ],
            ),
          ),
        ),
      );
    }

    final p = _property!;
    final name = p['propertyName']?.toString() ?? 'Property';
    final verified = p['isVerified'] == true;
    final numUnits = p['numberOfUnits'] is int ? p['numberOfUnits'] as int : (p['numberOfUnits'] is num ? (p['numberOfUnits'] as num).toInt() : _units.length);

    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text('Property details'),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _PropertyHeaderCard(
                name: name,
                address: _address(p),
                verified: verified,
                numberOfUnits: numUnits,
              ),
              const SizedBox(height: 16),
              _SectionTitle(icon: Icons.info_outline, title: 'Overview'),
              const SizedBox(height: 8),
              _OverviewCard(property: p, formatMoney: _formatMoney),
              const SizedBox(height: 20),
              _SectionTitle(icon: Icons.meeting_room_outlined, title: 'Units (${_units.length})'),
              const SizedBox(height: 8),
              if (_units.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.meeting_room_outlined, size: 48, color: Colors.grey[400]),
                          const SizedBox(height: 12),
                          Text('No units added yet', style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppTheme.onSurfaceVariant)),
                        ],
                      ),
                    ),
                  ),
                )
              else
                ..._units.map((u) => _UnitCard(unit: u as Map<String, dynamic>, formatMoney: _formatMoney)),
            ],
          ),
        ),
      ),
    );
  }
}

class _PropertyHeaderCard extends StatelessWidget {
  final String name;
  final String address;
  final bool verified;
  final int numberOfUnits;

  const _PropertyHeaderCard({
    required this.name,
    required this.address,
    required this.verified,
    required this.numberOfUnits,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shadowColor: Colors.black26,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.apartment, size: 28, color: AppTheme.primary),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      if (verified)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.green.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.verified, size: 16, color: Colors.green[700]),
                              const SizedBox(width: 4),
                              Text('Verified', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.green[700])),
                            ],
                          ),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.orange.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text('Pending verification', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.orange[800])),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.location_on_outlined, size: 20, color: AppTheme.onSurfaceVariant),
                const SizedBox(width: 8),
                Expanded(child: Text(address, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.onSurfaceVariant))),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.meeting_room_outlined, size: 20, color: AppTheme.onSurfaceVariant),
                const SizedBox(width: 8),
                Text('$numberOfUnits unit${numberOfUnits == 1 ? '' : 's'}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.onSurfaceVariant)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final IconData icon;
  final String title;

  const _SectionTitle({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.primary),
        const SizedBox(width: 8),
        Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600, color: AppTheme.onSurface)),
      ],
    );
  }
}

class _OverviewCard extends StatelessWidget {
  final Map<String, dynamic> property;
  final String Function(num?) formatMoney;

  const _OverviewCard({required this.property, required this.formatMoney});

  @override
  Widget build(BuildContext context) {
    final rows = <_InfoRow>[];

    if (_num(property['waterRate']) > 0) rows.add(_InfoRow('Water rate', formatMoney(_num(property['waterRate']))));
    if (_num(property['electricityRate']) > 0) rows.add(_InfoRow('Electricity rate', formatMoney(_num(property['electricityRate']))));
    if (_num(property['garbageBill']) > 0) rows.add(_InfoRow('Garbage', formatMoney(_num(property['garbageBill']))));
    if (_num(property['managementFee']) > 0) rows.add(_InfoRow('Management fee', formatMoney(_num(property['managementFee']))));
    if (_num(property['rentPaymentPenalty']) > 0) rows.add(_InfoRow('Late payment penalty', formatMoney(_num(property['rentPaymentPenalty']))));

    final paybill = property['mpesaPaybill']?.toString().trim();
    final till = property['mpesaTill']?.toString().trim();
    if ((paybill != null && paybill.isNotEmpty) || (till != null && till.isNotEmpty)) {
      rows.add(_InfoRow('M-Pesa', paybill?.isNotEmpty == true ? 'Paybill: $paybill' : 'Till: ${till ?? "—"}'));
    }

    final company = property['companyName']?.toString().trim();
    if (company != null && company.isNotEmpty) rows.add(_InfoRow('Company', company));

    final notes = property['notes']?.toString().trim();
    if (notes != null && notes.isNotEmpty) rows.add(_InfoRow('Notes', notes));

    final instructions = property['paymentInstructions']?.toString().trim();
    if (instructions != null && instructions.isNotEmpty) rows.add(_InfoRow('Payment instructions', instructions));

    if (rows.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text('No additional details', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.onSurfaceVariant)),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: rows.map((r) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(width: 120, child: Text(r.label, style: TextStyle(color: AppTheme.onSurfaceVariant, fontSize: 14))),
                Expanded(child: Text(r.value, style: const TextStyle(fontSize: 14))),
              ],
            ),
          )).toList(),
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
}

class _InfoRow {
  final String label;
  final String value;
  _InfoRow(this.label, this.value);
}

class _UnitCard extends StatelessWidget {
  final Map<String, dynamic> unit;
  final String Function(num?) formatMoney;

  const _UnitCard({required this.unit, required this.formatMoney});

  @override
  Widget build(BuildContext context) {
    final unitId = unit['unitId']?.toString() ?? '—';
    final rent = unit['rentAmount'];
    final rentNum = rent is num ? rent : (rent is String ? num.tryParse(rent) : null);
    final occupied = unit['isOccupied'] == true;
    final notes = unit['notes']?.toString().trim();

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {},
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: (occupied ? Colors.orange : Colors.green).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    unitId.length > 2 ? unitId.substring(0, 2).toUpperCase() : unitId,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: occupied ? Colors.orange[800] : Colors.green[800]),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Unit $unitId', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                    const SizedBox(height: 2),
                    Text(formatMoney(rentNum ?? 0), style: Theme.of(context).textTheme.titleSmall?.copyWith(color: AppTheme.primary)),
                    if (notes != null && notes.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(notes, maxLines: 2, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.onSurfaceVariant)),
                      ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: (occupied ? Colors.orange : Colors.green).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  occupied ? 'Occupied' : 'Available',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: occupied ? Colors.orange[800] : Colors.green[800]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
