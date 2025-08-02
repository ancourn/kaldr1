import SwiftUI

struct ContentView: View {
    @EnvironmentObject var walletManager: WalletManager
    @EnvironmentObject var biometricManager: BiometricManager
    @State private var selectedTab = 0
    @State private var showOnboarding = false
    
    var body: some View {
        Group {
            if walletManager.isWalletCreated {
                mainContentView
            } else {
                onboardingView
            }
        }
        .onAppear {
            checkWalletStatus()
        }
    }
    
    private var mainContentView: some View {
        TabView(selection: $selectedTab) {
            WalletView()
                .tabItem {
                    Image(systemName: "wallet.pass")
                    Text("Wallet")
                }
                .tag(0)
            
            SendView()
                .tabItem {
                    Image(systemName: "paperplane")
                    Text("Send")
                }
                .tag(1)
            
            ReceiveView()
                .tabItem {
                    Image(systemName: "qrcode")
                    Text("Receive")
                }
                .tag(2)
            
            TransactionView()
                .tabItem {
                    Image(systemName: "list.bullet")
                    Text("Transactions")
                }
                .tag(3)
            
            SettingsView()
                .tabItem {
                    Image(systemName: "gear")
                    Text("Settings")
                }
                .tag(4)
        }
        .accentColor(.blue)
        .preferredColorScheme(.dark)
    }
    
    private var onboardingView: some View {
        NavigationView {
            VStack(spacing: 30) {
                Image(systemName: "shield.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.blue)
                
                Text("KALDRIX Wallet")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Quantum-Resistant Blockchain Wallet")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                VStack(spacing: 16) {
                    Button(action: {
                        createNewWallet()
                    }) {
                        HStack {
                            Image(systemName: "plus.circle")
                            Text("Create New Wallet")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    
                    Button(action: {
                        // Show import wallet view
                    }) {
                        HStack {
                            Image(systemName: "doc.text")
                            Text("Import Existing Wallet")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.gray.opacity(0.2))
                        .foregroundColor(.primary)
                        .cornerRadius(10)
                    }
                }
            }
            .padding()
            .navigationTitle("Welcome")
            .navigationBarTitleDisplayMode(.large)
        }
    }
    
    private func checkWalletStatus() {
        Task {
            await walletManager.checkWalletStatus()
        }
    }
    
    private func createNewWallet() {
        Task {
            do {
                if await biometricManager.isBiometricAvailable {
                    let authenticated = await biometricManager.authenticate()
                    if authenticated {
                        try await walletManager.createWallet()
                    }
                } else {
                    try await walletManager.createWallet()
                }
            } catch {
                print("Failed to create wallet: \(error)")
            }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(WalletManager())
        .environmentObject(NotificationManager())
        .environmentObject(BiometricManager())
}