/* =========================================================
   
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


/*
 * Полная дата для шапки:
 *
 * AUGUST 31 2026
 *
 * Всё одной строкой и одним шрифтом.
 */

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
        reserve: 0
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

    /*
     * Каждый новый календарный месяц
     * получает отдельную финансовую запись.
     */

    if (
        !stored.months[monthKey]
    ) {

        stored.months[monthKey] =
            defaultMonth();

    }

    stored.currentMonth =
        monthKey;

    stored.version =
        FINANCE_VERSION;

    return {
        data: stored,
        month: stored.months[monthKey]
    };
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


/*
 * Выполнение цели:
 *
 * Фактический доход / цель × 100
 */

function goalProgress(month) {

    return percentage(
        month.income,
        month.incomeGoal
    );
}


/*
 * Обязательные расходы:
 *
 * расходы / фактический доход × 100
 */

function expensePercent(month) {

    return percentage(
        expensesTotal(month),
        month.income
    );
}


/*
 * Финансовый резерв:
 *
 * резерв / фактический доход × 100
 */

function reservePercent(month) {

    return percentage(
        month.reserve,
        month.income
    );
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


        /*
         * Единственный Finance.
         */

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


        /*
         * AUGUST 31 2026
         */

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
           PERCENTAGE
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


        /*
         * iOS-style DELETE area.
         */

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

                data.months[
                    data.currentMonth
                ] = month;

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
       MAIN HTML
       =============================================== */

    container.innerHTML = `

        <div
            class="lg-finance"
        >

            <!-- =====================================
                 HEADER
                 ===================================== -->

            <header
                class="lg-finance-header"
            >

                <!-- ЕДИНСТВЕННЫЙ Finance -->

                <h1
                    class="lg-finance-title"
                >
                    Finance
                </h1>


                <!-- ЕДИНСТВЕННАЯ ДАТА -->

                <div
                    class="lg-finance-date"
                >
                    ${currentFinanceDate()}
                </div>

            </header>


            <!-- =====================================
                 MONTHLY INCOME
                 ===================================== -->

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


            <!-- =====================================
                 MONTHLY GOAL
                 ===================================== -->

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


            <!-- =====================================
                 REQUIRED EXPENSES
                 ===================================== -->

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


            <!-- =====================================
                 FINANCIAL RESERVE
                 ===================================== -->

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


            <!-- =====================================
                 FINANCIAL STABILITY
                 ===================================== -->

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


            <!-- =====================================
                 LIFE MODULE 1
                 ===================================== -->

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

                data.months[
                    data.currentMonth
                ] = month;

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

                data.months[
                    data.currentMonth
                ] = month;

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

                data.months[
                    data.currentMonth
                ] = month;

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