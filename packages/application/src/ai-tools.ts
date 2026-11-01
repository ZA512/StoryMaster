import {z} from 'zod';
import {proposalCreateSchema,proposalSetOperationsSchema,proposalUpdateSchema,proposalActionSchema} from '@storymaster/contracts';
const id=z.string().uuid(),empty=z.strictObject({}),query=z.strictObject({query:z.string().max(200)}),target=z.strictObject({id}),proposal=z.strictObject({proposalId:id,...proposalActionSchema.shape});
export const aiToolSchemas={
 project_get_context:empty,entity_search:query,scene_read:target,entity_get:target,relation_list:target,timeline_list:empty,object_references:target,
 proposal_create:proposalCreateSchema,
 proposal_set_operations:z.strictObject({proposalId:id,expectedStateVersion:z.number().int().positive(),...proposalSetOperationsSchema.shape}),
 proposal_revise:z.strictObject({proposalId:id,expectedStateVersion:z.number().int().positive(),...proposalUpdateSchema.shape}),
 proposal_get:z.strictObject({proposalId:id}),proposal_preview:proposal,proposal_validate:proposal,
 proposal_submit:z.strictObject({proposalId:id,expectedStateVersion:z.number().int().positive(),...proposalActionSchema.shape})
};
export type AIToolName=keyof typeof aiToolSchemas;
export const aiToolDescriptions:Record<AIToolName,string>={project_get_context:'Lire uniquement l’inventaire de contexte consenti de cette exécution.',entity_search:'Recherche lexicale dans le projet, résultats limités aux sources consenties.',scene_read:'Lire une scène présente dans l’inventaire consenti.',entity_get:'Lire une fiche présente dans l’inventaire consenti.',relation_list:'Lire les relations présentes dans l’inventaire consenti.',timeline_list:'Lire les événements consentis, sans inférer de dates.',object_references:'Consulter les références consenties d’une fiche.',proposal_create:'Préparer une intention typée sans modifier le canon.',proposal_set_operations:'Créer une nouvelle révision des opérations de sa proposition.',proposal_revise:'Réviser le titre ou la justification de sa proposition.',proposal_get:'Lire sa proposition dans cette conversation.',proposal_preview:'Comparer et valider sa proposition sans l’appliquer.',proposal_validate:'Vérifier les invariants de sa proposition sans l’appliquer.',proposal_submit:'Soumettre sa proposition à une revue humaine, sans approbation ni fusion.'};
export const aiToolCatalog=Object.entries(aiToolSchemas).map(([name,schema])=>{const inputSchema=z.toJSONSchema(schema,{target:'draft-2020-12'}) as Record<string,unknown>;delete inputSchema.$schema;return {name,description:aiToolDescriptions[name as AIToolName],inputSchema};});
