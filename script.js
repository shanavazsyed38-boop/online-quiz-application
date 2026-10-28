"use strict";
const QUIZ_TIME = 120; // seconds per attempt
const QUESTIONS = {
  "HTML & CSS": [
    ["Which tag defines the largest heading in HTML?", ["<h6>", "<h1>", "<head>", "<header>"], 1],
    ["Which CSS property changes the text colour?", ["font-color", "text-style", "color", "foreground"], 2],
    ["Which HTML tag is used to create a hyperlink?", ["<a>", "<link>", "<href>", "<url>"], 0],
    ["Which CSS layout module is designed for two-dimensional layouts?", ["Float", "Grid", "Inline-block", "Table-cell"], 1],
    ["What does the alt attribute of an <img> tag provide?", ["Image size", "Alternative text", "Image link", "Animation"], 1],
    ["Which CSS selector targets an element with id 'menu'?", [".menu", "menu", "#menu", "*menu"], 2],
    ["Which HTML element holds the visible page content?", ["<head>", "<body>", "<meta>", "<title>"], 1],
    ["Which unit is relative to the viewport width?", ["px", "em", "vw", "pt"], 2]
  ],
  "JavaScript": [
    ["Which keyword declares a block-scoped variable that can be reassigned?", ["var", "let", "const", "static"], 1],
    ["What does JSON.stringify() do?", ["Parses text into an object", "Converts an object to a JSON string", "Deletes an object", "Sorts an array"], 1],
    ["Which method adds an element to the end of an array?", ["push()", "pop()", "shift()", "concat()"], 0],
    ["Which Web API stores data that stays after the browser is closed?", ["sessionStorage", "Local Storage", "Cookies only", "Cache API only"], 1],
    ["What is the result of typeof null?", ["null", "undefined", "object", "number"], 2],
    ["Which method selects an element by its id?", ["getElementById()", "querySelectorAll()", "getElementsByTag()", "findId()"], 0],
    ["Which operator checks both value and type?", ["==", "=", "===", "!="], 2],
    ["Which function runs code repeatedly at fixed intervals?", ["setTimeout()", "setInterval()", "repeat()", "loop()"], 1]
  ],
  "General Knowledge": [
    ["What is the capital of India?", ["Mumbai", "New Delhi", "Chennai", "Kolkata"], 1],
    ["Which planet is known as the Red Planet?", ["Venus", "Jupiter", "Mars", "Mercury"], 2],
    ["Who wrote the Indian national anthem?", ["Bankim Chandra Chatterjee", "Rabindranath Tagore", "Sarojini Naidu", "Subramania Bharati"], 1],
    ["Which is the largest ocean on Earth?", ["Atlantic", "Indian", "Arctic", "Pacific"], 3],
    ["How many continents are there?", ["5", "6", "7", "8"], 2],
    ["Which gas do plants absorb from the air?", ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], 1],
    ["Which river is the longest in India?", ["Ganga", "Godavari", "Yamuna", "Narmada"], 0],
    ["What is H2O commonly known as?", ["Salt", "Water", "Hydrogen", "Acid"], 1]
  ]
};

const $ = (id) => document.getElementById(id);
let category = "", questions = [], answers = [], index = 0, timeLeft = 0, tick = null;

// ---------- Local Storage (best score per category) ----------
function bests() {
  try { return JSON.parse(localStorage.getItem("quiz_best")) || {}; } catch { return {}; }
}
function saveBest(cat, pct) {
  const b = bests();
  const isNew = b[cat] === undefined || pct > b[cat];
  if (isNew) { b[cat] = pct; localStorage.setItem("quiz_best", JSON.stringify(b)); }
  return { isNew, best: b[cat] };
}

// ---------- Helpers ----------
function shuffle(arr) {              // Fisher-Yates: new order every attempt
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function show(id) {
  ["startScreen", "quizScreen", "resultScreen"].forEach((s) => ($(s).hidden = s !== id));
}

// ---------- Start screen ----------
function renderCategories() {
  const b = bests();
  $("categories").innerHTML = "";
  Object.keys(QUESTIONS).forEach((name) => {
    const btn = document.createElement("button");
    btn.className = "cat";
    btn.innerHTML = `<b></b><span></span>`;
    btn.querySelector("b").textContent = name;
    btn.querySelector("span").textContent =
      QUESTIONS[name].length + " questions · Best: " + (b[name] !== undefined ? b[name] + "%" : "not attempted");
    btn.addEventListener("click", () => startQuiz(name));
    $("categories").appendChild(btn);
  });
  const vals = Object.values(b);
  $("bestAll").textContent = vals.length ? "Top score: " + Math.max(...vals) + "%" : "";
}

// ---------- Quiz ----------
function startQuiz(name) {
  category = name;
  questions = shuffle(QUESTIONS[name]);
  answers = new Array(questions.length).fill(null);
  index = 0;
  timeLeft = QUIZ_TIME;
  $("catName").textContent = name;
  show("quizScreen");
  showQuestion();
  updateTimer();
  clearInterval(tick);
  tick = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) submitQuiz(true); // automatic submission when time expires
  }, 1000);
}
function updateTimer() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");
  $("timer").textContent = "Time left " + m + ":" + s;
  $("timer").classList.toggle("low", timeLeft <= 20);
}
function showQuestion() {
  const [text, opts] = questions[index];
  $("progress").textContent = "Question " + (index + 1) + " of " + questions.length;
  $("question").textContent = text;
  $("options").innerHTML = "";
  opts.forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "opt" + (answers[index] === i ? " sel" : "");
    b.textContent = o;
    b.addEventListener("click", () => { answers[index] = i; showQuestion(); });
    $("options").appendChild(b);
  });
  $("prevBtn").disabled = index === 0;
  $("nextBtn").disabled = index === questions.length - 1;
}
$("prevBtn").addEventListener("click", () => { index--; showQuestion(); });
$("nextBtn").addEventListener("click", () => { index++; showQuestion(); });
$("submitBtn").addEventListener("click", () => {
  const left = answers.filter((a) => a === null).length;
  if (left && !confirm(left + " question(s) unanswered. Submit anyway?")) return;
  submitQuiz(false);
});

// ---------- Result ----------
function submitQuiz(auto) {
  clearInterval(tick);
  const total = questions.length;
  const attempted = answers.filter((a) => a !== null).length;
  const correct = questions.filter((q, i) => answers[i] === q[2]).length;
  const wrong = attempted - correct;
  const pct = Math.round((correct / total) * 100);
  const { isNew, best } = saveBest(category, pct);

  $("catResult").textContent = category;
  $("score").textContent = correct + " / " + total;
  $("percent").textContent = "(" + pct + "%)";
  $("bestMsg").textContent = (auto ? "Time is up! Quiz submitted automatically. " : "") +
    (isNew ? "New best score for this category!" : "Your best score here: " + best + "%");
  $("rTotal").textContent = total;
  $("rAttempted").textContent = attempted;
  $("rCorrect").textContent = correct;
  $("rWrong").textContent = wrong;

  $("review").innerHTML = "";
  questions.forEach(([text, opts, ans], i) => {
    const ok = answers[i] === ans;
    const d = document.createElement("div");
    d.className = "rev " + (ok ? "good" : "bad");
    const p1 = document.createElement("p"); p1.innerHTML = "<b></b>"; p1.firstChild.textContent = (i + 1) + ". " + text;
    const p2 = document.createElement("p");
    p2.textContent = "Your answer: " + (answers[i] === null ? "Not answered" : opts[answers[i]]) + (ok ? " ✓" : " ✗");
    d.append(p1, p2);
    if (!ok) { const p3 = document.createElement("p"); p3.textContent = "Correct answer: " + opts[ans]; d.append(p3); }
    $("review").appendChild(d);
  });
  show("resultScreen");
  renderCategories();
}

$("restartBtn").addEventListener("click", () => startQuiz(category));
$("anotherBtn").addEventListener("click", () => { show("startScreen"); renderCategories(); });

renderCategories();
show("startScreen");
