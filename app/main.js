// Variável global para armazenar a imagem carregada (ImageData)
let currentImageData = null;

document.addEventListener("DOMContentLoaded", () => {
  const uploadInput = document.getElementById("upload");
  const canvas = document.getElementById("canvas");
  const resultCanvas = document.getElementById("result");
  const algSelect = document.getElementById("algSelect");
  const ctx = canvas.getContext("2d");

  // Função para processar a imagem com o algoritmo selecionado
  function processImage() {
    if (!currentImageData) return; // se nenhuma imagem estiver carregada, sai

    // Aplica o algoritmo selecionado sobre a imagem armazenada
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
      default:
        alert("Algoritmo selecionado ainda não foi implementado.");
    }
  }

  // Ao carregar uma nova imagem, processa e armazena a imagem
  uploadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const img = new Image();
    img.onload = () => {
      // Ajusta os canvas conforme o tamanho da imagem
      canvas.width = img.width;
      canvas.height = img.height;
      resultCanvas.width = img.width;
      resultCanvas.height = img.height;
      
      // Desenha a imagem original
      ctx.drawImage(img, 0, 0);
      
      // Obtém os dados da imagem e armazena na variável global
      currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Processa a imagem com o algoritmo atualmente selecionado
      processImage();
    };
    img.src = URL.createObjectURL(file);
  });

  // Ao mudar o algoritmo selecionado, reaplica-o sobre a mesma imagem
  algSelect.addEventListener("change", () => {
    processImage();
  });
});
