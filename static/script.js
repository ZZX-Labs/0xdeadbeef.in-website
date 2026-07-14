"use strict";

/**
 * 0xdeadbeef.in
 * Shared client-side behavior
 *
 * Responsibilities:
 * - Mobile navigation
 * - Landing-page audio controls
 * - Portfolio and project filtering
 * - Search filtering
 * - Copy-to-clipboard buttons
 * - Current-year rendering
 * - External-link hardening
 *
 * The site remains fully navigable without JavaScript.
 */

document.addEventListener("DOMContentLoaded", () => {
    initializeMobileNavigation();
    initializeAudioControls();
    initializeFilters();
    initializeSearch();
    initializeCopyButtons();
    initializeCurrentYear();
    hardenExternalLinks();
});

/* ==========================================================================
   Mobile Navigation
   ========================================================================== */

/**
 * Enables the responsive navigation menu.
 */
function initializeMobileNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const navigation = document.getElementById("primary-nav");

    if (!toggle || !navigation) {
        return;
    }

    const closeNavigation = () => {
        navigation.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
    };

    const openNavigation = () => {
        navigation.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        document.body.classList.add("nav-open");
    };

    toggle.addEventListener("click", () => {
        const isOpen = toggle.getAttribute("aria-expanded") === "true";

        if (isOpen) {
            closeNavigation();
        } else {
            openNavigation();
        }
    });

    navigation.addEventListener("click", (event) => {
        const link = event.target.closest("a");

        if (link) {
            closeNavigation();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeNavigation();
            toggle.focus();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            closeNavigation();
        }
    });
}

/* ==========================================================================
   Landing-Page Audio
   ========================================================================== */

/**
 * Creates explicit user-controlled audio behavior.
 *
 * Modern browsers generally block audible autoplay. Audio therefore begins
 * only after the visitor activates the control.
 */
function initializeAudioControls() {
    const audio = document.getElementById("background-audio");
    const toggle = document.getElementById("audio-toggle");
    const volume = document.getElementById("audio-volume");
    const status = document.getElementById("audio-status");

    if (!audio || !toggle) {
        return;
    }

    const defaultVolume = 0.35;

    audio.volume = defaultVolume;
    audio.muted = false;

    if (volume) {
        const parsedVolume = Number.parseFloat(volume.value);

        if (Number.isFinite(parsedVolume)) {
            audio.volume = clamp(parsedVolume, 0, 1);
        }
    }

    const updateAudioInterface = () => {
        const isPlaying = !audio.paused;

        toggle.setAttribute("aria-pressed", String(isPlaying));
        toggle.textContent = isPlaying ? "Disable Audio" : "Enable Audio";

        if (status) {
            status.textContent = isPlaying
                ? "Background audio is enabled."
                : "Background audio is disabled.";
        }
    };

    const playAudio = async () => {
        try {
            await audio.play();
            updateAudioInterface();
        } catch (error) {
            console.warn("Audio playback could not begin:", error);

            if (status) {
                status.textContent =
                    "Audio could not begin. Check browser media permissions.";
            }
        }
    };

    const pauseAudio = () => {
        audio.pause();
        updateAudioInterface();
    };

    toggle.addEventListener("click", () => {
        if (audio.paused) {
            void playAudio();
        } else {
            pauseAudio();
        }
    });

    if (volume) {
        volume.addEventListener("input", () => {
            const requestedVolume = Number.parseFloat(volume.value);

            if (!Number.isFinite(requestedVolume)) {
                return;
            }

            audio.volume = clamp(requestedVolume, 0, 1);

            if (audio.volume === 0 && !audio.paused) {
                pauseAudio();
            }
        });
    }

    audio.addEventListener("play", updateAudioInterface);
    audio.addEventListener("pause", updateAudioInterface);
    audio.addEventListener("ended", updateAudioInterface);

    audio.addEventListener("error", () => {
        toggle.disabled = true;
        toggle.textContent = "Audio Unavailable";

        if (status) {
            status.textContent =
                "The background audio file could not be loaded.";
        }
    });

    updateAudioInterface();
}

/* ==========================================================================
   Portfolio and Project Filters
   ========================================================================== */

/**
 * Enables category filtering for elements marked with:
 *
 * data-filter-button="category"
 * data-filter-item
 * data-category="category-one category-two"
 */
function initializeFilters() {
    const filterGroups = document.querySelectorAll("[data-filter-group]");

    filterGroups.forEach((group) => {
        const buttons = group.querySelectorAll("[data-filter-button]");
        const targetSelector = group.dataset.filterTarget;

        if (!targetSelector || buttons.length === 0) {
            return;
        }

        const items = document.querySelectorAll(targetSelector);

        if (items.length === 0) {
            return;
        }

        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                const requestedCategory =
                    button.dataset.filterButton || "all";

                buttons.forEach((candidate) => {
                    const isActive = candidate === button;

                    candidate.classList.toggle("is-active", isActive);
                    candidate.setAttribute(
                        "aria-pressed",
                        String(isActive)
                    );
                });

                items.forEach((item) => {
                    const categories = normalizeCategoryList(
                        item.dataset.category || ""
                    );

                    const shouldShow =
                        requestedCategory === "all" ||
                        categories.includes(requestedCategory);

                    item.hidden = !shouldShow;
                });

                announceFilterResult(items);
            });
        });
    });
}

/**
 * Announces the number of visible filtered entries where an aria-live element
 * marked with data-filter-status exists.
 *
 * @param {NodeListOf<Element>} items
 */
function announceFilterResult(items) {
    const status = document.querySelector("[data-filter-status]");

    if (!status) {
        return;
    }

    const visibleCount = Array.from(items).filter(
        (item) => !item.hidden
    ).length;

    status.textContent =
        `${visibleCount} ${visibleCount === 1 ? "item" : "items"} displayed.`;
}

/* ==========================================================================
   Search
   ========================================================================== */

/**
 * Enables local page filtering for inputs marked with:
 *
 * data-search-input
 * data-search-target="[data-search-item]"
 */
function initializeSearch() {
    const inputs = document.querySelectorAll("[data-search-input]");

    inputs.forEach((input) => {
        const targetSelector = input.dataset.searchTarget;

        if (!targetSelector) {
            return;
        }

        const items = document.querySelectorAll(targetSelector);

        if (items.length === 0) {
            return;
        }

        const updateResults = () => {
            const query = normalizeSearchText(input.value);

            items.forEach((item) => {
                const explicitSearchText =
                    item.dataset.searchText || "";

                const searchableText = normalizeSearchText(
                    `${explicitSearchText} ${item.textContent || ""}`
                );

                item.hidden =
                    query.length > 0 &&
                    !searchableText.includes(query);
            });

            const statusSelector = input.dataset.searchStatus;
            const status = statusSelector
                ? document.querySelector(statusSelector)
                : document.querySelector("[data-search-status]");

            if (status) {
                const visibleCount = Array.from(items).filter(
                    (item) => !item.hidden
                ).length;

                status.textContent =
                    `${visibleCount} ` +
                    `${visibleCount === 1 ? "result" : "results"} found.`;
            }
        };

        input.addEventListener("input", updateResults);
        input.addEventListener("search", updateResults);
    });
}

/* ==========================================================================
   Copy-to-Clipboard
   ========================================================================== */

/**
 * Enables clipboard buttons marked with:
 *
 * data-copy-text="literal value"
 *
 * or:
 *
 * data-copy-target="#element-id"
 */
function initializeCopyButtons() {
    const buttons = document.querySelectorAll(
        "[data-copy-text], [data-copy-target]"
    );

    buttons.forEach((button) => {
        const originalLabel =
            button.dataset.copyLabel ||
            button.textContent.trim() ||
            "Copy";

        button.addEventListener("click", async () => {
            const copyValue = resolveCopyValue(button);

            if (!copyValue) {
                setTemporaryButtonLabel(
                    button,
                    "Nothing to Copy",
                    originalLabel
                );

                return;
            }

            try {
                await copyText(copyValue);

                setTemporaryButtonLabel(
                    button,
                    "Copied",
                    originalLabel
                );
            } catch (error) {
                console.error("Clipboard operation failed:", error);

                setTemporaryButtonLabel(
                    button,
                    "Copy Failed",
                    originalLabel
                );
            }
        });
    });
}

/**
 * Resolves the text associated with a copy button.
 *
 * @param {HTMLElement} button
 * @returns {string}
 */
function resolveCopyValue(button) {
    if (button.dataset.copyText) {
        return button.dataset.copyText.trim();
    }

    const selector = button.dataset.copyTarget;

    if (!selector) {
        return "";
    }

    const target = document.querySelector(selector);

    if (!target) {
        return "";
    }

    if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
    ) {
        return target.value.trim();
    }

    return (target.textContent || "").trim();
}

/**
 * Copies text using the Clipboard API with a legacy fallback.
 *
 * @param {string} value
 * @returns {Promise<void>}
 */
async function copyText(value) {
    if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function" &&
        window.isSecureContext
    ) {
        await navigator.clipboard.writeText(value);
        return;
    }

    const textarea = document.createElement("textarea");

    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";

    document.body.appendChild(textarea);

    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const successful = document.execCommand("copy");

    textarea.remove();

    if (!successful) {
        throw new Error("Legacy clipboard copy failed.");
    }
}

/**
 * Temporarily changes a button label before restoring the original label.
 *
 * @param {HTMLElement} button
 * @param {string} temporaryLabel
 * @param {string} originalLabel
 */
function setTemporaryButtonLabel(
    button,
    temporaryLabel,
    originalLabel
) {
    window.clearTimeout(button.copyResetTimer);

    button.textContent = temporaryLabel;

    button.copyResetTimer = window.setTimeout(() => {
        button.textContent = originalLabel;
    }, 1800);
}

/* ==========================================================================
   Current Year
   ========================================================================== */

/**
 * Populates elements marked with data-current-year.
 */
function initializeCurrentYear() {
    const currentYear = String(new Date().getFullYear());

    document
        .querySelectorAll("[data-current-year]")
        .forEach((element) => {
            element.textContent = currentYear;
        });
}

/* ==========================================================================
   External Links
   ========================================================================== */

/**
 * Adds safe rel attributes to external links.
 *
 * Existing author-defined rel values are retained.
 */
function hardenExternalLinks() {
    const links = document.querySelectorAll('a[href^="http"]');

    links.forEach((link) => {
        let destination;

        try {
            destination = new URL(link.href, window.location.href);
        } catch {
            return;
        }

        if (destination.origin === window.location.origin) {
            return;
        }

        const relValues = new Set(
            (link.getAttribute("rel") || "")
                .split(/\s+/)
                .filter(Boolean)
        );

        relValues.add("noopener");
        relValues.add("noreferrer");

        link.setAttribute("rel", Array.from(relValues).join(" "));

        if (!link.hasAttribute("target")) {
            link.setAttribute("target", "_blank");
        }
    });
}

/* ==========================================================================
   Helpers
   ========================================================================== */

/**
 * Restricts a number to the supplied range.
 *
 * @param {number} value
 * @param {number} minimum
 * @param {number} maximum
 * @returns {number}
 */
function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Converts a category string to a normalized array.
 *
 * @param {string} value
 * @returns {string[]}
 */
function normalizeCategoryList(value) {
    return value
        .toLowerCase()
        .split(/[\s,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean);
}

/**
 * Normalizes text for case-insensitive local search.
 *
 * @param {string} value
 * @returns {string}
 */
function normalizeSearchText(value) {
    return value
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
