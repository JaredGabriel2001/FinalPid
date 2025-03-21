// BoxFilter.js
function processBoxFilter(imageData, width, height, resultCanvas, kernelSize) {
    // 1. Converte a imagem para escala de cinza
    const grayData = toGrayscale(imageData);
  
    // 2. Aplica o filtro box com o tamanho de kernel especificado
    const filteredData = applyBoxFilter(grayData, width, height, kernelSize);
  
    // 3. Cria a imagem resultante (em escala de cinza)
    const resultImageData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < filteredData.length; i++) {
      const value = filteredData[i];
      resultImageData[i * 4 + 0] = value; // R
      resultImageData[i * 4 + 1] = value; // G
      resultImageData[i * 4 + 2] = value; // B
      resultImageData[i * 4 + 3] = 255;   // A
    }
  
    // 4. Exibe a imagem filtrada no canvas de resultado
    const resultCtx = resultCanvas.getContext('2d');
    const resultImage = resultCtx.createImageData(width, height);
    resultImage.data.set(resultImageData);
    resultCtx.putImageData(resultImage, 0, 0);
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
   * Aplica o filtro box (média) na imagem em escala de cinza.
   * @param {Float32Array} grayData - Imagem em escala de cinza.
   * @param {number} width - Largura da imagem.
   * @param {number} height - Altura da imagem.
   * @param {number} kernelSize - Tamanho do kernel (2, 3, 5, ou 7).
   * @returns {Float32Array} Imagem filtrada.
   */
  function applyBoxFilter(grayData, width, height, kernelSize) {
    const result = new Float32Array(width * height);
    const halfKernel = Math.floor(kernelSize / 2);
    const kernelArea = kernelSize * kernelSize;
  
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
  
        // Soma os valores dos pixels dentro do kernel
        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const nx = x + kx;
            const ny = y + ky;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              sum += grayData[ny * width + nx];
              count++;
            }
          }
        }
  
        // Calcula a média e atribui ao pixel central
        result[y * width + x] = sum / count;
      }
    }
    return result;
  }