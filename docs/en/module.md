# BFF_Files — Module overview

[Technical documentation](technical.md) · [Français](../fr/module.md) · [README](../../README.md)

Expose the user’s document library and file operations to the web service. The BFF combines files, categories and identity while preserving permissions supplied by Files API.

## Audience and value

Staff browsing, uploading or deleting documents within their authorized scope.

Business domain: File library.

## Available capabilities

- Library with categories, owner, size, modification date and allowed actions.
- Multipart upload, metadata lookup, download and deletion.
- BFF adapters for creating and removing shares.

## Typical workflow

1. Load `/files/bootstrap` to obtain the listing and permissions.
2. Upload when `canUpload` allows it, or choose an allowed action on a file.
3. Wait for the server result and reload the library after a mutation.

## Role within Mairie360

Associated repositories: [Files_Web_Service](https://github.com/mairie360/Files_Web_Service).

This repository contains the BFF server and its contract. Associated web services own the screens; the BFF adapts data and server rules needed by those screens.

## Data and current state

Bootstrap reads Files API `/api/v1/files/`, `/api/v1/file-categories/` and Core `/api/v1/user/me/`. Files API supplies `canUpload` and `allowedActions`. The BFF forwards bytes and metadata; it does not durably store files or replace missing responses with demo data.

## Scope and limitations

Files API routes and persistence must be available in the deployment. BFF uploads are limited to 20 MiB. The web service hides sharing until a recipient selector is available, even though BFF routes exist.

## Developing or operating this module

The [technical guide](technical.md) covers architecture, configuration, routes, session handling, persistence, tests and CI/CD. It describes sources of truth and contract synchronization with associated repositories.
