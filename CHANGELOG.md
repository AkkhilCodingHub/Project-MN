# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-mvp] - 2026-07-29

### Added
- **GET/POST API routes:** Enabled support for both JSON payloads (`POST`) and URL query strings (`GET`) on `/api/query`, `/api/quiz`, and `/api/flashcards` endpoints for flexible frontend integration.
- **GitHub Pull Request Template:** Structured guidelines for describing modifications, testing configurations, and staging checklists.
- **GitHub Issue Templates:** Standardized templates for reporting bugs and suggesting new features.
- **GitHub Security Policy:** Set up vulnerability reporting guidelines in `.github/SECURITY.md`.
- **Dependabot Scan Config:** Automated weekly checks for Rust dependencies and Actions workflows.
- **Auto-Assign Workflow:** Configured a GitHub Action workflow to automatically assign new PRs to maintainers (`akkhilcodinghub` and `itzshrutiiisharma`).

### Changed
- **Database Connection Pooling:** Set maximum connections to 5 and added timeout/idle limits to prevent Supabase connection exhaustion on Railway.
- **Release Compilation Profiles:** Enabled full Link-Time Optimization (LTO), limited codegen units to 1, and enabled symbol stripping to optimize container execution speed and minimize binary size.

### Fixed
- **Self-Healing JSON Parser:** Implemented stack-based bracket balancing in AI text parsers to automatically heal truncated LLM JSON payloads.
- **Actions Security Warning:** Added explicit `contents: read` permissions to GitHub Actions workflow GITHUB_TOKEN permissions.
- **SQLx Protocol Smuggling (CVE/GHSA):** Upgraded `sqlx` from `0.7.4` to `0.8.1` to patch protocol smuggling injection vulnerabilities.
