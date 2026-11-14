import { defaultSubfolder, storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { validSubfolder } from '../utils'

const { InputSpec, Value } = sdk
export const setDownloadLocation = sdk.Action.withInput(
  'set-download-location',
  async () => ({
    name: i18n('Set Download Location'),
    description: i18n(
      'Choose shared storage for downloads. NextExplorer paths begin with a location, such as Files.',
    ),
    warning: i18n(
      'Restarts NZBGet without moving files. Finish or remove queued downloads before changing storage.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  InputSpec.of({
    storage: Value.select({
      name: i18n('Storage'),
      values: {
        filebrowser: 'FileBrowser Quantum',
        nextexplorer: 'NextExplorer',
      },
      default: 'filebrowser',
    }),
    subfolder: Value.text({
      name: i18n('Download Folder'),
      required: true,
      default: defaultSubfolder,
    }),
  }),
  async () => {
    const store = await storeJson.read().once()
    return {
      storage: store?.storage ?? 'filebrowser',
      subfolder: store?.subfolder ?? defaultSubfolder,
    }
  },
  async ({ effects, input }) => {
    if (
      !validSubfolder(input.subfolder) ||
      (input.storage === 'nextexplorer' && !input.subfolder.includes('/'))
    )
      throw new Error(
        i18n(
          'Use a relative folder without empty, dot or parent segments; NextExplorer requires a location and subfolder.',
        ),
      )
    await storeJson.merge(effects, input)
  },
)
