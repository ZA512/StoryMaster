import {Suspense} from 'react';
import {Writer} from '../../../../components/writer/writer';
export default function WritingPage(){return <Suspense fallback={<p role="status">Ouverture de l’atelier…</p>}><Writer/></Suspense>;}
