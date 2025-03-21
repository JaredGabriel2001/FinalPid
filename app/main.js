// main.js
let currentImageData = null;

document.addEventListener("DOMContentLoaded", () => {
  const uploadInput = document.getElementById("upload");
  const canvas = document.getElementById("canvas");
  const resultCanvas = document.getElementById("result");
  const algSelect = document.getElementById("algSelect");
  const filterButtonsDiv = document.getElementById("filterButtons");
  const ctx = canvas.getContext("2d");

  // Função para gerar os botões de filtro box
  function generateFilterButtons() {
    filterButtonsDiv.innerHTML = ""; // Limpa botões existentes
    const kernelSizes = ["2x2", "3x3", "5x5", "7x7"];
    kernelSizes.forEach(size => {
      const button = document.createElement("button");
      button.textContent = `Filtro ${size}`;
      button.addEventListener("click", () => {
        if (!currentImageData) return;
        const kernelSize = parseInt(size[0]); // Extrai o número (2, 3, 5, 7)
        processBoxFilter(currentImageData, canvas.width, canvas.height, resultCanvas, kernelSize);
      });
      filterButtonsDiv.appendChild(button);
    });
  }

  // Função para processar a imagem com o algoritmo selecionado
  function processImage() {
    if (!currentImageData) return;

    const algorithm = algSelect.value;
    // Mostra/esconde os botões de filtro com base na seleção
    if (algorithm === "box") {
      filterButtonsDiv.style.display = "block";
      generateFilterButtons();
    } else {
      filterButtonsDiv.style.display = "none";
      filterButtonsDiv.innerHTML = ""; // Limpa os botões
      // Processa outros algoritmos
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
        case "intensity":
          processIntensitySegmentation(currentImageData, canvas.width, canvas.height, resultCanvas);
          break;
        default:
          alert("Algoritmo selecionado ainda não foi implementado.");
      }
    }
  }

  // Ao carregar uma nova imagem, processa e armazena a imagem
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

  // Ao mudar o algoritmo selecionado, reaplica-o sobre a mesma imagem
  algSelect.addEventListener("change", () => {
    processImage();
  });
});