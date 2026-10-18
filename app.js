(() => {
  "use strict";
  const MAX_PEOPLE = 6;
  const MIN_CM = 50;
  const MAX_CM = 250;
  const colors = ["#7357ff", "#12a982", "#f28b50", "#3478f6", "#e05c94", "#a06bdb"];
  let people = [
    { id: 1, name: "Person A", unit: "cm", cm: 170 },
    { id: 2, name: "Person B", unit: "ftin", cm: 160 }
  ];
  let nextId = 3;

  const list = document.getElementById("people-list");
  const stage = document.getElementById("visual-stage");
  const summary = document.getElementById("result-summary");
  const addButton = document.getElementById("add-person");

  const round = n => Math.round(n * 10) / 10;
  function formatHeight(cm) {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round((totalInches - feet * 12) * 10) / 10;
    return `${round(cm)} cm · ${feet}′ ${inches}″`;
  }
  function getCmFromFields(card, person) {
    const unit = card.querySelector(".unit-select").value;
    if (unit === "cm") return Number(card.querySelector(".height-cm").value);
    if (unit === "m") return Number(card.querySelector(".height-m").value) * 100;
    const feet = Number(card.querySelector(".height-ft").value || 0);
    const inches = Number(card.querySelector(".height-in").value || 0);
    return (feet * 12 + inches) * 2.54;
  }
  function renderInputs() {
    list.innerHTML = "";
    people.forEach((p, index) => {
      const card = document.createElement("div");
      card.className = "person-card";
      card.dataset.id = p.id;
      const unit = p.unit || "cm";
      card.innerHTML = `
        <div class="person-card-top">
          <span class="person-title">Person ${String.fromCharCode(65 + index)}</span>
          <button type="button" class="remove-person" aria-label="Remove person ${index + 1}" title="Remove person">×</button>
        </div>
        <div class="person-fields">
          <div class="field">
            <label for="name-${p.id}">Name or label</label>
            <input id="name-${p.id}" class="person-name" maxlength="24" value="${escapeHtml(p.name)}" autocomplete="off">
          </div>
          <div class="field">
            <label for="unit-${p.id}">Unit</label>
            <select id="unit-${p.id}" class="unit-select">
              <option value="cm" ${unit === "cm" ? "selected" : ""}>cm</option>
              <option value="m" ${unit === "m" ? "selected" : ""}>metres</option>
              <option value="ftin" ${unit === "ftin" ? "selected" : ""}>ft / in</option>
            </select>
          </div>
        </div>
        <div class="height-fields">
          ${unit === "cm" ? `
            <div class="field"><label for="height-${p.id}">Height (cm)</label><input id="height-${p.id}" class="height-cm" type="number" min="${MIN_CM}" max="${MAX_CM}" step="0.1" value="${round(p.cm)}"></div>
            <div class="field"><label>Range</label><input value="50–250 cm" disabled aria-label="Allowed height range"></div>
          ` : unit === "m" ? `
            <div class="field"><label for="height-${p.id}">Height (m)</label><input id="height-${p.id}" class="height-m" type="number" min="0.5" max="2.5" step="0.01" value="${(p.cm / 100).toFixed(2)}"></div>
            <div class="field"><label>Range</label><input value="0.50–2.50 m" disabled aria-label="Allowed height range"></div>
          ` : `
            <div class="field"><label for="feet-${p.id}">Feet</label><input id="feet-${p.id}" class="height-ft" type="number" min="1" max="8" step="1" value="${Math.floor(p.cm / 2.54 / 12)}"></div>
            <div class="field"><label for="inches-${p.id}">Inches</label><input id="inches-${p.id}" class="height-in" type="number" min="0" max="11.9" step="0.1" value="${round((p.cm / 2.54) % 12)}"></div>
          `}
        </div>
      `;
      list.appendChild(card);
    });
    addButton.disabled = people.length >= MAX_PEOPLE;
    addButton.textContent = people.length >= MAX_PEOPLE ? "Maximum 6 people" : "＋ Add person";
    attachInputEvents();
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }
  function attachInputEvents() {
    list.querySelectorAll(".person-card").forEach(card => {
      const id = Number(card.dataset.id);
      const update = () => {
        const person = people.find(item => item.id === id);
        if (!person) return;
        const nameInput = card.querySelector(".person-name");
        person.name = nameInput.value.trim() || `Person ${String.fromCharCode(65 + people.indexOf(person))}`;
        const newUnit = card.querySelector(".unit-select").value;
        const changedUnit = newUnit !== person.unit;
        person.unit = newUnit;
        const cm = getCmFromFields(card, person);
        if (Number.isFinite(cm) && cm >= MIN_CM && cm <= MAX_CM) {
          person.cm = cm;
          clearInvalid(card);
          draw();
        } else {
          setInvalid(card);
        }
        if (changedUnit) renderInputs();
      };
      card.querySelectorAll("input, select").forEach(input => {
        input.addEventListener("input", update);
        input.addEventListener("change", update);
      });
      card.querySelector(".remove-person").addEventListener("click", () => {
        if (people.length <= 2) {
          alert("Keep at least two people in the comparison.");
          return;
        }
        people = people.filter(item => item.id !== id);
        renderInputs();
        draw();
      });
    });
  }
  function setInvalid(card) {
    const input = card.querySelector(".height-cm, .height-m, .height-ft");
    if (input) input.setAttribute("aria-invalid", "true");
    stage.setAttribute("aria-label", "Some heights are invalid. Enter a height between 50 and 250 cm.");
  }
  function clearInvalid(card) {
    card.querySelectorAll("[aria-invalid='true']").forEach(el => el.removeAttribute("aria-invalid"));
  }
  function silhouette(color, heightPx) {
    const h = Math.max(100, Math.min(290, heightPx));
    const width = Math.max(48, h * 0.34);
    return `<svg viewBox="0 0 100 300" role="presentation" aria-hidden="true" style="height:${h}px;width:${width}px;max-height:290px">
      <circle cx="50" cy="27" r="17" fill="${color}"/>
      <path d="M36 49 Q50 43 64 49 L72 122 Q72 132 63 132 L61 185 L69 286 Q70 296 60 296 L52 296 L44 207 L39 296 L29 296 Q20 296 22 286 L30 185 L28 132 Q18 132 19 122 L27 54 Q28 50 36 49Z" fill="${color}"/>
      <path d="M30 60 L17 128 Q15 136 22 138 Q28 139 31 130 L43 86Z" fill="${color}"/>
      <path d="M64 60 L83 123 Q86 132 79 136 Q73 138 69 128 L56 87Z" fill="${color}"/>
    </svg>`;
  }
  function draw() {
    if (people.length < 2) return;
    const tallest = Math.max(...people.map(p => p.cm));
    stage.innerHTML = "";
    people.forEach((p, i) => {
      const item = document.createElement("div");
      item.className = "person-visual";
      const scaled = Math.max(100, p.cm / tallest * 280);
      item.innerHTML = `${silhouette(colors[i % colors.length], scaled)}
        <p class="visual-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name || "Person")}</p>
        <p class="visual-height">${formatHeight(p.cm)}</p>`;
      stage.appendChild(item);
    });
    const min = people.reduce((a, b) => a.cm < b.cm ? a : b);
    const max = people.reduce((a, b) => a.cm > b.cm ? a : b);
    const diff = round(max.cm - min.cm);
    summary.innerHTML = `
      <div class="summary-chip"><strong>${escapeHtml(max.name)}</strong><span>Tallest · ${formatHeight(max.cm)}</span></div>
      <div class="summary-chip"><strong>${escapeHtml(min.name)}</strong><span>Shortest · ${formatHeight(min.cm)}</span></div>
      <div class="summary-chip"><strong>${diff} cm</strong><span>Difference between tallest and shortest</span></div>
      <div class="summary-chip"><strong>${round(diff / 2.54)} in</strong><span>Same difference in inches</span></div>`;
    stage.setAttribute("aria-label", `Height comparison. Tallest is ${max.name} at ${round(max.cm)} centimeters. Shortest is ${min.name} at ${round(min.cm)} centimeters. Difference ${diff} centimeters.`);
  }
  addButton.addEventListener("click", () => {
    if (people.length >= MAX_PEOPLE) return;
    people.push({ id: nextId++, name: `Person ${String.fromCharCode(65 + people.length)}`, unit: "cm", cm: 165 });
    renderInputs();
    draw();
  });
  document.getElementById("reset").addEventListener("click", () => {
    people = [
      { id: nextId++, name: "Person A", unit: "cm", cm: 170 },
      { id: nextId++, name: "Person B", unit: "ftin", cm: 160 }
    ];
    renderInputs();
    draw();
  });
  document.getElementById("download-image").addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const width = 1200, height = 720;
    canvas.width = width; canvas.height = height;
    ctx.fillStyle = "#f7f5ff"; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#101828"; ctx.font = "bold 38px Arial"; ctx.fillText("Height Comparison", 54, 62);
    ctx.fillStyle = "#667085"; ctx.font = "20px Arial"; ctx.fillText("Compare heights visually", 54, 95);
    const tallest = Math.max(...people.map(p => p.cm));
    const baseline = 570;
    const available = 390;
    const slot = (width - 100) / people.length;
    people.forEach((p, i) => {
      const cx = 50 + slot * i + slot / 2;
      const h = p.cm / tallest * available;
      const color = colors[i % colors.length];
      ctx.fillStyle = color;
      // Simple stylized person silhouette: head, torso, arms and legs.
      const headR = Math.max(15, h * .055);
      const headY = baseline - h + headR;
      ctx.beginPath(); ctx.arc(cx, headY, headR, 0, Math.PI * 2); ctx.fill();
      const shoulderY = headY + headR + 8;
      const bodyW = Math.max(24, h * .11);
      const bodyH = h * .34;
      ctx.fillRect(cx - bodyW/2, shoulderY, bodyW, bodyH);
      ctx.lineWidth = Math.max(10, h * .055); ctx.lineCap = "round"; ctx.strokeStyle = color;
      ctx.beginPath(); ctx.moveTo(cx - bodyW/2, shoulderY + 8); ctx.lineTo(cx - bodyW, shoulderY + bodyH*.65); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + bodyW/2, shoulderY + 8); ctx.lineTo(cx + bodyW, shoulderY + bodyH*.65); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - bodyW*.25, shoulderY + bodyH); ctx.lineTo(cx - bodyW*.35, baseline - 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + bodyW*.25, shoulderY + bodyH); ctx.lineTo(cx + bodyW*.35, baseline - 5); ctx.stroke();
      ctx.fillStyle = "#101828"; ctx.textAlign = "center"; ctx.font = "bold 21px Arial";
      ctx.fillText((p.name || "Person").slice(0, 20), cx, 615);
      ctx.fillStyle = "#667085"; ctx.font = "18px Arial";
      ctx.fillText(formatHeight(p.cm), cx, 648);
    });
    ctx.fillStyle = "#7357ff"; ctx.fillRect(50, baseline, width - 100, 3);
    ctx.fillStyle = "#667085"; ctx.textAlign = "left"; ctx.font = "15px Arial";
    ctx.fillText("Illustrative comparison • Calculated locally in your browser", 54, 690);
    const link = document.createElement("a");
    link.download = "height-comparison.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
  document.getElementById("year").textContent = new Date().getFullYear();
  renderInputs();
  draw();
})();