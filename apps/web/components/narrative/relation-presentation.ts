import {relationRules} from '@storymaster/domain';
import type {NarrativeType,RelationType,RelationAttributes} from '@storymaster/domain';
import type {RelationCreate,RelationView} from '@storymaster/contracts';
export type RelationEndpoint=RelationView['source'];
export function asRelationEndpoint(n:RelationEndpoint):RelationEndpoint{return {id:n.id,name:n.name,typeKey:n.typeKey,revision:n.revision,moduleEnabled:n.moduleEnabled,status:n.status};}
export const parentageLabels={unspecified:'Non précisée',biological:'Biologique',adoptive:'Adoptive',social:'Sociale',guardianship:'Tutelle'};
export const relationChoices:[string,RelationType,string,boolean?,RelationAttributes['parentRole']?][]=[
 ['parent_of','parent_of','est le parent de'],['child_of','parent_of','est enfant de',true],
 ['father_of','parent_of','est le père de',false,'father'],['mother_of','parent_of','est la mère de',false,'mother'],
 ['has_father','parent_of','a pour père',true,'father'],['has_mother','parent_of','a pour mère',true,'mother'],
 ['sibling_of','sibling_of','est frère ou sœur de'],['ally_of','ally_of','est allié de'],['rival_of','rival_of','est rival de'],
 ['mentor_of','mentor_of','est mentor de'],['student_of','mentor_of','est élève de',true],
 ['knows','knows','connaît'],['related_to','related_to','est lié à'],['located_in','located_in','se situe dans'],
 ['participates_in','participates_in','participe à'],['precedes','precedes','précède'],
];
export function choicesFor(type:NarrativeType,target?:NarrativeType){return relationChoices.filter(([,canonical,,inverse])=>{const rule=relationRules[canonical];return (inverse?rule.targets:rule.sources).includes(type)&&(!target||(inverse?rule.sources:rule.targets).includes(target));});}
export function relationInput(anchor:RelationEndpoint,other:RelationEndpoint,choice:string,description:string,parentage:NonNullable<RelationAttributes['parentage']>='unspecified'):RelationCreate{
 const item=choicesFor(anchor.typeKey,other.typeKey).find(([key])=>key===choice);if(!item||anchor.id===other.id)throw Error('Choisissez un lien compatible entre deux fiches différentes.');
 const [,canonical,,inverse,role]=item,[source,target]=inverse?[other,anchor]:[anchor,other];
 return {sourceRef:{id:source.id},targetRef:{id:target.id},sourceRevision:source.revision,targetRevision:target.revision,relationType:canonical,attributes:{description,...(canonical==='parent_of'?{parentage,parentRole:role??'parent'}:{})}};
}
export function otherEndpoint(r:RelationView,pov:string){return r.source.id===pov?r.target:r.source;}
export function relationWords(r:Pick<RelationView,'relationType'|'sourceObjectId'|'attributes'>,pov:string){const inverse=r.sourceObjectId!==pov;
 if(r.relationType==='parent_of'){const role=r.attributes.parentRole??'parent';return inverse?role==='father'?'a pour père':role==='mother'?'a pour mère':'est enfant de':role==='father'?'est père de':role==='mother'?'est mère de':'est parent de';}
 const forward:Record<Exclude<RelationType,'parent_of'>,string>={sibling_of:'est frère ou sœur de',ally_of:'est allié de',rival_of:'est rival de',mentor_of:'est mentor de',knows:'connaît',related_to:'est lié à',located_in:'se situe dans',participates_in:'participe à',precedes:'précède'};
 const backward:Partial<typeof forward>={mentor_of:'est élève de',knows:'est connu de',located_in:'est le lieu de',participates_in:'a pour participant',precedes:'suit'};return inverse?backward[r.relationType]??forward[r.relationType]:forward[r.relationType];
}
export function relationSentence(r:RelationView,pov:string){const from=r.source.id===pov?r.source:r.target;const words=relationWords(r,pov),name=otherEndpoint(r,pov).name;return from.name+' '+(words.endsWith(' de')&&/^[aeiouyàâäéèêëîïôöùûüœæh]/i.test(name)?words.slice(0,-3)+' d’'+name:words+' '+name);}
