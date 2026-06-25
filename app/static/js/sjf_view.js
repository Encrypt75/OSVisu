(function () {
    const rowsContainer = document.getElementById("sjf-process-rows");
    const addRowBtn = document.getElementById("sjf-add-row");
    const ganttEl = document.getElementById("sjf-gantt");
    const timeAxisEl = document.getElementById("sjf-time-axis");
    const modeBtns = document.querySelectorAll(".sjf-mode-btn");

    let mode = "non-preemptive";
    let debounceTimer = null;

    const SEGMENT_COLORS = [
        "#a78bfa", "#6366f1", "#38bdf8", "#34d399",
        "#fbbf24", "#f472b6", "#fb923c", "#2dd4bf",
    ];

    function colorForPid(pid) {
        const num = parseInt(String(pid).replace(/\D/g, ""), 10) || 0;
        return SEGMENT_COLORS[(num - 1) % SEGMENT_COLORS.length];
    }

    function getProcesses() {
        const rows = rowsContainer.querySelectorAll(".sjf-row");
        return [...rows].map((row, i) => {
            const arrival = Number(row.querySelector('[data-field="arrival"]').value);
            const burst = Number(row.querySelector('[data-field="burst"]').value);
            const label = row.querySelector(".sjf-pill--label")?.textContent || `P${i + 1}`;
            return { pid: label, arrival: isNaN(arrival) ? 0 : arrival, burst: isNaN(burst) ? 1 : burst };
        });
    }

    function createRow(index, arrival = 0, burst = 1) {
        const tr = document.createElement("tr");
        tr.className = "sjf-row";
        tr.dataset.index = String(index);
        tr.innerHTML = `
            <td><span class="sjf-pill sjf-pill--label">P${index + 1}</span></td>
            <td><input type="number" class="sjf-pill sjf-input" data-field="arrival" value="${arrival}" min="0" aria-label="P${index + 1} arrival time"></td>
            <td><input type="number" class="sjf-pill sjf-input" data-field="burst" value="${burst}" min="1" aria-label="P${index + 1} burst time"></td>
        `;
        return tr;
    }

    function renumberRows() {
        rowsContainer.querySelectorAll(".sjf-row").forEach((row, i) => {
            row.dataset.index = String(i);
            const label = row.querySelector(".sjf-pill--label");
            if (label) label.textContent = `P${i + 1}`;
            row.querySelectorAll(".sjf-input").forEach((input) => {
                const field = input.dataset.field;
                input.setAttribute("aria-label", `P${i + 1} ${field} time`);
            });
        });
    }

    function renderGantt(data) {
        const { timeline, total_time: totalTime } = data;

        if (!timeline || timeline.length === 0) {
            ganttEl.innerHTML = '<p class="sjf-gantt-empty">No schedule generated.</p>';
            timeAxisEl.innerHTML = "";
            return;
        }

        const bar = document.createElement("div");
        bar.className = "sjf-gantt-bar";
        bar.setAttribute("role", "img");
        bar.setAttribute("aria-label", "CPU scheduling Gantt chart");

        timeline.forEach((seg) => {
            const duration = seg.end - seg.start;
            const el = document.createElement("div");
            el.className = "sjf-gantt-segment";
            el.textContent = seg.pid;
            el.style.flex = String(duration);
            el.style.background = colorForPid(seg.pid);
            el.title = `${seg.pid}: ${seg.start} – ${seg.end}`;
            bar.appendChild(el);
        });

        ganttEl.innerHTML = "";
        ganttEl.appendChild(bar);

        const ticks = [];
        for (let t = 0; t <= totalTime; t++) {
            ticks.push(`<span>${t}</span>`);
        }
        timeAxisEl.innerHTML = ticks.join("");
    }

    function showError(message) {
        ganttEl.innerHTML = `<p class="sjf-error">${message}</p>`;
        timeAxisEl.innerHTML = "";
    }

    async function runSimulation() {
        const processes = getProcesses();

        if (processes.some((p) => p.burst < 1)) {
            showError("Burst time must be at least 1 for every process.");
            return;
        }

        try {
            const res = await fetch("/cpu/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    algorithm: mode === "preemptive" ? "ps" : "sjf",
                    processes,
                }),
            });

            if (!res.ok) {
                throw new Error("Simulation request failed.");
            }

            const data = await res.json();
            renderGantt(data);
        } catch (err) {
            showError("Error: " + err.message);
        }
    }

    function scheduleRun() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(runSimulation, 250);
    }

    addRowBtn.addEventListener("click", () => {
        const count = rowsContainer.querySelectorAll(".sjf-row").length;
        const row = createRow(count);
        rowsContainer.appendChild(row);
        renumberRows();
        scheduleRun();
    });

    rowsContainer.addEventListener("input", (e) => {
        if (e.target.classList.contains("sjf-input")) {
            scheduleRun();
        }
    });

    modeBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            mode = btn.dataset.mode;
            modeBtns.forEach((b) => b.classList.toggle("sjf-mode-btn--active", b === btn));
            scheduleRun();
        });
    });

    runSimulation();
})();
