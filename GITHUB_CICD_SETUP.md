# Configuracion CI/CD PsicoAgenda (GitHub + GCP)

Este proyecto ya incluye workflows para desplegar automaticamente:

- Frontend a Firebase Hosting: .github/workflows/deploy-frontend-firebase.yml
- Backend a Cloud Run: .github/workflows/deploy-backend-cloudrun.yml

## 1) Valores base definidos

- Proyecto GCP: psicoagenda-489800
- Region Cloud Run: us-central1
- Servicio Cloud Run (asumido): psicoagenda-api
- Repo GitHub: ValenzuelaxD/PsicoAgenda

Nota: si tu servicio en Cloud Run tiene otro nombre, actualiza CLOUD_RUN_SERVICE en el workflow del backend.

## 2) Crear Service Account para CI

Ejecuta en Cloud Shell o terminal con gcloud autenticado:

```bash
gcloud config set project psicoagenda-489800

gcloud iam service-accounts create github-actions-ci \
  --display-name="GitHub Actions CI"
```

## 3) Dar permisos minimos recomendados

```bash
gcloud projects add-iam-policy-binding psicoagenda-489800 \
  --member="serviceAccount:github-actions-ci@psicoagenda-489800.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding psicoagenda-489800 \
  --member="serviceAccount:github-actions-ci@psicoagenda-489800.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding psicoagenda-489800 \
  --member="serviceAccount:github-actions-ci@psicoagenda-489800.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding psicoagenda-489800 \
  --member="serviceAccount:github-actions-ci@psicoagenda-489800.iam.gserviceaccount.com" \
  --role="roles/firebasehosting.admin"

gcloud projects add-iam-policy-binding psicoagenda-489800 \
  --member="serviceAccount:github-actions-ci@psicoagenda-489800.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

## 4) Configurar Workload Identity Federation

Crear pool y provider (OIDC GitHub):

```bash
gcloud iam workload-identity-pools create github-pool \
  --location="global" \
  --display-name="GitHub Pool"

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository"
```

Permitir que el repo use el provider:

```bash
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-ci@psicoagenda-489800.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/ValenzuelaxD/PsicoAgenda"
```

Obtiene tu PROJECT_NUMBER:

```bash
gcloud projects describe psicoagenda-489800 --format="value(projectNumber)"
```

Construye el valor final de provider:

```text
projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

## 5) Configurar Secrets y Variables en GitHub

En Settings > Secrets and variables > Actions:

Secrets requeridos:

- GCP_WORKLOAD_IDENTITY_PROVIDER
- GCP_SERVICE_ACCOUNT (github-actions-ci@psicoagenda-489800.iam.gserviceaccount.com)
- DB_USER
- DB_HOST
- DB_DATABASE
- DB_PASSWORD
- DB_PORT
- JWT_SECRET

Variables requeridas:

- VITE_API_URL = https://psicoagenda-api-315439788368.us-central1.run.app

## 6) Proteger rama main

En GitHub > Branch protection:

- Require pull request before merging
- Require status checks to pass
- Restrict who can push to main

## 7) Validar despliegue automatico

1. Haz commit y push de estos cambios a una rama feature.
2. Abre PR a main y merge.
3. Verifica en Actions que corren ambos workflows.
4. Frontend: abre tu URL de Hosting y revisa cambios.
5. Backend: valida endpoint de salud /test-db.

## 8) Notas importantes

- El repo ahora ignora build/ para evitar subir artefactos compilados.
- Si ya estabas versionando build/, se eliminara del repositorio en el siguiente commit.
- Los archivos de ejemplo para entorno son:
  - .env.example
  - server/.env.example
