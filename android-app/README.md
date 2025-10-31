# Deep Assistant Android Application

Official Android client for Deep Assistant - your personal AI assistant available anywhere.

## Overview

The Deep Assistant Android application provides native mobile access to AI-powered conversations, image generation, and other AI services through a clean, modern interface built with Jetpack Compose.

## Features

### Current Features (MVP)
- Multi-model AI chat (GPT-4o, Claude, Llama, DeepSeek)
- Real-time streaming responses
- Token balance management
- Conversation history
- Secure authentication
- Material Design 3 UI

### Planned Features
- Image generation (DALL-E)
- Voice input and audio transcription
- Custom system messages
- Conversation context management
- Offline mode
- Push notifications
- Referral system

## Technical Stack

- **Language**: Kotlin 1.9+
- **Minimum SDK**: Android 8.0 (API 26)
- **Target SDK**: Android 14 (API 34)
- **UI Framework**: Jetpack Compose
- **Architecture**: MVVM + Clean Architecture
- **Dependency Injection**: Hilt
- **Networking**: Retrofit + OkHttp
- **Database**: Room
- **Async**: Kotlin Coroutines + Flow

## Architecture

This project follows Clean Architecture principles with clear separation of concerns:

```
app/
├── presentation/     # UI Layer (Compose, ViewModels)
├── domain/           # Business Logic (Use Cases, Models)
├── data/             # Data Layer (Repositories, API, Database)
└── di/               # Dependency Injection (Hilt Modules)
```

For detailed architecture documentation, see [ANDROID_ARCHITECTURE.md](../ANDROID_ARCHITECTURE.md).

## Getting Started

### Prerequisites

- Android Studio Hedgehog (2023.1.1) or later
- JDK 17
- Android SDK 34
- Kotlin 1.9+

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/deep-assistant/android-app.git
   cd android-app
   ```

2. Create `local.properties` file in the root directory:
   ```properties
   sdk.dir=/path/to/your/Android/Sdk
   ```

3. Create `gradle.properties` with API configuration:
   ```properties
   API_BASE_URL=https://your-api-gateway-url.com
   # Add other configuration as needed
   ```

4. Sync project with Gradle files

5. Run the app on an emulator or physical device

### Configuration

Create a `secrets.properties` file (gitignored) for sensitive values:
```properties
FIREBASE_API_KEY=your_firebase_api_key
SENTRY_DSN=your_sentry_dsn
```

## Project Structure

```
android-app/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/deepassistant/android/
│   │   │   │   ├── presentation/
│   │   │   │   │   ├── chat/         # Chat screen & ViewModel
│   │   │   │   │   ├── auth/         # Authentication flow
│   │   │   │   │   ├── settings/     # Settings screen
│   │   │   │   │   └── common/       # Shared UI components
│   │   │   │   ├── domain/
│   │   │   │   │   ├── model/        # Domain models
│   │   │   │   │   ├── repository/   # Repository interfaces
│   │   │   │   │   └── usecase/      # Business logic
│   │   │   │   ├── data/
│   │   │   │   │   ├── remote/       # API services
│   │   │   │   │   ├── local/        # Room database
│   │   │   │   │   └── repository/   # Repository implementations
│   │   │   │   └── di/               # Hilt modules
│   │   │   └── res/                  # Resources
│   │   └── test/                     # Unit tests
│   └── build.gradle.kts
├── gradle/
├── build.gradle.kts
├── settings.gradle.kts
├── README.md
└── .gitignore
```

## API Integration

The app integrates with the Deep Assistant API Gateway. All API endpoints are documented in the [Architecture document](../ANDROID_ARCHITECTURE.md#api-integration-requirements).

### Authentication

The app uses Bearer token authentication:
```kotlin
Authorization: Bearer {user_token}
```

Tokens are securely stored using EncryptedSharedPreferences.

## Development

### Building

```bash
# Debug build
./gradlew assembleDebug

# Release build
./gradlew assembleRelease

# Run tests
./gradlew test

# Run instrumented tests
./gradlew connectedAndroidTest
```

### Code Style

This project follows the official Kotlin coding conventions and uses `ktlint` for linting:

```bash
# Check code style
./gradlew ktlintCheck

# Format code
./gradlew ktlintFormat
```

### Testing

- **Unit Tests**: Located in `src/test/`
- **Integration Tests**: Located in `src/androidTest/`
- **UI Tests**: Compose UI tests in `src/androidTest/`

Run tests:
```bash
./gradlew test              # Unit tests
./gradlew connectedTest     # Instrumented tests
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Deployment

### Alpha/Beta Testing

The app uses Google Play's internal testing tracks:

1. **Internal Testing**: Team members only
2. **Closed Testing**: Invited testers
3. **Open Testing**: Public beta

### Production Release

Production releases are created through GitHub Actions and uploaded to Google Play Console.

## Monitoring

- **Crash Reporting**: Firebase Crashlytics
- **Analytics**: Firebase Analytics
- **Performance**: Firebase Performance Monitoring

## Security

- All sensitive data is encrypted at rest
- Network communication uses HTTPS/TLS
- Certificate pinning is implemented
- ProGuard/R8 obfuscation for release builds

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/deep-assistant/master-plan/issues)
- Documentation: [Full documentation](https://github.com/deep-assistant/master-plan)

## Acknowledgments

- Built with [Jetpack Compose](https://developer.android.com/jetpack/compose)
- API Gateway by Deep Assistant team
- Icons from [Material Icons](https://fonts.google.com/icons)

## Roadmap

See the main [ROADMAP](https://github.com/deep-assistant/master-plan/issues/4) for the complete development plan.

### Current Status

**Phase**: Architecture & Planning
**Target Release**: Q2 2025

### Milestones

- [x] Architecture design
- [ ] MVP development
- [ ] Alpha testing
- [ ] Beta release
- [ ] Production release on Google Play

## Contact

For questions or feedback, please open an issue in the [master-plan repository](https://github.com/deep-assistant/master-plan/issues).
