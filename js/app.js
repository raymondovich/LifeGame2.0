
/* =========================================
   LIFE GAME — APPLICATION
   ========================================= */
/*
   Главная точка входа приложения.
   app.js НЕ содержит механику:
   - финансов;
   - здоровья;
   - развития;
   - расчёта XP;
   - уровней;
   - хранения данных.
   Эти системы находятся в отдельных модулях.
*/
/* =========================================
   MODULE IMPORTS
   ========================================= */
import { initFinance } from "../modules/finance/finance.js";
import { initHealth } from "../modules/health/health.js";
import { initDevelopment } from "../modules/development/development.js";
/* =========================================
   APPLICATION STATE
   ========================================= */
const App = {
    initialized: false,
    currentSection: "finance",
};
/* =========================================
   DOM ELEMENTS
   ========================================= */
const DOM = {
    app: null,
    main: null,
    financeSection: null,
    healthSection: null,
    developmentSection: null,
    navigation: null,
};
/* =========================================
   CACHE DOM
   ========================================= */
function cacheDOM() {
    DOM.app = document.getElementById("app");
    DOM.main = document.getElementById("app-main");
    DOM.financeSection =
        document.getElementById("finance-section");
    DOM.healthSection =
        document.getElementById("health-section");
    DOM.developmentSection =
        document.getElementById("development-section");
    DOM.navigation =
        document.getElementById("bottom-navigation");
}
/* =========================================
   VALIDATE DOM
   ========================================= */
function validateDOM() {
    const requiredElements = [
        ["#app", DOM.app],
        ["#app-main", DOM.main],
        ["#finance-section", DOM.financeSection],
        ["#health-section", DOM.healthSection],
        ["#development-section", DOM.developmentSection],
        ["#bottom-navigation", DOM.navigation],
    ];
    const missingElements =
        requiredElements
            .filter(([, element]) => !element)
            .map(([selector]) => selector);
    if (missingElements.length > 0) {
        console.error(
            "LIFE GAME: Не найдены необходимые элементы:",
            missingElements
        );
        return false;
    }
    return true;
}
/* =========================================
   SET ACTIVE SECTION
   ========================================= */
function setActiveSection(sectionName) {
    const sections = {
        finance: DOM.financeSection,
        health: DOM.healthSection,
        development: DOM.developmentSection,
    };
    Object.entries(sections).forEach(
        ([name, section]) => {
            if (!section) return;
            const isActive =
                name === sectionName;
            section.classList.toggle(
                "is-active",
                isActive
            );
            section.hidden = !isActive;
        }
    );
    App.currentSection = sectionName;
}
/* =========================================
   SET ACTIVE NAVIGATION BUTTON
   ========================================= */
function setActiveNavigation(sectionName) {
    if (!DOM.navigation) return;
    const buttons =
        DOM.navigation.querySelectorAll(
            "[data-section]"
        );
    buttons.forEach(button => {
        const isActive =
            button.dataset.section === sectionName;
        button.classList.toggle(
            "is-active",
            isActive
        );
        button.setAttribute(
            "aria-current",
            isActive ? "page" : "false"
        );
    });
}
/* =========================================
   NAVIGATION
   ========================================= */
function setupNavigation() {
    if (!DOM.navigation) return;
    DOM.navigation.addEventListener(
        "click",
        event => {
            const button =
                event.target.closest(
                    "[data-section]"
                );
            if (!button) return;
            const sectionName =
                button.dataset.section;
            if (
                sectionName !== "finance" &&
                sectionName !== "health" &&
                sectionName !== "development"
            ) {
                console.warn(
                    "LIFE GAME: Неизвестный раздел:",
                    sectionName
                );
                return;
            }
            setActiveSection(sectionName);
            setActiveNavigation(sectionName);
        }
    );
}
/* =========================================
   INITIALIZE MODULES
   ========================================= */
function initializeModules() {
    try {
        initFinance();
    } catch (error) {
        console.error(
            "LIFE GAME: Ошибка запуска Finance:",
            error
        );
    }
    try {
        initHealth();
    } catch (error) {
        console.error(
            "LIFE GAME: Ошибка запуска Health:",
            error
        );
    }
    try {
        initDevelopment();
    } catch (error) {
        console.error(
            "LIFE GAME: Ошибка запуска Development:",
            error
        );
    }
}
/* =========================================
   INITIALIZE APPLICATION
   ========================================= */
function initApp() {
    if (App.initialized) {
        console.warn(
            "LIFE GAME: Приложение уже запущено."
        );
        return;
    }
    cacheDOM();
    const isValid =
        validateDOM();
    if (!isValid) {
        return;
    }
    setupNavigation();
    initializeModules();
    setActiveSection(
        App.currentSection
    );
    setActiveNavigation(
        App.currentSection
    );
    App.initialized = true;
    console.log(
        "LIFE GAME: Приложение успешно запущено."
    );
}
/* =========================================
   START APPLICATION
   ========================================= */
if (
    document.readyState === "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initApp,
        { once: true }
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
    setActiveSection,
};