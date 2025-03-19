function processMarrHildreth(imageData, width, height, resultCanvas) {
    let grayData = toGrayscale(imageData);
  
    // Suavização: aplica filtro Gaussiano para reduzir ruído
    let sigma = 1.0;
    let kernelSize = 5; // tamanho ímpar
    let gaussian = createGaussianKernel(sigma, kernelSize);
    let blurred = convolute(grayData, width, height, gaussian, kernelSize, kernelSize);
  
    let laplacianKernel = [
      1,  1, 1,
      1, -8, 1,
      1,  1, 1
    ];
    let laplacian = convolute(blurred, width, height, laplacianKernel, 3, 3);
  
    // Define um threshold dinâmico com base no valor máximo absoluto do Laplaciano
    let maxVal = 0;
    for (let i = 0; i < laplacian.length; i++) {
      let absVal = Math.abs(laplacian[i]);
      if (absVal > maxVal) maxVal = absVal;
    }
    let threshold = 0.1 * maxVal; 
  
    let edges = detectZeroCrossings(laplacian, width, height, threshold);
  
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
  
  function toGrayscale(imageData) {
    const data = imageData.data;
    const gray = new Float32Array(imageData.width * imageData.height);
    for (let i = 0; i < data.length; i += 4) {
      // Cálculo de luminância (peso para cada canal)
      let luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      gray[i / 4] = luminance;
    }
    return gray;
  }
  
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
  
  function detectZeroCrossings(image, width, height, threshold) {
    const output = new Uint8Array(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        let current = image[idx];
        let foundZeroCrossing = false;

        for (let j = -1; j <= 1; j++) {
          for (let i = -1; i <= 1; i++) {
            if(i === 0 && j === 0) continue;
            let neighbor = image[(y + j) * width + (x + i)];
            if (current * neighbor < 0 && Math.abs(current - neighbor) >= threshold) {
              foundZeroCrossing = true;
            }
          }
        }
        output[idx] = foundZeroCrossing ? 1 : 0;
      }
    }
    return output;
  }
  