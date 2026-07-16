// questions.js – simplified: HTML is boss unless empty or cooldown conflict

// ==================== QUESTION BANK ====================
const QUESTION_BANK = [
  "If you were the overseer of an important landmark area for a hero's journey to defeat a dragon, would you oversee the lighthouse, a bridge, or a hidden path in the woods?",
  "What's a small win you had this week that no one knows about?",
  "What's a movie or book that changed how you think about something?",
  "What's a risk you took that paid off (big or small)?",
  "If you could teleport anywhere for lunch today, where would you go?",
  "What's a question you wish more people asked you?",
  "In a world where technology and AI are rapidly evolving and overtly relied on, what are 3 skills, niches, or techniques you can safely fallback on if most technology stopped working for two decades?",
  "If you were a dragon, what one specific type of object(s) would you hoard?",
  "What would your rival insist is your greatest weakness?",
  "You discover your subconscious has been applying for jobs without your knowledge while you sleepwalk. What kind of jobs would it apply for?",
  "What animal do you think would be the rudest if it could speak?",
  "If you could speak to only one other species of anima, what would it be?",
  "If you found a staircase in the woods, what would make you not climb it?",
  "If your life had a sidequest that no one else knew of, what would it be?",
  "If you could have a special effect every time you walked into a room, what effect would it be?",
  "If you and your home got transported into a fantasy kingdom, what kind of title would you earn from the kingdom?",
  "If you could be an expert in one thing ambigous, what would it be?",
  "If you and your pet swapped places, would your pet take good care of you?",
  "If you had magical access to a small cave behind a waterfall, what would you do with it?",
  "If you were a dish, what restaurant would you be sold at?",
  "If you were on trial and your jury were 12 cats while the judge was a dog, what would you be on trial for and would you be found guilty or not guilty?",
  "What's one tiny inconvenience that would grant you super powers and turn you into a villain?",
  "If you were a boss in a video game, describe the aesthetic and look of your arena or level.",
  "Pitch me a two sentence pitch for a book you'd be a main character in of your favorite genre.",
  "If you accidentally got recruited in a secret society, what would it be and would you stay in it?",
  "If one object in your life could write a complaint letter about you, what object would it be?",
  "What is something in HTML and CSS you'd like a refresher on in the future?",
  "What gameshow do you think you could win?",
  "If you were part of a party to defeat a demon king, what class would you be? (bard, hypnotist, priest, warrior, mage, etc.)",
  "If you woke up in a video game with your friends but they didn't realize it, how would you convince them?",
  "If you could go camping with your friends in a liminal space full of fun puzzles and intricacies, what liminal space would you choose or how would it look?",
  "If you could interview an animal, what animal and what are 3 questions you'd ask it?",
];

const COOLDOWN_WEEKDAYS = 45; // 9 weeks × 5 weekdays
const STORAGE_KEY = 'attendance_question_history';

// ---------- Helper functions ----------
function getToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isWeekday(date) {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function countWeekdaysBetween(startDate, endDate) {
  if (startDate > endDate) return 0;
  let count = 0;
  let current = new Date(startDate);
  current.setDate(current.getDate() + 1);
  while (current <= endDate) {
    if (isWeekday(current)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// History management
function getHistory() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// Ensure every bank question has a history entry (lastAsked = null if never asked)
function initializeHistory() {
  let history = getHistory();
  let changed = false;
  QUESTION_BANK.forEach(q => {
    if (!history.find(h => h.question === q)) {
      history.push({ question: q, lastAsked: null });
      changed = true;
    }
  });
  if (changed) saveHistory(history);
  return history;
}

// Get questions that are eligible today (not in cooldown)
function getEligibleQuestions(history, today) {
  const todayDate = new Date(today);
  return QUESTION_BANK.filter(question => {
    const record = history.find(h => h.question === question);
    if (!record || record.lastAsked === null) return true;
    const weekdaysPassed = countWeekdaysBetween(new Date(record.lastAsked), todayDate);
    return weekdaysPassed >= COOLDOWN_WEEKDAYS;
  });
}

// Pick a random eligible question (assumes at least one exists)
function pickRandomEligibleQuestion() {
  const history = initializeHistory();
  const today = getToday();
  let eligible = getEligibleQuestions(history, today);
  if (eligible.length === 0) {
    // Should not happen if bank is large enough, but fallback: reset oldest
    const nonNull = history.filter(h => h.lastAsked !== null);
    if (nonNull.length) {
      nonNull.sort((a, b) => new Date(a.lastAsked) - new Date(b.lastAsked));
      const oldest = nonNull[0];
      oldest.lastAsked = null;
      saveHistory(history);
      return oldest.question;
    }
    return QUESTION_BANK[0];
  }
  const idx = Math.floor(Math.random() * eligible.length);
  return eligible[idx];
}

// DOM access
function getQuestionParagraph() {
  const container = document.querySelector('footer .container');
  if (!container) return null;
  let p = container.querySelector('p');
  if (!p) {
    p = document.createElement('p');
    const firstButton = container.querySelector('button');
    if (firstButton) container.insertBefore(p, firstButton);
    else container.appendChild(p);
  }
  return p;
}

function setQuestionText(text) {
  const p = getQuestionParagraph();
  if (p) p.textContent = text;
}

function getCurrentQuestion() {
  const p = getQuestionParagraph();
  return p ? p.textContent : "";
}

// Check if a question is a bank question and currently in cooldown
function isBankQuestionInCooldown(questionText, history, today) {
  const record = history.find(h => h.question === questionText);
  if (!record || record.lastAsked === null) return false;
  const weekdaysPassed = countWeekdaysBetween(new Date(record.lastAsked), new Date(today));
  return weekdaysPassed < COOLDOWN_WEEKDAYS;
}

// Main logic on page load
function initializePage() {
  const history = initializeHistory();
  const today = getToday();
  let current = getCurrentQuestion();

  // Case 1: Paragraph is empty → fill with random eligible bank question
  if (!current || current.trim() === "") {
    const newQ = pickRandomEligibleQuestion();
    setQuestionText(newQ);
    console.log("Paragraph was empty → filled with:", newQ);
    return;
  }

  // Case 2: Paragraph has text, check if it's a bank question in cooldown
  const isInBank = QUESTION_BANK.includes(current);
  if (isInBank && isBankQuestionInCooldown(current, history, today)) {
    // Replace with a different eligible question
    const newQ = pickRandomEligibleQuestion();
    setQuestionText(newQ);
    console.log(`Bank question "${current}" is in cooldown → replaced with:`, newQ);
  } else {
    // Otherwise keep whatever is in the paragraph (bank or custom)
    console.log("Keeping existing question:", current);
  }
}

// ---------- Button actions ----------
function markCurrentQuestionAsAsked() {
  const current = getCurrentQuestion();
  if (!current) return false;
  if (!QUESTION_BANK.includes(current)) {
    alert("This question is not in the question bank.\nAdd it to the bank manually if you want to track its cooldown.");
    return false;
  }
  let history = getHistory();
  const record = history.find(h => h.question === current);
  if (!record) {
    // Shouldn't happen if initialized, but just in case
    history.push({ question: current, lastAsked: getToday() });
  } else {
    record.lastAsked = getToday();
  }
  saveHistory(history);
  console.log(`Marked "${current}" as asked on ${getToday()}`);
  return true;
}

function refreshQuestion() {
  const newQ = pickRandomEligibleQuestion();
  setQuestionText(newQ);
  console.log("Manual refresh →", newQ);
}

function resetAllCooldowns() {
  if (confirm("⚠️ Reset cooldown for ALL bank questions? They will all become available again.")) {
    let history = getHistory();
    history.forEach(record => { record.lastAsked = null; });
    saveHistory(history);
    console.log("All cooldowns reset");
    // Optionally refresh current question if it was a bank question
    const current = getCurrentQuestion();
    if (QUESTION_BANK.includes(current)) {
      refreshQuestion();
    }
    const btn = document.getElementById('resetBtn');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  }
}

// Event binding
function init() {
  console.log("Attendance script starting (simplified mode)");
  initializeHistory();
  initializePage();

  const askBtn = document.getElementById('askedBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const resetBtn = document.getElementById('resetBtn');

  if (askBtn) askBtn.addEventListener('click', () => {
    if (markCurrentQuestionAsAsked()) {
      // After marking, refresh to a new question
      refreshQuestion();
      const btn = document.getElementById('askedBtn');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      }
    }
  });
  if (refreshBtn) refreshBtn.addEventListener('click', refreshQuestion);
  if (resetBtn) resetBtn.addEventListener('click', resetAllCooldowns);

  console.log("Ready – HTML paragraph is boss unless empty or cooldown conflict");
}

document.addEventListener('DOMContentLoaded', init);