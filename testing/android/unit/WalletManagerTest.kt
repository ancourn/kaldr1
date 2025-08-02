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

@RunWith(AndroidJUnit4::class)
class WalletManagerTest {
    
    private lateinit var walletManager: WalletManager
    private lateinit var mockKeychain: MockKeychainStorage
    private lateinit var mockBlockchainService: MockBlockchainService
    private lateinit var mockNetworkService: MockNetworkService
    
    @Before
    fun setup() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        mockKeychain = MockKeychainStorage()
        mockBlockchainService = MockBlockchainService()
        mockNetworkService = MockNetworkService()
        
        walletManager = WalletManager(
            context = context,
            keychainStorage = mockKeychain,
            blockchainService = mockBlockchainService,
            networkService = mockNetworkService
        )
    }
    
    @After
    fun tearDown() {
        walletManager.cleanup()
    }
    
    // MARK: - Wallet Creation Tests
    
    @Test
    fun testCreateNewWallet() = runBlocking {
        // Given
        val walletName = "Test Wallet"
        
        // When
        val wallet = walletManager.createNewWallet(walletName)
        
        // Then
        assertNotNull(wallet)
        assertEquals(walletName, wallet.name)
        assertFalse(wallet.address.isEmpty())
        assertFalse(wallet.publicKey.isEmpty())
        assertEquals(0.0, wallet.balance, 0.0)
    }
    
    @Test
    fun testCreateWalletWithInvalidName() = runBlocking {
        // Given
        val invalidNames = listOf("", "   ", null)
        
        for (name in invalidNames) {
            // When & Then
            try {
                walletManager.createNewWallet(name)
                fail("Should have thrown error for invalid name: $name")
            } catch (e: WalletError) {
                assertEquals(WalletError.INVALID_NAME, e.code)
            }
        }
    }
    
    // MARK: - Wallet Import Tests
    
    @Test
    fun testImportWalletWithMnemonic() = runBlocking {
        // Given
        val mnemonic = "test mnemonic phrase for wallet import"
        val walletName = "Imported Wallet"
        
        // When
        val wallet = walletManager.importWalletWithMnemonic(mnemonic, walletName)
        
        // Then
        assertNotNull(wallet)
        assertEquals(walletName, wallet.name)
        assertFalse(wallet.address.isEmpty())
    }
    
    @Test
    fun testImportWalletWithInvalidMnemonic() = runBlocking {
        // Given
        val invalidMnemonics = listOf("", "   ", "too short", null)
        
        for (mnemonic in invalidMnemonics) {
            // When & Then
            try {
                walletManager.importWalletWithMnemonic(mnemonic, "Test")
                fail("Should have thrown error for invalid mnemonic")
            } catch (e: WalletError) {
                assertEquals(WalletError.INVALID_MNEMONIC, e.code)
            }
        }
    }
    
    // MARK: - Wallet Management Tests
    
    @Test
    fun testGetWalletBalance() = runBlocking {
        // Given
        val wallet = walletManager.createNewWallet("Balance Test")
        val expectedBalance = 1000.0
        
        // Mock blockchain response
        mockBlockchainService.setBalance(expectedBalance)
        
        // When
        val balance = walletManager.getWalletBalance(wallet)
        
        // Then
        assertEquals(expectedBalance, balance, 0.0)
    }
    
    @Test
    fun testListAllWallets() = runBlocking {
        // Given
        val wallet1 = walletManager.createNewWallet("Wallet 1")
        val wallet2 = walletManager.createNewWallet("Wallet 2")
        
        // When
        val wallets = walletManager.getAllWallets()
        
        // Then
        assertEquals(2, wallets.size)
        assertTrue(wallets.any { it.id == wallet1.id })
        assertTrue(wallets.any { it.id == wallet2.id })
    }
    
    @Test
    fun testDeleteWallet() = runBlocking {
        // Given
        val wallet = walletManager.createNewWallet("Delete Test")
        
        // When
        walletManager.deleteWallet(wallet)
        
        // Then
        val wallets = walletManager.getAllWallets()
        assertFalse(wallets.any { it.id == wallet.id })
    }
    
    // MARK: - Transaction Tests
    
    @Test
    fun testCreateTransaction() = runBlocking {
        // Given
        val senderWallet = walletManager.createNewWallet("Sender")
        val receiverAddress = "0x1234567890123456789012345678901234567890"
        val amount = 100.0
        
        // Mock blockchain service
        mockBlockchainService.setBalance(1000.0)
        
        // When
        val transaction = walletManager.createTransaction(senderWallet, receiverAddress, amount)
        
        // Then
        assertNotNull(transaction)
        assertEquals(senderWallet.address, transaction.fromAddress)
        assertEquals(receiverAddress, transaction.toAddress)
        assertEquals(amount, transaction.amount, 0.0)
        assertEquals(Transaction.STATUS_PENDING, transaction.status)
    }
    
    @Test
    fun testCreateTransactionWithInsufficientBalance() = runBlocking {
        // Given
        val senderWallet = walletManager.createNewWallet("Sender")
        val receiverAddress = "0x1234567890123456789012345678901234567890"
        val amount = 1000.0
        
        // Mock blockchain service with low balance
        mockBlockchainService.setBalance(10.0)
        
        // When & Then
        try {
            walletManager.createTransaction(senderWallet, receiverAddress, amount)
            fail("Should have thrown error for insufficient balance")
        } catch (e: WalletError) {
            assertEquals(WalletError.INSUFFICIENT_BALANCE, e.code)
        }
    }
    
    // MARK: - Security Tests
    
    @Test
    fun testWalletEncryption() = runBlocking {
        // Given
        val wallet = walletManager.createNewWallet("Encryption Test")
        val password = "securePassword123!"
        
        // When
        walletManager.encryptWallet(wallet, password)
        val isEncrypted = walletManager.isWalletEncrypted(wallet)
        
        // Then
        assertTrue(isEncrypted)
    }
    
    @Test
    fun testWalletDecryption() = runBlocking {
        // Given
        val wallet = walletManager.createNewWallet("Decryption Test")
        val password = "securePassword123!"
        
        // When
        walletManager.encryptWallet(wallet, password)
        val decryptedWallet = walletManager.decryptWallet(wallet, password)
        
        // Then
        assertNotNull(decryptedWallet)
        assertEquals(wallet.id, decryptedWallet.id)
    }
    
    @Test
    fun testWalletDecryptionWithWrongPassword() = runBlocking {
        // Given
        val wallet = walletManager.createNewWallet("Wrong Password Test")
        val correctPassword = "securePassword123!"
        val wrongPassword = "wrongPassword"
        
        // When
        walletManager.encryptWallet(wallet, correctPassword)
        
        // Then
        try {
            walletManager.decryptWallet(wallet, wrongPassword)
            fail("Should have thrown error for wrong password")
        } catch (e: WalletError) {
            assertEquals(WalletError.INVALID_PASSWORD, e.code)
        }
    }
    
    // MARK: - Network Tests
    
    @Test
    fun testNetworkConnectivity() = runBlocking {
        // Given
        val wallet = walletManager.createNewWallet("Network Test")
        
        // When: Network is connected
        mockNetworkService.setConnected(true)
        
        // Then: Should be able to get balance
        val balance = walletManager.getWalletBalance(wallet)
        assertNotNull(balance)
        
        // When: Network is disconnected
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
        // Given
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
    
    // MARK: - Blockchain Tests
    
    @Test
    fun testBlockchainTransactionConfirmation() = runBlocking {
        // Given
        val wallet = walletManager.createNewWallet("Confirmation Test")
        mockBlockchainService.setBalance(1000.0)
        
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
        // Given
        val wallet = walletManager.createNewWallet("Failure Test")
        mockBlockchainService.setBalance(1000.0)
        
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
    
    // MARK: - Data Persistence Tests
    
    @Test
    fun testWalletPersistence() = runBlocking {
        // Given
        val walletName = "Persistence Test"
        val wallet = walletManager.createNewWallet(walletName)
        
        // When: Create new wallet manager instance
        val newWalletManager = WalletManager(
            context = InstrumentationRegistry.getInstrumentation().targetContext,
            keychainStorage = mockKeychain,
            blockchainService = mockBlockchainService,
            networkService = mockNetworkService
        )
        
        // Then: Should be able to retrieve persisted wallet
        val wallets = newWalletManager.getAllWallets()
        assertTrue(wallets.any { it.id == wallet.id && it.name == walletName })
    }
    
    @Test
    fun testTransactionPersistence() = runBlocking {
        // Given
        val wallet = walletManager.createNewWallet("Transaction Persistence Test")
        mockBlockchainService.setBalance(1000.0)
        
        // When: Create transaction
        val transaction = walletManager.createTransaction(
            wallet,
            "0xreceiveraddress",
            100.0
        )
        
        // When: Create new wallet manager instance
        val newWalletManager = WalletManager(
            context = InstrumentationRegistry.getInstrumentation().targetContext,
            keychainStorage = mockKeychain,
            blockchainService = mockBlockchainService,
            networkService = mockNetworkService
        )
        
        // Then: Should be able to retrieve persisted transaction
        val transactions = newWalletManager.getTransactionHistory(wallet)
        assertTrue(transactions.any { it.id == transaction.id })
    }
}

// MARK: - Mock Classes

class MockKeychainStorage : KeychainStorage {
    private val storage = mutableMapOf<String, ByteArray>()
    
    override fun save(key: String, data: ByteArray) {
        storage[key] = data
    }
    
    override fun load(key: String): ByteArray? {
        return storage[key]
    }
    
    override fun delete(key: String) {
        storage.remove(key)
    }
    
    override fun exists(key: String): Boolean {
        return storage.containsKey(key)
    }
    
    fun clear() {
        storage.clear()
    }
}

class MockBlockchainService : BlockchainService {
    private val balances = mutableMapOf<String, Double>()
    private val transactions = mutableListOf<Transaction>()
    private val confirmedTransactions = mutableSetOf<String>()
    private var nextTransactionShouldFail = false
    private var nextError: Exception? = null
    
    fun setBalance(balance: Double) {
        // Set balance for all addresses
        balances.clear()
        balances["default"] = balance
    }
    
    fun setBalance(balance: Double, address: String) {
        balances[address] = balance
    }
    
    fun addTransaction(transaction: Transaction) {
        transactions.add(transaction)
        if (transaction.status == Transaction.STATUS_CONFIRMED) {
            confirmedTransactions.add(transaction.id)
        }
    }
    
    fun confirmTransaction(transactionId: String) {
        confirmedTransactions.add(transactionId)
        val index = transactions.indexOfFirst { it.id == transactionId }
        if (index != -1) {
            transactions[index] = transactions[index].copy(status = Transaction.STATUS_CONFIRMED)
        }
    }
    
    fun setNextTransactionToFail() {
        nextTransactionShouldFail = true
    }
    
    fun setNextError(error: Exception) {
        nextError = error
    }
    
    override suspend fun getBalance(address: String): Double {
        nextError?.let {
            val error = nextError
            nextError = null
            throw error!!
        }
        
        return balances[address] ?: balances["default"] ?: 0.0
    }
    
    override suspend fun sendTransaction(transaction: Transaction): Transaction {
        if (nextTransactionShouldFail) {
            nextTransactionShouldFail = false
            throw Exception("Transaction failed")
        }
        
        nextError?.let {
            val error = nextError
            nextError = null
            throw error!!
        }
        
        val confirmedTransaction = transaction.copy(
            status = Transaction.STATUS_CONFIRMED,
            hash = "0x" + java.util.UUID.randomUUID().toString().replace("-", "")
        )
        transactions.add(confirmedTransaction)
        confirmedTransactions.add(confirmedTransaction.id)
        
        return confirmedTransaction
    }
    
    override suspend fun getTransactionHistory(address: String): List<Transaction> {
        return transactions.filter { 
            it.fromAddress == address || it.toAddress == address 
        }
    }
    
    override suspend fun getTransaction(transactionId: String): Transaction {
        return transactions.find { it.id == transactionId } 
            ?: throw Exception("Transaction not found")
    }
}

class MockNetworkService : NetworkService {
    private var isConnected = true
    private var shouldFail = false
    private var failureCount = 0
    
    fun setConnected(connected: Boolean) {
        isConnected = connected
    }
    
    fun setShouldFail(fail: Boolean) {
        shouldFail = fail
    }
    
    override suspend fun <T> request(
        endpoint: String,
        method: String,
        body: String?,
        responseType: Class<T>
    ): T {
        if (shouldFail) {
            failureCount++
            throw Exception("Network request failed")
        }
        
        if (!isConnected) {
            throw Exception("No network connection")
        }
        
        // Mock successful response
        return when {
            endpoint.contains("balance") -> {
                BalanceResponse(1000.0) as T
            }
            endpoint.contains("transaction") -> {
                TransactionResponse(
                    id = java.util.UUID.randomUUID().toString(),
                    status = "confirmed",
                    hash = "0x" + java.util.UUID.randomUUID().toString().replace("-", "")
                ) as T
            }
            else -> {
                throw Exception("Unknown endpoint")
            }
        }
    }
    
    override fun isConnected(): Boolean {
        return isConnected
    }
}

// MARK: - Mock Response Classes

data class BalanceResponse(val balance: Double)

data class TransactionResponse(
    val id: String,
    val status: String,
    val hash: String
)