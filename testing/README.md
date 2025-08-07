# KALDRIX Mobile App Testing Suite

## Overview
This directory contains comprehensive test suites for both iOS and Android mobile applications to ensure production quality standards.

## Structure
```
testing/
├── ios/                    # iOS application tests
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── ui/                # UI tests
│   └── performance/       # Performance tests
├── android/               # Android application tests
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── performance/       # Performance tests
├── shared/                # Shared testing utilities
│   ├── fixtures/          # Test fixtures and mock data
│   ├── helpers/           # Test helpers and utilities
│   └── common/            # Common test configurations
└── reports/               # Test reports and results
```

## Test Coverage Goals
- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: All critical user flows
- **UI Tests**: All major screens and interactions
- **Performance Tests**: All key performance metrics

## Running Tests

### iOS Tests
```bash
# Run all iOS tests
cd mobile-sdk/ios/KaldrixWallet
xcodebuild test -scheme KaldrixWallet -destination 'platform=iOS Simulator,name=iPhone 14'

# Run specific test types
xcodebuild test -scheme KaldrixWallet -destination 'platform=iOS Simulator,name=iPhone 14' -only-testing:KaldrixWalletUnitTests
xcodebuild test -scheme KaldrixWallet -destination 'platform=iOS Simulator,name=iPhone 14' -only-testing:KaldrixWalletIntegrationTests
xcodebuild test -scheme KaldrixWallet -destination 'platform=iOS Simulator,name=iPhone 14' -only-testing:KaldrixWalletUITests
```

### Android Tests
```bash
# Run all Android tests
cd mobile-sdk/android
./gradlew test

# Run specific test types
./gradlew testDebugUnitTest
./gradlew connectedDebugAndroidTest
./gradlew createDebugCoverageReport
```

## Test Categories

### Unit Tests
- Wallet functionality
- Transaction processing
- Cryptographic operations
- Network communication
- Data persistence

### Integration Tests
- Wallet to blockchain integration
- Transaction flow end-to-end
- Authentication flows
- Data synchronization
- Error handling scenarios

### UI Tests
- Login and registration
- Wallet management
- Transaction creation and confirmation
- Settings and preferences
- Biometric authentication

### Performance Tests
- App startup time
- Transaction processing speed
- Memory usage
- Battery consumption
- Network performance

## Continuous Integration
Tests are automatically run on:
- Every pull request
- Every merge to main branch
- Daily scheduled runs
- Before production releases

## Test Reports
Test results are generated in:
- JUnit XML format
- HTML reports with coverage
- Performance metrics
- Screenshots for UI test failures