import Foundation
import LocalAuthentication
import SwiftUI

@MainActor
class BiometricManager: ObservableObject {
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