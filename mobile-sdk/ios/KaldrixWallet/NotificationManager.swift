import Foundation
import UserNotifications
import SwiftUI

@MainActor
class NotificationManager: ObservableObject {
    @Published var hasPermission = false
    @Published var notificationsEnabled = true
    @Published var errorMessage = ""
    
    private let center = UNUserNotificationCenter.current()
    
    init() {
        checkNotificationPermission()
    }
    
    func requestAuthorization() async {
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            hasPermission = granted
            
            if granted {
                await setupNotificationCategories()
                registerForRemoteNotifications()
            }
        } catch {
            errorMessage = "Failed to request notification permission: \(error.localizedDescription)"
            hasPermission = false
        }
    }
    
    private func checkNotificationPermission() {
        Task {
            let settings = await center.notificationSettings()
            hasPermission = settings.authorizationStatus == .authorized
        }
    }
    
    private func setupNotificationCategories() async {
        // Define notification categories for different types of notifications
        let transactionCategory = UNNotificationCategory(
            identifier: "TRANSACTION",
            actions: [
                UNNotificationAction(
                    identifier: "VIEW_TRANSACTION",
                    title: "View Transaction",
                    options: [.foreground]
                )
            ],
            intentIdentifiers: [],
            options: .customDismissAction
        )
        
        let securityCategory = UNNotificationCategory(
            identifier: "SECURITY",
            actions: [
                UNNotificationAction(
                    identifier: "SECURE_WALLET",
                    title: "Secure Wallet",
                    options: [.foreground]
                )
            ],
            intentIdentifiers: [],
            options: .customDismissAction
        )
        
        await center.setNotificationCategories([transactionCategory, securityCategory])
    }
    
    private func registerForRemoteNotifications() {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
    
    func scheduleTransactionNotification(
        type: TransactionType,
        amount: Decimal,
        address: String,
        transactionId: String
    ) {
        guard hasPermission && notificationsEnabled else { return }
        
        let content = UNMutableNotificationContent()
        content.title = type == .sent ? "Transaction Sent" : "Transaction Received"
        content.body = "\(type == .sent ? "Sent" : "Received") \(amount, specifier: "%.4f") KALD"
        content.sound = UNNotificationSound.default
        content.badge = NSNumber(value: UIApplication.shared.applicationIconBadgeNumber + 1)
        content.userInfo = [
            "type": "transaction",
            "transaction_id": transactionId,
            "amount": amount.description,
            "address": address
        ]
        content.categoryIdentifier = "TRANSACTION"
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "transaction_\(transactionId)_\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )
        
        center.add(request) { error in
            if let error = error {
                DispatchQueue.main.async {
                    self.errorMessage = "Failed to schedule notification: \(error.localizedDescription)"
                }
            }
        }
    }
    
    func scheduleSecurityNotification(
        type: SecurityNotificationType,
        message: String
    ) {
        guard hasPermission && notificationsEnabled else { return }
        
        let content = UNMutableNotificationContent()
        content.title = type.title
        content.body = message
        content.sound = UNNotificationSound.default
        content.userInfo = [
            "type": "security",
            "security_type": type.rawValue,
            "message": message
        ]
        content.categoryIdentifier = "SECURITY"
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "security_\(type.rawValue)_\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )
        
        center.add(request) { error in
            if let error = error {
                DispatchQueue.main.async {
                    self.errorMessage = "Failed to schedule security notification: \(error.localizedDescription)"
                }
            }
        }
    }
    
    func scheduleNetworkNotification(
        type: NetworkNotificationType,
        message: String
    ) {
        guard hasPermission && notificationsEnabled else { return }
        
        let content = UNMutableNotificationContent()
        content.title = type.title
        content.body = message
        content.sound = UNNotificationSound.default
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "network_\(type.rawValue)_\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )
        
        center.add(request) { error in
            if let error = error {
                DispatchQueue.main.async {
                    self.errorMessage = "Failed to schedule network notification: \(error.localizedDescription)"
                }
            }
        }
    }
    
    func removeNotification(withIdentifier identifier: String) {
        center.removeDeliveredNotifications(withIdentifiers: [identifier])
        center.removePendingNotificationRequests(withIdentifiers: [identifier])
    }
    
    func removeAllNotifications() {
        center.removeAllDeliveredNotifications()
        center.removeAllPendingNotificationRequests()
    }
    
    func getPendingNotifications() async -> [UNNotificationRequest] {
        return await center.pendingNotificationRequests()
    }
    
    func getDeliveredNotifications() async -> [UNNotification] {
        return await center.deliveredNotifications()
    }
    
    func handleNotificationResponse(_ response: UNNotificationResponse) {
        let userInfo = response.notification.request.content.userInfo
        
        guard let type = userInfo["type"] as? String else { return }
        
        switch type {
        case "transaction":
            handleTransactionNotification(userInfo)
        case "security":
            handleSecurityNotification(userInfo)
        case "network":
            handleNetworkNotification(userInfo)
        default:
            print("Unknown notification type: \(type)")
        }
        
        // Handle action if present
        if response.actionIdentifier == "VIEW_TRANSACTION",
           let transactionId = userInfo["transaction_id"] as? String {
            // Navigate to transaction detail
            NotificationCenter.default.post(
                name: .showTransactionDetail,
                object: nil,
                userInfo: ["transaction_id": transactionId]
            )
        }
        
        if response.actionIdentifier == "SECURE_WALLET" {
            // Navigate to security settings
            NotificationCenter.default.post(
                name: .showSecuritySettings,
                object: nil
            )
        }
    }
    
    private func handleTransactionNotification(_ userInfo: [String: Any]) {
        if let transactionId = userInfo["transaction_id"] as? String {
            print("Transaction notification received for: \(transactionId)")
            // Update transaction list or show transaction detail
        }
    }
    
    private func handleSecurityNotification(_ userInfo: [String: Any]) {
        if let securityType = userInfo["security_type"] as? String {
            print("Security notification received: \(securityType)")
            // Show security alert or navigate to security settings
        }
    }
    
    private func handleNetworkNotification(_ userInfo: [String: Any]) {
        if let networkType = userInfo["network_type"] as? String {
            print("Network notification received: \(networkType)")
            // Show network status update
        }
    }
}

// Notification Types
enum TransactionType: String {
    case sent = "sent"
    case received = "received"
}

enum SecurityNotificationType: String, CaseIterable {
    case loginAttempt = "login_attempt"
    case backupCreated = "backup_created"
    case walletRestored = "wallet_restored"
    case keyRotated = "key_rotated"
    case suspiciousActivity = "suspicious_activity"
    
    var title: String {
        switch self {
        case .loginAttempt:
            return "Login Attempt"
        case .backupCreated:
            return "Backup Created"
        case .walletRestored:
            return "Wallet Restored"
        case .keyRotated:
            return "Keys Rotated"
        case .suspiciousActivity:
            return "Suspicious Activity"
        }
    }
}

enum NetworkNotificationType: String, CaseIterable {
    case connectionLost = "connection_lost"
    case connectionRestored = "connection_restored"
    case syncComplete = "sync_complete"
    case updateAvailable = "update_available"
    
    var title: String {
        switch self {
        case .connectionLost:
            return "Connection Lost"
        case .connectionRestored:
            return "Connection Restored"
        case .syncComplete:
            return "Sync Complete"
        case .updateAvailable:
            return "Update Available"
        }
    }
}

// Notification Names
extension Notification.Name {
    static let showTransactionDetail = Notification.Name("showTransactionDetail")
    static let showSecuritySettings = Notification.Name("showSecuritySettings")
    static let transactionReceived = Notification.Name("transactionReceived")
    static let transactionSent = Notification.Name("transactionSent")
    static let securityAlert = Notification.Name("securityAlert")
    static let networkStatusChanged = Notification.Name("networkStatusChanged")
}