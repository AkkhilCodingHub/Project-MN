# --- Build Stage ---
FROM rust:slim-bookworm AS builder

# Install build dependencies for compiling OpenSSL (required by native-tls / SQLx / reqwest)
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy configuration and dependency manifest
COPY Cargo.toml ./

# Copy the actual source files
COPY src ./src

# Compile using BuildKit cache mounts to reuse dependency compilation cache across builds
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/target \
    cargo build --release && \
    cp /app/target/release/studytrace_backend /app/studytrace_backend

# --- Runtime Stage ---
FROM debian:bookworm-slim

# Install CA certificates and OpenSSL runtime libraries for HTTPS outbound calls (Gemini/Pinecone)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the optimized production binary from the builder stage
COPY --from=builder /app/studytrace_backend ./studytrace_backend

# Expose the API port
EXPOSE 8080

# Start the high-performance backend server
CMD ["./studytrace_backend"]
