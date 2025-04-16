// Configurações
const API_BASE_URL = 'http://localhost:3000';
let FALLBACK_MODE = false; // Modo de fallback quando a API não está disponível

// Função para mostrar erros de forma amigável
function showError(message, details = '') {
    const errorContainer = document.getElementById('error-container') || document.createElement('div');
    errorContainer.id = 'error-container';
    errorContainer.innerHTML = `
      <div class="error-alert">
        <h4>${message}</h4>
        ${details ? `<p>${details}</p>` : ''}
        <button onclick="this.parentElement.parentElement.remove()">Fechar</button>
      </div>
    `;
    errorContainer.style.position = 'fixed';
    errorContainer.style.bottom = '20px';
    errorContainer.style.right = '20px';
    errorContainer.style.zIndex = '1000';
    document.body.appendChild(errorContainer);
  }  

// Banco de dados de músicas
const musicasPorMateria = {
  matematica: [ 
    { 
      titulo: "Dança dos Números", 
      arquivo: "/musicas/danca_numeros.mp3",
      descricao: "Música animada que ensina contagem de 1 a 10 através de ritmo e melodia."
    },
    { 
      titulo: "Formas Divertidas", 
      arquivo: "/musicas/formas_divertidas.mp3",
      descricao: "Canção sobre formas geométricas básicas com exemplos do cotidiano."
    },
    { 
        titulo: "Aprendendo Horas", 
        arquivo: "/musicas/horas.mp3",
        descricao: "Canção sobre como entender as horas."
    },
    { 
        titulo: "Do maior para o Menor", 
        arquivo: "/musicas/maior_menor.mp3",
        descricao: "Canção sobre o conceito de maior e menor, o que é decrescente."
    }
  ]
};

// Função para navegação entre seções
function navegarPara(secao) {
  document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
  const secaoAtual = document.getElementById(secao);
  if (secaoAtual) {
    secaoAtual.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Foco no conteúdo principal para acessibilidade
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
    }
  }
}

// Carrega músicas pré-gravadas
function carregarMusicas(materia) {
  const listaMusicas = document.getElementById(`lista-musicas-${materia}`);
  if (!listaMusicas) return;

  listaMusicas.innerHTML = '<div class="loading-message"><div class="loading-spinner"></div> Carregando...</div>';

  setTimeout(() => {
    listaMusicas.innerHTML = '';
    
    if (!musicasPorMateria[materia] || musicasPorMateria[materia].length === 0) {
      listaMusicas.innerHTML = '<p class="no-music">Nenhuma música disponível no momento.</p>';
      return;
    }

    musicasPorMateria[materia].forEach(musica => {
      const item = document.createElement('article');
      item.className = 'music-item';
      item.setAttribute('aria-label', `Música: ${musica.titulo}`);
      item.innerHTML = `
        <div class="music-info">
          <h3>${musica.titulo}</h3>
          <audio controls class="audio-player" aria-label="Player da música ${musica.titulo}">
            <source src="${musica.arquivo}" type="audio/mpeg">
            Seu navegador não suporta o elemento de áudio.
          </audio>
          <div class="music-actions">
            <button onclick="gerarDescricaoIA('${musica.titulo}')" class="btn-small" aria-label="Gerar descrição acessível para ${musica.titulo}">
              <span aria-hidden="true">📝</span> Descrição Acessível
            </button>
            <button onclick="falarTexto('${musica.titulo}. ${musica.descricao.replace(/'/g, "\\'")}')" class="btn-small" aria-label="Ouvir descrição da música ${musica.titulo}">
              <span aria-hidden="true">🔊</span> Ouvir Descrição
            </button>
          </div>
        </div>
      `;
      listaMusicas.appendChild(item);
    });
  }, 800);
}

function addButtonPressEffect(button) {
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = '';
    }, 100);
} 
// Função para gerar descrição
async function gerarDescricaoIA(tituloMusica) {
    const descricaoContainer = document.getElementById('descricao-musica');
    descricaoContainer.innerHTML = '<div class="loading-spinner"></div><p>Gerando descrição acessível...</p>';
  
    try {
      const musica = musicasPorMateria.matematica.find(m => m.titulo === tituloMusica);
      if (!musica) throw new Error('Música não encontrada');
  
      const response = await fetch(`${API_BASE_URL}/api/gerar-descricao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Crie uma descrição acessível detalhada da música "${tituloMusica}"...`
        })
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Erro na resposta:', data);
        throw new Error(data.error || 'Erro desconhecido');
      }
  
      if (!data.descricao) {
        throw new Error('A API não retornou uma descrição');
      }
  
      descricaoContainer.innerHTML = `
        <div class="descricao-texto">${data.descricao}</div>
        <button onclick="falarTexto('${data.descricao.replace(/'/g, "\\'")}')" class="btn-small">
          <span>🔊</span> Ouvir Descrição
        </button>
      `;
  
    } catch (error) {
      console.error('Erro ao gerar descrição:', error);
      showError('Falha ao gerar descrição', error.message);
      descricaoContainer.innerHTML = `
        <div class="error-message">
          <p>❌ Não foi possível gerar a descrição</p>
          <p><small>${error.message}</small></p>
        </div>
      `;
    }
  }
  
  // Adicione este CSS para os erros
  const errorStyle = document.createElement('style');
  errorStyle.textContent = `
    .error-alert {
      background: #ffebee;
      color: #c62828;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 400px;
    }
    .error-alert button {
      margin-top: 0.5rem;
      padding: 0.25rem 0.5rem;
      background: #c62828;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(errorStyle);
  

// Fallback para descrição
function mostrarDescricaoFallback(tituloMusica) {
  const descricaoContainer = document.getElementById('descricao-musica');
  if (!descricaoContainer) return;

  const musica = musicasPorMateria.matematica.find(m => m.titulo === tituloMusica);
  
  if (musica) {
    descricaoContainer.innerHTML = `
      <div class="descricao-texto" aria-live="polite">
        <p><strong>Descrição local:</strong> ${musica.descricao}</p>
        <p>Não foi possível acessar o serviço de geração avançada no momento.</p>
      </div>
      <button onclick="falarTexto('${musica.descricao.replace(/'/g, "\\'")}')" class="btn-small" aria-label="Ouvir descrição local">
        <span aria-hidden="true">🔊</span> Ouvir Descrição
      </button>
    `;
  } else {
    descricaoContainer.innerHTML = `
      <div class="error-message" aria-live="polite">
        <p>❌ Serviço indisponível e não há descrição local</p>
      </div>
    `;
  }
}

// Gera letra musical com DeepSeek
async function gerarLetraMusical() {
  const tema = document.getElementById('tema-musica')?.value;
  const estilo = document.getElementById('estilo-musica')?.value || 'infantil';
  const letraContainer = document.getElementById('letra-musica');
  
  if (!tema || !letraContainer) {
    mostrarNotificacao('Por favor, digite um tema para a música', 'error');
    return;
  }

  letraContainer.innerHTML = '<div class="loading-spinner"></div><p>Criando letra musical...</p>';

  try {
    const response = await fetch(`${API_BASE_URL}/api/gerar-letra`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tema, estilo })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao gerar letra");
    }
    
    const data = await response.json();
    
    if (!data.letra) throw new Error("Letra vazia retornada pela API");
    
    letraContainer.innerHTML = `
      <h4>Letra da Música: ${tema} (${estilo})</h4>
      <div class="lyrics-content">${formatLyrics(data.letra)}</div>
      <div class="lyrics-actions">
        <button onclick="falarTexto('Letra da música sobre ${tema}. ${data.letra.replace(/'/g, "\\'")}')" class="btn-small" aria-label="Ouvir letra da música">
          <span aria-hidden="true">🔊</span> Ouvir Letra
        </button>
        <button onclick="gerarDescricaoLetra('${tema}', '${estilo}', '${data.letra.replace(/'/g, "\\'")}')" class="btn-small" aria-label="Gerar descrição da letra">
          <span aria-hidden="true">📝</span> Gerar Descrição
        </button>
      </div>
    `;
  } catch (error) {
    console.error('Erro ao gerar letra:', error);
    letraContainer.innerHTML = `
      <div class="error-message">
        <p>❌ Falha na geração</p>
        <p><small>${error.message}</small></p>
      </div>
    `;
  }
}

// Gera descrição para letra criada
function gerarDescricaoLetra(tema, estilo, letra) {
  const descricaoContainer = document.getElementById('descricao-musica');
  if (!descricaoContainer) return;

  const prompt = `Crie uma descrição acessível para uma música sobre ${tema} no estilo ${estilo} com a seguinte letra:\n\n${letra}\n\nInclua análise da estrutura, temas educacionais e sugestões de uso.`;
  
  // Se estiver em modo fallback, mostra a letra diretamente
  if (FALLBACK_MODE) {
    descricaoContainer.innerHTML = `
      <div class="descricao-texto" aria-live="polite">
        <h4>Letra da Música: ${tema}</h4>
        <div class="lyrics-content">${formatLyrics(letra)}</div>
      </div>
    `;
    return;
  }

  // Caso contrário, usa a API
  gerarDescricaoIA(prompt);
}

// Formata a letra da música para exibição
function formatLyrics(lyrics) {
  return lyrics
    .replace(/\[(.*?)\]/g, '<strong>[$1]</strong>')
    .replace(/\n/g, '<br>');
}

// Navegação por voz
function iniciarNavegacaoPorVoz() {
  if (!('webkitSpeechRecognition' in window)) {
    mostrarNotificacao('Navegador não suporta reconhecimento de voz', 'error');
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  recognition.onstart = function() {
    mostrarNotificacao('Ouvindo comandos de voz... Diga "início", "matemática" ou "sobre"', 'info');
  };

  recognition.onresult = function(event) {
    const comando = event.results[0][0].transcript.toLowerCase();
    
    if (comando.includes('início') || comando.includes('home')) {
      navegarPara('home');
    } else if (comando.includes('matemática')) {
      navegarPara('matematica');
      carregarMusicas('matematica');
    } else if (comando.includes('sobre')) {
      navegarPara('sobre');
    } else if (comando.includes('músicas')) {
      carregarMusicas('matematica');
    } else if (comando.includes('aumentar fonte')) {
      toggleFonteGrande();
    } else if (comando.includes('alto contraste')) {
      toggleAltoContraste();
    } else {
      mostrarNotificacao(`Comando não reconhecido: ${comando}`, 'warning');
      return;
    }
    
    mostrarNotificacao(`Comando reconhecido: ${comando}`, 'success');
  };
  
  recognition.onerror = function(event) {
    mostrarNotificacao(`Erro no reconhecimento de voz: ${event.error}`, 'error');
  };
  
  recognition.start();
}

// Função para falar texto
function falarTexto(texto) {
  if ('speechSynthesis' in window) {
    // Cancela qualquer fala em andamento
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onerror = function(event) {
      console.error('Erro na síntese de voz:', event);
    };
    
    window.speechSynthesis.speak(utterance);
  } else {
    mostrarNotificacao('Seu navegador não suporta síntese de voz', 'warning');
  }
}

// Funções de acessibilidade
function toggleAltoContraste() {
  document.body.classList.toggle('alto-contraste');
  const estaAtivo = document.body.classList.contains('alto-contraste');
  localStorage.setItem('altoContraste', estaAtivo);
  mostrarNotificacao(`Modo alto contraste ${estaAtivo ? 'ativado' : 'desativado'}`, 'success');
}

function toggleFonteGrande() {
  document.body.classList.toggle('fonte-grande');
  const estaAtivo = document.body.classList.contains('fonte-grande');
  localStorage.setItem('fonteGrande', estaAtivo);
  mostrarNotificacao(`Fonte grande ${estaAtivo ? 'ativada' : 'desativada'}`, 'success');
}

// Mostra notificações na tela
function mostrarNotificacao(mensagem, tipo = 'info') {
  const notificacao = document.createElement('div');
  notificacao.className = `notification ${tipo}`;
  notificacao.setAttribute('role', 'alert');
  notificacao.setAttribute('aria-live', 'assertive');
  notificacao.textContent = mensagem;
  document.body.appendChild(notificacao);

  // Fala a notificação se for importante
  if (tipo === 'error' || tipo === 'success') {
    falarTexto(mensagem);
  }

  setTimeout(() => {
    notificacao.classList.add('fade-out');
    setTimeout(() => notificacao.remove(), 500);
  }, 3000);
}

// Verificação inicial da API
async function verificarAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) throw new Error('API não disponível');
    
    const data = await response.json();
    FALLBACK_MODE = !data.apiAvailable;
    
    if (FALLBACK_MODE) {
      mostrarNotificacao('Serviço de geração avançada indisponível. Usando recursos locais.', 'warning');
    }
  } catch (error) {
    FALLBACK_MODE = true;
    mostrarNotificacao('Não foi possível conectar ao servidor. Usando recursos locais.', 'warning');
    console.error('Erro na verificação da API:', error);
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  // Restaura preferências de acessibilidade
  if (localStorage.getItem('altoContraste') === 'true') {
    document.body.classList.add('alto-contraste');
  }
  if (localStorage.getItem('fonteGrande') === 'true') {
    document.body.classList.add('fonte-grande');
  }

  // Menu mobile
  const menuButton = document.querySelector('.mobile-menu-button');
  const navbarMenu = document.querySelector('.navbar-menu');
  
  if (menuButton && navbarMenu) {
    menuButton.addEventListener('click', function() {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !expanded);
      navbarMenu.classList.toggle('active');
    });
  }

  // Verifica status da API
  verificarAPI();
  
  // Ativa a seção inicial
  navegarPara('home');
  
  // Atualiza o ano no footer (caso não tenha sido feito pelo HTML)
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
});

// Função para verificar erros da API
function handleApiError(error, defaultMessage = 'Erro desconhecido') {
    console.error('Erro na API:', error);
    
    if (error.message.includes('Saldo insuficiente')) {
      mostrarNotificacao('Serviço indisponível: Saldo insuficiente na API', 'error');
      return true;
    }
    
    if (error.message.includes('timeout') || error.message.includes('Tempo de resposta')) {
      mostrarNotificacao('Serviço demorou muito para responder', 'warning');
      return true;
    }
    
    if (error.message.includes('chave inválida')) {
      mostrarNotificacao('Problema na configuração do servidor', 'error');
      return true;
    }
    
    mostrarNotificacao(defaultMessage, 'error');
    return false;
  }
