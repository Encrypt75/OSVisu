(function applyAlgoFromUrl() {
    const algo = new URLSearchParams(window.location.search).get("algorithm");
    const sel = document.getElementById("disk-algorithm");
    if (algo && sel && [...sel.options].some((o) => o.value === algo)) sel.value = algo;
})();

document.getElementById("disk-run")?.addEventListener("click", async () => {
    const output = document.getElementById("disk-output");
    const viz = document.getElementById("disk-visualization");

    try {
        const requests = document
            .getElementById("disk-requests")
            .value.split(",")
            .map((s) => Number(s.trim()))
            .filter((n) => !Number.isNaN(n));

        const res = await fetch("/disk/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                algorithm: document.getElementById("disk-algorithm").value,
                head: Number(document.getElementById("disk-head").value),
                requests,
            }),
        });
        const data = await res.json();
        output.textContent = `Total seek: ${data.total_seek}\nOrder: ${data.order.join(" → ")}\n\n` + JSON.stringify(data, null, 2);

        viz.innerHTML = data.movements
            .map((m) => `<div style="margin:0.25rem 0">Seek ${m.from} → ${m.to} (${Math.abs(m.to - m.from)} cylinders)</div>`)
            .join("");
    } catch (err) {
        output.textContent = "Error: " + err.message;
    }
});
