import XCTest
@testable import KaldrixWallet

class WalletIntegrationTests: XCTestCase {
    
    var walletManager: WalletManager!
    var blockchainService: MockBlockchainService!
    var networkService: MockNetworkService!
    
    override func setUp() {
        super.setUp()
        blockchainService = MockBlockchainService()
        networkService = MockNetworkService()
        walletManager = WalletManager(
            blockchainService: blockchainService,
            networkService: networkService
        )
    }
    
    override func tearDown() {
        walletManager = nil
        blockchainService = nil
        networkService = nil
        super.tearDown()
    }
    
    // MARK: - End-to-End Wallet Flow Tests
    
    func testCompleteWalletFlow() async throws {
        // Given: Create a new wallet
        let wallet = try await walletManager.createNewWallet(name: "Integration Test Wallet")
        
        // When: Get wallet balance
        let balance = try await walletManager.getWalletBalance(for: wallet)
        
        // Then: Verify initial balance
        XCTAssertEqual(balance, 0)
        
        // When: Send a transaction to the wallet
        let fundingTransaction = Transaction(
            id: UUID().uuidString,
            fromAddress: "0xfundingaddress",
            toAddress: wallet.address,
            amount: 1000.0,
            timestamp: Date(),
            status: .confirmed,
            hash: "0xfundinghash"
        )
        blockchainService.addTransaction(fundingTransaction)
        
        // When: Check updated balance
        let updatedBalance = try await walletManager.getWalletBalance(for: wallet)
        
        // Then: Verify balance increased
        XCTAssertEqual(updatedBalance, 1000.0)
        
        // When: Create outgoing transaction
        let receiverAddress = "0xreceiveraddress"
        let outgoingTransaction = try await walletManager.createTransaction(
            from: wallet,
            to: receiverAddress,
            amount: 500.0
        )
        
        // Then: Verify transaction created
        XCTAssertNotNil(outgoingTransaction)
        XCTAssertEqual(outgoingTransaction.fromAddress, wallet.address)
        XCTAssertEqual(outgoingTransaction.toAddress, receiverAddress)
        XCTAssertEqual(outgoingTransaction.amount, 500.0)
        
        // When: Get transaction history
        let transactionHistory = try await walletManager.getTransactionHistory(for: wallet)
        
        // Then: Verify transaction history contains both transactions
        XCTAssertEqual(transactionHistory.count, 2)
        XCTAssertTrue(transactionHistory.contains { $0.id == fundingTransaction.id })
        XCTAssertTrue(transactionHistory.contains { $0.id == outgoingTransaction.id })
    }
    
    // MARK: - Network Integration Tests
    
    func testNetworkConnectivity() async throws {
        // Given: Wallet with network service
        let wallet = try await walletManager.createNewWallet(name: "Network Test")
        
        // When: Simulate network connectivity
        networkService.isConnected = true
        
        // Then: Should be able to get balance
        let balance = try await walletManager.getWalletBalance(for: wallet)
        XCTAssertNotNil(balance)
        
        // When: Simulate network disconnection
        networkService.isConnected = false
        
        // Then: Should throw network error
        do {
            _ = try await walletManager.getWalletBalance(for: wallet)
            XCTFail("Should have thrown network error")
        } catch NetworkError.noConnection {
            // Expected
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }
    
    func testNetworkRetryLogic() async throws {
        // Given: Wallet with failing network service
        let wallet = try await walletManager.createNewWallet(name: "Retry Test")
        networkService.shouldFail = true
        
        // When: Attempt to get balance with retry
        let startTime = Date()
        
        do {
            _ = try await walletManager.getWalletBalance(for: wallet, maxRetries: 3)
            XCTFail("Should have thrown network error after retries")
        } catch NetworkError.requestFailed {
            // Expected
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
        
        // Then: Verify retry delay was applied
        let elapsedTime = Date().timeIntervalSince(startTime)
        XCTAssertGreaterThanOrEqual(elapsedTime, 2.0) // 3 retries with 1s delay each
    }
    
    // MARK: - Blockchain Integration Tests
    
    func testBlockchainTransactionConfirmation() async throws {
        // Given: Wallet with blockchain service
        let wallet = try await walletManager.createNewWallet(name: "Confirmation Test")
        blockchainService.setBalance(1000.0, for: wallet.address)
        
        // When: Create transaction
        let receiverAddress = "0xreceiveraddress"
        let transaction = try await walletManager.createTransaction(
            from: wallet,
            to: receiverAddress,
            amount: 500.0
        )
        
        // Then: Transaction should be pending
        XCTAssertEqual(transaction.status, .pending)
        
        // When: Simulate blockchain confirmation
        blockchainService.confirmTransaction(transaction.id)
        
        // When: Get updated transaction
        let updatedTransaction = try await walletManager.getTransaction(transaction.id)
        
        // Then: Transaction should be confirmed
        XCTAssertEqual(updatedTransaction.status, .confirmed)
        XCTAssertNotNil(updatedTransaction.hash)
    }
    
    func testBlockchainTransactionFailure() async throws {
        // Given: Wallet with blockchain service
        let wallet = try await walletManager.createNewWallet(name: "Failure Test")
        blockchainService.setBalance(1000.0, for: wallet.address)
        
        // When: Create transaction that will fail
        let receiverAddress = "0xinvalidaddress"
        blockchainService.setNextTransactionToFail()
        
        // Then: Should throw blockchain error
        do {
            _ = try await walletManager.createTransaction(
                from: wallet,
                to: receiverAddress,
                amount: 500.0
            )
            XCTFail("Should have thrown blockchain error")
        } catch BlockchainError.transactionFailed {
            // Expected
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }
    
    // MARK: - Data Synchronization Tests
    
    func testDataSynchronization() async throws {
        // Given: Wallet with multiple transactions
        let wallet = try await walletManager.createNewWallet(name: "Sync Test")
        
        // Add transactions to blockchain
        let transactions = [
            Transaction(id: UUID().uuidString, fromAddress: "0xsender1", toAddress: wallet.address, amount: 100.0, timestamp: Date(), status: .confirmed, hash: "0xhash1"),
            Transaction(id: UUID().uuidString, fromAddress: "0xsender2", toAddress: wallet.address, amount: 200.0, timestamp: Date(), status: .confirmed, hash: "0xhash2"),
            Transaction(id: UUID().uuidString, fromAddress: wallet.address, toAddress: "0xreceiver", amount: 50.0, timestamp: Date(), status: .confirmed, hash: "0xhash3")
        ]
        
        for transaction in transactions {
            blockchainService.addTransaction(transaction)
        }
        
        // When: Synchronize wallet data
        try await walletManager.synchronizeWallet(wallet)
        
        // Then: Verify balance is correct
        let balance = try await walletManager.getWalletBalance(for: wallet)
        XCTAssertEqual(balance, 250.0) // 100 + 200 - 50
        
        // Then: Verify transaction history is synchronized
        let transactionHistory = try await walletManager.getTransactionHistory(for: wallet)
        XCTAssertEqual(transactionHistory.count, 3)
        
        // Verify all transactions are present
        for transaction in transactions {
            XCTAssertTrue(transactionHistory.contains { $0.id == transaction.id })
        }
    }
    
    func testPartialSynchronization() async throws {
        // Given: Wallet with existing data
        let wallet = try await walletManager.createNewWallet(name: "Partial Sync Test")
        
        // Add some transactions
        let existingTransactions = [
            Transaction(id: UUID().uuidString, fromAddress: "0xsender1", toAddress: wallet.address, amount: 100.0, timestamp: Date(), status: .confirmed, hash: "0xhash1"),
            Transaction(id: UUID().uuidString, fromAddress: "0xsender2", toAddress: wallet.address, amount: 200.0, timestamp: Date(), status: .confirmed, hash: "0xhash2")
        ]
        
        for transaction in existingTransactions {
            blockchainService.addTransaction(transaction)
        }
        
        // When: Initial synchronization
        try await walletManager.synchronizeWallet(wallet)
        
        // When: Add new transactions to blockchain
        let newTransactions = [
            Transaction(id: UUID().uuidString, fromAddress: "0xsender3", toAddress: wallet.address, amount: 300.0, timestamp: Date(), status: .confirmed, hash: "0xhash3"),
            Transaction(id: UUID().uuidString, fromAddress: wallet.address, toAddress: "0xreceiver", amount: 150.0, timestamp: Date(), status: .confirmed, hash: "0xhash4")
        ]
        
        for transaction in newTransactions {
            blockchainService.addTransaction(transaction)
        }
        
        // When: Partial synchronization (only new transactions)
        try await walletManager.synchronizeWallet(wallet, fromLastSync: true)
        
        // Then: Verify balance is updated correctly
        let balance = try await walletManager.getWalletBalance(for: wallet)
        XCTAssertEqual(balance, 450.0) // 100 + 200 + 300 - 150
        
        // Then: Verify transaction history includes all transactions
        let transactionHistory = try await walletManager.getTransactionHistory(for: wallet)
        XCTAssertEqual(transactionHistory.count, 4)
    }
    
    // MARK: - Error Handling Integration Tests
    
    func testComprehensiveErrorHandling() async throws {
        // Given: Wallet with various error scenarios
        let wallet = try await walletManager.createNewWallet(name: "Error Handling Test")
        
        // Test network error
        networkService.isConnected = false
        do {
            _ = try await walletManager.getWalletBalance(for: wallet)
            XCTFail("Should have thrown network error")
        } catch NetworkError.noConnection {
            // Expected
        }
        
        // Test blockchain error
        networkService.isConnected = true
        blockchainService.setNextError(BlockchainError.invalidAddress)
        do {
            _ = try await walletManager.createTransaction(
                from: wallet,
                to: "0xinvalid",
                amount: 100.0
            )
            XCTFail("Should have thrown blockchain error")
        } catch BlockchainError.invalidAddress {
            // Expected
        }
        
        // Test wallet error
        do {
            _ = try await walletManager.createNewWallet(name: "")
            XCTFail("Should have thrown wallet error")
        } catch WalletError.invalidName {
            // Expected
        }
    }
}

// MARK: - Mock Service Classes

class MockNetworkService: NetworkServiceProtocol {
    var isConnected: Bool = true
    var shouldFail: Bool = false
    var failureCount: Int = 0
    
    func request<T: Codable>(_ endpoint: String, method: String, body: Data?) async throws -> T {
        if shouldFail {
            failureCount += 1
            throw NetworkError.requestFailed
        }
        
        if !isConnected {
            throw NetworkError.noConnection
        }
        
        // Mock successful response
        if endpoint.contains("balance") {
            return BalanceResponse(balance: 1000.0) as! T
        } else if endpoint.contains("transaction") {
            return TransactionResponse(
                id: UUID().uuidString,
                status: "confirmed",
                hash: "0x\(UUID().uuidString)"
            ) as! T
        }
        
        throw NetworkError.invalidResponse
    }
}

class MockBlockchainService: BlockchainServiceProtocol {
    private var balances: [String: Double] = [:]
    private var transactions: [Transaction] = []
    private var confirmedTransactions: Set<String> = []
    private var nextTransactionShouldFail: Bool = false
    private var nextError: Error?
    
    func setBalance(_ balance: Double, for address: String) {
        balances[address] = balance
    }
    
    func addTransaction(_ transaction: Transaction) {
        transactions.append(transaction)
        if transaction.status == .confirmed {
            confirmedTransactions.insert(transaction.id)
        }
    }
    
    func confirmTransaction(_ transactionId: String) {
        confirmedTransactions.insert(transactionId)
        if let index = transactions.firstIndex(where: { $0.id == transactionId }) {
            transactions[index].status = .confirmed
        }
    }
    
    func setNextTransactionToFail() {
        nextTransactionShouldFail = true
    }
    
    func setNextError(_ error: Error) {
        nextError = error
    }
    
    func getBalance(for address: String) async throws -> Double {
        if let error = nextError {
            nextError = nil
            throw error
        }
        
        return balances[address] ?? 0
    }
    
    func sendTransaction(_ transaction: Transaction) async throws -> Transaction {
        if nextTransactionShouldFail {
            nextTransactionShouldFail = false
            throw BlockchainError.transactionFailed
        }
        
        if let error = nextError {
            nextError = nil
            throw error
        }
        
        var confirmedTransaction = transaction
        confirmedTransaction.status = .confirmed
        confirmedTransaction.hash = "0x\(UUID().uuidString.replacingOccurrences(of: "-", with: ""))"
        transactions.append(confirmedTransaction)
        confirmedTransactions.insert(confirmedTransaction.id)
        
        return confirmedTransaction
    }
    
    func getTransactionHistory(for address: String) async throws -> [Transaction] {
        return transactions.filter { $0.fromAddress == address || $0.toAddress == address }
    }
}