# Multi-stage build for Rust backend
FROM rust:1.75-slim AS rust-builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    cmake \
    build-essential \
    clang \
    libclang-dev \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./

# Download dependencies
RUN cargo fetch --locked

# Copy source code
COPY src ./src

# Build the application
RUN cargo build --release

# Production stage for backend
FROM debian:bullseye-slim AS backend

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 blockchain

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=rust-builder /app/target/release/dag-node /usr/local/bin/
COPY --from=rust-builder /app/target/release/api-server /usr/local/bin/

# Create data directory
RUN mkdir -p /app/data && chown -R blockchain:blockchain /app

# Switch to non-root user
USER blockchain

# Expose ports
EXPOSE 8080 8999

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Default command
CMD ["/usr/local/bin/dag-node"]