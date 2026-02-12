import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import schema from "./contract.json"; // Ensure your JSON is saved here
import PageOne from "./PageOne";
import PageTwo from "./PageTwo";
import "./App.css";

function App() {
  // 1. Global State
  const [lang, setLang] = useState("en"); // 'en' or 'fi'
  const [formData, setFormData] = useState({});

  // 2. Helper to extract the specific page object from the JSON contract
  const getPageData = (pageId) => {
    return schema.pages.find((page) => page.id === pageId);
  };

  // 3. Shared handler to collect data from pages as the user progresses
  const handleUpdateData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  return (
    <Router>
      <div className="app-container">
        {/* Language Switcher Header */}
        <header className="app-header">
          <div className="lang-toggle">
            <button 
              className={lang === "en" ? "active" : ""} 
              onClick={() => setLang("en")}
            >
              English
            </button>
            <button 
              className={lang === "fi" ? "active" : ""} 
              onClick={() => setLang("fi")}
            >
              Suomi
            </button>
          </div>
          <p className="campaign-ref">
            ID: {schema.campaignId}
          </p>
        </header>

        <main className="form-content">
          <Routes>
            {/* Pass the specific page configuration, current language, 
                and the data handler to each component.
            */}
            <Route 
              path="/" 
              element={
                <PageOne 
                  data={getPageData("page_identity")} 
                  lang={lang} 
                  onUpdate={handleUpdateData}
                  existingData={formData}
                />
              } 
            />
            <Route 
              path="/page2" 
              element={
                <PageTwo 
                  data={getPageData("page_issue_details")} 
                  lang={lang} 
                  onUpdate={handleUpdateData}
                  existingData={formData}
                />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;