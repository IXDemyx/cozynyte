# Quellen der Quiz-Daten

## Flaggen (`flags/`)

Aus [flag-icons](https://github.com/lipis/flag-icons) von Panayiotis Lipiridis, MIT-Lizenz:

> The MIT License (MIT)
>
> Copyright (c) 2013 Panayiotis Lipiridis
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software
> and associated documentation files (the "Software"), to deal in the Software without
> restriction, including without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
> Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or
> substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
> BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
> NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
> DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Landesumrisse (`outlines.json`)

Erzeugt aus [Natural Earth](https://www.naturalearthdata.com/) (Admin 0 – Countries, 1:10m),
gemeinfrei (public domain). Jedes Land ist flächentreu (Lambert azimutal) um seine Mitte
projiziert, vereinfacht und auf 1000 Einheiten skaliert. Weit entfernte Überseegebiete sind
weggelassen, damit die bekannte Form gut zu erkennen ist.

## Flagge des Tages (`flag-grids.json`, `flag-centers.json`)

`flag-grids.json` ist aus den Flaggen oben berechnet (`scripts/flag-grids.mjs`): jede Flagge auf
64 × 48 Zellen, je Zelle die häufigste Farbe aus einer kleinen Palette.

`flag-centers.json`: Mittelpunkt jedes Landes (Breite, Länge) für Entfernung und Richtung – die
Beschriftungspunkte (`LABEL_Y`, `LABEL_X`) aus [Natural Earth](https://www.naturalearthdata.com/)
(Admin 0 – Countries, 1:50m), gemeinfrei (public domain). Sie liegen im Kernland, nicht auf
Überseegebieten.
