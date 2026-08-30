/* =========================================================
   LIFE GAME 2.0
   FINANCE MODULE
   ---------------------------------------------------------
   Financial tracking and Financial Stability analysis.
   IMPORTANT:
   This module contains NO XP.
   This module contains NO LEVELS.
   This module contains NO GAMIFICATION.
   The Finance module measures the user's actual
   financial condition and its dynamics.
   ========================================================= */
/* =========================================================
   STORAGE
   ========================================================= */
const FINANCE_STORAGE_KEY = "lifegame_finance_v1";
/* =========================================================
   DEFAULT STATE
   ========================================================= */
const defaultFinanceState = {
    liquidAssets: 0,
    essentialExpenses: 0,
    currentIncome: 0,
    financialObligations: 0,
    incomeHistory: []
};
/* =========================================================
   STATE
   ========================================================= */
let financeState = loadFinanceState();
/* =========================================================
   LOAD STATE
   ========================================================= */
function loadFinanceState() {
    try {
        const saved =
            localStorage.getItem(
                FINANCE_STORAGE_KEY
            );
        if (!saved) {
            return {
                ...defaultFinanceState
            };
        }
        const parsed =
            JSON.parse(saved);
        return {
            ...defaultFinanceState,
            ...parsed,
            incomeHistory:
                Array.isArray(parsed.incomeHistory)
                    ? parsed.incomeHistory
                    : []
        };
    } catch (error) {
        console.error(
            "LIFE GAME: Не удалось загрузить финансовые данные.",
            error
        );
        return {
            ...defaultFinanceState
        };
    }
}
/* =========================================================
   SAVE STATE
   ========================================================= */
function saveFinanceState() {
    try {
        localStorage.setItem(
            FINANCE_STORAGE_KEY,
            JSON.stringify(financeState)
        );
    } catch (error) {
        console.error(
            "LIFE GAME: Не удалось сохранить финансовые данные.",
            error
        );
    }
}
/* =========================================================
   NUMBER HELPERS
   ========================================================= */
function parseMoney(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return 0;
    }
    const normalized =
        String(value)
            .replace(/\s/g, "")
            .replace(",", ".")
            .replace(/[^\d.-]/g, "");
    const number =
        Number(normalized);
    if (!Number.isFinite(number)) {
        return 0;
    }
    return Math.max(0, number);
}
function formatMoney(value) {
    const number =
        Number(value) || 0;
    return new Intl.NumberFormat(
        "ru-RU",
        {
            maximumFractionDigits: 0
        }
    ).format(number);
}
function formatPercent(value) {
    if (!Number.isFinite(value)) {
        return "—";
    }
    return (
        (value * 100)
            .toFixed(1)
            .replace(".", ",")
        + "%"
    );
}
/* =========================================================
   SCORE CONFIGURATION
   ========================================================= */
const FINANCIAL_STABILITY_CONFIG = {
    weights: {
        liquidity: 0.30,
        cashFlow: 0.25,
        debt: 0.20,
        incomeStability: 0.15,
        netWorth: 0.10
    }
};
/* =========================================================
   LINEAR INTERPOLATION
   ========================================================= */
function interpolateScore(
    value,
    scale
) {
    if (!Number.isFinite(value)) {
        return null;
    }
    const points =
        [...scale]
            .sort(
                (a, b) =>
                    a.value - b.value
            );
    if (
        value <=
        points[0].value
    ) {
        return points[0].score;
    }
    if (
        value >=
        points[points.length - 1].value
    ) {
        return points[
            points.length - 1
        ].score;
    }
    for (
        let i = 0;
        i < points.length - 1;
        i++
    ) {
        const current =
            points[i];
        const next =
            points[i + 1];
        if (
            value >= current.value &&
            value <= next.value
        ) {
            const ratio =
                (
                    value -
                    current.value
                ) /
                (
                    next.value -
                    current.value
                );
            return (
                current.score +
                (
                    next.score -
                    current.score
                ) *
                ratio
            );
        }
    }
    return null;
}
/* =========================================================
   1. LIQUIDITY SCORE
   ---------------------------------------------------------
   Liquid Assets /
   Essential Monthly Expenses
   ========================================================= */
function calculateLiquidityScore() {
    const liquidAssets =
        parseMoney(
            financeState.liquidAssets
        );
    const essentialExpenses =
        parseMoney(
            financeState.essentialExpenses
        );
    if (
        essentialExpenses <= 0
    ) {
        return null;
    }
    const coverage =
        liquidAssets /
        essentialExpenses;
    if (coverage < 1) {
        return 0;
    }
    return Math.max(
        0,
        Math.min(
            100,
            interpolateScore(
                coverage,
                [
                    {
                        value: 1,
                        score: 20
                    },
                    {
                        value: 2,
                        score: 40
                    },
                    {
                        value: 3,
                        score: 60
                    },
                    {
                        value: 6,
                        score: 90
                    },
                    {
                        value: 9,
                        score: 100
                    }
                ]
            )
        )
    );
}
/* =========================================================
   2. CASH FLOW SCORE
   ---------------------------------------------------------
   (Income - Expenses) / Income
   ========================================================= */
function calculateCashFlowScore() {
    const income =
        parseMoney(
            financeState.currentIncome
        );
    const expenses =
        parseMoney(
            financeState.essentialExpenses
        );
    if (income <= 0) {
        return null;
    }
    const savingsRate =
        (
            income -
            expenses
        ) /
        income;
    if (savingsRate <= 0) {
        return 0;
    }
    return Math.max(
        0,
        Math.min(
            100,
            interpolateScore(
                savingsRate,
                [
                    {
                        value: 0.00,
                        score: 0
                    },
                    {
                        value: 0.05,
                        score: 25
                    },
                    {
                        value: 0.10,
                        score: 40
                    },
                    {
                        value: 0.20,
                        score: 60
                    },
                    {
                        value: 0.30,
                        score: 80
                    },
                    {
                        value: 0.40,
                        score: 100
                    }
                ]
            )
        )
    );
}
/* =========================================================
   3. DEBT SCORE
   ---------------------------------------------------------
   Financial Obligations /
   Monthly Income
   IMPORTANT:
   The entered "financial obligations" are treated as
   monthly debt payments for the current version.
   ========================================================= */
function calculateDebtScore() {
    const obligations =
        parseMoney(
            financeState.financialObligations
        );
    const income =
        parseMoney(
            financeState.currentIncome
        );
    if (income <= 0) {
        return null;
    }
    const debtServiceRatio =
        obligations /
        income;
    if (
        debtServiceRatio >= 0.50
    ) {
        return 0;
    }
    return Math.max(
        0,
        Math.min(
            100,
            interpolateScore(
                debtServiceRatio,
                [
                    {
                        value: 0.00,
                        score: 100
                    },
                    {
                        value: 0.10,
                        score: 90
                    },
                    {
                        value: 0.20,
                        score: 75
                    },
                    {
                        value: 0.30,
                        score: 55
                    },
                    {
                        value: 0.40,
                        score: 30
                    },
                    {
                        value: 0.50,
                        score: 0
                    }
                ]
            )
        )
    );
}
/* =========================================================
   4. INCOME STABILITY SCORE
   ---------------------------------------------------------
   Coefficient of Variation:
   Standard Deviation /
   Average Monthly Income
   Minimum required history:
   3 months.
   ========================================================= */
function calculateAverage(values) {
    if (!values.length) {
        return null;
    }
    return (
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        ) /
        values.length
    );
}
function calculateStandardDeviation(
    values
) {
    if (
        values.length < 2
    ) {
        return null;
    }
    const average =
        calculateAverage(
            values
        );
    const variance =
        values.reduce(
            (sum, value) =>
                sum +
                Math.pow(
                    value - average,
                    2
                ),
            0
        ) /
        values.length;
    return Math.sqrt(
        variance
    );
}
function calculateIncomeStabilityScore() {
    const values =
        financeState.incomeHistory
            .map(
                item =>
                    parseMoney(
                        item.amount
                    )
            )
            .filter(
                value =>
                    value > 0
            );
    if (
        values.length < 3
    ) {
        return null;
    }
    const average =
        calculateAverage(
            values
        );
    const standardDeviation =
        calculateStandardDeviation(
            values
        );
    if (
        !average ||
        standardDeviation === null
    ) {
        return null;
    }
    const coefficientOfVariation =
        standardDeviation /
        average;
    if (
        coefficientOfVariation >=
        0.50
    ) {
        return 0;
    }
    if (
        coefficientOfVariation <=
        0.05
    ) {
        return 100;
    }
    return Math.max(
        0,
        Math.min(
            100,
            interpolateScore(
                coefficientOfVariation,
                [
                    {
                        value: 0.05,
                        score: 100
                    },
                    {
                        value: 0.10,
                        score: 90
                    },
                    {
                        value: 0.20,
                        score: 75
                    },
                    {
                        value: 0.30,
                        score: 55
                    },
                    {
                        value: 0.40,
                        score: 30
                    },
                    {
                        value: 0.50,
                        score: 0
                    }
                ]
            )
        )
    );
}
/* =========================================================
   5. NET WORTH SCORE
   ---------------------------------------------------------
   Current version:
   Net Worth =
   Liquid Assets - Financial Obligations
   This is deliberately conservative.
   Later the module can add:
   - property
   - investments
   - vehicles
   - business assets
   - other assets
   ========================================================= */
function calculateNetWorthScore() {
    const liquidAssets =
        parseMoney(
            financeState.liquidAssets
        );
    const liabilities =
        parseMoney(
            financeState.financialObligations
        );
    const income =
        parseMoney(
            financeState.currentIncome
        );
    if (income <= 0) {
        return null;
    }
    const netWorth =
        liquidAssets -
        liabilities;
    const annualIncome =
        income * 12;
    if (
        annualIncome <= 0
    ) {
        return null;
    }
    const coverage =
        netWorth /
        annualIncome;
    if (coverage <= 0) {
        return 0;
    }
    return Math.max(
        0,
        Math.min(
            100,
            interpolateScore(
                coverage,
                [
                    {
                        value: 0.00,
                        score: 0
                    },
                    {
                        value: 0.25,
                        score: 25
                    },
                    {
                        value: 0.50,
                        score: 50
                    },
                    {
                        value: 1.00,
                        score: 70
                    },
                    {
                        value: 2.00,
                        score: 85
                    },
                    {
                        value: 3.00,
                        score: 100
                    }
                ]
            )
        )
    );
}
/* =========================================================
   FINANCIAL STABILITY
   ========================================================= */
function calculateFinancialStability() {
    const components = {
        liquidity:
            calculateLiquidityScore(),
        cashFlow:
            calculateCashFlowScore(),
        debt:
            calculateDebtScore(),
        incomeStability:
            calculateIncomeStabilityScore(),
        netWorth:
            calculateNetWorthScore()
    };
    const weights =
        FINANCIAL_STABILITY_CONFIG.weights;
    let weightedScore = 0;
    let availableWeight = 0;
    Object.keys(
        components
    ).forEach(
        key => {
            const score =
                components[key];
            if (
                Number.isFinite(score)
            ) {
                weightedScore +=
                    score *
                    weights[key];
                availableWeight +=
                    weights[key];
            }
        }
    );
    if (
        availableWeight <= 0
    ) {
        return {
            score: null,
            components
        };
    }
    const score =
        weightedScore /
        availableWeight;
    return {
        score:
            Math.round(
                Math.max(
                    0,
                    Math.min(
                        100,
                        score
                    )
                )
            ),
        components
    };
}
/* =========================================================
   FINANCIAL STABILITY STATUS
   ========================================================= */
function getFinancialStabilityStatus(
    score
) {
    if (
        !Number.isFinite(score)
    ) {
        return {
            key:
                "insufficient-data",
            label:
                "Недостаточно данных"
        };
    }
    if (score < 40) {
        return {
            key:
                "vulnerable",
            label:
                "Уязвимое положение"
        };
    }
    if (score < 60) {
        return {
            key:
                "developing",
            label:
                "Требует внимания"
        };
    }
    if (score < 80) {
        return {
            key:
                "stable",
            label:
                "Стабильное положение"
        };
    }
    if (score < 90) {
        return {
            key:
                "strong",
            label:
                "Сильное положение"
        };
    }
    return {
        key:
            "resilient",
        label:
            "Высокая устойчивость"
    };
}
/* =========================================================
   INCOME STATISTICS
   ========================================================= */
function getIncomeStatistics() {
    const values =
        financeState.incomeHistory
            .map(
                item =>
                    parseMoney(
                        item.amount
                    )
            )
            .filter(
                value =>
                    value > 0
            );
    if (!values.length) {
        return {
            total: 0,
            average: 0,
            minimum: 0,
            maximum: 0,
            months: 0
        };
    }
    const total =
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        );
    const average =
        total /
        values.length;
    return {
        total,
        average,
        minimum:
            Math.min(...values),
        maximum:
            Math.max(...values),
        months:
            values.length
    };
}
/* =========================================================
   RENDER HELPERS
   ========================================================= */
function renderValue(
    value
) {
    if (
        !Number.isFinite(value)
    ) {
        return "—";
    }
    return formatMoney(value);
}
function renderScore(
    value
) {
    if (
        !Number.isFinite(value)
    ) {
        return "—";
    }
    return Math.round(value);
}
/* =========================================================
   ACCORDION
   ========================================================= */
function toggleFinancePanel(
    panelId
) {
    const panel =
        document.getElementById(
            panelId
        );
    if (!panel) {
        return;
    }
    const isOpen =
        panel.classList.contains(
            "finance-panel-open"
        );
    document
        .querySelectorAll(
            ".finance-panel"
        )
        .forEach(
            item => {
                item.classList.remove(
                    "finance-panel-open"
                );
            }
        );
    if (!isOpen) {
        panel.classList.add(
            "finance-panel-open"
        );
    }
}
/* =========================================================
   SAVE FIELD
   ========================================================= */
function saveFinanceField(
    field,
    input
) {
    const value =
        parseMoney(
            input.value
        );
    financeState[field] =
        value;
    saveFinanceState();
    renderFinance();
}
/* =========================================================
   ADD INCOME
   ========================================================= */
function addIncomeEntry() {
    const input =
        document.getElementById(
            "finance-income-input"
        );
    const monthInput =
        document.getElementById(
            "finance-income-month"
        );
    if (!input) {
        return;
    }
    const amount =
        parseMoney(
            input.value
        );
    if (
        amount <= 0
    ) {
        return;
    }
    const month =
        monthInput &&
        monthInput.value
            ? monthInput.value
            : new Date()
                .toISOString()
                .slice(0, 7);
    financeState
        .incomeHistory
        .push({
            month,
            amount
        });
    /*
     * Current income is automatically updated
     * with the latest entered income.
     */
    financeState.currentIncome =
        amount;
    saveFinanceState();
    renderFinance();
}
/* =========================================================
   DELETE INCOME
   ========================================================= */
function deleteIncomeEntry(
    index
) {
    if (
        index < 0 ||
        index >=
        financeState
            .incomeHistory
            .length
    ) {
        return;
    }
    financeState
        .incomeHistory
        .splice(
            index,
            1
        );
    /*
     * Latest remaining income
     * becomes current income.
     */
    if (
        financeState
            .incomeHistory
            .length
    ) {
        const latest =
            financeState
                .incomeHistory[
                    financeState
                        .incomeHistory
                        .length - 1
                ];
        financeState.currentIncome =
            parseMoney(
                latest.amount
            );
    } else {
        financeState.currentIncome =
            0;
    }
    saveFinanceState();
    renderFinance();
}
/* =========================================================
   RENDER INCOME HISTORY
   ========================================================= */
function renderIncomeHistory() {
    if (
        !financeState
            .incomeHistory
            .length
    ) {
        return `
            <div class="finance-empty">
                История доходов пока пуста.
            </div>
        `;
    }
    return financeState
        .incomeHistory
        .map(
            (entry, index) => {
                const date =
                    entry.month
                        ? new Date(
                            `${entry.month}-01`
                        )
                        .toLocaleDateString(
                            "ru-RU",
                            {
                                month:
                                    "long",
                                year:
                                    "numeric"
                            }
                        )
                        : "Месяц";
                return `
                    <div class="finance-income-row">
                        <div>
                            <div class="finance-income-month">
                                ${date}
                            </div>
                            <div class="finance-income-amount">
                                ${formatMoney(entry.amount)} ₽
                            </div>
                        </div>
                        <button
                            class="finance-delete-button"
                            data-delete-income="${index}"
                            type="button"
                        >
                            ×
                        </button>
                    </div>
                `;
            }
        )
        .join("");
}
/* =========================================================
   MAIN RENDER
   ========================================================= */
function renderFinance() {
    const container =
        document.getElementById(
            "finance-container"
        );
    if (!container) {
        console.error(
            "LIFE GAME: Finance container не найден."
        );
        return;
    }
    const statistics =
        getIncomeStatistics();
    const stability =
        calculateFinancialStability();
    const status =
        stability.score !== null
            ? getFinancialStabilityStatus(
                stability.score
            )
            : {
                label:
                    "Недостаточно данных"
            };
    container.innerHTML = `
        <div class="finance-module">
            <div class="finance-header">
                <div class="finance-title">
                    Финансы
                </div>
                <div class="finance-subtitle">
                    Financial Overview
                </div>
            </div>
            <!-- =========================================
                 1. LIQUID ASSETS
                 ========================================= -->
            <div class="finance-section">
                <button
                    class="finance-section-button"
                    data-panel="finance-liquid-panel"
                    type="button"
                >
                    <span>
                        1. Ликвидные средства
                    </span>
                    <span class="finance-section-value">
                        ${formatMoney(
                            financeState.liquidAssets
                        )} ₽
                    </span>
                </button>
                <div
                    id="finance-liquid-panel"
                    class="finance-panel"
                >
                    <div class="finance-panel-content">
                        <div class="finance-description">
                            Деньги, которыми вы можете
                            воспользоваться сейчас.
                        </div>
                        <input
                            id="finance-liquid-input"
                            class="finance-input"
                            type="number"
                            min="0"
                            step="100"
                            value="${financeState.liquidAssets || ""}"
                            placeholder="Введите сумму"
                        />
                        <button
                            class="finance-save-button"
                            data-save-field="liquidAssets"
                            data-input-id="finance-liquid-input"
                            type="button"
                        >
                            Сохранить
                        </button>
                    </div>
                </div>
            </div>
            <!-- =========================================
                 2. ESSENTIAL EXPENSES
                 ========================================= -->
            <div class="finance-section">
                <button
                    class="finance-section-button"
                    data-panel="finance-expenses-panel"
                    type="button"
                >
                    <span>
                        2. Обязательные расходы
                    </span>
                    <span class="finance-section-value">
                        ${formatMoney(
                            financeState.essentialExpenses
                        )} ₽ / мес.
                    </span>
                </button>
                <div
                    id="finance-expenses-panel"
                    class="finance-panel"
                >
                    <div class="finance-panel-content">
                        <div class="finance-description">
                            Минимальная сумма,
                            необходимая для поддержания
                            текущего уровня жизни.
                        </div>
                        <input
                            id="finance-expenses-input"
                            class="finance-input"
                            type="number"
                            min="0"
                            step="100"
                            value="${financeState.essentialExpenses || ""}"
                            placeholder="Введите сумму"
                        />
                        <button
                            class="finance-save-button"
                            data-save-field="essentialExpenses"
                            data-input-id="finance-expenses-input"
                            type="button"
                        >
                            Сохранить
                        </button>
                    </div>
                </div>
            </div>
            <!-- =========================================
                 3. INCOME
                 ========================================= -->
            <div class="finance-section">
                <button
                    class="finance-section-button"
                    data-panel="finance-income-panel"
                    type="button"
                >
                    <span>
                        3. Доход
                    </span>
                    <span class="finance-section-value">
                        ${formatMoney(
                            financeState.currentIncome
                        )} ₽
                    </span>
                </button>
                <div
                    id="finance-income-panel"
                    class="finance-panel"
                >
                    <div class="finance-panel-content">
                        <div class="finance-description">
                            Добавьте доход за месяц.
                            Он автоматически попадёт
                            в статистику доходов.
                        </div>
                        <input
                            id="finance-income-month"
                            class="finance-input"
                            type="month"
                            value="${new Date()
                                .toISOString()
                                .slice(0, 7)}"
                        />
                        <input
                            id="finance-income-input"
                            class="finance-input"
                            type="number"
                            min="0"
                            step="100"
                            placeholder="Введите доход"
                        />
                        <button
                            class="finance-save-button"
                            id="finance-add-income"
                            type="button"
                        >
                            Добавить доход
                        </button>
                    </div>
                </div>
            </div>
            <!-- =========================================
                 4. FINANCIAL OBLIGATIONS
                 ========================================= -->
            <div class="finance-section">
                <button
                    class="finance-section-button"
                    data-panel="finance-obligations-panel"
                    type="button"
                >
                    <span>
                        4. Финансовые обязательства
                    </span>
                    <span class="finance-section-value">
                        ${formatMoney(
                            financeState.financialObligations
                        )} ₽ / мес.
                    </span>
                </button>
                <div
                    id="finance-obligations-panel"
                    class="finance-panel"
                >
                    <div class="finance-panel-content">
                        <div class="finance-description">
                            Ежемесячные платежи
                            по кредитам, займам
                            и другим финансовым обязательствам.
                        </div>
                        <input
                            id="finance-obligations-input"
                            class="finance-input"
                            type="number"
                            min="0"
                            step="100"
                            value="${financeState.financialObligations || ""}"
                            placeholder="Введите сумму"
                        />
                        <button
                            class="finance-save-button"
                            data-save-field="financialObligations"
                            data-input-id="finance-obligations-input"
                            type="button"
                        >
                            Сохранить
                        </button>
                    </div>
                </div>
            </div>
            <!-- =========================================
                 5. INCOME STATISTICS
                 ========================================= -->
            <div class="finance-section">
                <button
                    class="finance-section-button"
                    data-panel="finance-statistics-panel"
                    type="button"
                >
                    <span>
                        5. Статистика доходов
                    </span>
                    <span class="finance-section-value">
                        ${statistics.months} мес.
                    </span>
                </button>
                <div
                    id="finance-statistics-panel"
                    class="finance-panel"
                >
                    <div class="finance-panel-content">
                        <div class="finance-stat-grid">
                            <div class="finance-stat-card">
                                <span>
                                    Всего
                                </span>
                                <strong>
                                    ${formatMoney(
                                        statistics.total
                                    )} ₽
                                </strong>
                            </div>
                            <div class="finance-stat-card">
                                <span>
                                    Средний доход
                                </span>
                                <strong>
                                    ${formatMoney(
                                        statistics.average
                                    )} ₽
                                </strong>
                            </div>
                            <div class="finance-stat-card">
                                <span>
                                    Минимум
                                </span>
                                <strong>
                                    ${formatMoney(
                                        statistics.minimum
                                    )} ₽
                                </strong>
                            </div>
                            <div class="finance-stat-card">
                                <span>
                                    Максимум
                                </span>
                                <strong>
                                    ${formatMoney(
                                        statistics.maximum
                                    )} ₽
                                </strong>
                            </div>
                        </div>
                        <div class="finance-history">
                            <div class="finance-history-title">
                                История
                            </div>
                            ${renderIncomeHistory()}
                        </div>
                    </div>
                </div>
            </div>
            <!-- =========================================
                 6. FINANCIAL STABILITY
                 ========================================= -->
            <div class="finance-stability">
                <div class="finance-stability-header">
                    <div>
                        <div class="finance-stability-title">
                            6. Финансовая стабильность
                        </div>
                        <div class="finance-stability-subtitle">
                            Financial Stability Score
                        </div>
                    </div>
                    <div class="finance-stability-score">
                        ${
                            stability.score !== null
                                ? stability.score
                                : "—"
                        }
                        <span>/100</span>
                    </div>
                </div>
                <div class="finance-stability-status">
                    ${
                        status.label
                    }
                </div>
                <div class="finance-stability-components">
                    <div class="finance-stability-row">
                        <span>
                            Ликвидность
                        </span>
                        <strong>
                            ${renderScore(
                                stability.components.liquidity
                            )}
                        </strong>
                    </div>
                    <div class="finance-stability-row">
                        <span>
                            Денежный поток
                        </span>
                        <strong>
                            ${renderScore(
                                stability.components.cashFlow
                            )}
                        </strong>
                    </div>
                    <div class="finance-stability-row">
                        <span>
                            Долговая нагрузка
                        </span>
                        <strong>
                            ${renderScore(
                                stability.components.debt
                            )}
                        </strong>
                    </div>
                    <div class="finance-stability-row">
                        <span>
                            Стабильность дохода
                        </span>
                        <strong>
                            ${renderScore(
                                stability.components.incomeStability
                            )}
                        </strong>
                    </div>
                    <div class="finance-stability-row">
                        <span>
                            Чистый капитал
                        </span>
                        <strong>
                            ${renderScore(
                                stability.components.netWorth
                            )}
                        </strong>
                    </div>
                </div>
                <div class="finance-stability-info">
                    <div>
                        Ликвидность — 30%
                    </div>
                    <div>
                        Денежный поток — 25%
                    </div>
                    <div>
                        Долговая нагрузка — 20%
                    </div>
                    <div>
                        Стабильность дохода — 15%
                    </div>
                    <div>
                        Чистый капитал — 10%
                    </div>
                </div>
            </div>
        </div>
    `;
    bindFinanceEvents();
}
/* =========================================================
   EVENTS
   ========================================================= */
function bindFinanceEvents() {
    /*
     * Accordion buttons
     */
    document
        .querySelectorAll(
            ".finance-section-button"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        toggleFinancePanel(
                            button.dataset.panel
                        );
                    }
                );
            }
        );
    /*
     * Save buttons
     */
    document
        .querySelectorAll(
            ".finance-save-button"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        const field =
                            button.dataset
                                .saveField;
                        const input =
                            document.getElementById(
                                button.dataset
                                    .inputId
                            );
                        if (
                            !field ||
                            !input
                        ) {
                            return;
                        }
                        saveFinanceField(
                            field,
                            input
                        );
                    }
                );
            }
        );
    /*
     * Add income
     */
    const addIncomeButton =
        document.getElementById(
            "finance-add-income"
        );
    if (addIncomeButton) {
        addIncomeButton.addEventListener(
            "click",
            addIncomeEntry
        );
    }
    /*
     * Delete income entries
     */
    document
        .querySelectorAll(
            "[data-delete-income]"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        deleteIncomeEntry(
                            Number(
                                button.dataset
                                    .deleteIncome
                            )
                        );
                    }
                );
            }
        );
}
/* =========================================================
   INITIALIZATION
   ========================================================= */
function initFinance() {
    const container =
        document.getElementById(
            "finance-container"
        );
    if (!container) {
        console.error(
            "LIFE GAME: Finance container не найден."
        );
        return;
    }
    renderFinance();
    console.log(
        "LIFE GAME: Finance module работает."
    );
}
/* =========================================================
   PUBLIC API
   ========================================================= */
export {
    initFinance,
    calculateFinancialStability,
    getIncomeStatistics
};