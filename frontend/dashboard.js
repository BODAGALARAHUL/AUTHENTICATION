window.onload = function () {
  const token = localStorage.getItem("authToken");

  console.log("Stored token:", token);

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("dashboard").style.display = "block";
};

function logout() {
  localStorage.removeItem("authToken");
  window.location.href = "index.html";
}