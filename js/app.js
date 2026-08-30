/* =========================================================
   LIFE GAME 2.0
   APPLICATION CORE

   app.js отвечает только за:

   - запуск приложения;
   - проверку DOM;
   - загрузку состояния;
   - инициализацию модулей;
   - подключение navigation;
   - управление жизненным циклом приложения.

   app.js НЕ содержит:

   - Finance logic;
   - Health logic;
   - Development logic;
   - расчёты;
   - storage mechanics;
   - navigation mechanics.

   ========================================================= */

import {
    initFinance
} from "../modules/finance/finance.js";

import {
    initHealth
} from "../modules/health/health.js";

import {
    initDevelopment
} from "../modules/development/development.js";

import {
    getState,
    addLog
} from "./storage.js";

import {
    initNavigation,
    setActiveSection,
    getCurrentSection,
    isValidSection
} from "./navigation.js";


/* =========================================================
   APPLICATION STATE
   ========================================================= */

const App = {

    initialized: false,

    currentSection: "finance",

    state: null,

    modules: {

        finance: {
            initialized: false
        },

        health: {
            initialized: false
        },

        development: {
            initialized: false
        }

    }

};


/* =========================================================
   DOM CACHE
   ========================================================= */

const DOM = {

    app: null,

    main: null,

    navigation: null,

    sections: {

        finance: null,

        health: null,

        development: null

    }

};


/* =========================================================
   CACHE DOM
   ========================================================= */

function cacheDOM() {

    DOM.app =
        document.getElementById("app");

    DOM.main =
        document.getElementById("app-main");

    DOM.navigation =
        document.getElementById(
            "bottom-navigation"
        );

    DOM.sections.finance =
        document.getElementById(
            "finance-section"
        );

    DOM.sections.health =
        document.getElementById(
            "health-section"
        );

    DOM.sections.development =
        document.getElementById(
            "development-section"
        );

}


/* =========================================================
   DOM VALIDATION
   ========================================================= */

function validateDOM() {

    const requiredElements = [

        ["#app", DOM.app],

        ["#app-main", DOM.main],

        [
            "#bottom-navigation",
            DOM.navigation
        ],

        [
            "#finance-section",
            DOM.sections.finance
        ],

        [
            "#health-section",
            DOM.sections.health
        ],

        [
            "#development-section",
            DOM.sections.development
        ]

    ];


    const missingElements =
        requiredElements

            .filter(
                ([, element]) => !element
            )

            .map(
                ([selector]) => selector
            );


    if (
        missingElements.length > 0
    ) {

        console.error(
            "LIFE GAME: Не найдены обязательные DOM-элементы:",
            missingElements
        );

        return false;
    }


    return true;

}


/* =========================================================
   STORAGE INITIALIZATION
   ========================================================= */

/*
    storage.js самостоятельно создаёт
    состояние игрока при первом запуске.

    app.js только получает это состояние
    и передаёт его дальше модулям.

    Никакой логики хранения здесь нет.
*/

function initializeState() {

    try {

        App.state =
            getState();


        if (
            !App.state ||
            typeof App.state !== "object"
        ) {

            throw new Error(
                "Storage returned invalid state."
            );

        }


        if (
            !App.state.player
        ) {

            throw new Error(
                "Player state is missing."
            );

        }


        console.log(
            "LIFE GAME: State loaded."
        );


        console.log(
            "LIFE GAME: Player ID:",
            App.state.player.id
        );


        return true;

    } catch (error) {

        console.error(
            "LIFE GAME: State initialization failed:",
            error
        );

        return false;

    }

}


/* =========================================================
   APPLICATION LOG
   ========================================================= */

/*
    Логируем только реальные события
    приложения.

    Не используем storage test при каждом запуске.
*/

function logApplicationStart() {

    try {

        addLog({

            section: "system",

            action: "application_start",

            message:
                "LIFE GAME application initialized."

        });

    } catch (error) {

        console.warn(
            "LIFE GAME: Не удалось записать application log:",
            error
        );

    }

}


/* =========================================================
   MODULE INITIALIZER
   ========================================================= */

function initializeModule(
    moduleName,
    initializer
) {

    if (
        App.modules[moduleName]?.initialized
    ) {

        return true;

    }


    try {

        initializer();


        App.modules[moduleName] = {

            initialized: true

        };


        console.log(
            `LIFE GAME: ${moduleName} module initialized.`
        );


        return true;

    } catch (error) {

        console.error(
            `LIFE GAME: ${moduleName} module initialization failed:`,
            error
        );


        App.modules[moduleName] = {

            initialized: false,

            error

        };


        return false;

    }

}


/* =========================================================
   INITIALIZE ALL MODULES
   ========================================================= */

function initializeModules() {

    const results = {

        finance:
            initializeModule(
                "finance",
                initFinance
            ),

        health:
            initializeModule(
                "health",
                initHealth
            ),

        development:
            initializeModule(
                "development",
                initDevelopment
            )

    };


    return results;

}


/* =========================================================
   SECTION MANAGEMENT
   ========================================================= */

/*
    navigation.js является единственным владельцем
    navigation state.

    app.js только синхронизирует своё состояние
    с navigation layer.
*/

function syncCurrentSection() {

    const section =
        getCurrentSection();


    if (
        isValidSection(section)
    ) {

        App.currentSection =
            section;

        return section;

    }


    App.currentSection =
        "finance";


    return App.currentSection;

}


/* =========================================================
   SHOW SECTION
   ========================================================= */

/*
    Public facade.

    Модули и внешние части приложения могут
    использовать showSection(), не зная внутренней
    реализации navigation.js.
*/

function showSection(
    sectionName
) {

    if (
        !isValidSection(sectionName)
    ) {

        console.warn(
            "LIFE GAME: Unknown section:",
            sectionName
        );

        return false;

    }


    const success =
        setActiveSection(
            sectionName
        );


    if (!success) {

        return false;

    }


    App.currentSection =
        sectionName;


    return true;

}


/* =========================================================
   NAVIGATION INITIALIZATION
   ========================================================= */

function initializeNavigation() {

    const initialized =
        initNavigation();


    if (!initialized) {

        console.error(
            "LIFE GAME: Navigation initialization failed."
        );

        return false;

    }


    syncCurrentSection();


    return true;

}


/* =========================================================
   APPLICATION ERROR HANDLER
   ========================================================= */

function handleApplicationError(
    error
) {

    console.error(
        "LIFE GAME: Application error:",
        error
    );

}


/* =========================================================
   APPLICATION INITIALIZATION
   ========================================================= */

function initApp() {

    if (
        App.initialized
    ) {

        return true;

    }


    console.log(
        "========================================="
    );

    console.log(
        "LIFE GAME 2.0"
    );

    console.log(
        "Application initialization started."
    );

    console.log(
        "========================================="
    );


    /*
        1. Получаем DOM.
    */

    cacheDOM();


    /*
        2. Проверяем DOM.
    */

    if (
        !validateDOM()
    ) {

        console.error(
            "LIFE GAME: Application initialization aborted."
        );

        return false;

    }


    /*
        3. Загружаем состояние игрока.
    */

    if (
        !initializeState()
    ) {

        console.error(
            "LIFE GAME: State initialization failed."
        );

        return false;

    }


    /*
        4. Инициализируем модули.

        Каждый модуль независим.
        Ошибка одного модуля не должна
        остановить остальные.
    */

    const moduleResults =
        initializeModules();


    /*
        5. Инициализируем navigation.
    */

    if (
        !initializeNavigation()
    ) {

        console.error(
            "LIFE GAME: Navigation initialization failed."
        );

    }


    /*
        6. Устанавливаем начальный раздел.

        Finance — стартовый экран.
    */

    showSection(
        App.currentSection
    );


    /*
        7. Записываем запуск приложения.
    */

    logApplicationStart();


    /*
        8. Финальный статус.
    */

    App.initialized =
        true;


    console.log(
        "========================================="
    );

    console.log(
        "LIFE GAME 2.0: Application initialized."
    );

    console.log(
        "Current section:",
        App.currentSection
    );

    console.log(
        "Modules:",
        moduleResults
    );

    console.log(
        "========================================="
    );


    return true;

}


/* =========================================================
   APPLICATION START
   ========================================================= */

function startApplication() {

    try {

        initApp();

    } catch (error) {

        handleApplicationError(
            error
        );

    }

}


/* =========================================================
   DOM READY
   ========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startApplication,
        {
            once: true
        }
    );

} else {

    startApplication();

}


/* =========================================================
   PUBLIC API
   ========================================================= */

export {

    App,

    DOM,

    initApp,

    showSection,

    initializeModules,

    initializeState

};