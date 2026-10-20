
(function () {
    function initManufacturing() {
        const section = document.querySelector('.about_mnf');
        if (!section) return;

        const countryButtons = section.querySelectorAll('.mnf_countries > span');
        const textBody = section.querySelector('.mnf_description');
        if (!textBody) return;

        const countries = {
            'Италия': {
                image: '/assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/img/about/italy.jpg',
                text: [
                    'Производство итальянских линеек Omoikiri сосредоточено на трех независимых заводах в Италии, каждый из которых обладает уникальными компетенциями и поставляет продукцию в Россию на эксклюзивных правах специально для нашего бренда. Первое предприятие — признанный мировой лидер в изготовлении гранитных моек методом горячего литья, с которым бренд сотрудничает с 2014 года, выпуская изделия из высокотехнологичных материалов Tetogranit и Artceramic. Этот кластер площадью более 100 000 м2 объединяет два автоматизированных завода с текущей мощностью 1,2 млн изделий в год и собственный Центр инноваций. Второй производственный комплекс в регионе Лацио площадью 80 000 м2 отвечает за выпуск большей части моделей из материала Natceramic, выпуская более 240 000 изделий в год на стыке промышленной автоматизации и ручной финишной обработки. Третьей площадкой стал роботизированный завод-партнер в Лацио площадью 30 000 м2, выпускающий новые модели моек Omishima. Проектная мощность этого предприятия ориентирована не на массовый конвейер, а на выпуск десятков тысяч премиальных изделий в год с безупречным контролем геометрии для идеального подстольного монтажа. Все производственные процессы данной площадки сертифицированы по строгим экологическим стандартам ЕС и протоколам ESG с использованием полностью перерабатываемых экоматериалов.'
                ],
                videoId: 'video_italy'
            },
            'Китай': {
                image: '/assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/img/about/china.jpg',
                text: 'Производство кухонных смесителей, дозаторов для жидкого мыла, измельчителей пищевых отходов и моек Omoikiri из нержавеющей стали сосредоточено на базе крупнейших специализированных предприятий-партнеров в КНР. На всех этих площадках действует единый стратегический стандарт: вся выпускаемая продукция для рынков РФ и СНГ производится на эксклюзивных правах специально для бренда Omoikiri. Направление смесителей для кухни базируется на мощностях масштабного автоматизированного комплекса площадью более 50 000 м2 с проектной мощностью до 2 млн. изделий в год, где каждый прибор проходит многоступенчатый гидравлический контроль на герметичность. Изготовление моек из нержавеющей стали сосредоточено на передовом предприятии-партнере, занимающем территорию в 37 000 м2 и специализирующемся на высокоточном прессовании и роботизированной сварке для достижения идеальной геометрии швов. Выпуск экологичных измельчителей пищевых отходов Omoikiri осуществляется на высокотехнологичной автоматизированной площадке мощностью более 560 000 приборов в год. Эти ключевые промышленные гиганты сертифицированы по международным стандартам качества ISO 9001 и экологического менеджмента ISO 14001, что позволяет полностью исключить человеческий фактор и гарантировать абсолютную долговечность готовой продукции.',
                videoId: 'video_china'
            },
            'Турция': {
                image: '/assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/img/about/turkey.jpg',
                text: 'Цельнотянутые мойки из 304-ой нержавеющей стали Omoikiri производятся на современном высокотехнологичном предприятии в Турции на заводе партнера. Мощности этого промышленного комплекса площадью 28 000 м2 запущены в 2006 году и выпускают более 2 млн единиц продукции в год. Завод располагает собственным прессовочным, формовочным и полировочным производством, ориентированным на глубокую автоматизацию процессов металлообработки и строго контролируемый внутренний рынок ЕС. Техники-конструкторы Omoikiri принимают непосредственное участие в совместном проектировании и разработке эксклюзивного модельного ряда по собственным стандартам. Бренд активно инвестирует в модернизацию производственных мощностей партнера. Высокие экологические и эксплуатационные стандарты предприятия подтверждены международным сертификатом менеджмента качества ISO 9001 и сертификатом TSE, гарантирующим жесткие требования к качеству стальных сплавов. В Россию продукция поставляется на эксклюзивных правах исключительно для бренда Omoikiri, что позволяет предлагать российским покупателям уникальный ассортимент и обеспечивает безупречный контроль поставок.',
                videoId: 'video_turkey'
            },
            'Россия': {
                image: '/assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/img/about/russia.jpg',
                text: 'Производство российских линеек Omoikiri развернуто на базе мощностей двух ведущих профильных предприятий-партнеров, обеспечивающих выпуск водоочистителей и кухонных моек из инновационного материала Artgranit. Направление композитного литья базируется на роботизированном комплексе в Московской области, чья проектная мощность позволяет выпускать до 1 млн. изделий в год, общая площадь только складской и логистической инфраструктуры превышает 15 000 м2. Здесь продукция изготавливается по индивидуальной технологической карте бренда: мойки имеют измененный состав и эксклюзивную палитру цветов, что отличает их от существующих аналогов. В свою очередь, комплекс по производству водоочистителей расположен в Санкт-Петербурге и занимает площадь более 10 000 м2.  Завод выпускает миллионы сменных модулей и систем в год и использует роботизированные линии, полностью исключающие человеческий фактор. Фирменные системы очистки создаются с учетом химических особенностей российской водопроводной воды, обеспечивая максимальную безопасность. Локализация мощностей внутри страны позволяет бренду оперативно реагировать на запросы рынка, внедрять новейшие разработки без логистических задержек и гарантировать стабильность характеристик. ',
                videoId: 'video_russia'
            },
            'Япония': {
                image: '/assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/img/about/japan.jpg',
                text: [
                    'В текущих геополитических реалиях прямые поставки готовой продукции из Японии на российский рынок приостановлены. В связи с этим все передовые технологии, регламенты и внутренние стандарты Omoikiri были перенесены на высокотехнологичные заводы-партнеры в дружественных странах, где организован строгий многоступенчатый аудит каждой партии. При этом бренд сохраняет верность своим истокам: поддерживаются рабочие контакты с японскими коллегами, а для международных обращений и сотрудничества действует официальный адрес электронной почты: info@omoikiri.com. В настоящее время поставки незначительной части ассортимента осуществляются посредством параллельного импорта, что влечет за собой увеличение сроков транспортировки. При изменении внешнеполитической конъюнктуры компания готова рассмотреть возможность возобновления полноценной производственной деятельности на исторических площадках.',
                    'Несмотря на изменение логистических цепочек, в основе проектирования и контроля качества оборудования Omoikiri по-прежнему лежат строгие требования японских промышленных стандартов (JIS). Кухонные мойки производятся из высококачественной нержавеющей стали SUS 304 (JIS G4303). Нормативы жестко регламентируют содержание хрома (18%) и никеля в сплаве. Кроме того, стандарты определяют равномерность толщины стального листа, а также требования к защитному напылению и полимерным накладкам для эффективного гашения шума воды. Для смесителей применяется профильный регламент JIS B 2061, фиксирующий стандарт безопасности: пуск воды происходит движением рычага вверх для предотвращения случайного включения. Японские требования к экологичности сплавов являются одними из самых жестких в мире — латунь тестируется на отсутствие вымывания в питьевую воду свинца и мышьяка, а керамические картриджи рассчитаны на сотни тысяч циклов работы и устойчивы к гидроударам.'
                ]
            }
        };

        function selectCountry(button) {
            const country = countries[button.textContent.trim()];
            if (!country) return;

            const imageUrl = new URL(country.image, document.baseURI);
            section.style.backgroundImage = `url("${imageUrl.href}")`;

            // Поддерживаем и массив абзацев, и обычную строку.
            const paragraphs = Array.isArray(country.text)
                ? country.text
                : [country.text];

            textBody.replaceChildren();

            paragraphs.forEach(function (text) {
                const paragraph = document.createElement('p');
                paragraph.textContent = text;
                textBody.appendChild(paragraph);
            });

            // Обновляем видимость, ID и текст кнопки видео.
            const videoButton = section.querySelector('.about_top_video');

            if (videoButton) {
                const hasVideo = Boolean(country.videoId);

                // display: none скрывает кнопку, даже если в CSS задан display: flex.
                if (hasVideo) {
                    videoButton.style.removeProperty('display');
                    videoButton.id = country.videoId;

                    const videoLabels = {
                        'Италия': 'завод в Италии',
                        'Китай': 'завод в Китае',
                        'Турция': 'завод в Турции',
                        'Россия': 'завод в России',
                        'Япония': 'завод в Японии'
                    };

                    const countryName = button.textContent.trim();
                    const videoLabel = videoButton.querySelector('p');

                    if (videoLabel) {
                        videoLabel.textContent = videoLabels[countryName] || 'о компании';
                    }
                } else {
                    videoButton.style.display = 'none';
                    videoButton.removeAttribute('id');
                }
            }

            countryButtons.forEach(function (item) {
                const isActive = item === button;
                item.classList.toggle('is-active', isActive);
                item.setAttribute('aria-pressed', String(isActive));
            });
        }

        countryButtons.forEach(function (button) {
            // Поддержка клавиатуры без изменения текущей HTML-разметки.
            button.setAttribute('role', 'button');
            button.setAttribute('tabindex', '0');
            button.setAttribute('aria-pressed', 'false');

            button.addEventListener('click', function () {
                selectCountry(button);
            });

            button.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectCountry(button);
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initManufacturing);
    } else {
        initManufacturing();
    }
})();



    function initStarsSliders() {
    document.querySelectorAll('.stars_slider').forEach((slider) => {
        const container = slider.closest('.stars_cont');

        const gallery = slider.querySelector('.stars_gallery');
        const prev = container?.querySelector('.stars_prev');
        const next = container?.querySelector('.stars_next');

        if (!gallery || !prev || !next) return;

        // Далее твой существующий код, начиная с:
        const originalCards = [
            ...gallery.querySelectorAll('.star:not([data-clone])')
        ];

        if (originalCards.length <= 1) {
            prev.disabled = true;
            next.disabled = true;
            return;
        }

        // Добавляем копии в начало и конец
        const startClones = originalCards.map((card) => {
            const clone = card.cloneNode(true);
            clone.dataset.clone = 'true';
            return clone;
        });

        const endClones = originalCards.map((card) => {
            const clone = card.cloneNode(true);
            clone.dataset.clone = 'true';
            return clone;
        });

        gallery.prepend(...startClones);
        gallery.append(...endClones);

        let currentIndex = originalCards.length;
        let isResetting = false;
        let scrollTimer;

        function getStep() {
            const card = gallery.querySelector('.star');

            if (!card) return 0;

            const gap = parseFloat(
                getComputedStyle(gallery).columnGap
            ) || 0;

            return card.getBoundingClientRect().width + gap;
        }

        function scrollToIndex(index, behavior = 'smooth') {
            const step = getStep();

            gallery.scrollTo({
                left: index * step,
                behavior
            });
        }

        function setInitialPosition() {
            currentIndex = originalCards.length;

            scrollToIndex(
                currentIndex,
                'instant'
            );
        }

        function move(direction) {
            if (isResetting) return;

            currentIndex += direction;

            scrollToIndex(currentIndex);
        }

        prev.addEventListener('click', () => {
            move(-1);
        });

        next.addEventListener('click', () => {
            move(1);
        });

        gallery.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);

            scrollTimer = setTimeout(() => {
                const step = getStep();

                if (!step) return;

                const position = gallery.scrollLeft / step;
                currentIndex = Math.round(position);

                /*
                 * Если дошли до копий в конце,
                 * незаметно переносимся на оригинальные карточки.
                 */
                if (currentIndex >= originalCards.length * 2) {
                    isResetting = true;

                    currentIndex -= originalCards.length;

                    scrollToIndex(
                        currentIndex,
                        'instant'
                    );

                    requestAnimationFrame(() => {
                        isResetting = false;
                    });
                }

                /*
                 * Если ушли в копии в начале,
                 * переносимся на соответствующую позицию в конце.
                 */
                if (currentIndex < originalCards.length) {
                    isResetting = true;

                    currentIndex += originalCards.length;

                    scrollToIndex(
                        currentIndex,
                        'instant'
                    );

                    requestAnimationFrame(() => {
                        isResetting = false;
                    });
                }
            }, 120);
        }, { passive: true });

        // После изменения ширины экрана сохраняем текущую карточку
        const resizeObserver = new ResizeObserver(() => {
            scrollToIndex(currentIndex, 'instant');
        });

        resizeObserver.observe(gallery);

        // Начинаем с первой оригинальной карточки
        requestAnimationFrame(setInitialPosition);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initStarsSliders
    );
} else {
    initStarsSliders();
}



document.addEventListener('DOMContentLoaded', function () {
    var root = document.querySelector('.about_route');
    if (!root) return;

    var years     = Array.prototype.slice.call(root.querySelectorAll('.year_line'));
    var container = root.querySelector('.route_years');
    var panels    = Array.prototype.slice.call(container.children);
    var prevBtn   = root.querySelector('.route_prev');
    var nextBtn   = root.querySelector('.route_next');
    var bigDot    = root.querySelector('.big_dot');
    var bigYear   = root.querySelector('.big_year');
    var current   = -1;

    // Если для года нет своего блока с текстом, берём текст из самого year_line
    years.forEach(function (year, i) {
        if (panels[i]) return;
        var div = document.createElement('div');
        var src = year.querySelector('p');
        if (src) {
            var p = document.createElement('p');
            p.textContent = src.textContent;
            div.appendChild(p);
        }
        container.appendChild(div);
        panels[i] = div;
    });

    function show(index) {
        var total = years.length;
        // бесконечная прокрутка: выход за границы переносит на другой край
        index = ((index % total) + total) % total;
        if (index === current) return;
        current = index;

        years.forEach(function (year, i) {
            var active = i === index;
            year.classList.toggle('active', active);
            year.setAttribute('aria-pressed', active ? 'true' : 'false');
            panels[i].classList.toggle('active', active);
        });

        // большая точка переезжает к выбранному году, большой год остаётся на месте
        var activeYear = years[index];
        activeYear.insertBefore(bigDot, activeYear.firstChild);
        bigYear.textContent = activeYear.querySelector('h3').textContent.trim();
    }

    // клик и клавиатура по годам
    years.forEach(function (year, i) {
        year.setAttribute('tabindex', '0');
        year.setAttribute('role', 'button');
        year.addEventListener('click', function () { show(i); });
        year.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                show(i);
            }
        });
    });

    // стрелки
    if (prevBtn) prevBtn.addEventListener('click', function () { show(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { show(current + 1); });

    // старт с 2011 (первый элемент)
    show(0);
});



(function () {
  function initFaqs() {
    var faqs = document.querySelectorAll('#faq, #faq2');

    faqs.forEach(function (faq) {
      var items = faq.querySelectorAll('.faq__item');

      function setState(item, open) {
        var button = item.querySelector('.faq__question');
        var answer = item.querySelector('.faq__answer');

        if (!button || !answer) return;

        item.classList.toggle('is-open', open);
        button.setAttribute('aria-expanded', open ? 'true' : 'false');

        // Скрытый ответ не должен попадать в фокус по Tab
        if (open) {
          answer.removeAttribute('inert');
        } else {
          answer.setAttribute('inert', '');
        }
      }

      // Начальное состояние: синхронизируем с разметкой
      items.forEach(function (item) {
        setState(item, item.classList.contains('is-open'));
      });

      // Один обработчик на каждый блок FAQ
      faq.addEventListener('click', function (event) {
        if (!(event.target instanceof Element)) return;

        var button = event.target.closest('.faq__question');
        if (!button || !faq.contains(button)) return;

        var item = button.closest('.faq__item');
        if (!item) return;

        var willOpen = !item.classList.contains('is-open');

        items.forEach(function (other) {
          setState(other, other === item && willOpen);
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFaqs, { once: true });
  } else {
    initFaqs();
  }
})();
