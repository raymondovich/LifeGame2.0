/* =========================================
   LIFE GAME 2.0
   NAVIGATION SYSTEM
   ========================================= */
/*
   navigation.js отвечает только за:
   - переключение основных разделов;
   - активное состояние кнопок;
   - определение текущего раздела.
   Разделы:
   finance
   health
   development
*/
/* =========================================
   CONFIGURATION
   ========================================= */
const SECTIONS = [
    "finance",
    "health",
    "development"
];
const DEFAULT_SECTION =
    "finance";
/* =========================================
   STATE
   ========================================= */
let currentSection =
    DEFAULT_SECTION;
/* =========================================
   VALIDATE SECTION
   ========================================= */
function isValidSection(
    sectionName
) {
    return SECTIONS.includes(
        sectionName
    );
}
/* =========================================
   GET CURRENT SECTION
   ========================================= */
function getCurrentSection() {
    return currentSection;
}
/* =========================================
   SHOW SECTION
   ========================================= */
function setActiveSection(
    sectionName
) {
    if (
        !isValidSection(sectionName)
    ) {
        console.warn(
            "LIFE GAME: Неизвестный раздел:",
            sectionName
        );
        return false;
    }
    /*
       Получаем все основные секции.
    */
    const sections =
        document.querySelectorAll(
            ".app-section"
        );
    sections.forEach(
        section => {
            const name =
                section.dataset.section;
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
    /*
       Получаем кнопки нижней навигации.
    */
    const buttons =
        document.querySelectorAll(
            ".navigation-button"
        );
    buttons.forEach(
        button => {
            const name =
                button.dataset.section;
            const active =
                name === sectionName;
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
        }
    );
    /*
       Запоминаем текущий раздел.
    */
    currentSection =
        sectionName;
    return true;
}
/* =========================================
   CLICK HANDLER
   ========================================= */
function handleNavigationClick(
    event
) {
    const button =
        event.target.closest(
            ".navigation-button"
        );
    if (!button) {
        return;
    }
    const sectionName =
        button.dataset.section;
    setActiveSection(
        sectionName
    );
}
/* =========================================
   INITIALIZE NAVIGATION
   ========================================= */
function initNavigation() {
    const navigation =
        document.getElementById(
            "bottom-navigation"
        );
    if (!navigation) {
        console.error(
            "LIFE GAME: Navigation container не найден."
        );
        return false;
    }
    /*
       Устанавливаем обработчик
       только один раз.
    */
    navigation.addEventListener(
        "click",
        handleNavigationClick
    );
    /*
       Открываем Finance
       при запуске приложения.
    */
    setActiveSection(
        DEFAULT_SECTION
    );
    console.log(
        "LIFE GAME: Navigation initialized."
    );
    return true;
}
/* =========================================
   PUBLIC API
   ========================================= */
export {
    SECTIONS,
    DEFAULT_SECTION,
    initNavigation,
    setActiveSection,
    getCurrentSection,
    isValidSection
};