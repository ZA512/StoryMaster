# ADR-0008 — Identité déléguée, autorisation et politiques par défaut

**Statut :** Proposée
**Date :** 2026-10-30
**Portée :** conception MVP, aucune implémentation.
**Références :** [PRD](../PRD.md), [domaine](../DOMAIN-MODEL.md), [architecture](../ARCHITECTURE.md), [sources](../RESEARCH-SOURCES.md).

## Synthèse

B ; OIDC web et OAuth MCP distincts ; intersection humain/client/grant/projet/plafond acteur ; revérification par cas d’usage et sous barrière transactionnelle pour écritures. Owner/admin humains approuvent/fusionnent par défaut ; auteur/relecteur proposent ; export owner/admin/author. Conversations privées à initiateur.

## Contexte

Une IA peut agir pour un owner sans recevoir toutes ses capacités ; les clients MCP et workers doivent rester attribuables et révocables.

## Forces / contraintes

Confidentialité manuscrits, projet frontière, absence de confiance en clientInfo/prompts, OAuth moderne et concurrence révocation/commande.

## Options étudiées

A : jeton utilisateur global transmis à l’agent. B : grants projet/scopes/client persistants avec plafond IA. C : clés API statiques par projet.

## Décision proposée

B ; OIDC web et OAuth MCP distincts ; intersection humain/client/grant/projet/plafond acteur ; revérification par cas d’usage et sous barrière transactionnelle pour écritures. Owner/admin humains approuvent/fusionnent par défaut ; auteur/relecteur proposent ; export owner/admin/author. Conversations privées à initiateur.

## Alternatives rejetées

A rejeté car accès global et attribution insuffisante ; C ne satisfait pas consentement/révocation/identité cliente attendus sans réinventer OAuth.

## Conséquences positives

Moindre privilège, provenance complète, révocation effective et parité des canaux.

## Conséquences négatives

AS/consentement/registre grants à exploiter ; commandes sérialisées avec changements de droits.

## Risques

Bearer volé avant révocation, modèle externe autodéclaré, accès runtime aux secrets ; résiduels à accepter explicitement avant production.

## Niveau de confiance et autorité

Principe imposé PRD AI-08/SEC ; valeurs de rôles, auto-approbation owner et confidentialité conversation recommandées, confiance moyenne avant validation produit.

## Conditions de réexamen

Nouveaux clients ou partage fin, besoin de séparation stricte des deux approbateurs, nouvelles exigences AS ; conserver plafond IA tant que MVP.

## Questions ouvertes

IdP/AS exact, durées tokens, support legacy, politique transfert owner et exposition distante.

## Critères d'acceptation du document

Options crédibles comparées ; recommandation distinguée du PRD ; statut non accepté ; conséquence durable et condition de réexamen explicites ; décisions ouvertes reliées au lot concerné.

## Validation partielle GO-02 du 31 octobre 2026

Rôles projet, owner unique, approbation/fusion humaines, auto-approbation owner humain, absence d’ACL par scène, clés personnelles et conversations privées sont validés. OIDC Code + PKCE, Keycloak local et sessions serveur sont acceptés ; première cible auto-hébergée Docker Compose. Les modalités OAuth/MCP, durées des grants et autres capacités futures restent proposées : cet ADR n’est pas accepté intégralement.
