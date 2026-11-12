const input = document.getElementById("password");
const toggle = document.getElementById("toggle");
const tilesBox = document.getElementById("tiles");
const meter = document.getElementById("meter");
const result = document.getElementById("result");
const segments = meter.querySelectorAll("span");

const RULE_IDS = ["length", "uppercase", "lowercase", "digit", "special"];
const RULE_HINTS = {
    length: "at least 8 characters",
    uppercase: "an uppercase letter",
    lowercase: "a lowercase letter",
    digit: "a number",
    special: "a special character"
};

let timer = null;
let controller = null;
let lastLevel = "empty";

/* ---------- Show / hide ---------- */
toggle.addEventListener("click", () => {
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    toggle.textContent = showing ? "Show" : "Hide";
    toggle.setAttribute("aria-pressed", String(!showing));
    toggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    renderTiles();
    input.focus();
});

/* ---------- Test case buttons ---------- */
document.getElementById("samples").addEventListener("click", (e) => {
    if (e.target.dataset.v === undefined) return;
    input.value = e.target.dataset.v;
    renderTiles();
    checkPassword();
    input.focus();
});

/* ---------- Typing ---------- */
input.addEventListener("input", () => {
    renderTiles();
    clearTimeout(timer);
    timer = setTimeout(checkPassword, 200);
});

function renderTiles() {
    const chars = Array.from(input.value);
    const hidden = input.type === "password";

    while (tilesBox.children.length > chars.length) tilesBox.lastChild.remove();
    while (tilesBox.children.length < chars.length) {
        const t = document.createElement("span");
        t.className = "tile";
        tilesBox.appendChild(t);
    }
    chars.forEach((ch, i) => {
        tilesBox.children[i].textContent = hidden ? "•" : ch;
    });
}

/* ---------- Ask Flask ---------- */
async function checkPassword() {
    const password = input.value;
    if (password === "") { resetView(); return; }

    if (controller) controller.abort();
    controller = new AbortController();

    try {
        const response = await fetch("/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: password }),
            signal: controller.signal
        });
        if (!response.ok) throw new Error("Bad response");
        render(await response.json());
    } catch (error) {
        if (error.name === "AbortError") return;
        result.textContent = "Could not reach the server. Check that Flask is running.";
    }
}

function render(data) {
    segments.forEach((seg, i) => seg.classList.toggle("on", i < data.score));

    RULE_IDS.forEach((id) => {
        document.getElementById(id).className = data.conditions[id] ? "valid" : "";
    });

    const missing = RULE_IDS.filter((id) => !data.conditions[id]).map((id) => RULE_HINTS[id]);
    let advice;
    if (!data.conditions.length) advice = "Use at least 8 characters.";
    else if (missing.length) advice = "Still missing: " + missing.join(", ") + ".";
    else advice = "This meets every rule.";

    result.innerHTML = "<strong>" + data.strength + "</strong> (" + data.score + "/5)<br>" + advice;

    if (data.strength !== lastLevel) {
        result.classList.remove("bump");
        void result.offsetWidth;
        result.classList.add("bump");
    }
    lastLevel = data.strength;
}

function resetView() {
    segments.forEach((seg) => seg.classList.remove("on"));
    RULE_IDS.forEach((id) => (document.getElementById(id).className = ""));
    result.textContent = "Your result will appear here.";
    lastLevel = "empty";
}