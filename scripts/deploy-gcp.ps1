# Deploy Honestly to Google Cloud Run
# Run from project root: .\scripts\deploy-gcp.ps1

param(
    [string]$Project = "",
    [string]$Region = "us-central1"
)

if (-not $Project) {
    $Project = gcloud config get-value project
    if (-not $Project) {
        Write-Error "No project specified. Run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    }
}

Write-Host "Deploying Honestly to GCP project: $Project" -ForegroundColor Cyan
Write-Host ""

# Deploy API
Write-Host "1. Deploying backend API..." -ForegroundColor Yellow
Set-Location backend-python
gcloud run deploy honestly-api `
    --source . `
    --region $Region `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 10 `
    --set-env-vars "ENVIRONMENT=production"
Set-Location ..

Write-Host ""

# Deploy Frontend  
Write-Host "2. Deploying frontend app..." -ForegroundColor Yellow
Set-Location conductme
gcloud run deploy honestly-app `
    --source . `
    --region $Region `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 10
Set-Location ..

Write-Host ""
Write-Host "Done! Your services are live:" -ForegroundColor Green
gcloud run services list --region $Region --format="table(SERVICE,URL)"
