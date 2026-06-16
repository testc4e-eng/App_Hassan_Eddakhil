# Ordre d'exécution des scripts

1. `sql_recreation/01_create_extensions.sql`
2. `sql_recreation/02_create_schemas.sql`
3. `sql_recreation/03_create_sequences.sql`
4. `sql_recreation/04_create_tables.sql`
5. `sql_recreation/05_create_constraints.sql`
6. `sql_recreation/06_create_indexes.sql`
7. `sql_recreation/07_create_views.sql`
8. `sql_recreation/08_create_functions_triggers.sql`

L'ordre est pensé pour respecter les dépendances de type: extensions -> schémas -> séquences -> tables -> contraintes -> index -> vues -> fonctions/triggers.