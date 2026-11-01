import {AppError} from '@storymaster/domain';
import type {AIPolicy} from '@storymaster/domain';
import type {AIBudget,AIExecution,AIUsage} from '@storymaster/contracts';
// Synthetic simulator prices only: 1/2 USD micro-units per input/output token.
// Real tariffs are deliberately absent until GO-03 and provider qualification.
export const simulatedCost=(input:number,output:number)=>input+2*output;
export class UsageBudgetService {
 reservation(policy:AIPolicy){return {calls:policy.maxCalls,tokens:policy.maxCalls*(policy.maxInputTokens+policy.maxOutputTokens),costMicros:policy.maxCalls*simulatedCost(policy.maxInputTokens,policy.maxOutputTokens)};}
 reserve(b:AIBudget,policy:AIPolicy){const r=this.reservation(policy);if(b.activeExecutions>=Math.min(policy.maxConcurrent,b.limits.maxConcurrent)||b.spent.calls+b.reserved.calls+r.calls>b.limits.maxCalls||b.spent.tokens+b.reserved.tokens+r.tokens>b.limits.maxTokens||b.limits.maxCostMicros!==null&&b.spent.costMicros+b.reserved.costMicros+r.costMicros>b.limits.maxCostMicros)throw new AppError('BUDGET_EXCEEDED','Budget ou limite de concurrence insuffisant. Aucun appel n’a été admis.',409);b.reserved.calls+=r.calls;b.reserved.tokens+=r.tokens;b.reserved.costMicros+=r.costMicros;b.activeExecutions++;b.revision++;return r;}
 settle(b:AIBudget,e:AIExecution,uncertain:boolean){const u=e.usage,tokens=u.inputTokens+u.outputTokens,cost=u.estimatedCostMicros??0;b.reserved.calls-=e.reserved.calls;b.reserved.tokens-=e.reserved.tokens;b.reserved.costMicros-=e.reserved.costMicros??0;b.spent.calls+=u.calls;b.spent.tokens+=tokens;b.spent.costMicros+=cost;if(uncertain){b.reserved.calls+=Math.max(0,e.reserved.calls-u.calls);b.reserved.tokens+=Math.max(0,e.reserved.tokens-tokens);b.reserved.costMicros+=Math.max(0,(e.reserved.costMicros??0)-cost);}b.activeExecutions--;b.revision++;}
 usage(calls:number,inputTokens:number,outputTokens:number):AIUsage{return {calls,inputTokens,outputTokens,estimatedCostMicros:simulatedCost(inputTokens,outputTokens),currency:'USD',simulated:true};}
}
