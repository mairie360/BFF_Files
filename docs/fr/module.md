# BFF_Files — Présentation du module

[Documentation technique](technical.md) · [English](../en/module.md) · [README](../../README.md)

Exposer la bibliothèque documentaire de l’utilisateur et les opérations sur les fichiers au web service. Le BFF regroupe fichiers, catégories et identité, tout en conservant les permissions fournies par Files API.

## Public et utilité

Les agents consultant, déposant ou supprimant des documents dans leur périmètre autorisé.

Domaine fonctionnel: Bibliothèque de fichiers.

## Fonctions disponibles

- Bibliothèque avec catégories, propriétaire, taille, date de modification et actions autorisées.
- Dépôt multipart, consultation des métadonnées, téléchargement et suppression.
- Adaptateurs de création et suppression de partages au niveau BFF.

## Parcours type

1. Charger `/files/bootstrap` pour obtenir la liste et les permissions.
2. Déposer un fichier si `canUpload` le permet, ou choisir une action autorisée sur un fichier.
3. Attendre le résultat du serveur et recharger la bibliothèque après une mutation.

## Place dans Mairie360

Dépôts associés: [Files_Web_Service](https://github.com/mairie360/Files_Web_Service).

Ce dépôt contient le serveur BFF et son contrat. Les web services associés portent les écrans; le BFF adapte les données et les règles serveur nécessaires à ces écrans.

## Données et état actuel

Le bootstrap lit Files API `/api/v1/files/`, `/api/v1/file-categories/` et Core `/api/v1/user/me/`. Files API fournit `canUpload` et `allowedActions`. Le BFF transmet les octets et les métadonnées; il ne stocke pas durablement les fichiers et ne remplace pas une réponse absente par des données de démonstration.

## Périmètre et limites

Les routes et la persistance de Files API doivent être disponibles dans le déploiement. Les uploads sont limités à 20 MiB côté BFF. Le web service masque le partage tant qu’un sélecteur de destinataire n’est pas disponible, même si les routes BFF existent.

## Pour développer ou exploiter ce module

Le [guide technique](technical.md) détaille architecture, configuration, routes, session, persistance, tests et CI/CD. Il décrit les sources de vérité et les étapes de synchronisation des contrats avec les dépôts associés.
