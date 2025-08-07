import XCTest
@testable import KaldrixWallet

class KaldrixWalletPerformanceTests: XCTestCase {
    
    var walletManager: WalletManager!
    var performanceMonitor: PerformanceMonitor!
    
    override func setUp() {
        super.setUp()
        performanceMonitor = PerformanceMonitor()
        walletManager = WalletManager()
        walletManager.performanceMonitor = performanceMonitor
    }
    
    override func tearDown() {
        walletManager = nil
        performanceMonitor = nil
        super.tearDown()
    }
    
    // MARK: - App Startup Performance Tests
    
    func testAppStartupTime() {
        // Given: App is not running
        measure(metrics: [
            XCTClockMetric(),
            XCTCPUMetric(),
            XCTMemoryMetric(),
            XCTStorageMetric(),
            XCTApplicationLaunchMetric()
        ]) {
            // When: App launches
            let app = XCUIApplication()
            app.launch()
            
            // Then: App should launch within acceptable time
            XCTAssertTrue(app.buttons["Get Started"].waitForExistence(timeout: 5.0))
        }
    }
    
    func testWalletCreationPerformance() {
        // Given: Performance monitoring setup
        measure(metrics: [
            XCTClockMetric(),
            XCTCPUMetric(),
            XCTMemoryMetric()
        ]) {
            // When: Creating multiple wallets
            let expectation = XCTestExpectation(description: "Wallet Creation")
            var wallets: [Wallet] = []
            
            Task {
                for i in 0..<10 {
                    let wallet = try await walletManager.createNewWallet(name: "Performance Test \(i)")
                    wallets.append(wallet)
                }
                expectation.fulfill()
            }
            
            wait(for: [expectation], timeout: 30.0)
            
            // Then: All wallets should be created efficiently
            XCTAssertEqual(wallets.count, 10)
        }
    }
    
    // MARK: - Transaction Processing Performance Tests
    
    func testTransactionCreationPerformance() {
        // Given: Wallet with sufficient balance
        let expectation = XCTestExpectation(description: "Transaction Creation Setup")
        var wallet: Wallet!
        
        Task {
            wallet = try await walletManager.createNewWallet(name: "Transaction Performance Test")
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 10.0)
        
        measure(metrics: [
            XCTClockMetric(),
            XCTCPUMetric(),
            XCTMemoryMetric(),
            XCTStorageMetric()
        ]) {
            // When: Creating multiple transactions
            let transactionExpectation = XCTestExpectation(description: "Transaction Creation")
            var transactions: [Transaction] = []
            
            Task {
                for i in 0..<20 {
                    let transaction = try await walletManager.createTransaction(
                        from: wallet,
                        to: "0x\(String(repeating: "1234567890", count: 4))",
                        amount: Double(i * 10)
                    )
                    transactions.append(transaction)
                }
                transactionExpectation.fulfill()
            }
            
            wait(for: [transactionExpectation], timeout: 60.0)
            
            // Then: All transactions should be created efficiently
            XCTAssertEqual(transactions.count, 20)
        }
    }
    
    func testTransactionConfirmationPerformance() {
        // Given: Pending transactions
        let expectation = XCTestExpectation(description: "Transaction Confirmation Setup")
        var wallet: Wallet!
        var pendingTransactions: [Transaction] = []
        
        Task {
            wallet = try await walletManager.createNewWallet(name: "Confirmation Performance Test")
            
            for i in 0..<15 {
                let transaction = try await walletManager.createTransaction(
                    from: wallet,
                    to: "0x\(String(repeating: "1234567890", count: 4))",
                    amount: Double(i * 10)
                )
                pendingTransactions.append(transaction)
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 30.0)
        
        measure(metrics: [
            XCTClockMetric(),
            XCTCPUMetric(),
            XCTMemoryMetric()
        ]) {
            // When: Confirming all transactions
            let confirmationExpectation = XCTestExpectation(description: "Transaction Confirmation")
            var confirmedTransactions: [Transaction] = []
            
            Task {
                for transaction in pendingTransactions {
                    let confirmed = try await walletManager.confirmTransaction(transaction)
                    confirmedTransactions.append(confirmed)
                }
                confirmationExpectation.fulfill()
            }
            
            wait(for: [confirmationExpectation], timeout: 45.0)
            
            // Then: All transactions should be confirmed efficiently
            XCTAssertEqual(confirmedTransactions.count, 15)
            XCTAssertTrue(confirmedTransactions.allSatisfy { $0.status == .confirmed })
        }
    }
    
    // MARK: - Data Synchronization Performance Tests
    
    func testWalletSynchronizationPerformance() {
        // Given: Wallet with large transaction history
        let expectation = XCTestExpectation(description: "Wallet Synchronization Setup")
        var wallet: Wallet!
        
        Task {
            wallet = try await walletManager.createNewWallet(name: "Sync Performance Test")
            
            // Add many transactions to simulate large history
            for i in 0..<100 {
                let transaction = Transaction(
                    id: UUID().uuidString,
                    fromAddress: i % 2 == 0 ? "0xsender\(i)" : wallet.address,
                    toAddress: i % 2 == 0 ? wallet.address : "0xreceiver\(i)",
                    amount: Double.random(in: 10...1000),
                    timestamp: Date().addingTimeInterval(-Double(i * 3600)),
                    status: .confirmed,
                    hash: "0x\(UUID().uuidString.replacingOccurrences(of: "-", with: ""))"
                )
                try await walletManager.blockchainService.addTransaction(transaction)
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 60.0)
        
        measure(metrics: [
            XCTClockMetric(),
            XCTCPUMetric(),
            XCTMemoryMetric(),
            XCTStorageMetric(),
            XCTNetworkMetric()
        ]) {
            // When: Synchronizing wallet
            let syncExpectation = XCTestExpectation(description: "Wallet Synchronization")
            var syncResult: Bool = false
            
            Task {
                syncResult = try await walletManager.synchronizeWallet(wallet)
                syncExpectation.fulfill()
            }
            
            wait(for: [syncExpectation], timeout: 30.0)
            
            // Then: Synchronization should complete efficiently
            XCTAssertTrue(syncResult)
        }
    }
    
    func testPartialSynchronizationPerformance() {
        // Given: Wallet with existing data
        let expectation = XCTestExpectation(description: "Partial Sync Setup")
        var wallet: Wallet!
        
        Task {
            wallet = try await walletManager.createNewWallet(name: "Partial Sync Performance Test")
            
            // Initial sync with some transactions
            for i in 0..<50 {
                let transaction = Transaction(
                    id: UUID().uuidString,
                    fromAddress: i % 2 == 0 ? "0xsender\(i)" : wallet.address,
                    toAddress: i % 2 == 0 ? wallet.address : "0xreceiver\(i)",
                    amount: Double.random(in: 10...1000),
                    timestamp: Date().addingTimeInterval(-Double(i * 3600)),
                    status: .confirmed,
                    hash: "0x\(UUID().uuidString.replacingOccurrences(of: "-", with: ""))"
                )
                try await walletManager.blockchainService.addTransaction(transaction)
            }
            
            // Perform initial sync
            _ = try await walletManager.synchronizeWallet(wallet)
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 45.0)
        
        // Add new transactions
        let newTransactionsExpectation = XCTestExpectation(description: "Add New Transactions")
        
        Task {
            for i in 50..<75 {
                let transaction = Transaction(
                    id: UUID().uuidString,
                    fromAddress: i % 2 == 0 ? "0xsender\(i)" : wallet.address,
                    toAddress: i % 2 == 0 ? wallet.address : "0xreceiver\(i)",
                    amount: Double.random(in: 10...1000),
                    timestamp: Date().addingTimeInterval(-Double(i * 3600)),
                    status: .confirmed,
                    hash: "0x\(UUID().uuidString.replacingOccurrences(of: "-", with: ""))"
                )
                try await walletManager.blockchainService.addTransaction(transaction)
            }
            newTransactionsExpectation.fulfill()
        }
        
        wait(for: [newTransactionsExpectation], timeout: 30.0)
        
        measure(metrics: [
            XCTClockMetric(),
            XCTCPUMetric(),
            XCTMemoryMetric(),
            XCTNetworkMetric()
        ]) {
            // When: Performing partial synchronization
            let partialSyncExpectation = XCTestExpectation(description: "Partial Synchronization")
            var syncResult: Bool = false
            
            Task {
                syncResult = try await walletManager.synchronizeWallet(wallet, fromLastSync: true)
                partialSyncExpectation.fulfill()
            }
            
            wait(for: [partialSyncExpectation], timeout: 15.0)
            
            // Then: Partial sync should be faster than full sync
            XCTAssertTrue(syncResult)
        }
    }
    
    // MARK: - Cryptographic Operations Performance Tests
    
    func testKeyGenerationPerformance() {
        measure(metrics: [
            XCTClockMetric(),
            XCTCPUMetric(),
            XCTMemoryMetric()
        ]) {
            // When: Generating multiple key pairs
            let expectation = XCTestExpectation(description: "Key Generation")
            var keyPairs: [KeyPair] = []
            
            Task {
                for _ in 0..<20 {
                    let keyPair = try await walletManager.generateKeyPair()
                    keyPairs.append(keyPair)
                }
                expectation.fulfill()
            }
            
            wait(for: [expectation], timeout: 60.0)
            
            // Then: All key pairs should be generated efficiently
            XCTAssertEqual(keyPairs.count, 20)
        }
    }
    
    func testEncryptionDecryptionPerformance() {
        // Given: Wallet and test data
        let expectation = XCTestExpectation(description: "Encryption Setup")
        var wallet: Wallet!
        let testData = "This is a test string for encryption performance testing".data(using: .utf8)!
        
        Task {
            wallet = try await walletManager.createNewWallet(name: "Encryption Performance Test")
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 10.0)
        
        measure(metrics: [
            XCTClockMetric(),
            XCTCPUMetric(),
            XCTMemoryMetric()
        ]) {
            // When: Performing multiple encryption/decryption cycles
            let encryptionExpectation = XCTestExpectation(description: "Encryption/Decryption")
            var decryptedData: Data?
            
            Task {
                for _ in 0..<50 {
                    let encrypted = try await walletManager.encryptData(testData, for: wallet)
                    decryptedData = try await walletManager.decryptData(encrypted, for: wallet)
                }
                encryptionExpectation.fulfill()
            }
            
            wait(for: [encryptionExpectation], timeout: 30.0)
            
            // Then: Data should be correctly encrypted/decrypted
            XCTAssertEqual(decryptedData, testData)
        }
    }
    
    func testSignatureVerificationPerformance() {
        // Given: Wallet and test message
        let expectation = XCTestExpectation(description: "Signature Setup")
        var wallet: Wallet!
        let testMessage = "Test message for signature verification".data(using: .utf8)!
        
        Task {
            wallet = try await walletManager.createNewWallet(name: "Signature Performance Test")
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 10.0)
        
        // Create signature
        let signatureExpectation = XCTestExpectation(description: "Create Signature")
        var signature: Data!
        
        Task {
            signature = try await walletManager.signMessage(testMessage, with: wallet)
            signatureExpectation.fulfill()
        }
        
        wait(for: [signatureExpectation], timeout: 10.0)
        
        measure(metrics: [
            XCTClockMetric(),
            XCTCPUMetric(),
            XCTMemoryMetric()
        ]) {
            // When: Verifying signature multiple times
            let verificationExpectation = XCTestExpectation(description: "Signature Verification")
            var verificationResults: [Bool] = []
            
            Task {
                for _ in 0..<100 {
                    let isValid = try await walletManager.verifySignature(
                        signature,
                        for: testMessage,
                        with: wallet.publicKey
                    )
                    verificationResults.append(isValid)
                }
                verificationExpectation.fulfill()
            }
            
            wait(for: [verificationExpectation], timeout: 30.0)
            
            // Then: All verifications should be valid and efficient
            XCTAssertEqual(verificationResults.count, 100)
            XCTAssertTrue(verificationResults.allSatisfy { $0 })
        }
    }
    
    // MARK: - Memory Usage Tests
    
    func testMemoryUsageDuringHeavyOperations() {
        // Given: Memory monitoring setup
        let memoryExpectation = XCTestExpectation(description: "Memory Usage Test")
        var initialMemory: Double = 0
        var peakMemory: Double = 0
        var finalMemory: Double = 0
        
        // Measure initial memory
        initialMemory = performanceMonitor.getCurrentMemoryUsage()
        
        Task {
            // When: Performing memory-intensive operations
            let wallet = try await walletManager.createNewWallet(name: "Memory Test")
            
            // Create many transactions
            for i in 0..<100 {
                _ = try await walletManager.createTransaction(
                    from: wallet,
                    to: "0x\(String(repeating: "1234567890", count: 4))",
                    amount: Double(i * 10)
                )
                
                // Track peak memory
                let currentMemory = performanceMonitor.getCurrentMemoryUsage()
                peakMemory = max(peakMemory, currentMemory)
            }
            
            // Perform full synchronization
            _ = try await walletManager.synchronizeWallet(wallet)
            
            // Measure final memory
            finalMemory = performanceMonitor.getCurrentMemoryUsage()
            memoryExpectation.fulfill()
        }
        
        wait(for: [memoryExpectation], timeout: 60.0)
        
        // Then: Memory usage should be reasonable
        let memoryIncrease = finalMemory - initialMemory
        let memoryIncreaseMB = memoryIncrease / (1024 * 1024)
        
        print("Initial Memory: \(initialMemory / (1024 * 1024)) MB")
        print("Peak Memory: \(peakMemory / (1024 * 1024)) MB")
        print("Final Memory: \(finalMemory / (1024 * 1024)) MB")
        print("Memory Increase: \(memoryIncreaseMB) MB")
        
        // Assert memory increase is within acceptable limits
        XCTAssertLessThan(memoryIncreaseMB, 50, "Memory increase should be less than 50MB")
    }
    
    // MARK: - Battery Usage Tests
    
    func testBatteryUsageDuringBackgroundSync() {
        // Given: Battery monitoring setup
        let batteryExpectation = XCTestExpectation(description: "Battery Usage Test")
        var initialBatteryLevel: Float = 0
        var finalBatteryLevel: Float = 0
        
        // Measure initial battery level
        initialBatteryLevel = performanceMonitor.getCurrentBatteryLevel()
        
        Task {
            // When: Performing background synchronization
            let wallet = try await walletManager.createNewWallet(name: "Battery Test")
            
            // Simulate background sync operations
            for _ in 0..<10 {
                _ = try await walletManager.synchronizeWallet(wallet)
                try await Task.sleep(nanoseconds: 1_000_000_000) // 1 second delay
            }
            
            // Measure final battery level
            finalBatteryLevel = performanceMonitor.getCurrentBatteryLevel()
            batteryExpectation.fulfill()
        }
        
        wait(for: [batteryExpectation], timeout: 30.0)
        
        // Then: Battery drain should be minimal
        let batteryDrain = initialBatteryLevel - finalBatteryLevel
        print("Initial Battery: \(initialBatteryLevel)%")
        print("Final Battery: \(finalBatteryLevel)%")
        print("Battery Drain: \(batteryDrain)%")
        
        // Assert battery drain is within acceptable limits
        XCTAssertLessThan(batteryDrain, 5, "Battery drain should be less than 5%")
    }
}

// MARK: - Performance Monitor Helper

class PerformanceMonitor {
    func getCurrentMemoryUsage() -> Double {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size)/4
        
        let result = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_,
                         task_flavor_t(MACH_TASK_BASIC_INFO),
                         $0,
                         &count)
            }
        }
        
        if result == KERN_SUCCESS {
            return Double(info.resident_size)
        }
        return 0
    }
    
    func getCurrentBatteryLevel() -> Float {
        UIDevice.current.isBatteryMonitoringEnabled = true
        return UIDevice.current.batteryLevel
    }
}