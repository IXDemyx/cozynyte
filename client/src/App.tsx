import { useEffect, useLayoutEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { useTheme } from "./hooks/useTheme";
import { ExtraWideContext } from "./lib/pageWidth";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import Room from "./pages/Room";

function App() {
  const { theme, toggleTheme, palette, togglePalette } = useTheme();
  // Räume brauchen Platz für drei Spalten (Spieler, Spiel, Chat), die Startseite nicht.
  // Montagsmaler-Runden dürfen noch breiter werden – für eine größere Zeichenfläche.
  const { pathname } = useLocation();
  const wide = pathname.startsWith("/r/");
  const [extraWide, setExtraWide] = useState(false);
  const width = !wide ? "max-w-5xl" : extraWide ? "max-w-[100rem]" : "max-w-7xl";

  // Beim Neuladen nicht die alte Scrollposition wiederherstellen: Der Browser setzt sie, solange
  // noch das vorgerenderte HTML dasteht – nach dem Wechsel auf die echte Seite stimmt sie nicht mehr.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }, []);

  // Neue Seite (z. B. aus dem Raum zurück zur Startseite oder DE ↔ EN) beginnt oben.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <ExtraWideContext.Provider value={setExtraWide}>
      <div className="flex min-h-screen flex-col">
        <Navbar
          theme={theme}
          onToggleTheme={toggleTheme}
          palette={palette}
          onTogglePalette={togglePalette}
          width={width}
        />
        <main className={`mx-auto w-full ${width} flex-1 px-4 pb-16 pt-8 sm:px-6`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/en" element={<Home />} />
            <Route path="/r/:code" element={<Room />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer width={width} />
      </div>
    </ExtraWideContext.Provider>
  );
}

export default App;
