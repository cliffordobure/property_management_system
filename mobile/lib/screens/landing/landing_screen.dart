import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../auth/login_screen.dart';
import '../auth/register_screen.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  List<dynamic> _units = [];
  bool _loading = true;
  String? _error;
  final _countryController = TextEditingController();
  final _cityController = TextEditingController();
  final _locationController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _countryController.dispose();
    _cityController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    final queryParams = <String, String>{};
    final c = _countryController.text.trim();
    final city = _cityController.text.trim();
    final loc = _locationController.text.trim();
    if (c.isNotEmpty) queryParams['country'] = c;
    if (city.isNotEmpty) queryParams['city'] = city;
    if (loc.isNotEmpty) queryParams['location'] = loc;
    try {
      final res = await ApiService().get('/units/public/available', queryParams: queryParams.isNotEmpty ? queryParams : null);
      if (!mounted) return;
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>?;
        final list = data?['units'];
        setState(() {
          _units = list is List ? list : [];
          _loading = false;
          _error = null;
        });
      } else {
        setState(() {
          _loading = false;
          _error = ApiService.parseErrorMessage(res.body) ?? 'Could not load listings';
        });
      }
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

  String _location(Map<String, dynamic>? property) {
    if (property == null) return '';
    final parts = <String>[];
    if (property['city']?.toString().trim().isNotEmpty == true) parts.add(property['city'].toString().trim());
    if (property['location']?.toString().trim().isNotEmpty == true) parts.add(property['location'].toString().trim());
    if (property['country']?.toString().trim().isNotEmpty == true) parts.add(property['country'].toString().trim());
    return parts.join(', ');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          _buildHero(),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 24,
                        decoration: BoxDecoration(
                          color: AppTheme.primary,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Vacant units',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                              letterSpacing: -0.5,
                              color: const Color(0xFF1E293B),
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Browse available units. Sign in or register to get connected by a landlord or caretaker.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFF64748B),
                          height: 1.4,
                        ),
                  ),
                  const SizedBox(height: 20),
                  _FilterCard(
                    countryController: _countryController,
                    cityController: _cityController,
                    locationController: _locationController,
                    onSearch: _load,
                  ),
                ],
              ),
            ),
          ),
          if (_loading)
            const SliverFillRemaining(
              child: Center(
                child: SizedBox(
                  width: 32,
                  height: 32,
                  child: CircularProgressIndicator(strokeWidth: 2.5),
                ),
              ),
            )
          else if (_error != null)
            SliverFillRemaining(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.cloud_off_outlined, size: 56, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey[700], fontSize: 15),
                      ),
                      const SizedBox(height: 24),
                      FilledButton.icon(
                        onPressed: _load,
                        icon: const Icon(Icons.refresh, size: 20),
                        label: const Text('Retry'),
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                          backgroundColor: AppTheme.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else if (_units.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.06),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Icon(Icons.home_work_outlined, size: 56, color: Colors.grey[400]),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'No vacant units listed yet',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF475569),
                            ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Check back later or contact properties directly.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF94A3B8)),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 28),
                      FilledButton.tonal(
                        onPressed: _load,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppTheme.primary.withValues(alpha: 0.12),
                          foregroundColor: AppTheme.primary,
                        ),
                        child: const Text('Refresh'),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, i) {
                    final u = _units[i] as Map<String, dynamic>;
                    final property = u['propertyId'] as Map<String, dynamic>?;
                    final unitId = u['unitId']?.toString() ?? '—';
                    final rent = u['rentAmount'];
                    final rentNum = rent is num ? rent : (rent is String ? num.tryParse(rent) : null);
                    final loc = _location(property);
                    final propertyName = property?['propertyName']?.toString() ?? 'Property';
                    return _UnitCard(
                      propertyName: propertyName,
                      unitId: unitId,
                      rentFormatted: _formatMoney(rentNum ?? 0),
                      location: loc,
                      onTap: () => _showUnitDetail(context, u),
                    );
                  },
                  childCount: _units.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showUnitDetail(BuildContext context, Map<String, dynamic> unit) {
    final property = unit['propertyId'] as Map<String, dynamic>?;
    final propertyId = property?['_id']?.toString();
    final unitId = unit['_id']?.toString();
    final unitIdStr = unit['unitId']?.toString() ?? '—';
    final propertyName = property?['propertyName']?.toString() ?? 'Property';
    final rent = unit['rentAmount'];
    final rentNum = rent is num ? rent : (rent is String ? num.tryParse(rent) : null);
    final street = property?['streetName']?.toString();
    final location = property?['location']?.toString();
    final city = property?['city']?.toString();
    final country = property?['country']?.toString();
    final parts = [street, location, city, country].where((e) => e != null && (e as String).isNotEmpty).toList();
    final fullAddress = parts.isEmpty ? 'Address not specified' : parts.join(', ');

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _UnitDetailSheetContent(
        propertyName: propertyName,
        unitId: unitIdStr,
        rentFormatted: _formatMoney(rentNum ?? 0),
        fullAddress: fullAddress,
        onRequestViewing: () {
          Navigator.of(ctx).pop();
          if (propertyId != null) {
            _showRequestViewingSheet(context, propertyId: propertyId, unitId: unitId, propertyName: propertyName, unitIdStr: unitIdStr);
          }
        },
      ),
    );
  }

  void _showRequestViewingSheet(BuildContext context, {required String propertyId, required String? unitId, required String propertyName, required String unitIdStr}) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _RequestViewingSheet(
        propertyId: propertyId,
        unitId: unitId,
        propertyName: propertyName,
        unitIdStr: unitIdStr,
        onDone: () => Navigator.of(ctx).pop(),
      ),
    );
  }

  Widget _buildHero() {
    return SliverToBoxAdapter(
      child: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0D47A1),
              Color(0xFF1565C0),
              Color(0xFF002171),
            ],
            stops: [0.0, 0.5, 1.0],
          ),
          boxShadow: [
            BoxShadow(
              color: Color(0xFF002171),
              blurRadius: 24,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Tongi',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: -0.5,
                            ),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Property Management',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withValues(alpha: 0.85),
                              letterSpacing: 0.3,
                            ),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    _HeroButton(
                      label: 'Login',
                      onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen())),
                    ),
                    const SizedBox(width: 8),
                    _HeroButton(
                      label: 'Register',
                      filled: true,
                      onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const RegisterScreen())),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _HeroButton extends StatelessWidget {
  final String label;
  final bool filled;
  final VoidCallback onPressed;

  const _HeroButton({required this.label, this.filled = false, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    if (filled) {
      return Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Text(
            label,
            style: const TextStyle(
              color: AppTheme.primary,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ),
        ),
      );
    }
    return Material(
      color: Colors.white.withValues(alpha: 0.18),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}

class _UnitCard extends StatelessWidget {
  final String propertyName;
  final String unitId;
  final String rentFormatted;
  final String location;
  final VoidCallback onTap;

  const _UnitCard({
    required this.propertyName,
    required this.unitId,
    required this.rentFormatted,
    required this.location,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            AppTheme.primary.withValues(alpha: 0.15),
                            AppTheme.primary.withValues(alpha: 0.08),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(Icons.apartment_rounded, color: AppTheme.primary, size: 28),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            propertyName,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF1E293B),
                                  letterSpacing: -0.2,
                                ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Unit $unitId',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          rentFormatted,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: AppTheme.primary,
                                fontSize: 18,
                              ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '/ month',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: const Color(0xFF94A3B8),
                                fontSize: 11,
                              ),
                        ),
                      ],
                    ),
                  ],
                ),
                if (location.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(Icons.location_on_rounded, size: 18, color: Colors.grey[600]),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          location,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF64748B),
                                fontSize: 14,
                              ),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline_rounded, size: 18, color: Colors.grey[600]),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Tap to see details and request a viewing.',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: const Color(0xFF64748B),
                                height: 1.35,
                              ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FilterCard extends StatelessWidget {
  final TextEditingController countryController;
  final TextEditingController cityController;
  final TextEditingController locationController;
  final VoidCallback onSearch;

  const _FilterCard({
    required this.countryController,
    required this.cityController,
    required this.locationController,
    required this.onSearch,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Filter by location', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
          const SizedBox(height: 12),
          TextField(
            controller: countryController,
            decoration: InputDecoration(
              labelText: 'Country',
              hintText: 'e.g., Kenya',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 10),
          TextField(
            controller: cityController,
            decoration: InputDecoration(
              labelText: 'City',
              hintText: 'e.g., Nairobi',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 10),
          TextField(
            controller: locationController,
            decoration: InputDecoration(
              labelText: 'Location/Area',
              hintText: 'e.g., Westlands',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => onSearch(),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: onSearch,
              icon: const Icon(Icons.search, size: 20),
              label: const Text('Search'),
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _UnitDetailSheetContent extends StatelessWidget {
  final String propertyName;
  final String unitId;
  final String rentFormatted;
  final String fullAddress;
  final VoidCallback onRequestViewing;

  const _UnitDetailSheetContent({
    required this.propertyName,
    required this.unitId,
    required this.rentFormatted,
    required this.fullAddress,
    required this.onRequestViewing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + MediaQuery.of(context).padding.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 24),
              Text(propertyName, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('Unit $unitId', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.primary)),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Text(rentFormatted, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800, color: AppTheme.primary)),
                  Text(' / month', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: const Color(0xFF94A3B8))),
                ],
              ),
              const SizedBox(height: 20),
              Text('Location', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
              const SizedBox(height: 6),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.location_on_rounded, size: 20, color: Colors.grey[600]),
                  const SizedBox(width: 8),
                  Expanded(child: Text(fullAddress, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: const Color(0xFF64748B), height: 1.4))),
                ],
              ),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: onRequestViewing,
                  icon: const Icon(Icons.calendar_today_rounded, size: 20),
                  label: const Text('Request viewing'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RequestViewingSheet extends StatefulWidget {
  final String propertyId;
  final String? unitId;
  final String propertyName;
  final String unitIdStr;
  final VoidCallback onDone;

  const _RequestViewingSheet({
    required this.propertyId,
    this.unitId,
    required this.propertyName,
    required this.unitIdStr,
    required this.onDone,
  });

  @override
  State<_RequestViewingSheet> createState() => _RequestViewingSheetState();
}

class _RequestViewingSheetState extends State<_RequestViewingSheet> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _messageController = TextEditingController();
  DateTime? _selectedDate;
  String? _selectedTime;
  bool _sending = false;
  String? _error;

  static const _timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    if (name.isEmpty || phone.isEmpty) {
      setState(() => _error = 'Name and phone are required.');
      return;
    }
    if (_selectedDate == null || _selectedTime == null) {
      setState(() => _error = 'Please select date and time.');
      return;
    }
    setState(() { _error = null; _sending = true; });
    try {
      final body = <String, dynamic>{
        'propertyId': widget.propertyId,
        'visitorName': name,
        'visitorPhone': phone,
        'requestedDate': _selectedDate!.toIso8601String().split('T').first,
        'requestedTime': _selectedTime!,
      };
      if (widget.unitId != null) body['unitId'] = widget.unitId;
      final email = _emailController.text.trim();
      if (email.isNotEmpty) body['visitorEmail'] = email;
      final message = _messageController.text.trim();
      if (message.isNotEmpty) body['message'] = message;

      final res = await ApiService().post('/pre-visits/public/book', body: body);
      if (!mounted) return;
      if (res.statusCode >= 200 && res.statusCode < 300) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Viewing request sent. The landlord will get in touch.'), backgroundColor: Color(0xFF2E7D32)),
        );
        widget.onDone();
      } else {
        setState(() {
          _sending = false;
          _error = ApiService.parseErrorMessage(res.body) ?? 'Failed to send request.';
        });
      }
    } catch (e) {
      if (mounted) setState(() {
        _sending = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + MediaQuery.of(context).padding.bottom),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
                  ),
                ),
                const SizedBox(height: 16),
                Text('Request a viewing', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                Text('${widget.propertyName} · Unit ${widget.unitIdStr}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: const Color(0xFF64748B))),
                const SizedBox(height: 20),
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Your name *', border: OutlineInputBorder()),
                  textCapitalization: TextCapitalization.words,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _phoneController,
                  decoration: const InputDecoration(labelText: 'Phone *', border: OutlineInputBorder()),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _emailController,
                  decoration: const InputDecoration(labelText: 'Email (optional)', border: OutlineInputBorder()),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 12),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(_selectedDate == null ? 'Date *' : 'Date: ${_selectedDate!.toIso8601String().split('T').first}'),
                  trailing: const Icon(Icons.calendar_today),
                  onTap: () async {
                    final d = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now().add(const Duration(days: 1)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (d != null && mounted) setState(() => _selectedDate = d);
                  },
                ),
                const SizedBox(height: 4),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _timeSlots.map((t) {
                    final selected = _selectedTime == t;
                    return ChoiceChip(
                      label: Text(t),
                      selected: selected,
                      onSelected: (v) => setState(() => _selectedTime = v ? t : null),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _messageController,
                  decoration: const InputDecoration(labelText: 'Message (optional)', border: OutlineInputBorder()),
                  maxLines: 2,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
                ],
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _sending ? null : _submit,
                    style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                    child: _sending ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Send request'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
