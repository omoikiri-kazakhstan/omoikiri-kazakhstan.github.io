(function () {
  const apiUrl = '/api/catalog';
  const pathParts = window.location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  const category = pathParts[0] || '';
  const isFirstCategoryPage = pathParts.length === 1;
  const productSlug = category === 'product' ? pathParts[1] : '';
  const categories = new Set(['sinks', 'bathsinks', 'taps', 'filters', 'disposers', 'dispenser', 'acs', 'omoikiri-home']);
  const escapeHtml = (value) => { const node = document.createElement('span'); node.textContent = value || ''; return node.innerHTML; };
  const formatPrice = (value) => value == null ? '' : `${Number(value).toLocaleString('ru-RU')} ₸`;
  const slugFromHref = (href) => (href || '').match(/\/product\/([^/?#]+)/)?.[1] || '';
  function addCustomCard(item) {
    const list = document.querySelector('.products');
    if (!list || list.querySelector(`[data-admin-item="${CSS.escape(item.slug)}"]`)) return;
    const card = document.createElement('li');
    card.className = 'product type-product';
    card.dataset.adminItem = item.slug;
    card.innerHTML = `<a class="woocommerce-LoopProduct-link" href="/admin-product/?product=${encodeURIComponent(item.slug)}"><img loading="lazy" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}"><h2 class="woocommerce-loop-product__title">${escapeHtml(item.name)}</h2><span class="price">${item.oldPrice ? `<del>${formatPrice(item.oldPrice)}</del> ` : ''}<ins>${formatPrice(item.price)}</ins></span></a>`;
    list.prepend(card);
  }
  function applyProductOverrides(overrides) {
    if (!productSlug) return;
    const override = overrides.find((item) => item.slug === productSlug);
    if (!override) return;
    if (!override.visible) {
      window.location.replace('/');
      return;
    }
    const hiddenColors = new Set(override.hiddenColors || []);
    if (!hiddenColors.size) return;
    document.querySelectorAll('[data-value], option[value]').forEach((element) => {
      const color = element.getAttribute('data-value') || element.getAttribute('value');
      if (!hiddenColors.has(color)) return;
      element.hidden = true;
      element.setAttribute('aria-hidden', 'true');
      if (element.tagName === 'OPTION') element.disabled = true;
    });
    const selected = new URLSearchParams(window.location.search).get('attribute_pa_color');
    if (!hiddenColors.has(selected)) return;
    const next = [...document.querySelectorAll('select[name="attribute_pa_color"] option:not([disabled])')]
      .map((option) => option.value).find(Boolean);
    if (next) {
      const url = new URL(window.location.href);
      url.searchParams.set('attribute_pa_color', next);
      window.location.replace(url);
    }
  }
  fetch(apiUrl, { credentials: 'same-origin' }).then((response) => response.ok ? response.json() : null).then((data) => {
    const items = data?.items || [];
    const overrides = data?.overrides || [];
    const hidden = new Set([
      ...items.filter((item) => !item.visible && !item.isCustom).map((item) => item.slug),
      ...overrides.filter((item) => !item.visible).map((item) => item.slug)
    ]);
    applyProductOverrides(overrides);
    const hiddenProduct = items.find((item) => !item.visible && !item.isCustom && item.slug === productSlug);
    if (hiddenProduct) {
      window.location.replace(`/${hiddenProduct.category}/`);
      return;
    }
    if (hidden.size) document.querySelectorAll('li.product').forEach((card) => {
      const slug = slugFromHref(card.querySelector('a[href*="/product/"]')?.getAttribute('href'));
      if (hidden.has(slug)) card.remove();
    });
    if (isFirstCategoryPage && categories.has(category)) items.filter((item) => item.isCustom && item.visible && item.category === category).forEach(addCustomCard);
  }).catch(() => {});
}());
