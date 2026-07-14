"use strict";

/**
 * 0xdeadbeef.in
 * Shared client-side behavior
 *
 * Responsibilities:
 * - Shared-component initialization
 * - Mobile navigation
 * - Landing-page audio controls
 * - Static portfolio/project filtering
 * - Local page search
 * - Copy-to-clipboard controls
 * - Current-year rendering
 * - External-link hardening
 *
 * Manifest project loading is handled separately by:
 * /static/js/projects-manifest.js
 */

const initializedElements={
    navigation:new WeakSet(),
    audio:new WeakSet(),
    filters:new WeakSet(),
    search:new WeakSet(),
    copy:new WeakSet()
};

document.addEventListener("DOMContentLoaded",()=>{
    initializeSite();
    observeIncludedContent();
});

document.addEventListener("site:include-loaded",()=>{
    initializeSite();
});

document.addEventListener("include:loaded",()=>{
    initializeSite();
});

function initializeSite(){
    initializeMobileNavigation();
    initializeAudioControls();
    initializeFilters();
    initializeSearch();
    initializeCopyButtons();
    initializeCurrentYear();
    hardenExternalLinks();
}

function observeIncludedContent(){
    if(!document.body||typeof MutationObserver==="undefined")return;

    let scheduled=false;

    const observer=new MutationObserver(mutations=>{
        const hasAddedNodes=mutations.some(mutation=>mutation.addedNodes.length>0);
        if(!hasAddedNodes||scheduled)return;

        scheduled=true;

        window.requestAnimationFrame(()=>{
            scheduled=false;
            initializeSite();
        });
    });

    observer.observe(document.body,{
        childList:true,
        subtree:true
    });
}

/* ==========================================================================
   Mobile Navigation
   ========================================================================== */

function initializeMobileNavigation(){
    const toggles=document.querySelectorAll(".nav-toggle");

    toggles.forEach(toggle=>{
        if(initializedElements.navigation.has(toggle))return;

        const navigationId=toggle.getAttribute("aria-controls")||"primary-nav";
        const navigation=document.getElementById(navigationId);

        if(!navigation)return;

        initializedElements.navigation.add(toggle);

        const closeNavigation=({restoreFocus=false}={})=>{
            navigation.classList.remove("is-open");
            toggle.setAttribute("aria-expanded","false");
            document.body.classList.remove("nav-open");

            if(restoreFocus){
                toggle.focus();
            }
        };

        const openNavigation=()=>{
            navigation.classList.add("is-open");
            toggle.setAttribute("aria-expanded","true");
            document.body.classList.add("nav-open");
        };

        toggle.addEventListener("click",()=>{
            const isOpen=toggle.getAttribute("aria-expanded")==="true";

            if(isOpen){
                closeNavigation();
            }else{
                openNavigation();
            }
        });

        navigation.addEventListener("click",event=>{
            const link=event.target.closest("a");

            if(link){
                closeNavigation();
            }
        });

        document.addEventListener("click",event=>{
            const isOpen=toggle.getAttribute("aria-expanded")==="true";
            if(!isOpen)return;

            const clickedInsideNavigation=navigation.contains(event.target);
            const clickedToggle=toggle.contains(event.target);

            if(!clickedInsideNavigation&&!clickedToggle){
                closeNavigation();
            }
        });

        document.addEventListener("keydown",event=>{
            if(event.key==="Escape"&&toggle.getAttribute("aria-expanded")==="true"){
                closeNavigation({restoreFocus:true});
            }
        });

        window.addEventListener("resize",()=>{
            if(window.innerWidth>900){
                closeNavigation();
            }
        });
    });
}

/* ==========================================================================
   Landing-Page Audio
   ========================================================================== */

function initializeAudioControls(){
    const audio=document.getElementById("background-audio");
    const toggle=document.getElementById("audio-toggle");
    const volume=document.getElementById("audio-volume");
    const status=document.getElementById("audio-status");

    if(!audio||!toggle)return;
    if(initializedElements.audio.has(audio))return;

    initializedElements.audio.add(audio);

    const storedVolume=readStoredNumber("site-audio-volume");
    const defaultVolume=Number.isFinite(storedVolume)
        ?clamp(storedVolume,0,1)
        :0.35;

    audio.volume=defaultVolume;
    audio.muted=false;

    if(volume){
        volume.value=String(defaultVolume);
    }

    const updateAudioInterface=()=>{
        const isPlaying=!audio.paused&&!audio.ended;

        toggle.setAttribute("aria-pressed",String(isPlaying));
        toggle.textContent=isPlaying?"Disable Audio":"Enable Audio";

        if(status){
            status.textContent=isPlaying
                ?"Background audio is enabled."
                :"Background audio is disabled.";
        }
    };

    const playAudio=async()=>{
        try{
            await audio.play();
            updateAudioInterface();
        }catch(error){
            console.warn("Audio playback could not begin:",error);

            if(status){
                status.textContent=
                    "Audio could not begin. Check browser media permissions.";
            }
        }
    };

    const pauseAudio=()=>{
        audio.pause();
        updateAudioInterface();
    };

    toggle.addEventListener("click",()=>{
        if(audio.paused){
            void playAudio();
        }else{
            pauseAudio();
        }
    });

    if(volume){
        volume.addEventListener("input",()=>{
            const requestedVolume=Number.parseFloat(volume.value);

            if(!Number.isFinite(requestedVolume))return;

            audio.volume=clamp(requestedVolume,0,1);
            writeStoredNumber("site-audio-volume",audio.volume);

            if(audio.volume===0&&!audio.paused){
                pauseAudio();
            }
        });
    }

    audio.addEventListener("play",updateAudioInterface);
    audio.addEventListener("pause",updateAudioInterface);
    audio.addEventListener("ended",updateAudioInterface);

    audio.addEventListener("error",()=>{
        toggle.disabled=true;
        toggle.textContent="Audio Unavailable";

        if(status){
            status.textContent=
                "The background audio file could not be loaded.";
        }
    });

    updateAudioInterface();
}

/* ==========================================================================
   Static Portfolio and Project Filters
   ========================================================================== */

function initializeFilters(){
    const filterGroups=document.querySelectorAll("[data-filter-group]");

    filterGroups.forEach(group=>{
        if(initializedElements.filters.has(group))return;

        const buttons=group.querySelectorAll("[data-filter-button]");
        const targetSelector=group.dataset.filterTarget;

        if(!targetSelector||buttons.length===0)return;

        let items;

        try{
            items=document.querySelectorAll(targetSelector);
        }catch(error){
            console.warn("Invalid filter target selector:",targetSelector,error);
            return;
        }

        if(items.length===0)return;

        initializedElements.filters.add(group);

        buttons.forEach(button=>{
            button.addEventListener("click",()=>{
                const requestedCategory=normalizeCategoryName(
                    button.dataset.filterButton||"all"
                );

                buttons.forEach(candidate=>{
                    const isActive=candidate===button;

                    candidate.classList.toggle("is-active",isActive);
                    candidate.setAttribute("aria-pressed",String(isActive));
                });

                items.forEach(item=>{
                    const categories=normalizeCategoryList(
                        item.dataset.category||""
                    );

                    const shouldShow=
                        requestedCategory==="all"||
                        categories.includes(requestedCategory);

                    item.hidden=!shouldShow;
                });

                announceFilterResult(group,items);
            });
        });
    });
}

function announceFilterResult(group,items){
    const statusSelector=group.dataset.filterStatus;
    let status=null;

    if(statusSelector){
        try{
            status=document.querySelector(statusSelector);
        }catch(error){
            console.warn("Invalid filter status selector:",statusSelector,error);
        }
    }

    if(!status){
        status=group.querySelector("[data-filter-status]")||
            document.querySelector("[data-filter-status]");
    }

    if(!status)return;

    const visibleCount=Array.from(items).filter(item=>!item.hidden).length;

    status.textContent=
        `${visibleCount} ${visibleCount===1?"item":"items"} displayed.`;
}

/* ==========================================================================
   Search
   ========================================================================== */

function initializeSearch(){
    const inputs=document.querySelectorAll("[data-search-input]");

    inputs.forEach(input=>{
        if(initializedElements.search.has(input))return;

        const targetSelector=input.dataset.searchTarget;

        if(!targetSelector)return;

        let items;

        try{
            items=document.querySelectorAll(targetSelector);
        }catch(error){
            console.warn("Invalid search target selector:",targetSelector,error);
            return;
        }

        if(items.length===0)return;

        initializedElements.search.add(input);

        const updateResults=()=>{
            const query=normalizeSearchText(input.value);

            items.forEach(item=>{
                const explicitSearchText=item.dataset.searchText||"";
                const searchableText=normalizeSearchText(
                    `${explicitSearchText} ${item.textContent||""}`
                );

                item.hidden=
                    query.length>0&&
                    !searchableText.includes(query);
            });

            updateSearchStatus(input,items);
        };

        input.addEventListener("input",updateResults);
        input.addEventListener("search",updateResults);

        if(input.value){
            updateResults();
        }
    });
}

function updateSearchStatus(input,items){
    const statusSelector=input.dataset.searchStatus;
    let status=null;

    if(statusSelector){
        try{
            status=document.querySelector(statusSelector);
        }catch(error){
            console.warn("Invalid search status selector:",statusSelector,error);
        }
    }

    if(!status){
        status=document.querySelector("[data-search-status]");
    }

    if(!status)return;

    const visibleCount=Array.from(items).filter(item=>!item.hidden).length;

    status.textContent=
        `${visibleCount} ${visibleCount===1?"result":"results"} found.`;
}

/* ==========================================================================
   Copy-to-Clipboard
   ========================================================================== */

function initializeCopyButtons(){
    const buttons=document.querySelectorAll(
        "[data-copy-text], [data-copy-target]"
    );

    buttons.forEach(button=>{
        if(initializedElements.copy.has(button))return;

        initializedElements.copy.add(button);

        const originalLabel=
            button.dataset.copyLabel||
            button.textContent.trim()||
            "Copy";

        button.addEventListener("click",async()=>{
            const copyValue=resolveCopyValue(button);

            if(!copyValue){
                setTemporaryButtonLabel(
                    button,
                    "Nothing to Copy",
                    originalLabel
                );
                return;
            }

            try{
                await copyText(copyValue);

                setTemporaryButtonLabel(
                    button,
                    "Copied",
                    originalLabel
                );
            }catch(error){
                console.error("Clipboard operation failed:",error);

                setTemporaryButtonLabel(
                    button,
                    "Copy Failed",
                    originalLabel
                );
            }
        });
    });
}

function resolveCopyValue(button){
    if(button.dataset.copyText){
        return button.dataset.copyText.trim();
    }

    const selector=button.dataset.copyTarget;

    if(!selector)return"";

    let target;

    try{
        target=document.querySelector(selector);
    }catch(error){
        console.warn("Invalid copy target selector:",selector,error);
        return"";
    }

    if(!target)return"";

    if(
        target instanceof HTMLInputElement||
        target instanceof HTMLTextAreaElement
    ){
        return target.value.trim();
    }

    return(target.textContent||"").trim();
}

async function copyText(value){
    if(
        navigator.clipboard&&
        typeof navigator.clipboard.writeText==="function"&&
        window.isSecureContext
    ){
        await navigator.clipboard.writeText(value);
        return;
    }

    const textarea=document.createElement("textarea");

    textarea.value=value;
    textarea.setAttribute("readonly","");
    textarea.style.position="fixed";
    textarea.style.top="-9999px";
    textarea.style.left="-9999px";
    textarea.style.opacity="0";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0,textarea.value.length);

    const successful=document.execCommand("copy");

    textarea.remove();

    if(!successful){
        throw new Error("Legacy clipboard copy failed.");
    }
}

function setTemporaryButtonLabel(
    button,
    temporaryLabel,
    originalLabel
){
    window.clearTimeout(button.copyResetTimer);

    button.textContent=temporaryLabel;

    button.copyResetTimer=window.setTimeout(()=>{
        button.textContent=originalLabel;
    },1800);
}

/* ==========================================================================
   Current Year
   ========================================================================== */

function initializeCurrentYear(){
    const currentYear=String(new Date().getFullYear());

    document
        .querySelectorAll("[data-current-year]")
        .forEach(element=>{
            element.textContent=currentYear;
        });
}

/* ==========================================================================
   External Links
   ========================================================================== */

function hardenExternalLinks(){
    const links=document.querySelectorAll('a[href^="http"]');

    links.forEach(link=>{
        let destination;

        try{
            destination=new URL(link.href,window.location.href);
        }catch{
            return;
        }

        if(destination.origin===window.location.origin)return;

        const relValues=new Set(
            (link.getAttribute("rel")||"")
                .split(/\s+/)
                .filter(Boolean)
        );

        relValues.add("noopener");
        relValues.add("noreferrer");

        link.setAttribute("rel",Array.from(relValues).join(" "));

        if(!link.hasAttribute("target")){
            link.setAttribute("target","_blank");
        }
    });
}

/* ==========================================================================
   Helpers
   ========================================================================== */

function clamp(value,minimum,maximum){
    return Math.min(Math.max(value,minimum),maximum);
}

function normalizeCategoryName(value){
    const normalized=String(value||"")
        .toLowerCase()
        .trim()
        .replace(/_/g,"-")
        .replace(/\s+/g,"-");

    const aliases={
        app:"apps",
        application:"apps",
        applications:"apps",
        artificialintelligence:"ai",
        "artificial-intelligence":"ai",
        machinelearning:"ml",
        "machine-learning":"ml",
        cybersecurity:"cyber-security",
        investigation:"cyber-investigation",
        cyberwarfare:"cyber-warfare",
        "cyber-conflict":"cyber-warfare",
        engineer:"engineering",
        drone:"engineering",
        drones:"engineering",
        uav:"engineering",
        uas:"engineering",
        ugv:"engineering",
        umv:"engineering",
        usv:"engineering",
        rov:"engineering",
        uuv:"engineering",
        auv:"engineering",
        robot:"engineering",
        robots:"engineering",
        robotic:"engineering",
        robotics:"engineering",
        autonomous:"engineering",
        autonomy:"engineering",
        interceptor:"engineering",
        interceptors:"engineering",
        detector:"engineering",
        detectors:"engineering",
        deterrent:"engineering",
        deterrents:"engineering",
        jammer:"engineering",
        jammers:"engineering",
        embedded:"firmware",
        electronics:"hardware",
        website:"web",
        websites:"web",
        "web-development":"web"
    };

    return aliases[normalized]||normalized;
}

function normalizeCategoryList(value){
    return String(value||"")
        .split(/[\s,]+/)
        .map(entry=>normalizeCategoryName(entry))
        .filter(Boolean);
}

function normalizeSearchText(value){
    return String(value||"")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g,"")
        .replace(/\s+/g," ")
        .trim();
}

function readStoredNumber(key){
    try{
        const value=window.localStorage.getItem(key);
        if(value===null)return Number.NaN;

        const parsed=Number.parseFloat(value);

        return Number.isFinite(parsed)
            ?parsed
            :Number.NaN;
    }catch{
        return Number.NaN;
    }
}

function writeStoredNumber(key,value){
    try{
        window.localStorage.setItem(key,String(value));
    }catch{
        return;
    }
}
