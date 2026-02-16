import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import schema from "./contract.json"; 
import DynamicPage from "./DynamicPage"; 
import "./App.css";

// Centralized UI Translations
const UI_TEXT = {
  header_id: { en: "ID", fi: "Tunniste" },
  greeting: { en: "Dear customer, please fill this form", fi: "Hyvä asiakas, täytä tämä lomake" },
  step: { en: "Step", fi: "Vaihe" },
  of: { en: "of", fi: "/" },
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

  const handleRestart = () => {
    setFormData({});
    setIsSubmitted(false);
  };

  return (
    <Router>
      <AppContent 
        lang={lang} 
        setLang={setLang} 
        formData={formData} 
        onUpdate={handleUpdateData} 
        onSubmit={handleFinalSubmit}
        onRestart={handleRestart}
        isSubmitted={isSubmitted}
      />
    </Router>
  );
}

function AppContent({ lang, setLang, formData, onUpdate, onSubmit, onRestart, isSubmitted }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. Sort pages based on order
  const pages = schema.pages ? [...schema.pages].sort((a, b) => a.order - b.order) : [];

  // 2. Map routes
  const pageRoutes = pages.map((page, index) => {
    if (index === 0) return "/";
    return `/page/${page.id}`;
  });
  
  // 3. Calculate Step Count
  const currentPath = location.pathname;
  const currentPageIndex = pageRoutes.indexOf(currentPath);
  
  const currentStep = currentPageIndex + 1;
  const totalSteps = pages.length;

  const progress = isSubmitted 
    ? 100 
    : (currentPageIndex >= 0 ? ((currentPageIndex + 1) / pages.length) * 100 : 0);

  // --- Success Screen Logic ---
  if (isSubmitted) {
    const getDisplayValue = (key, value) => {
      let fieldDef = null;
      for (const p of pages) {
        const found = p.fields.find(f => f.id === key);
        if (found) { fieldDef = found; break; }
      }
      if (!fieldDef) return value; 

      if (typeof value === "boolean" || fieldDef.type === "checkbox") {
        return value ? UI_TEXT.yes[lang] : UI_TEXT.no[lang];
      }

      if (fieldDef.options) {
        if (Array.isArray(value)) {
           return value.map(v => {
             const opt = fieldDef.options.find(o => o.value === v);
             return opt ? opt.label[lang] : v;
           }).join(", ");
        }
        const opt = fieldDef.options.find(o => o.value === value);
        return opt ? opt.label[lang] : value;
      }
      return value;
    };

    return (
      <div className="success-screen">
        <h1 style={{ color: '#2e7d32' }}>{UI_TEXT.success_title[lang]}</h1>
        <p style={{ fontSize: '1.2em', color: 'var(--text-muted)' }}>{UI_TEXT.success_msg[lang]}</p>
        
        <div className="success-card">
          <h3 style={{ borderBottom: '2px solid var(--border-light)', paddingBottom: '10px', marginTop: 0 }}>
            {UI_TEXT.summary_title[lang]}
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {Object.entries(formData).map(([key, value]) => {
              if (value === "" || value === null || value === undefined) return null;
              return (
                <li key={key} className="success-item">
                  <strong className="success-key" style={{ textTransform: 'capitalize', marginRight: '10px' }}>
                    {key.replace(/_/g, ' ')}:
                  </strong>
                  <span className="success-value" style={{ textAlign: 'right' }}>
                    {getDisplayValue(key, value)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <button 
          onClick={() => { onRestart(); navigate("/"); }} 
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

      <h3 style={{ textAlign: 'center', margin: '0 0 20px 0', color: 'var(--text-main)' }}>
        {UI_TEXT.greeting[lang]}
      </h3>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        marginBottom: '6px', 
        fontSize: '0.9rem', 
        color: 'var(--text-muted)', 
        fontWeight: '500' 
      }}>
        <span>
          {UI_TEXT.step[lang]} {currentStep} {UI_TEXT.of[lang]} {totalSteps}
        </span>
      </div>

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

            return (
              <Route
                key={page.id}
                path={thisPath}
                element={
                  <DynamicPage
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