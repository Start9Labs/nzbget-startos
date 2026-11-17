FROM nzbgetcom/nzbget:v26.3

# NZBGet's default CertStore is private, not the system trust bundle.
RUN apk upgrade --no-cache ca-certificates-bundle \
 && cp /etc/ssl/certs/ca-certificates.crt /app/nzbget/cacert.pem
