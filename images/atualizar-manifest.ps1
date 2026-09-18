# Atualiza images/manifest.js com todas as imagens desta pasta.
# Uso (PowerShell, na raiz do projeto):  .\images\atualizar-manifest.ps1
$dir = $PSScriptRoot
$exts = @('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif')
$files = Get-ChildItem -Path $dir -File | Where-Object { $exts -contains $_.Extension.ToLower() } | Sort-Object Name
$items = $files | ForEach-Object { '  "' + ($_.Name -replace '\', '\' -replace '"', '\"') + '"' }
$content = @"
// Lista de imagens usadas na "surpresa" aleatória entre slides.
// Gerado por images/atualizar-manifest.ps1 — rode o script sempre que adicionar/remover imagens.
window.RANDOM_IMAGES = [
$($items -join ",`n")
];
"@
[System.IO.File]::WriteAllText((Join-Path $dir 'manifest.js'), $content, (New-Object System.Text.UTF8Encoding $false))
Write-Host "manifest.js atualizado com $($files.Count) imagem(ns)."
