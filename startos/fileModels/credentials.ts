import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Dependents mount only `public`; the admin password stays private.
export const credentialsShape = z.looseObject({
  username: z.string(),
  password: z.string(),
  downloadPath: z.string().nullable().catch(null),
})

export const credentialsFile = FileHelper.json(
  { base: sdk.volumes.public, subpath: 'credentials.json' },
  credentialsShape,
)
