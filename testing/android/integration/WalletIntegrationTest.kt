package com.kaldrix.wallet.testing

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.*
import com.kaldrix.wallet.data.WalletManager
import com.kaldrix.wallet.data.model.Wallet
import com.kaldrix.wallet.data.model.Transaction
import com.kaldrix.wallet.data.model.WalletError
import com.kaldrix.wallet.data.model.NetworkError
import com.kaldrix.wallet.data.model.BlockchainError
import com.kaldrix.wallet.data.service.BlockchainService
import com.kaldrix.wallet.data.service.NetworkService
import com.kaldrix.wallet.data.storage.KeychainStorage
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class WalletIntegrationTest {
    
    private lateinit var walletManager: WalletManager
    private lateinit var mockBlockchainService: MockBlockchainService
    private lateinit var mockNetworkService: MockNetworkService
    
    @Before
    fun setup() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        mockBlockchainService = MockBlockchainService()
        mockNetworkService = MockNetworkService()
        
        walletManager = WalletManager(
            context = context,
            keychainStorage = MockKeychainStorage(),
            blockchainService = mockBlockchainService,
            networkService = mockNetworkService
        )
    }
    
    @After
    fun tearDown() {
        walletManager.cleanup()
    }
    
    // MARK: - End-to-End Wallet Flow Tests
    
    @Test
    fun testCompleteWalletFlow() = runBlocking {
        // Given: Create a new wallet
        val wallet = walletManager.createNewWallet("Integration Test Wallet")
        
        // When: Get wallet balance
        val balance = walletManager.getWalletBalance(wallet)
        
        // Then: Verify initial balance
        assertEquals(0.0, balance, 0.0)
        
        // When: Send a transaction to the wallet
        val fundingTransaction = Transaction(
            id = java.util.UUID.randomUUID().toString(),
            fromAddress = "0xfundingaddress",
            toAddress = wallet.address,
            amount = 1000.0,
            timestamp = System.currentTimeMillis(),
            status = Transaction.STATUS_CONFIRMED,
            hash = "0xfundinghash"
        )
        mockBlockchainService.addTransaction(fundingTransaction)
        mockBlockchainService.setBalance(1000.0, wallet.address)
        
        // When: Check updated balance
        val updatedBalance = walletManager.getWalletBalance(wallet)
        
        // Then: Verify balance increased
        assertEquals(1000.0, updatedBalance, 0.0)
        
        // When: Create outgoing transaction
        val receiverAddress = "0xreceiveraddress"
        val outgoingTransaction = walletManager.createTransaction(
            wallet,
            receiverAddress,
            500.0
        )
        
        // Then: Verify transaction created
        assertNotNull(outgoingTransaction)
        assertEquals(wallet.address, outgoingTransaction.fromAddress)
        assertEquals(receiverAddress, outgoingTransaction.toAddress)
        assertEquals(500.0, outgoingTransaction.amount, 0.0)
        
        // When: Get transaction history
        val transactionHistory = walletManager.getTransactionHistory(wallet)
        
        // Then: Verify transaction history contains both transactions
        assertEquals(2, transactionHistory.size)
        assertTrue(transactionHistory.any { it.id == fundingTransaction.id })
        assertTrue(transactionHistory.any { it.id == outgoingTransaction.id })
    }
    
    // MARK: - Network Integration Tests
    
    @Test
    fun testNetworkConnectivity() = runBlocking {
        // Given: Wallet with network service
        val wallet = walletManager.createNewWallet("Network Test")
        
        // When: Simulate network connectivity
        mockNetworkService.setConnected(true)
        
        // Then: Should be able to get balance
        val balance = walletManager.getWalletBalance(wallet)
        assertNotNull(balance)
        
        // When: Simulate network disconnection
        mockNetworkService.setConnected(false)
        
        // Then: Should throw network error
        try {
            walletManager.getWalletBalance(wallet)
            fail("Should have thrown network error")
        } catch (e: NetworkError) {
            assertEquals(NetworkError.NO_CONNECTION, e.code)
        }
    }
    
    @Test
    fun testNetworkRetryLogic() = runBlocking {
        // Given: Wallet with failing network service
        val wallet = walletManager.createNewWallet("Retry Test")
        mockNetworkService.setShouldFail(true)
        
        // When: Attempt to get balance with retry
        val startTime = System.currentTimeMillis()
        
        try {
            walletManager.getWalletBalance(wallet, maxRetries = 3)
            fail("Should have thrown network error after retries")
        } catch (e: NetworkError) {
            assertEquals(NetworkError.REQUEST_FAILED, e.code)
        }
        
        // Then: Verify retry delay was applied
        val elapsedTime = System.currentTimeMillis() - startTime
        assertTrue(elapsedTime >= 2000) // 3 retries with 1s delay each
    }
    
    // MARK: - Blockchain Integration Tests
    
    @Test
    fun testBlockchainTransactionConfirmation() = runBlocking {
        // Given: Wallet with blockchain service
        val wallet = walletManager.createNewWallet("Confirmation Test")
        mockBlockchainService.setBalance(1000.0, wallet.address)
        
        // When: Create transaction
        val receiverAddress = "0xreceiveraddress"
        val transaction = walletManager.createTransaction(wallet, receiverAddress, 500.0)
        
        // Then: Transaction should be pending
        assertEquals(Transaction.STATUS_PENDING, transaction.status)
        
        // When: Simulate blockchain confirmation
        mockBlockchainService.confirmTransaction(transaction.id)
        
        // When: Get updated transaction
        val updatedTransaction = walletManager.getTransaction(transaction.id)
        
        // Then: Transaction should be confirmed
        assertEquals(Transaction.STATUS_CONFIRMED, updatedTransaction.status)
        assertNotNull(updatedTransaction.hash)
    }
    
    @Test
    fun testBlockchainTransactionFailure() = runBlocking {
        // Given: Wallet with blockchain service
        val wallet = walletManager.createNewWallet("Failure Test")
        mockBlockchainService.setBalance(1000.0, wallet.address)
        
        // When: Create transaction that will fail
        val receiverAddress = "0xinvalidaddress"
        mockBlockchainService.setNextTransactionToFail()
        
        // Then: Should throw blockchain error
        try {
            walletManager.createTransaction(wallet, receiverAddress, 500.0)
            fail("Should have thrown blockchain error")
        } catch (e: BlockchainError) {
            assertEquals(BlockchainError.TRANSACTION_FAILED, e.code)
        }
    }
    
    // MARK: - Data Synchronization Tests
    
    @Test
    fun testDataSynchronization() = runBlocking {
        // Given: Wallet with multiple transactions
        val wallet = walletManager.createNewWallet("Sync Test")
        
        // Add transactions to blockchain
        val transactions = listOf(
            Transaction(
                id = java.util.UUID.randomUUID().toString(),
                fromAddress = "0xsender1",
                toAddress = wallet.address,
                amount = 100.0,
                timestamp = System.currentTimeMillis(),
                status = Transaction.STATUS_CONFIRMED,
                hash = "0xhash1"
            ),
            Transaction(
                id = java.util.UUID.randomUUID().toString(),
                fromAddress = "0xsender2",
                toAddress = wallet.address,
                amount = 200.0,
                timestamp = System.currentTimeMillis(),
                status = Transaction.STATUS_CONFIRMED,
                hash = "0xhash2"
            ),
            Transaction(
                id = java.util.UUID.randomUUID().toString(),
                fromAddress = wallet.address,
                toAddress = "0xreceiver",
                amount = 50.0,
                timestamp = System.currentTimeMillis(),
                status = Transaction.STATUS_CONFIRMED,
                hash = "0xhash3"
            )
        )
        
        transactions.forEach { mockBlockchainService.addTransaction(it) }
        
        // When: Synchronize wallet data
        walletManager.synchronizeWallet(wallet)
        
        // Then: Verify balance is correct
        val balance = walletManager.getWalletBalance(wallet)
        assertEquals(250.0, balance, 0.0) // 100 + 200 - 50
        
        // Then: Verify transaction history is synchronized
        val transactionHistory = walletManager.getTransactionHistory(wallet)
        assertEquals(3, transactionHistory.size)
        
        // Verify all transactions are present
        transactions.forEach { transaction ->
            assertTrue(transactionHistory.any { it.id == transaction.id })
        }
    }
    
    @Test
    fun testPartialSynchronization() = runBlocking {
        // Given: Wallet with existing data
        val wallet = walletManager.createNewWallet("Partial Sync Test")
        
        // Add some transactions
        val existingTransactions = listOf(
            Transaction(
                id = java.util.UUID.randomUUID().toString(),
                fromAddress = "0xsender1",
                toAddress = wallet.address,
                amount = 100.0,
                timestamp = System.currentTimeMillis(),
                status = Transaction.STATUS_CONFIRMED,
                hash = "0xhash1"
            ),
            Transaction(
                id = java.util.UUID.randomUUID().toString(),
                fromAddress = "0xsender2",
                toAddress = wallet.address,
                amount = 200.0,
                timestamp = System.currentTimeMillis(),
                status = Transaction.STATUS_CONFIRMED,
                hash = "0xhash2"
            )
        )
        
        existingTransactions.forEach { mockBlockchainService.addTransaction(it) }
        
        // When: Initial synchronization
        walletManager.synchronizeWallet(wallet)
        
        // When: Add new transactions to blockchain
        val newTransactions = listOf(
            Transaction(
                id = java.util.UUID.randomUUID().toString(),
                fromAddress = "0xsender3",
                toAddress = wallet.address,
                amount = 300.0,
                timestamp = System.currentTimeMillis(),
                status = Transaction.STATUS_CONFIRMED,
                hash = "0xhash3"
            ),
            Transaction(
                id = java.util.UUID.randomUUID().toString(),
                fromAddress = wallet.address,
                toAddress = "0xreceiver",
                amount = 150.0,
                timestamp = System.currentTimeMillis(),
                status = Transaction.STATUS_CONFIRMED,
                hash = "0xhash4"
            )
        )
        
        newTransactions.forEach { mockBlockchainService.addTransaction(it) }
        
        // When: Partial synchronization (only new transactions)
        walletManager.synchronizeWallet(wallet, fromLastSync = true)
        
        // Then: Verify balance is updated correctly
        val balance = walletManager.getWalletBalance(wallet)
        assertEquals(450.0, balance, 0.0) // 100 + 200 + 300 - 150
        
        // Then: Verify transaction history includes all transactions
        val transactionHistory = walletManager.getTransactionHistory(wallet)
        assertEquals(4, transactionHistory.size)
    }
    
    // MARK: - Error Handling Integration Tests
    
    @Test
    fun testComprehensiveErrorHandling() = runBlocking {
        // Given: Wallet with various error scenarios
        val wallet = walletManager.createNewWallet("Error Handling Test")
        
        // Test network error
        mockNetworkService.setConnected(false)
        try {
            walletManager.getWalletBalance(wallet)
            fail("Should have thrown network error")
        } catch (e: NetworkError) {
            assertEquals(NetworkError.NO_CONNECTION, e.code)
        }
        
        // Test blockchain error
        mockNetworkService.setConnected(true)
        mockBlockchainService.setNextError(Exception("Invalid address"))
        try {
            walletManager.createTransaction(wallet, "0xinvalid", 100.0)
            fail("Should have thrown blockchain error")
        } catch (e: BlockchainError) {
            assertEquals(BlockchainError.INVALID_ADDRESS, e.code)
        }
        
        // Test wallet error
        try {
            walletManager.createNewWallet("")
            fail("Should have thrown wallet error")
        } catch (e: WalletError) {
            assertEquals(WalletError.INVALID_NAME, e.code)
        }
    }
    
    // MARK: - Concurrent Operations Tests
    
    @Test
    fun testConcurrentWalletOperations() = runBlocking {
        // Given: Multiple concurrent operations
        val wallet = walletManager.createNewWallet("Concurrent Test")
        mockBlockchainService.setBalance(10000.0, wallet.address)
        
        val latch = CountDownLatch(10)
        val results = mutableListOf<Boolean>()
        
        // When: Perform concurrent transactions
        repeat(10) { i ->
            Thread {
                try {
                    runBlocking {
                        val transaction = walletManager.createTransaction(
                            wallet,
                            "0xreceiver$i",
                            100.0
                        )
                        results.add(true)
                    }
                } catch (e: Exception) {
                    results.add(false)
                } finally {
                    latch.countDown()
                }
            }.start()
        }
        
        // Then: Wait for all operations to complete
        assertTrue(latch.await(30, TimeUnit.SECONDS))
        assertEquals(10, results.size)
        assertTrue(results.all { it })
    }
    
    @Test
    fun testConcurrentBalanceChecks() = runBlocking {
        // Given: Wallet with balance
        val wallet = walletManager.createNewWallet("Concurrent Balance Test")
        mockBlockchainService.setBalance(1000.0, wallet.address)
        
        val latch = CountDownLatch(20)
        val balances = mutableListOf<Double>()
        
        // When: Perform concurrent balance checks
        repeat(20) {
            Thread {
                try {
                    runBlocking {
                        val balance = walletManager.getWalletBalance(wallet)
                        balances.add(balance)
                    }
                } catch (e: Exception) {
                    balances.add(-1.0)
                } finally {
                    latch.countDown()
                }
            }.start()
        }
        
        // Then: Wait for all operations to complete
        assertTrue(latch.await(30, TimeUnit.SECONDS))
        assertEquals(20, balances.size)
        assertTrue(balances.all { it == 1000.0 })
    }
    
    // MARK: - Memory Management Tests
    
    @Test
    fun testMemoryManagementWithManyWallets() = runBlocking {
        // Given: Create many wallets
        val wallets = mutableListOf<Wallet>()
        
        // When: Create 100 wallets
        repeat(100) { i ->
            val wallet = walletManager.createNewWallet("Memory Test $i")
            wallets.add(wallet)
        }
        
        // Then: All wallets should be accessible
        assertEquals(100, wallets.size)
        wallets.forEach { wallet ->
            assertNotNull(wallet.id)
            assertFalse(wallet.name.isEmpty())
        }
        
        // When: Delete all wallets
        wallets.forEach { wallet ->
            walletManager.deleteWallet(wallet)
        }
        
        // Then: No wallets should remain
        val remainingWallets = walletManager.getAllWallets()
        assertEquals(0, remainingWallets.size)
    }
    
    @Test
    fun testMemoryManagementWithManyTransactions() = runBlocking {
        // Given: Wallet with many transactions
        val wallet = walletManager.createNewWallet("Memory Transaction Test")
        mockBlockchainService.setBalance(100000.0, wallet.address)
        
        // When: Create many transactions
        val transactions = mutableListOf<Transaction>()
        repeat(200) { i ->
            val transaction = walletManager.createTransaction(
                wallet,
                "0xreceiver$i",
                10.0
            )
            transactions.add(transaction)
        }
        
        // Then: All transactions should be accessible
        assertEquals(200, transactions.size)
        
        // When: Get transaction history
        val transactionHistory = walletManager.getTransactionHistory(wallet)
        
        // Then: Should contain all transactions
        assertEquals(200, transactionHistory.size)
        transactions.forEach { transaction ->
            assertTrue(transactionHistory.any { it.id == transaction.id })
        }
    }
    
    // MARK: - Performance Integration Tests
    
    @Test
    fun testBulkTransactionProcessing() = runBlocking {
        // Given: Wallet with high balance
        val wallet = walletManager.createNewWallet("Bulk Test")
        mockBlockchainService.setBalance(1000000.0, wallet.address)
        
        val startTime = System.currentTimeMillis()
        
        // When: Process many transactions
        val transactions = mutableListOf<Transaction>()
        repeat(100) { i ->
            val transaction = walletManager.createTransaction(
                wallet,
                "0xbulkreceiver$i",
                100.0
            )
            transactions.add(transaction)
        }
        
        val endTime = System.currentTimeMillis()
        val processingTime = endTime - startTime
        
        // Then: Processing should complete within reasonable time
        assertTrue(processingTime < 30000) // Less than 30 seconds
        assertEquals(100, transactions.size)
        
        // Then: Verify final balance
        val finalBalance = walletManager.getWalletBalance(wallet)
        val expectedBalance = 1000000.0 - (100 * 100.0) // Initial balance minus sent amount
        assertEquals(expectedBalance, finalBalance, 0.01)
    }
    
    @Test
    fun testLargeDataSynchronization() = runBlocking {
        // Given: Wallet with large transaction history
        val wallet = walletManager.createNewWallet("Large Sync Test")
        
        // Add many transactions
        val transactions = mutableListOf<Transaction>()
        repeat(500) { i ->
            val transaction = Transaction(
                id = java.util.UUID.randomUUID().toString(),
                fromAddress = if (i % 2 == 0) "0xsender$i" else wallet.address,
                toAddress = if (i % 2 == 0) wallet.address else "0xreceiver$i",
                amount = Math.random() * 1000,
                timestamp = System.currentTimeMillis() - (i * 3600 * 1000),
                status = Transaction.STATUS_CONFIRMED,
                hash = "0x" + java.util.UUID.randomUUID().toString().replace("-", "")
            )
            transactions.add(transaction)
            mockBlockchainService.addTransaction(transaction)
        }
        
        val startTime = System.currentTimeMillis()
        
        // When: Synchronize wallet
        walletManager.synchronizeWallet(wallet)
        
        val endTime = System.currentTimeMillis()
        val syncTime = endTime - startTime
        
        // Then: Synchronization should complete within reasonable time
        assertTrue(syncTime < 60000) // Less than 60 seconds
        
        // Then: Verify all transactions are synchronized
        val transactionHistory = walletManager.getTransactionHistory(wallet)
        assertEquals(500, transactionHistory.size)
    }
}