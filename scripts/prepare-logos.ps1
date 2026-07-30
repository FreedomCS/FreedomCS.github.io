# Prepares the Tsinghua department logos for the web.
#
# Physics.png is a banner crop sitting on solid dark red, which reads as a
# filled block next to the other two marks. This trims it to its artwork so
# all three sit consistently in the row.
#
# SEM and PBCSF are used as supplied. Their artwork is dark and drawn for
# white stationery, so in dark mode style.css puts a white card behind all
# three rather than recolouring them — an institution's mark should not be
# altered.
#
#   pwsh -File scripts/prepare-logos.ps1

Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot "..\assets\logos"

function Trim-Border($srcPath, $outPath, $tolerance = 26) {
  $src = [System.Drawing.Image]::FromFile($srcPath)
  $bmp = New-Object System.Drawing.Bitmap($src.Width, $src.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.DrawImage($src, 0, 0, $src.Width, $src.Height)
  $g.Dispose(); $src.Dispose()

  $bg = $bmp.GetPixel(0, 0)
  $near = {
    param($c)
    ([Math]::Abs($c.R - $bg.R) -le $tolerance) -and
    ([Math]::Abs($c.G - $bg.G) -le $tolerance) -and
    ([Math]::Abs($c.B - $bg.B) -le $tolerance)
  }

  $minX = $bmp.Width; $minY = $bmp.Height; $maxX = -1; $maxY = -1
  for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
      if (-not (& $near $bmp.GetPixel($x, $y))) {
        if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }; if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  if ($maxX -lt 0) { Write-Warning "$srcPath is uniform; not trimmed"; $bmp.Dispose(); return }

  $w = $maxX - $minX + 1; $h = $maxY - $minY + 1
  $crop = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g2 = [System.Drawing.Graphics]::FromImage($crop)
  $g2.DrawImage($bmp, (New-Object System.Drawing.Rectangle(0, 0, $w, $h)),
                (New-Object System.Drawing.Rectangle($minX, $minY, $w, $h)),
                [System.Drawing.GraphicsUnit]::Pixel)
  $g2.Dispose()
  $crop.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  "{0,-22} {1}x{2} -> {3}x{4}" -f (Split-Path $outPath -Leaf), $bmp.Width, $bmp.Height, $w, $h
  $crop.Dispose(); $bmp.Dispose()
}

Trim-Border (Join-Path $dir "Physics.png") (Join-Path $dir "web-physics.png")
