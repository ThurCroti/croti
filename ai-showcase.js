/*
 * AI VIDEO EDITOR — seção de destaque para trabalhos feitos com IA.
 *
 * Como um vídeo entra aqui (sem mudar o banco):
 *   - no painel admin, no campo "Serviços", inclua "IA" ou o nome de qualquer
 *     ferramenta de IA (ex.: "Edição, Higgsfield, Magnific, ElevenLabs");
 *   - ou use "IA" / "AI" no título.
 * As ferramentas reconhecidas viram tags no card e na faixa "AI STACK".
 */
(function () {
    // Ferramentas reconhecidas: chave em minúsculas → nome exibido.
    const AI_TOOLS = {
        "claude": "Claude",
        "higgsfield": "Higgsfield",
        "magnific": "Magnific",
        "elevenlabs": "ElevenLabs",
        "eleven labs": "ElevenLabs",
        "kling": "Kling",
        "veo": "Veo",
        "veo 3": "Veo",
        "seedance": "Seedance",
        "nano banana": "Nano Banana",
        "runway": "Runway",
        "midjourney": "Midjourney",
        "sora": "Sora",
        "suno": "Suno",
        "chatgpt": "ChatGPT",
        "gpt": "ChatGPT",
        "gemini": "Gemini",
        "hailuo": "Hailuo",
        "minimax": "Hailuo",
        "wan": "Wan",
        "topaz": "Topaz",
        "krea": "Krea",
        "pika": "Pika",
        "luma": "Luma",
        "flux": "Flux",
        "heygen": "HeyGen",
        "hedra": "Hedra",
        "freepik": "Freepik",
        "capcut": "CapCut AI",
        "kling ai": "Kling",
        "veo 3.1": "Veo",
        "google veo": "Veo",
        "nanobanana": "Nano Banana",
        "premiere": "Premiere Pro",
        "premiere pro": "Premiere Pro",
        "adobe premiere": "Premiere Pro",
        "adobe premiere pro": "Premiere Pro"
    };

    // Stack exibida mesmo antes de os vídeos terem tags (roteiro → imagem → vídeo → upscale → voz → montagem).
    const DEFAULT_STACK = ["Claude", "Higgsfield", "Kling", "Veo", "Nano Banana", "Magnific", "ElevenLabs", "Premiere Pro"];

    // Aparecem como tag, mas sozinhas não colocam o vídeo na seção de IA.
    const NON_AI_TOOLS = new Set(["Premiere Pro"]);
    const GENERIC_AI = new Set(["ia", "ai", "inteligência artificial", "inteligencia artificial", "generative ai", "gen ai"]);

    const section = document.getElementById("ai-section");
    if (!section) return;

    const rail = section.querySelector("[data-ai-rail]");
    const stackList = section.querySelector("[data-ai-stack]");
    const countEl = section.querySelector("[data-ai-count]");
    const toolCountEl = section.querySelector("[data-ai-tool-count]");
    const prevBtn = section.querySelector("[data-ai-prev]");
    const nextBtn = section.querySelector("[data-ai-next]");

    const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);

    const toolFrom = (label) => AI_TOOLS[String(label || "").trim().toLowerCase()] || null;

    function analyse(video) {
        const services = Array.isArray(video.services) ? video.services : [];
        const tools = [];
        let generic = false;

        services.forEach((service) => {
            const tool = toolFrom(service);
            if (tool && !tools.includes(tool)) tools.push(tool);
            if (GENERIC_AI.has(String(service).trim().toLowerCase())) generic = true;
        });

        const titleIsAI = /(^|[^a-z])(ia|ai)([^a-z]|$)/i.test(video.title || "");
        const hasAITool = tools.some((tool) => !NON_AI_TOOLS.has(tool));
        return { isAI: hasAITool || generic || titleIsAI, tools };
    }

    const BRANDS = window.CROTI_AI_BRANDS || {};
    const FALLBACK_BRAND = { bg: "#1d1d1d", fg: "#ccff00", accent: "#ccff00", role: "AI TOOL" };

    const brandOf = (tool) => BRANDS[tool] || FALLBACK_BRAND;

    // Variáveis CSS com as cores oficiais de cada ferramenta.
    const brandStyle = (tool) => {
        const brand = brandOf(tool);
        return `--brand-bg:${brand.bg};--brand-fg:${brand.fg};--brand-accent:${brand.accent}`;
    };

    const logoHTML = (tool, className) => {
        const brand = brandOf(tool);
        const glyph = brand.path
            ? `<svg viewBox="${brand.viewBox}" aria-hidden="true" focusable="false"><path d="${brand.path}" fill="currentColor"/></svg>`
            : `<b aria-hidden="true">${escapeHTML(tool.charAt(0))}</b>`;
        return `<span class="${className}">${glyph}</span>`;
    };

    let stackTimer = null;

    function renderStack(tools) {
        const all = [...DEFAULT_STACK];
        tools.forEach((tool) => { if (!all.includes(tool)) all.push(tool); });

        stackList.innerHTML = all.map((tool, index) => `
            <li class="ai-stack-chip" style="${brandStyle(tool)}" data-tool="${escapeHTML(tool)}">
                ${logoHTML(tool, "ai-stack-logo")}
                <span class="ai-stack-text">
                    <span class="ai-stack-name">${escapeHTML(tool)}</span>
                    <span class="ai-stack-role">${escapeHTML(brandOf(tool).role)}</span>
                </span>
                <span class="ai-stack-index">${String(index + 1).padStart(2, "0")}</span>
            </li>
        `).join("");

        if (toolCountEl) toolCountEl.textContent = String(all.length).padStart(2, "0");
        startStackSpotlight();
    }

    // Destaca uma ferramenta por vez com a cor da marca (pausa no hover).
    function startStackSpotlight() {
        clearInterval(stackTimer);
        const chips = [...stackList.querySelectorAll(".ai-stack-chip")];
        if (!chips.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        let active = 0;
        let paused = false;
        const show = () => chips.forEach((chip, index) => chip.classList.toggle("is-active", index === active));
        show();

        stackList.onmouseenter = () => { paused = true; chips.forEach((chip) => chip.classList.remove("is-active")); };
        stackList.onmouseleave = () => { paused = false; show(); };

        stackTimer = setInterval(() => {
            if (paused || document.hidden) return;
            active = (active + 1) % chips.length;
            show();
        }, 1800);
    }

    // "Claude (script · direction) → Higgsfield (generative video) → … → final edit"
    const workflowOf = (tools) => tools.length
        ? `Workflow: ${tools.map((tool) => `${tool} (${brandOf(tool).role.toLowerCase()})`).join(" → ")} → final edit & sound.`
        : "";

    function toProject(entry) {
        const { video, tools } = entry;
        const baseDescription = video.description || "Generative video workflow — AI-assisted production, edit, sound and motion.";
        return {
            id: `ai-${video.id}`,
            title: video.title,
            client: video.client || "CROTI / AI VIDEO",
            category: "ai",
            year: String(video.year || "2026"),
            services: tools.length ? ["AI VIDEO", ...tools] : ["AI VIDEO", ...(video.services || [])],
            description: [baseDescription, workflowOf(tools)].filter(Boolean).join(" "),
            thumbnail: video.posterUrl || "",
            poster: video.posterUrl || "",
            video: video.videoUrl,
            aspect: video.aspect === "vertical" ? "vertical" : "horizontal"
        };
    }

    function renderCards(entries) {
        rail.innerHTML = entries.map((entry, index) => {
            const { video, tools } = entry;
            const vertical = video.aspect === "vertical";
            const tags = tools.length
                ? tools.map((tool) => `<li style="${brandStyle(tool)}">${logoHTML(tool, "ai-tag-logo")}${escapeHTML(tool)}</li>`).join("")
                : `<li class="is-generic">AI VIDEO</li>`;
            return `
                <article class="ai-card ${vertical ? "is-vertical" : "is-horizontal"}" role="button" tabindex="0"
                    data-ai-index="${index}" aria-label="Abrir vídeo ${escapeHTML(video.title)}">
                    <div class="ai-card-media">
                        <video data-src="${escapeHTML(video.videoUrl)}"
                            ${video.posterUrl ? `poster="${escapeHTML(video.posterUrl)}"` : ""}
                            muted loop playsinline preload="none"></video>
                        <div class="ai-card-ui" aria-hidden="true">
                            <span class="ai-card-rec"><i></i>AI / ${String(index + 1).padStart(2, "0")}</span>
                            <span>${vertical ? "9:16" : "16:9"}</span>
                        </div>
                        <span class="ai-card-scan" aria-hidden="true"></span>
                        <span class="ai-card-play" aria-hidden="true">PLAY ↗</span>
                    </div>
                    <footer class="ai-card-caption">
                        <div class="ai-card-info">
                            <strong>${escapeHTML(video.title)}</strong>
                            <small>${escapeHTML(video.client || "CROTI")} · ${escapeHTML(video.year || "2026")}</small>
                        </div>
                        <ul class="ai-card-tags" aria-label="Ferramentas de IA">${tags}</ul>
                    </footer>
                </article>
            `;
        }).join("");

        const projects = entries.map(toProject);
        const cards = [...rail.querySelectorAll(".ai-card")];

        const open = (card) => {
            const project = projects[Number(card.dataset.aiIndex)];
            track(`AI Video: ${project.title}`);
            document.dispatchEvent(new CustomEvent("croti:open-showcase-project", {
                detail: { projects, projectId: projects[Number(card.dataset.aiIndex)].id, trigger: card }
            }));
        };

        const ensureSrc = (video) => {
            if (!video.src && video.dataset.src) {
                // "#t=0.5" faz o navegador mostrar um frame quando não há capa.
                video.src = video.poster ? video.dataset.src : `${video.dataset.src}#t=0.5`;
                video.preload = "metadata";
            }
        };

        const canHover = window.matchMedia("(hover: hover)").matches;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const observer = "IntersectionObserver" in window ? new IntersectionObserver((items) => {
            items.forEach(({ target, isIntersecting }) => {
                const video = target.querySelector("video");
                if (isIntersecting) {
                    ensureSrc(video);
                    if (!canHover && !reduceMotion) video.play().catch(() => {});
                } else {
                    video.pause();
                }
            });
        }, { root: null, rootMargin: "200px", threshold: 0.35 }) : null;

        cards.forEach((card) => {
            const video = card.querySelector("video");
            if (observer) observer.observe(card); else ensureSrc(video);

            card.addEventListener("click", () => open(card));
            card.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    open(card);
                }
            });

            if (canHover && !reduceMotion) {
                card.addEventListener("mouseenter", () => { ensureSrc(video); video.play().catch(() => {}); });
                card.addEventListener("mouseleave", () => video.pause());
            }
        });
    }

    function setupRail() {
        const step = () => {
            const card = rail.querySelector(".ai-card");
            return card ? card.getBoundingClientRect().width + 24 : rail.clientWidth * 0.8;
        };
        const update = () => {
            const max = rail.scrollWidth - rail.clientWidth - 2;
            prevBtn.disabled = rail.scrollLeft <= 2;
            nextBtn.disabled = rail.scrollLeft >= max;
        };
        prevBtn.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
        nextBtn.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));
        rail.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        update();
    }

    const track = (name) => {
        try {
            if (window.CrotiCMS?.isConfigured()) window.CrotiCMS.registerClick(name);
        } catch (error) { /* métricas nunca devem quebrar a página */ }
    };

    // Botão "QUERO UM VÍDEO COM IA": WhatsApp com a mensagem já escrita.
    function setupCTA() {
        const cta = section.querySelector("[data-ai-cta]");
        if (!cta) return;

        const buildHref = () => {
            const waHref = document.querySelector("[data-wa-link]")?.getAttribute("href") || "";
            const number = (waHref.match(/wa\.me\/(\d+)/) || [])[1] || "5519989826903";
            const lang = (() => { try { return localStorage.getItem("croti_lang"); } catch (e) { return null; } })();
            const message = lang === "EN"
                ? "Hi Croti! I saw your AI video work on your portfolio and I'd like a quote."
                : "Olá, Croti! Vi seus trabalhos com IA no portfólio e quero um orçamento.";
            return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
        };

        cta.href = buildHref();
        // O número do painel chega depois; atualiza o link no momento do clique.
        cta.addEventListener("pointerdown", () => { cta.href = buildHref(); });
        cta.addEventListener("focus", () => { cta.href = buildHref(); });
        cta.addEventListener("click", () => {
            cta.href = buildHref();
            track("AI Section CTA");
        });
    }

    // A seção fica acima do Long Form (que é fixado pelo ScrollTrigger):
    // quando a altura dela muda, as posições precisam ser recalculadas.
    const refreshScroll = () => {
        if (window.ScrollTrigger) requestAnimationFrame(() => window.ScrollTrigger.refresh());
    };

    async function init() {
        renderStack([]);
        setupCTA();

        if (!window.CrotiCMS?.isConfigured()) {
            section.hidden = true;
            refreshScroll();
            return;
        }

        try {
            const videos = await window.CrotiCMS.listPublished();
            const entries = videos
                .filter((video) => video.videoUrl)
                .map((video) => ({ video, ...analyse(video) }))
                .filter((entry) => entry.isAI);

            if (!entries.length) {
                section.hidden = true;
                refreshScroll();
                return;
            }

            // Vídeos com mais ferramentas marcadas aparecem primeiro.
            const aiCount = (entry) => entry.tools.filter((tool) => !NON_AI_TOOLS.has(tool)).length;
            entries.sort((a, b) => aiCount(b) - aiCount(a));

            const usedTools = [];
            entries.forEach(({ tools }) => tools.forEach((tool) => { if (!usedTools.includes(tool)) usedTools.push(tool); }));

            renderStack(usedTools);
            renderCards(entries);
            if (countEl) countEl.textContent = String(entries.length).padStart(2, "0");
            setupRail();
            refreshScroll();
        } catch (error) {
            console.warn("Não foi possível carregar a seção de IA.", error);
            section.hidden = true;
            refreshScroll();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
