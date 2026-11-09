/*
 * Faixa "SELECTED CLIENTS" logo abaixo da seção de IA.
 * Os nomes vêm do campo "Cliente" dos vídeos publicados e dos perfis em
 * "Clientes" do painel (com o número de seguidores). Nada para editar aqui:
 * basta preencher o cliente de cada vídeo no admin.
 */
(function () {
    // Valores do campo "Cliente" que não são marcas.
    const IGNORE = new Set(["croti", "produtora", "pizza", "cliente", "client"]);
    const MIN_NAMES = 3;

    const section = document.getElementById("clients-strip");
    const track = section?.querySelector("[data-client-strip]");
    if (!section || !track) return;

    const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);

    const clean = (name) => String(name || "").replace(/\s+/g, " ").trim();
    const keyOf = (name) => clean(name).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

    const formatFollowers = (count) => {
        const value = Number(count) || 0;
        if (value >= 1e6) return `${(value / 1e6).toFixed(value >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`;
        if (value >= 1e3) return `${Math.round(value / 1e3)}K`;
        return "";
    };

    const refreshScroll = () => {
        if (window.ScrollTrigger) requestAnimationFrame(() => window.ScrollTrigger.refresh());
    };

    const hide = () => {
        section.hidden = true;
        refreshScroll();
    };

    function render(names) {
        const item = ({ name, badge }, index) => `
            <li class="client-strip-item ${index % 2 ? "is-outline" : ""}">
                <span>${escapeHTML(name)}</span>${badge ? `<small>${escapeHTML(badge)}</small>` : ""}
            </li>
            <li class="client-strip-sep" aria-hidden="true">✦</li>`;

        const group = names.map(item).join("");
        // Duas cópias para o loop infinito; a segunda é só visual.
        track.innerHTML = group + group.replace(/<li class="client-strip-item/g, '<li aria-hidden="true" class="client-strip-item');
        const seconds = Math.max(28, names.length * 5);
        track.style.setProperty("--client-strip-duration", `${seconds}s`);
    }

    async function init() {
        if (!window.CrotiCMS?.isConfigured()) return hide();

        try {
            const [videos, clients] = await Promise.all([
                window.CrotiCMS.listPublished(),
                window.CrotiCMS.listPublishedClients().catch(() => [])
            ]);

            const seen = new Map();
            const add = (name, badge = "") => {
                const label = clean(name);
                const key = keyOf(label);
                if (!key || IGNORE.has(key)) return;
                const existing = seen.get(key);
                if (existing) {
                    if (badge && !existing.badge) existing.badge = badge;
                    return;
                }
                seen.set(key, { name: label, badge });
            };

            // Perfis com seguidores primeiro (prova social mais forte).
            clients
                .slice()
                .sort((a, b) => (b.followersCount || Number(b.followers_count) || 0) - (a.followersCount || Number(a.followers_count) || 0))
                .forEach((client) => add(client.name, formatFollowers(client.followersCount || client.followers_count)));
            videos.forEach((video) => add(video.client));

            const names = [...seen.values()];
            if (names.length < MIN_NAMES) return hide();
            render(names);
        } catch (error) {
            console.warn("Não foi possível carregar a faixa de clientes.", error);
            hide();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
