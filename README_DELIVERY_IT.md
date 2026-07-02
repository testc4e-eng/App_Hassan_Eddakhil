# Livraison IT Light

Source locale de reference :
- depot source : `D:\3- Projets\hassanAddakhil`
- branche locale de reference : `dev_ilh_0107`
- commit source : `05ee4becdcf953d75ec19fea5825d027c3f93d1a`

Objectif :
- fournir a l'equipe IT un paquet Git leger contenant le code applicatif actuel et les scripts de migration utiles
- exclure l'historique lourd, les artefacts locaux et les objets Git LFS inutiles

Contenu inclus :
- `backend/`
- `frontend/`
- `scripts/`
- `README.md`
- `README_PROJECT_STRUCTURE.md`
- `docker-compose.yml`

Exclusions appliquees :
- `node_modules/`
- `dist/`
- `.git/`
- fichiers `.env`
- logs Vite et fichiers `*.tsbuildinfo`
- `scripts/swat-import/work/`
- `scripts/swat-import/logs/`
- `scripts/swat-import/reports/`
- `__pycache__/`
- pointeurs Git LFS sans contenu utile
- gros fichiers de donnees et archives hors du perimetre `backend/frontend/scripts`

Remarques :
- ce paquet n'est pas une copie complete du depot principal
- il sert de branche de livraison legere pour reprise, revue et migration cote IT
