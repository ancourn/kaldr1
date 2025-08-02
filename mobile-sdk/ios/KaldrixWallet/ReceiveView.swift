import SwiftUI

struct ReceiveView: View {
    @EnvironmentObject var walletManager: WalletManager
    @State private var showingShareSheet = false
    @State private var amount = ""
    @State private var generatedQRCode: UIImage?
    @State private var currentAddress: String = ""
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 30) {
                    // QR Code Section
                    qrCodeSection
                    
                    // Address Section
                    addressSection
                    
                    // Amount Section (Optional)
                    amountSection
                    
                    // Share Options
                    shareOptions
                }
                .padding()
            }
            .navigationTitle("Receive")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showingShareSheet) {
                if let image = generatedQRCode {
                    ShareSheet(items: [image])
                }
            }
            .onAppear {
                loadWalletAddress()
            }
        }
    }
    
    private var qrCodeSection: some View {
        VStack(spacing: 16) {
            Text("Your Address")
                .font(.headline)
                .foregroundColor(.primary)
            
            if let qrCode = generatedQRCode {
                Image(uiImage: qrCode)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 200, height: 200)
                    .background(Color.white)
                    .cornerRadius(10)
                    .shadow(radius: 5)
            } else {
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 200, height: 200)
                    .cornerRadius(10)
                    .overlay(
                        ProgressView()
                            .scaleEffect(0.5)
                    )
            }
            
            Button(action: {
                showingShareSheet = true
            }) {
                HStack {
                    Image(systemName: "square.and.arrow.up")
                    Text("Share QR Code")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue.opacity(0.1))
                .foregroundColor(.blue)
                .cornerRadius(10)
            }
        }
    }
    
    private var addressSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Wallet Address")
                .font(.headline)
                .foregroundColor(.primary)
            
            HStack {
                Text(currentAddress)
                    .font(.system(.body, design: .monospaced))
                    .foregroundColor(.primary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                
                Spacer()
                
                Button(action: {
                    copyAddress()
                }) {
                    Image(systemName: "doc.on.doc")
                        .font(.title2)
                        .foregroundColor(.blue)
                }
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(10)
        }
    }
    
    private var amountSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Request Amount (Optional)")
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
            
            Text("Adding an amount will create a payment request QR code")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
    
    private var shareOptions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Share Options")
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(spacing: 12) {
                Button(action: {
                    copyAddress()
                }) {
                    HStack {
                        Image(systemName: "doc.on.doc")
                        Text("Copy Address")
                        Spacer()
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .foregroundColor(.primary)
                    .cornerRadius(10)
                }
                
                Button(action: {
                    shareAddress()
                }) {
                    HStack {
                        Image(systemName: "square.and.arrow.up")
                        Text("Share Address")
                        Spacer()
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .foregroundColor(.primary)
                    .cornerRadius(10)
                }
                
                Button(action: {
                    generatePaymentRequest()
                }) {
                    HStack {
                        Image(systemName: "link")
                        Text("Generate Payment Link")
                        Spacer()
                    }
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .foregroundColor(.blue)
                    .cornerRadius(10)
                }
            }
        }
    }
    
    private func loadWalletAddress() {
        Task {
            do {
                currentAddress = try await walletManager.getWalletAddress()
                generateQRCode()
            } catch {
                print("Failed to load wallet address: \(error)")
            }
        }
    }
    
    private func generateQRCode() {
        var qrString = "kaldrix:\(currentAddress)"
        
        if let amountValue = Decimal(string: amount), amountValue > 0 {
            qrString += "?amount=\(amountValue)"
        }
        
        DispatchQueue.main.async {
            generatedQRCode = generateQRCode(from: qrString)
        }
    }
    
    private func generateQRCode(from string: String) -> UIImage {
        let data = string.data(using: String.Encoding.ascii)
        
        if let filter = CIFilter(name: "CIQRCodeGenerator") {
            filter.setValue(data, forKey: "inputMessage")
            let transform = CGAffineTransform(scaleX: 10, y: 10)
            
            if let output = filter.outputImage?.transformed(by: transform) {
                return UIImage(ciImage: output)
            }
        }
        
        return UIImage(systemName: "qrcode") ?? UIImage()
    }
    
    private func copyAddress() {
        UIPasteboard.general.string = currentAddress
        
        // Show feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
    }
    
    private func shareAddress() {
        let activityVC = UIActivityViewController(
            activityItems: [currentAddress],
            applicationActivities: nil
        )
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            window.rootViewController?.present(activityVC, animated: true)
        }
    }
    
    private func generatePaymentRequest() {
        var paymentLink = "https://kaldrix.io/pay?address=\(currentAddress)"
        
        if let amountValue = Decimal(string: amount), amountValue > 0 {
            paymentLink += "&amount=\(amountValue)"
        }
        
        UIPasteboard.general.string = paymentLink
        
        // Show feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    var items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

#Preview {
    ReceiveView()
        .environmentObject(WalletManager())
}