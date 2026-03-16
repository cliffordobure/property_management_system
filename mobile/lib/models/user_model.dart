class UserModel {
  final String id;
  final String email;
  final String role;
  final String? firstName;
  final String? lastName;
  final String? organizationId;
  final bool? isFirstTimeLogin;
  final bool? onboardingCompleted;

  UserModel({
    required this.id,
    required this.email,
    required this.role,
    this.firstName,
    this.lastName,
    this.organizationId,
    this.isFirstTimeLogin,
    this.onboardingCompleted,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'tenant',
      firstName: json['firstName']?.toString(),
      lastName: json['lastName']?.toString(),
      organizationId: json['organizationId']?.toString(),
      isFirstTimeLogin: json['isFirstTimeLogin'] as bool?,
      onboardingCompleted: json['onboardingCompleted'] as bool?,
    );
  }

  String get displayName {
    if (firstName != null && lastName != null) return '$firstName $lastName'.trim();
    if (firstName != null) return firstName!;
    if (email.isNotEmpty) return email.split('@').first;
    return 'User';
  }

  bool get isTenant => role == 'tenant';
  bool get isLandlord => role == 'landlord';
  bool get isManager => role == 'manager';
  bool get isCaretaker => role == 'manager';
  bool get isAdmin => role == 'admin';
  bool get isLandlordOrCaretaker => role == 'landlord' || role == 'manager';
}
