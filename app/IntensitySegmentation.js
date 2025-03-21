// IntensitySegmentation.js
function processIntensitySegmentation(imageData, width, height, resultCanvas) {
    // 1. Converte a imagem para escala de cinza
    const grayData = toGrayscale(imageData);
  
    // 2. Aplica a segmentação de intensidade conforme a tabela
    const segmentedData = applyIntensitySegmentation(grayData);
  
    // 3. Cria a imagem resultante (em escala de cinza segmentada)
    const resultImageData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < segmentedData.length; i++) {
      const value = segmentedData[i];
      resultImageData[i * 4 + 0] = value; // R
      resultImageData[i * 4 + 1] = value; // G
      resultImageData[i * 4 + 2] = value; // B
      resultImageData[i * 4 + 3] = 255;   // A
    }
  
    // 4. Exibe a imagem segmentada no canvas de resultado
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
   * Aplica a segmentação de intensidade conforme a tabela fornecida.
   * @param {Float32Array} grayData - Imagem em escala de cinza.
   * @returns {Float32Array} Imagem segmentada.
   */
  function applyIntensitySegmentation(grayData) {
    const segmented = new Float32Array(grayData.length);
    for (let i = 0; i < grayData.length; i++) {
      const intensity = grayData[i];
      if (intensity >= 0 && intensity <= 50) {
        segmented[i] = 25;
      } else if (intensity <= 100) {
        segmented[i] = 75;
      } else if (intensity <= 150) {
        segmented[i] = 125;
      } else if (intensity <= 200) {
        segmented[i] = 175;
      } else {
        segmented[i] = 255;
      }
    }
    return segmented;
  }