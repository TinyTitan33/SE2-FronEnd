import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Local UI definitions for the static page
const STATIC_UI = {
  title: { en: "Contact Information", fi: "Yhteystiedot" },
  first_name: { en: "First Name", fi: "Etunimi" },
  last_name: { en: "Last Name", fi: "Sukunimi" },
  email: { en: "Email Address", fi: "Sähköpostiosoite" },
  product: { en: "Product", fi: "Tuote" },
  select_product: { en: "-- Select Product --", fi: "-- Valitse tuote --" },
  next: { en: "Next", fi: "Seuraava" },
  required: { en: "Required", fi: "Pakollinen" },
  invalid_email: { en: "Invalid email format", fi: "Virheellinen sähköpostiosoite" },
  only_letters: { en: "Only letters are allowed", fi: "Vain kirjaimet ovat sallittuja" },
  min_chars: { en: "Must be at least 2 characters", fi: "Vähintään 2 merkkiä vaaditaan" },
  
  // UI text for Email Verification
  verify_btn: { en: "Verify", fi: "Vahvista" },
  code_sent_msg: { en: "Enter the 6-digit code sent to your email", fi: "Syötä sähköpostiisi lähetetty 6-numeroinen koodi" },
  verify_code_btn: { en: "Submit Code", fi: "Lähetä koodi" },
  verified_success: { en: "✓ Email Verified", fi: "✓ Sähköposti vahvistettu" },
  resend: { en: "Resend", fi: "Lähetä uudelleen" },
  email_unverified: { en: "Please verify your email to continue", fi: "Vahvista sähköpostiosoitteesi jatkaaksesi" },
  incorrect_code: { en: "Incorrect code", fi: "Virheellinen koodi" }
};

export default function StaticPage({ products, lang, onUpdate, existingData, nextPath }) {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    product: "" 
  });
  
  const [errors, setErrors] = useState({});

  // Email Verification State
  const [verificationStatus, setVerificationStatus] = useState("idle"); // idle, sent, verified, error
  const [expectedCode, setExpectedCode] = useState("");
  const [code, setCode] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (existingData) {
      setFormData(prev => ({
        ...prev,
        first_name: existingData.first_name || "",
        last_name: existingData.last_name || "",
        email: existingData.email || "",
        product: existingData.product || ""
      }));
      if (existingData.email) setVerificationStatus("verified");
    }
  }, [existingData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    
    if (name === "email" && verificationStatus === "verified") {
      setVerificationStatus("idle");
    }
  };

  // --- SIMULATED EMAIL LOGIC ---
  const handleSendCode = () => {
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: "invalid_email" })); // STORE KEY, NOT STRING
      return;
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedCode(newCode);
    setVerificationStatus("sent");
    setCode(new Array(6).fill(""));

    alert(`📧 SIMULATED EMAIL TO ${formData.email}:\n\nYour Nordic Gadgets verification code is: ${newCode}`);
    
    setTimeout(() => { if (inputRefs.current[0]) inputRefs.current[0].focus(); }, 100);
  };

  const handleCodeChange = (element, index) => {
    if (isNaN(element.value)) return false; 
    const newCode = [...code];
    newCode[index] = element.value;
    setCode(newCode);
    if (verificationStatus === "error") setVerificationStatus("sent");

    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleCodeKeyDown = (e, index) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerifyCode = () => {
    if (code.join("") === expectedCode) {
      setVerificationStatus("verified");
      setErrors(prev => ({ ...prev, email: null }));
    } else {
      setVerificationStatus("error");
    }
  };
  // -----------------------------

  const validate = () => {
    const newErrors = {};
    const { first_name, last_name, email, product } = formData;

    // STORE KEYS, NOT STRINGS
    if (!first_name) newErrors.first_name = "required";
    else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(first_name)) newErrors.first_name = "only_letters";
    else if (first_name.trim().length < 2) newErrors.first_name = "min_chars";

    if (!last_name) newErrors.last_name = "required";
    else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(last_name)) newErrors.last_name = "only_letters";
    else if (last_name.trim().length < 2) newErrors.last_name = "min_chars";

    if (!email) {
      newErrors.email = "required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "invalid_email";
    } else if (verificationStatus !== "verified") {
      newErrors.email = "email_unverified";
    }

    if (!product) newErrors.product = "required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onUpdate(formData);
      navigate(nextPath);
    }
  };

  return (
    <div className="form-container">
      <h2 style={{ color: 'var(--text-main)', marginBottom: '20px' }}>
        {STATIC_UI.title[lang]}
      </h2>

      <div className="field-group">
        <label className="field-label">{STATIC_UI.first_name[lang]} *</label>
        <input
          name="first_name"
          className="field-input"
          value={formData.first_name}
          onChange={handleChange}
          style={errors.first_name ? { borderColor: 'red' } : {}}
        />
        {/* Dynamic translation mapping on render */}
        {errors.first_name && <p className="error-text">{STATIC_UI[errors.first_name][lang]}</p>}
      </div>

      <div className="field-group">
        <label className="field-label">{STATIC_UI.last_name[lang]} *</label>
        <input
          name="last_name"
          className="field-input"
          value={formData.last_name}
          onChange={handleChange}
          style={errors.last_name ? { borderColor: 'red' } : {}}
        />
        {errors.last_name && <p className="error-text">{STATIC_UI[errors.last_name][lang]}</p>}
      </div>

      <div className="field-group">
        <label className="field-label">{STATIC_UI.email[lang]} *</label>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            name="email"
            type="email"
            className="field-input"
            value={formData.email}
            onChange={handleChange}
            disabled={verificationStatus === "verified"}
            style={{ 
              ...(errors.email ? { borderColor: 'red' } : {}),
              backgroundColor: verificationStatus === "verified" ? "rgba(46, 125, 50, 0.05)" : "var(--bg-input)",
              borderColor: verificationStatus === "verified" ? "#2e7d32" : ""
            }}
          />
          {verificationStatus === "idle" && (
            <button 
              type="button" 
              onClick={handleSendCode} 
              className="next-button" 
              style={{ height: "42px", padding: "0 20px", whiteSpace: "nowrap" }}
            >
              {STATIC_UI.verify_btn[lang]}
            </button>
          )}
        </div>
        
        {errors.email && <p className="error-text">{STATIC_UI[errors.email][lang]}</p>}

        {verificationStatus === "verified" && (
          <p style={{ color: "#2e7d32", fontWeight: "600", fontSize: "0.9rem", marginTop: "8px" }}>
            {STATIC_UI.verified_success[lang]}
          </p>
        )}

        {(verificationStatus === "sent" || verificationStatus === "error") && (
          <div style={{ 
            marginTop: "15px", padding: "15px", 
            backgroundColor: "var(--bg-body)", 
            border: "1px solid var(--border-light)", 
            borderRadius: "8px" 
          }}>
            <p style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "var(--text-main)" }}>
              {STATIC_UI.code_sent_msg[lang]}
            </p>
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "15px" }}>
              {code.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  ref={(el) => (inputRefs.current[index] = el)}
                  value={data}
                  onChange={(e) => handleCodeChange(e.target, index)}
                  onKeyDown={(e) => handleCodeKeyDown(e, index)}
                  onFocus={(e) => e.target.select()}
                  style={{
                    width: "36px", height: "45px", fontSize: "1.2rem", textAlign: "center",
                    borderRadius: "6px",
                    border: `2px solid ${verificationStatus === "error" ? "#ff6b6b" : "var(--border-color)"}`,
                    backgroundColor: "var(--bg-input)", color: "var(--text-main)", outline: "none"
                  }}
                />
              ))}
            </div>

            {verificationStatus === "error" && (
              <p style={{ color: "#ff6b6b", margin: "-5px 0 10px 0", fontSize: "0.85rem" }}>
                {STATIC_UI.incorrect_code[lang]}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button 
                type="button"
                className="next-button" 
                onClick={handleVerifyCode} 
                disabled={code.join("").length !== 6}
                style={{ height: "38px", padding: "0 20px", opacity: code.join("").length !== 6 ? 0.5 : 1 }}
              >
                {STATIC_UI.verify_code_btn[lang]}
              </button>
              <button 
                type="button"
                onClick={handleSendCode} 
                style={{ background: "none", border: "none", color: "var(--primary-color)", cursor: "pointer", textDecoration: "underline", fontSize: "0.9rem" }}
              >
                {STATIC_UI.resend[lang]}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="field-group">
        <label className="field-label">{STATIC_UI.product[lang]} *</label>
        <select
          name="product"
          className="field-input"
          value={formData.product}
          onChange={handleChange}
          style={errors.product ? { borderColor: 'red' } : {}}
        >
          <option value="">{STATIC_UI.select_product[lang]}</option>
          {products && products.map(p => (
            <option key={p.db_id} value={p.name.en}>
              {p.name[lang]}
            </option>
          ))}
        </select>
        {errors.product && <p className="error-text">{STATIC_UI[errors.product][lang]}</p>}
      </div>

      <div className="nav-buttons" style={{ justifyContent: 'flex-end' }}>
        <button className="next-button" onClick={handleNext}>
          {STATIC_UI.next[lang]}
        </button>
      </div>
    </div>
  );
}