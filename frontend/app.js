// 🔥 Toast (no HTML needed)
function showToast(message, type = "info") {
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }

  toast.innerText = message;

  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "8px";
  toast.style.color = "white";
  toast.style.fontSize = "14px";
  toast.style.zIndex = "9999";
  toast.style.transition = "opacity 0.3s ease";

  if (type === "success") {
    toast.style.background = "#28a745";
  } else if (type === "error") {
    toast.style.background = "#dc3545";
  } else {
    toast.style.background = "#333";
  }

  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 3000);
}


// 🔥 SEND OTP
function sendOTP() {
  const phone = document.getElementById("phone").value;

  if (!phone) {
    showToast("Enter phone number", "error");
    return;
  }

  if (!phone.startsWith("+91")) {
    showToast("Use format: +91XXXXXXXXXX", "error");
    return;
  }

  auth.signInWithPhoneNumber(phone, window.recaptchaVerifier)
    .then((confirmationResult) => {
      window.confirmationResult = confirmationResult;
      showToast("OTP sent successfully", "success");
    })
    .catch((error) => {
      console.error(error);
      showToast("Failed to send OTP", "error");
    });
}


// 🔥 VERIFY OTP (FIXED WITH BACKEND JWT)
function verifyOTP() {
  const otp = document.getElementById("otp").value;

  if (!window.confirmationResult) {
    showToast("Please send OTP first", "error");
    return;
  }

  if (!otp) {
    showToast("Enter OTP", "error");
    return;
  }

  window.confirmationResult.confirm(otp)
    .then((result) => {
      const user = result.user;

      // ✅ Send to backend → get JWT
      fetch("http://localhost:5000/api/auth/phone-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone: user.phoneNumber
        })
      })
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            throw new Error("Backend login failed");
          }

          localStorage.setItem("authToken", data.token);

          showToast("Login successful", "success");

          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 1000);
        });
    })
    .catch((error) => {
      console.error(error);
      showToast("Invalid OTP", "error");
    });
}