import { utils } from '@start9labs/start-sdk'
import { nzbgetConf } from '../fileModels/nzbget.conf'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { adminUsername } from '../utils'

export const setAdminPassword = sdk.Action.withoutInput(
  'set-admin-password',
  async ({ effects }) => ({
    name: i18n('Set Admin Password'),
    description: i18n(
      'Generate a new admin password. Changing it restarts NZBGet.',
    ),
    warning: (await nzbgetConf.read((c) => c.ControlPassword).const(effects))
      ? i18n('Replaces the current admin password.')
      : null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    const password = utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 32 })
    await nzbgetConf.merge(effects, { ControlPassword: password })
    return {
      version: '1',
      title: i18n('Login Credentials'),
      message: i18n('Sign in after NZBGet finishes starting.'),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: adminUsername,
            masked: false,
            copyable: true,
            qr: false,
            launchable: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: password,
            masked: true,
            copyable: true,
            qr: false,
            launchable: false,
          },
        ],
      },
    }
  },
)
