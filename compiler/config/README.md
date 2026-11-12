# config: язык LLMC

| Файл | Назначение |
|---|---|
| `tokens.def` | словарь токенов: все слова языка |
| `grammar.def` | грамматика |
| `compiler.json` | пути к файлам, каталоги результата, настройки целевых языков |
| `ontologies/llmc.json` | онтология языка: смысл каждой лексемы `tokens.def` |
| `ontologies/<язык>/` | онтология целевого языка: [ontologies/README.md](ontologies/README.md) |

На LLMC пишут только лексемами `tokens.def` и именами, объявленными в проекте. Встроенных функций и библиотек в языке нет.

## Лексемы

| Вид | Запись | Пример |
|---|---|---|
| Комментарий | `//` до конца строки, `/* */` | `// пояснение` |
| Идентификатор | буква или `_`, далее буквы, цифры, `_` | `noteService` |
| Целое | десятичное или `0x` | `10`, `0xFF` |
| Вещественное | с точкой, порядком или суффиксом `f` | `1.5`, `1e-9`, `1.5f` |
| Символ | в одинарных кавычках | `'a'`, `'\n'` |
| Строка | в двойных кавычках | `"текст"` |

## Ключевые слова

| Группа | Слова |
|---|---|
| Типы | `char` `short` `int` `long` `float` `double` `signed` `unsigned` `void` `bool` `string` `date` `promise` |
| Объявления | `class` `interface` `enum` `typedef` |
| Модификаторы | `const` `static` `public` `private` `protected` `virtual` `override` `async` |
| Управление | `if` `else` `for` `while` `do` `switch` `case` `default` `break` `continue` `return` |
| Ошибки | `throw` `try` `catch` `finally` |
| Файлы | `import` `export` |
| Значения | `null` `true` `false` |

## Типы

| Тип | Значение | Операции |
|---|---|---|
| `string` | строка | `+` — соединение, `sizeof(s)` — длина, `s[i]` — символ, `(string) x` — преобразование |
| `bool` | `true` или `false` | `&&` `\|\|` `!` |
| `date` | момент времени в UTC | `new date()` — сейчас; `(string) d` — запись ISO 8601; `(date) "2026-01-31T10:00:00Z"` — разбор; `(long) d` — миллисекунды |
| `promise<T>` | результат асинхронной операции | `await x` внутри функции `async` |
| `T[]` | массив | `a[i]`, `sizeof(a)`, `{1, 2}`, `new T[n]` |
| `T?` | значение или `null` | |

## Разделители

| Знак | Назначение |
|---|---|
| `( )` | параметры, аргументы, условие, группа в выражении |
| `[ ]` | массив `T[]`, элемент `a[i]` |
| `{ }` | тело объявления, блок, инициализатор `{1, 2}` |
| `;` | конец объявления и оператора |
| `,` | список параметров, аргументов, значений |
| `.` | член объекта `a.b` |

## Операторы по приоритетам

От высшего к низшему. В одной строке приоритет равный.

| № | Операторы | Назначение | Порядок |
|---|---|---|---|
| 1 | `x++` `x--` `f()` `a[i]` `a.b` | постфиксные | слева направо |
| 2 | `++x` `--x` `!` `~` `-x` `+x` `await` `(тип)` `sizeof` `new` | унарные | справа налево |
| 3 | `*` `/` `%` | умножение | слева направо |
| 4 | `+` `-` | сложение | слева направо |
| 5 | `<<` `>>` | сдвиг | слева направо |
| 6 | `<` `>` `<=` `>=` `is` `as` | сравнение, проверка и приведение типа | слева направо |
| 7 | `==` `!=` | равенство | слева направо |
| 8 | `&` | побитовое И | слева направо |
| 9 | `^` | побитовое исключающее ИЛИ | слева направо |
| 10 | `\|` | побитовое ИЛИ | слева направо |
| 11 | `&&` | логическое И | слева направо |
| 12 | `\|\|` | логическое ИЛИ | слева направо |
| 13 | `? :` | выбор | справа налево |
| 14 | `=` `+=` `-=` `*=` `/=` `%=` `<<=` `>>=` `&=` `^=` `\|=` | присваивание | справа налево |
| 15 | `,` | последовательность в `for` | слева направо |

Слова-операторы: `sizeof` `as` `is` `new` `delete` `this` `base` `await`.

## Грамматика

| Конструкция | Запись |
|---|---|
| Импорт файла LLMC | `import "./notes.functions.llmc";` |
| Ссылка на любой файл проекта | `import "../../text.txt";` |
| Экспорт | `export` перед объявлением |
| Тип | `int`, `unsigned long`, `string`, `NoteEntity`, `ICRUD<NoteEntity>`, `int[]`, `Color?` |
| Переменная | `const int LIMIT = 100;` |
| Новое имя типа | `typedef int[] Sizes;` |
| Перечисление | `enum Color { RED, GREEN = 5 }` |
| Интерфейс | `interface ICRUD<Entity> { bool create(Entity entity); }`, без тела: `interface IService;` |
| Класс | `class Circle : Figure, public Shape { поля, конструктор, методы }`, без тела: `class Mark;` |
| Конструктор | `Circle(double r) : base("circle") { ... }` |
| Метод, функция | `double area() { ... }`, `async promise<int> load() { ... }` |
| Операторы | `if` `else`, `for`, `while`, `do while`, `switch`, `return`, `break`, `continue`, `throw`, `try` `catch` `finally`, `delete`, блок `{ }` |
| Приведение | `(int) x`, `(string) x` — к встроенному типу, `x as Circle` — к классу |
| Создание | `new Circle(1.0)`, `new int[10]`, `new date()` |

Ограничения: одна переменная в объявлении; члены класса без модификатора — `public`; у `try` один `catch`; `await` — только в функции `async`.

## virtual

`virtual` перед объявлением значит: эту сущность создаёт LLM. Комментарий над объявлением — задача для LLM.

| Запись | Что создаёт LLM |
|---|---|
| `virtual import "./dto/user.dto";` | файл целевого языка по этому пути |
| `virtual const float PI;` | значение |
| `virtual int middle(int[] array) {}` | тело функции или метода |
| `virtual class NoteController {}` | оформление класса и недостающие члены |
| `virtual class map;`, `virtual interface IService;` | объявление целиком |

Код без `virtual` переводит компилятор, LLM его не меняет.

## Роли классов

Библиотеки целевого языка в коде не называются. Программист объявляет интерфейс-роль с комментарием, а классы наследуют его: по этой связи LLM оформляет класс.

```c
// Работа с сущностями базы данных
virtual interface IDBEntity;

// Таблица users
class UserEntity : IDBEntity {
  int id;
  string name;
}

interface ICRUD<Entity> {
  bool create(Entity entity);
  bool remove(int id);
}

// Работа с сервисами, которые получают данные от контроллеров
virtual interface IService;

class UserService : IService, ICRUD<UserEntity> {
  virtual bool create(UserEntity user) {}
  virtual bool remove(int id) {}
}
```

Свои структуры данных объявляются так же: `// Хеш-таблица` и `virtual class map;`.

## Тесты

Файл `<имя>.test.llmc`: каждая функция `bool имя()` без параметров и без `export` — тест, он пройден при `true`; комментарий над функцией — название.

```c
import "./notes.functions.llmc";

// половина семи — целое три
bool halfOfSeven() { return half(7) == 3; }
```

## Полный пример

```c
typedef int[] Sizes;

export enum Kind { CIRCLE = 1, SQUARE }

export class Point {
  double x;
  double y;
}

export interface Shape {
  double area();
  string name();
}

// Базовая фигура
export class Figure : Shape {
  protected static int count = 0;
  protected string label;

  Figure(string label) {
    this.label = label;
    Figure.count++;
  }

  string name() { return this.label; }
  double area() { return 0.0; }
}

export class Circle : Figure {
  private double radius;

  Circle(double radius) : base("circle") { this.radius = radius; }

  override double area() { return 3.14159 * this.radius * this.radius; }
  override string name() { return base.name() + "!"; }
}

// Сторона квадрата той же площади
export virtual double sideOfEqualSquare(Shape shape) {}

export async promise<string> stamp(promise<date> moment) {
  date value = await moment;
  return "создано " + (string) value;
}

export int classify(Shape shape, Sizes sizes) {
  int bits = (sizes[0] << 2) | (sizes[1] >> 1) & 0xFF ^ ~3;
  long total = 0;
  bits %= 7;
  do {
    total += bits;
    bits--;
  } while (bits > 0);
  while (total > 100) total /= 2;
  for (int i = 0; i < sizeof(sizes); i++) {
    if (sizes[i] == 0) continue;
    total += sizes[i];
  }
  switch (bits) {
    case 0:
      total = 1;
      break;
    default:
      total = sizeof(long);
  }
  try {
    if (shape is Circle && !(total == 0)) {
      Circle circle = shape as Circle;
      double[] areas = new double[3];
      areas[0] = circle.area();
      float small = (float) areas[0];
      char letter = 'x';
      int[] sides = {1, 2, 3};
      throw new Circle(1.5f);
    } else if (total < 0) {
      return -1;
    }
  } catch (Figure error) {
    total = 0;
  } finally {
    total++;
  }
  return total > 10 ? 10 : (int) total;
}
```
