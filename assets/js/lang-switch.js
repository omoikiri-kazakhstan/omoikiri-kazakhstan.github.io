(function () {
  if (window.__omoikiriLangSwitchLoaded) return;
  window.__omoikiriLangSwitchLoaded = true;

  const STORE_KEY = 'omoikiriDealerLang';
  const ROOT = document.currentScript?.dataset.root || '';
  const elementStore = new Map();
  const textStore = [];
  let textStoreReady = false;
  let searchIndexPromise = null;

  const exactMap = {
    'Мойки': 'Мойкалар',
    'Раковины для ванной': 'Жуынатын бөлме раковиналары',
    'Смесители': 'Араластырғыштар',
    'Фильтры': 'Сүзгілер',
    'Измельчители': 'Ұсақтағыштар',
    'Дозаторы': 'Дозаторлар',
    'Аксессуары': 'Аксессуарлар',
    'OMOIKIRI Home': 'OMOIKIRI Home',
    'О компании': 'Компания туралы',
    'Сервис': 'Сервис',
    'Где купить': 'Қайдан сатып алуға болады',
    'где купить?': 'қайдан сатып алуға болады?',
    'Контакты': 'Байланыс',
    'Главная страница': 'Басты бет',
    'Главная': 'Басты бет',
    'Поиск товаров': 'Тауар іздеу',
    'Поиск товаров...': 'Тауар іздеу...',
    'В корзину': 'Себетке',
    'Добавить в корзину': 'Себетке қосу',
    'Добавлено в корзину': 'Себетке қосылды',
    'Добавлено': 'Қосылды',
    'В избранное': 'Таңдаулыға',
    'в избранное': 'таңдаулыға',
    'Очистить': 'Тазарту',
    'По выбранным фильтрам товары не найдены': 'Таңдалған сүзгілер бойынша тауар табылмады',
    'Каталог': 'Каталог',
    'каталог': 'каталог',
    'прайс': 'баға парағы',
    'подробнее': 'толығырақ',
    'Выберите цвет': 'Түсті таңдаңыз',
    'Цвет': 'Түс',
    'Материал': 'Материал',
    'Цена': 'Баға',
    'Форма': 'Пішін',
    'Размер': 'Өлшем',
    'Архивы Мойки': 'Мойкалар',
    'Архивы Смесители': 'Араластырғыштар',
    'Архивы Фильтры': 'Сүзгілер',
    'Архивы Измельчители': 'Ұсақтағыштар',
    'Архивы Дозаторы': 'Дозаторлар',
    'Архивы Аксессуары': 'Аксессуарлар',
    'Раковины': 'Раковиналар',
    'Taps': 'Араластырғыштар',
    'Sinks': 'Мойкалар',
    'filters': 'сүзгілер',
    'Disposer': 'Ұсақтағыш',
    'accessories': 'аксессуарлар',
    'home': 'үйге арналған',
    'ЯРКОСТЬ, ЭМОЦИИ И\u00a0ВКУС ЖИЗНИ': 'ЖАРҚЫНДЫҚ, ЭМОЦИЯ ЖӘНЕ ӨМІР ДӘМІ',
    'ИЗМЕЛЬЧИТЕЛЬ ПИЩЕВЫХ ОТХОДОВ - ЗАБОТА ОБ ОКРУЖАЮЩЕМ МИРЕ': 'ТАҒАМ ҚАЛДЫҚТАРЫН ҰСАҚТАҒЫШ - ҚОРШАҒАН ОРТАҒА ҚАМҚОРЛЫҚ'
  };

  const placeholderMap = {
    'Поиск товаров...': 'Тауар іздеу...',
    'Поиск товаров': 'Тауар іздеу'
  };

  const selectorHtml = [
    ['.text1', 'NATCERAMIC мойкалар коллекциясы табиғи материалдарды, сәнді әрі ерекше заттарды бағалайтындар үшін арнайы әзірленген. NATCERAMIC - саз, минералдар және бояғыш пигмент қоспасынан тұратын табиғи материал.<br>Осы мойкалар жасалатын табиғи минералдар жоғары гигиеналық және экологиялық қасиеттерге ие. Материалдың басты артықшылықтары - ұзақ қызмет етуі, беріктігі, ыңғайлылығы және жеңіл күтім.'],
    ['.text3', 'OMOIKIRI KINARU PRO дизайнерлік жұмыс станциясы - функционалдық пен ұсақ детальдар ертеңгі күн сапасының стандарттарын айқындайтын орын.'],
    ['.text2', 'Тот баспайтын болаттан жасалған мойкалар ұзақ жылдар бойы тартымды сыртқы көрінісін сақтайды, стилі жағынан әмбебап және кез келген интерьерге үйлеседі.'],
    ['.text4', 'Асүй кеңістігі жаңа бейнеге ие болады, ал оны түсіндірудің кілті - түс. Color Collection сәнді палитрасы асүйге жаңаша қарауға мүмкіндік береді.'],
    ['#id1_text p', 'Кері осмос жүйесі, мембрана, минерализатор және 5 литрлік жинақтаушы багы бар жоғары деңгейлі су тазартқыш.'],
    ['#id2_text p', 'Суды терең тазартуға арналған ағынды су тазартқыш: механикалық қоспалардан және қақ түзілуінен толық қорғайды.'],
    ['#id3_text p', 'Жапондық жартылай талшықты мембранасы бар ағынды су тазартқыш суды терең тазартады.'],
    ['.disp_text', 'Ұсақтағышты пайдалану асүй жинау уақытын қысқартады және тағам қалдықтарының полигонға түсуін азайтып, қоршаған ортаны қорғауға үлес қосады.'],
    ['.aces_text', 'OMOIKIRI аксессуарлары мойка аймағын толықтырып, оған жеке стиль береді және кеңістікті функционалды пайдалануды кеңейтеді.'],
    ['.h_text', 'OMOIKIRI HOME бөлімінде интерьеріңіздің даралығын айқындайтын үйге арналған тауарлар орналастырылған.'],
    ['.title7', 'ЖАРҚЫНДЫҚ, ЭМОЦИЯ ЖӘНЕ ӨМІР ДӘМІ'],
    ['.disp_title', 'ТАҒАМ ҚАЛДЫҚТАРЫН ҰСАҚТАҒЫШ - ҚОРШАҒАН ОРТАҒА ҚАМҚОРЛЫҚ']
  ];

  function addStyle() {
    if (document.getElementById('dealer-kz-layer-style-global')) return;

    const style = document.createElement('style');
    style.id = 'dealer-kz-layer-style-global';
    style.textContent = `
      @font-face {
        font-family: "GothamProRegular";
        src: url("/assets/fonts/GothamProRegular.woff") format("woff");
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: "GothamProLight";
        src: url("/assets/fonts/GothamProLight.woff") format("woff");
        font-weight: 300;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: "GothamProMedium";
        src: url("/assets/fonts/GothamProMedium.woff") format("woff");
        font-weight: 500;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: "GothamProBold";
        src: url("/assets/fonts/GothamProBold.woff") format("woff");
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }

      body,
      .top_nav,
      .top_nav a,
      .top_nav span,
      .menu,
      .menu a,
      #menu-top_menu a,
      #menu-top_menu-1 a,
      .mob_menu a {
        font-family: "GothamProRegular", Arial, Helvetica, sans-serif !important;
        letter-spacing: 0 !important;
      }

      .menu a,
      #menu-top_menu a,
      #menu-top_menu-1 a {
        letter-spacing: .075em !important;
      }

      .top_nav a,
      .top_nav span,
      .top_nav p {
        font-size: 15px !important;
        line-height: 1.1 !important;
      }

      .top_nav > span > a[href^="tel:"],
      .top_nav a[href^="tel:87077832888"] {
        font-family: "GothamProBold", "GothamProMedium", Arial, Helvetica, sans-serif !important;
        font-weight: 700 !important;
        letter-spacing: 0 !important;
      }

      @media (min-width: 781px) {
        .top_nav {
          height: 67px !important;
          min-height: 67px !important;
          padding: 20px 50px !important;
          box-sizing: border-box !important;
          align-items: center !important;
        }

        #menu-top_menu.menu,
        #menu-top_menu-1.menu {
          top: 67px !important;
          width: 100% !important;
          min-height: 48px !important;
          padding: 15px 0 !important;
          box-sizing: border-box !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 30px !important;
        }
      }

      #menu-top_menu a,
      #menu-top_menu-1 a {
        font-size: 15px !important;
        line-height: 1.15 !important;
      }

      .woocommerce-loop-product__title,
      ul.products li.product .woocommerce-loop-product__title,
      .products .product .woocommerce-loop-product__title {
        font-family: "GothamProLight", Arial, Helvetica, sans-serif !important;
        font-size: 24px !important;
        font-weight: 500 !important;
        line-height: 22px !important;
        letter-spacing: 0 !important;
        text-transform: uppercase !important;
      }

      .prdctfltr_widget_title,
      .prdctfltr_checkboxes span,
      .dealer-local-clear-filters {
        font-family: "GothamProRegular", Arial, Helvetica, sans-serif !important;
        letter-spacing: 0 !important;
      }

      #search {
        display: inline-block !important;
        flex: 0 0 30px;
        width: 29px !important;
        height: 29px !important;
        background: #222 !important;
        transform: translateY(0) !important;
        vertical-align: middle !important;
        -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.55' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='10.5' cy='10.5' r='6.8'/%3E%3Cpath d='M15.45 15.45 21 21'/%3E%3C/svg%3E") no-repeat center / contain !important;
        mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.55' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='10.5' cy='10.5' r='6.8'/%3E%3Cpath d='M15.45 15.45 21 21'/%3E%3C/svg%3E") no-repeat center / contain !important;
      }

      #search:hover {
        background: #c9001a !important;
      }

      .side_menu,
      .mob_cont a[href*="disk.yandex.ru"] {
        display: none !important;
      }

      .dealer-local-cart-tab {
        position: fixed !important;
        z-index: 100000 !important;
        right: 177px !important;
        top: 14px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 38px !important;
        height: 38px !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        color: #111 !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }

      .dealer-local-cart-tab svg {
        width: 30px !important;
        height: 30px !important;
        display: block !important;
        stroke: currentColor !important;
        stroke-width: 2.05 !important;
        transform: translateY(0) !important;
      }

      .dealer-local-cart-count {
        position: absolute;
        right: -1px;
        bottom: 0;
        min-width: 15px;
        height: 15px;
        padding: 0 4px;
        border-radius: 999px;
        background: #111;
        color: #fff;
        font: 700 10px/15px Arial, Helvetica, sans-serif;
        text-align: center;
      }

      .dealer-local-cart-count[data-count-zero] {
        display: none;
      }

      .dealer-lang-switch {
        position: fixed;
        z-index: 100001;
        right: 248px;
        top: 24px;
        display: inline-flex;
        align-items: center;
        gap: 0;
        height: 28px;
        padding: 2px;
        border: 1px solid rgba(0, 0, 0, .16);
        border-radius: 999px;
        background: rgba(255, 255, 255, .86);
        backdrop-filter: blur(12px);
        box-shadow: 0 10px 24px rgba(0, 0, 0, .10);
        font-family: "GothamProBold", Arial, Helvetica, sans-serif;
        line-height: 1;
      }

      .dealer-lang-switch button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        height: 24px;
        padding: 0 9px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: #111;
        font-family: inherit;
        font-size: 12px;
        font-weight: 700;
        line-height: 1;
        letter-spacing: 0;
        text-align: center;
        cursor: pointer;
        appearance: none;
      }

      .dealer-lang-switch button.active {
        background: #111;
        color: #fff;
      }

      .favorites-link {
        position: relative !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 38px !important;
        height: 38px !important;
        overflow: visible !important;
        transform: translateY(0) !important;
        vertical-align: middle !important;
      }

      #favorites-count,
      .favorites-count,
      [data-favorites-count] {
        position: absolute !important;
        right: -8px !important;
        bottom: 1px !important;
        z-index: 3 !important;
        display: none;
        min-width: 10px;
        color: #111 !important;
        background: transparent !important;
        font-family: "GothamProRegular", Arial, Helvetica, sans-serif !important;
        font-size: 11px !important;
        font-weight: 400 !important;
        line-height: 1 !important;
        text-align: left !important;
        letter-spacing: 0 !important;
        pointer-events: none !important;
      }

      #favorites-count:not(:empty):not([data-count-zero]),
      .favorites-count:not(:empty):not([data-count-zero]),
      [data-favorites-count]:not(:empty):not([data-count-zero]) {
        display: block !important;
      }

      .dealer-kz-note {
        position: fixed;
        z-index: 100000;
        right: 18px;
        top: 130px;
        max-width: 286px;
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(17, 17, 17, .84);
        color: #fff;
        font: 12px/1.35 Arial, Helvetica, sans-serif;
        opacity: 0;
        transform: translateY(-6px);
        pointer-events: none;
        transition: .25s ease;
      }

      .dealer-kz-note.show {
        opacity: 1;
        transform: translateY(0);
      }

      @media (max-width: 780px) {
        .dealer-lang-switch {
          top: 72px;
          right: 12px;
          transform: none;
        }

        .dealer-kz-note {
          top: 116px;
          right: 12px;
          left: 12px;
          max-width: none;
        }
      }

      @media (max-width: 900px) {
        .dealer-local-cart-tab {
          display: inline-flex !important;
          top: auto !important;
          right: 16px !important;
          bottom: 18px !important;
          width: 48px !important;
          height: 48px !important;
          border: 1px solid rgba(0, 0, 0, .14) !important;
          border-radius: 999px !important;
          background: rgba(255, 255, 255, .94) !important;
          box-shadow: 0 12px 30px rgba(0, 0, 0, .16) !important;
          backdrop-filter: blur(10px) !important;
        }

        .dealer-local-cart-tab svg {
          width: 24px !important;
          height: 24px !important;
        }
      }

      @media print {
        .dealer-lang-switch,
        .dealer-kz-note {
          display: none !important;
        }
      }

      body.fancybox-active .dealer-lang-switch,
      body.fancybox-active .dealer-kz-note,
      body.fancybox-active .dealer-local-cart-tab,
      body.fancybox-active .favorites-icon-wrapper,
      body.fancybox-active #search,
      body.fancybox-active .search_line,
      body.dealer-lightbox-open .dealer-lang-switch,
      body.dealer-lightbox-open .dealer-kz-note,
      body.dealer-lightbox-open .dealer-local-cart-tab,
      body.dealer-lightbox-open .favorites-icon-wrapper,
      body.dealer-lightbox-open #search,
      body.dealer-lightbox-open .search_line {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      body .fancybox-container {
        z-index: 300000 !important;
      }

      body .fancybox-is-open .fancybox-bg,
      body .fancybox-is-open .fancybox-stage,
      body .fancybox-is-open .fancybox-toolbar,
      body .fancybox-is-open .fancybox-navigation {
        z-index: 300001 !important;
      }

      body .pswp {
        z-index: 300000 !important;
      }

      body .pswp.pswp--open,
      body .pswp[aria-hidden="false"] {
        z-index: 300001 !important;
      }

      .dgwt-wcas-search-submit {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 40px !important;
        height: 40px !important;
        min-width: 40px !important;
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
        color: #111 !important;
        box-shadow: none !important;
      }

      .dgwt-wcas-search-submit svg,
      .dgwt-wcas-search-submit img {
        display: none !important;
      }

      .dgwt-wcas-search-submit::before {
        content: "" !important;
        display: block !important;
        width: 18px !important;
        height: 18px !important;
        background: currentColor !important;
        -webkit-mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10.8 4a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6Zm0 2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm5.1 9.5 4.1 4.1-1.4 1.4-4.1-4.1 1.4-1.4Z'/%3E%3C/svg%3E") no-repeat center / contain;
        mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10.8 4a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6Zm0 2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm5.1 9.5 4.1 4.1-1.4 1.4-4.1-4.1 1.4-1.4Z'/%3E%3C/svg%3E") no-repeat center / contain;
      }

      body.dealer-search-open .dealer-lang-switch,
      body.dealer-search-open .dealer-local-cart-tab,
      body.dealer-search-open .favorites-icon-wrapper,
      body.dealer-search-open #search {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      body.dealer-search-open .search_line {
        z-index: 100002 !important;
        width: calc(100% - 150px) !important;
        margin-left: 100px !important;
      }

      body.dealer-search-open .search_line .dgwt-wcas-search-wrapp,
      body.dealer-search-open .search_line .dgwt-wcas-search-form,
      body.dealer-search-open .search_line .dgwt-wcas-sf-wrapp {
        width: 100% !important;
        max-width: none !important;
        box-sizing: border-box !important;
      }

      body.dealer-search-open .search_line .dgwt-wcas-sf-wrapp {
        display: flex !important;
        align-items: center !important;
        gap: 0 !important;
        background: transparent !important;
        padding: 0 !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      body.dealer-search-open .search_line .dgwt-wcas-search-input {
        flex: 1 1 auto !important;
        width: 100% !important;
        height: 44px !important;
        border: 0 !important;
        border-bottom: 1px solid #111 !important;
        border-radius: 0 !important;
        outline: 0 !important;
        box-shadow: none !important;
        background: transparent !important;
      }

      body.dealer-search-open .search_line .dgwt-wcas-search-submit {
        display: none !important;
        flex: 0 0 0 !important;
        width: 0 !important;
        min-width: 0 !important;
        height: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }

      body.dealer-search-open .search_line .dgwt-wcas-search-submit::before {
        display: none !important;
        content: none !important;
      }

      .dealer-search-suggestions {
        position: fixed;
        left: 100px;
        right: 100px;
        top: 67px;
        z-index: 100001;
        display: none;
        max-height: min(420px, calc(100vh - 86px));
        overflow: auto;
        border-radius: 0 0 4px 4px;
        background: #fff;
        box-shadow: 0 14px 34px rgba(0, 0, 0, .12);
        font-family: "GothamProRegular", Arial, Helvetica, sans-serif;
      }

      .dealer-search-suggestions.show,
      body.dealer-search-open .dealer-search-suggestions.show {
        display: block;
      }

      .dealer-search-suggestion {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 66px;
        padding: 8px 20px;
        border-bottom: 1px solid #ededed;
        color: #222;
        text-decoration: none;
        box-sizing: border-box;
      }

      .dealer-search-suggestion:hover,
      .dealer-search-suggestion:focus {
        background: #f7f7f7;
        color: #222;
        outline: none;
      }

      .dealer-search-suggestion img {
        width: 48px;
        height: 48px;
        flex: 0 0 48px;
        object-fit: contain;
        border: 1px solid #e5e5e5;
        border-radius: 3px;
        background: #fff;
      }

      .dealer-search-suggestion-title {
        font-family: "GothamProBold", Arial, Helvetica, sans-serif;
        font-size: 15px;
        font-weight: 700;
        line-height: 1.2;
      }

      .dealer-search-suggestion-title mark {
        background: transparent;
        color: inherit;
        font: inherit;
      }

      .dealer-search-suggestion-meta {
        margin-left: 4px;
        color: #444;
        font-size: 13px;
        line-height: 1.2;
      }

      .dealer-search-empty {
        padding: 18px 20px;
        color: #555;
        font-size: 14px;
      }

      body.dealer-info-page .search_line {
        position: fixed !important;
        top: 0 !important;
        left: 100px !important;
        right: 100px !important;
        z-index: 100002 !important;
        height: 67px !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        opacity: 0;
        transform: translateY(-8px);
        transition: opacity .2s ease, transform .2s ease;
      }

      body.dealer-info-page .search_line.show {
        opacity: 1;
        transform: translateY(0);
      }

      body.dealer-info-page .search_line .dgwt-wcas-search-wrapp,
      body.dealer-info-page .search_line .dgwt-wcas-search-form,
      body.dealer-info-page .search_line .dgwt-wcas-sf-wrapp {
        width: 100% !important;
        height: 100% !important;
      }

      body.dealer-info-page .search_line .dgwt-wcas-sf-wrapp {
        display: flex !important;
        align-items: center !important;
        background: transparent !important;
      }

      body.dealer-info-page .search_line .dgwt-wcas-search-input {
        width: 100% !important;
        height: 44px !important;
        border: 0 !important;
        border-bottom: 1px solid #111 !important;
        outline: 0 !important;
        background: transparent !important;
        font: 400 16px/1.2 "GothamProRegular", Arial, Helvetica, sans-serif !important;
      }

      body.dealer-info-page .search_line .dgwt-wcas-search-submit {
        display: none !important;
      }

      body.dealer-info-page .mob_menu {
        position: fixed !important;
        top: 0 !important;
        left: -100% !important;
        z-index: 100003 !important;
        width: min(360px, 86vw) !important;
        height: 100dvh !important;
        padding: 82px 24px 32px !important;
        overflow: auto !important;
        background: #fff !important;
        box-sizing: border-box !important;
        transition: left .25s ease !important;
        box-shadow: 18px 0 34px rgba(0, 0, 0, .14) !important;
      }

      body.dealer-info-page .mob_menu.active {
        left: 0 !important;
      }

      body.dealer-info-page .mob_menu ul {
        margin: 0 !important;
        padding: 0 !important;
        list-style: none !important;
      }

      body.dealer-info-page .mob_menu li {
        margin: 0 !important;
        padding: 0 !important;
        border-bottom: 1px solid rgba(0, 0, 0, .08) !important;
      }

      body.dealer-info-page .mob_menu a {
        display: block !important;
        padding: 14px 0 !important;
        color: #202020 !important;
        text-decoration: none !important;
        font: 400 15px/1.25 "GothamProRegular", Arial, Helvetica, sans-serif !important;
        letter-spacing: .04em !important;
      }

      .dealer-info-footer {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 28px;
        padding: 34px 50px 38px;
        background: #050505;
        color: #fff;
      }

      .dealer-info-footer h2 {
        margin: 0 0 8px;
        color: #fff;
        font: 700 15px/1.25 "GothamProBold", Arial, Helvetica, sans-serif;
        text-transform: uppercase;
      }

      .dealer-info-footer p,
      .dealer-info-footer a {
        margin: 0;
        color: #fff;
        font: 400 13px/1.45 "GothamProRegular", Arial, Helvetica, sans-serif;
        text-decoration: none;
      }

      @media (max-width: 800px) {
        body.dealer-search-open .search_line {
          width: calc(100% - 85px) !important;
          margin-left: 65px !important;
        }

        .dealer-search-suggestions {
          left: 65px;
          right: 20px;
          top: 57px;
        }

        body.dealer-info-page .search_line {
          left: 65px !important;
          right: 20px !important;
          height: 57px !important;
        }

        .dealer-info-footer {
          grid-template-columns: 1fr;
          padding: 28px 24px 32px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function saveElement(el) {
    if (!elementStore.has(el)) elementStore.set(el, el.innerHTML);
  }

  function setHtml(selector, html) {
    document.querySelectorAll(selector).forEach((el) => {
      saveElement(el);
      el.innerHTML = html;
    });
  }

  function textNodes() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('script, style, noscript, textarea, svg, .dealer-lang-switch, .dealer-kz-note')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  function rememberTextNodes() {
    if (textStoreReady) return;
    textNodes().forEach((node) => textStore.push([node, node.nodeValue]));
    textStoreReady = true;
  }

  function replaceExactText() {
    textNodes().forEach((node) => {
      const value = node.nodeValue;
      const key = value.replace(/\s+/g, ' ').trim();
      if (!key || !exactMap[key]) return;
      const leading = value.match(/^\s*/)[0];
      const trailing = value.match(/\s*$/)[0];
      node.nodeValue = leading + exactMap[key] + trailing;
    });

    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((input) => {
      const original = input.dataset.originalPlaceholder || input.getAttribute('placeholder') || '';
      input.dataset.originalPlaceholder = original;
      input.setAttribute('placeholder', placeholderMap[original] || original);
    });
  }

  function restoreRu() {
    elementStore.forEach((html, el) => {
      if (el && el.isConnected) el.innerHTML = html;
    });
    textStore.forEach(([node, value]) => {
      if (node && node.isConnected) node.nodeValue = value;
    });
    document.querySelectorAll('input[data-original-placeholder], textarea[data-original-placeholder]').forEach((input) => {
      input.setAttribute('placeholder', input.dataset.originalPlaceholder);
    });
    document.documentElement.lang = 'ru';
    document.querySelectorAll('.dealer-lang-switch button').forEach((button) => {
      button.classList.toggle('active', button.dataset.lang === 'ru');
    });
    localStorage.setItem(STORE_KEY, 'ru');
  }

  function applyKz(showNote) {
    rememberTextNodes();
    selectorHtml.forEach(([selector, html]) => setHtml(selector, html));
    replaceExactText();
    document.documentElement.lang = 'kk';
    document.querySelectorAll('.dealer-lang-switch button').forEach((button) => {
      button.classList.toggle('active', button.dataset.lang === 'kz');
    });
    localStorage.setItem(STORE_KEY, 'kz');

    if (showNote) {
      const note = document.querySelector('.dealer-kz-note');
      if (note) {
        note.classList.add('show');
        window.setTimeout(() => note.classList.remove('show'), 2600);
      }
    }
  }

  function createSwitcher() {
    if (!document.querySelector('.dealer-lang-switch')) {
      const switcher = document.createElement('div');
      switcher.className = 'dealer-lang-switch';
      switcher.innerHTML = '<button type="button" data-lang="ru" class="active">RU</button><button type="button" data-lang="kz">KZ</button>';
      document.body.appendChild(switcher);
    }

    if (!document.querySelector('.dealer-kz-note')) {
      const note = document.createElement('div');
      note.className = 'dealer-kz-note';
      note.textContent = 'KZ-қабат қосылды: негізгі мәтіндер қазақшаға ауысты.';
      document.body.appendChild(note);
    }

    document.addEventListener('click', (event) => {
      const button = event.target.closest('.dealer-lang-switch button');
      if (!button) return;
      if (button.dataset.lang === 'kz') applyKz(true);
      else restoreRu();
    });
  }

  function addCartLink() {
    if (document.querySelector('.dealer-local-cart-tab')) return;

    const link = document.createElement('a');
    link.className = 'dealer-local-cart-tab';
    link.href = ROOT + 'cart.html';
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', 'Cart');
    link.title = 'Cart';
    link.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3.5 5h2.1l1.8 10.2a2 2 0 0 0 2 1.65h7.35a2 2 0 0 0 1.94-1.5L20.2 8H7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 20.15h.01M17 20.15h.01" stroke="currentColor" stroke-width="3.1" stroke-linecap="round"/></svg><span class="dealer-local-cart-count" data-cart-count data-count-zero>0</span>';
    document.body.appendChild(link);
  }

  function readJsonList(key) {
    try {
      const value = window.localStorage?.getItem(key) || '[]';
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function updateDealerHeaderCounts() {
    const favoritesCount = readJsonList('omoikiri:favorites').length;
    document.querySelectorAll('#favorites-count, .favorites-count, [data-favorites-count]').forEach((node) => {
      node.textContent = String(favoritesCount);
      node.toggleAttribute('data-count-zero', favoritesCount === 0);
    });

    const cartCount = readJsonList('omoikiriCart').reduce((sum, item) => sum + (Number(item?.qty) || 0), 0);
    document.querySelectorAll('#cart-count, .cart-count, [data-cart-count]').forEach((node) => {
      node.textContent = String(cartCount);
      node.toggleAttribute('data-count-zero', cartCount === 0);
    });
  }

  function loadSearchIndex() {
    if (window.OMOIKIRI_SEARCH_INDEX) return Promise.resolve(window.OMOIKIRI_SEARCH_INDEX);
    if (searchIndexPromise) return searchIndexPromise;

    searchIndexPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-dealer-search-index]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.OMOIKIRI_SEARCH_INDEX || []), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = ROOT + 'assets/js/search-index.js?v=20260711-01';
      script.async = true;
      script.dataset.dealerSearchIndex = '1';
      script.onload = () => resolve(window.OMOIKIRI_SEARCH_INDEX || []);
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return searchIndexPromise;
  }

  function normalizeSearch(value) {
    return String(value || '').toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  }

  function productHref(item) {
    try {
      return new URL(ROOT + item.url, window.location.href).href;
    } catch {
      return ROOT + item.url;
    }
  }

  function renderHighlight(title, query) {
    const lower = normalizeSearch(title);
    const needle = normalizeSearch(query);
    const index = lower.indexOf(needle);
    if (index < 0 || !needle) return title;
    return title.slice(0, index) + '<mark>' + title.slice(index, index + needle.length) + '</mark>' + title.slice(index + needle.length);
  }

  function createSuggestionsBox() {
    let box = document.querySelector('.dealer-search-suggestions');
    if (!box) {
      box = document.createElement('div');
      box.className = 'dealer-search-suggestions';
      box.setAttribute('role', 'listbox');
      document.body.appendChild(box);
    }
    return box;
  }

  function searchMatches(index, query) {
    const q = normalizeSearch(query);
    if (q.length < 2) return [];

    return index
      .map((item) => {
        const title = normalizeSearch(item.title);
        const sku = normalizeSearch(item.sku);
        const skus = (item.skus || []).map(normalizeSearch);
        const category = normalizeSearch(item.category);
        let score = 99;
        if (title === q) score = 0;
        else if (title.startsWith(q)) score = 1;
        else if (sku.startsWith(q) || skus.some((value) => value.startsWith(q))) score = 2;
        else if (title.includes(q)) score = 3;
        else if (sku.includes(q) || skus.some((value) => value.includes(q))) score = 4;
        else if (category.includes(q)) score = 5;
        return { item, score };
      })
      .filter((entry) => entry.score < 99)
      .sort((a, b) => a.score - b.score || a.item.title.localeCompare(b.item.title, 'ru', { sensitivity: 'base', numeric: true }))
      .slice(0, 24)
      .map((entry) => entry.item);
  }

  function renderSuggestions(items, query) {
    const box = createSuggestionsBox();
    if (!query || normalizeSearch(query).length < 2) {
      box.classList.remove('show');
      box.innerHTML = '';
      return;
    }

    if (!items.length) {
      box.innerHTML = '<div class="dealer-search-empty">Ничего не найдено</div>';
      box.classList.add('show');
      return;
    }

    box.innerHTML = items.map((item) => {
      const skus = [item.sku].concat(item.skus || []).filter(Boolean);
      const sku = skus[0] ? ' (SKU: ' + skus[0] + ')' : '';
      return '<a class="dealer-search-suggestion" role="option" href="' + productHref(item) + '">' +
        '<img src="' + item.image + '" alt="">' +
        '<span>' +
          '<span class="dealer-search-suggestion-title">' + renderHighlight(item.title, query) + '</span>' +
          '<span class="dealer-search-suggestion-meta">' + sku + '</span>' +
        '</span>' +
      '</a>';
    }).join('');
    box.classList.add('show');
  }

  function bindLocalSearchSuggestions() {
    const input = document.querySelector('.dgwt-wcas-search-input');
    const form = document.querySelector('.dgwt-wcas-search-form');
    if (!input || input.dataset.dealerLocalSearchBound === '1') return;
    input.dataset.dealerLocalSearchBound = '1';

    const update = () => {
      const query = input.value;
      loadSearchIndex()
        .then((index) => renderSuggestions(searchMatches(index, query), query))
        .catch(() => renderSuggestions([], query));
    };

    input.addEventListener('input', update);
    input.addEventListener('focus', update);
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      const first = document.querySelector('.dealer-search-suggestion');
      if (!first) return;
      event.preventDefault();
      window.location.href = first.href;
    });

    if (form) {
      form.addEventListener('submit', (event) => {
        const first = document.querySelector('.dealer-search-suggestion');
        if (!first) return;
        event.preventDefault();
        window.location.href = first.href;
      });
    }

    document.addEventListener('click', (event) => {
      const box = document.querySelector('.dealer-search-suggestions');
      if (!box) return;
      if (event.target.closest('.search_line, #search, .dealer-search-suggestions')) return;
      box.classList.remove('show');
    }, true);
  }

  function bindSearchState() {
    const sync = () => {
      const searchLine = document.querySelector('.search_line');
      document.body.classList.toggle('dealer-search-open', Boolean(searchLine?.classList.contains('show')));
    };

    sync();

    const searchLine = document.querySelector('.search_line');
    if (searchLine) {
      new MutationObserver(sync).observe(searchLine, {
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }

    document.addEventListener('click', () => window.setTimeout(sync, 0), true);
    document.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') window.setTimeout(sync, 0);
    }, true);
  }

  function bindLightboxState() {
    const sync = () => {
      const pswp = document.querySelector('.pswp');
      const open = Boolean(pswp && (
        pswp.classList.contains('pswp--open') ||
        pswp.getAttribute('aria-hidden') === 'false' ||
        getComputedStyle(pswp).display !== 'none'
      ));
      document.body.classList.toggle('dealer-lightbox-open', open);
    };

    sync();

    const pswp = document.querySelector('.pswp');
    if (pswp) {
      new MutationObserver(sync).observe(pswp, {
        attributes: true,
        attributeFilter: ['class', 'style', 'aria-hidden']
      });
    }

    document.addEventListener('click', () => window.setTimeout(sync, 50), true);
    document.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') window.setTimeout(sync, 50);
    }, true);
  }

  function ensureInfoSearch() {
    if (!document.body.classList.contains('dealer-info-page')) return;
    if (document.querySelector('.search_line')) return;

    const line = document.createElement('div');
    line.className = 'search_line';
    line.style.display = 'none';
    line.innerHTML = [
      '<div class="dgwt-wcas-search-wrapp dgwt-wcas-has-submit woocommerce dgwt-wcas-style-pirx js-dgwt-wcas-layout-classic dgwt-wcas-layout-classic">',
        '<form class="dgwt-wcas-search-form" role="search" action="' + ROOT + 'index.html" method="get">',
          '<div class="dgwt-wcas-sf-wrapp">',
            '<label class="screen-reader-text" for="dealer-info-search-input">Поиск товаров</label>',
            '<input id="dealer-info-search-input" type="search" class="dgwt-wcas-search-input" name="s" value="" placeholder="Поиск товаров..." autocomplete="off">',
            '<button type="submit" class="dgwt-wcas-search-submit" aria-label="Поиск"></button>',
          '</div>',
        '</form>',
      '</div>'
    ].join('');

    const nav = document.querySelector('.top_nav');
    document.body.insertBefore(line, nav || document.body.firstChild);
  }

  function bindSearchToggle() {
    const button = document.getElementById('search');
    const line = document.querySelector('.search_line');
    const input = document.querySelector('.dgwt-wcas-search-input');
    if (!button || !line || button.dataset.dealerSearchToggleBound === '1') return;

    button.dataset.dealerSearchToggleBound = '1';

    const close = () => {
      line.classList.remove('show');
      document.body.classList.remove('dealer-search-open');
      window.setTimeout(() => {
        if (!line.classList.contains('show')) line.style.display = 'none';
      }, 220);
    };

    const open = () => {
      line.style.display = 'block';
      line.classList.add('show');
      document.body.classList.add('dealer-search-open');
      window.setTimeout(() => input?.focus(), 0);
    };

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      line.classList.contains('show') ? close() : open();
    });

    document.addEventListener('click', (event) => {
      if (!line.classList.contains('show')) return;
      if (event.target.closest('.search_line, #search, .dealer-search-suggestions')) return;
      close();
    }, true);

    document.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') close();
    }, true);
  }

  function ensureInfoMobileMenu() {
    if (!document.body.classList.contains('dealer-info-page')) return;

    let menu = document.querySelector('.mob_menu');
    if (!menu) {
      const desktopMenu = document.querySelector('.menu-top_menu-container');
      menu = document.createElement('div');
      menu.className = 'mob_menu';
      menu.innerHTML = '<div class="mob_menu_cont">' + (desktopMenu ? desktopMenu.outerHTML : '') + '</div>';
      document.body.appendChild(menu);
    }

    const hamb = document.getElementById('hamb');
    if (!hamb || hamb.dataset.dealerMobileMenuBound === '1') return;

    hamb.dataset.dealerMobileMenuBound = '1';

    const close = () => {
      hamb.classList.remove('open');
      menu.classList.remove('active');
      menu.style.left = '-100%';
      document.body.classList.remove('overflow-hidden');
    };

    const open = () => {
      hamb.classList.add('open');
      menu.classList.add('active');
      menu.style.left = '0%';
      document.body.classList.add('overflow-hidden');
    };

    hamb.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      menu.classList.contains('active') ? close() : open();
    });

    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) close();
    });

    document.addEventListener('click', (event) => {
      if (!menu.classList.contains('active')) return;
      if (menu.contains(event.target) || hamb.contains(event.target)) return;
      close();
    }, true);

    document.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') close();
    }, true);
  }

  function ensureInfoFooter() {
    if (!document.body.classList.contains('dealer-info-page')) return;
    if (document.querySelector('.dealer-info-footer')) return;

    const footer = document.createElement('footer');
    footer.className = 'dealer-info-footer';
    footer.innerHTML = [
      '<section><h2>АСТАНА</h2><p>улица Акмешит, 19/1</p><p>тел.: <a href="tel:87010688828">8 (701) 068-88-28</a></p></section>',
      '<section><h2>АЛМАТЫ</h2><p>ТЦ Жибек Жолы, проспект Жибек Жолы, 135</p><p>тел.: <a href="tel:87076206888">8 (707) 620-68-88</a></p></section>',
      '<section><h2>АЛМАТЫ</h2><p>улица Турар Рыскулов, 3</p><p>тел.: <a href="tel:87077832888">8 (707) 783-28-88</a></p></section>',
      '<section><h2>КАРАГАНДА</h2><p>Букетова 3/2, ЖК Атамура</p><p>тел.: <a href="tel:87004685588">8 (700) 468-55-88</a></p></section>'
    ].join('');
    document.body.appendChild(footer);
  }

  function init() {
    addStyle();
    ensureInfoSearch();
    ensureInfoMobileMenu();
    ensureInfoFooter();
    createSwitcher();
    addCartLink();
    updateDealerHeaderCounts();
    bindSearchToggle();
    bindSearchState();
    bindLightboxState();
    bindLocalSearchSuggestions();
    window.addEventListener('storage', updateDealerHeaderCounts);
    window.setTimeout(updateDealerHeaderCounts, 250);
    window.setTimeout(updateDealerHeaderCounts, 1200);
    if (localStorage.getItem(STORE_KEY) === 'kz') {
      window.setTimeout(() => applyKz(false), 0);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
