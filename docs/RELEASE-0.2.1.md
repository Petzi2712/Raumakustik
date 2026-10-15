## Raumakustik Digital Twin 0.2.1

Korrektur gegenüber 0.2.0: Gespeicherte Wellensimulationen enthalten jetzt den tatsächlichen Geometrie-Fingerprint; die Versionsanzeige wird aus dem Paketmanifest abgeleitet.

Erweiterung der bestehenden Windows-Anwendung auf Grundlage des Masterprompts V2:

- Freier Polygoneditor mit L/U/T-, Rund-/Ellipsen-, Nischen- und Dachschrägenvorlagen, Kreisbögen, Höhen, Zonen und offenen Wanddurchgängen.
- Parametrische Möbel/Absorber, Boxabschattung und visuelle GLB/glTF/OBJ-Importe.
- Vier Messplanprofile, editierbare 3D-Mikrofonpunkte, echte Referenzmaße, genaue Sweep-Zählung, Freigabe und Aufgabenstatus.
- REW-Dateiimport mit Plan-/Task-Bezug und Kennzeichnung veralteter Aufnahmegeometrie.
- Allgemeine geometrische Reflexionen mit Sichtbarkeit, qualitative Mehrpunktkonsistenz, begrenztes 3D-FDTD-Wellenmodell und zeitliches Druckfeld.
- IR-Spektrogramm/Waterfall, getrennte Szenarien, PDF-/SVG-/PNG-/CSV-/JSON-Exporte und OBJ-Raumexport.
- Lokale KI-Berechnungswerkzeuge; Änderungen ausschließlich als freizugebende Szenarien. ChatGPT-Browserübergabe bleibt manuell; direkte API-Nutzung wird separat abgerechnet.
- Verlustarme Migration vorhandener Schema-1-Projekte. Vor dem Speichern unter neuer Version eine Kopie des alten Projekts aufbewahren; ältere Anwendungen lesen Schema 2 nicht.

### Modellgrenzen

Das FDTD-Modell besitzt starre verlustlose Wände und begrenzte Raster. Kein vollständig validierter Breitband-Hybridsolver, keine gemessenen Materialdaten aus KI-Erfindung, keine automatische verlässliche Resonator-/Absorberdimensionierung. Ein vollständiger normativer oder praktischer Abnahmenachweis des Masterprompts V2 liegt noch nicht vor. Umfang und offene Anforderungen: [README](https://github.com/Petzi2712/Raumakustik/blob/main/README.md) und [Roadmap](https://github.com/Petzi2712/Raumakustik/blob/main/docs/ROADMAP.md).

Installer weiterhin **unsigniert**. Native Installation, Windows-DPAPI und ein tatsächliches Upgrade auf einem Windows-PC sind noch separat zu prüfen. Projekte vor einem Update speichern. `latest.yml` und Blockmap sind für den integrierten Updater bestimmt; `SHA256SUMS.txt` enthält Download-Prüfsummen.
