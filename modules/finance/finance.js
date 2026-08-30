/* =========================================
   LIFE GAME 2.0
   FINANCE MODULE
   ========================================= */
/**
 * Инициализация финансового модуля.
 *
 * На этом этапе модуль только подтверждает,
 * что он корректно подключён к приложению.
 *
 * Вся финансовая механика будет добавлена позже.
 */
function initFinance() {
    const container =
        document.getElementById("finance-container");
    if (!container) {
        console.error(
            "LIFE GAME: Finance container не найден."
        );
        return;
    }
    container.innerHTML = `
        <div class="module-placeholder">
            <h2>Финансы</h2>
            <p>
                Finance module подключён.
            </p>
        </div>
    `;
    console.log(
        "LIFE GAME: Finance module работает."
    );
}
/* =========================================
   PUBLIC API
   ========================================= */
export {
    initFinance
};