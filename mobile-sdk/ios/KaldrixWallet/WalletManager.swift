import Foundation
import KaldrixSDK
import SwiftUI

@MainActor
class WalletManager: ObservableObject {
    @Published var isWalletCreated = false
    @Published var balance: Decimal = 0
    @Published var recentTransactions: [Transaction] = []
    @Published var currentWallet: Wallet?
    @Published var isLoading = false
    @Published var errorMessage = ""
    
    private let sdk = KaldrixSDK.shared
    
    init() {
        checkWalletStatus()
    }
    
    func checkWalletStatus() async {
        do {
            isWalletCreated = try await sdk.hasWallet()
            if isWalletCreated {
                currentWallet = try await sdk.getWallet()
                await fetchBalance()
                await fetchTransactions()
            }
        } catch {
            errorMessage = "Failed to check wallet status: \(error.localizedDescription)"
        }
    }
    
    func createWallet() async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            currentWallet = try await sdk.createWallet()
            isWalletCreated = true
            await fetchBalance()
        } catch {
            errorMessage = "Failed to create wallet: \(error.localizedDescription)"
            throw error
        }
    }
    
    func importWallet(mnemonic: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            currentWallet = try await sdk.importWallet(mnemonic: mnemonic)
            isWalletCreated = true
            await fetchBalance()
        } catch {
            errorMessage = "Failed to import wallet: \(error.localizedDescription)"
            throw error
        }
    }
    
    func getBalance() async throws -> Decimal {
        do {
            balance = try await sdk.getBalance()
            return balance
        } catch {
            errorMessage = "Failed to get balance: \(error.localizedDescription)"
            throw error
        }
    }
    
    func fetchBalance() async {
        do {
            balance = try await getBalance()
        } catch {
            print("Failed to fetch balance: \(error)")
        }
    }
    
    func sendTransaction(amount: Decimal, to: String, note: String? = nil) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let transaction = try await sdk.sendTransaction(
                amount: amount,
                to: to,
                note: note
            )
            
            // Refresh data after sending
            await fetchBalance()
            await fetchTransactions()
            
            return transaction
        } catch {
            errorMessage = "Failed to send transaction: \(error.localizedDescription)"
            throw error
        }
    }
    
    func estimateFee(amount: Decimal) async throws -> Decimal {
        do {
            return try await sdk.estimateFee(amount: amount)
        } catch {
            errorMessage = "Failed to estimate fee: \(error.localizedDescription)"
            throw error
        }
    }
    
    func getWalletAddress() async throws -> String {
        guard let wallet = currentWallet else {
            throw NSError(domain: "WalletError", code: 1, userInfo: [NSLocalizedDescriptionKey: "No wallet available"])
        }
        return wallet.address
    }
    
    func fetchTransactions() async {
        do {
            recentTransactions = try await sdk.getTransactions()
        } catch {
            print("Failed to fetch transactions: \(error)")
        }
    }
    
    func getTransactionDetails(id: String) async throws -> Transaction {
        do {
            return try await sdk.getTransaction(id: id)
        } catch {
            errorMessage = "Failed to get transaction details: \(error.localizedDescription)"
            throw error
        }
    }
    
    func backupWallet() async throws -> String {
        do {
            return try await sdk.getBackupPhrase()
        } catch {
            errorMessage = "Failed to backup wallet: \(error.localizedDescription)"
            throw error
        }
    }
    
    func restoreWallet(backupPhrase: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            currentWallet = try await sdk.importWallet(mnemonic: backupPhrase)
            isWalletCreated = true
            await fetchBalance()
            await fetchTransactions()
        } catch {
            errorMessage = "Failed to restore wallet: \(error.localizedDescription)"
            throw error
        }
    }
    
    func rotateKeys() async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            try await sdk.rotateKeys()
            await fetchBalance()
        } catch {
            errorMessage = "Failed to rotate keys: \(error.localizedDescription)"
            throw error
        }
    }
}

// Transaction Model
struct Transaction: Identifiable {
    let id: String
    let type: TransactionType
    let amount: Decimal
    let address: String
    let date: Date
    let status: TransactionStatus
    let fee: Decimal?
    let confirmations: Int?
    let note: String?
}

enum TransactionType: String, CaseIterable {
    case sent = "sent"
    case received = "received"
    case mining = "mining"
    case staking = "staking"
}

enum TransactionStatus: String, CaseIterable {
    case pending = "pending"
    case confirmed = "confirmed"
    case failed = "failed"
    case cancelled = "cancelled"
}

// Wallet Model
struct Wallet {
    let address: String
    let publicKey: String
    let balance: Decimal
    let createdAt: Date
    let lastUpdated: Date
}