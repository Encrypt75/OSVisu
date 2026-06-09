(function applyAlgoFromUrl() {
    const algo = new URLSearchParams(window.location.search).get("algorithm");
    const sel = document.getElementById("memory-algorithm");
    if (algo && sel && [...sel.options].some((o) => o.value === algo)) sel.value = algo;
})();

document.getElementById("memory-run")?.addEventListener("click", async () => {
    const output = document.getElementById("memory-output");
    const viz = document.getElementById("memory-visualization");

    try {
        const blocks = JSON.parse(document.getElementById("memory-blocks").value);
        const res = await fetch("/memory/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                algorithm: document.getElementById("memory-algorithm").value,
                request: Number(document.getElementById("memory-request").value),
                blocks,
            }),
        });
        const data = await res.json();
        output.textContent = JSON.stringify(data, null, 2);

        viz.innerHTML = blocks
            .map(
                (b, i) =>
                    `<div style="padding:0.5rem;margin:0.25rem 0;background:${i === data.block_index ? Animator.colorForIndex(0) : "#2d3a4f"};border-radius:4px">Block ${i}: ${b.size} (${b.free ? "free" : "used"})</div>`
            )
            .join("");
    } catch (err) {
        output.textContent = "Error: " + err.message;
    }
});
