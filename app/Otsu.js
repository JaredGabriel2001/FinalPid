function processOtsu(imageData, width, height, resultCanvas) {
    // Converte a imagem para escala de cinza
    let grayData = toGrayscale(imageData);
  
    // Calcula o histograma (256 níveis)
    let histogram = new Array(256).fill(0);
    for (let i = 0; i < grayData.length; i++) {
      let intensity = Math.floor(grayData[i]);
      histogram[intensity]++;
    }
    let total = grayData.length;
  
    // Calcula a soma total ponderada dos níveis
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }
  
    // Determina o threshold ótimo usando o método de Otsu
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let varMax = 0;
    let threshold = 0;
    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;
      wF = total - wB;
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
  
    // Binariza a imagem usando o threshold determinado
    let binary = new Uint8Array(width * height);
    for (let i = 0; i < grayData.length; i++) {
      binary[i] = grayData[i] > threshold ? 1 : 0;
    }
  
    // Conta os objetos (componentes conectados) na imagem binária
    let numObjects = countObjects(binary, width, height);
  
    // Exibe o resultado: imagem binária (objetos em branco sobre fundo preto)
    let resultCtx = resultCanvas.getContext('2d');
    let resultImage = resultCtx.createImageData(width, height);
    for (let i = 0; i < binary.length; i++) {
      let value = binary[i] ? 255 : 0;
      resultImage.data[i * 4 + 0] = value;
      resultImage.data[i * 4 + 1] = value;
      resultImage.data[i * 4 + 2] = value;
      resultImage.data[i * 4 + 3] = 255;
    }
    resultCtx.putImageData(resultImage, 0, 0);
  
    // Exibe os resultados (threshold e número de objetos) para o usuário
    //alert("Threshold de Otsu: " + threshold + "\nNúmero de objetos: " + numObjects);
  }
  
  /**
   * Converte a imagem para escala de cinza.
   * @param {ImageData} imageData - Dados da imagem original.
   * @returns {Float32Array} - Array com a intensidade em escala de cinza para cada pixel.
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
   * Conta os objetos (componentes conectados) em uma imagem binária.
   * Utiliza uma busca em profundidade (DFS) para rotular cada componente.
   * @param {Uint8Array} binary - Imagem binária (1 = objeto, 0 = fundo).
   * @param {number} width - Largura da imagem.
   * @param {number} height - Altura da imagem.
   * @returns {number} - Número de objetos encontrados.
   */
  function countObjects(binary, width, height) {
    let visited = new Uint8Array(width * height);
    let count = 0;
  
    // Função auxiliar que realiza DFS para marcar a região conectada
    function dfs(x, y) {
      let stack = [];
      stack.push({ x, y });
      while (stack.length > 0) {
        let { x, y } = stack.pop();
        let idx = y * width + x;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        if (visited[idx] || binary[idx] === 0) continue;
        visited[idx] = 1;
        // Adiciona os vizinhos 8-connected
        stack.push({ x: x - 1, y: y - 1 });
        stack.push({ x: x,     y: y - 1 });
        stack.push({ x: x + 1, y: y - 1 });
        stack.push({ x: x - 1, y: y });
        stack.push({ x: x + 1, y: y });
        stack.push({ x: x - 1, y: y + 1 });
        stack.push({ x: x,     y: y + 1 });
        stack.push({ x: x + 1, y: y + 1 });
      }
    }
  
    // Percorre todos os pixels procurando por novos componentes
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let idx = y * width + x;
        if (binary[idx] === 1 && !visited[idx]) {
          count++;
          dfs(x, y);
        }
      }
    }
    return count;
  }
  