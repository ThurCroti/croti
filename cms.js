(function () {
    const config = window.CROTI_SUPABASE || {};
    let client = null;

    function isConfigured() {
        return Boolean(
            window.supabase &&
            config.url &&
            config.anonKey &&
            !config.url.includes("YOUR_") &&
            !config.anonKey.includes("YOUR_")
        );
    }

    function getClient() {
        if (!isConfigured()) return null;
        if (!client) {
            client = window.supabase.createClient(config.url, config.anonKey, {
                auth: { persistSession: true, autoRefreshToken: true }
            });
        }
        return client;
    }

    function getPublicUrl(path) {
        if (!path) return "";
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        const supabaseClient = getClient();
        if (!supabaseClient) return "";
        return supabaseClient.storage.from("portfolio-media").getPublicUrl(path).data.publicUrl;
    }

    async function listPublished() {
        const supabaseClient = getClient();
        if (!supabaseClient) return [];

        const { data, error } = await supabaseClient
            .from("portfolio_videos")
            .select("id,title,client,category,description,year,services,aspect,media_position,video_path,poster_path,sort_order,created_at")
            .eq("published", true)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });

        if (error) throw error;
        return (data || []).map((item) => ({
            ...item,
            mediaPosition: item.media_position || "50% 50%",
            videoUrl: getPublicUrl(item.video_path),
            posterUrl: getPublicUrl(item.poster_path)
        }));
    }

    async function listPublishedClients() {
        const supabaseClient = getClient();
        if (!supabaseClient) return [];

        const { data, error } = await supabaseClient
            .from("portfolio_clients")
            .select("id,name,platform,instagram_url,instagram_handle,followers_count,profile_path,sort_order,verified,created_at")
            .eq("published", true)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });

        if (error) throw error;
        return (data || []).map((item) => ({
            id: item.id,
            name: item.name,
            platform: item.platform || "instagram",
            profileUrl: item.instagram_url,
            username: item.instagram_handle,
            followersCount: Number(item.followers_count) || 0,
            profileImageUrl: getPublicUrl(item.profile_path),
            verified: item.verified !== false
        }));
    }

    async function submitLead(payload) {
        const supabaseClient = getClient();
        if (!supabaseClient) {
            throw new Error("O formulário ainda não foi conectado ao Supabase.");
        }

        const { error } = await supabaseClient.from("leads").insert({
            name: payload.name.trim(),
            whatsapp: payload.whatsapp.trim(),
            email: payload.email.trim(),
            source: "portfolio"
        });

        if (error) throw error;
    }

    async function listPublishedTestimonials() {
        const supabaseClient = getClient();
        if (!supabaseClient) return [];

        const { data, error } = await supabaseClient
            .from("portfolio_testimonials")
            .select("id,quote,name,role,profile_path,sort_order,created_at")
            .eq("published", true)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });

        if (error) throw error;
        return (data || []).map((item) => ({
            id: item.id,
            quote: item.quote,
            name: item.name,
            role: item.role,
            profileImageUrl: getPublicUrl(item.profile_path)
        }));
    }

    async function registerPageView(path) {
        const supabaseClient = getClient();
        if (!supabaseClient) return;
        supabaseClient.from("analytics_page_views").insert({ path }).then();
    }

    async function registerClick(buttonName) {
        const supabaseClient = getClient();
        if (!supabaseClient) return;
        supabaseClient.from("analytics_clicks").insert({ button_name: buttonName }).then();
    }

    async function registerVideoView(videoId, percentage) {
        const supabaseClient = getClient();
        if (!supabaseClient) return;
        supabaseClient.from("analytics_video_views").insert({ video_id: videoId, watch_percentage: Math.round(percentage) }).then();
    }

    async function likeVideo(videoId) {
        const supabaseClient = getClient();
        if (!supabaseClient) return;
        const { error } = await supabaseClient.rpc("increment_video_likes", { p_video_id: videoId });
        if (error) throw error;
    }

    async function getSetting(key) {
        const supabaseClient = getClient();
        if (!supabaseClient) return null;
        const { data } = await supabaseClient.from("site_settings").select("value").eq("key", key).maybeSingle();
        return data ? data.value : null;
    }

    window.CrotiCMS = {
        isConfigured,
        getClient,
        getPublicUrl,
        listPublished,
        listPublishedClients,
        listPublishedTestimonials,
        submitLead,
        registerPageView,
        registerClick,
        registerVideoView,
        likeVideo,
        getSetting
    };
})();
