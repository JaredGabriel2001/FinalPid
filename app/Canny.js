/**
 * Processa a imagem utilizando o algoritmo de Canny.
 * @param {ImageData} imageData - Dados da imagem original.
 * @param {number} width - Largura da imagem.
 * @param {number} height - Altura da imagem.
 * @param {HTMLCanvasElement} resultCanvas - Canvas onde o resultado será exibido.
 */
function processCanny(imageData, width, height, resultCanvas) {
  // Converte para escala de cinza
  let grayData = toGrayscale(imageData);

  // Suavização: aplica filtro Gaussiano para reduzir ruídos
  let sigma = 1.0;
  let kernelSize = 5;
  let gaussian = createGaussianKernel(sigma, kernelSize);
  let blurred = convolute(grayData, width, height, gaussian, kernelSize, kernelSize);

  // Calcula os gradientes usando os operadores de Sobel
  let sobelX = [
    -1, 0, 1,
    -2, 0, 2,
    -1, 0, 1
  ];
  let sobelY = [
    -1, -2, -1,
     0,  0,  0,
     1,  2,  1
  ];
  let gradX = convolute(blurred, width, height, sobelX, 3, 3);
  let gradY = convolute(blurred, width, height, sobelY, 3, 3);

  // Calcula a magnitude e o ângulo do gradiente para cada pixel
  let gradient = new Float32Array(width * height);
  let angle = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    gradient[i] = Math.hypot(gradX[i], gradY[i]);
    angle[i] = Math.atan2(gradY[i], gradX[i]);
  }

  // Supressão de não-máximos para afinar as bordas
  let nonMax = nonMaxSuppression(gradient, angle, width, height);

  // Define thresholds dinâmicos com base na magnitude máxima do gradiente
  let maxGrad = 0;
  for (let i = 0; i < nonMax.length; i++) {
    if (nonMax[i] > maxGrad) maxGrad = nonMax[i];
  }
  let highThreshold = 0.2 * maxGrad;
  let lowThreshold = 0.1 * maxGrad;

  // Aplica threshold duplo com histerese para rastreamento das bordas
  let edges = hysteresis(nonMax, width, height, lowThreshold, highThreshold);

  // Exibe o resultado: bordas em branco sobre fundo preto
  let resultCtx = resultCanvas.getContext('2d');
  let resultImage = resultCtx.createImageData(width, height);
  for (let i = 0; i < edges.length; i++) {
    let value = edges[i] ? 255 : 0;
    resultImage.data[i * 4 + 0] = value;
    resultImage.data[i * 4 + 1] = value;
    resultImage.data[i * 4 + 2] = value;
    resultImage.data[i * 4 + 3] = 255;
  }
  resultCtx.putImageData(resultImage, 0, 0);
}

/* Funções auxiliares para Canny */

// Converte a imagem para escala de cinza (Float32Array)
function toGrayscale(imageData) {
  const data = imageData.data;
  const gray = new Float32Array(imageData.width * imageData.height);
  for (let i = 0; i < data.length; i += 4) {
    let luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[i / 4] = luminance;
  }
  return gray;
}

// Cria um kernel Gaussiano
function createGaussianKernel(sigma, size) {
  const kernel = [];
  const mean = Math.floor(size / 2);
  let sum = 0;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      let ex = Math.exp(-0.5 * (Math.pow((x - mean) / sigma, 2) + Math.pow((y - mean) / sigma, 2)));
      let value = ex / (2 * Math.PI * sigma * sigma);
      kernel.push(value);
      sum += value;
    }
  }
  return kernel.map(val => val / sum);
}

// Convolução para imagens representadas por array 1D (Float32Array)
function convolute(input, width, height, kernel, kWidth, kHeight) {
  const output = new Float32Array(width * height);
  const halfKW = Math.floor(kWidth / 2);
  const halfKH = Math.floor(kHeight / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let ky = 0; ky < kHeight; ky++) {
        for (let kx = 0; kx < kWidth; kx++) {
          const posX = x + kx - halfKW;
          const posY = y + ky - halfKH;
          if (posX >= 0 && posX < width && posY >= 0 && posY < height) {
            let imageVal = input[posY * width + posX];
            let kernelVal = kernel[ky * kWidth + kx];
            sum += imageVal * kernelVal;
          }
        }
      }
      output[y * width + x] = sum;
    }
  }
  return output;
}

// Supressão de não-máximos: afina as bordas mantendo apenas os picos da magnitude do gradiente
function nonMaxSuppression(gradient, angle, width, height) {
  let output = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let idx = y * width + x;
      let ang = angle[idx];
      let deg = ((ang * 180 / Math.PI) + 180) % 180;
      let g = gradient[idx];
      let g1, g2;
      if ((deg >= 0 && deg < 22.5) || (deg >= 157.5 && deg < 180)) {
        g1 = gradient[idx - 1];
        g2 = gradient[idx + 1];
      } else if (deg >= 22.5 && deg < 67.5) {
        g1 = gradient[(y - 1) * width + (x + 1)];
        g2 = gradient[(y + 1) * width + (x - 1)];
      } else if (deg >= 67.5 && deg < 112.5) {
        g1 = gradient[(y - 1) * width + x];
        g2 = gradient[(y + 1) * width + x];
      } else { // 112.5 - 157.5
        g1 = gradient[(y - 1) * width + (x - 1)];
        g2 = gradient[(y + 1) * width + (x + 1)];
      }
      output[idx] = (g >= g1 && g >= g2) ? g : 0;
    }
  }
  return output;
}

// Histerese: aplica thresholds duplo e rastreamento para definir as bordas finais
function hysteresis(image, width, height, lowThreshold, highThreshold) {
  let result = new Uint8Array(width * height);
  let strong = 255, weak = 25;

  // Primeira passagem: classifica cada pixel
  for (let i = 0; i < image.length; i++) {
    if (image[i] >= highThreshold) {
      result[i] = strong;
    } else if (image[i] >= lowThreshold) {
      result[i] = weak;
    } else {
      result[i] = 0;
    }
  }

  // Segunda passagem: rastreamento por histerese para conectar bordas fracas a fortes
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let idx = y * width + x;
      if (result[idx] === weak) {
        if (
          result[(y - 1) * width + (x - 1)] === strong ||
          result[(y - 1) * width + x] === strong ||
          result[(y - 1) * width + (x + 1)] === strong ||
          result[y * width + (x - 1)] === strong ||
          result[y * width + (x + 1)] === strong ||
          result[(y + 1) * width + (x - 1)] === strong ||
          result[(y + 1) * width + x] === strong ||
          result[(y + 1) * width + (x + 1)] === strong
        ) {
          result[idx] = strong;
        } else {
          result[idx] = 0;
        }
      }
    }
  }

  // Converte pixels fortes para 1 e os demais para 0
  let finalEdges = new Uint8Array(width * height);
  for (let i = 0; i < result.length; i++) {
    finalEdges[i] = result[i] === strong ? 1 : 0;
  }
  return finalEdges;
}
