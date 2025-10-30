# API Integration Guide for Android Application

## Overview

This document describes how the Deep Assistant Android application integrates with the existing API Gateway service. The integration follows RESTful principles with additional WebSocket support for real-time streaming.

## Base Configuration

### API Endpoint

**Production**: `https://api.deepassistant.com` (to be configured)
**Base Path**: `/` (all endpoints relative to base URL)

### Authentication

All authenticated requests must include a Bearer token in the Authorization header:

```
Authorization: Bearer {user_token}
```

**Token Storage**: Tokens are stored securely using Android's EncryptedSharedPreferences with AES256_GCM encryption.

**Token Lifecycle**:
1. User provides initial authentication token (via QR code, manual entry, or OAuth)
2. Token validated against API Gateway
3. Token stored in EncryptedSharedPreferences
4. Token included in all subsequent requests
5. On 401 response, prompt user to re-authenticate

## API Endpoints

### 1. Chat Completions

Send a message and receive AI response.

**Endpoint**: `POST /v1/chat/completions`

**Request Headers**:
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "string",
  "content": "string",
  "model": "string",
  "systemMessage": "string (optional)"
}
```

**Request Body (Kotlin)**:
```kotlin
@Serializable
data class CompletionRequest(
    val userId: String,
    val content: String,
    val model: String,
    val systemMessage: String? = null
)
```

**Response** (200 OK):
```json
{
  "id": "string",
  "content": "string",
  "model": "string",
  "tokensUsed": 0,
  "timestamp": 0
}
```

**Response (Kotlin)**:
```kotlin
@Serializable
data class CompletionResponse(
    val id: String,
    val content: String,
    val model: String,
    val tokensUsed: Int,
    val timestamp: Long
)
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `429 Too Many Requests`: Insufficient token balance
- `500 Internal Server Error`: Provider failure or service error

**Implementation Example**:
```kotlin
interface ApiGatewayService {
    @POST("v1/chat/completions")
    suspend fun completions(
        @Body request: CompletionRequest
    ): CompletionResponse
}

// Usage in Repository
class ChatRepositoryImpl @Inject constructor(
    private val apiService: ApiGatewayService,
    private val tokenManager: TokenManager
) : ChatRepository {

    override suspend fun sendMessage(
        content: String,
        model: String,
        systemMessage: String?
    ): Result<CompletionResponse> = withContext(Dispatchers.IO) {
        try {
            val userId = tokenManager.getUserId()
            val response = apiService.completions(
                CompletionRequest(
                    userId = userId,
                    content = content,
                    model = model,
                    systemMessage = systemMessage
                )
            )
            Result.success(response)
        } catch (e: HttpException) {
            when (e.code()) {
                401 -> Result.failure(AuthenticationException("Invalid token"))
                429 -> Result.failure(InsufficientTokensException())
                else -> Result.failure(ApiException("Request failed: ${e.message}"))
            }
        } catch (e: Exception) {
            Result.failure(NetworkException("Network error: ${e.message}"))
        }
    }
}
```

### 2. Token Balance

Retrieve current token balance for the authenticated user.

**Endpoint**: `GET /token`

**Request Headers**:
```
Authorization: Bearer {user_token}
```

**Response** (200 OK):
```json
{
  "balance": 10000,
  "userId": "string"
}
```

**Response (Kotlin)**:
```kotlin
@Serializable
data class TokenBalanceResponse(
    val balance: Int,
    val userId: String
)
```

**Implementation Example**:
```kotlin
interface ApiGatewayService {
    @GET("token")
    suspend fun getTokenBalance(): TokenBalanceResponse
}

// Usage in Repository
class TokenRepositoryImpl @Inject constructor(
    private val apiService: ApiGatewayService
) : TokenRepository {

    override suspend fun getBalance(): Result<Int> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getTokenBalance()
            Result.success(response.balance)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### 3. Update Token Balance

Update user's token balance (requires master token).

**Endpoint**: `PUT /token`

**Request Headers**:
```
Authorization: Bearer {master_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "string",
  "balance": 10000
}
```

**Request Body (Kotlin)**:
```kotlin
@Serializable
data class TokenUpdateRequest(
    val userId: String,
    val balance: Int
)
```

**Response** (200 OK):
```json
{
  "balance": 10000,
  "userId": "string"
}
```

**Note**: This endpoint typically used for server-side operations or admin functionality.

### 4. Dialog History

Retrieve conversation history for the authenticated user.

**Endpoint**: `GET /dialog`

**Request Headers**:
```
Authorization: Bearer {user_token}
```

**Response** (200 OK):
```json
{
  "messages": [
    {
      "role": "user",
      "content": "string",
      "timestamp": 0
    },
    {
      "role": "assistant",
      "content": "string",
      "timestamp": 0
    }
  ]
}
```

**Response (Kotlin)**:
```kotlin
@Serializable
data class DialogHistoryResponse(
    val messages: List<DialogMessage>
)

@Serializable
data class DialogMessage(
    val role: String,
    val content: String,
    val timestamp: Long
)
```

**Implementation Example**:
```kotlin
interface ApiGatewayService {
    @GET("dialog")
    suspend fun getDialogHistory(): DialogHistoryResponse
}

// Usage in Repository
class DialogRepositoryImpl @Inject constructor(
    private val apiService: ApiGatewayService,
    private val dialogDao: DialogDao
) : DialogRepository {

    override suspend fun syncHistory(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getDialogHistory()
            // Save to local database
            dialogDao.insertMessages(response.messages.map { it.toEntity() })
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### 5. Clear Dialog History

Clear all conversation history for the authenticated user.

**Endpoint**: `DELETE /dialog`

**Request Headers**:
```
Authorization: Bearer {user_token}
```

**Response** (200 OK): Empty response body

**Implementation Example**:
```kotlin
interface ApiGatewayService {
    @DELETE("dialog")
    suspend fun clearDialog()
}

// Usage in Repository
class DialogRepositoryImpl @Inject constructor(
    private val apiService: ApiGatewayService,
    private val dialogDao: DialogDao
) : DialogRepository {

    override suspend fun clearHistory(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            // Clear on server
            apiService.clearDialog()
            // Clear local cache
            dialogDao.deleteAllMessages()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### 6. Audio Transcription

Transcribe audio to text using Whisper model.

**Endpoint**: `POST /v1/audio/transcriptions`

**Request Headers**:
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "audioUrl": "string",
  "model": "whisper-1"
}
```

**Request Body (Kotlin)**:
```kotlin
@Serializable
data class TranscriptionRequest(
    val audioUrl: String,
    val model: String = "whisper-1"
)
```

**Response** (200 OK):
```json
{
  "text": "string",
  "duration": 0
}
```

**Response (Kotlin)**:
```kotlin
@Serializable
data class TranscriptionResponse(
    val text: String,
    val duration: Int
)
```

**Implementation Example**:
```kotlin
interface ApiGatewayService {
    @POST("v1/audio/transcriptions")
    suspend fun transcribeAudio(
        @Body request: TranscriptionRequest
    ): TranscriptionResponse
}

// Usage in Repository
class AudioRepositoryImpl @Inject constructor(
    private val apiService: ApiGatewayService
) : AudioRepository {

    override suspend fun transcribeAudio(audioUrl: String): Result<String> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.transcribeAudio(
                    TranscriptionRequest(audioUrl = audioUrl)
                )
                Result.success(response.text)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
}
```

### 7. Text-to-Speech

Generate audio from text.

**Endpoint**: `POST /v1/audio/speech`

**Request Headers**:
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "text": "string",
  "voice": "string",
  "model": "tts-1"
}
```

**Response** (200 OK): Audio file (binary data)

**Implementation**: Download and save audio file locally.

### 8. Create Referral

Create a referral link for user acquisition.

**Endpoint**: `POST /referral`

**Request Headers**:
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "referrerId": "string",
  "referredId": "string"
}
```

**Request Body (Kotlin)**:
```kotlin
@Serializable
data class ReferralRequest(
    val referrerId: String,
    val referredId: String
)
```

**Response** (200 OK):
```json
{
  "referralId": "string",
  "bonusTokens": 1000
}
```

**Response (Kotlin)**:
```kotlin
@Serializable
data class ReferralResponse(
    val referralId: String,
    val bonusTokens: Int
)
```

### 9. Get Referral Count

Get the count of successful referrals.

**Endpoint**: `GET /referral?userId={userId}`

**Request Headers**:
```
Authorization: Bearer {user_token}
```

**Response** (200 OK):
```json
{
  "count": 5,
  "totalBonusEarned": 5000
}
```

**Response (Kotlin)**:
```kotlin
@Serializable
data class ReferralCountResponse(
    val count: Int,
    val totalBonusEarned: Int
)
```

## Streaming Support (WebSocket)

For real-time streaming responses, the Android app can use WebSocket connections.

### WebSocket Connection

**URL**: `wss://api.deepassistant.com/v1/chat/completions/stream`

**Connection Headers**:
```
Authorization: Bearer {user_token}
```

**Message Format** (Client → Server):
```json
{
  "userId": "string",
  "content": "string",
  "model": "string",
  "systemMessage": "string (optional)"
}
```

**Message Format** (Server → Client):
```json
{
  "type": "chunk",
  "content": "string"
}
```

**Completion Message**:
```json
{
  "type": "done",
  "tokensUsed": 0
}
```

**Implementation Example**:
```kotlin
class StreamingChatService @Inject constructor(
    private val okHttpClient: OkHttpClient,
    private val tokenManager: TokenManager
) {

    fun streamCompletion(
        content: String,
        model: String
    ): Flow<StreamingMessage> = callbackFlow {
        val request = Request.Builder()
            .url("wss://api.deepassistant.com/v1/chat/completions/stream")
            .header("Authorization", "Bearer ${tokenManager.getUserToken()}")
            .build()

        val webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                val message = Json.encodeToString(
                    StreamingRequest(
                        userId = tokenManager.getUserId(),
                        content = content,
                        model = model
                    )
                )
                webSocket.send(message)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                val message = Json.decodeFromString<StreamingMessage>(text)
                trySend(message)

                if (message.type == "done") {
                    close()
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                close(t)
            }
        })

        awaitClose {
            webSocket.close(1000, "Client closing connection")
        }
    }
}

@Serializable
data class StreamingRequest(
    val userId: String,
    val content: String,
    val model: String,
    val systemMessage: String? = null
)

@Serializable
data class StreamingMessage(
    val type: String, // "chunk" or "done"
    val content: String? = null,
    val tokensUsed: Int? = null
)
```

## Supported AI Models

The API Gateway supports multiple AI models with automatic failover:

### OpenAI Models
- `gpt-4o` - Latest GPT-4 Optimized
- `gpt-4o-mini` - Smaller, faster GPT-4 variant
- `o1-mini` - Reasoning-focused model
- `o3-mini` - Latest reasoning model

### Anthropic Models
- `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet
- `claude-3-5-haiku-20241022` - Claude 3.5 Haiku

### Meta Models
- `meta-llama/llama-3.1-405b-instruct` - Llama 3.1 405B
- `meta-llama/llama-3.1-70b-instruct` - Llama 3.1 70B

### DeepSeek Models
- `deepseek-chat` - DeepSeek V3
- `deepseek-reasoner` - DeepSeek R1

**Model Selection**: Users can select their preferred model through the app's settings or chat interface.

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Continue normally |
| 401 | Unauthorized | Prompt user to re-authenticate |
| 429 | Too Many Requests | Show "insufficient tokens" message with option to purchase |
| 500 | Internal Server Error | Retry with exponential backoff |
| 503 | Service Unavailable | Show maintenance message |

### Error Response Format

```json
{
  "error": {
    "message": "string",
    "code": "string",
    "details": {}
  }
}
```

**Error Response (Kotlin)**:
```kotlin
@Serializable
data class ErrorResponse(
    val error: ErrorDetail
)

@Serializable
data class ErrorDetail(
    val message: String,
    val code: String,
    val details: JsonObject? = null
)
```

### Retry Strategy

Implement exponential backoff for transient failures:

```kotlin
suspend fun <T> retryWithExponentialBackoff(
    maxRetries: Int = 3,
    initialDelay: Long = 1000L,
    maxDelay: Long = 10000L,
    factor: Double = 2.0,
    block: suspend () -> T
): Result<T> {
    var currentDelay = initialDelay
    repeat(maxRetries) { attempt ->
        try {
            return Result.success(block())
        } catch (e: Exception) {
            if (attempt == maxRetries - 1 || !e.isRetryable()) {
                return Result.failure(e)
            }
        }
        delay(currentDelay)
        currentDelay = (currentDelay * factor).toLong().coerceAtMost(maxDelay)
    }
    return Result.failure(Exception("Max retries exceeded"))
}

fun Exception.isRetryable(): Boolean {
    return when (this) {
        is IOException -> true
        is HttpException -> code() in 500..599
        else -> false
    }
}
```

## Network Configuration

### OkHttp Client Configuration

```kotlin
@Provides
@Singleton
fun provideOkHttpClient(
    authInterceptor: AuthInterceptor,
    loggingInterceptor: HttpLoggingInterceptor
): OkHttpClient {
    return OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()
}
```

### Authentication Interceptor

```kotlin
class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        val token = tokenManager.getUserToken()
        if (token.isNullOrEmpty()) {
            return chain.proceed(originalRequest)
        }

        val authenticatedRequest = originalRequest.newBuilder()
            .header("Authorization", "Bearer $token")
            .build()

        return chain.proceed(authenticatedRequest)
    }
}
```

### Logging Interceptor (Debug Only)

```kotlin
@Provides
@Singleton
fun provideLoggingInterceptor(): HttpLoggingInterceptor {
    return HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }
}
```

## Caching Strategy

Implement caching to reduce API calls and improve performance:

### Network Cache

```kotlin
@Provides
@Singleton
fun provideCache(@ApplicationContext context: Context): Cache {
    val cacheSize = 10 * 1024 * 1024 // 10 MB
    return Cache(context.cacheDir, cacheSize.toLong())
}
```

### Cache Control

```kotlin
class CacheInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()

        // Cache GET requests for 5 minutes
        val cacheControl = CacheControl.Builder()
            .maxAge(5, TimeUnit.MINUTES)
            .build()

        val response = chain.proceed(request)

        return if (request.method == "GET") {
            response.newBuilder()
                .header("Cache-Control", cacheControl.toString())
                .build()
        } else {
            response
        }
    }
}
```

## Testing

### Mock API Service for Testing

```kotlin
class MockApiGatewayService : ApiGatewayService {
    override suspend fun completions(request: CompletionRequest): CompletionResponse {
        return CompletionResponse(
            id = "mock-id",
            content = "Mock response for: ${request.content}",
            model = request.model,
            tokensUsed = 100,
            timestamp = System.currentTimeMillis()
        )
    }

    override suspend fun getTokenBalance(): TokenBalanceResponse {
        return TokenBalanceResponse(
            balance = 10000,
            userId = "mock-user-id"
        )
    }

    // ... other mock implementations
}
```

### Integration Tests

```kotlin
@Test
fun testCompletionsEndpoint() = runTest {
    val mockWebServer = MockWebServer()
    mockWebServer.start()

    val mockResponse = """
        {
            "id": "test-id",
            "content": "Test response",
            "model": "gpt-4o",
            "tokensUsed": 50,
            "timestamp": 1234567890
        }
    """.trimIndent()

    mockWebServer.enqueue(
        MockResponse()
            .setResponseCode(200)
            .setBody(mockResponse)
    )

    val apiService = createApiService(mockWebServer.url("/"))

    val response = apiService.completions(
        CompletionRequest(
            userId = "test-user",
            content = "Hello",
            model = "gpt-4o"
        )
    )

    assertEquals("Test response", response.content)
    mockWebServer.shutdown()
}
```

## Security Considerations

1. **HTTPS Only**: All API communication must use HTTPS
2. **Certificate Pinning**: Implement certificate pinning for production
3. **Token Storage**: Use EncryptedSharedPreferences for token storage
4. **No Hardcoded Secrets**: Store API keys in gradle.properties (gitignored)
5. **ProGuard**: Enable ProGuard/R8 for release builds to obfuscate code

### Certificate Pinning (Optional)

```kotlin
val certificatePinner = CertificatePinner.Builder()
    .add("api.deepassistant.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    .build()

val okHttpClient = OkHttpClient.Builder()
    .certificatePinner(certificatePinner)
    .build()
```

## Monitoring and Analytics

Track API usage and performance:

```kotlin
class ApiAnalyticsInterceptor @Inject constructor(
    private val analytics: AnalyticsManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val startTime = System.currentTimeMillis()

        val response = try {
            chain.proceed(request)
        } catch (e: Exception) {
            analytics.logApiError(request.url.encodedPath, e)
            throw e
        }

        val duration = System.currentTimeMillis() - startTime

        analytics.logApiCall(
            endpoint = request.url.encodedPath,
            statusCode = response.code,
            duration = duration
        )

        return response
    }
}
```

## Conclusion

This API integration guide provides comprehensive documentation for integrating the Deep Assistant Android application with the existing API Gateway. All endpoints follow RESTful conventions with clear request/response formats and error handling strategies.

For questions or issues, please refer to the main [Architecture Documentation](ANDROID_ARCHITECTURE.md) or open an issue in the repository.
