# ADR-0018 — Contention pendant la capture d’archive

Statut : **analyse et correction proposée, non activée**. R-CONT-01 reste ouvert pour la capacité cible. La campagne Lot 7 ne démontre ni blocage permanent ni perte de données, mais une queue de latence sur les commandes exclusives.

## Mesure réellement exécutée

Sur Ryzen 5 3600X / 12 threads, 31,25 Gio de RAM, PostgreSQL 18.6 et corpus de 10 000 objets, quinze archives ZIP de 2,43–2,48 Mo ont été produites. En charge mixte : 80 autosaves, 40 commentaires, 8 merges, 120 lectures et 120 recherches ; aucune erreur ni retry. Génération p50 2 111 ms/p95 3 275 ms ; merge p50 207 ms/p95 1 674 ms (huit échantillons, aucun p99 revendiqué). Attente projet p95 3,8 ms/p99 428 ms/max 1 511 ms ; détention p95 155 ms/p99 1 690 ms/max 1 744 ms. Les autres campagnes et le rapport donnent leurs corpus distincts.

Le snapshot utilise une seule requête MVCC sous barrière projet partagée. Les autosaves indépendants continuent, mais un merge ou une révocation exigeant la barrière exclusive attend la capture. Compression ZIP et réseau restent hors transaction ; les déplacer encore ne résoudrait pas le coût SQL/JSON. La nouvelle ligne de témoin sérialise en outre les seules mutations de sécurité ; son coût de fsync n’est pas un substitut à la mesure de la barrière projet.

## Options

| Option | Conséquence | Proposition |
|---|---|---|
| Maintenir une requête bornée et le verrou actuel | Simple, cohérence et révocation déjà testées ; pics d’attente sur gros projets | Conserver au Lot 7 local avec réserve explicite |
| Snapshot de lecture dédié après admission, contrôle d’autorisation couplé au snapshot, publication/téléchargement frais | Éviter de retenir la barrière pendant toute sérialisation ; exige une primitive métier de lecture commune et des preuves de révocation/visibilité/époque | Recommandée pour qualification suivante |
| Réplique ou copie persistante du contenu pour export | Augmente exploitation, staleness et surface de sécurité | Non retenue pour l’installation personnelle |
| Supprimer la barrière ou la revalidation pour accélérer | Risque de divulgation et incohérence | Refusée |

## Critères de correction avant adoption

Prouver que l’admission et le snapshot n’accordent aucun rôle périmé après attente, que les quatre contrôles d’export et les restrictions d’historique restent identiques, qu’un snapshot ne mélange aucune révision et qu’un échec n’expose aucun ZIP partiel. Rejouer retrait/déclassement/restitution des droits, restauration d’époque, réponse perdue et charge mixte. Mesurer attente/détention projet et témoin, CPU/RAM et tailles. Aucun changement de permission, de rétention ou de promesse de capacité n’est autorisé par cet ADR seul.

## Critères d'acceptation du document

La réserve est reliée à des mesures réelles, la cause est distinguée de la compression, les alternatives préservent atomicité/révocation et l’option future reste proposée. Aucun p99 n’est tiré de huit ou quinze opérations et aucun SLA n’est déduit.
