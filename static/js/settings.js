/**
 * 设置页面 JavaScript
 * 使用 utils.js 中的工具库
 */

// DOM 元素
const elements = {
    tabs: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    proxyForm: document.getElementById('proxy-form'),
    registrationForm: document.getElementById('registration-settings-form'),
    testProxyBtn: document.getElementById('test-proxy-btn'),
    backupBtn: document.getElementById('backup-btn'),
    cleanupBtn: document.getElementById('cleanup-btn'),
    addEmailServiceBtn: document.getElementById('add-email-service-btn'),
    addServiceModal: document.getElementById('add-service-modal'),
    addServiceForm: document.getElementById('add-service-form'),
    closeServiceModal: document.getElementById('close-service-modal'),
    cancelAddService: document.getElementById('cancel-add-service'),
    serviceType: document.getElementById('service-type'),
    serviceConfigFields: document.getElementById('service-config-fields'),
    emailServicesTable: document.getElementById('email-services-table'),
    // Outlook 导入
    toggleImportBtn: document.getElementById('toggle-import-btn'),
    outlookImportBody: document.getElementById('outlook-import-body'),
    outlookImportBtn: document.getElementById('outlook-import-btn'),
    clearImportBtn: document.getElementById('clear-import-btn'),
    outlookImportData: document.getElementById('outlook-import-data'),
    importResult: document.getElementById('import-result'),
    // 批量操作
    selectAllServices: document.getElementById('select-all-services'),
    // 代理列表
    proxiesTable: document.getElementById('proxies-table'),
    addProxyBtn: document.getElementById('add-proxy-btn'),
    testAllProxiesBtn: document.getElementById('test-all-proxies-btn'),
    addProxyModal: document.getElementById('add-proxy-modal'),
    proxyItemForm: document.getElementById('proxy-item-form'),
    closeProxyModal: document.getElementById('close-proxy-modal'),
    cancelProxyBtn: document.getElementById('cancel-proxy-btn'),
    proxyModalTitle: document.getElementById('proxy-modal-title'),
    // 动态代理设置
    dynamicProxyForm: document.getElementById('dynamic-proxy-form'),
    testDynamicProxyBtn: document.getElementById('test-dynamic-proxy-btn'),
    // CPA 设置
    cpaForm: document.getElementById('cpa-form'),
    testCpaBtn: document.getElementById('test-cpa-btn'),
    // Team Manager 设置
    tmForm: document.getElementById('tm-form'),
    testTmBtn: document.getElementById('test-tm-btn'),
    // 验证码设置
    emailCodeForm: document.getElementById('email-code-form'),
    // Outlook 设置
    outlookSettingsForm: document.getElementById('outlook-settings-form'),
    // Web UI 访问控制
    webuiSettingsForm: document.getElementById('webui-settings-form')
};

// 选中的服务 ID
let selectedServiceIds = new Set();

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadSettings();
    loadEmailServices();
    loadDatabaseInfo();
    loadProxies();
    initEventListeners();
});

// 初始化标签页
function initTabs() {
    elements.tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;

            elements.tabs.forEach(b => b.classList.remove('active'));
            elements.tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${tab}-tab`).classList.add('active');
        });
    });
}

// 事件监听
function initEventListeners() {
    // 代理表单
    if (elements.proxyForm) {
        elements.proxyForm.addEventListener('submit', handleSaveProxy);
    }

    // 测试代理
    if (elements.testProxyBtn) {
        elements.testProxyBtn.addEventListener('click', handleTestProxy);
    }

    // 注册配置表单
    if (elements.registrationForm) {
        elements.registrationForm.addEventListener('submit', handleSaveRegistration);
    }

    // 备份数据库
    if (elements.backupBtn) {
        elements.backupBtn.addEventListener('click', handleBackup);
    }

    // 清理数据
    if (elements.cleanupBtn) {
        elements.cleanupBtn.addEventListener('click', handleCleanup);
    }

    // 添加邮箱服务
    if (elements.addEmailServiceBtn) {
        elements.addEmailServiceBtn.addEventListener('click', () => {
            elements.addServiceModal.classList.add('active');
            loadServiceConfigFields(elements.serviceType.value);
        });
    }

    if (elements.closeServiceModal) {
        elements.closeServiceModal.addEventListener('click', () => {
            elements.addServiceModal.classList.remove('active');
        });
    }

    if (elements.cancelAddService) {
        elements.cancelAddService.addEventListener('click', () => {
            elements.addServiceModal.classList.remove('active');
        });
    }

    if (elements.addServiceModal) {
        elements.addServiceModal.addEventListener('click', (e) => {
            if (e.target === elements.addServiceModal) {
                elements.addServiceModal.classList.remove('active');
            }
        });
    }

    // 服务类型切换
    if (elements.serviceType) {
        elements.serviceType.addEventListener('change', (e) => {
            loadServiceConfigFields(e.target.value);
        });
    }

    // 添加服务表单
    if (elements.addServiceForm) {
        elements.addServiceForm.addEventListener('submit', handleAddService);
    }

    // Outlook 批量导入展开/折叠
    if (elements.toggleImportBtn) {
        elements.toggleImportBtn.addEventListener('click', () => {
            const isHidden = elements.outlookImportBody.style.display === 'none';
            elements.outlookImportBody.style.display = isHidden ? 'block' : 'none';
            elements.toggleImportBtn.textContent = isHidden ? '收起' : '展开';
        });
    }

    // Outlook 批量导入
    if (elements.outlookImportBtn) {
        elements.outlookImportBtn.addEventListener('click', handleOutlookBatchImport);
    }

    // 清空导入数据
    if (elements.clearImportBtn) {
        elements.clearImportBtn.addEventListener('click', () => {
            elements.outlookImportData.value = '';
            elements.importResult.style.display = 'none';
        });
    }

    // 全选/取消全选
    if (elements.selectAllServices) {
        elements.selectAllServices.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.service-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateSelectedServices();
        });
    }

    // 代理列表相关
    if (elements.addProxyBtn) {
        elements.addProxyBtn.addEventListener('click', () => openProxyModal());
    }

    if (elements.testAllProxiesBtn) {
        elements.testAllProxiesBtn.addEventListener('click', handleTestAllProxies);
    }

    if (elements.closeProxyModal) {
        elements.closeProxyModal.addEventListener('click', closeProxyModal);
    }

    if (elements.cancelProxyBtn) {
        elements.cancelProxyBtn.addEventListener('click', closeProxyModal);
    }

    if (elements.addProxyModal) {
        elements.addProxyModal.addEventListener('click', (e) => {
            if (e.target === elements.addProxyModal) {
                closeProxyModal();
            }
        });
    }

    if (elements.proxyItemForm) {
        elements.proxyItemForm.addEventListener('submit', handleSaveProxyItem);
    }

    // 动态代理设置
    if (elements.dynamicProxyForm) {
        elements.dynamicProxyForm.addEventListener('submit', handleSaveDynamicProxy);
    }
    if (elements.testDynamicProxyBtn) {
        elements.testDynamicProxyBtn.addEventListener('click', handleTestDynamicProxy);
    }

    // CPA 设置
    if (elements.cpaForm) {
        elements.cpaForm.addEventListener('submit', handleSaveCpa);
    }

    if (elements.testCpaBtn) {
        elements.testCpaBtn.addEventListener('click', handleTestCpa);
    }

    // 验证码设置
    if (elements.emailCodeForm) {
        elements.emailCodeForm.addEventListener('submit', handleSaveEmailCode);
    }

    // Outlook 设置
    if (elements.outlookSettingsForm) {
        elements.outlookSettingsForm.addEventListener('submit', handleSaveOutlookSettings);
    }

    if (elements.webuiSettingsForm) {
        elements.webuiSettingsForm.addEventListener('submit', handleSaveWebuiSettings);
    }
    // Team Manager 设置
    if (elements.tmForm) {
        elements.tmForm.addEventListener('submit', handleSaveTm);
    }
    if (elements.testTmBtn) {
        elements.testTmBtn.addEventListener('click', handleTestTm);
    }
}

// 加载设置
async function loadSettings() {
    try {
        const data = await api.get('/settings');

        // 代理设置
        document.getElementById('proxy-enabled').checked = data.proxy?.enabled || false;
        document.getElementById('proxy-type').value = data.proxy?.type || 'http';
        document.getElementById('proxy-host').value = data.proxy?.host || '127.0.0.1';
        document.getElementById('proxy-port').value = data.proxy?.port || 7890;
        document.getElementById('proxy-username').value = data.proxy?.username || '';

        // 动态代理设置
        document.getElementById('dynamic-proxy-enabled').checked = data.proxy?.dynamic_enabled || false;
        document.getElementById('dynamic-proxy-api-url').value = data.proxy?.dynamic_api_url || '';
        document.getElementById('dynamic-proxy-api-key-header').value = data.proxy?.dynamic_api_key_header || 'X-API-Key';
        document.getElementById('dynamic-proxy-result-field').value = data.proxy?.dynamic_result_field || '';

        // 注册配置
        document.getElementById('max-retries').value = data.registration?.max_retries || 3;
        document.getElementById('timeout').value = data.registration?.timeout || 120;
        document.getElementById('password-length').value = data.registration?.default_password_length || 12;
        document.getElementById('sleep-min').value = data.registration?.sleep_min || 5;
        document.getElementById('sleep-max').value = data.registration?.sleep_max || 30;

        // 验证码等待配置
        if (data.email_code) {
            document.getElementById('email-code-timeout').value = data.email_code.timeout || 120;
            document.getElementById('email-code-poll-interval').value = data.email_code.poll_interval || 3;
        }

        // 加载 CPA 设置
        loadCpaSettings();
        // 加载 Outlook 设置
        loadOutlookSettings();
        // 加载 Team Manager 设置
        loadTmSettings();

        // Web UI 访问密码提示
        if (data.webui?.has_access_password) {
            const input = document.getElementById('webui-access-password');
            if (input) {
                input.value = '';
                input.placeholder = '已配置，留空保持不变';
            }
        }

    } catch (error) {
        console.error('加载设置失败:', error);
        toast.error('加载设置失败');
    }
}

// 保存 Web UI 设置
async function handleSaveWebuiSettings(e) {
    e.preventDefault();

    const accessPassword = document.getElementById('webui-access-password').value;
    const payload = {
        access_password: accessPassword || null
    };

    try {
        await api.post('/settings/webui', payload);
        toast.success('Web UI 设置已更新');
        document.getElementById('webui-access-password').value = '';
    } catch (error) {
        console.error('保存 Web UI 设置失败:', error);
        toast.error('保存 Web UI 设置失败');
    }
}

// 加载邮箱服务
async function loadEmailServices() {
    // 检查元素是否存在
    if (!elements.emailServicesTable) return;

    try {
        const data = await api.get('/email-services');
        renderEmailServices(data.services);
    } catch (error) {
        console.error('加载邮箱服务失败:', error);
        if (elements.emailServicesTable) {
            elements.emailServicesTable.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="empty-state-icon">❌</div>
                            <div class="empty-state-title">加载失败</div>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

// 渲染邮箱服务
function renderEmailServices(services) {
    // 检查元素是否存在
    if (!elements.emailServicesTable) return;

    if (services.length === 0) {
        elements.emailServicesTable.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-title">暂无配置</div>
                        <div class="empty-state-description">点击上方"添加服务"按钮添加邮箱服务</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    elements.emailServicesTable.innerHTML = services.map(service => `
        <tr data-service-id="${service.id}">
            <td>
                <input type="checkbox" class="service-checkbox" data-id="${service.id}"
                    onchange="updateSelectedServices()">
            </td>
            <td>${escapeHtml(service.name)}</td>
            <td>${getServiceTypeText(service.service_type)}</td>
            <td>
                <span class="status-badge ${service.enabled ? 'active' : 'disabled'}">
                    ${service.enabled ? '已启用' : '已禁用'}
                </span>
            </td>
            <td>${service.priority}</td>
            <td>${format.date(service.last_used)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-ghost btn-sm" onclick="testService(${service.id})" title="测试">
                        🔌
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="toggleService(${service.id}, ${!service.enabled})" title="${service.enabled ? '禁用' : '启用'}">
                        ${service.enabled ? '🔒' : '🔓'}
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="deleteService(${service.id})" title="删除">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 加载数据库信息
async function loadDatabaseInfo() {
    try {
        const data = await api.get('/settings/database');

        document.getElementById('db-size').textContent = `${data.database_size_mb} MB`;
        document.getElementById('db-accounts').textContent = format.number(data.accounts_count);
        document.getElementById('db-services').textContent = format.number(data.email_services_count);
        document.getElementById('db-tasks').textContent = format.number(data.tasks_count);

    } catch (error) {
        console.error('加载数据库信息失败:', error);
    }
}

// 保存代理设置
async function handleSaveProxy(e) {
    e.preventDefault();

    const data = {
        enabled: document.getElementById('proxy-enabled').checked,
        type: document.getElementById('proxy-type').value,
        host: document.getElementById('proxy-host').value,
        port: parseInt(document.getElementById('proxy-port').value),
        username: document.getElementById('proxy-username').value || null,
        password: document.getElementById('proxy-password').value || null,
    };

    try {
        await api.post('/settings/proxy', data);
        toast.success('代理设置已保存');
    } catch (error) {
        toast.error('保存失败: ' + error.message);
    }
}

// 测试代理
async function handleTestProxy() {
    elements.testProxyBtn.disabled = true;
    elements.testProxyBtn.innerHTML = '<span class="loading-spinner"></span> 测试中...';

    try {
        const data = {
            enabled: document.getElementById('proxy-enabled').checked,
            type: document.getElementById('proxy-type').value,
            host: document.getElementById('proxy-host').value,
            port: parseInt(document.getElementById('proxy-port').value),
            username: document.getElementById('proxy-username').value || null,
            password: document.getElementById('proxy-password').value || null,
        };

        const result = await api.post('/settings/proxy/test', data);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    } catch (error) {
        toast.error('测试失败: ' + error.message);
    } finally {
        elements.testProxyBtn.disabled = false;
        elements.testProxyBtn.textContent = '🔌 测试连接';
    }
}

// 保存注册配置
async function handleSaveRegistration(e) {
    e.preventDefault();

    const data = {
        max_retries: parseInt(document.getElementById('max-retries').value),
        timeout: parseInt(document.getElementById('timeout').value),
        default_password_length: parseInt(document.getElementById('password-length').value),
        sleep_min: parseInt(document.getElementById('sleep-min').value),
        sleep_max: parseInt(document.getElementById('sleep-max').value),
    };

    try {
        await api.post('/settings/registration', data);
        toast.success('注册配置已保存');
    } catch (error) {
        toast.error('保存失败: ' + error.message);
    }
}

// 保存验证码等待配置
async function handleSaveEmailCode(e) {
    e.preventDefault();

    const timeout = parseInt(document.getElementById('email-code-timeout').value);
    const pollInterval = parseInt(document.getElementById('email-code-poll-interval').value);

    // 客户端验证
    if (timeout < 30 || timeout > 600) {
        toast.error('等待超时必须在 30-600 秒之间');
        return;
    }
    if (pollInterval < 1 || pollInterval > 30) {
        toast.error('轮询间隔必须在 1-30 秒之间');
        return;
    }

    const data = {
        timeout: timeout,
        poll_interval: pollInterval
    };

    try {
        await api.post('/settings/email-code', data);
        toast.success('验证码配置已保存');
    } catch (error) {
        toast.error('保存失败: ' + error.message);
    }
}

// 备份数据库
async function handleBackup() {
    elements.backupBtn.disabled = true;
    elements.backupBtn.innerHTML = '<span class="loading-spinner"></span> 备份中...';

    try {
        const data = await api.post('/settings/database/backup');
        toast.success(`备份成功: ${data.backup_path}`);
    } catch (error) {
        toast.error('备份失败: ' + error.message);
    } finally {
        elements.backupBtn.disabled = false;
        elements.backupBtn.textContent = '💾 备份数据库';
    }
}

// 清理数据
async function handleCleanup() {
    const confirmed = await confirm('确定要清理过期数据吗？此操作不可恢复。');
    if (!confirmed) return;

    elements.cleanupBtn.disabled = true;
    elements.cleanupBtn.innerHTML = '<span class="loading-spinner"></span> 清理中...';

    try {
        const data = await api.post('/settings/database/cleanup?days=30');
        toast.success(data.message);
        loadDatabaseInfo();
    } catch (error) {
        toast.error('清理失败: ' + error.message);
    } finally {
        elements.cleanupBtn.disabled = false;
        elements.cleanupBtn.textContent = '🧹 清理过期数据';
    }
}

// 加载服务配置字段
async function loadServiceConfigFields(serviceType) {
    try {
        const data = await api.get('/email-services/types');
        const typeInfo = data.types.find(t => t.value === serviceType);

        if (!typeInfo) {
            elements.serviceConfigFields.innerHTML = '';
            return;
        }

        elements.serviceConfigFields.innerHTML = typeInfo.config_fields.map(field => `
            <div class="form-group">
                <label for="config-${field.name}">${field.label}</label>
                <input type="${field.name.includes('password') || field.name.includes('token') ? 'password' : 'text'}"
                       id="config-${field.name}"
                       name="${field.name}"
                       value="${field.default || ''}"
                       placeholder="${field.label}"
                       ${field.required ? 'required' : ''}>
            </div>
        `).join('');

    } catch (error) {
        console.error('加载配置字段失败:', error);
    }
}

// 添加邮箱服务
async function handleAddService(e) {
    e.preventDefault();

    const formData = new FormData(elements.addServiceForm);
    const config = {};

    elements.serviceConfigFields.querySelectorAll('input').forEach(input => {
        config[input.name] = input.value;
    });

    const data = {
        service_type: formData.get('service_type'),
        name: formData.get('name'),
        config: config,
        enabled: true,
        priority: 0,
    };

    try {
        await api.post('/email-services', data);
        toast.success('邮箱服务已添加');
        elements.addServiceModal.classList.remove('active');
        elements.addServiceForm.reset();
        loadEmailServices();
    } catch (error) {
        toast.error('添加失败: ' + error.message);
    }
}

// 测试服务
async function testService(id) {
    try {
        const data = await api.post(`/email-services/${id}/test`);
        if (data.success) {
            toast.success('服务连接正常');
        } else {
            toast.warning('服务连接失败: ' + data.message);
        }
    } catch (error) {
        toast.error('测试失败: ' + error.message);
    }
}

// 切换服务状态
async function toggleService(id, enabled) {
    try {
        const endpoint = enabled ? 'enable' : 'disable';
        await api.post(`/email-services/${id}/${endpoint}`);
        toast.success(enabled ? '服务已启用' : '服务已禁用');
        loadEmailServices();
    } catch (error) {
        toast.error('操作失败: ' + error.message);
    }
}

// 删除服务
async function deleteService(id) {
    const confirmed = await confirm('确定要删除此邮箱服务配置吗？');
    if (!confirmed) return;

    try {
        await api.delete(`/email-services/${id}`);
        toast.success('服务已删除');
        loadEmailServices();
    } catch (error) {
        toast.error('删除失败: ' + error.message);
    }
}

// 更新选中的服务
function updateSelectedServices() {
    selectedServiceIds.clear();
    document.querySelectorAll('.service-checkbox:checked').forEach(cb => {
        selectedServiceIds.add(parseInt(cb.dataset.id));
    });
}

// Outlook 批量导入
async function handleOutlookBatchImport() {
    const data = elements.outlookImportData.value.trim();
    if (!data) {
        toast.warning('请输入要导入的数据');
        return;
    }

    const enabled = document.getElementById('outlook-import-enabled').checked;
    const priority = parseInt(document.getElementById('outlook-import-priority').value) || 0;

    // 解析数据
    const lines = data.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
    const accounts = [];
    const errors = [];

    lines.forEach((line, index) => {
        const parts = line.split('----').map(p => p.trim());
        if (parts.length < 2) {
            errors.push(`第 ${index + 1} 行格式错误`);
            return;
        }

        const account = {
            email: parts[0],
            password: parts[1],
            client_id: parts[2] || null,
            refresh_token: parts[3] || null,
            enabled: enabled,
            priority: priority
        };

        if (!account.email.includes('@')) {
            errors.push(`第 ${index + 1} 行邮箱格式错误: ${account.email}`);
            return;
        }

        accounts.push(account);
    });

    if (errors.length > 0) {
        elements.importResult.style.display = 'block';
        elements.importResult.innerHTML = `
            <div class="import-errors">${errors.map(e => `<div>${e}</div>`).join('')}</div>
        `;
        return;
    }

    elements.outlookImportBtn.disabled = true;
    elements.outlookImportBtn.innerHTML = '<span class="loading-spinner"></span> 导入中...';

    let successCount = 0;
    let failCount = 0;

    try {
        for (const account of accounts) {
            try {
                await api.post('/email-services', {
                    service_type: 'outlook',
                    name: account.email,
                    config: {
                        email: account.email,
                        password: account.password,
                        client_id: account.client_id,
                        refresh_token: account.refresh_token
                    },
                    enabled: account.enabled,
                    priority: account.priority
                });
                successCount++;
            } catch {
                failCount++;
            }
        }

        elements.importResult.style.display = 'block';
        elements.importResult.innerHTML = `
            <div class="import-stats">
                <span>✅ 成功: ${successCount}</span>
                <span>❌ 失败: ${failCount}</span>
            </div>
        `;

        toast.success(`导入完成，成功 ${successCount} 个`);
        loadEmailServices();

    } catch (error) {
        toast.error('导入失败: ' + error.message);
    } finally {
        elements.outlookImportBtn.disabled = false;
        elements.outlookImportBtn.textContent = '📥 开始导入';
    }
}

// HTML 转义
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


// ============================================================================
// 代理列表管理
// ============================================================================

// 加载代理列表
async function loadProxies() {
    try {
        const data = await api.get('/settings/proxies');
        renderProxies(data.proxies);
    } catch (error) {
        console.error('加载代理列表失败:', error);
        elements.proxiesTable.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-state-icon">❌</div>
                        <div class="empty-state-title">加载失败</div>
                    </div>
                </td>
            </tr>
        `;
    }
}

// 渲染代理列表
function renderProxies(proxies) {
    if (!proxies || proxies.length === 0) {
        elements.proxiesTable.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-state-icon">🌐</div>
                        <div class="empty-state-title">暂无代理</div>
                        <div class="empty-state-description">点击"添加代理"按钮添加代理服务器</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    elements.proxiesTable.innerHTML = proxies.map(proxy => `
        <tr data-proxy-id="${proxy.id}">
            <td>${proxy.id}</td>
            <td>${escapeHtml(proxy.name)}</td>
            <td><span class="badge">${proxy.type.toUpperCase()}</span></td>
            <td><code>${escapeHtml(proxy.host)}:${proxy.port}</code></td>
            <td>
                <span class="status-badge ${proxy.enabled ? 'active' : 'disabled'}">
                    ${proxy.enabled ? '已启用' : '已禁用'}
                </span>
            </td>
            <td>${format.date(proxy.last_used)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-ghost btn-sm" onclick="testProxyItem(${proxy.id})" title="测试">
                        🔌
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="editProxyItem(${proxy.id})" title="编辑">
                        ✏️
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="toggleProxyItem(${proxy.id}, ${!proxy.enabled})" title="${proxy.enabled ? '禁用' : '启用'}">
                        ${proxy.enabled ? '🔒' : '🔓'}
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="deleteProxyItem(${proxy.id})" title="删除">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 打开代理模态框
function openProxyModal(proxy = null) {
    elements.proxyModalTitle.textContent = proxy ? '编辑代理' : '添加代理';
    elements.proxyItemForm.reset();

    document.getElementById('proxy-item-id').value = proxy ? proxy.id : '';

    if (proxy) {
        document.getElementById('proxy-item-name').value = proxy.name || '';
        document.getElementById('proxy-item-type').value = proxy.type || 'http';
        document.getElementById('proxy-item-host').value = proxy.host || '';
        document.getElementById('proxy-item-port').value = proxy.port || '';
        document.getElementById('proxy-item-username').value = proxy.username || '';
        document.getElementById('proxy-item-password').value = '';
    }

    elements.addProxyModal.classList.add('active');
}

// 关闭代理模态框
function closeProxyModal() {
    elements.addProxyModal.classList.remove('active');
    elements.proxyItemForm.reset();
}

// 保存代理
async function handleSaveProxyItem(e) {
    e.preventDefault();

    const proxyId = document.getElementById('proxy-item-id').value;
    const data = {
        name: document.getElementById('proxy-item-name').value,
        type: document.getElementById('proxy-item-type').value,
        host: document.getElementById('proxy-item-host').value,
        port: parseInt(document.getElementById('proxy-item-port').value),
        username: document.getElementById('proxy-item-username').value || null,
        password: document.getElementById('proxy-item-password').value || null,
        enabled: true
    };

    try {
        if (proxyId) {
            await api.patch(`/settings/proxies/${proxyId}`, data);
            toast.success('代理已更新');
        } else {
            await api.post('/settings/proxies', data);
            toast.success('代理已添加');
        }
        closeProxyModal();
        loadProxies();
    } catch (error) {
        toast.error('保存失败: ' + error.message);
    }
}

// 编辑代理
async function editProxyItem(id) {
    try {
        const proxy = await api.get(`/settings/proxies/${id}`);
        openProxyModal(proxy);
    } catch (error) {
        toast.error('获取代理信息失败');
    }
}

// 测试单个代理
async function testProxyItem(id) {
    try {
        const result = await api.post(`/settings/proxies/${id}/test`);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    } catch (error) {
        toast.error('测试失败: ' + error.message);
    }
}

// 切换代理状态
async function toggleProxyItem(id, enabled) {
    try {
        const endpoint = enabled ? 'enable' : 'disable';
        await api.post(`/settings/proxies/${id}/${endpoint}`);
        toast.success(enabled ? '代理已启用' : '代理已禁用');
        loadProxies();
    } catch (error) {
        toast.error('操作失败: ' + error.message);
    }
}

// 删除代理
async function deleteProxyItem(id) {
    const confirmed = await confirm('确定要删除此代理吗？');
    if (!confirmed) return;

    try {
        await api.delete(`/settings/proxies/${id}`);
        toast.success('代理已删除');
        loadProxies();
    } catch (error) {
        toast.error('删除失败: ' + error.message);
    }
}

// 测试所有代理
async function handleTestAllProxies() {
    elements.testAllProxiesBtn.disabled = true;
    elements.testAllProxiesBtn.innerHTML = '<span class="loading-spinner"></span> 测试中...';

    try {
        const result = await api.post('/settings/proxies/test-all');
        toast.info(`测试完成: 成功 ${result.success}, 失败 ${result.failed}`);
        loadProxies();
    } catch (error) {
        toast.error('测试失败: ' + error.message);
    } finally {
        elements.testAllProxiesBtn.disabled = false;
        elements.testAllProxiesBtn.textContent = '🔌 测试全部';
    }
}


// ============================================================================
// CPA 设置管理
// ============================================================================

// 加载 CPA 设置
async function loadCpaSettings() {
    try {
        const data = await api.get('/settings/cpa');

        document.getElementById('cpa-enabled').checked = data.enabled || false;
        document.getElementById('cpa-api-url').value = data.api_url || '';
        // 不填充 token，只显示是否有值
        document.getElementById('cpa-api-token').value = '';
        document.getElementById('cpa-api-token').placeholder = data.has_token ? '已配置，留空保持不变' : '请输入 API Token';

    } catch (error) {
        console.error('加载 CPA 设置失败:', error);
    }
}

// 保存 CPA 设置
async function handleSaveCpa(e) {
    e.preventDefault();

    const data = {
        enabled: document.getElementById('cpa-enabled').checked,
        api_url: document.getElementById('cpa-api-url').value,
        api_token: document.getElementById('cpa-api-token').value || ''
    };

    try {
        await api.post('/settings/cpa', data);
        toast.success('CPA 设置已保存');
        loadCpaSettings();
    } catch (error) {
        toast.error('保存失败: ' + error.message);
    }
}

// ============================================================================
// Outlook 设置管理
// ============================================================================

// 加载 Outlook 设置
async function loadOutlookSettings() {
    try {
        const data = await api.get('/settings/outlook');
        const el = document.getElementById('outlook-default-client-id');
        if (el) el.value = data.default_client_id || '';
    } catch (error) {
        console.error('加载 Outlook 设置失败:', error);
    }
}

// 保存 Outlook 设置
async function handleSaveOutlookSettings(e) {
    e.preventDefault();
    const data = {
        default_client_id: document.getElementById('outlook-default-client-id').value
    };
    try {
        await api.post('/settings/outlook', data);
        toast.success('Outlook 设置已保存');
    } catch (error) {
        toast.error('保存失败: ' + error.message);
    }
}

// 测试 CPA 连接
async function handleTestCpa() {
    const apiUrl = document.getElementById('cpa-api-url').value;
    const apiToken = document.getElementById('cpa-api-token').value;

    if (!apiUrl) {
        toast.warning('请输入 API URL');
        return;
    }

    // 如果 token 为空，尝试使用已保存的 token 进行测试
    if (!apiToken) {
        const cpaSettings = await api.get('/settings/cpa');
        if (!cpaSettings.has_token) {
            toast.warning('请输入 API Token');
            return;
        }
    }

    elements.testCpaBtn.disabled = true;
    elements.testCpaBtn.innerHTML = '<span class="loading-spinner"></span> 测试中...';

    try {
        const result = await api.post('/settings/cpa/test', {
            api_url: apiUrl,
            api_token: apiToken || 'use_saved_token'
        });

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    } catch (error) {
        toast.error('测试失败: ' + error.message);
    } finally {
        elements.testCpaBtn.disabled = false;
        elements.testCpaBtn.textContent = '🔌 测试连接';
    }
}

// ============== 动态代理设置 ==============

async function handleSaveDynamicProxy(e) {
    e.preventDefault();
    const data = {
        enabled: document.getElementById('dynamic-proxy-enabled').checked,
        api_url: document.getElementById('dynamic-proxy-api-url').value.trim(),
        api_key: document.getElementById('dynamic-proxy-api-key').value || null,
        api_key_header: document.getElementById('dynamic-proxy-api-key-header').value.trim() || 'X-API-Key',
        result_field: document.getElementById('dynamic-proxy-result-field').value.trim()
    };
    try {
        await api.post('/settings/proxy/dynamic', data);
        toast.success('动态代理设置已保存');
        document.getElementById('dynamic-proxy-api-key').value = '';
    } catch (error) {
        toast.error('保存失败: ' + error.message);
    }
}

async function handleTestDynamicProxy() {
    const apiUrl = document.getElementById('dynamic-proxy-api-url').value.trim();
    if (!apiUrl) {
        toast.warning('请先填写动态代理 API 地址');
        return;
    }
    const btn = elements.testDynamicProxyBtn;
    btn.disabled = true;
    btn.textContent = '测试中...';
    try {
        const result = await api.post('/settings/proxy/dynamic/test', {
            api_url: apiUrl,
            api_key: document.getElementById('dynamic-proxy-api-key').value || null,
            api_key_header: document.getElementById('dynamic-proxy-api-key-header').value.trim() || 'X-API-Key',
            result_field: document.getElementById('dynamic-proxy-result-field').value.trim()
        });
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    } catch (error) {
        toast.error('测试失败: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '🔌 测试动态代理';
    }
}

// ============== Team Manager 设置 ==============

async function loadTmSettings() {
    try {
        const data = await api.get('/settings/team-manager');
        document.getElementById('tm-enabled').checked = data.enabled || false;
        document.getElementById('tm-api-url').value = data.api_url || '';
        document.getElementById('tm-api-key').value = '';
        document.getElementById('tm-api-key').placeholder = data.has_api_key ? '已配置，留空保持不变' : '请输入 API Key';
    } catch (error) {
        console.error('加载 Team Manager 设置失败:', error);
    }
}

async function handleSaveTm(e) {
    e.preventDefault();
    const data = {
        enabled: document.getElementById('tm-enabled').checked,
        api_url: document.getElementById('tm-api-url').value,
        api_key: document.getElementById('tm-api-key').value || ''
    };
    try {
        await api.post('/settings/team-manager', data);
        toast.success('Team Manager 设置已保存');
        loadTmSettings();
    } catch (error) {
        toast.error('保存失败: ' + error.message);
    }
}

async function handleTestTm() {
    const apiUrl = document.getElementById('tm-api-url').value;
    const apiKey = document.getElementById('tm-api-key').value;

    if (!apiUrl) {
        toast.error('请先填写 API URL');
        return;
    }

    let keyToTest = apiKey;
    if (!keyToTest) {
        const saved = await api.get('/settings/team-manager');
        if (!saved.has_api_key) {
            toast.error('请先填写 API Key');
            return;
        }
        keyToTest = 'use_saved_key';
    }

    elements.testTmBtn.disabled = true;
    elements.testTmBtn.innerHTML = '<span class="loading-spinner"></span> 测试中...';

    try {
        const result = await api.post('/settings/team-manager/test', {
            api_url: apiUrl,
            api_key: keyToTest
        });
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    } catch (error) {
        toast.error('测试失败: ' + error.message);
    } finally {
        elements.testTmBtn.disabled = false;
        elements.testTmBtn.textContent = '🔌 测试连接';
    }
}
