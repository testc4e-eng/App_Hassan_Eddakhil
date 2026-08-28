# Rapport R1 - Dump Final v1.0.0

Date : 2026-08-27
Projet : Hassan Addakhil
Release cible : Ziz v1.0.0
Objet : generation, verification et test de restauration du dump final `hydro_hd_v1.0.0.dump`

## 1. Source utilisee

- Source active retenue : `host.docker.internal:5432`
- Base : `hydro_hd`
- Utilisateur : `postgres`
- Mot de passe : `***REDACTED***`
- Conteneur applicatif de preuve : `hydro-hassan-ilh0107-backend`

## 2. Preuves source

Preuves techniques relevees avant dump :

- le backend actif utilise `DB_HOST=host.docker.internal`
- le backend actif utilise `DB_PORT=5432`
- le backend actif utilise `DB_NAME=hydro_hd`
- la resolution observee depuis le backend est `192.168.65.254`
- le service Compose `db` n'est donc pas la source applicative retenue pour R1

Baseline structurelle source :

- PostgreSQL : `17.8`
- PostGIS : `3.5.3`
- Schemas non systeme : `13`
- Tables : `79`
- Vues : `104`
- Vues materialisees : `1`
- Sequences : `50`

Extensions source :

- `pgcrypto`
- `plpgsql`
- `postgis`
- `postgres_fdw`

## 3. Commande de dump

Commande appliquee en lecture seule, avec mot de passe masque :

```bash
docker run --rm \
  --mount type=bind,src="D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ\03_DATABASE\backup",dst=/backup \
  -e PGPASSWORD=***REDACTED*** \
  postgis/postgis:17-3.5 \
  sh -lc "pg_dump -h 'host.docker.internal' -p '5432' -U 'postgres' -d 'hydro_hd' -Fc -f /backup/hydro_hd_v1.0.0.dump.partial"
```

Outil utilise :

- `pg_dump (PostgreSQL) 17.5 (Debian 17.5-1.pgdg110+1)`

## 4. Format

- Fichier final : `LIVRAISON_ZIZ/03_DATABASE/backup/hydro_hd_v1.0.0.dump`
- Format : `PostgreSQL custom`
- Signature binaire : `PGDMP`
- Compression : `gzip`
- Dump version : `1.16-0`
- Base source du dump : `hydro_hd`
- Version source du dump : `17.8`

Conclusion :

- `DUMP FINAL LISIBLE : OUI`

## 5. Taille

- Taille exacte : `528758454` octets
- Taille MiB : `504.26`
- Horodatage fichier : `2026-08-27 17:18:22`

## 6. Checksum

- SHA256 : `2b77870f109e081b7f6f4cb042502e047ed3533e4b175aa7371765334d93f255`
- Fichier checksum : `LIVRAISON_ZIZ/03_DATABASE/backup/hydro_hd_v1.0.0.sha256`

Contenu du fichier `.sha256` :

```text
2b77870f109e081b7f6f4cb042502e047ed3533e4b175aa7371765334d93f255  hydro_hd_v1.0.0.dump
```

## 7. pg_restore --list

Lecture du dump :

- commande : `pg_restore --list`
- resultat : `OK`
- fichier de sortie complet : `LIVRAISON_ZIZ/03_DATABASE/rapports/hydro_hd_v1.0.0.pg_restore_list.txt`
- TOC Entries : `542`

Extrait representatif :

```text
; Archive created at 2026-08-27 17:10:58 UTC
;     dbname: hydro_hd
;     TOC Entries: 542
;     Compression: gzip
;     Dump Version: 1.16-0
;     Format: CUSTOM
;     Dumped from database version: 17.8
;     Dumped by pg_dump version: 17.5 (Debian 17.5-1.pgdg110+1)
3; 3079 1095612 EXTENSION - postgis
253; 1259 1096742 TABLE access rch_results postgres
256; 1259 1096763 TABLE access sub_results postgres
264; 1259 1096812 TABLE core stations postgres
271; 1259 1096865 MATERIALIZED VIEW api mv_scenario_catalog postgres
275; 1259 1096893 VIEW api v_timeseries_enriched postgres
276; 1259 1096908 VIEW api v_catalog_stations postgres
```

## 8. Test restauration

Environnement temporaire retenu pour la validation finale :

- conteneur : `hassan-ziz-r1-db-test-20260827172732`
- volume : `hassan_ziz_r1_pgdata_20260827172732`
- reseau : `hassan-ziz-r1-net-20260827172732`
- base de bootstrap : `postgres`
- base restauree : `hydro_hd_release_test`
- image : `postgis/postgis:17-3.5`

Tentatives observees :

1. Restauration brute dans une base prechargee PostGIS : echec attendu par conflit d'extension preinstallee.
2. Restauration brute dans une base vide : echec sur role local absent `hydro_chatbot_readonly`.
3. Restauration portable validee : `pg_restore --no-owner --no-privileges --exit-on-error` dans une base vide.

Verdict du test retenu :

- restauration : `OK`
- lecture structurelle post-restore : `OK`
- nettoyage des ressources temporaires : `OK`

## 9. Comparaison source / restauration

| Element | Base source | Base restauree | Resultat |
| --- | ---: | ---: | --- |
| Tables | `79` | `79` | `OK` |
| Vues | `104` | `104` | `OK` |
| Vues materialisees | `1` | `1` | `OK` |
| PostGIS | `3.5.3` | `3.5.2` | `OK` fonctionnel, version patch differente |

## 10. PostGIS

- Source active : `3.5.3`
- Environnement de restauration cible local : `3.5.2`
- Verification fonctionnelle executee : `PostGIS_Full_Version()`
- Resultat : extension chargee et fonctionnelle apres restauration

Point d'attention :

- l'image locale `postgis/postgis:17-3.5` disponible pendant R1 expose un patch PostGIS plus ancien que la source active ;
- la restauration complete reste validee sur la famille d'image cible demandee.

## 11. Tables structurantes et vues principales

Relations structurelles confirmees apres restauration :

- `access.rch_results`
- `access.sub_results`
- `core.reaches`
- `core.stations`
- `core.subbasins`
- `public.stations` `VIEW`
- `public.timeseries` `VIEW`

Vues API principales confirmees :

- `api.mv_scenario_catalog`
- `api.v_catalog_properties`
- `api.v_catalog_stations`
- `api.v_timeseries_enriched`

Indicateurs non sensibles verifies :

- `core.stations` : `102`
- `core.reaches` : `33`
- `core.subbasins` : `33`
- `public.stations` : `102`
- `public.timeseries` : `383`

## 12. Nettoyage ressources temporaires

Ressources supprimees apres preuve :

- `hassan-ziz-r1-db-test-20260827172732`
- `hassan_ziz_r1_pgdata_20260827172732`
- `hassan-ziz-r1-net-20260827172732`

Verification finale :

- conteneur encore present : `Non`
- volume encore present : `Non`
- reseau encore present : `Non`

## 13. Anomalies

- la vraie base applicative active n'est pas le service Compose `db`, mais `host.docker.internal:5432/hydro_hd`
- une restauration brute vers une base deja prechargee PostGIS echoue par collision d'extension
- une restauration brute avec privileges/owners echoue si le role local `hydro_chatbot_readonly` n'existe pas sur la cible
- la restauration portable validee pour Ziz doit donc utiliser `--no-owner --no-privileges --exit-on-error`
- l'image locale `postgis/postgis:17-3.5` utilisee pour le test expose PostGIS `3.5.2`, alors que la source active est en `3.5.3`

## 14. Verdict

Le dump final `hydro_hd_v1.0.0.dump` est :

- genere depuis la vraie base active validee ;
- lisible ;
- verifie par `pg_restore --list` ;
- hashe en SHA256 ;
- restaure avec succes dans un environnement isole representatif de la cible ;
- structurellement coherent avec la source ;
- pret pour la release Ziz v1.0.0, sous reserve de conserver la procedure de restauration portable documentee.

## 15. CORRECTIF R3-FIX

Date : 2026-08-28

Le test R3 d'installation completement isole a mis en evidence une limite de portabilite qui n'avait pas ete couverte par le premier cycle R1 :

- le dump R1 initial contenait encore l'extension `postgres_fdw` ;
- le dump R1 initial contenait le serveur legacy `old_hd_srv` ;
- le dump R1 initial contenait un `USER MAPPING` associe au role source `postgres` ;
- la restauration echouait donc sur une cible neuve lorsque l'utilisateur PostgreSQL d'installation n'etait pas `postgres`.

Conclusion corrigee :

- le premier dump R1 etait restaurable dans un environnement compatible ;
- il n'etait pas suffisamment portable pour une livraison Ziz autonome ;
- il a ete reclasse `NON LIVRABLE - BLOQUE PAR FDW LEGACY`.

Analyse R3-FIX :

- audit code + base active : aucune preuve que `old_hd_srv` soit necessaire au runtime de production ;
- dependances SQL applicatives sur les foreign tables `old_hd.*` : aucune detectee ;
- vues dependantes : aucune detectee ;
- vues materialisees dependantes : aucune detectee ;
- fonctions dependantes : aucune detectee.

Reponse a la question critique :

- l'application de production a-t-elle besoin de `old_hd_srv` pour fonctionner ? `NON`

Assainissement applique :

- exclusion du schema `old_hd` ;
- exclusion de l'extension `postgres_fdw` ;
- exclusion du serveur `old_hd_srv` ;
- exclusion du `USER MAPPING` legacy ;
- exclusion des `13` foreign tables `old_hd.*`.

Nouveau dump officiel :

- chemin : `LIVRAISON_ZIZ/03_DATABASE/backup/hydro_hd_v1.0.0.dump`
- taille : `528313425` octets
- SHA256 : `1f33e0e4295c74edf0ae4dcfaa82196e589e7029db985ecb1e1459ba55f2cbd1`
- TOC entries : `477`

Historique preserve :

- dump bloque conserve : `LIVRAISON_ZIZ/03_DATABASE/backup/hydro_hd_v1.0.0.blocked_fdw.dump`
- SHA256 historique : `2b77870f109e081b7f6f4cb042502e047ed3533e4b175aa7371765334d93f255`

Validation complementaire R3-FIX :

- restauration assainie en environnement temporaire : `OK`
- second restore neuf avec utilisateur non `postgres` : `OK`
- structure : `79` tables, `104` vues, `1` vue materialisee
- indicateurs de reference : conserves
- `old_hd_srv` : absent
- `USER MAPPING` legacy : absent
- donnees sensibles FDW legacy dans le dump final : absentes

Le verdict R1 doit donc etre lu ainsi :

- l'historique de generation R1 est conserve ;
- le dump officiel a ete remplace par la version assainie validee par R3-FIX ;
- la release Ziz doit desormais utiliser uniquement le dump officiel mis a jour apres R3-FIX.
