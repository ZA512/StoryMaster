// Only presentation preferences and opaque selection IDs may be persisted here.
// Narrative buffers, titles, excerpts and authentication data stay out of storage.
export interface WorkshopLayout { plan: boolean; context: boolean; planWidth: number; contextWidth: number }
export const defaultLayout: WorkshopLayout = { plan: true, context: true, planWidth: 264, contextWidth: 312 };
export function parseLayout(value: string | null): WorkshopLayout {
 try {
  const p = JSON.parse(value ?? 'null');
  if (!p || typeof p.plan !== 'boolean' || typeof p.context !== 'boolean') return {...defaultLayout};
  return {plan:p.plan,context:p.context,planWidth:clamp(p.planWidth,240,320,264),contextWidth:clamp(p.contextWidth,280,360,312)};
 } catch { return {...defaultLayout}; }
}
function clamp(n: unknown, min: number, max: number, fallback: number) {return typeof n==='number' && Number.isFinite(n) ? Math.min(max,Math.max(min,Math.round(n))) : fallback;}
export const layoutKey = (userId: string) => 'storymaster.workshop.layout.v1.'+userId;
export const selectionKey = (userId: string, projectId: string) => 'storymaster.workshop.scene.v1.'+userId+'.'+projectId;
export function parseSceneId(value: string | null) {return value && /^[a-f0-9-]{36}$/i.test(value) ? value : '';}
export interface WorkshopSession {recent: string[]; scroll: Map<string,number>; expanded: Map<string,boolean>; planScroll: number}
const sessions = new Map<string,WorkshopSession>();
export function workshopSession(userId:string,projectId:string) {
 const key=userId+'/'+projectId;
 let session=sessions.get(key);
 if(!session){session={recent:[],scroll:new Map(),expanded:new Map(),planScroll:0};sessions.set(key,session);}
 return session;
}
