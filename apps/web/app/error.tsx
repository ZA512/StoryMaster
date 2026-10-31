'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="centered"><h1>Une erreur est survenue.</h1><p>Vous pouvez réessayer sans quitter votre atelier.</p><button className="button" onClick={reset}>Réessayer</button></main>;}
