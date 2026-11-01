import {fr} from './fr';
export type MessageKey=keyof typeof fr;
export const initialLocale='fr' as const;
export function message(key:MessageKey):string{return fr[key];}
export const dateTime=(value:string)=>new Intl.DateTimeFormat(initialLocale,{dateStyle:'short',timeStyle:'short'}).format(new Date(value));
