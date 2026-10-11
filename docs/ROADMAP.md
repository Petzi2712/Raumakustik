# Umfang und weitere Umsetzung des Masterprompts

Der gesamte Masterprompt ist in MASTERPROMPT.txt erhalten. Version 0.1 ist ein installierbares Fundament; folgende wesentliche Arbeiten sind offen:

| Bereich | v0.1 | Weitere Arbeit |
|---|---|---|
| Geometrie | Metrischer Rechteckraum, Quellen/Mikrofone | Polygone, geneigte Wände/Decken, Nischen, Möbel, Türen/Fenster, Meshes, gemeinsame Geometrie für Ray/Wave-Solver |
| Materialien | α/s/Transmission pro Oktavband | Impedanz, Winkelabhängigkeit, Schichten, Dicke/Luftspalt, Unsicherheit, resonante Absorber |
| Luft / Quellen | Temperatur, Position, Delay, Polarität | Feuchte-/Druckkorrektur, Luftabsorption, Richtwirkung, Phase/FR, Crossover/DSP |
| Messungen | FR/Text-IR/WAV, Zuordnung, Dokumentationsscore | Komplettes Metadatenschema, Drift/Sweep/SNR-Prüfung, REW-API-Kurven/IR/RT60/Filter, optional MDAT |
| Physik | Eigenmoden, Image Source Ordnung 1/2, SBIR | FEM/FDTD oder kalibrierte Modalüberlagerung, höhere Ordnungen, Ray/Beam Tracing, diffuse Energie, Beugung |
| Analyse | Breitband EDT/T20/T30/C50/C80/D50/Ts, Phase/Group Delay | Band-ETC, Minimum/Excess Phase, Waterfall, Spectrogram, modal decay/Q, Symmetrie/Mehrpunktvariation |
| Zuordnung | Zeitkandidaten mit heuristischer Rangfolge | Pegel-/Spektralvergleich, Mehrpunktkonsistenz, Direction of Arrival, kalibrierte Confidence |
| Visualisierung | Freie/orthogonale/Hörer-Kamera, Modenfeld, Pfade, Laufzeitmarker | Schnittansichten, Möbel, diffuse/wellenbasierte Zeitfelder, Problemflächen |
| Optimierung | Keine automatischen Maßnahmen | Mehrpunkt-Zielmodelle, 3D-Gütekarten, Quellen/Sub/Seat-Suche, Delay/Crossover, Vorher/Nachher, physische Maßnahmen vor EQ |
| Validierung | Analytische Referenztests, Import-/Bedienungstests | Messdatensätze mit Ground Truth, Kalibrierungs-/Validierungssplit, gesamte IR/FR/Phase/Decay-Vergleiche |
| Material-Inversion | Nicht enthalten | Beschränkte Mehrpunkt-Optimierung mit Unsicherheitsintervallen und separater Validierung |
| Produkt | NSIS, lokale Projektdateien, KI, Updater | Signierter Installer, echter Windows-Funktionstest, zwei veröffentlichte Versionen für Update-End-to-End-Test |

Numerische Solver werden lokal oder auf einem gesonderten Compute-Dienst ausgeführt. ChatGPT-Konten stellen keine universelle wissenschaftliche Rechen-API oder automatisch nutzbare API-Schlüssel zur Verfügung. KI darf Solver-Ergebnisse interpretieren, deren Gültigkeit aber nicht vortäuschen.
