// ====================================================================
// Serverless-System | TOTEM - LÓGICA PRINCIPAL (script.js) - V2.2 (COMPLETO)
// ====================================================================

class Totem {
    constructor() {
        this.BIN_ID = '68e47cb3ae596e708f08babc'; // Será preenchido pelo localStorage ou definido manualmente
        this.API_URL = 'https://api.jsonbin.io/v3/b/';
        this.storeData = null;
        this.cart = [];
        this.selectedCategory = null;
        this.isMusicPlaying = false;
        this.player = null; // Objeto do player do YouTube
    }

    // ====================================================================
    // INICIALIZAÇÃO E DADOS
    // ====================================================================

    async init() {
        this.getBinId();
        
        if (this.BIN_ID) {
            await this.fetchStoreData();
        } else {
            document.getElementById('loadingIndicator').textContent = 'Erro: BIN ID não configurado. Por favor, configure o CMS primeiro.';
            return;
        }

        if (this.storeData) {
            this.applyCustomization();
            this.renderContent();
            this.setupEventListeners();
            
            // Inicializa o player do YouTube após a API estar pronta
            if (typeof YT !== 'undefined' && YT.loaded) {
                this.initYoutubePlayer();
            } else {
                window.onYouTubeIframeAPIReady = () => this.initYoutubePlayer();
            }
        }
    }

    getBinId() {
        // Tenta buscar o BIN ID do localStorage do CMS, se estiver no mesmo domínio
        const cmsData = localStorage.getItem('labsystem_store_data');
        if (cmsData) {
            try {
                const data = JSON.parse(cmsData);
                this.BIN_ID = data.configuracoes.binId;
            } catch (e) {
                console.warn("CMS local data is corrupt or not set.");
            }
        }
        
        // Se o BIN_ID ainda não estiver definido (caso o CMS esteja em outro local), defina manualmente aqui
        // Exemplo: this.BIN_ID = 'SEU_BIN_ID_MANUAL_AQUI'; 
    }

    async fetchStoreData() {
        const url = `${this.API_URL}${this.BIN_ID}/latest`;
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                loadingIndicator.textContent = `Erro ${response.status}: Falha ao carregar dados. Verifique o BIN ID no CMS.`;
                return;
            }
            
            const data = await response.json();
            this.storeData = data.record;

            if (this.storeData.configuracoes.storeStatus === 'closed') {
                loadingIndicator.classList.add('hidden');
                document.getElementById('storeClosedAlert').classList.remove('hidden');
                return;
            }
            
            loadingIndicator.classList.add('hidden');

        } catch (error) {
            loadingIndicator.textContent = 'Erro de rede ou JSONBin: Não foi possível conectar.';
            console.error('Fetch Error:', error);
        }
    }

    // ====================================================================
    // CUSTOMIZAÇÃO E MÍDIA
    // ====================================================================

    applyCustomization() {
        if (!this.storeData || !this.storeData.customizacao || !this.storeData.configuracoes) return;

        const cust = this.storeData.customizacao;
        const conf = this.storeData.configuracoes;
        
        // --- 1. CORES E TEMA ---
        document.documentElement.style.setProperty('--color-primary', cust.headerFooterColor || '#10B981');
        document.documentElement.style.setProperty('--color-secondary', cust.titleTextColor || '#FFFFFF');
        
        // --- 2. FUNDO ---
        const body = document.body;
        if (cust.backgroundImageUrl) {
            body.style.backgroundImage = `url('${cust.backgroundImageUrl}')`;
            body.classList.add('bg-image-cover');
        } else {
            body.style.backgroundColor = cust.backgroundColor || '#f9f9f9';
            body.classList.remove('bg-image-cover');
            body.style.backgroundImage = 'none';
        }
        
        // --- 3. LOGO E NOME DA LOJA ---
        document.getElementById('storeNameHeader').textContent = conf.storeName || 'LabSystem Store';
        document.getElementById('pageTitle').textContent = `${conf.storeName || 'LabSystem Store'} - Cardápio Digital`;
        
        const logo = document.getElementById('storeLogo');
        logo.src = cust.logoUrl || 'https://via.placeholder.com/150x50/10B981/ffffff?text=Logo';
    }
    
    // --- 4. PLAYER DE MÚSICA DO YOUTUBE ---
    initYoutubePlayer() {
        const musicUrl = this.storeData.customizacao.musicUrl;
        if (!musicUrl) {
            document.getElementById('musicToggleBtn').classList.add('hidden');
            return;
        }

        const videoIdMatch = musicUrl.match(/(?:\?v=|\/embed\/|\/v\/|youtu\.be\/|\/watch\?v=)([^&]+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;

        if (!videoId) {
            document.getElementById('musicToggleBtn').classList.add('hidden');
            return;
        }

        this.player = new YT.Player('youtube-player', {
            videoId: videoId,
            playerVars: {
                'autoplay': 0, 
                'controls': 0, 
                'loop': 1, 
                'playlist': videoId, // Essencial para loop
                'modestbranding': 1,
                'disablekb': 1,
                'mute': 0, // Inicia desmutado, mas o usuário deve dar o play
            },
            events: {
                'onReady': (event) => {
                    event.target.setVolume(this.storeData.customizacao.musicVolume || 50);
                },
                'onStateChange': (event) => {
                    // Estado 0 (ended), reinicia se estiver em loop
                    if (event.data === YT.PlayerState.ENDED) {
                        event.target.playVideo();
                    }
                }
            }
        });
    }

    toggleMusic() {
        if (!this.player) return;

        const btn = document.getElementById('musicToggleBtn');

        if (this.isMusicPlaying) {
            this.player.pauseVideo();
            btn.innerHTML = '🔇';
            this.isMusicPlaying = false;
        } else {
            this.player.playVideo();
            btn.innerHTML = '🔊';
            this.isMusicPlaying = true;
        }
    }

    // ====================================================================
    // RENDERIZAÇÃO DO CONTEÚDO
    // ====================================================================

    renderContent() {
        this.renderCategories();
        this.renderProducts();
        this.renderCoverageOptions();
    }

    renderCategories() {
        const tabsContainer = document.getElementById('categoryTabs');
        tabsContainer.innerHTML = '';
        
        if (!this.storeData.categorias || this.storeData.categorias.length === 0) return;

        this.storeData.categorias.forEach((cat, index) => {
            const btn = document.createElement('button');
            btn.className = `tab-btn py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-primary transition duration-300`;
            btn.textContent = cat.name;
            btn.setAttribute('data-category-id', cat.id);
            btn.addEventListener('click', () => this.switchCategory(cat.id));
            tabsContainer.appendChild(btn);

            if (index === 0) {
                this.selectedCategory = cat.id;
                btn.classList.add('active-tab');
            }
        });

        // Garantir que a primeira categoria seja selecionada
        this.renderProducts();
    }

    switchCategory(categoryId) {
        this.selectedCategory = categoryId;
        
        // Remove active class de todos e adiciona no selecionado
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active-tab'));
        document.querySelector(`.tab-btn[data-category-id="${categoryId}"]`).classList.add('active-tab');
        
        this.renderProducts();
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = '';

        if (this.storeData.configuracoes.storeStatus === 'closed') return;

        const productsToShow = this.storeData.produtos.filter(p => 
            p.categoryId === this.selectedCategory && p.stock > 0
        );

        if (productsToShow.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center p-10 text-xl text-gray-500">Nenhum produto disponível nesta categoria.</div>`;
            return;
        }

        productsToShow.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition transform hover:shadow-xl hover:-translate-y-1';
            
            card.innerHTML = `
                <img src="${prod.imageUrl}" alt="${prod.name}" class="h-48 w-full object-cover">
                <div class="p-4 flex-grow flex flex-col">
                    <h3 class="text-xl font-bold mb-1">${prod.name}</h3>
                    <p class="text-gray-600 flex-grow">Estoque: ${prod.stock}</p>
                    <div class="mt-2 flex justify-between items-center">
                        <span class="text-2xl font-extrabold text-primary">R$ ${prod.price.toFixed(2).replace('.', ',')}</span>
                        <button onclick="totem.addToCart('${prod.id}')" class="bg-primary text-secondary px-4 py-2 rounded-full font-semibold hover:opacity-90 transition">
                            Adicionar
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // ====================================================================
    // LÓGICA DO CARRINHO
    // ====================================================================

    addToCart(productId) {
        const product = this.storeData.produtos.find(p => p.id === productId);

        if (!product || product.stock <= 0) {
            alert('Produto esgotado!');
            return;
        }

        const existingItem = this.cart.find(item => item.id === productId);

        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                existingItem.quantity++;
            } else {
                alert(`Máximo de ${product.stock} em estoque.`);
                return;
            }
        } else {
            this.cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                quantity: 1,
                stock: product.stock 
            });
        }
        
        this.updateCartCount();
        this.updateCartSummary();
    }

    updateCartCount() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cartCount').textContent = totalItems;
    }
    
    openCartModal() {
        document.getElementById('cartModal').classList.remove('hidden');
        this.renderCartItems();
        this.updateCartSummary();
    }

    closeCartModal() {
        document.getElementById('cartModal').classList.add('hidden');
    }

    renderCartItems() {
        const list = document.getElementById('cartItemsList');
        list.innerHTML = '';

        if (this.cart.length === 0) {
            list.innerHTML = `<p class="text-center text-gray-500">Seu carrinho está vazio.</p>`;
            document.getElementById('checkoutBtn').disabled = true;
            return;
        }

        document.getElementById('checkoutBtn').disabled = false;

        this.cart.forEach(item => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between border-b pb-2';
            div.innerHTML = `
                <div>
                    <span class="font-semibold">${item.name}</span>
                    <span class="text-sm text-gray-600 block">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="flex items-center space-x-3">
                    <button onclick="totem.changeQuantity('${item.id}', -1)" class="bg-gray-200 text-gray-700 w-8 h-8 rounded-full">-</button>
                    <span class="font-bold">${item.quantity}</span>
                    <button onclick="totem.changeQuantity('${item.id}', 1)" class="bg-gray-200 text-gray-700 w-8 h-8 rounded-full">+</button>
                    <button onclick="totem.changeQuantity('${item.id}', 0)" class="text-red-500 hover:text-red-700 ml-2">Remover</button>
                </div>
            `;
            list.appendChild(div);
        });
    }

    changeQuantity(itemId, change) {
        const itemIndex = this.cart.findIndex(item => item.id === itemId);
        const item = this.cart[itemIndex];
        const productData = this.storeData.produtos.find(p => p.id === itemId);

        if (!item) return;

        if (change === 0) {
            // Remover item
            this.cart.splice(itemIndex, 1);
        } else if (change === 1) {
            // Aumentar quantidade (com checagem de estoque)
            if (item.quantity < productData.stock) {
                item.quantity++;
            }
        } else if (change === -1) {
            // Diminuir quantidade
            if (item.quantity > 1) {
                item.quantity--;
            } else {
                this.cart.splice(itemIndex, 1); // Remove se a quantidade for para 0
            }
        }
        
        this.updateCartCount();
        this.renderCartItems();
        this.updateCartSummary();
    }

    renderCoverageOptions() {
        const select = document.getElementById('deliveryArea');
        if (!select) return;

        // Limpa opções, mantendo "Retirar na Loja"
        select.querySelectorAll('option:not([value=""])').forEach(opt => opt.remove());

        if (!this.storeData.cobertura || this.storeData.cobertura.length === 0) return;

        this.storeData.cobertura.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = `${area.name} (R$ ${area.taxa.toFixed(2).replace('.', ',')} - ${area.tempo} min)`;
            option.setAttribute('data-taxa', area.taxa);
            option.setAttribute('data-tempo', area.tempo);
            select.appendChild(option);
        });
    }

    updateCartSummary() {
        let subtotal = 0;
        this.cart.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        const deliverySelect = document.getElementById('deliveryArea');
        const selectedOption = deliverySelect.options[deliverySelect.selectedIndex];
        
        const deliveryTax = selectedOption.value ? parseFloat(selectedOption.getAttribute('data-taxa')) : 0;
        const total = subtotal + deliveryTax;

        document.getElementById('subtotal').textContent = subtotal.toFixed(2).replace('.', ',');
        document.getElementById('deliveryTax').textContent = deliveryTax.toFixed(2).replace('.', ',');
        document.getElementById('total').textContent = total.toFixed(2).replace('.', ',');
    }

    checkout() {
        if (this.cart.length === 0) return;

        const deliverySelect = document.getElementById('deliveryArea');
        const selectedOption = deliverySelect.options[deliverySelect.selectedIndex];
        const areaName = selectedOption.value ? selectedOption.textContent.split('(')[0].trim() : 'Retirar na Loja';
        const deliveryTime = selectedOption.value ? selectedOption.getAttribute('data-tempo') : '0';
        const deliveryTax = selectedOption.value ? parseFloat(selectedOption.getAttribute('data-taxa')) : 0;

        let total = 0;
        let orderDetails = "🛒 *NOVO PEDIDO (LabSystem)* 🛒\n\n";
        
        // --- Lista de Produtos ---
        orderDetails += "--- ITENS DO PEDIDO ---\n";
        this.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            orderDetails += `*${item.quantity}x ${item.name}* (R$ ${item.price.toFixed(2).replace('.', ',')}) = R$ ${itemTotal.toFixed(2).replace('.', ',')}\n`;
        });
        
        // --- Resumo e Entrega ---
        orderDetails += "\n--- RESUMO ---\n";
        orderDetails += `Subtotal: R$ ${total.toFixed(2).replace('.', ',')}\n`;
        orderDetails += `Entrega (${areaName}): R$ ${deliveryTax.toFixed(2).replace('.', ',')}\n`;
        orderDetails += `*TOTAL GERAL:* R$ ${(total + deliveryTax).toFixed(2).replace('.', ',')}\n\n`;

        // --- Tempo de Entrega ---
        if (deliveryTime > 0) {
            orderDetails += `Estimativa de Entrega: ${deliveryTime} minutos.\n\n`;
        } else {
            orderDetails += `Estimativa de Retirada: 15-20 minutos após a confirmação.\n\n`;
        }

        // --- Dados de Pagamento ---
        const pag = this.storeData.pagamento;
        orderDetails += "--- DETALHES DE PAGAMENTO ---\n";
        orderDetails += `PIX: ${pag.pixKey || 'Não informado'}\n`;
        
        if (pag.bankDetails) {
            orderDetails += `Transferência:\n${pag.bankDetails}\n`;
        }
        if (pag.bitcoinLightning) {
            orderDetails += `Lightning (BTC): ${pag.bitcoinLightning}\n`;
        }

        orderDetails += "\n*Por favor, envie o comprovante de pagamento junto com o seu ENDEREÇO COMPLETO, NOME e TELEFONE para finalizar o pedido.*";
        
        const whatsappNumber = this.storeData.configuracoes.whatsapp || '5511999998888';
        const encodedMessage = encodeURIComponent(orderDetails);
        const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        
        window.open(whatsappLink, '_blank');
        this.closeCartModal();
        
        // Opcional: Limpar o carrinho após o checkout
        // this.cart = [];
        // this.updateCartCount();
    }
    
    setupEventListeners() {
        // Nada extra por enquanto
    }
}

// Inicializa a classe Totem
document.addEventListener('DOMContentLoaded', () => {
    window.totem = new Totem();
    window.totem.init(); 
});
