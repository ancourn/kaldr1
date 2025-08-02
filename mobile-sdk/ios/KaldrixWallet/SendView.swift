import SwiftUI
import CodeScanner

struct SendView: View {
    @EnvironmentObject var walletManager: WalletManager
    @EnvironmentObject var biometricManager: BiometricManager
    @State private var recipientAddress = ""
    @State private var amount = ""
    @State private var note = ""
    @State private var showingScanner = false
    @State private var showingConfirmation = false
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var fee: Decimal = 0
    @State private var balance: Decimal = 0
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Recipient Section
                    recipientSection
                    
                    // Amount Section
                    amountSection
                    
                    // Fee Information
                    feeSection
                    
                    // Note Section (Optional)
                    noteSection
                    
                    // Send Button
                    sendButton
                }
                .padding()
            }
            .navigationTitle("Send")
            .navigationBarTitleDisplayMode(.large)
            .alert("Error", isPresented: .constant(!errorMessage.isEmpty)) {
                Button("OK") { errorMessage = "" }
            } message: {
                Text(errorMessage)
            }
            .sheet(isPresented: $showingScanner) {
                CodeScannerView(codeTypes: [.qr]) { result in
                    handleScanResult(result)
                }
            }
            .sheet(isPresented: $showingConfirmation) {
                confirmationView
            }
            .onAppear {
                loadBalance()
            }
        }
    }
    
    private var recipientSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recipient Address")
                .font(.headline)
                .foregroundColor(.primary)
            
            HStack {
                TextField("Enter recipient address", text: $recipientAddress)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .autocapitalization(.none)
                    .autocorrectionDisabled()
                
                Button(action: {
                    showingScanner = true
                }) {
                    Image(systemName: "qrcode.viewfinder")
                        .font(.title2)
                        .foregroundColor(.blue)
                }
            }
            
            if !recipientAddress.isEmpty && !isValidAddress(recipientAddress) {
                Text("Invalid address format")
                    .font(.caption)
                    .foregroundColor(.red)
            }
        }
    }
    
    private var amountSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Amount")
                .font(.headline)
                .foregroundColor(.primary)
            
            HStack {
                TextField("0.00", text: $amount)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .keyboardType(.decimalPad)
                
                Text("KALD")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            HStack {
                Text("Available: \(balance, specifier: "%.4f") KALD")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Button("Max") {
                    amount = String(format: "%.4f", Double(truncating: balance as NSNumber))
                }
                .font(.caption)
                .foregroundColor(.blue)
            }
            
            if let amountValue = Decimal(string: amount), amountValue > balance {
                Text("Insufficient balance")
                    .font(.caption)
                    .foregroundColor(.red)
            }
        }
    }
    
    private var feeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Network Fee")
                .font(.headline)
                .foregroundColor(.primary)
            
            HStack {
                Text("Estimated Fee:")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("\(fee, specifier: "%.6f") KALD")
                    .font(.subheadline)
                    .foregroundColor(.primary)
            }
            
            Button("Recalculate Fee") {
                calculateFee()
            }
            .font(.caption)
            .foregroundColor(.blue)
        }
    }
    
    private var noteSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Note (Optional)")
                .font(.headline)
                .foregroundColor(.primary)
            
            TextField("Add a note for this transaction", text: $note, axis: .vertical)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .lineLimit(3)
        }
    }
    
    private var sendButton: some View {
        Button(action: {
            validateAndPrepareSend()
        }) {
            HStack {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.8)
                } else {
                    Image(systemName: "paperplane")
                    Text("Send")
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(canSend ? Color.blue : Color.gray)
            .foregroundColor(.white)
            .cornerRadius(10)
        }
        .disabled(!canSend || isLoading)
    }
    
    private var confirmationView: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Confirm Transaction")
                    .font(.title)
                    .fontWeight(.bold)
                
                VStack(spacing: 16) {
                    HStack {
                        Text("To:")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(recipientAddress.prefix(10) + "..." + recipientAddress.suffix(10))
                            .font(.subheadline)
                            .foregroundColor(.primary)
                    }
                    
                    HStack {
                        Text("Amount:")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(amount) KALD")
                            .font(.subheadline)
                            .foregroundColor(.primary)
                    }
                    
                    HStack {
                        Text("Fee:")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(fee, specifier: "%.6f") KALD")
                            .font(.subheadline)
                            .foregroundColor(.primary)
                    }
                    
                    HStack {
                        Text("Total:")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        Spacer()
                        Text("\((Decimal(string: amount) ?? 0 + fee), specifier: "%.4f") KALD")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(.primary)
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(10)
                
                if !note.isEmpty {
                    HStack {
                        Text("Note:")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(note)
                            .font(.subheadline)
                            .foregroundColor(.primary)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(10)
                }
                
                VStack(spacing: 12) {
                    Button(action: {
                        confirmSend()
                    }) {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            } else {
                                Text("Confirm Send")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .disabled(isLoading)
                    
                    Button("Cancel") {
                        showingConfirmation = false
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red.opacity(0.1))
                    .foregroundColor(.red)
                    .cornerRadius(10)
                }
            }
            .padding()
            .navigationTitle("Confirm")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    private var canSend: Bool {
        guard !recipientAddress.isEmpty,
              let amountValue = Decimal(string: amount),
              amountValue > 0,
              amountValue <= balance,
              isValidAddress(recipientAddress) else {
            return false
        }
        return true
    }
    
    private func isValidAddress(_ address: String) -> Bool {
        // Basic address validation - implement proper validation logic
        return address.count >= 30 && address.count <= 50
    }
    
    private func handleScanResult(_ result: Result<ScanResult, ScanError>) {
        showingScanner = false
        switch result {
        case .success(let scanResult):
            recipientAddress = scanResult.string
        case .failure(let error):
            errorMessage = "Failed to scan QR code: \(error.localizedDescription)"
        }
    }
    
    private func loadBalance() {
        Task {
            do {
                balance = try await walletManager.getBalance()
            } catch {
                errorMessage = "Failed to load balance: \(error.localizedDescription)"
            }
        }
    }
    
    private func calculateFee() {
        Task {
            do {
                if let amountValue = Decimal(string: amount) {
                    fee = try await walletManager.estimateFee(amount: amountValue)
                }
            } catch {
                errorMessage = "Failed to calculate fee: \(error.localizedDescription)"
            }
        }
    }
    
    private func validateAndPrepareSend() {
        errorMessage = ""
        
        guard canSend else {
            errorMessage = "Please fill in all required fields correctly"
            return
        }
        
        showingConfirmation = true
    }
    
    private func confirmSend() {
        isLoading = true
        
        Task {
            do {
                let authenticated = await biometricManager.authenticate()
                if authenticated {
                    let amountValue = Decimal(string: amount) ?? 0
                    try await walletManager.sendTransaction(
                        amount: amountValue,
                        to: recipientAddress,
                        note: note.isEmpty ? nil : note
                    )
                    
                    // Reset form
                    recipientAddress = ""
                    amount = ""
                    note = ""
                    showingConfirmation = false
                    
                    // Show success message
                    errorMessage = "Transaction sent successfully!"
                } else {
                    errorMessage = "Authentication failed"
                }
            } catch {
                errorMessage = "Failed to send transaction: \(error.localizedDescription)"
            }
            isLoading = false
        }
    }
}

#Preview {
    SendView()
        .environmentObject(WalletManager())
        .environmentObject(BiometricManager())
}