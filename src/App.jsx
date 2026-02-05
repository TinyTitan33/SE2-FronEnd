import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PageOne from "./PageOne";
import PageTwo from "./PageTwo";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PageOne />} />
        <Route path="/page2" element={<PageTwo />} />
      </Routes>
    </Router>
  );
}

export default App;
