export const DEFAULT_LANG = 'en_US'
const dict = {
  'Starting NZBGet!': 0,
  'Web Interface': 1,
  'The web interface is ready': 2,
  'The web interface is not ready': 3,
  'NZBGet web interface and JSON-RPC API': 4,
  'Set Admin Password': 5,
  'Generate a new admin password. Changing it restarts NZBGet.': 6,
  'Replaces the current admin password.': 7,
  'Login Credentials': 8,
  'Sign in after NZBGet finishes starting.': 9,
  Username: 10,
  Password: 11,
  'Set Download Location': 12,
  'Choose shared storage for downloads. NextExplorer paths begin with a location, such as Files.': 13,
  'Restarts NZBGet without moving files. Finish or remove queued downloads before changing storage.': 14,
  Storage: 15,
  'Download Folder': 16,
  'Use a relative folder without empty, dot or parent segments; NextExplorer requires a location and subfolder.': 17,
  'Set the admin password before signing in': 18,
  'Choose shared storage for downloads': 19,
  'Selected storage is not installed. Install it or change the download location.': 20,
} as const
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
