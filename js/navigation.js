/* =========================================
   LIFE GAME 2.0
   NAVIGATION SYSTEM
   ========================================= */
/*
   navigation.js отвечает только за навигацию
   между основными разделами приложения.
   Разделы:
   - finance
   - health
   - development
   Этот файл НЕ отвечает за:
   - данные;
   - localStorage;
   - XP;
   - уровни;
   - Finance;
   - Health;
   - Development.
*/
/* =========================================
   AVAILABLE SECTIONS
   ========================================= */
const SECTIONS = [
    "finance",
    "health",
    "development"
];
/* =========================================
   NAVIGATION STATE
   ========================================= */
let currentSection = "finance";
/* =========================================
   CHECK SECTION
   ========================================= */
function isValidSection(sectionName) {
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
   SET ACTIVE SECTION
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
    const sections =
        document.querySelectorAll(
            "[data-section-view]"
        );
    sections.forEach(section => {
        const sectionNameFromDOM =
            section.dataset.sectionView;
        const active =
            sectionNameFromDOM === sectionName;
        section.classList.toggle(
            "is-active",
            active
        );
        section.hidden =
            !active;
    });
    const buttons =
        document.querySelectorAll(
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
    currentSection =
        sectionName;
    return true;
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
    navigation.addEventListener(
        "click",
        handleNavigationClick
    );
    setActiveSection(
        currentSection
    );
    console.log(
        "LIFE GAME: Navigation initialized."
    );
    return true;
}
/* =========================================
   HANDLE NAVIGATION CLICK
   ========================================= */
function handleNavigationClick(
    event
) {
    const button =
        event.target.closest(
            "[data-section]"
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
   PUBLIC API
   ========================================= */
export {
    SECTIONS,
    initNavigation,
    setActiveSection,
    getCurrentSection,
    isValidSection
};