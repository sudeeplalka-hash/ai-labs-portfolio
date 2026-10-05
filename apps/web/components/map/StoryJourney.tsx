"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { STORYLINES, labHref } from "@labs/kit";
export function storyStepHref(storyId: string, index: number) {
 const story=STORYLINES.find(s=>s.id===storyId);
 if(!story || !story.steps[index]) return "/storylines";
 const step=story.steps[index];
 const base=labHref(step.labId,step.ucId);
 return `${base}${base.includes("?")?"&":"?"}story=${encodeURIComponent(storyId)}&step=${index+1}`;
}
export function StoryJourney() {
 const pathname=usePathname();
 const [context,setContext]=useState<{id:string;step:number}|null>(null);
 useEffect(()=>{
  const read=()=>{
   const params=new URLSearchParams(location.search), id=params.get("story"), step=Number(params.get("step"));
   const story=STORYLINES.find(s=>s.id===id);
   if(story && Number.isInteger(step)&&step>=1&&step<=story.steps.length && labHref(story.steps[step-1].labId).split("?")[0].replace(/\/$/,"")===pathname.replace(/\/$/,"")){
    setContext({id:story.id,step});
    try { localStorage.setItem(`portfolio-story:${story.id}`,String(step)); } catch { /* progress is optional */ }
   } else setContext(null);
  };
  read(); window.addEventListener("popstate",read);
  return ()=>window.removeEventListener("popstate",read);
 },[pathname]);
 const story=STORYLINES.find(s=>s.id===context?.id);
 if(!story||!context)return null;
 return <nav aria-label="Portfolio storyline progress" className="no-print border-b border-blue-200 bg-blue-50 px-4 py-3 text-sm"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3"><div><Link href={`/storylines#${story.id}`} className="font-semibold text-primary">{story.title}</Link><p className="mt-1 text-xs text-slatey-400">Step {context.step} of {story.steps.length} · {story.steps[context.step-1].stage}</p></div><div className="flex flex-wrap gap-3">{context.step>1&&<Link className="rounded-lg border border-blue-200 bg-white px-3 py-2" href={storyStepHref(story.id,context.step-2)}>Previous step</Link>}{context.step<story.steps.length?<Link className="rounded-lg bg-ink px-3 py-2 text-white" href={storyStepHref(story.id,context.step)}>Next step →</Link>:<Link className="rounded-lg bg-ink px-3 py-2 text-white" href="/storylines">Finish storyline</Link>}</div></div></nav>;
}
