/// API base URL - same as production frontend (.env.production)
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://property-management-system-w07h.onrender.com/api',
);

/// Timeout for API requests (seconds)
const int apiTimeoutSeconds = 30;
