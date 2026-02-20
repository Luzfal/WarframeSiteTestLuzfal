# Warframe Build Hub

Mini site statique pour partager des builds Warframe.

## Lancer en local

```bash
python3 -m http.server 4173
```

Puis ouvrir <http://localhost:4173>.

## Pages

- `index.html` : liste des builds, filtres, publication.
- `build.html?id=<id>` : détail d'un build avec les mods à installer.

## Rôles

- **Utilisateur** : peut consulter les builds (lecture seule).
- **Admin** : peut publier, modifier et supprimer des builds.
- Mot de passe admin de démo (front local) : `warframe-admin`.
