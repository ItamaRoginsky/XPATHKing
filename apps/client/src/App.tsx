import { HashRouter, Routes, Route } from "react-router-dom";
import { MainMenu } from "./routes/MainMenu";
import { PracticeHome } from "./routes/PracticeHome";
import { Tutorial } from "./routes/Tutorial";
import { PracticeSession } from "./routes/PracticeSession";
import { DuelHome } from "./routes/DuelHome";
import { HowToPlay } from "./routes/HowToPlay";
import { Stats } from "./routes/Stats";
import { Settings } from "./routes/Settings";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/practice" element={<PracticeHome />} />
        <Route path="/practice/tutorial" element={<Tutorial />} />
        <Route path="/practice/session" element={<PracticeSession />} />
        <Route path="/duel" element={<DuelHome />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  );
}
