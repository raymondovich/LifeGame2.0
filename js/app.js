/* =========================================
   LIFE GAME 2.0
   APPLICATION CORE
   ========================================= */
/* =========================================
   MODULES
   ========================================= */
import { initFinance } from "../modules/finance/finance.js";
import { initHealth } from "../modules/health/health.js";
import { initDevelopment } from "../modules/development/development.js";
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
   CACHE DOM ELEMENTS
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
   CHECK DOM
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
   GET VALID SECTION
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
            section.hidden = !active;
        }
    );
    App.currentSection = sectionName;
    updateNavigation(sectionName);
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
   NAVIGATION EVENTS
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
            const sectionName =
                button.dataset.section;
            showSection(sectionName);
        }
    );
}
/* =========================================
   INITIALIZE FINANCE
   ========================================= */
function initializeFinance() {
    try {
        initFinance();
        console.log(
            "LIFE GAME: Finance initialized."
        );
    } catch (error) {
        console.error(
            "LIFE GAME: Finance initialization error:",
            error
        );
    }
}
/* =========================================
   INITIALIZE HEALTH
   ========================================= */
function initializeHealth() {
    try {
        initHealth();
        console.log(
            "LIFE GAME: Health initialized."
        );
    } catch (error) {
        console.error(
            "LIFE GAME: Health initialization error:",
            error
        );
    }
}
/* =========================================
   INITIALIZE DEVELOPMENT
   ========================================= */
function initializeDevelopment() {
    try {
        initDevelopment();
        console.log(
            "LIFE GAME: Development initialized."
        );
    } catch (error) {
        console.error(
            "LIFE GAME: Development initialization error:",
            error
        );
    }
}
/* =========================================
   INITIALIZE MODULES
   ========================================= */
function initializeModules() {
    initializeFinance();
    initializeHealth();
    initializeDevelopment();
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
    initNavigation();
    initializeModules();
    showSection(
        App.currentSection
    );
    App.initialized = true;
    console.log(
        "LIFE GAME 2.0: Application initialized."
    );
}
/* =========================================
   START
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
    showSection
};