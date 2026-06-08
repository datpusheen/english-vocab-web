const DEFAULT_UNIT_COUNT = 42;
const MIN_UNIT_COUNT = 1;
const MAX_UNIT_COUNT = 80;
const PDF_DB_NAME = "b1TrainerPdfDb";
const PDF_DB_VERSION = 1;
const PDF_STORE_NAME = "files";
const PDF_RECORD_KEY = "book";
const PDF_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const PDF_MIN_ZOOM = 0.7;
const PDF_MAX_ZOOM = 1.8;
const PDF_ZOOM_STEP = 0.15;
const PDF_SPREAD_QUERY = "(min-width: 820px)";
const PDF_DEFAULT_EDIT_TOOL = "highlight";
const PDF_DEFAULT_EDIT_COLOR = "#facc15";
const PDF_DEFAULT_EDIT_SIZE = 8;
const PDF_EDIT_TOOLS = {
  pencil: { type: "stroke", opacity: 0.72, sizeScale: 0.62 },
  ink: { type: "stroke", opacity: 0.94, sizeScale: 1 },
  marker: { type: "stroke", opacity: 0.38, sizeScale: 2.15, blend: "multiply" },
  highlight: { type: "box", opacity: 0.34, blend: "multiply" },
  eraser: { type: "eraser" },
};

const MODE_LABELS = {
  pdf: "PDF sách",
  learn: "Học từ",
  test: "Kiểm tra",
  add: "Thêm từ",
  import: "Import",
};

const STORAGE_KEYS = {
  imported: "b1Trainer.importedUnits",
  custom: "b1Trainer.customWords",
  mastered: "b1Trainer.masteredWords",
  progress: "b1Trainer.progress",
  selectedUnit: "b1Trainer.selectedUnit",
  theme: "b1Trainer.theme",
  activity: "b1Trainer.activity",
  unitCount: "b1Trainer.unitCount",
  accent: "b1Trainer.accent",
};

const TEST_METHODS = {
  choice: {
    label: "Trắc nghiệm",
    prompt: "Nghĩa tiếng Việt",
    resultLabel: "Bạn chọn",
  },
  truefalse: {
    label: "Đúng / sai",
    prompt: "Cặp từ",
    resultLabel: "Bạn chọn",
  },
  flashcard: {
    label: "Flashcard",
    prompt: "Nghĩa tiếng Việt",
    resultLabel: "Bạn tự đánh giá",
  },
  typing: {
    label: "Nhập đáp án",
    prompt: "Nghĩa tiếng Việt",
    resultLabel: "Bạn nhập",
  },
};

const state = {
  unitId: localStorage.getItem(STORAGE_KEYS.selectedUnit) || "unit-01",
  testWords: [],
  currentIndex: 0,
  score: 0,
  results: [],
  answered: false,
  testMethod: "choice",
  currentQuestion: null,
  pdfUrl: "",
  pdfDoc: null,
  pdfPage: 1,
  pdfPageRatio: 0.707,
  pdfZoom: 1,
  pdfRenderId: 0,
  pdfRenderTasks: [],
  pdfRenderedPages: new Set(),
  pdfResizeTimer: 0,
  pdfTurning: false,
  pdfEditOpen: false,
  pdfEditTool: PDF_DEFAULT_EDIT_TOOL,
  pdfEditColor: PDF_DEFAULT_EDIT_COLOR,
  pdfEditSize: PDF_DEFAULT_EDIT_SIZE,
  pdfAnnotationDraft: null,
  pdfSearchQuery: "",
  pdfSearchResults: [],
  pdfSearchIndex: -1,
  pdfSearchStatus: "",
  pdfSearchRevision: 0,
  pdfSearchMatches: new Map(),
  pdfTextCache: new Map(),
  pdfViewportCache: new Map(),
  pdfPanning: false,
  pdfPanStart: null,
  pdfPanX: 0,
  pdfPanY: 0,
  pdfHudVisible: false,
  pdfHudTimer: 0,
  pdfWheelZoomTimer: 0,
};

const els = {
  pdfTab: document.querySelector("#pdfTab"),
  learnTab: document.querySelector("#learnTab"),
  testTab: document.querySelector("#testTab"),
  addTab: document.querySelector("#addTab"),
  importTab: document.querySelector("#importTab"),
  pdfPanel: document.querySelector("#pdfPanel"),
  learnPanel: document.querySelector("#learnPanel"),
  testPanel: document.querySelector("#testPanel"),
  addPanel: document.querySelector("#addPanel"),
  importPanel: document.querySelector("#importPanel"),
  pdfInput: document.querySelector("#pdfInput"),
  pdfFileName: document.querySelector("#pdfFileName"),
  pdfReader: document.querySelector("#pdfReader"),
  pdfBook: document.querySelector("#pdfBook"),
  pdfFullscreenHud: document.querySelector("#pdfFullscreenHud"),
  pdfFullscreenProgressBar: document.querySelector("#pdfFullscreenProgressBar"),
  pdfFullscreenTools: document.querySelector(".pdf-fullscreen-tools"),
  pdfEditButton: document.querySelector("#pdfEditButton"),
  pdfEditPanel: document.querySelector("#pdfEditPanel"),
  pdfEditToolButtons: document.querySelectorAll("[data-pdf-tool]"),
  pdfEditColorButtons: document.querySelectorAll("[data-pdf-color]"),
  pdfEditSizeInput: document.querySelector("#pdfEditSizeInput"),
  pdfEditSizeValue: document.querySelector("#pdfEditSizeValue"),
  pdfClearAnnotationsButton: document.querySelector("#pdfClearAnnotationsButton"),
  pdfSearchForm: document.querySelector("#pdfSearchForm"),
  pdfSearchInput: document.querySelector("#pdfSearchInput"),
  pdfSearchPrevButton: document.querySelector("#pdfSearchPrevButton"),
  pdfSearchNextButton: document.querySelector("#pdfSearchNextButton"),
  pdfSearchCount: document.querySelector("#pdfSearchCount"),
  pdfFullscreenCloseButton: document.querySelector("#pdfFullscreenCloseButton"),
  pdfEmptyState: document.querySelector("#pdfEmptyState"),
  pdfFlipbook: document.querySelector("#pdfFlipbook"),
  pdfPrevButton: document.querySelector("#pdfPrevButton"),
  pdfNextButton: document.querySelector("#pdfNextButton"),
  pdfTurnPrevButton: document.querySelector("#pdfTurnPrevButton"),
  pdfTurnNextButton: document.querySelector("#pdfTurnNextButton"),
  pdfPageInput: document.querySelector("#pdfPageInput"),
  pdfPageTotal: document.querySelector("#pdfPageTotal"),
  pdfZoomOutButton: document.querySelector("#pdfZoomOutButton"),
  pdfZoomInButton: document.querySelector("#pdfZoomInButton"),
  pdfFitButton: document.querySelector("#pdfFitButton"),
  pdfFullscreenButton: document.querySelector("#pdfFullscreenButton"),
  pdfZoomLabel: document.querySelector("#pdfZoomLabel"),
  pdfProgressBar: document.querySelector("#pdfProgressBar"),
  unitList: document.querySelector("#unitList"),
  unitMenuButton: document.querySelector("#unitMenuButton"),
  unitListPanel: document.querySelector("#unitListPanel"),
  currentUnitLabel: document.querySelector("#currentUnitLabel"),
  modeMenuButton: document.querySelector("#modeMenuButton"),
  modeMenuPanel: document.querySelector("#modeMenuPanel"),
  currentModeLabel: document.querySelector("#currentModeLabel"),
  settingsPanel: document.querySelector("#settingsPanel"),
  themeToggle: document.querySelector("#themeToggle"),
  accentChoiceInputs: document.querySelectorAll('input[name="accentChoice"]'),
  unitCountInput: document.querySelector("#unitCountInput"),
  resetSettingsButton: document.querySelector("#resetSettingsButton"),
  unitInput: document.querySelector("#unitInput"),
  importUnitInput: document.querySelector("#importUnitInput"),
  unitTitle: document.querySelector("#unitTitle"),
  unitDescription: document.querySelector("#unitDescription"),
  learnHeading: document.querySelector("#learnHeading"),
  wordCount: document.querySelector("#wordCount"),
  masteredCount: document.querySelector("#masteredCount"),
  scoreCount: document.querySelector("#scoreCount"),
  readyPercent: document.querySelector("#readyPercent"),
  readinessRing: document.querySelector("#readinessRing"),
  readinessRingValue: document.querySelector("#readinessRingValue"),
  heroFocusTitle: document.querySelector("#heroFocusTitle"),
  heroFocusText: document.querySelector("#heroFocusText"),
  heroXpBadge: document.querySelector("#heroXpBadge"),
  coachTitle: document.querySelector("#coachTitle"),
  coachMessage: document.querySelector("#coachMessage"),
  coachStartButton: document.querySelector("#coachStartButton"),
  coachReviewButton: document.querySelector("#coachReviewButton"),
  streakDays: document.querySelector("#streakDays"),
  todayXp: document.querySelector("#todayXp"),
  reviewCount: document.querySelector("#reviewCount"),
  pathProgressLabel: document.querySelector("#pathProgressLabel"),
  pathProgressBar: document.querySelector("#pathProgressBar"),
  pathNodes: document.querySelector("#pathNodes"),
  showLearnButton: document.querySelector("#showLearnButton"),
  startTestButton: document.querySelector("#startTestButton"),
  startTestSideButton: document.querySelector("#startTestSideButton"),
  resetTestButton: document.querySelector("#resetTestButton"),
  onlyUnmasteredInput: document.querySelector("#onlyUnmasteredInput"),
  shuffleInput: document.querySelector("#shuffleInput"),
  searchInput: document.querySelector("#searchInput"),
  wordTable: document.querySelector("#wordTable"),
  questionCard: document.querySelector("#questionCard"),
  questionIndex: document.querySelector("#questionIndex"),
  questionScore: document.querySelector("#questionScore"),
  questionProgressBar: document.querySelector("#questionProgressBar"),
  questionPrompt: document.querySelector("#questionPrompt"),
  questionMeaning: document.querySelector("#questionMeaning"),
  questionMeta: document.querySelector("#questionMeta"),
  choiceGrid: document.querySelector("#choiceGrid"),
  flashcardAnswer: document.querySelector("#flashcardAnswer"),
  answerForm: document.querySelector("#answerForm"),
  answerInput: document.querySelector("#answerInput"),
  feedback: document.querySelector("#feedback"),
  skipButton: document.querySelector("#skipButton"),
  nextButton: document.querySelector("#nextButton"),
  testMethodInputs: document.querySelectorAll('input[name="testMethod"]'),
  resultPanel: document.querySelector("#resultPanel"),
  resultSummary: document.querySelector("#resultSummary"),
  resultList: document.querySelector("#resultList"),
  retryWrongButton: document.querySelector("#retryWrongButton"),
  wordForm: document.querySelector("#wordForm"),
  englishInput: document.querySelector("#englishInput"),
  vietnameseInput: document.querySelector("#vietnameseInput"),
  typeInput: document.querySelector("#typeInput"),
  exampleInput: document.querySelector("#exampleInput"),
  clearCustomButton: document.querySelector("#clearCustomButton"),
  importTextarea: document.querySelector("#importTextarea"),
  importButton: document.querySelector("#importButton"),
  exportDataButton: document.querySelector("#exportDataButton"),
  clearImportedButton: document.querySelector("#clearImportedButton"),
  importStatus: document.querySelector("#importStatus"),
};

const disclosureTimers = new WeakMap();

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function clampNumber(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) {
    return min;
  }
  return Math.min(max, Math.max(min, number));
}

function getUnitCount() {
  return clampNumber(localStorage.getItem(STORAGE_KEYS.unitCount) || DEFAULT_UNIT_COUNT, MIN_UNIT_COUNT, MAX_UNIT_COUNT);
}

function getUnitIdByNumber(number) {
  return `unit-${String(number).padStart(2, "0")}`;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createEmptyUnits() {
  return Array.from({ length: getUnitCount() }, (_, index) => {
    const number = index + 1;
    return {
      id: getUnitIdByNumber(number),
      number,
      title: `Unit ${number}`,
      description:
        "Chưa có dữ liệu luyện tập cho unit này. Mở PDF gốc để học hoặc import dữ liệu bạn được phép sử dụng.",
      words: [],
    };
  });
}

function shapeWord(word, unitId) {
  if (Array.isArray(word)) {
    const [english, vietnamese, type, example] = word;
    return { english, vietnamese, type, example, unitId };
  }
  return {
    english: word.english || "",
    vietnamese: word.vietnamese || "",
    type: word.type || "word",
    example: word.example || "",
    alternatives: Array.isArray(word.alternatives) ? word.alternatives : [],
    unitId: word.unitId || unitId,
  };
}

function normalizeUnit(unit, index) {
  const number = Number(unit.number || index + 1);
  const id = unit.id || `unit-${String(number).padStart(2, "0")}`;
  return {
    id,
    number,
    title: unit.title || `Unit ${number}`,
    description: unit.description || "Dữ liệu import.",
    words: Array.isArray(unit.words) ? unit.words.map((word) => shapeWord(word, id)) : [],
  };
}

function getImportedUnits() {
  const imported = loadJson(STORAGE_KEYS.imported, []);
  const baseUnits = createEmptyUnits();
  const unitCount = getUnitCount();

  if (!Array.isArray(imported) || !imported.length) {
    return baseUnits;
  }

  imported.map(normalizeUnit).filter((unit) => unit.number <= unitCount).forEach((importedUnit) => {
    const targetIndex = baseUnits.findIndex((unit) => unit.id === importedUnit.id);
    if (targetIndex >= 0) {
      baseUnits[targetIndex] = importedUnit;
    } else {
      baseUnits.push(importedUnit);
    }
  });

  return baseUnits.sort((a, b) => a.number - b.number);
}

function getCustomWords() {
  return loadJson(STORAGE_KEYS.custom, []);
}

function getMasteredMap() {
  return loadJson(STORAGE_KEYS.mastered, {});
}

function getUnits() {
  const units = getImportedUnits();

  getCustomWords().forEach((word) => {
    const unit = units.find((item) => item.id === word.unitId);
    if (unit) {
      unit.words.push(shapeWord(word, unit.id));
    }
  });

  return units;
}

function getCurrentUnit() {
  const units = getUnits();
  return units.find((unit) => unit.id === state.unitId) || units[0];
}

function makeWordId(word) {
  return `${word.unitId}:${normalize(word.english)}`;
}

function getLocalDateKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getActivityHistory() {
  const history = loadJson(STORAGE_KEYS.activity, {});
  return history && typeof history === "object" && !Array.isArray(history) ? history : {};
}

function hasActivity(entry) {
  return Boolean(entry && ((entry.xp || 0) > 0 || (entry.sessions || 0) > 0 || (entry.mastered || 0) > 0));
}

function recordActivity({ xp = 0, sessions = 0, mastered = 0 } = {}) {
  const history = getActivityHistory();
  const today = getLocalDateKey();
  const entry = history[today] || { xp: 0, sessions: 0, mastered: 0 };
  entry.xp = Math.max(0, (entry.xp || 0) + xp);
  entry.sessions = Math.max(0, (entry.sessions || 0) + sessions);
  entry.mastered = Math.max(0, (entry.mastered || 0) + mastered);
  history[today] = entry;
  saveJson(STORAGE_KEYS.activity, history);
  return entry;
}

function getActivitySummary() {
  const history = getActivityHistory();
  const todayKey = getLocalDateKey();
  const today = history[todayKey] || { xp: 0, sessions: 0, mastered: 0 };
  let streak = 0;
  let offset = hasActivity(today) ? 0 : -1;

  for (; offset > -365; offset -= 1) {
    const entry = history[getLocalDateKey(offset)];
    if (!hasActivity(entry)) {
      break;
    }
    streak += 1;
  }

  return { today, streak };
}

function getUnitStats(unit = getCurrentUnit()) {
  const mastered = getMasteredMap();
  const progress = loadJson(STORAGE_KEYS.progress, {});
  const unitProgress = progress[unit.id] || { score: 0, total: 0 };
  const wordCount = unit.words.length;
  const masteredWords = unit.words.filter((word) => mastered[makeWordId(word)]);
  const unmasteredWords = unit.words.filter((word) => !mastered[makeWordId(word)]);
  const masteredRate = wordCount ? masteredWords.length / wordCount : 0;
  const scoreRate = unitProgress.total ? unitProgress.score / unitProgress.total : 0;
  const readiness = wordCount
    ? Math.round((unitProgress.total ? masteredRate * 0.6 + scoreRate * 0.4 : masteredRate) * 100)
    : 0;

  return {
    wordCount,
    masteredCount: masteredWords.length,
    unmasteredCount: unmasteredWords.length,
    focusWords: unmasteredWords.slice(0, 4),
    unitProgress,
    scoreRate,
    readiness: Math.min(100, Math.max(0, readiness)),
  };
}

function getRecommendedMethod(stats = getUnitStats()) {
  if (!stats.wordCount || stats.masteredCount < Math.max(3, Math.ceil(stats.wordCount * 0.25))) {
    return "flashcard";
  }
  if (stats.readiness < 58) {
    return "choice";
  }
  if (stats.readiness < 82) {
    return "truefalse";
  }
  return "typing";
}

function syncSettingsControls() {
  if (els.unitCountInput) {
    els.unitCountInput.value = String(getUnitCount());
  }

  const currentAccent = ["teal", "violet", "coral"].includes(document.documentElement.dataset.accent)
    ? document.documentElement.dataset.accent
    : "teal";
  els.accentChoiceInputs.forEach((input) => {
    input.checked = input.value === currentAccent;
  });
}

function setUnitCount(value) {
  const unitCount = clampNumber(value, MIN_UNIT_COUNT, MAX_UNIT_COUNT);
  localStorage.setItem(STORAGE_KEYS.unitCount, String(unitCount));

  const units = getUnits();
  if (!units.some((unit) => unit.id === state.unitId)) {
    state.unitId = getUnitIdByNumber(unitCount);
    localStorage.setItem(STORAGE_KEYS.selectedUnit, state.unitId);
  }

  initUnitControls();
  renderAll();
}

function getCoachCopy(unit, stats, method) {
  if (!stats.wordCount) {
    return {
      title: "Unit này cần dữ liệu học",
      message: "Thêm từ thủ công hoặc import JSON, sau đó app sẽ dựng lộ trình luyện ngay.",
      focusTitle: "Chưa có từ để luyện",
      focusText: "Mở tab Thêm từ hoặc Import để chuẩn bị bài.",
    };
  }

  if (stats.readiness >= 82) {
    return {
      title: "Unit này đã gần sẵn sàng",
      message: `Bạn đã nắm ${stats.masteredCount}/${stats.wordCount} từ. Chuyển sang ${TEST_METHODS[method].label.toLowerCase()} để kiểm tra nhớ chủ động.`,
      focusTitle: "Tăng độ khó",
      focusText: "Typing giúp khóa lại chính tả và khả năng nhớ từ.",
    };
  }

  if (stats.masteredCount > 0 || stats.unitProgress.total) {
    const focus = stats.focusWords.map((word) => word.english).join(", ") || "những từ đã sai";
    return {
      title: "Ôn đúng điểm yếu trước",
      message: `Còn ${stats.unmasteredCount} từ cần ôn trong ${unit.title}. Ưu tiên: ${focus}.`,
      focusTitle: "Tập trung từ yếu",
      focusText: focus,
    };
  }

  return {
    title: "Khởi động bằng nhận diện",
    message: `Unit này có ${stats.wordCount} từ. Bắt đầu với flashcard rồi chuyển sang trắc nghiệm khi đã quen mặt chữ.`,
    focusTitle: "Bắt đầu nhẹ nhàng",
    focusText: "Flashcard trước, trắc nghiệm sau, typing cuối cùng.",
  };
}

function initUnitControls() {
  const units = getUnits();
  els.unitInput.innerHTML = "";
  els.importUnitInput.innerHTML = "";
  els.unitList.innerHTML = "";

  units.forEach((unit) => {
    const stats = getUnitStats(unit);
    const label = `Unit ${unit.number}: ${unit.title}`;
    const detail =
      unit.title === `Unit ${unit.number}`
        ? unit.words.length
          ? `${unit.words.length} từ`
          : "Chưa có từ"
        : unit.title;
    const option = new Option(label, unit.id);
    els.unitInput.append(option.cloneNode(true));
    els.importUnitInput.append(option.cloneNode(true));

    const button = document.createElement("button");
    button.className = `unit-card ${unit.id === state.unitId ? "active" : ""}`;
    button.type = "button";
    button.dataset.unitId = unit.id;
    button.style.setProperty("--unit-progress", `${stats.readiness}%`);
    button.innerHTML = `
      <span class="unit-card-top">
        <strong>Unit ${unit.number}</strong>
        <em>${stats.readiness}%</em>
      </span>
      <span>${escapeHtml(detail)}</span>
      <i class="unit-card-progress" aria-hidden="true"><b></b></i>
    `;
    els.unitList.append(button);
  });

  if (!units.some((unit) => unit.id === state.unitId)) {
    state.unitId = units[units.length - 1].id;
    localStorage.setItem(STORAGE_KEYS.selectedUnit, state.unitId);
  }

  els.unitInput.value = state.unitId;
  els.importUnitInput.value = state.unitId;
  syncSettingsControls();
}

function setUnit(unitId) {
  state.unitId = unitId;
  state.testWords = [];
  state.results = [];
  state.currentQuestion = null;
  localStorage.setItem(STORAGE_KEYS.selectedUnit, unitId);
  initUnitControls();
  renderAll();
  setUnitPanel(false);
}

function setDisclosure(panel, button, open) {
  if (!panel || !button) {
    return;
  }

  const timer = disclosureTimers.get(panel);
  if (timer) {
    window.clearTimeout(timer);
  }

  if (open) {
    panel.hidden = false;
    button.classList.add("open");
    button.setAttribute("aria-expanded", "true");
    window.requestAnimationFrame(() => {
      if (!panel.hidden) {
        panel.classList.add("open");
      }
    });
    return;
  }

  panel.classList.remove("open");
  button.classList.remove("open");
  button.setAttribute("aria-expanded", "false");

  const closeTimer = window.setTimeout(() => {
    if (!panel.classList.contains("open")) {
      panel.hidden = true;
    }
  }, 210);
  disclosureTimers.set(panel, closeTimer);
}

function setUnitPanel(open) {
  if (open) {
    setDisclosure(els.modeMenuPanel, els.modeMenuButton, false);
  }
  setDisclosure(els.unitListPanel, els.unitMenuButton, open);
}

function setModePanel(open) {
  if (open) {
    setDisclosure(els.unitListPanel, els.unitMenuButton, false);
    syncSettingsControls();
  }
  setDisclosure(els.modeMenuPanel, els.modeMenuButton, open);
}

function switchPanel(panelName) {
  const map = {
    pdf: [els.pdfTab, els.pdfPanel],
    learn: [els.learnTab, els.learnPanel],
    test: [els.testTab, els.testPanel],
    add: [els.addTab, els.addPanel],
    import: [els.importTab, els.importPanel],
  };

  Object.values(map).forEach(([tab, panel]) => {
    tab.classList.remove("active");
    panel.classList.remove("active");
  });

  const [tab, panel] = map[panelName];
  tab.classList.add("active");
  panel.classList.add("active");
  els.currentModeLabel.textContent = MODE_LABELS[panelName] || MODE_LABELS.pdf;
  setModePanel(false);
}

function renderAll() {
  renderUnitHeader();
  renderWordTable();
  updateStats();
  renderLearningHub();
}

function renderUnitHeader() {
  const unit = getCurrentUnit();
  els.unitTitle.textContent = `Unit ${unit.number}: ${unit.title}`;
  els.currentUnitLabel.textContent = `Unit ${unit.number}`;
  els.unitDescription.textContent = unit.description;
  els.learnHeading.textContent = `Từ vựng Unit ${unit.number}`;
}

function renderWordTable() {
  const unit = getCurrentUnit();
  const mastered = getMasteredMap();
  const query = normalize(els.searchInput.value);
  const words = unit.words.filter((word) => {
    const haystack = normalize(`${word.english} ${word.vietnamese} ${word.type} ${word.example}`);
    return !query || haystack.includes(query);
  });

  if (!words.length) {
    els.wordTable.innerHTML =
      '<div class="empty-state">Unit này chưa có dữ liệu từ vựng. Bạn có thể thêm từ thủ công hoặc import JSON trong tab Import.</div>';
    return;
  }

  els.wordTable.innerHTML = "";

  words.forEach((word, index) => {
    const wordId = makeWordId(word);
    const row = document.createElement("div");
    row.className = `word-row ${mastered[wordId] ? "mastered" : ""}`;
    row.innerHTML = `
      <div class="word-card-top">
        <span class="index-pill">${index + 1}</span>
        <span class="type-tag">${escapeHtml(word.type || "word")}</span>
      </div>
      <h3 class="word-main">${escapeHtml(word.english)}</h3>
      <p class="meaning">${escapeHtml(word.vietnamese)}</p>
      <p class="example">${escapeHtml(word.example || "Tự đặt một câu với từ này.")}</p>
      <label class="master-check">
        <input type="checkbox" data-mastered="${escapeHtml(wordId)}" ${mastered[wordId] ? "checked" : ""} />
        <span>${mastered[wordId] ? "Đã thuộc" : "Đánh dấu thuộc"}</span>
      </label>
    `;
    els.wordTable.append(row);
  });
}

function updateStats() {
  const unit = getCurrentUnit();
  const stats = getUnitStats(unit);
  const unitProgress = stats.unitProgress;

  els.wordCount.textContent = stats.wordCount;
  els.masteredCount.textContent = stats.masteredCount;
  els.scoreCount.textContent = `${unitProgress.score}/${unitProgress.total || unit.words.length}`;
  els.readyPercent.textContent = `${stats.readiness}%`;
}

function renderLearningHub() {
  const unit = getCurrentUnit();
  const stats = getUnitStats(unit);
  const method = getRecommendedMethod(stats);
  const coach = getCoachCopy(unit, stats, method);
  const activity = getActivitySummary();
  const units = getUnits();
  const currentIndex = Math.max(0, units.findIndex((item) => item.id === unit.id));
  const windowStart = Math.max(0, Math.min(currentIndex - 2, Math.max(units.length - 6, 0)));
  const nearbyUnits = units.slice(windowStart, windowStart + 6);

  els.readinessRing?.style.setProperty("--ready", `${stats.readiness}%`);
  els.readinessRing?.setAttribute("aria-valuenow", String(stats.readiness));
  els.readinessRingValue.textContent = `${stats.readiness}%`;
  els.heroFocusTitle.textContent = coach.focusTitle;
  els.heroFocusText.textContent = coach.focusText;
  els.heroXpBadge.textContent = activity.today.xp || 0;
  els.coachTitle.textContent = coach.title;
  els.coachMessage.textContent = coach.message;
  els.coachStartButton.textContent = stats.wordCount
    ? `Luyện ${TEST_METHODS[method].label}`
    : "Thêm dữ liệu";
  els.coachReviewButton.disabled = !stats.wordCount;
  els.streakDays.textContent = activity.streak;
  els.todayXp.textContent = activity.today.xp || 0;
  els.reviewCount.textContent = stats.unmasteredCount;
  els.pathProgressLabel.textContent = `${stats.readiness}%`;
  els.pathProgressBar.style.width = `${stats.readiness}%`;
  els.pathNodes.innerHTML = "";

  nearbyUnits.forEach((pathUnit) => {
    const pathStats = getUnitStats(pathUnit);
    const button = document.createElement("button");
    const statusClass = pathStats.readiness >= 82 ? "done" : pathStats.readiness > 0 ? "started" : "fresh";
    button.className = `path-node ${statusClass} ${pathUnit.id === unit.id ? "active" : ""}`;
    button.type = "button";
    button.dataset.pathUnitId = pathUnit.id;
    button.style.setProperty("--node-progress", `${pathStats.readiness}%`);
    button.innerHTML = `
      <span>${pathUnit.number}</span>
      <strong>Unit ${pathUnit.number}</strong>
      <em>${pathStats.wordCount ? `${pathStats.readiness}%` : "trống"}</em>
    `;
    els.pathNodes.append(button);
  });
}

function getTestWords() {
  const unit = getCurrentUnit();
  const mastered = getMasteredMap();
  let words = unit.words;

  if (els.onlyUnmasteredInput.checked) {
    words = words.filter((word) => !mastered[makeWordId(word)]);
  }

  if (!words.length && unit.words.length) {
    words = unit.words;
  }

  return els.shuffleInput.checked ? shuffle(words) : [...words];
}

function getSelectedTestMethod() {
  const selected = Array.from(els.testMethodInputs).find((input) => input.checked);
  return TEST_METHODS[selected?.value] ? selected.value : "choice";
}

function syncTestMethodControls(method = state.testMethod) {
  const safeMethod = TEST_METHODS[method] ? method : "choice";
  state.testMethod = safeMethod;
  els.testMethodInputs.forEach((input) => {
    input.checked = input.value === safeMethod;
  });
}

function changeTestMethod(method) {
  syncTestMethodControls(method);
  if (state.testWords.length && !state.answered && !els.questionCard.classList.contains("hidden")) {
    renderQuestion();
  }
}

function getActiveTestMethod() {
  return TEST_METHODS[state.testMethod] ? state.testMethod : "choice";
}

function startTest(words = getTestWords(), method = getSelectedTestMethod()) {
  if (!words.length) {
    switchPanel("learn");
    els.wordTable.innerHTML =
      '<div class="empty-state">Unit này chưa có dữ liệu để test. Hãy thêm từ thủ công hoặc import JSON trước.</div>';
    return;
  }

  syncTestMethodControls(method);
  state.testWords = words;
  state.currentIndex = 0;
  state.score = 0;
  state.results = [];
  state.answered = false;
  state.currentQuestion = null;

  els.resultPanel.classList.add("hidden");
  els.questionCard.classList.remove("hidden");
  switchPanel("test");
  renderQuestion();
}

function shuffle(words) {
  const copy = [...words];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function getCorrectAnswers(word) {
  return [word.english, ...(word.alternatives || [])].filter(Boolean).map(normalize);
}

function getDistractorWords(word) {
  const correctAnswers = getCorrectAnswers(word);
  return getCurrentUnit().words.filter(
    (candidate) => !correctAnswers.includes(normalize(candidate.english)),
  );
}

function getChoiceOptions(word) {
  const options = [word.english];

  shuffle(getDistractorWords(word)).forEach((candidate) => {
    if (options.length >= 4) {
      return;
    }
    if (!options.map(normalize).includes(normalize(candidate.english))) {
      options.push(candidate.english);
    }
  });

  return shuffle(options);
}

function buildQuestion(word, method) {
  if (method === "choice") {
    return {
      method,
      word,
      promptText: word.vietnamese,
      options: getChoiceOptions(word),
      correctAnswers: getCorrectAnswers(word),
    };
  }

  if (method === "truefalse") {
    const distractors = getDistractorWords(word);
    const shouldUseCorrectWord = !distractors.length || Math.random() >= 0.5;
    const displayWord = shouldUseCorrectWord ? word : shuffle(distractors)[0];

    return {
      method,
      word,
      promptText: `${displayWord.english} = ${word.vietnamese}`,
      isStatementCorrect: shouldUseCorrectWord,
    };
  }

  return {
    method,
    word,
    promptText: word.vietnamese,
    correctAnswers: getCorrectAnswers(word),
  };
}

function renderChoiceButtons(question) {
  els.choiceGrid.innerHTML = "";

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.type = "button";
    button.dataset.testAnswer = option;
    button.dataset.correct = String(question.correctAnswers.includes(normalize(option)));
    button.textContent = option;
    els.choiceGrid.append(button);
  });
}

function renderTrueFalseButtons(question) {
  els.choiceGrid.innerHTML = "";

  [
    ["Đúng", true],
    ["Sai", false],
  ].forEach(([label, value]) => {
    const button = document.createElement("button");
    button.className = "choice-button compact";
    button.type = "button";
    button.dataset.testAnswer = label;
    button.dataset.correct = String(value === question.isStatementCorrect);
    button.textContent = label;
    els.choiceGrid.append(button);
  });
}

function renderFlashcardControls(word) {
  els.flashcardAnswer.innerHTML = "";

  const revealButton = document.createElement("button");
  revealButton.className = "ghost-button flashcard-reveal";
  revealButton.type = "button";
  revealButton.dataset.flashcardAction = "reveal";
  revealButton.textContent = "Hiện đáp án";

  const answerBox = document.createElement("div");
  answerBox.className = "flashcard-word hidden";
  answerBox.innerHTML = `
    <span>Đáp án</span>
    <strong>${escapeHtml(word.english)}</strong>
  `;

  const actions = document.createElement("div");
  actions.className = "flashcard-actions hidden";

  const missedButton = document.createElement("button");
  missedButton.className = "ghost-button";
  missedButton.type = "button";
  missedButton.dataset.flashcardAction = "missed";
  missedButton.dataset.correct = "false";
  missedButton.textContent = "Chưa nhớ";

  const rememberedButton = document.createElement("button");
  rememberedButton.className = "primary-button";
  rememberedButton.type = "button";
  rememberedButton.dataset.flashcardAction = "remembered";
  rememberedButton.dataset.correct = "true";
  rememberedButton.textContent = "Đã nhớ";

  actions.append(missedButton, rememberedButton);
  els.flashcardAnswer.append(revealButton, answerBox, actions);
}

function setQuestionModeVisibility(method) {
  els.answerForm.classList.toggle("hidden", method !== "typing");
  els.choiceGrid.classList.toggle("hidden", method !== "choice" && method !== "truefalse");
  els.flashcardAnswer.classList.toggle("hidden", method !== "flashcard");
  els.answerInput.required = method === "typing";
}

function renderQuestion() {
  const word = state.testWords[state.currentIndex];
  const total = state.testWords.length;

  if (!word) {
    finishTest();
    return;
  }

  const method = getActiveTestMethod();
  const question = buildQuestion(word, method);
  state.currentQuestion = question;
  els.questionIndex.textContent = `Câu ${state.currentIndex + 1}/${total}`;
  els.questionScore.textContent = `${state.score} đúng`;
  els.questionProgressBar.style.width = `${Math.round((state.currentIndex / total) * 100)}%`;
  els.questionPrompt.textContent = TEST_METHODS[method].prompt;
  els.questionMeaning.textContent = question.promptText;
  els.questionMeta.textContent = `${word.type || "word"} - ${word.example || "Không có ví dụ"}`;
  els.answerInput.value = "";
  els.answerInput.disabled = method !== "typing";
  els.skipButton.disabled = false;
  els.nextButton.classList.add("hidden");
  els.feedback.textContent = "";
  els.feedback.className = "feedback";
  state.answered = false;
  setQuestionModeVisibility(method);

  if (method === "choice") {
    renderChoiceButtons(question);
  } else if (method === "truefalse") {
    renderTrueFalseButtons(question);
  } else {
    els.choiceGrid.innerHTML = "";
  }

  if (method === "flashcard") {
    renderFlashcardControls(word);
  } else {
    els.flashcardAnswer.innerHTML = "";
  }

  if (method === "typing") {
    els.answerInput.focus();
  }
}

function submitAnswer(event) {
  event.preventDefault();
  if (state.answered || getActiveTestMethod() !== "typing") {
    return;
  }

  const word = state.testWords[state.currentIndex];
  const userAnswer = normalize(els.answerInput.value);
  const answers = getCorrectAnswers(word);
  const isCorrect = answers.includes(userAnswer);

  completeQuestion({
    userAnswer: els.answerInput.value.trim() || "(bỏ trống)",
    isCorrect,
  });
}

function handleChoiceAnswer(event) {
  if (!(event.target instanceof Element)) {
    return;
  }

  const button = event.target.closest("[data-test-answer]");
  if (!button || state.answered) {
    return;
  }

  completeQuestion({
    userAnswer: button.dataset.testAnswer,
    isCorrect: button.dataset.correct === "true",
    selectedButton: button,
  });
}

function handleFlashcardAnswer(event) {
  if (!(event.target instanceof Element)) {
    return;
  }

  const button = event.target.closest("[data-flashcard-action]");
  if (!button || state.answered) {
    return;
  }

  if (button.dataset.flashcardAction === "reveal") {
    els.flashcardAnswer.querySelector(".flashcard-word")?.classList.remove("hidden");
    els.flashcardAnswer.querySelector(".flashcard-actions")?.classList.remove("hidden");
    button.classList.add("hidden");
    return;
  }

  const isCorrect = button.dataset.flashcardAction === "remembered";
  completeQuestion({
    userAnswer: isCorrect ? "Đã nhớ" : "Chưa nhớ",
    isCorrect,
    selectedButton: button,
  });
}

function disableQuestionControls(selectedButton) {
  els.answerInput.disabled = true;
  els.skipButton.disabled = true;
  els.nextButton.classList.remove("hidden");

  [...els.choiceGrid.querySelectorAll("button"), ...els.flashcardAnswer.querySelectorAll("button")].forEach(
    (button) => {
      button.disabled = true;
      if (button.dataset.correct === "true") {
        button.classList.add("correct");
      }
      if (button === selectedButton && button.dataset.correct !== "true") {
        button.classList.add("wrong");
      }
    },
  );
}

function completeQuestion({ userAnswer, isCorrect, selectedButton = null, skipped = false }) {
  if (state.answered) {
    return;
  }

  const word = state.testWords[state.currentIndex];
  state.answered = true;
  disableQuestionControls(selectedButton);

  if (isCorrect) {
    state.score += 1;
    els.feedback.textContent =
      getActiveTestMethod() === "flashcard" ? `Đã ghi nhận: ${word.english}` : `Đúng: ${word.english}`;
    els.feedback.classList.add("correct");
  } else {
    els.feedback.textContent = skipped
      ? `Đáp án đúng là: ${word.english}`
      : `Sai. Đáp án đúng là: ${word.english}`;
    els.feedback.classList.add("wrong");
  }

  state.results.push({
    word,
    userAnswer,
    isCorrect,
    method: getActiveTestMethod(),
  });
  els.questionScore.textContent = `${state.score} đúng`;
  els.questionProgressBar.style.width = `${Math.round(((state.currentIndex + 1) / state.testWords.length) * 100)}%`;
}

function skipQuestion() {
  if (state.answered) {
    return;
  }

  completeQuestion({ userAnswer: "(bỏ qua)", isCorrect: false, skipped: true });
}

function nextQuestion() {
  if (!state.answered) {
    skipQuestion();
    return;
  }
  state.currentIndex += 1;
  renderQuestion();
}

function finishTest() {
  const total = state.results.length;
  const wrong = state.results.filter((result) => !result.isCorrect);
  const progress = loadJson(STORAGE_KEYS.progress, {});
  progress[state.unitId] = {
    score: state.score,
    total,
    updatedAt: new Date().toISOString(),
  };
  saveJson(STORAGE_KEYS.progress, progress);
  if (total) {
    recordActivity({ xp: Math.max(6, state.score * 12 + (total - state.score) * 3), sessions: 1 });
  }

  els.questionCard.classList.add("hidden");
  els.resultPanel.classList.remove("hidden");
  els.resultSummary.textContent = `Bạn đúng ${state.score}/${total} câu trong ${getCurrentUnit().title}. ${
    wrong.length ? "Các câu sai đã được liệt kê bên dưới." : "Không có câu sai."
  }`;
  els.resultList.innerHTML = "";

  state.results.forEach((result) => {
    const method = TEST_METHODS[result.method] || TEST_METHODS.typing;
    const item = document.createElement("div");
    item.className = `result-item ${result.isCorrect ? "correct" : "wrong"}`;
    item.innerHTML = `
      <strong>${result.isCorrect ? "Đúng" : "Sai"}</strong>
      <span>${escapeHtml(result.word.vietnamese)} -> ${escapeHtml(result.word.english)}
      <br />${method.resultLabel}: ${escapeHtml(result.userAnswer)}</span>
    `;
    els.resultList.append(item);
  });

  els.retryWrongButton.disabled = wrong.length === 0;
  updateStats();
  renderLearningHub();
}

function addCustomWord(event) {
  event.preventDefault();

  const word = {
    unitId: els.unitInput.value,
    english: els.englishInput.value.trim(),
    vietnamese: els.vietnameseInput.value.trim(),
    type: els.typeInput.value.trim() || "custom",
    example: els.exampleInput.value.trim(),
  };

  if (!word.english || !word.vietnamese) {
    return;
  }

  const customWords = getCustomWords();
  customWords.push(word);
  saveJson(STORAGE_KEYS.custom, customWords);
  els.wordForm.reset();
  els.unitInput.value = state.unitId;
  initUnitControls();
  renderAll();
  switchPanel("learn");
}

function clearCustomWords() {
  if (!window.confirm("Xóa toàn bộ từ bạn đã tự thêm?")) {
    return;
  }
  localStorage.removeItem(STORAGE_KEYS.custom);
  initUnitControls();
  renderAll();
}

function handlePdfFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  savePdfFile(file)
    .then(() => showPdfFile({ name: file.name, blob: file }))
    .catch((error) => {
      els.pdfFileName.textContent = `Không lưu được PDF: ${error.message}`;
    });
}

function openPdfDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PDF_DB_NAME, PDF_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PDF_STORE_NAME)) {
        db.createObjectStore(PDF_STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePdfFile(file) {
  const db = await openPdfDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PDF_STORE_NAME, "readwrite");
    const store = transaction.objectStore(PDF_STORE_NAME);
    store.put({
      id: PDF_RECORD_KEY,
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
      savedAt: new Date().toISOString(),
      blob: file,
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function loadSavedPdfFile() {
  const db = await openPdfDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PDF_STORE_NAME, "readonly");
    const store = transaction.objectStore(PDF_STORE_NAME);
    const request = store.get(PDF_RECORD_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

function configurePdfJs() {
  if (!window.pdfjsLib) {
    throw new Error("Không tải được PDF.js. Kiểm tra kết nối mạng rồi mở lại trang.");
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  return window.pdfjsLib;
}

function configureTurnJs() {
  if (!window.jQuery || !window.jQuery.fn || !window.jQuery.fn.turn) {
    throw new Error("Không tải được hiệu ứng lật sách Turn.js.");
  }
  return window.jQuery;
}

function getPdfFlipbook() {
  return window.jQuery ? window.jQuery(els.pdfFlipbook) : null;
}

function isPdfFlipbookReady() {
  const flipbook = getPdfFlipbook();
  if (!flipbook || !window.jQuery.fn.turn) {
    return false;
  }

  try {
    return Boolean(flipbook.turn("is"));
  } catch {
    return false;
  }
}

function clampPdfPage(page) {
  const total = state.pdfDoc?.numPages || 1;
  return Math.min(Math.max(Number(page) || 1, 1), total);
}

function isPdfSpreadMode() {
  return window.matchMedia(PDF_SPREAD_QUERY).matches && (state.pdfDoc?.numPages || 0) > 1;
}

function getPdfDisplayMode() {
  return isPdfSpreadMode() ? "double" : "single";
}

function getFallbackPdfView(page = state.pdfPage) {
  const total = state.pdfDoc?.numPages || 0;
  const safePage = clampPdfPage(page);
  if (!isPdfSpreadMode()) {
    return [safePage];
  }

  const leftPage = safePage % 2 ? safePage - 1 : safePage;
  const rightPage = leftPage + 1;
  return [leftPage > 0 ? leftPage : 0, rightPage <= total ? rightPage : 0];
}

function getPdfTurnView(page = state.pdfPage) {
  if (!isPdfFlipbookReady()) {
    return getFallbackPdfView(page);
  }

  try {
    return getPdfFlipbook().turn("view", clampPdfPage(page));
  } catch {
    return getFallbackPdfView(page);
  }
}

function getVisiblePdfPages(page = state.pdfPage) {
  return getPdfTurnView(page).filter((item) => item > 0 && item <= (state.pdfDoc?.numPages || 0));
}

function cancelPdfRenderTasks() {
  state.pdfRenderTasks.forEach((task) => {
    try {
      task.cancel();
    } catch {
      // Render tasks may already be settled.
    }
  });
  state.pdfRenderTasks = [];
}

function setPdfReaderStatus(message) {
  els.pdfEmptyState.textContent = message;
  els.pdfEmptyState.classList.remove("hidden");
  els.pdfFlipbook.classList.add("hidden");
}

function updatePdfControls() {
  const hasPdf = Boolean(state.pdfDoc);
  const total = state.pdfDoc?.numPages || 0;
  const page = clampPdfPage(state.pdfPage);
  const visiblePages = hasPdf ? getVisiblePdfPages(page) : [];
  const firstVisiblePage = visiblePages.length ? Math.min(...visiblePages) : page;
  const lastVisiblePage = visiblePages.length ? Math.max(...visiblePages) : page;
  const canNavigate = hasPdf && !state.pdfTurning;
  const canGoBack = canNavigate && firstVisiblePage > 1;
  const canGoForward = canNavigate && lastVisiblePage < total;
  const progressPage = Math.max(page, lastVisiblePage);
  const progressPercent = hasPdf ? Math.max((progressPage / total) * 100, 2) : 0;

  state.pdfPage = page;
  els.pdfPrevButton.disabled = !canGoBack;
  els.pdfTurnPrevButton.disabled = !canGoBack;
  els.pdfNextButton.disabled = !canGoForward;
  els.pdfTurnNextButton.disabled = !canGoForward;
  els.pdfPageInput.disabled = !canNavigate;
  els.pdfPageInput.max = String(Math.max(total, 1));
  els.pdfPageInput.value = String(hasPdf ? page : 1);
  els.pdfPageTotal.textContent = `/ ${total}`;
  els.pdfZoomOutButton.disabled = !canNavigate || state.pdfZoom <= PDF_MIN_ZOOM;
  els.pdfZoomInButton.disabled = !canNavigate || state.pdfZoom >= PDF_MAX_ZOOM;
  els.pdfFitButton.disabled = !canNavigate || state.pdfZoom === 1;
  els.pdfFullscreenButton.disabled = !hasPdf || !document.fullscreenEnabled;
  els.pdfFullscreenButton.classList.toggle("active", document.fullscreenElement === els.pdfBook);
  els.pdfFullscreenButton.setAttribute(
    "aria-label",
    document.fullscreenElement === els.pdfBook ? "Thoát toàn màn hình" : "Toàn màn hình",
  );
  els.pdfFullscreenButton.title =
    document.fullscreenElement === els.pdfBook ? "Thoát toàn màn hình" : "Toàn màn hình";
  els.pdfZoomLabel.textContent = `${Math.round(state.pdfZoom * 100)}%`;
  els.pdfProgressBar.style.width = `${progressPercent}%`;
  els.pdfFullscreenProgressBar.style.width = `${progressPercent}%`;
  els.pdfFullscreenTools?.classList.toggle("editing-open", state.pdfEditOpen);
  els.pdfEditButton.disabled = !hasPdf;
  els.pdfEditButton.classList.toggle("active", state.pdfEditOpen);
  els.pdfEditButton.setAttribute("aria-expanded", String(state.pdfEditOpen));
  els.pdfEditPanel.hidden = !state.pdfEditOpen;
  els.pdfEditSizeInput.disabled = !hasPdf;
  els.pdfEditSizeInput.value = String(state.pdfEditSize);
  els.pdfEditSizeValue.textContent = String(state.pdfEditSize);
  els.pdfClearAnnotationsButton.disabled = !hasPdf;
  els.pdfEditToolButtons.forEach((button) => {
    const active = button.dataset.pdfTool === state.pdfEditTool;
    button.disabled = !hasPdf;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  els.pdfEditColorButtons.forEach((button) => {
    const active = button.dataset.pdfColor === state.pdfEditColor;
    button.disabled = !hasPdf;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  els.pdfSearchInput.disabled = !hasPdf;
  els.pdfSearchPrevButton.disabled = !hasPdf || state.pdfSearchResults.length < 2;
  els.pdfSearchNextButton.disabled = !hasPdf || state.pdfSearchResults.length < 2;
  els.pdfSearchCount.textContent =
    state.pdfSearchStatus ||
    (state.pdfSearchResults.length ? `${state.pdfSearchIndex + 1}/${state.pdfSearchResults.length}` : "0/0");
  els.pdfFullscreenCloseButton.disabled = document.fullscreenElement !== els.pdfBook;
  els.pdfReader.classList.toggle("turning", state.pdfTurning);
  els.pdfReader.classList.toggle("editing", state.pdfEditOpen && state.pdfEditTool !== "eraser");
  els.pdfReader.classList.toggle("erasing", state.pdfEditOpen && state.pdfEditTool === "eraser");
  els.pdfBook.classList.toggle("panning", state.pdfPanning);
  els.pdfBook.classList.toggle("hud-visible", state.pdfHudVisible);
}

function createPdfFlipPage(pageNumber) {
  const page = document.createElement("div");
  const inner = document.createElement("div");
  const canvas = document.createElement("canvas");
  const searchLayer = document.createElement("div");
  const annotationLayer = document.createElement("div");
  const loading = document.createElement("span");
  const number = document.createElement("span");

  page.className = "pdf-flip-page";
  page.dataset.pageNumber = String(pageNumber);
  inner.className = "pdf-flip-page-inner";
  searchLayer.className = "pdf-search-layer";
  annotationLayer.className = "pdf-annotation-layer";
  loading.className = "pdf-page-loading";
  loading.textContent = "Đang tải trang...";
  number.className = "pdf-sheet-number";
  number.textContent = `Trang ${pageNumber}`;
  inner.append(canvas, searchLayer, annotationLayer, loading, number);
  page.append(inner);
  return page;
}

function destroyPdfFlipbook() {
  cancelPdfRenderTasks();

  if (isPdfFlipbookReady()) {
    try {
      getPdfFlipbook().turn("destroy");
    } catch {
      // A partially initialized book can fail destroy; replacing children below resets it.
    }
  }

  els.pdfFlipbook.replaceChildren();
  els.pdfFlipbook.removeAttribute("style");
  state.pdfRenderedPages.clear();
  state.pdfViewportCache.clear();
}

function getPdfFlipbookSize() {
  const bookRect = els.pdfBook.getBoundingClientRect();
  const availableWidth = Math.max(280, bookRect.width - 48);
  const availableHeight = Math.max(320, bookRect.height - 48);
  const pageRatio = state.pdfPageRatio || 0.707;
  const displayRatio = getPdfDisplayMode() === "double" ? pageRatio * 2 : pageRatio;
  let width = availableWidth * state.pdfZoom;
  let height = width / displayRatio;

  if (height > availableHeight * state.pdfZoom) {
    height = availableHeight * state.pdfZoom;
    width = height * displayRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

function getPdfPageElement(pageNumber) {
  if (!isPdfFlipbookReady()) {
    return els.pdfFlipbook.querySelector(`[data-page-number="${pageNumber}"]`);
  }

  const data = getPdfFlipbook().turn("data");
  return data?.pageObjs?.[pageNumber]?.[0] || null;
}

function getPdfPageRenderBox(pageElement) {
  const rect = pageElement.getBoundingClientRect();
  if (rect.width && rect.height) {
    return {
      width: Math.max(120, rect.width - 24),
      height: Math.max(160, rect.height - 34),
    };
  }

  const size = getPdfFlipbookSize();
  return {
    width: Math.max(120, (getPdfDisplayMode() === "double" ? size.width / 2 : size.width) - 24),
    height: Math.max(160, size.height - 34),
  };
}

function syncPdfPageLayers(pageElement) {
  if (!pageElement) {
    return;
  }

  const canvas = pageElement.querySelector("canvas");
  if (!canvas || !canvas.offsetWidth || !canvas.offsetHeight) {
    return;
  }

  pageElement.querySelectorAll(".pdf-search-layer, .pdf-annotation-layer").forEach((layer) => {
    layer.style.left = `${canvas.offsetLeft}px`;
    layer.style.top = `${canvas.offsetTop}px`;
    layer.style.width = `${canvas.offsetWidth}px`;
    layer.style.height = `${canvas.offsetHeight}px`;
  });
}

function syncAllPdfPageLayers() {
  els.pdfFlipbook.querySelectorAll(".pdf-flip-page").forEach((pageElement) => {
    syncPdfPageLayers(pageElement);
  });
}
async function renderPdfFlipPage(pageNumber, force = false) {
  if (!state.pdfDoc || pageNumber < 1 || pageNumber > state.pdfDoc.numPages) {
    return;
  }

  const pageElement = getPdfPageElement(pageNumber);
  if (!pageElement || (!force && state.pdfRenderedPages.has(pageNumber))) {
    return;
  }

  if (pageElement.dataset.rendering === "true") {
    return;
  }

  const canvas = pageElement.querySelector("canvas");
  const loading = pageElement.querySelector(".pdf-page-loading");
  const renderId = state.pdfRenderId;
  let renderTask = null;
  pageElement.dataset.rendering = "true";
  pageElement.classList.remove("rendered");
  loading.hidden = false;

  try {
    const page = await state.pdfDoc.getPage(pageNumber);
    if (renderId !== state.pdfRenderId) {
      return;
    }

    const baseViewport = page.getViewport({ scale: 1 });
    const box = getPdfPageRenderBox(pageElement);
    const fitScale = Math.min(box.width / baseViewport.width, box.height / baseViewport.height);
    const viewportScale = Math.max(0.1, fitScale);
    const viewport = page.getViewport({ scale: viewportScale });
    state.pdfViewportCache.set(pageNumber, { scale: viewportScale });
    const outputScale = Math.min(window.devicePixelRatio || 1, 2);
    const context = canvas.getContext("2d", { alpha: false });

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    syncPdfPageLayers(pageElement);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);

    renderTask = page.render({
      canvasContext: context,
      viewport,
      transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
    });

    state.pdfRenderTasks.push(renderTask);
    await renderTask.promise;
    state.pdfRenderedPages.add(pageNumber);
    pageElement.classList.add("rendered");
    loading.hidden = true;
    renderPdfSearchHighlights(pageNumber);
  } catch (error) {
    if (error?.name !== "RenderingCancelledException") {
      loading.textContent = "Không tải được trang";
    }
  } finally {
    if (renderTask) {
      state.pdfRenderTasks = state.pdfRenderTasks.filter((task) => task !== renderTask);
    }
    pageElement.dataset.rendering = "false";
  }
}

function getPagesAroundPdfView(view = getPdfTurnView()) {
  const total = state.pdfDoc?.numPages || 0;
  const visible = view.filter((page) => page > 0 && page <= total);
  const anchor = visible.length ? visible : [state.pdfPage];
  const first = Math.max(1, Math.min(...anchor) - 2);
  const last = Math.min(total, Math.max(...anchor) + 2);
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}

function renderPdfPagesAroundView(view = getPdfTurnView(), force = false) {
  return Promise.all(getPagesAroundPdfView(view).map((page) => renderPdfFlipPage(page, force)));
}

function updatePdfFlipbookLayout(forceRender = false) {
  if (!isPdfFlipbookReady()) {
    updatePdfControls();
    return;
  }

  const size = getPdfFlipbookSize();
  const display = getPdfDisplayMode();
  const flipbook = getPdfFlipbook();
  els.pdfBook.classList.toggle("single-page", display === "single");
  flipbook.turn("display", display);
  flipbook.turn("size", size.width, size.height);

  if (forceRender) {
    state.pdfPanX = 0;
    state.pdfPanY = 0;
    applyPdfPan();
  }

  if (forceRender) {
    state.pdfRenderId += 1;
    cancelPdfRenderTasks();
    state.pdfRenderedPages.clear();
  state.pdfViewportCache.clear();
    els.pdfFlipbook.querySelectorAll(".pdf-flip-page").forEach((page) => {
      page.dataset.rendering = "false";
    });
  }

  renderPdfPagesAroundView(getPdfTurnView(), forceRender).then(renderPdfVisibleSearchHighlights);
  updatePdfControls();
}

async function initPdfFlipbook() {
  const $ = configureTurnJs();
  destroyPdfFlipbook();

  const firstPage = await state.pdfDoc.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 1 });
  state.pdfPageRatio = firstViewport.width / firstViewport.height;
  state.pdfRenderedPages.clear();
  state.pdfViewportCache.clear();

  const fragment = document.createDocumentFragment();
  for (let pageNumber = 1; pageNumber <= state.pdfDoc.numPages; pageNumber += 1) {
    fragment.append(createPdfFlipPage(pageNumber));
  }

  els.pdfFlipbook.append(fragment);
  els.pdfEmptyState.classList.add("hidden");
  els.pdfFlipbook.classList.remove("hidden");

  const size = getPdfFlipbookSize();
  const display = getPdfDisplayMode();
  els.pdfBook.classList.toggle("single-page", display === "single");

  $(els.pdfFlipbook).turn({
    width: size.width,
    height: size.height,
    page: state.pdfPage,
    pages: state.pdfDoc.numPages,
    display,
    acceleration: true,
    gradients: true,
    elevation: 90,
    duration: 720,
    autoCenter: true,
    turnCorners: "bl,br",
    when: {
      start: () => {
        state.pdfTurning = true;
        updatePdfControls();
      },
      turning: (_event, page, view) => {
        state.pdfTurning = true;
        state.pdfPage = clampPdfPage(page);
        renderPdfPagesAroundView(view).then(renderPdfVisibleSearchHighlights);
        updatePdfControls();
      },
      turned: (_event, page, view) => {
        state.pdfTurning = false;
        state.pdfPage = clampPdfPage(page);
        renderPdfPagesAroundView(view).then(renderPdfVisibleSearchHighlights);
        updatePdfControls();
      },
      end: () => {
        state.pdfTurning = false;
        updatePdfControls();
      },
      missing: (_event, pages) => {
        Promise.all(pages.map((page) => renderPdfFlipPage(page)));
      },
    },
  });

  await renderPdfPagesAroundView(getPdfTurnView(), true);
  renderPdfVisibleSearchHighlights();
  updatePdfControls();
}

async function goToPdfPage(page) {
  if (!state.pdfDoc || state.pdfTurning) {
    return;
  }

  const nextPage = clampPdfPage(page);
  if (!isPdfFlipbookReady()) {
    state.pdfPage = nextPage;
    updatePdfControls();
    return;
  }

  await renderPdfPagesAroundView(getPdfTurnView(nextPage));
  getPdfFlipbook().turn("page", nextPage);
}

function resetPdfFullscreenTools() {
  state.pdfEditOpen = false;
  state.pdfEditTool = PDF_DEFAULT_EDIT_TOOL;
  state.pdfEditColor = PDF_DEFAULT_EDIT_COLOR;
  state.pdfEditSize = PDF_DEFAULT_EDIT_SIZE;
  state.pdfAnnotationDraft = null;
  state.pdfSearchQuery = "";
  state.pdfSearchResults = [];
  state.pdfSearchIndex = -1;
  state.pdfSearchStatus = "";
  state.pdfSearchRevision += 1;
  state.pdfSearchMatches.clear();
  state.pdfTextCache.clear();
  state.pdfPanning = false;
  state.pdfPanStart = null;
  state.pdfPanX = 0;
  state.pdfPanY = 0;
  state.pdfHudVisible = false;
  window.clearTimeout(state.pdfHudTimer);
  window.clearTimeout(state.pdfWheelZoomTimer);
  els.pdfFlipbook.style.setProperty("--pdf-pan-x", "0px");
  els.pdfFlipbook.style.setProperty("--pdf-pan-y", "0px");
  els.pdfSearchInput.value = "";
}

function setPdfHudVisible(visible, autoHide = false) {
  window.clearTimeout(state.pdfHudTimer);
  state.pdfHudVisible = visible;
  updatePdfControls();

  if (visible && autoHide) {
    state.pdfHudTimer = window.setTimeout(() => {
      state.pdfHudVisible = false;
      updatePdfControls();
    }, 2200);
  }
}

function handlePdfFullscreenMouseMove(event) {
  if (document.fullscreenElement !== els.pdfBook) {
    return;
  }

  if (event.clientY <= 96 || event.target.closest(".pdf-fullscreen-tools")) {
    setPdfHudVisible(true);
    return;
  }

  if (state.pdfHudVisible) {
    window.clearTimeout(state.pdfHudTimer);
    state.pdfHudTimer = window.setTimeout(() => {
      state.pdfHudVisible = false;
      updatePdfControls();
    }, 650);
  }
}

function handlePdfWheelZoom(event) {
  if (
    !state.pdfDoc ||
    state.pdfTurning ||
    document.fullscreenElement !== els.pdfBook ||
    event.target.closest(".pdf-fullscreen-hud")
  ) {
    return;
  }

  event.preventDefault();
  const direction = event.deltaY < 0 ? 1 : -1;
  const nextZoom = Math.min(
    PDF_MAX_ZOOM,
    Math.max(PDF_MIN_ZOOM, Number((state.pdfZoom + direction * 0.08).toFixed(2))),
  );

  if (nextZoom === state.pdfZoom) {
    return;
  }

  state.pdfZoom = nextZoom;
  els.pdfZoomLabel.textContent = `${Math.round(state.pdfZoom * 100)}%`;
  updatePdfControls();
  window.clearTimeout(state.pdfWheelZoomTimer);
  state.pdfWheelZoomTimer = window.setTimeout(() => {
    updatePdfFlipbookLayout(true);
  }, 110);
}

function applyPdfPan() {
  els.pdfFlipbook.style.setProperty("--pdf-pan-x", `${state.pdfPanX}px`);
  els.pdfFlipbook.style.setProperty("--pdf-pan-y", `${state.pdfPanY}px`);
}

function setPdfEditOpen(open) {
  if (!state.pdfDoc) {
    return;
  }
  state.pdfEditOpen = Boolean(open);
  updatePdfControls();
}

function togglePdfEditPanel() {
  setPdfEditOpen(!state.pdfEditOpen);
}

function setPdfEditTool(tool) {
  if (!PDF_EDIT_TOOLS[tool]) {
    return;
  }
  state.pdfEditTool = tool;
  updatePdfControls();
}

function setPdfEditColor(color) {
  if (!color) {
    return;
  }
  state.pdfEditColor = color;
  updatePdfControls();
}

function setPdfEditSize(value) {
  const size = clampNumber(value, 2, 30);
  state.pdfEditSize = size;
  updatePdfControls();
}

function getPdfEditToolSettings(tool = state.pdfEditTool) {
  return PDF_EDIT_TOOLS[tool] || PDF_EDIT_TOOLS[PDF_DEFAULT_EDIT_TOOL];
}

function hexToRgba(color, alpha = 1) {
  const value = String(color || "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) {
    return `rgba(250, 204, 21, ${alpha})`;
  }

  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function clearPdfAnnotations() {
  finishPdfAnnotation();
  els.pdfFlipbook.querySelectorAll(".pdf-annotation-object").forEach((annotation) => annotation.remove());
}

function getPdfAnnotationLayer(event) {
  if (event.target.closest(".pdf-fullscreen-hud")) {
    return null;
  }

  const pageInner = event.target.closest(".pdf-flip-page-inner");
  if (!pageInner) {
    return null;
  }

  syncPdfPageLayers(pageInner.closest(".pdf-flip-page"));
  const layer = pageInner.querySelector(".pdf-annotation-layer");
  const rect = layer?.getBoundingClientRect();
  return rect?.width && rect?.height ? layer : null;
}

function getPdfLayerPoint(event, layer) {
  const rect = layer.getBoundingClientRect();
  const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
  const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
  return {
    x,
    y,
    percentX: rect.width ? (x / rect.width) * 100 : 0,
    percentY: rect.height ? (y / rect.height) * 100 : 0,
    normX: rect.width ? (x / rect.width) * 1000 : 0,
    normY: rect.height ? (y / rect.height) * 1000 : 0,
  };
}

function getPdfStrokePath(points) {
  return points
    .map((point, index) => `${index ? "L" : "M"} ${point.normX.toFixed(1)} ${point.normY.toFixed(1)}`)
    .join(" ");
}

function getPdfStrokeWidth(tool = state.pdfEditTool) {
  const settings = getPdfEditToolSettings(tool);
  return Math.max(1, state.pdfEditSize * (settings.sizeScale || 1));
}

function createPdfStrokeAnnotation(layer, point) {
  const settings = getPdfEditToolSettings();
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  svg.classList.add("pdf-annotation-object", "pdf-stroke-annotation", `tool-${state.pdfEditTool}`);
  svg.setAttribute("viewBox", "0 0 1000 1000");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.style.mixBlendMode = settings.blend || "normal";
  path.setAttribute("d", getPdfStrokePath([point]));
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", hexToRgba(state.pdfEditColor, settings.opacity ?? 0.9));
  path.setAttribute("stroke-width", String(getPdfStrokeWidth()));
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("vector-effect", "non-scaling-stroke");
  svg.append(path);
  layer.append(svg);
  return { type: "stroke", element: svg, path, points: [point] };
}

function createPdfHighlightAnnotation(layer, point) {
  const settings = getPdfEditToolSettings("highlight");
  const highlight = document.createElement("div");
  highlight.className = "pdf-highlight-box pdf-annotation-object";
  highlight.style.left = `${point.percentX}%`;
  highlight.style.top = `${point.percentY}%`;
  highlight.style.backgroundColor = hexToRgba(state.pdfEditColor, settings.opacity);
  highlight.style.borderColor = hexToRgba(state.pdfEditColor, 0.62);
  highlight.style.mixBlendMode = settings.blend || "multiply";
  layer.append(highlight);
  return { type: "highlight", element: highlight, start: point };
}

function updatePdfHighlightAnnotation(draft, point) {
  const left = Math.min(draft.start.percentX, point.percentX);
  const top = Math.min(draft.start.percentY, point.percentY);
  const width = Math.abs(point.percentX - draft.start.percentX);
  const height = Math.abs(point.percentY - draft.start.percentY);
  draft.element.style.left = `${left}%`;
  draft.element.style.top = `${top}%`;
  draft.element.style.width = `${width}%`;
  draft.element.style.height = `${height}%`;
}

function updatePdfStrokeAnnotation(draft, point) {
  draft.points.push(point);
  draft.path.setAttribute("d", getPdfStrokePath(draft.points));
}

function getPdfAnnotationHitRect(annotation) {
  const path = annotation.querySelector?.("path");
  return (path || annotation).getBoundingClientRect();
}

function erasePdfAnnotationAt(event, layer = getPdfAnnotationLayer(event)) {
  if (!layer) {
    return;
  }

  const radius = Math.max(8, state.pdfEditSize * 1.6);
  const x = event.clientX;
  const y = event.clientY;
  layer.querySelectorAll(".pdf-annotation-object").forEach((annotation) => {
    const rect = getPdfAnnotationHitRect(annotation);
    const hit =
      x >= rect.left - radius &&
      x <= rect.right + radius &&
      y >= rect.top - radius &&
      y <= rect.bottom + radius;
    if (hit) {
      annotation.remove();
    }
  });
}

function startPdfAnnotation(event) {
  if (!state.pdfEditOpen || document.fullscreenElement !== els.pdfBook || event.button !== 0) {
    return;
  }

  const layer = getPdfAnnotationLayer(event);
  if (!layer) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (state.pdfEditTool === "eraser") {
    erasePdfAnnotationAt(event, layer);
    state.pdfAnnotationDraft = { type: "eraser", layer };
    return;
  }

  const point = getPdfLayerPoint(event, layer);
  const settings = getPdfEditToolSettings();
  state.pdfAnnotationDraft = settings.type === "box" ? createPdfHighlightAnnotation(layer, point) : createPdfStrokeAnnotation(layer, point);
  state.pdfAnnotationDraft.layer = layer;
}

function movePdfAnnotation(event) {
  const draft = state.pdfAnnotationDraft;
  if (!draft) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (draft.type === "eraser") {
    erasePdfAnnotationAt(event, draft.layer);
    return;
  }

  const point = getPdfLayerPoint(event, draft.layer);
  if (draft.type === "highlight") {
    updatePdfHighlightAnnotation(draft, point);
  } else {
    updatePdfStrokeAnnotation(draft, point);
  }
}

function finishPdfAnnotation() {
  const draft = state.pdfAnnotationDraft;
  if (!draft) {
    return;
  }

  if (draft.type === "highlight") {
    const rect = draft.element.getBoundingClientRect();
    if (rect.width < 6 || rect.height < 6) {
      draft.element.remove();
    }
  }

  if (draft.type === "stroke" && draft.points.length < 2) {
    draft.element.remove();
  }

  state.pdfAnnotationDraft = null;
}
async function getPdfPageText(pageNumber) {
  if (state.pdfTextCache.has(pageNumber)) {
    return state.pdfTextCache.get(pageNumber);
  }

  const page = await state.pdfDoc.getPage(pageNumber);
  const textContent = await page.getTextContent();
  const text = {
    normal: "",
    compact: "",
    normalSegments: [],
    compactSegments: [],
    items: textContent.items,
  };

  textContent.items.forEach((item, itemIndex) => {
    const raw = item.str || "";
    const normalText = normalize(raw);
    const compactText = compactPdfSearchText(raw);

    if (normalText) {
      if (text.normal) {
        text.normal += " ";
      }
      const start = text.normal.length;
      text.normal += normalText;
      text.normalSegments.push({ start, end: text.normal.length, itemIndex });
    }

    if (compactText) {
      const start = text.compact.length;
      text.compact += compactText;
      text.compactSegments.push({ start, end: text.compact.length, itemIndex });
    }
  });

  state.pdfTextCache.set(pageNumber, text);
  return text;
}

function compactPdfSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function findPdfSearchRanges(value, query, mode) {
  const ranges = [];
  if (!query) {
    return ranges;
  }

  let index = value.indexOf(query);
  while (index >= 0) {
    ranges.push({ mode, start: index, end: index + query.length });
    index = value.indexOf(query, index + Math.max(1, query.length));
  }
  return ranges;
}

function getPdfSearchMatches(text, normalQuery, compactQuery) {
  return [
    ...findPdfSearchRanges(text.normal, normalQuery, "normal"),
    ...findPdfSearchRanges(text.compact, compactQuery, "compact"),
  ];
}

function getPdfSegmentsForMatch(text, match) {
  const segments = match.mode === "compact" ? text.compactSegments : text.normalSegments;
  return segments.filter((segment) => segment.end > match.start && segment.start < match.end);
}

function clearPdfSearchHighlights(pageNumber = null) {
  const root = pageNumber ? getPdfPageElement(pageNumber) : els.pdfFlipbook;
  root?.querySelectorAll(".pdf-search-highlight").forEach((highlight) => highlight.remove());
}

function getPdfTextItemBox(item, viewport) {
  if (!window.pdfjsLib?.Util || !item?.transform) {
    return null;
  }

  const transform = window.pdfjsLib.Util.transform(viewport.transform, item.transform);
  const fontHeight = Math.hypot(transform[2], transform[3]);
  const width = Math.max(2, Math.abs((item.width || 0) * viewport.scale));
  const height = Math.max(6, fontHeight || Math.abs((item.height || 0) * viewport.scale));
  return {
    left: Math.max(0, transform[4] - 1),
    top: Math.max(0, transform[5] - height - 1),
    width: width + 2,
    height: height + 2,
  };
}

async function renderPdfSearchHighlights(pageNumber) {
  const pageElement = getPdfPageElement(pageNumber);
  const layer = pageElement?.querySelector(".pdf-search-layer");
  if (!pageElement || !layer) {
    return;
  }

  clearPdfSearchHighlights(pageNumber);
  const matches = state.pdfSearchMatches.get(pageNumber);
  if (!matches?.length || !state.pdfRenderedPages.has(pageNumber)) {
    return;
  }

  const viewportInfo = state.pdfViewportCache.get(pageNumber);
  if (!viewportInfo) {
    return;
  }

  const revision = state.pdfSearchRevision;
  const [pageText, page] = await Promise.all([getPdfPageText(pageNumber), state.pdfDoc.getPage(pageNumber)]);
  if (revision !== state.pdfSearchRevision) {
    return;
  }

  syncPdfPageLayers(pageElement);
  const viewport = page.getViewport({ scale: viewportInfo.scale });
  const currentPage = state.pdfSearchResults[state.pdfSearchIndex];
  const fragment = document.createDocumentFragment();
  const seenItems = new Set();

  matches.forEach((match) => {
    getPdfSegmentsForMatch(pageText, match).forEach((segment) => {
      const key = segment.itemIndex;
      if (seenItems.has(key)) {
        return;
      }
      seenItems.add(key);

      const box = getPdfTextItemBox(pageText.items[segment.itemIndex], viewport);
      if (!box) {
        return;
      }

      const highlight = document.createElement("span");
      highlight.className = `pdf-search-highlight ${currentPage === pageNumber ? "current" : ""}`;
      highlight.style.left = `${box.left}px`;
      highlight.style.top = `${box.top}px`;
      highlight.style.width = `${box.width}px`;
      highlight.style.height = `${box.height}px`;
      fragment.append(highlight);
    });
  });

  layer.append(fragment);
}

function renderPdfVisibleSearchHighlights() {
  getVisiblePdfPages().forEach((pageNumber) => {
    renderPdfSearchHighlights(pageNumber);
  });
}

async function searchPdf(event) {
  event?.preventDefault();
  if (!state.pdfDoc) {
    return;
  }

  const query = normalize(els.pdfSearchInput.value);
  const compactQuery = compactPdfSearchText(els.pdfSearchInput.value);
  const revision = state.pdfSearchRevision + 1;
  state.pdfSearchRevision = revision;
  state.pdfSearchQuery = query;
  state.pdfSearchResults = [];
  state.pdfSearchMatches.clear();
  state.pdfSearchIndex = -1;
  state.pdfSearchStatus = "";
  clearPdfSearchHighlights();

  if (!query && !compactQuery) {
    updatePdfControls();
    return;
  }

  state.pdfSearchStatus = "Đang tìm";
  updatePdfControls();
  for (let pageNumber = 1; pageNumber <= state.pdfDoc.numPages; pageNumber += 1) {
    const text = await getPdfPageText(pageNumber);
    if (revision !== state.pdfSearchRevision) {
      return;
    }

    const matches = getPdfSearchMatches(text, query, compactQuery);
    if (matches.length) {
      state.pdfSearchResults.push(pageNumber);
      state.pdfSearchMatches.set(pageNumber, matches);
    }
  }

  if (state.pdfSearchResults.length) {
    const currentPage = clampPdfPage(state.pdfPage);
    const nearestIndex = state.pdfSearchResults.findIndex((pageNumber) => pageNumber >= currentPage);
    state.pdfSearchIndex = nearestIndex >= 0 ? nearestIndex : 0;
    await goToPdfPage(state.pdfSearchResults[state.pdfSearchIndex]);
    renderPdfVisibleSearchHighlights();
    state.pdfSearchStatus = "";
  } else {
    state.pdfSearchStatus = "Không có";
  }
  updatePdfControls();
}

async function goToPdfSearchResult(delta) {
  if (!state.pdfSearchResults.length) {
    return;
  }

  const total = state.pdfSearchResults.length;
  state.pdfSearchIndex = (state.pdfSearchIndex + delta + total) % total;
  await goToPdfPage(state.pdfSearchResults[state.pdfSearchIndex]);
  renderPdfVisibleSearchHighlights();
  updatePdfControls();
}
function startPdfPan(event) {
  if (document.fullscreenElement !== els.pdfBook || event.button !== 2 || event.target.closest(".pdf-fullscreen-hud")) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  state.pdfPanning = true;
  state.pdfPanStart = {
    x: event.clientX,
    y: event.clientY,
    panX: state.pdfPanX,
    panY: state.pdfPanY,
  };
  updatePdfControls();
}

function movePdfPan(event) {
  if (!state.pdfPanning || !state.pdfPanStart) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  state.pdfPanX = state.pdfPanStart.panX + event.clientX - state.pdfPanStart.x;
  state.pdfPanY = state.pdfPanStart.panY + event.clientY - state.pdfPanStart.y;
  applyPdfPan();
}

function finishPdfPan() {
  if (!state.pdfPanning) {
    return;
  }
  state.pdfPanning = false;
  state.pdfPanStart = null;
  updatePdfControls();
}

function nextPdfPage() {
  if (!state.pdfDoc || state.pdfTurning || !isPdfFlipbookReady()) {
    return;
  }
  getPdfFlipbook().turn("next");
}

function previousPdfPage() {
  if (!state.pdfDoc || state.pdfTurning || !isPdfFlipbookReady()) {
    return;
  }
  getPdfFlipbook().turn("previous");
}

function changePdfZoom(delta) {
  if (!state.pdfDoc) {
    return;
  }

  const nextZoom = Math.min(PDF_MAX_ZOOM, Math.max(PDF_MIN_ZOOM, state.pdfZoom + delta));
  if (nextZoom === state.pdfZoom) {
    return;
  }

  state.pdfZoom = Number(nextZoom.toFixed(2));
  updatePdfFlipbookLayout(true);
}

function fitPdfToFrame() {
  if (!state.pdfDoc) {
    return;
  }
  state.pdfZoom = 1;
  updatePdfFlipbookLayout(true);
}

function handlePdfResize() {
  if (!state.pdfDoc) {
    return;
  }

  window.clearTimeout(state.pdfResizeTimer);
  state.pdfResizeTimer = window.setTimeout(() => {
    updatePdfFlipbookLayout(true);
  }, 140);
}

async function togglePdfFullscreen() {
  if (!state.pdfDoc || !document.fullscreenEnabled) {
    return;
  }

  try {
    if (document.fullscreenElement === els.pdfBook) {
      await document.exitFullscreen();
    } else {
      try {
        await els.pdfBook.requestFullscreen({ navigationUI: "hide" });
      } catch {
        await els.pdfBook.requestFullscreen();
      }
    }
  } catch (error) {
    els.pdfFileName.textContent = `Không bật được toàn màn hình: ${error.message}`;
  }
}

function handlePdfFullscreenChange() {
  if (document.fullscreenElement !== els.pdfBook) {
    state.pdfPanning = false;
    state.pdfPanStart = null;
    state.pdfHudVisible = false;
    window.clearTimeout(state.pdfHudTimer);
    finishPdfAnnotation();
    state.pdfEditOpen = false;
  } else {
    setPdfHudVisible(true, true);
  }
  updatePdfControls();
  if (!state.pdfDoc) {
    return;
  }

  window.clearTimeout(state.pdfResizeTimer);
  state.pdfResizeTimer = window.setTimeout(() => {
    updatePdfFlipbookLayout(true);
  }, 180);
}

function isTypingTarget(target) {
  return target instanceof HTMLElement && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
}

function startRecommendedSession() {
  const unit = getCurrentUnit();
  const stats = getUnitStats(unit);

  if (!stats.wordCount) {
    switchPanel("add");
    return;
  }

  const method = getRecommendedMethod(stats);
  syncTestMethodControls(method);
  startTest(getTestWords(), method);
}

function startReviewSession() {
  const unit = getCurrentUnit();

  if (!unit.words.length) {
    switchPanel("learn");
    return;
  }

  const mastered = getMasteredMap();
  const weakWords = unit.words.filter((word) => !mastered[makeWordId(word)]);
  const words = weakWords.length ? weakWords : unit.words;
  const method = weakWords.length <= 6 ? "flashcard" : "choice";
  syncTestMethodControls(method);
  startTest(els.shuffleInput.checked ? shuffle(words) : [...words], method);
}

async function showPdfFile(record) {
  cancelPdfRenderTasks();
  state.pdfRenderId += 1;
  state.pdfTurning = false;
  resetPdfFullscreenTools();
  destroyPdfFlipbook();

  if (state.pdfDoc) {
    await state.pdfDoc.destroy();
  }

  if (state.pdfUrl) {
    URL.revokeObjectURL(state.pdfUrl);
  }

  state.pdfDoc = null;
  state.pdfPage = 1;
  state.pdfPageRatio = 0.707;
  state.pdfZoom = 1;
  state.pdfUrl = URL.createObjectURL(record.blob);
  setPdfReaderStatus("Đang tải PDF...");
  updatePdfControls();

  try {
    const pdfjsLib = configurePdfJs();
    const loadingTask = pdfjsLib.getDocument(state.pdfUrl);
    state.pdfDoc = await loadingTask.promise;
    els.pdfFileName.textContent = `Đang mở: ${record.name}. File này đã được lưu trong trình duyệt.`;
    await initPdfFlipbook();
  } catch (error) {
    state.pdfDoc = null;
    destroyPdfFlipbook();
    setPdfReaderStatus(`Không đọc được PDF: ${error.message}`);
    els.pdfFileName.textContent = `Không đọc được PDF: ${error.message}`;
    updatePdfControls();
  }
}

function importUnits() {
  try {
    const parsed = JSON.parse(els.importTextarea.value);
    const targetUnitId = els.importUnitInput.value || state.unitId;
    const units = getImportedUnits();
    const targetIndex = units.findIndex((unit) => unit.id === targetUnitId);

    if (targetIndex < 0) {
      throw new Error("Không tìm thấy unit cần import.");
    }

    const importedUnit = buildUnitForImport(parsed, units[targetIndex]);
    units[targetIndex] = importedUnit;
    saveJson(STORAGE_KEYS.imported, units);
    state.unitId = importedUnit.id;
    localStorage.setItem(STORAGE_KEYS.selectedUnit, state.unitId);
    initUnitControls();
    renderAll();
    els.importStatus.textContent = `Đã import ${importedUnit.words.length} mục vào Unit ${importedUnit.number}. Chọn unit khác ở ô "Import vào unit" để nhập bài tiếp theo.`;
    els.importStatus.className = "feedback correct";
    switchPanel("import");
  } catch (error) {
    els.importStatus.textContent = `Import lỗi: ${error.message}`;
    els.importStatus.className = "feedback wrong";
  }
}

function buildUnitForImport(parsed, targetUnit) {
  const firstItem = Array.isArray(parsed) ? parsed[0] : parsed;
  const sourceUnit =
    firstItem && typeof firstItem === "object" && Array.isArray(firstItem.words)
      ? firstItem
      : null;
  const sourceWords = sourceUnit ? sourceUnit.words : parsed;

  if (!Array.isArray(sourceWords)) {
    throw new Error("JSON phải là một unit có `words`, hoặc là một mảng từ.");
  }

  const importedWords = sourceWords
    .map((word) => shapeWord(word, targetUnit.id))
    .filter((word) => word.english && word.vietnamese);

  if (!importedWords.length) {
    throw new Error("Không có từ hợp lệ. Mỗi từ cần có `english` và `vietnamese`.");
  }

  return {
    ...targetUnit,
    title: sourceUnit?.title || targetUnit.title,
    description: sourceUnit?.description || targetUnit.description,
    words: importedWords,
  };
}

function exportCurrentData() {
  const data = getUnits().map((unit) => ({
    number: unit.number,
    title: unit.title,
    description: unit.description,
    words: unit.words.map(({ english, vietnamese, type, example, alternatives }) => ({
      english,
      vietnamese,
      type,
      example,
      alternatives,
    })),
  }));
  els.importTextarea.value = JSON.stringify(data, null, 2);
  els.importStatus.textContent = "Đã đưa dữ liệu hiện tại vào ô import.";
  els.importStatus.className = "feedback correct";
}

function clearImportedData() {
  if (!window.confirm("Xóa toàn bộ dữ liệu import?")) {
    return;
  }
  localStorage.removeItem(STORAGE_KEYS.imported);
  state.unitId = "unit-01";
  localStorage.setItem(STORAGE_KEYS.selectedUnit, state.unitId);
  initUnitControls();
  renderAll();
  els.importStatus.textContent = "Đã xóa dữ liệu import.";
  els.importStatus.className = "feedback correct";
}

function applyTheme(theme, persist = true) {
  const safeTheme = theme === "dark" ? "dark" : "light";
  const nextLabel = safeTheme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";
  document.documentElement.dataset.theme = safeTheme;

  if (els.themeToggle) {
    els.themeToggle.setAttribute("aria-pressed", String(safeTheme === "dark"));
    els.themeToggle.setAttribute("aria-label", nextLabel);
    els.themeToggle.title = nextLabel;
  }

  if (persist) {
    localStorage.setItem(STORAGE_KEYS.theme, safeTheme);
  }
}

function applyAccent(accent, persist = true) {
  const safeAccent = ["teal", "violet", "coral"].includes(accent) ? accent : "teal";
  document.documentElement.dataset.accent = safeAccent;
  syncSettingsControls();

  if (persist) {
    localStorage.setItem(STORAGE_KEYS.accent, safeAccent);
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion || !document.startViewTransition) {
    applyTheme(nextTheme);
    return;
  }

  const root = document.documentElement;
  root.classList.add("theme-transitioning");
  root.classList.toggle("theme-transition-reverse", nextTheme === "light");

  const transition = document.startViewTransition(() => {
    applyTheme(nextTheme);
  });

  transition.finished.finally(() => {
    root.classList.remove("theme-transitioning", "theme-transition-reverse");
  });
}

function initTheme() {
  applyTheme(document.documentElement.dataset.theme, false);
  applyAccent(document.documentElement.dataset.accent, false);
}

function bindEvents() {
  els.pdfInput.addEventListener("change", handlePdfFile);
  els.pdfPrevButton.addEventListener("click", previousPdfPage);
  els.pdfTurnPrevButton.addEventListener("click", previousPdfPage);
  els.pdfNextButton.addEventListener("click", nextPdfPage);
  els.pdfTurnNextButton.addEventListener("click", nextPdfPage);
  els.pdfZoomOutButton.addEventListener("click", () => changePdfZoom(-PDF_ZOOM_STEP));
  els.pdfZoomInButton.addEventListener("click", () => changePdfZoom(PDF_ZOOM_STEP));
  els.pdfFitButton.addEventListener("click", fitPdfToFrame);
  els.pdfFullscreenButton.addEventListener("click", togglePdfFullscreen);
  els.pdfFullscreenCloseButton.addEventListener("click", togglePdfFullscreen);
  els.pdfEditButton.addEventListener("click", togglePdfEditPanel);
  els.pdfEditToolButtons.forEach((button) => {
    button.addEventListener("click", () => setPdfEditTool(button.dataset.pdfTool));
  });
  els.pdfEditColorButtons.forEach((button) => {
    button.addEventListener("click", () => setPdfEditColor(button.dataset.pdfColor));
  });
  els.pdfEditSizeInput.addEventListener("input", () => setPdfEditSize(els.pdfEditSizeInput.value));
  els.pdfClearAnnotationsButton.addEventListener("click", clearPdfAnnotations);
  els.pdfSearchForm.addEventListener("submit", searchPdf);
  els.pdfSearchInput.addEventListener("input", () => {
    state.pdfSearchStatus = "";
    state.pdfSearchRevision += 1;
    state.pdfSearchQuery = "";
    state.pdfSearchResults = [];
    state.pdfSearchMatches.clear();
    state.pdfSearchIndex = -1;
    clearPdfSearchHighlights();
    updatePdfControls();
  });
  els.pdfSearchPrevButton.addEventListener("click", () => goToPdfSearchResult(-1));
  els.pdfSearchNextButton.addEventListener("click", () => goToPdfSearchResult(1));
  els.pdfBook.addEventListener(
    "mousedown",
    (event) => {
      startPdfPan(event);
      startPdfAnnotation(event);
    },
    true,
  );
  els.pdfBook.addEventListener("contextmenu", (event) => {
    if (document.fullscreenElement === els.pdfBook) {
      event.preventDefault();
    }
  });
  els.pdfBook.addEventListener("mousemove", handlePdfFullscreenMouseMove);
  els.pdfBook.addEventListener("mouseleave", () => {
    if (document.fullscreenElement === els.pdfBook) {
      setPdfHudVisible(false);
    }
  });
  els.pdfBook.addEventListener("wheel", handlePdfWheelZoom, { passive: false });
  els.pdfPageInput.addEventListener("change", () => {
    goToPdfPage(els.pdfPageInput.value);
  });
  els.pdfPageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      goToPdfPage(els.pdfPageInput.value);
      els.pdfPageInput.blur();
    }
  });
  window.addEventListener("resize", handlePdfResize);
  document.addEventListener("fullscreenchange", handlePdfFullscreenChange);
  document.addEventListener("mousemove", (event) => {
    movePdfPan(event);
    movePdfAnnotation(event);
  });
  document.addEventListener("mouseup", () => {
    finishPdfPan();
    finishPdfAnnotation();
  });
  els.modeMenuButton.addEventListener("click", () => {
    setModePanel(!els.modeMenuPanel.classList.contains("open"));
  });
  els.unitMenuButton.addEventListener("click", () => {
    setUnitPanel(!els.unitListPanel.classList.contains("open"));
  });
  els.themeToggle.addEventListener("click", toggleTheme);
  els.accentChoiceInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        applyAccent(input.value);
      }
    });
  });
  els.unitCountInput.addEventListener("change", () => {
    setUnitCount(els.unitCountInput.value);
  });
  els.unitCountInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setUnitCount(els.unitCountInput.value);
      els.unitCountInput.blur();
    }
  });
  els.resetSettingsButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEYS.unitCount);
    localStorage.removeItem(STORAGE_KEYS.accent);
    applyAccent("teal", false);
    setUnitCount(DEFAULT_UNIT_COUNT);
  });
  els.importUnitInput.addEventListener("change", () => {
    setUnit(els.importUnitInput.value);
  });
  els.unitList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-unit-id]");
    if (button) {
      setUnit(button.dataset.unitId);
    }
  });

  els.pdfTab.addEventListener("click", () => switchPanel("pdf"));
  els.learnTab.addEventListener("click", () => switchPanel("learn"));
  els.testTab.addEventListener("click", () => switchPanel("test"));
  els.addTab.addEventListener("click", () => switchPanel("add"));
  els.importTab.addEventListener("click", () => switchPanel("import"));
  els.showLearnButton.addEventListener("click", () => switchPanel("learn"));
  els.startTestButton.addEventListener("click", () => startTest());
  els.coachStartButton.addEventListener("click", startRecommendedSession);
  els.coachReviewButton.addEventListener("click", startReviewSession);
  els.startTestSideButton.addEventListener("click", () => startTest());
  els.resetTestButton.addEventListener("click", () => startTest());
  els.answerForm.addEventListener("submit", submitAnswer);
  els.choiceGrid.addEventListener("click", handleChoiceAnswer);
  els.flashcardAnswer.addEventListener("click", handleFlashcardAnswer);
  els.testMethodInputs.forEach((input) => {
    input.addEventListener("change", () => changeTestMethod(getSelectedTestMethod()));
  });
  els.skipButton.addEventListener("click", skipQuestion);
  els.nextButton.addEventListener("click", nextQuestion);
  els.retryWrongButton.addEventListener("click", () => {
    const wrongWords = state.results
      .filter((result) => !result.isCorrect)
      .map((result) => result.word);
    startTest(wrongWords, state.testMethod);
  });
  els.pathNodes.addEventListener("click", (event) => {
    const button = event.target.closest("[data-path-unit-id]");
    if (button) {
      setUnit(button.dataset.pathUnitId);
    }
  });
  els.searchInput.addEventListener("input", renderWordTable);
  els.wordTable.addEventListener("change", (event) => {
    const input = event.target.closest("[data-mastered]");
    if (!input) {
      return;
    }
    const mastered = getMasteredMap();
    mastered[input.dataset.mastered] = input.checked;
    saveJson(STORAGE_KEYS.mastered, mastered);
    if (input.checked) {
      recordActivity({ xp: 8, mastered: 1 });
    }
    initUnitControls();
    renderAll();
  });
  els.wordForm.addEventListener("submit", addCustomWord);
  els.clearCustomButton.addEventListener("click", clearCustomWords);
  els.importButton.addEventListener("click", importUnits);
  els.exportDataButton.addEventListener("click", exportCurrentData);
  els.clearImportedButton.addEventListener("click", clearImportedData);
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(".top-nav")) {
      setUnitPanel(false);
      setModePanel(false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setUnitPanel(false);
      setModePanel(false);
    }
    if (!els.pdfPanel.classList.contains("active") || !state.pdfDoc || isTypingTarget(event.target)) {
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      previousPdfPage();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nextPdfPage();
    }
  });
}

async function init() {
  initTheme();
  initUnitControls();
  bindEvents();
  renderAll();
  try {
    const savedPdf = await loadSavedPdfFile();
    if (savedPdf) {
      await showPdfFile(savedPdf);
    }
  } catch (error) {
    els.pdfFileName.textContent = `Chọn file PDF để mở. Trình duyệt chưa nạp được PDF đã lưu: ${error.message}`;
  }
}

init();
