import Foundation
import CoreImage
import CoreImage.CIFilterBuiltins
import SwiftUI

class QRCodeGenerator {
    static let shared = QRCodeGenerator()
    
    private init() {}
    
    func generateQRCode(from string: String, size: CGSize = CGSize(width: 200, height: 200)) -> UIImage? {
        let data = string.data(using: String.Encoding.ascii)
        
        if let filter = CIFilter(name: "CIQRCodeGenerator") {
            filter.setValue(data, forKey: "inputMessage")
            filter.setValue("H", forKey: "inputCorrectionLevel")
            
            if let output = filter.outputImage {
                let transform = CGAffineTransform(scaleX: size.width / output.extent.width, 
                                               y: size.height / output.extent.height)
                let scaledImage = output.transformed(by: transform)
                
                let context = CIContext()
                if let cgImage = context.createCGImage(scaledImage, from: scaledImage.extent) {
                    return UIImage(cgImage: cgImage)
                }
            }
        }
        
        return nil
    }
    
    func generatePaymentQRCode(address: String, amount: Decimal? = nil, label: String? = nil) -> UIImage? {
        var components = URLComponents()
        components.scheme = "kaldrix"
        components.host = address
        
        var queryItems: [URLQueryItem] = []
        
        if let amount = amount {
            queryItems.append(URLQueryItem(name: "amount", value: amount.description))
        }
        
        if let label = label {
            queryItems.append(URLQueryItem(name: "label", value: label))
        }
        
        components.queryItems = queryItems.isEmpty ? nil : queryItems
        
        guard let url = components.url else { return nil }
        
        return generateQRCode(from: url.absoluteString)
    }
    
    func generateWalletConnectQRCode(uri: String) -> UIImage? {
        return generateQRCode(from: uri, size: CGSize(width: 300, height: 300))
    }
    
    func generateBackupQRCode(mnemonic: String) -> UIImage? {
        return generateQRCode(from: mnemonic, size: CGSize(width: 400, height: 400))
    }
    
    func scanQRCode(from image: UIImage) -> String? {
        guard let ciImage = CIImage(image: image) else { return nil }
        
        let context = CIContext()
        let detector = CIDetector(ofType: CIDetectorTypeQRCode, context: context, options: [
            CIDetectorAccuracy: CIDetectorAccuracyHigh
        ])
        
        let features = detector.features(in: ciImage)
        
        if let firstFeature = features.first as? CIQRCodeFeature {
            return firstFeature.messageString
        }
        
        return nil
    }
    
    func validateQRCode(_ string: String) -> QRCodeType {
        if string.hasPrefix("kaldrix:") {
            return .payment
        } else if string.hasPrefix("wc:") {
            return .walletConnect
        } else if string.components(separatedBy: " ").count == 12 || string.components(separatedBy: " ").count == 24 {
            return .mnemonic
        } else if string.hasPrefix("http") {
            return .url
        } else if string.count >= 30 && string.count <= 50 {
            return .address
        } else {
            return .unknown
        }
    }
    
    func parsePaymentQRCode(_ string: String) -> PaymentQRData? {
        guard string.hasPrefix("kaldrix:") else { return nil }
        
        let components = URLComponents(string: string)
        let address = components?.host ?? ""
        
        var amount: Decimal?
        var label: String?
        
        if let queryItems = components?.queryItems {
            for item in queryItems {
                if item.name == "amount" {
                    amount = Decimal(string: item.value ?? "")
                } else if item.name == "label" {
                    label = item.value
                }
            }
        }
        
        return PaymentQRData(address: address, amount: amount, label: label)
    }
    
    func parseWalletConnectURI(_ string: String) -> WalletConnectData? {
        guard string.hasPrefix("wc:") else { return nil }
        
        // Basic parsing - implement full WalletConnect protocol parsing
        let components = string.components(separatedBy: "@")
        guard components.count >= 2 else { return nil }
        
        let topic = components[0].replacingOccurrences(of: "wc:", with: "")
        let version = components[1].components(separatedBy: "?").first ?? "1"
        
        return WalletConnectData(topic: topic, version: version, uri: string)
    }
}

// QR Code Types
enum QRCodeType {
    case payment
    case walletConnect
    case mnemonic
    case url
    case address
    case unknown
}

// QR Code Data Models
struct PaymentQRData {
    let address: String
    let amount: Decimal?
    let label: String?
}

struct WalletConnectData {
    let topic: String
    let version: String
    let uri: String
}

// QR Code Scanner View
struct QRCodeScannerView: UIViewControllerRepresentable {
    var codeTypes: [AVMetadataObject.ObjectType] = [.qr]
    var completion: (Result<ScanResult, ScanError>) -> Void
    
    func makeUIViewController(context: Context) -> QRScannerViewController {
        let scanner = QRScannerViewController()
        scanner.codeTypes = codeTypes
        scanner.completion = completion
        return scanner
    }
    
    func updateUIViewController(_ uiViewController: QRScannerViewController, context: Context) {}
}

class QRScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var codeTypes: [AVMetadataObject.ObjectType] = [.qr]
    var completion: (Result<ScanResult, ScanError>) -> Void = { _ in }
    
    private var captureSession: AVCaptureSession!
    private var previewLayer: AVCaptureVideoPreviewLayer!
    private var captureDevice: AVCaptureDevice!
    private var captureInput: AVCaptureDeviceInput!
    private var captureOutput: AVCaptureMetadataOutput!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupCaptureSession()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        startCaptureSession()
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        stopCaptureSession()
    }
    
    private func setupCaptureSession() {
        captureSession = AVCaptureSession()
        
        // Setup capture device
        captureDevice = AVCaptureDevice.default(for: .video)
        
        do {
            captureInput = try AVCaptureDeviceInput(device: captureDevice)
            captureSession.addInput(captureInput)
        } catch {
            completion(.failure(.deviceError))
            return
        }
        
        // Setup capture output
        captureOutput = AVCaptureMetadataOutput()
        captureSession.addOutput(captureOutput)
        captureOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
        captureOutput.metadataObjectTypes = codeTypes
        
        // Setup preview layer
        previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
        previewLayer.frame = view.layer.bounds
        previewLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(previewLayer)
        
        // Setup overlay view
        setupOverlayView()
    }
    
    private func setupOverlayView() {
        let overlayView = UIView(frame: view.bounds)
        overlayView.backgroundColor = UIColor.black.withAlphaComponent(0.3)
        view.addSubview(overlayView)
        
        // Add scanning frame
        let frameSize: CGFloat = 200
        let frameView = UIView(frame: CGRect(
            x: (view.bounds.width - frameSize) / 2,
            y: (view.bounds.height - frameSize) / 2,
            width: frameSize,
            height: frameSize
        ))
        frameView.layer.borderColor = UIColor.systemBlue.cgColor
        frameView.layer.borderWidth = 2
        frameView.layer.cornerRadius = 10
        overlayView.addSubview(frameView)
        
        // Add corner indicators
        let cornerSize: CGFloat = 20
        let cornerWidth: CGFloat = 3
        
        let corners = [
            CGRect(x: frameView.frame.minX, y: frameView.frame.minY, width: cornerSize, height: cornerWidth),
            CGRect(x: frameView.frame.minX, y: frameView.frame.minY, width: cornerWidth, height: cornerSize),
            CGRect(x: frameView.frame.maxX - cornerSize, y: frameView.frame.minY, width: cornerSize, height: cornerWidth),
            CGRect(x: frameView.frame.maxX - cornerWidth, y: frameView.frame.minY, width: cornerWidth, height: cornerSize),
            CGRect(x: frameView.frame.minX, y: frameView.frame.maxY - cornerWidth, width: cornerSize, height: cornerWidth),
            CGRect(x: frameView.frame.minX, y: frameView.frame.maxY - cornerSize, width: cornerWidth, height: cornerSize),
            CGRect(x: frameView.frame.maxX - cornerSize, y: frameView.frame.maxY - cornerWidth, width: cornerSize, height: cornerWidth),
            CGRect(x: frameView.frame.maxX - cornerWidth, y: frameView.frame.maxY - cornerSize, width: cornerWidth, height: cornerSize)
        ]
        
        for corner in corners {
            let cornerView = UIView(frame: corner)
            cornerView.backgroundColor = .systemBlue
            overlayView.addSubview(cornerView)
        }
        
        // Add instructions label
        let label = UILabel(frame: CGRect(
            x: 0,
            y: frameView.frame.maxY + 20,
            width: view.bounds.width,
            height: 30
        ))
        label.text = "Scan QR Code"
        label.textColor = .white
        label.textAlignment = .center
        label.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        overlayView.addSubview(label)
        
        // Add cancel button
        let cancelButton = UIButton(type: .system)
        cancelButton.frame = CGRect(
            x: 20,
            y: view.bounds.height - 60,
            width: view.bounds.width - 40,
            height: 44
        )
        cancelButton.setTitle("Cancel", for: .normal)
        cancelButton.setTitleColor(.white, for: .normal)
        cancelButton.backgroundColor = .systemRed
        cancelButton.layer.cornerRadius = 22
        cancelButton.addTarget(self, action: #selector(cancelScanning), for: .touchUpInside)
        overlayView.addSubview(cancelButton)
    }
    
    private func startCaptureSession() {
        if !captureSession.isRunning {
            captureSession.startRunning()
        }
    }
    
    private func stopCaptureSession() {
        if captureSession.isRunning {
            captureSession.stopRunning()
        }
    }
    
    @objc private func cancelScanning() {
        completion(.failure(.cancelled))
        dismiss(animated: true)
    }
    
    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        for metadata in metadataObjects {
            if let readableObject = metadata as? AVMetadataMachineReadableCodeObject,
               let stringValue = readableObject.stringValue {
                
                // Vibrate on successful scan
                AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
                
                completion(.success(ScanResult(string: stringValue)))
                dismiss(animated: true)
                break
            }
        }
    }
}

// Scan Result and Error Types
struct ScanResult {
    let string: String
}

enum ScanError: Error, LocalizedError {
    case cancelled
    case deviceError
    case noCodeFound
    
    var errorDescription: String? {
        switch self {
        case .cancelled:
            return "Scanning cancelled"
        case .deviceError:
            return "Camera error"
        case .noCodeFound:
            return "No QR code found"
        }
    }
}