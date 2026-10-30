# A pretend internet for the practice Python: urllib.request.urlopen, socket
# connections and TLS certificates answer from the step's scenario instead of
# the network. Also a practice clock, so time.sleep() and slow websites don't
# make anyone wait for real.
#
# Scenario shape:
#   web:   {'https://www.example.com': {'status': 200, 'body': '...', 'ms': 180},
#           'https://api.example.com/health': {'status': 503},
#           'https://slow.example.com': {'hang': True}}
#   certs: {'www.example.com': {'notAfter': 'Dec  5 12:00:00 2026 GMT', 'issuer': "Let's Encrypt"}}
import calendar
import email.message
import io
import socket
import sys
import time
import types
import urllib.error
import urllib.parse
import urllib.request

WEB = {}
CERTS = {}
LOG = []
_clock = {'offset': 0.0}

_real = {'time': time.time, 'monotonic': time.monotonic, 'perf_counter': time.perf_counter,
         'create_connection': socket.create_connection}

# ----------------------------------------------------------------------------
# Clock
# ----------------------------------------------------------------------------


def advance(seconds):
    _clock['offset'] += max(0.0, float(seconds))


def _sleep(seconds):
    if seconds < 0:
        raise ValueError('sleep length must be non-negative')
    LOG.append({'kind': 'sleep', 'seconds': seconds})
    advance(seconds)


def _patch_clock():
    time.sleep = _sleep
    time.time = lambda: _real['time']() + _clock['offset']
    time.monotonic = lambda: _real['monotonic']() + _clock['offset']
    time.perf_counter = lambda: _real['perf_counter']() + _clock['offset']


# ----------------------------------------------------------------------------
# Web
# ----------------------------------------------------------------------------

_NO_TIMEOUT = object()
_STATUS_TEXT = {200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved Permanently', 302: 'Found', 400: 'Bad Request',
                401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 429: 'Too Many Requests', 500: 'Internal Server Error',
                502: 'Bad Gateway', 503: 'Service Unavailable', 504: 'Gateway Timeout'}


def _site(url):
    if url in WEB:
        return WEB[url]
    bare = url.rstrip('/')
    if bare in WEB:
        return WEB[bare]
    parts = urllib.parse.urlsplit(url)
    origin = f'{parts.scheme}://{parts.netloc}'
    if origin in WEB and parts.path in ('', '/'):
        return WEB[origin]
    return None


def _known_host(host):
    return host in CERTS or any(urllib.parse.urlsplit(u).hostname == host for u in WEB)


def _headers(extra=None, body=b''):
    msg = email.message.Message()
    msg['Content-Type'] = (extra or {}).get('Content-Type', 'text/html; charset=utf-8')
    msg['Content-Length'] = str(len(body))
    msg['Server'] = 'practice'
    for k, v in (extra or {}).items():
        if k != 'Content-Type':
            msg[k] = v
    return msg


class _Response(io.BufferedIOBase):
    def __init__(self, url, status, body, headers):
        self.url = url
        self.status = self.code = status
        self.reason = self.msg = _STATUS_TEXT.get(status, '')
        self.headers = headers
        self._body = io.BytesIO(body)

    def read(self, amt=None):
        return self._body.read() if amt is None or amt < 0 else self._body.read(amt)

    def readline(self, limit=-1):
        return self._body.readline(limit)

    def getcode(self):
        return self.status

    def geturl(self):
        return self.url

    def info(self):
        return self.headers

    def getheader(self, name, default=None):
        return self.headers.get(name, default)

    def __repr__(self):
        return f'<http.client.HTTPResponse object at 0x{id(self):x}>'


def _warn(text):
    print(f'[practice internet] {text}', file=sys.stderr)


def urlopen(url, data=None, timeout=_NO_TIMEOUT, *, context=None, **_):
    if isinstance(url, urllib.request.Request):
        req = url
        full, method = req.full_url, req.get_method()
    else:
        full = url
        method = 'POST' if data is not None else 'GET'
        if not isinstance(full, str):
            raise AttributeError(f"'{type(full).__name__}' object has no attribute 'timeout'")
    parts = urllib.parse.urlsplit(full)
    if parts.scheme not in ('http', 'https'):
        raise urllib.error.URLError(f'unknown url type: {parts.scheme or full}')
    has_timeout = timeout is not _NO_TIMEOUT and timeout is not None
    entry = {'kind': 'http', 'url': full, 'method': method, 'timeout': timeout if has_timeout else None}
    LOG.append(entry)
    site = _site(full)
    if site is None:
        if not _known_host(parts.hostname or ''):
            entry['result'] = 'dns'
            raise urllib.error.URLError(socket.gaierror(-2, 'Name or service not known'))
        site = {'status': 404, 'body': 'Not Found'}
    if site.get('error') == 'dns':
        entry['result'] = 'dns'
        raise urllib.error.URLError(socket.gaierror(-2, 'Name or service not known'))
    if site.get('error') == 'refused':
        entry['result'] = 'refused'
        raise urllib.error.URLError(ConnectionRefusedError(111, 'Connection refused'))
    if parts.scheme == 'https':
        _verify(parts.hostname, context, entry, wrap=True)
    # The connection works, then the answer is slow or never comes: like real
    # urlopen, that's a bare TimeoutError, not wrapped in URLError
    ms = 60_000_000 if site.get('hang') else site.get('ms', 120)
    if has_timeout and ms > timeout * 1000:
        advance(timeout)
        entry['result'] = 'timeout'
        raise TimeoutError('timed out')
    if site.get('hang'):
        advance(120)
        entry['result'] = 'timeout'
        _warn(f"{full} never answered. Without timeout=..., a real program waits for ever "
              "(and a Lambda function is stopped at its time limit). The practice internet gave up after 2 minutes.")
        raise TimeoutError('timed out')
    advance(ms / 1000)
    status = site.get('status', 200)
    body = site.get('body', _STATUS_TEXT.get(status, '')).encode('utf-8')
    headers = _headers(site.get('headers'), body)
    entry['result'] = status
    if status >= 400:
        raise urllib.error.HTTPError(full, status, _STATUS_TEXT.get(status, ''), headers, io.BytesIO(body))
    return _Response(full, status, body, headers)


# ----------------------------------------------------------------------------
# Sockets and certificates
# ----------------------------------------------------------------------------


class _FakeSocket:
    def __init__(self, host, port, timeout):
        self.host, self.port, self.timeout = host, port, timeout

    def settimeout(self, value):
        self.timeout = value

    def gettimeout(self):
        return self.timeout

    def getpeername(self):
        return ('203.0.113.10', self.port)

    def close(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()


def create_connection(address, timeout=_NO_TIMEOUT, source_address=None, **_):
    host, port = address
    has_timeout = timeout is not _NO_TIMEOUT and timeout is not None
    entry = {'kind': 'connect', 'host': host, 'port': port, 'timeout': timeout if has_timeout else None}
    LOG.append(entry)
    if not _known_host(host):
        entry['result'] = 'dns'
        raise socket.gaierror(-2, 'Name or service not known')
    site = next((s for u, s in WEB.items() if urllib.parse.urlsplit(u).hostname == host), {})
    if site.get('error') == 'dns':
        entry['result'] = 'dns'
        raise socket.gaierror(-2, 'Name or service not known')
    if site.get('error') == 'refused':
        entry['result'] = 'refused'
        raise ConnectionRefusedError(111, 'Connection refused')
    if site.get('hang'):
        advance(timeout if has_timeout else 120)
        entry['result'] = 'timeout'
        if not has_timeout:
            _warn(f'{host} never answered. Pass timeout=10 to socket.create_connection so a stuck site can\'t hang your program.')
        raise TimeoutError('timed out')
    advance(site.get('ms', 120) / 2000)
    entry['result'] = 'connected'
    return _FakeSocket(host, port, timeout if has_timeout else None)


def _cert_seconds(text):
    """ssl.cert_time_to_seconds: 'Dec  5 12:00:00 2026 GMT' -> seconds since 1970."""
    try:
        return calendar.timegm(time.strptime(text, '%b %d %H:%M:%S %Y GMT'))
    except ValueError:
        raise ValueError(f'time data {text!r} does not match format "%b %d %H:%M:%S %Y %Z"') from None


def _cert_for(host):
    if host in CERTS:
        return CERTS[host]
    # Hosts without their own entry get a healthy certificate, 80 days left
    return {'notAfter': cert_time(_real['time']() + 80 * 86400)}


def cert_time(epoch):
    """Format seconds the way certificates show dates: 'Dec  5 12:00:00 2026 GMT'."""
    t = time.gmtime(epoch)
    return f"{time.strftime('%b', t)} {t.tm_mday:>2} {time.strftime('%H:%M:%S %Y', t)} GMT"


class SSLError(OSError):
    pass


class SSLCertVerificationError(SSLError, ValueError):
    def __init__(self, *args, verify_code=1, verify_message=''):
        super().__init__(*args)
        self.verify_code = verify_code
        self.verify_message = verify_message
        self.reason = 'CERTIFICATE_VERIFY_FAILED'
        self.library = 'SSL'


def _verify(host, context, entry=None, wrap=False):
    cert = _cert_for(host)
    check = context is None or (context.verify_mode != CERT_NONE)
    if not check:
        return cert
    if cert.get('wrongHost'):
        if entry is not None:
            entry['result'] = 'cert-hostname'
        err = SSLCertVerificationError(1, f"[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: Hostname mismatch, "
                                          f"certificate is not valid for '{host}'. (_ssl.c:1018)", verify_code=62,
                                       verify_message=f"Hostname mismatch, certificate is not valid for '{host}'.")
        raise urllib.error.URLError(err) if wrap else err
    if _cert_seconds(cert['notAfter']) < time.time():
        if entry is not None:
            entry['result'] = 'cert-expired'
        err = SSLCertVerificationError(1, '[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: certificate has expired (_ssl.c:1018)',
                                       verify_code=10, verify_message='certificate has expired')
        raise urllib.error.URLError(err) if wrap else err
    return cert


CERT_NONE, CERT_OPTIONAL, CERT_REQUIRED = 0, 1, 2
PROTOCOL_TLS_CLIENT, PROTOCOL_TLS_SERVER, PROTOCOL_TLS = 16, 17, 2


class _SSLSocket:
    def __init__(self, sock, host, cert, verified):
        self._sock, self.server_hostname, self._cert, self._verified = sock, host, cert, verified

    def getpeercert(self, binary_form=False):
        if binary_form:
            return b'0\x82\x05practice-der-certificate'
        if not self._verified:
            return {}  # with CERT_NONE, Python doesn't parse the certificate at all
        host = self.server_hostname
        issuer = self._cert.get('issuer', "Let's Encrypt")
        return {
            'subject': ((('commonName', host),),),
            'issuer': ((('countryName', 'US'),), (('organizationName', issuer),), (('commonName', 'R11'),)),
            'version': 3,
            'serialNumber': '04A1B2C3D4E5F60718293A4B5C6D7E8F',
            'notBefore': self._cert.get('notBefore', 'Sep  1 00:00:00 2026 GMT'),
            'notAfter': self._cert['notAfter'],
            'subjectAltName': (('DNS', host),),
        }

    def version(self):
        return 'TLSv1.3'

    def cipher(self):
        return ('TLS_AES_256_GCM_SHA384', 'TLSv1.3', 256)

    def close(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()


class SSLContext:
    def __init__(self, protocol=PROTOCOL_TLS_CLIENT):
        self.protocol = protocol
        self.check_hostname = protocol == PROTOCOL_TLS_CLIENT
        self.verify_mode = CERT_REQUIRED if protocol == PROTOCOL_TLS_CLIENT else CERT_NONE

    def wrap_socket(self, sock, server_side=False, do_handshake_on_connect=True, suppress_ragged_eofs=True, server_hostname=None, session=None):
        if self.check_hostname and not server_hostname:
            raise ValueError('check_hostname requires server_hostname')
        host = server_hostname or getattr(sock, 'host', '')
        LOG.append({'kind': 'tls', 'host': host, 'verify': self.verify_mode != CERT_NONE})
        cert = _verify(host, self)
        return _SSLSocket(sock, host, cert, self.verify_mode != CERT_NONE)

    def load_default_certs(self, purpose=None):
        pass

    def load_verify_locations(self, cafile=None, capath=None, cadata=None):
        pass

    def set_ciphers(self, ciphers):
        pass


class Purpose:
    SERVER_AUTH = 'SERVER_AUTH'
    CLIENT_AUTH = 'CLIENT_AUTH'


def create_default_context(purpose=Purpose.SERVER_AUTH, *, cafile=None, capath=None, cadata=None):
    return SSLContext(PROTOCOL_TLS_CLIENT)


def _unverified_context(*args, **kwargs):
    ctx = SSLContext(PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode = CERT_NONE
    return ctx


def get_server_certificate(addr, ssl_version=None, ca_certs=None, timeout=_NO_TIMEOUT):
    host, port = addr
    create_connection((host, port), timeout)
    return ('-----BEGIN CERTIFICATE-----\nMIIFpracticeCertificateFor' + host.replace('.', '') +
            '\n-----END CERTIFICATE-----\n')


def install():
    """Swap the network functions for the pretend ones, and add a pretend ssl module."""
    _patch_clock()
    urllib.request.urlopen = urlopen
    socket.create_connection = create_connection
    ssl = types.ModuleType('ssl')
    ssl.__dict__.update(
        SSLContext=SSLContext, SSLError=SSLError, SSLCertVerificationError=SSLCertVerificationError,
        CertificateError=SSLCertVerificationError, SSLSocket=_SSLSocket, Purpose=Purpose,
        create_default_context=create_default_context, _create_unverified_context=_unverified_context,
        cert_time_to_seconds=_cert_seconds, get_server_certificate=get_server_certificate,
        CERT_NONE=CERT_NONE, CERT_OPTIONAL=CERT_OPTIONAL, CERT_REQUIRED=CERT_REQUIRED,
        PROTOCOL_TLS_CLIENT=PROTOCOL_TLS_CLIENT, PROTOCOL_TLS_SERVER=PROTOCOL_TLS_SERVER, PROTOCOL_TLS=PROTOCOL_TLS,
        HAS_SNI=True, OPENSSL_VERSION='OpenSSL 3.0 (practice)',
    )
    sys.modules['ssl'] = ssl


def reset(web=None, certs=None):
    WEB.clear()
    WEB.update(web or {})
    CERTS.clear()
    CERTS.update(certs or {})
    LOG.clear()
    _clock['offset'] = 0.0


def snapshot():
    return {'log': list(LOG[-300:]), 'slept': sum(e['seconds'] for e in LOG if e['kind'] == 'sleep')}
