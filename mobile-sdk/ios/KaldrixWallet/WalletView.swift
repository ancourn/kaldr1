import SwiftUI

struct WalletView: View {
    @EnvironmentObject var walletManager: WalletManager
    @State private var showQRCode = false
    @State private var balance: Decimal = 0
    @State private var isLoading = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Balance Card
                    balanceCard
                    
                    // Quick Actions
                    quickActions
                    
                    // Recent Transactions
                    recentTransactions
                }
                .padding()
            }
            .navigationTitle("Wallet")
            .refreshable {
                await refreshData()
            }
        }
    }
    
    private var balanceCard: some View {
        VStack(spacing: 16) {
            Text("Total Balance")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Text("$\(balance, specifier: "%.2f")")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(.primary)
            
            Text("≈ \(balance / 1000, specifier: "%.4f") KALD")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Button(action: {
                showQRCode = true
            }) {
                HStack {
                    Image(systemName: "qrcode")
                    Text("Show Address")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue.opacity(0.1))
                .foregroundColor(.blue)
                .cornerRadius(10)
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(15)
    }
    
    private var quickActions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundColor(.primary)
            
            HStack(spacing: 16) {
                Button(action: {
                    // Navigate to send view
                }) {
                    VStack(spacing: 8) {
                        Image(systemName: "paperplane")
                            .font(.title2)
                        Text("Send")
                            .font(.caption)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .foregroundColor(.blue)
                    .cornerRadius(10)
                }
                
                Button(action: {
                    // Navigate to receive view
                }) {
                    VStack(spacing: 8) {
                        Image(systemName: "qrcode")
                            .font(.title2)
                        Text("Receive")
                            .font(.caption)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .foregroundColor(.green)
                    .cornerRadius(10)
                }
                
                Button(action: {
                    // Navigate to buy/sell
                }) {
                    VStack(spacing: 8) {
                        Image(systemName: "dollarsign.circle")
                            .font(.title2)
                        Text("Buy/Sell")
                            .font(.caption)
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
    
    private var recentTransactions: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Transactions")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button("See All") {
                    // Navigate to transactions view
                }
                .font(.subheadline)
                .foregroundColor(.blue)
            }
            
            if walletManager.recentTransactions.isEmpty {
                Text("No transactions yet")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(10)
            } else {
                ForEach(walletManager.recentTransactions.prefix(5)) { transaction in
                    TransactionRow(transaction: transaction)
                }
            }
        }
    }
    
    private func refreshData() async {
        isLoading = true
        do {
            balance = try await walletManager.getBalance()
            await walletManager.fetchTransactions()
        } catch {
            print("Failed to refresh data: \(error)")
        }
        isLoading = false
    }
}

struct TransactionRow: View {
    let transaction: Transaction
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(transaction.type == .sent ? "Sent" : "Received")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(transaction.date, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(transaction.amount, specifier: "%.4f") KALD")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(transaction.type == .sent ? .red : .green)
                
                Text(transaction.status.rawValue)
                    .font(.caption)
                    .foregroundColor(transaction.status == .confirmed ? .green : .orange)
            }
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .cornerRadius(10)
    }
}

#Preview {
    WalletView()
        .environmentObject(WalletManager())
}