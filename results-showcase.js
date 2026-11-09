/*
 * RESULTS — "+100M views" e métricas de criativos, logo depois do hero.
 *
 * Os números vêm do painel (Configurações → Resultados em destaque), salvos em
 * site_settings com a chave "results_metrics". Sem métricas cadastradas, os
 * cards são calculados a partir dos dados reais publicados (marcas, projetos,
 * criativos com IA e maior audiência atendida).
 */
(function () {
    const section = document.getElementById("results");
    if (!section) return;

    const headlineEl = section.querySelector("[data-results-headline]");
    const headlineLabelEl = section.querySelector("[data-results-headline-label]");
    const cardsEl = section.querySelector("[data-results-cards]");
    const cta = section.querySelector("[data-results-cta]");

    const DEFAULT_HEADLINE = { value: "+100M", label_pt: "VIEWS GERADAS", label_en: "VIEWS GENERATED" };
    const IGNORE_CLIENTS = new Set(["croti", "produtora", "pizza", "cliente", "client"]);
    const NON_AI_TOOLS = new Set(["premiere pro"]);

    let headline = { ...DEFAULT_HEADLINE };
    let cards = [];
    let hasAnimated = false;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);

    const lang = () => {
        try { return localStorage.getItem("croti_lang") === "PT" ? "PT" : "EN"; } catch (error) { return "EN"; }
    };
    const labelOf = (item) => (lang() === "PT" ? item.label_pt || item.label_en : item.label_en || item.label_pt) || "";

    // ---------- Contagem animada ----------
    // Divide "R$ 1,2M" em prefixo "R$ ", número "1,2" e sufixo "M".
    const splitValue = (raw) => {
        const match = String(raw || "").match(/^(\D*?)(\d+(?:[.,]\d+)?)(.*)$/);
        if (!match) return null;
        const [, prefix, number, suffix] = match;
        const separator = number.includes(",") ? "," : ".";
        const decimals = number.includes(separator) ? number.split(separator)[1].length : 0;
        return { prefix, suffix, target: parseFloat(number.replace(",", ".")), decimals, separator };
    };

    const formatNumber = (value, parts) => {
        const fixed = value.toFixed(parts.decimals);
        return parts.separator === "," ? fixed.replace(".", ",") : fixed;
    };

    const countUp = (el) => {
        const raw = el.dataset.value || el.textContent;
        const parts = splitValue(raw);
        if (!parts || reduceMotion) {
            el.textContent = raw;
            return;
        }
        const duration = 1700;
        const start = performance.now();
        const step = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(2, -10 * t);
            el.textContent = `${parts.prefix}${formatNumber(parts.target * (t === 1 ? 1 : eased), parts)}${parts.suffix}`;
            if (t < 1) requestAnimationFrame(step);
        };
        el.textContent = `${parts.prefix}${formatNumber(0, parts)}${parts.suffix}`;
        requestAnimationFrame(step);
    };

    const animateAll = () => {
        hasAnimated = true;
        section.classList.add("is-visible");
        section.querySelectorAll("[data-value]").forEach(countUp);
    };

    // ---------- Render ----------
    function renderHeadline() {
        headlineEl.dataset.value = headline.value;
        headlineEl.textContent = headline.value;
        headlineLabelEl.textContent = labelOf(headline);
    }

    function renderCards() {
        cardsEl.innerHTML = cards.map((card, index) => `
            <li class="results-card">
                <span class="results-card-index">${String(index + 1).padStart(2, "0")}</span>
                <strong class="results-card-value" data-value="${escapeHTML(card.value)}">${escapeHTML(card.value)}</strong>
                <span class="results-card-label">${escapeHTML(labelOf(card))}</span>
                ${card.context ? `<span class="results-card-context">${escapeHTML(card.context)}</span>` : ""}
                <i class="results-card-bar" aria-hidden="true"></i>
            </li>
        `).join("");
        if (hasAnimated) cardsEl.querySelectorAll("[data-value]").forEach(countUp);
    }

    function updateLabels() {
        headlineLabelEl.textContent = labelOf(headline);
        cardsEl.querySelectorAll(".results-card-label").forEach((el, index) => {
            if (cards[index]) el.textContent = labelOf(cards[index]);
        });
    }

    // ---------- Métricas calculadas com dados reais ----------
    function computedCards(videos, clients) {
        const keyOf = (name) => String(name || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
        const brands = new Map();
        const addBrand = (name) => {
            const key = keyOf(name);
            if (key && !IGNORE_CLIENTS.has(key) && !brands.has(key)) brands.set(key, String(name).replace(/\s+/g, " ").trim());
        };
        clients.forEach((client) => addBrand(client.name));
        videos.forEach((video) => addBrand(video.client));

        const aiTools = Object.keys(window.CROTI_AI_BRANDS || {}).map((tool) => tool.toLowerCase()).filter((tool) => !NON_AI_TOOLS.has(tool));
        const isAI = (video) => {
            const services = (video.services || []).map((service) => String(service).trim().toLowerCase());
            return services.some((service) => service === "ia" || service === "ai" || aiTools.includes(service))
                || /(^|[^a-z])(ia|ai)([^a-z]|$)/i.test(video.title || "");
        };

        const biggest = clients
            .map((client) => ({ name: client.name, count: client.followersCount || Number(client.followers_count) || 0 }))
            .sort((a, b) => b.count - a.count)[0];
        const compact = (count) => count >= 1e6 ? `${(count / 1e6).toFixed(count >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M` : `${Math.round(count / 1e3)}K`;

        const list = [];
        if (brands.size) list.push({ value: String(brands.size), label_pt: "MARCAS ATENDIDAS", label_en: "BRANDS SERVED", context: [...brands.values()].slice(0, 3).join(" · ") });
        if (videos.length) list.push({ value: String(videos.length), label_pt: "PROJETOS PUBLICADOS", label_en: "PUBLISHED PROJECTS", context: "SHORT · LONG · VSL" });
        const aiCount = videos.filter(isAI).length;
        if (aiCount) list.push({ value: String(aiCount).padStart(2, "0"), label_pt: "CRIATIVOS COM IA", label_en: "AI CREATIVES", context: "CLAUDE · HIGGSFIELD · KLING" });
        if (biggest && biggest.count >= 1000) list.push({ value: compact(biggest.count), label_pt: "MAIOR AUDIÊNCIA ATENDIDA", label_en: "LARGEST AUDIENCE SERVED", context: biggest.name });
        return list.slice(0, 4);
    }

    // ---------- Botão de WhatsApp ----------
    function setupCTA() {
        if (!cta) return;
        const buildHref = () => {
            const waHref = document.querySelector("[data-wa-link]")?.getAttribute("href") || "";
            const number = (waHref.match(/wa\.me\/(\d+)/) || [])[1] || "5519989826903";
            const message = lang() === "EN"
                ? "Hi Croti! I saw your results and I want ad creatives that convert. Can we talk?"
                : "Olá, Croti! Vi seus resultados e quero criativos de tráfego pago que convertem. Podemos conversar?";
            return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
        };
        cta.href = buildHref();
        ["pointerdown", "focus"].forEach((type) => cta.addEventListener(type, () => { cta.href = buildHref(); }));
        cta.addEventListener("click", () => {
            cta.href = buildHref();
            try { if (window.CrotiCMS?.isConfigured()) window.CrotiCMS.registerClick("Results CTA"); } catch (error) { /* ignore */ }
        });
    }

    const refreshScroll = () => {
        if (window.ScrollTrigger) requestAnimationFrame(() => window.ScrollTrigger.refresh());
    };

    async function init() {
        renderHeadline();
        setupCTA();

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    animateAll();
                    observer.disconnect();
                }
            }, { threshold: 0.3 });
            observer.observe(section);
        } else {
            animateAll();
        }

        window.addEventListener("croti-lang-change", updateLabels);

        if (!window.CrotiCMS?.isConfigured()) {
            cardsEl.hidden = true;
            return;
        }

        try {
            const [stored, videos, clients] = await Promise.all([
                window.CrotiCMS.getSetting("results_metrics").catch(() => null),
                window.CrotiCMS.listPublished().catch(() => []),
                window.CrotiCMS.listPublishedClients().catch(() => [])
            ]);

            let saved = null;
            try { saved = stored ? JSON.parse(stored) : null; } catch (error) { saved = null; }

            if (saved?.headline?.value) headline = { ...DEFAULT_HEADLINE, ...saved.headline };
            const savedCards = (saved?.cards || []).filter((card) => card && card.value && (card.label_pt || card.label_en));
            cards = savedCards.length ? savedCards.slice(0, 4) : computedCards(videos, clients);

            renderHeadline();
            if (hasAnimated) countUp(headlineEl);
            cardsEl.hidden = !cards.length;
            renderCards();
            refreshScroll();
        } catch (error) {
            console.warn("Não foi possível carregar os resultados.", error);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
