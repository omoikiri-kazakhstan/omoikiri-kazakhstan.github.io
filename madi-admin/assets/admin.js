(function () {
  const api = '/api/admin';
  const $ = (selector) => document.querySelector(selector);
  const loginView = $('#loginView');
  const adminView = $('#adminView');
  const form = $('#productForm');
  const fields = ['itemId', 'name', 'sku', 'slug', 'category', 'price', 'oldPrice', 'imageUrl', 'material', 'colors', 'specifications', 'description', 'isCustom', 'visible'];
  let items = [];

  const format = (value) => value == null || value === '' ? 'Цена не задана' : `${Number(value).toLocaleString('ru-RU')} ₸`;
  async function request(path, options) {
    const response = await fetch(`${api}${path}`, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }, ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Не удалось выполнить действие.');
    return data;
  }
  function resetForm() {
    form.reset(); fields.forEach((name) => { const field = $(`#${name}`); if (field && field.type !== 'checkbox') field.value = ''; });
    $('#visible').checked = true; $('#isCustom').checked = true; $('#editorTitle').textContent = 'Новая позиция'; $('#saveProduct').textContent = 'Добавить позицию'; $('#deleteProduct').hidden = true; $('#formError').textContent = '';
  }
  function setForm(item) {
    fields.forEach((name) => { const field = $(`#${name}`); if (!field) return; field.type === 'checkbox' ? field.checked = item[name] : field.value = item[name] ?? ''; });
    $('#editorTitle').textContent = 'Редактирование позиции'; $('#saveProduct').textContent = 'Сохранить изменения'; $('#deleteProduct').hidden = false; $('#formError').textContent = ''; window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function render() {
    const query = $('#search').value.trim().toLowerCase();
    const filtered = items.filter((item) => `${item.name} ${item.sku} ${item.slug}`.toLowerCase().includes(query));
    $('#itemCount').textContent = String(items.length); $('#emptyState').hidden = filtered.length > 0;
    $('#items').innerHTML = filtered.map((item) => `<article class="item"><div><h3>${escapeHtml(item.name)} ${item.visible ? '' : '<span class="badge hidden">скрыта</span>'}</h3><p>${escapeHtml(item.category)} · ${escapeHtml(item.sku || 'без артикула')} · /${escapeHtml(item.slug)}</p><p class="item-price">${format(item.price)}${item.oldPrice ? ` <s>${format(item.oldPrice)}</s>` : ''}</p></div><button type="button" data-edit="${item.id}">Изменить</button></article>`).join('');
    document.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => setForm(items.find((item) => item.id === Number(button.dataset.edit)))));
  }
  function escapeHtml(value) { const node = document.createElement('span'); node.textContent = String(value); return node.innerHTML; }
  async function loadItems() { const data = await request('/products'); items = data.items; render(); }
  async function showAdmin() {
    loginView.hidden = true;
    loginView.style.setProperty('display', 'none', 'important');
    adminView.hidden = false;
    adminView.style.setProperty('display', 'block', 'important');
    try { await loadItems(); } catch (error) { $('#emptyState').textContent = error.message; }
  }
  $('#showPassword').addEventListener('change', (event) => { $('#password').type = event.target.checked ? 'text' : 'password'; });
  $('#password').addEventListener('invalid', () => { $('#loginError').textContent = 'Введите пароль.'; });
  $('#loginForm').addEventListener('submit', async (event) => { event.preventDefault(); $('#loginError').textContent = ''; try { await request('/login', { method: 'POST', body: JSON.stringify({ login: $('#login').value.trim(), password: $('#password').value }) }); $('#password').value = ''; await showAdmin(); } catch (error) { $('#loginError').textContent = error.message; } });
  form.addEventListener('submit', async (event) => { event.preventDefault(); $('#formError').textContent = ''; const payload = { name: $('#name').value, sku: $('#sku').value, slug: $('#slug').value, category: $('#category').value, price: $('#price').value, oldPrice: $('#oldPrice').value, imageUrl: $('#imageUrl').value, material: $('#material').value, colors: $('#colors').value, specifications: $('#specifications').value, description: $('#description').value, isCustom: $('#isCustom').checked, visible: $('#visible').checked }; const id = Number($('#itemId').value); try { if (id) await request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); else await request('/products', { method: 'POST', body: JSON.stringify(payload) }); await loadItems(); resetForm(); } catch (error) { $('#formError').textContent = error.message; } });
  $('#deleteProduct').addEventListener('click', async () => { const id = Number($('#itemId').value); if (!id || !confirm('Удалить эту позицию без возможности восстановления?')) return; try { await request(`/products/${id}`, { method: 'DELETE' }); await loadItems(); resetForm(); } catch (error) { $('#formError').textContent = error.message; } });
  $('#resetForm').addEventListener('click', resetForm); $('#search').addEventListener('input', render);
  $('#logout').addEventListener('click', async () => { await request('/logout', { method: 'POST' }); adminView.hidden = true; adminView.style.removeProperty('display'); loginView.hidden = false; loginView.style.removeProperty('display'); resetForm(); });
  request('/session').then(({ authenticated }) => authenticated && showAdmin()).catch(() => {});
}());
