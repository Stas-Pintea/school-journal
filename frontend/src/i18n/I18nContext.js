
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const I18nContext = createContext(null);

const STORAGE_KEY = 'app_lang';
const SUPPORTED_LANGS = ['ru', 'ro'];

export const studentsLocalI18n = {
  networkError: { ru: 'Ошибка сети', ro: 'Eroare de retea' },
  enterFullName: { ru: 'Введите ФИО', ro: 'Introduceti numele complet' },
  chooseClass: { ru: 'Выберите класс', ro: 'Selectati clasa' },
  deleteConfirm: { ru: 'Удалить ученика?', ro: 'Stergeti elevul?' },
  createFailed: { ru: 'Не удалось создать ученика: {msg}', ro: 'Nu s-a putut crea elevul: {msg}' },
  deleteFailed: { ru: 'Не удалось удалить ученика: {msg}', ro: 'Nu s-a putut sterge elevul: {msg}' },
  title: { ru: 'Ученики', ro: 'Elevi' },
  total: { ru: 'Всего: {count}', ro: 'Total: {count}' },
  add: { ru: '+ Добавить ученика', ro: '+ Adauga elev' },
  roleInfo: { ru: 'Ваша роль {role}. Изменение учеников доступно только ADMIN.', ro: 'Rolul dvs. este {role}. Modificarea elevilor este disponibila doar pentru ADMIN.' },
  loadError: { ru: 'Ошибка загрузки: {error}', ro: 'Eroare la incarcare: {error}' },
  class: { ru: 'Класс', ro: 'Clasa' },
  fullName: { ru: 'ФИО', ro: 'Nume complet' },
  age: { ru: 'Возраст', ro: 'Varsta' },
  status: { ru: 'Статус', ro: 'Status' },
  actions: { ru: 'Действия', ro: 'Actiuni' },
  open: { ru: 'Открыть', ro: 'Deschide' },
  edit: { ru: 'Редактировать', ro: 'Editeaza' },
  delete: { ru: 'Удалить', ro: 'Sterge' },
  none: { ru: 'Пока нет учеников', ro: 'Inca nu exista elevi' },
  addTitle: { ru: 'Добавить ученика', ro: 'Adauga elev' },
  fullNameRequired: { ru: 'ФИО *', ro: 'Nume complet *' },
  fullNamePh: { ru: 'Иванов Иван Иванович', ro: 'Ionescu Ion' },
  classRequired: { ru: 'Класс *', ro: 'Clasa *' },
  photo: { ru: 'Фото', ro: 'Foto' },
  birthDate: { ru: 'Дата рождения', ro: 'Data nasterii' },
  phone: { ru: 'Телефон', ro: 'Telefon' },
  address: { ru: 'Адрес', ro: 'Adresa' },
  parents: { ru: 'Родители', ro: 'Parinti' },
  addParent: { ru: '+ Добавить родителя', ro: '+ Adauga parinte' },
  parentsHint: { ru: 'Заполните ФИО, чтобы родитель сохранился. Пустые блоки не отправляются.', ro: 'Completati numele complet pentru a salva parintele. Blocurile goale nu se trimit.' },
  parent: { ru: 'Родитель', ro: 'Parinte' },
  type: { ru: '???', ro: 'Tip' },
  workplace: { ru: 'Место работы', ro: 'Loc de munca' },
  cancel: { ru: 'Отмена', ro: 'Anuleaza' },
  save: { ru: 'Сохранить', ro: 'Salveaza' },
  active: { ru: 'Активный', ro: 'Activ' },
  inactive: { ru: 'Неактивный', ro: 'Inactiv' },
  academicLeave: { ru: 'Академ. отпуск', ro: 'Concediu academic' },
  mother: { ru: 'Мать', ro: 'Mama' },
  father: { ru: 'Отец', ro: 'Tata' },
  grandmother: { ru: 'Бабушка', ro: 'Bunica' },
  grandfather: { ru: 'Дедушка', ro: 'Bunic' },
  other: { ru: 'Другое', ro: 'Altul' },
  sortClass: { ru: 'Сортировать по классу', ro: 'Sorteaza dupa clasa' },
  sortName: { ru: 'Сортировать по имени', ro: 'Sorteaza dupa nume' },
  sortAge: { ru: 'Сортировать по возрасту', ro: 'Sorteaza dupa varsta' },
  sortStatus: { ru: 'Сортировать по статусу', ro: 'Sorteaza dupa status' },
  adminOnly: { ru: 'Только ADMIN', ro: 'Doar ADMIN' },
  searchLabel: { ru: 'Поиск ученика', ro: 'Cauta elev' },
  searchPlaceholder: { ru: 'ФИО ученика...', ro: 'Nume elev...' },
  ageYearsLabel: { ru: 'Возраст (лет)', ro: 'Varsta (ani)' },
  ageFromLabel: { ru: 'Возраст от', ro: 'Varsta de la' },
  ageToLabel: { ru: 'Возраст до', ro: 'Varsta pana la' },
  allClassesLabel: { ru: 'Все классы', ro: 'Toate clasele' },
  allStatusesLabel: { ru: 'Все статусы', ro: 'Toate statusurile' },
  clearFiltersLabel: { ru: 'Сбросить', ro: 'Reseteaza' },
  foundLabel: { ru: 'Найдено: {count}', ro: 'Gasite: {count}' },
};

export const journalLocalI18n = {
  "loadFailed": {
    "ru": "Не удалось загрузить журнал",
    "ro": "Nu s-a putut incarca jurnalul"
  },
  "taskNameReq": {
    "ru": "Введите имя задачи",
    "ro": "Introduceti numele sarcinii"
  },
  "dateReq": {
    "ru": "Выберите дату",
    "ro": "Selectati data"
  },
  "semesterReq": {
    "ru": "Семестр должен быть б или в",
    "ro": "Semestrul trebuie sa fie 1 sau 2"
  },
  "deleteTaskConfirm": {
    "ru": "Удалить задачу? Все оценки по этой задаче тоже удалятся.",
    "ro": "Stergeti sarcina? Toate notele aferente se vor sterge."
  },
  "loading": {
    "ru": "Загрузка...",
    "ro": "Se incarca..."
  },
  "journal": {
    "ru": "Журнал",
    "ro": "Jurnal"
  },
  "backToClass": {
    "ru": "Назад к классу",
    "ro": "Inapoi la clasa"
  },
  "student": {
    "ru": "Ученик",
    "ro": "Elev"
  },
  "sunday": {
    "ru": "Воскресенье",
    "ro": "Duminica"
  },
  "semester": {
    "ru": "Семестр",
    "ro": "Semestru"
  },
  "exam": {
    "ru": "Экз",
    "ro": "Ex"
  },
  "sem1": {
    "ru": "Семб",
    "ro": "Sem1"
  },
  "sem2": {
    "ru": "Семв",
    "ro": "Sem2"
  },
  "year": {
    "ru": "Год",
    "ro": "An"
  },
  "noStudents": {
    "ru": "В классе нет учеников",
    "ro": "Nu exista elevi in clasa"
  },
  "hint": {
    "ru": "Пропуски (дни): только a или m. Задачи: только 1-10 или m. Очистка ячейки удаляет запись.",
    "ro": "Absente (zile): doar a sau m. Sarcini: doar 1-10 sau m. Curatarea celulei sterge inregistrarea."
  },
  "roleInfo": {
    "ru": "Ваша роль: {role}. Управление задачами доступно только ADMIN.",
    "ro": "Rolul dvs. este {role}. Gestionarea sarcinilor este disponibila doar pentru ADMIN."
  },
  "tasksTitle": {
    "ru": "Добавленные задачи",
    "ro": "Sarcini adaugate"
  },
  "total": {
    "ru": "Всего записей: {count}",
    "ro": "Total: {count}"
  },
  "adminOnly": {
    "ru": "Только ADMIN может управлять задачами",
    "ro": "Doar ADMIN poate gestiona sarcinile"
  },
  "add": {
    "ru": "+ Добавить",
    "ro": "+ Adauga"
  },
  "task": {
    "ru": "Задача",
    "ro": "Sarcina"
  },
  "description": {
    "ru": "Описание",
    "ro": "Descriere"
  },
  "actions": {
    "ru": "Действия",
    "ro": "Actiuni"
  },
  "jumpToColumn": {
    "ru": "Открыть месяц и перейти к колонке",
    "ro": "Deschide luna si mergi la coloana"
  },
  "edit": {
    "ru": "Редактировать",
    "ro": "Editeaza"
  },
  "deleteWithGrades": {
    "ru": "Удалить (с оценками)",
    "ro": "Sterge (cu note)"
  },
  "noTasks": {
    "ru": "Пока задач нет - нажми \"+ Добавить\"",
    "ro": "Inca nu exista sarcini - apasa \"+ Adauga\""
  },
  "addTask": {
    "ru": "Добавить задачу",
    "ro": "Adauga sarcina"
  },
  "editTask": {
    "ru": "Редактировать задачу",
    "ro": "Editeaza sarcina"
  },
  "date": {
    "ru": "Дата",
    "ro": "Data"
  },
  "taskName": {
    "ru": "Имя задачи",
    "ro": "Nume sarcina"
  },
  "saveHint": {
    "ru": "После сохранения появится колонка сразу после выбранной даты.",
    "ro": "Dupa salvare apare o coloana imediat dupa data selectata."
  },
  "cancel": {
    "ru": "Отмена",
    "ro": "Anuleaza"
  },
  "save": {
    "ru": "Сохранить",
    "ro": "Salveaza"
  }
};

export const classEditLocalI18n = {
  "loadFailed": {
    "ru": "Не удалось загрузить класс для редактирования",
    "ro": "Nu s-a putut incarca clasa pentru editare"
  },
  "nameRequired": {
    "ru": "Введите название класса",
    "ro": "Introduceti denumirea clasei"
  },
  "title": {
    "ru": "Редактирование класса",
    "ro": "Editare clasa"
  },
  "cancel": {
    "ru": "Отмена",
    "ro": "Anuleaza"
  },
  "save": {
    "ru": "Сохранить",
    "ro": "Salveaza"
  },
  "name": {
    "ru": "Название *",
    "ro": "Denumire *"
  },
  "namePh": {
    "ru": "Например: 1-А",
    "ro": "De exemplu: 1-A"
  },
  "subjects": {
    "ru": "Предметы (опционально)",
    "ro": "Materii (optional)"
  },
  "subjectsHint": {
    "ru": "Отметьте нужные предметы.",
    "ro": "Bifeaza materiile necesare."
  }
};

export const classViewLocalI18n = {
  "loadFailed": {
    "ru": "Не удалось загрузить класс",
    "ro": "Nu s-a putut incarca clasa"
  },
  "loading": {
    "ru": "Загрузка...",
    "ro": "Se incarca..."
  },
  "classSuffix": {
    "ru": "Класс",
    "ro": "Clasa"
  },
  "back": {
    "ru": "Назад",
    "ro": "Inapoi"
  },
  "print": {
    "ru": "Печать",
    "ro": "Tipareste"
  },
  "edit": {
    "ru": "Редактировать",
    "ro": "Editeaza"
  },
  "classSubjects": {
    "ru": "Предметы класса",
    "ro": "Materiile clasei"
  },
  "noSubjects": {
    "ru": "Предметы для этого класса не назначены",
    "ro": "Nu sunt materii atribuite acestei clase"
  },
  "classStudents": {
    "ru": "Ученики класса",
    "ro": "Elevi in clasa"
  },
  "fullName": {
    "ru": "ФИО",
    "ro": "Nume complet"
  },
  "status": {
    "ru": "Статус",
    "ro": "Status"
  },
  "exam": {
    "ru": "Экз",
    "ro": "Ex"
  },
  "semester1": {
    "ru": "Семб",
    "ro": "Sem1"
  },
  "semester2": {
    "ru": "Семв",
    "ro": "Sem2"
  },
  "year": {
    "ru": "Год",
    "ro": "An"
  },
  "noStudents": {
    "ru": "В этом классе пока нет учеников",
    "ro": "In aceasta clasa nu exista elevi"
  },
  "periodLabel": {
    "ru": "Период успеваемости",
    "ro": "Perioada performantei"
  }
};

export const studentViewLocalI18n = {
  "networkError": {
    "ru": "Ошибка сети",
    "ro": "Eroare de retea"
  },
  "loadFailed": {
    "ru": "Не удалось загрузить ученика: {msg}",
    "ro": "Nu s-a putut incarca elevul: {msg}"
  },
  "loading": {
    "ru": "Загрузка...",
    "ro": "Se incarca..."
  },
  "title": {
    "ru": "Ученик",
    "ro": "Elev"
  },
  "back": {
    "ru": "Назад",
    "ro": "Inapoi"
  },
  "edit": {
    "ru": "Редактировать",
    "ro": "Editeaza"
  },
  "class": {
    "ru": "Класс",
    "ro": "Clasa"
  },
  "status": {
    "ru": "Статус",
    "ro": "Status"
  },
  "phone": {
    "ru": "Телефон",
    "ro": "Telefon"
  },
  "email": {
    "ru": "Email",
    "ro": "Email"
  },
  "birthDate": {
    "ru": "Дата рождения",
    "ro": "Data nasterii"
  },
  "address": {
    "ru": "Адрес",
    "ro": "Adresa"
  },
  "parents": {
    "ru": "Родители",
    "ro": "Parinti"
  },
  "fullName": {
    "ru": "ФИО",
    "ro": "Nume complet"
  },
  "type": {
    "ru": "???",
    "ro": "Tip"
  },
  "workplace": {
    "ru": "Место работы",
    "ro": "Loc de munca"
  },
  "noParents": {
    "ru": "Родители не указаны",
    "ro": "Nu sunt parinti specificati"
  },
  "performance": {
    "ru": "Успеваемость",
    "ro": "Reusita"
  },
  "period": {
    "ru": "Период",
    "ro": "Perioada"
  },
  "subject": {
    "ru": "Предмет",
    "ro": "Materie"
  },
  "exam": {
    "ru": "Экз",
    "ro": "Ex"
  },
  "semester1": {
    "ru": "Сем б",
    "ro": "Sem 1"
  },
  "semester2": {
    "ru": "Сем в",
    "ro": "Sem 2"
  },
  "year": {
    "ru": "Годовая",
    "ro": "Anual"
  },
  "noPerformance": {
    "ru": "Нет итоговых оценок за этот период",
    "ro": "Nu exista note finale pentru aceasta perioada"
  }
};

export const studentEditLocalI18n = {
  "title": {
    "ru": "Редактирование ученика",
    "ro": "Editare elev"
  },
  "cancel": {
    "ru": "Отмена",
    "ro": "Anuleaza"
  },
  "save": {
    "ru": "Сохранить",
    "ro": "Salveaza"
  },
  "fullName": {
    "ru": "ФИО *",
    "ro": "Nume complet *"
  },
  "cls": {
    "ru": "Класс *",
    "ro": "Clasa *"
  },
  "selectClass": {
    "ru": "Выберите класс",
    "ro": "Selecteaza clasa"
  },
  "photo": {
    "ru": "Фото (заменить)",
    "ro": "Foto (inlocuieste)"
  },
  "status": {
    "ru": "Статус",
    "ro": "Status"
  },
  "birthDate": {
    "ru": "Дата рождения",
    "ro": "Data nasterii"
  },
  "phone": {
    "ru": "Телефон",
    "ro": "Telefon"
  },
  "email": {
    "ru": "Email",
    "ro": "Email"
  },
  "address": {
    "ru": "Адрес",
    "ro": "Adresa"
  },
  "parents": {
    "ru": "Родители",
    "ro": "Parinti"
  },
  "addParent": {
    "ru": "+ Добавить родителя",
    "ro": "+ Adauga parinte"
  },
  "parent": {
    "ru": "Родитель",
    "ro": "Parinte"
  },
  "remove": {
    "ru": "Удалить",
    "ro": "Elimina"
  },
  "type": {
    "ru": "???",
    "ro": "Tip"
  },
  "workplace": {
    "ru": "Место работы",
    "ro": "Loc de munca"
  },
  "enterName": {
    "ru": "Введите ФИО",
    "ro": "Introduceti numele complet"
  },
  "chooseClass": {
    "ru": "Выберите класс",
    "ro": "Selectati clasa"
  },
  "network": {
    "ru": "Ошибка сети",
    "ro": "Eroare de retea"
  },
  "loadFailed": {
    "ru": "Не удалось загрузить ученика: {msg}",
    "ro": "Nu s-a putut incarca elevul: {msg}"
  },
  "saveFailed": {
    "ru": "Не удалось сохранить ученика: {msg}",
    "ro": "Nu s-a putut salva elevul: {msg}"
  }
};

export const loginLocalI18n = {
  "title": {
    "ru": "Вход",
    "ro": "Autentificare"
  },
  "userOrEmail": {
    "ru": "Логин или Email",
    "ro": "Utilizator sau Email"
  },
  "password": {
    "ru": "Пароль",
    "ro": "Parola"
  },
  "submit": {
    "ru": "Войти",
    "ro": "Intra"
  },
  "failed": {
    "ru": "Не удалось войти",
    "ro": "Autentificare esuata"
  }
};

export const subjectViewLocalI18n = {
  "loadFailed": {
    "ru": "Не удалось загрузить предмет",
    "ro": "Nu s-a putut incarca materia"
  },
  "loading": {
    "ru": "Загрузка...",
    "ro": "Se incarca..."
  },
  "title": {
    "ru": "Предмет",
    "ro": "Materie"
  },
  "back": {
    "ru": "Назад",
    "ro": "Inapoi"
  },
  "edit": {
    "ru": "Редактировать",
    "ro": "Editeaza"
  },
  "assignments": {
    "ru": "Назначений",
    "ro": "Repartizari"
  },
  "classes": {
    "ru": "Классы",
    "ro": "Clase"
  },
  "teachers": {
    "ru": "Преподаватели",
    "ro": "Profesori"
  },
  "assignmentDetails": {
    "ru": "Детали назначений",
    "ro": "Detalii repartizari"
  },
  "noClassAssigned": {
    "ru": "Пока не назначен ни одному классу",
    "ro": "Inca nu este atribuita niciunei clase"
  },
  "noTeacherAssigned": {
    "ru": "Пока не назначен ни одному учителю",
    "ro": "Inca nu este atribuita niciunui profesor"
  },
  "class": {
    "ru": "Класс",
    "ro": "Clasa"
  },
  "teacher": {
    "ru": "Учитель",
    "ro": "Profesor"
  },
  "hours": {
    "ru": "Часы",
    "ro": "Ore"
  },
  "none": {
    "ru": "Назначений нет",
    "ro": "Nu exista repartizari"
  }
};

export const subjectEditLocalI18n = {
  "networkError": {
    "ru": "Ошибка сети",
    "ro": "Eroare de retea"
  },
  "loadFailed": {
    "ru": "Не удалось загрузить предмет для редактирования: {msg}",
    "ro": "Nu s-a putut incarca materia pentru editare: {msg}"
  },
  "saveFailed": {
    "ru": "Не удалось сохранить: {msg}",
    "ro": "Nu s-a putut salva: {msg}"
  },
  "nameRequired": {
    "ru": "Введите название предмета",
    "ro": "Introduceti denumirea materiei"
  },
  "title": {
    "ru": "Редактирование предмета",
    "ro": "Editare materie"
  },
  "cancel": {
    "ru": "Отмена",
    "ro": "Anuleaza"
  },
  "save": {
    "ru": "Сохранить",
    "ro": "Salveaza"
  },
  "name": {
    "ru": "Название *",
    "ro": "Denumire *"
  },
  "placeholder": {
    "ru": "Например: Математика",
    "ro": "De exemplu: Matematica"
  }
};

export const assignmentViewLocalI18n = {
  "notFound": {
    "ru": "Назначение не найдено",
    "ro": "Repartizarea nu a fost gasita"
  },
  "loadFailed": {
    "ru": "Не удалось загрузить назначение",
    "ro": "Nu s-a putut incarca repartizarea"
  },
  "loading": {
    "ru": "Загрузка...",
    "ro": "Se incarca..."
  },
  "title": {
    "ru": "Назначение",
    "ro": "Repartizare"
  },
  "back": {
    "ru": "Назад",
    "ro": "Inapoi"
  },
  "edit": {
    "ru": "Редактировать",
    "ro": "Editeaza"
  },
  "teacher": {
    "ru": "Учитель",
    "ro": "Profesor"
  },
  "class": {
    "ru": "Класс",
    "ro": "Clasa"
  },
  "subject": {
    "ru": "Предмет",
    "ro": "Materie"
  },
  "hours": {
    "ru": "Часы",
    "ro": "Ore"
  }
};

export const assignmentEditLocalI18n = {
  "notFound": {
    "ru": "Назначение не найдено",
    "ro": "Repartizarea nu a fost gasita"
  },
  "loadFailed": {
    "ru": "Не удалось загрузить данные для редактирования",
    "ro": "Nu s-au putut incarca datele pentru editare"
  },
  "chooseAll": {
    "ru": "Выберите учителя, класс и предмет",
    "ro": "Selecteaza profesorul, clasa si materia"
  },
  "invalidHours": {
    "ru": "Введите корректное количество часов",
    "ro": "Introduce un numar valid de ore"
  },
  "title": {
    "ru": "Редактирование назначения",
    "ro": "Editare repartizare"
  },
  "cancel": {
    "ru": "Отмена",
    "ro": "Anuleaza"
  },
  "save": {
    "ru": "Сохранить",
    "ro": "Salveaza"
  },
  "teacher": {
    "ru": "Учитель",
    "ro": "Profesor"
  },
  "class": {
    "ru": "Класс",
    "ro": "Clasa"
  },
  "subject": {
    "ru": "Предмет",
    "ro": "Materie"
  },
  "hours": {
    "ru": "Часы",
    "ro": "Ore"
  },
  "chooseTeacher": {
    "ru": "Выберите учителя",
    "ro": "Selecteaza profesorul"
  },
  "chooseClass": {
    "ru": "Выберите класс",
    "ro": "Selecteaza clasa"
  },
  "chooseSubject": {
    "ru": "Выберите предмет",
    "ro": "Selecteaza materia"
  },
  "hoursPh": {
    "ru": "Например: 6",
    "ro": "De exemplu: 6"
  },
  "hint": {
    "ru": "Назначение связывает учителя, класс и предмет и задает количество часов.",
    "ro": "Repartizarea leaga profesorul, clasa si materia si stabileste numarul de ore."
  }
};

const translations = {
  "navbar": {
    "classes": {
      "ru": "Классы",
      "ro": "Clase"
    },
    "students": {
      "ru": "Ученики",
      "ro": "Elevi"
    },
    "teachers": {
      "ru": "Учителя",
      "ro": "Profesori"
    },
    "subjects": {
      "ru": "Предметы",
      "ro": "Materii"
    },
    "assignments": {
      "ru": "Назначения",
      "ro": "Repartizări"
    },
    "calendar": {
      "ru": "Учебный календарь",
      "ro": "Calendar academic"
    },
    "logout": {
      "ru": "Выйти",
      "ro": "Ieșire"
    },
    "login": {
      "ru": "Вход",
      "ro": "Autentificare"
    },
    "switchLanguage": {
      "ru": "Сменить язык",
      "ro": "Schimbă limba"
    }
  },
  "teacherCommon": {
    "networkError": {
      "ru": "Ошибка сети",
      "ro": "Eroare de retea"
    },
    "open": {
      "ru": "Открыть",
      "ro": "Deschide"
    },
    "edit": {
      "ru": "Редактировать",
      "ro": "Editează"
    },
    "delete": {
      "ru": "Удалить",
      "ro": "Șterge"
    },
    "cancel": {
      "ru": "Отмена",
      "ro": "Anulează"
    },
    "save": {
      "ru": "Сохранить",
      "ro": "Salvează"
    },
    "loading": {
      "ru": "Загрузка...",
      "ro": "Se încarcă..."
    }
  },
  "teachers": {
    "title": {
      "ru": "Учителя",
      "ro": "Profesori"
    },
    "total": {
      "ru": "Всего: {count}",
      "ro": "Total: {count}"
    },
    "addTeacher": {
      "ru": "+ Добавить учителя",
      "ro": "+ Adaugă profesor"
    },
    "roleInfo": {
      "ru": "Ваша роль: {role}. Действия управления учителями скрыты.",
      "ro": "Rolul tău este: {role}. AcИ›iunile de administrare a profesorilor sunt ascunse."
    },
    "loadFailed": {
      "ru": "Не удалось загрузить учителей: {msg}",
      "ro": "Nu s-au putut încărca profesorii: {msg}"
    },
    "createFailed": {
      "ru": "Не удалось создать учителя: {msg}",
      "ro": "Nu s-a putut crea profesorul: {msg}"
    },
    "deleteFailed": {
      "ru": "Не удалось удалить учителя: {msg}",
      "ro": "Nu s-a putut șterge profesorul: {msg}"
    },
    "deleteConfirm": {
      "ru": "Удалить учителя?",
      "ro": "Ștergi profesorul?"
    },
    "enterFullName": {
      "ru": "Введите ФИО",
      "ro": "Introdu numele complet"
    },
    "enterEmail": {
      "ru": "Введите email",
      "ro": "Introdu email-ul"
    },
    "passwordMin": {
      "ru": "Пароль должен быть не менее 6 символов",
      "ro": "Parola trebuie să aibă minim 6 caractere"
    },
    "noTeachers": {
      "ru": "Пока нет учителей",
      "ro": "ГЋncă nu există profesori"
    },
    "tableFullName": {
      "ru": "ФИО",
      "ro": "Nume complet"
    },
    "tableHours": {
      "ru": "Часы",
      "ro": "Ore"
    },
    "tableStatus": {
      "ru": "Статус",
      "ro": "Status"
    },
    "tableActions": {
      "ru": "Действия",
      "ro": "AcИ›iuni"
    },
    "modalTitle": {
      "ru": "Добавить учителя",
      "ro": "Adaugă profesor"
    },
    "fullName": {
      "ru": "ФИО *",
      "ro": "Nume complet *"
    },
    "photo": {
      "ru": "Фото",
      "ro": "Foto"
    },
    "birthDate": {
      "ru": "Дата рождения",
      "ro": "Data nașterii"
    },
    "phone": {
      "ru": "Телефон",
      "ro": "Telefon"
    },
    "email": {
      "ru": "Email *",
      "ro": "Email *"
    },
    "password": {
      "ru": "Пароль *",
      "ro": "Parolă *"
    },
    "status": {
      "ru": "Статус",
      "ro": "Status"
    },
    "address": {
      "ru": "Адрес",
      "ro": "Adresă"
    },
    "active": {
      "ru": "Активный",
      "ro": "Activ"
    }
  },
  "teacherView": {
    "title": {
      "ru": "Учитель",
      "ro": "Profesor"
    },
    "back": {
      "ru": "Назад",
      "ro": "ГЋnapoi"
    },
    "ownProfileOnly": {
      "ru": "Вы можете редактировать только свой профиль.",
      "ro": "PoИ›i edita doar propriul profil."
    },
    "roleInfo": {
      "ru": "Ваша роль: {role}. Действие редактирования учителя скрыто.",
      "ro": "Rolul tău este: {role}. AcИ›iunea de editare a profesorului este ascunsă."
    },
    "statusTotal": {
      "ru": "??????: {status} ? ????? ?????: {hours}",
      "ro": "Status: {status} ? Ore totale: {hours}"
    },
    "phone": {
      "ru": "Телефон",
      "ro": "Telefon"
    },
    "email": {
      "ru": "Email",
      "ro": "Email"
    },
    "birthDate": {
      "ru": "Дата рождения",
      "ro": "Data nașterii"
    },
    "address": {
      "ru": "Адрес",
      "ro": "Adresă"
    },
    "assignments": {
      "ru": "Назначения",
      "ro": "Repartizări"
    },
    "class": {
      "ru": "Класс",
      "ro": "Clasă"
    },
    "subject": {
      "ru": "Предмет",
      "ro": "Materie"
    },
    "hours": {
      "ru": "Часы",
      "ro": "Ore"
    },
    "noAssignments": {
      "ru": "Назначений нет",
      "ro": "Nu există repartizări"
    },
    "loadFailed": {
      "ru": "Не удалось загрузить учителя: {msg}",
      "ro": "Nu s-a putut încărca profesorul: {msg}"
    }
  },
  "teacherEdit": {
    "title": {
      "ru": "Редактирование учителя",
      "ro": "Editare profesor"
    },
    "ownProfileOnly": {
      "ru": "Вы можете редактировать только свой профиль учителя.",
      "ro": "PoИ›i edita doar propriul profil de profesor."
    },
    "fullName": {
      "ru": "ФИО *",
      "ro": "Nume complet *"
    },
    "photoReplace": {
      "ru": "Фото (заменить)",
      "ro": "Foto (înlocuiește)"
    },
    "birthDate": {
      "ru": "Дата рождения",
      "ro": "Data nașterii"
    },
    "phone": {
      "ru": "Телефон",
      "ro": "Telefon"
    },
    "email": {
      "ru": "Email",
      "ro": "Email"
    },
    "password": {
      "ru": "Новый пароль",
      "ro": "Parolă nouă"
    },
    "keepPassword": {
      "ru": "Оставьте пустым, чтобы не менять пароль",
      "ro": "Lasă gol pentru a păstra parola curentă"
    },
    "address": {
      "ru": "Адрес",
      "ro": "Adresă"
    },
    "status": {
      "ru": "Статус",
      "ro": "Status"
    },
    "enterFullName": {
      "ru": "Введите ФИО",
      "ro": "Introdu numele complet"
    },
    "passwordMin": {
      "ru": "Пароль должен быть не менее 6 символов",
      "ro": "Parola trebuie să aibă minim 6 caractere"
    },
    "loadFailed": {
      "ru": "Не удалось загрузить учителя: {msg}",
      "ro": "Nu s-a putut încărca profesorul: {msg}"
    },
    "saveFailed": {
      "ru": "Не удалось сохранить учителя: {msg}",
      "ro": "Nu s-a putut salva profesorul: {msg}"
    },
    "passwordConfirm": {
      "ru": "Подтвердите пароль",
      "ro": "Confirma parola"
    },
    "passwordMismatch": {
      "ru": "Пароли не совпадают",
      "ro": "Parolele nu coincid"
    },
    "statusAdminOnly": {
      "ru": "Статус может менять только сфэщю или замЮ админа",
      "ro": "Statusul poate fi schimbat doar de ADMIN sau adjunct"
    }
  },
  "dashboard": {
    "title": {
      "ru": "Школьная система",
      "ro": "Sistem școlar"
    },
    "classes": {
      "ru": "Классы",
      "ro": "Clase"
    },
    "students": {
      "ru": "Ученики",
      "ro": "Elevi"
    },
    "teachers": {
      "ru": "Учителя",
      "ro": "Profesori"
    },
    "subjects": {
      "ru": "Предметы",
      "ro": "Materii"
    },
    "assignments": {
      "ru": "Назначения",
      "ro": "Repartizări"
    },
    "totalHours": {
      "ru": "Всего часов",
      "ro": "Total ore"
    },
    "calendar": {
      "ru": "Учебный календарь",
      "ro": "Calendar academic"
    },
    "open": {
      "ru": "Открыть",
      "ro": "Deschide"
    },
    "loading": {
      "ru": "Загрузка...",
      "ro": "Se încarcă..."
    },
    "loadFailed": {
      "ru": "Не удалось загрузить статистику: {msg}",
      "ro": "Nu s-a putut încărca statistica: {msg}"
    },
    "networkError": {
      "ru": "Ошибка сети",
      "ro": "Eroare de reИ›ea"
    },
    "trendScale": {
      "ru": "Масштаб",
      "ro": "Scară"
    },
    "modeDay": {
      "ru": "?? ????",
      "ro": "Pe zile"
    },
    "modeMonth": {
      "ru": "По месяцам",
      "ro": "Pe luni"
    },
    "overallPerfSem1": {
      "ru": "Общая успеваемость - I семестр",
      "ro": "PerformanИ›ă generală - Semestrul I"
    },
    "overallPerfSem2": {
      "ru": "Общая успеваемость - II семестр",
      "ro": "PerformanИ›ă generală - Semestrul II"
    },
    "absenceSem1": {
      "ru": "Пропуски - I семестр",
      "ro": "AbsenИ›e - Semestrul I"
    },
    "absenceSem2": {
      "ru": "Пропуски - II семестр",
      "ro": "AbsenИ›e - Semestrul II"
    },
    "noDataSem1": {
      "ru": "Недостаточно данных за I семестр",
      "ro": "Nu există date suficiente pentru semestrul I"
    },
    "noDataSem2": {
      "ru": "Недостаточно данных за II семестр",
      "ro": "Nu există date suficiente pentru semestrul II"
    }
  },
  "calendar": {
    "title": {
      "ru": "Учебный календарь",
      "ro": "Calendar academic"
    },
    "firstSemester": {
      "ru": "Первый семестр",
      "ro": "Semestrul I"
    },
    "secondSemester": {
      "ru": "Второй семестр",
      "ro": "Semestrul II"
    },
    "semSummary": {
      "ru": "I \u0441\u0435\u043c\u0435\u0441\u0442\u0440: \u0421\u0435\u043d\u0442\u044f\u0431\u0440\u044c-\u0414\u0435\u043a\u0430\u0431\u0440\u044c {startYear} | II \u0441\u0435\u043c\u0435\u0441\u0442\u0440: \u042f\u043d\u0432\u0430\u0440\u044c-\u041c\u0430\u0439 {nextYear}",
      "ro": "Semestrul I: Septembrie-Decembrie {startYear} | Semestrul II: Ianuarie-Mai {nextYear}"
    },
    "sunday": {
      "ru": "Воскресенье",
      "ro": "Duminică"
    },
    "holiday": {
      "ru": "Праздник/Каникулы",
      "ro": "Sărbătoare/VacanИ›ă"
    },
    "roleInfo": {
      "ru": "У вас роль {role}. Добавлять/удалять события может только ADMIN.",
      "ro": "Rolul tău este {role}. Doar ADMIN poate adăuga/șterge evenimente."
    },
    "eventsTitle": {
      "ru": "Праздники / Каникулы",
      "ro": "Sărbători / VacanИ›e"
    },
    "name": {
      "ru": "Название",
      "ro": "Denumire"
    },
    "inputType": {
      "ru": "Тип ввода",
      "ro": "Tip introducere"
    },
    "range": {
      "ru": "Диапазон",
      "ro": "Interval"
    },
    "singleDay": {
      "ru": "Один день",
      "ro": "O zi"
    },
    "date": {
      "ru": "Дата",
      "ro": "Data"
    },
    "startDate": {
      "ru": "Дата начала",
      "ro": "Data început"
    },
    "endDate": {
      "ru": "Дата конца",
      "ro": "Data sfГўrșit"
    },
    "add": {
      "ru": "Добавить",
      "ro": "Adaugă"
    },
    "clear": {
      "ru": "Очистить",
      "ro": "CurăИ›ă"
    },
    "noEvents": {
      "ru": "Событий пока нетЮ",
      "ro": "Nu există evenimente."
    },
    "actions": {
      "ru": "Действия",
      "ro": "AcИ›iuni"
    },
    "dates": {
      "ru": "Даты",
      "ro": "Date"
    },
    "delete": {
      "ru": "Удалить",
      "ro": "Șterge"
    },
    "hint": {
      "ru": "Подсказка: события сохраняются в базе через backend API.",
      "ro": "Sfat: evenimentele sunt salvate în baza de date prin backend API."
    },
    "nameRequired": {
      "ru": "Введите название (например: Каникулы, Праздник).",
      "ro": "Introdu denumirea (ex: VacanИ›ă, Sărbătoare)."
    },
    "dateRequired": {
      "ru": "Выберите дату (или дату начала).",
      "ro": "Alege data (sau data de început)."
    },
    "loading": {
      "ru": "Загрузка...",
      "ro": "Se încarcă..."
    },
    "loadFailed": {
      "ru": "Не удалось загрузить события: {msg}",
      "ro": "Nu s-au putut încărca evenimentele: {msg}"
    },
    "createFailed": {
      "ru": "Не удалось добавить событие: {msg}",
      "ro": "Nu s-a putut adăuga evenimentul: {msg}"
    },
    "deleteFailed": {
      "ru": "Не удалось удалить событие: {msg}",
      "ro": "Nu s-a putut șterge evenimentul: {msg}"
    }
  },
  "classes": {
    "title": {
      "ru": "Журналы (Классы)",
      "ro": "Jurnale (Clase)"
    },
    "total": {
      "ru": "Общее количество: {count}",
      "ro": "Total: {count}"
    },
    "add": {
      "ru": "+ Добавить класс",
      "ro": "+ Adaugă clasă"
    },
    "roleInfo": {
      "ru": "У вас роль {role}. Изменение классов доступно только ADMIN.",
      "ro": "Rolul tău este {role}. Modificarea claselor este disponibilă doar pentru ADMIN."
    },
    "name": {
      "ru": "Название класса",
      "ro": "Denumirea clasei"
    },
    "students": {
      "ru": "Ученики",
      "ro": "Elevi"
    },
    "actions": {
      "ru": "Действия",
      "ro": "AcИ›iuni"
    },
    "open": {
      "ru": "Открыть",
      "ro": "Deschide"
    },
    "edit": {
      "ru": "Редактировать",
      "ro": "Editează"
    },
    "delete": {
      "ru": "Удалить",
      "ro": "Șterge"
    },
    "none": {
      "ru": "Пока нет классов",
      "ro": "ГЋncă nu există clase"
    },
    "addTitle": {
      "ru": "Добавить класс",
      "ro": "Adaugă clasă"
    },
    "nameRequired": {
      "ru": "Введите название класса",
      "ro": "Introdu denumirea clasei"
    },
    "nameLabel": {
      "ru": "Название *",
      "ro": "Denumire *"
    },
    "namePlaceholder": {
      "ru": "Например: 1-А",
      "ro": "De exemplu: 1-A"
    },
    "subjects": {
      "ru": "Предметы (опционально)",
      "ro": "Materii (opИ›ional)"
    },
    "subjectsHint": {
      "ru": "Можно выбрать несколько.",
      "ro": "PoИ›i selecta mai multe."
    },
    "overallPerformance": {
      "ru": "Общая успеваемость",
      "ro": "Performanta generala"
    },
    "totalAbsences": {
      "ru": "Общее количество пропусков",
      "ro": "Total absente"
    },
    "cancel": {
      "ru": "Отмена",
      "ro": "Anulează"
    },
    "save": {
      "ru": "Сохранить",
      "ro": "Salvează"
    },
    "deleteConfirm": {
      "ru": "Удалить класс?",
      "ro": "Ștergi clasa?"
    }
  },
  "subjects": {
    "title": {
      "ru": "Предметы",
      "ro": "Materii"
    },
    "total": {
      "ru": "Общее количество: {count}",
      "ro": "Total: {count}"
    },
    "add": {
      "ru": "+ Добавить предмет",
      "ro": "+ Adaugă materie"
    },
    "roleInfo": {
      "ru": "У вас роль {role}. Изменение предметов доступно только ADMIN.",
      "ro": "Rolul tău este {role}. Modificarea materiilor este disponibilă doar pentru ADMIN."
    },
    "name": {
      "ru": "Название",
      "ro": "Denumire"
    },
    "actions": {
      "ru": "Действия",
      "ro": "AcИ›iuni"
    },
    "open": {
      "ru": "Открыть",
      "ro": "Deschide"
    },
    "edit": {
      "ru": "Редактировать",
      "ro": "Editează"
    },
    "delete": {
      "ru": "Удалить",
      "ro": "Șterge"
    },
    "none": {
      "ru": "Пока нет предметов",
      "ro": "ГЋncă nu există materii"
    },
    "addTitle": {
      "ru": "Добавить предмет",
      "ro": "Adaugă materie"
    },
    "nameRequired": {
      "ru": "Введите название предмета",
      "ro": "Introdu denumirea materiei"
    },
    "nameLabel": {
      "ru": "Название *",
      "ro": "Denumire *"
    },
    "placeholder": {
      "ru": "Математика",
      "ro": "Matematică"
    },
    "cancel": {
      "ru": "Отмена",
      "ro": "Anulează"
    },
    "save": {
      "ru": "Сохранить",
      "ro": "Salvează"
    },
    "deleteConfirm": {
      "ru": "Удалить предмет?",
      "ro": "Ștergi materia?"
    },
    "loadFailed": {
      "ru": "Не удалось загрузить предметы: {msg}",
      "ro": "Nu s-au putut încărca materiile: {msg}"
    },
    "createFailed": {
      "ru": "Не удалось создать предмет: {msg}",
      "ro": "Nu s-a putut crea materia: {msg}"
    },
    "deleteFailed": {
      "ru": "Не удалось удалить предмет: {msg}",
      "ro": "Nu s-a putut șterge materia: {msg}"
    }
  },
  "assignments": {
    "title": {
      "ru": "Назначения",
      "ro": "Repartizări"
    },
    "total": {
      "ru": "Общее количество: {count}",
      "ro": "Total: {count}"
    },
    "add": {
      "ru": "+ Назначить",
      "ro": "+ Repartizează"
    },
    "roleInfo": {
      "ru": "У вас роль {role}. Изменение назначений доступно только ADMIN.",
      "ro": "Rolul tău este {role}. Modificarea repartizărilor este disponibilă doar pentru ADMIN."
    },
    "loadFailed": {
      "ru": "Не удалось загрузить данные: {msg}",
      "ro": "Nu s-au putut încărca datele: {msg}"
    },
    "createFailed": {
      "ru": "Не удалось создать назначение: {msg}",
      "ro": "Nu s-a putut crea repartizarea: {msg}"
    },
    "deleteFailed": {
      "ru": "Не удалось удалить назначение: {msg}",
      "ro": "Nu s-a putut șterge repartizarea: {msg}"
    },
    "chooseTeacherClassSubject": {
      "ru": "Выберите учителя, класс и предмет",
      "ro": "Selectează profesorul, clasa și materia"
    },
    "invalidHours": {
      "ru": "Введите корректное количество часов",
      "ro": "Introdu un număr valid de ore"
    },
    "deleteConfirm": {
      "ru": "Удалить назначение?",
      "ro": "Ștergi repartizarea?"
    },
    "needAssignments": {
      "ru": "Требуют назначения",
      "ro": "Necesită repartizare"
    },
    "needAssignmentsHint": {
      "ru": "Здесь показаны предметы класса без назначенного преподавателя.",
      "ro": "Aici sunt materiile clasei fără profesor repartizat."
    },
    "allAssigned": {
      "ru": "Все предметы классов имеют назначенных преподавателей.",
      "ro": "Toate materiile claselor au profesori repartizaИ›i."
    },
    "teacher": {
      "ru": "Учитель",
      "ro": "Profesor"
    },
    "class": {
      "ru": "Класс",
      "ro": "Clasă"
    },
    "subject": {
      "ru": "Предмет",
      "ro": "Materie"
    },
    "hours": {
      "ru": "Часы",
      "ro": "Ore"
    },
    "actions": {
      "ru": "Действия",
      "ro": "AcИ›iuni"
    },
    "open": {
      "ru": "Открыть",
      "ro": "Deschide"
    },
    "edit": {
      "ru": "Редактировать",
      "ro": "Editează"
    },
    "delete": {
      "ru": "Удалить",
      "ro": "Șterge"
    },
    "none": {
      "ru": "Пока нет назначений",
      "ro": "ГЋncă nu există repartizări"
    },
    "modalTitle": {
      "ru": "Назначение",
      "ro": "Repartizare"
    },
    "chooseTeacher": {
      "ru": "Выберите учителя",
      "ro": "Selectează profesorul"
    },
    "chooseClass": {
      "ru": "Выберите класс",
      "ro": "Selectează clasa"
    },
    "chooseSubject": {
      "ru": "Выберите предмет",
      "ro": "Selectează materia"
    },
    "hoursPlaceholder": {
      "ru": "Например: 6",
      "ro": "De exemplu: 6"
    },
    "hint": {
      "ru": "Назначение связывает учителя, класс и предмет и задает количество часов.",
      "ro": "Repartizarea leaga profesorul, clasa si materia si stabileste numarul de ore."
    },
    "cancel": {
      "ru": "Отмена",
      "ro": "Anuleaza"
    },
    "save": {
      "ru": "Сохранить",
      "ro": "Salveaza"
    }
  }
};
function getNestedValue(obj, key) {
  return key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

function interpolate(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? `{${token}}`));
}

let cp1251ReverseMap = null;

function getCp1251ReverseMap() {
  if (cp1251ReverseMap) return cp1251ReverseMap;
  cp1251ReverseMap = new Map();
  try {
    const dec = new TextDecoder('windows-1251');
    for (let b = 0; b < 256; b += 1) {
      const ch = dec.decode(new Uint8Array([b]));
      if (!cp1251ReverseMap.has(ch)) cp1251ReverseMap.set(ch, b);
    }
  } catch {
    // Fallback minimal map if browser doesn't support windows-1251
    for (let b = 0; b < 128; b += 1) cp1251ReverseMap.set(String.fromCharCode(b), b);
    cp1251ReverseMap.set('Р В Р’В Р В РЎвЂњ', 0xa8);
    cp1251ReverseMap.set('Р В Р Р‹Р Р†Р вЂљР’В', 0xb8);
    for (let c = 0x0410; c <= 0x044f; c += 1) cp1251ReverseMap.set(String.fromCharCode(c), c - 0x350);
  }
  return cp1251ReverseMap;
}

function cp1251MojibakeToUtf8(input) {
  try {
    const reverse = getCp1251ReverseMap();
    const bytes = [];
    for (const ch of String(input)) {
      if (!reverse.has(ch)) return String(input);
      bytes.push(reverse.get(ch));
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    return String(input);
  }
}

function normalizeI18nText(input) {
  const original = String(input ?? '');
  const mojibakeMarkers = ['Р', 'С', 'Ð', 'Ñ', 'Ã', 'Â', 'â', '�'];
  const hasMojibake = mojibakeMarkers.some((m) => original.includes(m));
  if (!hasMojibake) return original;

  const fixed = cp1251MojibakeToUtf8(original);
  const badScore = (s) =>
    mojibakeMarkers.reduce((sum, m) => sum + (String(s).split(m).length - 1), 0);
  const hasCyrillic = /[\u0400-\u04FF]/.test(String(fixed));
  if (fixed && hasCyrillic && badScore(fixed) < badScore(original)) {
    return fixed;
  }
  return original;
}

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LANGS.includes(stored) ? stored : 'ru';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    const t = (key, params) => {
      const entry = getNestedValue(translations, key);
      const text =
        entry && typeof entry === 'object'
          ? entry[language] ?? entry.ru ?? key
          : typeof entry === 'string'
            ? entry
            : key;
      return interpolate(normalizeI18nText(text), params);
    };

    return { language, setLanguage, t };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return ctx;
}

export function pickLocalI18n(dictionary, language) {
  if (!dictionary || typeof dictionary !== 'object') return {};

  // Legacy shape: { ru: {...}, ro: {...} }
  if (
    dictionary.ru &&
    typeof dictionary.ru === 'object' &&
    !Array.isArray(dictionary.ru)
  ) {
    return dictionary[language] || dictionary.ru || {};
  }

  // Unified shape: { key: { ru: '...', ro: '...' } }
  const out = {};
  for (const [key, value] of Object.entries(dictionary)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = normalizeI18nText(value[language] ?? value.ru ?? '');
    }
  }
  return out;
}




