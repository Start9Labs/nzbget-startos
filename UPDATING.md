# Updating NZBGet

Track stable releases at https://github.com/nzbgetcom/nzbget/releases, ignoring the rolling `testing` release. Confirm the versioned `nzbgetcom/nzbget:v<version>` image exists for both amd64 and arm64.

Update the upstream tag in `Dockerfile` and the version in `startos/versions/current.ts`, including localized release notes. Keep the refreshed system CA bundle at NZBGet's private default `CertStore` path; do not override user-configured trust stores. Run `make test-ca` to build and exercise the default bundle and custom-store TLS behavior on both supported architectures. Check upstream's Dockerfile, entrypoint and configuration template for changes to paths, authentication and tools. Preserve the literal key/value parser; NZBGet does not use INI quoting. Verify restricted credentials still support status, config, queue and history methods.

Refresh the SDK pin and lockfile if needed. Type-check and verify startup, authentication, shared paths and dependent connections. Schema-changing releases are not declared downgrade-safe.
