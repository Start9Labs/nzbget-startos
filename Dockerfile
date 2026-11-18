ARG IMAGE
FROM ${IMAGE}

# NZBGet's default CertStore is private, not the system trust bundle.
# CVE-2026-91403: the marker identifies emSign ECC Root CA - G3.
RUN apk upgrade --no-cache ca-certificates-bundle \
 && cp /etc/ssl/certs/ca-certificates.crt /app/nzbget/cacert.pem \
 && test -s /app/nzbget/cacert.pem \
 && ! grep -q MIICTjCCAdOgAwIBAgIKPPYHqWhwDtqLhDAKBggqhkjOPQQDAzBr /app/nzbget/cacert.pem
