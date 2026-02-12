import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// 1. Translation Maps
const PAGE_TITLES = {
  page_identity: { en: "Identity", fi: "Henkilötiedot" },
  page_issue_details: { en: "Issue Details", fi: "Ongelman tiedot" },
  page_order_info: { en: "Order Information", fi: "Tilaustiedot" },
  page_experience: { en: "Experience", fi: "Kokemus" },
  page_ratings: { en: "Feedback", fi: "Palaute" },
  page_consent: { en: "Confirmation", fi: "Vahvistus" }
};

const UI_LABELS = {
  required: { en: "This field is required", fi: "Tämä kenttä on pakollinen" },
  select_placeholder: { en: "-- Select --", fi: "-- Valitse --" },
  back: { en: "Back", fi: "Takaisin" },
  next: { en: "Next", fi: "Seuraava" },
  submit: { en: "Submit", fi: "Lähetä" },
  min_val: { en: "Minimum value is", fi: "Minimiarvo on" },
  max_len: { en: "Too long (max)", fi: "Liian pitkä (max)" }
};

const styles = {
  radioGroup: { display: "flex", gap: "15px", margin: "10px 0" },
  checkboxGroup: { display: "flex", alignItems: "center", gap: "10px", margin: "10px 0" },
  ratingContainer: { display: "flex", gap: "5px" },
  ratingBtn: (active) => ({
    padding: "8px 12px",
    cursor: "pointer",
    backgroundColor: active ? "#007bff" : "#f0f0f0",
    color: active ? "#fff" : "#333",
    border: "1px solid #ccc",
    borderRadius: "4px"
  }),
  navButtons: { display: "flex", justifyContent: "space-between", marginTop: "20px" }
};

function PageTwo({ data, lang, onUpdate, existingData, nextPath, prevPath, isLastPage, onSubmit }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const initialData = {};
    data.fields.forEach(field => {
        if(existingData[field.id]) {
            initialData[field.id] = existingData[field.id];
        }
    });
    setForm(initialData);
    setErrors({});
  }, [data, existingData]);

  const handleChange = (fieldId, value) => {
    setForm(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: null }));
    }
  };

  const handleMultiSelect = (fieldId, optionValue) => {
    const current = form[fieldId] || [];
    let updated;
    if (current.includes(optionValue)) {
      updated = current.filter(v => v !== optionValue);
    } else {
      updated = [...current, optionValue];
    }
    handleChange(fieldId, updated);
  };

  const validate = () => {
    const newErrors = {};
    data.fields.forEach(field => {
      const value = form[field.id];

      // Required Check
      if (field.required) {
        const isEmpty = value === undefined || value === "" || value === null || (Array.isArray(value) && value.length === 0);
        if (isEmpty) {
          newErrors[field.id] = UI_LABELS.required[lang];
        }
      }

      // Numeric Validation
      if (field.type === "number" && value !== undefined && value !== "") {
         if (field.validation?.min !== undefined && Number(value) < field.validation.min) {
             newErrors[field.id] = `${UI_LABELS.min_val[lang]} ${field.validation.min}`;
         }
      }

      // Max Length
      if (field.validation?.maxLength && typeof value === 'string') {
          if (value.length > field.validation.maxLength) {
              newErrors[field.id] = `${UI_LABELS.max_len[lang]} ${field.validation.maxLength})`;
          }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNavigation = () => {
    if (validate()) {
      onUpdate(form);
      if (isLastPage) {
        onSubmit(form);
      } else {
        navigate(nextPath);
      }
    }
  };

  // --- Field Renderers ---
  const renderField = (field) => {
    const val = form[field.id];

    switch (field.type) {
      case "text":
      case "email":
      case "tel":
        return (
          <input
            className="field-input"
            type={field.type}
            value={val || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
          />
        );
      case "number":
        return (
            <input
              className="field-input"
              type="number"
              step={field.validation?.step || "1"}
              min={field.validation?.min}
              value={val || ""}
              onChange={(e) => handleChange(field.id, e.target.value)}
            />
        );
      case "textarea":
        return (
          <textarea
            className="field-input"
            rows={4}
            maxLength={field.validation?.maxLength}
            value={val || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
          />
        );
      case "dropdown":
        return (
          <select
            className="field-input"
            value={val || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
          >
            <option value="">{UI_LABELS.select_placeholder[lang]}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label[lang]}</option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div style={styles.radioGroup}>
            {field.options?.map(opt => (
              <label key={opt.value} style={{cursor:'pointer'}}>
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={val === opt.value}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  style={{marginRight: '5px'}}
                />
                {opt.label[lang]}
              </label>
            ))}
          </div>
        );
      case "multiSelect":
        return (
          <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
            {field.options?.map(opt => (
              <label key={opt.value} style={{cursor:'pointer'}}>
                <input
                  type="checkbox"
                  checked={(val || []).includes(opt.value)}
                  onChange={() => handleMultiSelect(field.id, opt.value)}
                  style={{marginRight: '8px'}}
                />
                {opt.label[lang]}
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
            <div style={styles.checkboxGroup}>
                <input 
                    type="checkbox" 
                    id={field.id}
                    checked={!!val}
                    onChange={(e) => handleChange(field.id, e.target.checked)}
                    style={{width: '20px', height: '20px'}}
                />
                <span>{field.label[lang]}</span> 
            </div>
        );
      case "fileUpload":
        return (
          <input
            type="file"
            onChange={(e) => handleChange(field.id, e.target.files[0] ? e.target.files[0].name : "")}
          />
        );
      case "rating_1_5":
        return (
          <div style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                style={styles.ratingBtn(val === star)}
                onClick={() => handleChange(field.id, star)}
              >
                {star}
              </button>
            ))}
          </div>
        );
      case "nps_0_10":
        return (
          <div style={{...styles.ratingContainer, flexWrap: 'wrap'}}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
              <button
                key={score}
                type="button"
                style={styles.ratingBtn(val === score)}
                onClick={() => handleChange(field.id, score)}
              >
                {score}
              </button>
            ))}
          </div>
        );
      default:
        return <p style={{color: 'red'}}>Unsupported: {field.type}</p>;
    }
  };

  if (!data) return <div>{UI_LABELS.loading ? UI_LABELS.loading[lang] : "..."}</div>;

  // Resolve Page Title using the map, fallback to formatted ID if missing
  const pageTitle = PAGE_TITLES[data.id] 
    ? PAGE_TITLES[data.id][lang] 
    : data.id.replace('page_', '').toUpperCase();

  return (
    <div className="form-container">
      <h2>{pageTitle}</h2>

      {data.fields.sort((a, b) => a.order - b.order).map(field => (
        <div key={field.id} className="field-group" style={{marginBottom: '20px'}}>
            {field.type !== "checkbox" && (
                <label className="field-label" style={{display: 'block', fontWeight: 'bold', marginBottom: '5px'}}>
                    {field.label[lang]} {field.required ? "*" : ""}
                </label>
            )}

            {renderField(field)}

            {field.helpText && <small className="help-text" style={{display:'block', color:'#666', marginTop:'4px'}}>{field.helpText[lang]}</small>}
            {errors[field.id] && <p className="error-text" style={{color: 'red', marginTop:'4px'}}>{errors[field.id]}</p>}
        </div>
      ))}

      <div style={styles.navButtons}>
        <button 
            onClick={() => navigate(prevPath)} 
            disabled={!prevPath}
            className="back-button"
            style={{padding: '10px 20px', cursor: !prevPath ? 'not-allowed' : 'pointer', opacity: !prevPath ? 0.5 : 1}}
        >
          {UI_LABELS.back[lang]}
        </button>

        <button 
            onClick={handleNavigation}
            className="next-button"
            style={{padding: '10px 20px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px'}}
        >
          {isLastPage 
            ? UI_LABELS.submit[lang]
            : UI_LABELS.next[lang]
          }
        </button>
      </div>
    </div>
  );
}

export default PageTwo;