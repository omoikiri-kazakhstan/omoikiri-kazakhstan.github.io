# OMOIKIRI KZ New Final Beta

Репозиторий для продолжения работы над OMOIKIRI KZ. Текущий рабочий снимок
хранится в ветке `wip-home-2026-10-14`; `main` не обновляется этим снимком.

## Что внутри

- Полная статическая копия текущей beta-версии сайта.
- Каталоги: мойки, смесители, фильтры, измельчители, дозаторы, аксессуары, OMOIKIRI Home.
- Карточки товаров в `product/`.
- RU/KZ переключатель.
- Цены в тенге.
- Корзина и избранное через локальное хранилище браузера.
- PDF/печать избранного.
- Локальный поиск.
- Рабочие фильтры для моек и смесителей, включая данные, сверенные с `omoikiri.ru`.
- Служебный скрипт синхронизации каталога в `scripts/`.

## Главная папка для работы

Работать дальше нужно из этого репозитория:

```text
C:\Users\madir\Desktop\omoikiri-kz-new-final-beta
```

GitHub (рабочая ветка):

```text
https://github.com/omoikiri-kazakhstan/omoikiri-kazakhstan.github.io/tree/wip-home-2026-10-14
```

Опубликованный сайт:

```text
https://omoikiri-kazakhstan.pages.dev/
```

## Продолжить дома

```powershell
git clone --branch wip-home-2026-10-14 --single-branch https://github.com/omoikiri-kazakhstan/omoikiri-kazakhstan.github.io.git
cd omoikiri-kazakhstan.github.io
git status
```

Секреты Cloudflare (`TIPTOP_API_SECRET`, Telegram, Turnstile, админка) и локальные
`.env`/`.dev.vars` намеренно не сохраняются в Git. Для локальной проверки
серверных функций нужны отдельные тестовые значения и Wrangler. Не копируйте
боевые ключи в репозиторий. Публикация этой ветки на GitHub сама по себе не
включает оплату TipTop Pay на сайте.

## Как открыть локально

Можно открыть файл напрямую:

```text
index.html
```

Лучше через локальный сервер, чтобы все относительные пути работали одинаково:

```powershell
cd C:\Users\madir\Desktop\omoikiri-kz-new-final-beta
python -m http.server 8080
```

Потом открыть:

```text
http://localhost:8080/
```

## Важные страницы для проверки

```text
/index.html
/sinks/index.html
/taps/index.html
/favorites/index.html
/cart.html
/product/akeno/index.html
/product/daisen-60/index.html
```

## Правило на будущее

Чтобы компьютеры не расходились, работать в `wip-home-2026-10-14` и перед началом:

```powershell
git pull
```

После правок:

```powershell
git status
git add .
git commit -m "Описание правок"
git push
```

Не продолжать работу из старых папок `omoikiri-local-copy` или `x9230x.github.io`.
