import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ADMIN_EMAIL, isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

const status = document.querySelector("#admin-status");
const loginPanel = document.querySelector("#login-panel");
const loginSetupNotice = document.querySelector("#login-setup-notice");
const loginForm = document.querySelector("#login-form");
const workspace = document.querySelector("#admin-workspace");
const workForm = document.querySelector("#work-form");
const formHeading = document.querySelector("#form-heading");
const workList = document.querySelector("#admin-list");
const newWorkButton = document.querySelector("#new-work-button");
const cancelEditButton = document.querySelector("#cancel-edit-button");
const logoutButton = document.querySelector("#logout-button");
const imageBucket = "portfolio-images";
const maxImageSize = 8 * 1024 * 1024;

const setStatus = (message, kind = "") => {
    status.textContent = message;
    status.dataset.kind = kind;
};

if (!isSupabaseConfigured) {
    loginPanel.hidden = false;
    loginSetupNotice.hidden = false;
    loginForm.querySelector('button[type="submit"]').disabled = true;
    setStatus("Admin login formasidan foydalanish uchun Supabase sozlamalarini kiriting.", "error");
} else {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    let works = [];

    const showSession = async (session) => {
        if (!session) {
            loginPanel.hidden = false;
            workspace.hidden = true;
            return;
        }

        if (session.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            await supabase.auth.signOut();
            loginPanel.hidden = false;
            workspace.hidden = true;
            setStatus("Bu hisob admin sifatida ruxsat etilmagan.", "error");
            return;
        }

        loginPanel.hidden = true;
        workspace.hidden = false;
        setStatus(`Tizimga kirdingiz: ${session.user.email}`, "success");
        await loadWorks();
    };

    const getImageUrl = (path) => supabase.storage.from(imageBucket).getPublicUrl(path).data.publicUrl;

    const renderWorks = () => {
        workList.replaceChildren();
        if (works.length === 0) {
            const empty = document.createElement("p");
            empty.className = "admin-list-empty";
            empty.textContent = "Hozircha ish yo‘q. “Yangi ish” tugmasi orqali birinchi ishingizni qo‘shing.";
            workList.append(empty);
            return;
        }

        works.forEach((work) => {
            const card = document.createElement("article");
            card.className = "admin-work-card";
            const image = document.createElement("img");
            image.src = getImageUrl(work.image_path);
            image.alt = work.title;
            image.loading = "lazy";

            const details = document.createElement("div");
            const title = document.createElement("h3");
            title.textContent = work.title;
            const description = document.createElement("p");
            description.textContent = work.description;
            const meta = document.createElement("div");
            meta.className = "admin-work-meta mono";
            const service = document.createElement("span");
            service.textContent = work.service;
            const visibility = document.createElement("span");
            visibility.textContent = work.is_published ? "Saytda ko‘rinadi" : "Qoralama";
            meta.append(service, visibility);
            details.append(title, description, meta);

            const actions = document.createElement("div");
            actions.className = "admin-work-actions";
            const editButton = document.createElement("button");
            editButton.className = "admin-button";
            editButton.type = "button";
            editButton.dataset.action = "edit";
            editButton.dataset.id = work.id;
            editButton.textContent = "Tahrirlash";
            const deleteButton = document.createElement("button");
            deleteButton.className = "admin-button admin-button-quiet";
            deleteButton.type = "button";
            deleteButton.dataset.action = "delete";
            deleteButton.dataset.id = work.id;
            deleteButton.textContent = "O‘chirish";
            actions.append(editButton, deleteButton);

            card.append(image, details, actions);
            workList.append(card);
        });
    };

    const loadWorks = async () => {
        const { data, error } = await supabase
            .from("portfolio_works")
            .select("id, title, service, description, image_path, sort_order, is_published, created_at")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        works = data;
        renderWorks();
    };

    const resetWorkForm = () => {
        workForm.reset();
        workForm.elements.id.value = "";
        workForm.elements.sort_order.value = "0";
        workForm.elements.is_published.checked = true;
        workForm.hidden = true;
        formHeading.textContent = "Yangi ish qo‘shish";
    };

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = loginForm.querySelector('button[type="submit"]');
        button.disabled = true;
        setStatus("Tekshirilmoqda…");
        const formData = new FormData(loginForm);
        let data;
        let error;
        try {
            ({ data, error } = await supabase.auth.signInWithPassword({
                email: formData.get("email"),
                password: formData.get("password")
            }));
        } catch (requestError) {
            button.disabled = false;
            setStatus(`Kirish so‘rovi bajarilmadi: ${requestError.message}`, "error");
            return;
        }
        button.disabled = false;

        if (error) {
            setStatus(`Kirish amalga oshmadi: ${error.message}`, "error");
            return;
        }

        loginForm.reset();
        setStatus(`Kirish muvaffaqiyatli: ${data.user.email}. Admin panel yuklanmoqda…`, "success");
    });

    newWorkButton.addEventListener("click", () => {
        resetWorkForm();
        workForm.hidden = false;
        workForm.scrollIntoView({ behavior: "smooth", block: "center" });
        workForm.elements.title.focus();
    });

    cancelEditButton.addEventListener("click", resetWorkForm);

    workForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitButton = workForm.querySelector('button[type="submit"]');
        const formData = new FormData(workForm);
        const id = formData.get("id");
        const current = works.find((work) => work.id === id);
        const image = formData.get("image");

        if (!current && (!(image instanceof File) || image.size === 0)) {
            setStatus("Yangi ishga rasm tanlang.", "error");
            return;
        }
        if (image instanceof File && image.size > 0 && (!image.type.startsWith("image/") || image.size > maxImageSize)) {
            setStatus("Rasm formati noto‘g‘ri yoki fayl 8 MB dan katta.", "error");
            return;
        }

        submitButton.disabled = true;
        setStatus("Saqlanmoqda…");
        let uploadedPath = "";
        let recordSaved = false;

        try {
            let imagePath = current?.image_path ?? "";
            if (image instanceof File && image.size > 0) {
                const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "-");
                uploadedPath = `works/${crypto.randomUUID()}-${safeName}`;
                const { error: uploadError } = await supabase.storage
                    .from(imageBucket)
                    .upload(uploadedPath, image, { cacheControl: "3600", contentType: image.type, upsert: false });
                if (uploadError) {
                    throw uploadError;
                }
                imagePath = uploadedPath;
            }

            const record = {
                title: String(formData.get("title")).trim(),
                service: String(formData.get("service")),
                description: String(formData.get("description")).trim(),
                image_path: imagePath,
                sort_order: Number(formData.get("sort_order")) || 0,
                is_published: formData.get("is_published") === "on",
                updated_at: new Date().toISOString()
            };

            const result = current
                ? await supabase.from("portfolio_works").update(record).eq("id", id)
                : await supabase.from("portfolio_works").insert(record);
            if (result.error) {
                throw result.error;
            }
            recordSaved = true;

            let imageCleanupMessage = "";
            if (current && uploadedPath && current.image_path) {
                try {
                    const { error: cleanupError } = await supabase.storage.from(imageBucket).remove([current.image_path]);
                    if (cleanupError) {
                        imageCleanupMessage = ` Ish saqlandi, ammo eski rasmni o‘chirib bo‘lmadi: ${cleanupError.message}`;
                    }
                } catch (cleanupError) {
                    imageCleanupMessage = ` Ish saqlandi, ammo eski rasmni o‘chirishda xatolik yuz berdi: ${cleanupError.message}`;
                }
            }

            resetWorkForm();
            try {
                await loadWorks();
            } catch (refreshError) {
                setStatus(`Ish saqlandi, lekin ro‘yxatni yangilab bo‘lmadi: ${refreshError.message}`, "error");
                return;
            }
            setStatus(imageCleanupMessage || "Ish muvaffaqiyatli saqlandi.", imageCleanupMessage ? "error" : "success");
        } catch (error) {
            if (uploadedPath && !recordSaved) {
                let cleanupError;
                try {
                    ({ error: cleanupError } = await supabase.storage.from(imageBucket).remove([uploadedPath]));
                } catch (removeError) {
                    cleanupError = removeError;
                }
                if (cleanupError) {
                    setStatus(`Saqlash amalga oshmadi: ${error.message}. Yuklangan rasmni tozalash ham amalga oshmadi: ${cleanupError.message}`, "error");
                    submitButton.disabled = false;
                    return;
                }
            }
            setStatus(`Saqlash amalga oshmadi: ${error.message}`, "error");
        } finally {
            submitButton.disabled = false;
        }
    });

    workList.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }

        const work = works.find((item) => item.id === button.dataset.id);
        if (!work) {
            setStatus("Tanlangan ish topilmadi. Ro‘yxatni yangilang.", "error");
            return;
        }

        if (button.dataset.action === "edit") {
            workForm.elements.id.value = work.id;
            workForm.elements.title.value = work.title;
            workForm.elements.service.value = work.service;
            workForm.elements.description.value = work.description;
            workForm.elements.sort_order.value = String(work.sort_order);
            workForm.elements.is_published.checked = work.is_published;
            workForm.hidden = false;
            formHeading.textContent = "Ishni tahrirlash";
            workForm.scrollIntoView({ behavior: "smooth", block: "center" });
            workForm.elements.title.focus();
            return;
        }

        if (button.dataset.action === "delete" && window.confirm(`“${work.title}” ishini o‘chirmoqchimisiz?`)) {
            button.disabled = true;
            setStatus("O‘chirilmoqda…");
            let error;
            try {
                ({ error } = await supabase.from("portfolio_works").delete().eq("id", work.id));
            } catch (deleteError) {
                button.disabled = false;
                setStatus(`Ishni o‘chirish so‘rovi bajarilmadi: ${deleteError.message}`, "error");
                return;
            }
            if (error) {
                button.disabled = false;
                setStatus(`Ishni o‘chirib bo‘lmadi: ${error.message}`, "error");
                return;
            }

            let imageError;
            try {
                ({ error: imageError } = await supabase.storage.from(imageBucket).remove([work.image_path]));
            } catch (cleanupError) {
                imageError = cleanupError;
            }
            try {
                await loadWorks();
            } catch (refreshError) {
                setStatus(`Ish o‘chirildi, ammo ro‘yxatni yangilab bo‘lmadi: ${refreshError.message}`, "error");
                return;
            }
            if (imageError) {
                setStatus(`Ish o‘chirildi, lekin rasmni saqlash omboridan o‘chirib bo‘lmadi: ${imageError.message}`, "error");
                return;
            }
            setStatus("Ish o‘chirildi.", "success");
        }
    });

    logoutButton.addEventListener("click", async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            setStatus(`Tizimdan chiqib bo‘lmadi: ${error.message}`, "error");
            return;
        }
        loginPanel.hidden = false;
        workspace.hidden = true;
        resetWorkForm();
        setStatus("Tizimdan chiqdingiz.");
    });

    setStatus("Kirish holati tekshirilmoqda…");
    supabase.auth.onAuthStateChange((_event, session) => {
        window.setTimeout(() => {
            showSession(session).catch((error) => {
                setStatus(`Admin panelni ochib bo‘lmadi: ${error.message}`, "error");
            });
        }, 0);
    });
}
