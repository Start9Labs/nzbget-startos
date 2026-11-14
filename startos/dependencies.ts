import { storeJson } from './fileModels/store.json'
import {
  filebrowserDescription,
  nextexplorerDescription,
} from './manifest/i18n'
import { sdk } from './sdk'

export const dependencies = sdk.Dependencies.of()
  .addDependency(
    sdk.Dependency.optional('filebrowser', {
      description: filebrowserDescription,
      metadata: {
        title: 'FileBrowser Quantum',
        icon: 'https://raw.githubusercontent.com/Start9Labs/filebrowser-quantum-startos/next/icon.svg',
      },
      versionRange: '>=#quantum:2.0.2-stable:3',
      kind: 'exists',
      enabled: async ({ effects }) =>
        (await storeJson.read((s) => s.storage).const(effects)) ===
        'filebrowser',
    }),
  )
  .addDependency(
    sdk.Dependency.optional('nextexplorer', {
      description: nextexplorerDescription,
      metadata: {
        title: 'NextExplorer',
        icon: 'https://raw.githubusercontent.com/Start9Labs/nextexplorer-startos/next/icon.svg',
      },
      versionRange: '>=2.2.7:0',
      kind: 'exists',
      enabled: async ({ effects }) =>
        (await storeJson.read((s) => s.storage).const(effects)) ===
        'nextexplorer',
    }),
  )
