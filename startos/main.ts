import { manifest as filebrowserManifest } from 'filebrowser-quantum-startos/startos/manifest'
import { manifest as nextexplorerManifest } from 'nextexplorer-startos/startos/manifest'
import { nzbgetConf } from './fileModels/nzbget.conf'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  adminUsername,
  completedDownloadPath,
  integrationUsername,
  prepareScript,
  storageMountpoints,
  uiPort,
  validSubfolder,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting NZBGet!'))
  const store = await storeJson.read().const(effects)
  const password = await nzbgetConf
    .read((c) => c.ControlPassword)
    .const(effects)
  if (!password)
    throw new Error(i18n('Set the admin password before signing in'))
  if (!store?.storage || !validSubfolder(store.subfolder))
    throw new Error(i18n('Choose shared storage for downloads'))
  if (
    !(await sdk
      .getServiceManifest(effects, store.storage, (m) => m !== null)
      .const())
  )
    throw new Error(
      i18n(
        'Selected storage is not installed. Install it or change the download location.',
      ),
    )
  if (!store.integrationPassword)
    throw new Error('Missing integration password')

  const directory = `${storageMountpoints[store.storage]}/${store.subfolder}`
  await nzbgetConf.merge(effects, {
    MainDir: '/config',
    DestDir: completedDownloadPath(store.storage, store.subfolder),
    InterDir: `${directory}/intermediate`,
    QueueDir: '/config/queue',
    NzbDir: '/config/nzb',
    TempDir: '/config/tmp',
    ScriptDir: '/config/scripts',
    LogFile: '/config/log/nzbget.log',
    LockFile: '/downloads/nzbget.lock',
    ControlIP: '::',
    ControlPort: String(uiPort),
    ControlUsername: adminUsername,
    AuthorizedIP: '',
    SecureControl: 'no',
    UpdateCheck: 'none',
    RestrictedUsername: integrationUsername,
    RestrictedPassword: store.integrationPassword,
    AddUsername: '',
    AddPassword: '',
    UMask: '002',
  })

  let mounts = sdk.Mounts.of().mountVolume({
    volumeId: 'main',
    subpath: null,
    mountpoint: '/config',
    readonly: false,
  })
  // Shared files keep the same absolute paths in downloaders and importers.
  if (store.storage === 'filebrowser')
    mounts = mounts.mountDependency<typeof filebrowserManifest>({
      dependencyId: 'filebrowser',
      volumeId: 'data',
      subpath: null,
      mountpoint: storageMountpoints.filebrowser,
      readonly: false,
    })
  else
    mounts = mounts.mountDependency<typeof nextexplorerManifest>({
      dependencyId: 'nextexplorer',
      volumeId: 'data',
      subpath: null,
      mountpoint: storageMountpoints.nextexplorer,
      readonly: false,
    })
  const sub = sdk.SubContainer.of(
    effects,
    { imageId: 'nzbget' },
    mounts,
    'nzbget-sub',
  )
  return sdk.Daemons.of(effects)
    .addOneshot('prepare', {
      subcontainer: sub,
      exec: {
        command: [
          'sh',
          '-ec',
          prepareScript,
          'prepare',
          '/config/queue',
          '/config/nzb',
          '/config/tmp',
          '/config/scripts',
          '/config/log',
          directory,
          `${directory}/completed`,
          `${directory}/intermediate`,
        ],
      },
      requires: [],
    })
    .addDaemon('primary', {
      subcontainer: sub,
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          PUID: '1000',
          PGID: '1000',
          TZ: 'Etc/UTC',
          NZBGET_USER: adminUsername,
          NZBGET_PASS: password,
        },
      },
      ready: {
        display: i18n('Web Interface'),
        fn: async () => {
          try {
            const res = await fetch(`http://127.0.0.1:${uiPort}/jsonrpc`, {
              method: 'POST',
              headers: {
                Authorization: `Basic ${Buffer.from(`${adminUsername}:${password}`).toString('base64')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ method: 'status', params: [] }),
              signal: AbortSignal.timeout(5000),
            })
            const body = await res.json()
            if (!res.ok || !body.result || body.error)
              throw new Error('RPC unavailable')
            return {
              result: 'success',
              message: i18n('The web interface is ready'),
            }
          } catch {
            return {
              result: 'failure',
              message: i18n('The web interface is not ready'),
            }
          }
        },
      },
      requires: ['prepare'],
    })
})
