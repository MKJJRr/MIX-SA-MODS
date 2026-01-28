/* LÓGICA COMPLETA MIX-SA-MODS - VERSÃO ESTÁVEL COM TOASTS */

let currentCategory = 'todos';
let selectedColor = localStorage.getItem('site_theme') || '#00ff00';
let viewMode = localStorage.getItem('view_mode') || 'grid';
let listaDeModsLocal = []; 

const SUPABASE_URL = 'https://egfxnzebciuyidaahezc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7QAzm1GleD0QjNKfO-dtbw_JyOLcHr0';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- SISTEMA DE NOTIFICAÇÃO (TOAST) ---
function showToast(mensagem, cor = 'var(--main-color)') {
    const toast = document.getElementById("toast");
    if (!toast) return;
    
    toast.innerText = mensagem;
    toast.style.borderLeft = `5px solid ${cor}`;
    toast.className = "show";
    
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

/* --- FUNÇÕES DE CARREGAMENTO E SESSÃO --- */

async function checarSessao() {
    const { data: { session } } = await _supabase.auth.getSession();
    const navBtn = document.getElementById('navLoginBtn');
    if (session && navBtn) {
        const name = session.user.user_metadata.display_name;
        navBtn.innerText = name ? name.toUpperCase() : "PERFIL";
        navBtn.onclick = () => abrirPerfil(session.user.email);
    }
}

async function carregarMods() {
    const container = document.getElementById('modList');
    if (!container) return;
    
    try {
        const { data: aprovados } = await _supabase.from('mods_aprovados').select('*').order('created_at', { ascending: false });
        // Junta mods do banco com mods do arquivo local (se existir)
        let listaArquivo = (typeof listaDeMods !== 'undefined') ? listaDeMods : [];
        listaDeModsLocal = [...(aprovados || []), ...listaArquivo];
        
        container.innerHTML = listaDeModsLocal.map(mod => `
            <div class="mod-card" data-category="${mod.categoria}" id="${mod.id || mod.titulo}">
                <button class="btn-fav" onclick="toggleFav('${mod.id || mod.titulo}')">❤</button>
                <button class="btn-share" onclick="copyLink('${mod.link}')">🔗</button>
                <img src="${mod.imagem}" class="mod-img" loading="lazy">
                <div class="mod-info">
                    <h2>${mod.titulo}</h2>
                    <p>${mod.descricao}</p>
                    <a href="${mod.link}" target="_blank" class="btn btn-download">VER DETALHES</a>
                </div>
            </div>`).join('');
            
        updateFavs();
        filterMods();
    } catch (e) {
        console.error("Erro ao carregar mods:", e);
    }
}

/* --- FILTROS E PESQUISA --- */

function setCategory(cat, el) {
    document.querySelectorAll('.btn-category').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    currentCategory = cat;
    filterMods();
}

function filterMods() {
    let q = document.getElementById('searchInput').value.toLowerCase();
    let f = JSON.parse(localStorage.getItem('mix_favs')) || [];
    let visiveis = 0;
    
    document.querySelectorAll('.mod-card').forEach(c => {
        let title = c.querySelector('h2').innerText.toLowerCase();
        let cat = c.getAttribute('data-category');
        let m = title.includes(q) && (currentCategory === 'todos' || cat === currentCategory || (currentCategory === 'favs' && f.includes(c.id)));
        c.style.display = m ? "" : "none";
        if(m) visiveis++;
    });
    
    const counter = document.getElementById('modCounter');
    if(counter) counter.innerText = `Exibindo ${visiveis} mods`;
}

/* --- PERFIL E LOGIN --- */

function abrirLogin() { document.getElementById('login-overlay').style.display = 'flex'; }
function fecharLogin() { document.getElementById('login-overlay').style.display = 'none'; }

async function abrirPerfil(email) {
    document.body.style.overflow = 'hidden';
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    document.getElementById('user-email-display').innerText = email;
    const meta = user.user_metadata;
    if (meta) {
        document.getElementById('profile-name').value = meta.display_name || "";
        document.getElementById('profile-pic-url').value = meta.avatar_url || "";
        if (meta.avatar_url) document.getElementById('user-avatar').src = meta.avatar_url;
    }
    
    // Botão Admin para o seu email
    if (user.email === 'maikotavares123456789@gmail.com') {
        if (!document.getElementById('btn-admin-area')) {
            const btn = document.createElement('button');
            btn.id = 'btn-admin-area';
            btn.innerText = "PAINEL ADMINISTRATIVO";
            btn.style.cssText = "background:red; color:white; border:none; padding:12px; cursor:pointer; margin-top:15px; border-radius:8px; width:100%; font-weight:bold; font-family:'Orbitron';";
            btn.onclick = abrirPainelAdmin;
            document.querySelector('.profile-card').appendChild(btn);
        }
    }
    document.getElementById('profile-overlay').style.display = 'flex';
}

function fecharPerfil() { 
    document.body.style.overflow = 'auto';
    document.getElementById('profile-overlay').style.display = 'none'; 
}

async function salvarPerfil() {
    const newName = document.getElementById('profile-name').value;
    const newPic = document.getElementById('profile-pic-url').value;
    const { error } = await _supabase.auth.updateUser({ data: { display_name: newName, avatar_url: newPic } });
    
    if (error) showToast("Erro ao salvar!", "red");
    else {
        showToast("Perfil atualizado!");
        setTimeout(() => location.reload(), 1000);
    }
}

/* --- CONFIGURAÇÕES E VISUAL --- */

function applyTheme(color, save = true) {
    selectedColor = color;
    if(save) localStorage.setItem('site_theme', color);
    document.documentElement.style.setProperty('--main-color', color);
    closeMenus();
}

function changeView(mode) {
    const container = document.getElementById('modList');
    viewMode = mode;
    localStorage.setItem('view_mode', mode);
    if (mode === 'list') container.classList.add('list-mode');
    else container.classList.remove('list-mode');
    closeMenus();
}

function toggleSettings(e) { e.stopPropagation(); document.getElementById("settingsOptions")?.classList.toggle("active"); }
function toggleSubmenu(e, id) { e.stopPropagation(); document.getElementById(id)?.classList.toggle("active"); }
function closeMenus() { 
    document.getElementById("settingsOptions")?.classList.remove("active"); 
    document.querySelectorAll(".submenu").forEach(s => s.classList.remove("active"));
}

/* --- UTILITÁRIOS --- */

function copyLink(u) {
    navigator.clipboard.writeText(u);
    showToast("Link copiado!");
}

function toggleFav(id) {
    let f = JSON.parse(localStorage.getItem('mix_favs')) || [];
    if(f.includes(id)) {
        f = f.filter(x => x !== id);
        showToast("Removido dos favoritos", "#666");
    } else {
        f.push(id);
        showToast("Adicionado aos favoritos!");
    }
    localStorage.setItem('mix_favs', JSON.stringify(f));
    updateFavs();
}

function updateFavs() {
    let f = JSON.parse(localStorage.getItem('mix_favs')) || [];
    document.querySelectorAll('.mod-card').forEach(c => {
        const b = c.querySelector('.btn-fav');
        if(b) b.classList.toggle('active', f.includes(c.id));
    });
}

async function sair() { 
    await _supabase.auth.signOut(); 
    location.reload(); 
}

// --- INICIALIZAÇÃO ---
window.addEventListener('load', async () => { 
    await checarSessao(); 
    await carregarMods(); 
    applyTheme(selectedColor, false);
    changeView(viewMode);
    
    // REMOVE O LOADING SCREEN
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }, 800);
});