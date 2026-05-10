import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import InputPage from "./pages/InputPage";
import ResultPage from "./pages/ResultPage";
import ChatbotPage from "./pages/ChatbotPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InputPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/chat" element={<ChatbotPage />} />
      </Routes>
    </Router>
  );
}

export default App;