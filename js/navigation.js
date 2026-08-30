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
   SET ACTIVE SECTION
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
       Получаем все элементы,
       у которых есть data-section.
    */
    const elements =
        document.querySelectorAll(
            "[data-section]"
        );
    elements.forEach(element => {
        const name =
            element.dataset.section;
        const active =
            name === sectionName;
        /*
           Если это кнопка навигации —
           меняем её активное состояние.
        */
        if (
            element.closest(
                "#bottom-navigation"
            )
        ) {
            element.classList.toggle(
                "is-active",
                active
            );
            if (active) {
                element.setAttribute(
                    "aria-current",
                    "page"
                );
            } else {
                element.removeAttribute(
                    "aria-current"
                );
            }
            return;
        }
        /*
           Если это основной раздел —
           показываем или скрываем его.
        */
        element.classList.toggle(
            "is-active",
            active
        );
        element.hidden =
            !active;
    });
    currentSection =
        sectionName;
    return true;
}
/* =========================================
   NAVIGATION CLICK
   ========================================= */
function handleNavigationClick(event) {
    const button =
        event.target.closest(
            "[data-section]"
        );
    if (!button) {
        return;
    }
    /*
       Защита от случайного
       поиска элементов вне навигации.
    */
    if (
        !button.closest(
            "#bottom-navigation"
        )
    ) {
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
            "LIFE GAME: #bottom-navigation не найден."
        );
        return false;
    }
    /*
       Защита от повторного
       добавления обработчика.
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