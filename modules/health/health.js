/* =========================================
   LIFE GAME 2.0
   HEALTH MODULE
   ========================================= */
/**
 * Инициализация модуля здоровья.
 *
 * На этом этапе модуль только подтверждает,
 * что он корректно подключён к приложению.
 *
 * Вся механика здоровья будет добавлена позже.
 */
function initHealth() {
    const container =
        document.getElementById("health-container");
    if (!container) {
        console.error(
            "LIFE GAME: Health container не найден."
        );
        return;
    }
    container.innerHTML = `
        <div class="module-placeholder">
            <h2>Здоровье</h2>
            <p>
                Health module подключён.
            </p>
        </div>
    `;
    console.log(
        "LIFE GAME: Health module работает."
    );
}
/* =========================================
   PUBLIC API
   ========================================= */
export {
    initHealth
};