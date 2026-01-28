/* LÓGICA DO SITE MIX-SA-MODS - VERSÃO CORRIGIDA */

let currentCategory = 'todos';
let selectedColor = localStorage.getItem('site_theme') || '#00ff00';
let viewMode = localStorage.getItem('view_mode') || 'grid';

const SUPABASE_URL = 'https://egfxnzebciuyidaahezc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7QAzm1GleD0QjNKfO-dtbw_JyOLcHr0';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* --- FUNÇÕES DE AUTENTICAÇÃO E PERFIL --- */

function abrirLogin() {
    document.getElementById('login-overlay').style.display = 'flex';
}

function fecharLogin() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('auth-error').innerText = "";
}

async function abrirPerfil(email) {
    const { data: { user } } = await _supabase.auth.getUser();
    document.getElementById('user-email-display').innerText = email;
    
    const meta = user.user_metadata;
    if (meta) {
        document.getElementById('profile-name').value = meta.display_name || "";
        document.getElementById('profile-pic-url').value = meta.avatar_url || "";
        if (meta.avatar_url) document.getElementById('user-avatar').src = meta.avatar_url;
    }

    // Limpeza para evitar botões duplicados
    const oldAdminBtn = document.getElementById('btn-admin-area');
    if (oldAdminBtn) oldAdminBtn.remove();
    const oldPanel = document.getElementById('admin-panel');
    if (oldPanel) oldPanel.remove();

    // SEU E-MAIL DE ADMIN AQUI
    if (user.email === 'SEU_EMAIL_AQUI@gmail.com') {
        const adminBtn = document.createElement('button');
        adminBtn.id = 'btn-admin-area';
        adminBtn.innerText = "PAINEL ADMINISTRATIVO";
        adminBtn.style.cssText = "background: #ff0000; color: white; border: none; padding: 12px; cursor: pointer; margin-top: 15px; border-radius: 8px; width: 100%; font-weight: bold; font-family: 'Orbitron'; box-shadow: 0 0 10px rgba(255,0,0,0.5);";
        adminBtn.onclick = () => abrirPainelAdmin();
        document.querySelector('.profile-card').appendChild(adminBtn);
    }

    document.getElementById('profile-overlay').style.display = 'flex';
}

async function abrirPainelAdmin() {
    let painel = document.getElementById('admin-panel');
    if (!painel) {
        painel = document.createElement('div');
        painel.id = 'admin-panel';
        painel.style.cssText = "display:none; margin-top: 20px; border-top: 2px dashed red; padding-top: 15px; width: 100%;";
        painel.innerHTML = `
            <h3 style="color: red; font-family: 'Orbitron'; font-size: 11px; margin-bottom: 10px;">USUÁRIOS NO BANCO</h3>
            <div id="admin-users-list" style="max-height: 150px; overflow-y: auto; text-align: left; font-size: 11px; background: #000; padding: 10px; border-radius: 8px; border: 1px solid #333;"></div>
        `;
        document.querySelector('.profile-card').appendChild(painel);
    }

    const listaAdmin = document.getElementById('admin-users-list');
    if (painel.style.display === 'block') { painel.style.display = 'none'; return; }
    
    painel.style.display = 'block';
    listaAdmin.innerHTML = "Carregando...";

    const { data: users, error } = await _supabase.from('profiles').select('full_name, id');
    if (error) { listaAdmin.innerHTML = "Erro ao carregar."; return; }

    listaAdmin.innerHTML = "";
    users.forEach(u => {
        listaAdmin.innerHTML += `<div style="border-bottom: 1px solid #222; padding: 8px 0; display: flex; justify-content: space-between;">
            <span style="color: #eee;">${u.full_name || 'Sem nome'}</span>
            <span style="color: #444; font-size: 8px;">ID: ${u.id.substring(0,5)}</span>
        </div>`;
    });
}

function fecharPerfil() {
    document.getElementById('profile-overlay').style.display = 'none';
}

async function sair() {
    await _supabase.auth.signOut();
    location.reload();
}

async function salvarPerfil() {
    const newName = document.getElementById('profile-name').value;
    const newPic = document.getElementById('profile-pic-url').value;
    const { data: { user } } = await _supabase.auth.getUser();

    await _supabase.auth.updateUser({ data: { display_name: newName, avatar_url: newPic } });
    await _supabase.from('profiles').upsert({ id: user.id, full_name: newName, avatar_url: newPic, updated_at: new Date() });

    alert("Perfil atualizado!");
    location.reload();
}

async function entrar() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const { error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) document.getElementById('auth-error').innerText = "Erro no login.";
    else location.reload();
}

async function cadastrar() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const { error } = await _supabase.auth.signUp({ email, password });
    if (error) document.getElementById('auth-error').innerText = error.message;
    else alert("Verifique seu e-mail para confirmar!");
}

async function checarSessao() {
    const { data: { session } } = await _supabase.auth.getSession();
    const navBtn = document.getElementById('navLoginBtn');
    if (session && navBtn) {
        const name = session.user.user_metadata.display_name;
        navBtn.innerText = name ? name.toUpperCase() : "PERFIL";
        navBtn.onclick = () => abrirPerfil(session.user.email);
    }
}

/* --- FUNÇÕES DO SITE --- */

function carregarMods() {
    const container = document.getElementById('modList');
    if (!container || typeof listaDeMods === 'undefined') return;
    container.innerHTML = ""; 
    listaDeMods.forEach(mod => {
        container.innerHTML += `
            <div class="mod-card" data-category="${mod.categoria}" id="${mod.id}">
                <button class="btn-fav" onclick="toggleFav('${mod.id}')">❤</button>
                <button class="btn-share" onclick="copyLink('${mod.link}')">🔗</button>
                <img src="${mod.imagem}" class="mod-img" loading="lazy">
                <div class="mod-info">
                    <h2>${mod.titulo}</h2>
                    <p>${mod.descricao}</p>
                    <a href="${mod.link}" class="btn btn-download">VER DETALHES</a>
                </div>
            </div>`;
    });
}

// CORREÇÃO: Função de tema agora respeita o botão ativo
function applyTheme(color, save = true) {
    selectedColor = color;
    if(save) localStorage.setItem('site_theme', color);
    document.documentElement.style.setProperty('--main-color', color);
    
    document.querySelectorAll('.btn-download, .btn-category.active').forEach(e => {
        e.style.backgroundColor = color;
        e.style.borderColor = color;
    });
    
    // Reseta botões inativos
    document.querySelectorAll('.btn-category:not(.active)').forEach(e => {
        e.style.backgroundColor = "";
        e.style.borderColor = "";
    });
}

// CORREÇÃO: Alternar categorias limpando o estado anterior corretamente
function setCategory(cat, el) {
    document.querySelectorAll('.btn-category').forEach(b => {
        b.classList.remove('active');
        b.style.backgroundColor = ""; // Limpa cor do tema dos outros
    });
    
    el.classList.add('active');
    el.style.backgroundColor = selectedColor; // Aplica cor do tema no selecionado
    currentCategory = cat;
    filterMods();
}

function filterMods() {
    let q = document.getElementById('searchInput').value.toLowerCase();
    let f = JSON.parse(localStorage.getItem('mix_favs')) || [];
    let visiveis = 0;

    document.querySelectorAll('.mod-card').forEach(c => {
        let match = c.querySelector('h2').innerText.toLowerCase().includes(q) && 
                   (currentCategory === 'todos' || c.getAttribute('data-category') === currentCategory || (currentCategory === 'favs' && f.includes(c.id)));
        c.style.display = match ? "" : "none";
        if(match) visiveis++;
    });

    // CORREÇÃO: Atualiza o contador de mods na tela
    const modCounter = document.getElementById('modCounter');
    if(modCounter) {
        modCounter.innerText = `Exibindo ${visiveis} mods de ${listaDeMods.length}`;
    }
}

async function carregarComunidade() {
    const lista = document.getElementById('usuarios-lista');
    if (!lista) return;

    const { data: profiles } = await _supabase.from('profiles').select('full_name, avatar_url').not('full_name', 'is', null);
    if (!profiles) return;

    const container = document.querySelector('.container-social');
    const antigo = document.getElementById('membros-count');
    if (antigo) antigo.remove();
    
    const countBadge = document.createElement('div');
    countBadge.id = 'membros-count';
    countBadge.style.cssText = "color: var(--main-color); margin-bottom: 20px; font-weight: bold; font-family: 'Orbitron';";
    countBadge.innerText = `JÁ SOMOS ${profiles.length} MODDERS!`;
    if(container) container.insertBefore(countBadge, lista);

    lista.innerHTML = profiles.map(user => `
        <div class="user-card" style="background: #111; border: 1px solid var(--main-color); padding: 15px; border-radius: 12px; display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
            <img src="${user.avatar_url || 'assets/img/logo-icon.png'}" style="width: 45px; height: 45px; border-radius: 50%; border: 2px solid var(--main-color); object-fit: cover;">
            <div style="text-align: left;">
                <h3 style="color: #fff; margin: 0; font-family: 'Orbitron'; font-size: 0.8rem;">${user.full_name}</h3>
                <span style="color: var(--main-color); font-size: 9px; font-weight: bold;">MODDER VERIFICADO</span>
            </div>
        </div>
    `).join('');
}

/* --- OUTRAS FUNÇÕES --- */

function toggleSettings(e) { e.stopPropagation(); document.getElementById("settingsOptions").classList.toggle("active"); }
function changeView(mode) { viewMode = mode; localStorage.setItem('view_mode', mode); location.reload(); }
function toggleFav(id) {
    let f = JSON.parse(localStorage.getItem('mix_favs')) || [];
    if(f.includes(id)) f = f.filter(x => x !== id); else f.push(id);
    localStorage.setItem('mix_favs', JSON.stringify(f));
    updateFavs();
}
function updateFavs() {
    let f = JSON.parse(localStorage.getItem('mix_favs')) || [];
    document.querySelectorAll('.mod-card').forEach(c => {
        const btn = c.querySelector('.btn-fav');
        if(btn) btn.classList.toggle('active', f.includes(c.id));
    });
}
function copyLink(u) { navigator.clipboard.writeText(window.location.origin + "/" + u); let t = document.getElementById("toast"); t.className = "show"; setTimeout(() => t.className = "", 2000); }

window.addEventListener('load', () => { 
    checarSessao();
    carregarMods();
    updateFavs();
    filterMods(); // Chama aqui para atualizar o contador no início
    applyTheme(selectedColor, false);
    carregarComunidade();
    setTimeout(() => { if(document.getElementById('loading-screen')) document.getElementById('loading-screen').style.display = 'none'; }, 500); 
});