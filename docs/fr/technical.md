# BFF_Files — Documentation technique

[Présentation du module](module.md) · [English](../en/technical.md) · [README](../../README.md)

Documentation du code versionné au 7 septembre 2026, basée sur `f98be8eef769`. Les commandes ci-dessous décrivent les vérifications à effectuer; elles ne certifient pas un déploiement distant.

## Architecture et traitement des requêtes

Serveur Express 5.2.1 écrit en TypeScript. Les schémas Zod et leur registre OpenAPI décrivent les objets échangés; les routeurs adaptent les services amont aux besoins des interfaces.

`src/routes/files.ts` valide le bootstrap et relaie les opérations de bibliothèque. `src/clients/upstream.ts` transmet l’autorisation, impose un délai de 10 secondes et conserve statut, type de contenu, disposition et ETag. Les téléchargements restent binaires; une suppression 204 reste sans corps.

## Données et persistance

Le bootstrap lit Files API `/api/v1/files/`, `/api/v1/file-categories/` et Core `/api/v1/user/me/`. Files API fournit `canUpload` et `allowedActions`. Le BFF transmet les octets et les métadonnées; il ne stocke pas durablement les fichiers et ne remplace pas une réponse absente par des données de démonstration.

Les routes et la persistance de Files API doivent être disponibles dans le déploiement. Les uploads sont limités à 20 MiB côté BFF. Le web service masque le partage tant qu’un sélecteur de destinataire n’est pas disponible, même si les routes BFF existent.

## Installation et lancement local

Utiliser Node.js 22 pour reproduire le job de contrats et npm avec le fichier de verrouillage versionné. Les versions des autres jobs et de Docker sont précisées plus bas.

Les dépendances directes actuelles ne comprennent pas de client privé `@mairie360/*`. `.npmrc` conserve néanmoins la configuration du registre de cette organisation.

```bash
npm ci
```

Créer `.env` à la racine. Exemple de configuration HTTP locale à adapter aux services démarrés:

```dotenv
PORT=4005
CORE_API_URL=http://localhost:3000
FILES_API_URL=http://localhost:3005
```

```bash
npm run start
```

`PORT` est optionnel; le repli de `src/index.ts` est `4005`.

Vérifier le processus puis consulter la documentation interactive:

```bash
curl --fail --silent --show-error http://localhost:4005/health
```

Interface Swagger: `http://localhost:4005/docs`. Spécification JSON: `/openapi.json`, avec l’alias `/swagger.json`. `/health` vérifie le processus; `/check_apis` est un diagnostic distinct des dépendances.

## Configuration

Les valeurs ci-dessous sont des exemples locaux ou des comportements explicitement indiqués, pas des identifiants de production.

| Variable ou priorité | Exemple / repli indiqué | Rôle |
| --- | --- | --- |
| `PORT` | 4005 | Port de cet exemple local. |
| `CORE_API_URL` | http://localhost:3000 | Adresse de Core sans suffixe de route. |
| `FILES_API_URL` | http://localhost:3005 | Nom pluriel attendu par le client; `FILE_API_URL` n’est pas un alias. |
| `CORE_API_PORT` / `FILES_API_PORT` | — | Ports optionnels si absents des URL. |

## Routes et contrat de données

Inventaire extrait de `contracts/openapi.json`. Les paramètres entre accolades sont remplacés par des identifiants réels. Les types détaillés, champs requis, réponses et exemples éventuels sont définis dans ce contrat; les statuts du tableau sont ceux déclarés, sans prétendre lister toutes les erreurs de transport ou de validation.

| Méthode | Chemin | Corps déclaré | Statuts déclarés |
| --- | --- | --- | --- |
| GET | `/health` | — | 200 |
| GET | `/check_apis` | — | 200, 502 |
| GET | `/files/bootstrap` | — | 200, 401, 502 |
| GET | `/files` | — | 200, 201, 204, 401, 502 |
| POST | `/files` | multipart/form-data | 200, 201, 204, 401, 502 |
| GET | `/files/{fileId}` | — | 200, 201, 204, 401, 502 |
| DELETE | `/files/{fileId}` | — | 200, 201, 204, 401, 502 |
| GET | `/files/{fileId}/download` | — | 200, 201, 204, 401, 502 |
| POST | `/files/{fileId}/shares` | application/json | 200, 201, 204, 401, 502 |
| DELETE | `/files/{fileId}/shares/{shareId}` | — | 200, 201, 204, 401, 502 |

## Session, permissions et erreurs

Toutes les routes `/files` exigent un Bearer et transmettent l’identité à l’API propriétaire. Les indicateurs de permission alimentent l’interface, tandis que les contrôles effectifs restent côté serveur. Les erreurs de configuration, de transport ou de schéma ne donnent pas lieu à une sauvegarde locale.

## Synchronisation et vérifications

```bash
npm run contracts:generate
npm run contracts:check
npm test -- --runInBand
npm run lint
npm run build
```

`contracts:generate` exporte le registre runtime dans `contracts/openapi.json` et régénère `contracts/bff.d.ts`. `contracts:check` échoue si le contrat ou les types sont périmés. Exécuter ensuite `npm run contracts:sync` dans chaque web service associé et livrer les modifications de contrat ensemble.

Le générateur de types est fixé à `openapi-typescript@7.10.1` dans `scripts/contracts.mjs` et s’exécute via npm. Pour une modification uniquement documentaire, vérifier les liens, l’exactitude des deux langues et `git diff --check`; ne pas régénérer les contrats sans modification de leur source.

## CI/CD et exécution Docker

Le job `contracts.yml` utilise Node.js 22, `actions/checkout@v7` et `actions/setup-node@v7`. Il s’exécute sur push, pull request et lancement manuel; il installe avec `npm ci`, contrôle les contrats et lance les tests dédiés.

`cicd.yml` appelle `mairie360/CICD/.github/workflows/BFFs-cicd.yml@v1.13.2`, avec `cicd_version: v1.13.2` et `node_version: "22"`. Les étapes réutilisables et les environnements GitHub déterminent les contrôles, publications et déploiements effectifs.

Le Dockerfile utilise encore `node:20-alpine` pour la construction et l’exécution; la commande de l’image est `["node", "dist/index.js"]`. Cette version est distincte du job de contrats Node.js 22.

Avant un lancement Docker, vérifier les variables de service, les secrets de build et les réseaux dans les fichiers du dépôt. Une CI verte valide ses jobs; elle ne prouve pas la disponibilité des services métier dans un environnement distant.

## Diagnostic

Une configuration héritée nommée `FILE_API_URL` ne configure pas ce client: utiliser `FILES_API_URL`. Si la bibliothèque charge sans actions, vérifier les droits fournis par l’API. Si un fichier ne se télécharge pas, vérifier la route amont `/content` et ses en-têtes.

## Repères dans le dépôt

- [src/app.ts](../../src/app.ts)
- [src/routes/files.ts](../../src/routes/files.ts)
- [src/clients/upstream.ts](../../src/clients/upstream.ts)
- [contracts/openapi.json](../../contracts/openapi.json)
- [contracts/bff.d.ts](../../contracts/bff.d.ts)
- [scripts/contracts.mjs](../../scripts/contracts.mjs)
- [package.json](../../package.json)
- [.github/workflows/contracts.yml](../../.github/workflows/contracts.yml)
- [.github/workflows/cicd.yml](../../.github/workflows/cicd.yml)
- [Dockerfile](../../Dockerfile)
- [docker-compose.yml](../../docker-compose.yml)

Compléments historiques: [CONTRACT.md](../../CONTRACT.md). Les besoins proposés doivent rester distincts du comportement effectivement implémenté.
