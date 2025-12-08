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
- 🤖 Intégration IA avec Mistral AI
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
# Supabase (optionnel - pour la synchronisation cloud)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mistral AI (optionnel - pour les fonctionnalités IA)
VITE_MISTRAL_API_KEY=your_mistral_api_key
```

## 💻 Utilisation

### Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl/Cmd + K` | Ouvrir la palette de commandes |
| `Ctrl/Cmd + N` | Nouvelle note |
| `Ctrl/Cmd + S` | Sauvegarder |
| `Ctrl/Cmd + B` | Texte en gras |
| `Ctrl/Cmd + I` | Texte en italique |

### Syntaxe Markdown supportée

- Titres (`# H1`, `## H2`, etc.)
- **Gras** et *italique*
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

```bash
npm run dev        # Serveur de développement
npm run build      # Build de production
npm run preview    # Prévisualiser le build
npm run lint       # Linter ESLint
```

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
