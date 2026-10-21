(() => {
  const api = 'https://staging.omoikiri.kz/api/stock-public';
  const $ = (id) => document.getElementById(id);
  let items = [];
  let prices = {};
  let filteredItems = [];
  let shown = 0;
  let loading = false;

  const date = (value) => value ? new Date(value).toLocaleString('ru-RU') : 'нет данных';
  const quantity = (value, more) => value == null ? '—' : `${value.toLocaleString('ru-RU')}${more ? '+' : ''}`;

  function appendMore() {
    if (shown >= filteredItems.length) return;
    const next = filteredItems.slice(shown, shown + 100);
    const rows = next.map(([sku, entry]) => {
      const row = document.createElement('tr');
      for (const value of [sku, entry.name || '', quantity(entry.moscow, entry.moscowMore),
        quantity(entry.spb, entry.spbMore), quantity(entry.total, entry.totalMore),
        prices[sku] ? `${prices[sku].toLocaleString('ru-RU')} ₸` : '—']) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      return row;
    });
    $('rows').append(...rows);
    shown += next.length;
  }

  function render() {
    const query = $('search').value.trim().toLocaleLowerCase('ru');
    const onlyAvailable = $('available').checked;
    filteredItems = items.filter(([sku, entry]) =>
      (!onlyAvailable || entry.total > 0) &&
      (!query || `${sku} ${entry.name || ''}`.toLocaleLowerCase('ru').includes(query)));
    $('count').textContent = `Найдено: ${filteredItems.length}`;
    $('rows').replaceChildren();
    shown = 0;
    appendMore();
  }

  async function loadStock() {
    if (loading) return;
    loading = true;
    $('reload').disabled = true;
    $('summary').textContent = 'Загружаем остатки...';
    $('summary').classList.remove('error');
    try {
      const response = await fetch(api, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось получить остатки.');
      if (!data.ready) {
        items = [];
        prices = {};
        $('summary').textContent = 'Ждём первую выгрузку от сервера.';
      } else {
        items = Object.entries(data.items || {});
        prices = data.catalogPrices || {};
        $('summary').textContent = `${data.articleCount} артикулов · Проверено: ${date(data.fetchedAt)} · Москва: ${date(data.sources?.moscow?.modifiedAt)} · СПб: ${date(data.sources?.spb?.modifiedAt)}`;
        if (Date.now() - Date.parse(data.fetchedAt) > 45 * 60_000) {
          $('summary').textContent += ' · Данные не обновлялись более 45 минут';
          $('summary').classList.add('error');
        }
      }
      render();
    } catch (error) {
      $('summary').textContent = error instanceof TypeError ? 'Не удалось связаться с сервером. Попробуйте позже.' : error.message;
      $('summary').classList.add('error');
    } finally {
      loading = false;
      $('reload').disabled = false;
    }
  }

  $('reload').addEventListener('click', loadStock);
  $('search').addEventListener('input', render);
  $('available').addEventListener('change', render);
  new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) appendMore();
  }, { rootMargin: '400px' }).observe($('loadSentinel'));
  window.setInterval(() => { if (!document.hidden) loadStock(); }, 60_000);
  loadStock();
})();
