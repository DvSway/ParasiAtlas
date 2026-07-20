/**
 * STATE MANAGEMENT
 */
let parasiteDatabase = [];
const categories = ['Protozoarios 🦠', 'Helmintos 🪱', 'Artrópodos 🕷️'];
let activeCategory = categories[0];
let searchQuery = '';

/**
 * TAXONOMIC FORMATTING LOGIC (Aísla "spp.", paréntesis y subtipos de las itálicas)
 */
const taxonChangeRegex = /(sp\.|spp\.|spp|var\.|subsp\.|(?:\(.*?\)))/g;

function formatScientificName(name) {
    if (!name) return '';
    
    const parts = name.split(taxonChangeRegex);
    
    return parts.map(part => {
        if (!part) return '';
        // Mantiene el grosor de letra del contenedor (negrita si el padre es negrita) pero quita la itálica
        if (taxonChangeRegex.test(part)) {
            return `<span style="font-style: normal; font-weight: inherit;">${part}</span>`; 
        }
        // El nombre del parásito se mantiene en itálicas
        return `<i>${part}</i>`;
    }).join('');
}

/**
 * DOM ELEMENTS
 */
const elements = {
    tabsContainer: document.getElementById('categoryTabs'),
    gridContainer: document.getElementById('parasiteGrid'),
    emptyState: document.getElementById('emptyState'),
    loadingState: document.getElementById('loadingState'),
    searchInput: document.getElementById('searchInput'),
    modalContainer: document.getElementById('modalContainer')
};

/**
 * INITIALIZATION & DATA FETCHING
 */
async function initApp() {
    try {
        const response = await fetch('db.json');
        if (!response.ok) throw new Error('Network response error');
        
        parasiteDatabase = await response.json();
        
        elements.loadingState.classList.add('hidden');
        elements.gridContainer.classList.remove('hidden');
        
        renderTabs();
        renderCards();
        setupEventListeners();
        
    } catch (error) {
        console.error('Database Error:', error);
        elements.loadingState.innerHTML = `<p style="color: #ef4444;">Error de carga de BD. Verifica el archivo db.json y el servidor local.</p>`;
    }
}

/**
 * RENDERING LOGIC
 */
function renderTabs() {
    elements.tabsContainer.innerHTML = '';
    
    categories.forEach(category => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        
        btn.textContent = category;
        btn.className = `tab-btn ${category === activeCategory ? 'active' : ''}`;
        
        btn.onclick = () => {
            const testComponent = document.getElementById('testComponent');
            if (testComponent && !testComponent.classList.contains('hidden')) {
                window.toggleAppMode();
            }

            if (activeCategory !== category) {
                activeCategory = category;
                renderTabs();
                renderCards();
            }
        };
        
        li.appendChild(btn);
        elements.tabsContainer.appendChild(li);
    });
}

function renderCards() {
    elements.gridContainer.innerHTML = '';
    
    const filteredData = parasiteDatabase.filter(parasite => {
        const matchesCategory = parasite.category === activeCategory;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
            parasite.scientificName.toLowerCase().includes(searchLower) ||
            parasite.commonName.toLowerCase().includes(searchLower) ||
            parasite.disease.toLowerCase().includes(searchLower);
        
        return matchesCategory && matchesSearch;
    });

    if (filteredData.length === 0) {
        elements.gridContainer.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
        return;
    } else {
        elements.gridContainer.classList.remove('hidden');
        elements.emptyState.classList.add('hidden');
    }

    filteredData.forEach((parasite, index) => {
        const card = document.createElement('article');
        card.className = 'parasite-card';
        card.style.animationDelay = `${index * 50}ms`;
        
        card.onclick = () => window.openModal(parasite.id);

        let mainImage = null;
        if (parasite.canvasData && parasite.canvasData.morphology) {
            mainImage = parasite.canvasData.morphology.image;
        } else if (parasite.morphology && parasite.morphology[0] && parasite.morphology[0].image) {
            mainImage = parasite.morphology[0].image;
        }

       const cardImgHtml = mainImage 
            ? `<img src="${mainImage}" alt="${parasite.scientificName}" style="width: 100%; height: 100%; object-fit: cover; object-position: center; transition: transform 0.4s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">`
            : `<div style="width: 100%; height: 100%; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center;">
                   <svg style="width: 3rem; height: 3rem; color: #DAA520; opacity: 0.5;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
               </div>`;

        card.innerHTML = `
            <div style="display: flex; flex-direction: row; height: 12rem; width: 100%;">
                
                <!-- Lado Izquierdo: Nombre (1/3 del espacio) -->
                <div style="width: 33.33%; padding: 1rem; display: flex; justify-content: center; align-items: center; background-color: #ffffff; border-right: 1px solid #e5e7eb;">
                    <h2 class="card-title scientific-name" style="font-size: 1.15rem; color: #111827; margin: 0; line-height: 1.2; text-align: center; word-break: break-word;">
                        ${formatScientificName(parasite.scientificName)}
                    </h2>
                </div>
                
                <!-- Lado Derecho: Imagen centrada (2/3 del espacio) -->
                <div style="width: 66.67%; height: 100%; overflow: hidden; display: flex; justify-content: center; align-items: center; background-color: #ffffff;">
                    ${cardImgHtml}
                </div>
                
            </div>
        `;
        elements.gridContainer.appendChild(card);
    });
}

/**
 * EVENT LISTENERS
 */
function setupEventListeners() {
    elements.searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderCards();
    });
}

/**
 * LIGHTBOX SYSTEM
 */
window.openLightbox = function(imgSrc, description) {
    const lightboxHtml = `
        <div id="lightboxOverlay" class="modal-overlay active" style="z-index: 9999; flex-direction: column; padding: 2rem; background-color: rgba(0,0,0,0.9);" onclick="window.closeLightbox(event)">
            <div style="max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; align-items: center; justify-content: center;" onclick="event.stopPropagation()">
                <button onclick="window.closeLightbox()" style="align-self: flex-end; background: transparent; border: none; color: #DAA520; font-size: 2.5rem; cursor: pointer; margin-bottom: 1rem; line-height: 1; transition: color 0.2s;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='#DAA520'">&times;</button>
                <img src="${imgSrc}" style="max-width: 100%; max-height: 60vh; object-fit: contain; border-radius: 0.5rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                <p style="color: #f3f4f6; margin-top: 1.5rem; font-size: 1.125rem; text-align: center; max-width: 800px; line-height: 1.6; font-weight: 500;">${description}</p>
            </div>
        </div>
    `;
    
    const div = document.createElement('div');
    div.id = 'lightboxContainer';
    div.innerHTML = lightboxHtml;
    document.body.appendChild(div);
};

window.closeLightbox = function(event) {
    if (event && event.target.tagName === 'IMG') return; 
    const container = document.getElementById('lightboxContainer');
    if (container) container.remove();
};

/**
 * MASTER MODAL SYSTEM
 */
window.openModal = function(parasiteId) {
    const parasite = parasiteDatabase.find(p => p.id === parasiteId);
    if (!parasite) return;

    const generateList = (arr) => arr.map(item => `<li style="margin-bottom: 0.5rem;"><span style="color: #DAA520; margin-right: 0.5rem;">•</span>${item}</li>`).join('');
    
    let morphContentHtml = '';
    if (Array.isArray(parasite.morphology) && typeof parasite.morphology[0] === 'object') {
        morphContentHtml = parasite.morphology.map(item => {
            const escapedText = item.text.replace(/'/g, "\\'"); 
            const imgHtml = item.image 
                ? `<img src="${item.image}" alt="${item.stage}" onclick="window.openLightbox('${item.image}', '${escapedText}')" style="width: 100%; max-height: 14rem; object-fit: contain; background: #ffffff; border-radius: 0.5rem; margin: 0 auto 1rem auto; display: block; cursor: zoom-in; border: 1px solid #e5e7eb; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">`
                : `<div style="width: 100%; height: 10rem; background: #f3f4f6; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto; color: #9ca3af; font-size: 0.75rem; text-transform: uppercase;">Sin imagen de ${item.stage}</div>`;
                
            return `
                <div style="margin-bottom: 2.5rem; display: flex; flex-direction: column; align-items: center; text-align: center;">
                    <strong style="color: #DAA520; display: block; margin-bottom: 0.75rem; font-size: 1.125rem;">${item.stage}</strong>
                    ${imgHtml}
                    <p style="color: #4b5563; font-size: 0.875rem; line-height: 1.6; text-align: left; width: 100%; border-left: 3px solid #e5e7eb; padding-left: 1rem;">${item.text}</p>
                </div>
            `;
        }).join('');
    }

    const escapedSummary = parasite.lifecycleSummary.replace(/'/g, "\\'");
    const lifeCycleImgHtml = parasite.lifecycleDiagram 
        ? `<img src="${parasite.lifecycleDiagram}" alt="Ciclo de Vida" onclick="window.openLightbox('${parasite.lifecycleDiagram}', '${escapedSummary}')" style="width: 100%; max-height: 16rem; object-fit: contain; background: #ffffff; border-radius: 0.5rem; margin: 0 auto 1.5rem auto; display: block; cursor: zoom-in; border: 1px solid #e5e7eb; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">`
        : `<div style="width: 100%; height: 12rem; background: #f3f4f6; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; color: #9ca3af; font-size: 0.75rem; text-transform: uppercase;">Sin diagrama de ciclo</div>`;

    const modalHtml = `
        <div id="activeModalOverlay" class="modal-overlay active" onclick="window.closeModal(event)">
            <div class="modal-box" style="max-width: 64rem;" onclick="event.stopPropagation()">
                
                <div class="modal-header">
                    <div>
                        <h3 class="scientific-name" style="font-size: 1.5rem; color: #DAA520; margin-bottom: 0.25rem;">${formatScientificName(parasite.scientificName)}</h3>
                        <p style="color: #6b7280; font-size: 0.875rem; font-weight: 600; text-transform: uppercase;">${parasite.category} | ${parasite.commonName}</p>
                    </div>
                    <button onclick="window.closeModal()" class="btn-close">
                        <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div class="modal-body custom-scrollbar" style="padding: 2rem;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; background-color: #f9fafb; padding: 1.5rem; border-radius: 0.5rem; border: 1px solid #e5e7eb; margin-bottom: 2rem;">
                        <div><strong style="color: #111827; display: block;">Enfermedad:</strong> <span style="color: #4b5563; font-size: 0.875rem;">${parasite.disease}</span></div>
                        <div><strong style="color: #111827; display: block;">Transmisión:</strong> <span style="color: #4b5563; font-size: 0.875rem;">${parasite.transmission}</span></div>
                        <div><strong style="color: #111827; display: block;">Fase Infectante:</strong> <span style="color: #4b5563; font-size: 0.875rem;">${parasite.infectiveStage}</span></div>
                        <div><strong style="color: #111827; display: block;">Fase Diagnóstica:</strong> <span style="color: #4b5563; font-size: 0.875rem;">${parasite.diagnosticStage}</span></div>
                        <div style="grid-column: 1 / -1; margin-top: 0.5rem;"><strong style="color: #111827; display: block;">Epidemiología:</strong> <span style="color: #4b5563; font-size: 0.875rem;">${parasite.epidemiology}</span></div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 2rem;">
                        <div>
                            <h4 style="font-size: 1.125rem; font-weight: 700; color: #111827; margin-bottom: 1.5rem; border-bottom: 2px solid #DAA520; padding-bottom: 0.5rem; text-align: center;">Morfología</h4>
                            ${morphContentHtml}
                        </div>
                        <div>
                            <h4 style="font-size: 1.125rem; font-weight: 700; color: #111827; margin-bottom: 1.5rem; border-bottom: 2px solid #DAA520; padding-bottom: 0.5rem; text-align: center;">Ciclo de Vida</h4>
                            ${lifeCycleImgHtml}
                            <ul style="color: #4b5563; font-size: 0.875rem; line-height: 1.6;">
                                ${generateList(parasite.lifecycleDetails)}
                            </ul>
                        </div>
                    </div>

                    <div style="padding-top: 0.5rem;">
                        <h4 style="font-size: 1.125rem; font-weight: 700; color: #111827; margin-bottom: 1rem; border-bottom: 2px solid #DAA520; padding-bottom: 0.5rem;">Clínica</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                            <div style="background: #ffffff; border-left: 4px solid #3b82f6; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <strong style="color: #1e3a8a; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                    <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                    Método de Diagnóstico
                                </strong>
                                <p style="color: #4b5563; font-size: 0.875rem; line-height: 1.5;">${parasite.diagnosticMethod}</p>
                            </div>
                            <div style="background: #ffffff; border-left: 4px solid #10b981; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <strong style="color: #064e3b; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                    <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                    Tratamiento
                                </strong>
                                <p style="color: #4b5563; font-size: 0.875rem; line-height: 1.5;">${parasite.treatment}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;

    elements.modalContainer.innerHTML = modalHtml;
    document.body.style.overflow = 'hidden'; 
    document.addEventListener('keydown', handleEscapeKey);
};

window.closeModal = function(event) {
    if (event && event.target.id !== 'activeModalOverlay') return;

    const overlay = document.getElementById('activeModalOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            elements.modalContainer.innerHTML = '';
            document.body.style.overflow = ''; 
        }, 300);
    }
    if (!document.getElementById('lightboxContainer')) {
        document.removeEventListener('keydown', handleEscapeKey);
    }
};

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        if (document.getElementById('lightboxContainer')) {
            window.closeLightbox();
        } else {
            window.closeModal();
        }
    }
}

/**
 * TOGGLE APP MODE
 */
window.toggleAppMode = function() {
    const gridView = document.getElementById('parasiteGrid');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const testComponent = document.getElementById('testComponent');
    const btnToggle = document.getElementById('btnToggleTest');

    if (testComponent.classList.contains('hidden')) {
        gridView.classList.add('hidden');
        emptyState.classList.add('hidden');
        searchInput.disabled = true;
        searchInput.parentElement.style.opacity = '0.4'; 
        testComponent.classList.remove('hidden');
        
        btnToggle.innerHTML = `&larr; Volver al Catálogo`;
        btnToggle.classList.add('bg-[#DAA520]', 'text-white');
        btnToggle.classList.remove('text-[#b8860b]');
    } else {
        testComponent.classList.add('hidden');
        searchInput.disabled = false;
        searchInput.parentElement.style.opacity = '1';
        
        renderCards(); 
        
        btnToggle.innerHTML = `<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg> Ponte a prueba`;
        btnToggle.classList.remove('bg-[#DAA520]', 'text-white');
        btnToggle.classList.add('text-[#b8860b]');
    }
};

/**
 * TESTING COMPONENT LOGIC (Ponte a prueba)
 */
const testController = {
    state: {
        macros: [],
        micros: [],
        variant: 'aleatorio',
        currentTestObj: null,
        currentStateLogic: null, 
        canvasCtx: null,
        baseImage: null,
        drawnRect: { x: 0, y: 0, w: 0, h: 0 },
        userAnswers: {},
        correctClinicalAnswer: null
    },

    elements: {
        macroCheckboxes: document.querySelectorAll('.test-macro-checkbox'),
        microContainer: document.getElementById('microSelectionContainer'),
        configView: document.getElementById('testConfigView'),
        testView: document.getElementById('activeTestView'),
        canvas: document.getElementById('quizCanvas'),
        overlay: document.getElementById('canvasOverlayUI'),
        bank: document.getElementById('structureBank'),
        feedback: document.getElementById('testFeedback'),
        btnCheck: document.getElementById('btnCheckAnswers')
    },

    init() {
        this.state.canvasCtx = this.elements.canvas.getContext('2d');
        
        this.elements.macroCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => this.updateMicroSelection());
        });

        this.elements.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        window.addEventListener('resize', () => {
            if (this.state.baseImage && this.elements.testView.classList.contains('hidden') === false) {
                this.renderCanvas(this.state.currentTestObj.canvasData.morphology.structures); 
            }
        });
    },

    resetConfig() {
        this.elements.macroCheckboxes.forEach(cb => cb.checked = false);
        const micros = document.querySelectorAll('.test-micro-checkbox');
        micros.forEach(cb => cb.checked = false);
        this.updateMicroSelection();
        document.getElementById('practiceVariant').value = 'aleatorio';
    },

    updateMicroSelection() {
        this.state.macros = Array.from(this.elements.macroCheckboxes)
                                     .filter(cb => cb.checked)
                                     .map(cb => cb.value);
        
        this.elements.microContainer.innerHTML = '';

        if (this.state.macros.length === 0) {
            this.elements.microContainer.innerHTML = '<span class="text-gray-500 text-sm italic">Selecciona al menos una categoría arriba para ver los organismos.</span>';
            return;
        }

        const filtered = parasiteDatabase.filter(p => this.state.macros.includes(p.category));
        
        if (filtered.length === 0) {
            this.elements.microContainer.innerHTML = '<span class="text-yellow-600 text-sm font-medium">No hay organismos en esta categoría.</span>';
            return;
        }

        filtered.forEach(p => {
            const label = document.createElement('label');
            label.className = 'flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900 transition-colors p-2 bg-white rounded border border-gray-300';
            // Busca esta línea dentro de updateMicroSelection() en tu app.js:
label.innerHTML = `<input type="checkbox" value="${p.id}" class="test-micro-checkbox accent-accent w-4 h-4"> <span class="scientific-name">${formatScientificName(p.scientificName)}</span>`;
            this.elements.microContainer.appendChild(label);
        });
    },

    startTest() {
        const microsSelected = Array.from(document.querySelectorAll('.test-micro-checkbox'))
                                    .filter(cb => cb.checked)
                                    .map(cb => cb.value);
        
        if (microsSelected.length === 0) {
            alert('Por favor, selecciona al menos un organismo para evaluar.');
            return;
        }

        const randomId = microsSelected[Math.floor(Math.random() * microsSelected.length)];
        this.state.currentTestObj = parasiteDatabase.find(p => p.id === randomId);
        
        this.state.variant = document.getElementById('practiceVariant').value;
        this.state.userAnswers = {};
        this.state.activePillId = null;
        this.state.correctClinicalAnswer = null;

        if (this.state.variant === 'identificacion') {
            this.state.currentStateLogic = Math.random() > 0.5 ? 'stateA' : 'stateB';
        } else if (this.state.variant === 'clinica') {
            this.state.currentStateLogic = 'stateC';
        } else {
            const rand = Math.random();
            if (rand < 0.33) this.state.currentStateLogic = 'stateA';
            else if (rand < 0.66) this.state.currentStateLogic = 'stateB';
            else this.state.currentStateLogic = 'stateC';
        }

        this.elements.configView.classList.add('hidden');
        this.elements.testView.classList.remove('hidden');
        this.elements.feedback.textContent = '';
        this.elements.btnCheck.disabled = false;

        this.loadQuizInterface();
    },

    loadQuizInterface() {
        const hasCanvasData = this.state.currentTestObj.canvasData && this.state.currentTestObj.canvasData.morphology;
        
        if (!hasCanvasData && (this.state.currentStateLogic === 'stateA' || this.state.currentStateLogic === 'stateB')) {
            this.state.currentStateLogic = 'stateC'; 
        }

        document.getElementById('testOrganismTitle').innerHTML = formatScientificName(this.state.currentTestObj.scientificName);
        
        if (this.state.currentStateLogic === 'stateA') {
            document.getElementById('testPromptText').textContent = 'Práctica (Identificar): Selecciona el nombre correcto para cada marcador.';
        } else if (this.state.currentStateLogic === 'stateB') {
            document.getElementById('testPromptText').textContent = 'Práctica (Localizar): Selecciona un término de la lista y haz clic en la imagen.';
        } else if (this.state.currentStateLogic === 'stateC') {
            document.getElementById('testPromptText').textContent = 'Práctica (Clínica): Selecciona la respuesta correcta.';
        }

        let imageSrc = null;
        let structures = [];
        
        if (hasCanvasData) {
            imageSrc = this.state.currentTestObj.canvasData.morphology.image;
            structures = this.state.currentTestObj.canvasData.morphology.structures || [];
        } else if (this.state.currentTestObj.morphology && this.state.currentTestObj.morphology[0]) {
            imageSrc = this.state.currentTestObj.morphology[0].image;
        }

        if(imageSrc) {
            this.state.baseImage = new Image();
            this.state.baseImage.src = imageSrc;
            this.state.baseImage.onload = () => {
                this.renderCanvas(structures);
                this.buildUIControls(structures);
            };
        } else {
             this.elements.canvas.width = this.elements.canvas.parentElement.clientWidth;
             this.elements.canvas.height = 500;
             this.state.canvasCtx.clearRect(0, 0, this.elements.canvas.width, 500);
             this.buildUIControls([]);
        }
    },

    renderCanvas(structures = []) {
        const canvas = this.elements.canvas;
        const ctx = this.state.canvasCtx;
        const img = this.state.baseImage;

        const wrapper = canvas.parentElement;
        canvas.width = wrapper.clientWidth;
        canvas.height = 500; 
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width / 2) - (w / 2);
        const y = (canvas.height / 2) - (h / 2);

        this.state.drawnRect = { x, y, w, h };
        ctx.drawImage(img, x, y, w, h);

        this.elements.overlay.innerHTML = '';

        if (this.state.currentStateLogic === 'stateA') {
            structures.forEach(struct => {
                this.drawMarkerDot(struct.relX, struct.relY);
                this.createDropdownAt(struct.id, struct.relX, struct.relY, structures);
            });
        }
        else if (this.state.currentStateLogic === 'stateB') {
            Object.keys(this.state.userAnswers).forEach(id => {
                const ans = this.state.userAnswers[id];
                const struct = structures.find(s => s.id === id);
                if(struct) this.drawMarkerWithText(ans.relX, ans.relY, struct.name, '#3b82f6'); 
            });
        }
    },

    buildUIControls(structures) {
        this.elements.bank.innerHTML = '';
        const panelTitle = document.getElementById('panelRightTitle'); 

        if (this.state.currentStateLogic === 'stateA') {
            if(panelTitle) panelTitle.textContent = "Banco de Estructuras";
            this.elements.bank.innerHTML = '<p class="text-gray-500 text-sm">Utiliza los menús desplegables sobre la imagen para asignar las estructuras correspondientes.</p>';
            this.elements.btnCheck.classList.remove('hidden');

        } else if (this.state.currentStateLogic === 'stateB') {
            if(panelTitle) panelTitle.textContent = "Banco de Estructuras";
            this.elements.btnCheck.classList.remove('hidden');
            structures.forEach(struct => {
                const btn = document.createElement('button');
                btn.className = 'structure-pill';
                btn.id = `pill_${struct.id}`;
                btn.textContent = struct.name;
                btn.onclick = () => this.selectPill(struct.id);
                this.elements.bank.appendChild(btn);
            });

        } else if (this.state.currentStateLogic === 'stateC') {
            if(panelTitle) panelTitle.textContent = "Pregunta Clínica";
            this.elements.btnCheck.classList.remove('hidden');
            
            const askTreatment = Math.random() > 0.5;
            const questionType = askTreatment ? 'tratamiento' : 'método de diagnóstico';
            const correctAnswer = askTreatment ? this.state.currentTestObj.treatment : this.state.currentTestObj.diagnosticMethod;
            
            const others = parasiteDatabase.filter(p => p.id !== this.state.currentTestObj.id);
            const shuffledOthers = others.sort(() => 0.5 - Math.random()).slice(0, 3);
            const wrongAnswers = shuffledOthers.map(p => askTreatment ? p.treatment : p.diagnosticMethod);
            
            const allOptions = [correctAnswer, ...wrongAnswers].sort(() => 0.5 - Math.random());
            this.state.correctClinicalAnswer = correctAnswer;
            
            let html = `<p class="text-gray-900 font-semibold mb-4">¿Cuál es el <span class="text-accent">${questionType}</span> indicado para ${formatScientificName(this.state.currentTestObj.scientificName)}?</p>`;
            html += `<div class="flex flex-col gap-3">`;
            
            allOptions.forEach((opt, idx) => {
                html += `
                    <label class="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <input type="radio" name="clinicalAnswer" value="${idx}" class="mt-1 accent-accent">
                        <span class="text-sm text-gray-700 leading-tight">${opt}</span>
                    </label>
                `;
            });
            html += `</div>`;
            
            this.elements.bank.innerHTML = html;
            
            this.elements.bank.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    this.state.userAnswers['clinical'] = allOptions[e.target.value];
                });
            });
        }
    },

    createDropdownAt(id, relX, relY, structures) {
        const rect = this.state.drawnRect;
        const absX = rect.x + (relX * rect.w);
        const absY = rect.y + (relY * rect.h);

        const select = document.createElement('select');
        select.className = 'canvas-marker-select';
        select.style.left = `${absX}px`;
        select.style.top = `${absY - 25}px`; 
        select.dataset.id = id;

        let options = `<option value="" disabled selected>?</option>`;
        
        const shuffled = [...structures].sort(() => 0.5 - Math.random());
        shuffled.forEach(s => {
            options += `<option value="${s.id}">${s.name}</option>`;
        });
        
        select.innerHTML = options;
        
        select.addEventListener('change', (e) => {
            this.state.userAnswers[id] = e.target.value;
        });

        this.elements.overlay.appendChild(select);
    },

    selectPill(id) {
        if (this.state.userAnswers[id]) return; 

        document.querySelectorAll('.structure-pill').forEach(p => p.classList.remove('selected-pill'));
        document.getElementById(`pill_${id}`).classList.add('selected-pill');
        this.state.activePillId = id;
    },

    handleCanvasClick(e) {
        if (this.state.currentStateLogic !== 'stateB' || !this.state.activePillId) return;

        const rect = this.elements.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const dRect = this.state.drawnRect;
        if (mouseX < dRect.x || mouseX > dRect.x + dRect.w || mouseY < dRect.y || mouseY > dRect.y + dRect.h) return;

        const relX = (mouseX - dRect.x) / dRect.w;
        const relY = (mouseY - dRect.y) / dRect.h;

        this.state.userAnswers[this.state.activePillId] = { relX, relY };
        const pill = document.getElementById(`pill_${this.state.activePillId}`);
        pill.classList.remove('selected-pill');
        pill.classList.add('placed');
        pill.innerHTML += ` <span class="text-xs text-blue-500 font-bold">✓</span>`;
        
        this.state.activePillId = null;
        this.renderCanvas(this.state.currentTestObj.canvasData.morphology.structures);
    },

    drawMarkerDot(relX, relY) {
        const ctx = this.state.canvasCtx;
        const rect = this.state.drawnRect;
        const absX = rect.x + (relX * rect.w);
        const absY = rect.y + (relY * rect.h);

        ctx.beginPath();
        ctx.arc(absX, absY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#DAA520';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#121212';
        ctx.stroke();
    },

    drawMarkerWithText(relX, relY, text, color = '#DAA520') {
        const ctx = this.state.canvasCtx;
        const rect = this.state.drawnRect;
        const absX = rect.x + (relX * rect.w);
        const absY = rect.y + (relY * rect.h);

        ctx.beginPath();
        ctx.moveTo(absX, absY);
        ctx.lineTo(absX + 25, absY - 25);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(absX, absY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.font = '12px Inter, sans-serif';
        const textWidth = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(absX + 25, absY - 35, textWidth + 10, 20);
        
        ctx.fillStyle = '#111827';
        ctx.fillText(text, absX + 30, absY - 21);
    },

    validateAnswers() {
        let score = 0;

        if (this.state.currentStateLogic === 'stateA') {
            const data = this.state.currentTestObj.canvasData.morphology;
            const selects = document.querySelectorAll('.canvas-marker-select');
            selects.forEach(select => {
                const markerId = select.dataset.id;
                const selectedVal = select.value;

                if (selectedVal === markerId) {
                    score++;
                    select.classList.add('correct');
                    select.classList.remove('incorrect');
                } else {
                    select.classList.add('incorrect');
                    select.classList.remove('correct');
                }
            });
            const total = data.structures.length;
            this.elements.feedback.innerHTML = `<span class="${score === total ? 'text-green-600' : 'text-accent'}">Obtuviste ${score} de ${total} aciertos.</span>`;
            
        } else if (this.state.currentStateLogic === 'stateB') {
            const data = this.state.currentTestObj.canvasData.morphology;
            const tolerance = 0.08; 
            data.structures.forEach(struct => {
                const ans = this.state.userAnswers[struct.id];
                const pill = document.getElementById(`pill_${struct.id}`);
                
                if (ans) {
                    const dx = Math.abs(ans.relX - struct.relX);
                    const dx_abs = Math.abs(ans.relY - struct.relY); // Se conserva variable previa del scope
                    
                    if (dx <= tolerance && Math.abs(ans.relY - struct.relY) <= tolerance) {
                        score++;
                        pill.style.borderColor = '#10b981'; 
                    } else {
                        pill.style.borderColor = '#ef4444'; 
                    }
                } else {
                    pill.style.borderColor = '#ef4444'; 
                }
            });
            const total = data.structures.length;
            this.elements.feedback.innerHTML = `<span class="${score === total ? 'text-green-600' : 'text-accent'}">Obtuviste ${score} de ${total} aciertos.</span>`;

        } else if (this.state.currentStateLogic === 'stateC') {
            const userAns = this.state.userAnswers['clinical'];
            if (!userAns) {
                this.elements.feedback.innerHTML = `<span class="text-red-600">Por favor, selecciona una opción.</span>`;
                return;
            }
            
            if (userAns === this.state.correctClinicalAnswer) {
                this.elements.feedback.innerHTML = `<span class="text-green-600 font-bold">¡Correcto! Excelente diagnóstico.</span>`;
            } else {
                this.elements.feedback.innerHTML = `<span class="text-red-600 font-bold">Incorrecto.</span> <br><span class="text-xs text-gray-700 block mt-1">La respuesta era: ${this.state.correctClinicalAnswer}</span>`;
            }
        }

        this.elements.btnCheck.disabled = true;
    },

    exitTest() {
        this.elements.testView.classList.add('hidden');
        this.elements.configView.classList.remove('hidden');
    }
};

/**
 * INITIALIZATION LISTENER
 */
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setTimeout(() => testController.init(), 500); 
});