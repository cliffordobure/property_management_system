import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class ApiService {
  static final ApiService _instance = ApiService._();
  factory ApiService() => _instance;

  ApiService._();

  String? _token;

  void setToken(String? token) {
    _token = token;
  }

  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_token != null && _token!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  Future<http.Response> get(String path, {Map<String, String>? queryParams}) async {
    final uri = queryParams != null && queryParams.isNotEmpty
        ? Uri.parse(apiBaseUrl + path).replace(queryParameters: queryParams)
        : Uri.parse(apiBaseUrl + path);
    return http.get(uri, headers: _headers).timeout(
      Duration(seconds: apiTimeoutSeconds),
      onTimeout: () => throw Exception('Request timeout'),
    );
  }

  Future<http.Response> post(String path, {Map<String, dynamic>? body}) async {
    final uri = Uri.parse(apiBaseUrl + path);
    return http.post(
      uri,
      headers: _headers,
      body: body != null ? jsonEncode(body) : null,
    ).timeout(
      Duration(seconds: apiTimeoutSeconds),
      onTimeout: () => throw Exception('Request timeout'),
    );
  }

  Future<http.Response> put(String path, {Map<String, dynamic>? body}) async {
    final uri = Uri.parse(apiBaseUrl + path);
    return http.put(
      uri,
      headers: _headers,
      body: body != null ? jsonEncode(body) : null,
    ).timeout(
      Duration(seconds: apiTimeoutSeconds),
      onTimeout: () => throw Exception('Request timeout'),
    );
  }

  Future<http.Response> delete(String path) async {
    final uri = Uri.parse(apiBaseUrl + path);
    return http.delete(uri, headers: _headers).timeout(
      Duration(seconds: apiTimeoutSeconds),
      onTimeout: () => throw Exception('Request timeout'),
    );
  }

  static String? parseErrorMessage(String body) {
    try {
      final map = jsonDecode(body) as Map<String, dynamic>?;
      return map?['message']?.toString();
    } catch (_) {
      return null;
    }
  }
}
