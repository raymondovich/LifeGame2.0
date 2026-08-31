/* =========================================================
   LIFE GAME — FINANCE MODULE
   Finance v1
   Current architecture:
   01. Liquid Funds
   02. Required Expenses
   03. Income
   04. Financial Obligations
   05. Income Statistics
   06. Financial Stability
   Current development stage:
   LIQUID FUNDS
   IMPORTANT:
   - app.js is not touched
   - navigation.js is not touched
   - storage.js is used as existing universal storage
   - Core Finance structure remains controlled by LIFE GAME
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
    return `${month} ${now.getDate()} ${now.getFullYear()}`;
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
   DATE HELPERS
   ========================================================= */
function dateKey(date) {
    const d =
        new Date(date);
    return `${d.getFullYear()}-${String(
        d.getMonth() + 1
    ).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
}
function previousPeriodDate(
    period
) {
    const now =
        new Date();
    const result =
        new Date(now);
    if (period === "week") {
        result.setDate(
            result.getDate() - 7
        );
    }
    else if (period === "month") {
        result.setMonth(
            result.getMonth() - 1
        );
    }
    else if (period === "year") {
        result.setFullYear(
            result.getFullYear() - 1
        );
    }
    return result;
}
/* =========================================================
   DEFAULT DATA
   ========================================================= */
function defaultMonth() {
    return {
        income: 0,
        incomeGoal: 0,
        expenses: [],
        reserve: 0
    };
}
function defaultLiquidFunds() {
    return {
        assets: [
            {
                id: "cash",
                name: "Наличные",
                amount: 0,
                system: true
            },
            {
                id: "cards",
                name: "Деньги на картах",
                amount: 0,
                system: true
            },
            {
                id: "bank",
                name: "Банковские счета",
                amount: 0,
                system: true
            }
        ],
        snapshots: [],
        selectedPeriod: "month"
    };
}
/* =========================================================
   FINANCE DATA
   ========================================================= */
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
    /*
     * LIQUID FUNDS MIGRATION
     *
     * Старые данные не ломаем.
     */
    if (
        !stored.liquidFunds ||
        typeof stored.liquidFunds !== "object"
    ) {
        stored.liquidFunds =
            defaultLiquidFunds();
    }
    if (
        !Array.isArray(
            stored.liquidFunds.assets
        )
    ) {
        stored.liquidFunds.assets = [];
    }
    if (
        !Array.isArray(
            stored.liquidFunds.snapshots
        )
    ) {
        stored.liquidFunds.snapshots = [];
    }
    /*
     * Гарантируем наличие системных активов.
     */
    const systemAssets = [
        {
            id: "cash",
            name: "Наличные",
            system: true
        },
        {
            id: "cards",
            name: "Деньги на картах",
            system: true
        },
        {
            id: "bank",
            name: "Банковские счета",
            system: true
        }
    ];
    systemAssets.forEach(
        systemAsset => {
            const exists =
                stored.liquidFunds.assets
                    .some(
                        asset =>
                            asset.id ===
                            systemAsset.id
                    );
            if (!exists) {
                stored.liquidFunds.assets
                    .unshift({
                        ...systemAsset,
                        amount: 0
                    });
            }
        }
    );
    stored.currentMonth =
        monthKey;
    stored.version =
        FINANCE_VERSION;
    return {
        data: stored,
        month:
            stored.months[monthKey],
        liquidFunds:
            stored.liquidFunds
    };
}
function saveFinanceData(
    data
) {
    updateSection(
        "finance",
        {
            data
        }
    );
}
/* =========================================================
   LIQUID FUNDS CALCULATIONS
   ========================================================= */
function liquidFundsTotal(
    liquidFunds
) {
    if (
        !liquidFunds ||
        !Array.isArray(
            liquidFunds.assets
        )
    ) {
        return 0;
    }
    return liquidFunds.assets.reduce(
        (
            total,
            asset
        ) => {
            return total +
                numberValue(
                    asset.amount
                );
        },
        0
    );
}
function getSnapshotForDate(
    liquidFunds,
    targetDate
) {
    if (
        !liquidFunds ||
        !Array.isArray(
            liquidFunds.snapshots
        )
    ) {
        return null;
    }
    const target =
        new Date(targetDate);
    const targetTime =
        target.getTime();
    let best =
        null;
    liquidFunds.snapshots
        .forEach(
            snapshot => {
                const snapshotDate =
                    new Date(
                        snapshot.date
                    );
                const snapshotTime =
                    snapshotDate.getTime();
                if (
                    snapshotTime <=
                    targetTime
                ) {
                    if (
                        !best ||
                        snapshotTime >
                        new Date(
                            best.date
                        ).getTime()
                    ) {
                        best =
                            snapshot;
                    }
                }
            }
        );
    return best;
}
function getPreviousSnapshot(
    liquidFunds,
    period
) {
    const target =
        previousPeriodDate(
            period
        );
    return getSnapshotForDate(
        liquidFunds,
        target
    );
}
function calculateLiquidDynamics(
    liquidFunds,
    period
) {
    const currentTotal =
        liquidFundsTotal(
            liquidFunds
        );
    const previousSnapshot =
        getPreviousSnapshot(
            liquidFunds,
            period
        );
    if (!previousSnapshot) {
        return {
            current:
                currentTotal,
            previous:
                null,
            change:
                null,
            direction:
                "none"
        };
    }
    const previous =
        numberValue(
            previousSnapshot.total
        );
    if (previous === 0) {
        return {
            current:
                currentTotal,
            previous,
            change:
                currentTotal > 0
                    ? 100
                    : 0,
            direction:
                currentTotal > 0
                    ? "up"
                    : "stable"
        };
    }
    const change =
        Math.round(
            (
                (
                    currentTotal -
                    previous
                )
                /
                previous
            )
            *
            100
        );
    return {
        current:
            currentTotal,
        previous,
        change,
        direction:
            change > 0
                ? "up"
                : change < 0
                    ? "down"
                    : "stable"
    };
}
/*
 * Создаём / обновляем текущий снимок.
 *
 * Это происходит при сохранении финансовых данных.
 */
function saveLiquidSnapshot(
    data
) {
    const liquidFunds =
        data.liquidFunds;
    if (!liquidFunds) {
        return;
    }
    if (
        !Array.isArray(
            liquidFunds.snapshots
        )
    ) {
        liquidFunds.snapshots = [];
    }
    const today =
        dateKey(
            new Date()
        );
    const total =
        liquidFundsTotal(
            liquidFunds
        );
    const existing =
        liquidFunds.snapshots
            .find(
                snapshot =>
                    snapshot.date ===
                    today
            );
    if (existing) {
        existing.total =
            total;
    }
    else {
        liquidFunds.snapshots.push({
            id:
                createId(),
            date:
                today,
            total
        });
    }
    /*
     * Храним разумное количество
     * исторических точек.
     */
    liquidFunds.snapshots =
        liquidFunds.snapshots
            .sort(
                (
                    a,
                    b
                ) =>
                    new Date(a.date) -
                    new Date(b.date)
            )
            .slice(-1000);
}
/* =========================================================
   EXPENSE CALCULATIONS
   ========================================================= */
function expensesTotal(
    month
) {
    if (
        !Array.isArray(
            month.expenses
        )
    ) {
        return 0;
    }
    return month.expenses.reduce(
        (
            sum,
            expense
        ) => {
            return sum +
                numberValue(
                    expense.amount
                );
        },
        0
    );
}
function goalProgress(
    month
) {
    return percentage(
        month.income,
        month.incomeGoal
    );
}
function expensePercent(
    month
) {
    return percentage(
        expensesTotal(month),
        month.income
    );
}
function reservePercent(
    month
) {
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
        document.createElement(
            "style"
        );
    style.id =
        "life-finance-runtime-styles";
    style.textContent = `
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
        /* ACCORDION */
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
            transform:
                rotate(45deg);
            color:
                var(--f-white);
            border-color:
                rgba(255,255,255,.2);
        }
        .lg-finance-accordion-content {
            display:grid;
            grid-template-rows:
                0fr;
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
            grid-template-rows:
                1fr;
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
        /* BUTTONS */
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
            transform:
                scale(.97);
        }
        .lg-finance-main-button {
            width:100%;
            margin-top:20px;
        }
        /* LIQUID FUNDS */
        .lg-finance-liquid-total {
            margin-top:24px;
            font-size:
                clamp(
                    36px,
                    10vw,
                    54px
                );
            line-height:.92;
            font-weight:850;
            letter-spacing:-.07em;
        }
        .lg-finance-liquid-total-caption {
            margin-top:9px;
            color:
                var(--f-muted);
            font-size:8px;
            font-weight:800;
            letter-spacing:.12em;
            text-transform:uppercase;
        }
        .lg-finance-asset-list {
            border-top:
                1px solid
                var(--f-border);
        }
        .lg-finance-asset-swipe {
            position:relative;
            overflow:hidden;
            border-bottom:
                1px solid
                rgba(255,255,255,.055);
            touch-action:pan-y;
            user-select:none;
            -webkit-user-select:none;
        }
        .lg-finance-asset-delete {
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
        .lg-finance-asset-row {
            position:relative;
            z-index:2;
            min-height:62px;
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:15px;
            padding:0 2px;
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
        }
        .lg-finance-asset-row.swiped {
            transform:
                translateX(-88px);
        }
        .lg-finance-asset-info {
            min-width:0;
        }
        .lg-finance-asset-name {
            color:
                var(--f-soft);
            font-size:11px;
            font-weight:650;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
        }
        .lg-finance-asset-type {
            margin-top:4px;
            color:
                var(--f-dim);
            font-size:7px;
            font-weight:800;
            letter-spacing:.1em;
            text-transform:uppercase;
        }
        .lg-finance-asset-amount {
            color:
                var(--f-white);
            font-size:12px;
            font-weight:800;
            flex-shrink:0;
        }
        .lg-finance-add-asset {
            width:100%;
            height:44px;
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
        .lg-finance-add-asset-plus {
            font-size:16px;
            font-weight:300;
        }
        /* DYNAMICS */
        .lg-finance-period-switch {
            display:grid;
            grid-template-columns:
                repeat(3, 1fr);
            gap:5px;
            margin-bottom:18px;
            padding:4px;
            border:
                1px solid
                rgba(255,255,255,.07);
            border-radius:12px;
            background:
                rgba(255,255,255,.018);
        }
        .lg-finance-period-button {
            height:32px;
            border:0;
            border-radius:9px;
            background:transparent;
            color:
                var(--f-dim);
            font-family:inherit;
            font-size:7px;
            font-weight:850;
            letter-spacing:.1em;
            cursor:pointer;
            transition:
                background .18s ease,
                color .18s ease;
        }
        .lg-finance-period-button.active {
            background:
                rgba(255,255,255,.09);
            color:
                var(--f-white);
        }
        .lg-finance-dynamics {
            padding:
                18px
                0
                4px;
        }
        .lg-finance-dynamics-value {
            font-size:34px;
            font-weight:850;
            letter-spacing:-.06em;
        }
        .lg-finance-dynamics-value.up {
            color:
                var(--f-white);
        }
        .lg-finance-dynamics-value.down {
            color:
                rgba(255,255,255,.58);
        }
        .lg-finance-dynamics-value.stable {
            color:
                var(--f-soft);
        }
        .lg-finance-dynamics-label {
            margin-top:7px;
            color:
                var(--f-dim);
            font-size:7px;
            font-weight:800;
            letter-spacing:.12em;
            text-transform:uppercase;
        }
        .lg-finance-dynamics-comparison {
            display:flex;
            justify-content:space-between;
            align-items:flex-end;
            gap:15px;
            margin-top:22px;
            padding-top:15px;
            border-top:
                1px solid
                rgba(255,255,255,.055);
        }
        .lg-finance-dynamics-number {
            color:
                var(--f-soft);
            font-size:15px;
            font-weight:750;
        }
        .lg-finance-dynamics-caption {
            margin-top:5px;
            color:
                var(--f-dim);
            font-size:7px;
            font-weight:800;
            letter-spacing:.1em;
            text-transform:uppercase;
        }
        .lg-finance-dynamics-empty {
            padding:
                18px
                0
                4px;
            color:
                var(--f-dim);
            font-size:9px;
            line-height:1.5;
        }
        /* STABILITY */
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
        /* MODAL */
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
    document.head.appendChild(
        style
    );
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
        document.createElement(
            "div"
        );
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
    requestAnimationFrame(
        () => {
            input.focus();
            try {
                input.select();
            } catch (_) {}
        }
    );
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
                onSave(
                    value
                );
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
        document.createElement(
            "div"
        );
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
    requestAnimationFrame(
        () => {
            nameInput.focus();
        }
    );
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
   LIQUID ASSET MODAL
   ========================================================= */
function openAssetModal(
    asset = null
) {
    closeModal();
    const editing =
        Boolean(asset);
    const modal =
        document.createElement(
            "div"
        );
    modal.className =
        "lg-finance-modal active";
    modal.innerHTML = `
        <div
            class="lg-finance-modal-panel"
        >
            <div
                class="lg-finance-modal-label"
            >
                LIQUID FUNDS
            </div>
            <div
                class="lg-finance-modal-title"
            >
                ${
                    editing
                        ? "Edit asset"
                        : "Add asset"
                }
            </div>
            ${
                editing
                    ? `
                        <input
                            class="lg-finance-input"
                            data-asset-name
                            type="text"
                            maxlength="60"
                            value="${escapeHTML(
                                asset.name
                            )}"
                            placeholder="Название актива"
                        >
                    `
                    : `
                        <input
                            class="lg-finance-input"
                            data-asset-name
                            type="text"
                            maxlength="60"
                            placeholder="Название актива"
                        >
                    `
            }
            <input
                class="lg-finance-input"
                data-asset-amount
                type="number"
                inputmode="decimal"
                min="0"
                step="1"
                value="${
                    editing
                        ? escapeHTML(
                            asset.amount
                        )
                        : ""
                }"
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
    const nameInput =
        modal.querySelector(
            "[data-asset-name]"
        );
    const amountInput =
        modal.querySelector(
            "[data-asset-amount]"
        );
    requestAnimationFrame(
        () => {
            nameInput.focus();
        }
    );
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
                const {
                    data
                } =
                    getFinanceData();
                if (
                    !editing
                ) {
                    data.liquidFunds.assets
                        .push({
                            id:
                                createId(),
                            name,
                            amount,
                            system:
                                false
                        });
                }
                else {
                    const target =
                        data.liquidFunds.assets
                            .find(
                                item =>
                                    item.id ===
                                    asset.id
                            );
                    if (target) {
                        /*
                         * Даже пользовательские
                         * активы нельзя случайно
                         * превратить в системные.
                         */
                        if (
                            target.system
                        ) {
                            target.amount =
                                amount;
                        }
                        else {
                            target.name =
                                name;
                            target.amount =
                                amount;
                        }
                    }
                }
                saveLiquidSnapshot(
                    data
                );
                saveFinanceData(
                    data
                );
                closeModal();
                renderFinance(
                    getFinanceContainer()
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
   LIQUID ASSET LIST
   ========================================================= */
function renderLiquidAssets(
    liquidFunds
) {
    const assets =
        Array.isArray(
            liquidFunds.assets
        )
            ? liquidFunds.assets
            : [];
    if (
        assets.length === 0
    ) {
        return `
            <div
                class="lg-finance-empty"
            >
                Активов пока нет.
            </div>
        `;
    }
    return assets
        .map(
            asset => {
                const system =
                    Boolean(
                        asset.system
                    );
                return `
                    <div
                        class="
                            lg-finance-asset-swipe
                        "
                        data-asset-id="${escapeHTML(
                            asset.id
                        )}"
                        data-system="${system}"
                    >
                        ${
                            system
                                ? ""
                                : `
                                    <div
                                        class="
                                            lg-finance-asset-delete
                                        "
                                        data-delete-asset
                                        data-id="${escapeHTML(
                                            asset.id
                                        )}"
                                    >
                                        DELETE
                                    </div>
                                `
                        }
                        <div
                            class="
                                lg-finance-asset-row
                            "
                            data-asset-swipe-row
                        >
                            <div
                                class="
                                    lg-finance-asset-info
                                "
                            >
                                <div
                                    class="
                                        lg-finance-asset-name
                                    "
                                >
                                    ${escapeHTML(
                                        asset.name
                                    )}
                                </div>
                                <div
                                    class="
                                        lg-finance-asset-type
                                    "
                                >
                                    ${
                                        system
                                            ? "CORE ASSET"
                                            : "CUSTOM ASSET"
                                    }
                                </div>
                            </div>
                            <div
                                class="
                                    lg-finance-asset-amount
                                "
                            >
                                ${money(
                                    asset.amount
                                )}
                            </div>
                        </div>
                    </div>
                `;
            }
        )
        .join("");
}
/* =========================================================
   DYNAMICS RENDER
   ========================================================= */
function renderLiquidDynamics(
    liquidFunds
) {
    const period =
        liquidFunds.selectedPeriod ||
        "month";
    const dynamics =
        calculateLiquidDynamics(
            liquidFunds,
            period
        );
    const periodLabel =
        period === "week"
            ? "WEEK"
            : period === "year"
                ? "YEAR"
                : "MONTH";
    const current =
        money(
            dynamics.current
        );
    if (
        dynamics.change === null
    ) {
        return `
            <div
                class="
                    lg-finance-period-switch
                "
            >
                ${renderPeriodButton(
                    "week",
                    period
                )}
                ${renderPeriodButton(
                    "month",
                    period
                )}
                ${renderPeriodButton(
                    "year",
                    period
                )}
            </div>
            <div
                class="
                    lg-finance-dynamics
                "
            >
                <div
                    class="
                        lg-finance-dynamics-empty
                    "
                >
                    Недостаточно исторических
                    данных для сравнения.
                    <br><br>
                    Текущий объём:
                    <strong>
                        ${current}
                    </strong>
                </div>
            </div>
        `;
    }
    const change =
        dynamics.change;
    const sign =
        change > 0
            ? "+"
            : "";
    const directionClass =
        dynamics.direction;
    const directionText =
        dynamics.direction === "up"
            ? "GROWTH"
            : dynamics.direction === "down"
                ? "DECLINE"
                : "STABLE";
    return `
        <div
            class="
                lg-finance-period-switch
            "
        >
            ${renderPeriodButton(
                "week",
                period
            )}
            ${renderPeriodButton(
                "month",
                period
            )}
            ${renderPeriodButton(
                "year",
                period
            )}
        </div>
        <div
            class="
                lg-finance-dynamics
            "
        >
            <div
                class="
                    lg-finance-dynamics-value
                    ${directionClass}
                "
            >
                ${sign}${change}%
            </div>
            <div
                class="
                    lg-finance-dynamics-label
                "
            >
                ${directionText}
                · ${periodLabel}
            </div>
            <div
                class="
                    lg-finance-dynamics-comparison
                "
            >
                <div>
                    <div
                        class="
                            lg-finance-dynamics-number
                        "
                    >
                        ${current}
                    </div>
                    <div
                        class="
                            lg-finance-dynamics-caption
                        "
                    >
                        CURRENT
                    </div>
                </div>
                <div
                    style="
                        text-align:right;
                    "
                >
                    <div
                        class="
                            lg-finance-dynamics-number
                        "
                    >
                        ${money(
                            dynamics.previous
                        )}
                    </div>
                    <div
                        class="
                            lg-finance-dynamics-caption
                        "
                    >
                        PREVIOUS ${periodLabel}
                    </div>
                </div>
            </div>
        </div>
    `;
}
function renderPeriodButton(
    period,
    activePeriod
) {
    const label =
        period === "week"
            ? "WEEK"
            : period === "month"
                ? "MONTH"
                : "YEAR";
    return `
        <button
            type="button"
            class="
                lg-finance-period-button
                ${
                    activePeriod === period
                        ? "active"
                        : ""
                }
            "
            data-action="select-liquid-period"
            data-period="${period}"
        >
            ${label}
        </button>
    `;
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
        .map(
            expense => {
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
            }
        )
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
   LIQUID FUNDS CONTENT
   ========================================================= */
function createLiquidFundsContent(
    liquidFunds
) {
    const total =
        liquidFundsTotal(
            liquidFunds
        );
    return `
        <div
            class="
                lg-finance-liquid-total
            "
        >
            ${money(total)}
        </div>
        <div
            class="
                lg-finance-liquid-total-caption
            "
        >
            TOTAL AVAILABLE ASSETS
        </div>
        <div
            class="
                lg-finance-asset-list
                "
        >
            ${renderLiquidAssets(
                liquidFunds
            )}
        </div>
        <button
            type="button"
            class="
                lg-finance-add-asset
            "
            data-action="add-liquid-asset"
        >
            <span
                class="
                    lg-finance-add-asset-plus
                "
            >
                +
            </span>
            ADD ASSET
        </button>
        <div
            style="
                margin-top:26px;
            "
        >
            <div
                class="
                    lg-finance-card-label
                "
            >
                DYNAMICS
            </div>
            <div
                class="
                    lg-finance-card-subtitle
                "
            >
                Изменение общего объёма активов
                относительно предыдущего периода
            </div>
        </div>
        ${renderLiquidDynamics(
            liquidFunds
        )}
    `;
}
/* =========================================================
   MAIN RENDER
   ========================================================= */
function renderFinance(
    container,
    reopenExpenses = false,
    reopenLiquid = false
) {
    if (!container) {
        return;
    }
    const {
        data,
        month,
        liquidFunds
    } =
        getFinanceData();
    /*
     * Фиксируем текущий snapshot
     * перед отображением.
     */
    saveLiquidSnapshot(
        data
    );
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
    const liquidTotal =
        liquidFundsTotal(
            liquidFunds
        );
    /* =====================================================
       GOAL
       ===================================================== */
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
                class="
                    lg-finance-progress-bottom
                "
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
    /* =====================================================
       EXPENSES
       ===================================================== */
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
    /* =====================================================
       RESERVE
       ===================================================== */
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
    /* =====================================================
       STABILITY
       ===================================================== */
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
    /* =====================================================
       MAIN HTML
       ===================================================== */
    container.innerHTML = `
        <div
            class="lg-finance"
        >
            <!-- HEADER -->
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
            <!-- =================================================
                 LIQUID FUNDS
                 ================================================= -->
            ${createAccordion({
                id:
                    "liquid",
                label:
                    "LIQUID FUNDS",
                subtitle:
                    "Доступные денежные средства",
                amount:
                    money(liquidTotal),
                content:
                    createLiquidFundsContent(
                        liquidFunds
                    ),
                open:
                    reopenLiquid
            })}
            <!-- =================================================
                 MONTHLY INCOME
                 ================================================= -->
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
                            03
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
            <!-- =================================================
                 MONTHLY GOAL
                 ================================================= -->
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
            <!-- =================================================
                 REQUIRED EXPENSES
                 ================================================= -->
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
            <!-- =================================================
                 FINANCIAL RESERVE
                 ================================================= -->
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
            <!-- =================================================
                 FINANCIAL STABILITY
                 ================================================= -->
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
            <!-- LIFE MODULE -->
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
    initLiquidAssetSwipe(
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
/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents(
    container
) {

    if (!container) {
        return;
    }

    /*
     * IMPORTANT:
     *
     * renderFinance() вызывается после изменения данных.
     * Поэтому нельзя каждый раз добавлять новый
     * click listener на тот же finance-container.
     *
     * Храним флаг непосредственно на DOM-контейнере.
     */

    if (
        container.dataset
            .financeEventsBound === "true"
    ) {
        return;
    }

    container.dataset
        .financeEventsBound = "true";


    container.addEventListener(
        "click",
        event => {

            /* =========================================
               MAIN ACTIONS
               ========================================= */

            const action =
                event.target.closest(
                    "[data-action]"
                );


            if (action) {

                const type =
                    action.dataset.action;


                /* =====================================
                   ACCORDION
                   ===================================== */

                if (
                    type ===
                    "toggle-accordion"
                ) {

                    toggleAccordion(
                        action
                    );

                    return;
                }


                /* =====================================
                   INCOME
                   ===================================== */

                if (
                    type ===
                    "edit-income"
                ) {

                    editIncome();

                    return;
                }


                /* =====================================
                   GOAL
                   ===================================== */

                if (
                    type ===
                    "edit-goal"
                ) {

                    editGoal();

                    return;
                }


                /* =====================================
                   RESERVE
                   ===================================== */

                if (
                    type ===
                    "edit-reserve"
                ) {

                    editReserve();

                    return;
                }


                /* =====================================
                   EXPENSE
                   ===================================== */

                if (
                    type ===
                    "add-expense"
                ) {

                    openExpenseModal();

                    return;
                }


                /* =====================================
                   LIQUID ASSET — ADD
                   ===================================== */

                if (
                    type ===
                    "add-liquid-asset"
                ) {

                    openAssetModal();

                    return;
                }


                /* =====================================
                   LIQUID ASSET — EDIT
                   ===================================== */

                if (
                    type ===
                    "edit-liquid-asset"
                ) {

                    const id =
                        action.dataset.id;


                    const {
                        liquidFunds
                    } =
                        getFinanceData();


                    const asset =
                        liquidFunds.assets
                            .find(
                                item =>
                                    item.id ===
                                    id
                            );


                    if (asset) {

                        openAssetModal(
                            asset
                        );

                    }

                    return;
                }


                /* =====================================
                   LIQUID FUNDS — PERIOD
                   ===================================== */

                if (
                    type ===
                    "select-liquid-period"
                ) {

                    selectLiquidPeriod(
                        action.dataset.period
                    );

                    return;
                }

            }


            /* =========================================
               DELETE EXPENSE
               ========================================= */

            const deleteExpenseButton =
                event.target.closest(
                    "[data-delete-expense]"
                );


            if (
                deleteExpenseButton
            ) {

                deleteExpense(
                    deleteExpenseButton.dataset.id
                );

                return;
            }


            /* =========================================
               DELETE LIQUID ASSET
               ========================================= */

            const deleteAssetButton =
                event.target.closest(
                    "[data-delete-asset]"
                );


            if (
                deleteAssetButton
            ) {

                deleteLiquidAsset(
                    deleteAssetButton.dataset.id
                );

                return;
            }


            /* =========================================
               LIQUID ASSET ROW
               ========================================= */

            const assetRow =
                event.target.closest(
                    "[data-asset-swipe-row]"
                );


            if (
                assetRow
            ) {

                const wrapper =
                    assetRow.closest(
                        "[data-asset-id]"
                    );


                if (!wrapper) {
                    return;
                }


                /*
                 * Системные активы:
                 *
                 * Наличные
                 * Деньги на картах
                 * Банковские счета
                 *
                 * Нельзя удалить или
                 * переименовать.
                 *
                 * Можно изменить только сумму.
                 */

                if (
                    wrapper.dataset.system ===
                    "true"
                ) {

                    editSystemAsset(
                        wrapper.dataset.assetId
                    );

                }

                else {

                    editLiquidAsset(
                        wrapper.dataset.assetId
                    );

                }

            }

        }
    );
}
/* =========================================================
   ACCORDION
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
   LIQUID PERIOD
   ========================================================= */
function selectLiquidPeriod(
    period
) {
    if (
        ![
            "week",
            "month",
            "year"
        ].includes(
            period
        )
    ) {
        return;
    }
    const {
        data
    } =
        getFinanceData();
    data.liquidFunds.selectedPeriod =
        period;
    saveFinanceData(
        data
    );
    renderFinance(
        getFinanceContainer(),
        false,
        true
    );
}
/* =========================================================
   LIQUID ASSET EDIT
   ========================================================= */
function editLiquidAsset(
    id
) {
    const {
        liquidFunds
    } =
        getFinanceData();
    const asset =
        liquidFunds.assets
            .find(
                item =>
                    item.id === id
            );
    if (!asset) {
        return;
    }
    openAssetModal(
        asset
    );
}
function editSystemAsset(
    id
) {
    const {
        liquidFunds
    } =
        getFinanceData();
    const asset =
        liquidFunds.assets
            .find(
                item =>
                    item.id === id
            );
    if (!asset) {
        return;
    }
    /*
     * Системный актив:
     * название менять нельзя.
     * Можно менять только сумму.
     */
    openModal({
        label:
            "LIQUID FUNDS",
        title:
            asset.name,
        value:
            asset.amount || "",
        placeholder:
            "0",
        onSave:
            value => {
                const {
                    data
                } =
                    getFinanceData();
                const target =
                    data.liquidFunds.assets
                        .find(
                            item =>
                                item.id === id
                        );
                if (target) {
                    target.amount =
                        value;
                }
                saveLiquidSnapshot(
                    data
                );
                saveFinanceData(
                    data
                );
                renderFinance(
                    getFinanceContainer(),
                    false,
                    true
                );
            }
    });
}
/* =========================================================
   LIQUID ASSET DELETE
   ========================================================= */
function deleteLiquidAsset(
    id
) {
    if (!id) {
        return;
    }
    const {
        data
    } =
        getFinanceData();
    const asset =
        data.liquidFunds.assets
            .find(
                item =>
                    item.id === id
            );
    if (!asset) {
        return;
    }
    /*
     * CORE ASSETS CANNOT BE DELETED.
     */
    if (
        asset.system
    ) {
        return;
    }
    data.liquidFunds.assets =
        data.liquidFunds.assets
            .filter(
                item =>
                    item.id !== id
            );
    saveLiquidSnapshot(
        data
    );
    saveFinanceData(
        data
    );
    renderFinance(
        getFinanceContainer(),
        false,
        true
    );
}
/* =========================================================
   LIQUID ASSET SWIPE
   ========================================================= */
function initLiquidAssetSwipe(
    container
) {
    const wrappers =
        container.querySelectorAll(
            ".lg-finance-asset-swipe"
        );
    wrappers.forEach(
        wrapper => {
            if (
                wrapper.dataset.system ===
                "true"
            ) {
                return;
            }
            const row =
                wrapper.querySelector(
                    "[data-asset-swipe-row]"
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
            function closeRow() {
                row.classList.remove(
                    "swiped"
                );
                row.style.transform =
                    "";
            }
            function openRow() {
                row.classList.add(
                    "swiped"
                );
                row.style.transform =
                    `translateX(-${MAX_DISTANCE}px)`;
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
                    else {
                        setPosition(
                            Math.max(
                                0,
                                MAX_DISTANCE -
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
                        row.style.transform =
                            "";
                        return;
                    }
                    if (
                        deltaX < 0 &&
                        Math.abs(deltaX) >=
                        DELETE_DISTANCE
                    ) {
                        openRow();
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
                    closeRow();
                }
            );
            row.addEventListener(
                "click",
                () => {
                    if (moved) {
                        return;
                    }
                    wrappers.forEach(
                        other => {
                            if (
                                other !==
                                wrapper
                            ) {
                                const otherRow =
                                    other.querySelector(
                                        "[data-asset-swipe-row]"
                                    );
                                if (
                                    otherRow
                                ) {
                                    otherRow.classList
                                        .remove(
                                            "swiped"
                                        );
                                    otherRow.style
                                        .transform =
                                        "";
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
   EXPENSE SWIPE
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
                row.style.transform =
                    "";
            }
            function openRow() {
                row.classList.add(
                    "swiped"
                );
                row.style.transform =
                    `translateX(-${MAX_DISTANCE}px)`;
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
                    else {
                        setPosition(
                            Math.max(
                                0,
                                MAX_DISTANCE -
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
                        row.style.transform =
                            "";
                        return;
                    }
                    if (
                        deltaX < 0 &&
                        Math.abs(deltaX) >=
                        DELETE_DISTANCE
                    ) {
                        openRow();
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
                    closeRow();
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
                                if (
                                    otherRow
                                ) {
                                    otherRow.classList
                                        .remove(
                                            "swiped"
                                        );
                                    otherRow.style
                                        .transform =
                                        "";
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
    }
    catch (error) {
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
};/* =========================================================
   LIFE GAME — FINANCE MODULE
   Finance v1
   Current architecture:
   01. Liquid Funds
   02. Required Expenses
   03. Income
   04. Financial Obligations
   05. Income Statistics
   06. Financial Stability
   Current development stage:
   LIQUID FUNDS
   IMPORTANT:
   - app.js is not touched
   - navigation.js is not touched
   - storage.js is used as existing universal storage
   - Core Finance structure remains controlled by LIFE GAME
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
    return `${month} ${now.getDate()} ${now.getFullYear()}`;
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
   DATE HELPERS
   ========================================================= */
function dateKey(date) {
    const d =
        new Date(date);
    return `${d.getFullYear()}-${String(
        d.getMonth() + 1
    ).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
}
function previousPeriodDate(
    period
) {
    const now =
        new Date();
    const result =
        new Date(now);
    if (period === "week") {
        result.setDate(
            result.getDate() - 7
        );
    }
    else if (period === "month") {
        result.setMonth(
            result.getMonth() - 1
        );
    }
    else if (period === "year") {
        result.setFullYear(
            result.getFullYear() - 1
        );
    }
    return result;
}
/* =========================================================
   DEFAULT DATA
   ========================================================= */
function defaultMonth() {
    return {
        income: 0,
        incomeGoal: 0,
        expenses: [],
        reserve: 0
    };
}
function defaultLiquidFunds() {
    return {
        assets: [
            {
                id: "cash",
                name: "Наличные",
                amount: 0,
                system: true
            },
            {
                id: "cards",
                name: "Деньги на картах",
                amount: 0,
                system: true
            },
            {
                id: "bank",
                name: "Банковские счета",
                amount: 0,
                system: true
            }
        ],
        snapshots: [],
        selectedPeriod: "month"
    };
}
/* =========================================================
   FINANCE DATA
   ========================================================= */
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
    /*
     * LIQUID FUNDS MIGRATION
     *
     * Старые данные не ломаем.
     */
    if (
        !stored.liquidFunds ||
        typeof stored.liquidFunds !== "object"
    ) {
        stored.liquidFunds =
            defaultLiquidFunds();
    }
    if (
        !Array.isArray(
            stored.liquidFunds.assets
        )
    ) {
        stored.liquidFunds.assets = [];
    }
    if (
        !Array.isArray(
            stored.liquidFunds.snapshots
        )
    ) {
        stored.liquidFunds.snapshots = [];
    }
    /*
     * Гарантируем наличие системных активов.
     */
    const systemAssets = [
        {
            id: "cash",
            name: "Наличные",
            system: true
        },
        {
            id: "cards",
            name: "Деньги на картах",
            system: true
        },
        {
            id: "bank",
            name: "Банковские счета",
            system: true
        }
    ];
    systemAssets.forEach(
        systemAsset => {
            const exists =
                stored.liquidFunds.assets
                    .some(
                        asset =>
                            asset.id ===
                            systemAsset.id
                    );
            if (!exists) {
                stored.liquidFunds.assets
                    .unshift({
                        ...systemAsset,
                        amount: 0
                    });
            }
        }
    );
    stored.currentMonth =
        monthKey;
    stored.version =
        FINANCE_VERSION;
    return {
        data: stored,
        month:
            stored.months[monthKey],
        liquidFunds:
            stored.liquidFunds
    };
}
function saveFinanceData(
    data
) {
    updateSection(
        "finance",
        {
            data
        }
    );
}
/* =========================================================
   LIQUID FUNDS CALCULATIONS
   ========================================================= */
function liquidFundsTotal(
    liquidFunds
) {
    if (
        !liquidFunds ||
        !Array.isArray(
            liquidFunds.assets
        )
    ) {
        return 0;
    }
    return liquidFunds.assets.reduce(
        (
            total,
            asset
        ) => {
            return total +
                numberValue(
                    asset.amount
                );
        },
        0
    );
}
function getSnapshotForDate(
    liquidFunds,
    targetDate
) {
    if (
        !liquidFunds ||
        !Array.isArray(
            liquidFunds.snapshots
        )
    ) {
        return null;
    }
    const target =
        new Date(targetDate);
    const targetTime =
        target.getTime();
    let best =
        null;
    liquidFunds.snapshots
        .forEach(
            snapshot => {
                const snapshotDate =
                    new Date(
                        snapshot.date
                    );
                const snapshotTime =
                    snapshotDate.getTime();
                if (
                    snapshotTime <=
                    targetTime
                ) {
                    if (
                        !best ||
                        snapshotTime >
                        new Date(
                            best.date
                        ).getTime()
                    ) {
                        best =
                            snapshot;
                    }
                }
            }
        );
    return best;
}
function getPreviousSnapshot(
    liquidFunds,
    period
) {
    const target =
        previousPeriodDate(
            period
        );
    return getSnapshotForDate(
        liquidFunds,
        target
    );
}
function calculateLiquidDynamics(
    liquidFunds,
    period
) {
    const currentTotal =
        liquidFundsTotal(
            liquidFunds
        );
    const previousSnapshot =
        getPreviousSnapshot(
            liquidFunds,
            period
        );
    if (!previousSnapshot) {
        return {
            current:
                currentTotal,
            previous:
                null,
            change:
                null,
            direction:
                "none"
        };
    }
    const previous =
        numberValue(
            previousSnapshot.total
        );
    if (previous === 0) {
        return {
            current:
                currentTotal,
            previous,
            change:
                currentTotal > 0
                    ? 100
                    : 0,
            direction:
                currentTotal > 0
                    ? "up"
                    : "stable"
        };
    }
    const change =
        Math.round(
            (
                (
                    currentTotal -
                    previous
                )
                /
                previous
            )
            *
            100
        );
    return {
        current:
            currentTotal,
        previous,
        change,
        direction:
            change > 0
                ? "up"
                : change < 0
                    ? "down"
                    : "stable"
    };
}
/*
 * Создаём / обновляем текущий снимок.
 *
 * Это происходит при сохранении финансовых данных.
 */
function saveLiquidSnapshot(
    data
) {
    const liquidFunds =
        data.liquidFunds;
    if (!liquidFunds) {
        return;
    }
    if (
        !Array.isArray(
            liquidFunds.snapshots
        )
    ) {
        liquidFunds.snapshots = [];
    }
    const today =
        dateKey(
            new Date()
        );
    const total =
        liquidFundsTotal(
            liquidFunds
        );
    const existing =
        liquidFunds.snapshots
            .find(
                snapshot =>
                    snapshot.date ===
                    today
            );
    if (existing) {
        existing.total =
            total;
    }
    else {
        liquidFunds.snapshots.push({
            id:
                createId(),
            date:
                today,
            total
        });
    }
    /*
     * Храним разумное количество
     * исторических точек.
     */
    liquidFunds.snapshots =
        liquidFunds.snapshots
            .sort(
                (
                    a,
                    b
                ) =>
                    new Date(a.date) -
                    new Date(b.date)
            )
            .slice(-1000);
}
/* =========================================================
   EXPENSE CALCULATIONS
   ========================================================= */
function expensesTotal(
    month
) {
    if (
        !Array.isArray(
            month.expenses
        )
    ) {
        return 0;
    }
    return month.expenses.reduce(
        (
            sum,
            expense
        ) => {
            return sum +
                numberValue(
                    expense.amount
                );
        },
        0
    );
}
function goalProgress(
    month
) {
    return percentage(
        month.income,
        month.incomeGoal
    );
}
function expensePercent(
    month
) {
    return percentage(
        expensesTotal(month),
        month.income
    );
}
function reservePercent(
    month
) {
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
        document.createElement(
            "style"
        );
    style.id =
        "life-finance-runtime-styles";
    style.textContent = `
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
        /* ACCORDION */
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
            transform:
                rotate(45deg);
            color:
                var(--f-white);
            border-color:
                rgba(255,255,255,.2);
        }
        .lg-finance-accordion-content {
            display:grid;
            grid-template-rows:
                0fr;
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
            grid-template-rows:
                1fr;
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
        /* BUTTONS */
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
            transform:
                scale(.97);
        }
        .lg-finance-main-button {
            width:100%;
            margin-top:20px;
        }
        /* LIQUID FUNDS */
        .lg-finance-liquid-total {
            margin-top:24px;
            font-size:
                clamp(
                    36px,
                    10vw,
                    54px
                );
            line-height:.92;
            font-weight:850;
            letter-spacing:-.07em;
        }
        .lg-finance-liquid-total-caption {
            margin-top:9px;
            color:
                var(--f-muted);
            font-size:8px;
            font-weight:800;
            letter-spacing:.12em;
            text-transform:uppercase;
        }
        .lg-finance-asset-list {
            border-top:
                1px solid
                var(--f-border);
        }
        .lg-finance-asset-swipe {
            position:relative;
            overflow:hidden;
            border-bottom:
                1px solid
                rgba(255,255,255,.055);
            touch-action:pan-y;
            user-select:none;
            -webkit-user-select:none;
        }
        .lg-finance-asset-delete {
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
        .lg-finance-asset-row {
            position:relative;
            z-index:2;
            min-height:62px;
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:15px;
            padding:0 2px;
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
        }
        .lg-finance-asset-row.swiped {
            transform:
                translateX(-88px);
        }
        .lg-finance-asset-info {
            min-width:0;
        }
        .lg-finance-asset-name {
            color:
                var(--f-soft);
            font-size:11px;
            font-weight:650;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
        }
        .lg-finance-asset-type {
            margin-top:4px;
            color:
                var(--f-dim);
            font-size:7px;
            font-weight:800;
            letter-spacing:.1em;
            text-transform:uppercase;
        }
        .lg-finance-asset-amount {
            color:
                var(--f-white);
            font-size:12px;
            font-weight:800;
            flex-shrink:0;
        }
        .lg-finance-add-asset {
            width:100%;
            height:44px;
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
        .lg-finance-add-asset-plus {
            font-size:16px;
            font-weight:300;
        }
        /* DYNAMICS */
        .lg-finance-period-switch {
            display:grid;
            grid-template-columns:
                repeat(3, 1fr);
            gap:5px;
            margin-bottom:18px;
            padding:4px;
            border:
                1px solid
                rgba(255,255,255,.07);
            border-radius:12px;
            background:
                rgba(255,255,255,.018);
        }
        .lg-finance-period-button {
            height:32px;
            border:0;
            border-radius:9px;
            background:transparent;
            color:
                var(--f-dim);
            font-family:inherit;
            font-size:7px;
            font-weight:850;
            letter-spacing:.1em;
            cursor:pointer;
            transition:
                background .18s ease,
                color .18s ease;
        }
        .lg-finance-period-button.active {
            background:
                rgba(255,255,255,.09);
            color:
                var(--f-white);
        }
        .lg-finance-dynamics {
            padding:
                18px
                0
                4px;
        }
        .lg-finance-dynamics-value {
            font-size:34px;
            font-weight:850;
            letter-spacing:-.06em;
        }
        .lg-finance-dynamics-value.up {
            color:
                var(--f-white);
        }
        .lg-finance-dynamics-value.down {
            color:
                rgba(255,255,255,.58);
        }
        .lg-finance-dynamics-value.stable {
            color:
                var(--f-soft);
        }
        .lg-finance-dynamics-label {
            margin-top:7px;
            color:
                var(--f-dim);
            font-size:7px;
            font-weight:800;
            letter-spacing:.12em;
            text-transform:uppercase;
        }
        .lg-finance-dynamics-comparison {
            display:flex;
            justify-content:space-between;
            align-items:flex-end;
            gap:15px;
            margin-top:22px;
            padding-top:15px;
            border-top:
                1px solid
                rgba(255,255,255,.055);
        }
        .lg-finance-dynamics-number {
            color:
                var(--f-soft);
            font-size:15px;
            font-weight:750;
        }
        .lg-finance-dynamics-caption {
            margin-top:5px;
            color:
                var(--f-dim);
            font-size:7px;
            font-weight:800;
            letter-spacing:.1em;
            text-transform:uppercase;
        }
        .lg-finance-dynamics-empty {
            padding:
                18px
                0
                4px;
            color:
                var(--f-dim);
            font-size:9px;
            line-height:1.5;
        }
        /* STABILITY */
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
        /* MODAL */
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
    document.head.appendChild(
        style
    );
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
        document.createElement(
            "div"
        );
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
    requestAnimationFrame(
        () => {
            input.focus();
            try {
                input.select();
            } catch (_) {}
        }
    );
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
                onSave(
                    value
                );
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
        document.createElement(
            "div"
        );
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
    requestAnimationFrame(
        () => {
            nameInput.focus();
        }
    );
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
   LIQUID ASSET MODAL
   ========================================================= */
function openAssetModal(
    asset = null
) {
    closeModal();
    const editing =
        Boolean(asset);
    const modal =
        document.createElement(
            "div"
        );
    modal.className =
        "lg-finance-modal active";
    modal.innerHTML = `
        <div
            class="lg-finance-modal-panel"
        >
            <div
                class="lg-finance-modal-label"
            >
                LIQUID FUNDS
            </div>
            <div
                class="lg-finance-modal-title"
            >
                ${
                    editing
                        ? "Edit asset"
                        : "Add asset"
                }
            </div>
            ${
                editing
                    ? `
                        <input
                            class="lg-finance-input"
                            data-asset-name
                            type="text"
                            maxlength="60"
                            value="${escapeHTML(
                                asset.name
                            )}"
                            placeholder="Название актива"
                        >
                    `
                    : `
                        <input
                            class="lg-finance-input"
                            data-asset-name
                            type="text"
                            maxlength="60"
                            placeholder="Название актива"
                        >
                    `
            }
            <input
                class="lg-finance-input"
                data-asset-amount
                type="number"
                inputmode="decimal"
                min="0"
                step="1"
                value="${
                    editing
                        ? escapeHTML(
                            asset.amount
                        )
                        : ""
                }"
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
    const nameInput =
        modal.querySelector(
            "[data-asset-name]"
        );
    const amountInput =
        modal.querySelector(
            "[data-asset-amount]"
        );
    requestAnimationFrame(
        () => {
            nameInput.focus();
        }
    );
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
                const {
                    data
                } =
                    getFinanceData();
                if (
                    !editing
                ) {
                    data.liquidFunds.assets
                        .push({
                            id:
                                createId(),
                            name,
                            amount,
                            system:
                                false
                        });
                }
                else {
                    const target =
                        data.liquidFunds.assets
                            .find(
                                item =>
                                    item.id ===
                                    asset.id
                            );
                    if (target) {
                        /*
                         * Даже пользовательские
                         * активы нельзя случайно
                         * превратить в системные.
                         */
                        if (
                            target.system
                        ) {
                            target.amount =
                                amount;
                        }
                        else {
                            target.name =
                                name;
                            target.amount =
                                amount;
                        }
                    }
                }
                saveLiquidSnapshot(
                    data
                );
                saveFinanceData(
                    data
                );
                closeModal();
                renderFinance(
                    getFinanceContainer()
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
   LIQUID ASSET LIST
   ========================================================= */
function renderLiquidAssets(
    liquidFunds
) {
    const assets =
        Array.isArray(
            liquidFunds.assets
        )
            ? liquidFunds.assets
            : [];
    if (
        assets.length === 0
    ) {
        return `
            <div
                class="lg-finance-empty"
            >
                Активов пока нет.
            </div>
        `;
    }
    return assets
        .map(
            asset => {
                const system =
                    Boolean(
                        asset.system
                    );
                return `
                    <div
                        class="
                            lg-finance-asset-swipe
                        "
                        data-asset-id="${escapeHTML(
                            asset.id
                        )}"
                        data-system="${system}"
                    >
                        ${
                            system
                                ? ""
                                : `
                                    <div
                                        class="
                                            lg-finance-asset-delete
                                        "
                                        data-delete-asset
                                        data-id="${escapeHTML(
                                            asset.id
                                        )}"
                                    >
                                        DELETE
                                    </div>
                                `
                        }
                        <div
                            class="
                                lg-finance-asset-row
                            "
                            data-asset-swipe-row
                        >
                            <div
                                class="
                                    lg-finance-asset-info
                                "
                            >
                                <div
                                    class="
                                        lg-finance-asset-name
                                    "
                                >
                                    ${escapeHTML(
                                        asset.name
                                    )}
                                </div>
                                <div
                                    class="
                                        lg-finance-asset-type
                                    "
                                >
                                    ${
                                        system
                                            ? "CORE ASSET"
                                            : "CUSTOM ASSET"
                                    }
                                </div>
                            </div>
                            <div
                                class="
                                    lg-finance-asset-amount
                                "
                            >
                                ${money(
                                    asset.amount
                                )}
                            </div>
                        </div>
                    </div>
                `;
            }
        )
        .join("");
}
/* =========================================================
   DYNAMICS RENDER
   ========================================================= */
function renderLiquidDynamics(
    liquidFunds
) {
    const period =
        liquidFunds.selectedPeriod ||
        "month";
    const dynamics =
        calculateLiquidDynamics(
            liquidFunds,
            period
        );
    const periodLabel =
        period === "week"
            ? "WEEK"
            : period === "year"
                ? "YEAR"
                : "MONTH";
    const current =
        money(
            dynamics.current
        );
    if (
        dynamics.change === null
    ) {
        return `
            <div
                class="
                    lg-finance-period-switch
                "
            >
                ${renderPeriodButton(
                    "week",
                    period
                )}
                ${renderPeriodButton(
                    "month",
                    period
                )}
                ${renderPeriodButton(
                    "year",
                    period
                )}
            </div>
            <div
                class="
                    lg-finance-dynamics
                "
            >
                <div
                    class="
                        lg-finance-dynamics-empty
                    "
                >
                    Недостаточно исторических
                    данных для сравнения.
                    <br><br>
                    Текущий объём:
                    <strong>
                        ${current}
                    </strong>
                </div>
            </div>
        `;
    }
    const change =
        dynamics.change;
    const sign =
        change > 0
            ? "+"
            : "";
    const directionClass =
        dynamics.direction;
    const directionText =
        dynamics.direction === "up"
            ? "GROWTH"
            : dynamics.direction === "down"
                ? "DECLINE"
                : "STABLE";
    return `
        <div
            class="
                lg-finance-period-switch
            "
        >
            ${renderPeriodButton(
                "week",
                period
            )}
            ${renderPeriodButton(
                "month",
                period
            )}
            ${renderPeriodButton(
                "year",
                period
            )}
        </div>
        <div
            class="
                lg-finance-dynamics
            "
        >
            <div
                class="
                    lg-finance-dynamics-value
                    ${directionClass}
                "
            >
                ${sign}${change}%
            </div>
            <div
                class="
                    lg-finance-dynamics-label
                "
            >
                ${directionText}
                · ${periodLabel}
            </div>
            <div
                class="
                    lg-finance-dynamics-comparison
                "
            >
                <div>
                    <div
                        class="
                            lg-finance-dynamics-number
                        "
                    >
                        ${current}
                    </div>
                    <div
                        class="
                            lg-finance-dynamics-caption
                        "
                    >
                        CURRENT
                    </div>
                </div>
                <div
                    style="
                        text-align:right;
                    "
                >
                    <div
                        class="
                            lg-finance-dynamics-number
                        "
                    >
                        ${money(
                            dynamics.previous
                        )}
                    </div>
                    <div
                        class="
                            lg-finance-dynamics-caption
                        "
                    >
                        PREVIOUS ${periodLabel}
                    </div>
                </div>
            </div>
        </div>
    `;
}
function renderPeriodButton(
    period,
    activePeriod
) {
    const label =
        period === "week"
            ? "WEEK"
            : period === "month"
                ? "MONTH"
                : "YEAR";
    return `
        <button
            type="button"
            class="
                lg-finance-period-button
                ${
                    activePeriod === period
                        ? "active"
                        : ""
                }
            "
            data-action="select-liquid-period"
            data-period="${period}"
        >
            ${label}
        </button>
    `;
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
        .map(
            expense => {
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
            }
        )
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
   LIQUID FUNDS CONTENT
   ========================================================= */
function createLiquidFundsContent(
    liquidFunds
) {
    const total =
        liquidFundsTotal(
            liquidFunds
        );
    return `
        <div
            class="
                lg-finance-liquid-total
            "
        >
            ${money(total)}
        </div>
        <div
            class="
                lg-finance-liquid-total-caption
            "
        >
            TOTAL AVAILABLE ASSETS
        </div>
        <div
            class="
                lg-finance-asset-list
                "
        >
            ${renderLiquidAssets(
                liquidFunds
            )}
        </div>
        <button
            type="button"
            class="
                lg-finance-add-asset
            "
            data-action="add-liquid-asset"
        >
            <span
                class="
                    lg-finance-add-asset-plus
                "
            >
                +
            </span>
            ADD ASSET
        </button>
        <div
            style="
                margin-top:26px;
            "
        >
            <div
                class="
                    lg-finance-card-label
                "
            >
                DYNAMICS
            </div>
            <div
                class="
                    lg-finance-card-subtitle
                "
            >
                Изменение общего объёма активов
                относительно предыдущего периода
            </div>
        </div>
        ${renderLiquidDynamics(
            liquidFunds
        )}
    `;
}
/* =========================================================
   MAIN RENDER
   ========================================================= */
function renderFinance(
    container,
    reopenExpenses = false,
    reopenLiquid = false
) {
    if (!container) {
        return;
    }
    const {
        data,
        month,
        liquidFunds
    } =
        getFinanceData();
    /*
     * Фиксируем текущий snapshot
     * перед отображением.
     */
    saveLiquidSnapshot(
        data
    );
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
    const liquidTotal =
        liquidFundsTotal(
            liquidFunds
        );
    /* =====================================================
       GOAL
       ===================================================== */
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
                class="
                    lg-finance-progress-bottom
                "
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
    /* =====================================================
       EXPENSES
       ===================================================== */
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
    /* =====================================================
       RESERVE
       ===================================================== */
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
    /* =====================================================
       STABILITY
       ===================================================== */
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
    /* =====================================================
       MAIN HTML
       ===================================================== */
    container.innerHTML = `
        <div
            class="lg-finance"
        >
            <!-- HEADER -->
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
            <!-- =================================================
                 LIQUID FUNDS
                 ================================================= -->
            ${createAccordion({
                id:
                    "liquid",
                label:
                    "LIQUID FUNDS",
                subtitle:
                    "Доступные денежные средства",
                amount:
                    money(liquidTotal),
                content:
                    createLiquidFundsContent(
                        liquidFunds
                    ),
                open:
                    reopenLiquid
            })}
            <!-- =================================================
                 MONTHLY INCOME
                 ================================================= -->
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
                            03
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
            <!-- =================================================
                 MONTHLY GOAL
                 ================================================= -->
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
            <!-- =================================================
                 REQUIRED EXPENSES
                 ================================================= -->
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
            <!-- =================================================
                 FINANCIAL RESERVE
                 ================================================= -->
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
            <!-- =================================================
                 FINANCIAL STABILITY
                 ================================================= -->
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
            <!-- LIFE MODULE -->
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
    initLiquidAssetSwipe(
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
let financeEventsBound = false;

function bindEvents(container) {

    if (!container || financeEventsBound) {
        return;
    }

    financeEventsBound = true;

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

                    toggleAccordion(action);
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

            if (deleteButton) {

                deleteExpense(
                    deleteButton.dataset.id
                );
            }
        }
    );
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
                    "add-liquid-asset"
                ) {
                    openAssetModal();
                    return;
                }
                if (
                    type ===
                    "edit-liquid-asset"
                ) {
                    const id =
                        action.dataset.id;
                    const {
                        liquidFunds
                    } =
                        getFinanceData();
                    const asset =
                        liquidFunds.assets
                            .find(
                                item =>
                                    item.id ===
                                    id
                            );
                    if (asset) {
                        openAssetModal(
                            asset
                        );
                    }
                    return;
                }
                if (
                    type ===
                    "select-liquid-period"
                ) {
                    selectLiquidPeriod(
                        action.dataset.period
                    );
                    return;
                }
            }
            const deleteExpenseButton =
                event.target.closest(
                    "[data-delete-expense]"
                );
            if (
                deleteExpenseButton
            ) {
                deleteExpense(
                    deleteExpenseButton.dataset.id
                );
                return;
            }
            const deleteAssetButton =
                event.target.closest(
                    "[data-delete-asset]"
                );
            if (
                deleteAssetButton
            ) {
                deleteLiquidAsset(
                    deleteAssetButton.dataset.id
                );
                return;
            }
            const assetRow =
                event.target.closest(
                    "[data-asset-swipe-row]"
                );
            if (
                assetRow
            ) {
                const wrapper =
                    assetRow.closest(
                        "[data-asset-id]"
                    );
                if (!wrapper) {
                    return;
                }
                if (
                    wrapper.dataset.system ===
                    "true"
                ) {
                    editSystemAsset(
                        wrapper.dataset.assetId
                    );
                }
                else {
                    editLiquidAsset(
                        wrapper.dataset.assetId
                    );
                }
            }
        }
    );
}
/* =========================================================
   ACCORDION
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
   LIQUID PERIOD
   ========================================================= */
function selectLiquidPeriod(
    period
) {
    if (
        ![
            "week",
            "month",
            "year"
        ].includes(
            period
        )
    ) {
        return;
    }
    const {
        data
    } =
        getFinanceData();
    data.liquidFunds.selectedPeriod =
        period;
    saveFinanceData(
        data
    );
    renderFinance(
        getFinanceContainer(),
        false,
        true
    );
}
/* =========================================================
   LIQUID ASSET EDIT
   ========================================================= */
function editLiquidAsset(
    id
) {
    const {
        liquidFunds
    } =
        getFinanceData();
    const asset =
        liquidFunds.assets
            .find(
                item =>
                    item.id === id
            );
    if (!asset) {
        return;
    }
    openAssetModal(
        asset
    );
}
function editSystemAsset(
    id
) {
    const {
        liquidFunds
    } =
        getFinanceData();
    const asset =
        liquidFunds.assets
            .find(
                item =>
                    item.id === id
            );
    if (!asset) {
        return;
    }
    /*
     * Системный актив:
     * название менять нельзя.
     * Можно менять только сумму.
     */
    openModal({
        label:
            "LIQUID FUNDS",
        title:
            asset.name,
        value:
            asset.amount || "",
        placeholder:
            "0",
        onSave:
            value => {
                const {
                    data
                } =
                    getFinanceData();
                const target =
                    data.liquidFunds.assets
                        .find(
                            item =>
                                item.id === id
                        );
                if (target) {
                    target.amount =
                        value;
                }
                saveLiquidSnapshot(
                    data
                );
                saveFinanceData(
                    data
                );
                renderFinance(
                    getFinanceContainer(),
                    false,
                    true
                );
            }
    });
}
/* =========================================================
   LIQUID ASSET DELETE
   ========================================================= */
function deleteLiquidAsset(
    id
) {
    if (!id) {
        return;
    }
    const {
        data
    } =
        getFinanceData();
    const asset =
        data.liquidFunds.assets
            .find(
                item =>
                    item.id === id
            );
    if (!asset) {
        return;
    }
    /*
     * CORE ASSETS CANNOT BE DELETED.
     */
    if (
        asset.system
    ) {
        return;
    }
    data.liquidFunds.assets =
        data.liquidFunds.assets
            .filter(
                item =>
                    item.id !== id
            );
    saveLiquidSnapshot(
        data
    );
    saveFinanceData(
        data
    );
    renderFinance(
        getFinanceContainer(),
        false,
        true
    );
}
/* =========================================================
   LIQUID ASSET SWIPE
   ========================================================= */
function initLiquidAssetSwipe(
    container
) {
    const wrappers =
        container.querySelectorAll(
            ".lg-finance-asset-swipe"
        );
    wrappers.forEach(
        wrapper => {
            if (
                wrapper.dataset.system ===
                "true"
            ) {
                return;
            }
            const row =
                wrapper.querySelector(
                    "[data-asset-swipe-row]"
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
            function closeRow() {
                row.classList.remove(
                    "swiped"
                );
                row.style.transform =
                    "";
            }
            function openRow() {
                row.classList.add(
                    "swiped"
                );
                row.style.transform =
                    `translateX(-${MAX_DISTANCE}px)`;
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
                    else {
                        setPosition(
                            Math.max(
                                0,
                                MAX_DISTANCE -
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
                        row.style.transform =
                            "";
                        return;
                    }
                    if (
                        deltaX < 0 &&
                        Math.abs(deltaX) >=
                        DELETE_DISTANCE
                    ) {
                        openRow();
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
                    closeRow();
                }
            );
            row.addEventListener(
                "click",
                () => {
                    if (moved) {
                        return;
                    }
                    wrappers.forEach(
                        other => {
                            if (
                                other !==
                                wrapper
                            ) {
                                const otherRow =
                                    other.querySelector(
                                        "[data-asset-swipe-row]"
                                    );
                                if (
                                    otherRow
                                ) {
                                    otherRow.classList
                                        .remove(
                                            "swiped"
                                        );
                                    otherRow.style
                                        .transform =
                                        "";
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
   EXPENSE SWIPE
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
                row.style.transform =
                    "";
            }
            function openRow() {
                row.classList.add(
                    "swiped"
                );
                row.style.transform =
                    `translateX(-${MAX_DISTANCE}px)`;
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
                    else {
                        setPosition(
                            Math.max(
                                0,
                                MAX_DISTANCE -
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
                        row.style.transform =
                            "";
                        return;
                    }
                    if (
                        deltaX < 0 &&
                        Math.abs(deltaX) >=
                        DELETE_DISTANCE
                    ) {
                        openRow();
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
                    closeRow();
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
                                if (
                                    otherRow
                                ) {
                                    otherRow.classList
                                        .remove(
                                            "swiped"
                                        );
                                    otherRow.style
                                        .transform =
                                        "";
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
    }
    catch (error) {
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