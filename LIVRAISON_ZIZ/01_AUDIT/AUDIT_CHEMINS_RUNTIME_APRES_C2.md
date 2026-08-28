# AUDIT DES CHEMINS RUNTIME APRES C2

Perimetre :

- fichiers reellement actifs pour le runtime principal frontend -> backend -> db ;
- scripts et interfaces SWAT identifies seulement lorsqu'ils impactent une fonctionnalite runtime existante ;
- archives et documentation historique exclues du verdict.

Constats globaux :

- `host.docker.internal` n'apparait pas dans le runtime principal analyse ;
- `hydro_hd_1714` n'apparait pas dans le runtime principal analyse ;
- aucune URL backend `localhost:5007` ou `127.0.0.1:5007` n'est imposee au frontend livre ;
- le fallback de donnees projet-locales est desactive en `production`.

## Dependances locales restantes

| Fichier | Ligne | Reference | Usage | Bloquant Ziz | Lot |
| --- | ---: | --- | --- | --- | --- |
| `docker-compose.yml` | 10 | `127.0.0.1:${DB_EXPOSE_PORT:-5435}:5432` | Publication host de PostgreSQL reservee a l'administration locale | Non | C1 |
| `docker-compose.yml` | 17 | `pg_isready -h 127.0.0.1` | Healthcheck interne du conteneur `db` | Non | C6 |
| `docker-compose.yml` | 58 | `fetch('http://127.0.0.1:5000/...')` | Healthcheck interne du conteneur `backend` | Non | C6 |
| `docker-compose.yml` | 80 | `wget http://127.0.0.1/` | Healthcheck interne du conteneur `frontend` | Non | C6 |
| `hydro_Hassan dakhil/backend/.env.example` | 5 | `DB_HOST=localhost` | Template de developpement backend local hors Docker | Non | C2 |
| `hydro_Hassan dakhil/backend/src/app.ts` | 41-56 | `http://localhost:*`, `http://127.0.0.1:*` | Origines CORS de developpement, desactivees en `production` | Non | C2 |
| `hydro_Hassan dakhil/backend/src/app.ts` | 84-90 | `localhost`, `127.0.0.1`, `::1` | Detection des requetes locales pour assouplir le rate limiting hors production | Non | C2 |
| `hydro_Hassan dakhil/backend/src/config/hassanDataRoot.ts` | 11-13 | `../hassan dakhil` | Fallback de donnees conserve uniquement en dev local | Non | C2 |
| `hydro_Hassan dakhil/backend/server.ts` | 158-162 | `http://localhost:${PORT}`, `http://127.0.0.1:${PORT}` | Logs locaux et warmup interne backend | Non | C6 |
| `hydro_Hassan dakhil/frontend/vite.config.ts` | 12 | `http://127.0.0.1:5000` | Proxy Vite du developpement local | Non | C2 |
| `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts` | 136, 156, 192 | backend Windows local, `powershell.exe`, `SWAT_MDB_PATH` | Import MDB/Access uniquement, hors runtime Docker/Linux | Oui pour le module MDB, non pour le runtime principal | C5 |
| `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx` | 265-266 | backend Windows local, Access ACE/OLEDB | UI qui documente explicitement la limitation Docker/Linux | Oui pour le module MDB, non pour le runtime principal | C5 |
| `hydro_Hassan dakhil/frontend/src/pages/admin/DatabaseConfigPage.tsx` | 99 | `placeholder="localhost"` | Hint d'interface non execute comme URL runtime | Non | A verifier |

## Hors runtime principal

| Fichier | Ligne | Reference | Usage | Bloquant Ziz | Lot |
| --- | ---: | --- | --- | --- | --- |
| `hydro_Hassan dakhil/backend/scripts/import_bathy_had.ts` | 38 | `D:/3- Projets/hassanAddakhil/bathy_HAD.xlsx` | Script d'import bathymetrie local, non utilise par le runtime principal livre | Non | Hors package final a verifier |

## Conclusion

Le runtime principal livre n'impose plus de chemin absolu Windows ni de dependance `host.docker.internal`. Les references locales restantes sont soit justifiees pour le dev local, soit limitees aux healthchecks internes, soit clairement reportees aux lots C5 et C6.
