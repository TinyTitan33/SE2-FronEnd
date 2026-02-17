import { useState, useEffect } from "react";
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
  min_chars: { en: "Must be at least 2 characters", fi: "Vähintään 2 merkkiä vaaditaan" }
};

export default function StaticPage({ products, lang, onUpdate, existingData, nextPath }) {
  const navigate = useNavigate();
  
  // Initialize with empty strings to avoid uncontrolled input warnings
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    product: "" // This will store the Product NAME (e.g. "Premium Widget") to match F2B
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existingData) {
      setFormData(prev => ({
        ...prev,
        first_name: existingData.first_name || "",
        last_name: existingData.last_name || "",
        email: existingData.email || "",
        product: existingData.product || ""
      }));
    }
  }, [existingData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    const { first_name, last_name, email, product } = formData;

    if (!first_name) newErrors.first_name = STATIC_UI.required[lang];
    if (!last_name) newErrors.last_name = STATIC_UI.required[lang];
    if (!email) newErrors.email = STATIC_UI.required[lang];
    if (!product) newErrors.product = STATIC_UI.required[lang];

    // Regex Validation
    if (first_name && !/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(first_name)) {
      newErrors.first_name = STATIC_UI.only_letters[lang];
    } else if (first_name && first_name.trim().length < 2) {
      newErrors.first_name = STATIC_UI.min_chars[lang];
    }

    if (last_name && !/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(last_name)) {
      newErrors.last_name = STATIC_UI.only_letters[lang];
    } else if (last_name && last_name.trim().length < 2) {
      newErrors.last_name = STATIC_UI.min_chars[lang];
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = STATIC_UI.invalid_email[lang];
    }

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
        {errors.first_name && <p className="error-text">{errors.first_name}</p>}
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
        {errors.last_name && <p className="error-text">{errors.last_name}</p>}
      </div>

      <div className="field-group">
        <label className="field-label">{STATIC_UI.email[lang]} *</label>
        <input
          name="email"
          type="email"
          className="field-input"
          value={formData.email}
          onChange={handleChange}
          style={errors.email ? { borderColor: 'red' } : {}}
        />
        {errors.email && <p className="error-text">{errors.email}</p>}
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
            // F2B requires the NAME (specifically English or current lang?), 
            // F2B example says "Premium Widget" (EN). Let's use English Name for ID to ensure backend match.
            <option key={p.db_id} value={p.name.en}>
              {p.name[lang]}
            </option>
          ))}
        </select>
        {errors.product && <p className="error-text">{errors.product}</p>}
      </div>

      <div className="nav-buttons" style={{ justifyContent: 'flex-end' }}>
        <button className="next-button" onClick={handleNext}>
          {STATIC_UI.next[lang]}
        </button>
      </div>
    </div>
  );
}