/* LÓGICA DO SITE MIX-SA-MODS */

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

    // Ajuste para o botão Admin não duplicar ao abrir o perfil várias vezes
    const existingAdmin = document.getElementById('btn-admin-area');
    if (existingAdmin) existingAdmin.remove();

    // REGRA 3: BOTÃO DE ADMIN (Só aparece para o seu e-mail)
    // TROQUE O E-MAIL ABAIXO PELO SEU E-MAIL DO SUPABASE
    if (user.email === 'SEU_EMAIL_AQUI@gmail.com') {
        const adminBtn = document.createElement('button');
        adminBtn.id = 'btn-admin-area';
        adminBtn.innerText = "PAINEL ADMINISTRATIVO";
        adminBtn.style.cssText = "background: red; color: white; border: none; padding: 10px; cursor: pointer; margin-top: 15px; border-radius: 8px; width: 100%; font-weight: bold; font-family: 'Orbitron';";
        adminBtn.onclick = () => abrirPainelAdmin();
        document.querySelector('.profile-card').appendChild(adminBtn);
    }

    document.getElementById('profile-overlay').style.display = 'flex';
}

function fecharPerfil() {
    document.getElementById('profile-overlay').style.display = 'none';
}

// Função placeholder para o Painel Admin
function abrirPainelAdmin() {
    alert("Acesso autorizado, Chefe! Em breve você verá a lista de e-mails aqui.");
    // Aqui no futuro carregaremos uma tabela com todos os usuários cadastrados
}

async function salvarPerfil() {
    const newName = document.getElementById('profile-name').value;
    const newPic = document.getElementById('profile-pic-url').value;
    const newPass = document.getElementById('new-password').value;
    const { data: { user } } = await _supabase.auth.getUser();

    const updates = { data: { display_name: newName, avatar_url: newPic } };
    await _supabase.auth.updateUser(updates);
    
    await _supabase.from('profiles').upsert({
        id: user.id,
        full_name: newName,
        avatar_url: newPic,
        updated_at: new Date()
    });

    if (newPass.length >= 6) {
        await _supabase.auth.updateUser({ password: newPass });
    }

    alert("Perfil atualizado!");
    location.reload();
}

async function cadastrar() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');
    if (!email || !password) { errorMsg.innerText = "Preencha tudo!"; return; }

    const { error } = await _supabase.auth.signUp({ email, password });
    if (error) errorMsg.innerText = error.message;
    else alert("Conta criada!");
}

async function entrar() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const { error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) document.getElementById('auth-error').innerText = "Erro no login.";
    else location.reload();
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

async function sair() {
    await _supabase.auth.signOut();
    location.reload();
}

/* --- FUNÇÃO DA COMUNIDADE (SOCIAL) --- */

async function carregarComunidade() {
    const lista = document.getElementById('usuarios-lista');
    if (!lista) return;

    const { data: profiles, error } = await _supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .not('full_name', 'is', null);

    if (error) return;

    // REGRA 1: CONTADOR DE MEMBROS
    const total = profiles.length;
    const container = document.querySelector('.container-social');
    // Remove contador antigo se houver para não duplicar no reload
    const antigo = document.getElementById('membros-count');
    if (antigo) antigo.remove();
    
    const countBadge = document.createElement('div');
    countBadge.id = 'membros-count';
    countBadge.style.cssText = "color: var(--main-color); margin-bottom: 20px; font-weight: bold; font-size: 14px;";
    countBadge.innerText = `JÁ SOMOS ${total} MODDERS NA MIX-SA!`;
    container.insertBefore(countBadge, lista);

    lista.innerHTML = "";
    profiles.forEach(user => {
        const foto = user.avatar_url || 'assets/img/logo-icon.png';
        lista.innerHTML += `
            <div class="user-card" style="background: #111; border: 1px solid var(--main-color); padding: 15px; border-radius: 12px; display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                <img src="${foto}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--main-color); object-fit: cover;">
                <div style="text-align: left;">
                    <h3 style="color: #fff; margin: 0; font-family: 'Orbitron'; font-size: 0.9rem;">${user.full_name}</h3>
                    <span style="color: var(--main-color); font-size: 10px; font-weight: bold;">MODDER VERIFICADO</span>
                </div>
            </div>
        `;
    });
}

/* --- FUNÇÕES DO SITE (MANTIDAS) --- */

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
    document.querySelectorAll(".submenu").forEach(s => s.classList.remove("active"));
    sub.classList.add("active");
}

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

function setCategory(cat, el) {
    document.querySelectorAll('.btn-category').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    currentCategory = cat;
    filterMods();
}

function filterMods() {
    let q = document.getElementById('searchInput').value.toLowerCase();
    let f = JSON.parse(localStorage.getItem('mix_favs')) || [];
    let count = 0;
    document.querySelectorAll('.mod-card').forEach(c => {
        let match = c.querySelector('h2').innerText.toLowerCase().includes(q) && 
                   (currentCategory === 'todos' || c.getAttribute('data-category') === currentCategory || (currentCategory === 'favs' && f.includes(c.id)));
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

window.onclick = function(e) { if (!document.getElementById("mainSettings").contains(e.target)) closeMenus(); };

function randomMod() {
    let c = document.querySelectorAll('.mod-card:not([style*="display: none"])');
    if(c.length > 0) c[Math.floor(Math.random()*c.length)].scrollIntoView({behavior:'smooth', block:'center'});
}

function copyLink(u) { 
    navigator.clipboard.writeText(window.location.origin + "/" + u); 
    let t = document.getElementById("toast"); 
    t.className = "show"; setTimeout(() => t.className = "", 2000); 
}

window.addEventListener('load', () => { 
    checarSessao();
    carregarMods();
    applyTheme(selectedColor, false);
    changeView(viewMode);
    updateFavs(); 
    filterMods();
    carregarComunidade();

    const loader = document.getElementById('loading-screen');
    if(loader) {
        setTimeout(() => { loader.style.display = 'none'; }, 500); 
    }
});