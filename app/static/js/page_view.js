(function applyAlgoFromUrl() {
    const algo = new URLSearchParams(window.location.search).get("algorithm");
    const sel = document.getElementById("page-algorithm");
    if (algo && sel && [...sel.options].some((o) => o.value === algo)) sel.value = algo;
})();

document.getElementById("page-run")?.addEventListener("click", async () => {
    const output = document.getElementById("page-output");
    const viz = document.getElementById("page-visualization");

    try {
        const pages = document
            .getElementById("page-sequence")
            .value.split(",")
            .map((s) => Number(s.trim()))
            .filter((n) => !Number.isNaN(n));

        const res = await fetch("/page/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                algorithm: document.getElementById("page-algorithm").value,
                frames: Number(document.getElementById("page-frames").value),
                pages,
            }),
        });
        const data = await res.json();
        output.textContent = `Page faults: ${data.faults}\n\n` + JSON.stringify(data.history, null, 2);

        viz.innerHTML = data.history
            .map(
                (step) =>
                    `<div style="margin:0.25rem 0">Page ${step.page} → [${step.frames.join(", ")}]${step.fault ? " <strong>FAULT</strong>" : ""}</div>`
            )
            .join("");
    } catch (err) {
        output.textContent = "Error: " + err.message;
    }
});
