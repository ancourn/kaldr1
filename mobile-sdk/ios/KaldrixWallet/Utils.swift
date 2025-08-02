import Foundation
import SwiftUI
import CommonCrypto

class Utils {
    static let shared = Utils()
    
    private init() {}
    
    // MARK: - Date Formatting
    func formatDate(_ date: Date, style: DateFormatter.Style = .medium) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = style
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
    
    func formatTime(_ date: Date, style: DateFormatter.Style = .short) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .none
        formatter.timeStyle = style
        return formatter.string(from: date)
    }
    
    func formatDateTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
    
    func formatRelativeTime(_ date: Date) -> String {
        let now = Date()
        let interval = now.timeIntervalSince(date)
        
        if interval < 60 {
            return "Just now"
        } else if interval < 3600 {
            let minutes = Int(interval / 60)
            return "\(minutes) minute\(minutes > 1 ? "s" : "") ago"
        } else if interval < 86400 {
            let hours = Int(interval / 3600)
            return "\(hours) hour\(hours > 1 ? "s" : "") ago"
        } else if interval < 604800 {
            let days = Int(interval / 86400)
            return "\(days) day\(days > 1 ? "s" : "") ago"
        } else {
            return formatDate(date)
        }
    }
    
    // MARK: - Number Formatting
    func formatCurrency(_ amount: Decimal, currency: String = "USD") -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: amount as NSDecimalNumber) ?? "$0.00"
    }
    
    func formatCrypto(_ amount: Decimal, symbol: String = "KALD", decimals: Int = 4) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 0
        formatter.maximumFractionDigits = decimals
        let formattedAmount = formatter.string(from: amount as NSDecimalNumber) ?? "0"
        return "\(formattedAmount) \(symbol)"
    }
    
    func formatNumber(_ number: Int) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: number)) ?? "0"
    }
    
    // MARK: - Address Formatting
    func formatAddress(_ address: String, prefixLength: Int = 8, suffixLength: Int = 8) -> String {
        guard address.count > prefixLength + suffixLength else { return address }
        
        let prefix = String(address.prefix(prefixLength))
        let suffix = String(address.suffix(suffixLength))
        return "\(prefix)...\(suffix)"
    }
    
    func isValidAddress(_ address: String) -> Bool {
        // Basic validation - implement proper address validation
        return address.count >= 30 && address.count <= 50 &&
               address.rangeOfCharacter(from: CharacterSet.alphanumerics.inverted) == nil
    }
    
    // MARK: - String Utilities
    func generateRandomString(length: Int) -> String {
        let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<length).map { _ in letters.randomElement()! })
    }
    
    func truncate(_ string: String, maxLength: Int) -> String {
        if string.count <= maxLength {
            return string
        }
        return String(string.prefix(maxLength - 3)) + "..."
    }
    
    func sanitizeInput(_ input: String) -> String {
        return input
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: " ", with: "")
            .lowercased()
    }
    
    // MARK: - Validation
    func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
    
    func isValidPassword(_ password: String) -> Bool {
        return password.count >= 8 &&
               password.rangeOfCharacter(from: .uppercaseLetters) != nil &&
               password.rangeOfCharacter(from: .lowercaseLetters) != nil &&
               password.rangeOfCharacter(from: .decimalDigits) != nil &&
               password.rangeOfCharacter(from: .punctuationCharacters) != nil
    }
    
    func isValidMnemonic(_ mnemonic: String) -> Bool {
        let words = mnemonic.split(separator: " ")
        return words.count == 12 || words.count == 24
    }
    
    // MARK: - Cryptography
    func sha256(_ data: Data) -> Data {
        var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes { buffer in
            _ = CC_SHA256(buffer.baseAddress, CC_LONG(data.count), &digest)
        }
        return Data(digest)
    }
    
    func sha256(_ string: String) -> Data {
        return sha256(string.data(using: .utf8) ?? Data())
    }
    
    func hmacSHA256(_ data: Data, key: Data) -> Data {
        var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes { dataBuffer in
            key.withUnsafeBytes { keyBuffer in
                CCHmac(CCHmacAlgorithm(kCCHmacAlgSHA256),
                       keyBuffer.baseAddress, key.count,
                       dataBuffer.baseAddress, data.count,
                       &digest)
            }
        }
        return Data(digest)
    }
    
    // MARK: - Device Information
    func getDeviceInfo() -> [String: String] {
        let device = UIDevice.current
        let screen = UIScreen.main
        
        return [
            "device_model": device.model,
            "device_name": device.name,
            "system_version": device.systemVersion,
            "app_version": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown",
            "build_number": Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "Unknown",
            "screen_width": "\(Int(screen.bounds.width))",
            "screen_height": "\(Int(screen.bounds.height))",
            "screen_scale": "\(screen.scale)",
            "device_id": device.identifierForVendor?.uuidString ?? "Unknown"
        ]
    }
    
    func isSimulator() -> Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return false
        #endif
    }
    
    func isJailbroken() -> Bool {
        #if DEBUG
        return false
        #else
        // Check for jailbreak indicators
        let jailbreakPaths = [
            "/Applications/Cydia.app",
            "/Library/MobileSubstrate/MobileSubstrate.dylib",
            "/bin/bash",
            "/usr/sbin/sshd",
            "/etc/apt"
        ]
        
        for path in jailbreakPaths {
            if FileManager.default.fileExists(atPath: path) {
                return true
            }
        }
        
        return false
        #endif
    }
    
    // MARK: - Storage
    func saveToUserDefaults(_ value: Any, key: String) {
        UserDefaults.standard.set(value, forKey: key)
    }
    
    func loadFromUserDefaults<T>(_ key: String, defaultValue: T) -> T {
        return UserDefaults.standard.object(forKey: key) as? T ?? defaultValue
    }
    
    func removeFromUserDefaults(_ key: String) {
        UserDefaults.standard.removeObject(forKey: key)
    }
    
    // MARK: - Haptic Feedback
    func generateHapticFeedback(_ type: HapticFeedbackType) {
        switch type {
        case .light:
            let impactFeedback = UIImpactFeedbackGenerator(style: .light)
            impactFeedback.impactOccurred()
        case .medium:
            let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
            impactFeedback.impactOccurred()
        case .heavy:
            let impactFeedback = UIImpactFeedbackGenerator(style: .heavy)
            impactFeedback.impactOccurred()
        case .success:
            let notificationFeedback = UINotificationFeedbackGenerator()
            notificationFeedback.notificationOccurred(.success)
        case .warning:
            let notificationFeedback = UINotificationFeedbackGenerator()
            notificationFeedback.notificationOccurred(.warning)
        case .error:
            let notificationFeedback = UINotificationFeedbackGenerator()
            notificationFeedback.notificationOccurred(.error)
        }
    }
    
    // MARK: - Colors
    func colorFromHex(_ hex: String) -> Color {
        var hexString = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexString = hexString.replacingOccurrences(of: "#", with: "")
        
        var rgb: UInt64 = 0
        Scanner(string: hexString).scanHexInt64(&rgb)
        
        let red = Double((rgb & 0xFF0000) >> 16) / 255.0
        let green = Double((rgb & 0x00FF00) >> 8) / 255.0
        let blue = Double(rgb & 0x0000FF) / 255.0
        
        return Color(red: red, green: green, blue: blue)
    }
    
    // MARK: - Animations
    func withAnimation(_ duration: Double, _ animations: @escaping () -> Void) {
        withAnimation(.easeInOut(duration: duration)) {
            animations()
        }
    }
    
    func springAnimation(_ animations: @escaping () -> Void) {
        withAnimation(.spring(response: 0.6, dampingFraction: 0.8, blendDuration: 0)) {
            animations()
        }
    }
    
    // MARK: - Error Handling
    func handleError(_ error: Error, title: String = "Error") {
        let errorMessage = error.localizedDescription
        
        DispatchQueue.main.async {
            let alert = UIAlertController(
                title: title,
                message: errorMessage,
                preferredStyle: .alert
            )
            
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first {
                window.rootViewController?.present(alert, animated: true)
            }
        }
    }
    
    func showSuccess(_ message: String, title: String = "Success") {
        DispatchQueue.main.async {
            let alert = UIAlertController(
                title: title,
                message: message,
                preferredStyle: .alert
            )
            
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first {
                window.rootViewController?.present(alert, animated: true)
            }
        }
    }
    
    // MARK: - Logging
    func log(_ message: String, level: LogLevel = .info) {
        let timestamp = DateFormatter.logFormatter.string(from: Date())
        let logMessage = "[\(timestamp)] [\(level.rawValue.uppercased())] \(message)"
        
        print(logMessage)
        
        // Save to file if needed
        #if DEBUG
        saveLog(logMessage)
        #endif
    }
    
    private func saveLog(_ message: String) {
        let logsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?
            .appendingPathComponent("Logs")
        
        try? FileManager.default.createDirectory(at: logsDirectory, withIntermediateDirectories: true)
        
        let logFile = logsDirectory.appendingPathComponent("kaldrix_\(Date().logDateString).log")
        
        do {
            let data = (message + "\n").data(using: .utf8)!
            let fileHandle = try FileHandle(forWritingTo: logFile)
            fileHandle.seekToEndOfFile()
            fileHandle.write(data)
            fileHandle.closeFile()
        } catch {
            print("Failed to save log: \(error)")
        }
    }
}

// Supporting Enums and Extensions
enum HapticFeedbackType {
    case light
    case medium
    case heavy
    case success
    case warning
    case error
}

enum LogLevel: String {
    case debug = "debug"
    case info = "info"
    case warning = "warning"
    case error = "error"
}

extension DateFormatter {
    static let logFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss.SSS"
        return formatter
    }()
}

extension Date {
    var logDateString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: self)
    }
}