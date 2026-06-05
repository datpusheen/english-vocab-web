const DEFAULT_UNIT_COUNT = 42;
const PDF_DB_NAME = "b1TrainerPdfDb";
const PDF_DB_VERSION = 1;
const PDF_STORE_NAME = "files";
const PDF_RECORD_KEY = "book";
const PDF_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const PDF_MIN_ZOOM = 0.7;
const PDF_MAX_ZOOM = 1.8;
const PDF_ZOOM_STEP = 0.15;
const PDF_SPREAD_QUERY = "(min-width: 820px)";

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
  pdfZoomLabel: document.querySelector("#pdfZoomLabel"),
  pdfProgressBar: document.querySelector("#pdfProgressBar"),
  unitList: document.querySelector("#unitList"),
  unitMenuButton: document.querySelector("#unitMenuButton"),
  unitListPanel: document.querySelector("#unitListPanel"),
  currentUnitLabel: document.querySelector("#currentUnitLabel"),
  modeMenuButton: document.querySelector("#modeMenuButton"),
  modeMenuPanel: document.querySelector("#modeMenuPanel"),
  currentModeLabel: document.querySelector("#currentModeLabel"),
  themeToggle: document.querySelector("#themeToggle"),
  unitInput: document.querySelector("#unitInput"),
  importUnitInput: document.querySelector("#importUnitInput"),
  unitTitle: document.querySelector("#unitTitle"),
  unitDescription: document.querySelector("#unitDescription"),
  learnHeading: document.querySelector("#learnHeading"),
  wordCount: document.querySelector("#wordCount"),
  masteredCount: document.querySelector("#masteredCount"),
  scoreCount: document.querySelector("#scoreCount"),
  readyPercent: document.querySelector("#readyPercent"),
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
  return Array.from({ length: DEFAULT_UNIT_COUNT }, (_, index) => {
    const number = index + 1;
    return {
      id: `unit-${String(number).padStart(2, "0")}`,
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

  if (!Array.isArray(imported) || !imported.length) {
    return baseUnits;
  }

  imported.map(normalizeUnit).forEach((importedUnit) => {
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

function initUnitControls() {
  const units = getUnits();
  els.unitInput.innerHTML = "";
  els.importUnitInput.innerHTML = "";
  els.unitList.innerHTML = "";

  units.forEach((unit) => {
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
    button.innerHTML = `
      <strong>Unit ${unit.number}</strong>
      <span>${escapeHtml(detail)}</span>
    `;
    els.unitList.append(button);
  });

  if (!units.some((unit) => unit.id === state.unitId)) {
    state.unitId = units[0].id;
  }

  els.unitInput.value = state.unitId;
  els.importUnitInput.value = state.unitId;
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

  els.wordTable.innerHTML = `
    <div class="word-row header">
      <span>#</span>
      <span>English</span>
      <span>Vietnamese</span>
      <span>Type</span>
      <span>Example</span>
      <span>Status</span>
    </div>
  `;

  words.forEach((word, index) => {
    const wordId = makeWordId(word);
    const row = document.createElement("div");
    row.className = "word-row";
    row.innerHTML = `
      <span class="index-pill">${index + 1}</span>
      <span class="word-main">${escapeHtml(word.english)}</span>
      <span class="meaning">${escapeHtml(word.vietnamese)}</span>
      <span class="type-tag">${escapeHtml(word.type || "word")}</span>
      <span class="example">${escapeHtml(word.example || "Tự đặt một câu với từ này.")}</span>
      <label class="master-check">
        <input type="checkbox" data-mastered="${escapeHtml(wordId)}" ${mastered[wordId] ? "checked" : ""} />
        Đã thuộc
      </label>
    `;
    els.wordTable.append(row);
  });
}

function updateStats() {
  const unit = getCurrentUnit();
  const mastered = getMasteredMap();
  const masteredCount = unit.words.filter((word) => mastered[makeWordId(word)]).length;
  const progress = loadJson(STORAGE_KEYS.progress, {});
  const unitProgress = progress[state.unitId] || { score: 0, total: unit.words.length };
  const readyPercent = unit.words.length ? Math.round((masteredCount / unit.words.length) * 100) : 0;

  els.wordCount.textContent = unit.words.length;
  els.masteredCount.textContent = masteredCount;
  els.scoreCount.textContent = `${unitProgress.score}/${unitProgress.total || unit.words.length}`;
  els.readyPercent.textContent = `${readyPercent}%`;
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
  const progressPercent = hasPdf
    ? canGoForward
      ? Math.max((lastVisiblePage / total) * 100, 2)
      : 100
    : 0;

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
  els.pdfZoomLabel.textContent = `${Math.round(state.pdfZoom * 100)}%`;
  els.pdfProgressBar.style.width = `${progressPercent}%`;
  els.pdfReader.classList.toggle("turning", state.pdfTurning);
}

function createPdfFlipPage(pageNumber) {
  const page = document.createElement("div");
  const inner = document.createElement("div");
  const canvas = document.createElement("canvas");
  const loading = document.createElement("span");
  const number = document.createElement("span");

  page.className = "pdf-flip-page";
  page.dataset.pageNumber = String(pageNumber);
  inner.className = "pdf-flip-page-inner";
  loading.className = "pdf-page-loading";
  loading.textContent = "Đang tải trang...";
  number.className = "pdf-sheet-number";
  number.textContent = `Trang ${pageNumber}`;
  inner.append(canvas, loading, number);
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
    const viewport = page.getViewport({ scale: Math.max(0.1, fitScale) });
    const outputScale = Math.min(window.devicePixelRatio || 1, 2);
    const context = canvas.getContext("2d", { alpha: false });

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
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
    state.pdfRenderId += 1;
    cancelPdfRenderTasks();
    state.pdfRenderedPages.clear();
    els.pdfFlipbook.querySelectorAll(".pdf-flip-page").forEach((page) => {
      page.dataset.rendering = "false";
    });
  }

  renderPdfPagesAroundView(getPdfTurnView(), forceRender);
  updatePdfControls();
}

async function initPdfFlipbook() {
  const $ = configureTurnJs();
  destroyPdfFlipbook();

  const firstPage = await state.pdfDoc.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 1 });
  state.pdfPageRatio = firstViewport.width / firstViewport.height;
  state.pdfRenderedPages.clear();

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
        renderPdfPagesAroundView(view);
        updatePdfControls();
      },
      turned: (_event, page, view) => {
        state.pdfTurning = false;
        state.pdfPage = clampPdfPage(page);
        renderPdfPagesAroundView(view);
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

function isTypingTarget(target) {
  return target instanceof HTMLElement && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
}

async function showPdfFile(record) {
  cancelPdfRenderTasks();
  state.pdfRenderId += 1;
  state.pdfTurning = false;
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
  els.themeToggle.setAttribute("aria-pressed", String(safeTheme === "dark"));
  els.themeToggle.setAttribute("aria-label", nextLabel);
  els.themeToggle.title = nextLabel;

  if (persist) {
    localStorage.setItem(STORAGE_KEYS.theme, safeTheme);
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
  els.modeMenuButton.addEventListener("click", () => {
    setModePanel(!els.modeMenuPanel.classList.contains("open"));
  });
  els.unitMenuButton.addEventListener("click", () => {
    setUnitPanel(!els.unitListPanel.classList.contains("open"));
  });
  els.themeToggle.addEventListener("click", toggleTheme);
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
  els.searchInput.addEventListener("input", renderWordTable);
  els.wordTable.addEventListener("change", (event) => {
    const input = event.target.closest("[data-mastered]");
    if (!input) {
      return;
    }
    const mastered = getMasteredMap();
    mastered[input.dataset.mastered] = input.checked;
    saveJson(STORAGE_KEYS.mastered, mastered);
    updateStats();
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
