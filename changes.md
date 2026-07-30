# Railway Deployment Optimization Changes

This document outlines the modifications made to the codebase to optimize performance, memory footprint, and database connection pooling for Railway deployment.

---

## 1. Database Connection Pooling Optimization

### File: [backend/src/db.rs](backend/src/db.rs)

- **Problem:** By default, SQLx creates connection pools with up to 10 connections. On serverless hosting like Railway connecting to Supabase's Free Tier, concurrent requests or multiple backend rebuilds can easily exhaust the Postgres connection limits.
- **Change:** Configured connection pooling parameters using `PgPoolOptions`:
  - `max_connections(5)`: Caps connections to 5 to prevent database connection exhaustion.
  - `min_connections(1)`: Keeps at least one active connection alive to minimize cold starts.
  - `acquire_timeout(3 seconds)`: Fails quickly instead of hanging if database connections are locked.
  - `idle_timeout(30 seconds)`: Reaps inactive connections to free up pool capacity.

---

## 2. Compiler Optimization for Container Running

### File: [backend/Cargo.toml](backend/Cargo.toml)

- **Problem:** Standard release builds generate larger binaries and are not optimized for memory constraints on hosted containers.
- **Change:** Tuned the Rust compiler release profile:
  - `lto = true`: Enabled full Link-Time Optimization (instead of `"thin"`) for maximum runtime performance.
  - `codegen-units = 1`: Disabled parallel code generation to allow LLVM to execute global optimization passes.
  - `strip = true`: Strips all debug symbols and symbols table, minimizing the final binary footprint and container startup memory usage.
