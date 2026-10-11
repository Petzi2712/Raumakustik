# Raumakustik Digital Twin

Installierbarer lokaler Akustik-Arbeitsplatz für Windows 10/11 x64. Version **0.1.1** ist eine funktionsfähige erste Ausbaustufe des [Masterprompts](docs/MASTERPROMPT.txt), kein vollständiger wissenschaftlicher Hybrid-Solver.

## Installieren und benutzen

1. Den Windows-Installer unter [GitHub Releases](https://github.com/Petzi2712/Raumakustik/releases) herunterladen und `Raumakustik-0.1.1-x64-Setup.exe` ausführen. Falls dort noch kein Download erscheint, den Status unter [Actions](https://github.com/Petzi2712/Raumakustik/actions) prüfen: Der Build eines Versions-Tags erstellt und veröffentlicht die Installationsdateien. Die Installation erfolgt standardmäßig für das eigene Windows-Benutzerkonto; der Zielordner ist wählbar.
2. Raumabmessungen, Quellen, Empfänger und Materialwerte einstellen. Enter oder Verlassen des Zahlenfeldes übernimmt die Eingabe. Ursprung: vorn links am Boden; **X** nach rechts, **Y** zur Rückwand, **Z** nach oben; Meter.
3. Unter **REW-Messungen** einen Frequenzgang als Text oder eine Mono-Impulsantwort als WAV/Text importieren. Messung einer Quelle und einem Empfänger zuordnen; Kalibrierung und Timing dokumentieren.
4. **Akustikanalyse** zeigt Moden und Reflexionspfade. Gemessene IR und Abklingkurven erscheinen im Messungsbereich. Für Reflexionskandidaten denselben Quell-/Empfängerweg in der Analyse auswählen.
5. Projekt als `.raum` speichern. Das offene JSON-Format enthält Geometrie, Materialien, Messwerte und Metadaten. Keine API-Schlüssel im Projekt.

Der Installer ist derzeit **nicht mit einem Herausgeberzertifikat signiert**. Windows kann deshalb eine SmartScreen-Meldung anzeigen. Für eine öffentliche Produktveröffentlichung ist eine vertrauenswürdige Codesignatur einzuplanen; Sicherheitsfunktionen müssen dafür nicht abgeschaltet werden.

## Vorhandene Funktionen

- Freie 3D-Kamera, Hörerperspektive, Drauf-/Vorder-/Seitenansicht, Quellen und Messpunkte, normiertes modales Druckfeld und geometrisch korrekte Laufzeitmarker.
- Rechteckraum-Moden bis 200 Hz: axial, tangential, oblique; Positionskopplung.
- Image Source Method bis Reflexionsordnung 2, Reflexionspunkte, Weg-/Laufzeitdifferenzen, Einfallswinkel, frequenzabhängiger relativer Pegel und idealisierte SBIR-Nullstellen.
- Absorption, Streuung und Transmission in sechs Oktavbändern; Sabine-Nachhallschätzung und Schroeder-Frequenz.
- REW-Text-Frequenzgang mit optionaler Phase, Text-IR in Sekunden/Millisekunden, Mono-WAV-IR (PCM 16/24/32 und Float 32/64 Bit).
- Breitbandige Schroeder-Integration, EDT/T20/T30 mit Fit-Prüfung, C50/C80/D50, Schwerpunktzeit im Bericht, SNR-Indiz, Phasenableitung für Group Delay.
- Dokumentationsscore für Messdaten, mehrdeutige Reflexionskandidaten anhand relativer Laufzeit; klare Unterscheidung Measured / Calculated / Inferred.
- Offene Projektdateien und Analysebericht-Export.
- ChatGPT-Übergabe im Browser sowie direkte OpenAI-API-Anbindung; manuelle Updateprüfung, Download und Installation.

Die lokale REW API wird optional für `GET http://127.0.0.1:4735/measurements` unterstützt. REW muss separat installiert und seine API aktiviert sein. Der vollständige API-Import von FR, IR, Timing, RT60 und Filtern ist noch nicht umgesetzt. REW-Dateiexporte sind der getestete Importweg. Kein nativer MDAT-Parser.

## ChatGPT und OpenAI

**ChatGPT-Konto:** „Bericht kopieren & ChatGPT öffnen“ kopiert den Bericht und öffnet `https://chatgpt.com/`. Dort anmelden, einfügen und absenden. Dies ist eine manuelle Übergabe, keine OAuth-Verbindung und kein automatischer Zugriff auf das ChatGPT-Abonnement.

**Direkt im Programm:** OpenAI-API-Schlüssel unter „KI & Updates“ eingeben. API-Abrechnung und ChatGPT-Abonnement sind getrennt. Ein Modell wählen, auf das der API-Account Zugriff hat (Voreinstellung `gpt-4.1`; Modellname editierbar). Schlüssel entweder nur für die Sitzung oder unter Windows per Electron safeStorage/DPAPI verschlüsselt speichern. Schlüssel löschen ist jederzeit möglich.

Nur bei „Bericht an OpenAI senden“ wird die API aufgerufen. Gesendet werden Raumgeometrie, Positionen, Materialwerte, Projektnamen, Messnotizen, berechnete Ergebnisse und reduzierte Frequenzgangdaten; keine Roh-WAV-Datei. `store:false` ist gesetzt, weitere API-Aufbewahrungsregeln bestimmt OpenAI. Die Antwort wird als **Hypothese** gekennzeichnet. KI interpretiert Ergebnisse; physikalische Berechnungen erfolgen lokal. FEM/FDTD-Rechenleistung lässt sich nicht durch Anmeldung bei ChatGPT ersetzen.

## Entwicklung

Node.js **24**, npm, vorhandenen Checkout verwenden. Keine zusätzlichen Worktrees nötig.

```sh
npm ci
npm test
npm run dev       # Oberfläche im Browser; Desktop-Integrationen dort deaktiviert
npm run desktop   # Produktionsoberfläche in Electron
npm run dist:win  # Windows x64 NSIS-Installer, lokale Artefakte; veröffentlicht nichts
```

Unter Windows reicht Node/npm für den Build. Der Linux-Crossbuild verwendet einen eigenen NSIS-Installer und benötigt kein Wine; Desktop-Tests benötigen eine Anzeige (z. B. Xvfb). Die Cloud-spezifischen Details stehen in [docs/CLOUD.md](docs/CLOUD.md).

Ein laufender Vite-Server wird für den Browser-Smoke-Test benötigt:

```sh
npm run test:ui
```

Der Test verwendet standardmäßig `/usr/bin/chromium` (mit `CHROMIUM_PATH` überschreibbar). `SMOKE_URL` überschreibt das lokale Testziel. Testartefakte sind in `docs/oberflaeche.png` sichtbar. Die Unit-Tests sind deterministisch und benötigen keine API-Schlüssel.

## Updates veröffentlichen

Die Updatequelle ist `Petzi2712/Raumakustik` auf GitHub. Solange dort kein öffentlich zugängliches Release mit `latest.yml`, NSIS-Installer und Blockmap vorliegt, funktioniert kein tatsächliches Update. Eine private GitHub-Quelle braucht ein separates Distributionskonzept; kein GitHub-Token wird in den Installer eingebettet.

[windows-release.yml](.github/workflows/windows-release.yml) baut auf Windows bei PRs und Pushes; auf einem Versions-Tag veröffentlicht es die Updateartefakte. Das Versions-Tag muss zu `package.json` passen. Beispiel für eine **spätere**, bewusst vom Eigentümer ausgeführte Veröffentlichung:

```sh
npm version patch --no-git-tag-version
# Änderungen überprüfen, committen und in das GitHub-Repository pushen
# dann das zur Paketversion passende Tag erstellen und pushen, z. B. v0.1.1
```

Ein Download und die Updatequelle stehen erst nach erfolgreichem Abschluss des Release-Workflows bereit. Im Programm: nach Updates suchen → herunterladen → Projekt speichern → installieren und neu starten. Live-End-to-End-Updates brauchen mindestens zwei veröffentlichte Versionen auf Windows. Bei einer Versionsänderung bleiben die lokalen Projektdateien und Einstellungen erhalten.

## Physikalische Grenzen

Siehe [docs/PHYSICS.md](docs/PHYSICS.md) für Gleichungen und [docs/ROADMAP.md](docs/ROADMAP.md) für offene Anforderungen. Keine Aussage über Normkonformität, absolute SPL, kalibrierte Materialparameter oder räumlich eindeutig nachgewiesene Reflexionsquellen. Keine erfundenen Messdaten und keine großen EQ-Boosts gegen destruktive Auslöschungen.
