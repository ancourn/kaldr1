import XCTest
@testable import KaldrixWallet

class WalletManagerTests: XCTestCase {
    
    var walletManager: WalletManager!
    var mockKeychain: MockKeychain!
    
    override func setUp() {
        super.setUp()
        mockKeychain = MockKeychain()
        walletManager = WalletManager(keychain: mockKeychain)
    }
    
    override func tearDown() {
        walletManager = nil
        mockKeychain = nil
        super.tearDown()
    }
    
    // MARK: - Wallet Creation Tests
    
    func testCreateNewWallet() async throws {
        // Given
        let walletName = "Test Wallet"
        
        // When
        let wallet = try await walletManager.createNewWallet(name: walletName)
        
        // Then
        XCTAssertNotNil(wallet)
        XCTAssertEqual(wallet.name, walletName)
        XCTAssertFalse(wallet.address.isEmpty)
        XCTAssertFalse(wallet.publicKey.isEmpty)
        XCTAssertTrue(wallet.balance == 0)
    }
    
    func testCreateWalletWithInvalidName() async {
        // Given
        let invalidNames = ["", "   ", nil]
        
        for name in invalidNames {
            // When & Then
            do {
                _ = try await walletManager.createNewWallet(name: name)
                XCTFail("Should have thrown error for invalid name: \(name ?? "nil")")
            } catch WalletError.invalidName {
                // Expected
            } catch {
                XCTFail("Unexpected error: \(error)")
            }
        }
    }
    
    // MARK: - Wallet Import Tests
    
    func testImportWalletWithMnemonic() async throws {
        // Given
        let mnemonic = "test mnemonic phrase for wallet import"
        let walletName = "Imported Wallet"
        
        // When
        let wallet = try await walletManager.importWallet(mnemonic: mnemonic, name: walletName)
        
        // Then
        XCTAssertNotNil(wallet)
        XCTAssertEqual(wallet.name, walletName)
        XCTAssertFalse(wallet.address.isEmpty)
    }
    
    func testImportWalletWithInvalidMnemonic() async {
        // Given
        let invalidMnemonics = ["", "   ", "too short", nil]
        
        for mnemonic in invalidMnemonics {
            // When & Then
            do {
                _ = try await walletManager.importWallet(mnemonic: mnemonic, name: "Test")
                XCTFail("Should have thrown error for invalid mnemonic")
            } catch WalletError.invalidMnemonic {
                // Expected
            } catch {
                XCTFail("Unexpected error: \(error)")
            }
        }
    }
    
    // MARK: - Wallet Management Tests
    
    func testGetWalletBalance() async throws {
        // Given
        let wallet = try await walletManager.createNewWallet(name: "Balance Test")
        let expectedBalance: Double = 1000.0
        
        // Mock blockchain response
        walletManager.blockchainService = MockBlockchainService(balance: expectedBalance)
        
        // When
        let balance = try await walletManager.getWalletBalance(for: wallet)
        
        // Then
        XCTAssertEqual(balance, expectedBalance)
    }
    
    func testListAllWallets() async throws {
        // Given
        let wallet1 = try await walletManager.createNewWallet(name: "Wallet 1")
        let wallet2 = try await walletManager.createNewWallet(name: "Wallet 2")
        
        // When
        let wallets = try await walletManager.listAllWallets()
        
        // Then
        XCTAssertEqual(wallets.count, 2)
        XCTAssertTrue(wallets.contains { $0.id == wallet1.id })
        XCTAssertTrue(wallets.contains { $0.id == wallet2.id })
    }
    
    func testDeleteWallet() async throws {
        // Given
        let wallet = try await walletManager.createNewWallet(name: "Delete Test")
        
        // When
        try await walletManager.deleteWallet(wallet)
        
        // Then
        let wallets = try await walletManager.listAllWallets()
        XCTAssertFalse(wallets.contains { $0.id == wallet.id })
    }
    
    // MARK: - Transaction Tests
    
    func testCreateTransaction() async throws {
        // Given
        let senderWallet = try await walletManager.createNewWallet(name: "Sender")
        let receiverAddress = "0x1234567890123456789012345678901234567890"
        let amount: Double = 100.0
        
        // Mock blockchain service
        walletManager.blockchainService = MockBlockchainService()
        
        // When
        let transaction = try await walletManager.createTransaction(
            from: senderWallet,
            to: receiverAddress,
            amount: amount
        )
        
        // Then
        XCTAssertNotNil(transaction)
        XCTAssertEqual(transaction.fromAddress, senderWallet.address)
        XCTAssertEqual(transaction.toAddress, receiverAddress)
        XCTAssertEqual(transaction.amount, amount)
        XCTAssertEqual(transaction.status, .pending)
    }
    
    func testCreateTransactionWithInsufficientBalance() async throws {
        // Given
        let senderWallet = try await walletManager.createNewWallet(name: "Sender")
        let receiverAddress = "0x1234567890123456789012345678901234567890"
        let amount: Double = 1000.0
        
        // Mock blockchain service with low balance
        walletManager.blockchainService = MockBlockchainService(balance: 10.0)
        
        // When & Then
        do {
            _ = try await walletManager.createTransaction(
                from: senderWallet,
                to: receiverAddress,
                amount: amount
            )
            XCTFail("Should have thrown error for insufficient balance")
        } catch WalletError.insufficientBalance {
            // Expected
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }
    
    // MARK: - Security Tests
    
    func testWalletEncryption() async throws {
        // Given
        let wallet = try await walletManager.createNewWallet(name: "Encryption Test")
        let password = "securePassword123!"
        
        // When
        try await walletManager.encryptWallet(wallet, with: password)
        let isEncrypted = await walletManager.isWalletEncrypted(wallet)
        
        // Then
        XCTAssertTrue(isEncrypted)
    }
    
    func testWalletDecryption() async throws {
        // Given
        let wallet = try await walletManager.createNewWallet(name: "Decryption Test")
        let password = "securePassword123!"
        
        // When
        try await walletManager.encryptWallet(wallet, with: password)
        let decryptedWallet = try await walletManager.decryptWallet(wallet, with: password)
        
        // Then
        XCTAssertNotNil(decryptedWallet)
        XCTAssertEqual(decryptedWallet.id, wallet.id)
    }
    
    func testWalletDecryptionWithWrongPassword() async throws {
        // Given
        let wallet = try await walletManager.createNewWallet(name: "Wrong Password Test")
        let correctPassword = "securePassword123!"
        let wrongPassword = "wrongPassword"
        
        // When
        try await walletManager.encryptWallet(wallet, with: correctPassword)
        
        // Then
        do {
            _ = try await walletManager.decryptWallet(wallet, with: wrongPassword)
            XCTFail("Should have thrown error for wrong password")
        } catch WalletError.invalidPassword {
            // Expected
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }
}

// MARK: - Mock Classes

class MockKeychain: KeychainProtocol {
    private var storage: [String: Data] = [:]
    
    func save(_ data: Data, for key: String) throws {
        storage[key] = data
    }
    
    func load(for key: String) throws -> Data {
        guard let data = storage[key] else {
            throw KeychainError.itemNotFound
        }
        return data
    }
    
    func delete(for key: String) throws {
        storage.removeValue(forKey: key)
    }
}

class MockBlockchainService: BlockchainServiceProtocol {
    private let balance: Double
    
    init(balance: Double = 0) {
        self.balance = balance
    }
    
    func getBalance(for address: String) async throws -> Double {
        return balance
    }
    
    func sendTransaction(_ transaction: Transaction) async throws -> Transaction {
        var updatedTransaction = transaction
        updatedTransaction.status = .confirmed
        updatedTransaction.hash = "0x\(UUID().uuidString.replacingOccurrences(of: "-", with: ""))"
        return updatedTransaction
    }
    
    func getTransactionHistory(for address: String) async throws -> [Transaction] {
        return []
    }
}