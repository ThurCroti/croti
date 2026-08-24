(function () {
    const translations = {
        EN: {
            "nav_home": "HOME",
            "nav_longform": "LONG FORM",
            "nav_shorts": "SHORTS",
            "nav_catalog": "CATALOG",
            "nav_showreel": "SHOWREEL",
            "nav_clients": "CLIENTS",
            "nav_reviews": "REVIEWS",
            "nav_faq": "FAQ",
            "nav_cta": "START A PROJECT <span aria-hidden=\"true\">↗</span>",
            "hero_system": "CROTI MOTION SYSTEM / 001",
            "hero_static": "STATIC <i>↔</i> MOTION",
            "hero_move": "<b></b> MOVE TO REVEAL",
            "hero_scroll": "SCROLL TO ENTER THE CUT <i>↓</i>",
            "hero_eyebrow1": "CROTI / POST-PRODUCTION",
            "hero_eyebrow2": "01 — SELECTED IDENTITY",
            "hero_line1": "HIGH-END",
            "hero_line2_video": "VIDEO",
            "hero_line2_editor": "EDITOR",
            "hero_story": "STORY · RHYTHM · IMPACT",
            "hero_frame": "FRAME BY FRAME / SINCE 2019",
            "hero_cta": "<span>START A PROJECT</span><span class=\"hero-cta-arrow\" aria-hidden=\"true\">↗</span>",
            "longform_kicker": "01 / SELECTED LONG FORM",
            "longform_title": "<span>CINEMATIC</span><span>STORIES.</span>",
            "longform_guide": "STORIES BUILT FRAME<br>BY FRAME.",
            "longform_scroll": "SCROLL TO EXPLORE <b aria-hidden=\"true\">→</b>",
            "shorts_kicker": "<span>SELECTED WORKS</span><span>VERTICAL / 9:16</span>",
            "shorts_title": "<span>SHORT FORM</span><span>PROJECTS</span>",
            "shorts_desc": "High-level vertical editing built for Reels, TikTok and Shorts. Dynamic pacing, visual hooks and maximum retention.",
            "shorts_drag": "ORBITAL STUDIES <span aria-hidden=\"true\">/</span> HOVER TO HOLD · CLICK TO PLAY",
            "vsl_kicker": "<span>04</span> INTRODUCTION / SHOWREEL",
            "vsl_title": "MEET THE EDITOR <span>BEHIND THE CUT.</span>",
            "vsl_desc": "A quick introduction to who I am, how I work, and the selected projects that define my visual language.",
            "vsl_cta": "<span>WATCH MY INTRO + SHOWREEL</span><span aria-hidden=\"true\">↘</span>",
            "collabs_kicker": "05 / SELECTED COLLABORATIONS",
            "collabs_sub": "MULTI-PLATFORM CLIENT ARCHIVE",
            "collabs_accent": "Collabs",
            "collabs_title": "<span>BRANDS</span><span>& PROJECTS</span>",
            "collabs_desc": "Proud to collaborate with high-performance partners. Combining cinematic editing, commercial design and strategic vision to deliver visual impact impossible to ignore.",
            "collabs_label": "SELECTED CLIENTS",
            "reviews_kicker": "06 / SELECTED FEEDBACK",
            "reviews_sub": "VOICES OF IMPACT",
            "reviews_title": "<span>WHAT CLIENTS &</span><span>DIRECTORS SAY.</span>",
            "reviews_desc": "Feedback from creators, directors and brands on how our editing transformed their video results.",
            "faq_kicker": "07 / GENERAL QUESTIONS",
            "faq_sub": "THE DETAILS BEFORE WE START",
            "faq_title": "FAQ BEFORE WE START.",
            "faq_desc": "Everything you need to know before bringing a project to life.",
            "catalog_kicker": "03 / VIDEO CATALOG",
            "catalog_heading": "<span>VIDEO</span><span>CATALOG</span>",
            "catalog_desc": "Selected editing work across short-form, long-form, VSL, commercial and motion projects.",
            "catalog_search_lbl": "SEARCH PROJECTS",
            "catalog_search_ph": "Search projects...",
            "catalog_view_all": "<span>EXPLORE ALL WORK</span><span aria-hidden=\"true\">↗</span>",
            "cat_all": "ALL",
            "cat_short": "SHORT FORM",
            "cat_short-form": "SHORT FORM",
            "cat_long": "LONG FORM",
            "cat_long-form": "LONG FORM",
            "cat_vsl": "VSL",
            "cat_commercial": "COMMERCIAL",
            "cat_motion": "MOTION",
            "modal_client": "CLIENT",
            "modal_year": "YEAR",
            "modal_services": "SERVICES",
            "modal_prev": "← PREVIOUS PROJECT",
            "modal_next": "NEXT PROJECT →",
            "footer_title": "<span>ALWAYS BRINGING</span><span>THE IMPACT.</span>",
            "footer_cta": "START A PROJECT",
            "footer_link_home": "HOME",
            "footer_link_work": "WORK",
            "footer_link_about": "ABOUT",
            "footer_link_contact": "CONTACT"
        },
        PT: {
            "nav_home": "INÍCIO",
            "nav_longform": "LONG FORM",
            "nav_shorts": "SHORTS",
            "nav_catalog": "CATÁLOGO",
            "nav_showreel": "SHOWREEL",
            "nav_clients": "CLIENTES",
            "nav_reviews": "DEPOIMENTOS",
            "nav_faq": "FAQ",
            "nav_cta": "INICIAR PROJETO <span aria-hidden=\"true\">↗</span>",
            "hero_system": "SISTEMA DE MOÇÃO CROTI / 001",
            "hero_static": "ESTÁTICO <i>↔</i> MOVIMENTO",
            "hero_move": "<b></b> MOVA O CURSOR PARA REVELAR",
            "hero_scroll": "ROLE PARA ENTRAR NO CORTE <i>↓</i>",
            "hero_eyebrow1": "CROTI / PÓS-PRODUÇÃO",
            "hero_eyebrow2": "01 — IDENTIDADE SELECIONADA",
            "hero_line1": "EDITOR DE",
            "hero_line2_video": "VÍDEO DE",
            "hero_line2_editor": "ALTA PERFORMANCE",
            "hero_story": "HISTÓRIA · RITMO · IMPACTO",
            "hero_frame": "FRAME POR FRAME / DESDE 2019",
            "hero_cta": "<span>INICIAR PROJETO</span><span class=\"hero-cta-arrow\" aria-hidden=\"true\">↗</span>",
            "longform_kicker": "01 / SELEÇÃO LONG FORM",
            "longform_title": "<span>HISTÓRIAS</span><span>CINEMATOGRÁFICAS.</span>",
            "longform_guide": "HISTÓRIAS CONSTRUÍDAS<br>FRAME POR FRAME.",
            "longform_scroll": "ROLE PARA EXPLORAR <b aria-hidden=\"true\">→</b>",
            "shorts_kicker": "<span>TRABALHOS SELECIONADOS</span><span>VERTICAL / 9:16</span>",
            "shorts_title": "<span>PROJETOS</span><span>SHORT FORM</span>",
            "shorts_desc": "Edição vertical de alto nível para Reels, TikTok e Shorts. Ritmo dinâmico, ganchos visuais e retenção máxima.",
            "shorts_drag": "ESTUDOS ORBITAIS <span aria-hidden=\"true\">/</span> PASSE O MOUSE · CLIQUE PARA ASSISTIR",
            "vsl_kicker": "<span>04</span> INTRODUÇÃO / SHOWREEL",
            "vsl_title": "CONHEÇA O EDITOR <span>POR TRÁS DO CORTE.</span>",
            "vsl_desc": "Uma breve introdução sobre quem sou, como trabalho e os projetos que definem minha linguagem visual.",
            "vsl_cta": "<span>ASSISTIR INTRO + SHOWREEL</span><span aria-hidden=\"true\">↘</span>",
            "collabs_kicker": "05 / COLABORAÇÕES SELECIONADAS",
            "collabs_sub": "ARQUIVO MULTIPLATAFORMA DE CLIENTES",
            "collabs_accent": "Colabs",
            "collabs_title": "<span>MARCAS</span><span>E PROJETOS</span>",
            "collabs_desc": "Tenho o orgulho de colaborar com parceiros que respiram alta performance. Unindo edição cinematográfica, design comercial e visão estratégica para entregar um impacto visual impossível de ser ignorado.",
            "collabs_label": "CLIENTES SELECIONADOS",
            "reviews_kicker": "06 / DEPOIMENTOS SELECIONADOS",
            "reviews_sub": "VOZES DE IMPACTO",
            "reviews_title": "<span>O QUE DIZEM CLIENTES</span><span>E DIRETORES.</span>",
            "reviews_desc": "Depoimentos de criadores, diretores e marcas sobre como nossa edição transformou o resultado de seus vídeos.",
            "faq_kicker": "07 / PERGUNTAS FREQUENTES",
            "faq_sub": "OS DETALHES ANTES DE COMEÇAR",
            "faq_title": "DÚVIDAS FREQUENTES.",
            "faq_desc": "Tudo o que você precisa saber antes de iniciarmos um projeto juntos.",
            "catalog_kicker": "03 / CATÁLOGO DE VÍDEOS",
            "catalog_heading": "<span>CATÁLOGO</span><span>DE VÍDEOS</span>",
            "catalog_desc": "Trabalhos de edição em formatos short-form, long-form, VSL, comercial e motion.",
            "catalog_search_lbl": "BUSCAR PROJETOS",
            "catalog_search_ph": "Buscar projetos...",
            "catalog_view_all": "<span>EXPLORAR TODOS OS TRABALHOS</span><span aria-hidden=\"true\">↗</span>",
            "cat_all": "TODOS",
            "cat_short": "SHORT FORM",
            "cat_short-form": "SHORT FORM",
            "cat_long": "LONG FORM",
            "cat_long-form": "LONG FORM",
            "cat_vsl": "VSL",
            "cat_commercial": "COMERCIAL",
            "cat_motion": "MOTION",
            "modal_client": "CLIENTE",
            "modal_year": "ANO",
            "modal_services": "SERVIÇOS",
            "modal_prev": "← PROJETO ANTERIOR",
            "modal_next": "PRÓXIMO PROJETO →",
            "footer_title": "<span>SEMPRE GERANDO</span><span>IMPACTO.</span>",
            "footer_cta": "INICIAR PROJETO",
            "footer_link_home": "INÍCIO",
            "footer_link_work": "TRABALHOS",
            "footer_link_about": "SOBRE",
            "footer_link_contact": "CONTATO"
        }
    };

    let currentLang = localStorage.getItem("croti_lang") || "EN";

    function applyLanguage(lang) {
        currentLang = lang;
        localStorage.setItem("croti_lang", lang);
        document.documentElement.lang = lang === "PT" ? "pt-BR" : "en";

        const dictionary = translations[lang] || translations.EN;
        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (dictionary[key]) {
                if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
                    el.placeholder = dictionary[key];
                } else {
                    el.innerHTML = dictionary[key];
                }
            }
        });

        const searchInput = document.getElementById("catalog-search-input");
        if (searchInput && dictionary["catalog_search_ph"]) {
            searchInput.placeholder = dictionary["catalog_search_ph"];
        }

        const btn = document.getElementById("lang-toggle-btn");
        if (btn) {
            const enSpan = btn.querySelector(".lang-en");
            const ptSpan = btn.querySelector(".lang-pt");
            if (enSpan && ptSpan) {
                enSpan.classList.toggle("is-active", lang === "EN");
                ptSpan.classList.toggle("is-active", lang === "PT");
            }
        }

        window.dispatchEvent(new CustomEvent("croti-lang-change", { detail: { lang } }));

        if (window.ScrollTrigger) {
            window.setTimeout(() => window.ScrollTrigger.refresh(), 100);
        }
    }

    window.CrotiI18n = {
        setLanguage: applyLanguage,
        getLanguage: () => currentLang,
        init: () => {
            applyLanguage(currentLang);
            const btn = document.getElementById("lang-toggle-btn");
            if (btn) {
                btn.addEventListener("click", () => {
                    const nextLang = currentLang === "EN" ? "PT" : "EN";
                    applyLanguage(nextLang);
                });
            }
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => window.CrotiI18n.init());
    } else {
        window.CrotiI18n.init();
    }
})();
