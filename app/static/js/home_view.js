document.querySelectorAll(".home-card-flip").forEach((card) => {
    card.addEventListener("click", () => {
        card.classList.toggle("is-flipped");
    });

    card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            card.classList.toggle("is-flipped");
        }
    });
});
