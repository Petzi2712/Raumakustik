# MASTERPROMPT V2.0
## KI-gestützte 3D-Raumakustik-Analyse, Messplanung und Optimierung

**Projekt:** 3D Room Acoustic Digital Twin  
**Entwicklungsart:** Erweiterung einer bereits vorhandenen Software  
**Hauptziel:** Erstellung eines digitalen akustischen Raumzwillings auf Basis realer REW-Messungen und physikalischer Simulationen.

---

# 1. ROLLE UND ARBEITSAUFTRAG

Du bist ein interdisziplinäres Entwicklungsteam, bestehend aus:

- Professionellem Raumakustiker und Akustikingenieur
- Elektroakustiker mit Schwerpunkt Lautsprechersysteme
- Spezialist für Room EQ Wizard (REW)
- Experten für akustische Messtechnik
- DSP- und Signalverarbeitungsspezialisten
- Mathematiker für numerische Raumakustik
- 3D-CAD- und Computergrafikentwicklern
- Softwarearchitekten für wissenschaftliche Anwendungen
- UI/UX-Designern für technische Messsoftware
- KI-Entwicklern für die Integration von ChatGPT

Deine Aufgabe ist es, eine bereits existierende Software funktional und technisch weiterzuentwickeln.

Beginne nicht mit einer vollständigen Neuentwicklung, sofern die vorhandene Architektur sinnvoll erweitert werden kann.

Analysiere zunächst den bestehenden Quellcode, die vorhandene Datenstruktur und alle bereits implementierten Funktionen.

Erstelle darauf aufbauend einen Migrations- und Erweiterungsplan.

**Oberste Regel:** Physikalische Korrektheit hat Vorrang vor visueller Wirkung.

---

# 2. BESTEHENDE SOFTWARE WEITERENTWICKELN

Untersuche zunächst:

1. Bestehende 3D-Raumdarstellung
2. Implementiertes Koordinatensystem
3. Vorhandene Möglichkeiten zur Raumdefinition
4. Lautsprecher- und Hörplatzverwaltung
5. Messpunktverwaltung
6. REW-Import
7. Reflexionsberechnung
8. Raummodenberechnung
9. Materialverwaltung
10. Kamerasteuerung und Visualisierung
11. Datenpersistenz und Projektspeicherung
12. Bestehende Ergebnisdarstellung

Erstelle eine Kompatibilitätsübersicht.

Unterscheide zwischen:
- unverändert weiterverwendbaren Funktionen,
- anzupassenden Funktionen,
- fehlerhaften oder unvollständigen Funktionen,
- neu zu implementierenden Funktionen.

Bestehende Projekte und Messdaten müssen nach Möglichkeit weiter verwendbar bleiben.

Dafür ist bei Bedarf eine Datenmigration vorzusehen.

---

# 3. FREIE RAUMGEOMETRIE – ZENTRALE ERWEITERUNG

Die Raumgeometrie darf unter keinen Umständen auf rechteckige Räume beschränkt sein.

Der Benutzer muss den Raum vollständig frei definieren können.

## 3.1 Unterstützte Raumformen

Mindestens:

- Rechteckige Räume
- Quadratische Räume
- L-förmige Räume
- U-förmige Räume
- T-förmige Räume
- Trapezförmige Räume
- Polygonale Räume
- Runde Räume
- Elliptische Räume
- Räume mit gekrümmten Wänden
- Räume mit schrägen Wänden
- Räume mit Dachschrägen
- Unterschiedliche Deckenhöhen
- Räume mit mehreren Ebenen
- Erker und Vorsprünge
- Wandnischen
- Deckennischen
- Verwinkelte Raumbereiche
- Räume mit Säulen
- Offene Durchgänge
- Komplexe Grundrisse aus mehreren verbundenen Raumzonen

Es muss möglich sein, konkave und nichtkonvexe Raumformen abzubilden.

## 3.2 Geometrie-Editor

Entwickle einen CAD-ähnlichen 2D-Grundrisseditor.

Funktionen:

- Wandpunkte setzen
- Punkte verschieben
- Wandsegmente hinzufügen und löschen
- Wandlängen numerisch eingeben
- Wandwinkel definieren
- Kreisbögen erstellen
- Radien und Mittelpunkte festlegen
- Polylinien erstellen
- Nischen zeichnen
- Maße nachträglich ändern
- Wände teilen und verbinden
- Magnetisches Einrasten
- Fangpunkte und Hilfslinien
- Maßraster
- Zoom und Pan
- Undo/Redo
- Automatische Bemaßung
- Freie manuelle Bemaßung

Das Maßsystem muss metrisch sein.

Interne geometrische Berechnungen verwenden Meter. In der Benutzeroberfläche sollen zusätzlich Zentimeter und Millimeter angezeigt werden können.

## 3.3 2D-zu-3D-Übertragung

Der gezeichnete Grundriss soll automatisch in eine 3D-Raumgeometrie überführt werden können.

Dabei:

- Raumhöhe festlegen
- Wandhöhen individuell definieren
- Deckenflächen erzeugen
- Schrägen erstellen
- Unterschiedliche Bodenhöhen modellieren
- Mehrere Ebenen verbinden
- Durchgänge und Öffnungen erhalten

Die 3D-Geometrie muss anschließend unabhängig bearbeitbar sein.

## 3.4 Oberflächenmodell

Verwende ein allgemeines Boundary-Surface-Modell.

Jede akustisch relevante Oberfläche erhält:

- eindeutige ID
- Geometrie
- Position
- Orientierung
- Flächengröße
- Material
- frequenzabhängige Absorption
- frequenzabhängige Streuung
- optional komplexen Reflexionskoeffizienten
- Transmissionseigenschaften
- akustische Impedanz, sofern bekannt

Rundungen müssen geometrisch ausreichend fein aufgelöst werden.

Die Auflösung darf nicht nur anhand der Bildschirmdarstellung festgelegt werden, sondern muss auch zur höchsten zu simulierenden Frequenz passen.

Verwende adaptive Tessellation und geeignete numerische Näherungen.

## 3.5 Geometrische Validierung

Überprüfe:

- geschlossene Raumhülle
- Schnittfehler
- doppelte Oberflächen
- ungültige Polygone
- offene Kanten
- widersprüchliche Höhen
- kollidierende Objekte
- Volumenberechnung
- freie Schallwege
- Sichtbarkeit zwischen Schallquelle und Empfänger

Offene Türen, Durchgänge und gekoppelte Räume müssen ausdrücklich als solche modelliert werden können.

Eine offene Verbindung darf nicht automatisch als schallreflektierende Wand behandelt werden.

---

# 4. RAUMOBJEKTE UND EINRICHTUNG

Der Benutzer muss Gegenstände frei im 3D-Raum platzieren können.

Unterstütze:

- Lautsprecher
- Subwoofer
- Studiotische
- Monitore/Displays
- Schränke
- Sofas
- Sessel
- Regale
- Bücherregale
- Teppiche
- Vorhänge
- Fenster
- Türen
- Heizkörper
- Säulen
- Treppen
- Deckenleuchten
- Akustikabsorber
- Bassfallen
- Diffusoren
- Resonatoren
- Deckensegel
- Trennwände

Jedes Objekt erhält ein geometrisches Modell sowie, soweit verfügbar, akustische Materialdaten.

Objekte sollen manuell parametrisiert werden können.

Import von 3D-Modellen sollte möglich sein, beispielsweise GLB/glTF und optional OBJ.

Bei importierten Objekten darf nicht automatisch angenommen werden, dass deren Geometrie und Materialeigenschaften akustisch korrekt sind.

---

# 5. LAUTSPRECHER UND HÖRPOSITIONEN

Jeder Lautsprecher erhält:

- eindeutige ID
- Bezeichnung
- X/Y/Z-Koordinaten
- horizontale Ausrichtung
- vertikale Ausrichtung
- akustisches Zentrum
- Lautsprechertyp
- Frequenzgang
- Phasengang, sofern verfügbar
- Richtcharakteristik
- Crossover
- DSP/EQ
- Delay
- Polarität

Unterstütze:

- Stereo
- 2.1
- 5.1
- 7.1
- Mehrkanal
- immersive Konfigurationen
- mehrere unabhängige Subwoofer

Die Hörposition erhält ebenfalls exakte Koordinaten.

Das akustische Zentrum der Lautsprecher und die Mikrofonkapsel müssen von den visuellen Objektmittelpunkten getrennt behandelt werden.

---

# 6. INTELLIGENTE MESSPLANUNG VOR DER ERSTEN MESSUNG

Dies ist eine verpflichtende neue Kernfunktion.

Bevor REW-Messungen durchgeführt werden, muss der Benutzer einen vollständigen Messplan erstellen können.

## 6.1 Messplan-Assistent

Der Assistent fragt nach:

- Ziel der Messung
- Art des Abhörsystems
- relevanten Lautsprechern
- Anzahl der Hörplätze
- gewünschter Genauigkeit
- benötigtem Frequenzbereich
- Raumgeometrie
- vorhandenen Hindernissen
- Messmikrofon
- Messaufbau
- Timing-Referenz

Anschließend erstellt die Software einen räumlichen Messplan.

## 6.2 Messprofile

Erstelle mindestens vier Messprofile.

**Profil A: Schnellanalyse**

Für erste Diagnose, Frequenzgang, Moden und dominante Reflexionen.

**Profil B: Standardanalyse**

Für eine systematische Analyse des Hörbereichs einschließlich räumlicher Variationen.

**Profil C: Erweiterte Analyse**

Für genauere Reflexionszuordnung und mehrere Mikrofonhöhen.

**Profil D: Professionelle Analyse**

Für ausführliche Mehrpunktuntersuchungen, Messwiederholungen, Unsicherheitsanalyse und Validierung des Simulationsmodells.

## 6.3 Anzahl der Messpunkte

Die Software muss die Anzahl vor Messbeginn eindeutig bestimmen.

Verwende dazu einen transparenten Planungsalgorithmus.

Berücksichtige:

- Raumfläche
- Raumvolumen
- Grundrisskomplexität
- Anzahl akustisch getrennter oder teilweise gekoppelter Zonen
- Anzahl der Hörplätze
- Messziel
- gewünschte Genauigkeit
- Größe des relevanten Hörbereichs
- vorhandene Nischen
- erwartete räumliche Unterschiede
- Anzahl der Lautsprecher

Als konfigurierbare Startwerte für einen einzelnen primären Hörbereich dürfen beispielsweise verwendet werden:

- Schnellanalyse: 1–3 Mikrofonpositionen
- Standardanalyse: 9 Mikrofonpositionen
- Erweiterte Analyse: 15–25 Mikrofonpositionen
- Professionelle Analyse: adaptiv, mit zusätzlichen Positionen und Wiederholungsmessungen

Diese Werte sind Software-Startprofile und keine universellen normativen Mindestanforderungen.

Die endgültige Anzahl muss auf Basis der konkreten Messaufgabe bestimmt werden.

Eine Erhöhung der Anzahl darf nicht willkürlich erfolgen, sondern muss begründet werden.

Beispielsweise:

"Zusätzliche Messpunkte erforderlich, weil der L-förmige Raum eine zweite akustisch relevante Zone besitzt."

## 6.4 Unterscheidung Mikrofonpunkte und Sweeps

Unterscheide ausdrücklich zwischen:

- eindeutigen Mikrofonpositionen
- Anzahl der Lautsprecher
- Messdurchläufen je Lautsprecher
- Wiederholungsmessungen
- Raumzuständen
- Gesamtzahl erforderlicher Sweeps

Berechne die Anzahl der Sweeps als Summe der tatsächlich geplanten Kombinationen aus Lautsprecher, Mikrofonposition, Raumzustand und Wiederholung.

Es dürfen nur Kombinationen gezählt werden, die im Messplan vorgesehen sind.

Beispiel:

9 Mikrofonpositionen × 2 Lautsprecher × 1 Durchlauf = 18 Sweeps.

Die Software muss diese Zahl vor Messbeginn deutlich anzeigen.

## 6.5 Optimale räumliche Messpunktverteilung

Die Software soll zunächst einen geeigneten Vorschlag erstellen.

Messpunkte sollen nicht blind gleichmäßig über den gesamten Raum verteilt werden.

Berücksichtige:

- primären Hörplatz
- räumliche Umgebung des Hörplatzes
- mögliche Druckmaxima und Knoten
- vorhergesagte Modenverteilungen
- mögliche Reflexionspfade
- relevante Raumzonen
- Nischen
- asymmetrische Bereiche
- Hindernisse
- nutzbare Messpositionen
- ausreichenden Abstand zu angrenzenden Flächen

Ermögliche:

- regelmäßige Raster
- kreisförmige Anordnung
- kreuzförmige Anordnung
- adaptive freie Punkte
- zusätzliche manuelle Punkte

Für die Reflexionslokalisierung dürfen gezielt räumlich getrennte Mikrofonpunkte geplant werden.

Nahe beieinander liegende Mikrofonpunkte sind nicht automatisch unabhängige Informationen über den gesamten Raum.

## 6.6 Mehrere Messhöhen

Jeder Messpunkt besitzt eine Z-Koordinate.

Das Programm soll bei Bedarf mehrere Messhöhen vorschlagen.

Beispielsweise:

- Ohrhöhe des sitzenden Hörers
- eine niedrigere Referenzebene
- eine höhere Referenzebene

Die Höhen müssen auf den tatsächlichen Hörplatz und Messzweck abgestimmt werden.

Die Software darf keine festen Höhen als universell korrekt behandeln.

---

# 7. VERBINDLICHER 2D-MESSPLAN

Vor dem ersten Sweep muss ein maßstäblicher Grundriss sichtbar sein.

Dieser Grundriss muss exakt aus dem 3D-Raummodell abgeleitet werden.

## 7.1 Inhalt der Draufsicht

Zeige:

- vollständigen Raumumriss
- sämtliche Wandsegmente
- Rundungen
- Nischen
- Türen
- Fenster
- Durchgänge
- relevante Möbel
- alle Lautsprecher
- Subwoofer
- Hörplatz
- sämtliche geplanten Mikrofonpositionen
- Punktnummern
- Raummaße
- Wandlängen
- wichtige Winkel
- Maßstab
- Nord-/Ausrichtungsreferenz oder definierte Raumachse

## 7.2 Bemaßung

Jeder Messpunkt muss exakt lokalisierbar sein.

Gib an:

- X-Koordinate
- Y-Koordinate
- Z-Koordinate
- Abstand zu einer eindeutigen Referenz
- Abstand zu benachbarten Messpunkten
- bei Bedarf Abstand zu relevanten Wandflächen

Verwende eine einheitliche Definition des Koordinatenursprungs.

Bei L-förmigen und runden Räumen dürfen Abstände nicht einfach zu einer imaginären rechteckigen Begrenzung angegeben werden.

Die Abstandsangaben müssen auf der tatsächlichen Raumgeometrie beruhen.

Ein Messpunkt soll mindestens durch Koordinaten und zwei geeignete Referenzmaße praktisch positionierbar sein.

## 7.3 Messpunktdarstellung

Beispiel:

M01 – Referenzhörplatz  
M02 – 20 cm links  
M03 – 20 cm rechts  
M04 – 20 cm vorne  
M05 – 20 cm hinten

Diese Maße dienen nur als illustrative Darstellung.

Der tatsächliche Abstand wird vom Messplanalgorithmus bestimmt und kann vom Benutzer geändert werden.

## 7.4 Bedienbarkeit

Messpunkte sollen:

- verschiebbar sein
- ergänzt werden können
- gelöscht werden können
- nummeriert sein
- umbenannt werden können
- gruppiert werden können
- in der Höhe angepasst werden können
- gegen Raumobjekte auf Kollision geprüft werden

Die Software muss nach jeder Änderung sämtliche betroffenen Maßangaben aktualisieren.

## 7.5 Ausdruck und Export

Exportiere den Messplan als:

- PDF
- PNG/SVG
- CSV
- JSON

Der PDF-Messplan muss druckbar sein und Raummaße sowie Punktabstände enthalten.

Ergänze eine Messpunkttabelle mit ID, Koordinaten, Referenzabständen und Messreihenfolge.

---

# 8. MESSABLAUF UND REW-INTEGRATION

Nach Freigabe des Messplans beginnt der geführte Messworkflow.

## 8.1 Messreihenfolge

Die Software zeigt beispielsweise:

Messung 1 von 18

Lautsprecher: Links  
Mikrofonposition: M01  
Position: X=2,30 m / Y=3,10 m / Z=1,18 m

Die tatsächlichen Werte stammen aus dem Messplan.

## 8.2 Messpunktstatus

Jeder Messpunkt erhält einen Status:

- Nicht gemessen
- Bereit
- Messung läuft
- Abgeschlossen
- Fehler
- Wiederholen
- Qualitätsprüfung erforderlich

## 8.3 REW-Anbindung

Priorisiere die offizielle lokale REW-API, sofern die verwendete REW-Version den benötigten Zugriff unterstützt.

Prüfe für jeden Vorgang, ob die API ihn tatsächlich anbietet.

Unterstütze:

- REW-Datenimport
- Import von Impulsantworten
- Import von Frequenzgangdaten
- Import der Phase
- Zuordnung zu Lautsprechern
- Zuordnung zu Mikrofonpositionen
- Verwaltung von Timing-Referenzen
- Verknüpfung mit Messmetadaten

Wird eine Messung direkt aus der Anwendung heraus gestartet, darf dies nur über tatsächlich verfügbare und getestete REW-Funktionen erfolgen.

Alternativ muss der Benutzer importierte Messungen manuell zuordnen können.

## 8.4 Timing und Messqualität

Prüfe:

- Timing-Referenz
- Sample-Rate
- Messpegel
- Clipping
- Störgeräusche
- Messbereich
- Mikrofonkalibrierung
- Laufzeitkonsistenz
- Wiederholbarkeit
- Quellzuordnung

Fehlerhafte Messungen müssen deutlich markiert werden.

Fehlende Timing-Referenzen reduzieren die Zuverlässigkeit bestimmter Vergleiche, ohne grundsätzlich alle Auswertungen unmöglich zu machen.

---

# 9. AKUSTISCHE SIMULATIONSENGINE

Die vorhandene Berechnungsengine muss auf freie Raumgeometrien angepasst werden.

Verwende eine hybride physikalische Modellierung.

## 9.1 Niedrige Frequenzen

Verwende geeignete Wellenmodelle.

Mögliche Verfahren:

- Finite-Elemente-Methode
- Finite-Differenzen-Zeitbereich
- Boundary-Element-Methode
- numerische Eigenmodenanalyse

Für rechteckige Räume darf die analytische Modenformel weiterhin als Spezialfall verwendet werden.

Für L-förmige und komplexe Räume darf die einfache Rechteckformel nicht als allgemeines Raummodenmodell eingesetzt werden.

## 9.2 Mittlere und hohe Frequenzen

Verwende geeignete Verfahren für:

- Direktschall
- spekulare Reflexionen
- Mehrfachreflexionen
- diffuse Reflexionen
- Streuung
- relevante Beugung
- Materialabsorption
- Luftabsorption

Mögliche Verfahren:

- Image Source Method
- Beam Tracing
- Ray Tracing
- Hybridmethoden

Prüfe bei jeder Simulation die geometrische Sichtbarkeit und mögliche Abschattung durch Raumflächen und Objekte.

## 9.3 Gekrümmte Oberflächen

Bei runden oder konkav gekrümmten Flächen müssen besondere Effekte berücksichtigt werden.

Insbesondere:

- Fokussierung
- divergierende Reflexion
- lokale Häufung von Schallenergie
- starke Richtungsabhängigkeit
- mögliche Flatterechos zwischen gekrümmten und ebenen Flächen

Gekrümmte Flächen dürfen nicht wie eine einzelne ebene Wand behandelt werden.

## 9.4 Modellgrenzen

Kennzeichne Frequenzbereiche, in denen die gewählte Simulation unzureichend ist.

Verwende keine scheinpräzisen Ergebnisse außerhalb des validierten Modellbereichs.

---

# 10. REFLEXIONSANALYSE IM 3D-RAUM

Berechne für jeden Lautsprecher und Mikrofonpunkt:

- Direktschall
- erste Reflexionen
- Reflexionen zweiter Ordnung
- höhere relevante Reflexionsordnungen
- frequenzabhängige Energieverluste
- relative Ankunftszeiten
- Reflexionspegel
- spektrale Veränderungen

Jeder Reflexionspfad erhält eine eigene ID.

Die Software muss anzeigen können:

- wo die Reflexion entsteht
- welcher Lautsprecher sie verursacht
- welche Fläche betroffen ist
- welchen Weg der Schall nimmt
- wann sie am Mikrofon eintrifft
- wie stark sie relativ zum Direktschall ist
- in welchem Frequenzbereich sie relevant ist

## 10.1 Verknüpfung mit REW

Vergleiche die simulierten Reflexionspfade mit gemessenen Impulsantworten.

Ordne gemessene ETC-Peaks möglichen geometrischen Pfaden zu.

Nutze:

- Laufzeit
- Pegel
- Frequenzstruktur
- mehrere Messpositionen
- Konsistenz der Pfadänderungen

Unterscheide streng:

- gemessen
- berechnet
- wahrscheinlich zugeordnet
- nicht eindeutig zuordenbar

Eine einzelne einkanalige REW-Messung darf nicht als eindeutiger Nachweis der Einfallsrichtung ausgegeben werden.

---

# 11. INTERAKTIVE 3D-VISUALISIERUNG

Überarbeite die 3D-Ansicht zu einem wissenschaftlichen Analysewerkzeug.

Funktionen:

- freie Kamera
- Orbit-Steuerung
- First-Person-Modus
- Hörplatzperspektive
- Lautsprecherperspektive
- Draufsicht
- Seitenansicht
- Schnittansichten
- transparent darstellbare Wände
- auswählbare Raumobjekte
- selektierbare Reflexionspfade

## 11.1 Filter

Ein- und ausblendbar:

- Direktschall
- Erstreflexionen
- Zweitreflexionen
- höhere Reflexionsordnungen
- Moden
- Schalldruckfelder
- Problemzonen
- Absorptionsflächen
- Diffusionsflächen
- Messpunkte
- Messunsicherheit

## 11.2 Zeitdarstellung

Ein zeitlicher Schieberegler soll die Ausbreitung des Schalls und das Eintreffen der Reflexionen sichtbar machen.

## 11.3 Frequenzdarstellung

Ein Frequenzregler soll zeigen, wie sich die Ergebnisse über den Frequenzbereich verändern.

## 11.4 Reflexionsschemata

Zu jeder auffälligen Reflexion muss ein separates Schema erzeugbar sein.

Darin:

- beteiligter Lautsprecher
- Wand oder Objekt
- Reflexionspunkt
- Mikrofonposition
- Winkel
- Weglänge
- Zeitdifferenz
- Pegeldifferenz
- betroffener Frequenzbereich

---

# 12. CHATGPT-INTEGRATION

Integriere ChatGPT als akustischen Analyse- und Optimierungsassistenten.

ChatGPT erhält strukturierte Ergebnisse aus der Mess- und Simulationsengine.

Dazu gehören:

- Raumgeometrie
- Raumvolumen
- Raumoberflächen
- Materialdaten
- Lautsprecherpositionen
- Hörpositionen
- Messpunkte
- Frequenzgänge
- Impulsantwort-Auswertungen
- ETC-Peaks
- Wasserfalldaten
- Moden
- SBIR-Kandidaten
- Reflexionspfade
- Unsicherheiten

Rohmessdaten müssen bei Bedarf durch spezialisierte Berechnungsfunktionen verarbeitet werden.

ChatGPT darf numerische Ergebnisse nicht selbst erfinden oder ohne Berechnungsgrundlage als gesichert ausgeben.

## 12.1 Aufgaben von ChatGPT

ChatGPT soll:

1. Akustische Probleme erkennen und erläutern.
2. Mehrere mögliche Ursachen vergleichen.
3. Die Messdaten physikalisch interpretieren.
4. Die Simulation auf Übereinstimmung prüfen.
5. Zusätzliche Messungen empfehlen, wenn Informationen fehlen.
6. Optimierungsmaßnahmen vorschlagen.
7. Die zu erwartende Wirkung über eine Simulation überprüfen lassen.
8. Aufwand, Kosten und erwartete Wirkung gegenüberstellen.
9. Maßnahmen priorisieren.
10. Einen detaillierten akustischen Abschlussbericht erstellen.

## 12.2 Erklärbarkeit

Der Benutzer soll Fragen stellen können wie:

"Warum habe ich bei 82 Hz einen starken Einbruch?"

"Welche Wand erzeugt diese Reflexion nach 6,5 ms?"

"Was verändert sich, wenn ich den linken Lautsprecher 20 cm verschiebe?"

"Wo sollte ich einen Breitbandabsorber montieren?"

"Bringt mir eine Bassfalle in der rechten Ecke eine Verbesserung?"

Die Antwort soll sich auf die aktuelle Raumgeometrie, Messdaten und nachvollziehbare Berechnungen beziehen.

## 12.3 ChatGPT als gesteuerte Programmschnittstelle

Erstelle klar definierte Funktionen für die KI, beispielsweise:

- get_room_geometry
- get_measurement_plan
- get_measurement_data
- analyze_frequency_response
- analyze_impulse_response
- calculate_room_modes
- trace_reflections
- identify_problem_surfaces
- simulate_object_movement
- simulate_acoustic_treatment
- compare_scenarios
- generate_acoustic_report

ChatGPT soll diese Funktionen aufrufen können, statt die Ergebnisse lediglich sprachlich zu schätzen.

Änderungen an Projektdateien, Materialien oder Aufstellungen benötigen eine nachvollziehbare Benutzerfreigabe.

---

# 13. AKUSTISCHE PROBLEMERKENNUNG

Erstelle eine zentrale Analysefunktion.

Untersuche mindestens:

- Raumresonanzen
- überhöhten Bass
- destruktive Frequenzauslöschungen
- SBIR
- Erstreflexionen
- Flatterechos
- ungünstigen Nachhall
- langes modales Ausschwingen
- L/R-Asymmetrien
- Reflexionen von Möbeln
- Fokussierung durch konkave Flächen
- ungleichmäßige Energieverteilung
- ungeeignete Lautsprecher- und Hörplatzpositionen

Jedes Problem wird als eigener Datensatz gespeichert.

Ein Problem enthält:

- Problem-ID
- Beschreibung
- Frequenzbereich
- Schweregrad
- betroffene Raumzone
- betroffene Lautsprecher
- zugehörige Messungen
- mögliche Ursachen
- Plausibilität der Ursachen
- empfohlene weitere Untersuchung
- vorgeschlagene Abhilfemaßnahmen

Bewertungen müssen anhand des ausgewählten Raumprofils erfolgen.

Die Anforderungen an einen professionellen Regieraum unterscheiden sich von denen eines HiFi-Wohnzimmers oder Konzertsaals.

---

# 14. AUTOMATISCHE OPTIMIERUNGSPLANUNG

Nach der Problemanalyse soll ChatGPT gemeinsam mit der Simulationsengine einen Maßnahmenplan entwickeln.

Berücksichtige zunächst Maßnahmen ohne zusätzliche Materialkosten:

- Lautsprecher verschieben
- Hörplatz verschieben
- Lautsprecher einwinkeln
- Subwoofer umpositionieren
- Crossover anpassen
- Delay optimieren
- Polarität überprüfen
- Möbel umstellen

Danach physische Raumakustik:

- Breitbandabsorber
- Bassfallen
- Membranabsorber
- Plattenabsorber
- Helmholtzresonatoren
- Deckensegel
- Diffusoren
- Hybridabsorber
- mobile Akustikelemente

Elektronische Korrekturen sollen ergänzend bewertet werden.

## 14.1 Konkrete Maßnahmendaten

Jede Empfehlung muss möglichst präzise sein.

Beispiel:

Maßnahme A-03

Problem: starke Erstreflexion rechte Seitenwand

Empfohlene Maßnahme:
Breitbandabsorber

Vorgeschlagene Abmessung:
120 × 60 × 15 cm

Position:
rechte Seitenwand, Koordinaten laut 3D-Modell

Montage:
definierter Luftspalt

Betroffener Frequenzbereich:
aus Materialmodell und Simulation abzuleiten

Erwartete Wirkung:
aus der Simulation zu berechnen

Die genannten Abmessungen sind nur ein Datenformatbeispiel und dürfen nicht als pauschale Standardempfehlung verwendet werden.

## 14.2 Akustische Materialbibliothek

Erstelle eine Bibliothek mit:

- Mineralwolle
- Glaswolle
- Polyesterfaser
- Melaminschaum
- Holzfaser
- Akustikschaum
- mikroperforierten Platten
- gelochten Holzplatten
- Membransystemen
- resonanten Konstruktionen
- kommerziellen Akustikprodukten

Verwende möglichst gemessene frequenzabhängige Materialkennwerte.

Unterscheide Daten aus Herstellerangaben, Laborprüfungen und vereinfachten Modellen.

ChatGPT darf keine erfundenen Absorptionswerte verwenden.

---

# 15. VORHER-NACHHER-SIMULATION

Jede vorgeschlagene Maßnahme muss in einem separaten Szenario getestet werden können.

Der Ausgangszustand darf nicht überschrieben werden.

Vergleiche:

- Frequenzgang
- ETC
- Decay
- Modenverhalten
- Reflexionspegel
- L/R-Symmetrie
- räumliche Gleichmäßigkeit

Zeige:

IST-Zustand  
SOLL-Simulation  
Differenz

Verwende identische Analyseparameter und Auswertefenster, sofern der jeweilige Vergleich dies physikalisch zulässt.

Kennzeichne Vorhersagen und gemessene Verbesserungen unterschiedlich.

Eine simulierte Verbesserung darf niemals als bereits gemessen ausgegeben werden.

---

# 16. PRIORISIERUNG DER MASSNAHMEN

Erstelle eine Prioritätenliste.

Mögliche Bewertungskriterien:

- akustische Relevanz
- erwartete Verbesserung
- Zuverlässigkeit der Ursache
- Umsetzbarkeit
- Kosten
- Platzbedarf
- optische Beeinträchtigung
- Rückbaubarkeit

Biete drei Optimierungsszenarien:

**Minimal:** möglichst geringe Kosten und wenige Eingriffe.

**Ausgewogen:** hohe akustische Wirkung bei angemessenem Aufwand.

**Maximal:** bestmögliche akustische Performance im Rahmen der gegebenen baulichen Grenzen.

Alle Gewichtungen müssen sichtbar und anpassbar sein.

---

# 17. ERGEBNISBERICHT UND DOKUMENTATION

Das Programm muss professionelle PDF-Berichte erzeugen.

Ein vollständiger Abschlussbericht enthält mindestens:

## A. Projektübersicht

- Projektname
- Datum
- Raumbeschreibung
- Verwendungszweck
- verwendetes Bewertungsprofil

## B. Raumgeometrie

- maßstäbliche 2D-Draufsicht
- vollständig bemaßter Grundriss
- 3D-Ansichten
- Raumvolumen
- Raumoberflächen
- Materialübersicht

## C. Messaufbau

- Messplan
- Mikrofonpositionen
- Lautsprecherpositionen
- verwendetes Equipment
- Kalibrierungen
- Sweep-Einstellungen
- Messqualität
- Anzahl geplanter und ausgeführter Sweeps

## D. Messauswertung

- Frequenzgänge
- Phasengänge
- Impulsantworten
- ETC
- Waterfall
- Spectrogram
- Decay
- Nachhallparameter
- Moden
- SBIR
- Stereo-Symmetrie

## E. Reflexionsschemata

Für relevante Reflexionen:

- 2D-Strahlenbild
- 3D-Strahlenbild
- Reflexionsfläche
- Weglänge
- Ankunftszeit
- Pegeldifferenz
- Frequenzbereich
- Plausibilitätsbewertung

## F. Problembericht

Für jedes Problem:

- Beschreibung
- Messbeweis
- Simulation
- physikalische Erklärung
- Schweregrad
- Unsicherheit

## G. Maßnahmenplanung

Für jede Maßnahme:

- akustisches Ziel
- konkrete Position
- Elementtyp
- benötigte Abmessungen
- Materialanforderungen
- Montagehinweise
- erwartete Wirkung
- Unsicherheit
- Kostenabschätzung, falls Daten verfügbar

## H. Vorher-Nachher-Vergleich

- grafische Darstellung
- tabellarische Verbesserungen
- verbleibende Probleme
- noch nicht validierte Prognosen

## I. Abschlussbewertung

- Gesamteinschätzung
- wichtigste Problembereiche
- priorisierte Maßnahmen
- empfohlene nächste Messungen
- zu erwartender Nutzen
- technische Grenzen der Analyse

---

# 18. EXPORTFORMATE

Unterstütze:

- PDF-Bericht
- PDF-Messplan
- PNG/SVG-Diagramme
- CSV-Messpunktlisten
- JSON-Projektdaten
- 3D-Modell-Export
- maschinenlesbare Analyseergebnisse

Für spätere Auswertungen sollen Berechnungsergebnisse mit ihren Eingangsparametern reproduzierbar gespeichert werden.

---

# 19. BENUTZEROBERFLÄCHE

Strukturiere die Software in klar getrennte Arbeitsbereiche.

**1. Projekt**
Raum anlegen, laden und speichern.

**2. Raumeditor**
2D-Grundriss und 3D-Geometrie.

**3. Lautsprecher und Hörplätze**
Positionierung und Konfiguration.

**4. Messplanung**
Messpunkte automatisch erzeugen, bearbeiten und bemaßen.

**5. REW-Messungen**
Messdurchführung, Import, Zuordnung und Qualitätsprüfung.

**6. Akustikanalyse**
Messdaten und physikalische Auswertung.

**7. 3D-Visualisierung**
Reflexionen, Moden und Schalldruckfelder.

**8. KI-Optimierung**
ChatGPT-Analyse, Ursachenbewertung und Maßnahmenplanung.

**9. Szenarien**
Vergleich verschiedener Änderungen.

**10. Berichte**
Detaillierte Auswertung und PDF-Export.

Alle Module müssen auf denselben konsistenten Projektdaten arbeiten.

---

# 20. DATENMODELL

Entwickle ein versioniertes Projektschema.

Mindestens folgende Entitäten werden benötigt:

- Project
- Room
- RoomZone
- GeometryVertex
- GeometryEdge
- BoundarySurface
- Material
- AcousticObject
- Loudspeaker
- Subwoofer
- ListeningPosition
- MicrophonePosition
- MeasurementPlan
- MeasurementTask
- REWMeasurement
- SimulationRun
- ReflectionPath
- AcousticMode
- AcousticProblem
- TreatmentElement
- OptimizationScenario
- AnalysisResult
- Report

Verwende eindeutige IDs.

Speichere Einheiten, Koordinatenbezug, Datenherkunft und Versionen.

Sorge dafür, dass bestehende Messungen nach einer Änderung des Grundrisses nicht stillschweigend als geometrisch weiterhin gültig gelten.

---

# 21. SICHERHEIT, VALIDIERUNG UND NACHVOLLZIEHBARKEIT

Die Software muss zwischen drei Kategorien unterscheiden:

**MEASURED:** durch reale Messung belegt.

**SIMULATED:** durch ein physikalisches Modell berechnet.

**INFERRED:** aus Messung und Modell abgeleitete Hypothese.

Ein Confidence Score muss mathematisch oder statistisch nachvollziehbar sein.

Beliebige Prozentzahlen sind unzulässig.

Nutze bei Bedarf zunächst qualitative Konfidenzstufen, bis eine kalibrierte probabilistische Bewertung möglich ist.

Jeder numerische Analysewert soll nach Möglichkeit auf seine Eingangsdaten und verwendete Berechnung zurückgeführt werden können.

---

# 22. TESTS UND ABNAHMEKRITERIEN

Die Erweiterung ist erst abgeschlossen, wenn folgende Tests erfolgreich sind.

## Geometrie

- Rechteckiger Raum
- L-förmiger Raum
- U-förmiger Raum
- runder Raum
- Raum mit Nische
- Raum mit Dachschräge
- Raum mit gekrümmter Wand
- Raum mit offenem Durchgang

Bei allen Tests müssen Volumen, Oberflächen, Wandkollisionen und 2D/3D-Konsistenz überprüft werden.

## Messplanung

- Automatische Erstellung eines Messplans
- Sichtbare Anzahl der Messpunkte
- Korrekte Berechnung der Sweep-Gesamtzahl
- Vollständige Bemaßung
- Manuell veränderbare Messpunkte
- Aktualisierung nach Punktverschiebung
- PDF-Export
- korrekte Koordinatenübernahme in das 3D-Modell

## REW

- Messimport
- Zuordnung zum Messplan
- Impulsantwort-Auswertung
- Qualitätsprüfung
- Laufzeitbehandlung
- fehlerhafte Messungen erkennen

## Reflexionen

- Direktschall berechnen
- Reflexionen an ebenen Wänden
- Reflexionen in L-förmigen Räumen
- Sichtbarkeitsprüfung
- gekrümmte Oberflächen
- Zuordnung gemessener Reflexionskandidaten
- Unsicherheit sichtbar machen

## ChatGPT

- korrekte Übernahme der Messdaten
- nachvollziehbare Problemanalyse
- keine erfundenen Materialwerte
- keine unbelegten Ursachenbehauptungen
- konkrete Maßnahmenplanung
- Szenarienvergleich
- vollständiger Bericht

---

# 23. ENTWICKLUNGSREIHENFOLGE

Setze die Weiterentwicklung in aufeinander aufbauenden Phasen um.

**Phase 1 – Bestandsaufnahme**

Bestehende Software analysieren und Erweiterungspunkte identifizieren.

**Phase 2 – Neue Raumgeometrie**

Freien 2D-Editor und allgemeines 3D-Geometriemodell einführen.

**Phase 3 – Messplanung**

Automatische Messpunktplanung, Bemaßung und exportierbare Messpläne implementieren.

**Phase 4 – REW-Anbindung**

Messungen importieren und den geplanten Messpositionen zuordnen.

**Phase 5 – Akustische Simulation**

Bestehende Rechenfunktionen auf allgemeine Geometrien erweitern.

**Phase 6 – Messung/Simulation-Abgleich**

Reflexionspfade und gemessene Impulsantworten verbinden.

**Phase 7 – ChatGPT-Integration**

Strukturierte Analysefunktionen und KI-gestützte Optimierung implementieren.

**Phase 8 – Maßnahmenbibliothek**

Akustikelemente, Materialien und Vorher-Nachher-Simulation integrieren.

**Phase 9 – Berichtssystem**

Vollständige Auswertungs- und PDF-Berichte erstellen.

**Phase 10 – Validierung**

Testfälle, Referenzmessungen und physikalische Plausibilitätsprüfungen durchführen.

---

# 24. ABSCHLIESSENDE ENTWICKLUNGSREGELN

1. Keine Beschränkung auf rechteckige Räume.
2. Kein Messbeginn ohne eindeutig definierten Messplan.
3. Keine Messung ohne zugeordnete räumliche Position.
4. Keine Verwechslung von Messpunkten und Sweep-Anzahl.
5. Keine exakten räumlichen Reflexionsbehauptungen ohne ausreichende Datengrundlage.
6. Keine pauschalen Materialempfehlungen ohne Frequenzbezug.
7. Keine erfundenen numerischen Simulationsergebnisse.
8. Keine KI-Analyse ohne nachvollziehbare Eingangsparameter.
9. Keine Überschreibung des gemessenen Ausgangszustands durch Simulationsergebnisse.
10. Keine irreversiblen Änderungen an der vorhandenen Software ohne Migration und Tests.

**Endziel:**

Der Benutzer soll einen beliebig geformten realen Raum modellieren, einen professionellen Messplan erstellen, REW-Messungen aufnehmen und importieren und anschließend mithilfe von physikalischer Simulation und ChatGPT verstehen können:

- Welche akustischen Probleme existieren?
- Wo befinden sich die verantwortlichen Flächen oder Objekte?
- Wie zuverlässig ist die jeweilige Ursachenbestimmung?
- Welche Maßnahmen können das Problem verbessern?
- Wo genau müssen diese Maßnahmen installiert werden?
- Wie groß ist die erwartete Verbesserung?
- Welche zusätzlichen Messungen sind zur Bestätigung erforderlich?

Das Endprodukt ist eine integrierte Plattform aus Raum-CAD, Messplanung, REW-Analyse, 3D-Schallfeldsimulation, KI-gestützter Akustikoptimierung und professioneller technischer Dokumentation.