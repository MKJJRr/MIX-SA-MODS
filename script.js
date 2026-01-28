/* LÓGICA DO SITE MIX-SA-MODS - VERSÃO HÍBRIDA (BANCO + LOCAL) */

let currentCategory = 'todos';
let selectedColor = localStorage.getItem('site_theme') || '#00ff00';
let viewMode = localStorage.getItem('view_mode') || 'grid';
let listaDeModsLocal = []; 

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
    const oldAdminBtn = document.getElementById('btn-admin-area');
    if (oldAdminBtn) oldAdminBtn.remove();
    const oldPanel = document.getElementById('admin-panel');
    if (oldPanel) oldPanel.remove();

    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    document.getElementById('user-email-display').innerText = email;
    
    const meta = user.user_metadata;
    if (meta) {
        document.getElementById('profile-name').value = meta.display_name || "";
        document.getElementById('profile-pic-url').value = meta.avatar_url || "";
        if (meta.avatar_url) document.getElementById('user-avatar').src = meta.avatar_url;
    }

    if (user.email === 'maikotavares123456789@gmail.com') {
        if (!document.getElementById('btn-admin-area')) {
            const adminBtn = document.createElement('button');
            adminBtn.id = 'btn-admin-area';
            adminBtn.innerText = "PAINEL ADMINISTRATIVO";
            adminBtn.style.cssText = "background: #ff0000; color: white; border: none; padding: 12px; cursor: pointer; margin-top: 15px; border-radius: 8px; width: 100%; font-weight: bold; font-family: 'Orbitron'; box-shadow: 0 0 10px rgba(255,0,0,0.5);";
            adminBtn.onclick = (e) => {
                e.stopPropagation();
                abrirPainelAdmin();
            };
            document.querySelector('.profile-card').appendChild(adminBtn);
        }
    }

    document.getElementById('profile-overlay').style.display = 'flex';
}

async function abrirPainelAdmin() {
    let painel = document.getElementById('admin-panel');
    if (!painel) {
        painel = document.createElement('div');
        painel.id = 'admin-panel';
        painel.style.cssText = "display:none; margin-top: 20px; border-top: 2px dashed red; padding-top: 15px; width: 100%;";
        document.querySelector('.profile-card').appendChild(painel);
    }
    
    if (painel.style.display === 'block') { painel.style.display = 'none'; return; }
    painel.style.display = 'block';

    // Conteúdo Padrão do Painel
    painel.innerHTML = `
        <h3 style="color: red; font-family: 'Orbitron'; font-size: 11px; margin-bottom: 10px;">AGUARDANDO APROVAÇÃO</h3>
        <div id="admin-mods-list" style="max-height: 150px; overflow-y: auto; text-align: left; font-size: 11px; background: #000; padding: 10px; border-radius: 8px; border: 1px solid #333; margin-bottom: 15px;">Carregando...</div>
        
        <h3 style="color: #00ff00; font-family: 'Orbitron'; font-size: 11px; margin-bottom: 10px;">GERENCIAR MODS ATIVOS</h3>
        <div id="admin-active-list" style="max-height: 150px; overflow-y: auto; text-align: left; font-size: 11px; background: #000; padding: 10px; border-radius: 8px; border: 1px solid #333; margin-bottom: 15px;">Carregando...</div>

        <h3 style="color: #fff; font-family: 'Orbitron'; font-size: 11px; margin-bottom: 10px;">USUÁRIOS</h3>
        <div id="admin-users-list" style="max-height: 100px; overflow-y: auto; text-align: left; font-size: 11px; background: #000; padding: 10px; border-radius: 8px; border: 1px solid #333;">Carregando...</div>
    `;

    // Carregar Mods Pendentes
    const { data: pendentes } = await _supabase.from('mods_pendentes').select('*');
    document.getElementById('admin-mods-list').innerHTML = pendentes?.length ? pendentes.map(m => `
        <div style="border-bottom: 1px solid #222; padding: 5px 0;">
            <b>${m.titulo}</b>
            <div style="margin-top:4px;">
                <button onclick="aprovarMod('${m.id}')" style="background:green; color:white; border:none; padding:2px 5px; cursor:pointer; border-radius:3px; font-size:9px;">APROVAR</button>
                <button onclick="deletarModPendente('${m.id}')" style="background:red; color:white; border:none; padding:2px 5px; cursor:pointer; border-radius:3px; font-size:9px;">APAGAR</button>
            </div>
        </div>`).join('') : "Nenhum mod pendente.";

    // Carregar Mods Ativos (Banco)
    const { data: ativos } = await _supabase.from('mods_aprovados').select('*');
    document.getElementById('admin-active-list').innerHTML = ativos?.length ? ativos.map(m => `
        <div style="border-bottom: 1px solid #222; padding: 5px 0;">
            <span style="color:#00ff00">${m.titulo}</span>
            <div style="margin-top:4px;">
                <button onclick="editarMod('${m.id}')" style="background:#444; color:white; border:none; padding:2px 5px; cursor:pointer; border-radius:3px; font-size:9px;">EDITAR</button>
                <button onclick="excluirModAtivo('${m.id}')" style="background:#600; color:white; border:none; padding:2px 5px; cursor:pointer; border-radius:3px; font-size:9px;">EXCLUIR</button>
            </div>
        </div>`).join('') : "Nenhum mod ativo no banco.";

    // Usuários
    const { data: users } = await _supabase.from('profiles').select('full_name');
    document.getElementById('admin-users-list').innerHTML = users?.map(u => `<div style="color:#888; border-bottom:1px solid #111; padding:2px;">${u.full_name || 'Anônimo'}</div>`).join('') || "Erro.";
}

/* --- AÇÕES DO ADMIN (COM FORMULÁRIO DE EDIÇÃO) --- */

async function editarMod(id) {
    const { data: mod, error } = await _supabase.from('mods_aprovados').select('*').eq('id', id).single();
    if (error || !mod) return alert("Erro ao buscar mod!");

    const painel = document.getElementById('admin-panel');
    painel.innerHTML = `
        <div style="background: #111; padding: 15px; border: 1px solid var(--main-color); border-radius: 10px; text-align: left;">
            <h3 style="color: var(--main-color); font-size: 10px; margin-bottom: 15px; font-family: 'Orbitron';">EDITAR MOD</h3>
            
            <label style="color: #666; font-size: 9px; display:block;">TÍTULO</label>
            <input type="text" id="edit-titulo" value="${mod.titulo}" style="width:100%; background:#000; color:#fff; border:1px solid #333; padding:8px; margin-bottom:10px; border-radius:5px;">
            
            <label style="color: #666; font-size: 9px; display:block;">CATEGORIA</label>
            <select id="edit-categoria" style="width: 100%; background: #000; border: 1px solid #333; color: #fff; padding: 8px; margin-bottom: 10px; border-radius: 5px;">
                <option value="cleo" ${mod.categoria === 'cleo' ? 'selected' : ''}>CLEO</option>
                <option value="veiculo" ${mod.categoria === 'veiculo' ? 'selected' : ''}>VEÍCULOS</option>
                <option value="textura" ${mod.categoria === 'textura' ? 'selected' : ''}>TEXTURAS</option>
                <option value="correcao" ${mod.categoria === 'correcao' ? 'selected' : ''}>CORREÇÃO</option>
            </select>

            <label style="color: #666; font-size: 9px; display:block;">URL IMAGEM</label>
            <input type="text" id="edit-imagem" value="${mod.imagem}" style="width:100%; background:#000; color:#fff; border:1px solid #333; padding:8px; margin-bottom:10px; border-radius:5px;">
            
            <label style="color: #666; font-size: 9px; display:block;">LINK DOWNLOAD</label>
            <input type="text" id="edit-link" value="${mod.link}" style="width:100%; background:#000; color:#fff; border:1px solid #333; padding:8px; margin-bottom:10px; border-radius:5px;">
            
            <label style="color: #666; font-size: 9px; display:block;">DESCRIÇÃO</label>
            <textarea id="edit-descricao" style="width:100%; background:#000; color:#fff; border:1px solid #333; padding:8px; height:60px; border-radius:5px; resize:none;">${mod.descricao}</textarea>
            
            <div style="display:flex; gap:10px; margin-top:15px;">
                <button onclick="salvarEdicao('${id}')" style="flex:1; background:var(--main-color); color:#000; border:none; padding:10px; cursor:pointer; font-weight:bold; border-radius:5px; font-size:10px; font-family:'Orbitron';">SALVAR</button>
                <button onclick="abrirPainelAdmin()" style="flex:1; background:#333; color:white; border:none; padding:10px; cursor:pointer; border-radius:5px; font-size:10px; font-family:'Orbitron';">VOLTAR</button>
            </div>
        </div>
    `;
}

async function salvarEdicao(id) {
    const updates = {
        titulo: document.getElementById('edit-titulo').value,
        categoria: document.getElementById('edit-categoria').value,
        imagem: document.getElementById('edit-imagem').value,
        link: document.getElementById('edit-link').value,
        descricao: document.getElementById('edit-descricao').value
    };

    const { error } = await _supabase.from('mods_aprovados').update(updates).eq('id', id);

    if (error) {
        alert("Erro ao salvar: " + error.message);
    } else {
        alert("Mod atualizado com sucesso!");
        location.reload();
    }
}

async function aprovarMod(id) {
    const { data: mod } = await _supabase.from('mods_pendentes').select('*').eq('id', id).single();
    if (mod) {
        const { error } = await _supabase.from('mods_aprovados').insert([{
            titulo: mod.titulo, categoria: mod.categoria, imagem: mod.imagem, link: mod.link, descricao: mod.descricao
        }]);
        if (!error) { await _supabase.from('mods_pendentes').delete().eq('id', id); location.reload(); }
    }
}

async function deletarModPendente(id) { if(confirm("Apagar da fila?")) { await _supabase.from('mods_pendentes').delete().eq('id', id); location.reload(); } }

async function excluirModAtivo(id) { if(confirm("Remover mod do site permanentemente?")) { await _supabase.from('mods_aprovados').delete().eq('id', id); location.reload(); } }

/* --- CARREGAMENTO E FILTROS --- */

async function carregarMods() {
    const container = document.getElementById('modList');
    if (!container) return;

    const { data: aprovados } = await _supabase.from('mods_aprovados').select('*').order('created_at', { ascending: false });
    let listaBanco = aprovados || [];
    let listaArquivo = (typeof listaDeMods !== 'undefined') ? listaDeMods : [];

    listaDeModsLocal = [...listaBanco, ...listaArquivo];

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
}

/* --- LOGIN E PERFIL --- */

async function entrar() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const { error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) document.getElementById('auth-error').innerText = "Erro no login."; else location.reload();
}

async function cadastrar() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const { error } = await _supabase.auth.signUp({ email, password });
    if (error) document.getElementById('auth-error').innerText = error.message; else alert("Conta criada!");
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

async function sair() { await _supabase.auth.signOut(); location.reload(); }

async function salvarPerfil() {
    const newName = document.getElementById('profile-name').value;
    const newPic = document.getElementById('profile-pic-url').value;
    const { data: { user } } = await _supabase.auth.getUser();
    await _supabase.auth.updateUser({ data: { display_name: newName, avatar_url: newPic } });
    await _supabase.from('profiles').upsert({ id: user.id, full_name: newName, avatar_url: newPic, updated_at: new Date() });
    alert("Perfil atualizado!");
    location.reload();
}

function fecharPerfil() { 
    document.getElementById('profile-overlay').style.display = 'none'; 
}

/* --- ENVIO DE MODS --- */

function abrirEnvio() {
    _supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) { alert("Faça login para enviar!"); abrirLogin(); }
        else { document.getElementById('upload-overlay').style.display = 'flex'; }
    });
}

function fecharEnvio() { document.getElementById('upload-overlay').style.display = 'none'; }

async function enviarModAoBanco() {
    const titulo = document.getElementById('mod-titulo').value;
    const categoria = document.getElementById('mod-categoria').value;
    const imagem = document.getElementById('mod-imagem').value;
    const link = document.getElementById('mod-link').value;
    const descricao = document.getElementById('mod-descricao').value;
    const btn = document.getElementById('btn-submit-mod');

    if (!titulo || !imagem || !link || !descricao) { alert("Preencha tudo!"); return; }
    btn.innerText = "ENVIANDO..."; btn.disabled = true;

    const { data: { user } } = await _supabase.auth.getUser();
    const { error } = await _supabase.from('mods_pendentes').insert([{
        titulo, categoria, imagem, link, descricao, autor_email: user.email, autor_id: user.id
    }]);

    if (error) { alert("Erro: " + error.message); btn.innerText = "SUBMETER MOD"; btn.disabled = false; }
    else { alert("Enviado para revisão!"); location.reload(); }
}

/* --- UI E TEMAS --- */

function applyTheme(color, save = true) {
    selectedColor = color;
    if(save) localStorage.setItem('site_theme', color);
    document.documentElement.style.setProperty('--main-color', color);
    document.querySelectorAll('.btn-download, .btn-category.active').forEach(e => {
        e.style.backgroundColor = color;
        e.style.borderColor = color;
    });
    closeMenus();
}

function setCategory(cat, el) {
    document.querySelectorAll('.btn-category').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    el.style.backgroundColor = selectedColor;
    currentCategory = cat;
    filterMods();
}

function filterMods() {
    let q = document.getElementById('searchInput').value.toLowerCase();
    let f = JSON.parse(localStorage.getItem('mix_favs')) || [];
    let v = 0;
    document.querySelectorAll('.mod-card').forEach(c => {
        let title = c.querySelector('h2').innerText.toLowerCase();
        let cat = c.getAttribute('data-category');
        let m = title.includes(q) && (currentCategory === 'todos' || cat === currentCategory || (currentCategory === 'favs' && f.includes(c.id)));
        c.style.display = m ? "" : "none";
        if(m) v++;
    });
    const counter = document.getElementById('modCounter');
    if(counter) counter.innerText = `Exibindo ${v} mods`;
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

function toggleSettings(e) { e.stopPropagation(); document.getElementById("settingsOptions")?.classList.toggle("active"); }
function toggleSubmenu(e, id) { e.stopPropagation(); document.getElementById(id)?.classList.toggle("active"); }
function closeMenus() { 
    document.getElementById("settingsOptions")?.classList.remove("active"); 
    document.querySelectorAll(".submenu").forEach(s => s.classList.remove("active"));
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
        const b = c.querySelector('.btn-fav');
        if(b) b.classList.toggle('active', f.includes(c.id));
    });
}

function copyLink(u) {
    navigator.clipboard.writeText(u);
    let t = document.getElementById("toast"); if(t) { t.className = "show"; setTimeout(() => t.className = "", 2000); }
}

async function carregarComunidade() {
    const lista = document.getElementById('usuarios-lista');
    if (!lista) return;
    const { data: p } = await _supabase.from('profiles').select('full_name, avatar_url').not('full_name', 'is', null);
    if (p) {
        lista.innerHTML = p.map(u => `<div class="user-card"><img src="${u.avatar_url || 'assets/img/logo-icon.png'}" style="width:35px; height:35px; border-radius:50%; object-fit:cover;"><div><h3 style="color:#fff; margin:0; font-size:11px;">${u.full_name}</h3></div></div>`).join('');
    }
}

window.addEventListener('load', () => { 
    checarSessao(); 
    carregarMods(); 
    applyTheme(selectedColor, false); 
    changeView(viewMode); 
    carregarComunidade();
    setTimeout(() => { if(document.getElementById('loading-screen')) document.getElementById('loading-screen').style.display='none'; }, 800); 
});