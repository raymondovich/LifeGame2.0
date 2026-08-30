/* =========================================================
   LIFE GAME 2.0
   FINANCE MODULE
   ---------------------------------------------------------
   Logic + structure only.
   All visual styling is handled by finance.css.
   ========================================================= */

const STORAGE_KEY = "lifegame_finance_v2";

const DEFAULT_DATA = {
    liquidAssets: 0,
    essentialExpenses: 0,
    totalLiabilities: 0,
    monthlyDebtPayments: 0,
    incomeHistory: []
};

let financeData = loadFinanceData();


/* =========================================================
   STORAGE
   ========================================================= */

function loadFinanceData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return {
                ...DEFAULT_DATA,
                incomeHistory: []
            };
        }

        const parsed = JSON.parse(saved);

        return {
            ...DEFAULT_DATA,
            ...parsed,
            incomeHistory: Array.isArray(parsed.incomeHistory)
                ? parsed.incomeHistory
                : []
        };

    } catch (error) {
        console.error("Finance: storage load error", error);

        return {
            ...DEFAULT_DATA,
            incomeHistory: []
        };
    }
}


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

    const parsed = Number(
        String(value)
            .replace(/\s/g, "")
            .replace(",", ".")
    );

    return Number.isFinite(parsed)
        ? Math.max(0, parsed)
        : 0;
}


function money(value) {
    return new Intl.NumberFormat("ru-RU", {
        maximumFractionDigits: 0
    }).format(number(value));
}


function clamp(value, min = 0, max = 100) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}


/* =========================================================
   INCOME
   ========================================================= */

function getCurrentIncome() {
    if (financeData.incomeHistory.length === 0) {
        return 0;
    }

    const sorted = [...financeData.incomeHistory].sort(
        (a, b) => a.month.localeCompare(b.month)
    );

    return number(
        sorted[sorted.length - 1].amount
    );
}


function getIncomeStatistics() {
    const values = financeData.incomeHistory
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

    const total = values.reduce(
        (sum, value) => sum + value,
        0
    );

    const average = total / values.length;

    const variance = values.reduce(
        (sum, value) =>
            sum + Math.pow(value - average, 2),
        0
    ) / values.length;

    const standardDeviation = Math.sqrt(variance);

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
   FINANCIAL STABILITY MODEL
   ========================================================= */


/*
   1. LIQUIDITY

   Liquid assets / essential monthly expenses

   Measures how many months the user can maintain
   essential spending without new income.
*/

function calculateLiquidity() {
    const assets = number(
        financeData.liquidAssets
    );

    const expenses = number(
        financeData.essentialExpenses
    );

    if (expenses <= 0) {
        return {
            months: null,
            score: null
        };
    }

    const months = assets / expenses;

    let score = 0;

    if (months >= 9) score = 100;
    else if (months >= 6) score = 90;
    else if (months >= 3) score = 70;
    else if (months >= 2) score = 50;
    else if (months >= 1) score = 30;

    return {
        months,
        score
    };
}


/*
   2. CASH FLOW

   (Income - essential expenses) / income
*/

function calculateCashFlow() {
    const income = getCurrentIncome();

    const expenses = number(
        financeData.essentialExpenses
    );

    if (income <= 0) {
        return {
            rate: null,
            score: null
        };
    }

    const rate =
        (income - expenses) / income;

    let score = 0;

    if (rate >= 0.40) score = 100;
    else if (rate >= 0.30) score = 90;
    else if (rate >= 0.20) score = 75;
    else if (rate >= 0.10) score = 55;
    else if (rate > 0) score = 30;

    return {
        rate,
        score
    };
}


/*
   3. DEBT BURDEN

   Monthly debt payments / income
*/

function calculateDebt() {
    const income = getCurrentIncome();

    const payments = number(
        financeData.monthlyDebtPayments
    );

    if (income <= 0) {
        return {
            ratio: null,
            score: null
        };
    }

    const ratio = payments / income;

    let score = 0;

    if (ratio <= 0.10) score = 100;
    else if (ratio <= 0.20) score = 85;
    else if (ratio <= 0.30) score = 65;
    else if (ratio <= 0.40) score = 40;
    else if (ratio < 0.50) score = 20;

    return {
        ratio,
        score
    };
}


/*
   4. INCOME STABILITY

   Uses coefficient of variation.

   Lower variation = higher stability.
*/

function calculateIncomeStability() {
    const stats = getIncomeStatistics();

    if (
        stats.count < 3 ||
        stats.coefficientOfVariation === null
    ) {
        return {
            coefficient: null,
            score: null
        };
    }

    const cv = stats.coefficientOfVariation;

    let score = 0;

    if (cv <= 0.05) score = 100;
    else if (cv <= 0.10) score = 90;
    else if (cv <= 0.20) score = 75;
    else if (cv <= 0.30) score = 55;
    else if (cv <= 0.40) score = 30;

    return {
        coefficient: cv,
        score
    };
}


/*
   5. NET WORTH

   Liquid assets - liabilities

   Normalized against annual income.
*/

function calculateNetWorth() {
    const assets = number(
        financeData.liquidAssets
    );

    const liabilities = number(
        financeData.totalLiabilities
    );

    const netWorth =
        assets - liabilities;

    const income = getCurrentIncome();

    if (income <= 0) {
        return {
            netWorth,
            score: null
        };
    }

    const annualIncome = income * 12;

    const ratio =
        netWorth / annualIncome;

    let score = 0;

    if (ratio >= 3) score = 100;
    else if (ratio >= 2) score = 85;
    else if (ratio >= 1) score = 70;
    else if (ratio >= 0.5) score = 50;
    else if (ratio > 0) score = 25;

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
            key: "liquidity",
            name: "Ликвидность",
            weight: 0.30,
            score: liquidity.score
        },
        {
            key: "cashFlow",
            name: "Денежный поток",
            weight: 0.25,
            score: cashFlow.score
        },
        {
            key: "debt",
            name: "Долговая нагрузка",
            weight: 0.20,
            score: debt.score
        },
        {
            key: "incomeStability",
            name: "Стабильность дохода",
            weight: 0.15,
            score: incomeStability.score
        },
        {
            key: "netWorth",
            name: "Чистый капитал",
            weight: 0.10,
            score: netWorth.score
        }
    ];


    let weightedScore = 0;
    let availableWeight = 0;


    components.forEach(component => {

        if (Number.isFinite(component.score)) {

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
        return {
            title: "Недостаточно данных",
            description:
                "Добавьте финансовые данные, чтобы получить оценку."
        };
    }

    if (score < 40) {
        return {
            title: "Уязвимое положение",
            description:
                "Финансовая система требует существенного усиления."
        };
    }

    if (score < 60) {
        return {
            title: "Требует внимания",
            description:
                "Есть факторы, которые ограничивают финансовую устойчивость."
        };
    }

    if (score < 80) {
        return {
            title: "Стабильное положение",
            description:
                "Основные финансовые показатели находятся под контролем."
        };
    }

    if (score < 90) {
        return {
            title: "Сильное положение",
            description:
                "Финансовая система обладает хорошим запасом устойчивости."
        };
    }

    return {
        title: "Высокая устойчивость",
        description:
            "Финансовая система имеет высокий запас прочности."
    };
}


/* =========================================================
   INCOME HISTORY
   ========================================================= */

function renderIncomeHistory() {

    if (financeData.incomeHistory.length === 0) {
        return `
            <div class="finance-empty">
                История доходов пока пуста.
            </div>
        `;
    }


    const sorted =
        financeData.incomeHistory
            .map((item, index) => ({
                ...item,
                index
            }))
            .sort(
                (a, b) =>
                    b.month.localeCompare(a.month)
            );


    return sorted.map(item => {

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

                <div class="finance-history-info">

                    <span class="finance-history-month">
                        ${month}
                    </span>

                    <strong class="finance-history-amount">
                        ${money(item.amount)} ₽
                    </strong>

                </div>

                <button
                    type="button"
                    class="finance-icon-button"
                    data-delete-income="${item.index}"
                    aria-label="Удалить доход"
                >
                    <span>×</span>
                </button>

            </div>
        `;

    }).join("");
}


/* =========================================================
   COMPONENT: ACCORDION ITEM
   ========================================================= */

function renderFinanceItem({
    number: itemNumber,
    key,
    title,
    value,
    content
}) {

    return `
        <section
            class="finance-card"
            data-finance-item="${key}"
        >

            <button
                type="button"
                class="finance-card-header"
                data-open-finance="${key}"
                aria-expanded="false"
            >

                <span class="finance-card-index">
                    ${itemNumber}
                </span>

                <span class="finance-card-main">

                    <span class="finance-card-title">
                        ${title}
                    </span>

                    <span class="finance-card-value">
                        ${value}
                    </span>

                </span>

                <span
                    class="finance-card-chevron"
                    aria-hidden="true"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.7"
                    >
                        <path
                            d="M9 18l6-6-6-6"
                        />
                    </svg>
                </span>

            </button>


            <div
                class="finance-drawer"
                data-drawer="${key}"
            >

                <div class="finance-drawer-inner">
                    ${content}
                </div>

            </div>

        </section>
    `;
}


/* =========================================================
   RENDER
   ========================================================= */

function renderFinance() {

    const container =
        document.getElementById(
            "finance-container"
        );


    if (!container) {
        console.error(
            "Finance: #finance-container not found."
        );
        return;
    }


    const currentIncome =
        getCurrentIncome();

    const statistics =
        getIncomeStatistics();

    const stability =
        calculateFinancialStability();

    const status =
        getStabilityStatus(
            stability.score
        );


    const score =
        Number.isFinite(stability.score)
            ? stability.score
            : "—";


    container.innerHTML = `

        <div class="finance-module">


            <!-- =========================================
                 HEADER
                 ========================================= -->

            <header class="finance-header">

                <div>

                    <p class="finance-eyebrow">
                        FINANCIAL OVERVIEW
                    </p>

                    <h1 class="finance-title">
                        Финансы
                    </h1>

                </div>

            </header>


            <!-- =========================================
                 INPUTS
                 ========================================= -->

            <div class="finance-section">

                <div class="finance-section-label">
                    Финансовые показатели
                </div>


                <div class="finance-list">


                    ${renderFinanceItem({

                        number: "01",

                        key: "liquid",

                        title: "Ликвидные средства",

                        value:
                            `${money(
                                financeData.liquidAssets
                            )} ₽`,

                        content: `

                            <div class="finance-drawer-description">

                                <p>
                                    Средства, которыми вы
                                    располагаете прямо сейчас.
                                </p>

                            </div>


                            <div class="finance-field">

                                <label
                                    for="finance-liquid"
                                    class="finance-label"
                                >
                                    Текущая сумма
                                </label>

                                <div class="finance-input-wrap">

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

                                    <span class="finance-input-suffix">
                                        ₽
                                    </span>

                                </div>

                            </div>


                            <button
                                type="button"
                                class="finance-primary-button"
                                data-save-liquid
                            >
                                Сохранить
                            </button>

                        `
                    })}


                    ${renderFinanceItem({

                        number: "02",

                        key: "expenses",

                        title: "Обязательные расходы",

                        value:
                            `${money(
                                financeData.essentialExpenses
                            )} ₽ / месяц`,

                        content: `

                            <div class="finance-drawer-description">

                                <p>
                                    Минимальная сумма,
                                    необходимая для покрытия
                                    обязательных расходов в месяц.
                                </p>

                            </div>


                            <div class="finance-field">

                                <label
                                    for="finance-expenses"
                                    class="finance-label"
                                >
                                    Расходы в месяц
                                </label>

                                <div class="finance-input-wrap">

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

                                    <span class="finance-input-suffix">
                                        ₽
                                    </span>

                                </div>

                            </div>


                            <button
                                type="button"
                                class="finance-primary-button"
                                data-save-expenses
                            >
                                Сохранить
                            </button>

                        `
                    })}


                    ${renderFinanceItem({

                        number: "03",

                        key: "income",

                        title: "Доход",

                        value:
                            `${money(currentIncome)} ₽`,

                        content: `

                            <div class="finance-drawer-description">

                                <p>
                                    Фиксируйте фактический доход
                                    за каждый месяц.
                                </p>

                            </div>


                            <div class="finance-field">

                                <label
                                    for="finance-income-month"
                                    class="finance-label"
                                >
                                    Период
                                </label>

                                <input
                                    id="finance-income-month"
                                    class="finance-input"
                                    type="month"
                                />

                            </div>


                            <div class="finance-field">

                                <label
                                    for="finance-income"
                                    class="finance-label"
                                >
                                    Доход
                                </label>

                                <div class="finance-input-wrap">

                                    <input
                                        id="finance-income"
                                        class="finance-input"
                                        type="number"
                                        min="0"
                                        inputmode="decimal"
                                        placeholder="0"
                                    />

                                    <span class="finance-input-suffix">
                                        ₽
                                    </span>

                                </div>

                            </div>


                            <button
                                type="button"
                                class="finance-primary-button"
                                data-save-income
                            >
                                Добавить доход
                            </button>


                            <div class="finance-history">

                                <div class="finance-subsection-title">
                                    История
                                </div>

                                ${renderIncomeHistory()}

                            </div>

                        `
                    })}


                    ${renderFinanceItem({

                        number: "04",

                        key: "obligations",

                        title: "Финансовые обязательства",

                        value:
                            `${money(
                                financeData.totalLiabilities
                            )} ₽`,

                        content: `

                            <div class="finance-drawer-description">

                                <p>
                                    Общая сумма обязательств
                                    и размер ежемесячных платежей.
                                </p>

                            </div>


                            <div class="finance-field">

                                <label
                                    for="finance-liabilities"
                                    class="finance-label"
                                >
                                    Общая сумма
                                </label>

                                <div class="finance-input-wrap">

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

                                    <span class="finance-input-suffix">
                                        ₽
                                    </span>

                                </div>

                            </div>


                            <div class="finance-field">

                                <label
                                    for="finance-debt-payments"
                                    class="finance-label"
                                >
                                    Ежемесячные платежи
                                </label>

                                <div class="finance-input-wrap">

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

                                    <span class="finance-input-suffix">
                                        ₽
                                    </span>

                                </div>

                            </div>


                            <button
                                type="button"
                                class="finance-primary-button"
                                data-save-obligations
                            >
                                Сохранить
                            </button>

                        `
                    })}


                    ${renderFinanceItem({

                        number: "05",

                        key: "statistics",

                        title: "Статистика доходов",

                        value:
                            statistics.count > 0
                                ? `${statistics.count} мес.`
                                : "Нет данных",

                        content: `

                            <div class="finance-stat-grid">


                                <div class="finance-stat-card">

                                    <span>
                                        Средний доход
                                    </span>

                                    <strong>
                                        ${money(
                                            statistics.average
                                        )} ₽
                                    </strong>

                                </div>


                                <div class="finance-stat-card">

                                    <span>
                                        Минимальный
                                    </span>

                                    <strong>
                                        ${money(
                                            statistics.minimum
                                        )} ₽
                                    </strong>

                                </div>


                                <div class="finance-stat-card">

                                    <span>
                                        Максимальный
                                    </span>

                                    <strong>
                                        ${money(
                                            statistics.maximum
                                        )} ₽
                                    </strong>

                                </div>


                                <div class="finance-stat-card">

                                    <span>
                                        За период
                                    </span>

                                    <strong>
                                        ${money(
                                            statistics.total
                                        )} ₽
                                    </strong>

                                </div>


                            </div>


                            <div class="finance-history">

                                <div class="finance-subsection-title">
                                    История доходов
                                </div>

                                ${renderIncomeHistory()}

                            </div>

                        `
                    })}


                </div>

            </div>


            <!-- =========================================
                 FINANCIAL STABILITY
                 ========================================= -->

            <section class="finance-stability-card">


                <div class="finance-stability-header">

                    <div>

                        <p class="finance-eyebrow">
                            FINANCIAL STABILITY
                        </p>

                        <h2>
                            Финансовая стабильность
                        </h2>

                    </div>


                    <div class="finance-score">

                        <strong>
                            ${score}
                        </strong>

                        <span>
                            /100
                        </span>

                    </div>

                </div>


                <div class="finance-score-status">

                    <strong>
                        ${status.title}
                    </strong>

                    <p>
                        ${status.description}
                    </p>

                </div>


                <div class="finance-score-line">

                    <div
                        class="finance-score-line-fill"
                        style="
                            width: ${
                                Number.isFinite(stability.score)
                                    ? stability.score
                                    : 0
                            }%;
                        "
                    ></div>

                </div>


                <div class="finance-score-components">


                    ${stability.components.map(component => `

                        <div class="finance-score-component">

                            <div>

                                <span>
                                    ${component.name}
                                </span>

                                <small>
                                    ${Math.round(
                                        component.weight * 100
                                    )}%
                                </small>

                            </div>

                            <strong>
                                ${
                                    Number.isFinite(
                                        component.score
                                    )
                                        ? component.score
                                        : "—"
                                }
                            </strong>

                        </div>

                    `).join("")}


                </div>


                <div class="finance-stability-note">

                    <span class="finance-note-mark">
                        i
                    </span>

                    <p>
                        Оценка отражает текущее состояние
                        финансовой системы и не является
                        игровым показателем.
                    </p>

                </div>


            </section>


        </div>
    `;


    bindFinanceEvents();
}


/* =========================================================
   EVENTS
   ========================================================= */

function bindFinanceEvents() {


    /* ---------------------------------------------
       ACCORDIONS
       --------------------------------------------- */

    document
        .querySelectorAll(
            "[data-open-finance]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const key =
                        button.dataset.openFinance;

                    const item =
                        button.closest(
                            ".finance-card"
                        );

                    const isOpen =
                        item.classList.contains(
                            "is-open"
                        );


                    document
                        .querySelectorAll(
                            ".finance-card"
                        )
                        .forEach(card => {

                            card.classList.remove(
                                "is-open"
                            );

                            const header =
                                card.querySelector(
                                    ".finance-card-header"
                                );

                            if (header) {
                                header.setAttribute(
                                    "aria-expanded",
                                    "false"
                                );
                            }
                        });


                    if (!isOpen) {

                        item.classList.add(
                            "is-open"
                        );

                        button.setAttribute(
                            "aria-expanded",
                            "true"
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
       EXPENSES
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


                if (!month || amount <= 0) {
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

                    existing.amount = amount;

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
            "Finance: #finance-container not found."
        );

        return;
    }


    renderFinance();
}


/* =========================================================
   PUBLIC API
   ========================================================= */

export {
    initFinance,
    calculateFinancialStability,
    getIncomeStatistics
};