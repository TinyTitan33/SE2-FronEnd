import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PageOne.css";

function PageOne() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    product: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Enter your name please.";
    if (!form.email.trim()) {
      newErrors.email = "Your email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "This is an invalid email format.";
    }
    if (!form.product.trim()) newErrors.product = "What is the product name?";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) navigate("/page2");
  };

  return (
    <div className="form-container">
        <h1 className="form-header">Customer complaint Form</h1>
      <h2 className="form-title">Dear customer, please fill in the form below.</h2>

      <div className="field-group">
        <label className="field-label">Name *</label>
        <input
          className="field-input"
          type="text"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
        {errors.name && <p className="error-text">{errors.name}</p>}
      </div>

      <div className="field-group">
        <label className="field-label">Email *</label>
        <input
          className="field-input"
          type="email"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
        {errors.email && <p className="error-text">{errors.email}</p>}
      </div>

      <div className="field-group">
        <label className="field-label">Product *</label>
        <input
          className="field-input"
          type="text"
          value={form.product}
          onChange={(e) => handleChange("product", e.target.value)}
        />
        {errors.product && <p className="error-text">{errors.product}</p>}
      </div>

      <button className="next-button" onClick={handleNext}>
        Next
      </button>
    </div>
  );
}

export default PageOne;
