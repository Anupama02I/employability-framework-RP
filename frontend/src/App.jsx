import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import InputPage from "./pages/InputPage";
import ChatbotPage from "./pages/ChatbotPage";


function App() {

  return (

    <Router>

      <Routes>

        {/* Conversational employability assessment */}
        <Route
          path="/"
          element={<InputPage />}
        />


        {/* Assessment result + career guidance chatbot */}
        <Route
          path="/chat"
          element={<ChatbotPage />}
        />


        {/* Redirect unknown URLs back to assessment */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </Router>
  );
}

export default App;