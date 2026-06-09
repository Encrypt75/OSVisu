(function applyAlgoFromUrl() {
    const algo = new URLSearchParams(window.location.search).get("algorithm");
    const sel = document.getElementById("cpu-algorithm");
    if (algo && sel && [...sel.options].some((o) => o.value === algo)) sel.value = algo;
})();

document.getElementById("cpu-run")?.addEventListener("click", async () => {
    const output = document.getElementById("cpu-output");
    const viz = document.getElementById("cpu-visualization");

    try {
        const processes = JSON.parse(document.getElementById("cpu-processes").value);
        const res = await fetch("/cpu/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                algorithm: document.getElementById("cpu-algorithm").value,
                quantum: Number(document.getElementById("cpu-quantum").value),
                processes,
            }),
        });
        const data = await res.json();
        output.textContent = JSON.stringify(data, null, 2);

        const total = data.total_time || 1;
        viz.innerHTML = '<div class="timeline-bar"></div>';
        const bar = viz.querySelector(".timeline-bar");
        data.timeline.forEach((seg, i) => {
            const el = document.createElement("div");
            el.className = "timeline-segment";
            el.textContent = seg.pid;
            el.style.flex = seg.end - seg.start;
            el.style.background = Animator.colorForIndex(i);
            bar.appendChild(el);
        });
    } catch (err) {
        output.textContent = "Error: " + err.message;
    }
});
