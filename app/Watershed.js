(function() {
  function processWatershed(imageData, width, height, resultCanvas) {
    // 1. Converter para escala de cinza
    const gray = toGrayscale(imageData, width, height);
    // 2. Calcular o gradiente (magnitude) usando Sobel
    const grad = computeGradient(gray, width, height);
    
    // 3. Inicializar os rótulos (-1 significa não rotulado)
    const labels = new Int32Array(width * height);
    labels.fill(-1);
    
    // 4. Inicializa os marcadores com mínimos locais (local minima)
    let markerLabel = 1;
    // Cria um array de pixels com índice e valor do gradiente para ordenação
    let pixels = [];
    for (let i = 0; i < width * height; i++) {
      pixels.push({ index: i, value: grad[i] });
    }
    pixels.sort((a, b) => a.value - b.value);
    
    // Atribuir rótulos aos mínimos locais
    for (let i = 0; i < pixels.length; i++) {
      const idx = pixels[i].index;
      if (labels[idx] !== -1) continue;
      
      const x = idx % width;
      const y = Math.floor(idx / width);
      let isMin = true;
      // Verifica vizinhança 8-connected
      for (let j = -1; j <= 1; j++) {
        for (let k = -1; k <= 1; k++) {
          let nx = x + k, ny = y + j;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            if (grad[nIdx] < grad[idx]) {
              isMin = false;
              break;
            }
          }
        }
        if (!isMin) break;
      }
      if (isMin) {
        labels[idx] = markerLabel;
        markerLabel++;
      }
    }
    
    // 5. Flooding: Propaga os rótulos iterativamente
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < pixels.length; i++) {
        const idx = pixels[i].index;
        if (labels[idx] === -1) { // processa apenas pixels sem rótulo
          const x = idx % width;
          const y = Math.floor(idx / width);
          const neighborLabels = new Set();
          // Percorre vizinhos 8-connected
          for (let j = -1; j <= 1; j++) {
            for (let k = -1; k <= 1; k++) {
              let nx = x + k, ny = y + j;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (labels[nIdx] > 0) { // considera apenas pixels já rotulados (rótulo > 0)
                  neighborLabels.add(labels[nIdx]);
                }
              }
            }
          }
          if (neighborLabels.size === 1) {
            labels[idx] = neighborLabels.values().next().value;
            changed = true;
          } else if (neighborLabels.size > 1) {
            labels[idx] = 0; // marca como fronteira
            changed = true;
          }
        }
      }
    }
    
    // 6. Gera a imagem de saída como imagem binária:
    // Pixels com rótulo 0 (fronteiras) serão brancos, os demais pretos.
    const resultCtx = resultCanvas.getContext('2d');
    const resultImage = resultCtx.createImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const offset = i * 4;
      if (labels[i] === 0) {
        // Fronteira: branco
        resultImage.data[offset] = 255;
        resultImage.data[offset + 1] = 255;
        resultImage.data[offset + 2] = 255;
        resultImage.data[offset + 3] = 255;
      } else {
        // Regiões internas: preto
        resultImage.data[offset] = 0;
        resultImage.data[offset + 1] = 0;
        resultImage.data[offset + 2] = 0;
        resultImage.data[offset + 3] = 255;
      }
    }
    resultCtx.putImageData(resultImage, 0, 0);
  }
  
  // Função que converte a imagem para escala de cinza
  function toGrayscale(imageData, width, height) {
    const data = imageData.data;
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
    return gray;
  }
  
  // Função que calcula a magnitude do gradiente usando o operador Sobel
  function computeGradient(gray, width, height) {
    const grad = new Float32Array(width * height);
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        for (let j = -1; j <= 1; j++) {
          for (let i = -1; i <= 1; i++) {
            const pixel = gray[(y + j) * width + (x + i)];
            gx += pixel * sobelX[(j + 1) * 3 + (i + 1)];
            gy += pixel * sobelY[(j + 1) * 3 + (i + 1)];
          }
        }
        grad[y * width + x] = Math.sqrt(gx * gx + gy * gy);
      }
    }
    return grad;
  }
  
  // Expor a função processWatershed para o escopo global
  window.processWatershed = processWatershed;
})();
