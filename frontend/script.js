// ===== CONFIGURATION =====
const API_BASE_URL = 'http://localhost:5000/api/auth';
const FIREBASE_CONFIG = {
  apiKey: 'your_firebase_api_key',
  authDomain: 'your-project.firebaseapp.com',
};

// ===== GLOBAL STATE =====
let authState = {
  confirmationResult: null,
  otpTimer: null,
  otpTimeLeft: 60,
  phoneOtpTimeLeft: 60,
  phoneOtpTimer: null,
};

let recaptchaVerifier = null;
let auth = null;

// ===== FIREBASE INITIALIZATION =====
if (firebase && firebase.auth) {
  auth = firebase.auth();
}

// ===== UTILITY FUNCTIONS =====

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

/**
 * Show loading spinner
 */
function showLoading(show = true) {
  const spinner = document.getElementById('loadingSpinner');
  if (show) {
    spinner.classList.add('show');
  } else {
    spinner.classList.remove('show');
  }
}

/**
 * Toggle password visibility
 */
function togglePassword(inputId, icon) {
  const input = document.getElementById(inputId);
  if (!input || !icon) return;

  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

/**
 * Clear error messages
 */
function clearErrors(prefix = '') {
  document.querySelectorAll(`[id$="Error"]`).forEach(el => {
    if (!prefix || el.id.startsWith(prefix)) {
      el.textContent = '';
    }
  });
}

/**
 * Set button loading state
 */
function setButtonLoading(buttonId, loading = true) {
  const button = document.querySelector(`#${buttonId}`);
  if (!button) return;

  if (loading) {
    button.disabled = true;
    button.style.opacity = '0.7';
  } else {
    button.disabled = false;
    button.style.opacity = '1';
  }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate password strength
 */
function getPasswordStrength(password) {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*]/.test(password)) strength++;

  if (strength <= 2) return { level: 'weak', color: '#dc3545', score: 1 };
  if (strength <= 3) return { level: 'medium', color: '#ffc107', score: 2 };
  return { level: 'strong', color: '#28a745', score: 3 };
}

/**
 * Update password strength indicator with real-time validation
 */
function updatePasswordStrength(inputId) {
  const password = document.getElementById(inputId).value;
  const strength = getPasswordStrength(password);
  const bar = document.getElementById('strengthBar');
  const text = document.getElementById('strengthText');
  const errorEl = document.getElementById('passwordError');

  if (password) {
    // Update strength bar
    bar.className = `strength-bar-fill ${strength.level}`;
    text.textContent = `Password strength: ${strength.level.toUpperCase()}`;
    text.style.color = strength.color;

    // Real-time validation notification
    if (password.length < 8) {
      errorEl.textContent = `⚠️ Password must be at least 8 characters (${password.length}/8)`;
      errorEl.style.color = '#dc3545';
    } else if (!(/[a-z]/.test(password) && /[A-Z]/.test(password))) {
      errorEl.textContent = '⚠️ Password must contain both uppercase and lowercase letters';
      errorEl.style.color = '#ffc107';
    } else if (!/\d/.test(password)) {
      errorEl.textContent = '⚠️ Password must contain at least one number';
      errorEl.style.color = '#ffc107';
    } else if (!/[!@#$%^&*]/.test(password)) {
      errorEl.textContent = '✓ Password is strong. Consider adding special characters (!@#$%^&*)';
      errorEl.style.color = '#28a745';
    } else {
      errorEl.textContent = '✓ Password is very strong!';
      errorEl.style.color = '#28a745';
    }
  } else {
    bar.className = 'strength-bar-fill';
    text.textContent = '';
    errorEl.textContent = '';
  }
}

/**
 * Real-time password matching validation
 */
function validatePasswordMatch() {
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const errorEl = document.getElementById('confirmPasswordError');

  if (confirmPassword) {
    if (password !== confirmPassword) {
      errorEl.textContent = '❌ Passwords do not match';
      errorEl.style.color = '#dc3545';
      return false;
    } else {
      errorEl.textContent = '✓ Passwords match';
      errorEl.style.color = '#28a745';
      return true;
    }
  } else {
    errorEl.textContent = '';
  }
  return true;
}

/**
 * Start OTP timer
 */
function startOtpTimer(type = 'email') {
  const timerEl = document.getElementById('timer');
  const timerText = document.getElementById('timerText');
  const resendBtn = document.getElementById('resendBtn');
  let timeLeft = 60;

  if (type === 'phone') {
    const phoneResendBtn = document.getElementById('phoneResendBtn');
    timeLeft = authState.phoneOtpTimeLeft;

    if (authState.phoneOtpTimer) {
      clearInterval(authState.phoneOtpTimer);
    }

    if (phoneResendBtn) phoneResendBtn.disabled = true;

    if (timerEl) timerEl.textContent = timeLeft;

    authState.phoneOtpTimer = setInterval(() => {
      timeLeft--;
      if (timerEl) timerEl.textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(authState.phoneOtpTimer);
        authState.phoneOtpTimeLeft = 0;
        if (phoneResendBtn) phoneResendBtn.disabled = false;
      }
    }, 1000);
  } else {
    if (authState.otpTimer) {
      clearInterval(authState.otpTimer);
      authState.otpTimer = null;
    }

    authState.otpTimeLeft = 60;
    if (resendBtn) {
      resendBtn.disabled = true;
      resendBtn.setAttribute('disabled', 'disabled');
      resendBtn.classList.add('disabled');
    }
    if (timerEl) timerEl.textContent = authState.otpTimeLeft;
    if (timerText) timerText.textContent = `Resend OTP in ${authState.otpTimeLeft}s`;

    authState.otpTimer = setInterval(() => {
      timeLeft--;
      authState.otpTimeLeft = timeLeft;
      if (timerEl) timerEl.textContent = timeLeft;
      if (timerText) timerText.textContent = `Resend OTP in ${timeLeft}s`;

      if (timeLeft <= 0) {
        clearInterval(authState.otpTimer);
        authState.otpTimer = null;
        if (resendBtn) {
          resendBtn.disabled = false;
          resendBtn.removeAttribute('disabled');
          resendBtn.classList.remove('disabled');
        }
        if (timerText) timerText.textContent = 'Resend OTP now';
      }
    }, 1000);
  }
}

/**
 * Validate phone number format
 */
function isValidPhone(phone) {
  const regex = /^\+91[0-9]{10}$/;
  return regex.test(phone.replace(/\s/g, ''));
}

// ===== UI NAVIGATION =====

/**
 * Show login form
 */
function activateSection(sectionId) {
  const sections = ['loginBox', 'signupBox', 'otpBox', 'phoneBox', 'phoneOtpBox'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === sectionId) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    }
  });
}

function updateTabTitle(title) {
  const el = document.getElementById('tabTitle');
  if (el) el.textContent = title;
}

function showLogin() {
  clearErrors();
  activateSection('loginBox');
  updateTabTitle('Login');
}

/**
 * Show signup form
 */
function showSignup() {
  clearErrors();
  activateSection('signupBox');
  updateTabTitle('Sign up');
}

/**
 * Show phone login form
 */
function showPhoneLogin() {
  clearErrors();
  activateSection('phoneBox');
  updateTabTitle('Phone login');
}

/**
 * Go back to login from phone
 */
function backToLogin() {
  clearInterval(authState.phoneOtpTimer);
  showLogin();
}

/**
 * Go back to phone login from OTP
 */
function backToPhoneLogin() {
  clearInterval(authState.phoneOtpTimer);
  document.getElementById('phoneBox').classList.add('active');
  document.getElementById('phoneOtpBox').classList.remove('active');
}

/**
 * Go back to signup from OTP
 */
function goBackToSignup() {
  clearInterval(authState.otpTimer);
  showSignup();
}

// ===== AUTHENTICATION FUNCTIONS =====

/**
 * Login with email and password
 */
async function login(event) {
  event.preventDefault();
  clearErrors('login');

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  // Validation
  if (!email) {
    document.getElementById('loginEmailError').textContent = 'Email is required';
    return;
  }

  if (!isValidEmail(email)) {
    document.getElementById('loginEmailError').textContent = 'Invalid email format';
    return;
  }

  if (!password) {
    document.getElementById('loginPasswordError').textContent = 'Password is required';
    return;
  }

  if (password.length < 6) {
    document.getElementById('loginPasswordError').textContent =
      'Password must be at least 6 characters';
    return;
  }

  try {
    showLoading(true);
    setButtonLoading('loginBtn', true);

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast('Login successful!', 'success');
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Server connection failed. Please try again.', 'error');
  } finally {
    showLoading(false);
    setButtonLoading('loginBtn', false);
  }
}

/**
 * Send OTP for signup - With comprehensive validation
 */
async function handleSignup(event) {
  event.preventDefault();
  clearErrors();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // Validation
  if (!name) {
    document.getElementById('nameError').textContent = 'Name is required';
    return;
  }

  if (name.length < 2) {
    document.getElementById('nameError').textContent = 'Name must be at least 2 characters';
    return;
  }

  if (!email) {
    document.getElementById('emailError').textContent = 'Email is required';
    return;
  }

  if (!isValidEmail(email)) {
    document.getElementById('emailError').textContent = 'Invalid email format';
    return;
  }

  if (!password) {
    document.getElementById('passwordError').textContent = 'Password is required';
    return;
  }

  // ===== CRITICAL: PASSWORD MUST BE AT LEAST 8 CHARACTERS =====
  if (password.length < 8) {
    document.getElementById('passwordError').textContent = 
      `❌ Password must be at least 8 characters (${password.length}/8)`;
    document.getElementById('passwordError').style.color = '#dc3545';
    document.getElementById('passwordError').style.fontWeight = 'bold';
    showToast('❌ Password must be at least 8 characters', 'error', 5000);
    return;
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    document.getElementById('passwordError').textContent = 
      '❌ Password must contain at least one uppercase letter';
    document.getElementById('passwordError').style.color = '#dc3545';
    showToast('❌ Password must contain at least one uppercase letter', 'error', 5000);
    return;
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    document.getElementById('passwordError').textContent = 
      '❌ Password must contain at least one lowercase letter';
    document.getElementById('passwordError').style.color = '#dc3545';
    showToast('❌ Password must contain at least one lowercase letter', 'error', 5000);
    return;
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    document.getElementById('passwordError').textContent = 
      '❌ Password must contain at least one number';
    document.getElementById('passwordError').style.color = '#dc3545';
    showToast('❌ Password must contain at least one number', 'error', 5000);
    return;
  }

  if (password !== confirmPassword) {
    document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
    showToast('❌ Passwords do not match', 'error');
    return;
  }

  try {
    showLoading(true);
    setButtonLoading('signupBtn', true);

    const response = await fetch(`${API_BASE_URL}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast('OTP sent to your email!', 'success');

      // Store signup data in sessionStorage
      sessionStorage.setItem(
        'signupData',
        JSON.stringify({ name, email, password })
      );

      // Switch to OTP verification
      document.getElementById('signupBox').classList.remove('active');
      document.getElementById('otpBox').classList.add('active');
      document.getElementById('signupTab').classList.remove('active');

      // Start OTP timer
      startOtpTimer('email');
    } else {
      showToast(data.message || 'Failed to send OTP', 'error');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showToast('Server connection failed. Please try again.', 'error');
  } finally {
    showLoading(false);
    setButtonLoading('signupBtn', false);
  }
}

/**
 * Verify OTP for signup
 */
async function verifyOtp(event) {
  event.preventDefault();
  clearErrors();

  const otp = document.getElementById('otp').value.trim();
  const signupData = JSON.parse(sessionStorage.getItem('signupData') || '{}');

  if (!signupData.email || !signupData.password || !signupData.name) {
    showToast('Signup data expired. Please start again.', 'error');
    return;
  }

  if (!otp) {
    document.getElementById('otpError').textContent = 'OTP is required';
    return;
  }

  if (otp.length !== 6 || !/^\d+$/.test(otp)) {
    document.getElementById('otpError').textContent = 'OTP must be 6 digits';
    return;
  }

  try {
    showLoading(true);
    setButtonLoading('otpBtn', true);

    const response = await fetch(`${API_BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
        otp,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast('Account created successfully!', 'success');

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.removeItem('signupData');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      showToast(data.message || 'OTP verification failed', 'error');
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    showToast('Server connection failed. Please try again.', 'error');
  } finally {
    showLoading(false);
    setButtonLoading('otpBtn', false);
    clearInterval(authState.otpTimer);
  }
}

/**
 * Resend OTP
 */
async function resendOtp() {
  const signupData = JSON.parse(sessionStorage.getItem('signupData') || '{}');

  if (!signupData.email) {
    showToast('Signup data not found. Please start over.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: signupData.email }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast('OTP resent to your email!', 'success');

      // Reset timer
      if (authState.otpTimer) {
        clearInterval(authState.otpTimer);
        authState.otpTimer = null;
      }
      authState.otpTimeLeft = 60;
      const resendBtn = document.getElementById('resendBtn');
      if (resendBtn) {
        resendBtn.disabled = true;
        resendBtn.setAttribute('disabled', 'disabled');
        resendBtn.classList.add('disabled');
      }
      startOtpTimer('email');
    } else {
      showToast(data.message || 'Failed to resend OTP', 'error');
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    showToast('Server connection failed. Please try again.', 'error');
  }
}

/**
 * Login with Google
 */
function loginWithGoogle() {
  window.location.href = `${API_BASE_URL.replace('/api/auth', '')}/auth/google`;
}

// ===== PHONE LOGIN FUNCTIONS =====

/**
 * Initialize reCAPTCHA
 */
function initRecaptcha() {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
      'recaptcha-container',
      {
        size: 'normal',
        callback: (token) => {
          console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          recaptchaVerifier = null;
        },
      }
    );

    recaptchaVerifier.render().catch((error) => {
      console.error('reCAPTCHA render error:', error);
      showToast('Failed to load reCAPTCHA. Please refresh.', 'error');
    });
  }
}

/**
 * Send OTP via phone
 */
async function handlePhoneLogin(event) {
  event.preventDefault();
  clearErrors();

  const phone = document.getElementById('phone').value.replace(/\s/g, '');

  if (!phone) {
    document.getElementById('phoneError').textContent = 'Phone number is required';
    return;
  }

  if (!isValidPhone(phone)) {
    document.getElementById('phoneError').textContent =
      'Invalid phone format. Use: +91 XXXXXXXXXX';
    return;
  }

  try {
    showLoading(false);
    setButtonLoading('phoneOtpBtn', true);

    // Initialize reCAPTCHA if not already done
    initRecaptcha();

    authState.confirmationResult = await auth.signInWithPhoneNumber(
      phone,
      recaptchaVerifier
    );

    showToast('OTP sent to your phone!', 'success');

    // Switch to phone OTP verification
    document.getElementById('phoneBox').classList.remove('active');
    document.getElementById('phoneOtpBox').classList.add('active');
    document.getElementById('phoneOtpSubtitle').textContent = `OTP sent to ${phone}`;

    // Start phone OTP timer
    startOtpTimer('phone');
  } catch (error) {
    console.error('Phone login error:', error);
    showToast(error.message || 'Failed to send OTP', 'error');

    // Clear reCAPTCHA on error
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
  } finally {
    showLoading(false);
    setButtonLoading('phoneOtpBtn', false);
  }
}

/**
 * Verify phone OTP
 */
async function verifyPhoneOTP(event) {
  event.preventDefault();
  clearErrors();

  const otp = document.getElementById('phoneOtp').value.trim();

  if (!otp) {
    document.getElementById('phoneOtpError').textContent = 'OTP is required';
    return;
  }

  if (otp.length !== 6 || !/^\d+$/.test(otp)) {
    document.getElementById('phoneOtpError').textContent = 'OTP must be 6 digits';
    return;
  }

  if (!authState.confirmationResult) {
    showToast('Session expired. Please request OTP again.', 'error');
    return;
  }

  try {
    showLoading(true);
    setButtonLoading('phoneVerifyBtn', true);

    const result = await authState.confirmationResult.confirm(otp);
    const user = result.user;

    const response = await fetch(`${API_BASE_URL}/phone-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: user.phoneNumber }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast('Phone login successful!', 'success');

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      showToast(data.message || 'Phone login failed', 'error');
    }
  } catch (error) {
    console.error('Phone OTP verification error:', error);
    showToast(error.message || 'Invalid OTP. Please try again.', 'error');
  } finally {
    showLoading(false);
    setButtonLoading('phoneVerifyBtn', false);
    clearInterval(authState.phoneOtpTimer);
  }
}

// ===== TOKEN HANDLER ON PAGE LOAD =====

/**
 * Handle token from OAuth redirect
 */
function handleTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const user = params.get('user');

  if (token) {
    localStorage.setItem('authToken', token);

    if (user) {
      try {
        localStorage.setItem('user', decodeURIComponent(user));
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);

    showToast('Login successful!', 'success');

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  }
}

// ===== EVENT LISTENERS =====

document.addEventListener('DOMContentLoaded', () => {
  // Handle token from OAuth redirect
  handleTokenFromUrl();

  // Real-time password strength indicator
  const passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      updatePasswordStrength('password');
    });
  }

  // Real-time password match validation
  const confirmPasswordInput = document.getElementById('confirmPassword');
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', () => {
      validatePasswordMatch();
    });
  }

  // Set initial active tab
  showLogin();
});