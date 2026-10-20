(() => {
  const select = document.getElementById('dealer-city');
  if (!select) return;

  const locations = [...document.querySelectorAll('.dealer-locations .dealer-location-card')];
  const main = document.querySelector('.dealer-info-main');
  const wrap = main?.querySelector('.dealer-info-wrap');
  const title = wrap?.querySelector('.dealer-info-title');
  const control = select.closest('.dealer-city-control');
  const list = wrap?.querySelector('.dealer-locations');
  const actions = wrap?.querySelector('.dealer-info-actions');
  if (main && wrap && title && control && list) {
    const listing = document.createElement('section');
    listing.className = 'dealer-dealers-listing';
    const content = document.createElement('div');
    content.className = 'dealer-dealers-listing-content';
    content.append(title, control, list);
    if (actions) content.append(actions);
    listing.append(content);
    main.append(listing);
  }

  select.addEventListener('change', () => {
    for (const location of locations) {
      const city = location.querySelector('.dealer-location-city')?.textContent.trim();
      location.hidden = select.value !== 'all' && city !== select.value;
    }
  });
})();
