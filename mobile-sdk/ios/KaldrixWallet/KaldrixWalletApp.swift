import SwiftUI
import KaldrixSDK

@main
struct KaldrixWalletApp: App {
    @StateObject private var walletManager = WalletManager()
    @StateObject private var notificationManager = NotificationManager()
    @StateObject private var biometricManager = BiometricManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(walletManager)
                .environmentObject(notificationManager)
                .environmentObject(biometricManager)
                .onAppear {
                    setupApp()
                }
        }
    }
    
    private func setupApp() {
        // Initialize Kaldrix SDK
        let config = KaldrixConfig(
            network: .mainnet,
            apiEndpoint: URL(string: "https://api.kaldrix.io")!,
            websocketEndpoint: URL(string: "wss://api.kaldrix.io")!,
            enableBiometrics: true,
            enableNotifications: true,
            logLevel: .info
        )
        
        Task {
            do {
                try await KaldrixSDK.shared.initialize(config: config)
                await notificationManager.requestAuthorization()
                await biometricManager.checkBiometricAvailability()
            } catch {
                print("Failed to initialize Kaldrix SDK: \(error)")
            }
        }
    }
}