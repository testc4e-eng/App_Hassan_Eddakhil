# AUDIT PASSI 02 — CONFIGURATION HARDENING — HASSAN ADDAKHIL

- Date : 2026-08-26
- Portee : variables d'environnement, reverse proxy, exposition Docker, exemples de configuration

## Resume

La phase de hardening a corrige les fuites d'information et plusieurs reglages faibles sans toucher aux donnees metier. Le projet est maintenant plus coherent avec un usage local administre.

## Fichiers examines

- `D:\3- Projets\App_Hassan_Addakhil\.env.example`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\.env.example`
- `D:\3- Projets\App_Hassan_Addakhil\docker-compose.yml`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\nginx.conf`
- `D:\3- Projets\App_Hassan_Addakhil\scripts\swat-import\import_etat_actuel_bundle.ps1`

## Corrections appliquees

### Critique

1. Suppression d'un mot de passe PostgreSQL code en dur dans `scripts/swat-import/import_etat_actuel_bundle.ps1`.
2. Remplacement par lecture obligatoire depuis `PGPASSWORD`, `DB_PASSWORD` ou `POSTGRES_PASSWORD`.

### High

1. Restriction des ports Docker sur `127.0.0.1`.
2. Ajout de headers de securite Nginx :
   - `X-Content-Type-Options`
   - `X-Frame-Options`
   - `Referrer-Policy`
   - `Permissions-Policy`
3. Ajout de blocages Nginx sur chemins/fichiers sensibles :
   - `Support_Doc_HD`
   - `archive`
   - `scripts`
   - `docker`
   - `backups`
   - extensions `.env`, `.sql`, `.dump`, `.ps1`, `.bat`

### Medium

1. Neutralisation d'emails reellement identifiables dans `.env.example` et `backend/.env.example`.
2. Normalisation d'une politique plus explicite autour des secrets obligatoires.

## Verification

- `npm run check` backend : `OK`
- `npm run check` frontend : `OK`
- Backend local sur `http://127.0.0.1:5007` : `OK`
- Frontend local sur `http://127.0.0.1:8090` : `OK`

## Risque residuel

1. Le secret JWT d'exemple reste un placeholder et doit etre remplace en environnement reel.
2. `npm audit` backend n'a pas ete lance car cela aurait envoye la metadonnee des dependances vers le registre npm ; point documente mais non force.

## Verdict

- Hardening de configuration : `APPLIQUE`
- Impact Docker : `LOCALHOST UNIQUEMENT`
- Impact base officielle `hydro_hd` : `AUCUN`
