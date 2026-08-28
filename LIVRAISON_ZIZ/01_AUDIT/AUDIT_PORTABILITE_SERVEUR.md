# Audit Portabilite Serveur

Date d'audit : 2026-08-27
Mode : lecture seule
Contexte : preparation d'une livraison future sur serveur Ziz

## 1. Objectif

Evaluer si l'etat actuel du projet est portable vers un serveur Linux sans s'appuyer sur des chemins locaux, composants Windows, hotes locaux ou conventions de poste de developpement.

## 2. Points positifs

- Le frontend consomme majoritairement des URLs relatives (`/api` et `/api/v1`) au lieu d'un `localhost` fixe dans le navigateur.
- `hydro_Hassan dakhil\frontend\nginx.conf` reverse-proxy les appels `/api/` vers `backend:5000`, ce qui facilite une execution conteneurisee.
- Le backend lit ses variables d'environnement de facon explicite et centralisee.
- La base Docker dispose d'un volume nomme et d'un script d'initialisation dedie.

## 3. Ecarts de portabilite

| ID | Niveau | Fichier | Ligne | Configuration actuelle | Probleme | Impact serveur Ziz | Correction recommandee |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PORT-01` | `BLOQUANT` | `docker-compose.yml` | `31`, `45-46` | `DB_HOST=${DB_HOST:-host.docker.internal}` | `host.docker.internal` est une convention de poste Docker Desktop et non une cible fiable pour une livraison Linux autonome. | Le backend peut ne pas joindre la base attendue sur le serveur Ziz. | Remplacer par le service Compose `db` ou documenter une base externe clairement administree. |
| `PORT-02` | `BLOQUANT` | `hydro_Hassan dakhil\backend\src\services\swatIngestion.service.ts` | `149-157` | execution de `powershell.exe` | Le service applicatif sait invoquer un script PowerShell Windows. | Fonctionnalite SWAT indisponible telle quelle sur Linux. | Isoler cette fonctionnalite, la reimplementer pour Linux ou la declarer hors perimetre serveur. |
| `PORT-03` | `IMPORTANT` | `scripts\swat-import\analyze_mdb.ps1`, `import_swat_output.ps1`, `import_etat_actuel_bundle.ps1` | multiples | scripts PowerShell, `Microsoft.ACE.OLEDB.12.0`, `psql.exe`, chemins Windows | La chaine d'import SWAT depend d'outils Windows et Microsoft Access. | Ces procedures ne sont pas directement executables sur un serveur Linux standard. | Prevoir une procedure de pre-traitement Windows separee ou un remplacement portable. |
| `PORT-04` | `IMPORTANT` | `hydro_Hassan dakhil\backend\src\config\hassanDataRoot.ts` | `4-10` | fallback vers `..\hassan dakhil` | Le repertoire de donnees par defaut repose sur une structure locale implicite. | Risque de rupture si l'arborescence serveur differe. | Rendre le chemin de donnees obligatoire et explicitement documente pour la livraison. |
| `PORT-05` | `IMPORTANT` | `hydro_Hassan dakhil\backend\scripts\import_bathy_had.ts` | `38` | chemin `D:/3- Projets/.../bathy_HAD.xlsx` | Chemin Windows absolu code en dur. | Non portable sur serveur et source probable d'echec de script. | Externaliser le chemin en configuration ou exclure ce script du package final. |
| `PORT-06` | `IMPORTANT` | `hydro_Hassan dakhil\backend\sql\seed_bathymetry_campaigns_had.sql` | `10-15` | reference a `D:/3- Projets/.../bathy_HAD.xlsx` | Le SQL embarque une dependance locale Windows. | Le script ne sera pas reutilisable tel quel sur Ziz. | Revoir la source de donnees avant toute inclusion dans une procedure serveur. |
| `PORT-07` | `IMPORTANT` | `docker-compose.yml` | `10`, `51`, `76` | ports lies a `127.0.0.1` | La publication reseau est seulement locale. | L'application n'est pas directement atteignable depuis l'exterieur. | Definir un reverse proxy/pare-feu cible ou adapter les bindings pour le serveur de destination. |
| `PORT-08` | `INFORMATION` | `.env.example`, `hydro_Hassan dakhil\backend\src\app.ts` | multiples | listes de `localhost` / `127.0.0.1` pour CORS et dev | Les origines de developpement sont presentes, ce qui est normal en local mais non suffisant pour Ziz. | Parametrage serveur a completer lors de la mise en production. | Preparer des valeurs de domaine/IP serveur dans la documentation et les exemples de config. |
| `PORT-09` | `INFORMATION` | `hydro_Hassan dakhil\frontend\vite.config.ts` | `12`, `35-45` | proxy dev vers `http://127.0.0.1:5000` | Reference locale, mais uniquement pour le developpement Vite. | Pas bloquant pour l'image frontend de production. | Conserver comme usage dev, sans l'inclure comme hypothese serveur. |
| `PORT-10` | `INFORMATION` | `scripts\swat-import\README.md` | `3` | mention de `hydro_hd_1714` | Documentation historique non alignee avec la base actuellement attendue (`hydro_hd`). | Risque de confusion documentaire. | Mettre a jour la documentation lors d'une etape ulterieure, sans toucher au source a ce stade. |
| `PORT-11` | `INFORMATION` | `hydro_Hassan dakhil\frontend\setup.bat` | `6` | chemin `C:\dev\App-1\frontend` | Script purement local et Windows. | Peu pertinent pour la livraison serveur. | Proposer son exclusion future du package final. |

## 4. Donnees et actifs a surveiller

- Dump principal detecte : `D:\3- Projets\App_Hassan_Addakhil\hydro_hd.sql` (`533241663` octets).
- Les imports SWAT semblent attendre des fichiers `SWATOutput.mdb`, donc des donnees Access hors standard Linux.
- Le frontend appelle aussi des ressources statiques sous `/data/hassan/...`, a inventorier precisement lors de la preparation du package final.

## 5. Conclusion

Verdict actuel : `NON PORTABLE ACTUELLEMENT`

Points a traiter avant une livraison serveur propre :

- clarification de la topologie base de donnees cible ;
- traitement du perimetre SWAT et de ses dependances Windows ;
- definition des chemins de donnees et des bindings reseau serveur ;
- nettoyage documentaire des references locales historiques.

Ce rapport est purement documentaire. Aucune correction n'a ete appliquee dans cette etape.
