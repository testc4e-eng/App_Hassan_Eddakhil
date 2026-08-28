# Acceptation de risque xlsx v1.0.0

Date : 2026-08-28
Projet : Hassan Addakhil
Release cible : Ziz v1.0.0

## 1. Identification

- package : `xlsx`
- version : `0.18.5`
- severite npm : `HIGH`
- fixAvailable : `false`

## 2. Localisation de l'usage dans le projet

Usages identifies :

- `hydro_Hassan dakhil/backend/src/controllers/siltation.controller.ts`
- `hydro_Hassan dakhil/backend/src/services/siltation.service.ts`
- `hydro_Hassan dakhil/backend/scripts/import_bathy_had.ts`
- `hydro_Hassan dakhil/backend/scripts/import_hassan_addakhil_siltation.ts`

## 3. Surfaces exposees

Surfaces observees :

- export Excel genere cote serveur pour les donnees d'envasement ;
- scripts techniques d'import operes manuellement ;
- aucune API publique principale identifiee qui accepterait directement un fichier Excel non fiable en lecture utilisateur libre.

## 4. Absence de lecture publique directe identifiee

Constats retenus :

- `siltation.controller.ts` renvoie un fichier `.xlsx` au client ;
- `siltation.service.ts` construit un classeur a partir de donnees serveur et renvoie un `Buffer` ;
- les usages `xlsx.readFile(...)` releves sont dans des scripts operes, pas dans le flux HTTP public principal.

Conclusion :

- aucune lecture publique directe d'un fichier Excel non fiable n'a ete identifiee dans le parcours web principal de v1.0.0.

## 5. Controles actuels

Controles ou limites deja en place :

- la surface HTTP backend prioritaire corrigeable a ete assainie en R2-S ;
- les scripts d'import Excel ne sont pas exposes comme endpoint public standard ;
- les builds Docker finaux ne modifient pas les donnees de production et ne lancent pas ces scripts ;
- les validations backend finales sont `OK` : `npm ci`, `type-check`, `31/31` tests, `build`.

## 6. Justification de l'acceptation pour v1.0.0

Le risque n'est pas minimise.

Le package reste signale `HIGH`, mais :

- aucun correctif npm compatible n'est actuellement disponible ;
- l'exposition relevee est principalement un export serveur et des scripts techniques ;
- les vulnerabilites HTTP backend corrigibles et prioritairement exploitables ont ete supprimees avant tagging ;
- bloquer la livraison sur ce seul point sans correctif disponible n'apporterait pas de remediation immediate proportionnee pour v1.0.0.

Verdict documentaire :

- `RISQUE ACCEPTE POUR v1.0.0 AVEC SUIVI OBLIGATOIRE`

## 7. Mesures compensatoires

- ne pas ouvrir l'import Excel a des utilisateurs non maitrises sans revue de securite dediee ;
- maintenir la separation entre scripts techniques et API publique ;
- conserver l'analyse d'exposition dans le dossier de livraison ;
- revalider le comportement lors des tests d'installation isoles R3 ;
- tracer explicitement ce point dans tout package de remise client ou checklist de release.

## 8. Recommandation future

Recommandation :

- planifier une migration ou un remplacement de `xlsx` vers une bibliotheque maintenue avec correctifs disponibles ;
- revisiter les flux d'import/export Excel avant une release suivante ;
- reevaluer la surface exacte si de nouveaux endpoints de lecture de fichiers sont ajoutes.

## 9. Priorite de suivi

- priorite : `HAUTE`
- echeance recommande(e) : avant une prochaine release majeure de securisation ou avant extension des flux Excel cote utilisateur
