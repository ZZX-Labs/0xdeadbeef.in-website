"use strict";

(() => {
    const METADATA_URL="./metadata.json";
    const POST_URL="./post.txt";
    const BLOG_INDEX_URL="/blog/blog.json";

    const elements={};

    function text(value,fallback=""){
        if(value===null||value===undefined){
            return fallback;
        }

        return String(value);
    }

    function escapeHTML(value){
        return text(value)
            .replaceAll("&","&amp;")
            .replaceAll("<","&lt;")
            .replaceAll(">","&gt;")
            .replaceAll('"',"&quot;")
            .replaceAll("'","&#039;");
    }

    function escapeAttribute(value){
        return escapeHTML(value);
    }

    function formatInline(value){
        let output=escapeHTML(value);

        const protectedCode=[];

        output=output.replace(
            /`([^`\n]+)`/g,
            (_match,code)=>{
                const index=protectedCode.length;

                protectedCode.push(
                    `<code>${code}</code>`
                );

                return `\u0000CODE${index}\u0000`;
            }
        );

        output=output.replace(
            /!\[([^\]]*)\]\((https?:\/\/[^)\s]+|\/[^)\s]+|\.[^)\s]+)\)/g,
            '<img src="$2" alt="$1" loading="lazy" decoding="async">'
        );

        output=output.replace(
            /\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+|bitcoin:[^)\s]+|\/[^)\s]+|\.[^)\s]+)\)/g,
            '<a href="$2" rel="noopener noreferrer">$1</a>'
        );

        output=output.replace(
            /\*\*([^*\n]+)\*\*/g,
            "<strong>$1</strong>"
        );

        output=output.replace(
            /__([^_\n]+)__/g,
            "<strong>$1</strong>"
        );

        output=output.replace(
            /~~([^~\n]+)~~/g,
            "<del>$1</del>"
        );

        output=output.replace(
            /(^|[^\*])\*([^*\n]+)\*/g,
            "$1<em>$2</em>"
        );

        output=output.replace(
            /(^|[^_])_([^_\n]+)_/g,
            "$1<em>$2</em>"
        );

        output=output.replace(
            /\u0000CODE(\d+)\u0000/g,
            (_match,index)=>
                protectedCode[Number(index)]||""
        );

        return output;
    }

    function renderPlainText(source){
        const lines=text(source)
            .replace(/\r\n?/g,"\n")
            .split("\n");

        const output=[];

        let paragraph=[];
        let unorderedList=false;
        let orderedList=false;
        let codeBlock=false;
        let codeLanguage="";
        let codeLines=[];
        let blockquote=[];

        function flushParagraph(){
            if(!paragraph.length){
                return;
            }

            output.push(
                `<p>${formatInline(
                    paragraph.join(" ")
                )}</p>`
            );

            paragraph=[];
        }

        function flushBlockquote(){
            if(!blockquote.length){
                return;
            }

            output.push(
                `<blockquote><p>${formatInline(
                    blockquote.join(" ")
                )}</p></blockquote>`
            );

            blockquote=[];
        }

        function closeUnorderedList(){
            if(!unorderedList){
                return;
            }

            output.push("</ul>");
            unorderedList=false;
        }

        function closeOrderedList(){
            if(!orderedList){
                return;
            }

            output.push("</ol>");
            orderedList=false;
        }

        function closeLists(){
            closeUnorderedList();
            closeOrderedList();
        }

        function flushText(){
            flushParagraph();
            flushBlockquote();
        }

        function closeOpenStructures(){
            flushText();
            closeLists();
        }

        for(const rawLine of lines){
            const line=rawLine;
            const trimmed=line.trim();

            if(trimmed.startsWith("```")){
                flushText();
                closeLists();

                if(!codeBlock){
                    codeBlock=true;
                    codeLanguage=trimmed.slice(3).trim();
                    codeLines=[];
                }else{
                    const languageClass=codeLanguage
                        ?` class="language-${escapeAttribute(codeLanguage)}"`
                        :"";

                    output.push(
                        `<pre><code${languageClass}>${escapeHTML(
                            codeLines.join("\n")
                        )}</code></pre>`
                    );

                    codeBlock=false;
                    codeLanguage="";
                    codeLines=[];
                }

                continue;
            }

            if(codeBlock){
                codeLines.push(line);
                continue;
            }

            if(/^---+$/.test(trimmed)){
                closeOpenStructures();
                output.push("<hr>");
                continue;
            }

            if(/^###\s+/.test(line)){
                closeOpenStructures();

                output.push(
                    `<h3>${formatInline(
                        line.replace(/^###\s+/,"")
                    )}</h3>`
                );

                continue;
            }

            if(/^##\s+/.test(line)){
                closeOpenStructures();

                output.push(
                    `<h2>${formatInline(
                        line.replace(/^##\s+/,"")
                    )}</h2>`
                );

                continue;
            }

            if(/^#\s+/.test(line)){
                closeOpenStructures();

                output.push(
                    `<h2>${formatInline(
                        line.replace(/^#\s+/,"")
                    )}</h2>`
                );

                continue;
            }

            if(/^>\s?/.test(line)){
                flushParagraph();
                closeLists();

                blockquote.push(
                    line.replace(/^>\s?/,"").trim()
                );

                continue;
            }

            if(/^[-*]\s+/.test(line)){
                flushText();
                closeOrderedList();

                if(!unorderedList){
                    output.push("<ul>");
                    unorderedList=true;
                }

                output.push(
                    `<li>${formatInline(
                        line.replace(/^[-*]\s+/,"")
                    )}</li>`
                );

                continue;
            }

            if(/^\d+\.\s+/.test(line)){
                flushText();
                closeUnorderedList();

                if(!orderedList){
                    output.push("<ol>");
                    orderedList=true;
                }

                output.push(
                    `<li>${formatInline(
                        line.replace(/^\d+\.\s+/,"")
                    )}</li>`
                );

                continue;
            }

            if(trimmed===""){
                closeOpenStructures();
                continue;
            }

            closeLists();
            flushBlockquote();
            paragraph.push(trimmed);
        }

        if(codeBlock){
            const languageClass=codeLanguage
                ?` class="language-${escapeAttribute(codeLanguage)}"`
                :"";

            output.push(
                `<pre><code${languageClass}>${escapeHTML(
                    codeLines.join("\n")
                )}</code></pre>`
            );
        }

        closeOpenStructures();

        return output.join("\n");
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
            return text(value,"—");
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

    function setText(id,value,fallback="—"){
        const element=document.getElementById(id);

        if(!element){
            return;
        }

        const normalized=text(value).trim();

        element.textContent=
            normalized||fallback;

        if(
            id==="post-subtitle"&&
            !normalized
        ){
            element.hidden=true;
        }
    }

    function setTime(id,value){
        const element=document.getElementById(id);

        if(!element){
            return;
        }

        element.textContent=formatDate(value);

        if(value){
            element.dateTime=value;
        }else{
            element.removeAttribute("datetime");
        }
    }

    function setLink(id,url){
        const element=document.getElementById(id);
        const normalized=text(url).trim();

        if(!element){
            return;
        }

        if(!normalized){
            element.hidden=true;
            element.removeAttribute("href");
            return;
        }

        element.href=normalized;
        element.hidden=false;
    }

    function setMeta(selector,value){
        const element=document.querySelector(selector);
        const normalized=text(value).trim();

        if(element&&normalized){
            element.setAttribute("content",normalized);
        }
    }

    function setCanonical(url){
        const canonical=document.getElementById(
            "post-canonical"
        );

        if(canonical){
            canonical.href=url;
        }

        const ogUrl=document.querySelector(
            'meta[property="og:url"]'
        );

        if(ogUrl){
            ogUrl.content=url;
        }
    }

    function renderTags(tags){
        const list=document.getElementById("post-tags");

        if(!list){
            return;
        }

        list.replaceChildren();

        if(!Array.isArray(tags)||!tags.length){
            list.hidden=true;
            return;
        }

        list.hidden=false;

        for(const tag of tags){
            const item=document.createElement("li");

            item.textContent=text(tag);
            list.appendChild(item);
        }
    }

    function updateMetadata(metadata){
        const title=text(
            metadata.title,
            "Untitled Post"
        );

        const summary=text(
            metadata.summary,
            "Blog post by 0xdeadbeef."
        );

        const canonicalURL=new URL(
            "./",
            window.location.href
        ).href;

        document.title=`${title} | 0xdeadbeef`;

        setMeta(
            'meta[name="description"]',
            summary
        );

        setMeta(
            'meta[name="author"]',
            metadata.author||"0xdeadbeef"
        );

        setMeta(
            'meta[property="og:title"]',
            title
        );

        setMeta(
            'meta[property="og:description"]',
            summary
        );

        setMeta(
            'meta[name="twitter:title"]',
            title
        );

        setMeta(
            'meta[name="twitter:description"]',
            summary
        );

        setCanonical(canonicalURL);

        setText(
            "post-category",
            metadata.category,
            "Blog"
        );

        setText(
            "post-title",
            title,
            "Untitled Post"
        );

        setText(
            "post-subtitle",
            metadata.subtitle,
            ""
        );

        setText(
            "post-number",
            metadata.number,
            "—"
        );

        setText(
            "post-author",
            metadata.author,
            "0xdeadbeef"
        );

        setText(
            "post-revision",
            metadata.revision,
            "1.0"
        );

        setText(
            "post-status",
            metadata.status,
            "Published"
        );

        setText(
            "post-sidebar-revision",
            metadata.revision,
            "1.0"
        );

        setText(
            "post-sidebar-category",
            metadata.category,
            "Blog"
        );

        setText(
            "post-sidebar-author",
            metadata.author,
            "0xdeadbeef"
        );

        setText(
            "post-license",
            metadata.license,
            "All rights reserved unless otherwise stated."
        );

        setText(
            "post-hash-algorithm",
            metadata.hash_algorithm,
            "Not published"
        );

        setText(
            "post-hash",
            metadata.hash,
            "Not published"
        );

        setTime(
            "post-published",
            metadata.published
        );

        setTime(
            "post-updated",
            metadata.updated||
            metadata.published
        );

        setTime(
            "post-sidebar-published",
            metadata.published
        );

        setTime(
            "post-sidebar-updated",
            metadata.updated||
            metadata.published
        );

        renderTags(metadata.tags);

        const textURL=text(
            metadata.text_url,
            "./post.txt"
        );

        const metadataURL=text(
            metadata.metadata_url,
            "./metadata.json"
        );

        setLink(
            "post-text-link",
            textURL
        );

        setLink(
            "post-metadata-link",
            metadataURL
        );

        setLink(
            "post-file-text",
            textURL
        );

        setLink(
            "post-file-metadata",
            metadataURL
        );

        setLink(
            "post-source-link",
            metadata.source_url
        );

        setLink(
            "post-signature-link",
            metadata.signature_url
        );

        setLink(
            "post-file-source",
            metadata.source_url
        );

        setLink(
            "post-file-signature",
            metadata.signature_url
        );

        const sourceItem=document.getElementById(
            "post-file-source-item"
        );

        const signatureItem=document.getElementById(
            "post-file-signature-item"
        );

        if(sourceItem){
            sourceItem.hidden=
                !text(metadata.source_url).trim();
        }

        if(signatureItem){
            signatureItem.hidden=
                !text(metadata.signature_url).trim();
        }
    }

    async function fetchJSON(url){
        const response=await fetch(url,{
            method:"GET",
            credentials:"same-origin",
            cache:"no-store",
            headers:{
                Accept:"application/json"
            }
        });

        if(!response.ok){
            throw new Error(
                `Unable to load ${url}: HTTP ${response.status}`
            );
        }

        const body=await response.text();

        if(!body.trim()){
            throw new Error(
                `${url} is empty.`
            );
        }

        try{
            return JSON.parse(body);
        }catch(error){
            throw new Error(
                `${url} contains invalid JSON: ${error.message}`
            );
        }
    }

    async function fetchText(url){
        const response=await fetch(url,{
            method:"GET",
            credentials:"same-origin",
            cache:"no-store",
            headers:{
                Accept:"text/plain"
            }
        });

        if(!response.ok){
            throw new Error(
                `Unable to load ${url}: HTTP ${response.status}`
            );
        }

        return response.text();
    }

    function normalizePostNumber(value){
        return text(value)
            .replace(/\D/g,"")
            .padStart(4,"0");
    }

    async function loadPostNavigation(metadata){
        const navigation=document.getElementById(
            "post-navigation"
        );

        if(!navigation){
            return;
        }

        try{
            const manifest=await fetchJSON(
                BLOG_INDEX_URL
            );

            if(!Array.isArray(manifest.posts)){
                return;
            }

            const posts=manifest.posts
                .filter(post=>
                    post&&
                    post.published_to_index!==false
                )
                .sort((a,b)=>{
                    const dateA=parseDate(a.published);
                    const dateB=parseDate(b.published);

                    if(dateA&&dateB){
                        const difference=
                            dateA.getTime()-
                            dateB.getTime();

                        if(difference!==0){
                            return difference;
                        }
                    }

                    return normalizePostNumber(
                        a.number
                    ).localeCompare(
                        normalizePostNumber(b.number),
                        undefined,
                        {
                            numeric:true,
                            sensitivity:"base"
                        }
                    );
                });

            const currentNumber=normalizePostNumber(
                metadata.number
            );

            const index=posts.findIndex(post=>
                normalizePostNumber(post.number)===
                currentNumber
            );

            if(index===-1){
                return;
            }

            const previous=posts[index-1]||null;
            const next=posts[index+1]||null;

            const previousLink=document.getElementById(
                "previous-post-link"
            );

            const nextLink=document.getElementById(
                "next-post-link"
            );

            if(previous&&previousLink){
                previousLink.href=previous.url;
                previousLink.textContent=
                    `← ${text(
                        previous.title,
                        `Post ${previous.number}`
                    )}`;

                previousLink.hidden=false;
            }

            if(next&&nextLink){
                nextLink.href=next.url;
                nextLink.textContent=
                    `${text(
                        next.title,
                        `Post ${next.number}`
                    )} →`;

                nextLink.hidden=false;
            }

            navigation.hidden=
                !previous&&!next;
        }catch(error){
            console.warn(
                "Unable to build post navigation:",
                error
            );
        }
    }

    function renderFailure(error){
        console.error(
            "Unable to load blog post:",
            error
        );

        elements.content.innerHTML="";

        const notice=document.createElement("div");

        notice.className="notice error";

        const title=document.createElement("strong");

        title.textContent="Post unavailable";

        const paragraph=document.createElement("p");

        paragraph.textContent=
            "The article could not be loaded. Verify that metadata.json and post.txt exist and that the site is being served over HTTP or HTTPS.";

        notice.append(title,paragraph);
        elements.content.appendChild(notice);

        elements.content.setAttribute(
            "aria-busy",
            "false"
        );
    }

    async function initialize(){
        elements.content=document.getElementById(
            "post-content"
        );

        if(!elements.content){
            return;
        }

        try{
            const[metadata,source]=await Promise.all([
                fetchJSON(METADATA_URL),
                fetchText(POST_URL)
            ]);

            updateMetadata(metadata);

            elements.content.innerHTML=
                renderPlainText(source);

            elements.content.setAttribute(
                "aria-busy",
                "false"
            );

            void loadPostNavigation(metadata);
        }catch(error){
            renderFailure(error);
        }
    }

    if(document.readyState==="loading"){
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {once:true}
        );
    }else{
        void initialize();
    }
})();
