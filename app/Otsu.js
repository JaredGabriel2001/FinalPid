/**
 * Processa a imagem utilizando o Método de Otsu, gera a imagem binária e conta os objetos.
 * Exibe o resultado no canvas e a quantidade de objetos em um alert.
 * @param {ImageData} imageData - Dados da imagem original.
 * @param {number} width - Largura da imagem.
 * @param {number} height - Altura da imagem.
 * @param {HTMLCanvasElement} resultCanvas - Canvas onde o resultado (imagem binária) será exibido.
 */
function processOtsu(imageData, width, height, resultCanvas) {
  // Converte a imagem para escala de cinza
  const grayData = toGrayscale(imageData);

  // Calcula o histograma (256 níveis de intensidade)
  const histogram = computeHistogram(grayData, width, height);

  // Determina o limiar ótimo utilizando o método de Otsu
  const threshold = calculateOtsuThreshold(histogram, width * height);

  // Cria a imagem binária: pixels com valor >= threshold serão 255, os demais 0
  const binaryImage = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < grayData.length; i++) {
    const value = (grayData[i] >= threshold) ? 255 : 0;
    binaryImage[i * 4 + 0] = value;
    binaryImage[i * 4 + 1] = value;
    binaryImage[i * 4 + 2] = value;
    binaryImage[i * 4 + 3] = 255;
  }

  // Exibe a imagem binária na canvas de resultado
  const resultCtx = resultCanvas.getContext('2d');
  const resultImage = resultCtx.createImageData(width, height);
  resultImage.data.set(binaryImage);
  resultCtx.putImageData(resultImage, 0, 0);

  console.log(`Threshold de Otsu: ${threshold}`);

  // Conta os objetos na imagem binarizada e exibe o resultado em um alert
  const numObjects = countConnectedComponents(binaryImage, width, height);
  alert(`Número de objetos: ${numObjects}`);
}

/* Funções auxiliares para o Método de Otsu */

/**
 * Converte a imagem para escala de cinza.
 * @param {ImageData} imageData - Dados da imagem original.
 * @returns {Float32Array} Array com os valores de cinza.
 */
function toGrayscale(imageData) {
  const data = imageData.data;
  const gray = new Float32Array(imageData.width * imageData.height);
  for (let i = 0; i < data.length; i += 4) {
    // Fórmula padrão de luminância
    let luminance = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    gray[i / 4] = luminance;
  }
  return gray;
}

/**
 * Calcula o histograma da imagem em escala de cinza.
 * @param {Float32Array} grayData - Array com os valores de cinza.
 * @param {number} width - Largura da imagem.
 * @param {number} height - Altura da imagem.
 * @returns {Array<number>} Histograma com 256 posições.
 */
function computeHistogram(grayData, width, height) {
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < grayData.length; i++) {
    const value = Math.round(grayData[i]);
    histogram[value]++;
  }
  return histogram;
}

/**
 * Calcula o limiar ótimo utilizando o método de Otsu.
 * @param {Array<number>} histogram - Histograma da imagem.
 * @param {number} totalPixels - Número total de pixels na imagem.
 * @returns {number} O limiar calculado.
 */
function calculateOtsuThreshold(histogram, totalPixels) {
  let sum = 0;
  for (let t = 0; t < 256; t++) {
    sum += t * histogram[t];
  }
  
  let sumB = 0;
  let wB = 0;
  let varMax = 0;
  let threshold = 0;
  
  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    let wF = totalPixels - wB;
    if (wF === 0) break;
    sumB += t * histogram[t];
    let mB = sumB / wB;
    let mF = (sum - sumB) / wF;
    let varBetween = wB * wF * Math.pow(mB - mF, 2);
    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }
  return threshold;
}

/* Funções para a contagem de objetos */

/**
 * Conta os componentes conectados (objetos) em uma imagem binária.
 * @param {Uint8ClampedArray} binaryImage - Imagem binária (4 canais) com valores 0 ou 255.
 * @param {number} width - Largura da imagem.
 * @param {number} height - Altura da imagem.
 * @returns {number} Número de objetos encontrados.
 */
function countConnectedComponents(binaryImage, width, height) {
  // Converte a imagem para 1 canal (0 ou 1)
  const bin = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    bin[i] = (binaryImage[i * 4] === 255) ? 1 : 0;
  }
  
  // Array para armazenar os rótulos dos componentes
  const labels = new Int32Array(width * height);
  labels.fill(0);
  let labelCount = 0;
  
  // Varre a imagem e aplica flood fill para rotular cada componente conectado (usando 8-conectividade)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let idx = y * width + x;
      if (bin[idx] === 1 && labels[idx] === 0) {
        labelCount++;
        floodFill(bin, labels, width, height, x, y, labelCount);
      }
    }
  }
  return labelCount;
}

/**
 * Função de flood fill para rotular um componente conectado.
 * @param {Uint8Array} bin - Imagem binária (1 canal) com valores 0 ou 1.
 * @param {Int32Array} labels - Array para armazenar os rótulos.
 * @param {number} width - Largura da imagem.
 * @param {number} height - Altura da imagem.
 * @param {number} x - Coordenada x inicial.
 * @param {number} y - Coordenada y inicial.
 * @param {number} label - Rótulo a ser aplicado.
 */
function floodFill(bin, labels, width, height, x, y, label) {
  const stack = [{x, y}];
  while (stack.length > 0) {
    const {x, y} = stack.pop();
    let idx = y * width + x;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (bin[idx] === 0 || labels[idx] !== 0) continue;
    labels[idx] = label;
    // Considera os 8 vizinhos (conectividade 8)
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        if (i === 0 && j === 0) continue;
        let nx = x + i, ny = y + j;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          let nIdx = ny * width + nx;
          if (bin[nIdx] === 1 && labels[nIdx] === 0) {
            stack.push({x: nx, y: ny});
          }
        }
      }
    }
  }
}
