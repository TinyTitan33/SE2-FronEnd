import { useState, useRef } from "react";

export default function VerifyCode() {
  const [expectedCode, setExpectedCode] = useState("");
  const [code, setCode] = useState(new Array(6).fill(""));
  const [status, setStatus] = useState("idle"); // idle, sent, success, error
  
  // Refs to control focus between the 6 input boxes
  const inputRefs = useRef([]);

  // --- SIMULATED BACKEND LOGIC ---
  const handleSendCode = () => {
    // Generate a random 6-digit code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedCode(newCode);
    setStatus("sent");
    setCode(new Array(6).fill(""));

    // For the presentation: Show the code in an alert so you can "read" your text
    alert(`📱 SIMULATED TEXT MESSAGE:\n\nYour Nordic Gadgets verification code is: ${newCode}`);
    
    // Focus the first input box automatically
    setTimeout(() => inputRefs.current[0].focus(), 100);
  };

  // --- FRONTEND UI LOGIC ---
  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false; // Only allow numbers

    const newCode = [...code];
    newCode[index] = element.value;
    setCode(newCode);
    setStatus("sent"); // Reset error state if typing

    // Auto-advance to the next input box
    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Auto-go back to the previous box on Backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = () => {
    const enteredCode = code.join("");
    if (enteredCode === expectedCode) {
      setStatus("success");
    } else {
      setStatus("error");
    }
  };

  return (
    <div className="form-content" style={{ maxWidth: "400px", margin: "40px auto", textAlign: "center" }}>
      <h2 style={{ color: "var(--text-main)", marginBottom: "10px" }}>Verify Your Account</h2>
      
      {status === "idle" ? (
        <>
          <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>
            Click below to send a verification code to your phone.
          </p>
          <button className="next-button" onClick={handleSendCode} style={{ width: "100%" }}>
            Send Code
          </button>
        </>
      ) : status === "success" ? (
        <div>
          <h1 style={{ color: "#2e7d32", fontSize: "3rem", margin: "10px 0" }}>✓</h1>
          <h3 style={{ color: "var(--text-main)" }}>Verification Complete!</h3>
          <p style={{ color: "var(--text-muted)" }}>Your account is fully set up.</p>
        </div>
      ) : (
        <>
          <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>
            Enter the 6-digit code we just sent you.
          </p>
          
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
            {code.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                ref={(el) => (inputRefs.current[index] = el)}
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                style={{
                  width: "45px",
                  height: "55px",
                  fontSize: "1.5rem",
                  textAlign: "center",
                  borderRadius: "8px",
                  border: `2px solid ${status === "error" ? "#ff6b6b" : "var(--border-color)"}`,
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-main)",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.select()}
              />
            ))}
          </div>

          {status === "error" && (
            <p style={{ color: "#ff6b6b", marginTop: "-10px", marginBottom: "15px", fontWeight: "500" }}>
              Incorrect code. Please try again.
            </p>
          )}

          <button 
            className="next-button" 
            onClick={handleVerify} 
            disabled={code.join("").length !== 6}
            style={{ width: "100%", opacity: code.join("").length !== 6 ? 0.5 : 1 }}
          >
            Verify
          </button>

          <button 
            onClick={handleSendCode} 
            style={{ 
              background: "none", border: "none", color: "var(--primary-color)", 
              marginTop: "15px", cursor: "pointer", textDecoration: "underline" 
            }}
          >
            Resend Code
          </button>
        </>
      )}
    </div>
  );
}