// ====================================================================
// Serverless-System | CMS ADMIN - LÓGICA PRINCIPAL (script.js) - V4.0 (UI/UX AVANÇADO)
// ====================================================================

/**
 * Estrutura Unificada de Dados Padrão (Default Data)
 */
const defaultData = {
    // --- 1. CONFIGURAÇÃO DE PUBLICAÇÃO (CMS) ---
    configuracoes: {
        binId: '', 
        masterKey: '', 
        storeStatus: 'closed', // open | closed
        whatsapp: '5511999998888',
        lowStockThreshold: 5,
        storeName: 'LabSystem Store', 
        address: 'Rua Exemplo, 123 - Cidade, UF', 
    },

    // --- 2. CUSTOMIZAÇÃO (APARÊNCIA) ---
    customizacao: {
        headerFooterColor: '#10B981', // Cor 1: Header/Footer e Botões
        titleTextColor: '#FFFFFF',    // Cor 2: Cor da Letra/Título (Contraste)
        backgroundColor: '#f9f9f9',
        backgroundImageUrl: '', // URL da Imagem de Fundo
        logoUrl: 'https://via.placeholder.com/150x50/10B981/ffffff?text=LabSystem',
        musicUrl: '', // Link do YouTube 
        musicVolume: 50, // Volume (0-100)
    },

    // --- 3. ITENS E CARDÁPIO (TOTEM) ---
    categorias: [
        { id: 'cat-1', name: 'Combos Especiais' },
        { id: 'cat-2', name: 'Hambúrgueres' }
    ],
    produtos: [
        { id: 'prod-1', name: 'X-Salada Clássico', price: 18.50, stock: 50, categoryId: 'cat-2', imageUrl: 'https://via.placeholder.com/300x200/FFCC00/000000?text=X-Salada' }
    ],

    // --- 4. DADOS DE PAGAMENTO ---
    pagamento: {
        pixKey: 'sua-chave-pix-aqui',
        bankDetails: '',
        bitcoinLightning: ''
    },
    
    // --- 5. COBERTURA DE ENTREGA ---
    cobertura: [
        { id: 'area-1', name: 'Centro', taxa: 5.00, tempo: 30 }
    ],
};


class StoreManager {
    constructor() {
        this.dataKey = 'labsystem_store_data'; 
        this.data = {};
        this.currentProductId = null; 
    }

    // ====================================================================
    // INICIALIZAÇÃO
    // ====================================================================

    init() {
        this.loadLocalData();
        this.renderFormFields(); 
        this.renderItemManagement(); 
        this.renderCoverage(); 
        this.checkLowStockAlerts(); 
        this.setupEventListeners(); 
        this.renderDashboardStats(); // NOVO: Renderiza os cards do dashboard
        this.switchTab('publicar'); 
        this.applyDesktopLayout(); 
    }
    
    // ====================================================================
    // MÉTODOS DE CONTROLE DA SIDEBAR E LAYOUT
    // ====================================================================
    
    applyDesktopLayout() {
        const content = document.getElementById('contentContainer');
        if (window.innerWidth >= 1024) {
            content.style.marginLeft = '280px';
        } else {
            content.style.marginLeft = '0';
        }
    }

    openMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        sidebar.classList.add('open');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.style.opacity = '0.5', 10);
    }

    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        sidebar.classList.remove('open');
        overlay.style.opacity = '0';
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }


    // ====================================================================
    // EVENT LISTENERS 
    // ====================================================================

    setupEventListeners() {
        // --- BOTÕES GERAIS ---
        document.getElementById('saveBtn')?.addEventListener('click', () => this.saveLocalData());
        document.getElementById('publishBtn')?.addEventListener('click', () => this.publishData());
        
        document.querySelector('button[onclick="storeManager.exportData()"]')?.addEventListener('click', () => this.exportData());
        document.querySelector('button[onclick="storeManager.triggerImport()"]')?.addEventListener('click', () => this.triggerImport());

        
        // --- SIDEBAR E ABAS DE NAVEGAÇÃO ---
        document.getElementById('sidebarToggle')?.addEventListener('click', () => this.openMobileSidebar());

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(e.currentTarget.getAttribute('data-tab'));
                if (window.innerWidth < 1024) {
                    this.closeMobileSidebar();
                }
            });
        });
        
        // --- FORMULÁRIOS DE MODAL (USAM SUBMIT) ---
        document.getElementById('coverageForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCoverage();
        });
        
        document.getElementById('productForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });
        
        // --- LISTENERS DE VALORES (PARA SYNC E UI) ---
        const musicVolumeInput = document.getElementById('musicVolume');
        if (musicVolumeInput) {
            musicVolumeInput.addEventListener('input', (e) => {
                document.getElementById('musicVolumeValue').textContent = e.target.value;
                this.collectCustomizationFields();
                this.saveLocalData();
            });
        }
        
        // Listeners para sincronizar inputs de cor
        ['headerFooterColor', 'titleTextColor', 'backgroundColor'].forEach(id => {
            const colorInput = document.getElementById(id);
            const textInput = document.getElementById(`${id}Text`);

            colorInput?.addEventListener('input', (e) => {
                if (textInput) textInput.value = e.target.value;
                this.saveLocalData();
            });

            textInput?.addEventListener('input', (e) => {
                if (colorInput) colorInput.value = e.target.value;
                this.saveLocalData();
            });
        });
        
        window.addEventListener('resize', () => this.applyDesktopLayout());
    }

    // ====================================================================
    // MÉTODOS DE TROCA DE ABA (AJUSTADO PARA NOVAS CLASSES)
    // ====================================================================

    switchTab(tabName) {
        document.querySelectorAll('.tab-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Remove a classe ativa de TODOS os botões da sidebar
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('sidebar-active', 'bg-indigo-50', 'text-indigo-700'); 
            btn.classList.add('text-gray-700', 'hover:bg-indigo-50', 'hover:text-indigo-700');
        });

        const targetSection = document.getElementById(`tab-${tabName}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Adiciona a classe ativa ao botão selecionado na sidebar
        const targetButton = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (targetButton) {
            targetButton.classList.add('sidebar-active');
            targetButton.classList.remove('text-gray-700', 'hover:bg-indigo-50', 'hover:text-indigo-700');
        }
        
        // Garante que o dashboard seja atualizado ao trocar de aba
        if(tabName === 'publicar') {
            this.renderDashboardStats();
        }
    }
    
    // NOVO: Renderiza os cards da primeira aba
    renderDashboardStats() {
        const storeStatus = this.data.configuracoes.storeStatus;
        const statusEl = document.getElementById('statusDisplay');
        const productCountEl = document.getElementById('productCountDisplay');
        const coverageCountEl = document.getElementById('coverageCountDisplay');
        
        if (statusEl) {
            statusEl.textContent = storeStatus === 'open' ? 'ABERTA' : 'FECHADA';
            statusEl.classList.toggle('text-green-600', storeStatus === 'open');
            statusEl.classList.toggle('text-red-600', storeStatus === 'closed');
        }
        
        if (productCountEl) {
            productCountEl.textContent = this.data.produtos.length;
        }
        
        if (coverageCountEl) {
            coverageCountEl.textContent = this.data.cobertura.length;
        }
    }

    // ====================================================================
    // MÉTODOS DE PERSISTÊNCIA LOCAL (LOCAL STORAGE)
    // (Mantidos do V3.0)
    // ====================================================================

    loadLocalData() {
        try {
            const savedData = localStorage.getItem(this.dataKey);
            if (savedData) {
                let loadedData = JSON.parse(savedData);
                this.data = { ...JSON.parse(JSON.stringify(defaultData)), ...loadedData }; 
                this.data.configuracoes = { ...defaultData.configuracoes, ...loadedData.configuracoes };
                this.data.customizacao = { ...defaultData.customizacao, ...loadedData.customizacao };
                this.data.pagamento = { ...defaultData.pagamento, ...loadedData.pagamento };
                this.data.cobertura = loadedData.cobertura || defaultData.cobertura;
                this.data.produtos = loadedData.produtos || defaultData.produtos;
                this.data.categorias = loadedData.categorias || defaultData.categorias;
            } else {
                this.data = JSON.parse(JSON.stringify(defaultData)); 
            }
        } catch (e) {
            console.error('Erro ao carregar dados locais:', e);
            this.data = JSON.parse(JSON.stringify(defaultData));
        }
    }

    saveLocalData() {
        try {
            this.collectDataFromForms(); 
            localStorage.setItem(this.dataKey, JSON.stringify(this.data));
            this.checkLowStockAlerts();
            this.renderDashboardStats(); // Atualiza dashboard após salvar
            this.toast('✅ Dados salvos localmente!', 'bg-indigo-600');
        } catch (e) {
            this.toast('❌ Erro ao salvar dados localmente.', 'bg-red-500');
            console.error('Erro ao salvar no LocalStorage:', e);
        }
    }
    
    // ====================================================================
    // MÉTODOS DE COLETA E RENDERIZAÇÃO DE FORMULÁRIOS
    // (Mantidos do V3.0)
    // ====================================================================
    
    collectDataFromForms() {
        this.collectPublicationFields();
        this.collectCustomizationFields();
        this.collectDadosLojaFields();
    }

    collectPublicationFields() {
        this.data.configuracoes.binId = document.getElementById('binId')?.value || '';
        this.data.configuracoes.masterKey = document.getElementById('masterKey')?.value || '';
    }

    collectDadosLojaFields() {
        this.data.configuracoes.storeName = document.getElementById('storeName')?.value || 'LabSystem Store';
        this.data.configuracoes.address = document.getElementById('address')?.value || '';
        this.data.configuracoes.storeStatus = document.getElementById('storeStatus')?.value || 'closed';
        this.data.configuracoes.whatsapp = document.getElementById('whatsapp')?.value || '';
        
        this.data.pagamento.pixKey = document.getElementById('pixKey')?.value || '';
        this.data.pagamento.bankDetails = document.getElementById('bankDetails')?.value || '';
        this.data.pagamento.bitcoinLightning = document.getElementById('bitcoinLightning')?.value || '';
    }
    
    collectCustomizationFields() {
        this.data.customizacao.headerFooterColor = document.getElementById('headerFooterColor')?.value || '#000000';
        this.data.customizacao.titleTextColor = document.getElementById('titleTextColor')?.value || '#FFFFFF';
        this.data.customizacao.backgroundColor = document.getElementById('backgroundColor')?.value || '#f9f9f9';
        this.data.customizacao.backgroundImageUrl = document.getElementById('backgroundImageUrl')?.value || '';
        this.data.customizacao.logoUrl = document.getElementById('logoUrl')?.value || '';
        this.data.customizacao.musicUrl = document.getElementById('musicUrl')?.value || '';
        
        let volume = parseInt(document.getElementById('musicVolume')?.value);
        this.data.customizacao.musicVolume = Math.min(100, Math.max(0, isNaN(volume) ? 50 : volume));
    }
    
    renderFormFields() {
        const d = this.data;

        if (document.getElementById('binId')) {
            document.getElementById('binId').value = d.configuracoes.binId || '';
            document.getElementById('masterKey').value = d.configuracoes.masterKey || '';
        }

        if (document.getElementById('storeStatus')) {
            document.getElementById('storeName').value = d.configuracoes.storeName || 'LabSystem Store'; 
            document.getElementById('address').value = d.configuracoes.address || ''; 
            document.getElementById('storeStatus').value = d.configuracoes.storeStatus || 'closed';
            document.getElementById('whatsapp').value = d.configuracoes.whatsapp || '';
        }
        
        if (document.getElementById('pixKey')) {
            document.getElementById('pixKey').value = d.pagamento.pixKey || '';
            document.getElementById('bankDetails').value = d.pagamento.bankDetails || '';
            document.getElementById('bitcoinLightning').value = d.pagamento.bitcoinLightning || '';
        }

        if (document.getElementById('headerFooterColor')) {
            document.getElementById('headerFooterColor').value = d.customizacao.headerFooterColor || '#000000';
            document.getElementById('headerFooterColorText').value = d.customizacao.headerFooterColor || '#000000'; 
            
            document.getElementById('titleTextColor').value = d.customizacao.titleTextColor || '#FFFFFF';
            document.getElementById('titleTextColorText').value = d.customizacao.titleTextColor || '#FFFFFF'; 
            
            document.getElementById('backgroundColor').value = d.customizacao.backgroundColor || '#f9f9f9';
            document.getElementById('backgroundColorText').value = d.customizacao.backgroundColor || '#f9f9f9';
            
            document.getElementById('backgroundImageUrl').value = d.customizacao.backgroundImageUrl || '';
            document.getElementById('logoUrl').value = d.customizacao.logoUrl || '';
            document.getElementById('musicUrl').value = d.customizacao.musicUrl || '';
            
            document.getElementById('musicVolume').value = d.customizacao.musicVolume || 50;
            const volumeValueEl = document.getElementById('musicVolumeValue');
            if (volumeValueEl) volumeValueEl.textContent = d.customizacao.musicVolume || 50;
        }
    }
    
    // ====================================================================
    // MÉTODOS CRUD: COBERTURA DE ENTREGA 
    // (Mantidos do V3.0)
    // ====================================================================
    renderCoverage() {
        const tableBody = document.getElementById('coverageTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        this.data.cobertura.forEach(area => {
            const row = tableBody.insertRow();
            row.className = 'hover:bg-gray-50'; // Added hover effect
            row.innerHTML = `
                <td class="py-2 px-4 border-b">${area.name}</td>
                <td class="py-2 px-4 border-b">R$ ${area.taxa.toFixed(2).replace('.', ',')}</td>
                <td class="py-2 px-4 border-b">${area.tempo} min</td>
                <td class="py-2 px-4 border-b text-center space-x-2">
                    <button type="button" onclick="storeManager.editCoverage('${area.id}')" class="text-blue-500 hover:text-blue-700 font-medium">Editar</button>
                    <button type="button" onclick="storeManager.deleteCoverage('${area.id}')" class="text-red-500 hover:text-red-700 font-medium">Excluir</button>
                </td>
            `;
        });
    }

    openCoverageModal(coverageId = null) {
        const modal = document.getElementById('coverageModal');
        const form = document.getElementById('coverageForm');
        
        form.reset();
        document.getElementById('coverageId').value = '';
        document.getElementById('coverageModalTitle').textContent = 'Adicionar Nova Área';

        if (coverageId) {
            const area = this.data.cobertura.find(a => a.id === coverageId);
            if (area) {
                document.getElementById('coverageModalTitle').textContent = 'Editar Área';
                document.getElementById('coverageId').value = area.id;
                document.getElementById('coverageNameModal').value = area.name;
                document.getElementById('coverageTaxaModal').value = area.taxa;
                document.getElementById('coverageTempoModal').value = area.tempo;
            }
        }

        modal.classList.remove('hidden');
    }

    closeCoverageModal() {
        document.getElementById('coverageModal').classList.add('hidden');
    }

    saveCoverage() {
        const coverageId = document.getElementById('coverageId').value;
        const name = document.getElementById('coverageNameModal').value.trim();
        const taxa = parseFloat(document.getElementById('coverageTaxaModal').value);
        const tempo = parseInt(document.getElementById('coverageTempoModal').value);
        
        if (!name || isNaN(taxa) || isNaN(tempo) || taxa < 0 || tempo <= 0) {
            this.toast('Preencha todos os campos da Cobertura corretamente.', 'bg-yellow-500');
            return;
        }

        const areaData = {
            id: coverageId || 'area-' + Date.now(),
            name,
            taxa,
            tempo,
        };
        
        if (coverageId) {
            const index = this.data.cobertura.findIndex(a => a.id === coverageId);
            if (index !== -1) {
                this.data.cobertura[index] = areaData;
            }
        } else {
            this.data.cobertura.push(areaData);
        }

        this.saveLocalData();
        this.renderCoverage();
        this.closeCoverageModal();
        this.toast('Área de cobertura salva!', 'bg-green-500');
    }

    editCoverage(coverageId) {
        this.openCoverageModal(coverageId);
    }

    deleteCoverage(coverageId) {
        if (!confirm('Tem certeza que deseja excluir esta área de cobertura?')) return;
        
        this.data.cobertura = this.data.cobertura.filter(a => a.id !== coverageId);
        this.saveLocalData();
        this.renderCoverage();
        this.toast('Área de cobertura excluída.', 'bg-red-500');
    }
    
    // ====================================================================
    // MÉTODOS DE SINCRONIZAÇÃO E BACKUP
    // (Mantidos do V3.0)
    // ====================================================================

    async publishData() {
        this.collectDataFromForms(); 

        const { binId, masterKey } = this.data.configuracoes;

        if (!binId || !masterKey) {
            this.toast('❌ BIN ID e Master Key são obrigatórios para Publicar.', 'bg-red-500');
            return;
        }

        this.saveLocalData(); 

        const url = `https://api.jsonbin.io/v3/b/${binId}`;
        this.toast('⏳ Publicando no JSONBin...');

        try {
            const response = await fetch(url, {
                method: 'PUT', 
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': masterKey, 
                },
                body: JSON.stringify(this.data)
            });

            if (response.ok) {
                this.toast('🎉 Publicado com sucesso no JSONBin!', 'bg-green-500');
            } else {
                const error = await response.json();
                this.toast(`❌ Erro ${response.status}: ${error.message || 'Falha na publicação.'}`, 'bg-red-500');
            }
        } catch (error) {
            this.toast('❌ Erro de conexão de rede ou JSONBin.', 'bg-red-500');
            console.error('JSONBin Error:', error);
        }
    }

    exportData() {
        this.collectDataFromForms(); 
        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `labsystem_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.toast('💾 Dados exportados com sucesso!', 'bg-gray-700');
    }

    triggerImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.style.display = 'none';
        input.addEventListener('change', (e) => this.importData(e));
        
        input.id = 'importFileInput'; 
        
        document.body.appendChild(input);
        input.click();
        
        setTimeout(() => {
            document.body.removeChild(input);
        }, 100); 
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData && importedData.configuracoes && importedData.produtos) {
                    if (confirm('Importar? Isso substituirá TODOS os dados atuais do CMS local. Tem certeza?')) {
                        this.data = importedData;
                        this.saveLocalData(); 
                        this.renderFormFields(); 
                        this.renderItemManagement(); 
                        this.renderCoverage();
                        this.toast('🎉 Dados importados com sucesso! Não esqueça de PUBLICAR.', 'bg-indigo-500');
                    }
                } else {
                    this.toast('❌ Arquivo JSON inválido ou incompleto para o LabSystem.', 'bg-red-500');
                }
            } catch (error) {
                this.toast('❌ Erro ao ler o arquivo. Certifique-se de que é um JSON válido.', 'bg-red-500');
            }
        };
        reader.readAsText(file);
    }

    // ====================================================================
    // MÉTODOS CRUD: ITENS E CATEGORIAS
    // (Mantidos do V3.0)
    // ====================================================================

    renderItemManagement() {
        this.renderCategoriesList();
        this.renderProductsTable();
        this.renderProductModalCategories(); // Garante que o modal tenha as categorias
    }
    
    renderCategoriesList() {
        const list = document.getElementById('categoriesList');
        if (!list) return;

        list.innerHTML = '';
        this.data.categorias.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-100 transition'; // Novo estilo
            div.innerHTML = `
                <span class="font-medium text-gray-700">${cat.name}</span>
                <button type="button" onclick="storeManager.deleteCategory('${cat.id}')" class="text-red-500 hover:text-red-700 transition p-1 rounded-md">Excluir</button>
            `;
            list.appendChild(div);
        });
    }
    
    addCategory() {
        const nameInput = document.getElementById('newCategoryName');
        if (!nameInput) {
            this.toast('Erro: Campo de categoria não encontrado.', 'bg-red-500');
            return;
        }
        
        const name = nameInput.value.trim();

        if (!name) {
            this.toast('Nome da categoria é obrigatório.', 'bg-yellow-500');
            return;
        }

        if (this.data.categorias.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
             this.toast('Esta categoria já existe.', 'bg-yellow-500');
             return;
        }

        const newId = 'cat-' + Date.now();
        this.data.categorias.push({ id: newId, name: name });
        nameInput.value = ''; 
        this.saveLocalData();
        this.renderItemManagement(); 
        this.toast('Categoria adicionada!', 'bg-green-500');
    }

    deleteCategory(categoryId) {
        if (!confirm('Tem certeza que deseja excluir esta categoria? Todos os produtos nela serão movidos para "Sem Categoria".')) return;
        
        this.data.categorias = this.data.categorias.filter(cat => cat.id !== categoryId);
        
        this.data.produtos = this.data.produtos.map(prod => {
            if (prod.categoryId === categoryId) {
                prod.categoryId = null; 
            }
            return prod;
        });

        this.saveLocalData();
        this.renderItemManagement();
        this.toast('Categoria excluída.', 'bg-red-500');
    }
    
    renderProductsTable() {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        this.data.produtos.forEach(prod => {
            const category = this.data.categorias.find(c => c.id === prod.categoryId);
            const row = tbody.insertRow();
            row.className = 'hover:bg-gray-50';
            
            row.innerHTML = `
                <td class="py-2 px-6 border-b">${prod.name}</td>
                <td class="py-2 px-6 border-b">${category ? category.name : 'Sem Categoria'}</td>
                <td class="py-2 px-6 border-b">R$ ${prod.price.toFixed(2).replace('.', ',')}</td>
                <td class="py-2 px-6 border-b">${prod.stock}</td>
                <td class="py-2 px-6 border-b text-center space-x-2">
                    <button type="button" onclick="storeManager.editProduct('${prod.id}')" class="text-blue-500 hover:text-blue-700 font-medium">Editar</button>
                    <button type="button" onclick="storeManager.deleteProduct('${prod.id}')" class="text-red-500 hover:text-red-700 font-medium">Excluir</button>
                </td>
            `;
        });
    }

    renderProductModalCategories() {
        const categorySelect = document.getElementById('productCategoryId');
        if (!categorySelect) return;
        
        categorySelect.innerHTML = '';
        this.data.categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
    }

    openProductModal(productId = null) {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        
        this.renderProductModalCategories(); // Garante categorias atualizadas

        form.reset();
        document.getElementById('productId').value = '';
        document.getElementById('modalTitle').textContent = 'Adicionar Novo Produto';

        if (productId) {
            const product = this.data.produtos.find(p => p.id === productId);
            if (product) {
                document.getElementById('modalTitle').textContent = 'Editar Produto';
                document.getElementById('productId').value = product.id;
                document.getElementById('productName').value = product.name;
                document.getElementById('productPrice').value = product.price;
                document.getElementById('productStock').value = product.stock;
                document.getElementById('productImageUrl').value = product.imageUrl;
                document.getElementById('productCategoryId').value = product.categoryId;
            }
        }

        modal.classList.remove('hidden');
    }

    closeProductModal() {
        document.getElementById('productModal').classList.add('hidden');
    }
    
    saveProduct() {
        const productId = document.getElementById('productId').value;
        
        const productData = {
            id: productId || 'prod-' + Date.now(),
            name: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            imageUrl: document.getElementById('productImageUrl').value,
            categoryId: document.getElementById('productCategoryId').value,
        };
        
        if (productId) {
            const index = this.data.produtos.findIndex(p => p.id === productId);
            if (index !== -1) {
                this.data.produtos[index] = productData;
            }
        } else {
            this.data.produtos.push(productData);
        }

        this.saveLocalData();
        this.renderItemManagement();
        this.closeProductModal();
        this.toast('Produto salvo com sucesso!', 'bg-green-500');
    }

    editProduct(productId) {
        this.openProductModal(productId);
    }
    
    deleteProduct(productId) {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;
        
        this.data.produtos = this.data.produtos.filter(p => p.id !== productId);
        this.saveLocalData();
        this.renderProductsTable();
        this.toast('Produto excluído.', 'bg-red-500');
    }
    
    // ====================================================================
    // UTILIDADES (ALERTA DE ESTOQUE E TOAST)
    // (Mantidos do V3.0)
    // ====================================================================

    checkLowStockAlerts() {
        const alertContainer = document.getElementById('lowStockAlerts');
        if (!alertContainer) return;

        const threshold = this.data.configuracoes.lowStockThreshold || 5;
        const lowStockProducts = this.data.produtos.filter(p => p.stock <= threshold && p.stock > 0);

        if (lowStockProducts.length > 0) {
            alertContainer.classList.remove('hidden');
            const alertHtml = lowStockProducts.map(p => 
                `<span class="block text-sm">⚠️ ${p.name}: ${p.stock} em estoque</span>`
            ).join('');
            alertContainer.innerHTML = `<h4 class="font-bold mb-1">ALERTA DE ESTOQUE (${lowStockProducts.length})</h4>${alertHtml}`;
        } else {
            alertContainer.classList.add('hidden');
        }
    }

    toast(message, className = 'bg-gray-800') {
        const toastEl = document.createElement('div');
        toastEl.className = `fixed bottom-4 right-4 text-white p-3 rounded-xl shadow-xl ${className} z-50 transition-opacity duration-300`;
        toastEl.textContent = message;
        document.body.appendChild(toastEl);
        
        setTimeout(() => {
            toastEl.style.opacity = 0;
            setTimeout(() => toastEl.remove(), 300);
        }, 3000);
    }
}

// ====================================================================
// INICIALIZAÇÃO ROBUSTA
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    window.storeManager = new StoreManager();
    window.storeManager.init(); 
});
