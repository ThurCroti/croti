/*
 * Painel: "Resultados em destaque" (aba Configurações).
 * Salva em site_settings → chave "results_metrics" (JSON), a mesma tabela do
 * número de WhatsApp. O site lê esse valor na seção RESULTS logo após o hero.
 */
(function () {
    const settingsForm = document.getElementById("settings-form");
    if (!settingsForm || !window.CrotiCMS?.isConfigured()) return;

    const SETTING_KEY = "results_metrics";
    const CARD_COUNT = 4;
    const EXAMPLES = [
        { value: "4,2x", label_pt: "ROAS MÉDIO", label_en: "AVERAGE ROAS", context: "Escola do Franchising" },
        { value: "3,8%", label_pt: "CTR DOS CRIATIVOS", label_en: "CREATIVE CTR", context: "Meta Ads" },
        { value: "R$ 1,2M", label_pt: "EM VENDAS GERADAS", label_en: "IN SALES GENERATED", context: "Tráfego pago" },
        { value: "+300", label_pt: "CRIATIVOS ENTREGUES", label_en: "CREATIVES DELIVERED", context: "2024–2026" }
    ];

    const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);

    const cardRow = (index) => {
        const example = EXAMPLES[index];
        return `
            <fieldset class="results-admin-row">
                <legend>Card ${String(index + 1).padStart(2, "0")}</legend>
                <div class="field"><label for="rm-${index}-value">Número</label><input id="rm-${index}-value" data-card="${index}" data-prop="value" maxlength="16" placeholder="Ex: ${escapeHTML(example.value)}"></div>
                <div class="field"><label for="rm-${index}-pt">Rótulo (PT)</label><input id="rm-${index}-pt" data-card="${index}" data-prop="label_pt" maxlength="40" placeholder="Ex: ${escapeHTML(example.label_pt)}"></div>
                <div class="field"><label for="rm-${index}-en">Rótulo (EN)</label><input id="rm-${index}-en" data-card="${index}" data-prop="label_en" maxlength="40" placeholder="Ex: ${escapeHTML(example.label_en)}"></div>
                <div class="field"><label for="rm-${index}-ctx">Contexto <span>cliente, campanha…</span></label><input id="rm-${index}-ctx" data-card="${index}" data-prop="context" maxlength="40" placeholder="Ex: ${escapeHTML(example.context)}"></div>
            </fieldset>`;
    };

    const form = document.createElement("form");
    form.id = "results-form";
    form.className = "panel form-panel results-admin";
    form.innerHTML = `
        <div class="panel-heading compact">
            <div>
                <h2>Resultados em destaque</h2>
                <p>Seção logo depois do hero no site. Use números reais: views, ROAS, CTR, vendas, criativos entregues.</p>
            </div>
        </div>
        <div class="form-grid form-grid-three">
            <div class="field"><label for="rm-headline-value">Número principal</label><input id="rm-headline-value" data-prop="value" data-headline maxlength="16" placeholder="+100M" required></div>
            <div class="field"><label for="rm-headline-pt">Rótulo (PT)</label><input id="rm-headline-pt" data-prop="label_pt" data-headline maxlength="40" placeholder="VIEWS GERADAS"></div>
            <div class="field"><label for="rm-headline-en">Rótulo (EN)</label><input id="rm-headline-en" data-prop="label_en" data-headline maxlength="40" placeholder="VIEWS GENERATED"></div>
        </div>
        <p class="results-admin-note">Cards de métricas — preencha Número + pelo menos um Rótulo. <strong>Se deixar todos vazios</strong>, o site mostra cards calculados automaticamente (marcas atendidas, projetos publicados, criativos com IA e maior audiência).</p>
        <div class="results-admin-cards">${Array.from({ length: CARD_COUNT }, (_, index) => cardRow(index)).join("")}</div>
        <div class="form-actions">
            <p id="results-status" class="form-status" role="status"></p>
            <button type="submit" class="button button-primary">Salvar resultados</button>
        </div>
    `;
    settingsForm.after(form);

    const statusEl = form.querySelector("#results-status");
    const submitBtn = form.querySelector("button[type='submit']");

    const setStatus = (message, type) => {
        statusEl.textContent = message;
        statusEl.className = `form-status ${type ? `is-${type}` : ""}`;
    };

    function fill(data) {
        const headline = data?.headline || {};
        form.querySelectorAll("[data-headline]").forEach((input) => {
            input.value = headline[input.dataset.prop] || "";
        });
        const cards = Array.isArray(data?.cards) ? data.cards : [];
        form.querySelectorAll("[data-card]").forEach((input) => {
            const card = cards[Number(input.dataset.card)] || {};
            input.value = card[input.dataset.prop] || "";
        });
    }

    function collect() {
        const headline = {};
        form.querySelectorAll("[data-headline]").forEach((input) => {
            headline[input.dataset.prop] = input.value.trim();
        });

        const cards = Array.from({ length: CARD_COUNT }, () => ({}));
        form.querySelectorAll("[data-card]").forEach((input) => {
            cards[Number(input.dataset.card)][input.dataset.prop] = input.value.trim();
        });

        return {
            headline,
            cards: cards.filter((card) => card.value && (card.label_pt || card.label_en))
        };
    }

    async function load() {
        try {
            const raw = await window.CrotiCMS.getSetting(SETTING_KEY);
            fill(raw ? JSON.parse(raw) : { headline: { value: "+100M", label_pt: "VIEWS GERADAS", label_en: "VIEWS GENERATED" } });
        } catch (error) {
            fill({ headline: { value: "+100M", label_pt: "VIEWS GERADAS", label_en: "VIEWS GENERATED" } });
        }
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = collect();
        if (!data.headline.value) {
            setStatus("Preencha o número principal.", "error");
            return;
        }

        const incomplete = [...form.querySelectorAll(".results-admin-row")].some((row) => {
            const values = [...row.querySelectorAll("input")].map((input) => input.value.trim());
            const [value, pt, en] = values;
            return values.some(Boolean) && !(value && (pt || en));
        });
        if (incomplete) {
            setStatus("Algum card está incompleto: preencha Número e um Rótulo, ou deixe o card vazio.", "error");
            return;
        }

        submitBtn.disabled = true;
        setStatus("Salvando resultados...", "success");
        const { error } = await window.CrotiCMS.getClient()
            .from("site_settings")
            .upsert({ key: SETTING_KEY, value: JSON.stringify(data) });
        submitBtn.disabled = false;

        if (error) {
            setStatus("Erro ao salvar. Confira se você está logado como admin.", "error");
        } else {
            setStatus(data.cards.length
                ? `Resultados salvos — ${data.cards.length} card(s) no site.`
                : "Resultados salvos — cards automáticos no site.", "success");
        }
    });

    load();
})();
