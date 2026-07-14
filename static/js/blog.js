"use strict";

(() => {
    const BLOG_MANIFEST_URL="/blog/blog.json";

    const state={
        posts:[],
        activeFilter:"all",
        query:""
    };

    const elements={};

    function text(value,fallback=""){
        if(value===null||value===undefined){
            return fallback;
        }

        return String(value);
    }

    function normalize(value){
        return text(value)
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g,"")
            .replace(/[_\s]+/g," ")
            .trim();
    }

    function slug(value){
        return normalize(value)
            .replace(/[^a-z0-9]+/g,"-")
            .replace(/^-+|-+$/g,"");
    }

    function asArray(value){
        if(Array.isArray(value)){
            return value;
        }

        if(value===null||value===undefined||value===""){
            return[];
        }

        return[value];
    }

    function uniqueStrings(values){
        const output=[];
        const seen=new Set();

        for(const value of values){
            const item=text(value).trim();

            if(!item){
                continue;
            }

            const key=normalize(item);

            if(seen.has(key)){
                continue;
            }

            seen.add(key);
            output.push(item);
        }

        return output;
    }

    function parseDate(value){
        const date=new Date(value);

        return Number.isNaN(date.getTime())
            ?null
            :date;
    }

    function formatDate(value){
        const date=parseDate(value);

        if(!date){
            return text(value,"Unknown");
        }

        return new Intl.DateTimeFormat(
            "en-US",
            {
                year:"numeric",
                month:"long",
                day:"numeric",
                hour:"2-digit",
                minute:"2-digit",
                timeZoneName:"short"
            }
        ).format(date);
    }

    function normalizePost(raw){
        const number=text(raw.number).padStart(4,"0");
        const title=text(
            raw.title,
            `Post ${number}`
        );

        const category=text(
            raw.category,
            "Uncategorized"
        );

        return{
            number,
            title,
            subtitle:text(raw.subtitle),
            summary:text(
                raw.summary,
                "No summary is currently available."
            ),
            published:text(raw.published),
            updated:text(raw.updated),
            author:text(raw.author,"0xdeadbeef"),
            category,
            tags:uniqueStrings(asArray(raw.tags)),
            status:text(raw.status,"Published"),
            url:text(
                raw.url,
                `/blog/blog_posts/post_${number}/`
            ),
            textUrl:text(
                raw.text_url,
                `/blog/blog_posts/post_${number}/post.txt`
            ),
            metadataUrl:text(
                raw.metadata_url,
                `/blog/blog_posts/post_${number}/metadata.json`
            ),
            publishedToIndex:
                raw.published_to_index!==false&&
                raw.published!==false
        };
    }

    function buildSearchText(post){
        return normalize([
            post.number,
            post.title,
            post.subtitle,
            post.summary,
            post.published,
            post.updated,
            post.author,
            post.category,
            post.status,
            ...post.tags
        ].join(" "));
    }

    function postMatchesFilter(post){
        if(state.activeFilter==="all"){
            return true;
        }

        const category=slug(post.category);
        const tags=post.tags.map(tag=>slug(tag));

        return(
            category===state.activeFilter||
            category.includes(state.activeFilter)||
            tags.includes(state.activeFilter)
        );
    }

    function postMatchesSearch(post){
        if(!state.query){
            return true;
        }

        return buildSearchText(post).includes(state.query);
    }

    function sortPosts(posts){
        return[...posts].sort((a,b)=>{
            const dateA=parseDate(a.published);
            const dateB=parseDate(b.published);

            if(dateA&&dateB){
                const dateDifference=
                    dateB.getTime()-
                    dateA.getTime();

                if(dateDifference!==0){
                    return dateDifference;
                }
            }

            return b.number.localeCompare(
                a.number,
                undefined,
                {
                    numeric:true,
                    sensitivity:"base"
                }
            );
        });
    }

    function collectCategories(posts){
        const categoryMap=new Map();

        for(const post of posts){
            const category=text(post.category).trim();

            if(!category){
                continue;
            }

            const key=slug(category);

            if(!key||categoryMap.has(key)){
                continue;
            }

            categoryMap.set(key,category);
        }

        return[...categoryMap.entries()]
            .sort((a,b)=>
                a[1].localeCompare(
                    b[1],
                    undefined,
                    {
                        sensitivity:"base",
                        numeric:true
                    }
                )
            );
    }

    function renderFilters(){
        if(!elements.filterButtons){
            return;
        }

        const categories=collectCategories(state.posts);

        elements.filterButtons.replaceChildren();

        const allButton=document.createElement("button");

        allButton.className=
            "button small blog-filter is-active";
        allButton.type="button";
        allButton.dataset.blogFilter="all";
        allButton.setAttribute("aria-pressed","true");
        allButton.textContent="All";

        elements.filterButtons.appendChild(allButton);

        for(const[filterValue,label]of categories){
            const button=document.createElement("button");

            button.className=
                "button small secondary blog-filter";
            button.type="button";
            button.dataset.blogFilter=filterValue;
            button.setAttribute("aria-pressed","false");
            button.textContent=label;

            elements.filterButtons.appendChild(button);
        }
    }

    function updateFilterButtons(){
        if(!elements.filterButtons){
            return;
        }

        elements.filterButtons
            .querySelectorAll("[data-blog-filter]")
            .forEach(button=>{
                const isActive=
                    button.dataset.blogFilter===
                    state.activeFilter;

                button.classList.toggle(
                    "is-active",
                    isActive
                );

                button.classList.toggle(
                    "secondary",
                    !isActive
                );

                button.setAttribute(
                    "aria-pressed",
                    String(isActive)
                );
            });
    }

    function setOptionalText(
        root,
        selector,
        value
    ){
        const element=root.querySelector(selector);

        if(!element){
            return;
        }

        const normalized=text(value).trim();

        element.textContent=normalized;
        element.hidden=!normalized;
    }

    function setLink(
        root,
        selector,
        href
    ){
        const element=root.querySelector(selector);

        if(!element){
            return;
        }

        const value=text(href).trim();

        if(!value){
            element.hidden=true;
            element.removeAttribute("href");
            return;
        }

        element.hidden=false;
        element.href=value;
    }

    function renderTags(root,tags){
        const list=root.querySelector(
            ".blog-card-tags"
        );

        if(!list){
            return;
        }

        list.replaceChildren();

        if(!tags.length){
            list.hidden=true;
            return;
        }

        list.hidden=false;

        for(const tag of tags){
            const item=document.createElement("li");

            item.textContent=tag;
            list.appendChild(item);
        }
    }

    function createPostCard(post){
        const fragment=
            elements.template.content.cloneNode(true);

        const article=fragment.querySelector(
            ".blog-card"
        );

        const title=fragment.querySelector(
            ".blog-card-title"
        );

        const date=fragment.querySelector(
            ".blog-card-date"
        );

        article.dataset.blogCategory=
            slug(post.category);

        article.dataset.blogSearch=
            buildSearchText(post);

        setOptionalText(
            fragment,
            ".blog-card-status",
            post.status
        );

        setOptionalText(
            fragment,
            ".blog-card-number",
            post.number
        );

        setOptionalText(
            fragment,
            ".blog-card-category",
            post.category
        );

        setOptionalText(
            fragment,
            ".blog-card-author",
            post.author
        );

        setOptionalText(
            fragment,
            ".blog-card-subtitle",
            post.subtitle
        );

        setOptionalText(
            fragment,
            ".blog-card-summary",
            post.summary
        );

        title.textContent=post.title;
        title.href=post.url;

        date.textContent=formatDate(
            post.published
        );

        if(post.published){
            date.dateTime=post.published;
        }else{
            date.removeAttribute("datetime");
        }

        setLink(
            fragment,
            ".blog-card-read",
            post.url
        );

        setLink(
            fragment,
            ".blog-card-text",
            post.textUrl
        );

        setLink(
            fragment,
            ".blog-card-metadata",
            post.metadataUrl
        );

        renderTags(
            fragment,
            post.tags
        );

        return fragment;
    }

    function visiblePosts(){
        return state.posts.filter(post=>
            postMatchesFilter(post)&&
            postMatchesSearch(post)
        );
    }

    function renderPosts(){
        const posts=visiblePosts();

        elements.grid.replaceChildren();

        for(const post of posts){
            elements.grid.appendChild(
                createPostCard(post)
            );
        }

        elements.grid.setAttribute(
            "aria-busy",
            "false"
        );

        elements.status.textContent=
            `${posts.length} ${
                posts.length===1
                    ?"post"
                    :"posts"
            } displayed.`;

        if(!posts.length){
            const empty=document.createElement(
                "article"
            );

            empty.className="notice warning";

            const title=document.createElement(
                "strong"
            );

            title.textContent="No posts found";

            const body=document.createElement("p");

            body.textContent=
                "Change the active category or search query.";

            empty.append(title,body);
            elements.grid.appendChild(empty);
        }
    }

    function renderManifestMeta(manifest){
        if(!elements.manifestMeta){
            return;
        }

        const version=text(
            manifest.version,
            "unknown"
        );

        const updated=formatDate(
            manifest.updated
        );

        elements.manifestMeta.textContent=
            `${state.posts.length} ${
                state.posts.length===1
                    ?"published post"
                    :"published posts"
            } indexed · Manifest version ${version} · Updated ${updated}`;
    }

    function renderFailure(error){
        console.error(
            "Unable to load blog manifest:",
            error
        );

        elements.status.textContent=
            "The blog index could not be loaded.";

        elements.grid.replaceChildren();

        const notice=document.createElement(
            "article"
        );

        notice.className="notice error";

        const title=document.createElement(
            "strong"
        );

        title.textContent=
            "Blog index unavailable";

        const body=document.createElement("p");

        body.textContent=
            "Verify that /blog/blog.json exists, contains valid JSON, and is being served over HTTP or HTTPS.";

        notice.append(title,body);
        elements.grid.appendChild(notice);

        elements.grid.setAttribute(
            "aria-busy",
            "false"
        );

        if(elements.manifestMeta){
            elements.manifestMeta.textContent=
                error instanceof Error
                    ?error.message
                    :"Manifest unavailable.";
        }
    }

    async function loadBlogManifest(){
        const response=await fetch(
            BLOG_MANIFEST_URL,
            {
                method:"GET",
                credentials:"same-origin",
                cache:"no-store",
                headers:{
                    Accept:"application/json"
                }
            }
        );

        if(!response.ok){
            throw new Error(
                `Unable to load blog.json: HTTP ${response.status}`
            );
        }

        const body=await response.text();

        if(!body.trim()){
            throw new Error(
                "blog.json is empty."
            );
        }

        let manifest;

        try{
            manifest=JSON.parse(body);
        }catch(error){
            throw new Error(
                `blog.json contains invalid JSON: ${error.message}`
            );
        }

        if(
            !manifest||
            typeof manifest!=="object"||
            !Array.isArray(manifest.posts)
        ){
            throw new Error(
                "blog.json does not contain a posts array."
            );
        }

        state.posts=sortPosts(
            manifest.posts
                .filter(post=>
                    post&&
                    typeof post==="object"
                )
                .map(normalizePost)
                .filter(post=>
                    post.publishedToIndex
                )
        );

        renderFilters();
        renderManifestMeta(manifest);
        renderPosts();
    }

    function bindEvents(){
        elements.filterButtons.addEventListener(
            "click",
            event=>{
                const button=event.target.closest(
                    "[data-blog-filter]"
                );

                if(!button){
                    return;
                }

                state.activeFilter=
                    button.dataset.blogFilter||
                    "all";

                updateFilterButtons();
                renderPosts();
            }
        );

        elements.search.addEventListener(
            "input",
            ()=>{
                state.query=normalize(
                    elements.search.value
                );

                renderPosts();
            }
        );

        elements.search.addEventListener(
            "search",
            ()=>{
                state.query=normalize(
                    elements.search.value
                );

                renderPosts();
            }
        );
    }

    function initialize(){
        elements.grid=document.getElementById(
            "blog-post-grid"
        );

        elements.template=document.getElementById(
            "blog-card-template"
        );

        elements.status=document.getElementById(
            "blog-status"
        );

        elements.search=document.getElementById(
            "blog-search"
        );

        elements.filterButtons=document.getElementById(
            "blog-filter-buttons"
        );

        elements.manifestMeta=document.getElementById(
            "blog-manifest-meta"
        );

        if(
            !elements.grid||
            !elements.template||
            !elements.status||
            !elements.search||
            !elements.filterButtons
        ){
            return;
        }

        bindEvents();

        void loadBlogManifest()
            .catch(renderFailure);
    }

    if(document.readyState==="loading"){
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {once:true}
        );
    }else{
        initialize();
    }
})();
