"use strict";

document.addEventListener("DOMContentLoaded", async function () {
    async function loadInclude(element) {
        const source = element.dataset.include;

        if (!source) {
            return;
        }

        try {
            const response = await fetch(source, { cache: "no-store" });

            if (!response.ok) {
                throw new Error("Unable to load " + source + ": HTTP " + response.status);
            }

            element.innerHTML = await response.text();

            const nestedIncludes = element.querySelectorAll("[data-include]");

            for (const nestedInclude of nestedIncludes) {
                await loadInclude(nestedInclude);
            }
        } catch (error) {
            console.error(error);
            element.innerHTML = '<div class="notice danger"><strong>Shared page component unavailable</strong><p>Unable to load <code>' + source + "</code>.</p></div>";
        }
    }

    const includes = document.querySelectorAll("[data-include]");

    for (const include of includes) {
        await loadInclude(include);
    }

    const currentPath = window.location.pathname.replace(/\/index\.html$/, "/");

    document.querySelectorAll(".primary-nav a, .site-footer a").forEach(function (link) {
        const linkPath = new URL(link.href, window.location.origin).pathname.replace(/\/index\.html$/, "/");

        if (linkPath === currentPath) {
            link.setAttribute("aria-current", "page");
        }
    });

    const navToggle = document.querySelector(".nav-toggle");
    const primaryNav = document.getElementById("primary-nav");

    if (navToggle && primaryNav) {
        navToggle.addEventListener("click", function () {
            const expanded = navToggle.getAttribute("aria-expanded") === "true";
            navToggle.setAttribute("aria-expanded", String(!expanded));
            primaryNav.classList.toggle("is-open", !expanded);
        });
    }

    document.querySelectorAll("[data-current-year]").forEach(function (element) {
        element.textContent = String(new Date().getFullYear());
    });
});
