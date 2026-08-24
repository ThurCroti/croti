(function () {
    const categories = [
        { id: "all", label: "ALL" },
        { id: "short-form", label: "SHORT FORM" },
        { id: "long-form", label: "LONG FORM" },
        { id: "vsl", label: "VSL" },
        { id: "commercial", label: "COMMERCIAL" },
        { id: "motion", label: "MOTION" }
    ];

    // Local placeholders. Replace or extend these objects without changing the interface.
    const projects = [
        {
            id: "editorial-cut-01",
            slug: "editorial-cut-01",
            title: "EDITORIAL CUT 01",
            client: "CROTI / SELECTED WORK",
            category: "short-form",
            year: "2026",
            thumbnail: "./assets/img/croti-portrait.jpg",
            video: "./assets/video/hero-reveal-loop-web.mp4",
            poster: "./assets/img/croti-portrait.jpg",
            description: "Vertical edit built around pace, presence and sharp visual rhythm.",
            services: ["Editing", "Color", "Sound Design"],
            featured: true,
            aspect: "vertical",
            mediaPosition: "50% 42%"
        },
        {
            id: "brand-film-02",
            slug: "brand-film-02",
            title: "BRAND FILM 02",
            client: "CROTI / SELECTED WORK",
            category: "long-form",
            year: "2026",
            thumbnail: "./assets/img/hero-base-office.png",
            video: "./assets/video/hero-reveal-loop-web.mp4",
            poster: "./assets/img/hero-base-office.png",
            description: "A cinematic long-form piece focused on narrative and visual continuity.",
            services: ["Editing", "Storytelling", "Color"],
            featured: true,
            aspect: "horizontal",
            mediaPosition: "50% 50%"
        },
        {
            id: "conversion-story-03",
            slug: "conversion-story-03",
            title: "CONVERSION STORY 03",
            client: "CROTI / SELECTED WORK",
            category: "vsl",
            year: "2026",
            thumbnail: "./assets/img/hero-base-office.png",
            video: "./assets/video/hero-reveal-loop-web.mp4",
            poster: "./assets/img/hero-base-office.png",
            description: "Direct-response storytelling with clear pacing and an intentional visual hierarchy.",
            services: ["Editing", "Motion Design", "Sound Design"],
            featured: true,
            aspect: "horizontal",
            mediaPosition: "62% 50%"
        },
        {
            id: "commercial-rhythm-04",
            slug: "commercial-rhythm-04",
            title: "COMMERCIAL RHYTHM 04",
            client: "CROTI / SELECTED WORK",
            category: "commercial",
            year: "2026",
            thumbnail: "./assets/img/croti-portrait.jpg",
            video: "./assets/video/hero-reveal-loop-web.mp4",
            poster: "./assets/img/croti-portrait.jpg",
            description: "Commercial edit balancing product clarity with an energetic premium finish.",
            services: ["Editing", "Commercial Design", "Color"],
            featured: true,
            aspect: "square",
            mediaPosition: "50% 34%"
        },
        {
            id: "motion-study-05",
            slug: "motion-study-05",
            title: "MOTION STUDY 05",
            client: "CROTI / SELECTED WORK",
            category: "motion",
            year: "2026",
            thumbnail: "./assets/img/hero-base-office.png",
            video: "./assets/video/hero-reveal-loop-web.mp4",
            poster: "./assets/img/hero-base-office.png",
            description: "A graphic motion study connecting type, transitions and editorial timing.",
            services: ["Motion Design", "Typography", "Compositing"],
            featured: true,
            aspect: "square",
            mediaPosition: "35% 50%"
        },
        {
            id: "social-pulse-06",
            slug: "social-pulse-06",
            title: "SOCIAL PULSE 06",
            client: "CROTI / SELECTED WORK",
            category: "short-form",
            year: "2026",
            thumbnail: "./assets/img/croti-portrait.jpg",
            video: "./assets/video/hero-reveal-loop-web.mp4",
            poster: "./assets/img/croti-portrait.jpg",
            description: "Short-form storytelling designed for fast comprehension and strong retention.",
            services: ["Editing", "Captions", "Sound Design"],
            featured: true,
            aspect: "vertical",
            mediaPosition: "50% 55%"
        },
        {
            id: "studio-profile-07",
            slug: "studio-profile-07",
            title: "STUDIO PROFILE 07",
            client: "CROTI / SELECTED WORK",
            category: "long-form",
            year: "2026",
            thumbnail: "./assets/img/hero-base-office.png",
            video: "./assets/video/hero-reveal-loop-web.mp4",
            poster: "./assets/img/hero-base-office.png",
            description: "A longer editorial profile shaped through controlled pacing and atmosphere.",
            services: ["Editing", "Storytelling", "Sound Design"],
            featured: true,
            aspect: "horizontal",
            mediaPosition: "48% 50%"
        },
        {
            id: "campaign-frame-08",
            slug: "campaign-frame-08",
            title: "CAMPAIGN FRAME 08",
            client: "CROTI / SELECTED WORK",
            category: "commercial",
            year: "2026",
            thumbnail: "./assets/img/croti-portrait.jpg",
            video: "./assets/video/hero-reveal-loop-web.mp4",
            poster: "./assets/img/croti-portrait.jpg",
            description: "A campaign cut combining cinematic portraiture and concise brand communication.",
            services: ["Editing", "Commercial Design", "Color"],
            featured: true,
            aspect: "vertical",
            mediaPosition: "50% 30%"
        }
    ];

    const categoryAliases = {
        featured: "long-form",
        "long-form": "long-form",
        short: "short-form",
        "short-form": "short-form",
        vsl: "vsl",
        commercial: "commercial",
        motion: "motion"
    };

    const aspectByCategory = {
        "short-form": "vertical",
        "long-form": "horizontal",
        vsl: "horizontal",
        commercial: "square",
        motion: "square"
    };

    const servicesByCategory = {
        "short-form": ["Editing", "Captions", "Sound Design"],
        "long-form": ["Editing", "Storytelling", "Color"],
        vsl: ["Editing", "Motion Design", "Sound Design"],
        commercial: ["Editing", "Commercial Design", "Color"],
        motion: ["Motion Design", "Typography", "Compositing"]
    };

    const slugify = (value = "project") => String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    function fromCMS(videos = []) {
        return videos.map((video, index) => {
            const category = categoryAliases[video.category] || "commercial";
            const year = video.created_at ? String(new Date(video.created_at).getFullYear()) : "2026";
            const poster = video.posterUrl || "./assets/img/hero-base-office.png";

            return {
                id: `cms-${video.id}`,
                slug: slugify(video.title || `project-${index + 1}`),
                title: video.title || `PROJECT ${String(index + 1).padStart(2, "0")}`,
                client: video.client || "CROTI / SELECTED WORK",
                category,
                year,
                thumbnail: poster,
                video: video.videoUrl,
                poster,
                description: video.description || "Selected editing work from the Croti portfolio.",
                services: servicesByCategory[category],
                featured: true,
                aspect: aspectByCategory[category],
                mediaPosition: `${38 + (index % 3) * 12}% 50%`
            };
        });
    }

    window.CrotiCatalogData = Object.freeze({
        categories: Object.freeze(categories),
        projects: Object.freeze(projects),
        fromCMS
    });
})();
