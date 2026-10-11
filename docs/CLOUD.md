# Cloud-Entwicklung

Vorhandener Checkout `/workspace/Raumakustik`, Node 24 und npm. Kein zusätzlicher Worktree. Anwendungscode, Manifest und Lockfile bei reinen Setup-Aufgaben nicht ändern.

## Installation

```sh
bash scripts/setup-cloud.sh
```

Der Skriptpfad ist auf diese Debian-13-Cloud-Umgebung zugeschnitten: npm- und Electron-Cache liegen unter `/workspace/.cache` bzw. `/workspace/.npm-cache`. Electron-Downloads verwenden den vorhandenen HTTPS-Proxy. TLS-, SHA- und APT-Signaturprüfungen bleiben aktiv. Xvfb wird bei Bedarf ohne Rootrechte aus signierten Debian-Paketindizes heruntergeladen und unter `/workspace/.tools/display` entpackt. Diese Cloud stellt die übrigen GTK/X11/Chromium-Voraussetzungen bereits bereit.

## Start und Prüfung

```sh
npm run dev -- --port 5173 --strictPort
# in einer zweiten Shell:
npm run test:ui
bash scripts/with-display.sh npm run test:desktop
```

Vite dient nur der Oberflächenentwicklung. Electron lädt beim Desktop-Test den vorher erstellten Produktionsbuild direkt über `file://`; es braucht keinen Vite-Server. Der Desktop-Test isoliert sein Benutzerprofil in einem temporären Verzeichnis, simuliert die kostenpflichtige API und den externen Browserstart, und prüft REW mit einem lokalen HTTP-Testserver. Er sendet keine echten Messdaten und verwendet keinen echten API-Schlüssel.

## Windows-Crossbuild

```sh
npm run check
XDG_CACHE_HOME=/workspace/.cache \
ELECTRON_BUILDER_CACHE=/workspace/.cache/electron-builder \
npx electron-builder --win nsis --x64 --publish never \
  --config.electronDownload.cache=/workspace/.cache/electron
```

Der eigene NSIS-Installer generiert seinen Uninstaller bei der tatsächlichen Windows-Installation. Der Crossbuild benötigt somit kein Wine. `after-pack.cjs` erzeugt eine genaue Dateiliste zur Deinstallation; unbekannte Benutzerdateien und das Profil werden nicht gelöscht. Diese Liste liegt in `build/app-files.nsh` und ist ignoriert. Konfiguriert sind eine Installation pro Benutzer, Startmenü- und Desktopverknüpfung, ein frei wählbarer Ordner und Wiederverwendung des vorhandenen Installationspfades bei Updates. Der Updater prüft die SHA-512-Daten aus `latest.yml`.

Nicht für die lokale Entwicklung erforderlich: OpenAI-Key, REW-Prozess, GitHub-Push-Rechte oder Release. Für reale API-Analysen bzw. REW-API-Verbindung werden diese jeweils separat benötigt. Prozesse sind nicht Bestandteil eines Umgebungssnapshots; Vite nach Bedarf neu starten.
