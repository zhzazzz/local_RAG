let useCloud = true;
let filesData = [];
let sidebarVisible = true;

function tailwindInit() {
    tailwind.config = { content: ["*"], darkMode: 'class' };
}

function addMessage(text, isUser) {
    const chat = document.getElementById('chat');
    const div = document.createElement('div');
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'} message`;
    div.innerHTML = `<div class="${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800'} max-w-[75%] px-5 py-3.5 rounded-3xl rounded-${isUser ? 'br' : 'bl'}-none shadow-sm text-sm">${text.replace(/\n/g, '<br>')}</div>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
}

function showLoading() {
    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.className = 'flex justify-start message';
    loading.innerHTML = `<div class="bg-gray-100 dark:bg-gray-800 px-5 py-3.5 rounded-3xl flex items-center gap-3 text-sm"><i class="fa-solid fa-spinner animate-spin text-blue-600"></i><span class="text-gray-500 dark:text-gray-400">思考中...</span></div>`;
    document.getElementById('chat').appendChild(loading);
    document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
    return loading;
}

async function loadFiles(search = '') {
    const res = await fetch('/kb/files');
    const data = await res.json();
    filesData = data.files || [];

    const container = document.getElementById('fileList');
    container.innerHTML = '';

    const structured = filesData.filter(f => f.path.includes('/Structured/') || f.path.includes('\\Structured\\'));
    const unstructured = filesData.filter(f => f.path.includes('/Unstructured/') || f.path.includes('\\Unstructured\\'));

    const total = structured.length + unstructured.length;
    document.getElementById('totalCount').textContent = total;

    const filter = search.toLowerCase();
    const filteredStructured = structured.filter(f => f.name.toLowerCase().includes(filter));
    const filteredUnstructured = unstructured.filter(f => f.name.toLowerCase().includes(filter));

    container.innerHTML += `
                <div class="mb-6">
                    <div class="flex items-center gap-2 mb-3 px-1">
                        <i class="fa-solid fa-table text-emerald-600"></i>
                        <h3 class="font-semibold text-emerald-700 dark:text-emerald-400">结构化文件</h3>
                        <span class="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">${filteredStructured.length}</span>
                    </div>
                    <div class="space-y-2" id="structuredList"></div>
                </div>
            `;
    container.innerHTML += `
                <div>
                    <div class="flex items-center gap-2 mb-3 px-1">
                        <i class="fa-solid fa-file-lines text-blue-600"></i>
                        <h3 class="font-semibold text-blue-700 dark:text-blue-400">非结构化文件</h3>
                        <span class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">${filteredUnstructured.length}</span>
                    </div>
                    <div class="space-y-2" id="unstructuredList"></div>
                </div>
            `;

    const sList = document.getElementById('structuredList');
    filteredStructured.forEach(f => renderFileCard(sList, f));

    const uList = document.getElementById('unstructuredList');
    filteredUnstructured.forEach(f => renderFileCard(uList, f));
}

function renderFileCard(parent, f) {
    let iconClass = 'fa-file-lines text-gray-500';
    let iconColor = 'text-gray-500';
    if (f.type === 'pdf') { iconClass = 'fa-file-pdf'; iconColor = 'text-red-500'; }
    else if (['xlsx', 'xls'].includes(f.type)) { iconClass = 'fa-file-excel'; iconColor = 'text-green-600'; }
    else if (f.type === 'docx' || f.type === 'doc') { iconClass = 'fa-file-word'; iconColor = 'text-blue-600'; }
    else if (f.type === 'csv') { iconClass = 'fa-file-csv'; iconColor = 'text-emerald-600'; }
    else if (['txt', 'md'].includes(f.type)) { iconClass = 'fa-file-lines'; iconColor = 'text-purple-500'; }

    const div = document.createElement('div');
    div.className = 'file-card bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-4 text-sm';
    div.innerHTML = `
                <div class="flex items-center gap-4">
                    <i class="fa-solid ${iconClass} ${iconColor} text-3xl"></i>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium truncate" title="${f.name}">${f.name}</div>
                        <div class="mt-2 inline-flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-1 rounded-2xl text-xs font-medium">
                            <span class="text-emerald-600">${f.chunks}</span>
                            <span class="text-gray-400">切片</span>
                        </div>
                    </div>
                </div>
            `;
    parent.appendChild(div);
}


async function handleFileUpload(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/kb/upload', true);

    xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            document.getElementById('progressBar').style.width = percent + '%';
            document.getElementById('progressText').textContent = percent + '%';
        }
    };

    xhr.onload = function () {
        document.getElementById('uploadProgress').classList.add('hidden');
        document.getElementById('progressBar').style.width = '0%';
        if (xhr.status === 200) {
            const res = JSON.parse(xhr.responseText);
            showToast(res.message);
            loadFiles();
        } else {
            showToast('上传失败，请重试');
        }
    };

    document.getElementById('uploadProgress').classList.remove('hidden');
    xhr.send(formData);
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-3xl shadow-2xl flex items-center gap-3 z-50 text-sm';
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const icon = document.getElementById('sidebarToggleIcon');
    const logoContainer = document.getElementById('fixed-logo');
    sidebarVisible = !sidebarVisible;

    if (sidebarVisible) {
        sidebar.style.width = '256px';
        icon.classList.replace('fa-chevron-right', 'fa-chevron-left');
        logoContainer.classList.add('sidebar-expanded');
    } else {
        sidebar.style.width = '0px';
        icon.classList.replace('fa-chevron-left', 'fa-chevron-right');
        logoContainer.classList.remove('sidebar-expanded');
    }
}

async function toggleCloudMode() {
    useCloud = document.getElementById('cloudToggle').checked;
    await fetch('/kb/set_mode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cloud: useCloud }) });
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-2.5 rounded-3xl shadow-2xl flex items-center gap-3 z-50 text-sm';
    toast.innerHTML = `已切换为 ${useCloud ? '🟦 联网' : '🟩 本地'}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const icon = document.getElementById('themeIcon');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
}

async function sendMessage() {
    const input = document.getElementById('input');
    const question = input.value.trim();
    if (!question) return;
    addMessage(question, true);
    input.value = '';
    const loading = showLoading();
    try {
        const res = await fetch('/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) });
        const data = await res.json();
        loading.remove();
        const botMsg = addMessage(data.answer, false);
        const copyBtn = document.createElement('button');
        copyBtn.className = 'absolute -bottom-1 -right-2 text-xs bg-white dark:bg-gray-700 shadow px-3 py-1 rounded-2xl flex items-center gap-1 hover:text-blue-600';
        copyBtn.innerHTML = `<i class="fa-solid fa-copy"></i>`;
        copyBtn.onclick = () => { navigator.clipboard.writeText(data.answer); copyBtn.innerHTML = `<i class="fa-solid fa-check text-green-500"></i>`; setTimeout(() => copyBtn.remove(), 1200); };
        botMsg.querySelector('div').appendChild(copyBtn);
    } catch (e) {
        loading.remove();
        addMessage("❌ 连接失败", false);
    }
}

function clearChat() {
    if (confirm('确定清空所有对话？')) document.getElementById('chat').innerHTML = '';
}


window.onload = () => {
    tailwindInit();
    const welcome = document.createElement('div');
    welcome.className = 'flex justify-start message';
    welcome.innerHTML = `<div class="bg-gray-100 dark:bg-gray-800 px-5 py-3.5 rounded-3xl max-w-md text-sm">👋 你好！HTML/CSS/JS 已分离，代码更清晰～</div>`;
    document.getElementById('chat').appendChild(welcome);
    loadFiles();
    document.getElementById('fileSearch').addEventListener('input', e => loadFiles(e.target.value));
    document.getElementById('input').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
        document.getElementById('themeIcon').classList.replace('fa-moon', 'fa-sun');
    }
};