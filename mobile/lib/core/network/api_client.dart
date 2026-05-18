import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../storage/secure_storage.dart';
import '../storage/cache_service.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  late final Dio _dio;
  bool _isRefreshing = false;

  void init() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: _onRequest,
      onResponse: _onResponse,
      onError: _onError,
    ));
  }

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await SecureStorage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  Future<void> _onResponse(
    Response response,
    ResponseInterceptorHandler handler,
  ) async {
    if (response.requestOptions.method == 'GET' &&
        (response.statusCode ?? 0) >= 200 &&
        (response.statusCode ?? 0) < 300) {
      final key = CacheService.keyFor(
        response.requestOptions.path,
        response.requestOptions.queryParameters,
      );
      await CacheService.set(key, response.data);
    }
    handler.next(response);
  }

  Future<void> _onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final isAuthEndpoint = err.requestOptions.path.contains('/auth/');

    if (err.response?.statusCode == 401 && !isAuthEndpoint && !_isRefreshing) {
      _isRefreshing = true;
      try {
        final refreshToken = await SecureStorage.getRefreshToken();
        if (refreshToken == null) {
          await SecureStorage.clearAll();
          handler.reject(err);
          _isRefreshing = false;
          return;
        }
        final response = await _dio.post(
          ApiConstants.refresh,
          data: {'refreshToken': refreshToken},
          options: Options(headers: {'Authorization': null}),
        );
        final newToken = response.data['data']['accessToken'] as String;
        await SecureStorage.saveTokens(accessToken: newToken);

        err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
        final retryResponse = await _dio.request(
          err.requestOptions.path,
          data: err.requestOptions.data,
          queryParameters: err.requestOptions.queryParameters,
          options: Options(
            method: err.requestOptions.method,
            headers: err.requestOptions.headers,
          ),
        );
        handler.resolve(retryResponse);
      } catch (_) {
        await SecureStorage.clearAll();
        handler.reject(err);
      } finally {
        _isRefreshing = false;
      }
      return;
    }
    // Serve cached data for GET requests when there's no connectivity
    if (err.requestOptions.method == 'GET' &&
        (err.type == DioExceptionType.connectionError ||
            err.type == DioExceptionType.connectionTimeout ||
            err.type == DioExceptionType.receiveTimeout ||
            err.type == DioExceptionType.sendTimeout)) {
      final key = CacheService.keyFor(
        err.requestOptions.path,
        err.requestOptions.queryParameters,
      );
      final cached = await CacheService.get(key);
      if (cached != null) {
        handler.resolve(Response(
          requestOptions: err.requestOptions,
          data: cached,
          statusCode: 200,
        ));
        return;
      }
    }

    handler.next(err);
  }

  // GET
  Future<Response> get(String path, {Map<String, dynamic>? params}) =>
      _dio.get(path, queryParameters: params);

  // POST
  Future<Response> post(String path, {dynamic data}) =>
      _dio.post(path, data: data);

  // PUT
  Future<Response> put(String path, {dynamic data}) =>
      _dio.put(path, data: data);

  // DELETE
  Future<Response> delete(String path) => _dio.delete(path);

  // MULTIPART
  Future<Response> postFormData(String path, FormData formData) =>
      _dio.post(path, data: formData);

  static String extractError(Object e) {
    if (e is DioException) {
      switch (e.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Connection timed out. Check your internet and try again.';
        case DioExceptionType.connectionError:
          return 'Cannot reach server. Make sure you are on the same network.';
        case DioExceptionType.badResponse:
          return e.response?.data?['message'] as String? ?? 'Server error';
        default:
          return e.response?.data?['message'] as String? ??
              e.message ??
              'Something went wrong';
      }
    }
    return e.toString();
  }
}
