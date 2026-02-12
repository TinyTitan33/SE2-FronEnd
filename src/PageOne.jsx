import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PageOne.css";

function PageOne({ data, lang, onUpdate, existingData }) {
  const navigate = useNavigate();

  const [form, setForm] = useState(existingData || {});
  const [errors, setErrors] = useState({});

  if (!data) return <p>Loading configuration...</p>;

  const handleChange = (fieldId, value) => {
    setForm({ ...form, [fieldId]: value });
  };

  const validate = () => {
    const newErrors = {};
    data.fields.forEach((field) => {
      const value = form[field.id];

      // Required validation
      if (field.required && (!value || value.toString().trim() === "")) {
        newErrors[field.id] =
          lang === "en" ? "This field is required" : "Tämä kenttä on pakollinen";
      }

      // Email validation
      if (field.type === "email" && value && !/^\S+@\S+\.\S+$/.test(value)) {
        newErrors[field.id] =
          lang === "en" ? "Invalid email format" : "Virheellinen sähköpostiosoite";
      }

      //  FIRST NAME + LAST NAME: letters only + min 2 chars
      if ((field.id === "first_name" || field.id === "last_name") && value) {
        if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(value)) {
          newErrors[field.id] =
            lang === "en"
              ? "Only letters are allowed"
              : "Vain kirjaimet ovat sallittuja";
        }
        if (value.trim().length < 2) {
          newErrors[field.id] =
            lang === "en"
              ? "Must be at least 2 characters"
              : "Vähintään 2 merkkiä vaaditaan";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onUpdate(form);
      navigate("/page2");
    }
  };

  return (
    <div className="form-container">
      <h1 className="form-header">
        {lang === "en" ? "Identity" : "Henkilötiedot"}
      </h1>

      {data.fields
        .sort((a, b) => a.order - b.order)
        .map((field) => (
          <div key={field.id} className="field-group">
            <label className="field-label">
              {field.label[lang]} {field.required ? "*" : ""}
            </label>

            {field.type === "dropdown" ? (
              <select
                className="field-input"
                value={form[field.id] || ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
              >
                <option value="">
                  {lang === "en" ? "-- Select --" : "-- Valitse --"}
                </option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label[lang]}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="field-input"
                type={field.type}
                placeholder={field.helpText ? field.helpText[lang] : ""}
                value={form[field.id] || ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
              />
            )}

            {errors[field.id] && (
              <p className="error-text">{errors[field.id]}</p>
            )}
            {field.helpText && (
              <small className="help-text">{field.helpText[lang]}</small>
            )}
          </div>
        ))}

      <button className="next-button" onClick={handleNext}>
        {lang === "en" ? "Next" : "Seuraava"}
      </button>
    </div>
  );
}

export default PageOne;
