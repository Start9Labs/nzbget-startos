import { utils } from '@start9labs/start-sdk'
import { credentialsFile } from '../fileModels/credentials'
import { nzbgetConf } from '../fileModels/nzbget.conf'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { completedDownloadPath, integrationUsername } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects) => {
  if (!(await nzbgetConf.read().once())) {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nzbget' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/config',
        readonly: false,
      }),
      'seed-config',
      async (sub) => {
        await sub.execFail([
          'cp',
          '/app/nzbget/share/nzbget/nzbget.conf',
          '/config/nzbget.conf',
        ])
      },
    )
    await nzbgetConf.merge(effects, {
      ControlPassword: '',
      'Category1.Name': 'radarr',
      'Category2.Name': 'sonarr',
      'Category3.Name': 'lidarr',
      'Category4.Name': 'shelfarr',
      'Category5.Name': 'prowlarr',
    })
  }
  await storeJson.merge(effects, {})
  let password = await storeJson
    .read((s) => s.integrationPassword)
    .const(effects)
  if (!password) {
    password = utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 32 })
    await storeJson.merge(effects, { integrationPassword: password })
  }
  const storage = await storeJson
    .read((s) => ({ storage: s.storage, subfolder: s.subfolder }))
    .const(effects)
  await credentialsFile.write(effects, {
    username: integrationUsername,
    password,
    downloadPath: storage?.storage
      ? completedDownloadPath(storage.storage, storage.subfolder)
      : null,
  })
})
