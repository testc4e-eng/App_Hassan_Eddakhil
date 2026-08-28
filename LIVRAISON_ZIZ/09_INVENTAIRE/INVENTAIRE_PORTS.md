# Inventaire Ports

Date d'inventaire : 2026-08-27
Mode : lecture seule

## 1. Ports declares par Docker Compose

| Service | Binding declare | Port interne | Nature | Remarque |
| --- | --- | --- | --- | --- |
| `db` | `127.0.0.1:${DB_EXPOSE_PORT:-5435}:5432` | `5432` | runtime Docker | Publication locale uniquement. |
| `backend` | `127.0.0.1:${BACKEND_EXPOSE_PORT:-5006}:5000` | `5000` | runtime Docker | API Node.js. |
| `frontend` | `127.0.0.1:${FRONTEND_EXPOSE_PORT:-8089}:80` | `80` | runtime Docker | Interface web servie par Nginx. |

## 2. Ports observes actuellement

| Service / composant | Port hote observe | Port interne | Source d'observation | Commentaire |
| --- | --- | --- | --- | --- |
| `db` | `5436` | `5432` | `docker compose ps` | Differe de la valeur par defaut de `.env.example` (`5435`). |
| `backend` | `5007` | `5000` | `docker compose ps` | Differe de la valeur par defaut de `.env.example` (`5006`). |
| `frontend` | `8090` | `80` | `docker compose ps` | Differe de la valeur par defaut de `.env.example` (`8089`). |

## 3. Ports et routes applicatives internes

| Element | Valeur | Port / route | Remarque |
| --- | --- | --- | --- |
| Backend HTTP interne | `backend:5000` | `5000` | Cible du reverse proxy Nginx frontend. |
| Frontend HTTP interne | `frontend:80` | `80` | Service web expose par l'image Nginx. |
| Base PostgreSQL interne | `db:5432` | `5432` | Service Compose attendu si topologie autonome. |
| Proxy API frontend | `/api/` | route HTTP | Nginx transmet vers `http://backend:5000/api/`. |
| API versionnee | `/api/v1` | route HTTP | Prefixe applicatif majoritaire cote frontend/backend. |

## 4. Ports de developpement detectes hors livraison Docker

| Emplacement | Valeur detectee | Usage probable | Necessaire pour la livraison |
| --- | --- | --- | --- |
| `hydro_Hassan dakhil\frontend\vite.config.ts` | `5173` | serveur Vite de developpement | `Non` |
| `hydro_Hassan dakhil\frontend\vite.config.ts` | proxy vers `127.0.0.1:5000` | dev local frontend -> backend | `Non` |
| `hydro_Hassan dakhil\backend\src\app.ts` | `8089`, `8090`, `3001`, `5173`, `5174`, `8080` | origines CORS de developpement | `A verifier` |

## 5. Points d'attention

- Tous les ports Docker observes sont relies a `127.0.0.1`, donc invisibles depuis l'exterieur sans mecanisme complementaire.
- Les ports reels observes localement ne correspondent pas aux valeurs par defaut de `.env.example`.
- Le package final devra preciser quels ports serveur Ziz seront retenus, et si l'acces passera par un reverse proxy, un load balancer ou un binding direct.

## 6. Conclusion

Inventaire des ports etabli en lecture seule.

Etat actuel :

- acces local uniquement ;
- ports d'execution locaux deja surcharges par rapport aux exemples ;
- parametrage serveur final encore a definir.
