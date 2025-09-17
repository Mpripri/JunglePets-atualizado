// DADOS DOS PRODUTOS (MESMO DO produtos.html)
const produtos = [
  {
    id: 1,
    nome: "Nutripássaros Mistura P/ Calopsita Mel 500gr",
    preco: 6.50,
    imagem: "imagens/nutripassaros.jpg",
    descricao: "Alimentação para Calopsitas, agapornis e Rose faces.",
    categoria: "food"
  },
  {
    id: 2,
    nome: "Ração Para Répteis Reptolife Alcon – 75g",
    preco: 37.99,
    imagem: "imagens/reptolife.jpg",
    descricao: "Indicado para répteis; Ideal para tartaruga aquática; Proporciona proteínas e minerais; Vitaminas do complexo B, A, D3 e E.",
    categoria: "food"
  }
];

// Carrinho persistente no localStorage
function carregarCarrinho() {
    const carrinhoSalvo = localStorage.getItem('carrinho');
    return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
}

function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

let carrinho = carregarCarrinho();

// Carrega o carrinho ao iniciar a página
document.addEventListener('DOMContentLoaded', function() {
    atualizarCarrinho();
});

// Adiciona produto ao carrinho
function adicionarAoCarrinho(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;

    const itemExistente = carrinho.find(item => item.id === produtoId);
    
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({
            ...produto,
            quantidade: 1
        });
    }

    salvarCarrinho();
    atualizarCarrinho();
    mostrarNotificacao();
}

// Remove produto do carrinho
function removerDoCarrinho(produtoId) {
    carrinho = carrinho.filter(item => item.id !== produtoId);
    salvarCarrinho();
    atualizarCarrinho();
}

// Altera a quantidade de um item
function alterarQuantidade(produtoId, novaQuantidade) {
    if (novaQuantidade <= 0) {
        removerDoCarrinho(produtoId);
        return;
    }

    const item = carrinho.find(item => item.id === produtoId);
    if (item) {
        item.quantidade = novaQuantidade;
        salvarCarrinho();
        atualizarCarrinho();
    }
}

// Atualiza visualização do carrinho
function atualizarCarrinho() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
    const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);

    // Atualiza contador no header
    if (totalItens > 0) {
        cartCount.textContent = totalItens;
        cartCount.classList.remove('hidden');
    } else {
        cartCount.classList.add('hidden');
    }

    // Renderiza itens no carrinho (se estiver na página de carrinho)
    if (document.getElementById('page-carrinho')) {
        if (carrinho.length === 0) {
            cartItems.innerHTML = '<p class="text-center text-gray-600">Seu carrinho está vazio</p>';
            checkoutBtn.disabled = true;
        } else {
            cartItems.innerHTML = carrinho.map(item => `
                <div class="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div class="flex items-center space-x-4">
                        <img src="${item.imagem}" alt="${item.nome}" class="w-16 h-16 object-cover rounded">
                        <div>
                            <h4 class="font-semibold text-green-900">${item.nome}</h4>
                            <p class="text-green-800">R$ ${item.preco.toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="alterarQuantidade(${item.id}, ${item.quantidade - 1})" 
                                class="bg-gray-300 px-2 py-1 rounded">-</button>
                        <span class="mx-2">${item.quantidade}</span>
                        <button onclick="alterarQuantidade(${item.id}, ${item.quantidade + 1})" 
                                class="bg-gray-300 px-2 py-1 rounded">+</button>
                        <button onclick="removerDoCarrinho(${item.id})" 
                                class="bg-red-500 text-white px-2 py-1 rounded ml-2">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            checkoutBtn.disabled = false;
        }

        // Atualiza total
        cartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }
}

// Mostra notificação
function mostrarNotificacao() {
    const notification = document.getElementById('cart-notification');
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 2000);
}

// Finalizar compra
function checkout() {
    if (carrinho.length === 0) return;
    
    const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    alert(`Compra finalizada!\nTotal: R$ ${total.toFixed(2).replace('.', ',')}`);
    
    carrinho = []; // Esvazia
    salvarCarrinho(); // Salva estado vazio
    atualizarCarrinho(); // Atualiza interface
    window.location.href = 'produtos.html'; // Volta para produtos
}