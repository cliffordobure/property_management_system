import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Shown when the tenant has no tenant record yet (not linked to a property by landlord/caretaker).
/// Matches the web "Account Not Linked" experience: warning box, email, what to do next, Refresh + Logout.
class TenantNotLinkedPlaceholder extends StatelessWidget {
  final VoidCallback onRefresh;
  final String? userEmail;
  final VoidCallback? onLogout;

  const TenantNotLinkedPlaceholder({
    super.key,
    required this.onRefresh,
    this.userEmail,
    this.onLogout,
  });

  static bool isNotLinkedError(String? message) {
    if (message == null || message.isEmpty) return false;
    final lower = message.toLowerCase();
    return lower.contains('tenant') && (lower.contains('record') || lower.contains('not found') || lower.contains('no tenant'));
  }

  @override
  Widget build(BuildContext context) {
    final email = userEmail ?? '';
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 8),
          // Yellow "Account Not Linked" alert (matches web)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.amber.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.amber.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.warning_amber_rounded, color: Colors.amber.shade700, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Account Not Linked',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.amber.shade900,
                                ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            "No tenant record found. Your account exists, but you haven't been added to any property yet. Please contact your property manager to add you as a tenant.",
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.amber.shade900),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                if (email.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Your registered email:',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: Colors.amber.shade900,
                        ),
                  ),
                  const SizedBox(height: 2),
                  SelectableText(
                    email,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.amber.shade900,
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Blue "What to do next" info box
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.info_outline, color: AppTheme.primary, size: 22),
                    const SizedBox(width: 8),
                    Text(
                      'What to do next:',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primary,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _Step(number: 1, text: 'Contact your property manager or landlord'),
                _Step(number: 2, text: 'Provide them with your registered email: ${email.isEmpty ? "your email" : email}'),
                _Step(number: 3, text: 'Ask them to add you as a tenant to a property using this email'),
                _Step(number: 4, text: 'Once added, refresh this page or log out and log back in'),
              ],
            ),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: onRefresh,
            icon: const Icon(Icons.refresh, size: 20),
            label: const Text('Refresh'),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              backgroundColor: AppTheme.primary,
            ),
          ),
          if (onLogout != null) ...[
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: onLogout,
              icon: const Icon(Icons.logout, size: 20),
              label: const Text('Logout'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                foregroundColor: AppTheme.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _Step extends StatelessWidget {
  final int number;
  final String text;

  const _Step({required this.number, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 22,
            height: 22,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Text(
              '$number',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primary),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.onSurface),
            ),
          ),
        ],
      ),
    );
  }
}
