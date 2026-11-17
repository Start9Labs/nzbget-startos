ARCHES := x86 arm
# overrides to s9pk.mk must precede the include statement
include node_modules/@start9labs/start-sdk/s9pk.mk

.PHONY: test-ca
test-ca:
	docker buildx build --load --platform linux/amd64 -t nzbget-startos:ca-test-amd64 .
	python3 tests/ca-bundle.py nzbget-startos:ca-test-amd64 --platform linux/amd64
	docker buildx build --load --platform linux/arm64 -t nzbget-startos:ca-test-arm64 .
	python3 tests/ca-bundle.py nzbget-startos:ca-test-arm64 --platform linux/arm64
