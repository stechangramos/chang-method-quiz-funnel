// The Chang Method — nervous system quiz funnel
// Copy locked by Lalie (Copy Writer) 2026-09-13. Do not edit result/question
// text here without a copy-desk change — this file only owns quiz mechanics.

// --- Wiring pending handoffs. Do not deploy live until every PENDING value below is real. ---
// Capture goes through our own same-origin proxy (functions/api/submit.js) so
// the shared crm_capture_key never ships in client-side JS — it lives only in
// that function's Pages secret, server-side.
const CAPTURE_ENDPOINT = "/api/submit";
const MOVE_FIRST_URL = "https://checkout.schangramos.com/system-map-u7"; // provisional, Stephanie says this will be replaced
const FREE_VIDEO_URL = "https://youtu.be/PieFfelZNWY"; // provisional, Stephanie says this will be replaced

const QUESTIONS = [
  {
    text: "Something unexpected lands in your inbox right now. What happens in your body?",
    options: {
      A: "Heart rate spikes, jaw tightens, you're already fixing it",
      B: "Nothing. You stare at it and feel strangely far away",
      C: "You reread it four times, rehearsing a reply you'll never send",
      D: "You close the laptop. You don't have anything left for one more thing",
    },
  },
  {
    text: "How do you sleep most nights?",
    options: {
      A: "Fall asleep fine, wake at 3am with your mind racing",
      B: "Sleep like the dead, wake up just as tired",
      C: "Lie there replaying today, planning tomorrow, replaying today",
      D: "You'd sleep twelve hours if the world let you",
    },
  },
  {
    text: "Someone cancels on you last minute. Your first honest reaction?",
    options: {
      A: "Frustration, adrenaline, then a flat \"of course they did\"",
      B: "Relief. One less thing to perform through",
      C: "You spiral on what you did to cause it",
      D: "You don't have the energy to react at all",
    },
  },
  {
    text: "What does \"rest\" actually look like for you lately?",
    options: {
      A: "It doesn't. Rest feels like falling behind",
      B: "Scrolling, numb, hours gone",
      C: "You rest but never switch off. The list runs underneath",
      D: "Cancelling everything and disappearing for a day, still not enough",
    },
  },
  {
    text: "Which sentence sounds most like your inner voice this week?",
    options: {
      A: "\"I don't have time to slow down.\"",
      B: "\"I don't feel much of anything.\"",
      C: "\"Why do I keep doing this?\"",
      D: "\"I have nothing left to give.\"",
    },
  },
  {
    text: "If your body could send you one message right now, what would it be?",
    options: {
      A: "\"Slow down before I make you.\"",
      B: "\"Wake me up gently.\"",
      C: "\"Get me out of my head.\"",
      D: "\"I need you to stop.\"",
    },
  },
];

const TIEBREAK_QUESTION = {
  text: "Read these four lines. Which one sounds truest to you right now?",
  options: {
    A: "\"I can't stop, even when I want to.\"",
    B: "\"I've stopped feeling most of this.\"",
    C: "\"I can't stop thinking about this.\"",
    D: "\"I have nothing left to give this.\"",
  },
};

const RESULTS = {
  A: {
    tag: "wired",
    eyebrow: "Wired",
    headline: "You're Wired, Not Broken",
    body: "Your nervous system is stuck in go. Every small thing feels like an emergency, so your body keeps answering like it's one. You're not too much, and you haven't failed at relaxing. You're running a system that forgot how to switch off. Good thing is it can be retrained, starting with your breath, because that's the one part of this loop you can control on command.",
  },
  B: {
    tag: "shut-down",
    eyebrow: "Shut Down",
    headline: "You've Gone Quiet, Not Calm",
    body: "Numb isn't peace. It's your system's other way of coping when go stops working: it pulls the plug instead. You don't need something else to push through. You need something that asks nothing of you while it brings you back online.",
  },
  C: {
    tag: "loop",
    eyebrow: "Loop",
    headline: "You're Not Anxious. You're Stuck.",
    body: "You're not short on effort. You're short on a way out of the loop you're standing in. This isn't a rest problem or a breathing problem, it's a pattern that needs someone outside it to help you see the exit.",
  },
  D: {
    tag: "depleted",
    eyebrow: "Depleted",
    headline: "This Isn't Tired. This Is Empty.",
    body: "Empty isn't a stop sign. It's what happens when the body has been running on nothing for too long, and the way back isn't more rest, it's movement small enough for your body to actually use. That's the energy you're missing, not the absence of effort.",
  },
};

// All four results share one routing pattern (locked 2026-09-13): Move First
// primary, Free Video secondary. See PLANS/chang-method for the routing history.
function primaryCta() {
  return { label: "Start Move First for $100", url: MOVE_FIRST_URL };
}
function secondaryCta() {
  return {
    text: "Not ready to commit? Start with the Method Map, the free video that names the framework before you spend anything.",
    label: "Get The Method Map",
    url: FREE_VIDEO_URL,
  };
}

// --- State ---
let currentQuestionIndex = 0;
let answers = []; // array of 'A'|'B'|'C'|'D'
let tiebreakShown = false;
let finalResultKey = null;

// --- Elements ---
const screens = {
  intro: document.getElementById("screen-intro"),
  question: document.getElementById("screen-question"),
  email: document.getElementById("screen-email"),
  result: document.getElementById("screen-result"),
};
const progressFill = document.getElementById("progressFill");

function showScreen(name) {
  Object.values(screens).forEach((el) => (el.hidden = true));
  screens[name].hidden = false;
}

function setProgress(fraction) {
  progressFill.style.width = `${Math.min(100, Math.max(0, fraction * 100))}%`;
}

function tally(letters) {
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  letters.forEach((l) => counts[l]++);
  const max = Math.max(...Object.values(counts));
  const winners = Object.keys(counts).filter((k) => counts[k] === max);
  return { counts, winners };
}

function renderQuestion(q, index, total) {
  document.getElementById("qCount").textContent = `Question ${index + 1} of ${total}`;
  document.getElementById("qText").textContent = q.text;
  const optionsEl = document.getElementById("qOptions");
  optionsEl.innerHTML = "";
  Object.entries(q.options).forEach(([letter, text]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "q-option";
    btn.textContent = text;
    btn.addEventListener("click", () => onAnswer(letter));
    optionsEl.appendChild(btn);
  });
  showScreen("question");
}

function onAnswer(letter) {
  answers.push(letter);

  if (currentQuestionIndex < QUESTIONS.length - 1) {
    currentQuestionIndex++;
    setProgress(currentQuestionIndex / (QUESTIONS.length + 1));
    renderQuestion(QUESTIONS[currentQuestionIndex], currentQuestionIndex, QUESTIONS.length);
    return;
  }

  // Primary six done. Check for a tie.
  if (!tiebreakShown) {
    const { winners } = tally(answers);
    if (winners.length > 1) {
      tiebreakShown = true;
      setProgress(QUESTIONS.length / (QUESTIONS.length + 1));
      renderQuestion(TIEBREAK_QUESTION, QUESTIONS.length, QUESTIONS.length + 1);
      return;
    }
    finalResultKey = winners[0];
  } else {
    // Tiebreak answer wins outright.
    finalResultKey = letter;
  }

  setProgress(1);
  showScreen("email");
  document.getElementById("nameInput").focus();
}

async function submitLead(name, email) {
  const result = RESULTS[finalResultKey];
  const payload = {
    name,
    email,
    source: "quiz-funnel",
    form: "chang-method-nervous-system-quiz",
    capture_page: window.location.href,
    tags: ["quiz-chang-method", `quiz-result-${result.tag}`],
    custom: {
      quiz_result: finalResultKey,
      quiz_result_label: result.eyebrow,
      quiz_answers: answers.join(""),
    },
  };

  try {
    await fetch(CAPTURE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Never block the result reveal on a capture failure — log for follow-up,
    // the visitor still gets their result either way.
    console.error("Lead capture failed:", err);
  }
}

function renderResult() {
  const result = RESULTS[finalResultKey];
  document.getElementById("resultEyebrow").textContent = result.eyebrow;
  document.getElementById("resultHeadline").textContent = result.headline;
  document.getElementById("resultBody").textContent = result.body;

  const primary = primaryCta();
  const primaryEl = document.getElementById("resultPrimaryCta");
  primaryEl.textContent = primary.label;
  primaryEl.href = primary.url;

  const secondary = secondaryCta();
  document.getElementById("resultSecondaryText").textContent = secondary.text;
  const secondaryEl = document.getElementById("resultSecondaryCta");
  secondaryEl.textContent = secondary.label;
  secondaryEl.href = secondary.url;

  showScreen("result");
}

// --- Wire up entry points ---
// Landing screen has more than one "Find My Pattern" trigger (hero card,
// mobile stacked block, bottom of the cost-list) — all fire the same start.
document.querySelectorAll(".start-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentQuestionIndex = 0;
    setProgress(0);
    renderQuestion(QUESTIONS[0], 0, QUESTIONS.length);
  });
});

document.getElementById("emailForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("nameInput").value.trim();
  const email = document.getElementById("emailInput").value.trim();
  if (!name || !email) return;
  const submitBtn = document.getElementById("emailSubmitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Loading...";
  await submitLead(name, email);
  renderResult();
});
