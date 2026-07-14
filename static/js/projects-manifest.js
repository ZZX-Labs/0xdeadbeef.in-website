(() => {
"use strict";

const ROOT=document.documentElement.dataset.projectsManifest||"https://zzx-labs.io/projects/manifest.json";

const state={
    projects:[],
    errors:[],
    seen:new Set()
};

const arr=value=>{
    if(!value)return[];
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
    .replace(/^-|-$/g,"")||"project";

function absoluteURL(value,base){
    if(!value)return"";
    try{
        return new URL(value,base).href;
    }catch{
        return value;
    }
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

    return response.json();
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

    const category=txt(
        raw.category||
        raw.category_name||
        raw.group||
        context.category,
        "Uncategorized"
    );

    const href=absoluteURL(
        raw.href||
        raw.url||
        raw.page||
        raw.path||
        `/projects/${id}/`,
        context.url
    );

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
            context.url
        ),

        cover:absoluteURL(
            raw.cover||
            raw.cover_image||
            raw.image||
            raw.thumbnail||
            raw.hero_image,
            context.url
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

        featured:Boolean(
            raw.featured||
            raw.is_featured
        ),

        tags:arr(
            raw.tags||
            raw.keywords||
            raw.technologies||
            raw.stack
        ).map(tag=>{
            if(typeof tag==="object"){
                return txt(
                    tag.name||
                    tag.label||
                    tag.title
                );
            }
            return txt(tag);
        }).filter(Boolean)
    };
}

function extractProjects(manifest,context){

    const source=[
        manifest.projects,
        manifest.items,
        manifest.entries,
        manifest.data,
        manifest.records
    ].find(Array.isArray)||[];

    return source.map(item=>normalizeProject(item,context));
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
            links.push({
                name:"",
                url:absoluteURL(item,base)
            });
            continue;
        }

        if(!item||typeof item!=="object")
            continue;

        const value=
            item.manifest||
            item.manifest_url||
            item.url||
            item.href||
            item.path||
            item.src;

        if(!value)
            continue;

        if(!/\.json(?:$|\?)/i.test(value))
            continue;

        links.push({
            name:txt(
                item.name||
                item.title||
                item.label||
                item.slug
            ),
            url:absoluteURL(value,base)
        });
    }

    return links;
}

 function addProjects(projects){

    for(const project of projects){

        const key=`${project.category}::${project.id}::${project.title}`;

        if(state.seen.has(key))
            continue;

        state.seen.add(key);
        state.projects.push(project);
    }
}

async function walkManifest(url,category="",depth=0){

    if(depth>2)
        return;

    const manifest=await fetchJSON(url);

    addProjects(
        extractProjects(manifest,{
            url,
            category
        })
    );

    const children=extractManifestLinks(manifest,url);

    const results=await Promise.allSettled(
        children.map(child=>
            walkManifest(
                child.url,
                child.name||category,
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

function createTagList(tags){

    if(!tags.length)
        return "";

    return `
        <ul class="tag-list">
            ${tags.slice(0,8).map(tag=>`<li>${esc(tag)}</li>`).join("")}
        </ul>
    `;
}

function createCard(project,mode){

    const href=mode==="portfolio"
        ?project.portfolioHref
        :project.href;

    const image=project.cover
        ?`<img src="${esc(project.cover)}"
              alt="${esc(project.title)} cover"
              class="project-cover"
              loading="lazy"
              decoding="async">`
        :"";

    const date=project.date
        ?`<p class="project-meta">${esc(project.date)}</p>`
        :"";

    return `
        <article
            class="project-card"
            data-project-category="${esc(project.category)}"
            data-project-status="${esc(project.status)}">

            ${image}

            <div class="project-card-header">
                <p class="project-status">${esc(project.status)}</p>
                <h3>${esc(project.title)}</h3>
            </div>

            <p>${esc(project.summary)}</p>

            ${date}

            ${createTagList(project.tags)}

            <a href="${esc(href)}">
                ${mode==="portfolio"
                    ?"View portfolio entry"
                    :"View project"}
            </a>

        </article>
    `;
}

function updateCount(id,count){

    const element=document.getElementById(id);

    if(!element)
        return;

    element.textContent=
        `${count} project${count===1?"":"s"} loaded`;
}

function renderFilters(projects,target){

    if(!target)
        return;

    const categories=[
        ...new Set(
            projects
                .map(project=>project.category)
                .filter(Boolean)
        )
    ].sort();

    target.innerHTML=
        `<button class="button project-filter is-active"
                 type="button"
                 data-project-filter="all">
            All
        </button>`+
        categories.map(category=>`
            <button
                class="button secondary project-filter"
                type="button"
                data-project-filter="${esc(category)}">
                ${esc(category)}
            </button>
        `).join("");

    target.addEventListener("click",event=>{

        const button=
            event.target.closest("[data-project-filter]");

        if(!button)
            return;

        const filter=button.dataset.projectFilter;

        target
            .querySelectorAll("[data-project-filter]")
            .forEach(item=>{
                item.classList.toggle(
                    "is-active",
                    item===button
                );
            });

        document
            .querySelectorAll("[data-project-category]")
            .forEach(card=>{

                card.hidden=
                    filter!=="all" &&
                    card.dataset.projectCategory!==filter;

            });

    });

}

 function renderProjectsPage(projects){
    const grid=document.getElementById("manifest-project-grid");
    if(!grid)return;

    grid.innerHTML=projects
        .map(project=>createCard(project,"projects"))
        .join("");

    grid.setAttribute("aria-busy","false");

    updateCount(
        "manifest-project-count",
        projects.length
    );

    renderFilters(
        projects,
        document.getElementById("manifest-project-filters")
    );
}

function renderPortfolioPage(projects){
    const grid=document.getElementById("manifest-portfolio-grid");
    if(!grid)return;

    grid.innerHTML=projects
        .map(project=>createCard(project,"portfolio"))
        .join("");

    grid.setAttribute("aria-busy","false");

    updateCount(
        "manifest-portfolio-count",
        projects.length
    );

    renderFilters(
        projects,
        document.getElementById("manifest-portfolio-filters")
    );
}

function setStatus(success,message){
    const ids=[
        "manifest-project-status",
        "manifest-portfolio-status"
    ];

    for(const id of ids){
        const target=document.getElementById(id);

        if(!target)continue;

        target.innerHTML=`
            <div class="notice ${success?"info":"warning"}">
                <strong>
                    ${success
                        ?"Manifest synchronized"
                        :"Manifest unavailable"}
                </strong>
                <p>${esc(message)}</p>
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded",async()=>{

    try{

        await walkManifest(ROOT);

        state.projects.sort((a,b)=>{

            if(a.featured!==b.featured){
                return Number(b.featured)-Number(a.featured);
            }

            const categoryCompare=
                a.category.localeCompare(b.category);

            if(categoryCompare!==0){
                return categoryCompare;
            }

            return a.title.localeCompare(b.title);
        });

        renderProjectsPage(state.projects);
        renderPortfolioPage(state.projects);

        if(state.errors.length){
            setStatus(
                true,
                `Project data loaded, but ${state.errors.length} subordinate manifest request${state.errors.length===1?"":"s"} failed.`
            );
        }else{
            setStatus(
                true,
                "Project data loaded from the ZZX-Labs project manifests."
            );
        }

    }catch(error){

        console.error(
            "Unable to load ZZX-Labs project manifests:",
            error
        );

        setStatus(
            false,
            `${error.message}. Verify that zzx-labs.io permits cross-origin requests from https://0xdeadbeef.in.`
        );

        const projectGrid=
            document.getElementById("manifest-project-grid");

        const portfolioGrid=
            document.getElementById("manifest-portfolio-grid");

        const fallback=`
            <article class="info-panel">
                <h3>Project manifest unavailable</h3>
                <p>
                    The project archive could not be loaded.
                    Verify the manifest URL, JSON structure,
                    server permissions, and CORS configuration.
                </p>
            </article>
        `;

        if(projectGrid){
            projectGrid.innerHTML=fallback;
            projectGrid.setAttribute("aria-busy","false");
        }

        if(portfolioGrid){
            portfolioGrid.innerHTML=fallback;
            portfolioGrid.setAttribute("aria-busy","false");
        }
    }

});

})();
