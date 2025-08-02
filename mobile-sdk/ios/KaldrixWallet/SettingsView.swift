import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var walletManager: WalletManager
    @EnvironmentObject var biometricManager: BiometricManager
    @EnvironmentObject var notificationManager: NotificationManager
    @State private var showingBackupSheet = false
    @State private var showingRestoreSheet = false
    @State private var showingAboutSheet = false
    @State private var showingLogoutAlert = false
    @State private var biometricEnabled = true
    @State private var notificationsEnabled = true
    @State private var darkModeEnabled = true
    @State private var currency = "USD"
    
    let currencies = ["USD", "EUR", "GBP", "JPY", "CNY"]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Security Section
                    securitySection
                    
                    // Notifications Section
                    notificationsSection
                    
                    // Appearance Section
                    appearanceSection
                    
                    // About Section
                    aboutSection
                    
                    // Danger Zone
                    dangerZone
                }
                .padding()
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showingBackupSheet) {
                BackupWalletView()
            }
            .sheet(isPresented: $showingRestoreSheet) {
                RestoreWalletView()
            }
            .sheet(isPresented: $showingAboutSheet) {
                AboutView()
            }
            .alert("Logout", isPresented: $showingLogoutAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Logout", role: .destructive) {
                    logout()
                }
            } message: {
                Text("Are you sure you want to logout? Make sure you have backed up your wallet.")
            }
        }
    }
    
    private var securitySection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Security")
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(spacing: 12) {
                if biometricManager.isBiometricAvailable {
                    Toggle(isOn: $biometricEnabled) {
                        HStack {
                            Image(systemName: biometricManager.getBiometricIcon())
                                .foregroundColor(.blue)
                            VStack(alignment: .leading) {
                                Text(biometricManager.getBiometricName())
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                Text("Use biometric authentication")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .toggleStyle(SwitchToggleStyle(tint: .blue))
                }
                
                Button(action: {
                    showingBackupSheet = true
                }) {
                    HStack {
                        Image(systemName: "square.and.arrow.down")
                            .foregroundColor(.blue)
                        VStack(alignment: .leading) {
                            Text("Backup Wallet")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text("Save your recovery phrase")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(10)
                }
                
                Button(action: {
                    showingRestoreSheet = true
                }) {
                    HStack {
                        Image(systemName: "square.and.arrow.up")
                            .foregroundColor(.blue)
                        VStack(alignment: .leading) {
                            Text("Restore Wallet")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text("Import from backup")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(10)
                }
            }
        }
    }
    
    private var notificationsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Notifications")
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(spacing: 12) {
                Toggle(isOn: $notificationsEnabled) {
                    HStack {
                        Image(systemName: "bell")
                            .foregroundColor(.blue)
                        VStack(alignment: .leading) {
                            Text("Push Notifications")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text("Get notified about transactions")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .toggleStyle(SwitchToggleStyle(tint: .blue))
                
                Button(action: {
                    // Open notification settings
                }) {
                    HStack {
                        Image(systemName: "gear")
                            .foregroundColor(.blue)
                        VStack(alignment: .leading) {
                            Text("Notification Settings")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text("Customize notification preferences")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(10)
                }
            }
        }
    }
    
    private var appearanceSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Appearance")
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(spacing: 12) {
                Toggle(isOn: $darkModeEnabled) {
                    HStack {
                        Image(systemName: "moon")
                            .foregroundColor(.blue)
                        VStack(alignment: .leading) {
                            Text("Dark Mode")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text("Use dark theme")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .toggleStyle(SwitchToggleStyle(tint: .blue))
                
                HStack {
                    Image(systemName: "dollarsign.circle")
                        .foregroundColor(.blue)
                    VStack(alignment: .leading) {
                        Text("Currency")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        Text("Display currency")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    Picker("Currency", selection: $currency) {
                        ForEach(currencies, id: \.self) { currency in
                            Text(currency).tag(currency)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                }
                .padding()
                .background(Color.gray.opacity(0.05))
                .cornerRadius(10)
            }
        }
    }
    
    private var aboutSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("About")
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(spacing: 12) {
                Button(action: {
                    showingAboutSheet = true
                }) {
                    HStack {
                        Image(systemName: "info.circle")
                            .foregroundColor(.blue)
                        VStack(alignment: .leading) {
                            Text("About KALDRIX")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text("Version 1.0.0")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(10)
                }
                
                Button(action: {
                    // Open help center
                }) {
                    HStack {
                        Image(systemName: "questionmark.circle")
                            .foregroundColor(.blue)
                        VStack(alignment: .leading) {
                            Text("Help & Support")
                                .font(.subheadline)
                            Text("Get help and contact support")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(10)
                }
                
                Link(destination: URL(string: "https://kaldrix.io/privacy")!) {
                    HStack {
                        Image(systemName: "lock.shield")
                            .foregroundColor(.blue)
                        VStack(alignment: .leading) {
                            Text("Privacy Policy")
                                .font(.subheadline)
                            Text("Read our privacy policy")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(10)
                }
                
                Link(destination: URL(string: "https://kaldrix.io/terms")!) {
                    HStack {
                        Image(systemName: "doc.text")
                            .foregroundColor(.blue)
                        VStack(alignment: .leading) {
                            Text("Terms of Service")
                                .font(.subheadline)
                            Text("Read our terms of service")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(10)
                }
            }
        }
    }
    
    private var dangerZone: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Danger Zone")
                .font(.headline)
                .foregroundColor(.red)
            
            VStack(spacing: 12) {
                Button(action: {
                    showingLogoutAlert = true
                }) {
                    HStack {
                        Image(systemName: "arrow.right.square")
                            .foregroundColor(.red)
                        VStack(alignment: .leading) {
                            Text("Logout")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.red)
                            Text("Remove wallet from this device")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(10)
                }
            }
        }
    }
    
    private func logout() {
        Task {
            do {
                try await walletManager.sdk.logout()
                // Clear local data and reset state
                walletManager.isWalletCreated = false
                walletManager.currentWallet = nil
                walletManager.balance = 0
                walletManager.recentTransactions = []
            } catch {
                print("Failed to logout: \(error)")
            }
        }
    }
}

struct BackupWalletView: View {
    @EnvironmentObject var walletManager: WalletManager
    @EnvironmentObject var biometricManager: BiometricManager
    @State private var backupPhrase = ""
    @State private var isShowingPhrase = false
    @State private var hasConfirmed = false
    @State private var isLoading = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Warning Section
                    warningSection
                    
                    // Backup Phrase Section
                    backupPhraseSection
                    
                    // Confirmation Section
                    confirmationSection
                    
                    // Action Button
                    actionButton
                }
                .padding()
            }
            .navigationTitle("Backup Wallet")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    private var warningSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 40))
                .foregroundColor(.orange)
            
            Text("Important Security Notice")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            Text("This recovery phrase is the only way to restore your wallet if you lose access to this device. Never share it with anyone and store it securely.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .background(Color.orange.opacity(0.1))
        .cornerRadius(15)
    }
    
    private var backupPhraseSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recovery Phrase")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button(action: {
                    isShowingPhrase.toggle()
                }) {
                    Image(systemName: isShowingPhrase ? "eye.slash" : "eye")
                        .foregroundColor(.blue)
                }
            }
            
            if isShowingPhrase {
                Text(backupPhrase)
                    .font(.system(.body, design: .monospaced))
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.leading)
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(10)
            } else {
                Text("• • • • • • • • • • • • • • • • • • • • • • • • •")
                    .font(.system(.body, design: .monospaced))
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.leading)
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(10)
            }
            
            Button(action: {
                copyPhrase()
            }) {
                HStack {
                    Image(systemName: "doc.on.doc")
                    Text("Copy to Clipboard")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue.opacity(0.1))
                .foregroundColor(.blue)
                .cornerRadius(10)
            }
        }
    }
    
    private var confirmationSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("I understand that:")
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: hasConfirmed ? "checkmark.circle.fill" : "circle")
                        .foregroundColor(hasConfirmed ? .green : .gray)
                    Text("I have securely stored my recovery phrase")
                        .font(.subheadline)
                        .foregroundColor(.primary)
                }
                .contentShape(Rectangle())
                .onTapGesture {
                    hasConfirmed.toggle()
                }
            }
        }
    }
    
    private var actionButton: some View {
        Button(action: {
            generateBackupPhrase()
        }) {
            HStack {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.8)
                } else {
                    Text(backupPhrase.isEmpty ? "Generate Recovery Phrase" : "Done")
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(hasConfirmed && !backupPhrase.isEmpty ? Color.blue : Color.gray)
            .foregroundColor(.white)
            .cornerRadius(10)
        }
        .disabled(!hasConfirmed || (backupPhrase.isEmpty && !isLoading))
    }
    
    private func generateBackupPhrase() {
        isLoading = true
        
        Task {
            do {
                let authenticated = await biometricManager.authenticate()
                if authenticated {
                    backupPhrase = try await walletManager.backupWallet()
                }
            } catch {
                print("Failed to generate backup phrase: \(error)")
            }
            isLoading = false
        }
    }
    
    private func copyPhrase() {
        UIPasteboard.general.string = backupPhrase
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
    }
}

struct RestoreWalletView: View {
    @EnvironmentObject var walletManager: WalletManager
    @EnvironmentObject var biometricManager: BiometricManager
    @State private var recoveryPhrase = ""
    @State private var isLoading = false
    @State private var errorMessage = ""
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Warning Section
                    warningSection
                    
                    // Recovery Phrase Input
                    recoveryPhraseInput
                    
                    // Action Button
                    actionButton
                }
                .padding()
            }
            .navigationTitle("Restore Wallet")
            .navigationBarTitleDisplayMode(.inline)
            .alert("Error", isPresented: .constant(!errorMessage.isEmpty)) {
                Button("OK") { errorMessage = "" }
            } message: {
                Text(errorMessage)
            }
        }
    }
    
    private var warningSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 40))
                .foregroundColor(.orange)
            
            Text("Restore from Backup")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            Text("Enter your recovery phrase to restore your wallet. Make sure you are in a private and secure location.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .background(Color.orange.opacity(0.1))
        .cornerRadius(15)
    }
    
    private var recoveryPhraseInput: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recovery Phrase")
                .font(.headline)
                .foregroundColor(.primary)
            
            TextEditor(text: $recoveryPhrase)
                .font(.system(.body, design: .monospaced))
                .frame(height: 120)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )
            
            Text("Enter your 12 or 24-word recovery phrase separated by spaces")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
    
    private var actionButton: some View {
        Button(action: {
            restoreWallet()
        }) {
            HStack {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.8)
                } else {
                    Text("Restore Wallet")
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(canRestore ? Color.blue : Color.gray)
            .foregroundColor(.white)
            .cornerRadius(10)
        }
        .disabled(!canRestore || isLoading)
    }
    
    private var canRestore: Bool {
        let words = recoveryPhrase.split(separator: " ")
        return words.count == 12 || words.count == 24
    }
    
    private func restoreWallet() {
        isLoading = true
        
        Task {
            do {
                let authenticated = await biometricManager.authenticate()
                if authenticated {
                    try await walletManager.restoreWallet(backupPhrase: recoveryPhrase)
                    errorMessage = "Wallet restored successfully!"
                }
            } catch {
                errorMessage = "Failed to restore wallet: \(error.localizedDescription)"
            }
            isLoading = false
        }
    }
}

struct AboutView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // App Logo and Name
                    appHeader
                    
                    // Version Information
                    versionInfo
                    
                    // Description
                    description
                    
                    // Links
                    linksSection
                    
                    // Team Information
                    teamSection
                }
                .padding()
            }
            .navigationTitle("About")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    private var appHeader: some View {
        VStack(spacing: 16) {
            Image(systemName: "shield.fill")
                .font(.system(size: 60))
                .foregroundColor(.blue)
            
            Text("KALDRIX Wallet")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            Text("Quantum-Resistant Blockchain Wallet")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
    
    private var versionInfo: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Version Information")
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(spacing: 4) {
                HStack {
                    Text("Version:")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("1.0.0")
                        .font(.subheadline)
                        .foregroundColor(.primary)
                }
                
                HStack {
                    Text("Build:")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("2024.03.15")
                        .font(.subheadline)
                        .foregroundColor(.primary)
                }
                
                HStack {
                    Text("SDK Version:")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("1.0.0")
                        .font(.subheadline)
                        .foregroundColor(.primary)
                }
            }
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .cornerRadius(10)
    }
    
    private var description: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("About KALDRIX")
                .font(.headline)
                .foregroundColor(.primary)
            
            Text("""
            KALDRIX is a quantum-resistant blockchain platform that combines DAG-based consensus with post-quantum cryptography. Our mobile wallet provides secure, fast, and easy-to-use access to the KALDRIX ecosystem.
            
            Features:
            • Quantum-resistant cryptography
            • Fast and secure transactions
            • Biometric authentication
            • Multi-signature support
            • Hardware wallet integration
            """)
            .font(.subheadline)
            .foregroundColor(.secondary)
        }
    }
    
    private var linksSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Links")
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(spacing: 8) {
                Link(destination: URL(string: "https://kaldrix.io")!) {
                    HStack {
                        Image(systemName: "globe")
                            .foregroundColor(.blue)
                        Text("Official Website")
                        Spacer()
                        Image(systemName: "arrow.up.right.square")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(10)
                }
                
                Link(destination: URL(string: "https://docs.kaldrix.io")!) {
                    HStack {
                        Image(systemName: "doc.text")
                            .foregroundColor(.blue)
                        Text("Documentation")
                        Spacer()
                        Image(systemName: "arrow.up.right.square")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(10)
                }
                
                Link(destination: URL(string: "https://github.com/kaldrix")!) {
                    HStack {
                        Image(systemName: "mark.github")
                            .foregroundColor(.blue)
                        Text("GitHub")
                        Spacer()
                        Image(systemName: "arrow.up.right.square")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(10)
                }
            }
        }
    }
    
    private var teamSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Team")
                .font(.headline)
                .foregroundColor(.primary)
            
            Text("""
            KALDRIX is developed by a team of experienced blockchain engineers, cryptographers, and security experts dedicated to building the future of quantum-resistant blockchain technology.
            """)
            .font(.subheadline)
            .foregroundColor(.secondary)
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(WalletManager())
        .environmentObject(BiometricManager())
        .environmentObject(NotificationManager())
}