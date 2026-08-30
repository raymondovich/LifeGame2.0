/* =========================================================
   LIFE GAME 2.0
   FINANCE MODULE
   =========================================================
   Finance — аналитический модуль качества жизни.
   Здесь НЕТ:
   - XP
   - Level
   - Lifetime XP
   - игровых наград
   - игровых очков
   Здесь есть:
   1. Ликвидные средства
   2. Обязательные расходы
   3. Доход
   4. Финансовые обязательства
   5. Статистика доходов
   6. Financial Stability Score
   ========================================================= */
/* =========================================================
   STORAGE
   ========================================================= */
const STORAGE_KEY = "lifegame_finance_v2";
/* =========================================================
   DEFAULT DATA
   ========================================================= */
const DEFAULT_DATA = {
    liquidAssets: 0,
    essentialExpenses: 0,
    totalLiabilities: 0,
    monthlyDebtPayments: 0,
    incomeHistory: []
};
/* =========================================================
   LOAD DATA
   ========================================================= */
let financeData = loadFinanceData();
function loadFinanceData() {
    try {
        const saved =
            localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            return {
                ...DEFAULT_DATA,
                incomeHistory: []
            };
        }
        const parsed =
            JSON.parse(saved);
        return {
            ...DEFAULT_DATA,
            ...parsed,
            incomeHistory:
                Array.isArray(parsed.incomeHistory)
                    ? parsed.incomeHistory
                    : []
        };
    } catch (error) {
        console.error(
            "Finance: ошибка загрузки данных",
            error
        );
        return {
            ...DEFAULT_DATA,
            incomeHistory: []
        };
    }
}
/* =========================================================
   SAVE DATA
   ========================================================= */
function saveFinanceData() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(financeData)
    );
}
/* =========================================================
   HELPERS
   ========================================================= */
function number(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }
    const parsed =
        Number(
            String(value)
                .replace(/\s/g, "")
                .replace(",", ".")
        );
    return Number.isFinite(parsed)
        ? Math.max(0, parsed)
        : 0;
}
function money(value) {
    return new Intl.NumberFormat(
        "ru-RU",
        {
            maximumFractionDigits: 0
        }
    ).format(
        number(value)
    );
}
function percent(value) {
    if (!Number.isFinite(value)) {
        return "—";
    }
    return `${Math.round(value * 100)}%`;
}
/* =========================================================
   CURRENT INCOME
   ========================================================= */
function getCurrentIncome() {
    if (
        financeData.incomeHistory.length === 0
    ) {
        return 0;
    }
    const sorted =
        [...financeData.incomeHistory]
            .sort(
                (a, b) =>
                    a.month.localeCompare(b.month)
            );
    return number(
        sorted[sorted.length - 1].amount
    );
}
/* =========================================================
   INCOME STATISTICS
   ========================================================= */
function getIncomeStatistics() {
    const values =
        financeData.incomeHistory
            .map(item => number(item.amount))
            .filter(value => value > 0);
    if (values.length === 0) {
        return {
            count: 0,
            total: 0,
            average: 0,
            minimum: 0,
            maximum: 0,
            standardDeviation: 0,
            coefficientOfVariation: null
        };
    }
    const total =
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        );
    const average =
        total / values.length;
    const variance =
        values.reduce(
            (sum, value) =>
                sum +
                Math.pow(
                    value - average,
                    2
                ),
            0
        ) / values.length;
    const standardDeviation =
        Math.sqrt(variance);
    const coefficientOfVariation =
        average > 0
            ? standardDeviation / average
            : null;
    return {
        count: values.length,
        total,
        average,
        minimum: Math.min(...values),
        maximum: Math.max(...values),
        standardDeviation,
        coefficientOfVariation
    };
}
/* =========================================================
   SCORE HELPERS
   ========================================================= */
function clamp(
    value,
    min = 0,
    max = 100
) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}
/* =========================================================
   LIQUIDITY SCORE
   =========================================================
   Liquid Assets /
   Essential Monthly Expenses
   Показывает количество месяцев,
   которые человек способен прожить
   без нового дохода.
   ========================================================= */
function calculateLiquidity() {
    const assets =
        number(
            financeData.liquidAssets
        );
    const expenses =
        number(
            financeData.essentialExpenses
        );
    if (expenses <= 0) {
        return {
            months: null,
            score: null
        };
    }
    const months =
        assets / expenses;
    let score = 0;
    if (months >= 9) {
        score = 100;
    } else if (months >= 6) {
        score = 90;
    } else if (months >= 3) {
        score = 70;
    } else if (months >= 2) {
        score = 50;
    } else if (months >= 1) {
        score = 30;
    }
    return {
        months,
        score
    };
}
/* =========================================================
   CASH FLOW SCORE
   ========================================================= */
function calculateCashFlow() {
    const income =
        getCurrentIncome();
    const expenses =
        number(
            financeData.essentialExpenses
        );
    if (income <= 0) {
        return {
            rate: null,
            score: null
        };
    }
    const rate =
        (
            income - expenses
        ) / income;
    let score = 0;
    if (rate >= 0.40) {
        score = 100;
    } else if (rate >= 0.30) {
        score = 90;
    } else if (rate >= 0.20) {
        score = 75;
    } else if (rate >= 0.10) {
        score = 55;
    } else if (rate > 0) {
        score = 30;
    }
    return {
        rate,
        score
    };
}
/* =========================================================
   DEBT SCORE
   ========================================================= */
function calculateDebt() {
    const income =
        getCurrentIncome();
    const payments =
        number(
            financeData.monthlyDebtPayments
        );
    if (income <= 0) {
        return {
            ratio: null,
            score: null
        };
    }
    const ratio =
        payments / income;
    let score = 0;
    if (ratio <= 0.10) {
        score = 100;
    } else if (ratio <= 0.20) {
        score = 85;
    } else if (ratio <= 0.30) {
        score = 65;
    } else if (ratio <= 0.40) {
        score = 40;
    } else if (ratio < 0.50) {
        score = 20;
    }
    return {
        ratio,
        score
    };
}
/* =========================================================
   INCOME STABILITY SCORE
   ========================================================= */
function calculateIncomeStability() {
    const stats =
        getIncomeStatistics();
    if (
        stats.count < 3 ||
        stats.coefficientOfVariation === null
    ) {
        return {
            coefficient: null,
            score: null
        };
    }
    const cv =
        stats.coefficientOfVariation;
    let score = 0;
    if (cv <= 0.05) {
        score = 100;
    } else if (cv <= 0.10) {
        score = 90;
    } else if (cv <= 0.20) {
        score = 75;
    } else if (cv <= 0.30) {
        score = 55;
    } else if (cv <= 0.40) {
        score = 30;
    }
    return {
        coefficient: cv,
        score
    };
}
/* =========================================================
   NET WORTH SCORE
   ========================================================= */
function calculateNetWorth() {
    const assets =
        number(
            financeData.liquidAssets
        );
    const liabilities =
        number(
            financeData.totalLiabilities
        );
    const netWorth =
        assets - liabilities;
    const income =
        getCurrentIncome();
    if (income <= 0) {
        return {
            netWorth,
            score: null
        };
    }
    const annualIncome =
        income * 12;
    const ratio =
        netWorth / annualIncome;
    let score = 0;
    if (ratio >= 3) {
        score = 100;
    } else if (ratio >= 2) {
        score = 85;
    } else if (ratio >= 1) {
        score = 70;
    } else if (ratio >= 0.5) {
        score = 50;
    } else if (ratio > 0) {
        score = 25;
    }
    return {
        netWorth,
        score
    };
}
/* =========================================================
   FINANCIAL STABILITY SCORE
   ========================================================= */
function calculateFinancialStability() {
    const liquidity =
        calculateLiquidity();
    const cashFlow =
        calculateCashFlow();
    const debt =
        calculateDebt();
    const incomeStability =
        calculateIncomeStability();
    const netWorth =
        calculateNetWorth();
    const components = [
        {
            name: "Ликвидность",
            score: liquidity.score,
            weight: 0.30
        },
        {
            name: "Денежный поток",
            score: cashFlow.score,
            weight: 0.25
        },
        {
            name: "Долговая нагрузка",
            score: debt.score,
            weight: 0.20
        },
        {
            name: "Стабильность дохода",
            score: incomeStability.score,
            weight: 0.15
        },
        {
            name: "Чистый капитал",
            score: netWorth.score,
            weight: 0.10
        }
    ];
    let weightedScore = 0;
    let availableWeight = 0;
    components.forEach(component => {
        if (
            Number.isFinite(component.score)
        ) {
            weightedScore +=
                component.score *
                component.weight;
            availableWeight +=
                component.weight;
        }
    });
    if (availableWeight === 0) {
        return {
            score: null,
            components,
            liquidity,
            cashFlow,
            debt,
            incomeStability,
            netWorth
        };
    }
    const score =
        weightedScore /
        availableWeight;
    return {
        score: Math.round(
            clamp(score)
        ),
        components,
        liquidity,
        cashFlow,
        debt,
        incomeStability,
        netWorth
    };
}
/* =========================================================
   STATUS
   ========================================================= */
function getStabilityStatus(score) {
    if (!Number.isFinite(score)) {
        return "Недостаточно данных";
    }
    if (score < 40) {
        return "Уязвимое положение";
    }
    if (score < 60) {
        return "Требует внимания";
    }
    if (score < 80) {
        return "Стабильное положение";
    }
    if (score < 90) {
        return "Сильное положение";
    }
    return "Высокая устойчивость";
}
/* =========================================================
   INJECT MODULE CSS
   =========================================================
   В текущем репозитории finance.css практически пустой,
   поэтому модуль получает собственные стили.
   ========================================================= */
function injectFinanceStyles() {
    if (
        document.getElementById(
            "finance-module-styles"
        )
    ) {
        return;
    }
    const style =
        document.createElement("style");
    style.id =
        "finance-module-styles";
    style.textContent = `
        .finance-module {
            width: 100%;
            color: #ffffff;
        }
        .finance-header {
            margin-bottom: 18px;
        }
        .finance-header-title {
            font-size: 26px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .finance-header-subtitle {
            margin-top: 4px;
            color: #777777;
            font-size: 12px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }
        .finance-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .finance-item {
            width: 100%;
            border: 1px solid #252525;
            border-radius: 14px;
            background: #0d0d0d;
            overflow: hidden;
        }
        .finance-item-button {
            width: 100%;
            min-height: 70px;
            padding: 16px;
            border: 0;
            background: transparent;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            text-align: left;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
        }
        .finance-item-button:active {
            background: #151515;
        }
        .finance-item-left {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
        }
        .finance-item-number {
            width: 30px;
            height: 30px;
            flex: 0 0 30px;
            border: 1px solid #303030;
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #888888;
            font-size: 12px;
        }
        .finance-item-title {
            font-size: 15px;
            font-weight: 600;
        }
        .finance-item-value {
            margin-top: 4px;
            color: #777777;
            font-size: 12px;
        }
        .finance-item-arrow {
            color: #666666;
            font-size: 18px;
            transition: transform 0.2s ease;
        }
        .finance-item.open
        .finance-item-arrow {
            transform: rotate(90deg);
        }
        .finance-drawer {
            display: none;
            padding: 0 16px 16px 58px;
            border-top: 1px solid #202020;
        }
        .finance-item.open
        .finance-drawer {
            display: block;
        }
        .finance-description {
            padding: 14px 0;
            color: #777777;
            font-size: 12px;
            line-height: 1.5;
        }
        .finance-label {
            display: block;
            margin-bottom: 7px;
            color: #999999;
            font-size: 11px;
        }
        .finance-input {
            width: 100%;
            height: 48px;
            padding: 0 14px;
            border: 1px solid #292929;
            border-radius: 10px;
            outline: none;
            background: #080808;
            color: #ffffff;
            font-size: 16px;
        }
        .finance-input:focus {
            border-color: #555555;
        }
        .finance-field {
            margin-bottom: 12px;
        }
        .finance-save {
            width: 100%;
            min-height: 46px;
            margin-top: 4px;
            border: 1px solid #3b3b3b;
            border-radius: 10px;
            background: #171717;
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }
        .finance-save:active {
            background: #242424;
        }
        .finance-history {
            margin-top: 12px;
        }
        .finance-history-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #1d1d1d;
        }
        .finance-history-month {
            color: #888888;
            font-size: 12px;
        }
        .finance-history-amount {
            margin-top: 3px;
            font-size: 14px;
        }
        .finance-delete {
            width: 32px;
            height: 32px;
            border: 0;
            border-radius: 8px;
            background: #151515;
            color: #777777;
            font-size: 18px;
            cursor: pointer;
        }
        .finance-statistics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 12px;
        }
        .finance-stat {
            padding: 12px;
            border: 1px solid #202020;
            border-radius: 10px;
            background: #090909;
        }
        .finance-stat-label {
            display: block;
            color: #777777;
            font-size: 10px;
        }
        .finance-stat-value {
            display: block;
            margin-top: 6px;
            font-size: 14px;
        }
        .finance-stability {
            margin-top: 10px;
            padding: 18px;
            border: 1px solid #303030;
            border-radius: 16px;
            background: #0c0c0c;
        }
        .finance-stability-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
        }
        .finance-stability-title {
            font-size: 17px;
            font-weight: 700;
        }
        .finance-stability-subtitle {
            margin-top: 4px;
            color: #777777;
            font-size: 10px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .finance-score {
            font-size: 30px;
            font-weight: 700;
            white-space: nowrap;
        }
        .finance-score span {
            color: #666666;
            font-size: 12px;
            font-weight: 400;
        }
        .finance-status {
            margin-top: 12px;
            color: #999999;
            font-size: 12px;
        }
        .finance-score-list {
            margin-top: 18px;
        }
        .finance-score-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #1d1d1d;
        }
        .finance-score-row:last-child {
            border-bottom: 0;
        }
        .finance-score-name {
            color: #999999;
            font-size: 12px;
        }
        .finance-score-number {
            font-size: 13px;
            font-weight: 600;
        }
        .finance-empty {
            padding: 12px 0;
            color: #666666;
            font-size: 12px;
        }
    `;
    document.head.appendChild(style);
}
/* =========================================================
   RENDER INCOME HISTORY
   ========================================================= */
function renderIncomeHistory() {
    if (
        financeData.incomeHistory.length === 0
    ) {
        return `
            <div class="finance-empty">
                История доходов пока пуста.
            </div>
        `;
    }
    const sorted =
        financeData.incomeHistory
            .map(
                (item, index) => ({
                    ...item,
                    index
                })
            )
            .sort(
                (a, b) =>
                    b.month.localeCompare(
                        a.month
                    )
            );
    return sorted
        .map(item => {
            const date =
                new Date(
                    `${item.month}-01T00:00:00`
                );
            const month =
                date.toLocaleDateString(
                    "ru-RU",
                    {
                        month: "long",
                        year: "numeric"
                    }
                );
            return `
                <div class="finance-history-row">
                    <div>
                        <div class="finance-history-month">
                            ${month}
                        </div>
                        <strong>
                            ${money(item.amount)} ₽
                        </strong>
                    </div>
                    <button
                        class="finance-delete"
                        data-delete-income="${item.index}"
                        type="button"
                        aria-label="Удалить доход"
                    >
                        ×
                    </button>
                </div>
            `;
        })
        .join("");
}
/* =========================================================
   RENDER MODULE
   ========================================================= */
function renderFinance() {
    const container =
        document.getElementById(
            "finance-container"
        );
    if (!container) {
        console.error(
            "LIFE GAME: #finance-container не найден."
        );
        return;
    }
    injectFinanceStyles();
    const currentIncome =
        getCurrentIncome();
    const statistics =
        getIncomeStatistics();
    const stability =
        calculateFinancialStability();
    const score =
        stability.score;
    const status =
        getStabilityStatus(score);
    const scoreValue =
        Number.isFinite(score)
            ? score
            : "—";
    container.innerHTML = `
        <div class="finance-module">
            <div class="finance-header">
                <div class="finance-header-title">
                    Финансы
                </div>
                <div class="finance-header-subtitle">
                    Financial Overview
                </div>
            </div>
            <div class="finance-list">
                <!-- =====================================
                     1. LIQUID ASSETS
                     ===================================== -->
                <div class="finance-item">
                    <button
                        type="button"
                        class="finance-item-button"
                        data-open-finance="liquid"
                    >
                        <div class="finance-item-left">
                            <div class="finance-item-number">
                                01
                            </div>
                            <div>
                                <div class="finance-item-title">
                                    Ликвидные средства
                                </div>
                                <div class="finance-item-value">
                                    ${money(
                                        financeData.liquidAssets
                                    )} ₽
                                </div>
                            </div>
                        </div>
                        <div class="finance-item-arrow">
                            ›
                        </div>
                    </button>
                    <div
                        class="finance-drawer"
                        data-drawer="liquid"
                    >
                        <div class="finance-description">
                            Средства, которыми вы можете
                            воспользоваться непосредственно сейчас.
                        </div>
                        <div class="finance-field">
                            <label class="finance-label">
                                Сумма
                            </label>
                            <input
                                id="finance-liquid"
                                class="finance-input"
                                type="number"
                                min="0"
                                inputmode="decimal"
                                value="${
                                    financeData.liquidAssets || ""
                                }"
                                placeholder="0"
                            />
                        </div>
                        <button
                            type="button"
                            class="finance-save"
                            data-save-liquid
                        >
                            Сохранить
                        </button>
                    </div>
                </div>
                <!-- =====================================
                     2. ESSENTIAL EXPENSES
                     ===================================== -->
                <div class="finance-item">
                    <button
                        type="button"
                        class="finance-item-button"
                        data-open-finance="expenses"
                    >
                        <div class="finance-item-left">
                            <div class="finance-item-number">
                                02
                            </div>
                            <div>
                                <div class="finance-item-title">
                                    Обязательные расходы
                                </div>
                                <div class="finance-item-value">
                                    ${money(
                                        financeData.essentialExpenses
                                    )} ₽ / месяц
                                </div>
                            </div>
                        </div>
                        <div class="finance-item-arrow">
                            ›
                        </div>
                    </button>
                    <div
                        class="finance-drawer"
                        data-drawer="expenses"
                    >
                        <div class="finance-description">
                            Минимальная сумма обязательных
                            ежемесячных расходов.
                        </div>
                        <div class="finance-field">
                            <label class="finance-label">
                                Сумма в месяц
                            </label>
                            <input
                                id="finance-expenses"
                                class="finance-input"
                                type="number"
                                min="0"
                                inputmode="decimal"
                                value="${
                                    financeData.essentialExpenses || ""
                                }"
                                placeholder="0"
                            />
                        </div>
                        <button
                            type="button"
                            class="finance-save"
                            data-save-expenses
                        >
                            Сохранить
                        </button>
                    </div>
                </div>
                <!-- =====================================
                     3. INCOME
                     ===================================== -->
                <div class="finance-item">
                    <button
                        type="button"
                        class="finance-item-button"
                        data-open-finance="income"
                    >
                        <div class="finance-item-left">
                            <div class="finance-item-number">
                                03
                            </div>
                            <div>
                                <div class="finance-item-title">
                                    Доход
                                </div>
                                <div class="finance-item-value">
                                    ${money(currentIncome)} ₽
                                </div>
                            </div>
                        </div>
                        <div class="finance-item-arrow">
                            ›
                        </div>
                    </button>
                    <div
                        class="finance-drawer"
                        data-drawer="income"
                    >
                        <div class="finance-description">
                            Добавляйте фактический доход
                            за каждый месяц. История используется
                            для анализа финансовой устойчивости.
                        </div>
                        <div class="finance-field">
                            <label class="finance-label">
                                Месяц
                            </label>
                            <input
                                id="finance-income-month"
                                class="finance-input"
                                type="month"
                            />
                        </div>
                        <div class="finance-field">
                            <label class="finance-label">
                                Доход
                            </label>
                            <input
                                id="finance-income"
                                class="finance-input"
                                type="number"
                                min="0"
                                inputmode="decimal"
                                placeholder="0"
                            />
                        </div>
                        <button
                            type="button"
                            class="finance-save"
                            data-save-income
                        >
                            Сохранить доход
                        </button>
                        <div class="finance-history">
                            ${renderIncomeHistory()}
                        </div>
                    </div>
                </div>
                <!-- =====================================
                     4. OBLIGATIONS
                     ===================================== -->
                <div class="finance-item">
                    <button
                        type="button"
                        class="finance-item-button"
                        data-open-finance="obligations"
                    >
                        <div class="finance-item-left">
                            <div class="finance-item-number">
                                04
                            </div>
                            <div>
                                <div class="finance-item-title">
                                    Финансовые обязательства
                                </div>
                                <div class="finance-item-value">
                                    ${money(
                                        financeData.totalLiabilities
                                    )} ₽
                                </div>
                            </div>
                        </div>
                        <div class="finance-item-arrow">
                            ›
                        </div>
                    </button>
                    <div
                        class="finance-drawer"
                        data-drawer="obligations"
                    >
                        <div class="finance-description">
                            Общая сумма обязательств и
                            обязательные ежемесячные платежи.
                        </div>
                        <div class="finance-field">
                            <label class="finance-label">
                                Общая сумма обязательств
                            </label>
                            <input
                                id="finance-liabilities"
                                class="finance-input"
                                type="number"
                                min="0"
                                inputmode="decimal"
                                value="${
                                    financeData.totalLiabilities || ""
                                }"
                                placeholder="0"
                            />
                        </div>
                        <div class="finance-field">
                            <label class="finance-label">
                                Ежемесячные платежи
                            </label>
                            <input
                                id="finance-debt-payments"
                                class="finance-input"
                                type="number"
                                min="0"
                                inputmode="decimal"
                                value="${
                                    financeData.monthlyDebtPayments || ""
                                }"
                                placeholder="0"
                            />
                        </div>
                        <button
                            type="button"
                            class="finance-save"
                            data-save-obligations
                        >
                            Сохранить
                        </button>
                    </div>
                </div>
                <!-- =====================================
                     5. STATISTICS
                     ===================================== -->
                <div class="finance-item">
                    <button
                        type="button"
                        class="finance-item-button"
                        data-open-finance="statistics"
                    >
                        <div class="finance-item-left">
                            <div class="finance-item-number">
                                05
                            </div>
                            <div>
                                <div class="finance-item-title">
                                    Статистика доходов
                                </div>
                                <div class="finance-item-value">
                                    ${statistics.count} мес.
                                </div>
                            </div>
                        </div>
                        <div class="finance-item-arrow">
                            ›
                        </div>
                    </button>
                    <div
                        class="finance-drawer"
                        data-drawer="statistics"
                    >
                        <div class="finance-statistics">
                            <div class="finance-stat">
                                <span class="finance-stat-label">
                                    Средний доход
                                </span>
                                <strong class="finance-stat-value">
                                    ${money(
                                        statistics.average
                                    )} ₽
                                </strong>
                            </div>
                            <div class="finance-stat">
                                <span class="finance-stat-label">
                                    Минимальный
                                </span>
                                <strong class="finance-stat-value">
                                    ${money(
                                        statistics.minimum
                                    )} ₽
                                </strong>
                            </div>
                            <div class="finance-stat">
                                <span class="finance-stat-label">
                                    Максимальный
                                </span>
                                <strong class="finance-stat-value">
                                    ${money(
                                        statistics.maximum
                                    )} ₽
                                </strong>
                            </div>
                            <div class="finance-stat">
                                <span class="finance-stat-label">
                                    Всего за период
                                </span>
                                <strong class="finance-stat-value">
                                    ${money(
                                        statistics.total
                                    )} ₽
                                </strong>
                            </div>
                        </div>
                        <div class="finance-history">
                            ${renderIncomeHistory()}
                        </div>
                    </div>
                </div>
            </div>
            <!-- =========================================
                 6. FINANCIAL STABILITY
                 ========================================= -->
            <div class="finance-stability">
                <div class="finance-stability-top">
                    <div>
                        <div class="finance-stability-title">
                            Финансовая стабильность
                        </div>
                        <div class="finance-stability-subtitle">
                            Financial Stability Score
                        </div>
                    </div>
                    <div class="finance-score">
                        ${scoreValue}
                        <span>/100</span>
                    </div>
                </div>
                <div class="finance-status">
                    ${status}
                </div>
                <div class="finance-score-list">
                    <div class="finance-score-row">
                        <span class="finance-score-name">
                            Ликвидность · 30%
                        </span>
                        <strong class="finance-score-number">
                            ${
                                Number.isFinite(
                                    stability.liquidity.score
                                )
                                    ? stability.liquidity.score
                                    : "—"
                            }
                        </strong>
                    </div>
                    <div class="finance-score-row">
                        <span class="finance-score-name">
                            Денежный поток · 25%
                        </span>
                        <strong class="finance-score-number">
                            ${
                                Number.isFinite(
                                    stability.cashFlow.score
                                )
                                    ? stability.cashFlow.score
                                    : "—"
                            }
                        </strong>
                    </div>
                    <div class="finance-score-row">
                        <span class="finance-score-name">
                            Долговая нагрузка · 20%
                        </span>
                        <strong class="finance-score-number">
                            ${
                                Number.isFinite(
                                    stability.debt.score
                                )
                                    ? stability.debt.score
                                    : "—"
                            }
                        </strong>
                    </div>
                    <div class="finance-score-row">
                        <span class="finance-score-name">
                            Стабильность дохода · 15%
                        </span>
                        <strong class="finance-score-number">
                            ${
                                Number.isFinite(
                                    stability
                                        .incomeStability
                                        .score
                                )
                                    ? stability
                                        .incomeStability
                                        .score
                                    : "—"
                            }
                        </strong>
                    </div>
                    <div class="finance-score-row">
                        <span class="finance-score-name">
                            Чистый капитал · 10%
                        </span>
                        <strong class="finance-score-number">
                            ${
                                Number.isFinite(
                                    stability
                                        .netWorth
                                        .score
                                )
                                    ? stability
                                        .netWorth
                                        .score
                                    : "—"
                            }
                        </strong>
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
    /* ---------------------------------------------
       OPEN / CLOSE DRAWERS
       --------------------------------------------- */
    document
        .querySelectorAll(
            "[data-open-finance]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const name =
                        button.dataset
                            .openFinance;
                    const item =
                        button.closest(
                            ".finance-item"
                        );
                    const alreadyOpen =
                        item.classList.contains(
                            "open"
                        );
                    document
                        .querySelectorAll(
                            ".finance-item"
                        )
                        .forEach(
                            element => {
                                element.classList.remove(
                                    "open"
                                );
                            }
                        );
                    if (!alreadyOpen) {
                        item.classList.add(
                            "open"
                        );
                    }
                }
            );
        });
    /* ---------------------------------------------
       LIQUID ASSETS
       --------------------------------------------- */
    const liquidSave =
        document.querySelector(
            "[data-save-liquid]"
        );
    if (liquidSave) {
        liquidSave.addEventListener(
            "click",
            () => {
                financeData.liquidAssets =
                    number(
                        document.getElementById(
                            "finance-liquid"
                        ).value
                    );
                saveFinanceData();
                renderFinance();
            }
        );
    }
    /* ---------------------------------------------
       ESSENTIAL EXPENSES
       --------------------------------------------- */
    const expensesSave =
        document.querySelector(
            "[data-save-expenses]"
        );
    if (expensesSave) {
        expensesSave.addEventListener(
            "click",
            () => {
                financeData.essentialExpenses =
                    number(
                        document.getElementById(
                            "finance-expenses"
                        ).value
                    );
                saveFinanceData();
                renderFinance();
            }
        );
    }
    /* ---------------------------------------------
       INCOME
       --------------------------------------------- */
    const incomeSave =
        document.querySelector(
            "[data-save-income]"
        );
    if (incomeSave) {
        incomeSave.addEventListener(
            "click",
            () => {
                const month =
                    document.getElementById(
                        "finance-income-month"
                    ).value;
                const amount =
                    number(
                        document.getElementById(
                            "finance-income"
                        ).value
                    );
                if (
                    !month ||
                    amount <= 0
                ) {
                    return;
                }
                const existing =
                    financeData
                        .incomeHistory
                        .find(
                            item =>
                                item.month === month
                        );
                if (existing) {
                    existing.amount =
                        amount;
                } else {
                    financeData
                        .incomeHistory
                        .push({
                            month,
                            amount
                        });
                }
                saveFinanceData();
                renderFinance();
            }
        );
    }
    /* ---------------------------------------------
       OBLIGATIONS
       --------------------------------------------- */
    const obligationsSave =
        document.querySelector(
            "[data-save-obligations]"
        );
    if (obligationsSave) {
        obligationsSave.addEventListener(
            "click",
            () => {
                financeData.totalLiabilities =
                    number(
                        document.getElementById(
                            "finance-liabilities"
                        ).value
                    );
                financeData.monthlyDebtPayments =
                    number(
                        document.getElementById(
                            "finance-debt-payments"
                        ).value
                    );
                saveFinanceData();
                renderFinance();
            }
        );
    }
    /* ---------------------------------------------
       DELETE INCOME
       --------------------------------------------- */
    document
        .querySelectorAll(
            "[data-delete-income]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                event => {
                    event.stopPropagation();
                    const index =
                        Number(
                            button.dataset
                                .deleteIncome
                        );
                    if (
                        !Number.isInteger(index)
                    ) {
                        return;
                    }
                    financeData
                        .incomeHistory
                        .splice(
                            index,
                            1
                        );
                    saveFinanceData();
                    renderFinance();
                }
            );
        });
}
/* =========================================================
   INIT
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
        "LIFE GAME: Finance module initialized."
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