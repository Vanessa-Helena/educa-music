function navegarPara(secao) {
    document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
    document.getElementById(secao).style.display = 'block';
}

function carregarMusicas(materia) {
    const listaMusicas = document.getElementById(`lista-musicas-${materia}`);
    listaMusicas.innerHTML = '<p>Carregando músicas...</p>';
    
    // Simular carregamento de músicas (substitua por uma chamada real à API no futuro)
    setTimeout(() => {
        const musicas = [
            { titulo: "Tabuada do 2", url: "#" },
            { titulo: "Frações Divertidas", url: "#" },
            { titulo: "Verbos em Ação", url: "#" },
        ];
        
        listaMusicas.innerHTML = musicas.map(musica => 
            `<div>
                <h3>${musica.titulo}</h3>
                <audio controls>
                    <source src="${musica.url}" type="audio/mpeg">
                    Seu navegador não suporta o elemento de áudio.
                </audio>
            </div>`
        ).join('');
    }, 1000);
}

// Funções de acessibilidade
function toggleAltoContraste() {
    document.body.classList.toggle('alto-contraste');
}

function toggleFonteGrande() {
    document.body.classList.toggle('fonte-grande');
}

// Adicionar botões de acessibilidade
window.onload = function() {
    const header = document.querySelector('header');
    const acessibilidadeDiv = document.createElement('div');
    acessibilidadeDiv.innerHTML = `
        <button onclick="toggleAltoContraste()">Alto Contraste</button>
        <button onclick="toggleFonteGrande()">Aumentar Fonte</button>
    `;
    header.appendChild(acessibilidadeDiv);
}