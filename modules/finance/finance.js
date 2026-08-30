/* =========================================================
   LIFE GAME 2.0
   FINANCE MODULE
   =========================================================
   
   Работает автономно внутри Finance.
   
   НЕ ТРЕБУЕТ ИЗМЕНЕНИЙ:
   - app.js
   - navigation.js
   - index.html
   - storage.js
   
   Функционал:
   - текущий месяц
   - фактический доход
   - цель дохода
   - процент выполнения
   - обязательные расходы
   - раскрывающийся список расходов
   - добавление / удаление расходов
   - финансовый резерв
   - процент резерва от дохода
   - сохранение данных
   - автоматическое создание нового месяца
   ========================================================= */

import {
    getSection,
    updateSection
} from "../../js/storage.js";


/* =========================================================
   CONFIG
   ========================================================= */

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
    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "long",
            year: "numeric"
        }
    ).format(new Date()).toUpperCase();
}


function money(value) {
    const number = Number(value) || 0;

    return new Intl.NumberFormat(
        "ru-RU",
        {
            maximumFractionDigits: 0
        }
    ).format(Math.max(0, number)) + " ₽";
}


function numberValue(value) {
    if (typeof value === "number") {
        return Math.max(0, value);
    }

    const normalized = String(value || "")
        .replace(/\s/g, "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "");

    const result = Number(normalized);

    return Number.isFinite(result)
        ? Math.max(0, result)
        : 0;
}


function percentage(value, base) {
    const v = numberValue(value);
    const b = numberValue(base);

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
        !Array.isArray(month.expenses)
    ) {
        return 0;
    }

    return month.expenses.reduce(
        (sum, expense) => {
            return sum + numberValue(
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

        /* =================================================
           FINANCE ROOT
           ================================================= */

        .lg-finance {
            --f-bg: #050505;
            --f-surface: rgba(255,255,255,.035);
            --f-surface-strong: rgba(255,255,255,.055);

            --f-border: rgba(255,255,255,.085);
            --f-border-strong: rgba(255,255,255,.15);

            --f-white: rgba(255,255,255,.96);
            --f-soft: rgba(255,255,255,.72);
            --f-muted: rgba(255,255,255,.42);
            --f-dim: rgba(255,255,255,.24);

            width: 100%;
            color: var(--f-white);

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


        /* =================================================
           HEADER
           ================================================= */

        .lg-finance-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;

            gap: 16px;

            padding:
                4px
                2px
                18px;
        }


        .lg-finance-eyebrow {
            margin-bottom: 7px;

            color: var(--f-muted);

            font-size: 8px;
            font-weight: 800;

            letter-spacing: .22em;
            text-transform: uppercase;
        }


        .lg-finance-title {
            margin: 0;

            font-size:
                clamp(34px, 9vw, 48px);

            line-height: .9;

            font-weight: 850;

            letter-spacing: -.065em;
        }


        .lg-finance-month {
            flex-shrink: 0;

            padding:
                8px
                11px;

            border:
                1px solid
                var(--f-border);

            border-radius: 999px;

            background:
                rgba(255,255,255,.025);

            color:
                var(--f-muted);

            font-size: 8px;
            font-weight: 750;

            letter-spacing: .1em;
        }


        /* =================================================
           CARDS
           ================================================= */

        .lg-finance-card {
            position: relative;

            overflow: hidden;

            margin-bottom: 12px;

            border:
                1px solid
                var(--f-border);

            border-radius: 22px;

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

            transition:
                border-color .2s ease,
                transform .2s ease;
        }


        .lg-finance-card::after {
            content: "";

            position: absolute;

            width: 180px;
            height: 180px;

            top: -120px;
            right: -90px;

            border-radius: 50%;

            background:
                rgba(255,255,255,.035);

            filter: blur(30px);

            pointer-events: none;
        }


        .lg-finance-card-inner {
            position: relative;

            z-index: 1;

            padding: 21px;
        }


        /* =================================================
           CARD HEADER
           ================================================= */

        .lg-finance-card-header {
            display: flex;

            align-items:
                flex-start;

            justify-content:
                space-between;

            gap: 20px;
        }


        .lg-finance-card-label {
            color:
                var(--f-muted);

            font-size: 8px;
            font-weight: 800;

            letter-spacing: .18em;

            text-transform:
                uppercase;
        }


        .lg-finance-card-subtitle {
            margin-top: 6px;

            color:
                var(--f-dim);

            font-size: 10px;

            line-height: 1.4;
        }


        .lg-finance-card-number {
            color:
                var(--f-dim);

            font-size: 8px;
            font-weight: 800;

            letter-spacing: .12em;
        }


        /* =================================================
           BIG NUMBER
           ================================================= */

        .lg-finance-big-number {
            margin-top: 25px;

            font-size:
                clamp(38px, 11vw, 58px);

            line-height: .9;

            font-weight: 850;

            letter-spacing:
                -.07em;
        }


        /* =================================================
           GOAL ROW
           ================================================= */

        .lg-finance-goal-row {
            display: flex;

            align-items:
                flex-end;

            justify-content:
                space-between;

            gap: 15px;

            margin-top: 25px;

            padding-top: 17px;

            border-top:
                1px solid
                var(--f-border);
        }


        .lg-finance-meta-label {
            color:
                var(--f-dim);

            font-size: 7px;
            font-weight: 800;

            letter-spacing: .13em;

            text-transform:
                uppercase;
        }


        .lg-finance-meta-value {
            margin-top: 5px;

            color:
                var(--f-soft);

            font-size: 15px;
            font-weight: 750;
        }


        /* =================================================
           BUTTONS
           ================================================= */

        .lg-finance-button {
            appearance: none;

            border:
                1px solid
                var(--f-border-strong);

            border-radius: 11px;

            background:
                rgba(255,255,255,.035);

            color:
                var(--f-soft);

            font-family: inherit;

            font-size: 8px;
            font-weight: 800;

            letter-spacing: .11em;

            cursor: pointer;

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
            transform:
                scale(.97);
        }


        .lg-finance-small-button {
            min-height: 35px;

            padding:
                0
                12px;
        }


        .lg-finance-main-button {
            width: 100%;

            min-height: 47px;

            margin-top: 20px;
        }


        /* =================================================
           PROGRESS
           ================================================= */

        .lg-finance-progress {
            margin-top: 20px;
        }


        .lg-finance-progress-track {
            width: 100%;
            height: 4px;

            overflow: hidden;

            border-radius: 999px;

            background:
                rgba(255,255,255,.065);
        }


        .lg-finance-progress-fill {
            height: 100%;

            border-radius: inherit;

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
            display: flex;

            justify-content:
                space-between;

            gap: 10px;

            margin-top: 8px;

            color:
                var(--f-dim);

            font-size: 7px;
            font-weight: 750;

            letter-spacing: .1em;
        }


        /* =================================================
           EXPENSE HEADER
           ================================================= */

        .lg-finance-expense-toggle {
            width: 100%;

            padding: 21px;

            display: flex;

            align-items:
                center;

            justify-content:
                space-between;

            gap: 20px;

            border: 0;

            background:
                transparent;

            color: inherit;

            font-family: inherit;

            text-align: left;

            cursor: pointer;
        }


        .lg-finance-expense-right {
            display: flex;

            flex-direction:
                column;

            align-items:
                flex-end;

            flex-shrink: 0;
        }


        .lg-finance-expense-total {
            font-size: 18px;

            line-height: 1;

            font-weight: 800;

            letter-spacing: -.04em;
        }


        .lg-finance-expense-percent {
            margin-top: 5px;

            color:
                var(--f-dim);

            font-size: 7px;
            font-weight: 750;

            letter-spacing: .08em;
        }


        .lg-finance-chevron {
            width: 25px;
            height: 25px;

            margin-top: 10px;

            display: grid;

            place-items: center;

            border:
                1px solid
                var(--f-border);

            border-radius: 50%;

            color:
                var(--f-muted);

            font-size: 16px;

            line-height: 1;

            transition:
                transform .25s ease,
                color .2s ease;
        }


        .lg-finance-expense-card.open
        .lg-finance-chevron {
            transform:
                rotate(45deg);

            color:
                var(--f-white);
        }


        /* =================================================
           EXPENSE DRAWER
           ================================================= */

        .lg-finance-expense-drawer {
            display: grid;

            grid-template-rows:
                0fr;

            transition:
                grid-template-rows
                .34s
                cubic-bezier(
                    .22,
                    1,
                    .36,
                    1
                );
        }


        .lg-finance-expense-card.open
        .lg-finance-expense-drawer {
            grid-template-rows:
                1fr;
        }


        .lg-finance-expense-drawer-inner {
            min-height: 0;

            overflow: hidden;

            padding:
                0
                21px;

            transition:
                padding .34s ease;
        }


        .lg-finance-expense-card.open
        .lg-finance-expense-drawer-inner {
            padding:
                0
                21px
                21px;
        }


        .lg-finance-expense-list {
            border-top:
                1px solid
                var(--f-border);
        }


        /* =================================================
           EXPENSE ROW
           ================================================= */

        .lg-finance-expense-row {
            min-height: 55px;

            display: flex;

            align-items:
                center;

            justify-content:
                space-between;

            gap: 15px;

            border-bottom:
                1px solid
                rgba(255,255,255,.055);
        }


        .lg-finance-expense-name {
            min-width: 0;

            overflow: hidden;

            color:
                var(--f-soft);

            font-size: 11px;

            font-weight: 600;

            text-overflow:
                ellipsis;

            white-space:
                nowrap;
        }


        .lg-finance-expense-actions {
            display: flex;

            align-items:
                center;

            gap: 10px;

            flex-shrink: 0;
        }


        .lg-finance-expense-amount {
            color:
                var(--f-white);

            font-size: 11px;

            font-weight: 750;
        }


        .lg-finance-delete {
            width: 25px;
            height: 25px;

            display: grid;

            place-items: center;

            border:
                1px solid
                transparent;

            border-radius: 8px;

            background:
                transparent;

            color:
                var(--f-dim);

            font-size: 16px;

            cursor: pointer;
        }


        .lg-finance-delete:hover {
            color:
                var(--f-white);

            background:
                rgba(255,255,255,.05);

            border-color:
                var(--f-border);
        }


        /* =================================================
           EMPTY EXPENSES
           ================================================= */

        .lg-finance-empty {
            padding:
                22px
                0;

            display: flex;

            align-items:
                center;

            gap: 12px;
        }


        .lg-finance-empty-icon {
            width: 35px;
            height: 35px;

            display: grid;

            place-items: center;

            flex-shrink: 0;

            border:
                1px solid
                var(--f-border);

            border-radius: 11px;

            color:
                var(--f-dim);
        }


        .lg-finance-empty-title {
            color:
                var(--f-soft);

            font-size: 9px;

            font-weight: 800;

            letter-spacing: .08em;

            text-transform:
                uppercase;
        }


        .lg-finance-empty-text {
            margin-top: 4px;

            color:
                var(--f-dim);

            font-size: 9px;
        }


        /* =================================================
           ADD EXPENSE
           ================================================= */

        .lg-finance-add-expense {
            width: 100%;

            height: 43px;

            margin-top: 12px;

            display: flex;

            align-items:
                center;

            justify-content:
                center;

            gap: 8px;

            border:
                1px dashed
                rgba(255,255,255,.13);

            border-radius: 11px;

            background:
                rgba(255,255,255,.018);

            color:
                var(--f-muted);

            font-family: inherit;

            font-size: 8px;

            font-weight: 800;

            letter-spacing: .13em;

            cursor: pointer;

            transition:
                color .16s ease,
                border-color .16s ease,
                background .16s ease;
        }


        .lg-finance-add-expense:hover {
            color:
                var(--f-white);

            border-color:
                rgba(255,255,255,.22);

            background:
                rgba(255,255,255,.045);
        }


        .lg-finance-add-expense-plus {
            font-size: 16px;
            font-weight: 300;
        }


        /* =================================================
           RESERVE
           ================================================= */

        .lg-finance-reserve-row {
            display: flex;

            align-items:
                flex-end;

            justify-content:
                space-between;

            gap: 15px;

            margin-top: 22px;

            padding-top: 17px;

            border-top:
                1px solid
                var(--f-border);
        }


        .lg-finance-reserve-percent {
            margin-top: 5px;

            font-size: 18px;

            font-weight: 800;

            letter-spacing: -.04em;
        }


        /* =================================================
           STABILITY
           ================================================= */

        .lg-finance-stability {
            min-height: 175px;
        }


        .lg-finance-stability-content {
            display: flex;

            align-items:
                center;

            gap: 17px;

            margin-top: 26px;
        }


        .lg-finance-stability-score {
            width: 70px;
            height: 70px;

            display: grid;

            place-items: center;

            flex-shrink: 0;

            border:
                1px solid
                var(--f-border-strong);

            border-radius: 20px;

            background:
                rgba(255,255,255,.025);

            color:
                var(--f-dim);

            font-size: 30px;

            font-weight: 800;
        }


        .lg-finance-stability-status {
            color:
                var(--f-soft);

            font-size: 9px;

            font-weight: 800;

            letter-spacing: .13em;
        }


        .lg-finance-stability-text {
            max-width: 360px;

            margin-top: 7px;

            color:
                var(--f-dim);

            font-size: 10px;

            line-height: 1.5;
        }


        /* =================================================
           MODAL
           ================================================= */

        .lg-finance-modal {
            position: fixed;

            inset: 0;

            z-index: 99999;

            display: flex;

            align-items:
                flex-end;

            justify-content:
                center;

            padding: 15px;

            background:
                rgba(0,0,0,.7);

            backdrop-filter:
                blur(12px);

            -webkit-backdrop-filter:
                blur(12px);

            opacity: 0;

            pointer-events:
                none;

            transition:
                opacity .2s ease;
        }


        .lg-finance-modal.active {
            opacity: 1;

            pointer-events:
                auto;
        }


        .lg-finance-modal-panel {
            width: 100%;

            max-width: 520px;

            padding: 22px;

            border:
                1px solid
                var(--f-border-strong);

            border-radius:
                24px;

            background:
                #0b0b0b;

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

            font-size: 8px;

            font-weight: 800;

            letter-spacing: .18em;

            text-transform:
                uppercase;
        }


        .lg-finance-modal-title {
            margin-top: 7px;

            font-size: 23px;

            font-weight: 800;

            letter-spacing: -.04em;
        }


        .lg-finance-input {
            width: 100%;

            height: 55px;

            margin-top: 20px;

            padding:
                0
                16px;

            border:
                1px solid
                var(--f-border-strong);

            border-radius: 13px;

            outline: none;

            background:
                rgba(255,255,255,.045);

            color:
                var(--f-white);

            font-family: inherit;

            font-size: 19px;

            font-weight: 700;

            -webkit-appearance: none;

            transition:
                border-color .16s ease,
                background .16s ease;
        }


        .lg-finance-input:focus {
            border-color:
                rgba(255,255,255,.3);

            background:
                rgba(255,255,255,.065);
        }


        .lg-finance-modal-buttons {
            display: grid;

            grid-template-columns:
                1fr 1fr;

            gap: 9px;

            margin-top: 12px;
        }


        .lg-finance-modal-button {
            height: 46px;

            border:
                1px solid
                var(--f-border);

            border-radius: 12px;

            background:
                rgba(255,255,255,.035);

            color:
                var(--f-soft);

            font-family: inherit;

            font-size: 8px;

            font-weight: 800;

            letter-spacing: .1em;

            cursor: pointer;
        }


        .lg-finance-modal-save {
            background:
                rgba(255,255,255,.09);

            border-color:
                rgba(255,255,255,.18);

            color:
                var(--f-white);
        }


        /* =================================================
           MOBILE
           ================================================= */

        @media (max-width: 500px) {

            .lg-finance-header {
                padding-left: 1px;
                padding-right: 1px;
            }


            .lg-finance-card-inner {
                padding: 19px;
            }


            .lg-finance-expense-toggle {
                padding: 19px;
            }


            .lg-finance-expense-drawer-inner {
                padding-left: 19px;
                padding-right: 19px;
            }


            .lg-finance-expense-card.open
            .lg-finance-expense-drawer-inner {
                padding-left: 19px;
                padding-right: 19px;
                padding-bottom: 19px;
            }


            .lg-finance-big-number {
                font-size:
                    clamp(
                        36px,
                        11vw,
                        50px
                    );
            }

        }


        /* =================================================
           REDUCED MOTION
           ================================================= */

        @media (
            prefers-reduced-motion: reduce
        ) {

            .lg-finance *,
            .lg-finance *::before,
            .lg-finance *::after {
                transition: none !important;
                animation: none !important;
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
            role="dialog"
            aria-modal="true"
        >

            <div class="lg-finance-modal-label">
                ${escapeHTML(label)}
            </div>

            <div class="lg-finance-modal-title">
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
                autocomplete="off"
            >

            <div class="lg-finance-modal-buttons">

                <button
                    type="button"
                    class="lg-finance-modal-button"
                    data-modal-cancel
                >
                    CANCEL
                </button>

                <button
                    type="button"
                    class="lg-finance-modal-button lg-finance-modal-save"
                    data-modal-save
                >
                    SAVE
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(modal);

    activeModal = modal;


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
            role="dialog"
            aria-modal="true"
        >

            <div class="lg-finance-modal-label">
                REQUIRED EXPENSE
            </div>

            <div class="lg-finance-modal-title">
                Add expense
            </div>

            <input
                class="lg-finance-input"
                data-expense-name
                type="text"
                maxlength="80"
                placeholder="Название траты"
                autocomplete="off"
            >

            <input
                class="lg-finance-input"
                data-expense-amount
                type="number"
                inputmode="decimal"
                min="0"
                step="1"
                placeholder="Сумма ₽"
                autocomplete="off"
            >

            <div class="lg-finance-modal-buttons">

                <button
                    type="button"
                    class="lg-finance-modal-button"
                    data-modal-cancel
                >
                    CANCEL
                </button>

                <button
                    type="button"
                    class="lg-finance-modal-button lg-finance-modal-save"
                    data-modal-save
                >
                    ADD
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(modal);

    activeModal = modal;


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

                    id: createId(),

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


    nameInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                amountInput.focus();

            }

        }
    );


    document.addEventListener(
        "keydown",
        handleEscape,
        {
            once: true
        }
    );
}


function handleEscape(event) {

    if (
        event.key === "Escape"
    ) {
        closeModal();
    }
}


/* =========================================================
   RENDER EXPENSES
   ========================================================= */

function renderExpenses(expenses) {

    if (
        !Array.isArray(expenses) ||
        expenses.length === 0
    ) {

        return `

            <div class="lg-finance-empty">

                <div class="lg-finance-empty-icon">
                    —
                </div>

                <div>

                    <div class="lg-finance-empty-title">
                        No expenses
                    </div>

                    <div class="lg-finance-empty-text">
                        Добавьте обязательную трату
                    </div>

                </div>

            </div>

        `;
    }


    return expenses
        .map(expense => {

            return `

                <div
                    class="lg-finance-expense-row"
                    data-expense-id="${escapeHTML(
                        expense.id
                    )}"
                >

                    <div class="lg-finance-expense-name">
                        ${escapeHTML(
                            expense.name
                        )}
                    </div>

                    <div class="lg-finance-expense-actions">

                        <div class="lg-finance-expense-amount">
                            ${money(
                                expense.amount
                            )}
                        </div>

                        <button
                            type="button"
                            class="lg-finance-delete"
                            data-delete-expense
                            data-id="${escapeHTML(
                                expense.id
                            )}"
                            aria-label="Delete expense"
                        >
                            ×
                        </button>

                    </div>

                </div>

            `;

        })
        .join("");
}


/* =========================================================
   RENDER
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

    const expensePercent =
        expensePercentForMonth(
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


    container.innerHTML = `

        <div class="lg-finance">


            <!-- =========================================
                 HEADER
                 ========================================= -->

            <header class="lg-finance-header">

                <div>

                    <div class="lg-finance-eyebrow">
                        FINANCIAL SYSTEM
                    </div>

                    <h1 class="lg-finance-title">
                        Finance
                    </h1>

                </div>

                <div class="lg-finance-month">
                    ${currentMonthLabel()}
                </div>

            </header>


            <!-- =========================================
                 INCOME
                 ========================================= -->

            <section class="lg-finance-card">

                <div class="lg-finance-card-inner">

                    <div class="lg-finance-card-header">

                        <div>

                            <div class="lg-finance-card-label">
                                MONTHLY INCOME
                            </div>

                            <div class="lg-finance-card-subtitle">
                                Фактически заработано
                            </div>

                        </div>

                        <div class="lg-finance-card-number">
                            01
                        </div>

                    </div>


                    <div class="lg-finance-big-number">
                        ${money(income)}
                    </div>


                    <div class="lg-finance-goal-row">

                        <div>

                            <div class="lg-finance-meta-label">
                                MONTHLY GOAL
                            </div>

                            <div class="lg-finance-meta-value">
                                ${
                                    goal > 0
                                        ? money(goal)
                                        : "Не задана"
                                }
                            </div>

                        </div>


                        <button
                            type="button"
                            class="lg-finance-button lg-finance-small-button"
                            data-action="edit-goal"
                        >
                            ${
                                goal > 0
                                    ? "EDIT GOAL"
                                    : "SET GOAL"
                            }
                        </button>

                    </div>


                    <div class="lg-finance-progress">

                        <div class="lg-finance-progress-track">

                            <div
                                class="lg-finance-progress-fill"
                                style="width:${visualGoal}%"
                            ></div>

                        </div>


                        <div class="lg-finance-progress-bottom">

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


                    <button
                        type="button"
                        class="lg-finance-button lg-finance-main-button"
                        data-action="edit-income"
                    >
                        UPDATE INCOME
                    </button>

                </div>

            </section>


            <!-- =========================================
                 EXPENSES
                 ========================================= -->

            <section
                class="
                    lg-finance-card
                    lg-finance-expense-card
                    ${reopenExpenses ? "open" : ""}
                "
                data-expenses-card
            >

                <button
                    type="button"
                    class="lg-finance-expense-toggle"
                    data-action="toggle-expenses"
                    aria-expanded="${reopenExpenses}"
                >

                    <div>

                        <div class="lg-finance-card-label">
                            REQUIRED EXPENSES
                        </div>

                        <div class="lg-finance-card-subtitle">
                            Обязательные траты за месяц
                        </div>

                    </div>


                    <div class="lg-finance-expense-right">

                        <div class="lg-finance-expense-total">
                            ${money(totalExpenses)}
                        </div>

                        <div class="lg-finance-expense-percent">
                            ${expensePercent}% OF INCOME
                        </div>

                        <div class="lg-finance-chevron">
                            +
                        </div>

                    </div>

                </button>


                <div class="lg-finance-expense-drawer">

                    <div class="lg-finance-expense-drawer-inner">

                        <div class="lg-finance-expense-list">

                            ${renderExpenses(
                                month.expenses
                            )}

                        </div>


                        <button
                            type="button"
                            class="lg-finance-add-expense"
                            data-action="add-expense"
                        >

                            <span class="lg-finance-add-expense-plus">
                                +
                            </span>

                            ADD EXPENSE

                        </button>

                    </div>

                </div>

            </section>


            <!-- =========================================
                 RESERVE
                 ========================================= -->

            <section class="lg-finance-card">

                <div class="lg-finance-card-inner">

                    <div class="lg-finance-card-header">

                        <div>

                            <div class="lg-finance-card-label">
                                FINANCIAL RESERVE
                            </div>

                            <div class="lg-finance-card-subtitle">
                                Отложено в этом месяце
                            </div>

                        </div>

                        <div class="lg-finance-card-number">
                            03
                        </div>

                    </div>


                    <div class="lg-finance-big-number">
                        ${money(reserve)}
                    </div>


                    <div class="lg-finance-reserve-row">

                        <div>

                            <div class="lg-finance-meta-label">
                                FROM ACTUAL INCOME
                            </div>

                            <div class="lg-finance-reserve-percent">
                                ${reservePercentage}%
                            </div>

                        </div>


                        <button
                            type="button"
                            class="lg-finance-button lg-finance-small-button"
                            data-action="edit-reserve"
                        >
                            ${
                                reserve > 0
                                    ? "EDIT RESERVE"
                                    : "SET RESERVE"
                            }
                        </button>

                    </div>


                    <div class="lg-finance-progress">

                        <div class="lg-finance-progress-track">

                            <div
                                class="lg-finance-progress-fill"
                                style="width:${visualReserve}%"
                            ></div>

                        </div>


                        <div class="lg-finance-progress-bottom">

                            <span>
                                ${reservePercentage}% OF INCOME
                            </span>

                        </div>

                    </div>

                </div>

            </section>


            <!-- =========================================
                 STABILITY
                 ========================================= -->

            <section class="lg-finance-card lg-finance-stability">

                <div class="lg-finance-card-inner">

                    <div class="lg-finance-card-header">

                        <div>

                            <div class="lg-finance-card-label">
                                FINANCIAL STABILITY
                            </div>

                            <div class="lg-finance-card-subtitle">
                                Система оценки финансовой устойчивости
                            </div>

                        </div>

                        <div class="lg-finance-card-number">
                            04
                        </div>

                    </div>


                    <div class="lg-finance-stability-content">

                        <div class="lg-finance-stability-score">
                            —
                        </div>


                        <div>

                            <div class="lg-finance-stability-status">
                                ANALYSIS PENDING
                            </div>

                            <div class="lg-finance-stability-text">
                                Алгоритм финансовой стабильности
                                будет добавлен на следующем этапе.
                            </div>

                        </div>

                    </div>

                </div>

            </section>


        </div>

    `;


    bindEvents(
        container
    );


    /*
       Сохраняем нормализованную структуру,
       если месяц только что был создан.
    */

    saveFinanceData(
        data
    );
}


/* =========================================================
   EXPENSE PERCENT
   ========================================================= */

function expensePercentForMonth(month) {

    return percentage(
        expensesTotal(month),
        month.income
    );
}


/* =========================================================
   CONTAINER
   ========================================================= */

function getFinanceContainer() {

    /*
       Основной вариант.
    */

    const direct =
        document.getElementById(
            "finance-container"
        );

    if (direct) {
        return direct;
    }


    /*
       Возможные варианты существующей
       структуры проекта.
    */

    return (
        document.querySelector(
            "[data-section='finance']"
        ) ||
        document.querySelector(
            ".finance-container"
        ) ||
        document.querySelector(
            "#finance"
        )
    );
}


/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents(container) {

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
                    type === "edit-income"
                ) {
                    editIncome();
                    return;
                }


                if (
                    type === "edit-goal"
                ) {
                    editGoal();
                    return;
                }


                if (
                    type === "edit-reserve"
                ) {
                    editReserve();
                    return;
                }


                if (
                    type === "toggle-expenses"
                ) {

                    toggleExpenses(
                        action
                    );

                    return;
                }


                if (
                    type === "add-expense"
                ) {

                    openExpenseModal();

                    return;
                }

            }


            const deleteButton =
                event.target.closest(
                    "[data-delete-expense]"
                );


            if (deleteButton) {

                deleteExpense(
                    deleteButton.dataset.id
                );

            }

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
   EXPENSE ACCORDION
   ========================================================= */

function toggleExpenses(
    button
) {

    const card =
        button.closest(
            "[data-expenses-card]"
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


    const expenses =
        Array.isArray(
            month.expenses
        )
            ? month.expenses
            : [];


    month.expenses =
        expenses.filter(
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

        /*
           Создаём текущий месяц,
           если его ещё нет.
        */

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

            <div class="lg-finance">

                <section class="lg-finance-card">

                    <div class="lg-finance-card-inner">

                        <div class="lg-finance-card-label">
                            FINANCE SYSTEM
                        </div>

                        <div
                            style="
                                margin-top:12px;
                                color:rgba(255,255,255,.6);
                                font-size:11px;
                            "
                        >
                            Не удалось загрузить
                            финансовый модуль.
                        </div>

                    </div>

                </section>

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