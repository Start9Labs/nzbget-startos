<p align="center">
  <img src="icon.svg" alt="NZBGet Logo" width="21%">
</p>

# NZBGet on StartOS

> Everything not listed in this document should behave the same as upstream
> NZBGet. If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable — see the Documentation section
> of `instructions.md` for links.

[NZBGet](https://github.com/nzbgetcom/nzbget) downloads, repairs and unpacks Usenet binaries.

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

## Image and Container Runtime

The unmodified upstream `nzbgetcom/nzbget` image runs in `nzbget-sub` on x86_64 and aarch64. The upstream entrypoint drops privileges to uid/gid 1000. A preparation oneshot seeds upstream defaults and creates missing download directories without changing existing shared-directory permissions.

## Volume and Data Layout

Private queue and configuration state is separate from downloaded media and exported integration credentials.

| Volume | Mount | Contents |
| --- | --- | --- |
| `main` | `/config` | `nzbget.conf`, queue, NZBs, scripts, temporary files and logs |
| `startos` | Unmounted | `store.json` holding storage selection and integration password |
| `public` | Unmounted | `credentials.json` for dependent services |
| FileBrowser Quantum `data` | `/mnt/filebrowser`, read-write | Downloads when selected |
| NextExplorer `data` | `/mnt/nextexplorer`, read-write | Downloads beneath a selected location |

Completed and intermediate files stay on the same selected shared volume. Mount paths match the Arr services, avoiding remote path mappings.

## File Models

`startos/store.json` is seeded with schema defaults and changed by actions. Its storage choice and generated integration password are watched reactively. `main/nzbget.conf` is a flat, literal key/value file: the model preserves unknown upstream settings, including news-server credentials, without INI escaping.

On each startup the package reasserts authentication, disables authorized-IP bypass, fixes the listener and private state paths, applies the selected download directory and installs separate restricted integration credentials. The admin password is set through the password action and passed to the upstream entrypoint. Conflicting application settings revert on startup. Server, scheduling and other unmodeled settings remain user-owned.

`public/credentials.json` publishes the restricted integration username and password, not the admin password. These credentials can manage downloads and read configuration but cannot save settings. They survive admin-password rotation and are regenerated from private state after restore.

## Dependencies

FileBrowser Quantum and NextExplorer are optional `exists` dependencies, enabled by the selected storage. Exactly one must be selected and installed before startup. NZBGet mounts its data read-write; the file manager need not be running. Missing storage prevents startup rather than writing into the container filesystem. No Arr application is required by NZBGet.

## Network Access and Interfaces

The `ui` interface on host `ui-multi` serves the HTTP web interface and authenticated JSON-RPC API on port 6789. Outbound connections reach user-configured news servers and indexer URLs.

## Installation and First-Run Flow

Critical prompts require an admin password and shared storage. Installation seeds package state; the first start copies the image's complete configuration before applying package settings. No upstream default-password listener is started. The user configures a news server in the web interface.

## Actions

Password generation stores and returns a copyable credential. Repetition deliberately rotates it and restarts NZBGet; wait for readiness before logging in. The restricted integration password is unchanged.

Storage selection restarts the service without moving or deleting existing files. Repeating the same selection is safe. Changing it while downloads are queued can leave paths referring to the old location; finish or remove queued work first.

## Tasks

A critical password prompt appears while the configured admin password is empty. A critical storage prompt appears while no storage is selected. Each clears when its action supplies the missing value and can return if that value is removed.

## Health Checks

The `primary` check calls authenticated JSON-RPC `status` with the SDK default grace period. Failure means the server is unavailable or authentication failed; inspect startup logs and storage permissions. Success does not establish news-server connectivity or successful acquisition.

## Backups and Restore

StartOS stops NZBGet and copies `main` and `startos`; temporary files and logs are excluded. Configuration, queue, source NZBs, scripts and both passwords survive. The derived public export is not backed up. Shared downloads are not captured: back up the selected file manager separately. Restored queue entries require their corresponding shared files, or must be retried.

## Limitations and Differences

1. Downloads require selected shared storage; private downloads are not offered.
2. Storage changes do not move queued or completed downloads.
3. Built-in update checks are disabled; update through StartOS. No news-server subscription or indexer is bundled.
4. Package-owned connection, authentication and path settings override conflicting UI edits at startup. Other upstream settings remain configurable in the UI.
5. No riscv64 image is supplied, and downgrades are not declared safe.

## Quick Reference for AI Consumers

The package surface is summarized below.

```yaml
package_id: nzbget
image: nzbgetcom/nzbget
architectures: [x86_64, aarch64]
subcontainers: [nzbget-sub]
volumes:
  main: /config
  startos: unmounted
  public: unmounted
file_models: [main/nzbget.conf, startos/store.json, public/credentials.json]
startos_managed_env_vars: [PUID, PGID, TZ, NZBGET_USER, NZBGET_PASS]
dependencies: [filebrowser, nextexplorer]
interfaces:
  ui: {host_id: ui-multi, type: ui, port: 6789, protocol: http}
actions: [set-admin-password, set-download-location]
tasks:
  - {action: set-admin-password, severity: critical}
  - {action: set-download-location, severity: critical}
health_checks: [primary]
oneshots: [prepare]
```
