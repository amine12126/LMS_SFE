# 🚀 Guide de Déploiement Complet : Manufacturing Academie

Ce guide explique étape par étape comment déployer votre propre instance complète, indépendante et étanche du projet (Backend et Frontend) sur vos propres serveurs de production.

---

## 📋 1. Prérequis Nécessaires
Avant de commencer, assurez-vous d'avoir :
1. Un compte **GitHub** avec le code du projet cloné ou forké.
2. Un compte **Railway** (pour héberger l'API Backend et la Base de Données PostgreSQL).
3. Un compte **Cloudinary** (création gratuite pour stocker les fichiers de cours comme les PDFs, vidéos et images).
4. Un compte **Vercel** (pour héberger l'application Frontend React).

---

## 🛠️ 2. Déploiement du Backend sur Railway (avec PostgreSQL)

### Étape 2.1 : Initialiser le projet Railway
1. Connectez-vous sur [Railway.app](https://railway.app/).
2. Cliquez sur le bouton **"New Project"** en haut à droite de votre tableau de bord.
3. Choisissez **"Deploy from GitHub repo"** et sélectionnez le dépôt GitHub de votre projet.

### Étape 2.2 : Ajouter le plugin de base de données PostgreSQL
1. Dans votre espace projet Railway fraîchement créé, cliquez sur le bouton **"+ Add Service"** (ou **"New"**).
2. Choisissez **"Database"** puis sélectionnez **"PostgreSQL"**.
3. *Railway crée, configure et lance automatiquement le serveur PostgreSQL en arrière-plan.*

### Étape 2.3 : Configurer les Variables d'Environnement
1. Cliquez sur le bloc correspondant à votre service **Backend** (celui qui porte le nom de votre dépôt GitHub).
2. Allez dans l'onglet **"Variables"**.
3. Ajoutez les variables suivantes en cliquant sur **"New Variable"** (ou en utilisant l'éditeur Raw) :

| Clé (Key) | Valeur recommandée / Description |
|---|---|
| `SECRET_KEY` | Entrez une suite de caractères aléatoires complexes de votre choix. |
| `DEBUG` | `True` *(recommandé pour les tests initialement)* ou `False` |
| `ALLOWED_HOSTS` | `*` *(ou l'URL de votre backend générée par Railway)* |
| `DATABASE_URL` | *Laissez vide ou cliquez sur le bouton de référence de variable pour pointer vers le service PostgreSQL créé à l'étape précédente. Railway lie généralement cette variable automatiquement.* |
| `CLOUDINARY_CLOUD_NAME` | *Votre "Cloud Name" récupéré sur votre tableau de bord Cloudinary.* |
| `CLOUDINARY_API_KEY` | *Votre clé API récupérée sur Cloudinary.* |
| `CLOUDINARY_API_SECRET` | *Votre clé secrète de sécurité récupérée sur Cloudinary.* |

### Étape 2.4 : Lancer les migrations et finaliser le déploiement
1. Dans Railway, cliquez sur votre service Backend.
2. Allez dans l'onglet **"Settings"**.
3. Dans la section **"Build & Deploy"**, assurez-vous que la commande de démarrage (Start Command) exécute les migrations système puis lance le serveur de production. Vous pouvez renseigner :
   ```bash
   python manage.py migrate && gunicorn config.wsgi
   ```
4. Une fois le déploiement marqué comme **"Active"** avec un point vert :
5. Allez dans l'onglet **"Settings"** du Backend, faites défiler jusqu'à la section **"Environment"** et cliquez sur **"Generate Domain"** si aucun domaine n'a été créé par défaut.
6. **Copiez cette URL de Backend** (par exemple : `https://votre-backend.up.railway.app`). Vous en aurez besoin pour configurer le Frontend.

---

## ⚛️ 3. Déploiement du Frontend sur Vercel

### Étape 3.1 : Importer le projet sur Vercel
1. Connectez-vous sur [Vercel.com](https://vercel.com/).
2. Cliquez sur le bouton **"Add New..."** en haut à droite, puis sélectionnez **"Project"**.
3. Importez votre dépôt GitHub contenant le projet.

### Étape 3.2 : Configurer le dossier racine du Frontend
Le projet étant séparé (découplé), le code de l'interface utilisateur React se situe dans un sous-dossier :
1. Dans la configuration du projet sur Vercel, recherchez la ligne **"Root Directory"** (Dossier Racine).
2. Cliquez sur **"Edit"** et sélectionnez le dossier nommé **`frontend`**.

### Étape 3.3 : Configurer l'environnement de connexion avec votre Backend Railway
1. Déroulez la section **"Environment Variables"** sur Vercel.
2. Ajoutez la variable d'environnement suivante :
   *   **Name (Nom de la clé)** : `VITE_API_URL`
   *   **Value (Valeur)** : *Collez l'URL de votre Backend Railway générée à la fin de l'étape 2.4* (par exemple : `https://votre-backend.up.railway.app`). **Attention : ne mettez pas de slash `/` à la fin.**
3. Cliquez sur **"Add"**.

### Étape 3.4 : Déployer
1. Cliquez sur le bouton bleu **"Deploy"** en bas.
2. Vercel va installer les modules Node, compiler l'application React et la mettre en ligne.
3. *Votre plateforme est en ligne ! Vous pouvez ouvrir l'URL fournie par Vercel pour y accéder directement.*

---

## 🔑 4. Étape Finale : Créer votre premier compte Administrateur
Pour pouvoir vous connecter à l'interface d'administration Django `/admin/` afin de créer les cours, chapitres et comptes utilisateurs de départ :
1. Sur votre tableau de bord **Railway**, cliquez sur le service Backend.
2. Allez dans l'onglet **"Terminal"** (ou ouvrez un terminal connecté).
3. Exécutez la commande d'administration Django suivante :
   ```bash
   python manage.py createsuperuser
   ```
4. Saisissez l'adresse email et le mot de passe de votre choix dans l'invite de commande.
5. Ouvrez l'URL de votre Backend suivie de `/admin/` (ex : `https://votre-backend.up.railway.app/admin/`) et connectez-vous avec ces identifiants pour démarrer la configuration de votre catalogue de formations !
