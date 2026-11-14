import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const defaultSubfolder = 'nzbget'
export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  z.looseObject({
    storage: z.enum(['filebrowser', 'nextexplorer']).nullable().catch(null),
    subfolder: z.string().catch(defaultSubfolder),
    integrationPassword: z.string().nullable().catch(null),
  }),
)
