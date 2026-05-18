# 🎓 LMS SFE - Learning Management System avec Authentification Biométrique

Une plateforme moderne et sécurisée de gestion de l'apprentissage (LMS) conçue dans le cadre d'un **Projet de Fin d'Études (SFE)**. Ce projet intègre une **double couche d'authentification par reconnaissance faciale** (biométrie) pour restreindre l'accès aux cours sensibles, ainsi qu'un système complet de gestion des rôles, de suivi de progression et d'audit.

---

## 🌟 Points Forts du Projet
* **🛡️ Sécurité Biométrique Avancée** : Double authentification par reconnaissance faciale côté client avec `face-api.js` et stockage sécurisé des signatures mathématiques (embeddings) sous forme de JSON en base de données Django.
* **👥 Gestion Multi-Rôle Robuste** :
  * **Administrateurs** : Gestion complète (CRUD) des utilisateurs (Team Leaders et Consultants), monitoring global et statistiques clés de la plateforme.
  * **Team Leaders (TL)** : Création et gestion de groupes, assignation de cours spécifiques (obligatoires ou publics) et suivi en temps réel de la progression des consultants.
  * **Consultants (Apprenants)** : Dashboard personnalisé, suivi de cours par chapitres, validation de progression et enregistrement de profil biométrique.
* **📚 Système de Gestion de Contenu** : Support de formats multiples (Vidéos, PDFs, Images, Liens web) ordonnés par chapitres au sein de cours personnalisés.
* **📊 Analytics & Audit Trail** : Journalisation d'audit complète (`AuditLog`) de chaque action critique et tableaux de bord visuels avec calculs de progression détaillés.
* **✨ Interface Premium** : Un design moderne sous React avec des effets de verre (glassmorphism), des dégradés harmonieux, des micro-animations interactives et une navigation fluide adaptée à chaque rôle.

---

## 🛠️ Stack Technique

### Backend (API REST)
* **Framework** : Django & Django REST Framework (DRF)
* **Base de données** : SQLite / PostgreSQL (Stockage des embeddings via `JSONField`)
* **Authentification** : Jetons JWT (JSON Web Tokens)
* **Sécurité & Logs** : Système de journalisation d'audit personnalisé (`AuditLog`)

### Frontend (Application Client)
* **Framework** : React.js (v19) & React Router (v7)
* **Biométrie** : `face-api.js` (Modèles SSD MobileNet V1 et Face Landmark 68 intégrés localement)
* **Client HTTP** : Axios
* **Design & Animations** : Vanilla CSS moderne (Transitions fluides, Flexbox/Grid responsif)

---

## 📂 Structure Simplifiée du Projet

```text
ProjetSFE/
├── apps/                        # Applications Backend Django
│   ├── authentication/          # Gestion utilisateurs, tokens et modèles biométriques
│   ├── courses/                 # Gestion des cours, chapitres, contenus et progressions
│   └── users/                   # Vues et sérialiseurs spécifiques aux utilisateurs
├── config/                      # Fichiers de configuration Django (Settings, URLs)
├── frontend/                    # Application Frontend React
│   ├── public/                  # Assets publics et modèles de reconnaissance faciale (models/)
│   └── src/                     # Composants, pages, styles et logique de l'application
│       ├── auth/                # Contexte d'authentification globale
│       ├── components/          # Composants réutilisables (Navbar, Modals, Cards)
│       └── pages/               # Vues spécifiques (Admin, Team Leader, Consultant)
├── media/                       # Stockage local des médias téléchargés (PDFs, Images)
├── requirements.txt             # Dépendances Backend Python
└── manage.py                    # Script d'administration Django
```

---

## ⚙️ Installation et Configuration

### 1. Prérequis
Assurez-vous d'avoir installé sur votre machine :
* **Python** (v3.10 ou supérieur)
* **Node.js** (v18 ou supérieur) & **npm**

### 2. Configuration du Backend (Django)

1. Naviguez dans le dossier racine du projet et créez un environnement virtuel :
   ```powershell
   python -m venv venv
   ```
2. Activez l'environnement virtuel :
   * **Sur Windows (PowerShell)** :
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Sur Linux / macOS** :
     ```bash
     source venv/bin/activate
     ```
3. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```
4. Appliquez les migrations à la base de données :
   ```bash
   python manage.py migrate
   ```
5. *(Optionnel)* Créez un compte administrateur (Superuser) :
   ```bash
   python manage.py createsuperuser
   ```
6. *(Optionnel)* Exécutez le script d'initialisation pour créer des profils de test :
   ```bash
   python create_consultants.py
   ```
7. Lancez le serveur de développement :
   ```bash
   python manage.py runserver
   ```
   Le serveur backend sera disponible sur : `http://127.0.0.1:8000/`.

---

### 3. Configuration du Frontend (React)

1. Ouvrez un nouveau terminal et naviguez dans le dossier `frontend` :
   ```bash
   cd frontend
   ```
2. Installez les packages Node.js :
   ```bash
   npm install
   ```
3. Téléchargez/Vérifiez la présence des modèles de reconnaissance faciale dans `frontend/public/models/`.
4. Lancez l'application client :
   ```bash
   npm start
   ```
   L'application s'ouvrira automatiquement dans votre navigateur sur : `http://localhost:3000/`.

---

## 🔒 Le Système Biométrique (Comment ça marche ?)

1. **Enregistrement de l'empreinte faciale** : 
   Depuis son profil, le consultant capture son visage via sa webcam. `face-api.js` extrait le repère facial (un vecteur de 128 valeurs numériques) et l'envoie en JSON au serveur backend Django pour être stocké dans la table `UserFace`.
2. **Vérification d'accès** : 
   Lorsqu'un consultant tente d'accéder à un cours privé ou assigné à son groupe, une pop-up webcam apparaît. L'application compare son visage actuel avec l'empreinte de référence stockée en base de données.
3. **Journalisation** : 
   Chaque succès ou échec de vérification faciale est consigné dans la table `FaceAccessLog` pour des audits de sécurité futurs.
