# Updating NZBGet

## Determining the upstream version

List stable version tags newest first rather than following GitHub's Latest marker or the rolling `testing` release:

```sh
gh api --paginate 'repos/nzbgetcom/nzbget/tags?per_page=100' --jq '.[].name' \
  | grep -E '^v[0-9]+(\.[0-9]+)+$' | sort -Vr
```

Choose the first tag whose `nzbgetcom/nzbget` image supplies both `linux/amd64` and `linux/arm64`:

```sh
tag='<candidate-tag>'
docker buildx imagetools inspect "nzbgetcom/nzbget:$tag"
```

## Applying the bump

Update `images.nzbget.source.dockerBuild.buildArgs.IMAGE` in `startos/manifest/index.ts` and the version and localized release notes in `startos/versions/current.ts`.

The root `Dockerfile` copies Alpine's CA bundle over `/app/nzbget/cacert.pem`, NZBGet's default `CertStore`. Keep the layer until both upstream architecture images supply a nonempty bundle without emSign ECC Root CA - G3:

```sh
(
  for arch in amd64 arm64; do
    docker run --rm --platform "linux/$arch" --entrypoint sh "nzbgetcom/nzbget:$tag" -ec '
      test -s /app/nzbget/cacert.pem
      ! grep -q MIICTjCCAdOgAwIBAgIKPPYHqWhwDtqLhDAKBggqhkjOPQQDAzBr /app/nzbget/cacert.pem
    ' || exit 1
  done
)
```

Once both qualify, delete `Dockerfile`, restore `source: { dockerTag: 'nzbgetcom/nzbget:v<version>' }` in the manifest, and remove the README's temporary-layer description. Custom `CertStore` paths remain user-owned.

Read upstream's Dockerfile, entrypoint and configuration template for changes to paths, authentication and tools. Preserve the literal key/value parser; NZBGet does not use INI quoting. Restricted integration credentials must support status, configuration, queue and history methods. Refresh the SDK pin and lockfile as needed; schema-changing releases are not declared downgrade-safe.
