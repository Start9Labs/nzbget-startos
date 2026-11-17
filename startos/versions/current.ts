import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.3:1',
  releaseNotes: {
    en_US:
      'Refresh the default TLS trust bundle to remove the compromised emSign ECC Root CA - G3 certificate. Custom CertStore settings are unchanged.',
    es_ES:
      'Actualiza los certificados TLS predeterminados para eliminar el certificado comprometido emSign ECC Root CA - G3. Los ajustes personalizados de CertStore no cambian.',
    de_DE:
      'Aktualisiert die standardmäßigen TLS-Zertifikate und entfernt das kompromittierte Zertifikat emSign ECC Root CA - G3. Benutzerdefinierte CertStore-Einstellungen bleiben unverändert.',
    pl_PL:
      'Odświeża domyślny zestaw certyfikatów TLS, usuwając skompromitowany certyfikat emSign ECC Root CA - G3. Własne ustawienia CertStore pozostają bez zmian.',
    fr_FR:
      'Actualise les certificats TLS par défaut pour supprimer le certificat compromis emSign ECC Root CA - G3. Les paramètres CertStore personnalisés restent inchangés.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
