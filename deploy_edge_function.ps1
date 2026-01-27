# Deploy Process Payment Function - Retry Script

# This script retries the deployment multiple times in case of disk space errors

$maxRetries = 3
$retryCount = 0
$success = $false

Write-Host "🚀 Deploying process-payment edge function..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

while (($retryCount -lt $maxRetries) -and (-not $success)) {
    $retryCount++
    Write-Host "📦 Attempt $retryCount of $maxRetries..." -ForegroundColor Yellow
    
    try {
        # Try deploying
        npx supabase functions deploy process-payment --no-verify-jwt
        
        if ($LASTEXITCODE -eq 0) {
            $success = $true
            Write-Host ""
            Write-Host "✅ Deployment successful!" -ForegroundColor Green
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Green
            Write-Host "1. Enable Test Mode in Supabase Dashboard (see enable_iveri_test_mode.sql)" -ForegroundColor White
            Write-Host "2. Try checkout again at http://localhost:5174/checkout" -ForegroundColor White
            Write-Host "3. Check FIX_IVERI_DNS_ERROR.md for details" -ForegroundColor White
        } else {
            throw "Deployment failed with exit code $LASTEXITCODE"
        }
    } catch {
        Write-Host "❌ Attempt $retryCount failed: $_" -ForegroundColor Red
        
        if ($retryCount -lt $maxRetries) {
            Write-Host "⏳ Waiting 3 seconds before retry..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        }
    }
}

if (-not $success) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host "❌ Deployment failed after $maxRetries attempts" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual deployment options:" -ForegroundColor Yellow
    Write-Host "1. Free up disk space and try again" -ForegroundColor White
    Write-Host "2. Use Supabase Dashboard: Edge Functions → Upload function manually" -ForegroundColor White
    Write-Host "3. Wait a few minutes and run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Function file location:" -ForegroundColor Yellow
    Write-Host "   supabase/functions/process-payment/index.ts" -ForegroundColor White
    exit 1
}
