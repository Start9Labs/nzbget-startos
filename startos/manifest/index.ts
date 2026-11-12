import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'nzbget',
  title: 'NZBGet',
  license: 'GPL-2.0',
  packageRepo: 'https://github.com/Start9Labs/nzbget-startos',
  upstreamRepo: 'https://github.com/nzbgetcom/nzbget',
  marketingUrl: 'https://nzbget.com',
  donationUrl: 'https://nzbget.com/donate/',
  description: { short, long },
  volumes: ['main', 'startos', 'public'],
  images: {
    nzbget: {
      source: { dockerTag: 'nzbgetcom/nzbget:v26.3' },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
