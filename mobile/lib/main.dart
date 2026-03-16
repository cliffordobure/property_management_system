import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'theme/app_theme.dart';
import 'screens/landing/landing_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/tenant/tenant_home_screen.dart';
import 'screens/landlord/landlord_home_screen.dart';
import 'screens/admin/admin_home_screen.dart';

void main() {
  runApp(const TongiApp());
}

class TongiApp extends StatelessWidget {
  const TongiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider()..init(),
      child: MaterialApp(
        title: 'Tongi',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        home: const AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        if (auth.loading && !auth.isAuthenticated) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (!auth.isAuthenticated) {
          return const LandingScreen();
        }
        final user = auth.user;
        if (user == null) {
          return const LandingScreen();
        }
        if (user.isTenant) {
          return const TenantHomeScreen();
        }
        if (user.isAdmin) {
          return const AdminHomeScreen();
        }
        if (user.isLandlord || user.isManager) {
          return const LandlordHomeScreen();
        }
        return const LandlordHomeScreen();
      },
    );
  }
}
