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
  download_json: { en: "Download Again", fi: "Lataa Uudelleen" },
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
  const [finalPayload, setFinalPayload] = useState(null); 

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setB2fData(localB2fData);
      setLoading(false);
    }, 600); 
  }, [searchParams]);

  const dynamicPages = b2fData?.pages
    ? [...b2fData.pages].sort((a, b) => a.order_page - b.order_page)
    : [];

  // Remove /confirm, the dynamic pages handle the end now
  const allRoutePaths = ["/", ...dynamicPages.map((p) => `/page/${p.order_page}`)];
  const currentIndex = allRoutePaths.indexOf(location.pathname);
  const currentStep = currentIndex + 1;
  const totalSteps = allRoutePaths.length;
  const progress = isSubmitted ? 100 : currentIndex >= 0 ? (currentStep / totalSteps) * 100 : 0;

  const handleUpdateData = (newData) =>
    setFormData((prev) => ({ ...prev, ...newData }));

  const handleRestart = () => {
    setFormData({});
    setIsSubmitted(false);
    setFinalPayload(null);
    navigate("/");
  };

  const handleFinalSubmit = (lastPageData) => {
    const completeData = { ...formData, ...lastPageData };

    const selectedProduct = b2fData.products.find((p) => p.name.en === completeData.product) || {};
    const productId = selectedProduct.db_id || null;

    const payload = {
      campaign_db_id: b2fData.campaign_db_id,
      first_name: completeData.first_name,
      last_name: completeData.last_name,
      email: completeData.email,
      email_verified: completeData.email_verified || false, 
      product_name: completeData.product,
      product_id: productId,
      flex: []
    };

    let npsData = null;
    let flexOrderCounter = 1; 

    dynamicPages.forEach((page) => {
      [...page.fields]
        .sort((a, b) => a.order_field - b.order_field)
        .forEach((field) => {
          if (field.type === "info") return; 
          
          const key = `p${page.order_page}_f${field.order_field}`;
          
          if (completeData[key] !== undefined) {
            if (field.type === "nps") {
              npsData = {
                nps_question: field.label["en"], 
                nps_value: completeData[key],
                nps_max: 10,
                nps_min: 0
              };
            } else {
              let finalAnswer = completeData[key];

              if (field.options) {
                if (Array.isArray(finalAnswer)) {
                  finalAnswer = finalAnswer.map(val => {
                    const option = field.options.find(opt => opt.value === val);
                    return option ? option.label.en : val;
                  });
                } else {
                  const option = field.options.find(opt => opt.value === finalAnswer);
                  if (option) finalAnswer = option.label.en;
                }
              }

              if (field.type === "number" && finalAnswer !== "" && finalAnswer !== undefined) {
                finalAnswer = Number(finalAnswer);
              }

              payload.flex.push({
                order: flexOrderCounter++, 
                question: field.label["en"],
                answer: finalAnswer
              });
            }
          }
        });
    });

    if (npsData) {
      Object.assign(payload, npsData);
    }

    console.log("F2B Payload:", JSON.stringify(payload, null, 2));
    
    setFinalPayload(payload); 
    
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `f2b_payload_campaign_${b2fData.campaign_db_id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsSubmitted(true);
  };

  const handleDownloadJson = () => {
    if (!finalPayload) return;
    const blob = new Blob([JSON.stringify(finalPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `f2b_payload_campaign_${b2fData.campaign_db_id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFieldDisplay = (key, value) => {
    let label = key;
    let fieldObj = null;
    
    dynamicPages.forEach((page) => {
      const field = page.fields.find(
        (f) => `p${page.order_page}_f${f.order_field}` === key
      );
      if (field) {
        label = field.label[lang];
        fieldObj = field;
      }
    });

    let displayValue = value;

    if (value === "" || value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      displayValue = "—"; 
    } else if (typeof value === "boolean") {
      displayValue = value ? UI_TEXT.yes[lang] : UI_TEXT.no[lang];
    } else if (fieldObj?.type === "rating") {
      displayValue = `${value} / 5`;
    } else if (fieldObj?.type === "nps") {
      displayValue = `${value} / 10`;
    } else if (Array.isArray(value)) {
      if (fieldObj?.options) {
        displayValue = value.map(v => {
          const opt = fieldObj.options.find(o => o.value === v);
          return opt ? opt.label[lang] : v;
        }).join(", ");
      } else {
        displayValue = value.join(", ");
      }
    } else if (fieldObj?.options) {
      const opt = fieldObj.options.find(o => o.value === value);
      if (opt) displayValue = opt.label[lang];
    }

    return { label, value: displayValue };
  };

  const getTotalAnswered = () => {
    const answeredStatic = ["first_name", "last_name", "email", "product"].filter(k => formData[k]).length;
    const answeredDynamic = Object.keys(formData).filter(k => {
      if (!k.match(/^p\d+_f\d+$/)) return false;
      const val = formData[k];
      if (val === "" || val === undefined || val === null) return false;
      if (Array.isArray(val) && val.length === 0) return false;
      
      let isInfo = false;
      dynamicPages.forEach((page) => {
        const field = page.fields.find((f) => `p${page.order_page}_f${f.order_field}` === k);
        if (field && field.type === "info") isInfo = true;
      });
      return !isInfo;
    }).length;
    return answeredStatic + answeredDynamic;
  };

  if (loading)
    return (
      <div className="app-container">
        <div className="form-content spinner-container">
          <div className="spinner"></div>
          <p className="loading-text">{UI_TEXT.loading[lang]}</p>
        </div>
      </div>
    );

  if (!b2fData)
    return (
      <div className="app-container">
        <div className="form-content">{UI_TEXT.error[lang]}</div>
      </div>
    );

  if (isSubmitted) {
    return (
      <div className="success-screen">
        <h1 style={{ color: "#2e7d32" }}>{UI_TEXT.success_title[lang]}</h1>
        <p style={{ fontSize: "1.2em", color: "var(--text-muted)" }}>
          {UI_TEXT.success_msg[lang]}
        </p>

        <div className="success-card">
          <h3 style={{ borderBottom: "2px solid var(--border-light)", paddingBottom: "10px", marginTop: 0 }}>
            {UI_TEXT.summary_title[lang]}
          </h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {["first_name", "last_name", "email", "product"].map(
              (k) =>
                formData[k] && (
                  <li key={k} className="success-item">
                    <strong className="success-key" style={{ textTransform: "capitalize" }}>
                      {k.replace("_", " ")}:
                    </strong>
                    <span className="success-value">{formData[k]}</span>
                  </li>
                )
            )}

            {Object.keys(formData)
              .filter((k) => k.match(/^p\d+_f\d+$/))
              .filter((key) => {
                let isInfo = false;
                dynamicPages.forEach((page) => {
                  const field = page.fields.find((f) => `p${page.order_page}_f${f.order_field}` === key);
                  if (field && field.type === "info") isInfo = true;
                });
                return !isInfo;
              })
              .map((key) => {
                const display = getFieldDisplay(key, formData[key]);
                return (
                  <li key={key} className="success-item">
                    <strong className="success-key">{display.label}:</strong>
                    <span className="success-value">{String(display.value)}</span>
                  </li>
                );
              })}
          </ul>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "15px", margin: "30px auto" }}>
          <button onClick={handleDownloadJson} className="next-button">
            {UI_TEXT.download_json[lang]}
          </button>
          <button onClick={handleRestart} className="back-button">
            {UI_TEXT.restart[lang]}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="lang-toggle">
          <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
          <button className={lang === "fi" ? "active" : ""} onClick={() => setLang("fi")}>FI</button>
        </div>
        <p className="campaign-ref">{UI_TEXT.header_id[lang]}: {b2fData.campaign_db_id}</p>
      </header>

      {currentIndex === 0 && b2fData.intro && (
        <div style={{ textAlign: "center", margin: "0 0 20px 0" }}>
          <h3 style={{ color: "var(--text-main)", margin: 0 }}>{b2fData.intro.title[lang]}</h3>
          <p style={{ color: "var(--text-muted)" }}>{b2fData.intro.description[lang]}</p>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "6px", fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "500" }}>
        <span>{UI_TEXT.step[lang]} {currentStep} {UI_TEXT.of[lang]} {totalSteps}</span>
      </div>

      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>

      <main className="form-content">
        <Routes>
          <Route
            path="/"
            element={<StaticPage products={b2fData.products} lang={lang} onUpdate={handleUpdateData} existingData={formData} nextPath={allRoutePaths[1]} />}
          />

          {dynamicPages.map((page, index) => (
            <Route
              key={page.order_page}
              path={`/page/${page.order_page}`}
              element={
                <DynamicPage
                  pageData={page}
                  allPages={dynamicPages}
                  lang={lang}
                  onUpdate={handleUpdateData}
                  existingData={formData}
                  nextPath={allRoutePaths[index + 2] || null}
                  prevPath={allRoutePaths[index]}
                  isLastPage={index === dynamicPages.length - 1}
                  onSubmit={handleFinalSubmit}
                  getFieldDisplay={getFieldDisplay}
                  getTotalAnswered={getTotalAnswered}
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