/* =========================================
   LIFE GAME 2.0
   STORAGE SYSTEM
   ========================================= */
/*
   Универсальный слой хранения данных приложения.
   storage.js отвечает только за:
   - создание состояния;
   - загрузку состояния;
   - сохранение состояния;
   - обновление отдельных разделов;
   - работу с логами;
   - сброс данных;
   - версионирование сохранения.
   Этот файл НЕ содержит механику:
   - Finance;
   - Health;
   - Development;
   - XP;
   - уровней;
   - расчётов.
   Модули работают со storage.js через API.
*/
/* =========================================
   STORAGE CONFIGURATION
   ========================================= */
const STORAGE_KEY =
    "lifegame2_state";
const STORAGE_VERSION =
    1;
/* =========================================
   DEFAULT STATE
   ========================================= */
const DEFAULT_STATE = {
    version: STORAGE_VERSION,
    player: {
        id: null,
        createdAt: null,
        lastActive: null
    },
    finance: {
        xp: 0,
        level: 1,
        data: {}
    },
    health: {
        xp: 0,
        level: 1,
        data: {}
    },
    development: {
        xp: 0,
        level: 1,
        data: {}
    },
    lifetime: {
        xp: 0,
        level: 1
    },
    logs: []
};
/* =========================================
   CREATE UNIQUE PLAYER ID
   ========================================= */
function createPlayerId() {
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
            .substring(2, 10)
    );
}
/* =========================================
   DEEP CLONE
   ========================================= */
function cloneState(state) {
    return JSON.parse(
        JSON.stringify(state)
    );
}
/* =========================================
   CREATE DEFAULT STATE
   ========================================= */
function createDefaultState() {
    const state =
        cloneState(DEFAULT_STATE);
    const now =
        new Date().toISOString();
    state.player.id =
        createPlayerId();
    state.player.createdAt =
        now;
    state.player.lastActive =
        now;
    return state;
}
/* =========================================
   MERGE STATES
   ========================================= */
function mergeStates(
    defaultState,
    savedState
) {
    if (
        !savedState ||
        typeof savedState !== "object"
    ) {
        return cloneState(defaultState);
    }
    const result =
        cloneState(defaultState);
    Object.keys(savedState).forEach(key => {
        if (
            savedState[key] !== null &&
            typeof savedState[key] === "object" &&
            !Array.isArray(savedState[key]) &&
            typeof result[key] === "object" &&
            result[key] !== null &&
            !Array.isArray(result[key])
        ) {
            result[key] = {
                ...result[key],
                ...savedState[key]
            };
        } else {
            result[key] =
                savedState[key];
        }
    });
    return result;
}
/* =========================================
   READ RAW STORAGE
   ========================================= */
function readStorage() {
    try {
        const raw =
            localStorage.getItem(
                STORAGE_KEY
            );
        if (!raw) {
            return null;
        }
        return JSON.parse(raw);
    } catch (error) {
        console.error(
            "LIFE GAME: Ошибка чтения storage:",
            error
        );
        return null;
    }
}
/* =========================================
   WRITE RAW STORAGE
   ========================================= */
function writeStorage(state) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state)
        );
        return true;
    } catch (error) {
        console.error(
            "LIFE GAME: Ошибка записи storage:",
            error
        );
        return false;
    }
}
/* =========================================
   LOAD STATE
   ========================================= */
function loadState() {
    const savedState =
        readStorage();
    /*
       Если сохранения ещё нет,
       создаём новое состояние игрока.
    */
    if (!savedState) {
        const newState =
            createDefaultState();
        writeStorage(newState);
        return newState;
    }
    /*
       Объединяем сохранённые данные
       с актуальной структурой.
    */
    const state =
        mergeStates(
            DEFAULT_STATE,
            savedState
        );
    /*
       Обновляем дату последней активности.
    */
    state.player.lastActive =
        new Date().toISOString();
    writeStorage(state);
    return state;
}
/* =========================================
   SAVE STATE
   ========================================= */
function saveState(state) {
    if (
        !state ||
        typeof state !== "object"
    ) {
        console.error(
            "LIFE GAME: Нельзя сохранить некорректное состояние."
        );
        return false;
    }
    state.version =
        STORAGE_VERSION;
    state.player =
        state.player || {};
    state.player.lastActive =
        new Date().toISOString();
    return writeStorage(state);
}
/* =========================================
   GET STATE
   ========================================= */
function getState() {
    return loadState();
}
/* =========================================
   UPDATE STATE
   ========================================= */
function updateState(updates) {
    if (
        !updates ||
        typeof updates !== "object"
    ) {
        return false;
    }
    const state =
        loadState();
    Object.keys(updates).forEach(key => {
        if (
            updates[key] !== null &&
            typeof updates[key] === "object" &&
            !Array.isArray(updates[key]) &&
            typeof state[key] === "object" &&
            state[key] !== null &&
            !Array.isArray(state[key])
        ) {
            state[key] = {
                ...state[key],
                ...updates[key]
            };
        } else {
            state[key] =
                updates[key];
        }
    });
    return saveState(state);
}
/* =========================================
   GET SECTION
   ========================================= */
function getSection(sectionName) {
    const state =
        loadState();
    if (
        !Object.prototype.hasOwnProperty.call(
            state,
            sectionName
        )
    ) {
        console.warn(
            "LIFE GAME: Раздел не найден:",
            sectionName
        );
        return null;
    }
    return state[sectionName];
}
/* =========================================
   UPDATE SECTION
   ========================================= */
function updateSection(
    sectionName,
    updates
) {
    const state =
        loadState();
    if (
        !Object.prototype.hasOwnProperty.call(
            state,
            sectionName
        )
    ) {
        console.warn(
            "LIFE GAME: Нельзя обновить неизвестный раздел:",
            sectionName
        );
        return false;
    }
    if (
        updates === null ||
        typeof updates !== "object" ||
        Array.isArray(updates)
    ) {
        console.error(
            "LIFE GAME: Некорректные данные раздела:",
            sectionName
        );
        return false;
    }
    state[sectionName] = {
        ...state[sectionName],
        ...updates
    };
    return saveState(state);
}
/* =========================================
   ADD LOG
   ========================================= */
function addLog(log) {
    if (
        !log ||
        typeof log !== "object"
    ) {
        console.error(
            "LIFE GAME: Некорректный лог."
        );
        return false;
    }
    const state =
        loadState();
    const entry = {
        id: createPlayerId(),
        timestamp:
            new Date().toISOString(),
        ...log
    };
    state.logs.push(entry);
    /*
       На данном этапе храним максимум
       1000 последних логов.
    */
    if (state.logs.length > 1000) {
        state.logs =
            state.logs.slice(-1000);
    }
    return saveState(state);
}
/* =========================================
   GET LOGS
   ========================================= */
function getLogs() {
    const state =
        loadState();
    return [
        ...state.logs
    ];
}
/* =========================================
   CLEAR LOGS
   ========================================= */
function clearLogs() {
    const state =
        loadState();
    state.logs = [];
    return saveState(state);
}
/* =========================================
   RESET STATE
   ========================================= */
function resetState() {
    const newState =
        createDefaultState();
    return writeStorage(
        newState
    );
}
/* =========================================
   REMOVE STORAGE
   ========================================= */
function removeStorage() {
    try {
        localStorage.removeItem(
            STORAGE_KEY
        );
        return true;
    } catch (error) {
        console.error(
            "LIFE GAME: Ошибка удаления storage:",
            error
        );
        return false;
    }
}
/* =========================================
   STORAGE INFORMATION
   ========================================= */
function getStorageInfo() {
    const state =
        loadState();
    return {
        key: STORAGE_KEY,
        version:
            STORAGE_VERSION,
        playerId:
            state.player.id,
        createdAt:
            state.player.createdAt,
        lastActive:
            state.player.lastActive,
        logsCount:
            state.logs.length
    };
}
/* =========================================
   PUBLIC API
   ========================================= */
export {
    STORAGE_KEY,
    STORAGE_VERSION,
    loadState,
    saveState,
    getState,
    updateState,
    getSection,
    updateSection,
    addLog,
    getLogs,
    clearLogs,
    resetState,
    removeStorage,
    getStorageInfo
};