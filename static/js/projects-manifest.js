(() => {
"use strict";

const ROOT=document.documentElement.dataset.projectsManifest||"https://zzx-labs.io/projects/manifest.json";
const DEFAULT_CATEGORIES=[
    "software","web","applications","firmware","hardware","bitcoin","ai","ml","cryptography",
    "osint","cyber-investigation","cyber-security","cyber-warfare","design","3d-modeling","writing",
    "music","art","photography","cannabis","geopolitics","adventures","business","conceptualization"
];
const state={projects:[],errors:[],seen:new Set(),visited:new Set()};

const arr=value=>{
    if(value===null||value===undefined||value==="")return[];
    if(Array.isArray(value))return value;
    if(typeof value==="object")return Object.values(value);
    return[value];
};

const txt=(value,fallback="")=>value===null||value===undefined?fallback:String(value);

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
    try{return new URL(value,base).href;}
    catch{return String(value);}
}

function rootBaseURL(){
    try{return new URL("./",ROOT);}
    catch{return new URL("https://zzx-labs.io/projects/");}
}

async function fetchJSON(url){
    const response=await fetch(url,{
        method:"GET",
        mode:"cors",
        credentials:"omit",
        cache:"no-store",
        headers:{Accept:"application/json"}
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
    const title=txt(raw.title||raw.name||raw.project_name||raw.label,"Untitled Project");
    const id=txt(raw.slug||raw.id||raw.key,slug(title));
    const category=txt(raw.category||raw.category_name||raw.group||context.category,"Uncategorized");

    const href=absoluteURL(
        raw.href||raw.url||raw.page||raw.path||`/projects/${category}/${id}/`,
        context.url
    );

    const tags=[
        ...arr(raw.tags),
        ...arr(raw.keywords),
        ...arr(raw.technologies),
        ...arr(raw.stack),
        ...arr(raw.platforms),
        ...arr(raw.frameworks)
    ].map(tag=>{
        if(typeof tag==="object"){
            return txt(tag.name||tag.label||tag.title);
        }
        return txt(tag);
    }).filter(Boolean);

    return{
        title,
        id,
        category,
        href,
        portfolioHref:absoluteURL(
            raw.portfolio_href||raw.portfolio_url||raw.portfolio||href,
            context.url
        ),
        cover:absoluteURL(
            raw.cover||raw.cover_image||raw.logo||raw.image||raw.thumbnail||raw.hero_image,
            context.url
        ),
        status:txt(raw.status||raw.state||raw.phase,"Active"),
        summary:txt(
            raw.summary||raw.description||raw.blurb||raw.abstract||raw.excerpt,
            "Project documentation is being prepared."
        ),
        date:txt(raw.date||raw.updated||raw.modified||raw.created),
        version:txt(raw.version),
        license:txt(raw.license),
        github:absoluteURL(raw.github,context.url),
        download:absoluteURL(raw.download,context.url),
        note:txt(raw.note),
        featured:Boolean(raw.featured||raw.is_featured),
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
        const objectSource=candidates.find(value=>value&&typeof value==="object");
        source=objectSource?Object.values(objectSource):[];
    }

    return source
        .filter(item=>item&&typeof item==="object")
        .map(item=>normalizeProject(item,context));
}

function extractManifestLinks(manifest,base){
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
            links.push({name:"",url:absoluteURL(item,base)});
            continue;
        }

        if(!item||typeof item!=="object")continue;

        const value=item.manifest||item.manifest_url||item.url||item.href||item.path||item.src;
        if(!value)continue;

        links.push({
            name:txt(item.name||item.title||item.label||item.slug),
            url:absoluteURL(value,base)
        });
    }

    return links;
}

function addProjects(projects){
    for(const project of projects){
        const key=project.href||`${project.category}::${project.id}::${project.title}`;
        if(state.seen.has(key))continue;
        state.seen.add(key);
        state.projects.push(project);
    }
}

async function walkManifest(url,category="",depth=0){
    if(depth>3||state.visited.has(url))return;
    state.visited.add(url);

    const manifest=await fetchJSON(url);
    addProjects(extractProjects(manifest,{url,category}));

    const children=extractManifestLinks(manifest,url);
    const results=await Promise.allSettled(
        children.map(child=>walkManifest(child.url,child.name||category,depth+1))
    );

    for(const result of results){
        if(result.status==="rejected")state.errors.push(result.reason);
    }
}

async function loadProjectManifests(){
    try{
        await walkManifest(ROOT);
    }catch(error){
        state.errors.push(error);
    }

    if(state.projects.length)return;

    const base=rootBaseURL();
    const results=await Promise.allSettled(
        DEFAULT_CATEGORIES.map(category=>{
            const url=new URL(`${category}/manifest.json`,base).href;
            return walkManifest(url,category,0);
        })
    );

    for(const result of results){
        if(result.status==="rejected")state.errors.push(result.reason);
    }

    if(!state.projects.length){
        throw new Error("No valid project manifests could be loaded from the root manifest or category directories.");
    }
}

function createTagList(tags){
    if(!tags.length)return"";
    return `<ul class="tag-list">${tags.slice(0,8).map(tag=>`<li>${esc(tag)}</li>`).join("")}</ul>`;
}

function createMeta(project){
    const items=[];
    if(project.version)items.push(`Version ${esc(project.version)}`);
    if(project.license)items.push(esc(project.license));
    if(project.date)items.push(esc(project.date));
    return items.length?`<p class="project-meta">${items.join(" | ")}</p>`:"";
}

function createLinks(project,mode){
    const links=[];
    const primary=mode==="portfolio"?project.portfolioHref:project.href;

    links.push(
        `<a href="${esc(primary)}">${mode==="portfolio"?"View portfolio entry":"View project"}</a>`
    );

    if(project.github){
        links.push(
            `<a href="${esc(project.github)}" rel="noopener noreferrer">GitHub</a>`
        );
    }

    if(project.download){
        links.push(
            `<a href="${esc(project.download)}">Download</a>`
        );
    }

    return `<div class="project-links">${links.join("")}</div>`;
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

    if(element){
        element.textContent=`${count} project${count===1?"":"s"} loaded`;
    }
}

function renderFilters(projects,target,grid){
    if(!target||!grid)return;

    const categories=[...new Set(
        projects
            .map(project=>project.category)
            .filter(Boolean)
    )].sort((a,b)=>a.localeCompare(b));

    target.innerHTML=
        `<button class="button project-filter is-active" type="button" data-project-filter="all">All</button>`+
        categories.map(category=>
            `<button class="button secondary project-filter" type="button" data-project-filter="${esc(category)}">${esc(category)}</button>`
        ).join("");

    target.addEventListener("click",event=>{
        const button=event.target.closest("[data-project-filter]");
        if(!button)return;

        const filter=button.dataset.projectFilter;

        target.querySelectorAll("[data-project-filter]").forEach(item=>{
            item.classList.toggle("is-active",item===button);
        });

        grid.querySelectorAll("[data-project-category]").forEach(card=>{
            card.hidden=filter!=="all"&&card.dataset.projectCategory!==filter;
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
            .map(project=>createCard(project,mode))
            .join("");
    }

    grid.setAttribute("aria-busy","false");

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
        grid.setAttribute("aria-busy","false");
    }
}

document.addEventListener("DOMContentLoaded",async()=>{
    try{
        await loadProjectManifests();

        state.projects.sort((a,b)=>{
            if(a.featured!==b.featured){
                return Number(b.featured)-Number(a.featured);
            }

            const categoryCompare=
                a.category.localeCompare(b.category);

            return categoryCompare!==0
                ?categoryCompare
                :a.title.localeCompare(b.title);
        });

        renderPage("projects",state.projects);
        renderPage("portfolio",state.projects);

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
            `${error.message} Verify that zzx-labs.io permits cross-origin requests from https://0xdeadbeef.in.`
        );

        renderFailure(error);
    }
});

})();
