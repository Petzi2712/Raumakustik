# Validierung der Version 0.1.0

Durchgeführt am 11.10.2026 in dieser Linux-Cloud-Instanz.

| Prüfung | Ergebnis |
|---|---|
| Reproduzierbare Installation `scripts/setup-cloud.sh` | Erfolgreich; `npm ci`; Lockfile-SHA-256 vor/nach identisch |
| Numerische und Import-Referenztests | 18 ausgeführt, 18 bestanden, 0 übersprungen |
| Vite-Produktionsbuild | Erfolgreich; Hinweis zur Größe des Three.js/React-Bundles, kein Buildfehler |
| Browser-Bedienung | Erfolgreich: 3D/WebGL, Eingabegrenzen, Modenfeld, Laufzeitanimation, FR-/IR-Import, Zuordnung, Speichern, Berichtexport; keine JS-Fehler |
| Electron über file:// | Erfolgreich: isolierter Preload/IPC, Projekt laden/speichern, Clipboard-/Browser-Handoff, lokale REW-HTTP-Fixture, API-Anfragevertrag/Antwort mit simuliertem Transport, Schlüssel löschen, Updateprüfung im Entwicklungsmodus korrekt abgewiesen |
| Virtuelle Anzeige / Wiederstart | `with-display.sh` ohne vorhandenes DISPLAY erfolgreich; eigener Xvfb-Prozess beendet |
| Windows-NSIS-Crossbuild | Erfolgreich, ohne Wine; 117101417 Bytes; 32-Bit-Installerbootstrap mit 64-Bit-Windows-10-Anwendung |
| Updateartefakte | `latest.yml` und Blockmap erzeugt; SHA-512 und Dateigröße stimmen mit dem Installer überein |
| Packungsinhalt | Electron-Hauptprozess in app.asar stimmt bytegenau mit dem getesteten Quellcode überein |
| Laufzeitabhängigkeiten | `npm audit --omit=dev`: 0 gemeldete Sicherheitslücken |

Die vollständige npm-Prüfung meldet acht moderate transitive Befunde im Build-Werkzeug aus der sprintf-js/roarr/global-agent-Abhängigkeitskette. Das betrifft nicht die mitgelieferten Laufzeitabhängigkeiten; es wurde kein Integritäts- oder TLS-Check abgeschaltet und kein unsicherer Downgrade vorgenommen. Ein passender Upstream-Fix ist für die Build-Toolchain einzuplanen.

Die UI-Tests verwenden reproduzierbare synthetische Daten. Sie bestätigen keine Übereinstimmung mit einer realen Raumvermessung. Ein echtes REW wurde nicht gestartet; die optionale API-Übersicht wurde mit einer lokalen Fixture geprüft. Der OpenAI-Transport wurde simuliert: keine kostenpflichtige Anfrage, kein echter Nutzer-Key und keine Aussage über Modellzugriff oder API-Guthaben.

Noch nicht geprüft: native Installation/Deinstallation unter Windows, Windows-DPAPI, SmartScreen/Signaturvertrauen, echte REW-API und ein Upgrade zwischen zwei veröffentlichten Versionen. Installer und Anwendung sind unsigniert. Es wurde weder in GitHub gepusht noch ein Release oder Umgebungssnapshot veröffentlicht. Die vorbereitete Workflow-Datei beschreibt die spätere Veröffentlichung.

Der vollständige wissenschaftliche Umfang des Masterprompts ist noch nicht umgesetzt; siehe ROADMAP.md und PHYSICS.md.
