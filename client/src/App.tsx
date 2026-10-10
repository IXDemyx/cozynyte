import { Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { useTheme } from "./hooks/useTheme";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import Room from "./pages/Room";

function App() {
  const { theme, toggleTheme } = useTheme();
  // Räume brauchen Platz für drei Spalten (Spieler, Spiel, Chat), die Startseite nicht.
  const wide = useLocation().pathname.startsWith("/r/");
  const width = wide ? "max-w-7xl" : "max-w-5xl";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar theme={theme} onToggleTheme={toggleTheme} width={width} />
      <main className={`mx-auto w-full ${width} flex-1 px-4 pb-16 pt-8 sm:px-6`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/r/:code" element={<Room />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer width={width} />
    </div>
  );
}

export default App;
