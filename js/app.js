/* =========================================
   LIFE GAME 2.0
   APPLICATION CORE + STORAGE TEST
   ========================================= */
import { initFinance } from "../modules/finance/finance.js";
import { initHealth } from "../modules/health/health.js";
import { initDevelopment } from "../modules/development/development.js";
import {
    getState,
    addLog,
    getLogs,
    getStorageInfo
} from "./storage.js";
/* =========================================
   APPLICATION STATE
   ========================================= */
const App = {
    initialized: false,
    currentSection: "finance"
};
/* =========================================
   DOM
   ========================================= */
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
/* =========================================
   CACHE DOM
   ========================================= */
function cacheDOM() {
    DOM.app =
        document.getElementById("app");
    DOM.main =
        document.getElementById("app-main");
    DOM.navigation =
        document.getElementById("bottom-navigation");
    DOM.sections.finance =
        document.getElementById("finance-section");
    DOM.sections.health =
        document.getElementById("health-section");
    DOM.sections.development =
        document.getElementById("development-section");
}
/* =========================================
   VALIDATE DOM
   ========================================= */
function validateDOM() {
    const requiredElements = [
        ["#app", DOM.app],
        ["#app-main", DOM.main],
        ["#bottom-navigation", DOM.navigation],
        ["#finance-section", DOM.sections.finance],
        ["#health-section", DOM.sections.health],
        ["#development-section", DOM.sections.development]
    ];
    const missingElements =
        requiredElements
            .filter(([, element]) => !element)
            .map(([selector]) => selector);
    if (missingElements.length > 0) {
        console.error(
            "LIFE GAME: Не найдены элементы:",
            missingElements
        );
        return false;
    }
    return true;
}
/* =========================================
   STORAGE TEST
   ========================================= */
function testStorage() {
    console.log(
        "========================================="
    );
    console.log(
        "LIFE GAME 2.0 — STORAGE TEST"
    );
    console.log(
        "========================================="
    );
    try {
        /* Получаем текущее состояние */
        const state =
            getState();
        console.log(
            "Storage: OK"
        );
        console.log(
            "Player ID:",
            state.player.id
        );
        console.log(
            "Created:",
            state.player.createdAt
        );
        console.log(
            "Last active:",
            state.player.lastActive
        );
        /* Добавляем тестовый лог */
        addLog({
            section: "system",
            action: "storage_test",
            message: "Storage test executed"
        });
        /* Получаем логи */
        const logs =
            getLogs();
        console.log(
            "Logs count:",
            logs.length
        );
        /* Информация о storage */
        const info =
            getStorageInfo();
        console.log(
            "Storage info:",
            info
        );
        console.log(
            "Storage test: PASSED"
        );
        console.log(
            "========================================="
        );
    } catch (error) {
        console.error(
            "Storage test: FAILED",
            error
        );
    }
}
/* =========================================
   SECTION VALIDATION
   ========================================= */
function isValidSection(sectionName) {
    return (
        sectionName === "finance" ||
        sectionName === "health" ||
        sectionName === "development"
    );
}
/* =========================================
   SHOW SECTION
   ========================================= */
function showSection(sectionName) {
    if (!isValidSection(sectionName)) {
        console.warn(
            "LIFE GAME: Неизвестный раздел:",
            sectionName
        );
        return;
    }
    Object.entries(DOM.sections).forEach(
        ([name, section]) => {
            if (!section) return;
            const active =
                name === sectionName;
            section.classList.toggle(
                "is-active",
                active
            );
            section.hidden =
                !active;
        }
    );
    App.currentSection =
        sectionName;
    updateNavigation(
        sectionName
    );
}
/* =========================================
   UPDATE NAVIGATION
   ========================================= */
function updateNavigation(sectionName) {
    if (!DOM.navigation) return;
    const buttons =
        DOM.navigation.querySelectorAll(
            "[data-section]"
        );
    buttons.forEach(button => {
        const active =
            button.dataset.section === sectionName;
        button.classList.toggle(
            "is-active",
            active
        );
        if (active) {
            button.setAttribute(
                "aria-current",
                "page"
            );
        } else {
            button.removeAttribute(
                "aria-current"
            );
        }
    });
}
/* =========================================
   NAVIGATION
   ========================================= */
function initNavigation() {
    if (!DOM.navigation) return;
    DOM.navigation.addEventListener(
        "click",
        event => {
            const button =
                event.target.closest(
                    "[data-section]"
                );
            if (!button) return;
            showSection(
                button.dataset.section
            );
        }
    );
}
/* =========================================
   MODULE INITIALIZATION
   ========================================= */
function initializeModules() {
    try {
        initFinance();
        console.log(
            "LIFE GAME: Finance initialized."
        );
    } catch (error) {
        console.error(
            "LIFE GAME: Finance error:",
            error
        );
    }
    try {
        initHealth();
        console.log(
            "LIFE GAME: Health initialized."
        );
    } catch (error) {
        console.error(
            "LIFE GAME: Health error:",
            error
        );
    }
    try {
        initDevelopment();
        console.log(
            "LIFE GAME: Development initialized."
        );
    } catch (error) {
        console.error(
            "LIFE GAME: Development error:",
            error
        );
    }
}
/* =========================================
   INITIALIZE APPLICATION
   ========================================= */
function initApp() {
    if (App.initialized) {
        return;
    }
    cacheDOM();
    if (!validateDOM()) {
        return;
    }
    /*
       Сначала проверяем storage.
    */
    testStorage();
    /*
       Затем запускаем модули.
    */
    initializeModules();
    /*
       Затем запускаем навигацию.
    */
    initNavigation();
    /*
       Открываем Finance.
    */
    showSection(
        App.currentSection
    );
    App.initialized =
        true;
    console.log(
        "LIFE GAME 2.0: Application initialized."
    );
}
/* =========================================
   APPLICATION START
   ========================================= */
if (
    document.readyState === "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initApp,
        {
            once: true
        }
    );
} else {
    initApp();
}
/* =========================================
   PUBLIC API
   ========================================= */
export {
    App,
    initApp,
    showSection
};