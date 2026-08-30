/* =========================================
   LIFE GAME 2.0
   APPLICATION CORE
   ========================================= */
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
    addLog,
    getLogs,
    getStorageInfo
} from "./storage.js";
import {
    initNavigation
} from "./navigation.js";
/* =========================================
   APPLICATION STATE
   ========================================= */
const App = {
    initialized: false
};
/* =========================================
   DOM
   ========================================= */
const DOM = {
    app: null,
    main: null,
    navigation: null
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
        document.getElementById(
            "bottom-navigation"
        );
}
/* =========================================
   VALIDATE DOM
   ========================================= */
function validateDOM() {
    const requiredElements = [
        ["#app", DOM.app],
        ["#app-main", DOM.main],
        [
            "#bottom-navigation",
            DOM.navigation
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
    try {
        const state =
            getState();
        addLog({
            section: "system",
            action: "storage_test",
            message:
                "Application initialized"
        });
        const logs =
            getLogs();
        const info =
            getStorageInfo();
        console.log(
            "LIFE GAME: Storage OK"
        );
        console.log(
            "Player ID:",
            state.player.id
        );
        console.log(
            "Logs:",
            logs.length
        );
        console.log(
            "Storage info:",
            info
        );
    } catch (error) {
        console.error(
            "LIFE GAME: Storage error:",
            error
        );
    }
}
/* =========================================
   INITIALIZE MODULES
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
       Storage
    */
    testStorage();
    /*
       Game modules
    */
    initializeModules();
    /*
       Navigation
    */
    initNavigation();
    App.initialized =
        true;
    console.log(
        "LIFE GAME 2.0: Application initialized."
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
    initApp
};