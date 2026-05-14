
"""
GLITXH-VIP GENERATOR V2.5 ULTRA - Cython Compatible
Credits : glitxh (tele : @glitxh4ff)
"""

# ============================================================
# ALL IMPORTS MUST BE AT TOP LEVEL (CYTHON REQUIREMENT)
# ============================================================
import os
import sys
import time
import json
import re
import hmac
import zlib
import random
import string
import codecs
import base64
import platform
import socket
import hashlib
import threading
import subprocess
import urllib.request
import urllib.error
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

import requests
import urllib3
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
from colorama import Fore, Style, init
from cfonts import render

# Initialize
init(autoreset=True)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

R = Fore.RED
G = Fore.GREEN
Y = Fore.YELLOW
C = Fore.CYAN
M = Fore.MAGENTA
LG = Fore.LIGHTGREEN_EX
W = Fore.RESET
B = Style.BRIGHT

# ============================================================
# CONSTANTS
# ============================================================
DEVICE_CHECK_URL = "https://raw.githubusercontent.com/septianhdnatta/idd/refs/heads/main/device.json"
_DEVICE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.deviceid')
_XOR_KEY = bytes([0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0])

VALID = {"ME", "IND", "ID", "VN", "TH", "BD", "PK", "TW", "EU", "CIS", "NA", "SAC", "BR", "SG"}
LANG = {
    "ME": "ar", "IND": "hi", "ID": "id", "VN": "vi", "TH": "th", "BD": "bn",
    "PK": "ur", "TW": "zh", "EU": "en", "CIS": "ru", "NA": "en", "SAC": "es", "BR": "pt", "SG": "en"
}
TIER_E = {"NORMAL": "🍀", "LOW": "😬", "MEDIUM": "🤩", "HIGH": "☠️", "LEGEND": "❤️‍🔥"}
TIER_C = {"LEGEND": R + B, "HIGH": M + B, "MEDIUM": C + B, "LOW": Y, "NORMAL": G}

# Crypto keys
_AK = bytes([89, 103, 38, 116, 99, 37, 68, 69, 117, 104, 54, 37, 90, 99, 94, 56])
_AI = bytes([54, 111, 121, 90, 68, 114, 50, 50, 69, 51, 121, 99, 104, 106, 77, 37])
KEY = bytes.fromhex("32656534343831396539623435393838343531343130363762323831363231383734643064356437616639643866376530306331653534373135623764316533")

# TOR globals
_TOR_PROC = None
_TOR_READY = False
_TOR_REN = False
_TOR_LK = threading.Lock()

# Proxy list
WS = [
    "http://gajuiica:wo29gu5sa2sh@31.59.20.176:6754/",
    "http://gajuiica:wo29gu5sa2sh@92.113.242.158:6742/",
    "http://gajuiica:wo29gu5sa2sh@198.23.239.134:6540/",
    "http://gajuiica:wo29gu5sa2sh@45.38.107.97:6014/",
    "http://gajuiica:wo29gu5sa2sh@107.172.163.27:6543/",
    "http://gajuiica:wo29gu5sa2sh@216.10.27.159:6837/",
    "http://gajuiica:wo29gu5sa2sh@142.111.67.146:5611/",
    "http://gajuiica:wo29gu5sa2sh@191.96.254.138:6185/",
    "http://gajuiica:wo29gu5sa2sh@31.58.9.4:6077/",
    "http://gajuiica:wo29gu5sa2sh@23.229.19.94:8689/",
]
_N_WS = len(WS)
_pidx = 0
_plock = threading.Lock()
_utor = False
_tts = time.time()
_local = threading.local()

# UA list
UA = [
    "GarenaMSDK/4.0.39(SM-A325M;Android 13;en;HK;)",
    "GarenaMSDK/4.0.39(Poco F3;Android 12;en;SG;)",
    "GarenaMSDK/4.0.39(Redmi Note 10;Android 11;en;ID;)",
]
_ui = 0
_ul = threading.Lock()

# State
_cnt = 0
_cnt_lk = threading.Lock()
_ts = {"NORMAL": 0, "LOW": 0, "MEDIUM": 0, "HIGH": 0, "LEGEND": 0}
_tslk = threading.Lock()
_stuck_t = time.time()
_stuck_lk = threading.Lock()
_stuck_on = True
_t0 = time.time()
_p100t = time.time()
_p100c = 0
_total = 0
_nw = 20

# Storage
BASE = "/sdcard/GLITXH-VIP"
_tfd = {}
_fl = threading.Lock()
_wbuf = []
_wblk = threading.Lock()
_WBSZ = 15

# Batch constants
_BATCH = 5
_RU = "https://100067.connect.garena.com/api/v2/oauth/guest:register"
_TU = "https://100067.connect.garena.com/api/v2/oauth/guest/token:grant"
_AT = b'afcfbf13334be42036e4f742c80b956344bed760ac91b3aff9b607a610ab4390'
_OI = b'1d8ec0240ede109973f3321b9354b44d'
_LP = (b'\x1a\x132025-08-30 05:19:21"\tfree fire(\x01:\x081.114.13B2Android OS 9 / API-28'
       b' (PI/rel.cjw.20220518.114133)J\x08HandheldR\nATM MobilsZ\x04WIFI`\xb6\nh\xee\x05'
       b'r\x03300z\x1fARMv7 VFPv3 NEON VMH | 2400 | 2\x80\x01\xc9\x0f\x8a\x01\x0fAdreno (TM) 640'
       b'\x92\x01\rOpenGL ES 3.2\x9a\x01+Google|dfa4ab4b-9dc4-454e-8065-e70c733fa53f'
       b'\xa2\x01\x0e105.235.139.91\xaa\x01\x02')
_LP2 = (b'\xb2\x01 1d8ec0240ede109973f3321b9354b44d'
        b'\xba\x01\x014\xc2\x01\x08Handheld\xca\x01\x10Asus ASUS_I005DA'
        b'\xea\x01@afcfbf13334be42036e4f742c80b956344bed760ac91b3aff9b607a610ab4390'
        b'\xf0\x01\x01\xca\x02\nATM Mobils\xd2\x02\x04WIFI'
        b'\xca\x03 7428b253defc164018c604a1ebbfebdf'
        b'\xe0\x03\xa8\x81\x02\xe8\x03\xf6\xe5\x01\xf0\x03\xaf\x13\xf8\x03\x84\x07'
        b'\x80\x04\xe7\xf0\x01\x88\x04\xa8\x81\x02\x90\x04\xe7\xf0\x01\x98\x04\xa8\x81\x02'
        b'\xc8\x04\x01\xd2\x04=/data/app/com.dts.freefireth-PdeDnOilCSFn37p1AH_FLg==/lib/arm'
        b'\xe0\x04\x01\xea\x04_2087f61c19f57f2af4e7feff0b24d9d9'
        b'|/data/app/com.dts.freefireth-PdeDnOilCSFn37p1AH_FLg==/base.apk'
        b'\xf0\x04\x03\xf8\x04\x01\x8a\x05\x0232\x9a\x05\n2019118692'
        b'\xb2\x05\tOpenGLES2\xb8\x05\xff\x7f\xc0\x05\x04\xe0\x05\xf3F\xea\x05\x07android'
        b'\xf2\x05pKqsHT5ZLWrYljNb5Vqh//yFRlaPHSO9NWSQsVvOmdhEEn7W+VHNUK+Q+fduA3pt'
        b'NrGB0Ll0LRz3WW0jOwesLj6aiU7sZ40p8BfUE/FI/jzSTwRe2'
        b'\xf8\x05\xfb\xe4\x06\x88\x06\x01\x90\x06\x01\x9a\x06\x014\xa2\x06\x014'
        b'\xb2\x06"GQ@O\x00\x0e^\x00D\x06UA\x0ePM\r\x13hZ\x07T\x06\x0cm\\V\x0ejYV;\x0bU5')

# ============================================================
# UTILITY FUNCTIONS
# ============================================================
def fmt(sec):
    sec = max(0, int(sec))
    d, sec = divmod(sec, 86400)
    h, sec = divmod(sec, 3600)
    m, s = divmod(sec, 60)
    p = []
    if d: p.append(f"{d}h")
    if h: p.append(f"{h}j")
    if m: p.append(f"{m}m")
    if s or not p: p.append(f"{s}d")
    return " ".join(p)

def aes_bytes(h): return AES.new(_AK, AES.MODE_CBC, _AI).encrypt(pad(bytes.fromhex(h), 16))
def aes_hex(h): return aes_bytes(h).hex()

def ev(n):
    r = []
    while True:
        b = n & 0x7F
        n >>= 7
        if n: b |= 0x80
        r.append(b)
        if not n: break
    return bytes(r)

def pb(fields):
    o = bytearray()
    for f, v in fields.items():
        if isinstance(v, dict):
            p = pb(v)
            o += ev((f << 3) | 2) + ev(len(p)) + p
        elif isinstance(v, int):
            o += ev((f << 3) | 0) + ev(v)
        else:
            p = v.encode() if isinstance(v, str) else v
            o += ev((f << 3) | 2) + ev(len(p)) + p
    return bytes(o)

def enc_oid(s):
    k = [0x30, 0x30, 0x30, 0x32, 0x30, 0x31, 0x37, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30, 0x31, 0x37,
         0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30, 0x31, 0x37, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30]
    return {"open_id": s, "field_14": "".join(chr(ord(c) ^ k[i % 32]) for i, c in enumerate(s))}

def ue(s): return "".join(c if 32 <= ord(c) <= 126 else f"\\u{ord(c):04x}" for c in s)

def decode_resp(text):
    for pfx in ("eyJhbGciOiJIUzI1NiIsInN2ciI6IjEiLCJ0eXAiOiJKV1QifQ", "eyJ"):
        i = text.find(pfx)
        if i < 0: continue
        t = text[i:]
        d1 = t.find(".")
        if d1 < 0: continue
        d2 = t.find(".", d1 + 1)
        if d2 < 0: continue
        try:
            p = t[d1 + 1:d2]
            p += "=" * ((4 - len(p) % 4) % 4)
            d = json.loads(base64.urlsafe_b64decode(p))
            for k in ("account_id", "external_id", "user_id", "uid"):
                if d.get(k): return str(d[k])
        except:
            pass
    return "N/A"

def _xor_encrypt(data): return bytes([data[i] ^ _XOR_KEY[i % len(_XOR_KEY)] for i in range(len(data))])

def _get_device_fingerprint():
    fp = []
    try:
        serial = subprocess.check_output(['getprop', 'ro.serialno'], text=True).strip()
        if not serial or serial == 'unknown':
            serial = os.environ.get('ANDROID_SERIAL', '')
        fp.append(serial)
    except:
        fp.append('')
    try:
        fp.append(platform.machine())
    except:
        fp.append('')
    try:
        fp.append(platform.system())
    except:
        fp.append('')
    try:
        with open('/system/build.prop', 'r') as f:
            for line in f:
                if 'ro.build.fingerprint' in line:
                    fp.append(line.split('=')[1].strip())
                    break
    except:
        fp.append('')
    try:
        fp.append(subprocess.check_output(['getprop', 'ro.product.manufacturer'], text=True).strip())
    except:
        fp.append('')
    try:
        fp.append(platform.processor())
    except:
        fp.append('')
    try:
        fp.append(time.tzname[0] if time.tzname else '')
    except:
        fp.append('')
    try:
        fp.append(str(os.getuid()))
    except:
        fp.append('')
    raw = '|'.join(fp).encode()
    h1 = hashlib.sha3_512(raw).digest()
    h2 = hashlib.blake2b(h1).digest()
    final = hashlib.sha256(h1 + h2).hexdigest()
    return '-'.join([final[i:i+4] for i in range(0, 32, 4)]).upper()

def _save_device_id(fingerprint, use_count=0):
    data = {'fp': fingerprint, 'use': use_count, 'ts': int(time.time())}
    json_str = json.dumps(data)
    compressed = zlib.compress(json_str.encode())
    encrypted = _xor_encrypt(compressed)
    encoded = base64.b64encode(encrypted).decode()
    sig = hmac.new(_XOR_KEY, encrypted, hashlib.blake2b).hexdigest()
    with open(_DEVICE_FILE, 'w') as f:
        f.write(encoded + '|' + sig)

def _load_device_id():
    if not os.path.exists(_DEVICE_FILE): return None
    try:
        with open(_DEVICE_FILE, 'r') as f:
            content = f.read().strip()
        if '|' not in content: return None
        encoded, sig = content.split('|')
        encrypted = base64.b64decode(encoded.encode())
        expected = hmac.new(_XOR_KEY, encrypted, hashlib.blake2b).hexdigest()
        if not hmac.compare_digest(sig, expected): return None
        decrypted = _xor_encrypt(encrypted)
        decompressed = zlib.decompress(decrypted)
        return json.loads(decompressed.decode())
    except:
        return None

def _tor_setup():
    global _TOR_PROC, _TOR_READY
    for p in ['/data/data/com.termux/files/usr/etc/resolv.conf', '/etc/resolv.conf']:
        try:
            os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, 'w').write("nameserver 1.1.1.1\nnameserver 1.0.0.1\n")
            break
        except: pass
    try: subprocess.run(['pkill', '-9', 'tor'], capture_output=True); time.sleep(1)
    except: pass
    rc = ("SocksPort 127.0.0.1:9050\nControlPort 127.0.0.1:9051\nCookieAuthentication 0\n"
          "MaxCircuitDirtiness 8\nUseEntryGuards 0\nNumEntryGuards 8\nLog notice stdout\n")
    tp = '/tmp/torrc'
    for p in ['/data/data/com.termux/files/usr/etc/tor/torrc', '/tmp/torrc']:
        try: os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'w').write(rc); tp = p; break
        except: pass
    _TOR_PROC = subprocess.Popen(['tor', '-f', tp], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    for _ in range(25):
        time.sleep(1)
        if subprocess.run(['pgrep', '-x', 'tor'], capture_output=True).returncode == 0:
            _TOR_READY = True; break

def _tor_renew():
    global _TOR_REN
    with _TOR_LK:
        if _TOR_REN: return
        _TOR_REN = True
    try:
        s = socket.socket()
        s.settimeout(4)
        s.connect(('127.0.0.1', 9051))
        s.sendall(b'AUTHENTICATE ""\r\nSIGNAL NEWNYM\r\nQUIT\r\n')
        s.recv(256)
        s.close()
        time.sleep(1)
    except: pass
    finally: _TOR_REN = False

def _sess():
    global _utor, _tts, _pidx
    now = time.time()
    if now - _tts >= 5:
        _utor = not _utor
        _tts = now
        if _utor: threading.Thread(target=_tor_renew, daemon=True).start()
    if not hasattr(_local, 'n'): _local.n = 0; _local.s = None
    _local.n += 1
    if _local.s is None or _local.n % 50 == 0:
        s = requests.Session()
        s.verify = False
        a = requests.adapters.HTTPAdapter(pool_connections=20, pool_maxsize=50, max_retries=0)
        s.mount('http://', a); s.mount('https://', a)
        if _utor and _TOR_READY:
            s.proxies = {'http': 'socks5h://127.0.0.1:9050', 'https': 'socks5h://127.0.0.1:9050'}
        else:
            with _plock: p = WS[_pidx % _N_WS]; _pidx += 1
            s.proxies = {'http': p, 'https': p}
        _local.s = s
    return _local.s

def _ua():
    global _ui
    with _ul: u = UA[_ui % len(UA)]; _ui += 1; return u

def _nm(): return 'N4taza' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
def _pw(): return "N4TAZA-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=9)) + "-VVIP"

def tier(aid):
    if not aid or aid == "N/A": return "NORMAL"
    s = 0
    if len(aid) >= 6:
        rem = aid[3:]
        if len(set(aid)) == 1: s += 30
        elif len(set(rem)) == 1: s += 25
        elif aid[:3] in {"154","155","156","157","158","159"} and len(set(rem)) == 1: s += 28
    for pat, pts in [(r'(\d)\1{5,}', 10), (r'(\d)\1{4,}', 8), (r'(\d)\1{3,}', 6), (r'(\d)\1{2,}', 3)]:
        if re.search(pat, aid): s += pts; break
    if re.search(r'(12345|23456|34567|45678|56789|98765|87654|76543|65432|54321)', aid): s += 7
    elif re.search(r'(1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321)', aid): s += 4
    if len(aid) >= 6 and aid == aid[::-1]: s += 8
    elif len(aid) >= 4 and aid[:2] == aid[-1:-3:-1]: s += 4
    if len(aid) >= 6 and len(set(aid[::2])) == 1 and len(set(aid[1::2])) == 1: s += 6
    for sn in ['888', '999', '666', '777', '000', '123', '321', '111', '222', '333', '444', '555']:
        if sn in aid: s += 2
    if len(aid) <= 8: s += 5
    elif len(aid) <= 9: s += 3
    if s >= 20: return "LEGEND"
    if s >= 12: return "HIGH"
    if s >= 6: return "MEDIUM"
    if s >= 2: return "LOW"
    return "NORMAL"

def _reg_one(pw):
    bj = json.dumps({"app_id": 100067, "client_type": 2, "password": pw, "source": 2}, separators=(",", ":"))
    sig = hmac.new(KEY, bj.encode(), hashlib.sha256).hexdigest()
    hdrs = {"User-Agent": _ua(), "Authorization": f"Signature {sig}", "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json", "Connection": "Keep-Alive", "Host": "100067.connect.garena.com"}
    for _ in range(4):
        try:
            r = _sess().post(_RU, headers=hdrs, data=bj, timeout=10)
            if r.status_code in (403, 429): continue
            b = r.json(); d = b.get("data", b)
            uid = d.get("uid") or b.get("uid")
            if uid: return uid
        except: pass
        time.sleep(0.3)
    return None

def _batch_reg(n):
    pws = [_pw() for _ in range(n)]
    results = [None] * n
    def _do(i): results[i] = _reg_one(pws[i])
    ths = [threading.Thread(target=_do, args=(i,)) for i in range(n)]
    for t in ths: t.start()
    for t in ths: t.join()
    return [(uid, pw) for uid, pw in zip(results, pws) if uid]

def _tok(uid, pw):
    bj = json.dumps({"client_id": 100067, "client_secret": KEY.decode("ascii"), "client_type": 2,
                     "password": pw, "response_type": "token", "uid": uid}, separators=(",", ":"))
    sig = hmac.new(KEY, bj.encode(), hashlib.sha256).hexdigest()
    hdrs = {"User-Agent": _ua(), "Authorization": f"Signature {sig}", "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json", "Connection": "Keep-Alive", "Host": "100067.connect.garena.com"}
    for _ in range(3):
        try:
            r = _sess().post(_TU, headers=hdrs, data=bj, timeout=10)
            if r.status_code in (403, 429): continue
            b = r.json(); d = b.get("data", b)
            if "open_id" in d:
                oi = d["open_id"]
                at = d["access_token"]
                res = enc_oid(oi)
                fld = codecs.decode(ue(res["field_14"]), "unicode_escape").encode("latin1")
                return oi, at, fld
        except: pass
        time.sleep(0.3)
    return None, None, None

def _mreg(at, oi, fld, region):
    nm = _nm()
    lang = LANG.get(region, "en")
    if region in ("ME", "TH"):
        url = "https://loginbp.common.ggbluefox.com/MajorRegister"
        host = "loginbp.common.ggbluefox.com"
    else:
        url = "https://loginbp.ggblueshark.com/MajorRegister"
        host = "loginbp.ggblueshark.com"
    pl = pb({1: nm, 2: at, 3: oi, 5: 102000007, 6: 4, 7: 1, 13: 1, 14: fld, 15: lang, 16: 1, 17: 1})
    try:
        _sess().post(url, headers={"Accept-Encoding": "gzip", "Authorization": "Bearer", "Connection": "Keep-Alive",
                     "Content-Type": "application/x-www-form-urlencoded", "Expect": "100-continue", "Host": host,
                     "ReleaseVersion": "OB53", "User-Agent": _ua(), "X-GA": "v1 1", "X-Unity-Version": "2018.4."},
                     data=aes_bytes(pl.hex()), verify=False, timeout=10)
    except: pass
    return nm

def _mlogin(at, oi, region):
    lang = LANG.get(region, "en")
    if region in ("ME", "TH"):
        url = "https://loginbp.common.ggbluefox.com/MajorLogin"
        host = "loginbp.common.ggbluefox.com"
    else:
        url = "https://loginbp.ggblueshark.com/MajorLogin"
        host = "loginbp.ggblueshark.com"
    raw = _LP + lang.encode() + _LP2
    raw = raw.replace(_AT, at.encode()).replace(_OI, oi.encode())
    fp = bytes.fromhex(aes_hex(raw.hex()))
    hdrs = {"Accept-Encoding": "gzip", "Authorization": "Bearer", "Connection": "Keep-Alive",
            "Content-Type": "application/x-www-form-urlencoded", "Expect": "100-continue", "Host": host,
            "ReleaseVersion": "OB53", "User-Agent": _ua(), "X-GA": "v1 1", "X-Unity-Version": "2018.4.11f1"}
    for _ in range(5):
        try:
            r = _sess().post(url, headers=hdrs, data=fp, verify=False, timeout=12)
            if r.status_code == 200 and len(r.text) > 10:
                aid = decode_resp(r.text)
                if aid != "N/A": return aid
        except: pass
        time.sleep(0.5)
    return "N/A"

def _bind(at, region):
    rk = "RU" if region == "CIS" else region
    if region in ("ME", "TH"):
        url = "https://loginbp.common.ggbluefox.com/ChooseRegion"
    else:
        url = "https://loginbp.ggblueshark.com/ChooseRegion"
    pl = bytes.fromhex(aes_hex(pb({1: rk}).hex()))
    try:
        _sess().post(url, data=pl, headers={"User-Agent": _ua(), "Connection": "Keep-Alive", "Accept-Encoding": "gzip",
                     "Content-Type": "application/x-www-form-urlencoded", "Expect": "100-continue",
                     "Authorization": f"Bearer {at}", "X-Unity-Version": "2018.4.11f1", "X-GA": "v1 1",
                     "ReleaseVersion": "OB53"}, verify=False, timeout=8)
    except: pass

def _process_one(uid, pw, region):
    oi, at, fld = _tok(uid, pw)
    if not oi: return None
    nm = _mreg(at, oi, fld, region)
    aid = _mlogin(at, oi, region)
    if aid == "N/A": return None
    if region != "BR": threading.Thread(target=_bind, args=(at, region), daemon=True).start()
    return {"uid": uid, "pw": pw, "name": nm, "aid": aid}

def _stuck_reset(): globals()['_stuck_t'] = time.time()
def _stuck_loop():
    while _stuck_on:
        time.sleep(5)
        idle = time.time() - _stuck_t
        if _total > 0 and _cnt >= _total: break
        if idle >= 25: threading.Thread(target=_tor_renew, daemon=True).start(); _stuck_reset()
threading.Thread(target=_stuck_loop, daemon=True).start()
threading.Thread(target=_tor_setup, daemon=True).start()
time.sleep(5)

def worker(region):
    global _cnt
    while True:
        if _total > 0 and _cnt >= _total: return
        batch = _batch_reg(_BATCH)
        if not batch: continue
        for uid, pw in batch:
            if _total > 0 and _cnt >= _total: return
            try: res = _process_one(uid, pw, region)
            except: res = None
            if not res: continue
            if _total > 0 and _cnt >= _total: return
            aid = res["aid"]
            t = tier(aid)
            with _tslk: _ts[t] += 1
            with _cnt_lk: _cnt += 1
            _stuck_reset()
            print(f"[{datetime.now().strftime('%H:%M:%S')}] [{_cnt}] {aid} | {uid} | {pw}")

def main():
    global _total, _nw, _cnt
    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        print(render('GLITXH', colors=['white', 'red'], align='center'))
        print(f"\n{C}{B}GLITXH-VIP GENERATOR V2.5 ULTRA{W}\n")
        while True:
            region = input(f"{Y}Region (ME/IND/ID/VN/TH/BR): {W}").upper().strip()
            if region in VALID: break
            print(f"{R}Invalid region!{W}")
        while True:
            try: jml = int(input(f"{Y}Jumlah ID (0=unlimited): {W}"))
            except: continue
            if jml >= 0: _total = jml; break
        try: wk = int(input(f"{Y}Workers [{_nw}]: {W}"))
        except: wk = _nw
        if wk > 0: _nw = min(wk, 100)
        _cnt = 0
        for k in _ts: _ts[k] = 0
        print(f"\n{C}Region: {region} | Target: {'∞' if _total==0 else _total} | Workers: {_nw}{W}\n")
        try:
            with ThreadPoolExecutor(max_workers=_nw) as ex:
                futures = [ex.submit(worker, region) for _ in range(_nw)]
                for f in futures: f.result()
        except KeyboardInterrupt: print(f"\n{Y}Stopped.{W}")
        print(f"\n{G}✅ Done! {_cnt} accounts{W}")
        try: input("\nEnter to continue...")
        except: break

if __name__ == "__main__":
    main()
