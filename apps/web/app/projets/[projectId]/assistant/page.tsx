import {Suspense} from 'react';
import {AssistantWorkspace} from '../../../../components/assistant/workspace';
export default function Page(){return <Suspense fallback={<p>Ouverture de votre espace privé…</p>}><AssistantWorkspace/></Suspense>;}
