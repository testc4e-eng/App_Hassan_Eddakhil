# README Project Structure

Date de mise à jour: 2026-05-13

Ce document décrit l’organisation cible du projet **Hydro-Data Intelligence – Barrage Hassan Addakhil** après nettoyage et refactoring léger.

## Objectif

L’objectif est de garder le projet:

- lisible
- maintenable
- cohérent
- facile à parcourir pour un nouveau développeur

Sans modifier:

- la logique métier
- les APIs
- les dashboards
- les calculs
- les filtres
- le comportement utilisateur

## Arborescence logique

### Racine du projet

- `hydro_Hassan dakhil/`
  - `backend/` : API Node.js / Express
  - `frontend/` : application React / Vite
  - `doc/` : documentation métier ciblée
  - `PROJECT_DOCUMENTATION/` : documentation projet complète
  - `DATABASE_DOCUMENTATION/` : documentation SQL et backup base
  - `archive/` : anciens fichiers et artefacts déplacés
  - `scripts/` : scripts utilitaires de documentation et d’analyse
  - `outputs/` : exports générés par les scripts d’analyse
  - `app web/` : composant ou outil historique annexe conservé tant qu’il n’est pas validé pour archivage

## Structure frontend

### Dossiers principaux

- `frontend/src/components/`
  - `ui/` : composants UI base shadcn
  - `charts/` : graphiques Recharts
  - `dashboard/` : navigation et modules métier
  - `map/` : carte Leaflet et couches
  - `tables/` : tableaux et grilles
  - `auth/` : login, protection, gestion utilisateurs
  - `layout/` : navbar, header, barre latérale
  - `scan/` : vues de scan de données
- `frontend/src/pages/` : pages routées
- `frontend/src/api/` : clients et helpers API
- `frontend/src/contexts/` : contextes globaux
- `frontend/src/types/` : types TypeScript métier
- `frontend/src/lib/` : helpers utilitaires
- `frontend/src/constants/` : constantes métier
- `frontend/src/config/` : configuration applicative

### Règles de nommage frontend

- composants React en `PascalCase`
- hooks en `useSomething`
- fichiers de page avec nom clair par domaine
- éviter les doublons de modules lorsqu’une version est remplacée par une autre

## Structure backend

### Dossiers principaux

- `backend/src/controllers/` : orchestration HTTP
- `backend/src/services/` : logique métier et SQL
- `backend/src/routes/` : routes Express
- `backend/src/middleware/` : auth, validation, erreurs
- `backend/src/config/` : base de données, JWT
- `backend/src/schemas/` : validation zod
- `backend/src/types/` : typage applicatif
- `backend/src/utils/` : outils transverses

### Règles de nommage backend

- controllers: `xxxController.ts`
- services: `xxx.service.ts`
- routes: `xxxRoutes.ts`
- middlewares: noms explicites et courts
- ne pas dupliquer un endpoint dans plusieurs modules sans raison claire

## Archive

Le dossier `archive/` sert à stocker:

- les anciens scripts
- les fichiers historiques
- les duplications devenues inutiles
- les versions de secours
- les documents de travail non intégrés au flux principal

## Bonnes pratiques de maintenance

1. vérifier si un fichier est encore importé avant de le déplacer
2. privilégier l’archivage plutôt que la suppression
3. garder la logique métier intacte
4. documenter tout déplacement important
5. conserver une seule source de vérité pour la base dans `DATABASE_DOCUMENTATION`

## Références associées

- `PROJECT_DOCUMENTATION/README.md`
- `DATABASE_DOCUMENTATION/README.md`
- `archive/README.md`
