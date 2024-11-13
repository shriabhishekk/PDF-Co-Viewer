const socket = io();
const pdfCanvas = document.getElementById("pdfCanvas");
const ctx = pdfCanvas.getContext("2d");

let pdfDoc = null;
let currentPage = 1; // Default starting page
let role = "viewer"; // Default role is viewer

// Load PDF
async function loadPDF() {
  try {
    const url = '/Presentation1.pdf'; // Ensure path is correct
    pdfDoc = await pdfjsLib.getDocument(url).promise;
    renderPage(currentPage);
  } catch (error) {
    console.error("Error loading PDF:", error);
  }
}

// Render a specific page
function renderPage(pageNum) {
  if (pdfDoc) {
    pdfDoc.getPage(pageNum).then((page) => {
      const viewport = page.getViewport({ scale: 1.5 });
      pdfCanvas.width = viewport.width;
      pdfCanvas.height = viewport.height;
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };
      page.render(renderContext);
      document.getElementById("pageNum").textContent = pageNum;
    });
  }
}

// Handle previous and next page clicks
document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    changePage(currentPage - 1);
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  if (currentPage < pdfDoc.numPages) {
    changePage(currentPage + 1);
  }
});

// Change page logic
function changePage(newPage) {
  if (pdfDoc && newPage > 0 && newPage <= pdfDoc.numPages) {
    currentPage = newPage;
    renderPage(currentPage);
    if (role === "admin") {
      socket.emit("changePage", currentPage); // Sync page for admin
    }
  }
}

// Receive role from the server
socket.on("setRole", (assignedRole) => {
  role = assignedRole;
  if (role === "viewer") {
    document.getElementById("controls").style.display = "none"; // Hide controls for viewers
  }
});

// Sync page change for viewers
socket.on("changePage", (page) => {
  if (role === "viewer") {
    currentPage = page;
    renderPage(currentPage);
  }
});

loadPDF("./Presentation1.pdf"); // Call to load the PDF when the page loads
