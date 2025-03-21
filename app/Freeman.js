/*
Codifica o contorno de um objeto em uma imagem binária como uma sequência de direções (0 a 7), 
seguindo a borda em 8-conectividade, para compactação ou análise de forma.
*/ 
(function() {
  /**
   * Processa a imagem utilizando o Método de Otsu para binarização e retorna a Cadeia de Freeman.
   * Exibe a cadeia em um alert.
   * @param {ImageData} imageData - Dados da imagem original.
   * @param {number} width - Largura da imagem.
   * @param {number} height - Altura da imagem.
   * @param {HTMLCanvasElement} resultCanvas - Canvas (usado apenas para compatibilidade).
   * @returns {string} A Cadeia de Freeman como uma string de direções (0-7).
   */
  function processFreeman(imageData, width, height, resultCanvas) {
    // 1. Aplicar Otsu para obter uma imagem binária
    const binaryImage = applyOtsuThreshold(imageData, width, height);

    // 2. Extrair a Cadeia de Freeman
    const chainCode = extractFreemanChain(binaryImage, width, height);

    // 3. Exibir a cadeia em um alert
    if (chainCode) {
      alert("Cadeia de Freeman: " + chainCode);
    } else {
      alert("Nenhuma cadeia de Freeman encontrada!");
    }

    // Retornar a cadeia para uso posterior, se necessário
    return chainCode;
  }

  /**
   * Aplica o Método de Otsu na imagem e retorna uma imagem binária.
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
   * @param {ImageData} imageData - Imagem binária resultante do Otsu.
   * @param {number} width - Largura da imagem.
   * @param {number} height - Altura da imagem.
   * @returns {string} A Cadeia de Freeman como uma string de direções.
   */
  function extractFreemanChain(imageData, width, height) {
    const data = imageData.data;

    // 1. Encontrar o primeiro pixel de borda do objeto
    let start = null;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx] === 255) { // Objeto (branco)
          if (isBoundary(data, x, y, width, height)) {
            start = { x, y };
            break;
          }
        }
      }
      if (start) break;
    }
    if (!start) {
      console.log("Nenhuma borda encontrada no objeto!");
      return "";
    }

    // 2. Definir as 8 direções da Cadeia de Freeman (0 a 7, sentido horário)
    const directions = [
      { dx: 1, dy: 0 },   // 0: Leste
      { dx: 1, dy: -1 },  // 1: Nordeste
      { dx: 0, dy: -1 },  // 2: Norte
      { dx: -1, dy: -1 }, // 3: Noroeste
      { dx: -1, dy: 0 },  // 4: Oeste
      { dx: -1, dy: 1 },  // 5: Sudoeste
      { dx: 0, dy: 1 },   // 6: Sul
      { dx: 1, dy: 1 }    // 7: Sudeste
    ];

    // 3. Extrair a cadeia seguindo o contorno no sentido horário
    let chainCode = [];
    let current = { x: start.x, y: start.y };
    let prevDirection = 0; // Começa assumindo direção inicial como Leste
    const visited = new Uint8Array(width * height); // Para evitar loops infinitos
    visited[current.y * width + current.x] = 1;

    do {
      let found = false;
      // Testa direções no sentido horário a partir da direção anterior
      for (let i = 0; i < 8; i++) {
        const d = (prevDirection + i) % 8;
        const nx = current.x + directions[d].dx;
        const ny = current.y + directions[d].dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

        const nIdx = (ny * width + nx) * 4;
        const visitedIdx = ny * width + nx;
        if (data[nIdx] === 255 && !visited[visitedIdx] && isBoundary(data, nx, ny, width, height)) {
          chainCode.push(d);
          visited[visitedIdx] = 1;
          current = { x: nx, y: ny };
          prevDirection = d;
          found = true;
          break;
        }
      }

      // Se não encontrou próximo pixel, para
      if (!found) break;

      // Verifica se voltou ao ponto inicial
    } while (!(current.x === start.x && current.y === start.y) && chainCode.length < width * height);

    // Retorna a cadeia como string
    return chainCode.join("");
  }

  /**
   * Verifica se um pixel é uma borda (tem pelo menos um vizinho 0 na 8-conectividade).
   * @param {Uint8ClampedArray} data - Dados da imagem binária.
   * @param {number} x - Coordenada x.
   * @param {number} y - Coordenada y.
   * @param {number} width - Largura da imagem.
   * @param {number} height - Altura da imagem.
   * @returns {boolean} True se for borda.
   */
  function isBoundary(data, x, y, width, height) {
    const idx = (y * width + x) * 4;
    if (data[idx] !== 255) return false; // Não é objeto

    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        if (i === 0 && j === 0) continue;
        const nx = x + i;
        const ny = y + j;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return true; // Borda da imagem
        const nIdx = (ny * width + nx) * 4;
        if (data[nIdx] === 0) return true; // Vizinho é fundo
      }
    }
    return false;
  }

  // Expor a função processFreeman para o escopo global
  window.processFreeman = processFreeman;
})();