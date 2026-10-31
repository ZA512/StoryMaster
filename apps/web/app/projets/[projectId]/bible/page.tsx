import {Suspense} from 'react';
import {BibleHome} from '../../../../components/narrative/home';
export default function Page(){return <Suspense fallback={<p role="status">Ouverture de la bible…</p>}><BibleHome/></Suspense>;}
