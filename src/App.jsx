import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import StaticPage from "./StaticPage";
import DynamicPage from "./DynamicPage";
import "./App.css";

const UI_TEXT = {
  header_id: { en: "Campaign ID", fi: "Kampanja ID" },
  step: { en: "Step", fi: "Vaihe" },
  of: { en: "of", fi: "/" },
  success_title: { en: "Thank You!", fi: "Kiitos!" },
  success_msg: { en: "Your submission has been received.", fi: "Vastauksesi on vastaanotettu." },
  summary_title: { en: "Summary", fi: "Yhteenveto" },
  restart: { en: "Submit New Complaint", fi: "Lähetä uusi valitus" },
  download_json: { en: "Download Backup", fi: "Lataa Varmuuskopio" },
  loading: { en: "Loading Campaign...", fi: "Ladataan kampanjaa..." },
  submitting: { en: "Submitting...", fi: "Lähetetään..." },
  error: { en: "Error loading campaign data.", fi: "Virhe ladattaessa kampanjatietoja." },
  yes: { en: "Yes", fi: "Kyllä" },
  no: { en: "No", fi: "Ei" },
  first_name: { en: "First Name", fi: "Etunimi" },
  last_name: { en: "Last Name", fi: "Sukunimi" },
  email: { en: "Email Address", fi: "Sähköpostiosoite" },
  product: { en: "Product", fi: "Tuote" }
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lang, setLang] = useState("en");
  const [formData, setFormData] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalPayload, setFinalPayload] = useState(null); 
  const [campaignDbId, setCampaignDbId] = useState(null);
  
  useEffect(() => {
    const fetchCampaignData = async () => {

      // First, we try to get the ID from the URL.
      let campaignId = searchParams.get("campaignId");
      
      // If it is not in the URL, we attempt to retrieve it from localStorage.
      if (!campaignId) {
        campaignId = localStorage.getItem("campaignDbId");
      }
      
      // If still no, save the current state
      if (!campaignId && campaignDbId) {
        campaignId = campaignDbId;
      }
      
      if (!campaignId) {
        console.error("No campaignId found");
        setLoading(false);
        return;
      }
      
      // Save to localStorage and status
      localStorage.setItem("campaignDbId", campaignId);
      setCampaignDbId(campaignId);
      
      setLoading(true);
      try {
        const endpoint = `http://10.150.0.101:5678/webhook/get-campaign?campaignId=${campaignId}`;
        
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setB2fData(data);
      } catch (error) {
        console.error("Error fetching campaign data:", error);
        setB2fData(null); 
      } finally {
        setLoading(false);
      }
    };
    fetchCampaignData();
  }, [searchParams]);

  const dynamicPages = b2fData?.pages
    ? [...b2fData.pages].sort((a, b) => a.order_page - b.order_page)
    : [];

  const allRoutePaths = ["/", ...dynamicPages.map((p) => `/page/${p.order_page}`)];
  const currentIndex = allRoutePaths.indexOf(location.pathname);
  const currentStep = currentIndex + 1;
  const totalSteps = allRoutePaths.length;
  const progress = isSubmitted ? 100 : currentIndex >= 0 ? (currentStep / totalSteps) * 100 : 0;

  const handleUpdateData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const handleRestart = () => {
    setFormData({});
    setIsSubmitted(false);
    setFinalPayload(null);
    localStorage.removeItem("campaignDbId"); // Clear the saved ID
    navigate("/");
  };

  const handleFinalSubmit = async (lastPageData) => {
    setIsSubmitting(true);
    const completeData = { ...formData, ...lastPageData };
    
    const selectedProduct = b2fData.products.find((p) => p.name.en === completeData.product) || {};
    const productId = selectedProduct.db_id || null;

    const payload = {
      campaign_db_id: Number(campaignDbId),  // Force this to be a number
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
      [...page.fields].sort((a, b) => a.order_field - b.order_field).forEach((field) => {
        // Exclude info and file uploads from the main flex array
        if (field.type === "info" || field.type === "fileUpload") return; 
        
        const key = `p${page.order_page}_f${field.order_field}`;
        
        // ALWAYS capture the NPS keys, even if the user skips it
        if (field.type === "nps") {
          npsData = {
            nps_question: field.label["en"], 
            nps_value: completeData[key] !== undefined ? completeData[key] : null,
            nps_max: 10,
            nps_min: 0
          };
          return; // Skip adding it to the standard flex array
        }

        if (completeData[key] !== undefined) {
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
      });
    });

    if (npsData) {
      Object.assign(payload, npsData);
    }
    
    setFinalPayload(payload); 

    // --- API POST CALL ---
    try {
      const POST_ENDPOINT = "/api/webhook/submit-form";

      const response = await fetch(POST_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Read the actual error text from the backend so we aren't guessing
        const errorText = await response.text();
        throw new Error(`400 Bad Request - Backend says: ${errorText}`);
      }

      // Read JSON to get the ID for linking
      const resultData = await response.json();
      const submissionId = resultData?.id_submission;

      // Gather up all files across all steps
      const uploadedFiles = [];
      dynamicPages.forEach(page => {
        page.fields.filter(f => f.type === "fileUpload").forEach(f => {
          const key = `p${page.order_page}_f${f.order_field}`;
          const urls = completeData[key];
          if (Array.isArray(urls)) {
            urls.forEach(url => uploadedFiles.push({ url }));
          }
        });
      });

      // Fire off the separate API call to link files to this submission
      if (uploadedFiles.length > 0 && submissionId) {
        const fileLinkPayload = {
          id_submission: submissionId,
          files: uploadedFiles
        };

        await fetch("/api/webhook/link-files", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fileLinkPayload)
        });
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      localStorage.removeItem("campaignDbId");
      setIsSubmitted(true);
    } catch (error) {
      console.error("Submission Error:", error);
      alert(`Submission failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
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
      const field = page.fields.find((f) => `p${page.order_page}_f${f.order_field}` === key);
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
        // Fallback for arrays (like our new file URLs)
        displayValue = value.map(v => typeof v === 'string' ? v.split('/').pop() : v).join(", ");
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

  if (loading) {
    return (
      <div className="app-container">
        <div className="form-content spinner-container">
          <div className="spinner"></div>
          <p className="loading-text">{UI_TEXT.loading[lang]}</p>
        </div>
      </div>
    );
  }

  if (!b2fData) {
    return (
      <div className="app-container">
        <div className="form-content">{UI_TEXT.error[lang]}</div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="app-container">
        {/* --- INJECTED HEADER INTO SUCCESS SCREEN --- */}
        <header className="app-header">
          <div className="lang-toggle">
            <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
            <button className={lang === "fi" ? "active" : ""} onClick={() => setLang("fi")}>FI</button>
          </div>
          <p className="campaign-ref">{UI_TEXT.header_id[lang]}: {campaignDbId}</p>
        </header>

        <div className="success-screen">
          <h1 style={{ color: "#2e7d32" }}>{UI_TEXT.success_title[lang]}</h1>
          <p style={{ fontSize: "1.2em", color: "var(--text-muted)" }}>{UI_TEXT.success_msg[lang]}</p>
          <div className="success-card">
            <h3 style={{ borderBottom: "2px solid var(--border-light)", paddingBottom: "10px", marginTop: 0 }}>
              {UI_TEXT.summary_title[lang]}
            </h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {["first_name", "last_name", "email", "product"].map((k) => (
                formData[k] && (
                  <li key={k} className="success-item">
                    <strong className="success-key">
                      {UI_TEXT[k] ? UI_TEXT[k][lang] : k.replace("_", " ")}:
                    </strong>
                    <span className="success-value">{formData[k]}</span>
                  </li>
                )
              ))}
              {Object.keys(formData).filter((k) => k.match(/^p\d+_f\d+$/)).filter((key) => {
                let isInfo = false;
                dynamicPages.forEach((page) => {
                  const field = page.fields.find((f) => `p${page.order_page}_f${f.order_field}` === key);
                  if (field && field.type === "info") isInfo = true;
                });
                return !isInfo;
              }).map((key) => {
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
            <button onClick={handleDownloadJson} className="next-button">{UI_TEXT.download_json[lang]}</button>
            <button onClick={handleRestart} className="back-button">{UI_TEXT.restart[lang]}</button>
          </div>
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
        <p className="campaign-ref">{UI_TEXT.header_id[lang]}: {campaignDbId}</p>
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
        {isSubmitting ? (
          <div className="spinner-container">
             <div className="spinner"></div>
             <p className="loading-text">{UI_TEXT.submitting[lang]}</p>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<StaticPage products={b2fData.products} lang={lang} onUpdate={handleUpdateData} existingData={formData} nextPath={allRoutePaths[1]} campaign_db_id={campaignDbId} />} />
            {dynamicPages.map((page, index) => (
              <Route key={page.order_page} path={`/page/${page.order_page}`} element={
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
              } />
            ))}
          </Routes>
        )}
      </main>
    </div>
  );
}

export default App;