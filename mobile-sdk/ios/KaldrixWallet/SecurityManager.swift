import Foundation
import LocalAuthentication
import SwiftUI

@MainActor
class SecurityManager: ObservableObject {
    @Published var isBiometricAvailable = false
    @Published var biometricType: LABiometricType = .none
    @Published var isAuthenticated = false
    @Published var errorMessage = ""
    
    private let context = LAContext()
    
    init() {
        checkBiometricAvailability()
    }
    
    func checkBiometricAvailability() async {
        var error: NSError?
        
        if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
            isBiometricAvailable = true
            biometricType = context.biometryType
        } else {
            isBiometricAvailable = false
            biometricType = .none
            
            if let error = error {
                errorMessage = "Biometric authentication not available: \(error.localizedDescription)"
            }
        }
    }
    
    func authenticate() async -> Bool {
        guard isBiometricAvailable else {
            errorMessage = "Biometric authentication not available"
            return false
        }
        
        let reason = "Authenticate to access your KALDRIX wallet"
        
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
            
            if success {
                isAuthenticated = true
                return true
            }
        } catch {
            errorMessage = "Authentication failed: \(error.localizedDescription)"
            isAuthenticated = false
            return false
        }
        
        return false
    }
    
    func authenticateWithPasscode() async -> Bool {
        let reason = "Enter your passcode to access your KALDRIX wallet"
        
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthentication,
                localizedReason: reason
            )
            
            if success {
                isAuthenticated = true
                return true
            }
        } catch {
            errorMessage = "Passcode authentication failed: \(error.localizedDescription)"
            isAuthenticated = false
            return false
        }
        
        return false
    }
    
    func getBiometricName() -> String {
        switch biometricType {
        case .faceID:
            return "Face ID"
        case .touchID:
            return "Touch ID"
        default:
            return "Biometric Authentication"
        }
    }
    
    func getBiometricIcon() -> String {
        switch biometricType {
        case .faceID:
            return "faceid"
        case .touchID:
            return "touchid"
        default:
            return "lock"
        }
    }
    
    func clearAuthentication() {
        isAuthenticated = false
    }
}

// Keychain Manager for secure storage
class KeychainManager {
    static let shared = KeychainManager()
    
    private init() {}
    
    func save(_ data: Data, forKey key: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        // Delete existing item first
        SecItemDelete(query as CFDictionary)
        
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }
    
    func load(forKey key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: kCFBooleanTrue!,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)
        
        if status == errSecSuccess {
            return dataTypeRef as? Data
        }
        
        return nil
    }
    
    func delete(forKey key: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess
    }
    
    func saveString(_ string: String, forKey key: String) -> Bool {
        guard let data = string.data(using: .utf8) else { return false }
        return save(data, forKey: key)
    }
    
    func loadString(forKey key: String) -> String? {
        guard let data = load(forKey: key) else { return nil }
        return String(data: data, encoding: .utf8)
    }
}

// Encryption Manager for data protection
class EncryptionManager {
    static let shared = EncryptionManager()
    
    private init() {}
    
    func encrypt(_ data: Data, using key: Data) -> Data? {
        // Implement proper encryption logic
        // This is a placeholder - implement actual encryption
        return data
    }
    
    func decrypt(_ data: Data, using key: Data) -> Data? {
        // Implement proper decryption logic
        // This is a placeholder - implement actual decryption
        return data
    }
    
    func generateRandomKey() -> Data {
        // Generate a secure random key
        var key = Data(count: 32)
        let status = key.withUnsafeMutableBytes { mutableBytes in
            SecRandomCopyBytes(kSecRandomDefault, mutableBytes.count, mutableBytes.baseAddress!)
        }
        
        guard status == errSecSuccess else {
            fatalError("Failed to generate random key")
        }
        
        return key
    }
}