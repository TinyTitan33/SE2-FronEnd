import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import schema from "./contract.json";
import PageOne from "./PageOne";
import PageTwo from "./PageTwo";
import "./App.css";

// Centralized UI Translations
const UI_TEXT = {
  header_id: { en: "ID", fi: "Tunniste" },
  success_title: { en: "Thank You!", fi: "Kiitos!" },
  success_msg: { en: "Your complaint has been received.", fi: "Valituksesi on vastaanotettu." },
  summary_title: { en: "Summary", fi: "Yhteenveto" },
  restart: { en: "Submit New Complaint", fi: "Lähetä uusi valitus" },
  yes: { en: "Yes", fi: "Kyllä" },
  no: { en: "No", fi: "Ei" }
};

function App() {
  const [lang, setLang] = useState("en");
  const [formData, setFormData] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleUpdateData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const handleFinalSubmit = (finalData) => {
    const completePayload = { ...formData, ...finalData };
    console.log("Submitting:", completePayload);
    setIsSubmitted(true);
  };

  return (
    <Router>
      <AppContent 
        lang={lang} 
        setLang={setLang} 
        formData={formData} 
        onUpdate={handleUpdateData} 
        onSubmit={handleFinalSubmit}
        isSubmitted={isSubmitted}
      />
    </Router>
  );
}

function AppContent({ lang, setLang, formData, onUpdate, onSubmit, isSubmitted }) {
  const location = useLocation();
  
  // Sort pages securely based on order
  const pages = schema.pages ? [...schema.pages].sort((a, b) => a.order - b.order) : [];

  // Map routes
  const pageRoutes = pages.map(page => {
    if (page.id === "page_identity") return "/";
    if (page.id === "page_issue_details") return "/page2"; // Legacy support for PageOne
    return `/page/${page.id}`;
  });
  
  // Calculate Progress
  const currentPath = location.pathname;
  const currentPageIndex = pageRoutes.indexOf(currentPath);
  const progress = currentPageIndex >= 0 
    ? ((currentPageIndex + 1) / pages.length) * 100 
    : 100;

  // --- Success Screen Logic ---
  if (isSubmitted) {
    // Helper: Translate internal values (e.g. "toaster") to readable labels (e.g. "Toaster")
    const getDisplayValue = (key, value) => {
      // 1. Find the field definition in the schema
      let fieldDef = null;
      for (const p of pages) {
        const found = p.fields.find(f => f.id === key);
        if (found) {
          fieldDef = found;
          break;
        }
      }

      if (!fieldDef) return value; // Fallback if field not found

      // 2. Handle Booleans (Checkbox/Radio "Yes/No")
      if (typeof value === "boolean" || fieldDef.type === "checkbox") {
        return value ? UI_TEXT.yes[lang] : UI_TEXT.no[lang];
      }

      // 3. Handle Options (Dropdowns/Radios)
      if (fieldDef.options) {
        // If it's an array (MultiSelect), map all values
        if (Array.isArray(value)) {
           return value.map(v => {
             const opt = fieldDef.options.find(o => o.value === v);
             return opt ? opt.label[lang] : v;
           }).join(", ");
        }
        // Single value
        const opt = fieldDef.options.find(o => o.value === value);
        return opt ? opt.label[lang] : value;
      }

      return value;
    };

    return (
      <div className="success-screen">
        <h1 style={{ color: '#2e7d32' }}>{UI_TEXT.success_title[lang]}</h1>
        <p style={{ fontSize: '1.2em' }}>{UI_TEXT.success_msg[lang]}</p>
        
        <div style={{
          textAlign: 'left', 
          background: 'white', 
          padding: '25px', 
          margin: '20px auto', 
          borderRadius: '8px',
          maxWidth: '500px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            borderBottom: '2px solid #eee', 
            paddingBottom: '10px', 
            marginTop: 0,
            color: '#333'
          }}>
            {UI_TEXT.summary_title[lang]}
          </h3>
          
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {Object.entries(formData).map(([key, value]) => {
              if (value === "" || value === null || value === undefined) return null;
              return (
                <li key={key} style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '10px 0', 
                  borderBottom: '1px solid #f9f9f9'
                }}>
                  <strong style={{ textTransform: 'capitalize', color: '#555', marginRight: '10px' }}>
                    {key.replace(/_/g, ' ')}:
                  </strong>
                  <span style={{ fontWeight: '500', color: '#000', textAlign: 'right' }}>
                    {getDisplayValue(key, value)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '12px 24px', 
            background: '#2e7d32', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: 'bold',
            marginTop: '10px'
          }}
        >
          {UI_TEXT.restart[lang]}
        </button>
      </div>
    );
  }

  // --- Main Form Render ---
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="lang-toggle">
          <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
          <button className={lang === "fi" ? "active" : ""} onClick={() => setLang("fi")}>FI</button>
        </div>
        <p className="campaign-ref">
            {UI_TEXT.header_id[lang]}: {schema.campaignId}
        </p>
      </header>

      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>

      <main className="form-content">
        <Routes>
          {pages.map((page, index) => {
            const thisPath = pageRoutes[index];
            const nextPath = index < pages.length - 1 ? pageRoutes[index + 1] : null;
            const prevPath = index > 0 ? pageRoutes[index - 1] : null;
            const isLastPage = index === pages.length - 1;

            if (page.id === "page_identity") {
              return (
                <Route
                  key={page.id}
                  path="/"
                  element={
                    <PageOne
                      data={page}
                      lang={lang}
                      onUpdate={onUpdate}
                      existingData={formData}
                    />
                  }
                />
              );
            }

            return (
              <Route
                key={page.id}
                path={thisPath}
                element={
                  <PageTwo
                    data={page}
                    lang={lang}
                    onUpdate={onUpdate}
                    existingData={formData}
                    nextPath={nextPath}
                    prevPath={prevPath}
                    isLastPage={isLastPage}
                    onSubmit={onSubmit}
                  />
                }
              />
            );
          })}
        </Routes>
      </main>
    </div>
  );
}

export default App;