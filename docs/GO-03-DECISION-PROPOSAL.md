# GO-03 — Fournisseurs IA, confidentialité, consentement et dépenses

**Statut : proposition à valider par le propriétaire ; aucun accord GO-03 enregistré.** **Date :** 1er novembre 2026. **Portée :** Lot 5, phase A locale autorisée ; phase B réelle interdite avant accord explicite. **Références :** [PRD](PRD.md), [sécurité](SECURITY-MODEL.md), [décisions](HUMAN-DECISIONS.md), [ADR-0014](adr/0014-assistant-integre-et-executions-bornees.md).

## Choix proposés au propriétaire

| Sujet | Recommandation | Alternatives et conséquences |
|---|---|---|
| Fournisseurs | OpenAI Responses et Anthropic Messages candidats, activation séparée et explicite | Un seul fournisseur réduit la qualification initiale ; fournisseur local possible après adaptateur/capacités vérifiés. Pas de compatibilité universelle promise. |
| Modèles | Allowlist serveur restreinte, modèles et tarifs revérifiés au moment de l’activation | Choix libre/URL libre rejeté : capacités, destinations et coûts non maîtrisés. Changer de fournisseur/modèle invalide le consentement correspondant. |
| Clés | BYOK personnel ; l’initiateur utilise exclusivement sa configuration | Clé de projet mutualisée différée : facturation et délégation différentes. Aucune autre appartenance ne donne accès à la clé. |
| Chiffrement | Enveloppe AES-256-GCM, clé de données aléatoire par credential, clé de protection versionnée hors DB via secret de configuration | KMS possible par le même port ; coût et infrastructure différés. Serveur compromis capable de déchiffrer reste une menace. |
| Rotation | Remplacement/révocation préconditionnés ; rewrapping vers une version de protection active, anciennes versions disponibles pour restauration contrôlée | Ne jamais retirer une clé de protection avant réenveloppement et vérification des sauvegardes. Aucun test automatique de connexion réelle. |
| Contexte | Sélection bornée scène/fiche, liens associés et recherche lexicale ; inventaire de sources/révisions/hash avant envoi | Tout le manuscrit par défaut rejeté. Nouvelles sources hors inventaire nécessitent une nouvelle sélection et confirmation. Aucun vecteur ni mémoire entre projets. |
| Consentement | Explicite par utilisateur/projet/fournisseur/modèle/configuration et inventaire exact de la demande ; révocable | Préférence persistante plus large à réévaluer séparément ; aucun consentement générique à l’application. |
| Échanges | Conversations privées à l’initiateur encore membre ; conservées localement, clôture logique ; pas de purge automatique | Durée de rétention configurable/documentée, purge réelle à décider avant production ; conversation exclue des exports narratifs et des propositions partagées. |
| Limites | Bornes techniques d’appels, tokens, contexte, outils, durée et concurrence, configurables côté serveur | Aucun quota commercial imposé. Prix fiable manquant : limites techniques et coût explicitement inconnu, aucune garantie monétaire inventée. |
| Budget financier | Plafond facultatif configuré ; réservation atomique de la borne maximale de l’exécution avant sa première admission, puis ledger par appel ; usage réconcilié | Si coût non bornable sous un plafond configuré, refus avant appel. Solde réservé conservé après issue inconnue ; pas de nouvelle tentative automatique. |
| Usage et coûts | Distinguer usage retourné, estimation tarifaire, coût non confirmé et état unknown | Un timeout après envoi ou une annulation ne vaut pas coût nul. Le calcul local n’est pas la facture du fournisseur. |
| Auto-hébergement | Compose, PostgreSQL et secrets locaux ; aucun service supplémentaire obligatoire pour phase A | Fournisseur réel uniquement choisi/consenti ; TLS, clés, restauration et egress de production restent à qualifier. |

## Vérification des candidats au 1er novembre 2026

Documents officiels consultés, sans appel d’inférence, compte fournisseur ni données de projet transmises. Disponibilité effective du compte, région, contrat et politiques doivent être vérifiés de nouveau avant phase B. Ces exemples ne constituent ni sélection approuvée ni tarif configuré dans l’application.

| Candidat documenté | Entrée USD / million de tokens | Sortie USD / million de tokens | Usage envisagé après validation |
|---|---:|---:|---|
| OpenAI `gpt-6.1-sol` | 2 | 10 | Premier candidat généraliste pour réponses et propositions ; qualité française à qualifier |
| OpenAI `gpt-6-luna` | 0,10 | 0,50 | Variante économique à qualifier, aucune équivalence qualitative supposée |
| Anthropic `claude-sonnet-5-5` | 2 | 10 | Premier candidat Messages avec outils ; qualification distincte |
| Anthropic `claude-haiku-5-5` | 0,10 jusqu’à 100 000 tokens de prompt | 0,50 jusqu’à ce seuil | Variante économique ; au-delà, les tarifs documentés changent (0,50/2,50) |

Tarifs texte standard observés, hors cache, batch, vitesse majorée, taxes, conversion et autres modificateurs. Pas de prix codé pour un modèle retiré ni de prix unique appliqué à toutes les options. Sources : [catalogue OpenAI](https://developers.openai.com/api/docs/models), [tarifs OpenAI](https://developers.openai.com/api/docs/pricing), [catalogue Anthropic](https://platform.claude.com/docs/en/models/overview), [tarifs Anthropic](https://platform.claude.com/docs/en/about-claude/pricing).

Responses utilise des appels de fonctions que l’application exécute et contrôle ; le schéma strict ne remplace pas l’autorisation. Messages utilise sa représentation tool_use/tool_result et ses raisons d’arrêt. Seuls ces outils applicatifs fermés sont envisagés ; aucun web search, fichier hébergé, shell, MCP distant ou code exécuté par le fournisseur. Sources : [OpenAI Function calling](https://developers.openai.com/api/docs/guides/function-calling), [Anthropic Messages](https://platform.claude.com/docs/en/build-with-claude/working-with-messages).

OpenAI documente une distinction entre état applicatif Responses, surveillance d’abus et dispositifs contractuels de rétention. `store:false` serait demandé, mais ne constitue pas une garantie de Zero Data Retention ; certains traitements et modèles ont leurs exceptions. Aucun transfert StoryMaster ne sera annoncé « sans conservation » par défaut. [Contrôles de données OpenAI](https://developers.openai.com/api/docs/guides/your-data).

Anthropic distingue aussi éligibilité ZDR, organisation, modèle et fonctionnalité ; les Covered Models ont des exigences spécifiques et l’éligibilité d’un endpoint ne prouve pas l’arrangement du compte. Vérifier les termes effectifs avant consentement réel. [Conservation API Anthropic](https://platform.claude.com/docs/en/build-with-claude/api-and-data-retention).

## Socle autorisé avant décision

Un fournisseur **simulé local déterministe**, explicitement identifié, sans intelligence générative réelle, sans réseau et n’acceptant que des clés de démonstration. Il éprouve capacités, outils, sources, budgets, annulations, erreurs et publication de propositions. Les modèles simulés sont des scénarios de qualification serveur, pas les modèles externes du tableau.

Les montants de test éventuels sont synthétiques et étiquetés tels quels ; ils ne sont ni des tarifs ni une facture. Aucun adaptateur d’inférence OpenAI/Anthropic ni endpoint arbitraire activé. Les clés réelles restent refusées par le socle phase A. Les bornes techniques de qualification restent des paramètres révisables, pas des engagements commerciaux.

## Éléments précis à valider pour phase B

1. Fournisseur(s) activé(s), modèle(s) exact(s) et environnement de test ; accès au compte et conditions de traitement vérifiés.
2. BYOK personnel et responsabilité du détenteur ; secret de protection, rotation et récupération des clés de sauvegarde.
3. Texte de consentement : projet, inventaire, fournisseur/modèle, clé utilisée, frais possibles et politique contractuelle effective.
4. Politique de conservation locale souhaitée ; aucune purge destructive implicite et aucun partage du transcript avec les membres.
5. Bornes d’appels/tokens/durée/concurrence et plafond financier éventuel ; tarifs applicables, devise et traitement des réservations unknown.
6. Autorisation d’un essai réel borné : identifiant de test fourni explicitement, contenu synthétique choisi et coût maximal accepté. L’accord GO-03 général ne vaut pas autorisation illimitée d’essais.

Sans cet accord, arrêt après présentation du socle simulé vérifié. Dérogation explicite du propriétaire au 1er novembre 2026 : Lot 6 MCP local sans modèle autorisé avant phase B, celle-ci différée après qualification humaine. GO-03 commercial reste ouvert et aucune intégration réelle n’est autorisée par cette dérogation. Les invariants canon/proposition, permissions et fusion humaine ne sont pas des options à rouvrir.

## Critères d'acceptation du document

Alternatives, recommandation et conséquences identifiables ; sources officielles datées ; consentement et prix non inventés ; simulation distinguée d’intégration réelle ; décisions et autorisation d’essai requises explicites ; aucun transfert/frais avant accord.
