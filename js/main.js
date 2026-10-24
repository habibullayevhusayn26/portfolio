const menuButton = document.querySelector(".menu-toggle");
        const navLinks = document.querySelector(".nav-links");

        menuButton.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("open");
            menuButton.setAttribute("aria-expanded", String(isOpen));
            menuButton.setAttribute("aria-label", isOpen ? "Menyuni yopish" : "Menyuni ochish");
        });

        navLinks.addEventListener("click", (event) => {
            if (event.target.closest("a")) {
                navLinks.classList.remove("open");
                menuButton.setAttribute("aria-expanded", "false");
                menuButton.setAttribute("aria-label", "Menyuni ochish");
            }
        });

        const projects = document.querySelectorAll(".project[data-project]");
        const projectImages = document.querySelectorAll(".project-image[data-project-image]");

        const activateProject = (projectId) => {
            projects.forEach((project) => {
                project.classList.toggle("is-active", project.dataset.project === projectId);
            });
            projectImages.forEach((image) => {
                const isActive = image.dataset.projectImage === projectId;
                image.classList.toggle("is-active", isActive);
                image.setAttribute("aria-hidden", String(!isActive));
            });
        };

        const projectObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    activateProject(entry.target.dataset.project);
                }
            });
        }, { rootMargin: "-45% 0px -45% 0px" });

        projects.forEach((project) => projectObserver.observe(project));

        document.querySelector("#year").textContent = new Date().getFullYear();
