import { posix } from 'node:path'
import type { z } from '@start9labs/start-sdk'
import type { credentialsShape } from './fileModels/credentials'

export const uiPort = 6789
export const uiHostId = 'ui-multi'
export const adminUsername = 'nzbget'
export const integrationUsername = 'startos'
export const storageMountpoints = {
  filebrowser: '/mnt/filebrowser',
  nextexplorer: '/mnt/nextexplorer',
} as const

export function completedDownloadPath(
  storage: keyof typeof storageMountpoints,
  subfolder: string,
) {
  return `${storageMountpoints[storage]}/${subfolder}/completed`
}

export function validSubfolder(path: string) {
  return (
    /^[a-zA-Z0-9_./ -]+$/.test(path) &&
    !posix.isAbsolute(path) &&
    path
      .split('/')
      .every((part) => part !== '' && part !== '.' && part !== '..')
  )
}

export type NzbgetConnection = {
  connected: boolean
  address: string | null
  credentials: z.infer<typeof credentialsShape> | null
}

export type ArrApi = <A>(
  path: string,
  method?: string,
  body?: unknown,
) => Promise<A>

type DownloadClient = {
  id: number
  name: string
  enable: boolean
  fields: { name: string; value?: unknown }[]
}

/**
 * Reconciles one reserved Arr client by persisted id or case-insensitive name.
 * Missing connection values preserve the record; deselection deletes it.
 * Defaults apply only on creation. The caller persists the returned id.
 */
export async function reconcileArrDownloadClient(
  api: ArrApi,
  options: {
    storedId: number | null
    name: string
    implementation: string
    connected: boolean
    values: Record<string, unknown> | null
    defaults?: Record<string, unknown>
  },
) {
  const { storedId, name, implementation, connected, values, defaults } =
    options
  const clients = await api<DownloadClient[]>('/downloadclient')
  const current =
    clients.find((c) => c.id === storedId) ??
    clients.find((c) => c.name.toLowerCase() === name.toLowerCase())
  if (!connected) {
    if (current) await api(`/downloadclient/${current.id}`, 'DELETE')
    return null
  }
  if (!values) return current?.id ?? null
  const template =
    current ??
    (
      await api<(DownloadClient & { implementation: string })[]>(
        '/downloadclient/schema',
      )
    ).find((s) => s.implementation === implementation)
  if (!template)
    throw new Error(`Missing ${implementation} download client schema`)
  // Enabled creates test connectivity even with forceSave; updates do not.
  const record =
    current ??
    (await api<DownloadClient>('/downloadclient?forceSave=true', 'POST', {
      ...template,
      name,
      enable: false,
      fields: template.fields.map((f) =>
        defaults && f.name in defaults ? { ...f, value: defaults[f.name] } : f,
      ),
    }))
  await api(`/downloadclient/${record.id}?forceSave=true`, 'PUT', {
    ...record,
    name,
    enable: true,
    fields: record.fields.map((f) =>
      f.name in values ? { ...f, value: values[f.name] } : f,
    ),
  })
  return record.id
}

export function downloadClientAddressFields(address: string) {
  const [host, port] = address.split(/:(?=\d+$)/)
  return { host, port: Number(port), useSsl: false }
}

export const prepareScript = `
for directory do
  if [ ! -d "$directory" ]; then
    mkdir -p -- "$directory"
    chown 1000:1000 -- "$directory"
  fi
done
`
