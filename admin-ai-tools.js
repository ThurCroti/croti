/*
 * Painel: seletor visual das ferramentas de IA no formulário de trabalho.
 * Cada clique adiciona/remove o nome no campo "Serviços" — é ele que decide
 * se o vídeo aparece na seção AI VIDEO EDITOR do site e quais logos mostrar.
 */
(function () {
    const input = document.getElementById("video-services");
    if (!input) return;

    const BRANDS = window.CROTI_AI_BRANDS || {};
    const EXTRA_TOOLS = ["Seedance", "Wan", "Runway", "Midjourney", "Sora", "Topaz", "HeyGen", "Hedra"];
    const TOOLS = [...new Set([...Object.keys(BRANDS), ...EXTRA_TOOLS])];
    const AI_FLAG = "IA";

    const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);

    const readList = () => input.value.split(",").map((value) => value.trim()).filter(Boolean);
    const has = (list, name) => list.some((value) => value.toLowerCase() === name.toLowerCase());

    const logo = (tool) => {
        const brand = BRANDS[tool];
        if (!brand) return `<span class="ai-pick-logo" style="--bg:#1d1d1d;--fg:#ccff00"><b>${escapeHTML(tool.charAt(0))}</b></span>`;
        return `<span class="ai-pick-logo" style="--bg:${brand.bg};--fg:${brand.fg}"><svg viewBox="${brand.viewBox}" aria-hidden="true"><path d="${brand.path}" fill="currentColor"/></svg></span>`;
    };

    const field = document.createElement("div");
    field.className = "field field-wide ai-pick-field";
    field.innerHTML = `
        <span class="ai-pick-label">Seção AI Video Editor <span>clique para marcar — vai direto para "Serviços"</span></span>
        <div class="ai-pick-list">
            <button type="button" class="ai-pick is-flag" data-tool="${AI_FLAG}" aria-pressed="false">
                <span class="ai-pick-logo" style="--bg:#ccff00;--fg:#050505"><b>AI</b></span>Mostrar em IA
            </button>
            ${TOOLS.map((tool) => `
                <button type="button" class="ai-pick" data-tool="${escapeHTML(tool)}" aria-pressed="false">
                    ${logo(tool)}${escapeHTML(tool)}
                </button>`).join("")}
        </div>
    `;
    input.closest(".field").after(field);

    const buttons = [...field.querySelectorAll(".ai-pick")];

    const sync = () => {
        const list = readList();
        buttons.forEach((button) => {
            const active = has(list, button.dataset.tool);
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", String(active));
        });
    };

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const tool = button.dataset.tool;
            let list = readList();
            list = has(list, tool)
                ? list.filter((value) => value.toLowerCase() !== tool.toLowerCase())
                : [...list, tool];
            input.value = list.join(", ");
            input.dispatchEvent(new Event("input", { bubbles: true }));
            sync();
        });
    });

    input.addEventListener("input", sync);
    input.form?.addEventListener("reset", () => setTimeout(sync, 0));

    // O admin preenche o campo por código ao abrir "Editar"; acompanha essas mudanças.
    let last = input.value;
    setInterval(() => {
        if (input.value !== last) {
            last = input.value;
            sync();
        }
    }, 400);

    sync();
})();
