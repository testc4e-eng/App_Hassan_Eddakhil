# TEST R3 - INSTALLATION ZIZ ISOLEE

Date du test : 2026-08-28

Projet : Hassan Addakhil

Version cible : 1.0.0

Scenario : R3 - premiere installation en environnement Docker completement isole

Project name Docker : `hassan-ziz-r3-test-20260828`

Verdict global : `KO`

| Test | Resultat | Detail |
|---|---|---|
| Images presentes | OK | Images locales confirmees : `hassan-addakhil-backend:1.0.0`, `hassan-addakhil-frontend:1.0.0`, `postgis/postgis:17-3.5` ; architecture `amd64`. |
| SHA dump | OK | `LIVRAISON_ZIZ/03_DATABASE/backup/hydro_hd_v1.0.0.dump` verifie : `2b77870f109e081b7f6f4cb042502e047ed3533e4b175aa7371765334d93f255`. |
| DB demarrage | OK | Service `db` demarre seul dans un stack dedie ; conteneur `healthy`, reseau et volume R3 crees sans interaction avec le stack principal. |
| Restore dump | KO | `pg_restore --verbose --exit-on-error --clean --if-exists --no-owner --no-privileges` echoue sur un objet `USER MAPPING` du dump cible sur le role `postgres`, absent de l'environnement R3 avec utilisateur temporaire `hassan_r3_test`. |
| Structure DB | KO | Validation impossible : la restauration s'est interrompue avant confirmation des `79` tables, `104` vues et `1` vue materialisee attendues. |
| PostGIS | PARTIEL | Le moteur R3 repond ; `PostgreSQL 17.5` et `postgis_full_version()` sur `PostGIS 3.5.2` fonctionnent. Validation metier incomplete a cause de la restauration interrompue. |
| Backend health | NON EXECUTE | Backend non demarre apres l'echec bloquant de restauration, conformement aux garde-fous R3. |
| API stations | NON EXECUTE | Non teste car backend non demarre. |
| API reaches | NON EXECUTE | Non teste car backend non demarre. |
| Frontend HTTP | NON EXECUTE | Frontend non demarre apres le blocage sur la base. |
| Proxy API | NON EXECUTE | Non teste car frontend et backend non demarres. |
| Restart DB | NON EXECUTE | Test annule apres echec bloquant du restore. |
| Restart stack | NON EXECUTE | Test annule apres echec bloquant du restore. |
| Persistance | NON EXECUTE | Test annule apres echec bloquant du restore. |
| Logs | PARTIEL | Aucun incident Docker observe avant restauration ; l'erreur bloquante est apparue pendant `pg_restore`. Les traces temporaires contenant des donnees sensibles de test ont ete supprimees. |
| Isolation host | PARTIEL | Isolation Docker prouvee au niveau DB, reseau et volume. L'absence de dependance host pour le runtime complet n'a pas pu etre validee jusqu'au backend/frontend a cause du blocage de restauration. |

## Cause bloquante constatee

Le dump final contient encore des objets de type FDW / mapping non portables :

- `EXTENSION postgres_fdw`
- `SERVER old_hd_srv`
- `USER MAPPING postgres SERVER old_hd_srv`

Cette presence est visible dans `LIVRAISON_ZIZ/03_DATABASE/rapports/hydro_hd_v1.0.0.pg_restore_list.txt`.

## Decision R3

Le scenario R3 est arrete a l'etape restauration.

La release `v1.0.0` n'est pas installable de facon reproductible sur un serveur isole avec un utilisateur PostgreSQL neuf tant que le dump de livraison conserve cet objet `USER MAPPING`.
