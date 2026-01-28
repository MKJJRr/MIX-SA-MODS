/* LÓGICA DO SITE MIX-SA-MODS - COM NOTIFICAÇÕES TOAST */

let currentCategory = 'todos';
let selectedColor = localStorage.getItem('site_theme') || '#00ff00';
let viewMode = localStorage.getItem('view_mode') || 'grid';
let listaDeModsLocal = []; 

const SUPABASE_URL = 'https://egfxnzebciuyidaahezc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7QAzm1GleD0QjNKfO-dtbw_JyOLcHr0';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- FUNÇÃO DE NOTIFICAÇÃO (TOAST) ---
function showToast(mensagem, cor = 'var(--main-color)') {
    const toast = document.getElementById("toast");
    if (!toast) return;
    
    toast.innerText = mensagem;
    toast.style.borderLeft = `5px solid ${cor}`;
    toast.className = "show";
    
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

/* --- FUNÇÕES DE PERFIL E LOGIN --- */

async function abrirPerfil(email) {
    document.body.style.overflow = 'hidden';
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
            adminBtn.style.cssText = "background: #ff0000; color: white; border: none; padding: 12px; cursor: pointer; margin-top: 15px; border-radius: 8px; width: 100%; font-weight: bold; font-family: 'Orbitron';";
            adminBtn.onclick = (e) => { e.stopPropagation(); abrirPainelAdmin(); };
            document.querySelector('.profile-card').appendChild(adminBtn);
        }
    }
    document.getElementById('profile-overlay').style.display = 'flex';
}

function fecharPerfil() { 
    document.body.style.overflow = 'auto';
    document.getElementById('profile-overlay').style.display = 'none'; 
}

/* --- PAINEL ADMINISTRATIVO --- */

async function abrirPainelAdmin() {
    let painel = document.getElementById('admin-panel');
    if (!painel) {
        painel = document.createElement('div');
        painel.id = 'admin-panel';
        painel.style.cssText = "display:none; margin-top: 20px; border-top: 2px dashed red; padding-top: 15px; width: 100%; position: relative;";
        document.querySelector('.profile-card').appendChild(painel);
    }
    if (painel.style.display === 'block') { painel.style.display = 'none'; return; }
    painel.style.display = 'block';

    painel.innerHTML = `
        <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="color: red; font-family: 'Orbitron'; font-size: 11px; margin: 0;">MODS PENDENTES</h3>
            <button onclick="document.getElementById('admin-panel').style.display='none'" style="background:none; border:none; color:white; font-size: 20px; cursor:pointer;">&times;</button>
        </div>
        <div id="admin-mods-list" class="admin-scroll">Carregando...</div>
        <h3 style="color: #00ff00; font-family: 'Orbitron'; font-size: 11px; margin: 15px 0 10px;">MODS ATIVOS</h3>
        <div id="admin-active-list" class="admin-scroll">Carregando...</div>
    `;

    const { data: pendentes } = await _supabase.from('mods_pendentes').select('*');
    document.getElementById('admin-mods-list').innerHTML = pendentes?.length ? pendentes.map(m => `
        <div class="admin-item">
            <b>${m.titulo}</b>
            <div>
                <button onclick="aprovarMod('${m.id}')" style="background:green;">APROVAR</button>
                <button onclick="deletarModPendente('${m.id}')" style="background:red;">APAGAR</button>
            </div>
        </div>`).join('') : "Nada pendente.";

    const { data: ativos } = await _supabase.from('mods_aprovados').select('*');
    document.getElementById('admin-active-list').innerHTML = ativos?.length ? ativos.map(m => `
        <div class="admin-item">
            <span style="color:#00ff00">${m.titulo}</span>
            <div>
                <button onclick="editarMod('${m.id}')" style="background:#444;">EDITAR</button>
                <button onclick="excluirModAtivo('${m.id}')" style="background:#600;">EXCLUIR</button>
            </div>
        </div>`).join('') : "Nenhum mod ativo.";
}

async function editarMod(id) {
    const { data: mod } = await _supabase.from('mods_aprovados').select('*').eq('id', id).single();
    const painel = document.getElementById('admin-panel');
    document.querySelector('.profile-card').scrollTop = 0;

    painel.innerHTML = `
        <div onclick="event.stopPropagation()" style="background: #111; padding: 15px; border: 2px solid var(--main-color); border-radius: 12px; text-align: left;">
            <div style="display:flex; justify-content: space-between; margin-bottom: 15px;">
                <h3 style="color: var(--main-color); font-size: 10px; font-family: 'Orbitron';">EDITANDO: ${mod.titulo}</h3>
                <button onclick="abrirPainelAdmin(); abrirPainelAdmin();" style="color:#666; background:none; border:none; font-size:20px;">&times;</button>
            </div>
            <input type="text" id="edit-titulo" value="${mod.titulo}" class="admin-input">
            <textarea id="edit-descricao" class="admin-input" style="height:80px;">${mod.descricao}</textarea>
            <input type="text" id="edit-link" value="${mod.link}" class="admin-input">
            <button onclick="salvarEdicao('${id}')" style="width:100%; background:var(--main-color); color:#000; padding:12px; border-radius:8px; font-weight:bold; font-family:'Orbitron';">SALVAR ALTERAÇÕES</button>
        </div>
    `;
}

async function salvarEdicao(id) {
    const updates = {
        titulo: document.getElementById('edit-titulo').value,
        descricao: document.getElementById('edit-descricao').value,
        link: document.getElementById('edit-link').value
    };
    const { error } = await _supabase.from('mods_aprovados').update(updates).eq('id', id);
    if (error) showToast("Erro ao salvar!", "red");
    else {
        showToast("Mod atualizado com sucesso!");
        setTimeout(() => location.reload(), 1500);
    }
}

async function aprovarMod(id) {
    const { data: mod } = await _supabase.from('mods_pendentes').select('*').eq('id', id).single();
    if (mod) {
        await _supabase.from('mods_aprovados').insert([{
            titulo: mod.titulo, categoria: mod.categoria, imagem: mod.imagem, link: mod.link, descricao: mod.descricao
        }]);
        await _supabase.from('mods_pendentes').delete().eq('id', id);
        showToast("Mod aprovado e publicado!");
        setTimeout(() => location.reload(), 1500);
    }
}

async function excluirModAtivo(id) {
    if(confirm("Deseja remover este mod?")) {
        await _supabase.from('mods_aprovados').delete().eq('id', id);
        showToast("Mod removido!", "red");
        setTimeout(() => location.reload(), 1500);
    }
}

/* --- SISTEMA DE DOWNLOAD E CÓPIA --- */
function copyLink(u) {
    navigator.clipboard.writeText(u);
    showToast("Link copiado para a área de transferência!");
}

/* --- CARREGAMENTO INICIAL --- */
async function carregarMods() {
    const container = document.getElementById('modList');
    if (!container) return;
    const { data: aprovados } = await _supabase.from('mods_aprovados').select('*').order('created_at', { ascending: false });
    listaDeModsLocal = [...(aprovados || []), ...(typeof listaDeMods !== 'undefined' ? listaDeMods : [])];
    
    container.innerHTML = listaDeModsLocal.map(mod => `
        <div class="mod-card" data-category="${mod.categoria}" id="${mod.id || mod.titulo}">
            <button class="btn-fav" onclick="toggleFav('${mod.id || mod.titulo}')">❤</button>
            <button class="btn-share" onclick="copyLink('${mod.link}')">🔗</button>
            <img src="${mod.imagem}" class="mod-img">
            <div class="mod-info">
                <h2>${mod.titulo}</h2>
                <p>${mod.descricao}</p>
                <a href="${mod.link}" target="_blank" class="btn btn-download">VER DETALHES</a>
            </div>
        </div>`).join('');
}

// Inicia tudo
window.addEventListener('load', () => { 
    checarSessao(); 
    carregarMods(); 
    applyTheme(selectedColor, false);
});

/* Funções de suporte (Sessão, Login, etc) permanecem iguais */
async function checarSessao() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session && document.getElementById('navLoginBtn')) {
        document.getElementById('navLoginBtn').innerText = "PERFIL";
        document.getElementById('navLoginBtn').onclick = () => abrirPerfil(session.user.email);
    }
}

function applyTheme(color, save = true) {
    selectedColor = color;
    if(save) localStorage.setItem('site_theme', color);
    document.documentElement.style.setProperty('--main-color', color);
}