import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import StaticPage from "./StaticPage";
import DynamicPage from "./DynamicPage";
import "./App.css";
import localB2fData from "./b2f.json";
const UI_TEXT = {
  header_id: { en: "Campaign ID", fi: "Kampanja ID" },
  step: { en: "Step", fi: "Vaihe" },
  of: { en: "of", fi: "/" },
  success_title: { en: "Thank You!", fi: "Kiitos!" },
  success_msg: { en: "Your submission has been received.", fi: "Vastauksesi on vastaanotettu." },
  summary_title: { en: "Summary", fi: "Yhteenveto" },
  restart: { en: "Submit New Complaint", fi: "Lähetä uusi valitus" },
  loading: { en: "Loading Campaign...", fi: "Ladataan kampanjaa..." },
  error: { en: "Error loading campaign data.", fi: "Virhe ladattaessa kampanjatietoja." },
  yes: { en: "Yes", fi: "Kyllä" },
  no: { en: "No", fi: "Ei" }
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [b2fData, setB2fData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("en");
  const [formData, setFormData] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 1. Fetch campaign schema (safe version with res.ok)
  useEffect(() => {
// 1. Load campaign schema from local JSON
  
    setLoading(true);

    // I added a 600ms fake delay so your audience can actually see 
    // your nice loading spinner during the presentation!
    setTimeout(() => {
      setB2fData(localB2fData);
      setLoading(false);
    }, 600); 

    // Note: If you want it to load instantly with no spinner, 
    // delete the setTimeout wrapper and just use:
    // setB2fData(localB2fData);
    // setLoading(false);

   // const campaignId = searchParams.get("campaignId") || "14";
    // const apiUrl = `/b2fData.json`;
    // setLoading(true);
    // fetch(apiUrl)
    //   .then((res) => {
    //     if (!res.ok) throw new Error("Fetch failed");
    //     return res.json();
    //   })
    //   .then((data) => {
    //     setB2fData(data);
    //     setLoading(false);
    //   })
    //   .catch((err) => {
    //     console.error("Fetch error:", err);
    //     setLoading(false);
    //   });
  }, [searchParams]);

  // 2. Routing and step calculation
  const dynamicPages = b2fData?.pages
    ? [...b2fData.pages].sort((a, b) => a.order_page - b.order_page)
    : [];

  const allRoutePaths = ["/", ...dynamicPages.map((p) => `/page/${p.order_page}`)];
  const currentIndex = allRoutePaths.indexOf(location.pathname);
  const currentStep = currentIndex + 1;
  const totalSteps = allRoutePaths.length;
  const progress = isSubmitted ? 100 : currentIndex >= 0 ? (currentStep / totalSteps) * 100 : 0;

  const handleUpdateData = (newData) =>
    setFormData((prev) => ({ ...prev, ...newData }));

  // Clean restart handler (from Version 1)
  const handleRestart = () => {
    setFormData({});
    setIsSubmitted(false);
    navigate("/");
  };

  // 3. Final payload construction (merged version)
  const handleFinalSubmit = (lastPageData) => {
    const completeData = { ...formData, ...lastPageData };

    const payload = {
      campaign_db_id: b2fData.campaign_db_id,
      fix: [
        { ident: "first_name", question: "First Name", answer: completeData.first_name },
        { ident: "last_name", question: "Last Name", answer: completeData.last_name },
        { ident: "email", question: "Email Address", answer: completeData.email },
        { ident: "product", question: "Purchased Product", answer: completeData.product }
      ],
      flex: []
    };

    dynamicPages.forEach((page) => {
      [...page.fields]
        .sort((a, b) => a.order_field - b.order_field)
        .forEach((field) => {
          if (field.type === "info") return;
          const key = `p${page.order_page}_f${field.order_field}`;
          if (completeData[key] !== undefined) {
            payload.flex.push({
              order: field.order_field,
              question: field.label["en"],
              answer: completeData[key]
            });
          }
        });
    });

    console.log("F2B Payload:", payload);
    setIsSubmitted(true);
  };

  // Helper for summary display
  const getFieldDisplay = (key, value) => {
    if (typeof value === "boolean") return value ? UI_TEXT.yes[lang] : UI_TEXT.no[lang];
    if (Array.isArray(value)) return value.join(", ");

    let label = key;
    dynamicPages.forEach((page) => {
      const field = page.fields.find(
        (f) => `p${page.order_page}_f${f.order_field}` === key
      );
      if (field) label = field.label[lang];
    });

    return { label, value };
  };

  // Loading state
  if (loading)
    return (
      <div className="app-container">
        <div className="form-content spinner-container">
          <div className="spinner"></div>
          <p className="loading-text">{UI_TEXT.loading[lang]}</p>
        </div>
      </div>
    );

  // Error state
  if (!b2fData)
    return (
      <div className="app-container">
        <div className="form-content">{UI_TEXT.error[lang]}</div>
      </div>
    );

  // Success screen
  if (isSubmitted) {
    return (
      <div className="success-screen">
        <h1 style={{ color: "#2e7d32" }}>{UI_TEXT.success_title[lang]}</h1>
        <p style={{ fontSize: "1.2em", color: "var(--text-muted)" }}>
          {UI_TEXT.success_msg[lang]}
        </p>

        <div className="success-card">
          <h3
            style={{
              borderBottom: "2px solid var(--border-light)",
              paddingBottom: "10px",
              marginTop: 0
            }}
          >
            {UI_TEXT.summary_title[lang]}
          </h3>

          <ul style={{ listStyle: "none", padding: 0 }}>
            {["first_name", "last_name", "email", "product"].map(
              (k) =>
                formData[k] && (
                  <li key={k} className="success-item">
                    <strong
                      className="success-key"
                      style={{ textTransform: "capitalize" }}
                    >
                      {k.replace("_", " ")}:
                    </strong>
                    <span className="success-value">{formData[k]}</span>
                  </li>
                )
            )}

            {Object.keys(formData)
              .filter((k) => k.startsWith("p"))
              .map((key) => {
                const display = getFieldDisplay(key, formData[key]);
                return (
                  <li key={key} className="success-item">
                    <strong className="success-key">{display.label}:</strong>
                    <span className="success-value">
                      {String(display.value)}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>

        <button
          onClick={handleRestart}
          className="next-button"
          style={{ margin: "20px auto", display: "block" }}
        >
          {UI_TEXT.restart[lang]}
        </button>
      </div>
    );
  }

  // Main form UI
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="lang-toggle">
          <button
            className={lang === "en" ? "active" : ""}
            onClick={() => setLang("en")}
          >
            EN
          </button>
          <button
            className={lang === "fi" ? "active" : ""}
            onClick={() => setLang("fi")}
          >
            FI
          </button>
        </div>

        <p className="campaign-ref">
          {UI_TEXT.header_id[lang]}: {b2fData.campaign_db_id}
        </p>
      </header>

      {currentIndex === 0 && b2fData.intro && (
        <div style={{ textAlign: "center", margin: "0 0 20px 0" }}>
          <h3 style={{ color: "var(--text-main)", margin: 0 }}>
            {b2fData.intro.title[lang]}
          </h3>
          <p style={{ color: "var(--text-muted)" }}>
            {b2fData.intro.description[lang]}
          </p>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "6px",
          fontSize: "0.9rem",
          color: "var(--text-muted)",
          fontWeight: "500"
        }}
      >
        <span>
          {UI_TEXT.step[lang]} {currentStep} {UI_TEXT.of[lang]} {totalSteps}
        </span>
      </div>

      <div className="progress-container">
        <div
          className="progress-bar"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <main className="form-content">
        <Routes>
          <Route
            path="/"
            element={
              <StaticPage
                products={b2fData.products}
                lang={lang}
                onUpdate={handleUpdateData}
                existingData={formData}
                nextPath={allRoutePaths[1]}
              />
            }
          />

          {dynamicPages.map((page, index) => (
            <Route
              key={page.order_page}
              path={`/page/${page.order_page}`}
              element={
                <DynamicPage
                  pageData={page}
                  lang={lang}
                  onUpdate={handleUpdateData}
                  existingData={formData}
                  nextPath={allRoutePaths[index + 2] || null}
                  prevPath={allRoutePaths[index]}
                  isLastPage={index === dynamicPages.length - 1}
                  onSubmit={handleFinalSubmit}
                />
              }
            />
          ))}
        </Routes>
      </main>
    </div>
  );
}

export default App;
