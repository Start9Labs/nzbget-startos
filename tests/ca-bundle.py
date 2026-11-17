#!/usr/bin/env python3
"""Exercise NZBGet's effective trust store against a built image (Linux Docker)."""

import argparse
import base64
import hashlib
import json
from pathlib import Path
import re
import socket
import socketserver
import ssl
import subprocess
import tempfile
import threading
import time
import urllib.error
import urllib.request


COMPROMISED = "86A1ECBA089C4A8D3BBE2734C612BA341D813E043CF9E8A862CD5C57A36BBE6B"
UNRELATED_ROOTS = {
    "ISRG Root X1": "96BCEC06264976F37460779ACF28C5A7CFE8A3C0AAE11A8FFCEE05C0BDDF08C6",
    "DigiCert Global Root G2": "CB3CCBB76031E5E0138F8DD39A23F9DE47FFC35E43C1144CEA27D46A5AB1CB5F",
}
BINARY = "/app/nzbget/nzbget"
TEMPLATE = "/app/nzbget/share/nzbget/nzbget.conf"


def command(*args):
    return subprocess.check_output(args, text=True).strip()


def fingerprints(bundle):
    return {
        hashlib.sha256(ssl.PEM_cert_to_DER_cert(pem)).hexdigest().upper()
        for pem in re.findall(
            r"-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----", bundle, re.S
        )
    }


def rpc(port, method, params):
    request = urllib.request.Request(
        f"http://127.0.0.1:{port}/jsonrpc",
        data=json.dumps({"method": method, "params": params}).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": "Basic " + base64.b64encode(b"test:secret").decode(),
        },
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        payload = json.load(response)
    assert not payload.get("error"), payload
    return payload["result"]


def available_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def check_tls(image, platform, directory, server_port, custom):
    port = available_port()
    args = [
        "docker", "run", "-d", "--network", "host", "--platform", platform,
        "-v", f"{directory}:/test-ca:ro", "--entrypoint", BINARY, image,
        "-s", "-c", TEMPLATE, "-o", "MainDir=/tmp",
        "-o", "ControlIP=127.0.0.1", "-o", f"ControlPort={port}",
        "-o", "ControlUsername=test", "-o", "ControlPassword=secret",
        "-o", "AuthorizedIP=", "-o", "OutputMode=log",
    ]
    if custom:
        args += ["-o", "CertStore=/test-ca/cert.pem"]
    container = command(*args)
    try:
        deadline = time.monotonic() + 30
        while True:
            try:
                rpc(port, "status", [])
                break
            except (urllib.error.URLError, TimeoutError):
                if time.monotonic() >= deadline:
                    raise AssertionError(command("docker", "logs", container))
                time.sleep(0.1)
        config = {item["Name"]: item["Value"] for item in rpc(port, "config", [])}
        assert config["CertCheck"] == "yes", config["CertCheck"]
        expected = "/test-ca/cert.pem" if custom else "/app/nzbget/cacert.pem"
        assert config["CertStore"] == expected, config["CertStore"]
        result = rpc(port, "testserver", ["localhost", server_port, "", "", True, "", 5, 2])
        if custom:
            assert result == "", (result, rpc(port, "log", [0, 1000]))
            print("PASS: NZBGet accepts TLS with the explicitly configured custom CertStore")
        else:
            messages = "\n".join(item["Text"] for item in rpc(port, "log", [0, 1000]))
            assert result and "self-signed certificate" in messages.lower(), (result, messages)
            print("PASS: NZBGet default CertStore rejects untrusted TLS with a certificate verification error")
    except Exception:
        print(command("docker", "logs", container))
        raise
    finally:
        command("docker", "rm", "-f", container)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image")
    parser.add_argument("--platform", default="linux/amd64")
    args = parser.parse_args()

    def image_command(*cmd):
        return command("docker", "run", "--rm", "--platform", args.platform,
                       "--entrypoint", cmd[0], args.image, *cmd[1:])

    config = dict(re.findall(r'^(\w+) = "(.*)"$', image_command(BINARY, "-c", TEMPLATE, "-p"), re.M))
    assert config["CertCheck"] == "yes", config["CertCheck"]
    bundle = image_command("cat", config["CertStore"])
    system_bundle = image_command("cat", "/etc/ssl/certs/ca-certificates.crt")
    roots = fingerprints(bundle)
    assert roots, "The effective default trust store is empty"
    assert COMPROMISED not in roots, "The compromised emSign ECC Root CA - G3 is still trusted"
    assert bundle == system_bundle, "NZBGet's private trust store differs from the system bundle"
    for name, fingerprint in UNRELATED_ROOTS.items():
        assert fingerprint in roots, f"Unrelated root missing: {name}"
    print(f"PASS: {args.platform} effective CertStore={config['CertStore']}: {len(roots)} roots; compromised root absent; unrelated roots retained")

    with tempfile.TemporaryDirectory(prefix="nzbget-ca-") as directory:
        path = Path(directory)
        subprocess.run([
            "openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
            "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost",
            "-keyout", str(path / "key.pem"), "-out", str(path / "cert.pem"),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(path / "cert.pem", path / "key.pem")

        class NntpHandler(socketserver.BaseRequestHandler):
            def handle(self):
                try:
                    self.request.settimeout(10)
                    with context.wrap_socket(self.request, server_side=True) as connection:
                        connection.sendall(b"200 Test NNTP server ready\r\n")
                        with connection.makefile("rb") as stream:
                            for line in stream:
                                if line.startswith(b"QUIT"):
                                    connection.sendall(b"205 Closing connection\r\n")
                                    break
                                connection.sendall(b"430 No such article\r\n")
                except (ssl.SSLError, BrokenPipeError, ConnectionResetError):
                    pass

        with socketserver.ThreadingTCPServer(("127.0.0.1", 0), NntpHandler) as server:
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                for custom in (False, True):
                    check_tls(args.image, args.platform, directory, server.server_address[1], custom)
            finally:
                server.shutdown()
                thread.join()


if __name__ == "__main__":
    main()
