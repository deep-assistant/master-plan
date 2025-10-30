# Android Application Architecture

## Overview

The Deep Assistant Android application is a native mobile client that provides users with AI-powered conversational capabilities, image generation, and other AI services. This application will be published on Google Play and serves as the Android platform component of the multi-platform Deep Assistant ecosystem.

**Status**: Architecture Design Phase
**Priority**: Medium | **Complexity**: Very High
**Target Platform**: Android 8.0 (API 26) and above
**Primary Language**: Kotlin
**Architecture Pattern**: MVVM (Model-View-ViewModel) with Clean Architecture principles

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Android Application                     │
│                                                           │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐     │
│  │     UI     │  │  ViewModel  │  │  Repository  │     │
│  │  (Compose) │◄─┤   (Logic)   │◄─┤    (Data)    │     │
│  └────────────┘  └─────────────┘  └──────────────┘     │
│                                           │               │
└───────────────────────────────────────────┼──────────────┘
                                            │
                    ┌───────────────────────┴────────────────┐
                    │                                        │
            ┌───────▼────────┐                   ┌──────────▼──────────┐
            │  API Gateway    │                   │   Local Storage     │
            │ (REST/WebSocket)│                   │  (Room + DataStore) │
            └────────────────┘                   └─────────────────────┘
```

### Technology Stack

#### Core Framework
- **Kotlin 1.9+**: Primary development language
- **Android SDK 26+ (8.0 Oreo)**: Minimum API level for 95%+ device coverage
- **Jetpack Compose**: Modern declarative UI framework
- **Material Design 3**: UI/UX design system

#### Architecture Components
- **ViewModel**: UI state management and business logic
- **LiveData/StateFlow**: Reactive data observation
- **Room Database**: Local data persistence
- **DataStore**: Key-value storage for preferences
- **Navigation Component**: Screen navigation management
- **Hilt**: Dependency injection framework

#### Network Layer
- **Retrofit 2**: REST API communication
- **OkHttp 4**: HTTP client with interceptors
- **Kotlin Coroutines**: Asynchronous operations
- **Kotlin Serialization**: JSON parsing
- **WebSocket (OkHttp)**: Real-time streaming support

#### Additional Libraries
- **Coil**: Image loading and caching
- **Markdown Renderer**: Chat message formatting
- **ExoPlayer**: Media playback (audio messages)
- **WorkManager**: Background task scheduling
- **Firebase Cloud Messaging (optional)**: Push notifications

## Architectural Layers

### 1. Presentation Layer (UI)

**Technology**: Jetpack Compose

**Responsibilities**:
- Render UI components
- Handle user interactions
- Display data from ViewModels
- Navigate between screens

**Key Screens**:
- **OnboardingScreen**: Initial user setup and authentication
- **ChatScreen**: Main conversation interface with AI
- **ModelSelectionScreen**: Choose AI model (GPT-4o, Claude, Llama, etc.)
- **SettingsScreen**: App configuration and preferences
- **ImageGenerationScreen**: DALL-E image creation interface
- **HistoryScreen**: Conversation history browser
- **ProfileScreen**: User profile and token balance
- **PaymentScreen**: Token purchase interface

**UI Components**:
```kotlin
@Composable
fun ChatScreen(
    viewModel: ChatViewModel = hiltViewModel(),
    navController: NavController
) {
    val uiState by viewModel.uiState.collectAsState()

    ChatScaffold(
        messages = uiState.messages,
        isLoading = uiState.isLoading,
        onSendMessage = viewModel::sendMessage,
        onModelSelect = viewModel::selectModel
    )
}
```

### 2. ViewModel Layer

**Technology**: Android ViewModel + Kotlin StateFlow/LiveData

**Responsibilities**:
- Manage UI state
- Process user actions
- Coordinate repository operations
- Handle configuration changes

**Example ViewModel**:
```kotlin
@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val tokenRepository: TokenRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    fun sendMessage(content: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            val result = chatRepository.sendMessage(
                content = content,
                model = _uiState.value.selectedModel,
                systemMessage = _uiState.value.systemMessage
            )

            result.onSuccess { response ->
                _uiState.update {
                    it.copy(
                        messages = it.messages + response,
                        isLoading = false
                    )
                }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(
                        error = error.message,
                        isLoading = false
                    )
                }
            }
        }
    }
}
```

### 3. Domain Layer (Business Logic)

**Responsibilities**:
- Define use cases
- Business rules enforcement
- Model transformations
- Error handling logic

**Key Use Cases**:
- `SendMessageUseCase`: Handle chat message submission
- `GenerateImageUseCase`: Process image generation requests
- `ManageTokenBalanceUseCase`: Track and update user tokens
- `SyncConversationHistoryUseCase`: Synchronize chat history
- `RefreshAuthTokenUseCase`: Handle authentication refresh

### 4. Data Layer (Repository Pattern)

**Responsibilities**:
- Abstract data sources
- Implement caching strategies
- Coordinate remote and local data
- Handle data synchronization

**Key Repositories**:

#### ChatRepository
```kotlin
interface ChatRepository {
    suspend fun sendMessage(
        content: String,
        model: String,
        systemMessage: String?
    ): Result<ChatMessage>

    suspend fun getConversationHistory(): Flow<List<ChatMessage>>
    suspend fun clearHistory(): Result<Unit>
    fun streamMessage(content: String): Flow<String>
}

class ChatRepositoryImpl @Inject constructor(
    private val apiService: ApiGatewayService,
    private val chatDao: ChatDao,
    private val tokenManager: TokenManager
) : ChatRepository {

    override suspend fun sendMessage(
        content: String,
        model: String,
        systemMessage: String?
    ): Result<ChatMessage> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.completions(
                CompletionRequest(
                    userId = tokenManager.getUserId(),
                    content = content,
                    model = model,
                    systemMessage = systemMessage
                )
            )

            // Save to local database
            chatDao.insertMessage(response.toChatEntity())

            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

#### TokenRepository
```kotlin
interface TokenRepository {
    suspend fun getBalance(): Result<Int>
    suspend fun refreshBalance(): Result<Int>
    fun observeBalance(): Flow<Int>
}
```

#### UserRepository
```kotlin
interface UserRepository {
    suspend fun authenticate(token: String): Result<User>
    suspend fun getCurrentUser(): User?
    suspend fun updateProfile(profile: UserProfile): Result<Unit>
}
```

### 5. Network Layer (API Integration)

**API Gateway Integration**: The Android app communicates with the existing API Gateway service.

**Base Configuration**:
```kotlin
interface ApiGatewayService {

    @POST("v1/chat/completions")
    suspend fun completions(
        @Body request: CompletionRequest
    ): CompletionResponse

    @GET("token")
    suspend fun getTokenBalance(): TokenBalanceResponse

    @PUT("token")
    suspend fun updateTokenBalance(
        @Body request: TokenUpdateRequest
    ): TokenBalanceResponse

    @GET("dialog")
    suspend fun getDialogHistory(): DialogHistoryResponse

    @DELETE("dialog")
    suspend fun clearDialog(): Unit

    @POST("v1/audio/transcriptions")
    suspend fun transcribeAudio(
        @Body request: TranscriptionRequest
    ): TranscriptionResponse

    @POST("referral")
    suspend fun createReferral(
        @Body request: ReferralRequest
    ): ReferralResponse
}
```

**Authentication**:
```kotlin
class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        val token = tokenManager.getUserToken()
        val authenticatedRequest = originalRequest.newBuilder()
            .header("Authorization", "Bearer $token")
            .build()

        return chain.proceed(authenticatedRequest)
    }
}
```

**WebSocket Support for Streaming**:
```kotlin
class StreamingChatService @Inject constructor(
    private val okHttpClient: OkHttpClient,
    private val tokenManager: TokenManager
) {

    fun streamCompletion(
        content: String,
        model: String
    ): Flow<String> = callbackFlow {
        val request = Request.Builder()
            .url("${BASE_URL}/v1/chat/completions")
            .header("Authorization", "Bearer ${tokenManager.getUserToken()}")
            .post(createStreamingRequestBody(content, model))
            .build()

        val webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                trySend(text)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                close(t)
            }
        })

        awaitClose { webSocket.close(1000, null) }
    }
}
```

### 6. Local Storage Layer

#### Room Database Schema

**Entities**:
```kotlin
@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val content: String,
    val role: String, // "user" or "assistant"
    val model: String,
    val timestamp: Long,
    val tokenCount: Int
)

@Entity(tableName = "conversations")
data class ConversationEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val createdAt: Long,
    val lastMessageAt: Long
)

@Entity(tableName = "user_preferences")
data class UserPreferencesEntity(
    @PrimaryKey
    val userId: String,
    val selectedModel: String,
    val systemMessage: String?,
    val theme: String
)
```

**DAOs**:
```kotlin
@Dao
interface ChatDao {
    @Query("SELECT * FROM messages ORDER BY timestamp DESC")
    fun getAllMessages(): Flow<List<MessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity)

    @Query("DELETE FROM messages")
    suspend fun clearAllMessages()
}
```

#### DataStore for Preferences
```kotlin
class PreferencesManager @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    val userToken: Flow<String?> = dataStore.data
        .map { it[USER_TOKEN_KEY] }

    suspend fun saveUserToken(token: String) {
        dataStore.edit { preferences ->
            preferences[USER_TOKEN_KEY] = token
        }
    }

    companion object {
        private val USER_TOKEN_KEY = stringPreferencesKey("user_token")
    }
}
```

## Dependency Injection (Hilt)

**Application Module**:
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(Json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    @Provides
    @Singleton
    fun provideApiGatewayService(retrofit: Retrofit): ApiGatewayService {
        return retrofit.create(ApiGatewayService::class.java)
    }

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "deep_assistant_db"
        ).build()
    }
}
```

## Key Features Implementation

### 1. Multi-Model Support

**Supported Models**:
- OpenAI: GPT-4o, GPT-4o-mini, o1-mini, o3-mini
- Anthropic: Claude 3.5 Sonnet, Claude 3.5 Haiku
- Meta: Llama 3.1 405B, Llama 3.1 70B
- DeepSeek: DeepSeek-V3, DeepSeek-R1

**Model Selection UI**:
```kotlin
@Composable
fun ModelSelector(
    selectedModel: String,
    onModelSelected: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded }
    ) {
        TextField(
            value = selectedModel,
            onValueChange = {},
            readOnly = true,
            label = { Text("AI Model") }
        )

        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            ModelRegistry.models.forEach { model ->
                DropdownMenuItem(
                    text = { Text(model.displayName) },
                    onClick = {
                        onModelSelected(model.id)
                        expanded = false
                    }
                )
            }
        }
    }
}
```

### 2. Real-Time Streaming

**Streaming Implementation**:
```kotlin
class ChatViewModel @Inject constructor(
    private val streamingService: StreamingChatService
) : ViewModel() {

    fun sendStreamingMessage(content: String) {
        viewModelScope.launch {
            streamingService.streamCompletion(content, selectedModel)
                .collect { chunk ->
                    _uiState.update { state ->
                        state.copy(
                            currentStreamingMessage = state.currentStreamingMessage + chunk
                        )
                    }
                }
        }
    }
}
```

### 3. Token Management

**Balance Tracking**:
```kotlin
@Composable
fun TokenBalanceIndicator(
    viewModel: TokenViewModel = hiltViewModel()
) {
    val balance by viewModel.balance.collectAsState()

    Card(
        modifier = Modifier.padding(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Filled.Token, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Balance: $balance tokens")
            Spacer(modifier = Modifier.weight(1f))
            Button(onClick = { /* Navigate to payment */ }) {
                Text("Add Tokens")
            }
        }
    }
}
```

### 4. Image Generation

**DALL-E Integration**:
```kotlin
class ImageGenerationViewModel @Inject constructor(
    private val imageRepository: ImageRepository
) : ViewModel() {

    fun generateImage(prompt: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isGenerating = true) }

            imageRepository.generateImage(prompt)
                .onSuccess { imageUrl ->
                    _uiState.update {
                        it.copy(
                            generatedImageUrl = imageUrl,
                            isGenerating = false
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            error = error.message,
                            isGenerating = false
                        )
                    }
                }
        }
    }
}
```

### 5. Conversation History

**History Management**:
```kotlin
@Composable
fun ConversationHistoryScreen(
    viewModel: HistoryViewModel = hiltViewModel()
) {
    val conversations by viewModel.conversations.collectAsState()

    LazyColumn {
        items(conversations) { conversation ->
            ConversationCard(
                conversation = conversation,
                onClick = { viewModel.loadConversation(conversation.id) },
                onDelete = { viewModel.deleteConversation(conversation.id) }
            )
        }
    }
}
```

## Authentication & Security

### Authentication Flow

1. **Initial Launch**: User prompted for authentication token
2. **Token Validation**: API Gateway validates token
3. **Secure Storage**: Token stored in EncryptedSharedPreferences
4. **Auto-Refresh**: Token refreshed before expiration
5. **Logout**: Clear all local data and tokens

**Security Implementation**:
```kotlin
class SecureTokenManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val encryptedPrefs = EncryptedSharedPreferences.create(
        "secure_prefs",
        MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build(),
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveToken(token: String) {
        encryptedPrefs.edit()
            .putString(TOKEN_KEY, token)
            .apply()
    }

    fun getToken(): String? {
        return encryptedPrefs.getString(TOKEN_KEY, null)
    }
}
```

## Error Handling Strategy

### Error Types
1. **Network Errors**: Connectivity issues, timeouts
2. **API Errors**: 401 (unauthorized), 429 (rate limit), 500 (server error)
3. **Validation Errors**: Invalid input, insufficient tokens
4. **Local Storage Errors**: Database failures

**Error Handling Implementation**:
```kotlin
sealed class AppError {
    data class NetworkError(val message: String) : AppError()
    data class ApiError(val code: Int, val message: String) : AppError()
    data class InsufficientTokens(val required: Int, val available: Int) : AppError()
    data class ValidationError(val field: String, val message: String) : AppError()
}

@Composable
fun ErrorDisplay(error: AppError) {
    Snackbar(
        action = {
            TextButton(onClick = { /* Retry logic */ }) {
                Text("RETRY")
            }
        }
    ) {
        Text(error.toUserFriendlyMessage())
    }
}
```

## Performance Optimization

### Caching Strategy
- **Memory Cache**: Recent conversations (LRU cache)
- **Disk Cache**: Message history (Room database)
- **Image Cache**: Generated images (Coil library)
- **API Response Cache**: Model list, token rates

### Background Processing
```kotlin
class SyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            syncConversationHistory()
            syncTokenBalance()
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}

// Schedule periodic sync
WorkManager.getInstance(context).enqueueUniquePeriodicWork(
    "sync_work",
    ExistingPeriodicWorkPolicy.KEEP,
    PeriodicWorkRequestBuilder<SyncWorker>(15, TimeUnit.MINUTES).build()
)
```

## Testing Strategy

### Unit Tests
- ViewModels (business logic)
- Repositories (data operations)
- Use cases (domain logic)
- Utilities and helpers

### Integration Tests
- API service integration
- Database operations
- Repository with real database

### UI Tests (Compose)
```kotlin
@Test
fun testChatMessageSending() {
    composeTestRule.setContent {
        ChatScreen()
    }

    composeTestRule.onNodeWithText("Type a message")
        .performTextInput("Hello AI")

    composeTestRule.onNodeWithContentDescription("Send")
        .performClick()

    composeTestRule.onNodeWithText("Hello AI")
        .assertIsDisplayed()
}
```

## Deployment & Distribution

### Build Configuration

**build.gradle.kts**:
```kotlin
android {
    compileSdk = 34

    defaultConfig {
        applicationId = "com.deepassistant.android"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.3"
    }
}

dependencies {
    // Core Android
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")

    // Compose
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.5")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.48")
    kapt("com.google.dagger:hilt-compiler:2.48")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")

    // Database
    implementation("androidx.room:room-runtime:2.6.0")
    implementation("androidx.room:room-ktx:2.6.0")
    kapt("androidx.room:room-compiler:2.6.0")

    // DataStore
    implementation("androidx.datastore:datastore-preferences:1.0.0")

    // Image Loading
    implementation("io.coil-kt:coil-compose:2.5.0")

    // Markdown
    implementation("com.github.jeziellago:compose-markdown:0.3.4")

    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
}
```

### Google Play Store Preparation

**Required Assets**:
1. App icon (512x512 px)
2. Feature graphic (1024x500 px)
3. Screenshots (minimum 2, recommended 8)
4. Privacy policy URL
5. App description (short and full)
6. Content rating questionnaire
7. Target audience and content

**Store Listing**:
- **Title**: Deep Assistant - AI Chat & More
- **Short Description**: Personal AI assistant with multiple models, image generation, and more
- **Category**: Productivity
- **Content Rating**: Everyone
- **Privacy Policy**: Link to organization's privacy policy

### Release Process

1. **Alpha Testing**: Internal testing with team
2. **Closed Beta**: Limited user testing (100-1000 users)
3. **Open Beta**: Public beta testing
4. **Production Release**: Full public release

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Android CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Grant execute permission for gradlew
      run: chmod +x gradlew

    - name: Build with Gradle
      run: ./gradlew build

    - name: Run tests
      run: ./gradlew test

    - name: Build APK
      run: ./gradlew assembleRelease

    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-release
        path: app/build/outputs/apk/release/app-release.apk
```

## Monitoring & Analytics

### Crash Reporting
- **Firebase Crashlytics**: Real-time crash reporting
- **Custom error tracking**: Log critical errors to backend

### Analytics
- **Firebase Analytics**: User behavior tracking
- **Custom events**: Track feature usage, model selection, token usage

**Analytics Implementation**:
```kotlin
class AnalyticsManager @Inject constructor(
    private val firebaseAnalytics: FirebaseAnalytics
) {
    fun logModelSelection(model: String) {
        firebaseAnalytics.logEvent("model_selected") {
            param("model_name", model)
        }
    }

    fun logMessageSent(model: String, tokenCost: Int) {
        firebaseAnalytics.logEvent("message_sent") {
            param("model", model)
            param("tokens_used", tokenCost.toLong())
        }
    }
}
```

## Future Enhancements

### Phase 2 Features
1. **Offline Mode**: Cache conversations for offline access
2. **Voice Input**: Speech-to-text for message input
3. **Widgets**: Home screen widgets for quick access
4. **Shortcuts**: Dynamic shortcuts for frequent actions
5. **Wear OS Support**: Companion app for Android watches
6. **Tablet Optimization**: Multi-pane layouts for tablets

### Phase 3 Features
1. **Multi-Account Support**: Switch between multiple accounts
2. **Conversation Sharing**: Export and share conversations
3. **Custom Themes**: User-defined color schemes
4. **Plugin System**: Extensible functionality
5. **Advanced Search**: Full-text search across conversations

## Development Roadmap

### Milestone 1: MVP (4-6 weeks)
- [ ] Project setup and architecture
- [ ] Basic UI with Compose
- [ ] API Gateway integration
- [ ] Authentication flow
- [ ] Chat functionality
- [ ] Model selection
- [ ] Local storage

### Milestone 2: Beta (6-8 weeks)
- [ ] Image generation
- [ ] Token management
- [ ] Conversation history
- [ ] Error handling improvements
- [ ] Performance optimization
- [ ] Beta testing with users

### Milestone 3: Release (8-10 weeks)
- [ ] Google Play Console setup
- [ ] Store listing preparation
- [ ] Final testing and bug fixes
- [ ] Documentation
- [ ] Production deployment
- [ ] Marketing materials

## API Integration Requirements

### Required Endpoints
All endpoints from the existing API Gateway:

1. **POST /v1/chat/completions** - Send chat messages
2. **GET /token** - Get token balance
3. **PUT /token** - Update token balance
4. **DELETE /dialog** - Clear conversation history
5. **POST /v1/audio/transcriptions** - Transcribe audio
6. **POST /referral** - Create referral link

### Authentication
- Bearer token in Authorization header
- Token stored securely in EncryptedSharedPreferences
- Automatic token refresh on expiration

### Error Handling
- 401: Redirect to login
- 429: Display "insufficient tokens" message
- 500: Retry with exponential backoff

## Security Considerations

1. **Data Encryption**: All sensitive data encrypted at rest
2. **Secure Communication**: HTTPS/TLS for all API calls
3. **Certificate Pinning**: Prevent MITM attacks
4. **ProGuard/R8**: Code obfuscation for release builds
5. **No Hardcoded Secrets**: API keys in gradle.properties (gitignored)
6. **Biometric Authentication**: Optional fingerprint/face unlock

## Conclusion

This architecture provides a solid foundation for the Deep Assistant Android application. It leverages modern Android development practices, ensures scalability, and integrates seamlessly with the existing API Gateway infrastructure. The modular design allows for easy feature additions and maintenance while providing an excellent user experience.

**Next Steps**:
1. Create GitHub repository for android-app
2. Set up initial project structure
3. Implement core architecture components
4. Begin MVP development
5. Set up CI/CD pipeline
6. Prepare for alpha testing
