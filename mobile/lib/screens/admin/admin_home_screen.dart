import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class AdminHomeScreen extends StatefulWidget {
  const AdminHomeScreen({super.key});

  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  int _index = 0;

  static const _sections = [
    _Section(label: 'Dashboard', icon: Icons.dashboard_outlined),
    _Section(label: 'Organizations', icon: Icons.business_outlined),
    _Section(label: 'Users', icon: Icons.people_outline),
    _Section(label: 'Pending verification', icon: Icons.pending_actions_outlined),
    _Section(label: 'Profile', icon: Icons.person_outline),
  ];

  void _goTo(int i) {
    setState(() => _index = i);
    _scaffoldKey.currentState?.closeDrawer();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: Text(_sections[_index].label),
        backgroundColor: AppTheme.primaryDark,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              final ok = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Sign out'),
                  content: const Text('Are you sure you want to sign out?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                    FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Sign out')),
                  ],
                ),
              );
              if (ok == true && mounted) await context.read<AuthProvider>().logout();
            },
          ),
        ],
      ),
      drawer: _AdminDrawer(
        currentIndex: _index,
        onSelect: _goTo,
        onLogout: () async {
          final ok = await showDialog<bool>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Sign out'),
              content: const Text('Are you sure you want to sign out?'),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Sign out')),
              ],
            ),
          );
          if (ok == true && mounted) await context.read<AuthProvider>().logout();
        },
      ),
      body: IndexedStack(
        index: _index,
        children: const [
          _AdminDashboardTab(),
          _AdminOrganizationsTab(),
          _AdminUsersTab(),
          _AdminPendingPropertiesTab(),
          _AdminProfileTab(),
        ],
      ),
    );
  }
}

class _Section {
  final String label;
  final IconData icon;
  const _Section({required this.label, required this.icon});
}

class _AdminDrawer extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onSelect;
  final VoidCallback onLogout;

  const _AdminDrawer({
    required this.currentIndex,
    required this.onSelect,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final name = user?.displayName ?? 'Admin';
    final email = user?.email ?? '';
    return Drawer(
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 16,
              left: 20,
              right: 20,
              bottom: 20,
            ),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF002171), Color(0xFF0D47A1)],
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: Colors.white.withValues(alpha: 0.25),
                  child: Text(
                    name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'A',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'System Admin',
                  style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 2),
                Text(
                  name,
                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  email,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 12),
              children: [
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                  child: Text('ADMIN', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.onSurfaceVariant, letterSpacing: 1.2)),
                ),
                ...List.generate(_AdminHomeScreenState._sections.length, (i) {
                  final s = _AdminHomeScreenState._sections[i];
                  final selected = currentIndex == i;
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
                    leading: Icon(s.icon, color: selected ? AppTheme.primary : AppTheme.onSurfaceVariant, size: 22),
                    title: Text(s.label, style: TextStyle(fontSize: 15, fontWeight: selected ? FontWeight.w600 : FontWeight.w500, color: selected ? AppTheme.primary : AppTheme.onSurface)),
                    selected: selected,
                    selectedTileColor: AppTheme.primary.withValues(alpha: 0.08),
                    onTap: () => onSelect(i),
                  );
                }),
                const Divider(height: 32, indent: 20, endIndent: 20),
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
                  leading: const Icon(Icons.logout, size: 22, color: AppTheme.error),
                  title: const Text('Sign out', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: AppTheme.error)),
                  onTap: onLogout,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AdminDashboardTab extends StatefulWidget {
  const _AdminDashboardTab();

  @override
  State<_AdminDashboardTab> createState() => _AdminDashboardTabState();
}

class _AdminDashboardTabState extends State<_AdminDashboardTab> {
  Map<String, dynamic>? _stats;
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
      final res = await ApiService().get('/admin/stats');
      if (!mounted) return;
      if (res.statusCode == 200) {
        setState(() {
          _stats = jsonDecode(res.body) as Map<String, dynamic>?;
          _loading = false;
          _error = null;
        });
      } else {
        setState(() {
          _loading = false;
          _error = ApiService.parseErrorMessage(res.body) ?? 'Failed to load stats';
        });
      }
    } catch (e) {
      if (mounted) setState(() {
        _loading = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  int _int(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v) ?? 0;
    return 0;
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
    final s = _stats ?? {};
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('System overview', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.onSurfaceVariant)),
                  const SizedBox(height: 16),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.5,
                    children: [
                      _StatChip(label: 'Organizations', value: '${_int(s['totalOrganizations'])}', icon: Icons.business),
                      _StatChip(label: 'Users', value: '${_int(s['totalUsers'])}', icon: Icons.people),
                      _StatChip(label: 'Properties', value: '${_int(s['totalProperties'])}', icon: Icons.apartment),
                      _StatChip(label: 'Units', value: '${_int(s['totalUnits'])}', icon: Icons.meeting_room),
                      _StatChip(label: 'Tenants', value: '${_int(s['totalTenants'])}', icon: Icons.person_pin),
                      _StatChip(label: 'Landlords', value: '${_int(s['landlords'])}', icon: Icons.home_work),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: ListTile(
              leading: const CircleAvatar(child: Icon(Icons.payments_outlined)),
              title: const Text('Expected monthly earnings'),
              subtitle: Text('KES ${_int(s['expectedMonthlyEarnings'])}', style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.primary)),
            ),
          ),
          Card(
            child: ListTile(
              leading: const CircleAvatar(child: Icon(Icons.trending_up)),
              title: const Text('Current month revenue'),
              subtitle: Text('KES ${_int(s['currentMonthRevenue'])}', style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.green)),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _StatChip({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 28, color: AppTheme.primary),
          const SizedBox(height: 4),
          Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
          Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}

class _AdminOrganizationsTab extends StatefulWidget {
  const _AdminOrganizationsTab();

  @override
  State<_AdminOrganizationsTab> createState() => _AdminOrganizationsTabState();
}

class _AdminOrganizationsTabState extends State<_AdminOrganizationsTab> {
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
      final res = await ApiService().get('/admin/organizations');
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
          _error = ApiService.parseErrorMessage(res.body) ?? 'Failed to load';
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
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Text(_error!, style: const TextStyle(color: AppTheme.error)), const SizedBox(height: 16), FilledButton(onPressed: _load, child: const Text('Retry'))]));
    }
    if (_list.isEmpty) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.business_outlined, size: 64, color: Colors.grey[400]), const SizedBox(height: 16), const Text('No organizations'), TextButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Refresh'))]));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _list.length,
        itemBuilder: (context, i) {
          final o = _list[i] as Map<String, dynamic>;
          final name = o['name']?.toString() ?? '—';
          final owner = o['ownerId'];
          final ownerName = owner is Map ? '${owner['firstName'] ?? ''} ${owner['lastName'] ?? ''}'.trim() : null;
          final units = o['totalUnits'] is num ? (o['totalUnits'] as num).toInt() : 0;
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: ListTile(
              title: Text(name),
              subtitle: Text([if (ownerName != null && ownerName.isNotEmpty) ownerName, '$units units'].join(' · ')),
              leading: const CircleAvatar(child: Icon(Icons.business)),
            ),
          );
        },
      ),
    );
  }
}

class _AdminUsersTab extends StatefulWidget {
  const _AdminUsersTab();

  @override
  State<_AdminUsersTab> createState() => _AdminUsersTabState();
}

class _AdminUsersTabState extends State<_AdminUsersTab> {
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
      final res = await ApiService().get('/admin/users');
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
          _error = ApiService.parseErrorMessage(res.body) ?? 'Failed to load';
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
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Text(_error!, style: const TextStyle(color: AppTheme.error)), const SizedBox(height: 16), FilledButton(onPressed: _load, child: const Text('Retry'))]));
    }
    if (_list.isEmpty) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.people_outline, size: 64, color: Colors.grey[400]), const SizedBox(height: 16), const Text('No users'), TextButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Refresh'))]));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _list.length,
        itemBuilder: (context, i) {
          final u = _list[i] as Map<String, dynamic>;
          final email = u['email']?.toString() ?? '—';
          final role = u['role']?.toString() ?? '—';
          final first = u['firstName']?.toString() ?? '';
          final last = u['lastName']?.toString() ?? '';
          final name = '$first $last'.trim().isEmpty ? email : '$first $last';
          final active = u['isActive'] != false;
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: ListTile(
              title: Text(name),
              subtitle: Text('$email · $role'),
              leading: CircleAvatar(
                backgroundColor: role == 'admin' ? AppTheme.primaryDark.withValues(alpha: 0.2) : AppTheme.primary.withValues(alpha: 0.2),
                child: Text(name.substring(0, 1).toUpperCase(), style: TextStyle(color: role == 'admin' ? AppTheme.primaryDark : AppTheme.primary, fontWeight: FontWeight.bold)),
              ),
              trailing: active ? null : const Chip(label: Text('Inactive', style: TextStyle(fontSize: 11)), padding: EdgeInsets.zero, materialTapTargetSize: MaterialTapTargetSize.shrinkWrap),
            ),
          );
        },
      ),
    );
  }
}

class _AdminPendingPropertiesTab extends StatefulWidget {
  const _AdminPendingPropertiesTab();

  @override
  State<_AdminPendingPropertiesTab> createState() => _AdminPendingPropertiesTabState();
}

class _AdminPendingPropertiesTabState extends State<_AdminPendingPropertiesTab> {
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
      final res = await ApiService().get('/admin/properties/pending-verification');
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
          _error = ApiService.parseErrorMessage(res.body) ?? 'Failed to load';
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
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Text(_error!, style: const TextStyle(color: AppTheme.error)), const SizedBox(height: 16), FilledButton(onPressed: _load, child: const Text('Retry'))]));
    }
    if (_list.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.verified_outlined, size: 64, color: Colors.green[300]),
            const SizedBox(height: 16),
            Text('No properties pending verification', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.onSurfaceVariant)),
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
          final name = p['propertyName']?.toString() ?? '—';
          final org = p['organizationId'];
          final orgName = org is Map ? org['name']?.toString() : null;
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: ListTile(
              title: Text(name),
              subtitle: Text(orgName ?? '—'),
              leading: const CircleAvatar(child: Icon(Icons.pending_actions)),
              trailing: const Icon(Icons.chevron_right),
            ),
          );
        },
      ),
    );
  }
}

class _AdminProfileTab extends StatelessWidget {
  const _AdminProfileTab();

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const SizedBox(height: 24),
        CircleAvatar(
          radius: 48,
          backgroundColor: AppTheme.primaryDark.withValues(alpha: 0.2),
          child: Text(
            (user?.displayName ?? 'A').substring(0, 1).toUpperCase(),
            style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
          ),
        ),
        const SizedBox(height: 16),
        Text(user?.displayName ?? 'Admin', textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
        Text(user?.email ?? '', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.onSurfaceVariant)),
        const SizedBox(height: 8),
        Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.primaryDark.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text('System Administrator', style: TextStyle(fontWeight: FontWeight.w600, color: AppTheme.primaryDark)),
          ),
        ),
        const SizedBox(height: 32),
        Card(
          child: Column(
            children: [
              ListTile(leading: const Icon(Icons.email_outlined), title: const Text('Email'), subtitle: Text(user?.email ?? '—')),
              const Divider(height: 1),
              ListTile(leading: const Icon(Icons.admin_panel_settings_outlined), title: const Text('Role'), subtitle: const Text('Admin')),
            ],
          ),
        ),
      ],
    );
  }
}
