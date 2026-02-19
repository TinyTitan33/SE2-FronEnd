import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UI_LABELS = {
  required: { en: "This field is required", fi: "Tämä kenttä on pakollinen" },
  too_short: { en: "Must be at least 3 characters", fi: "Vähintään 3 merkkiä vaaditaan" },
  select_placeholder: { en: "-- Select --", fi: "-- Valitse --" },
  back: { en: "Back", fi: "Takaisin" },
  next: { en: "Next", fi: "Seuraava" },
  submit: { en: "Submit", fi: "Lähetä" },
  not_selected: { en: "Not selected", fi: "Ei valittu" }
};

function DynamicPage({ pageData, lang, onUpdate, existingData, nextPath, prevPath, isLastPage, onSubmit }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  const sortedFields = [...pageData.fields].sort((a, b) => a.order_field - b.order_field);
  const getFieldKey = (field) => `p${pageData.order_page}_f${field.order_field}`;

  useEffect(() => {
    const initialData = {};
    sortedFields.forEach(field => {
      const key = getFieldKey(field);
      if (existingData[key] !== undefined) initialData[key] = existingData[key];
      else initialData[key] = (field.type === 'checkbox' && !field.options) ? false : (field.type === 'checkbox' ? [] : "");
    });
    setForm(initialData);
    setErrors({});
  }, [pageData, existingData]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    sortedFields.forEach(field => {
      const key = getFieldKey(field);
      const value = form[key];

      if (field.required) {
        const isEmpty = (field.type === 'checkbox' && !field.options) ? value !== true : !value || (Array.isArray(value) && value.length === 0);
        if (isEmpty) {
          // Store the KEY of the error
          newErrors[key] = "required";
          return;
        }
      }

      if (field.required && (field.type === "text" || field.type === "textarea") && String(value).trim().length < 3) {
        newErrors[key] = "too_short";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const renderField = (field) => {
    const key = getFieldKey(field);
    const val = form[key];

    switch (field.type) {
      case "text":
      case "number":
        return <input className="field-input" type={field.type} value={val || ""} onChange={(e) => handleChange(key, e.target.value)} />;
      case "textarea":
        return <textarea className="field-input" rows={4} value={val || ""} onChange={(e) => handleChange(key, e.target.value)} />;
      case "dropdown":
        return (
          <select className="field-input" value={val || ""} onChange={(e) => handleChange(key, e.target.value)}>
            <option value="">{UI_LABELS.select_placeholder[lang]}</option>
            {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label[lang]}</option>)}
          </select>
        );
      case "radio":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "10px 0" }}>
            {field.options?.map(opt => (
              <label key={opt.value} style={{ display: "flex", alignItems: "center", cursor: 'pointer', color: 'var(--text-main)' }}>
                <input type="radio" name={key} value={opt.value} checked={val === opt.value} onChange={(e) => handleChange(key, e.target.value)} style={{ marginRight: '10px' }} />
                {opt.label[lang]}
              </label>
            ))}
          </div>
        );
      case "checkbox":
        if (!field.options) {
          return (
            <label style={{ display: "flex", alignItems: "center", gap: "12px", margin: "10px 0", cursor: 'pointer' }}>
              <input type="checkbox" checked={!!val} onChange={(e) => handleChange(key, e.target.checked)} style={{ width: '22px', height: '22px' }} />
              <span style={{ color: 'var(--text-main)' }}>{field.label[lang]}</span>
            </label>
          );
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {field.options.map(opt => (
              <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: 'pointer' }}>
                <input type="checkbox" checked={Array.isArray(val) && val.includes(opt.value)} onChange={() => {
                  const current = Array.isArray(form[key]) ? form[key] : [];
                  const updated = current.includes(opt.value) ? current.filter(v => v !== opt.value) : [...current, opt.value];
                  handleChange(key, updated);
                }} style={{ width: '18px', height: '18px' }} />
                <span style={{ color: 'var(--text-main)' }}>{opt.label[lang]}</span>
              </label>
            ))}
          </div>
        );
      case "rating":
        return (
          <div className="rating-wrapper">
            <div className="star-container">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" className={`star-btn ${(val || 0) >= star ? 'active' : ''}`} onClick={() => handleChange(key, star)}>
                  <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                </button>
              ))}
            </div>
          </div>
        );
      case "nps":
        return (
          <div className="nps-wrapper">
            <div className="nps-container">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                <button key={score} type="button" className={`nps-btn ${score >= 7 ? "promoter" : score >= 4 ? "passive" : "detractor"} ${val === score ? 'selected' : ''}`} onClick={() => handleChange(key, score)}>
                  {score}
                </button>
              ))}
            </div>
          </div>
        );
      case "fileUpload":
        return <input type="file" style={{ color: 'var(--text-main)' }} onChange={(e) => handleChange(key, e.target.files[0] ? e.target.files[0].name : "")} />;
      default: return null;
    }
  };

  return (
    <div className="form-container">
      {sortedFields.map(field => {
        const key = getFieldKey(field);
        return (
          <div key={key} className="field-group">
            {field.type !== "info" && field.type !== "checkbox" && <label className="field-label">{field.label[lang]} {field.required ? "*" : ""}</label>}
            {field.type === "info" && <p style={{ color: 'var(--text-main)', marginBottom: '10px' }}>{field.label[lang]}</p>}
            {renderField(field)}
            {field.helpText && <small className="help-text">{field.helpText[lang]}</small>}
            {/* Translate the error key dynamically during render */}
            {errors[key] && <p className="error-text">{UI_LABELS[errors[key]][lang]}</p>}
          </div>
        );
      })}
      <div className="nav-buttons">
        <button onClick={() => navigate(prevPath)} disabled={!prevPath} className="back-button">
          <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
          {UI_LABELS.back[lang]}
        </button>
        <button onClick={() => validate() && (onUpdate(form), isLastPage ? onSubmit(form) : navigate(nextPath))} className="next-button">
          {isLastPage ? UI_LABELS.submit[lang] : UI_LABELS.next[lang]}
        </button>
      </div>
    </div>
  );
}

export default DynamicPage;