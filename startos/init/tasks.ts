import { setAdminPassword } from '../actions/setAdminPassword'
import { setDownloadLocation } from '../actions/setDownloadLocation'
import { nzbgetConf } from '../fileModels/nzbget.conf'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const tasks = sdk.setupOnInit(async (effects) => {
  if (!(await nzbgetConf.read((c) => c.ControlPassword).const(effects)))
    await sdk.action.createOwnTask(effects, setAdminPassword, 'critical', {
      reason: i18n('Set the admin password before signing in'),
    })
  if (!(await storeJson.read((s) => s.storage).const(effects)))
    await sdk.action.createOwnTask(effects, setDownloadLocation, 'critical', {
      reason: i18n('Choose shared storage for downloads'),
    })
})
