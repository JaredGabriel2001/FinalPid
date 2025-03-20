// main.js
let currentImageData = null;

document.addEventListener("DOMContentLoaded", () => {
  const uploadInput = document.getElementById("upload");
  const canvas = document.getElementById("canvas");
  const resultCanvas = document.getElementById("result");
  const algSelect = document.getElementById("algSelect");
  const ctx = canvas.getContext("2d");

  function processImage() {
    if (!currentImageData) return;

    const algorithm = algSelect.value;
    switch (algorithm) {
      case "marr":
        processMarrHildreth(currentImageData, canvas.width, canvas.height, resultCanvas);
        break;
      case "canny":
        processCanny(currentImageData, canvas.width, canvas.height, resultCanvas);
        break;
      case "otsu":
        processOtsu(currentImageData, canvas.width, canvas.height, resultCanvas);
        break;
      case "watershed":
        processWatershed(currentImageData, canvas.width, canvas.height, resultCanvas);
        break;
      case "freeman":
        processFreeman(currentImageData, canvas.width, canvas.height, resultCanvas);
        break;
      default:
        alert("Algoritmo selecionado ainda não foi implementado.");
    }
  }

  uploadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      resultCanvas.width = img.width;
      resultCanvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      processImage();
    };
    img.src = URL.createObjectURL(file);
  });

  algSelect.addEventListener("change", () => {
    processImage();
  });
});