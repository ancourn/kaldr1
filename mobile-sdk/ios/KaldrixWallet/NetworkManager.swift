import Foundation
import Combine

@MainActor
class NetworkManager: ObservableObject {
    @Published var isConnected = false
    @Published var networkStatus = "Disconnected"
    @Published var latency: TimeInterval = 0
    @Published var errorMessage = ""
    
    private var cancellables = Set<AnyCancellable>()
    private let apiBaseURL = URL(string: "https://api.kaldrix.io")!
    private let websocketURL = URL(string: "wss://api.kaldrix.io")!
    
    init() {
        setupNetworkMonitoring()
        startConnectionCheck()
    }
    
    private func setupNetworkMonitoring() {
        // Monitor network reachability
        NotificationCenter.default.publisher(for: .reachabilityChanged)
            .sink { [weak self] _ in
                self?.checkNetworkStatus()
            }
            .store(in: &cancellables)
    }
    
    private func startConnectionCheck() {
        Timer.publish(every: 30, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.checkNetworkStatus()
            }
            .store(in: &cancellables)
    }
    
    private func checkNetworkStatus() {
        Task {
            await testConnection()
        }
    }
    
    private func testConnection() async {
        let startTime = Date()
        
        do {
            let (data, _) = try await URLSession.shared.data(from: apiBaseURL.appendingPathComponent("health"))
            
            if let response = try? JSONDecoder().decode(HealthResponse.self, from: data) {
                isConnected = true
                networkStatus = response.status
                latency = Date().timeIntervalSince(startTime)
            }
        } catch {
            isConnected = false
            networkStatus = "Disconnected"
            errorMessage = "Network error: \(error.localizedDescription)"
        }
    }
    
    func makeRequest<T: Decodable>(endpoint: String, method: String = "GET", body: Data? = nil) async throws -> T {
        guard let url = URL(string: endpoint, relativeTo: apiBaseURL) else {
            throw NetworkError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("KALDRIX-iOS/1.0.0", forHTTPHeaderField: "User-Agent")
        
        if let body = body {
            request.httpBody = body
        }
        
        let startTime = Date()
        let (data, response) = try await URLSession.shared.data(for: request)
        latency = Date().timeIntervalSince(startTime)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            return try JSONDecoder().decode(T.self, from: data)
        case 401:
            throw NetworkError.unauthorized
        case 403:
            throw NetworkError.forbidden
        case 404:
            throw NetworkError.notFound
        case 429:
            throw NetworkError.rateLimited
        case 500...599:
            throw NetworkError.serverError
        default:
            throw NetworkError.unknownError
        }
    }
    
    func uploadData(endpoint: String, data: Data) async throws -> UploadResponse {
        guard let url = URL(string: endpoint, relativeTo: apiBaseURL) else {
            throw NetworkError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        request.setValue("KALDRIX-iOS/1.0.0", forHTTPHeaderField: "User-Agent")
        request.httpBody = data
        
        let startTime = Date()
        let (responseData, response) = try await URLSession.shared.data(for: request)
        latency = Date().timeIntervalSince(startTime)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        if httpResponse.statusCode == 200 {
            return try JSONDecoder().decode(UploadResponse.self, from: responseData)
        } else {
            throw NetworkError.uploadFailed
        }
    }
    
    func downloadFile(endpoint: String) async throws -> URL {
        guard let url = URL(string: endpoint, relativeTo: apiBaseURL) else {
            throw NetworkError.invalidURL
        }
        
        let (tempURL, response) = try await URLSession.shared.download(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        if httpResponse.statusCode == 200 {
            return tempURL
        } else {
            throw NetworkError.downloadFailed
        }
    }
}

// WebSocket Manager for real-time communication
class WebSocketManager: ObservableObject {
    @Published var isConnected = false
    @Published var lastMessage: String = ""
    @Published var errorMessage = ""
    
    private var webSocketTask: URLSessionWebSocketTask?
    private let url: URL
    
    init(url: URL) {
        self.url = url
    }
    
    func connect() {
        disconnect()
        
        webSocketTask = URLSession.shared.webSocketTask(with: url)
        webSocketTask?.resume()
        
        receiveMessage()
    }
    
    func disconnect() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        isConnected = false
    }
    
    func send(message: String) {
        guard let task = webSocketTask else { return }
        
        task.send(.string(message)) { error in
            if let error = error {
                DispatchQueue.main.async {
                    self.errorMessage = "Failed to send message: \(error.localizedDescription)"
                }
            }
        }
    }
    
    func send(data: Data) {
        guard let task = webSocketTask else { return }
        
        task.send(.data(data)) { error in
            if let error = error {
                DispatchQueue.main.async {
                    self.errorMessage = "Failed to send data: \(error.localizedDescription)"
                }
            }
        }
    }
    
    private func receiveMessage() {
        guard let task = webSocketTask else { return }
        
        task.receive { [weak self] result in
            switch result {
            case .success(let message):
                DispatchQueue.main.async {
                    self.isConnected = true
                    self.handleMessage(message)
                }
                self?.receiveMessage()
                
            case .failure(let error):
                DispatchQueue.main.async {
                    self.isConnected = false
                    self.errorMessage = "WebSocket error: \(error.localizedDescription)"
                }
            }
        }
    }
    
    private func handleMessage(_ message: URLSessionWebSocketTask.Message) {
        switch message {
        case .string(let text):
            lastMessage = text
            
            // Parse and handle different message types
            if let data = text.data(using: .utf8),
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                handleMessage(json)
            }
            
        case .data(let data):
            // Handle binary data
            lastMessage = "Received binary data: \(data.count) bytes"
            
        @unknown default:
            errorMessage = "Unknown message type received"
        }
    }
    
    private func handleMessage(_ json: [String: Any]) {
        guard let type = json["type"] as? String else { return }
        
        switch type {
        case "transaction":
            handleTransactionUpdate(json)
        case "block":
            handleBlockUpdate(json)
        case "network":
            handleNetworkUpdate(json)
        case "ping":
            send(message: "{\"type\":\"pong\"}")
        default:
            print("Unknown message type: \(type)")
        }
    }
    
    private func handleTransactionUpdate(_ json: [String: Any]) {
        // Handle transaction updates
        if let txId = json["tx_id"] as? String,
           let status = json["status"] as? String {
            print("Transaction \(txId) status: \(status)")
            // Notify observers about transaction update
        }
    }
    
    private func handleBlockUpdate(_ json: [String: Any]) {
        // Handle block updates
        if let blockHeight = json["height"] as? Int {
            print("New block at height: \(blockHeight)")
            // Notify observers about block update
        }
    }
    
    private func handleNetworkUpdate(_ json: [String: Any]) {
        // Handle network status updates
        if let status = json["status"] as? String {
            print("Network status: \(status)")
            // Notify observers about network update
        }
    }
}

// Network Error Types
enum NetworkError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case forbidden
    case notFound
    case rateLimited
    case serverError
    case uploadFailed
    case downloadFailed
    case unknownError
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .unauthorized:
            return "Unauthorized access"
        case .forbidden:
            return "Access forbidden"
        case .notFound:
            return "Resource not found"
        case .rateLimited:
            return "Too many requests"
        case .serverError:
            return "Server error"
        case .uploadFailed:
            return "Upload failed"
        case .downloadFailed:
            return "Download failed"
        case .unknownError:
            return "Unknown error occurred"
        }
    }
}

// Response Models
struct HealthResponse: Codable {
    let status: String
    let timestamp: Date
    let version: String
    let network: String
}

struct UploadResponse: Codable {
    let success: Bool
    let fileId: String?
    let error: String?
}

// Notification for network reachability
extension Notification.Name {
    static let reachabilityChanged = Notification.Name("reachabilityChanged")
}