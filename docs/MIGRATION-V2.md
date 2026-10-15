# Bestandsaufnahme und Erweiterungsplan

Stand: 15.10.2026. Basis: veröffentlichte Desktop-Version 0.1.1, Electron/React/Three.js.

| Bereich | Bestand | Erweiterung |
|---|---|---|
| Koordinaten | Meter, X rechts/Y hinten/Z oben | Beibehalten, freie Koordinaten und lokale Referenzmaße |
| Geometrie | Sechs Rechteckflächen | Versionierte Zonen, Polygonpunkte mit Boden-/Deckenhöhen, Öffnungen, triangulierte Boundary Surfaces |
| 3D/Kamera | Orbit, fünf Perspektiven | Gemeinsames Oberflächenmodell für CAD, Messplan und 3D; Möbel und Messpunkte |
| Quellen/Empfänger | Position, Delay, Polarität | Akustisches Zentrum, Ausrichtung, Lautsprechertyp, getrennte Hörplätze und Planpunkte |
| Materialien | Sechs Oktavbänder | Beibehalten; individuelle Flächen-/Objektwerte mit Herkunft, keine erfundenen Laborwerte |
| Moden | Analytischer Quader | Nur geometrisch nachgewiesener Quader; andere Geometrien numerische Wellenausbreitung |
| Reflexionen | Rechteck-ISM Ordnung 2 | Polygon-/Objektflächen, begrenzte Reflexionspunkte und Sichtbarkeitsprüfung |
| REW | Text/WAV, manuelle Zuordnung | Plan-/Task-Zuordnung, Zustandsführung und veraltete Geometriebezüge markieren |
| Qualität | Dokumentationsscore, zeitliche Rangfolge in Prozent | Dokumentationsquote bleibt transparent; Reflexionszuordnung qualitativ, keine Wahrscheinlichkeitsprozente |
| Projektdateien | Schema 1 | Verlustarme Migration zu Schema 2; Messdaten unverändert, Herkunft dokumentiert |
| Messplanung | Nicht vorhanden | Vier Profile, editierbare Punkte, transparente Sweep-Kombinationen, Freigabe und Ablauf |
| Berichte | JSON | Gemeinsamer Bericht, maßstäbliche SVG/PNG, CSV, JSON, druckbare PDF-Ausgabe |
| KI | Browser-Übergabe und Responses API | Strukturierte, lesende Werkzeuge; Szenarioänderungen nur als Vorschlag mit Benutzerfreigabe |
| Szenarien | Nicht vorhanden | Kopien des Ausgangszustands, identische Analyseparameter, getrennte Prognosen |

Reihenfolge: Schema/Geometrie → CAD/3D → Messplan → Import/Ablauf → allgemeine Reflexionen/Wellenmodell → Probleme/KI/Szenarien → Berichte → Referenz- und Integrationstests. Der vollständige Anforderungskatalog bleibt in MASTERPROMPT-V2.md erhalten. Nicht validierte Effekte werden nicht als gelöst ausgewiesen.

## Migrationsvertrag

Schema-1-Dateien werden beim Öffnen im Speicher ergänzt. Originaldateien werden erst nach explizitem Speichern ersetzt. Alte Quellen, Empfänger, Messwertreihen, Metadaten und Materialien bleiben erhalten. Fehlende Messplanbezüge historischer Messungen werden als ungeprüft markiert. Ein Fingerprint des Aufnahmezustands verhindert, dass Daten nach einer Geometrie- oder Positionsänderung stillschweigend als passend gelten. Unbekannte zukünftige Schemaversionen werden abgelehnt.
