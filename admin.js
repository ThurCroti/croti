document.addEventListener("DOMContentLoaded", async () => {
    const cms = window.CrotiCMS;
    const config = window.CROTI_SUPABASE || {};
    const maxUploadMB = Number(config.maxUploadMB) || 50;
    const imageTypes = ["image/jpeg", "image/png", "image/webp"];
    const videoTypes = ["video/mp4", "video/webm"];

    const setupState = document.getElementById("setup-state");
    const loginState = document.getElementById("login-state");
    const dashboardState = document.getElementById("dashboard-state");
    const sessionUI = document.getElementById("admin-session");
    const adminEmail = document.getElementById("admin-email");
    const loginForm = document.getElementById("login-form");
    const loginStatus = document.getElementById("login-status");
    const confirmOverlay = document.getElementById("confirm-overlay");
    const confirmTitle = document.getElementById("confirm-title");
    const confirmDescription = document.getElementById("confirm-description");
    const confirmDelete = document.getElementById("confirm-delete");
    const toastElement = document.getElementById("admin-toast");

    const state = {
        videos: [],
        clients: [],
        testimonials: [],
        editing: { video: null, client: null, testimonial: null },
        pendingDelete: null,
        activeTab: "videos",
        toastTimer: null
    };

    const resources = {
        video: {
            table: "portfolio_videos",
            plural: "videos",
            form: document.getElementById("video-form"),
            status: document.getElementById("video-status"),
            submit: document.getElementById("video-submit"),
            list: document.getElementById("video-list"),
            empty: document.getElementById("empty-video-library"),
            template: document.getElementById("video-card-template"),
            title: document.getElementById("video-form-title"),
            eyebrow: document.getElementById("video-form-eyebrow")
        },
        client: {
            table: "portfolio_clients",
            plural: "clients",
            form: document.getElementById("client-form"),
            status: document.getElementById("client-status"),
            submit: document.getElementById("client-submit"),
            list: document.getElementById("client-list"),
            empty: document.getElementById("empty-client-library"),
            template: document.getElementById("client-card-template"),
            title: document.getElementById("client-form-title"),
            eyebrow: document.getElementById("client-form-eyebrow")
        },
        testimonial: {
            table: "portfolio_testimonials",
            plural: "testimonials",
            form: document.getElementById("testimonial-form"),
            status: document.getElementById("testimonial-status"),
            submit: document.getElementById("testimonial-submit"),
            list: document.getElementById("testimonial-list"),
            empty: document.getElementById("empty-testimonial-library"),
            template: document.getElementById("testimonial-card-template"),
            title: document.getElementById("testimonial-form-title"),
            eyebrow: document.getElementById("testimonial-form-eyebrow")
        }
    };

    document.body.dataset.dependencies = window.supabase && window.tus?.Upload ? "ready" : "missing";

    if (!cms || !cms.isConfigured()) {
        setupState.hidden = false;
        return;
    }

    const supabase = cms.getClient();

    function setStatus(element, message = "", type = "") {
        element.textContent = message;
        element.className = `form-status${type ? ` is-${type}` : ""}`;
    }

    function showToast(message, type = "success") {
        window.clearTimeout(state.toastTimer);
        toastElement.textContent = message;
        toastElement.className = `admin-toast${type === "error" ? " is-error" : ""}`;
        toastElement.hidden = false;
        state.toastTimer = window.setTimeout(() => {
            toastElement.hidden = true;
        }, 4200);
    }

    function safeFileName(name) {
        const parts = String(name || "arquivo").toLowerCase().split(".");
        const extension = parts.length > 1 ? `.${parts.pop().replace(/[^a-z0-9]/g, "")}` : "";
        const base = parts.join("-")
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "arquivo";
        return `${base}${extension}`;
    }

    function uniqueId() {
        return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function initials(name) {
        return String(name || "C")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0] || "")
            .join("")
            .toUpperCase();
    }

    function categoryLabel(category) {
        return ({ featured: "LONG FORM", short: "SHORT FORM", vsl: "SHOWREEL / VSL" })[category] || "TRABALHO";
    }

    function platformLabel(platform) {
        return ({ instagram: "INSTAGRAM", youtube: "YOUTUBE", tiktok: "TIKTOK" })[platform] || "SOCIAL";
    }

    function metricLabel(platform) {
        return platform === "youtube" ? "inscritos" : "seguidores";
    }

    function formatFollowers(value) {
        return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value) || 0);
    }

    function profileHandleFromUrl(value, platform) {
        try {
            const url = new URL(String(value).trim());
            const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
            const domains = {
                instagram: ["instagram.com"],
                youtube: ["youtube.com", "youtu.be"],
                tiktok: ["tiktok.com"]
            };
            const allowed = (domains[platform] || []).some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
            if (!allowed) return "";
            const parts = url.pathname.split("/").filter(Boolean);
            if (platform === "youtube" && ["channel", "c", "user"].includes(parts[0])) {
                return (parts[1] || "").replace(/^@/, "");
            }
            return (parts[0] || "").replace(/^@/, "");
        } catch {
            return "";
        }
    }

    function validateImage(file) {
        if (!(file instanceof File) || !file.size) return;
        if (file.size > 8 * 1024 * 1024) throw new Error("A imagem ultrapassa o limite de 8 MB.");
        if (!imageTypes.includes(file.type)) throw new Error("Use uma imagem JPG, PNG ou WebP.");
    }

    async function getOwnerId() {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) throw new Error("Sua sessão expirou. Entre novamente.");
        return data.user.id;
    }

    async function uploadImage(file, folder) {
        validateImage(file);
        if (!(file instanceof File) || !file.size) return null;
        const owner = await getOwnerId();
        const path = `${owner}/${folder}/${uniqueId()}-${safeFileName(file.name)}`;
        const { error } = await supabase.storage
            .from("portfolio-media")
            .upload(path, file, { cacheControl: "31536000", upsert: false });
        if (error) throw error;
        return path;
    }

    async function removeMedia(paths) {
        const cleanPaths = [...new Set((paths || []).filter(Boolean))];
        if (!cleanPaths.length) return;
        const { error } = await supabase.storage.from("portfolio-media").remove(cleanPaths);
        if (error) throw error;
    }

    async function ensureAdmin() {
        const { data, error } = await supabase.rpc("is_croti_admin");
        if (error || !data) {
            await supabase.auth.signOut();
            throw new Error("Este usuário ainda não foi autorizado na tabela admins.");
        }
    }

    function setView(session) {
        const loggedIn = Boolean(session);
        setupState.hidden = true;
        loginState.hidden = loggedIn;
        dashboardState.hidden = !loggedIn;
        sessionUI.hidden = !loggedIn;
        adminEmail.textContent = session?.user?.email || "";
        if (loggedIn) loadAll();
    }

    async function validateSession(session) {
        if (!session) {
            setView(null);
            return;
        }
        try {
            await ensureAdmin();
            setView(session);
        } catch (error) {
            setStatus(loginStatus, error.message, "error");
            setView(null);
        }
    }

    function updateSummary() {
        const map = [
            ["videos", "summary-videos", "summary-videos-published", "tab-video-count"],
            ["clients", "summary-clients", "summary-clients-published", "tab-client-count"],
            ["testimonials", "summary-testimonials", "summary-testimonials-published", "tab-testimonial-count"]
        ];
        map.forEach(([key, totalId, publishedId, tabId]) => {
            const items = state[key];
            const published = items.filter((item) => item.published).length;
            document.getElementById(totalId).textContent = String(items.length).padStart(2, "0");
            document.getElementById(publishedId).textContent = `${published} ${published === 1 ? "publicado" : "publicados"}`;
            document.getElementById(tabId).textContent = items.length;
        });
    }

    async function loadResource(type) {
        const resource = resources[type];
        const { data, error } = await supabase
            .from(resource.table)
            .select("*")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });

        resource.list.innerHTML = "";
        if (error) {
            resource.empty.hidden = false;
            resource.empty.querySelector("p").textContent = `Não foi possível carregar: ${error.message}`;
            throw error;
        }

        state[resource.plural] = data || [];
        resource.empty.hidden = state[resource.plural].length > 0;
        state[resource.plural].forEach((item, index) => renderCard(type, item, index));
        updateSummary();
    }

    async function loadAll() {
        const results = await Promise.allSettled([
            loadResource("video"),
            loadResource("client"),
            loadResource("testimonial"),
            loadSettings(),
            loadAnalytics()
        ]);
        if (results.some((result) => result.status === "rejected")) {
            showToast("Alguns dados não carregaram. Execute a versão mais recente do supabase-schema.sql.", "error");
        }
    }

    function fillImagePreview(preview, path, name) {
        let image = preview.querySelector("img");
        let fallback = preview.querySelector(".avatar-initials");
        if (!fallback) {
            fallback = document.createElement("span");
            fallback.className = "avatar-initials";
            preview.prepend(fallback);
        }
        fallback.textContent = initials(name);
        if (path) {
            image.src = cms.getPublicUrl(path);
            image.alt = `Foto de ${name}`;
            image.hidden = false;
            fallback.hidden = true;
            image.addEventListener("error", () => {
                image.hidden = true;
                fallback.hidden = false;
            }, { once: true });
        } else {
            image.removeAttribute("src");
            image.hidden = true;
            fallback.hidden = false;
        }
    }

    function setMeta(element, values) {
        const fragment = document.createDocumentFragment();
        values.forEach((value) => {
            const span = document.createElement("span");
            span.textContent = String(value);
            fragment.appendChild(span);
        });
        element.replaceChildren(fragment);
    }

    function renderCard(type, item, index) {
        const resource = resources[type];
        const items = state[resource.plural];
        const card = resource.template.content.firstElementChild.cloneNode(true);
        const preview = card.querySelector(".content-preview");
        const contentState = card.querySelector(".content-state");
        const meta = card.querySelector(".content-meta");
        const subtitle = card.querySelector(".content-subtitle");

        contentState.textContent = item.published ? "PUBLICADO" : "RASCUNHO";
        contentState.classList.toggle("is-draft", !item.published);
        card.querySelector("h3").textContent = item.title || item.name;

        if (type === "video") {
            const video = preview.querySelector("video");
            video.src = cms.getPublicUrl(item.video_path);
            setMeta(meta, [categoryLabel(item.category), item.year || "—", `ORDEM ${item.sort_order}`]);
            subtitle.textContent = item.client || item.description || "Projeto autoral";
        } else if (type === "client") {
            fillImagePreview(preview, item.profile_path, item.name);
            const platform = item.platform || "instagram";
            setMeta(meta, [platformLabel(platform), `${formatFollowers(item.followers_count)} ${metricLabel(platform)}`, `ORDEM ${item.sort_order}`]);
            subtitle.textContent = `@${item.instagram_handle}`;
        } else {
            fillImagePreview(preview, item.profile_path, item.name);
            setMeta(meta, [item.role || "CLIENTE", `ORDEM ${item.sort_order}`]);
            card.querySelector("blockquote").textContent = `“${item.quote}”`;
        }

        card.querySelector(".edit-button").addEventListener("click", () => openForm(type, item));
        const upButton = card.querySelector(".order-up-button");
        const downButton = card.querySelector(".order-down-button");
        upButton.disabled = index === 0;
        downButton.disabled = index === items.length - 1;
        upButton.addEventListener("click", () => moveItem(type, index, -1, upButton));
        downButton.addEventListener("click", () => moveItem(type, index, 1, downButton));

        const toggleButton = card.querySelector(".toggle-button");
        toggleButton.textContent = item.published ? "Ocultar" : "Publicar";
        toggleButton.addEventListener("click", () => togglePublished(type, item, toggleButton));
        card.querySelector(".delete-button").addEventListener("click", () => requestDelete(type, item));
        resource.list.appendChild(card);
    }

    async function togglePublished(type, item, button) {
        button.disabled = true;
        const resource = resources[type];
        const { error } = await supabase.from(resource.table).update({ published: !item.published }).eq("id", item.id);
        if (error) {
            button.disabled = false;
            showToast(`Não foi possível atualizar: ${error.message}`, "error");
            return;
        }
        showToast(item.published ? "Item ocultado do portfólio." : "Item publicado no portfólio.");
        await loadResource(type);
    }

    async function moveItem(type, index, direction, button) {
        const resource = resources[type];
        const items = state[resource.plural];
        const targetIndex = index + direction;
        if (!items[targetIndex]) return;
        button.disabled = true;
        const current = items[index];
        const target = items[targetIndex];
        const currentOrder = Number(current.sort_order) || index;
        const targetOrder = Number(target.sort_order) || targetIndex;

        const [currentResult, targetResult] = await Promise.all([
            supabase.from(resource.table).update({ sort_order: targetOrder }).eq("id", current.id),
            supabase.from(resource.table).update({ sort_order: currentOrder }).eq("id", target.id)
        ]);
        const error = currentResult.error || targetResult.error;
        if (error) {
            button.disabled = false;
            showToast(`Não foi possível reordenar: ${error.message}`, "error");
            return;
        }
        await loadResource(type);
    }

    function setActiveTab(plural) {
        state.activeTab = plural;
        document.querySelectorAll("[data-admin-tab]").forEach((tab) => {
            const active = tab.dataset.adminTab === plural;
            tab.classList.toggle("is-active", active);
            tab.setAttribute("aria-selected", String(active));
        });
        document.querySelectorAll("[data-admin-panel]").forEach((panel) => {
            const active = panel.dataset.adminPanel === plural;
            panel.classList.toggle("is-active", active);
            panel.hidden = !active;
        });
    }

    function resetForm(type) {
        const resource = resources[type];
        resource.form.reset();
        resource.form.elements.published.checked = true;
        state.editing[type] = null;
        setStatus(resource.status);
        if (type === "video") {
            document.getElementById("video-year").value = new Date().getFullYear();
            document.getElementById("video-order").value = state.videos.length;
            document.getElementById("video-aspect").value = "horizontal";
        } else if (type === "client") {
            document.getElementById("client-followers").value = "0";
            document.getElementById("client-order").value = state.clients.length;
            document.getElementById("client-file-note").textContent = "Opcional; sem foto o site usa as iniciais.";
        } else {
            document.getElementById("testimonial-order").value = state.testimonials.length;
            document.getElementById("testimonial-file-note").textContent = "Sem foto, o site mostra as iniciais.";
        }
    }

    function openForm(type, item = null) {
        const resource = resources[type];
        setActiveTab(resource.plural);
        resetForm(type);
        resource.form.hidden = false;
        state.editing[type] = item;

        if (item) {
            resource.title.textContent = type === "video" ? "Editar trabalho" : type === "client" ? "Editar cliente" : "Editar depoimento";
            resource.eyebrow.textContent = "EDITAR CONTEÚDO";
            resource.submit.textContent = "Salvar alterações";
            resource.form.elements.published.checked = Boolean(item.published);

            if (type === "video") {
                resource.form.elements.title.value = item.title || "";
                resource.form.elements.year.value = item.year || new Date().getFullYear();
                resource.form.elements.client.value = item.client || "";
                resource.form.elements.category.value = item.category || "featured";
                resource.form.elements.aspect.value = item.aspect || (item.category === "short" ? "vertical" : "horizontal");
                resource.form.elements.description.value = item.description || "";
                resource.form.elements.services.value = Array.isArray(item.services) ? item.services.join(", ") : "";
                resource.form.elements.sort_order.value = Number(item.sort_order) || 0;
                resource.form.elements.video_url.value = item.video_path || "";
            } else if (type === "client") {
                resource.form.elements.name.value = item.name || "";
                resource.form.elements.platform.value = item.platform || "instagram";
                resource.form.elements.instagram_handle.value = item.instagram_handle || "";
                resource.form.elements.instagram_url.value = item.instagram_url || "";
                resource.form.elements.followers_count.value = Number(item.followers_count) || 0;
                resource.form.elements.sort_order.value = Number(item.sort_order) || 0;
                document.getElementById("client-file-note").textContent = "Deixe vazio para manter a foto atual.";
            } else {
                resource.form.elements.name.value = item.name || "";
                resource.form.elements.role.value = item.role || "";
                resource.form.elements.quote.value = item.quote || "";
                resource.form.elements.sort_order.value = Number(item.sort_order) || 0;
                document.getElementById("testimonial-file-note").textContent = "Deixe vazio para manter a foto atual.";
            }
        } else {
            resource.title.textContent = type === "video" ? "Novo trabalho" : type === "client" ? "Novo cliente" : "Novo depoimento";
            resource.eyebrow.textContent = type === "video" ? "NOVO CONTEÚDO" : type === "client" ? "NOVO PERFIL" : "NOVO REVIEW";
            resource.submit.textContent = type === "video" ? "Salvar trabalho" : type === "client" ? "Salvar cliente" : "Salvar depoimento";
        }

        window.requestAnimationFrame(() => {
            const firstInput = resource.form.querySelector("input:not([type='file']):not([type='checkbox'])");
            firstInput?.focus({ preventScroll: true });
            if (window.innerWidth < 1080) resource.form.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    function closeForm(type) {
        resetForm(type);
        resources[type].form.hidden = true;
    }

    async function saveVideo(event) {
        event.preventDefault();
        const resource = resources.video;
        const editing = state.editing.video;
        const formData = new FormData(resource.form);
        const videoUrl = String(formData.get("video_url") || "").trim();

        if (!videoUrl) {
            setStatus(resource.status, "Insira o link do vídeo.", "error");
            return;
        }

        resource.submit.disabled = true;
        setStatus(resource.status, editing ? "Salvando alterações..." : "Preparando salvamento...");

        try {
            const payload = {
                title: String(formData.get("title") || "").trim(),
                year: Math.min(2100, Math.max(2000, Number(formData.get("year")) || new Date().getFullYear())),
                client: String(formData.get("client") || "").trim(),
                category: String(formData.get("category") || "featured"),
                aspect: String(formData.get("aspect") || "horizontal"),
                description: String(formData.get("description") || "").trim(),
                services: String(formData.get("services") || "").split(",").map((value) => value.trim()).filter(Boolean),
                sort_order: Math.max(0, Number(formData.get("sort_order")) || 0),
                published: formData.get("published") === "on",
                video_path: videoUrl,
                poster_path: null // não usamos mais miniatura
            };

            const query = editing
                ? supabase.from(resource.table).update(payload).eq("id", editing.id)
                : supabase.from(resource.table).insert(payload);
            const { error } = await query;
            if (error) throw error;

            showToast(editing ? "Trabalho atualizado com sucesso." : "Trabalho adicionado ao portfólio.");
            await loadResource("video");
            closeForm("video");
        } catch (error) {
            setStatus(resource.status, `Falha ao salvar: ${error.message}`, "error");
        } finally {
            resource.submit.disabled = false;
        }
    }

    async function saveClient(event) {
        event.preventDefault();
        const resource = resources.client;
        const editing = state.editing.client;
        const formData = new FormData(resource.form);
        const platform = String(formData.get("platform") || "instagram");
        const profileUrl = String(formData.get("instagram_url") || "").trim();
        const extractedHandle = profileHandleFromUrl(profileUrl, platform);
        const handle = String(formData.get("instagram_handle") || extractedHandle).trim().replace(/^@/, "");
        const profileFile = formData.get("profile");
        const hasProfile = profileFile instanceof File && profileFile.size > 0;

        if (!extractedHandle) {
            setStatus(resource.status, `Use um link válido do ${platformLabel(platform)}.`, "error");
            return;
        }
        try { validateImage(profileFile); } catch (error) {
            setStatus(resource.status, error.message, "error");
            return;
        }

        resource.submit.disabled = true;
        setStatus(resource.status, editing ? "Atualizando cliente..." : "Salvando cliente...");
        let profilePath = editing?.profile_path || null;
        let newPath = null;

        try {
            if (hasProfile) {
                newPath = await uploadImage(profileFile, "clients");
                profilePath = newPath;
            }
            const payload = {
                name: String(formData.get("name") || "").trim(),
                platform,
                instagram_url: profileUrl,
                instagram_handle: handle || extractedHandle,
                followers_count: Math.max(0, Number(formData.get("followers_count")) || 0),
                sort_order: Math.max(0, Number(formData.get("sort_order")) || 0),
                published: formData.get("published") === "on",
                verified: true,
                profile_path: profilePath
            };
            const query = editing
                ? supabase.from(resource.table).update(payload).eq("id", editing.id)
                : supabase.from(resource.table).insert(payload);
            const { error } = await query;
            if (error) throw error;

            if (editing?.profile_path && hasProfile) {
                try { await removeMedia([editing.profile_path]); } catch (storageError) { console.warn(storageError); }
            }
            showToast(editing ? "Cliente atualizado com sucesso." : "Cliente adicionado com selo verificado.");
            await loadResource("client");
            closeForm("client");
        } catch (error) {
            if (newPath) {
                try { await removeMedia([newPath]); } catch (cleanupError) { console.warn(cleanupError); }
            }
            setStatus(resource.status, `Falha ao salvar: ${error.message}`, "error");
        } finally {
            resource.submit.disabled = false;
        }
    }

    async function saveTestimonial(event) {
        event.preventDefault();
        const resource = resources.testimonial;
        const editing = state.editing.testimonial;
        const formData = new FormData(resource.form);
        const profileFile = formData.get("profile");
        const hasProfile = profileFile instanceof File && profileFile.size > 0;
        try { validateImage(profileFile); } catch (error) {
            setStatus(resource.status, error.message, "error");
            return;
        }

        resource.submit.disabled = true;
        setStatus(resource.status, editing ? "Atualizando depoimento..." : "Salvando depoimento...");
        let profilePath = editing?.profile_path || null;
        let newPath = null;

        try {
            if (hasProfile) {
                newPath = await uploadImage(profileFile, "testimonials");
                profilePath = newPath;
            }
            const payload = {
                name: String(formData.get("name") || "").trim(),
                role: String(formData.get("role") || "").trim(),
                quote: String(formData.get("quote") || "").trim(),
                sort_order: Math.max(0, Number(formData.get("sort_order")) || 0),
                published: formData.get("published") === "on",
                profile_path: profilePath
            };
            const query = editing
                ? supabase.from(resource.table).update(payload).eq("id", editing.id)
                : supabase.from(resource.table).insert(payload);
            const { error } = await query;
            if (error) throw error;

            if (editing?.profile_path && hasProfile) {
                try { await removeMedia([editing.profile_path]); } catch (storageError) { console.warn(storageError); }
            }
            showToast(editing ? "Depoimento atualizado com sucesso." : "Depoimento adicionado ao site.");
            await loadResource("testimonial");
            closeForm("testimonial");
        } catch (error) {
            if (newPath) {
                try { await removeMedia([newPath]); } catch (cleanupError) { console.warn(cleanupError); }
            }
            setStatus(resource.status, `Falha ao salvar: ${error.message}`, "error");
        } finally {
            resource.submit.disabled = false;
        }
    }

    function requestDelete(type, item) {
        state.pendingDelete = { type, item };
        const names = { video: "este trabalho", client: "este cliente", testimonial: "este depoimento" };
        confirmTitle.textContent = `Excluir ${names[type]}?`;
        confirmDescription.textContent = type === "video"
            ? "O registro, o vídeo e a capa serão removidos definitivamente do Supabase."
            : "O registro e sua foto serão removidos definitivamente do Supabase.";
        confirmOverlay.hidden = false;
        confirmDelete.focus();
    }

    function closeConfirm() {
        state.pendingDelete = null;
        confirmOverlay.hidden = true;
    }

    async function deletePendingItem() {
        if (!state.pendingDelete) return;
        const { type, item } = state.pendingDelete;
        const resource = resources[type];
        confirmDelete.disabled = true;

        const { error } = await supabase.from(resource.table).delete().eq("id", item.id);
        if (error) {
            confirmDelete.disabled = false;
            showToast(`Não foi possível excluir: ${error.message}`, "error");
            return;
        }

        const paths = type === "video" ? [item.video_path, item.poster_path] : [item.profile_path];
        try {
            await removeMedia(paths);
        } catch (storageError) {
            showToast(`Registro excluído, mas revise os arquivos no Storage: ${storageError.message}`, "error");
        }

        closeForm(type);
        closeConfirm();
        confirmDelete.disabled = false;
        showToast("Item excluído do portfólio.");
        await loadResource(type);
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = loginForm.querySelector("button[type='submit']");
        button.disabled = true;
        setStatus(loginStatus, "Entrando...");
        const formData = new FormData(loginForm);
        const { data, error } = await supabase.auth.signInWithPassword({
            email: String(formData.get("email") || "").trim(),
            password: String(formData.get("password") || "")
        });

        if (error) {
            button.disabled = false;
            setStatus(loginStatus, "E-mail ou senha inválidos.", "error");
            return;
        }
        try {
            await ensureAdmin();
            setView(data.session);
        } catch (error) {
            setStatus(loginStatus, error.message, "error");
        } finally {
            button.disabled = false;
        }
    });

    document.getElementById("logout-button").addEventListener("click", async () => {
        await supabase.auth.signOut();
        setView(null);
    });

    document.querySelectorAll("[data-admin-tab]").forEach((tab) => {
        tab.addEventListener("click", () => setActiveTab(tab.dataset.adminTab));
    });

    document.querySelectorAll("[data-create]").forEach((button) => {
        button.addEventListener("click", () => openForm(button.dataset.create));
    });

    document.querySelectorAll("[data-close-form]").forEach((button) => {
        button.addEventListener("click", () => closeForm(button.dataset.closeForm));
    });

    resources.video.form.addEventListener("submit", saveVideo);
    resources.client.form.addEventListener("submit", saveClient);
    resources.testimonial.form.addEventListener("submit", saveTestimonial);

    const clientPlatform = document.getElementById("client-platform");
    const clientProfileUrl = document.getElementById("client-profile-url");
    const placeholders = {
        instagram: "https://instagram.com/usuario",
        youtube: "https://youtube.com/@canal",
        tiktok: "https://tiktok.com/@usuario"
    };
    clientPlatform.addEventListener("change", () => {
        clientProfileUrl.placeholder = placeholders[clientPlatform.value] || "https://";
    });
    clientProfileUrl.addEventListener("blur", () => {
        const handle = document.getElementById("client-handle");
        if (!handle.value.trim()) handle.value = profileHandleFromUrl(clientProfileUrl.value, clientPlatform.value);
    });

    document.getElementById("video-category").addEventListener("change", (event) => {
        if (event.target.value === "short") document.getElementById("video-aspect").value = "vertical";
    });

    document.getElementById("cancel-delete").addEventListener("click", closeConfirm);
    confirmDelete.addEventListener("click", deletePendingItem);
    confirmOverlay.addEventListener("click", (event) => {
        if (event.target === confirmOverlay) closeConfirm();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (!confirmOverlay.hidden) {
            closeConfirm();
            return;
        }
        const openType = Object.keys(resources).find((type) => !resources[type].form.hidden);
        if (openType) closeForm(openType);
    });

    // ==========================================
    // Analytics & Settings
    // ==========================================
    async function loadSettings() {
        const { data, error } = await supabase.from("site_settings").select("*");
        if (error) return;
        data.forEach(setting => {
            const el = document.getElementById(`setting-${setting.key.split('_')[1] || setting.key}`);
            if (el) el.value = setting.value;
        });
    }

    async function saveSettings(event) {
        event.preventDefault();
        const form = event.target;
        const submitBtn = form.querySelector("button[type='submit']");
        const statusEl = document.getElementById("settings-status");
        submitBtn.disabled = true;
        setStatus(statusEl, "Salvando configurações...", "success");

        const payload = [
            { key: "whatsapp_number", value: form.elements.whatsapp_number.value.trim() },
            { key: "facebook_pixel_id", value: form.elements.facebook_pixel_id.value.trim() }
        ];

        const { error } = await supabase.from("site_settings").upsert(payload);
        submitBtn.disabled = false;
        if (error) {
            setStatus(statusEl, "Erro ao salvar.", "error");
        } else {
            setStatus(statusEl, "Configurações salvas com sucesso!", "success");
            showToast("Configurações atualizadas");
        }
    }
    
    document.getElementById("settings-form")?.addEventListener("submit", saveSettings);

    function calculateDelta(current, previous) {
        if (previous === 0) return current > 0 ? "+100%" : "0%";
        const diff = ((current - previous) / previous) * 100;
        const sign = diff > 0 ? "+" : "";
        return `${sign}${Math.round(diff)}% vs. mês passado`;
    }

    async function fetchCount(table, startDate, endDate) {
        const { count } = await supabase.from(table).select("*", { count: "exact", head: true })
            .gte("created_at", startDate.toISOString())
            .lt("created_at", endDate.toISOString());
        return count || 0;
    }

    async function loadAnalytics() {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        
        // Fetch Current Month
        const pageViewsThis = await fetchCount("analytics_page_views", startOfThisMonth, now);
        const videoViewsThis = await fetchCount("analytics_video_views", startOfThisMonth, now);
        const clicksThis = await fetchCount("analytics_clicks", startOfThisMonth, now);
        
        // Fetch Last Month
        const pageViewsLast = await fetchCount("analytics_page_views", startOfLastMonth, startOfThisMonth);
        const videoViewsLast = await fetchCount("analytics_video_views", startOfLastMonth, startOfThisMonth);
        const clicksLast = await fetchCount("analytics_clicks", startOfLastMonth, startOfThisMonth);
        
        document.getElementById("analytics-pageviews").textContent = pageViewsThis.toLocaleString();
        const pvDelta = calculateDelta(pageViewsThis, pageViewsLast);
        const pvEl = document.getElementById("analytics-pageviews-compare");
        if (pvEl) {
            pvEl.textContent = pvDelta;
            pvEl.className = `trend-pill ${pageViewsThis >= pageViewsLast ? "is-positive" : "is-negative"}`;
        }
        
        document.getElementById("analytics-videoviews").textContent = videoViewsThis.toLocaleString();
        const vvDelta = calculateDelta(videoViewsThis, videoViewsLast);
        const vvEl = document.getElementById("analytics-videoviews-compare");
        if (vvEl) {
            vvEl.textContent = vvDelta;
            vvEl.className = `trend-pill ${videoViewsThis >= videoViewsLast ? "is-positive" : "is-negative"}`;
        }
        
        document.getElementById("analytics-clicks").textContent = clicksThis.toLocaleString();
        const clDelta = calculateDelta(clicksThis, clicksLast);
        const clEl = document.getElementById("analytics-clicks-compare");
        if (clEl) {
            clEl.textContent = clDelta;
            clEl.className = `trend-pill ${clicksThis >= clicksLast ? "is-positive" : "is-negative"}`;
        }

        // Calculate avg retention for this month
        let avgRetention = 0;
        const { data: viewsData } = await supabase.from("analytics_video_views")
            .select("watch_percentage")
            .gte("created_at", startOfThisMonth.toISOString());
            
        if (viewsData && viewsData.length > 0) {
            avgRetention = Math.round(viewsData.reduce((acc, curr) => acc + curr.watch_percentage, 0) / viewsData.length);
            document.getElementById("analytics-retention").textContent = `${avgRetention}%`;
        }

        // Gamified XP Calculation
        const currentXP = (pageViewsThis * 2) + (videoViewsThis * 5) + (clicksThis * 15) + (avgRetention * 10);
        const targetXP = 3500;
        const xpProgress = Math.min(100, Math.round((currentXP / targetXP) * 100));
        const xpNext = Math.max(0, targetXP - currentXP);

        const xpScoreEl = document.getElementById("gamified-xp-score");
        if (xpScoreEl) xpScoreEl.innerHTML = `${currentXP.toLocaleString()} <small>XP</small>`;
        const xpBarEl = document.getElementById("gamified-xp-bar");
        if (xpBarEl) xpBarEl.style.width = `${Math.max(5, xpProgress)}%`;
        const xpNextEl = document.getElementById("gamified-xp-next");
        if (xpNextEl) xpNextEl.textContent = `${xpNext.toLocaleString()} XP para desbloquear NÍVEL 06 (LENDÁRIO)`;

        // Top Videos Podium Leaderboard
        const topList = document.getElementById("analytics-top-videos");
        if (topList && state.videos.length > 0) {
            const medals = ["🥇", "🥈", "🥉", "🏅", "⭐"];
            const topVideos = [...state.videos].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)).slice(0, 5);
            topList.innerHTML = topVideos.map((v, i) => `
                <li>
                    <div style="display: flex; align-items: center;">
                        <span class="rank-medal">${medals[i] || "🏅"}</span>
                        <strong>${v.title}</strong>
                    </div>
                    <span class="likes-tag">${v.likes_count || 0} ❤️ LIKES</span>
                </li>
            `).join('');
        }

        // Initialize Interactive Charts
        initAnalyticsCharts(pageViewsThis, videoViewsThis, clicksThis);
    }

    let trafficChartInstance = null;
    let categoriesChartInstance = null;

    function initAnalyticsCharts(pageViews, videoViews, clicks) {
        if (!window.Chart) return;

        // 1. Line/Area Chart for Traffic & Reproductions
        const trafficCanvas = document.getElementById("chart-traffic-line");
        if (trafficCanvas) {
            const ctx = trafficCanvas.getContext("2d");
            if (trafficChartInstance) trafficChartInstance.destroy();

            const gradientLime = ctx.createLinearGradient(0, 0, 0, 260);
            gradientLime.addColorStop(0, "rgba(204, 255, 0, 0.35)");
            gradientLime.addColorStop(1, "rgba(204, 255, 0, 0.0)");

            const gradientCyan = ctx.createLinearGradient(0, 0, 0, 260);
            gradientCyan.addColorStop(0, "rgba(0, 229, 255, 0.25)");
            gradientCyan.addColorStop(1, "rgba(0, 229, 255, 0.0)");

            const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
            const pageViewData = [Math.round(pageViews * 0.4), Math.round(pageViews * 0.55), Math.round(pageViews * 0.7), Math.round(pageViews * 0.65), Math.round(pageViews * 0.85), Math.round(pageViews * 0.9), pageViews || 12];
            const videoViewData = [Math.round(videoViews * 0.3), Math.round(videoViews * 0.4), Math.round(videoViews * 0.6), Math.round(videoViews * 0.75), Math.round(videoViews * 0.8), Math.round(videoViews * 0.95), videoViews || 8];

            trafficChartInstance = new window.Chart(ctx, {
                type: "line",
                data: {
                    labels: days,
                    datasets: [
                        {
                            label: "Visitas ao Site",
                            data: pageViewData,
                            borderColor: "#ccff00",
                            backgroundColor: gradientLime,
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: "#ccff00"
                        },
                        {
                            label: "Acessos a Vídeos",
                            data: videoViewData,
                            borderColor: "#00e5ff",
                            backgroundColor: gradientCyan,
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 3,
                            pointBackgroundColor: "#00e5ff"
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: "#c7cbc4", font: { family: "Clash Display", size: 11 } }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: "rgba(255, 255, 255, 0.05)" },
                            ticks: { color: "#888" }
                        },
                        y: {
                            grid: { color: "rgba(255, 255, 255, 0.05)" },
                            ticks: { color: "#888" }
                        }
                    }
                }
            });
        }

        // 2. Donut Chart for Categories
        const catCanvas = document.getElementById("chart-categories-donut");
        if (catCanvas) {
            const ctxCat = catCanvas.getContext("2d");
            if (categoriesChartInstance) categoriesChartInstance.destroy();

            const longCount = state.videos.filter(v => v.category === "featured" || v.category === "long-form").length || 4;
            const shortCount = state.videos.filter(v => v.category === "short" || v.category === "short-form").length || 3;
            const vslCount = state.videos.filter(v => v.category === "vsl").length || 1;
            const commercialCount = state.videos.filter(v => v.category === "commercial" || v.category === "motion").length || 2;

            categoriesChartInstance = new window.Chart(ctxCat, {
                type: "doughnut",
                data: {
                    labels: ["Long Form (16:9)", "Short Form (9:16)", "Showreel VSL", "Comercial / Motion"],
                    datasets: [{
                        data: [longCount, shortCount, vslCount, commercialCount],
                        backgroundColor: ["#ccff00", "#00e5ff", "#ff2a85", "#ffaa00"],
                        borderWidth: 0,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: { color: "#c7cbc4", font: { size: 10 }, boxWidth: 12 }
                        }
                    },
                    cutout: "70%"
                }
            });
        }

        document.querySelectorAll(".quests-grid input[type='checkbox']").forEach(chk => {
            chk.addEventListener("change", (e) => {
                const card = e.target.closest(".quest-card");
                if (card) card.classList.toggle("is-completed", e.target.checked);
                if (e.target.checked) {
                    showToast("⚡ MISSIÃO CONCLUÍDA! +Bônus de XP concedido!", "success");
                }
            });
        });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
        window.setTimeout(() => validateSession(session), 0);
    });
    const { data: sessionData } = await supabase.auth.getSession();
    await validateSession(sessionData.session);
});
