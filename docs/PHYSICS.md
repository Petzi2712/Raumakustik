# Physikalische Modelle und Grenzen · 0.2

Alle Positionen in Metern, X rechts/Y nach hinten/Z nach oben. Volumen aus triangulierter Grundfläche und linear interpolierter Boden-/Deckenhöhe: V = Summe A_Dreieck × mittlere freie Höhe. Oberflächen aus 3D-Dreiecksflächen. Zonen müssen disjunkt sein; Überschneidungen werden nicht als Volumensumme akzeptiert. Kurven sind explizite polygonale Näherungen mit dokumentiertem Radius, Mittelpunkt und maximalem Sehnenfehler.

## Geometrische Akustik

Allgemeines Image-Source-Verfahren an begrenzten planaren Flächen. Für jede Wandsequenz werden Bilderquellen rekonstruiert und Reflexionspunkte rückwärts geschnitten. Punkte müssen auf den tatsächlichen Flächen liegen, auf der richtigen Materialseite ankommen und alle Teilstrecken müssen sichtbar sein. Öffnungen enthalten keine reflektierenden Teilflächen. Parametrische, um Z gedrehte Boxen können abschatten. Hintereinanderliegende Flächen werden nicht durch eine imaginäre Rechteckhülle ersetzt.

Maximal Ordnung 4; maximale vollständige Kandidatenzahl 20.000. Der Solver reduziert die Ordnung bei zu vielen Flächen (über 96 Teilflächen nur Ordnung 1). Die tatsächlich verwendete Grenze erscheint im Analysebereich. Höhere Ordnungen werden nicht als berechnet behauptet.

Druck relativ zum geometrischen Direktschall:

`p/p_direct = r_direct/r_path × Produkt sqrt(1−α−τ) sqrt(1−s) × 10^(−a_air Δr/20)`.

Für allgemeine Geometrie berücksichtigt die Luftabsorptionsnäherung nach ISO 9613 Temperatur, Druck und relative Feuchte. Der übernommene Rechteck-Spezialfall aus 0.1 behält sein Referenzmodell ohne Luftverlust bei. Die Schallgeschwindigkeit ist weiterhin die dokumentierte Trockenluftnäherung `c = 331,3 sqrt(1 + T/273,15)`.

`Δt = (r_path−r_direct)/c`, `f_null = c/(2 Δr)` als idealisierter SBIR-Kandidat bei phasengleicher Druckreflexion. Materialphase, frequenzabhängige Lautsprecherdirektivität, diffuse Energie und Beugung sind nicht in dieser ISM-Pegelprognose validiert. Geometrische Facetten bilden insbesondere keine validierte gekrümmte Fokussierungs-/Energiebilanz. Das Programm prüft den Sehnenfehler gegen λ/12 und lehnt zu grobe Kurven für die gewählte Frequenz ab.

## Niedrige Frequenzen

Die analytische Formel `f_pqr = c/2 sqrt((p/Lx)^2+(q/Ly)^2+(r/Lz)^2)` gilt ausschließlich für einen identifizierten axisparallelen Quader ohne akustische Hindernisse oder offene Verbindungen. Eigenfelder berücksichtigen den tatsächlichen Raumursprung. Keine Übertragung auf L-/U-/runde Räume, keine erfundenen Q-Faktoren.

Für freie Geometrien gibt es ein explizites 3D-FDTD-Modell der skalaren Wellengleichung. Das freie Luftvolumen wird voxelisiert, solide Boxen ausgeschlossen. Nachbarverbindungen müssen geometrisch sichtbar sein. Fehlende Nachbarn sind starre Neumann-Ränder. Deckungsgleiche gepaarte Wandöffnungen verbinden Zonen; unpaarige Außenöffnungen werden mangels validierter Strahlungsränder abgelehnt.

`p(n+1) = 2p(n) − p(n−1) + c² Δt² Σ_axis (p_neighbor−p)/Δx_axis² + source(n)`.

CFL: `c Δt sqrt(Σ 1/Δx²) = 0,9`. Mindestens 10 Zellen pro kürzester modellierter Wellenlänge, maximal 40.000 Zellen und 180 Millionen Zell-Zeitschritte. Frequenz 20–300 Hz, Dauer 0,05–1 s; die Dauer muss den Ricker-Quellpuls abdecken. Positionen werden auf die nächstgelegenen freien Zellzentren abgebildet und als solche im Ergebnis dokumentiert. Konvergenz und voxelbedingte Geometriefehler müssen für die konkrete Aufgabe geprüft werden.

Ausgabe: Empfängerdruck in beliebiger Einheit, normiertes Empfängerspektrum einschließlich Quellpuls, gespeicherte zeitliche Druckfelder mit gemeinsamer Amplitudennormierung. Spektrale Peaks sind keine automatisch bestimmten Eigenmoden. Die Mindest-Spektralauflösung beträgt 1/Dauer. Dieses Modell verwendet **keine Materialdämpfung, Impedanz, absoluten SPL, RT60 oder konstruktionsabhängige Resonatoren**. FDTD und ISM sind noch kein phasenrichtig zusammengeführter wissenschaftlich validierter Breitband-Hybridsolver.

## Messungen und Nachhall

Sabine `T60 = 0,161 V / Σ A α`, Schroeder `f_s = 2000 sqrt(T60/V)` bleiben Diffusfeld-Schätzungen aus Raumgrenzflächen. Möbelabsorption/Verdrängung ist darin nicht vollständig bilanziert. Nach außen offene Hüllen liefern keine geschlossene-Raum-Schätzung; gekoppelte Räume können mehrteiliges Decay besitzen.

Importierte IR: Maximum als **vermuteter** Direktschall, rückwärts integrierte Energie, EDT/T20/T30 mit Mindestpunktzahl, ausreichendem Verlauf, SNR-Indiz und R² ≥0,95. Breitbandig, ohne Rauschkompensation oder automatischen Timingversatz. C50/C80/D50 und Schwerpunktzeit sind aus der gemessenen IR abgeleitet. Hann-STFT mit 1/12-Oktav-Leistungssummen; Pegel relativ zum gemeinsamen Maximum, Zeit ist Fenstermitte im unveränderten Dateizeitbezug. Keine normierte Materialmessung oder automatische Nachweisführung.

Reflexionsabgleich: Zeitfehler innerhalb ±0,5 ms, qualitativ und mehrdeutig. Passende weitere IR-Positionen können zeitliche Konsistenz stützen, wenn Timing und Aufnahmezustand dokumentiert sind. Breitbandige Peakpegel werden nicht fälschlich als einzelbandige Reflexionspegel gleichgesetzt. Keine statistisch kalibrierte Ursachenwahrscheinlichkeit oder aus einem Monosignal sicher bestimmte Einfallsrichtung.
