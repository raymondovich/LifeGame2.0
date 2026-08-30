/* =========================================
   LIFE GAME 2.0
   FINANCE MODULE
   ========================================= */

import {
    getSection,
    updateSection
} from "../../js/storage.js";


/* =========================================
   FINANCE STATE
   ========================================= */

const DEFAULT_FINANCE_DATA = {
    currentMonth: null,

    months: {}
};


/* =========================================
   HELPERS
   ========================================= */

function getCurrentMonthKey() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    return `${year}-${month}`;
}


function createMonthData() {

    return {
        income: 0,

        incomeGoal: 0,

        expenses: [],

        reserve: 0
    };
}


function normalizeFinanceData(data) {

    if (
        !data ||
        typeof data !== "object"
    ) {
        return {
            ...DEFAULT_FINANCE_DATA
        };
    }

    return {
        ...DEFAULT_FINANCE_DATA,
        ...data,

        months:
            data.months &&
            typeof data.months === "object"
                ? data.months
                : {}
    };
}


function getCurrentFinanceData() {

    const finance =
        getSection("finance");

    const data =
        normalizeFinanceData(
            finance?.data
        );

    const currentMonth =
        getCurrentMonthKey();

    if (
        !data.months[currentMonth]
    ) {
        data.months[currentMonth] =
            createMonthData();
    }

    data.currentMonth =
        currentMonth;

    return {
        data,
        month:
            data.months[currentMonth]
    };
}


function saveFinanceData(data) {

    return updateSection(
        "finance",
        {
            data
        }
    );
}


function sanitizeMoney(value) {

    const number =
        Number(
            String(value)
                .replace(",", ".")
                .replace(/[^\d.-]/g, "")
        );

    if (
        !Number.isFinite(number) ||
        number < 0
    ) {
        return 0;
    }

    return Math.round(
        number * 100
    ) / 100;
}


function formatMoney(value) {

    const number =
        sanitizeMoney(value);

    return new Intl.NumberFormat(
        "ru-RU",
        {
            maximumFractionDigits: 0
        }
    ).format(number) + " ₽";
}


function calculatePercentage(
    value,
    base
) {

    const safeValue =
        sanitizeMoney(value);

    const safeBase =
        sanitizeMoney(base);

    if (
        safeBase <= 0
    ) {
        return 0;
    }

    return Math.min(
        100,
        Math.round(
            (safeValue / safeBase) * 100
        )
    );
}


function calculateGoalPercentage(
    income,
    goal
) {

    const safeIncome =
        sanitizeMoney(income);

    const safeGoal =
        sanitizeMoney(goal);

    if (
        safeGoal <= 0
    ) {
        return 0;
    }

    return Math.round(
        (safeIncome / safeGoal) * 100
    );
}


function getExpensesTotal(
    expenses
) {

    if (
        !Array.isArray(expenses)
    ) {
        return 0;
    }

    return expenses.reduce(
        (
            total,
            expense
        ) => {

            return (
                total +
                sanitizeMoney(
                    expense.amount
                )
            );

        },
        0
    );
}


function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================
   MONTH INITIALIZATION
   ========================================= */

function initializeCurrentMonth() {

    const {
        data
    } = getCurrentFinanceData();

    saveFinanceData(data);

    return data;
}


/* =========================================
   MONTH LABEL
   ========================================= */

function getMonthLabel() {

    const date =
        new Date();

    return new Intl.DateTimeFormat(
        "ru-RU",
        {
            month: "long",
            year: "numeric"
        }
    )
        .format(date)
        .replace(
            /^./,
            char => char.toUpperCase()
        );
}


/* =========================================
   RENDER
   ========================================= */

function renderFinance(
    container
) {

    const {
        data,
        month
    } = getCurrentFinanceData();

    const income =
        sanitizeMoney(
            month.income
        );

    const incomeGoal =
        sanitizeMoney(
            month.incomeGoal
        );

    const expenses =
        Array.isArray(
            month.expenses
        )
            ? month.expenses
            : [];

    const expensesTotal =
        getExpensesTotal(
            expenses
        );

    const reserve =
        sanitizeMoney(
            month.reserve
        );

    const goalPercent =
        calculateGoalPercentage(
            income,
            incomeGoal
        );

    const expensesPercent =
        calculatePercentage(
            expensesTotal,
            income
        );

    const reservePercent =
        calculatePercentage(
            reserve,
            income
        );

    container.innerHTML = `

        <div
            class="finance-dashboard"
            data-finance-root
        >

            <!-- =====================================
                 FINANCE HEADER
                 ===================================== -->

            <div class="finance-header">

                <div>

                    <div class="finance-kicker">
                        FINANCIAL SYSTEM
                    </div>

                    <h2 class="finance-title">
                        Finance
                    </h2>

                </div>

                <div class="finance-month">
                    ${escapeHTML(
                        getMonthLabel()
                    )}
                </div>

            </div>


            <!-- =====================================
                 MONTHLY INCOME
                 ===================================== -->

            <section
                class="finance-card finance-income-card"
            >

                <div class="finance-card-top">

                    <div>

                        <div class="finance-label">
                            MONTHLY INCOME
                        </div>

                        <div class="finance-card-description">
                            Фактически заработано
                        </div>

                    </div>

                    <div class="finance-card-index">
                        01
                    </div>

                </div>


                <div
                    class="finance-main-value"
                    data-income-value
                >
                    ${formatMoney(income)}
                </div>


                <div class="finance-goal-row">

                    <div>

                        <div class="finance-small-label">
                            MONTHLY GOAL
                        </div>

                        <div
                            class="finance-goal-value"
                            data-goal-value
                        >
                            ${
                                incomeGoal > 0
                                    ? formatMoney(
                                        incomeGoal
                                    )
                                    : "Не задана"
                            }
                        </div>

                    </div>

                    <button
                        type="button"
                        class="finance-edit-button"
                        data-action="edit-goal"
                    >
                        ${
                            incomeGoal > 0
                                ? "EDIT"
                                : "SET GOAL"
                        }
                    </button>

                </div>


                <div class="finance-progress">

                    <div
                        class="finance-progress-track"
                    >

                        <div
                            class="finance-progress-fill"
                            style="width:${Math.min(
                                100,
                                Math.max(
                                    0,
                                    goalPercent
                                )
                            )}%"
                        ></div>

                    </div>

                    <div class="finance-progress-meta">

                        <span>
                            ${goalPercent}% OF GOAL
                        </span>

                        <span>
                            ${
                                incomeGoal > 0
                                    ? formatMoney(
                                        Math.max(
                                            0,
                                            incomeGoal - income
                                        )
                                    ) +
                                      " LEFT"
                                    : "SET A GOAL"
                            }
                        </span>

                    </div>

                </div>


                <button
                    type="button"
                    class="finance-primary-action"
                    data-action="edit-income"
                >
                    UPDATE INCOME
                </button>

            </section>


            <!-- =====================================
                 REQUIRED EXPENSES
                 ===================================== -->

            <section
                class="finance-card finance-expense-card"
                data-expenses-section
            >

                <button
                    type="button"
                    class="finance-card-toggle"
                    data-action="toggle-expenses"
                    aria-expanded="false"
                >

                    <div class="finance-toggle-content">

                        <div class="finance-label">
                            REQUIRED EXPENSES
                        </div>

                        <div class="finance-card-description">
                            Обязательные траты за месяц
                        </div>

                    </div>

                    <div class="finance-toggle-right">

                        <div
                            class="finance-toggle-total"
                            data-expenses-total
                        >
                            ${formatMoney(
                                expensesTotal
                            )}
                        </div>

                        <div
                            class="finance-toggle-percent"
                            data-expenses-percent
                        >
                            ${expensesPercent}% OF INCOME
                        </div>

                        <span
                            class="finance-chevron"
                            aria-hidden="true"
                        >
                            +
                        </span>

                    </div>

                </button>


                <div
                    class="finance-expenses-drawer"
                    data-expenses-drawer
                    aria-hidden="true"
                >

                    <div class="finance-expenses-inner">

                        <div
                            class="finance-expenses-list"
                            data-expenses-list
                        >
                            ${renderExpenses(
                                expenses
                            )}
                        </div>


                        <button
                            type="button"
                            class="finance-add-expense"
                            data-action="add-expense"
                        >
                            <span>
                                +
                            </span>

                            ADD EXPENSE
                        </button>

                    </div>

                </div>

            </section>


            <!-- =====================================
                 FINANCIAL RESERVE
                 ===================================== -->

            <section
                class="finance-card finance-reserve-card"
            >

                <div class="finance-card-top">

                    <div>

                        <div class="finance-label">
                            FINANCIAL RESERVE
                        </div>

                        <div class="finance-card-description">
                            Отложено в этом месяце
                        </div>

                    </div>

                    <div class="finance-card-index">
                        03
                    </div>

                </div>


                <div
                    class="finance-main-value"
                    data-reserve-value
                >
                    ${formatMoney(reserve)}
                </div>


                <div class="finance-reserve-meta">

                    <div>

                        <div class="finance-small-label">
                            FROM ACTUAL INCOME
                        </div>

                        <div
                            class="finance-percent-value"
                            data-reserve-percent
                        >
                            ${reservePercent}%
                        </div>

                    </div>

                    <button
                        type="button"
                        class="finance-edit-button"
                        data-action="edit-reserve"
                    >
                        ${
                            reserve > 0
                                ? "EDIT"
                                : "SET RESERVE"
                        }
                    </button>

                </div>


                <div class="finance-progress">

                    <div
                        class="finance-progress-track"
                    >

                        <div
                            class="finance-progress-fill finance-reserve-fill"
                            style="width:${Math.min(
                                100,
                                reservePercent
                            )}%"
                        ></div>

                    </div>

                    <div class="finance-progress-meta">

                        <span>
                            ${reservePercent}% OF INCOME
                        </span>

                    </div>

                </div>

            </section>


            <!-- =====================================
                 FINANCIAL STABILITY
                 ===================================== -->

            <section
                class="finance-card finance-stability-card"
            >

                <div class="finance-card-top">

                    <div>

                        <div class="finance-label">
                            FINANCIAL STABILITY
                        </div>

                        <div class="finance-card-description">
                            Система оценки стабильности
                        </div>

                    </div>

                    <div class="finance-card-index">
                        04
                    </div>

                </div>


                <div class="finance-stability-content">

                    <div class="finance-stability-score">
                        —
                    </div>

                    <div>

                        <div class="finance-stability-status">
                            ANALYSIS PENDING
                        </div>

                        <div class="finance-stability-description">
                            Алгоритм финансовой стабильности
                            будет подключён позже.
                        </div>

                    </div>

                </div>

            </section>


        </div>

    `;

    bindFinanceEvents(
        container
    );

    return data;
}


/* =========================================
   EXPENSE RENDER
   ========================================= */

function renderExpenses(
    expenses
) {

    if (
        !expenses ||
        expenses.length === 0
    ) {

        return `

            <div class="finance-empty-expenses">

                <div class="finance-empty-icon">
                    —
                </div>

                <div>
                    <strong>
                        No expenses
                    </strong>

                    <span>
                        Добавьте обязательную трату
                    </span>
                </div>

            </div>

        `;
    }


    return expenses
        .map(
            (
                expense
            ) => {

                return `

                    <div
                        class="finance-expense-row"
                        data-expense-id="${escapeHTML(
                            expense.id
                        )}"
                    >

                        <div class="finance-expense-name">
                            ${escapeHTML(
                                expense.name
                            )}
                        </div>

                        <div class="finance-expense-right">

                            <div class="finance-expense-amount">
                                ${formatMoney(
                                    expense.amount
                                )}
                            </div>

                            <button
                                type="button"
                                class="finance-expense-delete"
                                data-action="delete-expense"
                                data-expense-id="${escapeHTML(
                                    expense.id
                                )}"
                                aria-label="Удалить расход"
                            >
                                ×
                            </button>

                        </div>

                    </div>

                `;

            }
        )
        .join("");
}


/* =========================================
   EVENTS
   ========================================= */

function bindFinanceEvents(
    container
) {

    container
        .addEventListener(
            "click",
            event => {

                const actionElement =
                    event.target.closest(
                        "[data-action]"
                    );

                if (
                    !actionElement
                ) {
                    return;
                }

                const action =
                    actionElement.dataset.action;


                switch (
                    action
                ) {

                    case "edit-income":
                        editIncome();
                        break;


                    case "edit-goal":
                        editGoal();
                        break;


                    case "toggle-expenses":
                        toggleExpenses(
                            actionElement
                        );
                        break;


                    case "add-expense":
                        addExpense();
                        break;


                    case "delete-expense":
                        deleteExpense(
                            actionElement.dataset.expenseId
                        );
                        break;


                    case "edit-reserve":
                        editReserve();
                        break;

                }

            }
        );
}


/* =========================================
   INCOME
   ========================================= */

function editIncome() {

    const {
        data,
        month
    } = getCurrentFinanceData();

    const current =
        sanitizeMoney(
            month.income
        );

    const input =
        window.prompt(
            "Введите фактически заработанную сумму за текущий месяц:",
            current || ""
        );

    if (
        input === null
    ) {
        return;
    }

    const income =
        sanitizeMoney(input);

    month.income =
        income;

    data.months[
        data.currentMonth
    ] = month;

    saveFinanceData(
        data
    );

    refreshFinance();
}


/* =========================================
   GOAL
   ========================================= */

function editGoal() {

    const {
        data,
        month
    } = getCurrentFinanceData();

    const current =
        sanitizeMoney(
            month.incomeGoal
        );

    const input =
        window.prompt(
            "Введите цель заработка на этот месяц:",
            current || ""
        );

    if (
        input === null
    ) {
        return;
    }

    const goal =
        sanitizeMoney(input);

    month.incomeGoal =
        goal;

    data.months[
        data.currentMonth
    ] = month;

    saveFinanceData(
        data
    );

    refreshFinance();
}


/* =========================================
   EXPENSES ACCORDION
   ========================================= */

function toggleExpenses(
    button
) {

    const section =
        button.closest(
            "[data-expenses-section]"
        );

    if (
        !section
    ) {
        return;
    }

    const drawer =
        section.querySelector(
            "[data-expenses-drawer]"
        );

    const expanded =
        button.getAttribute(
            "aria-expanded"
        ) === "true";

    button.setAttribute(
        "aria-expanded",
        String(!expanded)
    );

    drawer.setAttribute(
        "aria-hidden",
        String(expanded)
    );

    section.classList.toggle(
        "is-expanded",
        !expanded
    );
}


/* =========================================
   ADD EXPENSE
   ========================================= */

function addExpense() {

    const name =
        window.prompt(
            "Название обязательной траты:"
        );

    if (
        name === null ||
        !name.trim()
    ) {
        return;
    }

    const amountInput =
        window.prompt(
            "Сумма:"
        );

    if (
        amountInput === null
    ) {
        return;
    }

    const amount =
        sanitizeMoney(
            amountInput
        );

    if (
        amount <= 0
    ) {

        window.alert(
            "Введите сумму больше 0."
        );

        return;
    }


    const {
        data,
        month
    } = getCurrentFinanceData();


    if (
        !Array.isArray(
            month.expenses
        )
    ) {
        month.expenses = [];
    }


    month.expenses.push({

        id:
            createExpenseId(),

        name:
            name.trim(),

        amount

    });


    data.months[
        data.currentMonth
    ] = month;


    saveFinanceData(
        data
    );


    refreshFinance(
        true
    );
}


/* =========================================
   DELETE EXPENSE
   ========================================= */

function deleteExpense(
    expenseId
) {

    if (
        !expenseId
    ) {
        return;
    }


    const shouldDelete =
        window.confirm(
            "Удалить эту трату?"
        );


    if (
        !shouldDelete
    ) {
        return;
    }


    const {
        data,
        month
    } = getCurrentFinanceData();


    month.expenses =
        Array.isArray(
            month.expenses
        )
            ? month.expenses.filter(
                expense =>
                    expense.id !== expenseId
            )
            : [];


    data.months[
        data.currentMonth
    ] = month;


    saveFinanceData(
        data
    );


    refreshFinance(
        true
    );
}


/* =========================================
   RESERVE
   ========================================= */

function editReserve() {

    const {
        data,
        month
    } = getCurrentFinanceData();

    const current =
        sanitizeMoney(
            month.reserve
        );

    const input =
        window.prompt(
            "Введите сумму, которую вы отложили в этом месяце:",
            current || ""
        );

    if (
        input === null
    ) {
        return;
    }

    const reserve =
        sanitizeMoney(input);

    month.reserve =
        reserve;

    data.months[
        data.currentMonth
    ] = month;

    saveFinanceData(
        data
    );

    refreshFinance();
}


/* =========================================
   EXPENSE ID
   ========================================= */

function createExpenseId() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 10)
    );
}


/* =========================================
   REFRESH
   ========================================= */

function refreshFinance(
    reopenExpenses = false
) {

    const container =
        document.getElementById(
            "finance-container"
        );

    if (
        !container
    ) {
        return;
    }

    renderFinance(
        container
    );


    if (
        reopenExpenses
    ) {

        const toggle =
            container.querySelector(
                '[data-action="toggle-expenses"]'
            );

        if (
            toggle
        ) {
            toggleExpenses(
                toggle
            );
        }

    }
}


/* =========================================
   INIT
   ========================================= */

function initFinance() {

    const container =
        document.getElementById(
            "finance-container"
        );


    if (
        !container
    ) {

        console.error(
            "LIFE GAME: Finance container не найден."
        );

        return;
    }


    try {

        initializeCurrentMonth();

        renderFinance(
            container
        );


        console.log(
            "LIFE GAME: Finance module работает."
        );

    } catch (
        error
    ) {

        console.error(
            "LIFE GAME: Finance module error:",
            error
        );

        container.innerHTML = `

            <div class="finance-error">

                <div class="finance-label">
                    FINANCE SYSTEM ERROR
                </div>

                <p>
                    Не удалось загрузить финансовый модуль.
                </p>

            </div>

        `;

    }
}


/* =========================================
   PUBLIC API
   ========================================= */

export {
    initFinance
};