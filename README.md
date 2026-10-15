# Raumakustik Digital Twin · 0.3.1

Windows-Anwendung für freie Raumgeometrien, räumliche Messplanung, direkte Sweep-Messung und nachvollziehbare Akustikanalyse. Neue Projekte starten ohne Lautsprecher, Hörplätze, Möbel und Messdaten. Alte `.raum`-Projekte bleiben lesbar; Schema 1 wird beim Öffnen zu Schema 2 migriert.

[Windows-Installer herunterladen](https://github.com/Petzi2712/Raumakustik/releases/latest) · [Release-Status](https://github.com/Petzi2712/Raumakustik/actions) · [Kompatibilität und Migration](docs/MIGRATION-V2.md)

## Arbeitsablauf

1. **Projekt & Quellen:** Leeren Raum beginnen, Lautsprecher und Hörposition hinzufügen; „Alles löschen / Neu“ setzt nach Rückfrage zurück. Projekt öffnen/speichern; Quellen, akustische Zentren, Ausrichtung, Delay und Polarität einstellen. Der akustische Solver verwendet omnidirektionale Punktquellen; die Ausrichtung ersetzt keine gemessenen Richtdaten.
2. **Raumeditor:** Wand A, B, C … mit Länge und Höhe definieren. Fenster/Türen über Breite, Elementhöhe, Brüstung und Abstand vom Wandanfang einsetzen; ungültige Maße werden abgewiesen. Bei Rechtecken passen sich gegenüberliegende Wände an. Längen freier Wände verschieben den anschließenden Eckpunkt; gemeinsame Eckhöhen beeinflussen Nachbarwände. Zusätzlich L-, U-, T-, Trapez-, Nischen-, Rund- oder Ellipsenvorlage wählen oder freie Polygonzonen zeichnen. Punkte verschieben, Wände teilen, Längen/Winkel, Boden- und Deckenhöhen bearbeiten. Kreisbögen werden mit Radius und berechnetem Mittelpunkt frequenzabhängig facettiert. Für eine neue Rundung die höchste relevante Geometriefrequenz vorab einstellen.
3. **Einrichtung:** Absorber, Bassfallen, Diffusoren und weitere parametrische Boxen mit Position, Größe, Drehung und sechs Oktav-Materialwerten. GLB/glTF/OBJ-Dateien bis 5 MB lassen sich als visuelle Objekte importieren; eingebettete Ressourcen verwenden. Importgrafiken sind zunächst akustisch inaktiv. Ihre Texturen sind keine Materialmessdaten.
4. **Messplanung:** Profil A–D, Hörplätze, Quellen, Messziel, Genauigkeit, Punktabstand, Höhen, Mikrofon, Timing und Raumzustände wählen. Vorschlag erzeugen, Punkte kontrollieren/ändern und den Plan freigeben. Standard: 9 Positionen × 2 Quellen × 1 Zustand × 1 Wiederholung = 18 Sweeps. Nur aktivierte Kombinationen zählen. Das sind Software-Startprofile, keine normativen Mindestzahlen.
5. **Direkte Messung:** Audio verbinden und tatsächliches Ein-/Ausgangsgerät und Kanal wählen. Mikrofon am Interface einpegeln, Messpunkt anklicken, Lautsprecher prüfen und Sweep starten. Die App erfasst Audio mit AudioWorklet und berechnet Impulsantwort und relative Frequenzantwort lokal; beide Datensätze werden am Messpunkt gespeichert. Freigegebene Planaufgaben werden bei passender Auswahl zugeordnet. Ein Direkt-Sweep an einem frei angelegten Punkt benötigt keinen Messplan. REW-Import bleibt unter „Vorhandene REW-/WAV-Daten importieren“ optional; dieser Import erfordert eine Planfreigabe. Qualität prüfen und Aufgabenstatus aktualisieren.
6. **Akustikanalyse:** Quelle, Empfänger und Frequenz auswählen; Direktschall und sichtbare Reflexionspfade anzeigen. Einzelne Pfade/Ordnungen filtern oder ein SVG-Schema exportieren. Analytische Moden erscheinen ausschließlich für einen nachgewiesenen, ungestörten Quader.
7. **Numerisches Wellenmodell:** Für freie Grundrisse FDTD berechnen, Feld über den Zeitregler betrachten und Ergebnis bei Bedarf im Projekt speichern. Frequenz, Dauer, Zellenzahl, Quellenpuls und Gitterfehler beachten; siehe [physikalische Grenzen](docs/PHYSICS.md).
8. **Szenarien & Berichte:** Separate Minimal-/Ausgewogen-/Maximal-Arbeitskopien anlegen. Quelle oder Materialwerte ändern und geometrische Pfade/Sabine-Schätzung bei identischen Parametern vergleichen. Es wird keine vermeintlich optimale Lösung ohne Datengrundlage vorausgefüllt.
9. **KI & Updates:** Bericht manuell an ChatGPT übergeben oder die separat abgerechnete OpenAI-API verwenden. Nach Updates suchen, herunterladen und nach dem Speichern installieren.

Die obere Menüleiste bleibt fest. Sidebar und Arbeitsfläche scrollen unabhängig mit **Strg + Mausrad**; Scrollleisten und Tastatur funktionieren ebenfalls. Im 2D-/3D-Modell lassen sich Lautsprecher, Hörpositionen und Messpunkte ziehen. Die Kamera bleibt beim Konfigurieren und beim Wechsel zwischen Projekt/Analyse erhalten. Das Verschieben gemessener Positionen erfordert Bestätigung; historische Aufnahmeorte bleiben unverändert.

## Steinberg UR22MKII und interne Audiomessung

Unter Windows den Yamaha Steinberg USB-Treiber installieren. In „Direkte Messung“ zunächst „Audio verbinden / Geräte laden“ klicken. Zum Wechsel des Geräts Audio trennen, UR22MKII als Eingang/Ausgang auswählen und erneut verbinden. Mikrofoneingang 1/2 und Lautsprecherausgang 1/2 separat wählen. Der im Modell ausgewählte Lautsprecher muss dem angeschlossenen Ausgang entsprechen. Tatsächlich bereitgestellte Sample-Rate und Kanalzahl werden angezeigt.

Die App nutzt Windows-Audio über Chromium; sie liefert keinen nativen ASIO-Treiber. Zweikanalaufnahme und Audioausgangswahl hängen vom Treiber ab. Gain/Phantomspeisung bleiben am Interface einzustellen. Direkte Mikrofonrückführung und Loopback-Funktion des Treibers für die Raumaufnahme ausschalten; MIX-Regler Richtung DAW. Ausgabe startet nur per Klick, zunächst bei −30 dBFS. Der reale Schallpegel hängt von der Wiedergabekette ab.

Die Live-Ansicht zeigt Peak/RMS in dBFS und das Eingangsspektrum. Ein optionaler SPL-Referenzabgleich erfordert einen echten Pegelkalibrator mit bekanntem Pegel; Gain und Kanal müssen danach unverändert bleiben. Das ist keine Mikrofon-Frequenzgangkorrektur. Die gespeicherte Sweep-Frequenzantwort zeigt die digitale Übertragungsverstärkung in dB, keinen SPL-Frequenzgang. Ohne Loopback bleibt Geräte-Latenz in Laufzeit und Phase. Diese Version bietet noch keine Loopback-Timingkorrektur oder Mikrofon-Kalibrierdateien.

Die lokale Spektrumanzeige aktualisiert sich während der Mikrofonaufnahme. „Aktuellen Messstand mit ChatGPT analysieren“ öffnet die vorhandene KI-Integration für die gespeicherten Daten; es gibt keinen automatischen Versand von Live-Audio und keine automatische kostenpflichtige Dauerauswertung. Kalibrierung, Sweep-Einstellungen, Geräte-/Kanaldaten, ursprüngliche Aufnahmeposition und Übersteuerungsmerkmale werden mit der Messung dokumentiert.

## Freie Geometrie und Öffnungen

Ein Projekt enthält metrische Polygonzonen mit Punkt- und Wand-IDs. Jeder Punkt besitzt eine Boden- und Deckenhöhe. Dieselben triangulierten Flächen bilden 2D-Plan, 3D-Modell, Volumen und Reflexionsgeometrie. Selbstschnitte, entartete Polygone, widersprüchliche Höhen, Zonenüberschneidungen, ungeeignete Messpunkte und Boxkollisionen werden geprüft.

Ein offener Wanddurchgang wird aus den reflektierenden Wandteilen ausgeschnitten. Gekoppelte Zonen benötigen auf beiden gemeinsamen Wänden deckungsgleiche Öffnungen. Gepaarte Öffnungen verbinden die Luftvolumina auch im FDTD-Raster; ungepaarte Öffnungen sind Außenränder. Für diese Außenränder gibt es noch keine validierte abstrahlende FDTD-Randbedingung, daher wird eine geschlossene-Raum-Simulation dort abgelehnt.

Ein frei importiertes 3D-Netz ersetzt noch keine validierte Raumhülle. Beliebige Decken-/Bodenöffnungen, gestapelte Ebenen mit Treppenlöchern und allgemeine Volumen-Boolean-Operationen sind nicht fertig umgesetzt.

## Messdaten und wissenschaftliche Kennzeichnung

- **MEASURED:** direkt aufgenommene oder importierte Messdaten und daraus abgeleitete Kennwerte.
- **SIMULATED:** numerisches/geometrisches Modell mit dokumentierten Annahmen.
- **INFERRED:** zu prüfende Ursache oder Hypothese.

Der Dokumentationsscore ist die nachvollziehbare Quote dokumentierter Prüfmerkmale. Er ist keine Messunsicherheit oder Erfolgswahrscheinlichkeit. Reflexionskandidaten erhalten Zeitfehler und qualitative Konsistenzangaben. Mehrpunktabgleiche erfordern passende Aufnahmezustände und dokumentierte Timing-Referenzen; daraus folgt keine eindeutige Einfallsrichtung.

Nach Raum-, Möbel-, Quell- oder Empfängeränderungen werden historische Messungen als geometrisch veraltet markiert. Ursprüngliche Messreihen werden nicht durch Simulationen überschrieben. Alte Projekte ohne Messplan bleiben als ungeprüfte Bestandsdaten lesbar.

Unterstützte Dateien: REW-Text-Frequenzgang mit optionaler Phase, Text-IR in Sekunden/Millisekunden und Mono-WAV-IR (PCM 16/24/32, Float 32/64). IR-Auswertung: breitbandiges EDT/T20/T30 mit Fit-Prüfung, C50/C80/D50, Schwerpunktzeit, SNR-Indiz, ETC-Peaks, Group Delay und Hann-STFT-Spektrogramm/Waterfall. Keine automatische Timing-Korrektur, kein MDAT-Parser und kein normativ validiertes bandweises RT60.

## Exporte

Messplan: maßstäbliches SVG, PNG, CSV-Punktliste, JSON und PDF. Der Windows-Desktop erzeugt PDFs direkt. Im Entwicklungsbrowser wird stattdessen druckbares HTML heruntergeladen. Druckmaßstab nur bei 100 % Druckgröße verwenden.

Analysebericht: PDF mit Raumplan, Messaufbau, Diagrammen, Reflexionsschemata, Kennwerten, Problemen, Szenariobeschreibungen und Eingangsparametern. JSON enthält maschinenlesbare Ergebnisse; die Raumhülle lässt sich als OBJ exportieren. Physikalisch nicht berechnete Vorher-/Nachher-Frequenzgänge oder Materialwirkungen werden nicht erfunden.

## ChatGPT / OpenAI

**ChatGPT-Konto:** „Bericht kopieren & ChatGPT öffnen“ öffnet `https://chatgpt.com/`. Anmelden, Bericht einfügen und absenden. Das ist eine manuelle Übergabe, keine OAuth-Anbindung des Abonnements.

**Direkte Integration:** API-Schlüssel im Programm eingeben. Die OpenAI-API wird getrennt vom ChatGPT-Abo abgerechnet. Schlüssel nur für die Sitzung oder unter Windows mit safeStorage/DPAPI speichern; Schlüssel niemals in Projektdateien eintragen. Das Modell ist einstellbar und benötigt entsprechenden API-Zugriff.

Die Responses API kann definierte lokale Werkzeuge für Geometrie, Messplan, Messkennwerte, Moden, Reflexionen, Probleme und Szenariovorschläge aufrufen. Keine Roh-WAV-Übertragung. Gesendet werden Bericht und gezielte reduzierte Werkzeugausgaben einschließlich Projektnamen und Notizen. `store:false`, maximal vier Werkzeugrunden und zwölf Aufrufe pro Anfrage. Umfangreiche Berichte weisen ausgelassene Aufgaben/Messungen aus; Werkzeugausgaben sind zusätzlich begrenzt. Die API führt keine beliebigen Programme oder Dateischreibzugriffe aus. Änderungen werden als Vorschlag angezeigt und erst durch „Vorschlag als separates Szenario übernehmen“ in das Projekt übernommen.

Materialwerte für KI-Behandlungsvorschläge müssen mit ihrer angegebenen Herkunft bereits im Nutzerprojekt dokumentiert sein. Die Materialklassenbibliothek enthält bewusst keine erfundenen Labor-/Herstellerkoeffizienten.

## Installation, Updates und Validierung

Windows 10/11 x64. Installer: `Raumakustik-0.3.1-x64-Setup.exe`. Installation pro Benutzer mit wählbarem Ordner. Das Programm bleibt **unsigniert**; SmartScreen kann warnen. Eine vertrauenswürdige Herausgebersignatur ist noch einzurichten.

GitHub Releases liefern Installer, Blockmap und `latest.yml`. Der Updater lädt auf ausdrücklichen Klick; vor dem Neustart Projekte speichern. Die Veröffentlichungspipeline und Downloadintegrität werden geprüft. Native Installation/Deinstallation, DPAPI und ein tatsächliches Upgrade auf einem Windows-PC sind weiterhin separat zu validieren.

Siehe [Verifikation 0.3](docs/VERIFICATION-V3.md), [bisherige Verifikation](docs/VERIFICATION-V2.md), [physikalisches Modell](docs/PHYSICS.md) und [Abdeckung/offene V2-Anforderungen](docs/ROADMAP.md). **Der vollständige wissenschaftliche Abnahmekatalog des Masterprompts V2 ist mit dieser Version noch nicht erfüllt.**

## Entwicklung

Node.js 24. Vorhandenen Checkout verwenden.

```sh
npm ci
npm run check
npm run dev
npm run test:ui                      # laufenden Vite-Server vorausgesetzt
bash scripts/with-display.sh npm run test:desktop
npm run dist:win
```

Der Linux-Crossbuild benötigt dank eigenem NSIS-Skript kein Wine. [Cloud-Anleitung](docs/CLOUD.md). Der [GitHub-Workflow](.github/workflows/windows-release.yml) testet und baut unter Windows; passende `v*`-Tags veröffentlichen die Artefakte. `npm run dist:win` veröffentlicht selbst nichts.

Zusätzliche Integrationstests: `npm run test:editor`, `npm run test:audio` (Linux mit Xvfb) und `npm run test:desktop`. Der Audiotest nutzt ausschließlich ein künstliches Chromium-Mikrofon.
