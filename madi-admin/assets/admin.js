(function () {
  const api = '/api/admin';
  const $ = (selector) => document.querySelector(selector);
  const loginView = $('#loginView');
  const adminView = $('#adminView');
  const form = $('#productForm');
  const fields = ['itemId', 'name', 'sku', 'slug', 'category', 'price', 'oldPrice', 'imageUrl', 'material', 'colors', 'specifications', 'description', 'isCustom', 'visible'];
  const SPEC_TEMPLATES = {
    sinks: ['Монтаж', 'Форма', 'Ширина', 'Глубина', 'Количество чаш'],
    bathsinks: ['Монтаж', 'Форма', 'Ширина', 'Глубина', 'Высота'],
    taps: ['Тип управления', 'Высота излива', 'Длина излива', 'Отверстия для монтажа', 'Подключение'],
    filters: ['Максимальное давление воды', 'Скорость фильтрации', 'Точность очистки', 'Срок службы', 'Количество ступеней'],
    disposers: ['Мощность', 'Объем камеры', 'Скорость вращения', 'Уровень шума', 'Тип загрузки'],
    dispenser: ['Объем колбы', 'Монтаж', 'Высота', 'Длина излива'],
    acs: ['Материал', 'Размер', 'Совместимость'],
    'omoikiri-home': ['Материал', 'Размер', 'Комплектация']
  };
  let items = [];
  let fullCatalog = [];
  let catalogOverrides = new Map();
  const CATEGORY_LABELS = { sinks: 'Мойки', bathsinks: 'Раковины для ванной', taps: 'Смесители', filters: 'Фильтры', disposers: 'Измельчители', dispenser: 'Дозаторы', acs: 'Аксессуары', 'omoikiri-home': 'OMOIKIRI Home' };

  const format = (value) => value == null || value === '' ? 'Цена не задана' : `${Number(value).toLocaleString('ru-RU')} ₸`;
  function activateView(view) {
    document.querySelectorAll('[data-view-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.viewPanel === view));
    document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'fullCatalog') loadFullCatalog();
  }
  function parseSpecifications(value) {
    return String(value || '').split('\n').reduce((result, line) => {
      const [label, ...rest] = line.split(':');
      if (label && rest.length) result[label.trim()] = rest.join(':').trim();
      return result;
    }, {});
  }
  function renderSpecificationFields() {
    const current = parseSpecifications($('#specifications').value);
    const labels = SPEC_TEMPLATES[$('#category').value] || [];
    $('#specificationFields').innerHTML = labels.map((label) => `<label>${label}<input data-specification="${label}" maxlength="160" value="${escapeHtml(current[label] || '')}"></label>`).join('');
  }
  function collectSpecifications() {
    $('#specifications').value = Array.from(document.querySelectorAll('[data-specification]')).map((input) => `${input.dataset.specification}: ${input.value.trim()}`).filter((line) => !line.endsWith(':')).join('\n');
  }
  async function request(path, options) {
    const response = await fetch(`${api}${path}`, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }, ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Не удалось выполнить действие.');
    return data;
  }
  function resetForm() {
    form.reset(); fields.forEach((name) => { const field = $(`#${name}`); if (field && field.type !== 'checkbox') field.value = ''; });
    $('#visible').checked = true; $('#isCustom').checked = true; renderSpecificationFields(); $('#editorTitle').textContent = 'Новая позиция'; $('#saveProduct').textContent = 'Добавить позицию'; $('#deleteProduct').hidden = true; $('#formError').textContent = '';
  }
  function setForm(item) {
    fields.forEach((name) => { const field = $(`#${name}`); if (!field) return; field.type === 'checkbox' ? field.checked = item[name] : field.value = item[name] ?? ''; });
    renderSpecificationFields(); $('#editorTitle').textContent = 'Редактирование позиции'; $('#saveProduct').textContent = 'Сохранить изменения'; $('#deleteProduct').hidden = false; $('#formError').textContent = ''; activateView('editor');
  }
  function render() {
    const query = $('#search').value.trim().toLowerCase();
    const filtered = items.filter((item) => `${item.name} ${item.sku} ${item.slug}`.toLowerCase().includes(query));
    const visible = items.filter((item) => item.visible).length;
    $('#itemCount').textContent = String(items.length); $('#navCount').textContent = String(items.length); $('#metricTotal').textContent = String(items.length); $('#metricVisible').textContent = String(visible); $('#metricHidden').textContent = String(items.length - visible); $('#emptyState').hidden = filtered.length > 0;
    $('#items').innerHTML = filtered.map((item) => `<article class="item"><div><h3>${escapeHtml(item.name)} ${item.visible ? '' : '<span class="badge hidden">скрыта</span>'}</h3><p>${escapeHtml(item.category)} · ${escapeHtml(item.sku || 'без артикула')} · /${escapeHtml(item.slug)}</p><p class="item-price">${format(item.price)}${item.oldPrice ? ` <s>${format(item.oldPrice)}</s>` : ''}</p></div><button type="button" data-edit="${item.id}">Изменить</button></article>`).join('');
    document.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => setForm(items.find((item) => item.id === Number(button.dataset.edit)))));
  }
  function currentOverride(slug) {
    return catalogOverrides.get(slug) || { slug, visible: true, hiddenColors: [] };
  }
  function renderFullCatalog() {
    const query = $('#fullCatalogSearch').value.trim().toLowerCase();
    const category = $('#fullCatalogCategory').value;
    const filtered = fullCatalog.filter((item) => (!category || item.category === category) && `${item.name} ${item.sku} ${item.slug}`.toLowerCase().includes(query));
    $('#fullCatalogCount').textContent = String(fullCatalog.length);
    $('#fullCatalogCountLabel').textContent = String(filtered.length);
    $('#fullCatalogEmpty').hidden = filtered.length > 0;
    $('#fullCatalogItems').innerHTML = filtered.map((item) => {
      const override = currentOverride(item.slug);
      const hiddenColors = new Set(override.hiddenColors || []);
      const colors = item.colors.length ? item.colors.map((color) => `<button class="color-toggle${hiddenColors.has(color) ? ' is-hidden' : ''}" type="button" data-color-slug="${escapeHtml(item.slug)}" data-color="${escapeHtml(color)}">${escapeHtml(color.toUpperCase())}</button>`).join('') : '<span class="full-catalog-meta">Без вариантов цвета</span>';
      return `<article class="full-catalog-item${override.visible ? '' : ' is-hidden'}"><div><h3>${escapeHtml(item.name)}</h3><p class="full-catalog-meta">${escapeHtml(CATEGORY_LABELS[item.category] || item.category)} · ${escapeHtml(item.sku || 'без артикула')} · /${escapeHtml(item.slug)}</p><div class="color-management">${colors}</div></div><div class="full-catalog-actions"><p class="full-catalog-status${override.visible ? '' : ' hidden'}">${override.visible ? 'Показывается на сайте' : 'Скрыта с сайта'}</p><button class="${override.visible ? 'danger' : 'restore'}" type="button" data-product-slug="${escapeHtml(item.slug)}" data-visible="${override.visible ? '0' : '1'}">${override.visible ? 'Скрыть позицию' : 'Вернуть позицию'}</button></div></article>`;
    }).join('');
    document.querySelectorAll('[data-product-slug]').forEach((button) => button.addEventListener('click', async () => {
      const visible = button.dataset.visible === '1';
      if (!visible && !confirm('Скрыть позицию с сайта? Её можно будет вернуть позже.')) return;
      await saveCatalogOverride(button.dataset.productSlug, { visible });
    }));
    document.querySelectorAll('[data-color-slug]').forEach((button) => button.addEventListener('click', async () => {
      const override = currentOverride(button.dataset.colorSlug);
      const colors = new Set(override.hiddenColors || []);
      colors.has(button.dataset.color) ? colors.delete(button.dataset.color) : colors.add(button.dataset.color);
      await saveCatalogOverride(button.dataset.colorSlug, { hiddenColors: [...colors] });
    }));
  }
  async function saveCatalogOverride(slug, changes) {
    const previous = currentOverride(slug);
    const next = { ...previous, ...changes, slug };
    try {
      const data = await request(`/catalog-overrides/${encodeURIComponent(slug)}`, { method: 'PUT', body: JSON.stringify(next) });
      catalogOverrides.set(slug, data.override);
      renderFullCatalog();
    } catch (error) {
      alert(error.message);
    }
  }
  async function loadFullCatalog() {
    if (!fullCatalog.length) {
      try {
        const [catalogResponse, overridesResponse] = await Promise.all([
          fetch('/assets/data/admin-full-catalog.json?v=20260917-01').then((response) => response.ok ? response.json() : Promise.reject(new Error('Не удалось загрузить каталог.'))),
          request('/catalog-overrides')
        ]);
        fullCatalog = catalogResponse;
        catalogOverrides = new Map(overridesResponse.overrides.map((item) => [item.slug, item]));
      } catch (error) {
        $('#fullCatalogEmpty').textContent = error.message;
        $('#fullCatalogEmpty').hidden = false;
        return;
      }
    }
    renderFullCatalog();
  }
  function escapeHtml(value) { const node = document.createElement('span'); node.textContent = String(value); return node.innerHTML; }
  async function loadItems() { const data = await request('/products'); items = data.items; render(); }
  async function showAdmin() {
    loginView.hidden = true;
    loginView.style.setProperty('display', 'none', 'important');
    adminView.hidden = false;
    adminView.style.setProperty('display', 'block', 'important');
    activateView('overview');
    try { await loadItems(); } catch (error) { $('#emptyState').textContent = error.message; }
  }
  $('#showPassword').addEventListener('change', (event) => { $('#password').type = event.target.checked ? 'text' : 'password'; });
  $('#password').addEventListener('invalid', () => { $('#loginError').textContent = 'Введите пароль.'; });
  $('#loginForm').addEventListener('submit', async (event) => { event.preventDefault(); $('#loginError').textContent = ''; try { await request('/login', { method: 'POST', body: JSON.stringify({ login: $('#login').value.trim(), password: $('#password').value }) }); $('#password').value = ''; await showAdmin(); } catch (error) { $('#loginError').textContent = error.message; } });
  form.addEventListener('submit', async (event) => { event.preventDefault(); $('#formError').textContent = ''; collectSpecifications(); const payload = { name: $('#name').value, sku: $('#sku').value, slug: $('#slug').value, category: $('#category').value, price: $('#price').value, oldPrice: $('#oldPrice').value, imageUrl: $('#imageUrl').value, material: $('#material').value, colors: $('#colors').value, specifications: $('#specifications').value, description: $('#description').value, isCustom: $('#isCustom').checked, visible: $('#visible').checked }; const id = Number($('#itemId').value); try { if (id) await request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); else await request('/products', { method: 'POST', body: JSON.stringify(payload) }); await loadItems(); resetForm(); activateView('catalog'); } catch (error) { $('#formError').textContent = error.message; } });
  $('#deleteProduct').addEventListener('click', async () => { const id = Number($('#itemId').value); if (!id || !confirm('Удалить эту позицию без возможности восстановления?')) return; try { await request(`/products/${id}`, { method: 'DELETE' }); await loadItems(); resetForm(); } catch (error) { $('#formError').textContent = error.message; } });
  $('#resetForm').addEventListener('click', resetForm); $('#search').addEventListener('input', render); $('#category').addEventListener('change', renderSpecificationFields); $('#fullCatalogSearch').addEventListener('input', renderFullCatalog); $('#fullCatalogCategory').addEventListener('change', renderFullCatalog); document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => activateView(button.dataset.view))); document.querySelectorAll('[data-open-view]').forEach((button) => button.addEventListener('click', () => activateView(button.dataset.openView))); renderSpecificationFields();
  $('#logout').addEventListener('click', async () => { await request('/logout', { method: 'POST' }); adminView.hidden = true; adminView.style.removeProperty('display'); loginView.hidden = false; loginView.style.removeProperty('display'); resetForm(); });
  request('/session').then(({ authenticated }) => authenticated && showAdmin()).catch(() => {});
}());
