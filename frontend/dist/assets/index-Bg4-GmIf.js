var p=Object.defineProperty;var m=(o,n,t)=>n in o?p(o,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[n]=t;var l=(o,n,t)=>m(o,typeof n!="symbol"?n+"":n,t);(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))i(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function t(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?r.credentials="include":e.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(e){if(e.ep)return;e.ep=!0;const r=t(e);fetch(e.href,r)}})();const y=o=>o.raw[0];class v extends HTMLElement{constructor(){super();l(this,"Scheduler",new b);l(this,"eventBuffer");l(this,"appState",{tableDomFlush:!1,searchQuery:""});this.attachShadow({mode:"open"}),this.eventBuffer=new Array(300).fill({id:"",name:"",date:"",type:""})}connectedCallback(){this.Scheduler.add(()=>this.renderLoadingAnimation()),this.Scheduler.add(()=>this.fetchDataToBuffer())}levensteinDistanceForBuffer(){const t=this.appState.searchQuery,i=t.length,e=this.eventBuffer;for(let r=0;r<e.length;r++){const s=e[r];if(!s||s.name==="")break;const u=s.name,c=u.length,d=Array(c+1).fill(null).map(()=>Array(i+1).fill(0));for(let a=0;a<=c;a++)d[a][0]=a;for(let a=0;a<=i;a++)d[0][a]=a;for(let a=1;a<=c;a++)for(let h=1;h<=i;h++){const f=u[a-1]===t[h-1]?0:1;d[a][h]=Math.min(d[a-1][h]+1,d[a][h-1]+1,d[a-1][h-1]+f)}s.distance=d[c][i]}e.sort((r,s)=>r.distance-s.distance)}async fetchDataToBuffer(){try{const t=await fetch("http://localhost:3000/events");if(!t.ok)throw new Error("Failed to fetch data");(await t.json()).forEach((e,r)=>{this.eventBuffer[r]=e}),this.Scheduler.add(()=>this.renderDashboardUI())}catch(t){this.Scheduler.add(()=>this.renderErrorUI(t instanceof Error?t.message:"Failed to fetch data"))}}renderDashboardUI(){setTimeout(()=>{const t=this.shadowRoot.querySelector("#event-search");t.addEventListener("keydown",i=>{i.key==="Enter"&&(this.appState.searchQuery=t.value,this.Scheduler.add(()=>this.levensteinDistanceForBuffer()),this.Scheduler.add(()=>this.renderDashboardTable()))}),this.appState.tableDomFlush=!0},0),this.shadowRoot.innerHTML=`
            <div part="dashboard-body">
                <div style="width: 100%;">
                    <input
                        part="event-search"
                        id="event-search"
                        type="text"
                        placeholder="Search ..."
                    />
                    ${this.renderDashboardTable()}
                </div>
                ${this.renderDashboardForm()}
            </div>
        `}renderDashboardTable(){let t='<div part="table" id="event-list">';const i="</div>";e:for(let e=0;e<this.eventBuffer.length;e++){const r=this.eventBuffer[e];if(!r||r.name==="")break e;const s=r.date.split("-");t+=`
                <div part="card" id="${r.id}">
                    <span>${r.name}</span>
                    <span>${`${s[2]}.${s[1]}.${s[0]}`}</span>
                    <span>${r.type}</span>
                    <span href="" part="delete-button">Delete</span>
                </div>
            `}if(this.appState.tableDomFlush){const e=this.shadowRoot.querySelector("#event-list");for(;e!=null&&e.firstChild;)e.removeChild(e.firstChild);e.innerHTML=t+i}return t+i}renderDashboardForm(){return y`
            <div part="form">
                <input part="input" type="text" placeholder="Event name" />
                <input part="input" type="date" placeholder="Event date" />
                <select part="select" name="event-type">
                    <option value="birthday">Birthday</option>
                    <option value="wedding">Wedding</option>
                    <option value="party">Party</option>
                </select>
                <button part="button" type="submit">Create event</button>
            </div>
        `}renderErrorUI(t){this.shadowRoot.innerHTML=`<p part="err-msg">${t}</p>`}renderLoadingAnimation(){this.shadowRoot.innerHTML="<div part='loading' />"}}class b{constructor(){l(this,"queue",[]);l(this,"running",!1)}add(n){this.queue.push(n),this.running||this.runNext()}async runNext(){if(this.queue.length===0){this.running=!1;return}this.running=!0;const n=this.queue.shift();try{n&&n()}catch(t){console.error(t)}finally{this.running=!1,this.runNext()}}}customElements.define("dashboard-component",v);
