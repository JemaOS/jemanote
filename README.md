# JemaNote

<p align="center">
  <img src="public/icon-192.png" alt="JemaNote Logo" width="100" height="100">
</p>

<p align="center">
  <strong>Application de prise de notes moderne et puissante</strong>
</p>

<p align="center">
  <a href="https://www.jematechnology.fr/">Jema Technology</a> •
  <a href="#fonctionnalités">Fonctionnalités</a> •
  <a href="#installation">Installation</a> •
  <a href="#utilisation">Utilisation</a> •
  <a href="#licence">Licence</a>
</p>

---

## 📝 Description

JemaNote est une application de prise de notes Progressive Web App (PWA) développée par [Jema Technology](https://www.jematechnology.fr/). Elle offre une expérience utilisateur fluide avec support du Markdown, synchronisation cloud optionnelle, et de nombreuses fonctionnalités avancées.

## ✨ Fonctionnalités

### Éditeur Markdown

- 📝 Éditeur Markdown complet avec prévisualisation en temps réel
- 🎨 Coloration syntaxique avec CodeMirror
- 📐 Support des formules mathématiques (KaTeX)
- 📊 Diagrammes Mermaid intégrés
- 🔗 WikiLinks pour lier vos notes entre elles

### Organisation

- 📁 Système de dossiers pour organiser vos notes
- 🔍 Recherche rapide et puissante (Fuse.js)
- 🗑️ Corbeille avec restauration
- 📅 Vue timeline pour naviguer par date

### Visualisation

- 🕸️ Vue graphe pour visualiser les liens entre notes (Cytoscape)
- 🖼️ Vue canvas pour une organisation spatiale (PixiJS)

### Intelligence Artificielle

- 🤖 Intégration IA avec Mistral AI (compte Mistral personnel, connexion sans clé visible)
- 📋 Résumés automatiques
- ✍️ Assistance à la rédaction

### Synchronisation & Stockage

- 💾 Stockage local (LocalForage)
- ☁️ Synchronisation cloud optionnelle (Supabase)
- 📱 Mode hors-ligne complet (PWA)

### Interface

- 🌙 Thème clair/sombre
- 📱 Design responsive (mobile, tablette, desktop)
- ⌨️ Palette de commandes (Cmd/Ctrl + K)
- 🎤 Enregistrement vocal

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation locale

```bash
# Cloner le dépôt
git clone https://github.com/jematechnology/jemanote-pwa.git
cd jemanote-pwa

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Construire pour la production
npm run build
```

### Variables d'environnement

Copiez le fichier `.env.example` vers `.env` et configurez les variables :

```env
# Supabase (requis pour la connexion du compte Mistral et la synchro cloud)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **IA Mistral** : aucune clé n'est stockée côté client. Chaque utilisateur
> connecte son propre compte Mistral depuis **Paramètres → Assistant IA**
> (la clé est validée puis chiffrée côté Supabase Vault et n'est jamais
> renvoyée au navigateur). Voir `supabase/README.md` pour déployer le backend.

## 💻 Utilisation

### Raccourcis clavier

| Raccourci      | Action                         |
| -------------- | ------------------------------ |
| `Ctrl/Cmd + K` | Ouvrir la palette de commandes |
| `Ctrl/Cmd + N` | Nouvelle note                  |
| `Ctrl/Cmd + S` | Sauvegarder                    |
| `Ctrl/Cmd + B` | Texte en gras                  |
| `Ctrl/Cmd + I` | Texte en italique              |

### Syntaxe Markdown supportée

- Titres (`# H1`, `## H2`, etc.)
- **Gras** et _italique_
- Listes à puces et numérotées
- Blocs de code avec coloration syntaxique
- Tableaux
- Citations
- Liens et images
- WikiLinks : `[[Nom de la note]]`
- Formules LaTeX : `$E = mc^2$`
- Diagrammes Mermaid

## 🛠️ Technologies

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI
- **Éditeur**: CodeMirror 6
- **Markdown**: react-markdown, remark-gfm, rehype-katex
- **Graphes**: Cytoscape.js
- **Canvas**: PixiJS
- **Stockage**: LocalForage, Supabase
- **PWA**: vite-plugin-pwa

## 📦 Scripts disponibles

### Développement

```bash
npm run dev              # Serveur de développement
npm run build            # Build de production
npm run build:prod       # Build optimisé pour production
npm run preview          # Prévisualiser le build
```

### Tests

```bash
npm run test             # Tests unitaires (Vitest)
npm run test:watch       # Tests en mode watch
npm run test:coverage    # Tests avec couverture
npm run test:e2e         # Tests E2E (Playwright)
npm run test:e2e:ui      # Tests E2E avec UI
npm run test:all         # Tous les tests (lint + types + unit + e2e)

# Script interactif
node scripts/run-tests.js
```

## 🧪 Infrastructure de Tests

JemaNote dispose d'une infrastructure de tests complète et professionnelle :

### Types de tests

| Type            | Outil                                                                   | Description                                        |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| **Unitaires**   | [Vitest](https://vitest.dev/)                                           | Tests rapides pour fonctions, hooks et utilitaires |
| **Intégration** | [Vitest](https://vitest.dev/) + [MSW](https://mswjs.io/)                | Tests des interactions entre modules et API        |
| **Composants**  | [React Testing Library](https://testing-library.com/)                   | Tests des composants React avec interactions       |
| **E2E**         | [Playwright](https://playwright.dev/)                                   | Tests de bout en bout sur vrais navigateurs        |
| **Sécurité**    | [Playwright](https://playwright.dev/)                                   | Tests XSS, CSP, injection, headers                 |
| **Performance** | [Lighthouse](https://developer.chrome.com/docs/lighthouse) + Playwright | Audits Lighthouse, taille bundle, mémoire          |
| **Visuels**     | [Playwright](https://playwright.dev/)                                   | Tests de régression visuelle                       |
| **Refactoring** | Scripts custom                                                          | Analyse de complexité, duplication, couplage       |

### Documentation des tests

- 📖 [Vue d'ensemble](tests/README.md) - Documentation complète de l'infrastructure
- ✍️ [Guide de contribution](tests/CONTRIBUTING.md) - Comment écrire des tests
- 🐛 [Guide de débogage](tests/DEBUGGING.md) - Résoudre les problèmes
- 🔄 [Guide CI/CD](tests/CI_CD.md) - Intégration continue

### Couverture de code

![Coverage](https://img.shields.io/badge/coverage-70%25-brightgreen)

Les seuils de couverture actuels :

- Statements: 70%
- Branches: 60%
- Functions: 70%
- Lines: 70%

Voir le rapport de couverture détaillé avec `npm run test:coverage`.

### Commandes de test

| Commande                    | Description                  |
| --------------------------- | ---------------------------- |
| `npm run test`              | Tests unitaires              |
| `npm run test:watch`        | Tests en mode watch          |
| `npm run test:coverage`     | Tests avec couverture        |
| `npm run test:e2e`          | Tests E2E                    |
| `npm run test:e2e:ui`       | Tests E2E avec interface     |
| `npm run test:visual`       | Tests de régression visuelle |
| `npm run test:performance`  | Tests de performance         |
| `npm run test:security`     | Tests de sécurité            |
| `npm run test:refactoring`  | Analyse de qualité du code   |
| `npm run test:all`          | Tous les tests qualité       |
| `node scripts/run-tests.js` | Lanceur interactif           |

### Qualité du code

```bash
npm run lint             # ESLint
npm run lint:fix         # ESLint avec auto-fix
npm run type-check       # Vérification TypeScript
npm run format           # Formatage Prettier
npm run format:check     # Vérification formatage
npm run quality          # Suite complète de qualité
npm run quality:fix      # Suite qualité avec auto-fix
```

### Analyse du code

```bash
npm run depcheck         # Détecter dépendances inutilisées
npm run knip             # Détecter code mort
```

## 🔒 Qualité et Standards

### Pre-commit Hooks

Ce projet utilise Husky et lint-staged pour exécuter automatiquement :

- ESLint avec auto-fix
- Prettier formatage
- Tests liés aux fichiers modifiés

### Conventional Commits

Les messages de commit doivent suivre la convention [Conventional Commits](https://www.conventionalcommits.org/) :

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

Types disponibles : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

Exemples :

```bash
git commit -m "feat(notes): add search by tags"
git commit -m "fix(auth): resolve login redirect issue"
git commit -m "docs(readme): update installation instructions"
```

### CI/CD

Le workflow GitHub Actions exécute automatiquement :

- Lint et vérification des types
- Tests unitaires avec couverture
- Tests E2E
- Analyse des dépendances
- Audit de sécurité
- Vérification du build

### Configuration des outils

| Outil      | Configuration                                  | Description                                                 |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------- |
| ESLint     | [`eslint.config.js`](eslint.config.js)         | Linting avec règles React, TypeScript strict, imports, a11y |
| Prettier   | [`.prettierrc`](.prettierrc)                   | Formatage cohérent du code                                  |
| TypeScript | [`tsconfig.app.json`](tsconfig.app.json)       | Mode strict activé                                          |
| Commitlint | [`commitlint.config.js`](commitlint.config.js) | Validation des messages de commit                           |
| Knip       | [`knip.json`](knip.json)                       | Détection de code mort                                      |
| Husky      | [`.husky/pre-commit`](.husky/pre-commit)       | Hooks pre-commit                                            |

### TypeScript Strict Mode

Le projet utilise TypeScript en mode strict avec les options suivantes activées :

- `strict: true` - Toutes les vérifications strictes
- `noImplicitAny: true` - Interdit les types implicites `any`
- `strictNullChecks: true` - Vérification stricte des null/undefined
- `noUnusedLocals: true` - Détecte les variables non utilisées
- `noImplicitReturns: true` - Vérifie les retours de fonction
- Et plus encore...

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteur

**Jema Technology**

- Site web : [https://www.jematechnology.fr/](https://www.jematechnology.fr/)

---

<p align="center">
  Développé avec ❤️ par <a href="https://www.jematechnology.fr/">Jema Technology</a> © 2025
</p>
