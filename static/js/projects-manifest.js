(() => {
"use strict";
const ROOT=document.documentElement.dataset.projectsManifest||"https://zzx-labs.io/projects/manifest.json";
const CATEGORY_DIRS=[
    "adult",
    "ai",
    "apps",
    "bitcoin",
    "cyber-investigation",
    "cyber-security",
    "cyber-warfare",
    "engineering",
    "firmware",
    "hardware",
    "ml",
    "osint",
    "software",
    "web"
];
const CATEGORY_LABELS={
    adult:"Adult",
    ai:"AI",
    apps:"Applications",
    bitcoin:"Bitcoin",
    "cyber-investigation":"Cyber Investigation",
    "cyber-security":"Cyber Security",
    "cyber-warfare":"Cyber Warfare",
    engineering:"Engineering",
    firmware:"Firmware",
    hardware:"Hardware",
    ml:"Machine Learning",
    osint:"OSINT",
    software:"Software",
    web:"Web"
};
const state={
    projects:[],
    errors:[],
    seenProjects:new Set(),
    visitedManifests:new Set()
};
const arr=value=>{
    if(value===null||value===undefined||value==="")return[];
    if(Array.isArray(value))return value;
    if(typeof value==="object")return Object.values(value);
    return[value];
};
const txt=(value,fallback="")=>{
    if(value===null||value===undefined)return fallback;
    return String(value);
};
const esc=value=>txt(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
const slug=value=>txt(value,"project")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"")||"project";
function absoluteURL(value,base){
    if(!value)return"";
    try{
        return new URL(value,base).href;
    }catch{
        return String(value);
    }
}
function projectsBaseURL(){
    try{
        return new URL("./",ROOT);
    }catch{
        return new URL("https://zzx-labs.io/projects/");
    }
}
function normalizeCategory(value,fallback="software"){
    const category=txt(value,fallback)
        .trim()
        .toLowerCase()
        .replaceAll("_","-")
        .replaceAll(" ","-");
    const aliases={
        app:"apps",
        application:"apps",
        applications:"apps",
        mobile:"apps",
        artificialintelligence:"ai",
        "artificial-intelligence":"ai",
        machinelearning:"ml",
        "machine-learning":"ml",
        cybersecurity:"cyber-security",
        security:"cyber-security",
        investigation:"cyber-investigation",
        cyberwarfare:"cyber-warfare",
        "cyber-conflict":"cyber-warfare",
        engineering:"engineering",
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
        "counter-uas":"engineering",
        embedded:"firmware",
        electronics:"hardware",
        website:"web",
        websites:"web",
        "web-development":"web"
    };
    const normalized=aliases[category]||category;
    if(CATEGORY_DIRS.includes(normalized)){
        return normalized;
    }
    return fallback;
}
function normalizeStringArray(value){
    return arr(value)
        .map(item=>{
            if(item&&typeof item==="object"){
                return txt(
                    item.name||
                    item.label||
                    item.title||
                    item.value
                );
            }
            return txt(item);
        })
        .map(item=>item.trim())
        .filter(Boolean);
}
async function fetchJSON(url){
    const response=await fetch(url,{
        method:"GET",
        mode:"cors",
        credentials:"omit",
        cache:"no-store",
        headers:{
            Accept:"application/json"
        }
    });
    if(!response.ok){
        throw new Error(`${response.status} ${response.statusText}: ${url}`);
    }
    const body=await response.text();
    if(!body.trim()){
        throw new Error(`Empty JSON manifest: ${url}`);
    }
    try{
        return JSON.parse(body);
    }catch(error){
        throw new Error(`Invalid JSON manifest: ${url}: ${error.message}`);
    }
}
function normalizeProject(raw,context){
    const title=txt(
        raw.title||
        raw.name||
        raw.project_name||
        raw.label,
        "Untitled Project"
    );
    const id=txt(
        raw.slug||
        raw.id||
        raw.key,
        slug(title)
    );
    const category=normalizeCategory(
        raw.category||
        raw.category_name||
        raw.group||
        context.category,
        context.category||"software"
    );
    const href=absoluteURL(
        raw.href||
        raw.url||
        raw.page||
        raw.path||
        `/projects/${category}/${id}/`,
        context.manifestURL
    );
    const tags=[
        ...normalizeStringArray(raw.tags),
        ...normalizeStringArray(raw.keywords),
        ...normalizeStringArray(raw.technologies),
        ...normalizeStringArray(raw.stack),
        ...normalizeStringArray(raw.platforms),
        ...normalizeStringArray(raw.frameworks)
    ];
    return{
        title,
        id,
        category,
        href,
        portfolioHref:absoluteURL(
            raw.portfolio_href||
            raw.portfolio_url||
            raw.portfolio||
            href,
            context.manifestURL
        ),
        cover:absoluteURL(
            raw.cover||
            raw.cover_image||
            raw.logo||
            raw.image||
            raw.thumbnail||
            raw.hero_image,
            context.manifestURL
        ),
        github:absoluteURL(
            raw.github||
            raw.repository||
            raw.repo,
            context.manifestURL
        ),
        download:absoluteURL(
            raw.download||
            raw.download_url||
            raw.release,
            context.manifestURL
        ),
        status:txt(
            raw.status||
            raw.state||
            raw.phase,
            "Active"
        ),
        summary:txt(
            raw.summary||
            raw.description||
            raw.blurb||
            raw.abstract||
            raw.excerpt,
            "Project documentation is being prepared."
        ),
        date:txt(
            raw.date||
            raw.updated||
            raw.modified||
            raw.created
        ),
        version:txt(raw.version),
        license:txt(raw.license),
        note:txt(raw.note),
        featured:Boolean(
            raw.featured||
            raw.is_featured
        ),
        tags:[...new Set(tags)]
    };
}
function extractProjects(manifest,context){
    const candidates=[
        manifest.projects,
        manifest.items,
        manifest.entries,
        manifest.data,
        manifest.records
    ];
    let source=candidates.find(Array.isArray);
    if(!source){
        const objectSource=candidates.find(
            value=>value&&typeof value==="object"
        );
        source=objectSource
            ?Object.values(objectSource)
            :[];
    }
    return source
        .filter(item=>item&&typeof item==="object")
        .map(item=>normalizeProject(item,context));
}
function extractManifestLinks(manifest,baseURL){
    const links=[];
    const candidates=[
        ...arr(manifest.categories),
        ...arr(manifest.subcategories),
        ...arr(manifest.manifests),
        ...arr(manifest.collections),
        ...arr(manifest.groups)
    ];
    for(const item of candidates){
        if(typeof item==="string"){
            links.push({
                category:"",
                url:absoluteURL(item,baseURL)
            });
            continue;
        }
        if(!item||typeof item!=="object")continue;
        const value=
            item.manifest||
            item.manifest_url||
            item.url||
            item.href||
            item.path||
            item.src;
        if(!value)continue;
        links.push({
            category:normalizeCategory(
                item.name||
                item.category||
                item.title||
                item.label||
                item.slug,
                ""
            ),
            url:absoluteURL(value,baseURL)
        });
    }
    return links;
}
function projectIdentity(project){
    const key=
        project.slug||
        project.id||
        project.href||
        project.github||
        `${project.category}::${project.title}`;
    return txt(key).trim().toLowerCase();
}
function mergeProject(existing,incoming){
    return{
        ...existing,
        ...incoming,
        tags:[
            ...new Set([
                ...arr(existing.tags),
                ...arr(incoming.tags)
            ])
        ]
    };
}
function addProjects(projects){
    for(const project of projects){
        const key=projectIdentity(project);
        if(state.seenProjects.has(key)){
            const index=state.projects.findIndex(
                item=>projectIdentity(item)===key
            );
            if(index!==-1){
                state.projects[index]=mergeProject(
                    state.projects[index],
                    project
                );
            }
            continue;
        }
        state.seenProjects.add(key);
        state.projects.push(project);
    }
}
async function walkManifest(url,category="",depth=0){
    if(depth>3)return;
    if(state.visitedManifests.has(url))return;
    state.visitedManifests.add(url);
    const manifest=await fetchJSON(url);
    addProjects(
        extractProjects(manifest,{
            manifestURL:url,
            category:normalizeCategory(
                category,
                "software"
            )
        })
    );
    const children=extractManifestLinks(
        manifest,
        url
    );
    const results=await Promise.allSettled(
        children.map(child=>
            walkManifest(
                child.url,
                child.category||category,
                depth+1
            )
        )
    );
    for(const result of results){
        if(result.status==="rejected"){
            state.errors.push(result.reason);
        }
    }
}
async function loadMasterManifest(){
    try{
        await walkManifest(ROOT,"",0);
        return true;
    }catch(error){
        state.errors.push(error);
        return false;
    }
}
async function loadCategoryManifests(){
    const base=projectsBaseURL();
    const results=await Promise.allSettled(
        CATEGORY_DIRS.map(category=>{
            const url=new URL(
                `${category}/manifest.json`,
                base
            ).href;
            return walkManifest(
                url,
                category,
                0
            );
        })
    );
    for(const result of results){
        if(result.status==="rejected"){
            state.errors.push(result.reason);
        }
    }
}
async function loadProjectManifests(){
    await loadMasterManifest();
    await loadCategoryManifests();
    if(!state.projects.length){
        throw new Error(
            "No valid project records could be loaded from the master manifest or category manifests."
        );
    }
}
function createTagList(tags){
    if(!tags.length)return"";
    return `<ul class="tag-list">${tags
        .slice(0,8)
        .map(tag=>`<li>${esc(tag)}</li>`)
        .join("")}</ul>`;
}
function createMeta(project){
    const items=[];
    if(project.version){
        items.push(`Version ${esc(project.version)}`);
    }
    if(project.license){
        items.push(esc(project.license));
    }
    if(project.date){
        items.push(esc(project.date));
    }
    return items.length
        ?`<p class="project-meta">${items.join(" | ")}</p>`
        :"";
}
function createLinks(project,mode){
    const links=[];
    const primary=mode==="portfolio"
        ?project.portfolioHref
        :project.href;
    if(primary){
        links.push(
            `<a href="${esc(primary)}">${mode==="portfolio"
                ?"View portfolio entry"
                :"View project"}</a>`
        );
    }
    if(project.github){
        links.push(
            `<a href="${esc(project.github)}" target="_blank" rel="noopener noreferrer">GitHub</a>`
        );
    }
    if(project.download){
        links.push(
            `<a href="${esc(project.download)}">Download</a>`
        );
    }
    return links.length
        ?`<div class="project-links">${links.join("")}</div>`
        :"";
}
function createCard(project,mode){
    const image=project.cover
        ?`<img src="${esc(project.cover)}" alt="${esc(project.title)} cover" class="project-cover" loading="lazy" decoding="async">`
        :"";
    const note=project.note
        ?`<p class="project-note">${esc(project.note)}</p>`
        :"";
    return `<article class="project-card" data-project-category="${esc(project.category)}" data-project-status="${esc(project.status)}">
        ${image}
        <div class="project-card-header">
            <p class="project-status">${esc(project.status)}</p>
            <h3>${esc(project.title)}</h3>
        </div>
        <p>${esc(project.summary)}</p>
        ${createMeta(project)}
        ${note}
        ${createTagList(project.tags)}
        ${createLinks(project,mode)}
    </article>`;
}
function updateCount(id,count){
    const element=document.getElementById(id);
    if(!element)return;
    element.textContent=
        `${count} project${count===1?"":"s"} loaded`;
}
function displayCategory(category){
    return CATEGORY_LABELS[category]||category;
}
function renderFilters(projects,target,grid){
    if(!target||!grid)return;
    const categories=[
        ...new Set(
            projects
                .map(project=>project.category)
                .filter(category=>
                    CATEGORY_DIRS.includes(category)
                )
        )
    ].sort((a,b)=>
        displayCategory(a).localeCompare(
            displayCategory(b),
            undefined,
            {
                sensitivity:"base",
                numeric:true
            }
        )
    );
    target.innerHTML=
        `<button class="button project-filter is-active" type="button" data-project-filter="all">All</button>`+
        categories.map(category=>
            `<button class="button secondary project-filter" type="button" data-project-filter="${esc(category)}">${esc(displayCategory(category))}</button>`
        ).join("");
    target.addEventListener("click",event=>{
        const button=event.target.closest(
            "[data-project-filter]"
        );
        if(!button)return;
        const filter=button.dataset.projectFilter;
        target
            .querySelectorAll(
                "[data-project-filter]"
            )
            .forEach(item=>{
                item.classList.toggle(
                    "is-active",
                    item===button
                );
            });
        grid
            .querySelectorAll(
                "[data-project-category]"
            )
            .forEach(card=>{
                card.hidden=
                    filter!=="all"&&
                    card.dataset.projectCategory!==filter;
            });
    });
}
function renderPage(mode,projects){
    const isProjects=mode==="projects";
    const grid=document.getElementById(
        isProjects
            ?"manifest-project-grid"
            :"manifest-portfolio-grid"
    );
    if(!grid)return;
    if(!projects.length){
        grid.innerHTML=
            `<article class="info-panel">
                <h3>No projects found</h3>
                <p>The loaded manifests did not contain recognized project records.</p>
            </article>`;
    }else{
        grid.innerHTML=projects
            .map(project=>
                createCard(project,mode)
            )
            .join("");
    }
    grid.setAttribute(
        "aria-busy",
        "false"
    );
    updateCount(
        isProjects
            ?"manifest-project-count"
            :"manifest-portfolio-count",
        projects.length
    );
    renderFilters(
        projects,
        document.getElementById(
            isProjects
                ?"manifest-project-filters"
                :"manifest-portfolio-filters"
        ),
        grid
    );
}
function setStatus(success,title,message){
    const ids=[
        "manifest-project-status",
        "manifest-portfolio-status"
    ];
    for(const id of ids){
        const target=document.getElementById(id);
        if(!target)continue;
        target.innerHTML=
            `<div class="notice ${success?"info":"warning"}">
                <strong>${esc(title)}</strong>
                <p>${esc(message)}</p>
            </div>`;
    }
}
function renderFailure(error){
    const fallback=
        `<article class="info-panel">
            <h3>Project manifest unavailable</h3>
            <p>${esc(error.message||error)}</p>
        </article>`;
    for(const id of [
        "manifest-project-grid",
        "manifest-portfolio-grid"
    ]){
        const grid=document.getElementById(id);
        if(!grid)continue;
        grid.innerHTML=fallback;
        grid.setAttribute(
            "aria-busy",
            "false"
        );
    }
}
document.addEventListener(
    "DOMContentLoaded",
    async()=>{
        try{
            await loadProjectManifests();
            state.projects.sort((a,b)=>
                a.title.localeCompare(
                    b.title,
                    undefined,
                    {
                        sensitivity:"base",
                        numeric:true
                    }
                )
            );
            renderPage(
                "projects",
                state.projects
            );
            renderPage(
                "portfolio",
                state.projects
            );
            if(state.errors.length){
                setStatus(
                    true,
                    "Manifest partially synchronized",
                    `${state.projects.length} projects loaded; ${state.errors.length} manifest request${state.errors.length===1?"":"s"} failed or were unavailable.`
                );
            }else{
                setStatus(
                    true,
                    "Manifest synchronized",
                    `${state.projects.length} projects loaded from the ZZX-Labs project manifests.`
                );
            }
        }catch(error){
            console.error(
                "Unable to load ZZX-Labs project manifests:",
                error
            );
            setStatus(
                false,
                "Manifest unavailable",
                error.message
            );
            renderFailure(error);
        }
    }
);
})();
