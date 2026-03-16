import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import 'landlord_properties_screen.dart';
import 'landlord_tenants_screen.dart';
import 'landlord_invoices_screen.dart';
import 'landlord_payments_screen.dart';
import 'landlord_maintenance_screen.dart';
import 'landlord_profile_screen.dart';

class LandlordHomeScreen extends StatefulWidget {
  const LandlordHomeScreen({super.key});

  @override
  State<LandlordHomeScreen> createState() => _LandlordHomeScreenState();
}

class _LandlordHomeScreenState extends State<LandlordHomeScreen> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  int _index = 0;

  static const _bottomLabels = ['Home', 'Profile'];
  static const _drawerItemList = [
    _DrawerItem(icon: Icons.apartment_outlined, label: 'Properties', index: 1),
    _DrawerItem(icon: Icons.people_outline, label: 'Tenants', index: 2),
    _DrawerItem(icon: Icons.receipt_long_outlined, label: 'Invoices', index: 3),
    _DrawerItem(icon: Icons.payment_outlined, label: 'Payments', index: 4),
    _DrawerItem(icon: Icons.build_outlined, label: 'Maintenance', index: 5),
  ];

  String get _pageTitle {
    if (_index == 0) return 'Home';
    if (_index == 6) return 'Profile';
    return _drawerItemList.firstWhere((e) => e.index == _index, orElse: () => _drawerItemList.first).label;
  }

  int get _bottomNavIndex => _index == 6 ? 1 : 0;

  void _goTo(int i) {
    setState(() => _index = i);
    _scaffoldKey.currentState?.closeDrawer();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final roleLabel = user?.isManager == true ? 'Caretaker' : 'Landlord';
    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: Text(_pageTitle),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
      ),
      drawer: _LandlordDrawer(
        currentIndex: _index,
        roleLabel: roleLabel,
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
        children: [
          _LandlordDashboardTab(onNavigate: _goTo),
          const LandlordPropertiesScreen(),
          const LandlordTenantsScreen(),
          const LandlordInvoicesScreen(),
          const LandlordPaymentsScreen(),
          const LandlordMaintenanceScreen(),
          const LandlordProfileScreen(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 8, offset: const Offset(0, -2)),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _BottomNavItem(
                  icon: Icons.dashboard_outlined,
                  label: _bottomLabels[0],
                  selected: _bottomNavIndex == 0,
                  onTap: () => _goTo(0),
                ),
                _BottomNavItem(
                  icon: Icons.person_outline,
                  label: _bottomLabels[1],
                  selected: _bottomNavIndex == 1,
                  onTap: () => _goTo(6),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DrawerItem {
  final IconData icon;
  final String label;
  final int index;
  const _DrawerItem({required this.icon, required this.label, required this.index});
}

class _LandlordDrawer extends StatelessWidget {
  final int currentIndex;
  final String roleLabel;
  final ValueChanged<int> onSelect;
  final VoidCallback onLogout;

  const _LandlordDrawer({
    required this.currentIndex,
    required this.roleLabel,
    required this.onSelect,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final name = user?.displayName ?? roleLabel;
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
                colors: [AppTheme.primary, AppTheme.primaryDark],
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
                    name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'L',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  name,
                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  email,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(roleLabel, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w500)),
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
                  child: Text('MANAGE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.onSurfaceVariant, letterSpacing: 1.2)),
                ),
                ..._LandlordHomeScreenState._drawerItemList.map((item) {
                  final selected = currentIndex == item.index;
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
                    leading: Icon(item.icon, color: selected ? AppTheme.primary : AppTheme.onSurfaceVariant, size: 22),
                    title: Text(item.label, style: TextStyle(fontSize: 15, fontWeight: selected ? FontWeight.w600 : FontWeight.w500, color: selected ? AppTheme.primary : AppTheme.onSurface)),
                    selected: selected,
                    selectedTileColor: AppTheme.primary.withValues(alpha: 0.08),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(0)),
                    onTap: () => onSelect(item.index),
                  );
                }),
                const Divider(height: 32, indent: 20, endIndent: 20),
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
                  leading: Icon(Icons.person_outline, size: 22, color: currentIndex == 6 ? AppTheme.primary : AppTheme.onSurfaceVariant),
                  title: Text('Profile', style: TextStyle(fontSize: 15, fontWeight: currentIndex == 6 ? FontWeight.w600 : FontWeight.w500, color: currentIndex == 6 ? AppTheme.primary : AppTheme.onSurface)),
                  selected: currentIndex == 6,
                  selectedTileColor: AppTheme.primary.withValues(alpha: 0.08),
                  onTap: () => onSelect(6),
                ),
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

class _BottomNavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _BottomNavItem({required this.icon, required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(selected ? icon : icon, color: selected ? AppTheme.primary : AppTheme.onSurfaceVariant, size: 26),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 12, fontWeight: selected ? FontWeight.w600 : null, color: selected ? AppTheme.primary : AppTheme.onSurfaceVariant)),
          ],
        ),
      ),
    );
  }
}

class _LandlordDashboardTab extends StatelessWidget {
  final ValueChanged<int> onNavigate;

  const _LandlordDashboardTab({required this.onNavigate});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final roleLabel = user?.isManager == true ? 'Caretaker' : 'Landlord';
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Welcome back', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.onSurfaceVariant)),
                const SizedBox(height: 4),
                Text(
                  user?.displayName ?? roleLabel,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(roleLabel, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.primary)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text('Quick actions', style: Theme.of(context).textTheme.titleSmall?.copyWith(color: AppTheme.onSurfaceVariant)),
        const SizedBox(height: 8),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.4,
          children: [
            _QuickActionCard(icon: Icons.apartment, label: 'Properties', onTap: () => onNavigate(1)),
            _QuickActionCard(icon: Icons.people, label: 'Tenants', onTap: () => onNavigate(2)),
            _QuickActionCard(icon: Icons.receipt_long, label: 'Invoices', onTap: () => onNavigate(3)),
            _QuickActionCard(icon: Icons.payment, label: 'Payments', onTap: () => onNavigate(4)),
            _QuickActionCard(icon: Icons.build, label: 'Maintenance', onTap: () => onNavigate(5)),
          ],
        ),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickActionCard({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 36, color: AppTheme.primary),
              const SizedBox(height: 8),
              Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}
