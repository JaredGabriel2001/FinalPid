// Otsu.js
function processOtsu(imageData, width, height, resultCanvas) {
  // 1. Suaviza a imagem para reduzir reflexos
  const smoothedData = gaussianBlur(imageData, width, height);

  // 2. Converte a imagem suavizada para escala de cinza
  const grayData = toGrayscale(smoothedData);

  // 3. Calcula o histograma (256 níveis de intensidade)
  const histogram = computeHistogram(grayData, width, height);

  // 4. Determina o limiar ótimo utilizando o método de Otsu
  const threshold = calculateOtsuThreshold(histogram, width * height);

  // 5. Cria a imagem binária: pixels com valor >= threshold serão 255 (objeto), os demais 0
  const binaryImage = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < grayData.length; i++) {
    const value = (grayData[i] >= threshold) ? 255 : 0;
    binaryImage[i * 4 + 0] = value;
    binaryImage[i * 4 + 1] = value;
    binaryImage[i * 4 + 2] = value;
    binaryImage[i * 4 + 3] = 255;
  }

  // 6. Aplica operações morfológicas para remover reflexos internos
  let bin = binaryToSingleChannel(binaryImage, width, height); // Converte para 1 canal (0 ou 1)
  // Inverte a imagem binária: bola preta (0), fundo branco (1) -> bola branca (1), fundo preto (0)
  for (let i = 0; i < bin.length; i++) {
    bin[i] = bin[i] === 1 ? 0 : 1;
  }
  // Aplica múltiplas iterações de erosão para remover reflexos (pequenos pontos pretos)
  bin = erode(bin, width, height, 2); // 2 iterações de erosão
  // Aplica dilatação para restaurar o tamanho da bola
  bin = dilate(bin, width, height, 2); // 2 iterações de dilatação

  // 7. Converte de volta para formato RGBA para exibição
  const processedBinaryImage = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < bin.length; i++) {
    const value = bin[i] === 1 ? 255 : 0; // Bola branca, fundo preto
    processedBinaryImage[i * 4 + 0] = value;
    processedBinaryImage[i * 4 + 1] = value;
    processedBinaryImage[i * 4 + 2] = value;
    processedBinaryImage[i * 4 + 3] = 255;
  }

  // 8. Exibe a imagem binária processada na canvas de resultado
  const resultCtx = resultCanvas.getContext('2d');
  const resultImage = resultCtx.createImageData(width, height);
  resultImage.data.set(processedBinaryImage);
  resultCtx.putImageData(resultImage, 0, 0);

  console.log(`Threshold de Otsu: ${threshold}`);

  // 9. Conta os objetos na imagem binarizada processada e exibe o resultado em um alert
  const numObjects = countConnectedComponents(processedBinaryImage, width, height);
  alert(`Número de objetos: ${numObjects}`);
}

/* Funções auxiliares para Pré-processamento */

/**
 * Aplica um filtro Gaussiano para suavizar a imagem e reduzir reflexos.
 * @param {ImageData} imageData - Dados da imagem original.
 * @param {number} width - Largura da imagem.
 * @param {number} height - Altura da imagem.
 * @returns {ImageData} Imagem suavizada.
 */
function gaussianBlur(imageData, width, height) {
  const kernel = [
    1, 2, 1,
    2, 4, 2,
    1, 2, 1
  ];
  const kernelSum = 16; // Soma dos valores do kernel
  const resultData = new Uint8ClampedArray(imageData.data.slice());
  const tempData = new Uint8ClampedArray(imageData.data.slice());

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let idx = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel++) { // R, G, B
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const kIdx = (ky + 1) * 3 + (kx + 1);
            const pixelIdx = ((y + ky) * width + (x + kx)) * 4 + channel;
            sum += imageData.data[pixelIdx] * kernel[kIdx];
          }
        }
        tempData[idx + channel] = sum / kernelSum;
      }
      tempData[idx + 3] = 255; // Alpha
    }
  }

  // Copia os dados suavizados para resultData
  resultData.set(tempData);
  return new ImageData(resultData, width, height);
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

/* Funções para operações morfológicas */

/**
 * Converte imagem binária RGBA para 1 canal (0 ou 1).
 * @param {Uint8ClampedArray} binaryImage - Imagem binária (4 canais).
 * @param {number} width - Largura da imagem.
 * @param {number} height - Altura da imagem.
 * @returns {Uint8Array} Imagem binária em 1 canal.
 */
function binaryToSingleChannel(binaryImage, width, height) {
  const bin = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    bin[i] = (binaryImage[i * 4] === 255) ? 1 : 0;
  }
  return bin;
}

/**
 * Aplica erosão na imagem binária para remover detalhes internos.
 * @param {Uint8Array} bin - Imagem binária em 1 canal.
 * @param {number} width - Largura da imagem.
 * @param {number} height - Altura da imagem.
 * @param {number} iterations - Número de iterações.
 * @returns {Uint8Array} Imagem erodida.
 */
function erode(bin, width, height, iterations = 1) {
  let result = new Uint8Array(bin);
  const kernelSize = 3; // Kernel 3x3
  const halfKernel = Math.floor(kernelSize / 2);

  for (let iter = 0; iter < iterations; iter++) {
    const temp = new Uint8Array(result);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let keep = true;
        for (let j = -halfKernel; j <= halfKernel; j++) {
          for (let i = -halfKernel; i <= halfKernel; i++) {
            const nx = x + i;
            const ny = y + j;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
              keep = false;
              break;
            }
            if (result[ny * width + nx] === 0) {
              keep = false;
              break;
            }
          }
          if (!keep) break;
        }
        temp[y * width + x] = keep ? 1 : 0;
      }
    }
    result = temp;
  }
  return result;
}

/**
 * Aplica dilatação na imagem binária para restaurar tamanho dos objetos.
 * @param {Uint8Array} bin - Imagem binária em 1 canal.
 * @param {number} width - Largura da imagem.
 * @param {number} height - Altura da imagem.
 * @param {number} iterations - Número de iterações.
 * @returns {Uint8Array} Imagem dilatada.
 */
function dilate(bin, width, height, iterations = 1) {
  let result = new Uint8Array(bin);
  const kernelSize = 3; // Kernel 3x3
  const halfKernel = Math.floor(kernelSize / 2);

  for (let iter = 0; iter < iterations; iter++) {
    const temp = new Uint8Array(result);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let expand = false;
        for (let j = -halfKernel; j <= halfKernel; j++) {
          for (let i = -halfKernel; i <= halfKernel; i++) {
            const nx = x + i;
            const ny = y + j;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (result[ny * width + nx] === 1) {
                expand = true;
                break;
              }
            }
          }
          if (expand) break;
        }
        temp[y * width + x] = expand ? 1 : 0;
      }
    }
    result = temp;
  }
  return result;
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
  const bin = binaryToSingleChannel(binaryImage, width, height);
  const labels = new Int32Array(width * height);
  labels.fill(0);
  let labelCount = 0;

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
  const stack = [{ x, y }];
  while (stack.length > 0) {
    const { x, y } = stack.pop();
    let idx = y * width + x;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (bin[idx] === 0 || labels[idx] !== 0) continue;
    labels[idx] = label;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        if (i === 0 && j === 0) continue;
        let nx = x + i, ny = y + j;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          let nIdx = ny * width + nx;
          if (bin[nIdx] === 1 && labels[nIdx] === 0) {
            stack.push({ x: nx, y: ny });
          }
        }
      }
    }
  }
}