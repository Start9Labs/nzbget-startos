# NZBGet

## Documentation

- [Using NZBGet](https://github.com/nzbgetcom/nzbget/blob/develop/docs/HOW_TO_USE.md) — configuration and operation.
- [JSON-RPC API](https://github.com/nzbgetcom/nzbget/tree/develop/docs/api) — programmatic control.
- [Extensions](https://github.com/nzbgetcom/nzbget/tree/develop/docs/extensions) — optional download processing.

## What you get on StartOS

A password-protected web interface, shared download storage, and automatic connection credentials for compatible Arr packages.

## Getting set up

1. Install FileBrowser Quantum or NextExplorer for your downloads.
2. Complete **Set Admin Password** and save the returned credentials.
3. Complete **Set Download Location**, choosing the file manager and a folder beneath it. For NextExplorer, include the location name, such as `Files/nzbget`.
4. Open **Web Interface** and sign in. Configure your Usenet provider under **Settings → NEWS-SERVERS**, using the provider's host, port, credentials and TLS settings.
5. Save and reload the NZBGet settings, then add an NZB or connect an Arr application.

## Connecting Arr services

In Sonarr, Radarr, Lidarr, Shelfarr or Prowlarr, run **Connect NZBGet**. Each application uses its own category. Existing qBittorrent connections are not removed.

For Sonarr, Radarr, Lidarr and Shelfarr, select the same file manager under **Media Storage**. NZBGet's completed-download paths must be accessible there at the same absolute path. No remote path mapping is needed. Prowlarr sends downloads but does not import files.

Use **Disconnect NZBGet** in an application to remove only its managed `NZBGet (StartOS)` connection. Manually named download clients remain untouched. Keep the managed NZBGet categories when editing its settings.

## Password and storage changes

**Set Admin Password** also resets your password and restarts NZBGet. Arr connection credentials are separate and remain valid.

**Set Download Location** restarts NZBGet but does not move files. Finish or remove queued downloads before changing storage. Do not change the managed authentication, listener or directory settings inside NZBGet; use the StartOS actions instead.

## Backups

NZBGet backups include settings, credentials and queue state, but not downloaded media. Back up the selected file manager too. After restoring, missing partial downloads may need to be restarted.

If you publish the interface through a tunnel to hide your home IP, send NZBGet's outbound traffic through that tunnel too; otherwise news servers and sites it fetches NZBs from still see your home IP. No change is needed when the tunnel is only for reachability.
