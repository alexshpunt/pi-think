# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.3] - 2026-08-14

### Changed

- Republish the npm package from the public `main` branch after `0.1.2` was inadvertently packed from the development branch.

## [0.1.2] - 2026-08-14

### Fixed

- Preserve the complete tool schema while requiring an explicit `think` pass, preventing tools from disappearing from provider continuations.
- Avoid pathological Codex response loops by using a fresh developer instruction and automatic tool selection for reasoning passes after tool results.
- Use provider-specific tool-choice payloads for Anthropic, OpenAI Chat Completions, OpenAI Responses, Google Generative AI, and Google Vertex.

## [0.1.1] - 2026-08-13

### Added

- Initial release of the private `think` scratchpad extension.
- Provider-aware native reasoning controls and configurable reasoning prompts.

[Unreleased]: https://github.com/alexshpunt/pi-think/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/alexshpunt/pi-think/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/alexshpunt/pi-think/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/alexshpunt/pi-think/releases/tag/v0.1.1
