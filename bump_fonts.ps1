$files = @(
  'c:\Users\HP\Downloads\Kavach\frontend\pages\dashboard.js',
  'c:\Users\HP\Downloads\Kavach\frontend\pages\gov.js',
  'c:\Users\HP\Downloads\Kavach\frontend\pages\hospital.js',
  'c:\Users\HP\Downloads\Kavach\frontend\pages\community.js',
  'c:\Users\HP\Downloads\Kavach\frontend\pages\alerts.js',
  'c:\Users\HP\Downloads\Kavach\frontend\components\Sidebar.jsx',
  'c:\Users\HP\Downloads\Kavach\frontend\components\Navbar.jsx'
)

foreach ($f in $files) {
  $c = [System.IO.File]::ReadAllText($f)
  # Bump small inline font sizes upward (card labels, metadata, body)
  $c = $c -replace 'fontSize: 10\b', 'fontSize: 13'
  $c = $c -replace 'fontSize: 11\b', 'fontSize: 13'
  $c = $c -replace 'fontSize: 12\b', 'fontSize: 14'
  $c = $c -replace 'fontSize: 13\b', 'fontSize: 15'
  $c = $c -replace 'fontSize: 14\b', 'fontSize: 16'
  $c = $c -replace 'fontSize: 15\b', 'fontSize: 16'
  $c = $c -replace 'fontSize: 18\b', 'fontSize: 20'
  $c = $c -replace 'fontSize: 20\b', 'fontSize: 22'
  $c = $c -replace 'fontSize: 22\b', 'fontSize: 24'
  $c = $c -replace 'fontSize: 24\b', 'fontSize: 26'
  [System.IO.File]::WriteAllText($f, $c)
  Write-Host (Split-Path $f -Leaf) 'done'
}
