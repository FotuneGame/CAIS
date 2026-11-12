# typescript: онтология TypeScript

Перевод LLMC в TypeScript: Node.js, NestJS. Запись «→» в описании — перевод в целевой код.

Лексемы языка — в `compiler/config/tokens.def`, их смысл — в `compiler/config/ontologies/llmc.json`. Здесь — только перевод в TypeScript и правила для LLM.

## Файлы

| Файл | Подключается к запросу LLM по словам | Назначение |
|---|---|---|
| `base.json` | всегда | Перевод языка LLMC в TypeScript: лексемы config/tokens.def, шаблоны объявлений, правила для LLM |
| `nest.json` | «nest», «http», «запрос», «сервис», «контроллер», «модул», «настройк» | NestJS: внедрение зависимостей, модули приложения и запросы HTTP |
| `typeorm.json` | «typeorm», «таблиц», «postgres», «базы», «базу», «база», «сущност» | TypeORM: записи и таблицы PostgreSQL |
| `validator.json` | «validator», «проверк», «валидац», «входн» | Проверка входных данных: class-validator и class-transformer |
| `swagger.json` | «swagger», «документац» | Документация API Swagger |
| `winston.json` | «winston», «журнал» | Журнал winston |
| `kafka.json` | «kafka», «шин», «топик» | Kafka: отправка и чтение сообщений |
| `jose.json` | «jwt», «токен» | Проверка токенов JWT |
| `mcp.json` | «mcp» | Сервер Model Context Protocol |
| `prom.json` | «prometheus», «метрик» | Метрики Prometheus |
| `net.json` | «http», «запрос» | Запросы HTTP к другим сервисам |
| `process.json` | «процесс», «команд» | Запуск команд операционной системы |
| `files.json` | «файл», «каталог» | Файлы и каталоги |

## base.json

| Раздел | Значение |
|---|---|
| `language` | `typescript` |
| `extensions` | `ts` |
| `scripts.build` | `tsc --outDir dist --rootDir src --target ES2023 --module nodenext --moduleResolution nodenext --strict --strictPropertyInitialization false --experimentalDecorators --emitDecoratorMetadata --esModuleInterop --skipLibCheck --sourceMap --types node src/main.ts` |
| `scripts.start` | `node dist/main.js` |
| `scripts.test` | `vitest run` |

### Пакеты

| Пакет | Версия | Назначение |
|---|---|---|
| `typescript` | ^6.0.3 | компилятор TypeScript; не импортируется |
| `@types/node` | ^24.19.2 | типы Node.js; не импортируется |
| `node` | встроенный | встроенные модули Node.js: import из node:fs, node:path, node:crypto и других |
| `vitest` | ^3.2.4 | тесты: файлы <имя>.test.llmc; LLM не импортирует |

### Ключевые слова языка

| Ключевое слово | Смысл | Перевод |
|---|---|---|
| `break` | выход из цикла или ветви switch → break | `break` |
| `case` | ветвь switch для значения → case | `case` |
| `char` | символ → string из одного символа | `string` |
| `const` | значение не меняется → const для переменной, readonly для поля | `const` |
| `continue` | переход к следующему шагу цикла → continue | `continue` |
| `default` | ветвь switch для остальных значений → default | `default` |
| `do` | цикл с условием после тела → do while | `do` |
| `double` | вещественное двойной точности → number | `number` |
| `else` | ветвь условия, когда оно ложно → else | `else` |
| `enum` | перечисление → enum; если значения не заданы — строковые: ИМЯ = 'ИМЯ' |  |
| `float` | вещественное → number | `number` |
| `for` | цикл со счётчиком → for | `for` |
| `if` | условие: if (условие) оператор → if | `if` |
| `int` | целое → number | `number` |
| `long` | длинное целое → number | `number` |
| `return` | возврат значения из функции → return | `return` |
| `short` | короткое целое → number | `number` |
| `signed` | целое со знаком → number | `number` |
| `static` | член класса, а не объекта → static | `static` |
| `switch` | выбор ветви по значению → switch | `switch` |
| `typedef` | новое имя типа → type Имя = Тип |  |
| `unsigned` | целое без знака → number | `number` |
| `void` | нет значения → void | `void` |
| `while` | цикл с условием → while | `while` |
| `class` | класс: поля, конструктор и методы; члены без модификатора — public; class Имя<T> : Базовый, Интерфейс → class |  |
| `public` | член доступен всем → public | `public` |
| `private` | член доступен только классу → private | `private` |
| `protected` | член доступен классу и наследникам → protected | `protected` |
| `virtual` | объявление пишет LLM по комментарию над ним: import — файл целиком, переменная — значение, функция и метод — тело, class и interface — оформление и недостающие члены |  |
| `override` | метод заменяет метод базового типа → без слова в целевом коде |  |
| `interface` | интерфейс: методы без тел, интерфейс без тела — признак роли класса → interface |  |
| `throw` | выбросить ошибку → throw | `throw` |
| `try` | блок с перехватом ошибок → try | `try` |
| `catch` | перехват ошибки → catch (error); несколько catch — проверки instanceof по порядку | `catch` |
| `finally` | действия после блока в любом случае → finally | `finally` |
| `import` | import "файл.llmc" — объявления файла LLMC; import "любой файл" — файл проекта; virtual import "путь" — файл, который создаёт LLM → import { имена } from './путь' |  |
| `export` | объявление доступно другим файлам → export перед объявлением | `export` |
| `null` | нет значения → null | `null` |
| `true` | истина → true | `true` |
| `false` | ложь → false | `false` |
| `bool` | логическое значение → boolean | `boolean` |
| `string` | строка → string | `string` |
| `date` | момент времени в UTC; new date() — сейчас; (string) — запись ISO 8601; (date) "2026-01-31T10:00:00Z" — разбор; (long) — миллисекунды → Date | `Date` |
| `promise` | promise<T> — результат асинхронной операции → Promise<T> | `Promise<{0}>` |
| `async` | функция с ожиданием await; её результат — promise<T> → async | `async` |

### Операторы

| Оператор | Смысл | Перевод |
|---|---|---|
| `sizeof` | sizeof(тип) — размер типа в байтах: char 1, short 2, int 4, long 8, float 4, double 8; sizeof(значение) — число элементов строки или массива → x.length | `{0}.length` |
| `as` | приведение к типу → as Тип | `({0} as {1})` |
| `is` | проверка типа → instanceof для классов, typeof для простых типов | `({0} instanceof {1})` |
| `new` | создание объекта или массива → new Тип(аргументы); new T[n] — new Array<T>(n) | `new {0}({1})` |
| `delete` | удаление элемента словаря или освобождение объекта → delete словарь[ключ]; для объекта — ничего | `delete` |
| `this` | текущий объект → this | `this` |
| `base` | базовый класс → super | `super` |
| `await` | await x — дождаться результата promise<T> → await x | `await ` |
| `++` | увеличение на единицу → ++ | `++` |
| `--` | уменьшение на единицу → -- | `--` |
| `~` | побитовое отрицание → ~ | `~` |
| `!` | логическое отрицание → ! | `!` |
| `+` | сложение чисел или соединение строк → + | `+` |
| `-` | вычитание или смена знака → - | `-` |
| `*` | умножение → * | `*` |
| `/` | деление; для целых операндов — целочисленное → для целых операндов Math.trunc(a / b) | `/` |
| `%` | остаток от деления → % | `%` |
| `<<` | сдвиг битов влево → << | `<<` |
| `>>` | сдвиг битов вправо → >> | `>>` |
| `&` | побитовое И → & | `&` |
| `\|` | побитовое ИЛИ → \| | `\|` |
| `^` | побитовое исключающее ИЛИ → ^ | `^` |
| `==` | равенство → === | `===` |
| `!=` | неравенство → !== | `!==` |
| `<` | меньше → < | `<` |
| `>` | больше → > | `>` |
| `<=` | меньше или равно → <= | `<=` |
| `>=` | больше или равно → >= | `>=` |
| `&&` | логическое И → && | `&&` |
| `\|\|` | логическое ИЛИ → \|\| | `\|\|` |
| `?` | условие ? значение : иначе — выбор значения → ? : | `?` |
| `:` | вторая часть выбора ? : и список базовых типов после имени класса → : в выражении, extends и implements в объявлении | `:` |
| `=` | присваивание → = | `=` |
| `+=` | сложение с присваиванием → += | `+=` |
| `-=` | вычитание с присваиванием → -= | `-=` |
| `*=` | умножение с присваиванием → *= | `*=` |
| `/=` | деление с присваиванием → /= | `/=` |
| `%=` | остаток с присваиванием → %= | `%=` |
| `<<=` | сдвиг влево с присваиванием → <<= | `<<=` |
| `>>=` | сдвиг вправо с присваиванием → >>= | `>>=` |
| `&=` | побитовое И с присваиванием → &= | `&=` |
| `^=` | побитовое исключающее ИЛИ с присваиванием → ^= | `^=` |
| `\|=` | побитовое ИЛИ с присваиванием → \|= | `\|=` |

### Шаблоны объявлений

| Шаблон | Запись |
|---|---|
| `import` | `import { {names} } from '{path}';` |
| `variable` | `{export}{const} {name}: {type}{value};` |
| `local` | `{const} {name}: {type}{value};` |
| `let` | `let` |
| `typedef` | `{export}type {name} = {type};` |
| `enum` | `{export}enum {name} {⏎{members}}` |
| `enumerator` | `{name}{value},` |
| `enumeratorText` | `{name} = '{name}',` |
| `interface` | `{export}interface {name}{extends} {⏎{members}}` |
| `class` | `{export}class {name}{extends}{implements} {⏎{members}}` |
| `extends` | ` extends {types}` |
| `implements` | ` implements {types}` |
| `field` | `{access}{static}{readonly}{name}{optional}: {type}{value};` |
| `readonly` | `readonly ` |
| `method` | `{access}{static}{async}{name}({params}): {type} {body}` |
| `signature` | `{name}({params}): {type};` |
| `constructor` | `constructor({params}) {body}` |
| `function` | `{export}{async}function {name}({params}): {type} {body}` |
| `async` | `async ` |
| `param` | `{name}{optional}: {type}{value}` |
| `optional` | `?` |
| `nullable` | `{type} \| null` |
| `array` | `{type}[]` |
| `list` | `[{items}]` |
| `catch` | `catch ({name})` |
| `main` | `main();` |
| `test` | `it('{title}', {async}() => expect({await}({async}(): {type} => {body})()).toBe(true));` |
| `testImport` | `import { expect, it } from 'vitest';` |
| `virtual` | `__virtual__` |
| `outline` | `{ ... }` |
| `unknown` | `unknown` |

### Правила для LLM

- Раздел «IR» — исходный файл на языке LLMC: комментарии программиста и пояснения лексем [llmc]. Раздел «Файл» — его перевод в TypeScript, сделанный компилятором; твоя задача — дописать этот перевод.
- Пометка [virtual] в переводе — место для твоего кода: __virtual__ замени телом или значением; class и interface с пометкой оформи и дополни; файл из virtual import создай целиком.
- Комментарий [пользователь] — задача от программиста: как реализовать объявление под ним.
- Роль класса задают интерфейсы и классы, которые он наследует, и комментарии над ними: оформи класс так, как требует роль (декораторы, конструктор, зависимости), даже если у него нет пометки [virtual].
- Код без пометки [virtual] написан человеком: тела таких функций и методов оставь без изменений, символ в символ.
- Имена классов, методов, полей, функций и параметров не меняй; публичных членов не добавляй. Вспомогательные члены — только private.
- Поле с типом класса проекта — зависимость: сделай её параметром конструктора.
- Импортируй только пакеты из раздела «Пакеты», встроенные модули Node.js с префиксом node: и файлы, которые уже импортированы или создаются по virtual import; относительные импорты — без расширения.
- Объявления из других файлов уже реализованы: используй только члены из раздела «Объявления импортированных файлов».
- TypeScript со strict и emitDecoratorMetadata, модули CommonJS: интерфейсы и типы импортируй через import type, классы и enum — обычным import.
- Комментарии программиста оставь, свои решения поясни короткими комментариями. Не оставляй заглушек и TODO.
- Сообщения ошибок для пользователя — на русском.
- Ответ — только содержимое файла: без пояснений вне кода и без Markdown.

## nest.json

NestJS: внедрение зависимостей, модули приложения и запросы HTTP.

| Пакет | Версия |
|---|---|
| `@nestjs/common` | ^12.2.0 |
| `@nestjs/core` | ^12.2.0 |
| `@nestjs/platform-express` | ^12.2.0 |
| `express` | ^5.1.0 |
| `reflect-metadata` | ^0.2.2 |
| `rxjs` | ^7.8.2 |
| `@types/express` | ^5.0.6 |
| `@nestjs/swagger` | ^12.0.3 |

Правила для LLM:

- Сервис — сервис: объект создаёт контейнер и передаёт другим классам; поля с типом класса проекта — зависимости: параметры конструктора private readonly; комментарий «зависимость имя: тип» над классом — ещё один параметр конструктора → @Injectable() из @nestjs/common; метод с комментарием «вызывается при создании модуля» вызывается из onModuleInit() (implements OnModuleInit), «при запуске приложения» — из onApplicationBootstrap(), «при остановке приложения» — из onModuleDestroy()
- Настройки сервиса — настройки сервиса: объект создаёт контейнер; значение поля — по комментарию «окружение ИМЯ, по умолчанию значение»: строка — process.env.ИМЯ || значение, целое — parseInt(..., 10), вещественное — parseFloat, логическое — (process.env.ИМЯ ?? String(значение)) === 'true', «список через запятую» — split(',') с trim и без пустых → @Injectable() из @nestjs/common, export class с public readonly полями
- Модуль приложения — модуль приложения; состав — в комментарии: imports, controllers, providers, exports → @Module({ imports: [...], controllers: [...], providers: [...], exports: [...] }) из @nestjs/common; класс Guard в providers — { provide: APP_GUARD, useClass: Класс }, класс Interceptor — { provide: APP_INTERCEPTOR, useClass: Класс } из @nestjs/core; «глобальный» — @Global()
- Контроллер — класс принимает запросы HTTP; поля с типом класса проекта — зависимости: параметры конструктора private readonly → @Controller('путь') из @nestjs/common, @ApiTags('путь') и @ApiBearerAuth() из @nestjs/swagger; путь класса («Путь x» или «Без пути») и запрос каждого метода — в комментарии: «GET путь» — @Get, «POST путь» — @Post и @HttpCode(200), «PUT путь» — @Put, «DELETE путь» — @Delete, «ANY путь» — @All; параметр-структура — @Body(), параметр из пути — @Param('имя'), из строки запроса — @Query('имя'); «открыт» — @SetMetadata('open', true); «действие имя» — @SetMetadata('action', 'имя'); «заголовок имя: значение» — @Header; «скрыт из документации» — @ApiExcludeController() без @ApiTags; «исходный запрос» — @Req() из express, «исходный ответ» — @Res(); «имя — вызывающий» — @Req() { user }, «имя — параметр пути x» — @Param('x'), «имя — параметр строки запроса x» — @Query('x'); «вызывается при создании модуля», «при запуске приложения», «при остановке приложения» — как у Service
- Страж запросов — класс решает, допустить ли запрос: метод canActivate; поля с типом класса проекта — зависимости: параметры конструктора private readonly → @Injectable(), implements CanActivate
- Перехватчик запросов — класс выполняет действие вокруг каждого запроса: метод intercept; поля с типом класса проекта — зависимости: параметры конструктора private readonly → @Injectable(), implements NestInterceptor
- Application — приложение: запуск сервера → INestApplication из @nestjs/common; создаётся await NestFactory.create(КорневойМодуль, { bufferLogs: true }) из @nestjs/core; первой строкой файла import 'reflect-metadata'
- ValidationPipe — проверка входных данных всех запросов → app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true })) из @nestjs/common
- ExecutionContext — сведения о текущем запросе в страже и перехватчике → ExecutionContext из @nestjs/common: context.switchToHttp().getRequest() и getResponse(), getHandler(), getClass()
- CallHandler — продолжение обработки запроса в перехватчике → CallHandler из @nestjs/common: next.handle() возвращает Observable из rxjs; операторы tap, catchError, throwError
- Reflector — чтение метаданных атрибутов Open и Action → Reflector из @nestjs/core: reflector.getAllAndOverride('ключ', [context.getHandler(), context.getClass()])
- Discovery — поиск контроллеров приложения → DiscoveryService из @nestjs/core: getControllers() возвращает обёртки с полем instance; в imports модуля нужен DiscoveryModule
- Ошибки запросов — из @nestjs/common: 400 BadRequestException, 401 UnauthorizedException, 403 ForbiddenException, 404 NotFoundException, 503 ServiceUnavailableException, 405 — new HttpException(сообщение, HttpStatus.METHOD_NOT_ALLOWED).
- Запрос и ответ HTTP — Request и Response из express через import type; поле user запроса добавляет страж.

## typeorm.json

TypeORM: записи и таблицы PostgreSQL.

| Пакет | Версия |
|---|---|
| `typeorm` | ^1.1.2 |
| `@nestjs/typeorm` | ^12.0.3 |
| `pg` | ^8.23.1 |

Правила для LLM:

- Сущность базы данных — запись таблицы; имя таблицы — в комментарии; каждое поле — колонка → @Entity('таблица') из typeorm; колонки по типу поля: number из int — @Column('int'), из float и double — @Column('float'), string — @Column('text'), boolean — @Column('boolean'), Date — @Column('timestamptz'), объекты и массивы — @Column('jsonb'); необязательное поле — nullable: true; значение по умолчанию — default; в комментарии поля: «ключ» — @PrimaryGeneratedColumn(), «идентификатор» — @PrimaryColumn(), «uuid» — тип колонки 'uuid', «уникально» — unique: true, «создано» — @CreateDateColumn({ type: 'timestamptz' }), «изменено» — @UpdateDateColumn({ type: 'timestamptz' })
- Хранилище записей класса E — Repository<E> из typeorm; зависимость: constructor(@InjectRepository(E) private readonly имя: Repository<E>) из @nestjs/typeorm; условия поиска — ILike, In из typeorm.
- Модуль с таблицами записей A, B: в imports @Module — TypeOrmModule.forFeature([A, B]) из @nestjs/typeorm, в exports — TypeOrmModule.
- Модуль с подключением базы: в imports @Module — TypeOrmModule.forRoot({ type: 'postgres', ..., autoLoadEntities: true, synchronize: true, retryAttempts: 3, retryDelay: 3000 }) из @nestjs/typeorm; параметры — в комментарии.
- Произвольный запрос к базе — DataSource из typeorm: await dataSource.query('SELECT 1').

## validator.json

Проверка входных данных: class-validator и class-transformer.

| Пакет | Версия |
|---|---|
| `class-validator` | ^0.15.1 |
| `class-transformer` | ^0.5.1 |

Правила для LLM:

- Входные данные запроса — входные данные запроса: каждое поле проверяется по типу → декораторы class-validator: string — @IsString(), number из int — @IsInt(), из float и double — @IsNumber(), boolean — @IsBoolean(), объект — @IsObject(), массив — @IsArray(), enum — @IsEnum(Тип); необязательное поле — @IsOptional(); поле-класс — @ValidateNested() и @Type(() => Класс) из class-transformer; в комментарии поля: «от a до b» для числа — @Min(a) и @Max(b), только «от a» — @Min(a), только «до b» — @Max(b), «длина от a до b» — @Length(a, b), для массива — @ArrayMinSize(a) и @ArrayMaxSize(b), «одно из a, b» — @IsIn([a, b]), «шаблон выражение» — @Matches(new RegExp('выражение')), «uuid» — @IsUUID()
- validated — validated(Класс, данные) — объект класса из данных после проверки; ошибки проверки — исключение с сообщениями через «; » → plainToInstance из class-transformer и validate(объект, { whitelist: true }) из class-validator; сообщения — constraints всех ошибок, включая вложенные children

## swagger.json

Документация API Swagger.

| Пакет | Версия |
|---|---|
| `@nestjs/swagger` | ^12.0.3 |

Правила для LLM:

- ApiDocs — страница документации API → DocumentBuilder и SwaggerModule из @nestjs/swagger: new DocumentBuilder().setTitle(имя).setVersion('1.0').addBearerAuth().build(); SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config), { swaggerOptions: { persistAuthorization: true, docExpansion: 'none' }, customSiteTitle: имя })

## winston.json

Журнал winston.

| Пакет | Версия |
|---|---|
| `winston` | ^3.19.0 |
| `winston-daily-rotate-file` | ^5.0.0 |

Правила для LLM:

- Журнал приложения — журнал приложения → implements LoggerService из @nestjs/common: методы log, warn, error, debug
- Journal — журнал: записи уровней info, warn, error, debug с метаданными → winston.Logger: import * as winston from 'winston'; winston.createLogger({ level, defaultMeta, format: winston.format.combine(timestamp(), errors({ stack: true }), json()), transports }); консоль — new winston.transports.Console({ format })
- DailyFile — файлы журнала по дням → import DailyRotateFile from 'winston-daily-rotate-file'; new DailyRotateFile({ filename, datePattern: 'YYYY-MM-DD', maxSize, maxFiles })

## kafka.json

Kafka: отправка и чтение сообщений.

| Пакет | Версия |
|---|---|
| `kafkajs` | ^2.2.4 |

Правила для LLM:

- KafkaClient — клиент Kafka → Kafka из kafkajs: new Kafka({ clientId, brokers, logLevel: logLevel.WARN })
- KafkaProducer — отправитель сообщений → Producer из kafkajs: kafka.producer({ allowAutoTopicCreation: true }), connect(), send({ topic, messages: [{ value }] }), disconnect()
- KafkaConsumer — читатель сообщений → Consumer из kafkajs: kafka.consumer({ groupId }), connect(), subscribe({ topic, fromBeginning: true }), run({ eachMessage: async ({ message }) => ... }), disconnect()
- KafkaAdmin — управление темами → kafka.admin(): connect(), createTopics({ topics: [{ topic, configEntries }], waitForLeaders: true }), disconnect()

## jose.json

Проверка токенов JWT.

| Пакет | Версия |
|---|---|
| `jose` | ^6.2.15 |

Правила для LLM:

- verifyToken — verifyToken(токен, ключи, издатели) — проверить подпись и издателя, вернуть содержимое → (await jwtVerify(токен, ключи, { issuer: издатели })).payload из jose
- Token — содержимое проверенного токена доступа: sub, azp и другие поля → JWTPayload из jose (import type)
- KeySet — набор открытых ключей издателя токенов → createRemoteJWKSet(new URL(адрес)) из jose; тип ReturnType<typeof createRemoteJWKSet>

## mcp.json

Сервер Model Context Protocol.

| Пакет | Версия |
|---|---|
| `@modelcontextprotocol/sdk` | ^1.32.2 |
| `zod` | ^4.6.7 |

Правила для LLM:

- McpServer — сервер MCP: регистрация инструментов → McpServer из @modelcontextprotocol/sdk/server/mcp.js: new McpServer({ name, version }); server.registerTool(имя, { description, inputSchema }, обработчик); обработчик возвращает CallToolResult из @modelcontextprotocol/sdk/types.js: { content: [{ type: 'text', text }] }, при ошибке ещё isError: true
- McpTransport — транспорт MCP поверх одного запроса HTTP → StreamableHTTPServerTransport из @modelcontextprotocol/sdk/server/streamableHttp.js: new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true }); await server.connect(transport); await transport.handleRequest(req, res, body); при закрытии ответа — transport.close() и server.close()
- Schema — схема аргументов инструмента → z из zod: z.string().max(n), z.number().int().min(a).max(b), .optional()

## prom.json

Метрики Prometheus.

| Пакет | Версия |
|---|---|
| `prom-client` | ^15.1.3 |

Правила для LLM:

- collectMetrics — collectMetrics() — включить сбор метрик процесса, один раз при загрузке файла → collectDefaultMetrics() из prom-client
- metricsText — metricsText() — метрики в формате Prometheus → register.metrics() из prom-client
- METRICS_TYPE — тип содержимого метрик → register.contentType из prom-client

## net.json

Запросы HTTP к другим сервисам.

Правила для LLM:

- request — request(метод, адрес, заголовки, тело, предел времени мс) — запрос HTTP → fetch(адрес, { method, headers, body, signal: AbortSignal.timeout(мс) }); тело и предел времени — если заданы
- formEncode — formEncode(словарь) — тело application/x-www-form-urlencoded → new URLSearchParams(словарь)
- Reply — ответ HTTP: поля ok и status, методы text() и json() → Response глобального fetch

## process.json

Запуск команд операционной системы.

Правила для LLM:

- launch — launch(программа, аргументы, параметры) — запустить процесс и читать его вывод по мере появления: события data у stdout и stderr, error и close(код) у процесса → spawn(программа, аргументы, { cwd, env }) из node:child_process
- execute — execute(программа, аргументы, параметры) — выполнить команду и вернуть { stdout, stderr }; ошибка содержит code, stdout, stderr → promisify(execFile) из node:util и node:child_process; параметры: cwd, timeout, maxBuffer

## files.json

Файлы и каталоги.

Правила для LLM:

- listFiles — listFiles(каталог) — пути файлов каталога рекурсивно → readdir(каталог, { recursive: true, withFileTypes: true }) из node:fs/promises, только файлы
- fileExists — fileExists(путь) — есть ли файл → stat(путь) из node:fs/promises: успех — true, ошибка — false
- fileSize — fileSize(путь) — размер файла в байтах → (await stat(путь)).size из node:fs/promises
- writable — writable(путь) — проверить право записи, иначе ошибка → access(путь, constants.W_OK) из node:fs/promises

## Комментарии для LLM

| Объявление | Комментарий | Оформление |
|---|---|---|
| `virtual interface IController;` | `// Работа с контроллерами NestJS` | роль: классы-наследники получают `@Controller` |
| класс-контроллер | `// Путь notes`, `// Без пути` | `@Controller('notes')` |
| метод контроллера | `// GET summary, запрос открыт` | `@Get('summary')`, `@SetMetadata('open', true)` |
| класс-модуль | `// controllers — A; providers — B; таблицы — C` | `@Module({...})`, `TypeOrmModule.forFeature([C])` |
| класс-сущность | `// Таблица notes` | `@Entity('notes')` |
| поле сущности | `// ключ`, `// идентификатор; uuid`, `// создано`, `// изменено` | `@PrimaryGeneratedColumn()`, `@PrimaryColumn('uuid')`, `@CreateDateColumn`, `@UpdateDateColumn` |
| поле входных данных | `// длина от 1 до 200`, `// от 0 до 300`, `// шаблон ^[a-z]+$` | `@Length(1, 200)`, `@Min(0)` `@Max(300)`, `@Matches(...)` |
| поле настроек | `// окружение KAFKA_TOPIC, по умолчанию "cais.events"` | `process.env.KAFKA_TOPIC \|\| 'cais.events'` |
| класс-сервис | `// зависимость notes: таблица записей NoteEntity` | параметр конструктора `@InjectRepository(NoteEntity)` |

## Примеры

Файлы проекта `compiler/example` и их перевод компилятором до работы LLM.

### Роли классов: интерфейсы с комментариями

`example/src/shared/roles.types.llmc`

```c
// Работа с сущностями базы данных: запись таблицы TypeORM, имя таблицы — в комментарии класса
export virtual interface IDBEntity;
// Входные данные сетевого запроса с проверкой полей (class-validator)
export virtual interface IDto;
// Работа с сервисами NestJS: принимают данные от контроллеров, зависимости получают через конструктор
export virtual interface IService;
// Работа с контроллерами NestJS: сетевые запросы HTTP по заданным путям с проверкой входных данных
export virtual interface IController;
// Модуль приложения NestJS: состав — в комментарии класса
export virtual interface IModule;

export interface ICRUD<Entity, Input> {
  promise<Entity[]> list();
  promise<Entity> add(Input input);
}
```

### Функции: переводит компилятор

`example/src/modules/notes/notes.functions.llmc`

```c
export double average(int total, int count) {
  if (count == 0) { return 0.0; }
  return (double) total / count;
}

export long factorial(int n) {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

export int half(int n) {
  return n / 2;
}

export double energy(int[] sizes) {
  double sum = 0.0;
  for (int i = 0; i < sizeof(sizes); i++) {
    sum += sizes[i] * sizes[i];
    continue;
    sum = 0.0;
  }
  return root(sum);
}

// Квадратный корень методом Ньютона
double root(double value) {
  double guess = value > 1 ? value : 1.0;
  for (int i = 0; i < 40; i++) {
    guess = (guess + value / guess) / 2;
  }
  return value <= 0 ? 0.0 : guess;
}

export string stamp(date moment) {
  return "создано " + (string) moment;
}
```

Перевод компилятора: `build/ir/example/draft/src/modules/notes/notes.functions.ts`

```ts
export function average(total: number, count: number): number {
  if (count === 0) {
    return 0.0;
  }
  return Number(total) / count;
}

export function factorial(n: number): number {
  return (n <= 1) ? 1 : (n * factorial(n - 1));
}

export function half(n: number): number {
  return Math.trunc(n / 2);
}

export function energy(sizes: number[]): number {
  let sum: number = 0.0;
  for (let i: number = 0; i < sizes.length; i++) {
    sum += sizes[i] * sizes[i];
    continue;
  }
  return root(sum);
}

// [пользователь] Квадратный корень методом Ньютона
function root(value: number): number {
  let guess: number = (value > 1) ? value : 1.0;
  for (let i: number = 0; i < 40; i++) {
    guess = (guess + (value / guess)) / 2;
  }
  return (value <= 0) ? 0.0 : guess;
}

export function stamp(moment: Date): string {
  return "создано " + moment.toISOString();
}
```

### Тесты: переводит компилятор

`example/src/modules/notes/notes.test.llmc`

```c
import "./notes.functions.llmc";

// среднее без заметок равно нулю
bool averageOfNothing() { return average(0, 0) == 0.0; }

// факториал пяти равен 120
bool factorialOfFive() { return factorial(5) == 120; }

// половина семи — целое три
bool halfOfSeven() { return half(7) == 3; }

// энергия сторон 3 и 4 равна 5
bool energyOfSides() {
  double delta = energy({3, 4}) - 5.0;
  return delta < 0.000001 && delta > -0.000001;
}

// время переводится в запись ISO 8601
bool stampOfMoment() {
  return stamp((date) "2026-01-31T10:00:00Z") == "создано 2026-01-31T10:00:00.000Z";
}
```

Перевод компилятора: `build/ir/example/draft/src/modules/notes/notes.test.ts`

```ts
import { average, factorial, half, energy, stamp } from './notes.functions';
import { expect, it } from 'vitest';

// [пользователь] среднее без заметок равно нулю
it('среднее без заметок равно нулю', () => expect(((): boolean => {
  return average(0, 0) === 0.0;
})()).toBe(true));

// [пользователь] факториал пяти равен 120
it('факториал пяти равен 120', () => expect(((): boolean => {
  return factorial(5) === 120;
})()).toBe(true));

// [пользователь] половина семи — целое три
it('половина семи — целое три', () => expect(((): boolean => {
  return half(7) === 3;
})()).toBe(true));

// [пользователь] энергия сторон 3 и 4 равна 5
it('энергия сторон 3 и 4 равна 5', () => expect(((): boolean => {
  let delta: number = energy([3, 4]) - 5.0;
  return (delta < 0.000001) && (delta > -0.000001);
})()).toBe(true));

// [пользователь] время переводится в запись ISO 8601
it('время переводится в запись ISO 8601', () => expect(((): boolean => {
  return stamp(new Date("2026-01-31T10:00:00Z")) === "создано 2026-01-31T10:00:00.000Z";
})()).toBe(true));
```

### Сущность базы данных: роль `IDBEntity`

`example/src/modules/notes/entity/note.entity.llmc`

```c
import "../types/color.types.llmc";
import "../../../shared/roles.types.llmc";

// Таблица notes
export class NoteEntity : IDBEntity {
  // ключ, значение создаёт база
  int id;
  string title;
  string text;
  Color? color;
  // время создания записи
  date createdAt;
}
```

### Входные данные: роль `IDto`

`example/src/modules/notes/dto/noteinput.dto.llmc`

```c
import "../types/color.types.llmc";
import "../../../shared/roles.types.llmc";

export class NoteInputDto : IDto {
  // длина от 1 до 200
  string title;
  string text = "";
  Color? color;
}
```

### Сервис: роль `IService`; методы `virtual` пишет LLM, `summary` — человек

`example/src/modules/note/note.service.llmc`

```c
import "../notes/constants/notes.constants.llmc";
import "../notes/dto/noteinput.dto.llmc";
import "../notes/entity/note.entity.llmc";
import "../notes/notes.functions.llmc";
import "../notes/types/summary.types.llmc";
import "../../shared/roles.types.llmc";

// Работает с таблицей записей NoteEntity
export class NoteService : IService, ICRUD<NoteEntity, NoteInputDto> {
  // Сохранить заметку. Если заметок уже LIMIT или больше — ошибка 400 «слишком много заметок».
  virtual async promise<NoteEntity> add(NoteInputDto input) {}
  virtual async promise<NoteEntity[]> list() {}
  async promise<Summary> summary() {
    NoteEntity[] all = await this.list();
    int total = 0;
    for (int i = 0; i < sizeof(all); i++) {
      // длина текста заметки
      total += sizeof(all[i].text);
    }
    Summary result = new Summary();
    result.count = sizeof(all);
    result.average = average(total, sizeof(all));
    return result;
  }
}
```

Перевод компилятора: `build/ir/example/draft/src/modules/note/note.service.ts`

```ts
import { LIMIT } from '../notes/constants/notes.constants';
import { NoteInputDto } from '../notes/dto/noteinput.dto';
import { NoteEntity } from '../notes/entity/note.entity';
import { average } from '../notes/notes.functions';
import { Summary } from '../notes/types/summary.types';
import { IService, ICRUD } from '../../shared/roles.types';

// [пользователь] Работает с таблицей записей NoteEntity
export class NoteService implements IService, ICRUD<NoteEntity, NoteInputDto> {
  // [пользователь] Сохранить заметку. Если заметок уже LIMIT или больше — ошибка 400 «слишком много заметок».
  // [virtual]
  async add(input: NoteInputDto): Promise<NoteEntity> {
    __virtual__;
  }
  // [virtual]
  async list(): Promise<NoteEntity[]> {
    __virtual__;
  }
  async summary(): Promise<Summary> {
    let all: NoteEntity[] = await this.list();
    let total: number = 0;
    for (let i: number = 0; i < all.length; i++) {
      // длина текста заметки
      total += all[i].text.length;
    }
    let result: Summary = new Summary();
    result.count = all.length;
    result.average = average(total, all.length);
    return result;
  }
}
```

### Контроллер: роль `IController`

`example/src/modules/note/note.controller.llmc`

```c
import "./note.service.llmc";
import "../notes/dto/noteinput.dto.llmc";
import "../notes/entity/note.entity.llmc";
import "../notes/types/summary.types.llmc";
import "../../shared/roles.types.llmc";

// Путь notes
export class NoteController : IController {
  NoteService service;
  // POST без пути
  promise<NoteEntity> add(NoteInputDto input) { return this.service.add(input); }
  // GET без пути
  promise<NoteEntity[]> list() { return this.service.list(); }
  // GET summary, запрос открыт
  promise<Summary> summary() { return this.service.summary(); }
}
```

### Модуль и файл от LLM: `virtual class`, `virtual import`

`example/src/app.module.llmc`

```c
import "./modules/notes/notes.module.llmc";
import "./shared/roles.types.llmc";
// Контроллер HealthController: путь health, запрос GET без пути открыт, ответ { status: "ok" }
virtual import "./modules/health/health.controller";

// Корневой модуль: imports — NotesModule и подключение базы PostgreSQL, controllers — HealthController.
// host — POSTGRES_HOST (localhost), port — POSTGRES_PORT (5432),
// username — POSTGRES_USER (app), password — POSTGRES_PASSWORD, database — POSTGRES_DB (app).
export virtual class AppModule : IModule {}
```

### Точка входа

`example/src/main.llmc`

```c
import "./app.module.llmc";

// Приложение NestJS из AppModule с проверкой входных данных всех запросов.
// Порт сервиса — переменная окружения PORT, по умолчанию 3000.
virtual async promise<void> main() {}
```

## Команды

- Для перевода примера без LLM: `./llmc example typescript --no-llm`
- Для компиляции примера: `./llmc example typescript`
