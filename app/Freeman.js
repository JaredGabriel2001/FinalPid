// Freeman.js - Encapsulado para evitar conflitos
(function() {
    /**
     * Processa a imagem utilizando o Método de Otsu para binarização
     * e, em seguida, aplica a Cadeia de Freeman para extrair o contorno.
     * 
     * @param {ImageData} imageData - Dados da imagem original.
     * @param {number} width - Largura da imagem.
     * @param {number} height - Altura da imagem.
     * @param {HTMLCanvasElement} resultCanvas - Canvas onde o resultado será exibido.
     */
    function processFreeman(imageData, width, height, resultCanvas) {
      // 1. Aplicar Otsu para obter uma imagem binária
      const binaryImage = applyOtsuThreshold(imageData, width, height);
      
      // 2. Aplicar a Cadeia de Freeman na imagem binarizada
      extractFreemanChain(binaryImage, width, height, resultCanvas);
    }
  
    /**
     * Aplica o Método de Otsu na imagem e retorna uma imagem binária.
     * 
     * @param {ImageData} imageData - Dados da imagem original.
     * @param {number} width - Largura da imagem.
     * @param {number} height - Altura da imagem.
     * @returns {ImageData} Imagem binária.
     */
    function applyOtsuThreshold(imageData, width, height) {
      const resultCanvas = document.createElement("canvas");
      resultCanvas.width = width;
      resultCanvas.height = height;
      const resultCtx = resultCanvas.getContext("2d");
  
      // Chama o processo de Otsu para binarizar a imagem
      processOtsu(imageData, width, height, resultCanvas);
  
      // Obtém os novos dados da imagem binária após Otsu
      return resultCtx.getImageData(0, 0, width, height);
    }
  
    /**
     * Extrai a Cadeia de Freeman da imagem binária.
     * 
     * @param {ImageData} imageData - Imagem binária resultante do Otsu.
     * @param {number} width - Largura da imagem.
     * @param {number} height - Altura da imagem.
     * @param {HTMLCanvasElement} resultCanvas - Canvas onde o resultado será exibido.
     */
    function extractFreemanChain(imageData, width, height, resultCanvas) {
      const data = imageData.data;
      
      // 1. Encontrar o primeiro pixel de borda do objeto.
      let start = null;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (data[idx * 4] === 255) { // objeto
            // Verifica se é borda: pelo menos um vizinho (8-connected) é fundo (0)
            let isBoundary = false;
            for (let j = -1; j <= 1 && !isBoundary; j++) {
              for (let i = -1; i <= 1; i++) {
                let nx = x + i, ny = y + j;
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                const nIdx = ny * width + nx;
                if (data[nIdx * 4] === 0) {
                  isBoundary = true;
                  break;
                }
              }
            }
            if (isBoundary) {
              start = { x, y };
              break;
            }
          }
        }
        if (start) break;
      }
      if (!start) {
        alert("Nenhuma borda encontrada no objeto!");
        return;
      }
  
      // 2. Definir as 8 direções segundo a convenção de Freeman:
      const directions = [
        { dx: 1, dy: 0 },    // 0: Leste
        { dx: 1, dy: -1 },   // 1: Nordeste
        { dx: 0, dy: -1 },   // 2: Norte
        { dx: -1, dy: -1 },  // 3: Noroeste
        { dx: -1, dy: 0 },   // 4: Oeste
        { dx: -1, dy: 1 },   // 5: Sudoeste
        { dx: 0, dy: 1 },    // 6: Sul
        { dx: 1, dy: 1 }     // 7: Sudeste
      ];
  
      // 3. Extração do chain code:
      let chainCode = [];
      let current = { x: start.x, y: start.y };
      let prevDirection = 7;
      let finished = false;
  
      while (!finished) {
        let found = false;
        let d;
        for (let i = 0; i < 8; i++) {
          d = (prevDirection + 6 + i) % 8;
          const nx = current.x + directions[d].dx;
          const ny = current.y + directions[d].dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const nIdx = ny * width + nx;
          if (data[nIdx * 4] === 255) { // encontrou pixel do objeto
            chainCode.push(d);
            prevDirection = d;
            current = { x: nx, y: ny };
            found = true;
            break;
          }
        }
        if (!found) {
          break;
        }
        if (current.x === start.x && current.y === start.y) {
          finished = true;
        }
        if (chainCode.length > 10000) {
          alert("Chain code excedeu o limite e foi abortado.");
          break;
        }
      }
  
      // Exibe o chain code em um alert
      alert("Chain Code: " + chainCode.join(" "));
  
      // 4. Desenha os pontos da cadeia no canvas de resultado
      const resultCtx = resultCanvas.getContext('2d');
      const resultImage = resultCtx.createImageData(width, height);
      for (let i = 0; i < data.length; i++) {
        resultImage.data[i] = data[i];
      }
      markPoint(resultImage.data, width, start.x, start.y);
      let pt = { x: start.x, y: start.y };
      for (let i = 0; i < chainCode.length; i++) {
        let d = chainCode[i];
        pt.x += directions[d].dx;
        pt.y += directions[d].dy;
        markPoint(resultImage.data, width, pt.x, pt.y);
      }
      resultCtx.putImageData(resultImage, 0, 0);
    }
  
    /**
     * Marca um pixel no array de dados como vermelho.
     * @param {Uint8ClampedArray} data - Array de dados da imagem.
     * @param {number} width - Largura da imagem.
     * @param {number} x - Coordenada x.
     * @param {number} y - Coordenada y.
     */
    function markPoint(data, width, x, y) {
      const idx = (y * width + x) * 4;
      data[idx] = 255;     // R
      data[idx+1] = 0;     // G
      data[idx+2] = 0;     // B
      data[idx+3] = 255;   // A
    }
  
    // Expor a função processFreeman para o escopo global
    window.processFreeman = processFreeman;
  })();
  