# ADR-0009 — Mise en œuvre du socle autorisé au Lot 0

**Statut :** Mise en œuvre des décisions GO-00..02 explicitement validées le 31 octobre 2026 ; ne vaut pas validation des lots suivants. **Références :** [décisions humaines](../HUMAN-DECISIONS.md), [ADR-0003](0003-propositions-transactionnelles.md), [rapport](../LOT-0-REPORT.md).

## Contexte et choix

Next.js/React et Fastify sont les adaptateurs TypeScript du monolithe ; PostgreSQL 18 est la source de vérité. Les packages domaine, contrats, application et infrastructure imposent une direction de dépendances vérifiée par script. Les routes HTTP appellent les cas d’usage. Le transport Next ne contient ni droit ni accès DB ; ses erreurs réseau sont normalisées sans journaliser les query strings OIDC. Les autres adaptateurs ne sont pas implémentés.

Le périmètre exécuté est celui des identités, sessions et projets. Les DTO publics excluent ownerId et les données de session internes. Les modèles de création de PROJ-10 sont des préremplissages de métadonnées (libre, roman, nouvelle), sans scène ni module futur. Archive et réactivation sont non destructives ; réactiver crée une nouvelle révision, sans restaurer silencieusement un ancien snapshot.

## Transactions et ordre des verrous

Création : session active verrouillée en partage → verrou consultatif de clé d’idempotence → projet et owner → snapshot → audit → résultat d’idempotence → commit. L’invariant owner unique correspondant au propriétaire est différable jusqu’au commit et protégé par contrainte. L’échec d’une étape annule toute la création.

Modification, archive et réactivation : prélecture d’appartenance → verrou exclusif du projet → relecture de session (verrou partagé) et d’appartenance/rôle → clé d’idempotence si présente → CAS → métadonnées, snapshot et audit → commit. Le précontrôle évite de verrouiller un projet inconnu/non autorisé ; la seconde lecture empêche de réutiliser un rôle révoqué pendant l’attente. Les futures mutations de membership devront suivre la même barrière projet. Les mutations multi-projets ne sont pas exposées. La révocation de session ne prend aucun verrou projet et attend les opérations ayant déjà validé et verrouillé leur session.

Les clés sont liées à l’utilisateur, type d’acteur, client/grant futur, action et projet. Même clé et même corps/précondition : même résultat pendant sa conservation technique (24 h) ; autre corps : 409. Les mises à jour exigent `If-Match: "rN"` (428 absent, 412 obsolète). Aucun auto-retry de mutation utilisateur sur 412 ; le navigateur conserve le brouillon. Le benchmark effectue explicitement ses propres reprises pour mesurer le coût.

Pas d’outbox au Lot 0 : aucune mutation de projet ne déclenche d’effet externe. L’échange OIDC a lieu hors transaction narrative. Introduire l’outbox transactionnelle dès le premier effet externe nécessitant cette garantie, conformément à GO-01 ; ce principe n’est pas abandonné.

## Identité et sécurité locale

OIDC Code + PKCE S256, state/nonce à usage unique, vérification RS256/JWKS, issuer, audience et expiration. L’identité est `(issuer, subject)` ; les emails identiques ne fusionnent jamais des comptes. Le fournisseur est derrière un adaptateur substituable. Le fetch OIDC est limité à l’origine configurée et peut être routé explicitement vers le nom interne Keycloak, sans modifier l’issuer public validé.

Cookie de session opaque, aléatoire, HttpOnly, SameSite=Lax, hash seul en DB ; `__Host-sm_session` avec Secure hors local. Le cookie `sm_session_local` autorise HTTP uniquement dans l’environnement loopback local explicite. Durée absolue configurable (8 h par défaut local), sans jeton OAuth dans le navigateur. Les transactions de login expirent à 10 minutes, sont consommées une fois et nettoyées à la prochaine tentative. Les ID tokens nécessaires au logout RP sont chiffrés AES-GCM côté serveur. Origin exact et token CSRF lié à la session sur toutes les mutations.

Ces durées sont des paramètres techniques locaux, pas une politique de rétention métier acceptée pour exploitation publique. Le mode Keycloak `start-dev`, les secrets d’exemple et l’absence de TLS ne constituent pas une configuration de production publique. Les autres politiques GO-03/04 restent ouvertes.

## Alternatives et conséquences

Des JWT navigateur auraient évité une table de sessions mais compliqué révocation et confidentialité ; sessions serveur retenues conformément à GO-02. Lier les identités par email est rejeté. Ajouter des tables futures pour satisfaire artificiellement les tests est rejeté. Le rôle applicatif DB n’est ni propriétaire des tables, ni superuser, ni BYPASSRLS ; audit/snapshots sont en ajout seul pour ce rôle. La RLS n’est pas activée : l’autorisation applicative centrale et l’isolation réseau sont effectives ; RLS reste une défense supplémentaire à examiner, sans en revendiquer la protection.

Le verrou projet reste provisoire. La première mesure porte sur les métadonnées et inclut les vrais conflits de la révision de ce projet. Elle ne prouve pas que deux scènes indépendantes fonctionneraient avec cette granularité. Le spike B multi-scènes du plan reste requis quand ces ressources existeront, idéalement avant la généralisation des sauvegardes au Lot 1.

## Critères d'acceptation du document

Portée déjà autorisée identifiable ; ordre des verrous, préconditions, effets externes, choix d’identité et protections effectivement présentes distingués des fonctions futures et limites ; aucune acceptation supplémentaire implicite.
