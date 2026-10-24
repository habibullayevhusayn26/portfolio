import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

const grid = document.querySelector("#works-grid");
const status = document.querySelector("#works-status");
const imageBucket = "portfolio-images";

if (!isSupabaseConfigured) {
    status.textContent = "Ishlar sahifasini yoqish uchun Supabase sozlamalarini kiriting. Qo‘llanma: SUPABASE_SETUP.md";
} else {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const loadWorks = async () => {
        status.textContent = "Ishlar yuklanmoqda…";
        const { data, error } = await supabase
            .from("portfolio_works")
            .select("id, title, service, description, image_path")
            .eq("is_published", true)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        grid.replaceChildren();
        if (data.length === 0) {
            const empty = document.createElement("p");
            empty.className = "works-empty";
            empty.textContent = "Hozircha ishlar joylanmagan. Yangi ishlarim tez orada shu sahifada bo‘ladi.";
            grid.append(empty);
            status.textContent = "";
            return;
        }

        data.forEach((work) => {
            const card = document.createElement("article");
            card.className = "work-card";

            const imageFrame = document.createElement("div");
            imageFrame.className = "work-card-image";
            const image = document.createElement("img");
            image.src = supabase.storage.from(imageBucket).getPublicUrl(work.image_path).data.publicUrl;
            image.alt = work.title;
            image.loading = "lazy";
            imageFrame.append(image);

            const content = document.createElement("div");
            content.className = "work-card-content";
            const service = document.createElement("span");
            service.className = "work-card-service mono";
            service.textContent = work.service;
            const title = document.createElement("h2");
            title.textContent = work.title;
            const description = document.createElement("p");
            description.textContent = work.description;
            content.append(service, title, description);
            card.append(imageFrame, content);
            grid.append(card);
        });

        status.textContent = `${data.length} ta ish`;
    };

    loadWorks().catch((error) => {
        status.textContent = `Ishlarni yuklab bo‘lmadi: ${error.message}`;
        status.dataset.kind = "error";
    });
}
