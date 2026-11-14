import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z
  .looseObject({ ControlPassword: z.string().catch('') })
  .catchall(z.string())

export const nzbgetConf = FileHelper.raw<z.infer<typeof shape>>(
  { base: sdk.volumes.main, subpath: 'nzbget.conf' },
  (values) =>
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n') + '\n',
  (text) =>
    Object.fromEntries(
      text.split(/\r?\n/).flatMap((line) => {
        const match = line.match(/^\s*([^#=\s]+)\s*=(.*)$/)
        return match ? [[match[1], match[2].trim()]] : []
      }),
    ),
  (values) => shape.parse(values),
)
