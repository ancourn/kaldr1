package com.kaldrix.wallet.testing

import androidx.benchmark.junit4.BenchmarkRule
import androidx.benchmark.junit4.measureRepeated
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.*
import com.kaldrix.wallet.data.WalletManager
import com.kaldrix.wallet.data.model.Wallet
import com.kaldrix.wallet.data.model.Transaction
import com.kaldrix.wallet.data.service.BlockchainService
import com.kaldrix.wallet.data.service.NetworkService
import com.kaldrix.wallet.data.storage.KeychainStorage
import android.content.Context
import android.os.Debug

@RunWith(AndroidJUnit4::class)
class WalletPerformanceTest {
    
    @get:Rule
    val benchmarkRule = BenchmarkRule()
    
    private lateinit var walletManager: WalletManager
    private lateinit var context: Context
    private lateinit var mockBlockchainService: MockBlockchainService
    private lateinit var mockNetworkService: MockNetworkService
    
    @Before
    fun setup() {
        context = InstrumentationRegistry.getInstrumentation().targetContext
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
    
    // MARK: - Wallet Creation Performance Tests
    
    @Test
    fun testWalletCreationPerformance() {
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Creating a new wallet
                val wallet = walletManager.createNewWallet("Performance Test")
                
                // Then: Wallet should be created successfully
                assertNotNull(wallet)
                assertFalse(wallet.address.isEmpty())
            }
        }
    }
    
    @Test
    fun testMultipleWalletCreationPerformance() {
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Creating multiple wallets
                val wallets = mutableListOf<Wallet>()
                repeat(10) { i ->
                    val wallet = walletManager.createNewWallet("Batch Test $i")
                    wallets.add(wallet)
                }
                
                // Then: All wallets should be created successfully
                assertEquals(10, wallets.size)
                wallets.forEach { wallet ->
                    assertNotNull(wallet.id)
                    assertFalse(wallet.name.isEmpty())
                }
            }
        }
    }
    
    // MARK: - Transaction Processing Performance Tests
    
    @Test
    fun testTransactionCreationPerformance() {
        // Given: Wallet with sufficient balance
        val wallet = runBlocking { walletManager.createNewWallet("Transaction Performance Test") }
        mockBlockchainService.setBalance(10000.0, wallet.address)
        
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Creating a transaction
                val transaction = walletManager.createTransaction(
                    wallet,
                    "0xreceiveraddress",
                    100.0
                )
                
                // Then: Transaction should be created successfully
                assertNotNull(transaction)
                assertEquals(wallet.address, transaction.fromAddress)
                assertEquals(100.0, transaction.amount, 0.0)
            }
        }
    }
    
    @Test
    fun testBulkTransactionCreationPerformance() {
        // Given: Wallet with high balance
        val wallet = runBlocking { walletManager.createNewWallet("Bulk Transaction Test") }
        mockBlockchainService.setBalance(100000.0, wallet.address)
        
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Creating multiple transactions
                val transactions = mutableListOf<Transaction>()
                repeat(20) { i ->
                    val transaction = walletManager.createTransaction(
                        wallet,
                        "0xbulkreceiver$i",
                        50.0
                    )
                    transactions.add(transaction)
                }
                
                // Then: All transactions should be created successfully
                assertEquals(20, transactions.size)
            }
        }
    }
    
    @Test
    fun testTransactionConfirmationPerformance() {
        // Given: Wallet with pending transactions
        val wallet = runBlocking { walletManager.createNewWallet("Confirmation Performance Test") }
        mockBlockchainService.setBalance(5000.0, wallet.address)
        
        // Create pending transactions
        val pendingTransactions = runBlocking {
            val transactions = mutableListOf<Transaction>()
            repeat(10) { i ->
                val transaction = walletManager.createTransaction(
                    wallet,
                    "0xpendingreceiver$i",
                    100.0
                )
                transactions.add(transaction)
            }
            transactions
        }
        
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Confirming all transactions
                val confirmedTransactions = mutableListOf<Transaction>()
                pendingTransactions.forEach { transaction ->
                    mockBlockchainService.confirmTransaction(transaction.id)
                    val confirmed = walletManager.getTransaction(transaction.id)
                    confirmedTransactions.add(confirmed)
                }
                
                // Then: All transactions should be confirmed
                assertEquals(10, confirmedTransactions.size)
                assertTrue(confirmedTransactions.all { it.status == Transaction.STATUS_CONFIRMED })
            }
        }
    }
    
    // MARK: - Data Synchronization Performance Tests
    
    @Test
    fun testWalletSynchronizationPerformance() {
        // Given: Wallet with large transaction history
        val wallet = runBlocking { walletManager.createNewWallet("Sync Performance Test") }
        
        // Add many transactions to blockchain
        runBlocking {
            repeat(100) { i ->
                val transaction = Transaction(
                    id = java.util.UUID.randomUUID().toString(),
                    fromAddress = if (i % 2 == 0) "0xsender$i" else wallet.address,
                    toAddress = if (i % 2 == 0) wallet.address else "0xreceiver$i",
                    amount = Math.random() * 1000,
                    timestamp = System.currentTimeMillis() - (i * 3600 * 1000),
                    status = Transaction.STATUS_CONFIRMED,
                    hash = "0x" + java.util.UUID.randomUUID().toString().replace("-", "")
                )
                mockBlockchainService.addTransaction(transaction)
            }
        }
        
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Synchronizing wallet
                val syncResult = walletManager.synchronizeWallet(wallet)
                
                // Then: Synchronization should complete successfully
                assertTrue(syncResult)
                
                // Then: Transaction history should be complete
                val transactionHistory = walletManager.getTransactionHistory(wallet)
                assertEquals(100, transactionHistory.size)
            }
        }
    }
    
    @Test
    fun testPartialSynchronizationPerformance() {
        // Given: Wallet with existing data
        val wallet = runBlocking { walletManager.createNewWallet("Partial Sync Performance Test") }
        
        // Initial sync with some transactions
        runBlocking {
            repeat(50) { i ->
                val transaction = Transaction(
                    id = java.util.UUID.randomUUID().toString(),
                    fromAddress = if (i % 2 == 0) "0xsender$i" else wallet.address,
                    toAddress = if (i % 2 == 0) wallet.address else "0xreceiver$i",
                    amount = Math.random() * 1000,
                    timestamp = System.currentTimeMillis() - (i * 3600 * 1000),
                    status = Transaction.STATUS_CONFIRMED,
                    hash = "0x" + java.util.UUID.randomUUID().toString().replace("-", "")
                )
                mockBlockchainService.addTransaction(transaction)
            }
            
            // Perform initial sync
            walletManager.synchronizeWallet(wallet)
        }
        
        // Add new transactions
        runBlocking {
            repeat(25) { i ->
                val transaction = Transaction(
                    id = java.util.UUID.randomUUID().toString(),
                    fromAddress = if (i % 2 == 0) "0xsender${i + 50}" else wallet.address,
                    toAddress = if (i % 2 == 0) wallet.address else "0xreceiver${i + 50}",
                    amount = Math.random() * 1000,
                    timestamp = System.currentTimeMillis() - (i * 1800 * 1000),
                    status = Transaction.STATUS_CONFIRMED,
                    hash = "0x" + java.util.UUID.randomUUID().toString().replace("-", "")
                )
                mockBlockchainService.addTransaction(transaction)
            }
        }
        
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Performing partial synchronization
                val syncResult = walletManager.synchronizeWallet(wallet, fromLastSync = true)
                
                // Then: Partial sync should complete successfully
                assertTrue(syncResult)
                
                // Then: Transaction history should include all transactions
                val transactionHistory = walletManager.getTransactionHistory(wallet)
                assertEquals(75, transactionHistory.size)
            }
        }
    }
    
    // MARK: - Cryptographic Operations Performance Tests
    
    @Test
    fun testKeyGenerationPerformance() {
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Generating key pairs
                val keyPair = walletManager.generateKeyPair()
                
                // Then: Key pair should be generated successfully
                assertNotNull(keyPair.privateKey)
                assertNotNull(keyPair.publicKey)
                assertFalse(keyPair.address.isEmpty())
            }
        }
    }
    
    @Test
    fun testMultipleKeyGenerationPerformance() {
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Generating multiple key pairs
                val keyPairs = mutableListOf<KeyPair>()
                repeat(10) {
                    val keyPair = walletManager.generateKeyPair()
                    keyPairs.add(keyPair)
                }
                
                // Then: All key pairs should be generated successfully
                assertEquals(10, keyPairs.size)
                keyPairs.forEach { keyPair ->
                    assertNotNull(keyPair.privateKey)
                    assertNotNull(keyPair.publicKey)
                    assertFalse(keyPair.address.isEmpty())
                }
            }
        }
    }
    
    @Test
    fun testEncryptionDecryptionPerformance() {
        // Given: Wallet and test data
        val wallet = runBlocking { walletManager.createNewWallet("Encryption Performance Test") }
        val testData = "This is a test string for encryption performance testing".toByteArray()
        
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Performing encryption/decryption cycle
                val encrypted = walletManager.encryptData(testData, wallet)
                val decrypted = walletManager.decryptData(encrypted, wallet)
                
                // Then: Data should be correctly encrypted/decrypted
                assertArrayEquals(testData, decrypted)
            }
        }
    }
    
    @Test
    fun testBulkEncryptionDecryptionPerformance() {
        // Given: Wallet and multiple test data
        val wallet = runBlocking { walletManager.createNewWallet("Bulk Encryption Performance Test") }
        val testDataList = List(20) { "Test data $it for bulk encryption testing".toByteArray() }
        
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Performing multiple encryption/decryption cycles
                val results = mutableListOf<Boolean>()
                testDataList.forEach { testData ->
                    val encrypted = walletManager.encryptData(testData, wallet)
                    val decrypted = walletManager.decryptData(encrypted, wallet)
                    results.add(testData.contentEquals(decrypted))
                }
                
                // Then: All data should be correctly encrypted/decrypted
                assertEquals(20, results.size)
                assertTrue(results.all { it })
            }
        }
    }
    
    @Test
    fun testSignatureVerificationPerformance() {
        // Given: Wallet and test message
        val wallet = runBlocking { walletManager.createNewWallet("Signature Performance Test") }
        val testMessage = "Test message for signature verification".toByteArray()
        
        // Create signature
        val signature = runBlocking { walletManager.signMessage(testMessage, wallet) }
        
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Verifying signature
                val isValid = walletManager.verifySignature(signature, testMessage, wallet.publicKey)
                
                // Then: Signature should be valid
                assertTrue(isValid)
            }
        }
    }
    
    @Test
    fun testBulkSignatureVerificationPerformance() {
        // Given: Wallet and multiple test messages
        val wallet = runBlocking { walletManager.createNewWallet("Bulk Signature Performance Test") }
        val testMessages = List(50) { "Test message $it for bulk signature verification".toByteArray() }
        
        // Create signatures
        val signatures = runBlocking {
            testMessages.map { message ->
                walletManager.signMessage(message, wallet)
            }
        }
        
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Verifying multiple signatures
                val results = mutableListOf<Boolean>()
                testMessages.forEachIndexed { index, message ->
                    val isValid = walletManager.verifySignature(signatures[index], message, wallet.publicKey)
                    results.add(isValid)
                }
                
                // Then: All signatures should be valid
                assertEquals(50, results.size)
                assertTrue(results.all { it })
            }
        }
    }
    
    // MARK: - Memory Usage Tests
    
    @Test
    fun testMemoryUsageDuringHeavyOperations() {
        // Given: Memory monitoring setup
        val initialMemory = Debug.getNativeHeapAllocatedSize()
        
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Performing memory-intensive operations
                val wallet = walletManager.createNewWallet("Memory Test")
                
                // Create many transactions
                repeat(100) { i ->
                    walletManager.createTransaction(
                        wallet,
                        "0xmemoryreceiver$i",
                        (i * 10).toDouble()
                    )
                }
                
                // Perform full synchronization
                walletManager.synchronizeWallet(wallet)
            }
        }
        
        // Then: Memory usage should be reasonable
        val finalMemory = Debug.getNativeHeapAllocatedSize()
        val memoryIncrease = finalMemory - initialMemory
        val memoryIncreaseMB = memoryIncrease / (1024 * 1024)
        
        println("Initial Memory: ${initialMemory / (1024 * 1024)} MB")
        println("Final Memory: ${finalMemory / (1024 * 1024)} MB")
        println("Memory Increase: $memoryIncreaseMB MB")
        
        // Assert memory increase is within acceptable limits
        assertTrue(memoryIncreaseMB < 50, "Memory increase should be less than 50MB")
    }
    
    @Test
    fun testMemoryUsageWithManyWallets() {
        // Given: Memory monitoring setup
        val initialMemory = Debug.getNativeHeapAllocatedSize()
        
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Creating many wallets
                val wallets = mutableListOf<Wallet>()
                repeat(50) { i ->
                    val wallet = walletManager.createNewWallet("Memory Wallet $i")
                    wallets.add(wallet)
                }
                
                // Then: All wallets should be accessible
                assertEquals(50, wallets.size)
            }
        }
        
        // Then: Memory usage should be reasonable
        val finalMemory = Debug.getNativeHeapAllocatedSize()
        val memoryIncrease = finalMemory - initialMemory
        val memoryIncreaseMB = memoryIncrease / (1024 * 1024)
        
        println("Initial Memory: ${initialMemory / (1024 * 1024)} MB")
        println("Final Memory: ${finalMemory / (1024 * 1024)} MB")
        println("Memory Increase: $memoryIncreaseMB MB")
        
        // Assert memory increase is within acceptable limits
        assertTrue(memoryIncreaseMB < 25, "Memory increase should be less than 25MB")
    }
    
    // MARK: - Database Performance Tests
    
    @Test
    fun testDatabaseWritePerformance() {
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Performing database write operations
                val wallet = walletManager.createNewWallet("DB Write Test")
                
                // Create and save many transactions
                repeat(100) { i ->
                    val transaction = Transaction(
                        id = java.util.UUID.randomUUID().toString(),
                        fromAddress = wallet.address,
                        toAddress = "0xdbreceiver$i",
                        amount = i.toDouble(),
                        timestamp = System.currentTimeMillis(),
                        status = Transaction.STATUS_CONFIRMED,
                        hash = "0x" + java.util.UUID.randomUUID().toString().replace("-", "")
                    )
                    walletManager.saveTransaction(transaction)
                }
                
                // Then: All transactions should be saved
                val savedTransactions = walletManager.getTransactionHistory(wallet)
                assertEquals(100, savedTransactions.size)
            }
        }
    }
    
    @Test
    fun testDatabaseReadPerformance() {
        // Given: Database with many transactions
        val wallet = runBlocking { walletManager.createNewWallet("DB Read Test") }
        
        // Pre-populate database
        runBlocking {
            repeat(200) { i ->
                val transaction = Transaction(
                    id = java.util.UUID.randomUUID().toString(),
                    fromAddress = if (i % 2 == 0) "0xsender$i" else wallet.address,
                    toAddress = if (i % 2 == 0) wallet.address else "0xreceiver$i",
                    amount = Math.random() * 1000,
                    timestamp = System.currentTimeMillis() - (i * 3600 * 1000),
                    status = Transaction.STATUS_CONFIRMED,
                    hash = "0x" + java.util.UUID.randomUUID().toString().replace("-", "")
                )
                walletManager.saveTransaction(transaction)
            }
        }
        
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Reading transaction history
                val transactions = walletManager.getTransactionHistory(wallet)
                
                // Then: Should read all transactions efficiently
                assertEquals(200, transactions.size)
            }
        }
    }
    
    // MARK: - Network Performance Tests
    
    @Test
    fun testNetworkRequestPerformance() {
        // Given: Connected network service
        mockNetworkService.setConnected(true)
        
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Making network requests
                val wallet = walletManager.createNewWallet("Network Test")
                val balance = walletManager.getWalletBalance(wallet)
                
                // Then: Should get balance successfully
                assertNotNull(balance)
            }
        }
    }
    
    @Test
    fun testConcurrentNetworkRequestsPerformance() {
        // Given: Connected network service
        mockNetworkService.setConnected(true)
        
        benchmarkRule.measureRepeated {
            runBlocking {
                // When: Making concurrent network requests
                val wallets = mutableListOf<Wallet>()
                val balances = mutableListOf<Double>()
                
                // Create wallets and get balances concurrently
                repeat(10) { i ->
                    val wallet = walletManager.createNewWallet("Concurrent Network Test $i")
                    wallets.add(wallet)
                    val balance = walletManager.getWalletBalance(wallet)
                    balances.add(balance)
                }
                
                // Then: All requests should complete successfully
                assertEquals(10, wallets.size)
                assertEquals(10, balances.size)
            }
        }
    }
}

// MARK: - Helper Data Classes

data class KeyPair(
    val privateKey: ByteArray,
    val publicKey: ByteArray,
    val address: String
)