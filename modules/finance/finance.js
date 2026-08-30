/* =========================================================
   LIFE GAME — FINANCE MODULE
   Version 1
   ========================================================= */

import {
    getSection,
    updateSection
} from "../../js/storage.js";


const FINANCE_VERSION = 1;


/* =========================================================
   HELPERS
   ========================================================= */

function currentMonthKey() {

    const now = new Date();

    return `${now.getFullYear()}-${String(
        now.getMonth() + 1
    ).padStart(2, "0")}`;
}


function currentDateKey() {

    const now = new Date();

    return `${now.getFullYear()}-${String(
        now.getMonth() + 1
    ).padStart(2, "0")}-${String(
        now.getDate()
    ).padStart(2, "0")}`;
}


function currentMonthLabel() {

    const now = new Date();

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "long",
            year: "numeric"
        }
    ).format(now).toUpperCase();
}


function currentFinanceDate() {

    const now = new Date();

    const month =
        new Intl.DateTimeFormat(
            "en-US",
            {
                month: "long"
            }
        )
        .format(now)
        .toUpperCase();

    const day =
        now.getDate();

    const year =
        now.getFullYear();

    return `${month} ${day} ${year}`;
}


function money(value) {

    const number =
        Number(value) || 0;

    return new Intl.NumberFormat(
        "ru-RU",
        {
            maximumFractionDigits: 0
        }
    ).format(
        Math.max(0, number)
    ) + " ₽";
}


function numberValue(value) {

    if (
        typeof value === "number"
    ) {
        return Math.max(0, value);
    }

    const normalized =
        String(value || "")
            .replace(/\s/g, "")
            .replace(",", ".")
            .replace(/[^\d.]/g, "");

    const result =
        Number(normalized);

    return Number.isFinite(result)
        ? Math.max(0, result)
        : 0;
}


function percentage(value, base) {

    const v =
        numberValue(value);

    const b =
        numberValue(base);

    if (b <= 0) {
        return 0;
    }

    return Math.round(
        (v / b) * 100
    );
}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function createId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .slice(2, 9)
    );
}


/* =========================================================
   DATA
   ========================================================= */

function defaultMonth() {

    return {
        income: 0,
        incomeGoal: 0,
        expenses: [],
        reserve: 0,
        dailySnapshots: {}
    };
}


function getFinanceData() {

    const section =
        getSection("finance") || {};

    const stored =
        section.data || {};

    if (
        !stored.months ||
        typeof stored.months !== "object"
    ) {
        stored.months = {};
    }

    const monthKey =
        currentMonthKey();

    if (
        !stored.months[monthKey]
    ) {

        stored.months[monthKey] =
            defaultMonth();

    }

    const month =
        stored.months[monthKey];

    if (
        !Array.isArray(
            month.expenses
        )
    ) {
        month.expenses = [];
    }

    if (
        !month.dailySnapshots ||
        typeof month.dailySnapshots !== "object"
    ) {
        month.dailySnapshots = {};
    }

    stored.currentMonth =
        monthKey;

    stored.version =
        FINANCE_VERSION;

    return {
        data: stored,
        month
    };
}


/* =========================================================
   DAILY SNAPSHOT
   ========================================================= */

function createDailySnapshot(month) {

    return {
        income:
            numberValue(month.income),

        expenses:
            expensesTotal(month),

        reserve:
            numberValue(month.reserve),

        incomeGoal:
            numberValue(month.incomeGoal),

        stabilityScore:
            null
    };
}


function saveDailySnapshot(
    data,
    month
) {

    const dateKey =
        currentDateKey();

    if (
        !month.dailySnapshots ||
        typeof month.dailySnapshots !== "object"
    ) {
        month.dailySnapshots = {};
    }

    month.dailySnapshots[dateKey] =
        createDailySnapshot(month);

    data.months[
        data.currentMonth
    ] = month;
}


function saveFinanceData(data) {

    updateSection(
        "finance",
        {
            data
        }
    );
}


/* =========================================================
   CALCULATIONS
   ========================================================= */

function expensesTotal(month) {

    if (
        !Array.isArray(
            month.expenses
        )
    ) {
        return 0;
    }

    return month.expenses.reduce(
        (sum, expense) => {

            return sum +
                numberValue(
                    expense.amount
                );

        },
        0
    );
}


function goalProgress(month) {

    return percentage(
        month.income,
        month.incomeGoal
    );
}


function expensePercent(month) {

    return percentage(
        expensesTotal(month),
        month.income
    );
}


function reservePercent(month) {

    return percentage(
        month.reserve,
        month.income
    );
}


/* =========================================================
   STATISTICS STATE
   ========================================================= */

let statisticsMode =
    "week";

let statisticsSortMode =
    "best";


function nextStatisticsMode() {

    if (
        statisticsMode === "week"
    ) {

        statisticsMode =
            "month";

    } else if (
        statisticsMode === "month"
    ) {

        statisticsMode =
            "year";

    } else {

        statisticsMode =
            "week";

    }

    return statisticsMode;
}


function nextStatisticsSortMode() {

    if (
        statisticsSortMode === "best"
    ) {

        statisticsSortMode =
            "worst";

    } else {

        statisticsSortMode =
            "best";

    }

    return statisticsSortMode;
}


/* =========================================================
   STATISTICS DATA
   ========================================================= */

function getAllMonths(
    data
) {

    if (
        !data ||
        !data.months
    ) {
        return [];
    }

    return Object.keys(
        data.months
    )
        .sort()
        .map(
            key => ({
                key,
                month:
                    data.months[key]
            })
        );
}


function getLastSevenDays(
    month
) {

    const result = [];

    const today =
        new Date();

    for (
        let i = 6;
        i >= 0;
        i--
    ) {

        const date =
            new Date(
                today
            );

        date.setDate(
            today.getDate() - i
        );

        const key =
            `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}-${String(
                date.getDate()
            ).padStart(2, "0")}`;

        const snapshot =
            month.dailySnapshots &&
            month.dailySnapshots[key]
                ? month.dailySnapshots[key]
                : null;

        result.push({

            key,

            label:
                new Intl.DateTimeFormat(
                    "en-US",
                    {
                        weekday: "short",
                        day: "numeric"
                    }
                )
                .format(date)
                .toUpperCase(),

            income:
                snapshot
                    ? numberValue(snapshot.income)
                    : 0,

            expenses:
                snapshot
                    ? numberValue(snapshot.expenses)
                    : 0,

            reserve:
                snapshot
                    ? numberValue(snapshot.reserve)
                    : 0,

            stability:
                snapshot
                    ? snapshot.stabilityScore
                    : null

        });

    }

    return result;
}


function getCurrentMonthDays(
    month
) {

    const result = [];

    const now =
        new Date();

    const year =
        now.getFullYear();

    const monthIndex =
        now.getMonth();

    const daysInMonth =
        new Date(
            year,
            monthIndex + 1,
            0
        ).getDate();

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const key =
            `${year}-${String(
                monthIndex + 1
            ).padStart(2, "0")}-${String(
                day
            ).padStart(2, "0")}`;

        const snapshot =
            month.dailySnapshots &&
            month.dailySnapshots[key]
                ? month.dailySnapshots[key]
                : null;

        result.push({

            key,

            label:
                String(day),

            income:
                snapshot
                    ? numberValue(snapshot.income)
                    : 0,

            expenses:
                snapshot
                    ? numberValue(snapshot.expenses)
                    : 0,

            reserve:
                snapshot
                    ? numberValue(snapshot.reserve)
                    : 0,

            stability:
                snapshot
                    ? snapshot.stabilityScore
                    : null

        });

    }

    return result;
}


function getYearData(
    data
) {

    const year =
        new Date()
            .getFullYear();

    const result = [];

    for (
        let monthIndex = 0;
        monthIndex < 12;
        monthIndex++
    ) {

        const key =
            `${year}-${String(
                monthIndex + 1
            ).padStart(2, "0")}`;

        const month =
            data.months &&
            data.months[key]
                ? data.months[key]
                : null;

        result.push({

            key,

            label:
                new Intl.DateTimeFormat(
                    "en-US",
                    {
                        month: "short"
                    }
                )
                .format(
                    new Date(
                        year,
                        monthIndex,
                        1
                    )
                )
                .toUpperCase(),

            income:
                month
                    ? numberValue(
                        month.income
                    )
                    : 0,

            expenses:
                month
                    ? expensesTotal(month)
                    : 0,

            reserve:
                month
                    ? numberValue(
                        month.reserve
                    )
                    : 0,

            stability:
                null

        });

    }

    return result;
}


/* =========================================================
   STATISTICS SCORE
   ========================================================= */

function statisticsScore(
    item
) {

    /*
     * Пока Financial Stability
     * ещё не разработан.
     *
     * Поэтому возвращаем null.
     *
     * Позже здесь будет:
     *
     * item.stability
     *
     * и именно он будет определять
     * BEST DAY / MONTH / YEAR.
     */

    if (
        item &&
        item.stability !== null &&
        item.stability !== undefined
    ) {

        return numberValue(
            item.stability
        );

    }

    return null;
}


function findBestItem(
    items
) {

    const scored =
        items
            .map(
                item => ({
                    item,
                    score:
                        statisticsScore(item)
                })
            )
            .filter(
                entry =>
                    entry.score !== null
            );

    if (
        scored.length === 0
    ) {

        return null;

    }

    return scored.reduce(
        (best, current) => {

            return current.score >
                best.score
                ? current
                : best;

        }
    ).item;
}


function findWorstItem(
    items
) {

    const scored =
        items
            .map(
                item => ({
                    item,
                    score:
                        statisticsScore(item)
                })
            )
            .filter(
                entry =>
                    entry.score !== null
            );

    if (
        scored.length === 0
    ) {

        return null;

    }

    return scored.reduce(
        (worst, current) => {

            return current.score <
                worst.score
                ? current
                : worst;

        }
    ).item;
}


/* =========================================================
   SVG CHART
   ========================================================= */

function buildChart({
    items,
    field,
    label,
    formatter = money
}) {

    const width =
        700;

    const height =
        220;

    const paddingLeft =
        38;

    const paddingRight =
        16;

    const paddingTop =
        20;

    const paddingBottom =
        36;

    const chartWidth =
        width -
        paddingLeft -
        paddingRight;

    const chartHeight =
        height -
        paddingTop -
        paddingBottom;


    const values =
        items.map(
            item =>
                numberValue(
                    item[field]
                )
        );


    const maxValue =
        Math.max(
            1,
            ...values
        );


    const points =
        values.map(
            (value, index) => {

                const x =
                    items.length <= 1
                        ? paddingLeft +
                          chartWidth / 2
                        : paddingLeft +
                          (
                              index /
                              (
                                  items.length -
                                  1
                              )
                          ) *
                          chartWidth;

                const y =
                    paddingTop +
                    chartHeight -
                    (
                        value /
                        maxValue
                    ) *
                    chartHeight;

                return {
                    x,
                    y,
                    value,
                    item:
                        items[index]
                };

            }
        );


    const line =
        points.length
            ? points
                .map(
                    (point, index) =>
                        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
                )
                .join(" ")
            : "";


    const area =
        points.length
            ? `
                M ${points[0].x} ${paddingTop + chartHeight}
                ${points
                    .map(
                        point =>
                            `L ${point.x} ${point.y}`
                    )
                    .join(" ")}
                L ${points[points.length - 1].x}
                  ${paddingTop + chartHeight}
                Z
            `
            : "";


    const grid =
        [0, .25, .5, .75, 1]
            .map(
                ratio => {

                    const y =
                        paddingTop +
                        chartHeight -
                        chartHeight *
                        ratio;

                    return `
                        <line
                            x1="${paddingLeft}"
                            y1="${y}"
                            x2="${width - paddingRight}"
                            y2="${y}"
                            class="lg-finance-chart-grid"
                        />
                    `;

                }
            )
            .join("");


    const labels =
        points
            .map(
                point => {

                    return `
                        <text
                            x="${point.x}"
                            y="${height - 13}"
                            class="lg-finance-chart-label"
                            text-anchor="middle"
                        >
                            ${escapeHTML(
                                point.item.label
                            )}
                        </text>
                    `;

                }
            )
            .join("");


    const dots =
        points
            .map(
                point => {

                    return `
                        <circle
                            cx="${point.x}"
                            cy="${point.y}"
                            r="3.5"
                            class="lg-finance-chart-dot"
                        >
                            <title>
                                ${escapeHTML(
                                    point.item.label
                                )}
                                —
                                ${escapeHTML(
                                    formatter(
                                        point.value
                                    )
                                )}
                            </title>
                        </circle>
                    `;

                }
            )
            .join("");


    return `

        <div
            class="lg-finance-chart-block"
        >

            <div
                class="lg-finance-chart-header"
            >

                <div
                    class="lg-finance-chart-name"
                >
                    ${escapeHTML(label)}
                </div>

                <div
                    class="lg-finance-chart-total"
                >
                    ${formatter(
                        values.reduce(
                            (sum, value) =>
                                sum + value,
                            0
                        )
                    )}
                </div>

            </div>

            <div
                class="lg-finance-chart-wrap"
            >

                <svg
                    class="lg-finance-chart"
                    viewBox="
                        0
                        0
                        ${width}
                        ${height}
                    "
                    preserveAspectRatio="none"
                >

                    ${grid}

                    <path
                        d="${area}"
                        class="lg-finance-chart-area"
                    />

                    <path
                        d="${line}"
                        class="lg-finance-chart-line"
                    />

                    ${dots}

                    ${labels}

                </svg>

            </div>

        </div>

    `;
}


/* =========================================================
   STATISTICS CONTENT
   ========================================================= */

function renderStatisticsContent(
    data,
    month
) {

    let items;

    let periodLabel;

    if (
        statisticsMode === "week"
    ) {

        items =
            getLastSevenDays(
                month
            );

        periodLabel =
            "LAST 7 DAYS";

    } else if (
        statisticsMode === "month"
    ) {

        items =
            getCurrentMonthDays(
                month
            );

        periodLabel =
            currentMonthLabel();

    } else {

        items =
            getYearData(
                data
            );

        periodLabel =
            `${new Date().getFullYear()}`;

    }


    let bestItem =
        statisticsSortMode === "best"
            ? findBestItem(items)
            : findWorstItem(items);


    const sortLabel =
        statisticsSortMode === "best"
            ? "BEST"
            : "LOWEST";


    let sortValue =
        "STABILITY PENDING";


    if (
        bestItem
    ) {

        sortValue =
            `${bestItem.label} · ${statisticsScore(bestItem)}`;

    }


    return `

        <div
            class="lg-finance-statistics-controls"
        >

            <button
                type="button"
                class="
                    lg-finance-statistics-period
                "
                data-action="statistics-period"
            >

                <span>
                    ${escapeHTML(periodLabel)}
                </span>

                <span
                    class="
                        lg-finance-statistics-cycle
                    "
                >
                    TAP TO CHANGE
                </span>

            </button>


            <button
                type="button"
                class="
                    lg-finance-button
                    lg-finance-sort-button
                "
                data-action="statistics-sort"
            >
                ${sortLabel}
            </button>

        </div>


        <div
            class="
                lg-finance-statistics-status
            "
        >

            <div>

                <span
                    class="
                        lg-finance-statistics-status-label
                    "
                >
                    ${sortLabel}
                </span>

                <span
                    class="
                        lg-finance-statistics-status-value
                    "
                >
                    ${escapeHTML(sortValue)}
                </span>

            </div>

            <div
                class="
                    lg-finance-statistics-status-note
                "
            >
                SORTING WILL USE FINANCIAL
                STABILITY SCORE
            </div>

        </div>


        <div
            class="lg-finance-statistics-charts"
        >

            ${buildChart({

                items,

                field:
                    "income",

                label:
                    "INCOME"

            })}


            ${buildChart({

                items,

                field:
                    "expenses",

                label:
                    "REQUIRED EXPENSES"

            })}


            ${buildChart({

                items,

                field:
                    "reserve",

                label:
                    "RESERVE"

            })}

        </div>


        <div
            class="
                lg-finance-statistics-footer
            "
        >

            DATA SOURCE · FINANCE MODULE

        </div>

    `;
}


/* =========================================================
   STYLES
   ========================================================= */

function injectStyles() {

    if (
        document.getElementById(
            "life-finance-runtime-styles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "life-finance-runtime-styles";

    style.textContent = `

        /* ===============================================
           ROOT
           =============================================== */

        .lg-finance {

            --f-surface:
                rgba(255,255,255,.035);

            --f-border:
                rgba(255,255,255,.085);

            --f-border-strong:
                rgba(255,255,255,.15);

            --f-white:
                rgba(255,255,255,.96);

            --f-soft:
                rgba(255,255,255,.72);

            --f-muted:
                rgba(255,255,255,.42);

            --f-dim:
                rgba(255,255,255,.24);

            width:100%;

            color:
                var(--f-white);

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "SF Pro Display",
                "SF Pro Text",
                Inter,
                Arial,
                sans-serif;

            -webkit-font-smoothing:
                antialiased;
        }


        /* ===============================================
           HEADER
           =============================================== */

        .lg-finance-header {

            padding:
                4px
                2px
                22px;

        }


        .lg-finance-title {

            margin:0;

            font-size:
                clamp(
                    38px,
                    10vw,
                    52px
                );

            line-height:.9;

            font-weight:850;

            letter-spacing:-.07em;

        }


        .lg-finance-date {

            display:block;

            margin-top:13px;

            color:
                var(--f-muted);

            font-size:11px;

            line-height:1;

            font-weight:800;

            letter-spacing:.12em;

            white-space:nowrap;

        }


        /* ===============================================
           CARD
           =============================================== */

        .lg-finance-card {

            position:relative;

            overflow:hidden;

            margin-bottom:12px;

            border:
                1px solid
                var(--f-border);

            border-radius:22px;

            background:
                linear-gradient(
                    145deg,
                    rgba(255,255,255,.052),
                    rgba(255,255,255,.018)
                );

            box-shadow:
                0 18px 55px
                rgba(0,0,0,.25);

            backdrop-filter:
                blur(18px);

            -webkit-backdrop-filter:
                blur(18px);

        }


        .lg-finance-card-inner {

            position:relative;

            z-index:1;

            padding:21px;

        }


        .lg-finance-card-header {

            display:flex;

            align-items:center;

            justify-content:space-between;

            gap:20px;

        }


        .lg-finance-card-label {

            color:
                var(--f-muted);

            font-size:8px;

            font-weight:800;

            letter-spacing:.18em;

            text-transform:uppercase;

        }


        .lg-finance-card-subtitle {

            margin-top:6px;

            color:
                var(--f-dim);

            font-size:10px;

            line-height:1.4;

        }


        .lg-finance-card-number {

            color:
                var(--f-dim);

            font-size:8px;

            font-weight:800;

            letter-spacing:.12em;

        }


        /* ===============================================
           INCOME
           =============================================== */

        .lg-finance-big-number {

            margin-top:25px;

            font-size:
                clamp(
                    38px,
                    11vw,
                    58px
                );

            line-height:.9;

            font-weight:850;

            letter-spacing:-.07em;

        }


        .lg-finance-income-base {

            display:flex;

            align-items:center;

            gap:8px;

            margin-top:10px;

            color:
                var(--f-muted);

            font-size:8px;

            font-weight:750;

            letter-spacing:.1em;

        }


        .lg-finance-income-base-percent {

            display:inline-flex;

            padding:
                4px
                7px;

            border:
                1px solid
                var(--f-border);

            border-radius:999px;

            color:
                var(--f-soft);

            font-size:7px;

            font-weight:800;

        }


        /* ===============================================
           ACCORDION
           =============================================== */

        .lg-finance-accordion {

            cursor:default;

        }


        .lg-finance-accordion-header {

            width:100%;

            display:flex;

            align-items:center;

            justify-content:space-between;

            gap:18px;

            padding:21px;

            border:0;

            background:transparent;

            color:inherit;

            font-family:inherit;

            text-align:left;

            cursor:pointer;

        }


        .lg-finance-accordion-title {

            min-width:0;

        }


        .lg-finance-accordion-value {

            display:flex;

            align-items:center;

            gap:12px;

            flex-shrink:0;

        }


        .lg-finance-accordion-amount {

            font-size:18px;

            font-weight:800;

            letter-spacing:-.04em;

        }


        .lg-finance-accordion-arrow {

            width:26px;
            height:26px;

            display:grid;

            place-items:center;

            border:
                1px solid
                var(--f-border);

            border-radius:50%;

            color:
                var(--f-muted);

            font-size:16px;

            font-weight:300;

            transition:
                transform .3s
                cubic-bezier(
                    .22,
                    1,
                    .36,
                    1
                ),
                color .2s ease,
                border-color .2s ease;

        }


        .lg-finance-accordion.open
        .lg-finance-accordion-arrow {

            transform:rotate(45deg);

            color:
                var(--f-white);

            border-color:
                rgba(255,255,255,.2);

        }


        .lg-finance-accordion-content {

            display:grid;

            grid-template-rows:0fr;

            transition:
                grid-template-rows
                .36s
                cubic-bezier(
                    .22,
                    1,
                    .36,
                    1
                );

        }


        .lg-finance-accordion.open
        .lg-finance-accordion-content {

            grid-template-rows:1fr;

        }


        .lg-finance-accordion-inner {

            min-height:0;

            overflow:hidden;

            padding:
                0
                21px;

            opacity:0;

            transform:
                translateY(-7px);

            transition:
                opacity .25s ease,
                transform .36s
                cubic-bezier(
                    .22,
                    1,
                    .36,
                    1
                ),
                padding .36s ease;

        }


        .lg-finance-accordion.open
        .lg-finance-accordion-inner {

            padding:
                0
                21px
                21px;

            opacity:1;

            transform:
                translateY(0);

        }


        .lg-finance-divider {

            border-top:
                1px solid
                var(--f-border);

        }


        /* ===============================================
           META
           =============================================== */

        .lg-finance-goal-row {

            display:flex;

            align-items:flex-end;

            justify-content:space-between;

            gap:15px;

            margin-top:25px;

        }


        .lg-finance-meta-label {

            color:
                var(--f-dim);

            font-size:7px;

            font-weight:800;

            letter-spacing:.13em;

            text-transform:uppercase;

        }


        .lg-finance-meta-value {

            margin-top:5px;

            color:
                var(--f-soft);

            font-size:15px;

            font-weight:750;

        }


        /* ===============================================
           RATIO
           =============================================== */

        .lg-finance-ratio {

            display:flex;

            align-items:center;

            justify-content:space-between;

            gap:15px;

            margin-top:18px;

            padding:
                11px
                12px;

            border:
                1px solid
                rgba(255,255,255,.055);

            border-radius:12px;

            background:
                rgba(255,255,255,.018);

        }


        .lg-finance-ratio-label {

            color:
                var(--f-muted);

            font-size:7px;

            font-weight:800;

            letter-spacing:.12em;

            text-transform:uppercase;

        }


        .lg-finance-ratio-value {

            color:
                var(--f-white);

            font-size:14px;

            font-weight:850;

            letter-spacing:-.03em;

        }


        /* ===============================================
           PROGRESS
           =============================================== */

        .lg-finance-progress {

            margin-top:20px;

        }


        .lg-finance-progress-track {

            width:100%;

            height:4px;

            overflow:hidden;

            border-radius:999px;

            background:
                rgba(255,255,255,.065);

        }


        .lg-finance-progress-fill {

            height:100%;

            border-radius:inherit;

            background:
                linear-gradient(
                    90deg,
                    rgba(255,255,255,.32),
                    rgba(255,255,255,.95)
                );

            box-shadow:
                0 0 16px
                rgba(255,255,255,.2);

            transition:
                width .45s
                cubic-bezier(
                    .22,
                    1,
                    .36,
                    1
                );

        }


        .lg-finance-progress-bottom {

            display:flex;

            justify-content:space-between;

            gap:10px;

            margin-top:8px;

            color:
                var(--f-dim);

            font-size:7px;

            font-weight:750;

            letter-spacing:.1em;

        }


        /* ===============================================
           BUTTON
           =============================================== */

        .lg-finance-button {

            appearance:none;

            min-height:35px;

            padding:
                0
                12px;

            border:
                1px solid
                var(--f-border-strong);

            border-radius:11px;

            background:
                rgba(255,255,255,.035);

            color:
                var(--f-soft);

            font-family:inherit;

            font-size:8px;

            font-weight:800;

            letter-spacing:.11em;

            cursor:pointer;

            transition:
                background .16s ease,
                border-color .16s ease,
                transform .16s ease,
                color .16s ease;

        }


        .lg-finance-button:hover {

            color:
                var(--f-white);

            background:
                rgba(255,255,255,.075);

            border-color:
                rgba(255,255,255,.22);

        }


        .lg-finance-button:active {

            transform:scale(.97);

        }


        .lg-finance-main-button {

            width:100%;

            margin-top:20px;

        }


        /* ===============================================
           EXPENSE LIST
           =============================================== */

        .lg-finance-expense-list {

            border-top:
                1px solid
                var(--f-border);

        }


        .lg-finance-expense-swipe {

            position:relative;

            overflow:hidden;

            border-bottom:
                1px solid
                rgba(255,255,255,.055);

            touch-action:pan-y;

            user-select:none;

            -webkit-user-select:none;

        }


        .lg-finance-expense-delete-action {

            position:absolute;

            top:0;

            right:0;

            bottom:0;

            width:88px;

            display:flex;

            align-items:center;

            justify-content:center;

            background:
                rgba(255,255,255,.09);

            color:
                rgba(255,255,255,.9);

            font-size:8px;

            font-weight:800;

            letter-spacing:.13em;

            cursor:pointer;

        }


        .lg-finance-expense-row {

            position:relative;

            z-index:2;

            min-height:55px;

            display:flex;

            align-items:center;

            justify-content:space-between;

            gap:15px;

            padding:0;

            background:#0a0a0a;

            transform:
                translateX(0);

            transition:
                transform .28s
                cubic-bezier(
                    .22,
                    1,
                    .36,
                    1
                );

            will-change:
                transform;

        }


        .lg-finance-expense-row.swiped {

            transform:
                translateX(-88px);

        }


        .lg-finance-expense-name {

            min-width:0;

            overflow:hidden;

            padding-left:2px;

            color:
                var(--f-soft);

            font-size:11px;

            font-weight:600;

            text-overflow:ellipsis;

            white-space:nowrap;

        }


        .lg-finance-expense-amount {

            padding-right:2px;

            color:
                var(--f-white);

            font-size:11px;

            font-weight:750;

            flex-shrink:0;

        }


        .lg-finance-expense-actions {

            display:flex;

            align-items:center;

            flex-shrink:0;

        }


        /* ===============================================
           ADD EXPENSE
           =============================================== */

        .lg-finance-add-expense {

            width:100%;

            height:43px;

            margin-top:12px;

            display:flex;

            align-items:center;

            justify-content:center;

            gap:8px;

            border:
                1px dashed
                rgba(255,255,255,.13);

            border-radius:11px;

            background:
                rgba(255,255,255,.018);

            color:
                var(--f-muted);

            font-family:inherit;

            font-size:8px;

            font-weight:800;

            letter-spacing:.13em;

            cursor:pointer;

        }


        .lg-finance-add-expense-plus {

            font-size:16px;

            font-weight:300;

        }


        /* ===============================================
           EMPTY
           =============================================== */

        .lg-finance-empty {

            padding:
                22px
                0;

            color:
                var(--f-dim);

            font-size:9px;

        }


        /* ===============================================
           STABILITY
           =============================================== */

        .lg-finance-stability-content {

            display:flex;

            align-items:center;

            gap:17px;

        }


        .lg-finance-stability-score {

            width:70px;
            height:70px;

            display:grid;

            place-items:center;

            flex-shrink:0;

            border:
                1px solid
                var(--f-border-strong);

            border-radius:20px;

            background:
                rgba(255,255,255,.025);

            color:
                var(--f-dim);

            font-size:30px;

            font-weight:800;

        }


        .lg-finance-stability-status {

            color:
                var(--f-soft);

            font-size:9px;

            font-weight:800;

            letter-spacing:.13em;

        }


        .lg-finance-stability-text {

            max-width:360px;

            margin-top:7px;

            color:
                var(--f-dim);

            font-size:10px;

            line-height:1.5;

        }


        /* ===============================================
           STATISTICS
           =============================================== */

        .lg-finance-statistics-controls {

            display:flex;

            align-items:stretch;

            gap:9px;

        }


        .lg-finance-statistics-period {

            flex:1;

            min-width:0;

            min-height:52px;

            display:flex;

            flex-direction:column;

            align-items:flex-start;

            justify-content:center;

            gap:5px;

            padding:
                0
                13px;

            border:
                1px solid
                var(--f-border);

            border-radius:13px;

            background:
                rgba(255,255,255,.025);

            color:
                var(--f-white);

            font-family:inherit;

            text-align:left;

            cursor:pointer;

        }


        .lg-finance-statistics-period
        > span:first-child {

            font-size:10px;

            font-weight:850;

            letter-spacing:.08em;

        }


        .lg-finance-statistics-cycle {

            color:
                var(--f-dim);

            font-size:6px;

            font-weight:800;

            letter-spacing:.13em;

        }


        .lg-finance-sort-button {

            min-width:78px;

            height:auto;

        }


        .lg-finance-statistics-status {

            margin-top:11px;

            padding:
                12px
                13px;

            border:
                1px solid
                rgba(255,255,255,.055);

            border-radius:13px;

            background:
                rgba(255,255,255,.018);

        }


        .lg-finance-statistics-status-label {

            color:
                var(--f-dim);

            font-size:7px;

            font-weight:800;

            letter-spacing:.14em;

            margin-right:9px;

        }


        .lg-finance-statistics-status-value {

            color:
                var(--f-white);

            font-size:10px;

            font-weight:800;

        }


        .lg-finance-statistics-status-note {

            margin-top:7px;

            color:
                var(--f-dim);

            font-size:6px;

            font-weight:750;

            letter-spacing:.1em;

        }


        .lg-finance-statistics-charts {

            display:flex;

            flex-direction:column;

            gap:10px;

            margin-top:12px;

        }


        .lg-finance-chart-block {

            overflow:hidden;

            border:
                1px solid
                rgba(255,255,255,.055);

            border-radius:15px;

            background:
                rgba(255,255,255,.018);

        }


        .lg-finance-chart-header {

            display:flex;

            align-items:center;

            justify-content:space-between;

            gap:10px;

            padding:
                13px
                13px
                5px;

        }


        .lg-finance-chart-name {

            color:
                var(--f-muted);

            font-size:7px;

            font-weight:850;

            letter-spacing:.14em;

        }


        .lg-finance-chart-total {

            color:
                var(--f-soft);

            font-size:8px;

            font-weight:800;

        }


        .lg-finance-chart-wrap {

            width:100%;

            height:185px;

            padding:
                0
                5px
                4px;

        }


        .lg-finance-chart {

            width:100%;

            height:100%;

            display:block;

            overflow:visible;

        }


        .lg-finance-chart-grid {

            stroke:
                rgba(255,255,255,.055);

            stroke-width:1;

            vector-effect:
                non-scaling-stroke;

        }


        .lg-finance-chart-area {

            fill:
                rgba(255,255,255,.045);

        }


        .lg-finance-chart-line {

            fill:none;

            stroke:
                rgba(255,255,255,.82);

            stroke-width:2;

            stroke-linecap:round;

            stroke-linejoin:round;

            vector-effect:
                non-scaling-stroke;

        }


        .lg-finance-chart-dot {

            fill:
                rgba(255,255,255,.95);

            stroke:
                #0b0b0b;

            stroke-width:1.5;

            vector-effect:
                non-scaling-stroke;

        }


        .lg-finance-chart-label {

            fill:
                rgba(255,255,255,.28);

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "SF Pro Text",
                Arial,
                sans-serif;

            font-size:8px;

            font-weight:700;

            letter-spacing:.02em;

        }


        .lg-finance-statistics-footer {

            margin-top:15px;

            padding-top:12px;

            border-top:
                1px solid
                rgba(255,255,255,.045);

            color:
                rgba(255,255,255,.18);

            font-size:6px;

            font-weight:800;

            letter-spacing:.16em;

            text-align:center;

        }


        /* ===============================================
           MODAL
           =============================================== */

        .lg-finance-modal {

            position:fixed;

            inset:0;

            z-index:99999;

            display:flex;

            align-items:flex-end;

            justify-content:center;

            padding:15px;

            background:
                rgba(0,0,0,.7);

            backdrop-filter:
                blur(12px);

            -webkit-backdrop-filter:
                blur(12px);

            opacity:0;

            pointer-events:none;

            transition:
                opacity .2s ease;

        }


        .lg-finance-modal.active {

            opacity:1;

            pointer-events:auto;

        }


        .lg-finance-modal-panel {

            width:100%;

            max-width:520px;

            padding:22px;

            border:
                1px solid
                var(--f-border-strong);

            border-radius:24px;

            background:#0b0b0b;

            box-shadow:
                0 -10px 70px
                rgba(0,0,0,.6);

            transform:
                translateY(30px);

            transition:
                transform .28s
                cubic-bezier(
                    .22,
                    1,
                    .36,
                    1
                );

        }


        .lg-finance-modal.active
        .lg-finance-modal-panel {

            transform:
                translateY(0);

        }


        .lg-finance-modal-label {

            color:
                var(--f-muted);

            font-size:8px;

            font-weight:800;

            letter-spacing:.18em;

        }


        .lg-finance-modal-title {

            margin-top:7px;

            font-size:23px;

            font-weight:800;

            letter-spacing:-.04em;

        }


        .lg-finance-input {

            width:100%;

            height:55px;

            margin-top:20px;

            padding:
                0
                16px;

            border:
                1px solid
                var(--f-border-strong);

            border-radius:13px;

            outline:none;

            background:
                rgba(255,255,255,.045);

            color:
                var(--f-white);

            font-family:inherit;

            font-size:19px;

            font-weight:700;

            -webkit-appearance:none;

        }


        .lg-finance-modal-buttons {

            display:grid;

            grid-template-columns:
                1fr
                1fr;

            gap:9px;

            margin-top:12px;

        }


        .lg-finance-modal-button {

            height:46px;

            border:
                1px solid
                var(--f-border);

            border-radius:12px;

            background:
                rgba(255,255,255,.035);

            color:
                var(--f-soft);

            font-family:inherit;

            font-size:8px;

            font-weight:800;

            letter-spacing:.1em;

            cursor:pointer;

        }


        .lg-finance-modal-save {

            background:
                rgba(255,255,255,.09);

            border-color:
                rgba(255,255,255,.18);

            color:
                var(--f-white);

        }


        /* ===============================================
           MOBILE
           =============================================== */

        @media (max-width:500px) {

            .lg-finance-card-inner {
                padding:19px;
            }

            .lg-finance-accordion-header {
                padding:19px;
            }

            .lg-finance-accordion.open
            .lg-finance-accordion-inner {

                padding:
                    0
                    19px
                    19px;

            }

            .lg-finance-chart-wrap {

                height:165px;

            }

        }

    `;

    document.head.appendChild(style);
}


/* =========================================================
   MODAL
   ========================================================= */

let activeModal = null;


function closeModal() {

    if (!activeModal) {
        return;
    }

    activeModal.remove();

    activeModal = null;
}


function openModal({
    label,
    title,
    value = "",
    placeholder = "",
    onSave
}) {

    closeModal();

    const modal =
        document.createElement("div");

    modal.className =
        "lg-finance-modal active";

    modal.innerHTML = `

        <div
            class="lg-finance-modal-panel"
        >

            <div
                class="lg-finance-modal-label"
            >
                ${escapeHTML(label)}
            </div>

            <div
                class="lg-finance-modal-title"
            >
                ${escapeHTML(title)}
            </div>

            <input
                class="lg-finance-input"
                type="number"
                inputmode="decimal"
                min="0"
                step="1"
                value="${escapeHTML(value)}"
                placeholder="${escapeHTML(placeholder)}"
            >

            <div
                class="lg-finance-modal-buttons"
            >

                <button
                    type="button"
                    class="lg-finance-modal-button"
                    data-modal-cancel
                >
                    CANCEL
                </button>

                <button
                    type="button"
                    class="
                        lg-finance-modal-button
                        lg-finance-modal-save
                    "
                    data-modal-save
                >
                    SAVE
                </button>

            </div>

        </div>

    `;

    document.body.appendChild(
        modal
    );

    activeModal =
        modal;

    const input =
        modal.querySelector(
            ".lg-finance-input"
        );

    requestAnimationFrame(() => {

        input.focus();

        try {
            input.select();
        } catch (_) {}

    });

    modal
        .querySelector(
            "[data-modal-cancel]"
        )
        .addEventListener(
            "click",
            closeModal
        );

    modal
        .querySelector(
            "[data-modal-save]"
        )
        .addEventListener(
            "click",
            () => {

                const value =
                    numberValue(
                        input.value
                    );

                onSave(value);

                closeModal();

            }
        );

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeModal();

            }

        }
    );

    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                modal
                    .querySelector(
                        "[data-modal-save]"
                    )
                    .click();

            }

            if (
                event.key === "Escape"
            ) {

                closeModal();

            }

        }
    );
}


/* =========================================================
   EXPENSE MODAL
   ========================================================= */

function openExpenseModal() {

    closeModal();

    const modal =
        document.createElement("div");

    modal.className =
        "lg-finance-modal active";

    modal.innerHTML = `

        <div
            class="lg-finance-modal-panel"
        >

            <div
                class="lg-finance-modal-label"
            >
                REQUIRED EXPENSE
            </div>

            <div
                class="lg-finance-modal-title"
            >
                Add expense
            </div>

            <input
                class="lg-finance-input"
                data-expense-name
                type="text"
                maxlength="80"
                placeholder="Название траты"
            >

            <input
                class="lg-finance-input"
                data-expense-amount
                type="number"
                inputmode="decimal"
                min="0"
                step="1"
                placeholder="Сумма ₽"
            >

            <div
                class="lg-finance-modal-buttons"
            >

                <button
                    type="button"
                    class="lg-finance-modal-button"
                    data-modal-cancel
                >
                    CANCEL
                </button>

                <button
                    type="button"
                    class="
                        lg-finance-modal-button
                        lg-finance-modal-save
                    "
                    data-modal-save
                >
                    ADD
                </button>

            </div>

        </div>

    `;

    document.body.appendChild(
        modal
    );

    activeModal =
        modal;

    const nameInput =
        modal.querySelector(
            "[data-expense-name]"
        );

    const amountInput =
        modal.querySelector(
            "[data-expense-amount]"
        );

    requestAnimationFrame(() => {

        nameInput.focus();

    });

    modal
        .querySelector(
            "[data-modal-cancel]"
        )
        .addEventListener(
            "click",
            closeModal
        );

    modal
        .querySelector(
            "[data-modal-save]"
        )
        .addEventListener(
            "click",
            () => {

                const name =
                    nameInput.value.trim();

                const amount =
                    numberValue(
                        amountInput.value
                    );

                if (!name) {

                    nameInput.focus();

                    return;

                }

                if (amount <= 0) {

                    amountInput.focus();

                    return;

                }

                const {
                    data,
                    month
                } =
                    getFinanceData();

                if (
                    !Array.isArray(
                        month.expenses
                    )
                ) {

                    month.expenses = [];

                }

                month.expenses.push({

                    id:
                        createId(),

                    name,

                    amount

                });

                saveDailySnapshot(
                    data,
                    month
                );

                saveFinanceData(
                    data
                );

                closeModal();

                renderFinance(
                    getFinanceContainer(),
                    true
                );

            }
        );

    amountInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                modal
                    .querySelector(
                        "[data-modal-save]"
                    )
                    .click();

            }

        }
    );
}


/* =========================================================
   EXPENSE LIST
   ========================================================= */

function renderExpenses(
    expenses
) {

    if (
        !Array.isArray(expenses) ||
        expenses.length === 0
    ) {

        return `

            <div
                class="lg-finance-empty"
            >
                Пока обязательных трат нет.
            </div>

        `;

    }

    return expenses
        .map(expense => {

            return `

                <div
                    class="
                        lg-finance-expense-swipe
                    "
                    data-expense-id="${escapeHTML(
                        expense.id
                    )}"
                >

                    <div
                        class="
                            lg-finance-expense-delete-action
                        "
                        data-delete-expense
                        data-id="${escapeHTML(
                            expense.id
                        )}"
                    >
                        DELETE
                    </div>

                    <div
                        class="
                            lg-finance-expense-row
                        "
                        data-swipe-row
                    >

                        <div
                            class="
                                lg-finance-expense-name
                            "
                        >
                            ${escapeHTML(
                                expense.name
                            )}
                        </div>

                        <div
                            class="
                                lg-finance-expense-actions
                            "
                        >

                            <div
                                class="
                                    lg-finance-expense-amount
                                "
                            >
                                ${money(
                                    expense.amount
                                )}
                            </div>

                        </div>

                    </div>

                </div>

            `;

        })
        .join("");
}


/* =========================================================
   ACCORDION
   ========================================================= */

function createAccordion({
    id,
    label,
    subtitle,
    amount,
    content,
    open = false
}) {

    return `

        <section
            class="
                lg-finance-card
                lg-finance-accordion
                ${open ? "open" : ""}
            "
            data-accordion="${id}"
        >

            <button
                type="button"
                class="
                    lg-finance-accordion-header
                "
                data-action="toggle-accordion"
                data-accordion-id="${id}"
                aria-expanded="${open}"
            >

                <div
                    class="
                        lg-finance-accordion-title
                    "
                >

                    <div
                        class="
                            lg-finance-card-label
                        "
                    >
                        ${label}
                    </div>

                    <div
                        class="
                            lg-finance-card-subtitle
                        "
                    >
                        ${subtitle}
                    </div>

                </div>

                <div
                    class="
                        lg-finance-accordion-value
                    "
                >

                    ${
                        amount !== undefined
                            ? `
                                <div
                                    class="
                                        lg-finance-accordion-amount
                                    "
                                >
                                    ${amount}
                                </div>
                            `
                            : ""
                    }

                    <div
                        class="
                            lg-finance-accordion-arrow
                        "
                    >
                        +
                    </div>

                </div>

            </button>

            <div
                class="
                    lg-finance-accordion-content
                "
            >

                <div
                    class="
                        lg-finance-accordion-inner
                    "
                >

                    <div
                        class="
                            lg-finance-divider
                        "
                    ></div>

                    <div
                        style="
                            padding-top:20px;
                        "
                    >

                        ${content}

                    </div>

                </div>

            </div>

        </section>

    `;
}


/* =========================================================
   MAIN RENDER
   ========================================================= */

function renderFinance(
    container,
    reopenExpenses = false
) {

    if (!container) {
        return;
    }

    const {
        data,
        month
    } =
        getFinanceData();

    const income =
        numberValue(
            month.income
        );

    const goal =
        numberValue(
            month.incomeGoal
        );

    const totalExpenses =
        expensesTotal(
            month
        );

    const reserve =
        numberValue(
            month.reserve
        );

    const goalPercent =
        goalProgress(
            month
        );

    const expensePercentage =
        expensePercent(
            month
        );

    const reservePercentage =
        reservePercent(
            month
        );

    const visualGoal =
        Math.min(
            100,
            Math.max(
                0,
                goalPercent
            )
        );

    const visualReserve =
        Math.min(
            100,
            Math.max(
                0,
                reservePercentage
            )
        );


    /* ===============================================
       GOAL
       =============================================== */

    const goalContent = `

        <div
            class="lg-finance-goal-row"
            style="margin-top:0;"
        >

            <div>

                <div
                    class="lg-finance-meta-label"
                >
                    TARGET
                </div>

                <div
                    class="lg-finance-meta-value"
                >
                    ${
                        goal > 0
                            ? money(goal)
                            : "Не задана"
                    }
                </div>

            </div>

            <button
                type="button"
                class="lg-finance-button"
                data-action="edit-goal"
            >
                ${
                    goal > 0
                        ? "EDIT GOAL"
                        : "SET GOAL"
                }
            </button>

        </div>

        <div
            class="lg-finance-ratio"
        >

            <div
                class="lg-finance-ratio-label"
            >
                ACTUAL INCOME / GOAL
            </div>

            <div
                class="lg-finance-ratio-value"
            >
                ${goalPercent}%
            </div>

        </div>

        <div
            class="lg-finance-progress"
        >

            <div
                class="lg-finance-progress-track"
            >

                <div
                    class="lg-finance-progress-fill"
                    style="
                        width:${visualGoal}%;
                    "
                ></div>

            </div>

            <div
                class="lg-finance-progress-bottom"
            >

                <span>
                    ${goalPercent}% OF GOAL
                </span>

                <span>

                    ${
                        goal > 0
                            ? (
                                goalPercent >= 100
                                    ? "GOAL REACHED"
                                    : money(
                                        Math.max(
                                            0,
                                            goal - income
                                        )
                                    ) + " LEFT"
                            )
                            : "SET YOUR GOAL"
                    }

                </span>

            </div>

        </div>

    `;


    /* ===============================================
       EXPENSES
       =============================================== */

    const expenseContent = `

        <div
            class="lg-finance-ratio"
            style="
                margin-top:0;
                margin-bottom:18px;
            "
        >

            <div
                class="lg-finance-ratio-label"
            >
                OF ACTUAL INCOME
            </div>

            <div
                class="lg-finance-ratio-value"
            >
                ${expensePercentage}%
            </div>

        </div>

        <div
            class="lg-finance-expense-list"
        >

            ${renderExpenses(
                month.expenses
            )}

        </div>

        <button
            type="button"
            class="
                lg-finance-add-expense
            "
            data-action="add-expense"
        >

            <span
                class="
                    lg-finance-add-expense-plus
                "
            >
                +
            </span>

            ADD EXPENSE

        </button>

    `;


    /* ===============================================
       RESERVE
       =============================================== */

    const reserveContent = `

        <div
            class="lg-finance-goal-row"
            style="margin-top:0;"
        >

            <div>

                <div
                    class="lg-finance-meta-label"
                >
                    SAVED THIS MONTH
                </div>

                <div
                    class="lg-finance-meta-value"
                >
                    ${money(reserve)}
                </div>

            </div>

            <button
                type="button"
                class="lg-finance-button"
                data-action="edit-reserve"
            >

                ${
                    reserve > 0
                        ? "EDIT RESERVE"
                        : "SET RESERVE"
                }

            </button>

        </div>

        <div
            class="lg-finance-ratio"
        >

            <div
                class="lg-finance-ratio-label"
            >
                OF ACTUAL INCOME
            </div>

            <div
                class="lg-finance-ratio-value"
            >
                ${reservePercentage}%
            </div>

        </div>

        <div
            class="lg-finance-progress"
        >

            <div
                class="lg-finance-progress-track"
            >

                <div
                    class="lg-finance-progress-fill"
                    style="
                        width:${visualReserve}%;
                    "
                ></div>

            </div>

            <div
                class="
                    lg-finance-progress-bottom
                "
            >

                <span>
                    ${reservePercentage}% OF INCOME
                </span>

            </div>

        </div>

    `;


    /* ===============================================
       STABILITY
       =============================================== */

    const stabilityContent = `

        <div
            class="lg-finance-ratio"
            style="
                margin-top:0;
                margin-bottom:18px;
            "
        >

            <div
                class="lg-finance-ratio-label"
            >
                OF ACTUAL INCOME
            </div>

            <div
                class="lg-finance-ratio-value"
            >
                —
            </div>

        </div>

        <div
            class="
                lg-finance-stability-content
            "
        >

            <div
                class="
                    lg-finance-stability-score
                "
            >
                —
            </div>

            <div>

                <div
                    class="
                        lg-finance-stability-status
                    "
                >
                    ANALYSIS PENDING
                </div>

                <div
                    class="
                        lg-finance-stability-text
                    "
                >
                    Алгоритм финансовой стабильности
                    будет добавлен на следующем этапе.
                </div>

            </div>

        </div>

    `;


    /* ===============================================
       STATISTICS
       =============================================== */

    const statisticsContent =
        renderStatisticsContent(
            data,
            month
        );


    /* ===============================================
       MAIN HTML
       =============================================== */

    container.innerHTML = `

        <div
            class="lg-finance"
        >

            <header
                class="lg-finance-header"
            >

                <h1
                    class="lg-finance-title"
                >
                    Finance
                </h1>

                <div
                    class="lg-finance-date"
                >
                    ${currentFinanceDate()}
                </div>

            </header>


            <!-- MONTHLY INCOME -->

            <section
                class="lg-finance-card"
            >

                <div
                    class="
                        lg-finance-card-inner
                    "
                >

                    <div
                        class="
                            lg-finance-card-header
                        "
                    >

                        <div>

                            <div
                                class="
                                    lg-finance-card-label
                                "
                            >
                                MONTHLY INCOME
                            </div>

                            <div
                                class="
                                    lg-finance-card-subtitle
                                "
                            >
                                Фактически заработано
                            </div>

                        </div>


                        <div
                            class="
                                lg-finance-card-number
                            "
                        >
                            01
                        </div>

                    </div>


                    <div
                        class="
                            lg-finance-big-number
                        "
                    >
                        ${money(income)}
                    </div>


                    <div
                        class="
                            lg-finance-income-base
                        "
                    >

                        <span>
                            BASE OF ALL FINANCIAL RATIOS
                        </span>

                        <span
                            class="
                                lg-finance-income-base-percent
                            "
                        >
                            100%
                        </span>

                    </div>


                    <button
                        type="button"
                        class="
                            lg-finance-button
                            lg-finance-main-button
                        "
                        data-action="edit-income"
                    >
                        UPDATE INCOME
                    </button>

                </div>

            </section>


            <!-- MONTHLY GOAL -->

            ${createAccordion({

                id:
                    "goal",

                label:
                    "MONTHLY GOAL",

                subtitle:
                    "Цель заработка за месяц",

                amount:
                    goal > 0
                        ? money(goal)
                        : "—",

                content:
                    goalContent

            })}


            <!-- REQUIRED EXPENSES -->

            ${createAccordion({

                id:
                    "expenses",

                label:
                    "REQUIRED EXPENSES",

                subtitle:
                    "Обязательные траты за месяц",

                amount:
                    money(totalExpenses),

                content:
                    expenseContent,

                open:
                    reopenExpenses

            })}


            <!-- FINANCIAL RESERVE -->

            ${createAccordion({

                id:
                    "reserve",

                label:
                    "FINANCIAL RESERVE",

                subtitle:
                    "Отложено в этом месяце",

                amount:
                    money(reserve),

                content:
                    reserveContent

            })}


            <!-- FINANCIAL STABILITY -->

            ${createAccordion({

                id:
                    "stability",

                label:
                    "FINANCIAL STABILITY",

                subtitle:
                    "Оценка финансовой устойчивости",

                amount:
                    "—",

                content:
                    stabilityContent

            })}


            <!-- STATISTICS -->

            ${createAccordion({

                id:
                    "statistics",

                label:
                    "STATISTICS",

                subtitle:
                    "Аналитика финансовых показателей",

                amount:
                    statisticsMode === "week"
                        ? "7D"
                        : statisticsMode === "month"
                            ? "1M"
                            : "1Y",

                content:
                    statisticsContent

            })}


            <!-- LIFE MODULE 1 -->

            <div
                style="
                    margin-top:22px;
                    margin-bottom:8px;
                    text-align:center;
                    color:rgba(255,255,255,.22);
                    font-size:7px;
                    font-weight:800;
                    letter-spacing:.18em;
                "
            >
                LIFE MODULE 1
            </div>

        </div>

    `;


    bindEvents(
        container
    );

    initExpenseSwipe(
        container
    );


    /*
     * Сохраняем дневной снимок
     * даже при обычном рендере.
     */

    saveDailySnapshot(
        data,
        month
    );

    saveFinanceData(
        data
    );
}


/* =========================================================
   CONTAINER
   ========================================================= */

function getFinanceContainer() {

    return (

        document.getElementById(
            "finance-container"
        )

        ||

        document.querySelector(
            "[data-section='finance']"
        )

        ||

        document.querySelector(
            ".finance-container"
        )

        ||

        document.querySelector(
            "#finance"
        )

    );
}


/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents(
    container
) {

    container.addEventListener(
        "click",
        event => {

            const action =
                event.target.closest(
                    "[data-action]"
                );


            if (action) {

                const type =
                    action.dataset.action;


                if (
                    type ===
                    "toggle-accordion"
                ) {

                    toggleAccordion(
                        action
                    );

                    return;
                }


                if (
                    type ===
                    "edit-income"
                ) {

                    editIncome();

                    return;
                }


                if (
                    type ===
                    "edit-goal"
                ) {

                    editGoal();

                    return;
                }


                if (
                    type ===
                    "edit-reserve"
                ) {

                    editReserve();

                    return;
                }


                if (
                    type ===
                    "add-expense"
                ) {

                    openExpenseModal();

                    return;
                }


                if (
                    type ===
                    "statistics-period"
                ) {

                    cycleStatisticsPeriod(
                        container
                    );

                    return;
                }


                if (
                    type ===
                    "statistics-sort"
                ) {

                    cycleStatisticsSort(
                        container
                    );

                    return;
                }

            }


            const deleteButton =
                event.target.closest(
                    "[data-delete-expense]"
                );


            if (
                deleteButton
            ) {

                deleteExpense(
                    deleteButton.dataset.id
                );

            }

        }
    );
}


/* =========================================================
   ACCORDION TOGGLE
   ========================================================= */

function toggleAccordion(
    button
) {

    const id =
        button.dataset
            .accordionId;


    const card =
        button.closest(
            `[data-accordion="${id}"]`
        );


    if (!card) {
        return;
    }


    const isOpen =
        card.classList.contains(
            "open"
        );


    card.classList.toggle(
        "open",
        !isOpen
    );


    button.setAttribute(
        "aria-expanded",
        String(!isOpen)
    );
}


/* =========================================================
   STATISTICS PERIOD
   ========================================================= */

function cycleStatisticsPeriod(
    container
) {

    nextStatisticsMode();

    renderFinance(
        container
    );

    requestAnimationFrame(() => {

        const statisticsCard =
            container.querySelector(
                '[data-accordion="statistics"]'
            );

        if (
            statisticsCard
        ) {

            const button =
                statisticsCard.querySelector(
                    "[data-action='toggle-accordion']"
                );

            const isOpen =
                statisticsCard.classList.contains(
                    "open"
                );

            if (!isOpen && button) {

                button.click();

            }

        }

    });
}


/* =========================================================
   STATISTICS SORT
   ========================================================= */

function cycleStatisticsSort(
    container
) {

    nextStatisticsSortMode();

    renderFinance(
        container
    );

    requestAnimationFrame(() => {

        const statisticsCard =
            container.querySelector(
                '[data-accordion="statistics"]'
            );

        if (
            statisticsCard
        ) {

            statisticsCard.classList.add(
                "open"
            );

            const button =
                statisticsCard.querySelector(
                    "[data-action='toggle-accordion']"
                );

            if (button) {

                button.setAttribute(
                    "aria-expanded",
                    "true"
                );

            }

        }

    });
}


/* =========================================================
   SWIPE SYSTEM
   ========================================================= */

function initExpenseSwipe(
    container
) {

    const rows =
        container.querySelectorAll(
            ".lg-finance-expense-swipe"
        );


    rows.forEach(
        swipeContainer => {

            const row =
                swipeContainer.querySelector(
                    "[data-swipe-row]"
                );


            if (!row) {
                return;
            }


            let startX = 0;
            let startY = 0;

            let currentX = 0;

            let dragging = false;

            let moved = false;


            const DELETE_DISTANCE =
                70;

            const MAX_DISTANCE =
                88;


            function closeRow() {

                row.classList.remove(
                    "swiped"
                );

            }


            function openRow() {

                row.classList.add(
                    "swiped"
                );

            }


            function setPosition(
                distance
            ) {

                const value =
                    Math.max(
                        0,
                        Math.min(
                            MAX_DISTANCE,
                            distance
                        )
                    );

                row.style.transform =
                    `translateX(-${value}px)`;

            }


            function resetPosition() {

                row.style.transform = "";

            }


            row.addEventListener(
                "pointerdown",
                event => {

                    if (
                        event.button !== undefined &&
                        event.button !== 0
                    ) {
                        return;
                    }


                    startX =
                        event.clientX;

                    startY =
                        event.clientY;

                    currentX =
                        startX;

                    dragging =
                        true;

                    moved =
                        false;

                    row.style.transition =
                        "none";


                    try {

                        row.setPointerCapture(
                            event.pointerId
                        );

                    } catch (_) {}

                }
            );


            row.addEventListener(
                "pointermove",
                event => {

                    if (!dragging) {
                        return;
                    }


                    currentX =
                        event.clientX;


                    const deltaX =
                        currentX -
                        startX;

                    const deltaY =
                        event.clientY -
                        startY;


                    if (
                        Math.abs(deltaY) >
                        Math.abs(deltaX)
                    ) {

                        return;

                    }


                    if (
                        Math.abs(deltaX) >
                        8
                    ) {

                        moved =
                            true;

                    }


                    if (
                        deltaX < 0
                    ) {

                        setPosition(
                            Math.abs(deltaX)
                        );

                    }

                    else if (
                        row.classList.contains(
                            "swiped"
                        )
                    ) {

                        setPosition(
                            MAX_DISTANCE -
                            Math.min(
                                MAX_DISTANCE,
                                deltaX
                            )
                        );

                    }

                }
            );


            row.addEventListener(
                "pointerup",
                event => {

                    if (!dragging) {
                        return;
                    }


                    dragging =
                        false;


                    row.style.transition =
                        "";


                    const deltaX =
                        currentX -
                        startX;


                    if (
                        Math.abs(deltaX) <
                        10
                    ) {

                        resetPosition();

                        return;

                    }


                    if (
                        deltaX < 0
                    ) {

                        if (
                            Math.abs(deltaX) >=
                            DELETE_DISTANCE
                        ) {

                            openRow();

                        }

                        else {

                            closeRow();

                        }

                    }

                    else {

                        closeRow();

                    }


                    try {

                        row.releasePointerCapture(
                            event.pointerId
                        );

                    } catch (_) {}

                }
            );


            row.addEventListener(
                "pointercancel",
                () => {

                    dragging =
                        false;

                    row.style.transition =
                        "";

                    resetPosition();

                }
            );


            row.addEventListener(
                "click",
                () => {

                    if (moved) {
                        return;
                    }


                    rows.forEach(
                        other => {

                            if (
                                other !==
                                swipeContainer
                            ) {

                                const otherRow =
                                    other.querySelector(
                                        "[data-swipe-row]"
                                    );

                                if (otherRow) {

                                    otherRow.classList
                                        .remove(
                                            "swiped"
                                        );

                                }

                            }

                        }
                    );

                }
            );

        }
    );
}


/* =========================================================
   EDIT INCOME
   ========================================================= */

function editIncome() {

    const {
        data,
        month
    } =
        getFinanceData();


    openModal({

        label:
            "MONTHLY INCOME",

        title:
            "Update income",

        value:
            month.income || "",

        placeholder:
            "0",

        onSave:
            value => {

                month.income =
                    value;

                saveDailySnapshot(
                    data,
                    month
                );

                saveFinanceData(
                    data
                );

                renderFinance(
                    getFinanceContainer()
                );

            }

    });
}


/* =========================================================
   EDIT GOAL
   ========================================================= */

function editGoal() {

    const {
        data,
        month
    } =
        getFinanceData();


    openModal({

        label:
            "MONTHLY GOAL",

        title:
            "Set income goal",

        value:
            month.incomeGoal || "",

        placeholder:
            "100000",

        onSave:
            value => {

                month.incomeGoal =
                    value;

                saveDailySnapshot(
                    data,
                    month
                );

                saveFinanceData(
                    data
                );

                renderFinance(
                    getFinanceContainer()
                );

            }

    });
}


/* =========================================================
   EDIT RESERVE
   ========================================================= */

function editReserve() {

    const {
        data,
        month
    } =
        getFinanceData();


    openModal({

        label:
            "FINANCIAL RESERVE",

        title:
            "Set reserve",

        value:
            month.reserve || "",

        placeholder:
            "0",

        onSave:
            value => {

                month.reserve =
                    value;

                saveDailySnapshot(
                    data,
                    month
                );

                saveFinanceData(
                    data
                );

                renderFinance(
                    getFinanceContainer()
                );

            }

    });
}


/* =========================================================
   DELETE EXPENSE
   ========================================================= */

function deleteExpense(
    id
) {

    if (!id) {
        return;
    }


    const {
        data,
        month
    } =
        getFinanceData();


    month.expenses =
        (
            Array.isArray(
                month.expenses
            )
                ? month.expenses
                : []
        ).filter(
            expense =>
                expense.id !== id
        );


    saveDailySnapshot(
        data,
        month
    );


    data.months[
        data.currentMonth
    ] = month;


    saveFinanceData(
        data
    );


    renderFinance(
        getFinanceContainer(),
        true
    );
}


/* =========================================================
   INIT
   ========================================================= */

function initFinance() {

    injectStyles();


    const container =
        getFinanceContainer();


    if (!container) {

        console.error(
            "LIFE GAME Finance: " +
            "finance container not found."
        );

        return;
    }


    try {

        getFinanceData();

        renderFinance(
            container
        );

        console.log(
            "LIFE GAME Finance initialized."
        );

    } catch (error) {

        console.error(
            "LIFE GAME Finance error:",
            error
        );

        container.innerHTML = `

            <div
                class="lg-finance"
            >

                <div
                    class="lg-finance-card"
                >

                    <div
                        class="
                            lg-finance-card-inner
                        "
                    >

                        <div
                            class="
                                lg-finance-card-label
                            "
                        >
                            FINANCE SYSTEM
                        </div>

                        <div
                            style="
                                margin-top:12px;
                                color:
                                rgba(255,255,255,.6);
                                font-size:11px;
                            "
                        >
                            Не удалось загрузить
                            финансовый модуль.
                        </div>

                    </div>

                </div>

            </div>

        `;

    }

}


/* =========================================================
   EXPORT
   ========================================================= */

export {
    initFinance
};