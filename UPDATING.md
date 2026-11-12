# Updating NZBGet

Track stable releases at https://github.com/nzbgetcom/nzbget/releases, ignoring the rolling `testing` release. Confirm the versioned `nzbgetcom/nzbget:v<version>` image exists for both amd64 and arm64.

Update `startos/manifest/index.ts` and `startos/versions/current.ts`, including localized release notes. Check upstream's Dockerfile, entrypoint and configuration template for changes to paths, authentication and tools. Preserve the literal key/value parser; NZBGet does not use INI quoting. Verify restricted credentials still support status, config, queue and history methods.

Refresh the SDK pin and lockfile if needed. Type-check and verify startup, authentication, shared paths and dependent connections. Schema-changing releases are not declared downgrade-safe.
