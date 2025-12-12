# Deploy Honestly to Google Cloud Run
# Run from project root: .\scripts\deploy-gcp.ps1

param(
    [string]$Project = "",
    [string]$Region = "us-central1",
    [switch]$MapDomains = $false,
    [string]$ApiDomain = "api.veridicus.io",
    [string]$AppDomain = "app.veridicus.io"
)

if (-not $Project) {
    $Project = gcloud config get-value project
    if (-not $Project) {
        Write-Error "No project specified. Run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    }
}

Write-Host "Deploying Honestly to GCP project: $Project" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
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
    --set-env-vars "ENVIRONMENT=production" `
    --project $Project

if ($LASTEXITCODE -ne 0) {
    Write-Error "Backend deployment failed!"
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host ""

# Get the backend URL for frontend configuration
$API_URL = gcloud run services describe honestly-api --region $Region --format="value(status.url)" --project $Project
Write-Host "Backend URL: $API_URL" -ForegroundColor Green

# If using custom domains, use the domain instead
if ($MapDomains) {
    $API_URL = "https://$ApiDomain"
    Write-Host "Will configure frontend to use: $API_URL" -ForegroundColor Cyan
}

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
    --max-instances 10 `
    --set-env-vars "NEXT_PUBLIC_API_URL=$API_URL" `
    --project $Project

if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend deployment failed!"
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host ""

# Map custom domains if requested
if ($MapDomains) {
    Write-Host "3. Mapping custom domains..." -ForegroundColor Yellow

    Write-Host "   Mapping $ApiDomain to honestly-api..." -ForegroundColor Cyan
    gcloud run domain-mappings create `
        --service honestly-api `
        --domain $ApiDomain `
        --region $Region `
        --project $Project

    Write-Host ""
    Write-Host "   Mapping $AppDomain to honestly-app..." -ForegroundColor Cyan
    gcloud run domain-mappings create `
        --service honestly-app `
        --domain $AppDomain `
        --region $Region `
        --project $Project

    Write-Host ""
    Write-Host "Domain Mapping Instructions:" -ForegroundColor Yellow
    Write-Host "Add these DNS records at your domain registrar:" -ForegroundColor White
    Write-Host "  $ApiDomain -> CNAME -> ghs.googlehosted.com" -ForegroundColor Gray
    Write-Host "  $AppDomain -> CNAME -> ghs.googlehosted.com" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "Done! Your services are live:" -ForegroundColor Green
gcloud run services list --region $Region --format="table(SERVICE,URL)" --project $Project

if ($MapDomains) {
    Write-Host ""
    Write-Host "Custom domains (may take a few minutes to activate):" -ForegroundColor Green
    Write-Host "  API:  https://$ApiDomain" -ForegroundColor White
    Write-Host "  App:  https://$AppDomain" -ForegroundColor White
}
