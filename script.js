/* LÓGICA DO SITE MIX-SA-MODS */

let currentCategory = 'todos';
let selectedColor = localStorage.getItem('site_theme') || '#00ff00';
let viewMode = localStorage.getItem('view_mode') || 'grid';

// Configuração oficial do projeto MIX-SA-MODS
const SUPABASE_URL = 'https://egfxnzebciuyidaahezc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7QAzm1GleD0QjNKfO-dtbw_JyOLcHr0';

// Inicializa o cliente do Supabase
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* --- FUNÇÕES DE AUTENTICAÇÃO E PERFIL --- */

function abrirLogin() {
    document.getElementById('login-overlay').style.display = 'flex';
}

function fecharLogin() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('auth-error').innerText = "";
}

// Funções para o Modal de Perfil
function abrirPerfil(email) {
    const display = document.getElementById('user-email-display');
    if (display) display.innerText = email;
    document.getElementById('profile-overlay').style.display = 'flex';
}

function fecharPerfil() {
    document.getElementById('profile-overlay').style.display = 'none';
}

async function cadastrar() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');

    if (!email || !password) {
        errorMsg.innerText = "Preencha todos os campos!";
        return;
    }

    const { data, error } = await _supabase.auth.signUp({ email, password });

    if (error) {
        errorMsg.innerText = "Erro: " + error.message;
    } else {
        alert("Conta criada! Agora clique em ENTRAR.");
        errorMsg.innerText = "";
    }
}

async function entrar() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');

    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) {
        errorMsg.innerText = "Login inválido ou dados incorretos.";
    } else {
        fecharLogin();
        location.reload(); 
    }
}

async function checarSessao() {
    const { data: { session } } = await _supabase.auth.getSession();
    const navBtn = document.getElementById('navLoginBtn');
    
    if (session) {
        if (navBtn) {
            navBtn.innerText = "Perfil";
            navBtn.style.color = "var(--main-color)";
            // Ao clicar em Perfil, abre o Modal de Informações em vez do confirm
            navBtn.onclick = () => abrirPerfil(session.user.email);
        }
    }
}

async function sair() {
    await _supabase.auth.signOut();
    location.reload();
}

/* --- FUNÇÕES DO SITE --- */

function carregarMods() {
    const container = document.getElementById('modList');
    if (!container || typeof listaDeMods === 'undefined') return;
    container.innerHTML = ""; 

    listaDeMods.forEach(mod => {
        const card = `
            <div class="mod-card" data-category="${mod.categoria}" id="${mod.id}">
                <button class="btn-fav" onclick="toggleFav('${mod.id}')">❤</button>
                <button class="btn-share" onclick="copyLink('${mod.link}')">🔗</button>
                <img src="${mod.imagem}" class="mod-img" loading="lazy">
                <div class="mod-info">
                    <h2>${mod.titulo}</h2>
                    <p>${mod.descricao}</p>
                    <a href="${mod.link}" class="btn btn-download">VER DETALHES</a>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

function changeView(mode) {
    const container = document.getElementById('modList');
    if (!container) return;
    viewMode = mode;
    localStorage.setItem('view_mode', mode);
    if (mode === 'list') container.classList.add('list-mode');
    else container.classList.remove('list-mode');
    closeMenus();
}

function applyTheme(color, save = true) {
    selectedColor = color;
    if(save) localStorage.setItem('site_theme', color);
    
    document.documentElement.style.setProperty('--main-color', color);
    
    const r = parseInt(color.slice(1,3), 16), g = parseInt(color.slice(3,5), 16), b = parseInt(color.slice(5,7), 16);
    
    const dynamicTheme = document.getElementById('dynamic-theme');
    if (dynamicTheme) {
        dynamicTheme.innerHTML = `
            :root { --main-color: ${color}; }
            @keyframes neonPulse {
                0% { box-shadow: 0 0 5px rgba(${r}, ${g}, ${b}, 0.2); border-color: #333; }
                50% { box-shadow: 0 0 15px rgba(${r}, ${g}, ${b}, 0.5); border-color: ${color}; }
                100% { box-shadow: 0 0 5px rgba(${r}, ${g}, ${b}, 0.2); border-color: #333; }
            }
        `;
    }

    const metaTheme = document.getElementById('metaTheme');
    if (metaTheme) metaTheme.content = color;
    
    document.querySelectorAll('nav, #btnSettings, .settings-options, #toast, .btn-share').forEach(e => e.style.borderColor = color);
    document.querySelectorAll('nav a, header p, .mod-card h2, #btnSettings, #toast, .btn-share').forEach(e => e.style.color = color);
    document.querySelectorAll('.btn-download, .btn-category.active').forEach(e => {
        e.style.backgroundColor = color;
        if(e.classList.contains('btn-category')) e.style.borderColor = color;
    });
    
    closeMenus();
}

function toggleSubmenu(e, id) {
    e.stopPropagation();
    const sub = document.getElementById(id);
    const isOpen = sub.classList.contains("active");
    document.querySelectorAll(".submenu").forEach(s => s.classList.remove("active"));
    if(!isOpen) sub.classList.add("active");
}

function toggleFav(id) {
    let f = JSON.parse(localStorage.getItem('mix_favs')) || [];
    if(f.includes(id)) f = f.filter(x => x !== id); else f.push(id);
    localStorage.setItem('mix_favs', JSON.stringify(f));
    updateFavs();
    if(currentCategory === 'favs') filterMods();
}

function updateFavs() {
    let f = JSON.parse(localStorage.getItem('mix_favs')) || [];
    document.querySelectorAll('.mod-card').forEach(c => {
        const btn = c.querySelector('.btn-fav');
        if(btn) btn.classList.toggle('active', f.includes(c.id));
    });
}

function setCategory(cat, el) {
    document.querySelectorAll('.btn-category').forEach(b => {
        b.classList.remove('active');
        b.style.backgroundColor = ""; b.style.borderColor = ""; b.style.color = "";
    });
    el.classList.add('active');
    el.style.backgroundColor = selectedColor;
    el.style.borderColor = selectedColor;
    el.style.color = "black";
    currentCategory = cat;
    filterMods();
}

function filterMods() {
    let q = document.getElementById('searchInput').value.toLowerCase();
    let f = JSON.parse(localStorage.getItem('mix_favs')) || [];
    let count = 0;
    document.querySelectorAll('.mod-card').forEach(c => {
        let t = c.querySelector('h2').innerText.toLowerCase();
        let cat = c.getAttribute('data-category');
        let isFav = f.includes(c.id);
        let match = t.includes(q) && (currentCategory === 'todos' || cat === currentCategory || (currentCategory === 'favs' && isFav));
        c.style.display = match ? "" : "none";
        if(match) count++;
    });
    const counter = document.getElementById('modCounter');
    if (counter) counter.innerText = "Exibindo " + count + " mods";
}

function toggleSettings(e) { 
    e.stopPropagation(); 
    document.getElementById("settingsOptions").classList.toggle("active"); 
}

function closeMenus() {
    const settings = document.getElementById("settingsOptions");
    if(settings) settings.classList.remove("active");
    document.querySelectorAll(".submenu").forEach(s => s.classList.remove("active"));
}

window.onclick = function(e) { 
    const mainSettings = document.getElementById("mainSettings");
    if (mainSettings && !mainSettings.contains(e.target)) closeMenus();
};

function randomMod() {
    let c = document.querySelectorAll('.mod-card:not([style*="display: none"])');
    if(c.length > 0) c[Math.floor(Math.random()*c.length)].scrollIntoView({behavior:'smooth', block:'center'});
    closeMenus();
}

function copyLink(u) { 
    const fullUrl = window.location.origin + (u.startsWith('/') ? '' : '/') + u;
    navigator.clipboard.writeText(fullUrl); 
    let t = document.getElementById("toast"); 
    t.className = "show"; 
    setTimeout(() => t.className = "", 2000); 
}

// INICIALIZAÇÃO DO SITE
window.addEventListener('load', () => { 
    checarSessao();
    carregarMods();
    applyTheme(selectedColor, false);
    changeView(viewMode);
    updateFavs(); 
    filterMods(); 

    const loader = document.getElementById('loading-screen');
    if(loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500); 
    }
});