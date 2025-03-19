/**
 * Processa a imagem utilizando o algoritmo Watershed.
 * @param {ImageData} imageData - Dados da imagem original.
 * @param {number} width - Largura da imagem.
 * @param {number} height - Altura da imagem.
 * @param {HTMLCanvasElement} resultCanvas - Canvas onde o resultado será exibido.
 */
function processWatershed(imageData, width, height, resultCanvas) {
    // 1. Converte para escala de cinza
    let gray = toGrayscale(imageData, width, height);
    
    // 2. Calcula a magnitude do gradiente usando o operador Sobel
    let grad = computeGradient(gray, width, height);
    
    // 3. Identifica marcadores: pixels com gradiente baixo e que sejam mínimos locais
    let markers = new Int32Array(width * height);
    markers.fill(-1); // -1 indica não atribuído
    let markerThreshold = 20; // valor arbitrário para considerar uma região interna
    let markerLabel = 1;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let idx = y * width + x;
        if (grad[idx] < markerThreshold) {
          // Verifica se é mínimo local (em uma vizinhança 3x3)
          let isMin = true;
          for (let j = -1; j <= 1; j++) {
            for (let i = -1; i <= 1; i++) {
              let nIdx = (y + j) * width + (x + i);
              if (grad[nIdx] < grad[idx]) {
                isMin = false;
                break;
              }
            }
            if (!isMin) break;
          }
          if (isMin) {
            markers[idx] = markerLabel;
            markerLabel++;
          }
        }
      }
    }
    
    // 4. Ordena os pixels pelo valor do gradiente (ordem crescente)
    let indices = new Array(width * height);
    for (let i = 0; i < width * height; i++) {
      indices[i] = i;
    }
    indices.sort((a, b) => grad[a] - grad[b]);
    
    // 5. Inunda a imagem (flooding): atribui rótulos baseando-se nos vizinhos
    for (let k = 0; k < indices.length; k++) {
      let idx = indices[k];
      let x = idx % width;
      let y = Math.floor(idx / width);
      let neighborLabels = new Set();
      for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
          let nx = x + i, ny = y + j;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            let nIdx = ny * width + nx;
            if (markers[nIdx] > 0) {
              neighborLabels.add(markers[nIdx]);
            }
          }
        }
      }
      if (neighborLabels.size === 1) {
        // Se exatamente um vizinho tem um rótulo, atribui esse mesmo rótulo
        markers[idx] = neighborLabels.values().next().value;
      } else if (neighborLabels.size > 1) {
        // Se há mais de um rótulo, define como fronteira (0)
        markers[idx] = 0;
      } else {
        // Se nenhum vizinho possui rótulo, atribui 0 (pode ser fundo ou fronteira)
        markers[idx] = 0;
      }
    }
    
    // 6. Gera a imagem de saída: cada região (rótulo > 0) recebe uma cor aleatória, fronteiras em preto
    let resultCtx = resultCanvas.getContext('2d');
    let resultImage = resultCtx.createImageData(width, height);
    let colors = {};
    for (let i = 0; i < width * height; i++) {
      let label = markers[i];
      let offset = i * 4;
      if (label > 0) {
        if (!(label in colors)) {
          colors[label] = [Math.floor(Math.random() * 255),
                           Math.floor(Math.random() * 255),
                           Math.floor(Math.random() * 255)];
        }
        let col = colors[label];
        resultImage.data[offset] = col[0];
        resultImage.data[offset + 1] = col[1];
        resultImage.data[offset + 2] = col[2];
        resultImage.data[offset + 3] = 255;
      } else {
        // Fronteiras ou fundo: cor preta
        resultImage.data[offset] = 0;
        resultImage.data[offset + 1] = 0;
        resultImage.data[offset + 2] = 0;
        resultImage.data[offset + 3] = 255;
      }
    }
    resultCtx.putImageData(resultImage, 0, 0);
  }
  
  /* Funções auxiliares */
  
  // Converte a imagem para escala de cinza (Float32Array)
  function toGrayscale(imageData, width, height) {
    const data = imageData.data;
    let gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      let r = data[i * 4];
      let g = data[i * 4 + 1];
      let b = data[i * 4 + 2];
      gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
    return gray;
  }
  
  // Calcula a magnitude do gradiente usando o operador Sobel
  function computeGradient(gray, width, height) {
    let grad = new Float32Array(width * height);
    // Kernels Sobel para X e Y
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        for (let j = -1; j <= 1; j++) {
          for (let i = -1; i <= 1; i++) {
            let pixel = gray[(y + j) * width + (x + i)];
            gx += pixel * sobelX[(j + 1) * 3 + (i + 1)];
            gy += pixel * sobelY[(j + 1) * 3 + (i + 1)];
          }
        }
        grad[y * width + x] = Math.sqrt(gx * gx + gy * gy);
      }
    }
    return grad;
  }
  