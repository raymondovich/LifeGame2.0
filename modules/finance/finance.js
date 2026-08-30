/* =========================================================
   LIFE GAME 2.0
   FINANCE MODULE
   =========================================================
   Finance is an analytical module.

   NO XP
   NO LEVELS
   NO GAMIFICATION

   Main blocks:

   1. Liquid Assets
   2. Essential Expenses
   3. Income
   4. Financial Obligations
   5. Income Statistics
   6. Financial Stability

   Financial Stability Score:

   Liquidity              30%
   Cash Flow              25%
   Debt                   20%
   Income Stability       15%
   Net Worth              10%
   ========================================================= */


/* =========================================================
   STORAGE
   ========================================================= */

const FINANCE_STORAGE_KEY = "lifegame_finance";


/* =========================================================
   DEFAULT STATE
   ========================================================= */

const DEFAULT_FINANCE_STATE = {

    liquidAssets: 0,

    essentialExpenses: 0,

    currentIncome: 0,

    totalLiabilities: 0,

    monthlyDebtPayments: 0,

    incomeHistory: []

};


/* =========================================================
   STATE
   ========================================================= */

let financeState = loadFinanceState();


/* =========================================================
   LOAD
   ========================================================= */

function loadFinanceState() {

    try {

        const saved =
            localStorage.getItem(
                FINANCE_STORAGE_KEY
            );

        if (!saved) {

            return {
                ...DEFAULT_FINANCE_STATE,
                incomeHistory: []
            };

        }

        const parsed =
            JSON.parse(saved);

        return {

            ...DEFAULT_FINANCE_STATE,
            ...parsed,

            incomeHistory:
                Array.isArray(
                    parsed.incomeHistory
                )
                    ? parsed.incomeHistory
                    : []

        };

    } catch (error) {

        console.error(
            "Finance: failed to load state",
            error
        );

        return {
            ...DEFAULT_FINANCE_STATE,
            incomeHistory: []
        };

    }

}


/* =========================================================
   SAVE
   ========================================================= */

function saveFinanceState() {

    try {

        localStorage.setItem(
            FINANCE_STORAGE_KEY,
            JSON.stringify(financeState)
        );

    } catch (error) {

        console.error(
            "Finance: failed to save state",
            error
        );

    }

}


/* =========================================================
   NUMBER HELPERS
   ========================================================= */

function toNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }

    const number =
        Number(
            String(value)
                .replace(/\s/g, "")
                .replace(",", ".")
        );

    return Number.isFinite(number)
        ? Math.max(0, number)
        : 0;

}


function formatMoney(value) {

    return new Intl.NumberFormat(
        "ru-RU",
        {
            maximumFractionDigits: 0
        }
    ).format(
        Math.max(
            0,
            Number(value) || 0
        )
    );

}


function formatScore(value) {

    if (
        !Number.isFinite(value)
    ) {

        return "—";

    }

    return Math.round(value);

}


/* =========================================================
   SCORE NORMALIZATION
   ========================================================= */

function interpolate(
    value,
    points
) {

    if (
        !Number.isFinite(value)
    ) {

        return null;

    }

    if (
        value <= points[0].value
    ) {

        return points[0].score;

    }

    const last =
        points[points.length - 1];

    if (
        value >= last.value
    ) {

        return last.score;

    }

    for (
        let i = 0;
        i < points.length - 1;
        i++
    ) {

        const a = points[i];
        const b = points[i + 1];

        if (
            value >= a.value &&
            value <= b.value
        ) {

            const ratio =
                (
                    value - a.value
                ) /
                (
                    b.value - a.value
                );

            return (
                a.score +
                (
                    b.score -
                    a.score
                ) *
                ratio
            );

        }

    }

    return null;

}


/* =========================================================
   1. LIQUIDITY
   =========================================================
   Liquid Assets /
   Essential Monthly Expenses

   Result:
   number of months that can be covered
   without income.
   ========================================================= */

function calculateLiquidity() {

    const liquidAssets =
        toNumber(
            financeState.liquidAssets
        );

    const expenses =
        toNumber(
            financeState.essentialExpenses
        );

    if (
        expenses <= 0
    ) {

        return {
            coverage: null,
            score: null
        };

    }

    const coverage =
        liquidAssets /
        expenses;

    let score;

    if (
        coverage < 1
    ) {

        score = 0;

    } else {

        score =
            interpolate(
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
            );

    }

    return {
        coverage,
        score
    };

}


/* =========================================================
   2. CASH FLOW
   =========================================================
   (Income - Essential Expenses) /
   Income
   ========================================================= */

function calculateCashFlow() {

    const income =
        toNumber(
            financeState.currentIncome
        );

    const expenses =
        toNumber(
            financeState.essentialExpenses
        );

    if (
        income <= 0
    ) {

        return {
            savingsRate: null,
            score: null
        };

    }

    const savingsRate =
        (
            income -
            expenses
        ) /
        income;

    let score;

    if (
        savingsRate <= 0
    ) {

        score = 0;

    } else {

        score =
            interpolate(
                savingsRate,
                [
                    {
                        value: 0,
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
            );

    }

    return {
        savingsRate,
        score
    };

}


/* =========================================================
   3. DEBT
   =========================================================
   Monthly Debt Payments /
   Monthly Income

   Lower ratio = better stability.
   ========================================================= */

function calculateDebt() {

    const payments =
        toNumber(
            financeState.monthlyDebtPayments
        );

    const income =
        toNumber(
            financeState.currentIncome
        );

    if (
        income <= 0
    ) {

        return {
            debtServiceRatio: null,
            score: null
        };

    }

    const ratio =
        payments /
        income;

    const score =
        interpolate(
            ratio,
            [
                {
                    value: 0,
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
        );

    return {
        debtServiceRatio: ratio,
        score
    };

}


/* =========================================================
   4. INCOME STABILITY
   =========================================================
   Coefficient of Variation:

   Standard Deviation /
   Average Income

   Minimum:
   3 months.
   ========================================================= */

function calculateAverage(
    values
) {

    if (
        !values.length
    ) {

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
            (
                sum,
                value
            ) =>
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


function calculateIncomeStability() {

    const values =
        financeState
            .incomeHistory
            .map(
                entry =>
                    toNumber(
                        entry.amount
                    )
            )
            .filter(
                value =>
                    value > 0
            );

    if (
        values.length < 3
    ) {

        return {
            average: null,
            standardDeviation: null,
            coefficientOfVariation: null,
            score: null
        };

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

        return {
            average,
            standardDeviation,
            coefficientOfVariation: null,
            score: null
        };

    }

    const cv =
        standardDeviation /
        average;

    let score;

    if (
        cv <= 0.05
    ) {

        score = 100;

    } else if (
        cv >= 0.50
    ) {

        score = 0;

    } else {

        score =
            interpolate(
                cv,
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
            );

    }

    return {

        average,

        standardDeviation,

        coefficientOfVariation: cv,

        score

    };

}


/* =========================================================
   5. NET WORTH
   =========================================================
   Temporary model:

   Net Worth =
   Liquid Assets - Total Liabilities

   Final architecture can later include
   additional assets.
   ========================================================= */

function calculateNetWorth() {

    const assets =
        toNumber(
            financeState.liquidAssets
        );

    const liabilities =
        toNumber(
            financeState.totalLiabilities
        );

    const income =
        toNumber(
            financeState.currentIncome
        );

    if (
        income <= 0
    ) {

        return {

            netWorth:
                assets -
                liabilities,

            coverage: null,

            score: null

        };

    }

    const netWorth =
        assets -
        liabilities;

    const annualIncome =
        income * 12;

    const coverage =
        netWorth /
        annualIncome;

    let score;

    if (
        coverage <= 0
    ) {

        score = 0;

    } else {

        score =
            interpolate(
                coverage,
                [
                    {
                        value: 0,
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
                        value: 1,
                        score: 70
                    },
                    {
                        value: 2,
                        score: 85
                    },
                    {
                        value: 3,
                        score: 100
                    }
                ]
            );

    }

    return {

        netWorth,

        coverage,

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


    const components = {

        liquidity:
            liquidity.score,

        cashFlow:
            cashFlow.score,

        debt:
            debt.score,

        incomeStability:
            incomeStability.score,

        netWorth:
            netWorth.score

    };


    const weights = {

        liquidity: 0.30,

        cashFlow: 0.25,

        debt: 0.20,

        incomeStability: 0.15,

        netWorth: 0.10

    };


    let total = 0;

    let weight = 0;


    Object.keys(
        components
    ).forEach(
        key => {

            const score =
                components[key];

            if (
                Number.isFinite(score)
            ) {

                total +=
                    score *
                    weights[key];

                weight +=
                    weights[key];

            }

        }
    );


    if (
        weight === 0
    ) {

        return {

            score: null,

            components,

            raw: {

                liquidity,

                cashFlow,

                debt,

                incomeStability,

                netWorth

            }

        };

    }


    const score =
        total /
        weight;


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

        components,

        raw: {

            liquidity,

            cashFlow,

            debt,

            incomeStability,

            netWorth

        }

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

        return "Недостаточно данных";

    }

    if (
        score < 40
    ) {

        return "Уязвимое положение";

    }

    if (
        score < 60
    ) {

        return "Требует внимания";

    }

    if (
        score < 80
    ) {

        return "Стабильное положение";

    }

    if (
        score < 90
    ) {

        return "Сильное положение";

    }

    return "Высокая устойчивость";

}


/* =========================================================
   INCOME STATISTICS
   ========================================================= */

function getIncomeStatistics() {

    const values =
        financeState
            .incomeHistory
            .map(
                entry =>
                    toNumber(
                        entry.amount
                    )
            )
            .filter(
                value =>
                    value > 0
            );


    if (
        values.length === 0
    ) {

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
            (
                sum,
                value
            ) =>
                sum + value,
            0
        );


    return {

        total,

        average:
            total /
            values.length,

        minimum:
            Math.min(
                ...values
            ),

        maximum:
            Math.max(
                ...values
            ),

        months:
            values.length

    };

}


/* =========================================================
   INCOME HISTORY
   ========================================================= */

function renderIncomeHistory() {

    if (
        !financeState
            .incomeHistory
            .length
    ) {

        return `
            <div class="finance-empty">
                История доходов пока пуста
            </div>
        `;

    }


    /*
     * Newest first.
     */

    const entries =
        financeState
            .incomeHistory
            .map(
                (
                    entry,
                    index
                ) => ({
                    ...entry,
                    originalIndex: index
                })
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    String(b.month)
                        .localeCompare(
                            String(a.month)
                        )
            );


    return entries
        .map(
            entry => {

                let monthLabel =
                    entry.month;


                if (
                    entry.month
                ) {

                    const date =
                        new Date(
                            `${entry.month}-01T00:00:00`
                        );

                    if (
                        !Number.isNaN(
                            date.getTime()
                        )
                    ) {

                        monthLabel =
                            date.toLocaleDateString(
                                "ru-RU",
                                {
                                    month:
                                        "long",
                                    year:
                                        "numeric"
                                }
                            );

                    }

                }


                return `

                    <div class="finance-income-history-row">

                        <div class="finance-income-history-info">

                            <span class="finance-income-history-month">
                                ${monthLabel}
                            </span>

                            <strong class="finance-income-history-amount">
                                ${formatMoney(
                                    entry.amount
                                )} ₽
                            </strong>

                        </div>

                        <button
                            type="button"
                            class="finance-delete-income"
                            data-income-index="${entry.originalIndex}"
                            aria-label="Удалить доход"
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
   ACCORDION
   ========================================================= */

function closeAllFinancePanels() {

    document
        .querySelectorAll(
            ".finance-panel"
        )
        .forEach(
            panel => {

                panel.classList.remove(
                    "finance-panel-open"
                );

            }
        );


    document
        .querySelectorAll(
            ".finance-section-button"
        )
        .forEach(
            button => {

                button.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }
        );

}


function toggleFinancePanel(
    panelId,
    button
) {

    const panel =
        document.getElementById(
            panelId
        );


    if (!panel) {

        return;

    }


    const wasOpen =
        panel.classList.contains(
            "finance-panel-open"
        );


    closeAllFinancePanels();


    if (!wasOpen) {

        panel.classList.add(
            "finance-panel-open"
        );

        if (button) {

            button.setAttribute(
                "aria-expanded",
                "true"
            );

        }

    }

}


/* =========================================================
   SAVE SIMPLE FIELD
   ========================================================= */

function saveSimpleFinanceField(
    field,
    inputId
) {

    const input =
        document.getElementById(
            inputId
        );


    if (!input) {

        return;

    }


    financeState[field] =
        toNumber(
            input.value
        );


    saveFinanceState();

    renderFinance();

}


/* =========================================================
   SAVE OBLIGATIONS
   ========================================================= */

function saveFinancialObligations() {

    const totalInput =
        document.getElementById(
            "finance-total-liabilities"
        );

    const monthlyInput =
        document.getElementById(
            "finance-monthly-debt-payments"
        );


    financeState.totalLiabilities =
        totalInput
            ? toNumber(
                totalInput.value
            )
            : 0;


    financeState.monthlyDebtPayments =
        monthlyInput
            ? toNumber(
                monthlyInput.value
            )
            : 0;


    saveFinanceState();

    renderFinance();

}


/* =========================================================
   ADD INCOME
   ========================================================= */

function addIncome() {

    const monthInput =
        document.getElementById(
            "finance-income-month"
        );

    const amountInput =
        document.getElementById(
            "finance-income-amount"
        );


    if (
        !monthInput ||
        !amountInput
    ) {

        return;

    }


    const month =
        monthInput.value;

    const amount =
        toNumber(
            amountInput.value
        );


    if (
        !month ||
        amount <= 0
    ) {

        return;

    }


    /*
     * If this month already exists,
     * update it instead of creating
     * duplicate monthly entries.
     */

    const existingIndex =
        financeState
            .incomeHistory
            .findIndex(
                entry =>
                    entry.month === month
            );


    if (
        existingIndex !== -1
    ) {

        financeState
            .incomeHistory[
                existingIndex
            ]
            .amount = amount;

    } else {

        financeState
            .incomeHistory
            .push({

                month,

                amount

            });

    }


    /*
     * Current income is always
     * the latest chronological
     * income entry.
     */

    updateCurrentIncomeFromHistory();


    saveFinanceState();

    renderFinance();

}


/* =========================================================
   UPDATE CURRENT INCOME
   ========================================================= */

function updateCurrentIncomeFromHistory() {

    if (
        !financeState
            .incomeHistory
            .length
    ) {

        financeState.currentIncome = 0;

        return;

    }


    const sorted =
        [...financeState.incomeHistory]
            .sort(
                (
                    a,
                    b
                ) =>
                    String(a.month)
                        .localeCompare(
                            String(b.month)
                        )
            );


    const latest =
        sorted[
            sorted.length - 1
        ];


    financeState.currentIncome =
        toNumber(
            latest.amount
        );

}


/* =========================================================
   DELETE INCOME
   ========================================================= */

function deleteIncome(
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


    updateCurrentIncomeFromHistory();

    saveFinanceState();

    renderFinance();

}


/* =========================================================
   RENDER FINANCE
   ========================================================= */

function renderFinance() {

    const container =
        document.getElementById(
            "finance-container"
        );


    if (!container) {

        return;

    }


    const stability =
        calculateFinancialStability();


    const statistics =
        getIncomeStatistics();


    const status =
        getFinancialStabilityStatus(
            stability.score
        );


    container.innerHTML = `

        <div class="finance-module">


            <!-- =========================================
                 HEADER
                 ========================================= -->

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

            <section class="finance-section">

                <button
                    type="button"
                    class="finance-section-button"
                    data-finance-panel="finance-liquid-panel"
                    aria-expanded="false"
                >

                    <span class="finance-section-name">
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

                        <div class="finance-panel-description">

                            Средства, которыми вы можете
                            воспользоваться непосредственно сейчас.

                        </div>


                        <label
                            class="finance-input-label"
                            for="finance-liquid-input"
                        >
                            Сумма
                        </label>


                        <input
                            id="finance-liquid-input"
                            class="finance-input"
                            type="number"
                            min="0"
                            step="100"
                            inputmode="decimal"
                            value="${
                                financeState.liquidAssets || ""
                            }"
                            placeholder="0"
                        />


                        <button
                            type="button"
                            class="finance-save-button"
                            data-save-field="liquidAssets"
                            data-input-id="finance-liquid-input"
                        >
                            Сохранить
                        </button>

                    </div>

                </div>

            </section>


            <!-- =========================================
                 2. ESSENTIAL EXPENSES
                 ========================================= -->

            <section class="finance-section">

                <button
                    type="button"
                    class="finance-section-button"
                    data-finance-panel="finance-expenses-panel"
                    aria-expanded="false"
                >

                    <span class="finance-section-name">
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

                        <div class="finance-panel-description">

                            Минимальные ежемесячные расходы,
                            необходимые для поддержания
                            текущего уровня жизни.

                        </div>


                        <label
                            class="finance-input-label"
                            for="finance-expenses-input"
                        >
                            Сумма в месяц
                        </label>


                        <input
                            id="finance-expenses-input"
                            class="finance-input"
                            type="number"
                            min="0"
                            step="100"
                            inputmode="decimal"
                            value="${
                                financeState.essentialExpenses || ""
                            }"
                            placeholder="0"
                        />


                        <button
                            type="button"
                            class="finance-save-button"
                            data-save-field="essentialExpenses"
                            data-input-id="finance-expenses-input"
                        >
                            Сохранить
                        </button>

                    </div>

                </div>

            </section>


            <!-- =========================================
                 3. INCOME
                 ========================================= -->

            <section class="finance-section">

                <button
                    type="button"
                    class="finance-section-button"
                    data-finance-panel="finance-income-panel"
                    aria-expanded="false"
                >

                    <span class="finance-section-name">
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

                        <div class="finance-panel-description">

                            Добавьте фактический доход
                            за соответствующий месяц.
                            История сохраняется автоматически.

                        </div>


                        <label
                            class="finance-input-label"
                            for="finance-income-month"
                        >
                            Месяц
                        </label>


                        <input
                            id="finance-income-month"
                            class="finance-input"
                            type="month"
                            value="${
                                new Date()
                                    .toISOString()
                                    .slice(0, 7)
                            }"
                        />


                        <label
                            class="finance-input-label"
                            for="finance-income-amount"
                        >
                            Доход
                        </label>


                        <input
                            id="finance-income-amount"
                            class="finance-input"
                            type="number"
                            min="0"
                            step="100"
                            inputmode="decimal"
                            placeholder="0"
                        />


                        <button
                            type="button"
                            class="finance-save-button"
                            id="finance-add-income"
                        >
                            Сохранить доход
                        </button>

                    </div>

                </div>

            </section>


            <!-- =========================================
                 4. FINANCIAL OBLIGATIONS
                 ========================================= -->

            <section class="finance-section">

                <button
                    type="button"
                    class="finance-section-button"
                    data-finance-panel="finance-obligations-panel"
                    aria-expanded="false"
                >

                    <span class="finance-section-name">
                        4. Финансовые обязательства
                    </span>

                    <span class="finance-section-value">
                        ${formatMoney(
                            financeState.totalLiabilities
                        )} ₽
                    </span>

                </button>


                <div
                    id="finance-obligations-panel"
                    class="finance-panel"
                >

                    <div class="finance-panel-content">

                        <div class="finance-panel-description">

                            Укажите общий размер обязательств
                            и сумму обязательных платежей
                            по ним в месяц.

                        </div>


                        <label
                            class="finance-input-label"
                            for="finance-total-liabilities"
                        >
                            Общая сумма обязательств
                        </label>


                        <input
                            id="finance-total-liabilities"
                            class="finance-input"
                            type="number"
                            min="0"
                            step="100"
                            inputmode="decimal"
                            value="${
                                financeState.totalLiabilities || ""
                            }"
                            placeholder="0"
                        />


                        <label
                            class="finance-input-label"
                            for="finance-monthly-debt-payments"
                        >
                            Ежемесячные платежи
                        </label>


                        <input
                            id="finance-monthly-debt-payments"
                            class="finance-input"
                            type="number"
                            min="0"
                            step="100"
                            inputmode="decimal"
                            value="${
                                financeState.monthlyDebtPayments || ""
                            }"
                            placeholder="0"
                        />


                        <button
                            type="button"
                            class="finance-save-button"
                            id="finance-save-obligations"
                        >
                            Сохранить
                        </button>

                    </div>

                </div>

            </section>


            <!-- =========================================
                 5. INCOME STATISTICS
                 ========================================= -->

            <section class="finance-section">

                <button
                    type="button"
                    class="finance-section-button"
                    data-finance-panel="finance-statistics-panel"
                    aria-expanded="false"
                >

                    <span class="finance-section-name">
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


                        <div class="finance-statistics-grid">


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
                                    Минимальный
                                </span>

                                <strong>
                                    ${formatMoney(
                                        statistics.minimum
                                    )} ₽
                                </strong>

                            </div>


                            <div class="finance-stat-card">

                                <span>
                                    Максимальный
                                </span>

                                <strong>
                                    ${formatMoney(
                                        statistics.maximum
                                    )} ₽
                                </strong>

                            </div>


                            <div class="finance-stat-card">

                                <span>
                                    За период
                                </span>

                                <strong>
                                    ${formatMoney(
                                        statistics.total
                                    )} ₽
                                </strong>

                            </div>


                        </div>


                        <div class="finance-history-title">
                            История доходов
                        </div>


                        <div class="finance-income-history">

                            ${renderIncomeHistory()}

                        </div>


                    </div>

                </div>

            </section>


            <!-- =========================================
                 6. FINANCIAL STABILITY
                 ========================================= -->

            <section class="finance-stability">


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

                    ${status}

                </div>


                <div class="finance-stability-components">


                    <div class="finance-stability-row">

                        <span>
                            Ликвидность
                        </span>

                        <strong>
                            ${formatScore(
                                stability.components.liquidity
                            )}
                        </strong>

                    </div>


                    <div class="finance-stability-row">

                        <span>
                            Денежный поток
                        </span>

                        <strong>
                            ${formatScore(
                                stability.components.cashFlow
                            )}
                        </strong>

                    </div>


                    <div class="finance-stability-row">

                        <span>
                            Долговая нагрузка
                        </span>

                        <strong>
                            ${formatScore(
                                stability.components.debt
                            )}
                        </strong>

                    </div>


                    <div class="finance-stability-row">

                        <span>
                            Стабильность дохода
                        </span>

                        <strong>
                            ${formatScore(
                                stability.components
                                    .incomeStability
                            )}
                        </strong>

                    </div>


                    <div class="finance-stability-row">

                        <span>
                            Чистый капитал
                        </span>

                        <strong>
                            ${formatScore(
                                stability.components
                                    .netWorth
                            )}
                        </strong>

                    </div>


                </div>


                <div class="finance-stability-weights">

                    <div>
                        Ликвидность
                        <span>30%</span>
                    </div>

                    <div>
                        Денежный поток
                        <span>25%</span>
                    </div>

                    <div>
                        Долговая нагрузка
                        <span>20%</span>
                    </div>

                    <div>
                        Стабильность дохода
                        <span>15%</span>
                    </div>

                    <div>
                        Чистый капитал
                        <span>10%</span>
                    </div>

                </div>


                ${
                    stability.score === null
                        ? `
                            <div class="finance-stability-empty">

                                Добавьте финансовые данные,
                                чтобы получить оценку
                                финансовой устойчивости.

                            </div>
                        `
                        : ""
                }


            </section>


        </div>

    `;


    bindFinanceEvents();

}


/* =========================================================
   EVENTS
   ========================================================= */

function bindFinanceEvents() {


    /*
     * Accordion
     */

    document
        .querySelectorAll(
            "[data-finance-panel]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        toggleFinancePanel(
                            button.dataset
                                .financePanel,
                            button
                        );

                    }
                );

            }
        );


    /*
     * Simple fields
     */

    document
        .querySelectorAll(
            "[data-save-field]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        saveSimpleFinanceField(
                            button.dataset
                                .saveField,
                            button.dataset
                                .inputId
                        );

                    }
                );

            }
        );


    /*
     * Obligations
     */

    const obligationsButton =
        document.getElementById(
            "finance-save-obligations"
        );


    if (
        obligationsButton
    ) {

        obligationsButton.addEventListener(
            "click",
            saveFinancialObligations
        );

    }


    /*
     * Income
     */

    const incomeButton =
        document.getElementById(
            "finance-add-income"
        );


    if (
        incomeButton
    ) {

        incomeButton.addEventListener(
            "click",
            addIncome
        );

    }


    /*
     * Delete income
     */

    document
        .querySelectorAll(
            "[data-income-index]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteIncome(
                            Number(
                                button.dataset
                                    .incomeIndex
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
            "Finance: #finance-container not found"
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