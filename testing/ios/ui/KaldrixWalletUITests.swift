import XCTest

class KaldrixWalletUITests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }
    
    override func tearDown() {
        app = nil
        super.tearDown()
    }
    
    // MARK: - Onboarding Flow Tests
    
    func testOnboardingFlow() {
        // Given: App launches for the first time
        XCTAssertTrue(app.buttons["Get Started"].exists)
        
        // When: User taps Get Started
        app.buttons["Get Started"].tap()
        
        // Then: Should navigate to wallet creation screen
        XCTAssertTrue(app.buttons["Create New Wallet"].exists)
        XCTAssertTrue(app.buttons["Import Existing Wallet"].exists)
    }
    
    func testCreateNewWalletFlow() {
        // Given: User is on wallet creation screen
        navigateToWalletCreation()
        
        // When: User taps Create New Wallet
        app.buttons["Create New Wallet"].tap()
        
        // Then: Should show wallet name input
        XCTAssertTrue(app.textFields["Wallet Name"].exists)
        
        // When: User enters wallet name and continues
        let walletNameTextField = app.textFields["Wallet Name"]
        walletNameTextField.tap()
        walletNameTextField.typeText("Test Wallet")
        app.buttons["Continue"].tap()
        
        // Then: Should show backup phrase
        XCTAssertTrue(app.staticTexts["Backup Phrase"].exists)
        XCTAssertTrue(app.buttons["Copy to Clipboard"].exists)
        
        // When: User confirms backup
        app.buttons["I've Backed Up My Phrase"].tap()
        
        // Then: Should navigate to main wallet screen
        XCTAssertTrue(app.tabBars["Main Tab Bar"].exists)
        XCTAssertTrue(app.buttons["Wallet"].exists)
        XCTAssertTrue(app.buttons["Transactions"].exists)
        XCTAssertTrue(app.buttons["Settings"].exists)
    }
    
    func testImportWalletFlow() {
        // Given: User is on wallet creation screen
        navigateToWalletCreation()
        
        // When: User taps Import Existing Wallet
        app.buttons["Import Existing Wallet"].tap()
        
        // Then: Should show import options
        XCTAssertTrue(app.buttons["Import with Mnemonic"].exists)
        XCTAssertTrue(app.buttons["Import with Private Key"].exists)
        
        // When: User selects mnemonic import
        app.buttons["Import with Mnemonic"].tap()
        
        // Then: Should show mnemonic input
        XCTAssertTrue(app.textViews["Mnemonic Phrase"].exists)
        
        // When: User enters mnemonic and wallet name
        let mnemonicTextView = app.textViews["Mnemonic Phrase"]
        mnemonicTextView.tap()
        mnemonicTextView.typeText("test mnemonic phrase for import")
        
        let walletNameTextField = app.textFields["Wallet Name"]
        walletNameTextField.tap()
        walletNameTextField.typeText("Imported Wallet")
        
        app.buttons["Import Wallet"].tap()
        
        // Then: Should navigate to main wallet screen
        XCTAssertTrue(app.tabBars["Main Tab Bar"].exists)
    }
    
    // MARK: - Wallet Management Tests
    
    func testWalletBalanceDisplay() {
        // Given: User has a wallet
        createTestWallet()
        
        // Then: Should display wallet balance
        XCTAssertTrue(app.staticTexts["Balance"].exists)
        XCTAssertTrue(app.staticTexts["KALD"].exists)
    }
    
    func testWalletAddressDisplay() {
        // Given: User has a wallet
        createTestWallet()
        
        // Then: Should display wallet address
        XCTAssertTrue(app.staticTexts["Wallet Address"].exists)
        XCTAssertTrue(app.buttons["Copy Address"].exists)
    }
    
    func testCopyWalletAddress() {
        // Given: User has a wallet
        createTestWallet()
        
        // When: User taps copy address button
        app.buttons["Copy Address"].tap()
        
        // Then: Should show copy confirmation
        XCTAssertTrue(app.staticTexts["Address Copied"].exists)
    }
    
    func testSwitchBetweenWallets() {
        // Given: User has multiple wallets
        createTestWallet(name: "Wallet 1")
        navigateToSettings()
        createAdditionalWallet(name: "Wallet 2")
        
        // When: User switches wallets
        app.tabBars["Main Tab Bar"].buttons["Wallet"].tap()
        app.buttons["Switch Wallet"].tap()
        
        // Then: Should show wallet selection
        XCTAssertTrue(app.buttons["Wallet 1"].exists)
        XCTAssertTrue(app.buttons["Wallet 2"].exists)
        
        // When: User selects different wallet
        app.buttons["Wallet 2"].tap()
        
        // Then: Should display selected wallet
        XCTAssertTrue(app.staticTexts["Wallet 2"].exists)
    }
    
    // MARK: - Transaction Tests
    
    func testSendTransactionFlow() {
        // Given: User has a wallet with balance
        createTestWallet()
        addTestBalance()
        
        // When: User initiates send transaction
        app.buttons["Send"].tap()
        
        // Then: Should show send transaction screen
        XCTAssertTrue(app.textFields["Recipient Address"].exists)
        XCTAssertTrue(app.textFields["Amount"].exists)
        
        // When: User enters transaction details
        let recipientField = app.textFields["Recipient Address"]
        recipientField.tap()
        recipientField.typeText("0x1234567890123456789012345678901234567890")
        
        let amountField = app.textFields["Amount"]
        amountField.tap()
        amountField.typeText("100")
        
        app.buttons["Continue"].tap()
        
        // Then: Should show confirmation screen
        XCTAssertTrue(app.staticTexts["Transaction Summary"].exists)
        XCTAssertTrue(app.buttons["Confirm Transaction"].exists)
        
        // When: User confirms transaction
        app.buttons["Confirm Transaction"].tap()
        
        // Then: Should show success message
        XCTAssertTrue(app.staticTexts["Transaction Sent Successfully"].exists)
    }
    
    func testReceiveTransactionFlow() {
        // Given: User has a wallet
        createTestWallet()
        
        // When: User taps receive button
        app.buttons["Receive"].tap()
        
        // Then: Should show receive screen with QR code
        XCTAssertTrue(app.staticTexts["Your Wallet Address"].exists)
        XCTAssertTrue(app.images["QR Code"].exists)
        XCTAssertTrue(app.buttons["Share Address"].exists)
    }
    
    func testTransactionHistory() {
        // Given: User has a wallet with transactions
        createTestWallet()
        addTestTransactions()
        
        // When: User navigates to transactions tab
        app.tabBars["Main Tab Bar"].buttons["Transactions"].tap()
        
        // Then: Should show transaction history
        XCTAssertTrue(app.tables["Transaction List"].exists)
        XCTAssertTrue(app.staticTexts["Sent"].exists)
        XCTAssertTrue(app.staticTexts["Received"].exists)
    }
    
    func testTransactionDetails() {
        // Given: User has transactions
        createTestWallet()
        addTestTransactions()
        app.tabBars["Main Tab Bar"].buttons["Transactions"].tap()
        
        // When: User taps on a transaction
        app.tables["Transaction List"].cells.firstMatch.tap()
        
        // Then: Should show transaction details
        XCTAssertTrue(app.staticTexts["Transaction Details"].exists)
        XCTAssertTrue(app.staticTexts["Transaction ID"].exists)
        XCTAssertTrue(app.staticTexts["Status"].exists)
        XCTAssertTrue(app.staticTexts["Amount"].exists)
    }
    
    // MARK: - Settings Tests
    
    func testSettingsNavigation() {
        // Given: User has a wallet
        createTestWallet()
        
        // When: User navigates to settings
        navigateToSettings()
        
        // Then: Should show settings options
        XCTAssertTrue(app.buttons["Security"].exists)
        XCTAssertTrue(app.buttons["Network"].exists)
        XCTAssertTrue(app.buttons["About"].exists)
        XCTAssertTrue(app.buttons["Help"].exists)
    }
    
    func testSecuritySettings() {
        // Given: User is in settings
        createTestWallet()
        navigateToSettings()
        
        // When: User taps security
        app.buttons["Security"].tap()
        
        // Then: Should show security options
        XCTAssertTrue(app.buttons["Enable Biometrics"].exists)
        XCTAssertTrue(app.buttons["Change Password"].exists)
        XCTAssertTrue(app.buttons["Backup Wallet"].exists)
    }
    
    func testBiometricAuthentication() {
        // Given: User is in security settings
        createTestWallet()
        navigateToSettings()
        app.buttons["Security"].tap()
        
        // When: User enables biometrics
        app.buttons["Enable Biometrics"].tap()
        
        // Then: Should show biometric authentication prompt
        XCTAssertTrue(app.staticTexts["Enable Face ID / Touch ID"].exists)
        
        // When: User confirms
        app.buttons["Enable"].tap()
        
        // Then: Should show success message
        XCTAssertTrue(app.staticTexts["Biometric Authentication Enabled"].exists)
    }
    
    func testNetworkSettings() {
        // Given: User is in settings
        createTestWallet()
        navigateToSettings()
        
        // When: User taps network
        app.buttons["Network"].tap()
        
        // Then: Should show network options
        XCTAssertTrue(app.buttons["Mainnet"].exists)
        XCTAssertTrue(app.buttons["Testnet"].exists)
        XCTAssertTrue(app.buttons["Custom RPC"].exists)
    }
    
    func testAboutScreen() {
        // Given: User is in settings
        createTestWallet()
        navigateToSettings()
        
        // When: User taps about
        app.buttons["About"].tap()
        
        // Then: Should show app information
        XCTAssertTrue(app.staticTexts["KALDRIX Wallet"].exists)
        XCTAssertTrue(app.staticTexts["Version"].exists)
        XCTAssertTrue(app.staticTexts["Build Number"].exists)
    }
    
    // MARK: - Error Handling Tests
    
    func testInsufficientBalanceError() {
        // Given: User has a wallet with low balance
        createTestWallet()
        
        // When: User tries to send more than balance
        app.buttons["Send"].tap()
        let recipientField = app.textFields["Recipient Address"]
        recipientField.tap()
        recipientField.typeText("0x1234567890123456789012345678901234567890")
        
        let amountField = app.textFields["Amount"]
        amountField.tap()
        amountField.typeText("1000")
        
        app.buttons["Continue"].tap()
        
        // Then: Should show insufficient balance error
        XCTAssertTrue(app.staticTexts["Insufficient Balance"].exists)
        XCTAssertTrue(app.buttons["OK"].exists)
    }
    
    func testInvalidAddressError() {
        // Given: User has a wallet
        createTestWallet()
        addTestBalance()
        
        // When: User enters invalid address
        app.buttons["Send"].tap()
        let recipientField = app.textFields["Recipient Address"]
        recipientField.tap()
        recipientField.typeText("invalid_address")
        
        let amountField = app.textFields["Amount"]
        amountField.tap()
        amountField.typeText("100")
        
        app.buttons["Continue"].tap()
        
        // Then: Should show invalid address error
        XCTAssertTrue(app.staticTexts["Invalid Address"].exists)
        XCTAssertTrue(app.buttons["OK"].exists)
    }
    
    func testNetworkErrorHandling() {
        // Given: User has a wallet
        createTestWallet()
        
        // When: Network is unavailable (simulated)
        simulateNetworkError()
        
        // When: User tries to get balance
        app.buttons["Refresh"].tap()
        
        // Then: Should show network error
        XCTAssertTrue(app.staticTexts["Network Error"].exists)
        XCTAssertTrue(app.staticTexts["Please check your connection"].exists)
        XCTAssertTrue(app.buttons["Retry"].exists)
    }
    
    // MARK: - Helper Methods
    
    private func navigateToWalletCreation() {
        if app.buttons["Get Started"].exists {
            app.buttons["Get Started"].tap()
        }
    }
    
    private func createTestWallet(name: String = "Test Wallet") {
        navigateToWalletCreation()
        app.buttons["Create New Wallet"].tap()
        
        let walletNameTextField = app.textFields["Wallet Name"]
        walletNameTextField.tap()
        walletNameTextField.typeText(name)
        app.buttons["Continue"].tap()
        
        app.buttons["I've Backed Up My Phrase"].tap()
    }
    
    private func createAdditionalWallet(name: String) {
        app.buttons["Add Wallet"].tap()
        app.buttons["Create New Wallet"].tap()
        
        let walletNameTextField = app.textFields["Wallet Name"]
        walletNameTextField.tap()
        walletNameTextField.typeText(name)
        app.buttons["Continue"].tap()
        
        app.buttons["I've Backed Up My Phrase"].tap()
    }
    
    private func addTestBalance() {
        // Simulate adding balance to wallet
        // This would typically be done through mock data or test backend
    }
    
    private func addTestTransactions() {
        // Simulate adding transactions to wallet
        // This would typically be done through mock data or test backend
    }
    
    private func navigateToSettings() {
        app.tabBars["Main Tab Bar"].buttons["Settings"].tap()
    }
    
    private func simulateNetworkError() {
        // Simulate network error for testing
        // This would typically involve mocking network responses
    }
}