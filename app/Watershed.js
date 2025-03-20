// Watershed.js
function processWatershed(imageData, width, height, resultCanvas) {
  // 1. Converte a imagem para escala de cinza
  const grayData = toGrayscale(imageData);

  // 2. Calcula o gradiente usando Sobel
  const gradient = computeGradient(grayData, width, height);

  // 3. Inicializa os rótulos
  const labels = new Int32Array(width * height);
  labels.fill(-1); // -1 = não rotulado, 0 = fronteira, >0 = regiões

  // 4. Encontra mínimos locais como marcadores
  const markers = findLocalMinima(gradient, width, height, labels);

  // 5. Realiza o flooding
  performWatershedFlooding(gradient, labels, markers, width, height);

  // 6. Cria a imagem binária: fronteiras brancas (255), regiões pretas (0)
  const binaryImage = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < labels.length; i++) {
    const value = labels[i] === 0 ? 255 : 0; // Fronteiras brancas, regiões pretas
    binaryImage[i * 4 + 0] = value; // R
    binaryImage[i * 4 + 1] = value; // G
    binaryImage[i * 4 + 2] = value; // B
    binaryImage[i * 4 + 3] = 255;   // A
  }

  // 7. Exibe o resultado no canvas
  const resultCtx = resultCanvas.getContext('2d');
  const resultImage = resultCtx.createImageData(width, height);
  resultImage.data.set(binaryImage);
  resultCtx.putImageData(resultImage, 0, 0);

  // 8. Conta as regiões segmentadas e exibe no console
  const numRegions = countRegions(labels);
  console.log(`Número de regiões segmentadas: ${numRegions}`);
}

/**
 * Converte a imagem para escala de cinza.
 * @param {ImageData} imageData - Dados da imagem original.
 * @returns {Float32Array} Array com os valores de cinza.
 */
function toGrayscale(imageData) {
  const data = imageData.data;
  const gray = new Float32Array(imageData.width * imageData.height);
  for (let i = 0; i < data.length; i += 4) {
    let luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[i / 4] = luminance;
  }
  return gray;
}

/**
 * Calcula o gradiente da imagem usando o operador Sobel.
 * @param {Float32Array} grayData - Array com os valores de cinza.
 * @param {number} width - Largura da imagem.
 * @param {number} height - Altura da imagem.
 * @returns {Float32Array} Array com a magnitude do gradiente.
 */
function computeGradient(grayData, width, height) {
  const gradient = new Float32Array(width * height).fill(0); // Inicializa com 0 para bordas
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  const offsets = [-width - 1, -width, -width + 1, -1, 0, 1, width - 1, width, width + 1];

  // Calcula gradiente para todos os pixels internos
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      let gx = 0, gy = 0;
      for (let k = 0; k < 9; k++) {
        gx += grayData[idx + offsets[k]] * sobelX[k];
        gy += grayData[idx + offsets[k]] * sobelY[k];
      }
      gradient[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return gradient;
}

/**
 * Encontra mínimos locais no gradiente como marcadores iniciais.
 * @param {Float32Array} gradient - Array com a magnitude do gradiente.
 * @param {number} width - Largura da imagem.
 * @param {number} height - Altura da imagem.
 * @param {Int32Array} labels - Array de rótulos.
 * @returns {Array<number>} Índices dos marcadores.
 */
function findLocalMinima(gradient, width, height, labels) {
  const markers = [];
  let markerLabel = 1;

  // Ordena os pixels pelo valor do gradiente
  const pixels = Array.from({ length: width * height }, (_, i) => i);
  pixels.sort((a, b) => gradient[a] - gradient[b]);

  const visited = new Uint8Array(width * height);
  for (let i = 0; i < pixels.length; i++) {
    const idx = pixels[i];
    if (visited[idx] || gradient[idx] === 0) continue; // Ignora bordas com gradiente 0

    const x = idx % width;
    const y = Math.floor(idx / width);
    let isMin = true;
    const currGrad = gradient[idx];

    const offsets = [-width - 1, -width, -width + 1, -1, 1, width - 1, width, width + 1];
    for (let k = 0; k < offsets.length; k++) {
      const nIdx = idx + offsets[k];
      if (nIdx >= 0 && nIdx < width * height && Math.abs((nIdx % width) - x) <= 1) {
        if (gradient[nIdx] < currGrad) {
          isMin = false;
          break;
        }
      }
    }

    if (isMin) {
      labels[idx] = markerLabel++;
      visited[idx] = 1;
      markers.push(idx);
    }
  }
  return markers;
}

/**
 * Realiza o flooding a partir dos marcadores para segmentar a imagem.
 * @param {Float32Array} gradient - Array com a magnitude do gradiente.
 * @param {Int32Array} labels - Array de rótulos.
 * @param {Array<number>} markers - Índices dos marcadores iniciais.
 * @param {number} width - Largura da imagem.
 * @param {number} height - Altura da imagem.
 */
function performWatershedFlooding(gradient, labels, markers, width, height) {
  // Ordena os pixels pelo valor do gradiente para simular inundação por altura
  const pixels = Array.from({ length: width * height }, (_, i) => i);
  pixels.sort((a, b) => gradient[a] - gradient[b]);

  const queue = [];
  const visited = new Uint8Array(width * height);
  markers.forEach(idx => {
    queue.push(idx);
    visited[idx] = 1;
  });

  const offsets = [-width - 1, -width, -width + 1, -1, 1, width - 1, width, width + 1];

  while (queue.length > 0) {
    const idx = queue.shift();
    const x = idx % width;
    const y = Math.floor(idx / width);
    const currLabel = labels[idx];

    for (let k = 0; k < offsets.length; k++) {
      const nIdx = idx + offsets[k];
      if (nIdx < 0 || nIdx >= width * height || Math.abs((nIdx % width) - x) > 1 || visited[nIdx]) continue;

      if (labels[nIdx] === -1) {
        labels[nIdx] = currLabel;
        visited[nIdx] = 1;
        queue.push(nIdx);
      } else if (labels[nIdx] > 0 && labels[nIdx] !== currLabel) {
        labels[nIdx] = 0; // Marca como fronteira
        visited[nIdx] = 1;
      }
    }
  }

  // Garante que pixels não alcançados sejam tratados (ex.: bordas externas)
  for (let i = 0; i < pixels.length; i++) {
    const idx = pixels[i];
    if (labels[idx] === -1) {
      labels[idx] = 0; // Pixels não rotulados viram fronteira ou fundo
    }
  }
}

/**
 * Conta o número de regiões segmentadas.
 * @param {Int32Array} labels - Array de rótulos.
 * @returns {number} Número de regiões distintas.
 */
function countRegions(labels) {
  const uniqueLabels = new Set();
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] > 0) uniqueLabels.add(labels[i]);
  }
  return uniqueLabels.size;
}