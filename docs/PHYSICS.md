# Rechenmodell und Aussagegrenzen v0.1

Alle Längen in Metern, Frequenzen in Hz, Laufzeiten im Datenmodell in ms, Text-IR-Zeiten intern in Sekunden.

## Moden

`f(p,q,r) = c/2 sqrt((p/X)^2 + (q/Y)^2 + (r/Z)^2)` mit nichtnegativen ganzen Indizes, mindestens einer ungleich null. Eine/zwei/drei aktive Achsen ergeben axiale/tangentiale/oblique Eigenmoden. Starre Grenzflächen: `P(x,y,z) = cos(pπx/X) cos(qπy/Y) cos(rπz/Z)`. Quell- und Empfängerfaktoren werden multipliziert. Das visualisierte Feld ist normiert und enthält keine zeitliche oder frequenzabhängige Modenüberlagerung. Kein absoluter SPL, keine Dämpfung und kein Q ohne belastbare Messung.

Trockene-Luft-Näherung: `c = 331.3 sqrt(1 + T/273.15)`. Relative Feuchte und Luftdruck werden gespeichert, sind noch nicht in Schallgeschwindigkeit oder Luftabsorption umgesetzt. Parameterlimits schützen vor ungültigen Geometrien und unbegrenzter Rechenlast: Abmessungen 1–30 m, Temperatur −10–40 °C, Moden bis 200 Hz.

## Reflexionen

Sechs begrenzte ebene Raumflächen. Quellspiegelung entlang jeder zulässigen Sequenz bis Ordnung 2; Rückverfolgung der Schnittpunkte vom Empfänger; Pfade außerhalb der Flächen oder mit degenerierten Ecktreffern werden ausgeschlossen. Normale und tangentiale Komponenten erfüllen das Reflexionsgesetz. Laufzeit = Gesamtweg/c plus Quell-Delay; relative Verzögerung = Wegdifferenz/c.

Pegel relativ zum direkten Pfad:

`20 log10[(direkter Weg / Gesamtweg) × Produkt(sqrt(1−α−τ) sqrt(1−s))]`.

α ist Energieabsorption, τ Energietransmission, s Streuung des verbleibenden spekularen Anteils. Parameter werden zwischen 125/250/500/1000/2000/4000 Hz logarithmisch interpoliert; außerhalb konstant. Keine Luftabsorption, komplexe Reflexionsphase, Quellendirektivität, Möbelabschattung, Beugung oder diffuse Energie. Die ausgegebene Phase ist nur die geometrische Laufzeitphase plus Quellpolarität, kein Materialphasenmodell.

SBIR-Nullstellen `f_n=(2n+1)c/(2 Δd)` sind ideale Kandidaten bei gleicher Reflexionsphase. Reflexionspegel und komplexe Materialphase bestimmen tatsächliche Nulltiefe und Lage. Eine mehrfache Reflexion wird als einzelner idealisierter Interferenzkandidat behandelt; alle Pfade werden noch nicht zu einem vollständigen komplexen Übertragungsmodell summiert.

## Statistischer Nachhall

`T60 = 0.161 V / Σ(S_i α_i)` (Sabine), `f_s = 2000 sqrt(T60/V)`. Sabine setzt ein näherungsweise diffuses Feld voraus; bei niedrigen Frequenzen, hoher Absorption oder stark ungleichmäßigen Materialien eingeschränkt. Keine unabhängige Validierung durch eine Messung. Bei null Absorptionsfläche wird „nicht berechenbar“ angezeigt, kein erfundener endlicher Nachhall.

## Messdatenanalyse

Das IR-Maximum ist ein **angenommener**, nicht nachgewiesener Direktschallbeginn. WAV speichert die REW-Timingreferenz nicht; diese wird nicht rekonstruiert. C50/C80 und D50 starten am IR-Maximum. Schwerpunktzeit Ts ist der energieschwerpunktbezogene Zeitpunkt ab diesem Maximum. Energy Time Curve wird nicht als Hilbert-Hüllkurve behauptet; angezeigt werden lineare IR und integrierte Abklingkurve.

Rückwärtsintegration des quadrierten IR-Signals ergibt die breitbandige Schroeder-Kurve. EDT fit 0…−10 dB, T20 −5…−25 dB, T30 −5…−35 dB; Extrapolation auf 60 dB. Mindestens 10 Fitpunkte, R² ≥ 0.95, ausreichend geschätzter Dynamikbereich (20/35/45 dB), kein Fit im letzten Zehntel der Datei. Fits können trotz dieser Filter durch unpassendes Fenster oder Rauschen verfälscht sein: keine automatische Lundeby-Korrektur und keine bandbegrenzten RT60-Werte. Ein fehlender Fit wird als „—“ ausgegeben. SNR ist Peakenergie relativ zur mittleren Energie der letzten 10 % der IR, ein Indiz, keine normgerechte Hintergrundrauschmessung.

Phase wird durch ±360° entrollt. Group Delay = `−(1/360) dφ/df` (Sekunden), numerisch aus Nachbarpunkten. Große Abstände oder falsch referenzierte Phasen können die Ableitung verfälschen.

## Evidenz

- **Measured:** importierte Datenwerte, unabhängig von ihrer unbekannten Kalibrierung.
- **Calculated:** analytische Modelle oder Kennwerte aus Messdaten. Voraussetzungen explizit benennen; keine erfundene statistische Confidence für deterministische Formeln.
- **Inferred:** Reflexionszuordnung, Dokumentationsscore und KI-Interpretation.

Reflexionspeaks werden relativ zum IR-Maximum bis 100 ms mit lokaler Spitzenprüfung gesucht. Pfade werden nur bei passender Quell-/Empfängerzuordnung verglichen. Kandidaten innerhalb ±0.5 ms erhalten eine heuristische Rangfolge bis 60/100. Weder Pegel-/Spektralübereinstimmung noch Mehrpunktkonsistenz werden eingerechnet. Mehrere Kandidaten bleiben sichtbar; die Zahlen sind keine Wahrscheinlichkeit und kein Nachweis der verursachenden Fläche.

Der Dokumentationsscore zählt bekannte Metadaten; ein gutes Ergebnis kann eine schlechte Messung nicht zertifizieren. WAV-Vollaussteuerung ist nur ein Clipping-Indiz. Text-Normalisierung erlaubt keine Clipping-Aussage.

Profile lenken den Analysefokus. Es gibt keine vollständig implementierte ITU-R-BS.1116-Prüfung und keine einheitlichen Zielwerte für Regieraum und Konzertsaal.
