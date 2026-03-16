import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _auth = AuthService();

  UserModel? _user;
  String? _token;
  bool _loading = true;
  String? _error;

  UserModel? get user => _user;
  String? get token => _token;
  bool get loading => _loading;
  String? get error => _error;
  bool get isAuthenticated => _token != null && _user != null;

  Future<void> init() async {
    _loading = true;
    notifyListeners();
    _token = await _auth.loadToken();
    _user = await _auth.loadUser();
    _loading = false;
    notifyListeners();
  }

  Future<void> login({required String email, required String password, String? role}) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await _auth.login(email: email, password: password, role: role);
      _user = result.user;
      _token = result.token;
      _error = null;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> register({
    required String email,
    required String password,
    required String role,
    String? firstName,
    String? lastName,
    String? phone,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await _auth.register(
        email: email,
        password: password,
        role: role,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
      );
      _user = result.user;
      _token = result.token;
      _error = null;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> logout() async {
    await _auth.logout();
    _user = null;
    _token = null;
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
