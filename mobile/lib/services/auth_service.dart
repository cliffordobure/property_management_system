import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/user_model.dart';
import 'api_service.dart';

class AuthService {
  static const _keyToken = 'auth_token';
  static const _keyUser = 'auth_user';

  final ApiService _api = ApiService();

  Future<void> persistToken(String token) async {
    _api.setToken(token);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyToken, token);
  }

  Future<void> persistUser(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUser, jsonEncode(_userToJson(user)));
  }

  Map<String, dynamic> _userToJson(UserModel user) {
    return {
      'id': user.id,
      'email': user.email,
      'role': user.role,
      'firstName': user.firstName,
      'lastName': user.lastName,
      'organizationId': user.organizationId,
      'isFirstTimeLogin': user.isFirstTimeLogin,
      'onboardingCompleted': user.onboardingCompleted,
    };
  }

  Future<String?> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_keyToken);
    if (token != null) _api.setToken(token);
    return token;
  }

  Future<UserModel?> loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_keyUser);
    if (raw == null) return null;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return UserModel.fromJson(map);
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    _api.setToken(null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyToken);
    await prefs.remove(_keyUser);
  }

  /// Login with email, password and optional role (manager|landlord|tenant).
  /// For Manager/Landlord the frontend sends role 'manager' and backend accepts both.
  Future<({UserModel user, String token})> login({
    required String email,
    required String password,
    String? role,
  }) async {
    final body = <String, dynamic>{
      'email': email.trim(),
      'password': password,
    };
    if (role != null && role.isNotEmpty) body['role'] = role;

    final response = await _api.post('/auth/login', body: body);
    final bodyStr = response.body;

    if (response.statusCode != 200) {
      final msg = ApiService.parseErrorMessage(bodyStr) ?? 'Login failed';
      throw Exception(msg);
    }

    final data = jsonDecode(bodyStr) as Map<String, dynamic>;
    final token = data['token']?.toString();
    final userJson = data['user'] as Map<String, dynamic>?;
    if (token == null || userJson == null) throw Exception('Invalid response');

    final user = UserModel.fromJson(userJson);
    await persistToken(token);
    await persistUser(user);
    return (user: user, token: token);
  }

  /// Register. Only landlord and tenant can self-register.
  Future<({UserModel user, String token})> register({
    required String email,
    required String password,
    required String role,
    String? firstName,
    String? lastName,
    String? phone,
  }) async {
    final body = <String, dynamic>{
      'email': email.trim(),
      'password': password,
      'role': role,
      if (firstName != null) 'firstName': firstName,
      if (lastName != null) 'lastName': lastName,
      if (phone != null) 'phone': phone,
    };

    final response = await _api.post('/auth/register', body: body);
    final bodyStr = response.body;

    if (response.statusCode != 201 && response.statusCode != 200) {
      final msg = ApiService.parseErrorMessage(bodyStr) ?? 'Registration failed';
      throw Exception(msg);
    }

    final data = jsonDecode(bodyStr) as Map<String, dynamic>;
    final token = data['token']?.toString();
    final userJson = data['user'] as Map<String, dynamic>?;
    if (token == null || userJson == null) throw Exception('Invalid response');

    final user = UserModel.fromJson(userJson);
    await persistToken(token);
    await persistUser(user);
    return (user: user, token: token);
  }

  /// Get current user from API
  Future<UserModel?> getMe() async {
    final response = await _api.get('/auth/me');
    if (response.statusCode != 200) return null;
    final data = jsonDecode(response.body) as Map<String, dynamic>?;
    final userJson = data?['user'] as Map<String, dynamic>?;
    if (userJson == null) return null;
    return UserModel.fromJson(userJson);
  }
}
