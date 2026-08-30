/* =========================================
   LIFE GAME 2.0
   NAVIGATION SYSTEM
   ========================================= */
const SECTIONS = [
    "finance",
    "health",
    "development"
];
const DEFAULT_SECTION = "finance";
let currentSection = DEFAULT_SECTION;
/* =========================================
   CHECK SECTION
   ========================================= */
function isValidSection(sectionName) {
    return SECTIONS.includes(sectionName);
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
function setActiveSection(sectionName) {
    if (!isValidSection(sectionName)) {
        console.warn(
            "LIFE GAME: Unknown section:",
            sectionName
        );
        return false;
    }
    /*
       Работаем только с основными
       блоками приложения.
    */
    const sections =
        document.querySelectorAll(
            "[data-section-view]"
        );
    sections.forEach(section => {
        const name =
            section.dataset.sectionView;
        const active =
            name === sectionName;
        section.hidden =
            !active;
        section.classList.toggle(
            "is-active",
            active
        );
    });
    /*
       Обновляем нижнюю навигацию.
    */
    const buttons =
        document.querySelectorAll(
            "#bottom-navigation [data-section]"
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
   CLICK HANDLER
   ========================================= */
function handleNavigationClick(event) {
    const button =
        event.target.closest(
            "#bottom-navigation [data-section]"
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
   INITIALIZE
   ========================================= */
function initNavigation() {
    const navigation =
        document.getElementById(
            "bottom-navigation"
        );
    if (!navigation) {
        console.error(
            "LIFE GAME: #bottom-navigation не найден."
        );
        return false;
    }
    /*
       Не допускаем двойной обработчик.
    */
    if (
        navigation.dataset.navigationInitialized ===
        "true"
    ) {
        return true;
    }
    navigation.addEventListener(
        "click",
        handleNavigationClick
    );
    navigation.dataset.navigationInitialized =
        "true";
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