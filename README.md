# EpiTrack

PWA simple et maintenable pour suivre des crises d’épilepsie depuis un hébergement statique GitHub Pages, avec authentification Firebase email/mot de passe et stockage Firestore privé par utilisateur.

## Stack retenue

- React 19 + TypeScript
- Vite pour le build statique
- React Router avec `HashRouter` pour éviter les problèmes de routing sur GitHub Pages
- Firebase Firestore en mode client-side
- Architecture modulaire `app / modules / services / shared`

## Architecture technique

- `src/app` : shell global, routing, navigation principale
- `src/modules/auth` : connexion et création de compte
- `src/modules/calendar` : vue mois, vue année, agrégations, hooks de lecture
- `src/modules/events` : formulaire d’ajout d’une crise
- `src/services/firebase` : initialisation Firebase
- `src/services/epilepsy-events` : accès Firestore et transformations de données
- `src/shared` : types, constantes, composants génériques, utilitaires
- `src/styles` : design tokens et styles globaux

Cette base sépare la logique métier, la persistance et l’UI. Elle permet d’ajouter plus tard statistiques, filtres, édition, suppression, profils ou paramètres sans refonte.

## Arborescence

```text
.
├── .env.example
├── .github/
│   └── workflows/
│       └── deploy.yml
├── README.md
├── index.html
├── package.json
├── public/
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   ├── pwa-192.svg
│   ├── pwa-512.svg
│   └── sw.js
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── AppShell.tsx
│   ├── main.tsx
│   ├── modules/
│   │   ├── auth/
│   │   │   └── AuthPage.tsx
│   │   ├── calendar/
│   │   │   ├── CalendarPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── MonthCalendar.tsx
│   │   │   │   └── YearSummaryGrid.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useEpilepsyEvents.ts
│   │   │   └── utils/
│   │   │       ├── aggregations.ts
│   │   │       └── date.ts
│   │   └── events/
│   │       └── AddEventPage.tsx
│   ├── services/
│   │   ├── auth/
│   │   │   └── AuthContext.tsx
│   │   ├── epilepsy-events/
│   │   │   ├── eventService.ts
│   │   │   └── eventTransforms.ts
│   │   └── firebase/
│   │       └── config.ts
│   ├── shared/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── types/
│   │   └── utils/
│   ├── styles/
│   │   └── global.css
│   └── vite-env.d.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Modèle Firestore

Structure proposée :

- `users/{uid}/epilepsyEvents/{eventId}`

Exemple de document :

```json
{
  "dateKey": "2026-04-16",
  "monthKey": "2026-04",
  "year": 2026,
  "month": 4,
  "day": 16,
  "color": "orange",
  "observation": "Crise courte en fin de matinée",
  "createdAt": "serverTimestamp()"
}
```

Notes :

- `dateKey` sert au tri par jour
- `monthKey` simplifie les regroupements mensuels
- `year`, `month`, `day` facilitent les filtres et agrégats
- plusieurs crises le même jour sont simplement plusieurs documents distincts

## Installation

### 1. Dépendances

```bash
npm install
```

### 2. Variables d’environnement

Copiez `.env.example` vers `.env.local` puis renseignez vos clés Firebase :

```bash
cp .env.example .env.local
```

Variables requises :

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

En local, vous pouvez laisser :

```env
VITE_BASE_PATH=/
```

## Lancement local

```bash
npm run dev
```

## Build production

```bash
npm run build
```

Le build sort dans `dist/`.

## Déploiement GitHub Pages

Le dépôt contient déjà un workflow GitHub Actions dans `.github/workflows/deploy.yml`.

Principe :

- build Vite sur chaque push vers `main`
- `VITE_BASE_PATH` est calculé automatiquement à partir du nom du dépôt
- les secrets Firebase sont injectés via GitHub Actions
- le dossier `dist/` est publié sur GitHub Pages

## Configuration Firebase / Firestore

### 1. Créer le projet Firebase

- Ouvrir la console Firebase
- Créer un projet
- Ajouter une application Web
- Copier les identifiants dans `.env.local`

### 2. Activer Firestore

- Créer une base Firestore en mode natif
- Choisir une région proche de vos utilisateurs

### 3. Activer Firebase Authentication

- Activer le provider `Email/Password`
- La création de compte est gérée directement dans l’application

### 4. Structure des données

- Les documents sont créés automatiquement dans `users/{uid}/epilepsyEvents`

### 5. Règles Firestore

Règles privées par utilisateur :

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/epilepsyEvents/{eventId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Variables GitHub Actions à configurer

Dans GitHub, ajouter ces secrets de dépôt :

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Comportement produit implémenté

- ajout d’une crise avec date, couleur et observation facultative
- connexion et création de compte via Firebase Auth `email/password`
- redirection directe vers l’espace personnel si l’utilisateur est déjà connecté
- bouton de déconnexion dans le header
- plusieurs crises possibles le même jour
- vue mensuelle avec points colorés compacts dans chaque cellule
- vue annuelle avec total par mois
- totaux mois / année : `jaune + orange`, `rouge`, `global`
- mise à jour immédiate via écoute Firestore temps réel sur l’année affichée
- navigation principale extensible
- bouton flottant `+` pour la saisie rapide
- PWA minimale avec manifeste et service worker simple

## Choix d’architecture

- `HashRouter` évite toute dépendance à une configuration serveur spécifique sur GitHub Pages
- Firebase Auth protège l’accès à l’application côté client
- les données Firestore sont isolées par utilisateur avec le chemin `users/{uid}/epilepsyEvents`
- les appels Firestore sont isolés dans `services/`
- les agrégations sont calculées dans `modules/calendar/utils`
- les types sont centralisés dans `shared/types`
- le design system minimal est défini via tokens CSS dans `src/styles/global.css`

## Limites actuelles volontaires

- pas d’édition / suppression
- pas de statistiques détaillées
- pas de mode hors-ligne complet, seulement un shell PWA minimal

Ces éléments sont laissés hors scope pour garder une base simple et propre.
