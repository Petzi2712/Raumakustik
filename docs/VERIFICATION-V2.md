# Verifikation 0.2.0

15.10.2026, Linux-Cloud-Umgebung; Fortsetzung der in VERIFICATION.md dokumentierten Basisprüfung.

- 45 deterministische Referenztests: Quader/L/U/T/Nische/Kreis, variable Höhen, Wandschnitte/Öffnungen, gekoppelte Zonen, Reflexionsgesetz/Sichtbarkeit, Migration, Plan/Sweeps/Freigabe, Datenherkunft, Szenarien und schreibgeschützte KI-Werkzeuge.
- FDTD gegen eine analytisch bekannte starre Quader-Eigenmode und die diskrete Dispersionsrelation geprüft; zusätzlich freier L-Raum und Rechenbudget. Das bestätigt keine dissipativen Materialränder oder empirische Übereinstimmung mit einem realen Raum.
- STFT gegen eine synthetische 1-kHz-Schwingung geprüft; log-Frequenzbänder summieren FFT-Leistung, damit schmale Peaks nicht zwischen Stützstellen verschwinden.
- Browserintegration: Grundfunktionen, 9 Punkte/18 Sweeps, CSV, Freigabe, FR/IR-Aufgabenzuordnung, L-Raum-Editor, Wandteilen/Undo, FDTD-Feld, Projektspeicherung und Szenarioansicht. Keine JavaScript-Fehler.
- Electron über produktives file://: isolierter Renderer, Projektdateien, Browser-/Clipboard-Handoff, lokale REW-Fixture, API-Anfragevertrag, echter PDF-Bytestrom und simuliertes Responses-Function-Calling mit freizugebendem Bewegungsszenario. Kein echter API-Key und keine kostenpflichtige Anfrage.
- Gepackte Linux-Anwendung: produktive ASAR-Oberfläche und dynamische ES-Modul-Imports der KI-Rechenwerkzeuge mit simuliertem Responses-Aufruf erfolgreich geprüft (`scripts/smoke-packaged.mjs`).
- Laufzeitabhängigkeiten: `npm audit --omit=dev`, 0 gemeldete Befunde.
- Windows-Build und GitHub-Release werden im Windows-Workflow erstellt. Ein erfolgreich gebauter Installer ist kein Nachweis einer praktisch getesteten Windows-Installation oder eines interaktiven Updates.

Noch offen: reale REW-Version/API, reale Referenzmessungen, Windows-Installieren/Deinstallieren/DPAPI/Upgrade, Signaturvertrauen und der vollständige wissenschaftliche Abnahmekatalog. Der Materialkatalog enthält keine als Labormessung ausgegebenen Schätzwerte. Details der verbleibenden Produktfunktionen: ROADMAP.md.
