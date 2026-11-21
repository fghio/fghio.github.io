#!/usr/bin/env python3
"""Cifra il progetto "Personal Finance Spreadsheet" per pubblicarlo protetto da password.

Le pagine e le immagini IN CHIARO stanno in private/spreadsheet/ (cartella esclusa
da Git, solo su questo computer):

    private/spreadsheet/spreadsheet.html            indice del progetto
    private/spreadsheet/spreadsheetPosts/*.html     i post
    private/spreadsheet/images/*                    le immagini

Lo script scrive le versioni cifrate (AES-256-GCM, chiave ricavata dalla password
con PBKDF2-SHA256) che vengono pubblicate al posto degli originali:

    posts/projects/spreadsheet.enc
    posts/projects/spreadsheetPosts/<post>.enc
    assets/images/spreadsheet/<immagine>.enc        solo quelle usate nelle pagine
    assets/data/pf-lock.json                        sale, iterazioni, verifica

Il browser le decifra con assets/js/pflock.js dopo che l'utente ha inserito la
password. Ogni esecuzione usa un sale nuovo: tutti i file vengono rigenerati.

Uso (dalla cartella del sito):
    python3 tools/pf_encrypt.py            # chiede la password (due volte)
    PF_PASSWORD=... python3 tools/pf_encrypt.py
"""
import base64
import getpass
import json
import os
import re
import sys

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "private", "spreadsheet")
OUT_PAGES = os.path.join(ROOT, "posts", "projects")
OUT_IMAGES = os.path.join(ROOT, "assets", "images", "spreadsheet")
META = os.path.join(ROOT, "assets", "data", "pf-lock.json")
ITERATIONS = 600_000
CHECK = b"fgh.io:pf:ok"
IMG_REF = re.compile(r"images/spreadsheet/([^\"' )?#]+)")


def password():
    pw = os.environ.get("PF_PASSWORD")
    if pw:
        return pw
    pw = getpass.getpass("Password: ")
    if len(pw) < 8:
        sys.exit("La password deve avere almeno 8 caratteri.")
    if getpass.getpass("Ripeti la password: ") != pw:
        sys.exit("Le password non coincidono.")
    return pw


def seal(aes, data):
    iv = os.urandom(12)
    return iv + aes.encrypt(iv, data, None)


def write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)


def main():
    if not os.path.isdir(SRC):
        sys.exit(f"Cartella in chiaro non trovata: {SRC}")
    pw = password()
    salt = os.urandom(16)
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt,
                     iterations=ITERATIONS).derive(pw.encode("utf-8"))
    aes = AESGCM(key)

    pages = [("spreadsheet.html", os.path.join(OUT_PAGES, "spreadsheet.enc"))]
    post_dir = os.path.join(SRC, "spreadsheetPosts")
    for name in sorted(os.listdir(post_dir)):
        if name.endswith(".html"):
            pages.append((os.path.join("spreadsheetPosts", name),
                          os.path.join(OUT_PAGES, "spreadsheetPosts", name[:-5] + ".enc")))

    used = set()
    for rel, out in pages:
        html = open(os.path.join(SRC, rel), "rb").read()
        used |= set(IMG_REF.findall(html.decode("utf-8", "replace")))
        write(out, seal(aes, html))

    missing = sorted(i for i in used if not os.path.isfile(os.path.join(SRC, "images", i)))
    if missing:
        print("ATTENZIONE, immagini citate ma assenti:", ", ".join(missing))
    for img in sorted(used - set(missing)):
        data = open(os.path.join(SRC, "images", img), "rb").read()
        write(os.path.join(OUT_IMAGES, img + ".enc"), seal(aes, data))

    # elimina i file cifrati rimasti da pagine/immagini non più presenti
    keep = {os.path.abspath(o) for _, o in pages}
    keep |= {os.path.abspath(os.path.join(OUT_IMAGES, i + ".enc")) for i in used}
    for d in (OUT_PAGES, os.path.join(OUT_PAGES, "spreadsheetPosts"), OUT_IMAGES):
        for name in os.listdir(d) if os.path.isdir(d) else []:
            p = os.path.abspath(os.path.join(d, name))
            if name.endswith(".enc") and p not in keep:
                os.remove(p)

    meta = {"v": 1, "kdf": "PBKDF2-SHA256", "iterations": ITERATIONS,
            "salt": base64.b64encode(salt).decode(),
            "check": base64.b64encode(seal(aes, CHECK)).decode()}
    os.makedirs(os.path.dirname(META), exist_ok=True)
    json.dump(meta, open(META, "w"), indent=2)
    print(f"Cifrate {len(pages)} pagine e {len(used) - len(missing)} immagini.")


if __name__ == "__main__":
    main()
