# Abdeckung des Masterprompts V2

Version 0.2.0 ist eine funktionale Erweiterung des vorhandenen Programms. Sie ist **keine vollständige Erfüllung** des wissenschaftlichen Abnahmekatalogs.

| Anforderung | Stand |
|---|---|
| Bestandsaufnahme / Migration | Umgesetzt; Schema 1 bleibt lesbar, Originalmesswerte erhalten |
| Freie Grundrisse | L/U/T, Trapez, Nischen, Polygone, facettierte Kreise/Ellipsen/Bögen; gemeinsames 2D/3D-Modell |
| Höhen / Zonen | Punktweise Boden-/Deckenhöhen, Dachschrägen, disjunkte Zonen, gepaarte Wandportale |
| Vollständiges Raum-CAD | Basiswerkzeuge mit Punktzugriff, Längen/Winkeln, Teilen/Löschen, Rasterfang, Zoom/Pan, Undo/Redo; keine vollständigen CAD-Constraints, freie Bemaßungsobjekte oder allgemeinen Mesh-/Boolean-Operationen |
| Beliebige mehrere Ebenen | Getrennte Höhenbereiche modellierbar; Boden-/Deckenöffnungen, Treppenlöcher und beliebige verwundene Raumhüllen offen |
| Möbel / GLB/glTF/OBJ | Parametrische akustische Boxen; Netze visuell. Akustische Netzdaten und Materialien nicht automatisch übernommen |
| Quellen | Mehrere Quellen/Subwoofer, Position, Zentrumversatz, Ausrichtung, Delay/Polarität; gemessene Direktivität, Crossover-/EQ-/Quellphasen-Übertragung noch offen |
| Messplanung | Vier Profile, Ziel/Genauigkeit, Hörplätze, Zonen, Höhenniveaus, Hindernisse, aktive Sweep-Kombinationen, Bearbeitung/Freigabe/Ablauf |
| Optimale Messpositionen | Transparente heuristische Planung, keine bewiesene informationsoptimale oder modale Versuchsplanung |
| Messplanexport | PDF im Desktop, SVG/PNG/CSV/JSON, reale Segmentreferenzen und Koordinatentabelle |
| REW | Getesteter Text-/WAV-Import mit Plan-/Task-Zuordnung; API-Übersicht als Fixture geprüft. Echter API-Kurvenimport/Messstart benötigt REW-Version und Praxistest |
| Allgemeine Reflexionen | ISM bis Ordnung 4 nach Budget, begrenzte Flächen, Sichtbarkeit und Boxabschattung, SVG-Schemata |
| Wellenmodell | Rigid-wall-3D-FDTD und analytische Quader-Referenz; dissipative Materialien, numerische Eigenwertanalyse beliebiger Hüllen und belastbarer Breitband-Hybrid offen |
| Gekrümmte Fokussierung / diffuse Energie / Beugung | Kein validiertes Prognosemodell; keine scheinpräzisen Ersatzwerte |
| Messabgleich | Qualitativer Laufzeit-/Mehrpunktabgleich; bandweiser Pegel-/Spektralabgleich und kalibrierte Ursachenunsicherheit offen |
| Visualisierung | Orbit/First Person, Hör-/Quellperspektive, Pfadfilter, modale Quaderfelder, zeitabhängiges FDTD-Feld; echte Schnittflächen und interaktive Mesh-Flächenauswahl offen |
| KI | Lokale strukturierte Werkzeuge, protokollierte Aufrufe, Vorschläge nur nach Benutzerübernahme. Transport mit Mock geprüft; kein Live-Key eingesetzt |
| Problemerkennung | FR-Peaks/Einbrüche, frühe Modellreflexionen, IR-Fit-Probleme, geometrische Warnungen und einfache Quell-Asymmetrie; keine vollständige Flatterecho-/Resonator-/Fokussierungsdiagnose |
| Materialien | Klassenkatalog und manuelle Oktavwerte mit Herkunft; recherchierte verifizierte Hersteller-/Laborbibliothek und Impedanzmodelle fehlen |
| Maßnahmenoptimierung | Separate manuell editierbare Minimal-/Ausgewogen-/Maximal-Varianten, sichtbare Gewichte; keine automatische belastbare Kosten-/Nutzenrangliste oder berechnete Bauteildimensionierung |
| Vorher/Nachher | Pfade, relativer Pegel, Laufzeit und Sabine-Schätzung; vollständige FR/ETC/Decay-Vorhersage mit Treatment-Materialverlusten noch offen |
| Berichte | PDF/JSON mit Plänen, Diagrammen, Schemata und Grenzen; kein vollständiger Normnachweis oder empirisch bestätigter Abschluss aller Analysen |
| Abnahme | Synthetische Referenz-/Integrationstests; reale Referenzräume, Materialdatensätze, Windows-Installations-/Updateversuch und echte REW-Abnahme fehlen |

Die Originalanforderungen stehen unverändert in [MASTERPROMPT-V2.md](MASTERPROMPT-V2.md). Nächste fachliche Schritte: reale Referenzmessungen und REW-Vertrag validieren, dissipative Randmodelle samt Gitterkonvergenz ergänzen, kurvenabhängige Energie-/Beugungsmodelle prüfen und erst darauf belastbare Maßnahmenoptimierung aufbauen.
