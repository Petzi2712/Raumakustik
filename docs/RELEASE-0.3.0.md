# Raumakustik 0.3.0

Neue Projekte starten mit einem leeren Raum: keine Lautsprecher, Hörplätze, Möbel oder Messdaten. „Alles löschen / Neu“ beginnt nach Rückfrage von vorn. Bestehende Projektdateien bleiben lesbar; ein Beispielprojekt lässt sich ausdrücklich laden.

- Wandkarten A, B, C … mit Länge und Höhe; Fenster/Türen über Breite, Höhe, Brüstung und Wandabstand. Widersprüchliche Maße werden abgewiesen. Geschlossene Elemente haben eine eigene Teilfläche und editierbare Absorption; Ausgangsmaterialwerte sind ungeprüfte Schätzungen.
- Lautsprecher, Hörpositionen und Messpunkte per Drag-and-drop im Grundriss und im 3D-Modell. Gemessene Positionen verlangen eine Bestätigung vor dem Verschieben. Historische Aufnahmeorte bleiben gespeichert; Messungen werden als veraltet markiert.
- Kamera bleibt bei Konfigurationsänderungen und beim Wechsel zwischen Projekt/Analyse erhalten. Feste obere Menüleiste, unabhängig scrollbare Sidebar und Arbeitsfläche. Scrollen/Zoomen im Arbeitsbereich in allen Untermenüs mit **Strg + Mausrad**; Scrollleisten und Tastatur bleiben verfügbar.
- Absorber, Bassfallen, Diffusoren und weitere Akustikelemente als parametrisierbare Boxen, einschließlich editierbarer Streuwerte. Analytische Quader-Moden als einblendbare Druckfelder; numerische Wellenfelder für freie Geometrien mit den bisherigen Modellgrenzen.
- **Direkte Messung ohne REW:** Geräte-/Kanalwahl, AudioWorklet-Aufnahme, logarithmischer Sweep, lokale Dekonvolution, automatisch am ausgewählten Messpunkt gespeicherte IR und relative Frequenzantwort. Freigegebene Planaufgaben können direkt zugeordnet werden. REW-/WAV-Import bleibt optional verfügbar.
- Mikrofon-Pegelanzeige in dBFS, Clipping-Erkennung und Echtzeit-Eingangsspektrum. Optionaler SPL-Referenzabgleich mit tatsächlich vorhandenem Pegelkalibrator. Analoger Mikrofon-Gain bleibt am Interface einzustellen.
- **Steinberg UR22MKII:** Ein-/Ausgänge 1/2 über die vom Yamaha Steinberg USB-Treiber in Windows bereitgestellten Audiogeräte auswählen. Kein nativer ASIO-Treiber. Ob echte Zweikanalaufnahme verfügbar ist, hängt vom Windows-Treiber ab; die bereitgestellte Kanalzahl wird angezeigt.
- Aktueller Messstand jederzeit manuell an ChatGPT übergeben oder mit separatem OpenAI-API-Schlüssel im Programm auswerten. Kein automatischer Versand des Live-Mikrofonsignals, keine automatische kostenpflichtige Dauerauswertung.

## Messgrenzen und Prüfung

Sweep-Ausgabe startet nur per Klick, zunächst −30 dBFS. Kein Mikrofon-Monitoring zurück zum Ausgang. Sweep-Dekonvolution wird mit synthetisch bekannten Laufzeiten, Reflexionen und Übertragungsfunktionen geprüft. Laufzeit/Phase enthalten ohne Loopback die unbekannte Geräte-Latenz. Kein Mikrofon-Frequenzkorrekturprofil, keine native ASIO-Unterstützung, keine automatische analoge Gain-Regelung. Relative Übertragungspegel sind kein kalibrierter SPL-Frequenzgang. SPL-Abgleich benötigt einen echten Kalibrator und unveränderte Verstärkung.

Validiert: 52 Fachtests; Browser-Bedienung einschließlich Kamerabeibehaltung, Strg-Scrollen und 2D/3D-Drag; produktive Electron-Oberfläche einschließlich Audioaufnahme mit künstlichem Chromium-Mikrofon, Sweep-Verarbeitung, Messpunktzuordnung und Verschiebewarnung. Das prüft den Programmablauf, keine reale akustische Messkette.

Physischer UR22MKII-Hardwaretest, reale Raum-Messgenauigkeit und manuelle Windows-Installation stehen aus. Installer weiterhin unsigniert; Windows SmartScreen kann warnen. Vollständige wissenschaftliche Normabnahme bleibt außerhalb dieser Version.
