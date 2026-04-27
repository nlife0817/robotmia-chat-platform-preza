// Чистка HTML-снапшотов под легенду презентации.
// Запуск:
//   node _capture.js <name>     — вытаскивает свежий HTML из последнего tool-result
//   node _clean.js              — заменяет реальные данные на легенду
//
// Мы НЕ делаем глобальный str.replace 'Виталий Ожигов', т.к. это имя встречается
// и для ВЫЗЫВАЮЩЕГО админа, и для КОНТАКТА. Используем контекстные regex'ы
// по уникальным CSS-классам Vue-компонентов.

const fs = require('fs');
const path = require('path');

const SCREENS_DIR = __dirname;

// ────────────────────────────────────────────────────────────────────
// УЧАСТНИКИ ЛЕГЕНДЫ
// ────────────────────────────────────────────────────────────────────
const ADMIN_NAME    = 'Александра Андреева';
const ADMIN_INI     = 'АА';
const CONTACT_NAME  = 'Алексей Соколов';   // главный контакт диалогов
const CONTACT_INI   = 'АС';
const AUDIT_CONTACT = 'Никита Петров';     // контакт в кейсе аудита (плохой тон)
const AUDIT_CONTACT_INI = 'НП';
const AUDIT_OPERATOR = 'Михаил Зимин';     // оператор-нарушитель
const AUDIT_GROUP    = 'Поддержка';

// последовательные превью для диалогов (по дате, как в реальном списке)
const DIALOG_PREVIEWS_LIST = [
  'Хорошо, подождём ответа коллеги. Спасибо!',
  'Сравнили с Webim — у вас выше за счёт ИИ?',
];
const DIALOG_PREVIEWS_HISTORY = [
  'Покупка платформы · 18 операторов',
  'Запрос КП на годовой контракт',
  'Презентация продукта',
  'Первое обращение с сайта',
  'Подбор тарифа',
  'Демо ИИ-суфлёра',
  'Уточнение по интеграциям',
  'Звонок с CTO',
  'Договор на проверке',
  'Запуск пилота',
  'Финальный созвон',
];
const AUDIT_PREVIEWS_LIST = [
  'Не работает виджет на главной странице',
  'Долгое решение проблемы с виджетом',
  'Жалоба на качество поддержки',
  'Возврат средств',
  'Технический сбой при оплате',
  'Дубль обращения',
  'Некорректная сумма в счёте',
  'Запрос интеграции с 1С',
  'Проблема с авторизацией',
  'Не приходят уведомления',
  'Откат подписки',
  'Слетел SSL у виджета',
  'Жалоба на оператора',
  'Низкая оценка чата',
  'Завис диалог',
];

// ────────────────────────────────────────────────────────────────────
// Контекстные замены: применяются по очереди, последовательно
// каждая [{regex, replacement, count?}] — count ограничивает кол-во замен
// ────────────────────────────────────────────────────────────────────

function replace(html, find, repl, max = Infinity) {
  let count = 0;
  if (find instanceof RegExp) {
    return html.replace(find, (...args) => {
      if (count >= max) return args[0];
      count++;
      return typeof repl === 'function' ? repl(...args) : repl;
    });
  }
  while (count < max) {
    const idx = html.indexOf(find);
    if (idx === -1) break;
    html = html.slice(0, idx) + repl + html.slice(idx + find.length);
    count++;
  }
  return html;
}

function replaceSequential(html, find, replacements) {
  let i = 0;
  return html.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), () => {
    const r = replacements[i] ?? replacements[replacements.length - 1];
    i++;
    return r;
  });
}

// ────────────────────────────────────────────────────────────────────
// Чистка для каждого файла
// ────────────────────────────────────────────────────────────────────

function cleanCommon(html) {
  // 1. Footer sidebar — имя залогиненного админа
  html = html.replace(
    /(<span class="truncate font-medium">)Виталий Ожигов(<\/span>)/g,
    `$1${ADMIN_NAME}$2`,
  );

  // 2. Аватар-инициалы админа в footer
  // <span ... class="...">ВО</span> — внутри aside с user меню. Используем data-slot="avatar-fallback"
  html = html.replace(
    /(data-slot="avatar-fallback"[^>]*>\s*)ВО(\s*<)/g,
    `$1${ADMIN_INI}$2`,
  );

  // 3. Имена реальных операторов в дашборде/таблицах — на легенду
  const opMap = {
    'Владимир Ступин': 'Михаил Петров',
    'Сараза Абу-Нидаль': 'Анна Соколова',
    'Анатолий Всеволодович': 'Дмитрий Иванов',
    'Тестовый чат-бот П.': 'ИИ-ассистент RobotMIA',
    'Тима Гусев': 'Дмитрий Орлов',
    'Дмитрий Боронос': 'Никита Петров',
    'Айлин Кулагина': 'Ольга Белова',
    'Денис Баранцев': 'Сергей Иванов',
  };
  for (const [from, to] of Object.entries(opMap)) {
    html = html.split(from).join(to);
  }

  return html;
}

function cleanDialogs(html) {
  html = cleanCommon(html);

  // Контакт в списке диалогов (ConversationListItem)
  html = html.replace(
    /(class="truncate text-\[15px\] leading-5 dark:text-sidebar-foreground[^"]*"[^>]*>)Виталий Ожигов(<)/g,
    `$1${CONTACT_NAME}$2`,
  );

  // ChatBubble author = АДМИН (отправитель сообщения = оператор)
  html = html.replace(
    /(class="[^"]*text-primary-foreground\/70[^"]*"[^>]*>)Виталий Ожигов(<)/g,
    `$1${ADMIN_NAME}$2`,
  );

  // alt у avatar контакта
  html = html.replace(/alt="Виталий Ожигов"/g, `alt="${CONTACT_NAME}"`);

  // Заголовок правой панели = контакт
  html = html.replace(
    /(<h2[^>]*class="font-semibold text-lg"[^>]*>)Виталий Ожигов(<\/h2>)/g,
    `$1${CONTACT_NAME}$2`,
  );

  // История диалогов (повторы того же контакта)
  html = html.replace(
    /(class="truncate text-sm font-medium"[^>]*>)Виталий Ожигов(<)/g,
    `$1${CONTACT_NAME}$2`,
  );

  // Тема в чипе диалога
  html = html.split('>Консультация<').join('>Покупка платформы<');

  // Тексты ИИ-суфлёра — заменяем на нашу тему (продажа платформы)
  html = html.replace(
    /Понял свою роль и все ограничения\. Я готов работать как ИИ-суфлёр для операторов МКК «Золотой лист»\. Буду формировать только одно сообщение для клиента, основываясь на[^<]*/,
    'Алексей, пилотный запуск возможен в течение 5 рабочих дней после подписания договора. Сначала подключаем основные каналы (WhatsApp Business, Telegram), затем — ВКонтакте и Avito. Хотите, отправлю пошаговый план с примерными датами по каждому этапу?',
  );
  html = html.replace(
    /Добрый день! Чтобы подсказать вам подходящий вариант, уточните, пожалуйста, по какой причине вам нужны кредитные каникулы – снижение дохода, чрезвычайная ситуация или[^<]*/,
    'Спасибо за уточнение по объёму! Чтобы подобрать оптимальный тариф для 18 операторов, мне понадобится 2 минуты — параллельно покажу демо-аккаунт. Удобно во вторник в 11:00 или сегодня после 16:00?',
  );
  html = html.replace(
    /Добрый день! Чтобы подсказать вам, как получить кредитные каникулы, уточните, пожалуйста, по какой причине они вам нужны\./,
    'Высылаю КП с тарифами для команды 18 операторов и 4 каналов: WhatsApp Business, Telegram, ВК, Avito. По итогам демо подготовим индивидуальное предложение со скидкой 15% на годовой контракт.',
  );

  // Превью списка диалогов (последние сообщения)
  html = (function () {
    let i = 0;
    return html.replace(
      /(class="min-w-0 flex-1 truncate text-xs font-normal leading-4 text-muted-foreground[^"]*"[^>]*>)Сообщение без текста(<)/g,
      (m, p1, p2) => {
        const t = DIALOG_PREVIEWS_LIST[i] ?? DIALOG_PREVIEWS_LIST[DIALOG_PREVIEWS_LIST.length - 1];
        i++;
        return `${p1}${t}${p2}`;
      },
    );
  })();

  // Превью истории диалогов (тоже "Сообщение без текста")
  html = (function () {
    let i = 0;
    return html.replace(
      /(class="text-xs text-muted-foreground truncate[^"]*"[^>]*>)Сообщение без текста(<)/g,
      (m, p1, p2) => {
        const t = DIALOG_PREVIEWS_HISTORY[i] ?? DIALOG_PREVIEWS_HISTORY[DIALOG_PREVIEWS_HISTORY.length - 1];
        i++;
        return `${p1}${t}${p2}`;
      },
    );
  })();

  return html;
}

function cleanAudit(html) {
  html = cleanCommon(html);

  // Список диалогов аудита: повторяющийся контакт
  // class="truncate text-sm dark:text-sidebar-foreground..." — это имя в строке аудита
  html = (function () {
    let i = 0;
    return html.replace(
      /(class="truncate text-sm dark:text-sidebar-foreground[^"]*"[^>]*>)Виталий Ожигов(<)/g,
      (m, p1, p2) => {
        i++;
        return `${p1}${AUDIT_CONTACT}${p2}`;
      },
    );
  })();

  // Альтернативный класс
  html = html.replace(
    /(class="truncate text-sm[^"]*dark:text-sidebar-foreground[^"]*"[^>]*>)Виталий Ожигов(<)/g,
    `$1${AUDIT_CONTACT}$2`,
  );

  // Avatar alt в строках списка
  html = html.replace(/alt="Виталий Ожигов"/g, `alt="${AUDIT_CONTACT}"`);

  // Правая панель: Имя / Оператор / Группа
  html = html.replace(
    /(>Имя:<\/span>\s*)Виталий Ожигов(<)/g,
    `$1${AUDIT_CONTACT}$2`,
  );
  html = html.replace(
    /(>Оператор:<\/span>\s*)Виталий Ожигов(<)/g,
    `$1${AUDIT_OPERATOR}$2`,
  );
  html = html.replace(
    /(>Группа:<\/span>\s*)Консультационная группа(<)/g,
    `$1${AUDIT_GROUP}$2`,
  );

  // Заголовок правой панели аудита (контакт)
  html = html.replace(
    /(<h2[^>]*class="font-semibold text-lg"[^>]*>)Виталий Ожигов(<\/h2>)/g,
    `$1${AUDIT_CONTACT}$2`,
  );

  // История диалогов в правой панели аудита (повторы того же контакта)
  html = html.replace(
    /(class="truncate text-sm font-medium"[^>]*>)Виталий Ожигов(<)/g,
    `$1${AUDIT_CONTACT}$2`,
  );

  // ChatBubble author в аудите — это оператор-нарушитель
  html = html.replace(
    /(class="[^"]*text-primary-foreground\/70[^"]*"[^>]*>)Виталий Ожигов(<)/g,
    `$1${AUDIT_OPERATOR}$2`,
  );

  // Превью в списке аудита
  html = (function () {
    let i = 0;
    return html.replace(
      /(class="text-xs text-muted-foreground truncate[^"]*"[^>]*>)Сообщение без текста(<)/g,
      (m, p1, p2) => {
        const t = AUDIT_PREVIEWS_LIST[i] ?? AUDIT_PREVIEWS_LIST[AUDIT_PREVIEWS_LIST.length - 1];
        i++;
        return `${p1}${t}${p2}`;
      },
    );
  })();

  return html;
}

function cleanDashboard(html) {
  return cleanCommon(html);
}

function cleanAnalytics(html) {
  return cleanCommon(html);
}

// ────────────────────────────────────────────────────────────────────
// Запуск
// ────────────────────────────────────────────────────────────────────

const FILES = {
  'dashboard.html': cleanDashboard,
  'dialogs.html': cleanDialogs,
  'dialogs-quick-replies.html': cleanDialogs,
  'audit.html': cleanAudit,
  'analytics.html': cleanAnalytics,
};

for (const [file, cleaner] of Object.entries(FILES)) {
  const fp = path.join(SCREENS_DIR, file);
  if (!fs.existsSync(fp)) {
    console.log(`SKIP: ${file}`);
    continue;
  }
  const before = fs.readFileSync(fp, 'utf8');
  const after = cleaner(before);
  fs.writeFileSync(fp, after, 'utf8');
  console.log(`${file}: ${before.length} → ${after.length} (${after.length - before.length >= 0 ? '+' : ''}${after.length - before.length})`);
}
