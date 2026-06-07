const Animator = {
    colors: ["#58a6ff", "#3fb950", "#d29922", "#f85149", "#a371f7", "#39c5cf"],

    colorForIndex(i) {
        return this.colors[i % this.colors.length];
    },

    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    },
};

window.Animator = Animator;
