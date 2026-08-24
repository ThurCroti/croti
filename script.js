document.addEventListener("DOMContentLoaded", async () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    document.documentElement.classList.toggle("reduced-motion", reducedMotion);

    const escapeHTML = (value = "") => String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const initSiteNavigation = () => {
        const links = [...document.querySelectorAll("[data-nav-target]")];
        const linksScroller = document.querySelector("[data-site-nav-links]");
        if (!links.length || !linksScroller) return;

        const entries = links.map((link) => {
            const targetId = link.dataset.navTarget;
            const target = targetId === "top"
                ? document.querySelector(".hero-master-pin")
                : document.getElementById(targetId);
            return { link, targetId, target };
        }).filter((entry) => entry.target);

        let activeId = "";
        let scrollFrame = null;

        const setActiveLink = (nextId) => {
            if (!nextId || nextId === activeId) return;
            activeId = nextId;

            entries.forEach(({ link, targetId }) => {
                if (targetId === nextId) link.setAttribute("aria-current", "page");
                else link.removeAttribute("aria-current");
            });

            const activeLink = entries.find(({ targetId }) => targetId === nextId)?.link;
            if (activeLink && linksScroller.scrollWidth > linksScroller.clientWidth) {
                const centeredLeft = activeLink.offsetLeft - (linksScroller.clientWidth - activeLink.offsetWidth) / 2;
                linksScroller.scrollTo({ left: Math.max(0, centeredLeft), behavior: reducedMotion ? "auto" : "smooth" });
            }
        };

        const updateActiveLink = () => {
            const headerHeight = document.querySelector(".header")?.offsetHeight || 0;
            const probe = window.scrollY + headerHeight + window.innerHeight * 0.24;
            let current = entries[0];

            entries.forEach((entry) => {
                const targetTop = entry.target.getBoundingClientRect().top + window.scrollY;
                if (targetTop <= probe) current = entry;
            });

            setActiveLink(current.targetId);
            scrollFrame = null;
        };

        entries.forEach(({ link, targetId, target }) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                const headerHeight = document.querySelector(".header")?.offsetHeight || 0;
                const targetTop = targetId === "top"
                    ? 0
                    : target.getBoundingClientRect().top + window.scrollY - headerHeight - 18;

                history.pushState(null, "", `#${targetId}`);
                window.scrollTo({
                    top: Math.max(0, targetTop),
                    behavior: reducedMotion ? "auto" : "smooth"
                });
            });
        });

        window.addEventListener("scroll", () => {
            if (scrollFrame) return;
            scrollFrame = requestAnimationFrame(updateActiveLink);
        }, { passive: true });
        window.addEventListener("resize", updateActiveLink, { passive: true });
        updateActiveLink();
    };

    initSiteNavigation();

    // Local placeholders keep the component complete until real CMS entries are published.
    // All short-form media is rendered from this single data source (or from the CMS below).
    const fallbackShortForms = [
        { title: "SOCIAL CUT 01", videoUrl: "./assets/video/hero-reveal-loop-web.mp4", posterUrl: "./assets/img/hero-base-office.png", mediaPosition: "30% 50%" },
        { title: "SOCIAL CUT 02", videoUrl: "./assets/video/hero-reveal-loop-web.mp4", posterUrl: "./assets/img/hero-base-office.png", mediaPosition: "42% 50%" },
        { title: "SOCIAL CUT 03", videoUrl: "./assets/video/hero-reveal-loop-web.mp4", posterUrl: "./assets/img/hero-base-office.png", mediaPosition: "50% 50%" },
        { title: "SOCIAL CUT 04", videoUrl: "./assets/video/hero-reveal-loop-web.mp4", posterUrl: "./assets/img/hero-base-office.png", mediaPosition: "58% 50%" },
        { title: "SOCIAL CUT 05", videoUrl: "./assets/video/hero-reveal-loop-web.mp4", posterUrl: "./assets/img/hero-base-office.png", mediaPosition: "70% 50%" },
        { title: "SOCIAL CUT 06", videoUrl: "./assets/video/hero-reveal-loop-web.mp4", posterUrl: "./assets/img/hero-base-office.png", mediaPosition: "50% 42%" }
    ];
    let publishedPortfolioVideos = [];

    function renderShortFormCards(items) {
        const ring = document.querySelector(".short-orbit-ring");
        if (!ring) return;

        ring.innerHTML = items.slice(0, 8).map((video, index) => {
            const label = video.client ? `${video.client} — ${video.title}` : video.title;
            const mediaPosition = video.mediaPosition || `${34 + (index % 4) * 11}% 50%`;

            return `
                <article class="short-orbit-item" aria-label="${escapeHTML(label)}">
                    <div class="short-form-card" tabindex="-1" data-front="false">
                        <div class="short-card-surface">
                            <div class="short-card-media" style="--media-position: ${escapeHTML(mediaPosition)}">
                                <video src="${escapeHTML(video.videoUrl)}"
                                    ${video.posterUrl ? `poster="${escapeHTML(video.posterUrl)}"` : ""}
                                    muted loop playsinline disablepictureinpicture preload="metadata"></video>
                                <div class="short-card-tint"></div>
                            </div>
                            <div class="short-card-meta">
                                <span class="short-card-index">${String(index + 1).padStart(2, "0")}</span>
                                <span class="short-card-label">${escapeHTML(label)}</span>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    renderShortFormCards(fallbackShortForms);

    async function hydratePortfolioMedia() {
        if (!window.CrotiCMS?.isConfigured()) return;

        try {
            const videos = await window.CrotiCMS.listPublished();
            publishedPortfolioVideos = videos;
            const featured = videos.filter((video) => (video.category === "featured" || video.category === "long-form") && video.category !== "vsl").slice(0, 4);
            const shorts = videos.filter((video) => video.category === "short" || video.category === "short-form").slice(0, 6);
            const vsl = videos.find((video) => video.category === "vsl" || video.is_vsl === true);

            if (featured.length) {
                document.querySelector(".portfolio-track").innerHTML = featured.map((video, index) => {
                    const number = String(index + 1).padStart(2, "0");
                    const detail = video.client ? `${video.client} / LONG FORM` : "SELECTED WORK / LONG FORM";
                    return `
                    <article class="project-item ${index % 2 ? "item-down" : "item-up"}">
                        <div class="project-card-shell">
                            <span class="project-number" aria-hidden="true">${number}</span>
                            <div class="video-wrapper">
                                <video src="${escapeHTML(video.videoUrl)}"
                                    ${video.posterUrl ? `poster="${escapeHTML(video.posterUrl)}"` : ""}
                                    muted loop playsinline preload="metadata"></video>
                                <div class="project-media-ui"><span>16:9</span><span>MASTER CUT</span></div>
                                <span class="project-focus-mark" aria-hidden="true"></span>
                            </div>
                            <footer class="project-caption">
                                <div class="project-info"><strong>${escapeHTML(video.title)}</strong><small>${escapeHTML(detail)}</small></div>
                                <span class="project-year">${escapeHTML(video.year || "2026")}</span>
                            </footer>
                        </div>
                    </article>
                `;
                }).join("");
            } else {
                document.querySelector(".portfolio-showcase").hidden = true;
            }

            if (shorts.length) {
                renderShortFormCards(shorts);
            } else {
                document.getElementById("video-fan-section").hidden = true;
            }

            if (vsl) {
                const vslVideo = document.getElementById("vsl-video");
                vslVideo.src = vsl.videoUrl;
                if (vsl.posterUrl) vslVideo.poster = vsl.posterUrl;
                vslVideo.load();
            } else {
                const vslSec = document.getElementById("vsl-section");
                if (vslSec) vslSec.hidden = false;
            }

            document.querySelectorAll(".portfolio-track video, .short-orbit-item video").forEach((v) => observeLazyVideo(v));

            if (typeof initVideoCatalog === "function") {
                initVideoCatalog();
            }
        } catch (error) {
            console.warn("Não foi possível carregar o conteúdo do portfólio.", error);
        }
    }

    await hydratePortfolioMedia();

    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ duration: 0.8, ease: "power2.out" });

    const safeMediaPlay = (media) => {
        if (!media || !media.paused) return;
        media.play().catch(() => { });
    };

    const safeMediaPause = (media) => {
        if (!media || media.paused) return;
        media.pause();
    };

    // Intelligent On-Demand Video Loader & Viewport Pause Observer
    const mediaObserver = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const video = entry.target;
            if (entry.isIntersecting) {
                if (video.dataset.src && video.src !== video.dataset.src) {
                    video.src = video.dataset.src;
                    video.removeAttribute("data-src");
                    video.load();
                }
                safeMediaPlay(video);
            } else {
                safeMediaPause(video);
            }
        });
    }, { rootMargin: "250px 0px", threshold: 0.1 }) : null;

    const observeLazyVideo = (video) => {
        if (!video) return;
        if (mediaObserver) {
            mediaObserver.observe(video);
        } else {
            if (video.dataset.src) {
                video.src = video.dataset.src;
                video.removeAttribute("data-src");
            }
            safeMediaPlay(video);
        }
    };

    // =========================================
    // 1. HERO SECTION LOGIC (ISOLATED TRANSITION SEQUENCE)
    // =========================================

    // 1. CLEANUP
    document.querySelectorAll('.glass-shield').forEach(el => el.remove());

    const heroWrapper = document.querySelector('.hero-master-pin');
    const revealLayer = document.querySelector('.layer-reveal');
    const baseLayer = document.querySelector('.layer-base');
    const heroInterface = document.querySelector('.hero-interface');
    const heroFocusReticle = document.querySelector('.hero-focus-reticle');

    // 2. NEUTRALIZE THE IFRAME
    if (baseLayer) {
        baseLayer.style.pointerEvents = "none";
        baseLayer.querySelectorAll('iframe, video').forEach(el => {
            el.style.pointerEvents = "none";
        });
    }

    // 3. BASE SETUP (EDITORIAL MOTION REVEAL)
    const heroIdleRadius = () => Math.max(105, Math.min(window.innerWidth * 0.105, 165));
    const heroActiveRadius = () => Math.max(175, Math.min(window.innerWidth * 0.19, 310));
    const heroFullRadius = () => Math.hypot(window.innerWidth, window.innerHeight);

    gsap.set(heroWrapper, {
        "--hero-reveal-x": `${window.innerWidth / 2}px`,
        "--hero-reveal-y": `${window.innerHeight / 2}px`,
        "--hero-reveal-radius": `${heroIdleRadius()}px`,
        "--hero-reticle-size": `${heroIdleRadius() * 2}px`,
        "--hero-focus-opacity": precisePointer && !reducedMotion ? 0.58 : 0
    });

    gsap.set(revealLayer, { clearProps: "all" });
    gsap.set(revealLayer, {
        position: "absolute", top: 0, left: 0, width: "100vw", height: "100vh",
        opacity: 0.82, scale: 1.025, filter: "brightness(1.02) saturate(0.92)",
        transformOrigin: "center center", pointerEvents: "none"
    });

    gsap.set(baseLayer, {
        opacity: 1,
        scale: 1.012,
        filter: "brightness(0.92) saturate(0.86)",
        transformOrigin: "center center"
    });

    // CRUCIAL FIX: Lock the marquee dead center of the pinned section
    gsap.set('.marquee-container', {
        position: "absolute",
        top: "50%",
        left: 0,
        width: "100%",
        yPercent: -50, // Perfectly centers it vertically
        opacity: 0,
        y: 0,
        pointerEvents: "none",
        zIndex: 50 // Ensures it stays above the faded videos
    });

    gsap.set('.hero-title-line > span', { yPercent: 112, rotation: 1.5, transformOrigin: "left bottom" });
    gsap.set('.hero-title-eyebrow > span, .hero-title-bottom > span', { opacity: 0, y: 14 });
    gsap.set('.hero-title-rule i', { scaleX: 0, transformOrigin: "left" });
    gsap.set('.signature', {
        xPercent: -50,
        yPercent: -50,
        opacity: 0,
        y: 28,
        scale: 0.72,
        pointerEvents: "none"
    });

    // 4. IDLE EDITOR PULSE
    const glitchTl = gsap.timeline({
        repeat: -1,
        repeatDelay: 2.8,
        paused: reducedMotion || !precisePointer
    });
    glitchTl.to(revealLayer, { opacity: 0.66, filter: "brightness(0.9) saturate(0.78)", duration: 0.06, ease: "steps(1)" })
        .to(revealLayer, { opacity: 0.96, filter: "brightness(1.08) saturate(1)", duration: 0.05, ease: "steps(1)" })
        .to(revealLayer, { opacity: 0.74, duration: 0.04, ease: "steps(1)" })
        .to(revealLayer, { opacity: 0.82, filter: "brightness(1.02) saturate(0.92)", duration: 0.18, ease: "power2.out" });

    // 5. CURSOR-DRIVEN REVEAL, PARALLAX & INACTIVITY TIMER
    const xTo = gsap.quickTo(revealLayer, "x", { duration: 0.4, ease: "power3.out" });
    const yTo = gsap.quickTo(revealLayer, "y", { duration: 0.4, ease: "power3.out" });
    const baseXTo = gsap.quickTo(baseLayer, "x", { duration: 0.75, ease: "power3.out" });
    const baseYTo = gsap.quickTo(baseLayer, "y", { duration: 0.75, ease: "power3.out" });
    const focusPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const syncFocusPosition = () => {
        heroWrapper.style.setProperty("--hero-reveal-x", `${focusPosition.x}px`);
        heroWrapper.style.setProperty("--hero-reveal-y", `${focusPosition.y}px`);
    };
    const focusXTo = gsap.quickTo(focusPosition, "x", { duration: 0.28, ease: "power3.out", onUpdate: syncFocusPosition });
    const focusYTo = gsap.quickTo(focusPosition, "y", { duration: 0.28, ease: "power3.out", onUpdate: syncFocusPosition });

    let idleTimer;
    let isMoving = false;

    const resetHeroInteraction = () => {
        clearTimeout(idleTimer);
        isMoving = false;
        heroWrapper.classList.remove("is-interacting");
        focusXTo(window.innerWidth / 2);
        focusYTo(window.innerHeight / 2);
        xTo(0);
        yTo(0);
        baseXTo(0);
        baseYTo(0);

        if (window.scrollY <= 50) {
            gsap.to(heroWrapper, {
                "--hero-reveal-radius": `${heroIdleRadius()}px`,
                "--hero-reticle-size": `${heroIdleRadius() * 2}px`,
                "--hero-focus-opacity": 0.58,
                duration: 0.9,
                ease: "power3.out",
                overwrite: "auto"
            });
            gsap.to(revealLayer, {
                opacity: 0.82,
                scale: 1.025,
                filter: "brightness(1.02) saturate(0.92)",
                duration: 0.85,
                ease: "power2.out",
                overwrite: "auto",
                onComplete: () => glitchTl.restart()
            });
            gsap.to(baseLayer, { scale: 1.012, filter: "brightness(0.92) saturate(0.86)", duration: 0.9, ease: "power2.out", overwrite: "auto" });
        }
    };

    heroWrapper.addEventListener("pointermove", (e) => {
        if (reducedMotion || !precisePointer) return;
        if (window.scrollY > 50) return;

        if (!isMoving) {
            isMoving = true;
            glitchTl.pause();
            heroWrapper.classList.add("is-interacting");
            gsap.to(heroWrapper, {
                "--hero-reveal-radius": `${heroActiveRadius()}px`,
                "--hero-reticle-size": `${heroActiveRadius() * 2}px`,
                "--hero-focus-opacity": 1,
                duration: 0.75,
                ease: "power3.out",
                overwrite: "auto"
            });
            gsap.to(revealLayer, { opacity: 1, scale: 1.055, filter: "brightness(1.05) saturate(1.03)", duration: 0.9, ease: "power2.out", overwrite: "auto" });
            gsap.to(baseLayer, { scale: 1.025, filter: "brightness(0.86) saturate(0.8)", duration: 0.9, ease: "power2.out", overwrite: "auto" });
        }

        const xPos = ((e.clientX / window.innerWidth) - 0.5) * 34;
        const yPos = ((e.clientY / window.innerHeight) - 0.5) * 26;
        focusXTo(e.clientX);
        focusYTo(e.clientY);
        xTo(xPos);
        yTo(yPos);
        baseXTo(xPos * -0.2);
        baseYTo(yPos * -0.2);

        clearTimeout(idleTimer);
        idleTimer = setTimeout(resetHeroInteraction, 900);
    });

    heroWrapper.addEventListener("pointerleave", () => {
        if (reducedMotion || !precisePointer) return;
        resetHeroInteraction();
    });

    // 6. SCROLL TRIGGER — HERO > TITLE/SIGNATURE > LONG FORM
    if (reducedMotion) {
        gsap.set(heroWrapper, {
            "--hero-reveal-radius": `${heroFullRadius()}px`,
            "--hero-reticle-size": "0px",
            "--hero-focus-opacity": 0,
            "--hero-shade-opacity": 0.58,
            "--hero-edge-opacity": 1
        });
        gsap.set([revealLayer, baseLayer], { opacity: 0.52, filter: "brightness(0.62)" });
        gsap.set(heroFocusReticle, { display: "none" });
        gsap.set('.marquee-container', { opacity: 1, y: 0 });
        gsap.set('.hero-title-line > span', { yPercent: 0, rotation: 0 });
        gsap.set('.hero-title-eyebrow > span, .hero-title-bottom > span', { opacity: 1, y: 0 });
        gsap.set('.hero-title-rule i', { scaleX: 1 });
        gsap.set('.signature', { opacity: 1, y: 0, scale: 1 });
    } else {
        const heroTl = gsap.timeline({
            scrollTrigger: {
                trigger: heroWrapper,
                start: "top top",
                end: () => window.innerWidth < 768 ? "+=145%" : "+=190%",
                scrub: 0.8,
                pin: true,
                pinSpacing: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onEnter: () => glitchTl.pause(),
                onLeaveBack: () => precisePointer && glitchTl.restart()
            }
        });

        // The image remains visible while the typography enters.
        heroTl.to(heroWrapper, {
            "--hero-reveal-radius": () => `${heroFullRadius()}px`,
            "--hero-reticle-size": () => `${heroFullRadius() * 2}px`,
            "--hero-focus-opacity": 0,
            "--hero-shade-opacity": 0.68,
            "--hero-edge-opacity": 0.9,
            duration: 0.9,
            ease: "power2.inOut"
        }, 0)
        .to(heroInterface, {
            opacity: 0,
            y: -12,
            duration: 0.55,
            ease: "power2.out"
        }, 0.04)
        .to(".hero-center-cta", {
            opacity: 0,
            y: -18,
            duration: 0.4,
            ease: "power2.out"
        }, 0.02)
        .to("body", {
            "--topo-dark-color": "rgba(212, 255, 20, 0.05)",
            backgroundColor: "#050505",
            duration: 0.8,
            ease: "power2.inOut"
        }, 0)
        .to([baseLayer, revealLayer], {
            opacity: 0.54,
            scale: 1.045,
            x: 0,
            y: 0,
            filter: "brightness(0.58) saturate(0.78)",
            duration: 1.15,
            ease: "power2.inOut"
        }, 0)

        // Masked editorial title reveal: main line, outlined line, metadata and signature.
        .to('.marquee-container', {
            opacity: 1,
            duration: 0.3,
            ease: "none"
        }, 0.12)
        .to('.hero-title-line-primary > span', {
            yPercent: 0,
            rotation: 0,
            duration: 0.74,
            ease: "power4.out"
        }, 0.18)
        .to('.hero-title-line-secondary > span', {
            yPercent: 0,
            rotation: 0,
            duration: 0.76,
            stagger: 0.08,
            ease: "power4.out"
        }, 0.27)
        .to('.hero-title-eyebrow > span', {
            opacity: 1,
            y: 0,
            duration: 0.46,
            stagger: 0.06,
            ease: "power2.out"
        }, 0.34)
        .to('.hero-title-rule i', {
            scaleX: 1,
            duration: 0.78,
            ease: "power3.inOut"
        }, 0.42)
        .to('.hero-title-bottom > span', {
            opacity: 1,
            y: 0,
            duration: 0.48,
            stagger: 0.06,
            ease: "power2.out"
        }, 0.48)
        .to('.signature', {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.85,
            ease: "power3.out"
        }, 0.38)

        // Opposing drift keeps the composition alive while preserving readability.
        .to('.hero-title-line-primary > span', {
            xPercent: -2.8,
            duration: 1.65,
            ease: "none"
        }, 0.88)
        .to('.hero-title-line-secondary > span', {
            xPercent: 2.8,
            duration: 1.65,
            ease: "none"
        }, 0.88)
        .to(heroWrapper, {
            "--hero-shade-opacity": 0.76,
            duration: 0.42,
            ease: "none"
        }, 2.24)

        // Everything resolves into black before the Long Form pin begins.
        .to('.hero-title-eyebrow > span, .hero-title-bottom > span', {
            opacity: 0,
            y: -10,
            duration: 0.38,
            ease: "power2.in"
        }, 2.52)
        .to('.hero-title-rule i', {
            opacity: 0,
            scaleX: 0.72,
            duration: 0.42,
            ease: "power2.in"
        }, 2.52)
        .to('.hero-title-line-primary > span', {
            xPercent: -18,
            opacity: 0,
            duration: 0.66,
            ease: "power3.in"
        }, 2.58)
        .to('.hero-title-line-secondary > span', {
            xPercent: 18,
            opacity: 0,
            duration: 0.66,
            ease: "power3.in"
        }, 2.58)
        .to('.signature', {
            opacity: 0,
            y: -28,
            duration: 0.66,
            ease: "power2.in"
        }, 2.58)
        .to('.marquee-container', {
            opacity: 0,
            duration: 0.36,
            ease: "none"
        }, 2.92)
        .to([baseLayer, revealLayer], {
            opacity: 0,
            scale: 1.09,
            filter: "blur(6px) brightness(0.34)",
            duration: 0.82,
            ease: "power2.inOut"
        }, 2.72)
        .to(heroWrapper, {
            "--hero-shade-opacity": 1,
            "--hero-edge-opacity": 1,
            duration: 0.82,
            ease: "power2.inOut"
        }, 2.72);
    }

    // =========================================
    // 2. PORTFOLIO SHOWCASE LOGIC (With Color Transition)
    // =========================================

    let mm = gsap.matchMedia();
    const longformSection = document.querySelector(".portfolio-showcase");
    const longformCurrent = document.querySelector("[data-longform-current]");
    const longformTotal = document.querySelector("[data-longform-total]");
    const longformProgress = document.querySelector("[data-longform-progress]");

    const setLongformActive = (items, index) => {
        if (!items.length) return;
        const safeIndex = Math.max(0, Math.min(index, items.length - 1));
        items.forEach((item, itemIndex) => item.classList.toggle("is-active", itemIndex === safeIndex));
        if (longformCurrent) longformCurrent.textContent = String(safeIndex + 1).padStart(2, "0");
    };

    const initialLongformItems = gsap.utils.toArray(".project-item");
    if (longformTotal) longformTotal.textContent = String(initialLongformItems.length).padStart(2, "0");
    setLongformActive(initialLongformItems, 0);

    mm.add("(min-width: 768px)", () => {
        const track = document.querySelector(".portfolio-track");
        const items = gsap.utils.toArray(".project-item");
        if (!items.length || longformSection.hidden) return;

        const scrollDistance = () => Math.max(track.scrollWidth - window.innerWidth, 1);
        const updateLongformState = (progress) => {
            if (longformProgress) longformProgress.style.transform = `scaleX(${progress})`;
            setLongformActive(items, Math.round(progress * (items.length - 1)));
        };

        const scrollTween = gsap.to(track, {
            x: () => -scrollDistance(),
            ease: "none",
            scrollTrigger: {
                trigger: longformSection,
                pin: !reducedMotion,
                start: "top top",
                end: () => `+=${scrollDistance()}`,
                scrub: reducedMotion ? false : 0.8,
                invalidateOnRefresh: true,
                onUpdate: (self) => updateLongformState(self.progress)
            }
        });

        gsap.to("body", {
            backgroundColor: "#f4f4f0",
            "--topo-dark-opacity": 0,
            "--topo-light-opacity": 1,
            ease: "none",
            scrollTrigger: {
                trigger: longformSection,
                start: "top top",
                end: () => `+=${scrollDistance() * 0.48}`,
                scrub: 1
            }
        });

        gsap.to(longformSection, {
            "--longform-ink": "#171717",
            "--longform-muted": "rgba(23, 23, 23, 0.56)",
            "--longform-line": "rgba(23, 23, 23, 0.2)",
            ease: "none",
            scrollTrigger: {
                trigger: longformSection,
                start: "top top",
                end: () => `+=${scrollDistance() * 0.48}`,
                scrub: 1
            }
        });

        gsap.to(".longform-heading", {
            x: -70,
            y: -18,
            opacity: 0.16,
            ease: "none",
            scrollTrigger: {
                trigger: longformSection,
                start: "top top",
                end: () => `+=${scrollDistance() * 0.72}`,
                scrub: 1
            }
        });

        items.forEach((item, index) => {
            const wrapper = item.querySelector(".video-wrapper");
            const video = wrapper.querySelector("video");
            const entryRotation = index % 2 ? -1.8 : 1.8;

            gsap.set(wrapper, {
                scale: 0.84,
                opacity: 0.24,
                rotation: entryRotation,
                filter: "grayscale(100%) brightness(0.72) blur(1px)"
            });

            gsap.timeline({
                scrollTrigger: {
                    trigger: item,
                    containerAnimation: scrollTween,
                    start: "left center+=38%",
                    end: "center center",
                    scrub: reducedMotion ? false : true,
                    onEnter: () => safeMediaPlay(video),
                    onLeaveBack: () => safeMediaPause(video)
                }
            }).to(wrapper, {
                scale: 1,
                opacity: 1,
                rotation: 0,
                filter: "grayscale(0%) brightness(1) blur(0px)",
                ease: "power1.out"
            });

            gsap.timeline({
                scrollTrigger: {
                    trigger: item,
                    containerAnimation: scrollTween,
                    start: "center center",
                    end: "right center-=38%",
                    scrub: reducedMotion ? false : true,
                    onLeave: () => safeMediaPause(video),
                    onEnterBack: () => safeMediaPlay(video)
                }
            }).to(wrapper, {
                scale: 0.86,
                opacity: 0.28,
                rotation: -entryRotation,
                filter: "grayscale(100%) brightness(0.76) blur(1px)",
                ease: "power1.in"
            });
        });
    });

    mm.add("(max-width: 767px)", () => {
        const items = gsap.utils.toArray(".project-item");
        if (!items.length || longformSection.hidden) return;

        gsap.to("body", {
            backgroundColor: "#f4f4f0",
            "--topo-dark-opacity": 0,
            "--topo-light-opacity": 1,
            ease: "none",
            scrollTrigger: { trigger: longformSection, start: "top 60%", end: "top 10%", scrub: 1 }
        });

        gsap.to(longformSection, {
            "--longform-ink": "#171717",
            "--longform-muted": "rgba(23, 23, 23, 0.56)",
            "--longform-line": "rgba(23, 23, 23, 0.2)",
            ease: "none",
            scrollTrigger: { trigger: longformSection, start: "top 60%", end: "top 10%", scrub: 1 }
        });

        items.forEach((item, index) => {
            const wrapper = item.querySelector(".video-wrapper");
            const video = wrapper.querySelector("video");

            gsap.fromTo(item,
                { y: 65, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.85,
                    ease: "power2.out",
                    scrollTrigger: { trigger: item, start: "top 88%", toggleActions: "play none none reverse" }
                }
            );

            gsap.set(wrapper, { scale: 0.94, opacity: 0.5, filter: "grayscale(100%) brightness(0.8)" });
            gsap.timeline({
                scrollTrigger: {
                    trigger: item,
                    start: "top center+=35%",
                    end: "center center",
                    scrub: reducedMotion ? false : true,
                    onEnter: () => {
                        setLongformActive(items, index);
                        safeMediaPlay(video);
                    },
                    onEnterBack: () => setLongformActive(items, index),
                    onLeaveBack: () => safeMediaPause(video)
                }
            }).to(wrapper, { scale: 1, opacity: 1, filter: "grayscale(0%) brightness(1)", ease: "power1.out" });

            gsap.timeline({
                scrollTrigger: {
                    trigger: item,
                    start: "center center",
                    end: "bottom center-=35%",
                    scrub: reducedMotion ? false : true,
                    onLeave: () => safeMediaPause(video),
                    onEnterBack: () => {
                        setLongformActive(items, index);
                        safeMediaPlay(video);
                    }
                }
            }).to(wrapper, { scale: 0.96, opacity: 0.48, filter: "grayscale(80%) brightness(0.86)", ease: "power1.in" });
        });
    });

    // =========================================
    // 3. PARTNERS & CLIENTS (Dynamic Logo Slider)
    // =========================================
    async function loadClientLogos() {
        if (window.CrotiCMS?.isConfigured() && window.CrotiCMS.listPublishedClients) {
            try {
                const clients = await window.CrotiCMS.listPublishedClients();
                if (clients.length) return clients;
            } catch (error) {
                console.warn("Não foi possível carregar os clientes do painel.", error);
            }
        }

        return Array.isArray(window.CROTI_CLIENTS) ? window.CROTI_CLIENTS : [];
    }

    async function initPartnersSection() {
        const section = document.getElementById("partners-section");
        if (!section) return;

        const clients = await loadClientLogos();
        const followerFormatter = new Intl.NumberFormat("pt-BR", {
            notation: "compact",
            maximumFractionDigits: 1
        });
        const platformIcons = {
            instagram: `<svg class="platform-icon platform-icon-instagram" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.8" r="1" class="platform-icon-dot"/></svg>`,
            youtube: `<svg class="platform-icon platform-icon-youtube" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 6 3-6 3V9Z"/></svg>`,
            tiktok: `<svg class="platform-icon platform-icon-tiktok" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 3c.35 2.25 1.62 3.58 3.8 4v3.05a8.2 8.2 0 0 1-3.8-1.05v6.05A5.95 5.95 0 1 1 9 9.15v3.22a2.82 2.82 0 1 0 2.05 2.68V3h3.15Z"/></svg>`
        };

        const isEN = window.CrotiI18n?.getLanguage() === "EN";

        const slidesHTML = clients.map((client, index) => {
            const rawName = String(client.name || `CLIENT ${String(index + 1).padStart(2, "0")}`);
            const name = escapeHTML(rawName);
            const indexLabel = String(index + 1).padStart(2, "0");
            const platform = ["instagram", "youtube", "tiktok"].includes(client.platform) ? client.platform : "instagram";
            const platformName = ({ instagram: "INSTAGRAM", youtube: "YOUTUBE", tiktok: "TIKTOK" })[platform];
            const metricName = platform === "youtube" ? (isEN ? "SUBSCRIBERS" : "INSCRITOS") : (isEN ? "FOLLOWERS" : "SEGUIDORES");
            const username = escapeHTML(String(client.username || `client${indexLabel}`).replace(/^@/, ""));
            const profileImageUrl = client.profileImageUrl || client.logoUrl || "";
            const initials = escapeHTML(rawName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || indexLabel);
            const followerCount = Number(client.followersCount) || 0;
            const followers = followerCount > 0 ? followerFormatter.format(followerCount) : "—";
            const profileVisual = profileImageUrl
                ? `<img src="${escapeHTML(profileImageUrl)}" alt="Foto de perfil de ${name}" class="client-profile-image" loading="lazy">`
                : `<span class="client-profile-fallback" aria-hidden="true">${initials}</span>`;
            const verifiedBadge = `
                <span class="client-verified-badge" title="Perfil verificado" aria-label="Perfil verificado">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 16.2 5.5 12.5l1.8-1.8 1.9 1.9 7.5-7.5 1.8 1.8-9.3 9.3Z"/></svg>
                </span>
            `;
            const cardContent = `
                <span class="client-slide-top">
                    <span class="client-slide-index">${indexLabel}</span>
                    <span class="client-platform-label">${platformIcons[platform]}<span>${platformName}</span></span>
                </span>
                <span class="client-profile-block">
                    <span class="client-profile-avatar">${profileVisual}</span>
                    <span class="client-profile-copy">
                        <strong class="client-profile-name">${name}${verifiedBadge}</strong>
                        <span class="client-profile-handle">@${username}</span>
                    </span>
                </span>
                <span class="client-followers"><strong>${followers}</strong><small>${metricName}</small></span>
                <span class="client-card-footer"><span>${isEN ? "VIEW" : "VER NO"} ${platformName}</span><span aria-hidden="true">↗</span></span>
            `;

            const profileUrl = String(client.profileUrl || client.instagramUrl || "");

            return `
                <article class="client-slide" aria-label="${name}">
                    ${profileUrl && profileUrl !== "#"
                        ? `<a class="client-logo-card" href="${escapeHTML(profileUrl)}" target="_blank" rel="noopener noreferrer">${cardContent}</a>`
                        : `<div class="client-logo-card">${cardContent}</div>`}
                </article>
            `;
        }).join("");

        section.innerHTML = `
            <div class="partners-topline">
                <span data-i18n="collabs_kicker">05 / SELECTED COLLABORATIONS</span>
                <span data-i18n="collabs_sub">MULTI-PLATFORM CLIENT ARCHIVE</span>
            </div>

            <div class="partners-header">
                <div class="partners-title-wrapper">
                    <span class="partners-accent" data-i18n="collabs_accent">Collabs</span>
                    <h2 class="partners-title" data-i18n="collabs_title">
                        <span>BRANDS</span>
                        <span>& PROJECTS</span>
                    </h2>
                </div>
                <p class="partners-desc" data-i18n="collabs_desc">
                    Tenho o orgulho de colaborar com parceiros que respiram alta performance. Unindo edição cinematográfica, design comercial e visão estratégica para entregar um impacto visual impossível de ser ignorado.
                </p>
            </div>

            <div class="partners-slider-shell" data-partners-slider>
                <div class="partners-slider-toolbar">
                    <span class="partners-slider-label" data-i18n="collabs_label">SELECTED CLIENTS</span>
                    <div class="partners-slider-tools">
                        <span class="partners-slider-count"><span data-partners-current>01</span> / ${String(clients.length).padStart(2, "0")}</span>
                        <div class="partners-slider-controls">
                            <button class="partners-slider-btn" type="button" data-partners-prev aria-label="Logo anterior">←</button>
                            <button class="partners-slider-btn" type="button" data-partners-next aria-label="Próximo logo">→</button>
                        </div>
                    </div>
                </div>

                <div class="partners-slider-viewport" tabindex="0" aria-label="Logos de clientes">
                    <div class="partners-slider-track">
                        ${slidesHTML}
                    </div>
                </div>
            </div>
        `;

        const slider = section.querySelector("[data-partners-slider]");
        const viewport = slider?.querySelector(".partners-slider-viewport");
        const slides = [...(slider?.querySelectorAll(".client-slide") || [])];
        const currentLabel = slider?.querySelector("[data-partners-current]");
        const previousButton = slider?.querySelector("[data-partners-prev]");
        const nextButton = slider?.querySelector("[data-partners-next]");

        if (viewport && slides.length) {
            let currentIndex = 0;
            let autoplayTimer = null;
            let scrollFrame = null;

            const updateCurrent = (index) => {
                currentIndex = (index + slides.length) % slides.length;
                if (currentLabel) currentLabel.textContent = String(currentIndex + 1).padStart(2, "0");
            };

            const goToSlide = (index, behavior = "smooth") => {
                const nextIndex = (index + slides.length) % slides.length;
                viewport.scrollTo({ left: slides[nextIndex].offsetLeft, behavior });
                updateCurrent(nextIndex);
            };

            const stopAutoplay = () => {
                if (autoplayTimer) window.clearInterval(autoplayTimer);
                autoplayTimer = null;
            };

            const startAutoplay = () => {
                stopAutoplay();
                if (reducedMotion || slides.length < 2) return;
                autoplayTimer = window.setInterval(() => goToSlide(currentIndex + 1), 3600);
            };

            previousButton?.addEventListener("click", () => {
                goToSlide(currentIndex - 1);
                startAutoplay();
            });
            nextButton?.addEventListener("click", () => {
                goToSlide(currentIndex + 1);
                startAutoplay();
            });

            viewport.addEventListener("scroll", () => {
                if (scrollFrame) return;
                scrollFrame = window.requestAnimationFrame(() => {
                    const nearestIndex = slides.reduce((nearest, slide, index) =>
                        Math.abs(slide.offsetLeft - viewport.scrollLeft) < Math.abs(slides[nearest].offsetLeft - viewport.scrollLeft)
                            ? index
                            : nearest, 0);
                    updateCurrent(nearestIndex);
                    scrollFrame = null;
                });
            }, { passive: true });

            slider.addEventListener("mouseenter", stopAutoplay);
            slider.addEventListener("mouseleave", startAutoplay);
            slider.addEventListener("focusin", stopAutoplay);
            slider.addEventListener("focusout", startAutoplay);
            startAutoplay();
        }

        ScrollTrigger.refresh();
    }

    initPartnersSection();

    // =========================================
    // 4. TESTIMONIALS — ANIMATED CARD SLIDER
    // =========================================
    async function loadTestimonials() {
        if (window.CrotiCMS?.isConfigured() && window.CrotiCMS.listPublishedTestimonials) {
            try {
                const testimonials = await window.CrotiCMS.listPublishedTestimonials();
                if (testimonials.length) return testimonials;
            } catch (error) {
                console.warn("Não foi possível carregar os depoimentos do painel.", error);
            }
        }
        return Array.isArray(window.CROTI_TESTIMONIALS) ? window.CROTI_TESTIMONIALS : [];
    }

    async function initTestimonialsSection() {
        const section = document.getElementById("testimonials-section");
        if (!section) return;
        const testimonials = await loadTestimonials();
        if (!testimonials.length) {
            section.hidden = true;
            return;
        }

        const isEN = window.CrotiI18n?.getLanguage() === "EN";

        const cardsHTML = testimonials.map((testimonial, index) => {
            const rawName = String(testimonial.name || `CLIENT ${index + 1}`);
            const name = escapeHTML(rawName);
            const rawRole = isEN ? (testimonial.role_en || testimonial.role || "CLIENT") : (testimonial.role_pt || testimonial.role || "CLIENTE");
            const role = escapeHTML(rawRole);
            const rawQuote = isEN ? (testimonial.quote_en || testimonial.quote || "") : (testimonial.quote_pt || testimonial.quote || "");
            const quote = escapeHTML(rawQuote);
            const initials = escapeHTML(rawName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "CL");
            const avatar = testimonial.profileImageUrl
                ? `<img src="${escapeHTML(testimonial.profileImageUrl)}" alt="${name}" loading="lazy">`
                : `<span aria-hidden="true">${initials}</span>`;

            return `
                <article class="testimonial-card" data-testimonial-card>
                    <div class="testimonial-card-top">
                        <span>${String(index + 1).padStart(2, "0")}</span>
                        <span class="testimonial-quote-mark" aria-hidden="true">“</span>
                    </div>
                    <blockquote>${quote}</blockquote>
                    <footer class="testimonial-author">
                        <span class="testimonial-avatar">${avatar}</span>
                        <span>
                            <strong>${name}</strong>
                            <small>${role}</small>
                        </span>
                    </footer>
                </article>
            `;
        }).join("");

        section.innerHTML = `
            <div class="testimonials-shell" data-testimonials-slider>
                <div class="testimonials-topline">
                    <span data-i18n="reviews_kicker">06 / CLIENT TESTIMONIALS</span>
                    <span data-i18n="reviews_sub">WORDS FROM THE WORK</span>
                </div>

                <header class="testimonials-header">
                    <div>
                        <span class="testimonials-accent" data-i18n="reviews_accent">Reviews</span>
                        <h2 data-i18n="reviews_title">WHAT THEY<br>SAY.</h2>
                    </div>
                    <div class="testimonials-controls-wrap">
                        <p data-i18n="reviews_desc">Selected notes from clients, creators and teams across different formats.</p>
                        <div class="testimonials-controls">
                            <span class="testimonials-count"><span data-testimonial-current>01</span> / ${String(testimonials.length).padStart(2, "0")}</span>
                            <button type="button" data-testimonial-prev aria-label="Depoimento anterior">←</button>
                            <button type="button" data-testimonial-next aria-label="Próximo depoimento">→</button>
                        </div>
                    </div>
                </header>

                <div class="testimonials-viewport" tabindex="0" aria-label="Depoimentos de clientes">
                    <div class="testimonials-track">${cardsHTML}</div>
                </div>
            </div>
        `;

        const slider = section.querySelector("[data-testimonials-slider]");
        const viewport = slider.querySelector(".testimonials-viewport");
        const cards = [...slider.querySelectorAll("[data-testimonial-card]")];
        const currentLabel = slider.querySelector("[data-testimonial-current]");
        let currentIndex = 0;
        let autoplayTimer = null;
        let scrollFrame = null;

        const updateCurrent = (index) => {
            currentIndex = (index + cards.length) % cards.length;
            currentLabel.textContent = String(currentIndex + 1).padStart(2, "0");
            cards.forEach((card, cardIndex) => card.classList.toggle("is-current", cardIndex === currentIndex));
        };

        const goTo = (index, behavior = "smooth") => {
            const nextIndex = (index + cards.length) % cards.length;
            viewport.scrollTo({ left: cards[nextIndex].offsetLeft, behavior });
            updateCurrent(nextIndex);
        };

        const stopAutoplay = () => {
            if (autoplayTimer) window.clearInterval(autoplayTimer);
            autoplayTimer = null;
        };

        const startAutoplay = () => {
            stopAutoplay();
            if (reducedMotion || cards.length < 2) return;
            autoplayTimer = window.setInterval(() => goTo(currentIndex + 1), 4600);
        };

        slider.querySelector("[data-testimonial-prev]").addEventListener("click", () => {
            goTo(currentIndex - 1);
            startAutoplay();
        });
        slider.querySelector("[data-testimonial-next]").addEventListener("click", () => {
            goTo(currentIndex + 1);
            startAutoplay();
        });

        viewport.addEventListener("scroll", () => {
            if (scrollFrame) return;
            scrollFrame = window.requestAnimationFrame(() => {
                const nearest = cards.reduce((best, card, index) =>
                    Math.abs(card.offsetLeft - viewport.scrollLeft) < Math.abs(cards[best].offsetLeft - viewport.scrollLeft)
                        ? index
                        : best, 0);
                updateCurrent(nearest);
                scrollFrame = null;
            });
        }, { passive: true });

        slider.addEventListener("mouseenter", stopAutoplay);
        slider.addEventListener("mouseleave", startAutoplay);
        slider.addEventListener("focusin", stopAutoplay);
        slider.addEventListener("focusout", startAutoplay);
        updateCurrent(0);
        startAutoplay();

        if (!reducedMotion) {
            gsap.from(cards, {
                y: 80,
                opacity: 0,
                rotate: 2,
                duration: 0.9,
                stagger: 0.1,
                ease: "power3.out",
                clearProps: "transform,opacity",
                scrollTrigger: { trigger: section, start: "top 72%", once: true }
            });
        }
    }

    await initTestimonialsSection();

    // =========================================
    // 5. GENERAL QUESTIONS — ACCESSIBLE ACCORDION
    // =========================================
    function initFaqSection() {
        const section = document.getElementById("faq-section");
        const faqs = Array.isArray(window.CROTI_FAQS) ? window.CROTI_FAQS : [];
        if (!section) return;
        if (!faqs.length) {
            section.hidden = true;
            return;
        }

        const isEN = window.CrotiI18n?.getLanguage() === "EN";

        const faqHTML = faqs.map((faq, index) => {
            const answerId = `faq-answer-${index + 1}`;
            const question = isEN ? (faq.question_en || faq.question) : (faq.question || faq.question_en);
            const answer = isEN ? (faq.answer_en || faq.answer) : (faq.answer || faq.answer_en);
            return `
                <article class="faq-item">
                    <button class="faq-question" type="button" aria-expanded="false" aria-controls="${answerId}">
                        <span class="faq-index">${String(index + 1).padStart(2, "0")}</span>
                        <span class="faq-question-text">${escapeHTML(question)}</span>
                        <span class="faq-toggle" aria-hidden="true">+</span>
                    </button>
                    <div class="faq-answer" id="${answerId}" role="region">
                        <div><p>${escapeHTML(answer)}</p></div>
                    </div>
                </article>
            `;
        }).join("");

        section.innerHTML = `
            <div class="faq-shell">
                <div class="faq-topline">
                    <span data-i18n="faq_kicker">07 / GENERAL QUESTIONS</span>
                    <span data-i18n="faq_sub">THE DETAILS BEFORE WE START</span>
                </div>
                <div class="faq-layout">
                    <header class="faq-heading">
                        <span class="faq-accent" data-i18n="faq_accent">FAQ</span>
                        <h2 data-i18n="faq_title">BEFORE<br>WE START.</h2>
                        <p data-i18n="faq_desc">Everything you need to know before bringing a project to life.</p>
                    </header>
                    <div class="faq-list">${faqHTML}</div>
                </div>
            </div>
        `;

        const items = [...section.querySelectorAll(".faq-item")];
        const setOpen = (item, open) => {
            item.classList.toggle("is-open", open);
            item.querySelector(".faq-question").setAttribute("aria-expanded", String(open));
            item.querySelector(".faq-toggle").textContent = open ? "−" : "+";
        };

        items.forEach(item => {
            item.querySelector(".faq-question").addEventListener("click", () => {
                const willOpen = !item.classList.contains("is-open");
                items.forEach(other => setOpen(other, false));
                if (willOpen) setOpen(item, true);
            });
        });

        if (!reducedMotion) {
            gsap.from(items, {
                y: 30,
                opacity: 0,
                duration: 0.65,
                stagger: 0.08,
                ease: "power2.out",
                scrollTrigger: { trigger: section, start: "top 72%", once: true }
            });
        }

        ScrollTrigger.refresh();
    }

    initFaqSection();

    window.addEventListener("croti-lang-change", () => {
        initPartnersSection();
        initTestimonialsSection();
        initFaqSection();
    });

    // =========================================
    // 6. SHORT FORM — CONTINUOUS CSS 3D ORBIT
    // =========================================
    function initShortFormOrbit() {
        const section = document.getElementById("video-fan-section");
        const scene = section?.querySelector(".short-orbit-scene");
        const camera = section?.querySelector(".short-orbit-camera");
        const items = [...(section?.querySelectorAll(".short-orbit-item") || [])];

        if (!section || section.hidden || !scene || !camera || !items.length) return;

        const cards = items.map((item) => item.querySelector(".short-form-card"));
        const videos = items.map((item) => item.querySelector("video"));
        const orbitState = { rotation: reducedMotion ? 12 : 0 };
        const speedState = { value: 1 };
        let orbitTween = null;
        let activeIndex = -1;
        let sectionVisible = false;

        const orbitRadius = () => {
            const width = scene.clientWidth;
            if (window.innerWidth <= 480) return Math.min(154, width * 0.39);
            if (window.innerWidth <= 767) return Math.min(184, width * 0.4);
            if (window.innerWidth <= 1024) return Math.min(310, width * 0.34);
            return Math.min(510, Math.max(360, width * 0.32));
        };

        const updatePlayback = () => {
            videos.forEach((video, index) => {
                if (sectionVisible && index === activeIndex && !reducedMotion) {
                    safeMediaPlay(video);
                } else {
                    safeMediaPause(video);
                }
            });
        };

        const setActiveCard = (nextIndex) => {
            if (nextIndex === activeIndex) return;
            activeIndex = nextIndex;

            cards.forEach((card, index) => {
                const isFront = index === activeIndex;
                card.dataset.front = String(isFront);
                card.tabIndex = isFront ? 0 : -1;
            });

            updatePlayback();
        };

        const renderOrbit = () => {
            const radius = orbitRadius();
            const step = 360 / items.length;
            let nearestIndex = 0;
            let nearestDepth = -1;

            items.forEach((item, index) => {
                const angle = orbitState.rotation + index * step;
                const radians = angle * Math.PI / 180;
                const depth = (Math.cos(radians) + 1) / 2;
                const easedDepth = Math.pow(depth, 1.05);
                const floatY = Math.sin(radians * 2 + index * 0.72) * (8 + depth * 9);
                const tiltX = Math.sin(radians * 1.4 + index) * 1.8;
                const tiltZ = Math.cos(radians * 1.15 + index * 0.8) * 1.25;
                const scale = 0.68 + easedDepth * 0.32;
                const opacity = 0.24 + Math.pow(depth, 0.78) * 0.76;
                const blur = (1 - depth) * 1.9;
                const saturation = 0.52 + easedDepth * 0.48;
                const card = cards[index];

                item.style.transform = `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${radius}px) translateY(${floatY}px)`;
                item.style.zIndex = String(Math.round(depth * 100));
                card.style.transform = `rotateY(${-angle}deg) rotateX(${tiltX}deg) rotateZ(${tiltZ}deg) scale(${scale})`;
                card.style.setProperty("--depth-opacity", opacity.toFixed(3));
                card.style.setProperty("--depth-blur", `${blur.toFixed(2)}px`);
                card.style.setProperty("--depth-saturation", saturation.toFixed(3));
                card.style.pointerEvents = depth > 0.78 ? "auto" : "none";

                if (depth > nearestDepth) {
                    nearestDepth = depth;
                    nearestIndex = index;
                }
            });

            setActiveCard(nearestIndex);
        };

        const setOrbitSpeed = (target) => {
            if (!orbitTween || reducedMotion) return;
            gsap.killTweensOf(speedState);
            speedState.value = orbitTween.timeScale();
            gsap.to(speedState, {
                value: target,
                duration: 0.75,
                ease: "power2.out",
                overwrite: true,
                onUpdate: () => orbitTween.timeScale(speedState.value)
            });
        };

        gsap.set(camera, { rotationX: -7, rotationY: 0, z: -18, transformOrigin: "50% 50%" });
        renderOrbit();

        if (!reducedMotion) {
            orbitTween = gsap.to(orbitState, {
                rotation: 360,
                duration: 28,
                ease: "none",
                repeat: -1,
                onUpdate: renderOrbit
            });

            gsap.fromTo(section.querySelectorAll(".short-form-title span"),
                { yPercent: 90, opacity: 0 },
                {
                    yPercent: 0,
                    opacity: 1,
                    duration: 1.15,
                    stagger: 0.1,
                    ease: "power4.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 72%",
                        toggleActions: "play none none reverse"
                    }
                }
            );

            gsap.fromTo(scene,
                { scale: 0.9, opacity: 0, y: 34 },
                {
                    scale: 1,
                    opacity: 1,
                    y: 0,
                    duration: 1.3,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: scene,
                        start: "top 84%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        }

        cards.forEach((card) => {
            const holdOrbit = () => {
                if (card.dataset.front !== "true") return;
                card.classList.add("is-held");
                setOrbitSpeed(0.035);
            };

            const releaseOrbit = () => {
                card.classList.remove("is-held");
                setOrbitSpeed(1);
            };

            card.addEventListener("pointerenter", holdOrbit);
            card.addEventListener("pointerleave", releaseOrbit);
            card.addEventListener("focus", holdOrbit);
            card.addEventListener("blur", releaseOrbit);
        });

        if (precisePointer && !reducedMotion) {
            scene.addEventListener("pointermove", (event) => {
                const rect = scene.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
                const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

                gsap.to(camera, {
                    rotationX: -7 - y * 2.6,
                    rotationY: x * 4.2,
                    z: -18,
                    duration: 0.85,
                    ease: "power2.out",
                    overwrite: "auto"
                });
            });

            scene.addEventListener("pointerleave", () => {
                gsap.to(camera, {
                    rotationX: -7,
                    rotationY: 0,
                    z: -18,
                    duration: 1.1,
                    ease: "power3.out",
                    overwrite: "auto"
                });
            });
        }

        const visibilityObserver = new IntersectionObserver(([entry]) => {
            sectionVisible = entry.isIntersecting;
            updatePlayback();
        }, { threshold: 0.12 });

        visibilityObserver.observe(section);
        window.addEventListener("resize", renderOrbit, { passive: true });
    }

    initShortFormOrbit();

    // Long Form and 3D Shorts share the same fullscreen viewer used by the catalog.
    function initShowcasePlayerTriggers() {
        const fallbackPoster = "./assets/img/hero-base-office.png";

        const getLongformProjects = () => [...document.querySelectorAll(".project-item")].map((item, index) => {
            const video = item.querySelector("video");
            const title = item.querySelector(".project-info strong")?.textContent.trim() || `LONG FORM ${index + 1}`;
            const detail = item.querySelector(".project-info small")?.textContent.trim() || "SELECTED LONG FORM";
            return {
                id: `longform-${index + 1}`,
                title,
                client: detail,
                category: "long-form",
                year: item.querySelector(".project-year")?.textContent.trim() || "2026",
                services: detail.split("/").map((value) => value.trim()).filter(Boolean),
                description: "A selected long-form edit built around story, rhythm and cinematic impact.",
                thumbnail: video?.poster || fallbackPoster,
                poster: video?.poster || fallbackPoster,
                video: video?.currentSrc || video?.getAttribute("src") || "",
                aspect: "horizontal"
            };
        });

        const getShortProjects = () => [...document.querySelectorAll(".short-orbit-item")].map((item, index) => {
            const video = item.querySelector("video");
            const title = item.querySelector(".short-card-label")?.textContent.trim() || `SHORT FORM ${index + 1}`;
            return {
                id: `short-${index + 1}`,
                title,
                client: "CROTI / VERTICAL EDIT",
                category: "short",
                year: "2026",
                services: ["SHORT FORM", "VERTICAL EDIT", "9:16"],
                description: "A vertical-first edit designed for pace, retention and social impact.",
                thumbnail: video?.poster || fallbackPoster,
                poster: video?.poster || fallbackPoster,
                video: video?.currentSrc || video?.getAttribute("src") || "",
                aspect: "vertical"
            };
        });

        const openCollection = (projects, index, trigger) => {
            if (!projects.length || !projects[index]?.video) return;
            document.dispatchEvent(new CustomEvent("croti:open-showcase-project", {
                detail: { projects, projectId: projects[index].id, trigger }
            }));
        };

        document.querySelectorAll(".project-item").forEach((item, index) => {
            const title = item.querySelector(".project-info strong")?.textContent.trim() || `Long Form ${index + 1}`;
            item.setAttribute("role", "button");
            item.setAttribute("tabindex", "0");
            item.setAttribute("aria-label", `Abrir vídeo ${title}`);

            const open = () => openCollection(getLongformProjects(), index, item);
            item.addEventListener("click", open);
            item.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                open();
            });
        });

        document.querySelectorAll(".short-form-card").forEach((card, index) => {
            const open = () => {
                if (card.dataset.front !== "true") return;
                openCollection(getShortProjects(), index, card);
            };
            card.setAttribute("role", "button");
            card.setAttribute("aria-label", `Abrir ${card.closest(".short-orbit-item")?.getAttribute("aria-label") || `Short Form ${index + 1}`}`);
            card.addEventListener("click", open);
            card.addEventListener("keydown", (event) => {
                if ((event.key !== "Enter" && event.key !== " ") || card.dataset.front !== "true") return;
                event.preventDefault();
                open();
            });
        });
    }

    initShowcasePlayerTriggers();

    // =========================================
    // 7. VIDEO CATALOG — FILTERS, PREVIEWS & MODAL
    // =========================================
    function initVideoCatalog() {
        const section = document.getElementById("video-catalog");
        const dataSource = window.CrotiCatalogData;
        if (!section || !dataSource) return;

        const filtersRoot = section.querySelector("#catalog-filters");
        const searchInput = section.querySelector("#catalog-search-input");
        const status = section.querySelector("#catalog-results-status");
        const grid = section.querySelector("#catalog-grid");
        const emptyState = section.querySelector("#catalog-empty");
        const clearButton = section.querySelector("#catalog-clear");
        const viewAllButton = section.querySelector("#catalog-view-all");
        const modal = document.getElementById("catalog-modal");
        const modalPanel = modal?.querySelector(".catalog-modal-panel");
        const modalClose = modal?.querySelector(".catalog-modal-close");
        const modalMedia = modal?.querySelector(".catalog-modal-media");
        const modalPoster = modal?.querySelector(".catalog-modal-poster");
        const modalVideo = modal?.querySelector(".catalog-modal-video");
        const modalTitle = modal?.querySelector("#catalog-modal-title");
        const modalCategory = modal?.querySelector(".catalog-modal-category");
        const modalClient = modal?.querySelector(".catalog-modal-client");
        const modalYear = modal?.querySelector(".catalog-modal-year");
        const modalServices = modal?.querySelector(".catalog-modal-services");
        const modalDescription = modal?.querySelector(".catalog-modal-description");
        const previousButton = modal?.querySelector("[data-catalog-prev]");
        const nextButton = modal?.querySelector("[data-catalog-next]");

        if (!filtersRoot || !searchInput || !status || !grid || !emptyState || !modal || !modalPanel) return;

        const localProjects = [...dataSource.projects];
        const cmsProjects = dataSource.fromCMS(publishedPortfolioVideos);
        const projects = cmsProjects.length ? cmsProjects : localProjects;
        const categories = [...dataSource.categories];
        const categoryLabels = new Map(categories.map((category) => [category.id, category.label]));
        const projectById = new Map(projects.map((project) => [String(project.id), project]));
        let activeCategory = "all";
        let searchTerm = "";
        let visibleProjects = [...projects];
        let modalProjects = [...visibleProjects];
        let activePreview = null;
        let activeModalProjectId = null;
        let previouslyFocused = null;
        let lockedScrollY = 0;
        let searchTimer = null;
        let modalClosing = false;

        const normalizeText = (value = "") => String(value)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase("pt-BR");

        const categoryCount = (categoryId) => categoryId === "all"
            ? projects.length
            : projects.filter((project) => project.category === categoryId).length;

        const renderFilters = () => {
            filtersRoot.innerHTML = categories.map((category) => `
                <button class="catalog-filter" type="button" data-category="${escapeHTML(category.id)}"
                    aria-pressed="${String(category.id === activeCategory)}">
                    <span data-i18n="cat_${escapeHTML(category.id)}">${escapeHTML(category.label)}</span>
                    <span class="catalog-filter-count">${String(categoryCount(category.id)).padStart(2, "0")}</span>
                </button>
            `).join("");

            filtersRoot.querySelectorAll(".catalog-filter").forEach((button) => {
                button.addEventListener("click", () => {
                    activeCategory = button.dataset.category || "all";
                    filtersRoot.querySelectorAll(".catalog-filter").forEach((filter) => {
                        filter.setAttribute("aria-pressed", String(filter === button));
                    });
                    renderGrid(true);
                });
            });
        };

        const projectMatchesSearch = (project) => {
            if (!searchTerm) return true;
            const searchable = [
                project.title,
                project.client,
                project.category,
                categoryLabels.get(project.category),
                project.description,
                ...(project.services || [])
            ].map(normalizeText).join(" ");
            return searchable.includes(searchTerm);
        };



        const cardTemplate = (project) => {
            const categoryLabel = categoryLabels.get(project.category) || project.category;
            const isVertical = project.aspect === "vertical" || project.category === "short-form";
            const poster = project.poster || project.posterUrl || project.thumbnail || "";
            return `
                <article class="catalog-project ${isVertical ? "is-vertical" : ""}">
                    <button class="catalog-card ${isVertical ? "is-vertical" : ""}" type="button" data-project-id="${escapeHTML(project.id)}"
                        aria-label="Abrir projeto ${escapeHTML(project.title)}">
                        <span class="catalog-card-media" style="--catalog-media-position: ${escapeHTML(project.mediaPosition || "50% 50%")} ">
                            <video class="catalog-card-video" data-src="${escapeHTML(project.videoUrl || project.video)}"
                                ${poster ? `poster="${escapeHTML(poster)}"` : ""}
                                loop muted playsinline disablepictureinpicture preload="none"></video>
                            <span class="catalog-card-overlay"><span>VIEW PROJECT ↗</span></span>
                        </span>
                        <span class="catalog-card-copy">
                            <span class="catalog-card-meta">
                                <span>${escapeHTML(categoryLabel)}</span>
                                <span>${escapeHTML(project.year)}</span>
                            </span>
                            <span class="catalog-card-title">${escapeHTML(project.title)}</span>
                            <span class="catalog-card-client">${escapeHTML(project.client || project.description)}</span>
                        </span>
                    </button>
                </article>
            `;
        };

        const bindCards = () => {
            grid.querySelectorAll(".catalog-card").forEach((card) => {
                card.addEventListener("click", () => openModal(card.dataset.projectId));
                const video = card.querySelector(".catalog-card-video");
                if (video) {
                    video.muted = true;
                    video.defaultMuted = true;
                    video.loop = true;
                    video.playsInline = true;
                    observeLazyVideo(video);
                    video.addEventListener("error", () => card.classList.add("has-media-error"));
                }
            });
        };

        function renderGrid(animate = false) {
            const nextProjects = projects.filter((project) => {
                const matchesCategory = activeCategory === "all" || project.category === activeCategory;
                return matchesCategory && projectMatchesSearch(project);
            }).sort((a, b) => {
                const aHoriz = a.aspect !== "vertical";
                const bHoriz = b.aspect !== "vertical";
                if (aHoriz && !bHoriz) return -1;
                if (!aHoriz && bHoriz) return 1;
                return 0;
            });

            visibleProjects = nextProjects;
            grid.innerHTML = nextProjects.map(cardTemplate).join("");
            grid.hidden = nextProjects.length === 0;
            emptyState.hidden = nextProjects.length !== 0;
            status.textContent = `${String(nextProjects.length).padStart(2, "0")} ${nextProjects.length === 1 ? "PROJECT" : "PROJECTS"}`;
            bindCards();

            if (animate && !reducedMotion && nextProjects.length) {
                gsap.fromTo(grid.children,
                    { opacity: 0, y: 22 },
                    { opacity: 1, y: 0, duration: 0.5, stagger: 0.045, ease: "power2.out", clearProps: "transform,opacity" }
                );
            }

            window.setTimeout(() => ScrollTrigger.refresh(), 80);
        }

        const populateModal = (project) => {
            if (!project) return;
            const categoryLabel = categoryLabels.get(project.category) || String(project.category || "SELECTED WORK").replaceAll("-", " ").toUpperCase();
            const services = Array.isArray(project.services) ? project.services : [project.services].filter(Boolean);
            activeModalProjectId = String(project.id);
            modalPanel.dataset.aspect = project.aspect || "horizontal";
            modalTitle.textContent = project.title;
            modalCategory.textContent = `${categoryLabel} / ${project.year || "2026"}`;
            modalClient.textContent = project.client || "CROTI / SELECTED WORK";
            modalYear.textContent = project.year || "2026";
            modalServices.textContent = services.join(" · ") || "EDIT · COLOR · MOTION";
            modalDescription.textContent = project.description || "Selected editing work from the Croti portfolio.";
            
            const customPoster = project.poster || project.thumbnail;
            if (customPoster) {
                if(modalPoster) {
                    modalPoster.src = customPoster;
                    modalPoster.style.display = "block";
                }
            } else {
                if(modalPoster) {
                    modalPoster.src = "";
                    modalPoster.style.display = "none";
                }
            }
            if(modalPoster) modalPoster.alt = `Poster de ${project.title}`;

            modalMedia.classList.remove("is-media-error");
            safeMediaPause(modalVideo);
            modalVideo.src = project.videoUrl || project.video;
            modalVideo.load();
            
            // Autoplay the video since we are inside a click event handler
            const playPromise = modalVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {});
            }
            
            const likeBtn = document.getElementById("catalog-modal-like");
            const likeCount = document.getElementById("catalog-modal-like-count");
            if (likeBtn) {
                const likedList = JSON.parse(localStorage.getItem("croti_liked_videos") || "[]");
                if (likedList.includes(String(project.id))) {
                    likeBtn.classList.add("liked");
                } else {
                    likeBtn.classList.remove("liked");
                }
            }
            if (likeCount) {
                likeCount.textContent = project.likes_count || 0;
            }

            const hasMultipleProjects = modalProjects.length > 1;
            previousButton.disabled = !hasMultipleProjects;
            nextButton.disabled = !hasMultipleProjects;
        };

        function openProjectModal(project, collection = visibleProjects, trigger = document.activeElement) {
            if (!project) return;
            modalProjects = collection.length ? [...collection] : [project];
            previouslyFocused = trigger || document.activeElement;
            lockedScrollY = window.scrollY;
            modalClosing = false;
            populateModal(project);
            modal.hidden = false;
            modal.setAttribute("aria-hidden", "false");
            modal.classList.add("is-open");
            document.body.classList.add("catalog-modal-open");

            if (reducedMotion) {
                gsap.set(modal, { opacity: 1 });
                gsap.set(modalPanel, { opacity: 1, scale: 1, y: 0 });
            } else {
                gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: "power2.out" });
                gsap.fromTo(modalPanel,
                    { opacity: 0, scale: 0.97, y: 18 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.46, ease: "power3.out" }
                );
            }

            window.requestAnimationFrame(() => modalClose.focus());
        }

        function openModal(projectId) {
            const project = projectById.get(String(projectId));
            openProjectModal(project, visibleProjects, document.activeElement);
        }

        const restorePageScroll = () => {
            const previousBehavior = document.documentElement.style.scrollBehavior;
            document.documentElement.style.scrollBehavior = "auto";
            window.scrollTo(0, lockedScrollY);
            document.documentElement.style.scrollBehavior = previousBehavior;
        };

        const closeModal = () => {
            if (modal.hidden || modalClosing) return;
            modalClosing = true;
            safeMediaPause(modalVideo);

            const finishClose = () => {
                modal.classList.remove("is-open");
                modal.setAttribute("aria-hidden", "true");
                modal.hidden = true;
                modalVideo.removeAttribute("src");
                modalVideo.load();
                document.body.classList.remove("catalog-modal-open");
                previouslyFocused?.focus?.({ preventScroll: true });
                restorePageScroll();
                
                // Track Video Retention
                if (window.CrotiCMS && window.CrotiCMS.isConfigured() && activeModalProjectId) {
                    if (modalVideo.duration > 0 && modalVideo.currentTime > 0) {
                        const pct = (modalVideo.currentTime / modalVideo.duration) * 100;
                        window.CrotiCMS.registerVideoView(activeModalProjectId, pct);
                    }
                }
                
                modalClosing = false;
            };

            if (reducedMotion) {
                gsap.set(modal, { opacity: 0 });
                finishClose();
            } else {
                gsap.to(modalPanel, { opacity: 0, scale: 0.985, duration: 0.22, ease: "power2.in" });
                gsap.to(modal, { opacity: 0, duration: 0.28, ease: "power2.in", onComplete: finishClose });
            }
        };

        const navigateModal = (direction) => {
            if (modalProjects.length < 2) return;
            const currentIndex = modalProjects.findIndex((project) => String(project.id) === activeModalProjectId);
            const nextIndex = (currentIndex + direction + modalProjects.length) % modalProjects.length;
            const nextProject = modalProjects[nextIndex];
            safeMediaPause(modalVideo);

            if (reducedMotion) {
                populateModal(nextProject);
                return;
            }

            const modalBlocks = [modalMedia, modalPanel.querySelector(".catalog-modal-content")];
            gsap.to(modalBlocks, {
                opacity: 0,
                y: direction > 0 ? -12 : 12,
                duration: 0.18,
                ease: "power2.in",
                onComplete: () => {
                    populateModal(nextProject);
                    gsap.fromTo(modalBlocks,
                        { opacity: 0, y: direction > 0 ? 12 : -12 },
                        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
                    );
                }
            });
        };

        renderFilters();
        renderGrid(false);

        searchInput.addEventListener("input", () => {
            window.clearTimeout(searchTimer);
            searchTimer = window.setTimeout(() => {
                searchTerm = normalizeText(searchInput.value.trim());
                renderGrid(true);
            }, 120);
        });

        const clearFilters = () => {
            activeCategory = "all";
            searchTerm = "";
            searchInput.value = "";
            renderFilters();
            renderGrid(true);
        };

        clearButton.addEventListener("click", clearFilters);
        viewAllButton.addEventListener("click", () => {
            clearFilters();
            grid.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        });

        modal.querySelectorAll("[data-catalog-close]").forEach((button) => button.addEventListener("click", closeModal));
        previousButton.addEventListener("click", () => navigateModal(-1));
        nextButton.addEventListener("click", () => navigateModal(1));
        modalVideo.addEventListener("error", () => modalMedia.classList.add("is-media-error"));
        modalVideo.addEventListener("loadeddata", () => {
            modalMedia.classList.remove("is-media-error");
            if (!modal.hidden) safeMediaPlay(modalVideo);
        });

        const handleKeydown = (e) => {
            if (modal.hidden) return;
            if (e.key === "Escape") closeModal();
            if (e.key === "ArrowLeft" && !previousButton.disabled) navigateModal(-1);
            if (e.key === "ArrowRight" && !nextButton.disabled) navigateModal(1);
        };
        document.addEventListener("keydown", handleKeydown);

        const likeBtn = document.getElementById("catalog-modal-like");
        if (likeBtn) {
            likeBtn.addEventListener("click", () => {
                if (!activeModalProjectId) return;
                const likedList = JSON.parse(localStorage.getItem("croti_liked_videos") || "[]");
                if (!likedList.includes(activeModalProjectId)) {
                    likedList.push(activeModalProjectId);
                    localStorage.setItem("croti_liked_videos", JSON.stringify(likedList));
                    likeBtn.classList.add("liked");
                    
                    if (window.CrotiCMS && window.CrotiCMS.isConfigured()) {
                        window.CrotiCMS.likeVideo(activeModalProjectId).catch(() => {});
                    }
                }
            });
        }

        modalClose.addEventListener("click", closeModal);

        document.addEventListener("croti:open-showcase-project", (event) => {
            const collection = Array.isArray(event.detail?.projects) ? event.detail.projects : [];
            const project = collection.find((item) => String(item.id) === String(event.detail?.projectId));
            openProjectModal(project, collection, event.detail?.trigger);
        });

        document.addEventListener("keydown", (event) => {
            if (modal.hidden) return;
            if (event.key === "Tab") {
                const focusable = [...modal.querySelectorAll("button:not([disabled]), video[controls]")]
                    .filter((element) => element.offsetParent !== null);
                if (!focusable.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });

        if (!reducedMotion) {
            gsap.fromTo(section.querySelector(".catalog-header"),
                { opacity: 0, y: 36 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.9,
                    ease: "power3.out",
                    scrollTrigger: { trigger: section, start: "top 78%", toggleActions: "play none none reverse" }
                }
            );
        }
    }

    initVideoCatalog();

    // =========================================
    // 8. FINAL FOOTER REVEAL & THEME SHIFT
    // =========================================

    // Theme Shift: Fades body background to neon green when reaching the footer
    gsap.to("body", {
        backgroundColor: "#ccff00",
        "--topo-dark-opacity": 0,
        "--topo-light-opacity": 0, // Hide global lines to keep neon pure
        ease: "none",
        scrollTrigger: {
            trigger: "#footer-section",
            start: "top 70%", // Starts transitioning as footer enters view
            end: "top 20%",
            scrub: true
        }
    });

    // Footer Marquee
    const footerTrack = document.querySelector(".footer-marquee-track");
    if (footerTrack) {
        gsap.to(footerTrack, {
            xPercent: -50,
            ease: "none",
            duration: 15,
            repeat: -1
        });
    }

    // Magnetic CTA Hover Effect
    const magneticBtn = document.querySelector(".magnetic-btn");
    if (magneticBtn) {
        magneticBtn.addEventListener("mousemove", (e) => {
            const rect = magneticBtn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Move button slightly towards mouse cursor (Magnetic effect)
            gsap.to(magneticBtn, {
                x: x * 0.4,
                y: y * 0.4,
                ease: "power2.out",
                duration: 0.3
            });
        });

        magneticBtn.addEventListener("mouseleave", () => {
            // Snap back to center
            gsap.to(magneticBtn, {
                x: 0,
                y: 0,
                ease: "elastic.out(1, 0.3)",
                duration: 1
            });
        });
    }

    // =========================================
    // 8. LEAD CAPTURE MODAL (Intent-based & Supabase Integration)
    // =========================================
    const modalOverlay = document.getElementById("lead-capture-overlay");
    const modalBox = document.querySelector(".capture-modal");
    const closeModalBtn = document.getElementById("close-modal");
    const openModalBtn = document.getElementById("open-lead-modal");
    const leadForm = document.getElementById("lead-form");
    const successMsg = document.getElementById("form-success-msg");

    if (modalOverlay && modalBox) {
        let previouslyFocused = null;
        // Create a dedicated GSAP timeline for the modal
        const modalTl = gsap.timeline({ paused: true });

        modalTl.to(modalOverlay, {
            opacity: 1,
            pointerEvents: "auto",
            duration: 0.5,
            ease: "power2.out"
        }).to(modalBox, {
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 0.8,
            ease: "power4.out"
        }, "-=0.3"); // Overlap slightly for smoothness

        function openModal() {
            previouslyFocused = document.activeElement;
            modalOverlay.setAttribute("aria-hidden", "false");
            modalTl.play(0);
            window.setTimeout(() => document.getElementById("lead-name")?.focus(), 250);
        }

        function closeModal() {
            modalOverlay.setAttribute("aria-hidden", "true");
            modalTl.reverse();
            previouslyFocused?.focus?.();
        }

        openModalBtn?.addEventListener("click", (event) => {
            event.preventDefault();
            openModal();
        });

        if (closeModalBtn) {
            closeModalBtn.addEventListener("click", closeModal);
        }

        // Close when clicking outside the modal box
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && modalOverlay.getAttribute("aria-hidden") === "false") {
                closeModal();
            }
        });

        // Form Submission Logic
        if (leadForm) {
            leadForm.addEventListener("submit", async (e) => {
                e.preventDefault();

                const name = document.getElementById("lead-name").value;
                const whatsapp = document.getElementById("lead-whatsapp").value;
                const email = document.getElementById("lead-email").value;

                // Show button loading state
                const submitBtn = leadForm.querySelector('.submit-btn');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = "SENDING...";
                submitBtn.style.opacity = "0.7";

                successMsg.style.display = "none";

                try {
                    await window.CrotiCMS.submitLead({ name, whatsapp, email });
                    submitBtn.style.display = "none";
                    successMsg.textContent = "Recebi seus dados. Entrarei em contato em breve.";
                    successMsg.style.display = "block";
                    leadForm.reset();
                    setTimeout(closeModal, 2200);
                } catch (error) {
                    successMsg.textContent = error.message || "Não foi possível enviar. Tente novamente.";
                    successMsg.style.color = "#ff8a84";
                    successMsg.style.display = "block";
                    submitBtn.textContent = originalText;
                    submitBtn.style.opacity = "1";
                }
            });
        }
    }

    // =========================================
    // 9. VSL SHOWCASE SECTION
    // =========================================
    const vslSection = document.getElementById("vsl-section");
    const vslContainer = document.querySelector(".vsl-container");
    const vslVideo = document.getElementById("vsl-video");
    const vslPlayBtn = document.getElementById("vsl-play-btn");
    const vslIntroCta = document.getElementById("vsl-intro-cta");

    if (vslSection && vslContainer && vslVideo && vslPlayBtn) {
        // Scroll Animation (The Cinematic Focus)
        gsap.fromTo(vslContainer,
            { scale: 0.85, y: 50 },
            {
                scale: 1,
                y: 0,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: vslSection,
                    start: "top bottom", // Triggers when section top hits viewport bottom
                    end: "center center", // Reaches full scale exactly at screen center
                    scrub: reducedMotion ? false : 0.75
                }
            }
        );

        const playVsl = async () => {
            vslContainer.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });

            if (vslVideo.paused) {
                try {
                    await vslVideo.play();
                    vslContainer.classList.add("is-playing");
                } catch {
                    vslContainer.classList.remove("is-playing");
                }
            }
        };

        // Video Play Logic
        vslPlayBtn.addEventListener("click", playVsl);
        vslIntroCta?.addEventListener("click", playVsl);

        // Pause video if clicked anywhere on the container while playing
        vslContainer.addEventListener("click", (e) => {
            if (e.target !== vslPlayBtn && !vslVideo.paused) {
                safeMediaPause(vslVideo);
                vslContainer.classList.remove("is-playing");
            }
        });
    }

    // Analytics & Global Settings (WA & Pixel)
    if (window.CrotiCMS && window.CrotiCMS.isConfigured()) {
        // Page Views
        window.CrotiCMS.registerPageView(window.location.pathname);

        // Fetch Settings
        Promise.all([
            window.CrotiCMS.getSetting("facebook_pixel_id"),
            window.CrotiCMS.getSetting("whatsapp_number")
        ]).then(([pixelId, wa]) => {
            // Facebook Pixel
            if (pixelId) {
                !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
                n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
                document,'script','https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', pixelId);
                fbq('track', 'PageView');
            }

            // WhatsApp Links
            const waNumber = wa || "5511999999999"; // Fallback to a placeholder if none is set
            const waLink = `https://wa.me/${waNumber.replace(/\D/g, '')}`;
            
            document.querySelectorAll("[data-wa-link]").forEach(el => {
                el.href = waLink;
                el.addEventListener("click", () => {
                    window.CrotiCMS.registerClick(el.textContent.trim() || el.ariaLabel || "WhatsApp Button");
                });
            });
        });
    }

    // Resize Listener
    let refreshTimer;
    window.addEventListener('resize', () => {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 160);
    });
});
