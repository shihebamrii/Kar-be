# Karhabti Backend - Carnet d'entretien digital

Backend complet pour l'application Karhabti, permettant aux utilisateurs de gérer l'entretien de leurs véhicules via un carnet digital accessible par carte NFC.

## 🚀 Technologies

- **Next.js** avec API Routes
- **MongoDB Atlas** avec Mongoose
- **JWT** pour l'authentification
- **bcryptjs** pour le hashage des mots de passe
- **PDFKit** pour la génération de PDF
- **date-fns** pour la gestion des dates

## 📋 Prérequis

- Node.js 18+ installé
- Compte MongoDB Atlas (ou MongoDB local)
- npm ou yarn

## 🛠️ Installation

1. **Cloner le projet** (si applicable) ou naviguer dans le dossier du projet

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement** :
   - Copier `env.example` vers `.env.local` :
     ```bash
     cp env.example .env.local
     ```
   - Modifier `.env.local` avec vos paramètres :
     ```env
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/karhabti?retryWrites=true&w=majority
     JWT_SECRET=your-secret-key-change-in-production
     ```

4. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

   Le serveur sera accessible sur `http://localhost:3000`

## 🌱 Seed de la base de données

Pour créer des données de test (1 utilisateur + 1 véhicule + 2 services) :

```bash
npm run seed
```

**Identifiants de test :**
- **Admin** : 
  - Email: `admin@karhabti.com`
  - Password: `admin123`
  - Role: `admin`
- **Utilisateur** :
  - Email: `test@karhabti.com`
  - Password: `password123`
  - Role: `user`

## 📚 API Endpoints

### Authentification

#### `POST /api/auth/register`
Créer un nouveau compte utilisateur.

**Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### `POST /api/auth/login`
Se connecter avec email et mot de passe.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Véhicules

#### `GET /api/vehicles`
Lister tous les véhicules de l'utilisateur connecté.

**Headers:**
```
Authorization: Bearer <token>
```

#### `POST /api/vehicles`
Créer un nouveau véhicule.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "marque": "Peugeot",
  "modele": "208",
  "annee": 2020,
  "immatriculation": "AB-123-CD"
}
```

#### `GET /api/vehicles/:id`
Récupérer les détails d'un véhicule.

**Headers:**
```
Authorization: Bearer <token>
```

#### `PUT /api/vehicles/:id`
Modifier un véhicule.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "marque": "Peugeot",
  "modele": "308",
  "annee": 2021
}
```

#### `DELETE /api/vehicles/:id`
Supprimer un véhicule (et tous ses services associés).

**Headers:**
```
Authorization: Bearer <token>
```

### Services

#### `GET /api/services`
Lister tous les services de l'utilisateur connecté.

**Query Parameters:**
- `type` (optionnel): Filtrer par type de service (Vidange, Freins, Pneus, etc.)
- `vehicleId` (optionnel): Filtrer par véhicule

**Headers:**
```
Authorization: Bearer <token>
```

#### `POST /api/services`
Créer un nouveau service.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "vehicle": "vehicle_id",
  "type": "Vidange",
  "date": "2024-01-15",
  "kilometrage": 75000,
  "notes": "Vidange effectuée avec huile 5W-30"
}
```

**Types de services disponibles :**
- `Vidange`
- `Freins`
- `Pneus`
- `Filtres`
- `Batterie`
- `Révision`
- `Autre`

#### `GET /api/services/:id`
Récupérer les détails d'un service.

**Headers:**
```
Authorization: Bearer <token>
```

#### `PUT /api/services/:id`
Modifier un service.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "type": "Vidange",
  "date": "2024-01-20",
  "kilometrage": 76000,
  "notes": "Notes mises à jour"
}
```

#### `DELETE /api/services/:id`
Supprimer un service.

**Headers:**
```
Authorization: Bearer <token>
```

### Export

#### `GET /api/export/pdf/:vehicleId`
Exporter l'historique d'un véhicule en PDF.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** Fichier PDF à télécharger

### Notifications

#### `GET /api/notifications`
Récupérer les alertes pour les services à venir ou en retard.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "type": "upcoming_service",
        "priority": "high",
        "vehicle": {
          "id": "...",
          "marque": "Peugeot",
          "modele": "208",
          "immatriculation": "AB-123-CD"
        },
        "serviceType": "Vidange",
        "daysUntilService": 15,
        "lastServiceDate": "2023-06-15T00:00:00.000Z",
        "lastServiceKilometrage": 50000,
        "message": "Service Vidange recommandé dans 15 jour(s) pour Peugeot 208 (AB-123-CD)"
      }
    ],
    "count": 1,
    "summary": {
      "high": 1,
      "medium": 0,
      "low": 0
    }
  }
}
```

### Admin

> ⚠️ **Important** : Toutes les routes admin nécessitent un compte administrateur. Connectez-vous avec un compte admin pour accéder à ces routes.

#### `GET /api/admin/users`
Lister tous les utilisateurs de la plateforme.

**Headers:**
```
Authorization: Bearer <admin_token>
```

#### `GET /api/admin/users/:id`
Récupérer les détails d'un utilisateur par ID.

**Headers:**
```
Authorization: Bearer <admin_token>
```

#### `PUT /api/admin/users/:id`
Modifier un utilisateur (changer le rôle, email, username).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Body:**
```json
{
  "username": "newusername",
  "email": "newemail@example.com",
  "role": "admin"
}
```

#### `DELETE /api/admin/users/:id`
Supprimer un utilisateur et toutes ses données associées (véhicules, services).

**Headers:**
```
Authorization: Bearer <admin_token>
```

#### `GET /api/admin/vehicles`
Lister tous les véhicules de tous les utilisateurs.

**Headers:**
```
Authorization: Bearer <admin_token>
```

#### `GET /api/admin/vehicles/:id`
Récupérer les détails d'un véhicule par ID.

**Headers:**
```
Authorization: Bearer <admin_token>
```

#### `PUT /api/admin/vehicles/:id`
Modifier un véhicule (peut changer le propriétaire, etc.).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Body:**
```json
{
  "marque": "Peugeot",
  "modele": "308",
  "annee": 2021,
  "immatriculation": "CD-456-EF",
  "owner": "new_owner_id"
}
```

#### `DELETE /api/admin/vehicles/:id`
Supprimer un véhicule et tous ses services associés.

**Headers:**
```
Authorization: Bearer <admin_token>
```

#### `GET /api/admin/services`
Lister tous les services de tous les utilisateurs.

**Query Parameters:**
- `type` (optionnel): Filtrer par type de service
- `vehicleId` (optionnel): Filtrer par véhicule

**Headers:**
```
Authorization: Bearer <admin_token>
```

#### `GET /api/admin/services/:id`
Récupérer les détails d'un service par ID.

**Headers:**
```
Authorization: Bearer <admin_token>
```

#### `PUT /api/admin/services/:id`
Modifier un service (peut changer le véhicule associé).

**Headers:**
```
Authorization: Bearer <admin_token>
```

#### `DELETE /api/admin/services/:id`
Supprimer un service.

**Headers:**
```
Authorization: Bearer <admin_token>
```

#### `GET /api/admin/stats`
Récupérer les statistiques globales de la plateforme.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "overview": {
      "totalUsers": 150,
      "totalAdmins": 2,
      "totalRegularUsers": 148,
      "totalVehicles": 200,
      "totalServices": 500,
      "newUsersLastMonth": 15,
      "newVehiclesLastMonth": 20,
      "newServicesLastMonth": 45
    },
    "servicesByType": [...],
    "vehiclesByBrand": [...],
    "servicesByMonth": [...],
    "topUsers": [...],
    "topVehicles": [...],
    "recentServices": [...]
  }
}
```

## 🔒 Sécurité

- Toutes les routes (sauf `/api/auth/register` et `/api/auth/login`) nécessitent un token JWT dans le header `Authorization: Bearer <token>`
- Les routes admin nécessitent un compte avec le rôle `admin`
- Les mots de passe sont hashés avec bcrypt avant d'être stockés en base de données
- Validation des inputs côté serveur
- Les utilisateurs ne peuvent accéder qu'à leurs propres véhicules et services
- Les administrateurs ont accès à toutes les données de la plateforme

## 📝 Structure du projet

```
kar-be/
├── pages/
│   └── api/
│       ├── auth/
│       │   ├── register.js
│       │   └── login.js
│       ├── vehicles/
│       │   ├── index.js
│       │   └── [id].js
│       ├── services/
│       │   ├── index.js
│       │   └── [id].js
│       ├── export/
│       │   └── pdf/
│       │       └── [vehicleId].js
│       ├── notifications/
│       │   └── index.js
│       └── admin/
│           ├── users/
│           │   ├── index.js
│           │   └── [id].js
│           ├── vehicles/
│           │   ├── index.js
│           │   └── [id].js
│           ├── services/
│           │   └── [id].js
│           └── stats/
│               └── index.js
├── models/
│   ├── User.js
│   ├── Vehicle.js
│   └── Service.js
├── middlewares/
│   ├── authMiddleware.js
│   └── adminMiddleware.js
├── utils/
│   ├── dbConnect.js
│   └── pdfGenerator.js
├── scripts/
│   └── seed.js
├── next.config.js
├── package.json
└── README.md
```

## 🧪 Test avec Postman

1. **Créer un utilisateur** :
   - POST `http://localhost:3000/api/auth/register`
   - Body (raw JSON) :
     ```json
     {
       "username": "testuser",
       "email": "test@example.com",
       "password": "password123"
     }
     ```

2. **Se connecter** :
   - POST `http://localhost:3000/api/auth/login`
   - Body (raw JSON) :
     ```json
     {
       "email": "test@example.com",
       "password": "password123"
     }
     ```
   - Copier le token retourné

3. **Créer un véhicule** :
   - POST `http://localhost:3000/api/vehicles`
   - Headers :
     - `Authorization: Bearer <token>`
   - Body (raw JSON) :
     ```json
     {
       "marque": "Peugeot",
       "modele": "208",
       "annee": 2020,
       "immatriculation": "AB-123-CD"
     }
     ```

4. **Ajouter un service** :
   - POST `http://localhost:3000/api/services`
   - Headers :
     - `Authorization: Bearer <token>`
   - Body (raw JSON) :
     ```json
     {
       "vehicle": "<vehicle_id>",
       "type": "Vidange",
       "date": "2024-01-15",
       "kilometrage": 50000,
       "notes": "Vidange effectuée"
     }
     ```

5. **Exporter en PDF** :
   - GET `http://localhost:3000/api/export/pdf/<vehicle_id>`
   - Headers :
     - `Authorization: Bearer <token>`

6. **Voir les notifications** :
   - GET `http://localhost:3000/api/notifications`
   - Headers :
     - `Authorization: Bearer <token>`

**Routes Admin :**

7. **Se connecter en tant qu'admin** :
   - POST `http://localhost:3000/api/auth/login`
   - Body (raw JSON) :
     ```json
     {
       "email": "admin@karhabti.com",
       "password": "admin123"
     }
     ```
   - Copier le token admin retourné

8. **Voir toutes les statistiques** :
   - GET `http://localhost:3000/api/admin/stats`
   - Headers :
     - `Authorization: Bearer <admin_token>`

9. **Lister tous les utilisateurs** :
   - GET `http://localhost:3000/api/admin/users`
   - Headers :
     - `Authorization: Bearer <admin_token>`

10. **Lister tous les véhicules** :
    - GET `http://localhost:3000/api/admin/vehicles`
    - Headers :
      - `Authorization: Bearer <admin_token>`

## 🐛 Dépannage

- **Erreur de connexion MongoDB** : Vérifiez que `MONGODB_URI` est correctement configuré dans `.env.local`
- **Erreur JWT** : Assurez-vous que `JWT_SECRET` est défini dans `.env.local`
- **Erreur 401 Unauthorized** : Vérifiez que le token JWT est valide et présent dans le header `Authorization`

## 📄 Licence

ISC

