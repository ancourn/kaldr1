import SwiftUI

struct TransactionView: View {
    @EnvironmentObject var walletManager: WalletManager
    @State private var transactions: [Transaction] = []
    @State private var isLoading = false
    @State private var selectedTransaction: Transaction?
    @State private var showingTransactionDetail = false
    
    var body: some View {
        NavigationView {
            VStack {
                if isLoading && transactions.isEmpty {
                    ProgressView("Loading transactions...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if transactions.isEmpty {
                    emptyStateView
                } else {
                    transactionList
                }
            }
            .navigationTitle("Transactions")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await refreshTransactions()
            }
            .onAppear {
                loadTransactions()
            }
            .sheet(isPresented: $showingTransactionDetail) {
                if let transaction = selectedTransaction {
                    TransactionDetailView(transaction: transaction)
                }
            }
        }
    }
    
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "list.bullet")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("No Transactions")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.primary)
            
            Text("Your transaction history will appear here")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var transactionList: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                ForEach(transactions) { transaction in
                    TransactionCard(transaction: transaction)
                        .onTapGesture {
                            selectedTransaction = transaction
                            showingTransactionDetail = true
                        }
                }
            }
            .padding()
        }
    }
    
    private func loadTransactions() {
        Task {
            await refreshTransactions()
        }
    }
    
    private func refreshTransactions() async {
        isLoading = true
        do {
            transactions = try await walletManager.sdk.getTransactions()
        } catch {
            print("Failed to load transactions: \(error)")
        }
        isLoading = false
    }
}

struct TransactionCard: View {
    let transaction: Transaction
    
    var body: some View {
        HStack(spacing: 16) {
            // Transaction Icon
            ZStack {
                Circle()
                    .fill(transaction.type == .sent ? Color.red.opacity(0.2) : Color.green.opacity(0.2))
                    .frame(width: 40, height: 40)
                
                Image(systemName: transaction.type == .sent ? "arrow.up" : "arrow.down")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(transaction.type == .sent ? .red : .green)
            }
            
            // Transaction Details
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(transaction.type == .sent ? "Sent" : "Received")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    Text("\(transaction.amount, specifier: "%.4f") KALD")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(transaction.type == .sent ? .red : .green)
                }
                
                HStack {
                    Text(transaction.address.prefix(8) + "..." + transaction.address.suffix(8))
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text(transaction.date, style: .date)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Status Badge
                HStack {
                    StatusBadge(status: transaction.status)
                    
                    if let confirmations = transaction.confirmations, confirmations > 0 {
                        Text("\(confirmations) confirmations")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
            }
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .cornerRadius(12)
    }
}

struct StatusBadge: View {
    let status: TransactionStatus
    
    var body: some View {
        Text(status.rawValue.capitalized)
            .font(.caption)
            .fontWeight(.medium)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor)
            .foregroundColor(.white)
            .cornerRadius(12)
    }
    
    private var statusColor: Color {
        switch status {
        case .confirmed:
            return .green
        case .pending:
            return .orange
        case .failed:
            return .red
        case .cancelled:
            return .gray
        }
    }
}

struct TransactionDetailView: View {
    let transaction: Transaction
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Transaction Header
                    transactionHeader
                    
                    // Transaction Details
                    transactionDetails
                    
                    // Additional Information
                    additionalInformation
                    
                    // Action Buttons
                    actionButtons
                }
                .padding()
            }
            .navigationTitle("Transaction Details")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(trailing: Button("Done") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
    
    private var transactionHeader: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(transaction.type == .sent ? Color.red.opacity(0.2) : Color.green.opacity(0.2))
                    .frame(width: 60, height: 60)
                
                Image(systemName: transaction.type == .sent ? "arrow.up" : "arrow.down")
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(transaction.type == .sent ? .red : .green)
            }
            
            Text(transaction.type == .sent ? "Sent" : "Received")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            Text("\(transaction.amount, specifier: "%.4f") KALD")
                .font(.title3)
                .fontWeight(.medium)
                .foregroundColor(transaction.type == .sent ? .red : .green)
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .cornerRadius(15)
    }
    
    private var transactionDetails: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Transaction Details")
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(spacing: 12) {
                DetailRow(label: "Transaction ID", value: transaction.id)
                DetailRow(label: "Status", value: transaction.status.rawValue.capitalized)
                DetailRow(label: "Date", value: transaction.date.formatted())
                DetailRow(label: "Address", value: transaction.address)
                
                if let fee = transaction.fee {
                    DetailRow(label: "Fee", value: "\(fee, specifier: "%.6f") KALD")
                }
                
                if let confirmations = transaction.confirmations {
                    DetailRow(label: "Confirmations", value: "\(confirmations)")
                }
            }
        }
    }
    
    private var additionalInformation: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Additional Information")
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(spacing: 12) {
                if let note = transaction.note, !note.isEmpty {
                    DetailRow(label: "Note", value: note)
                }
                
                DetailRow(label: "Type", value: transaction.type.rawValue.capitalized)
                DetailRow(label: "Created", value: transaction.createdAt.formatted())
            }
        }
    }
    
    private var actionButtons: some View {
        VStack(spacing: 12) {
            Button(action: {
                copyTransactionID()
            }) {
                HStack {
                    Image(systemName: "doc.on.doc")
                    Text("Copy Transaction ID")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue.opacity(0.1))
                .foregroundColor(.blue)
                .cornerRadius(10)
            }
            
            Button(action: {
                copyAddress()
            }) {
                HStack {
                    Image(systemName: "doc.on.doc")
                    Text("Copy Address")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.gray.opacity(0.1))
                .foregroundColor(.primary)
                .cornerRadius(10)
            }
            
            if transaction.status == .pending {
                Button(action: {
                    // Implement refresh transaction status
                }) {
                    HStack {
                        Image(systemName: "arrow.clockwise")
                        Text("Refresh Status")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange.opacity(0.1))
                    .foregroundColor(.orange)
                    .cornerRadius(10)
                }
            }
        }
    }
    
    private func copyTransactionID() {
        UIPasteboard.general.string = transaction.id
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
    }
    
    private func copyAddress() {
        UIPasteboard.general.string = transaction.address
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
    }
}

struct DetailRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .foregroundColor(.primary)
                .multilineTextAlignment(.trailing)
        }
    }
}

#Preview {
    TransactionView()
        .environmentObject(WalletManager())
}