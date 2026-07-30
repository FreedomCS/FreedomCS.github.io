$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$photoMap = [ordered]@{
    "New York.JPG"     = "running-01-new-york.jpg"
    "Hong Kong.JPG"    = "running-02-hong-kong.jpg"
    "Singapore.JPG"    = "running-03-singapore.jpg"
    "Shenzhen.JPG"     = "running-04-shenzhen.jpg"
    "Basel.JPG"        = "running-05-basel.jpg"
    "Kuala Lumpur.JPG" = "running-06-kuala-lumpur.jpg"
    "Tirupam1.JPG"     = "running-07-hong-kong-training-1.jpg"
    "Tirupam2.JPG"     = "running-08-hong-kong-training-2.jpg"
    "Tirupam3.JPG"     = "running-09-hong-kong-training-3.jpg"
}

$runningDir = Join-Path $PSScriptRoot "..\assets\running"
$jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object MimeType -eq "image/jpeg"
$encoderParams = [System.Drawing.Imaging.EncoderParameters]::new(1)
$encoderParams.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new(
    [System.Drawing.Imaging.Encoder]::Quality,
    [long]86
)

try {
    foreach ($entry in $photoMap.GetEnumerator()) {
        $sourcePath = Join-Path $runningDir $entry.Key
        $outputPath = Join-Path $runningDir $entry.Value
        $image = [System.Drawing.Image]::FromFile((Resolve-Path $sourcePath))

        try {
            $orientation = 1
            if ($image.PropertyIdList -contains 0x0112) {
                $orientation = [BitConverter]::ToUInt16(
                    $image.GetPropertyItem(0x0112).Value,
                    0
                )
            }

            switch ($orientation) {
                3 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
                6 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
                8 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
            }

            $side = [Math]::Min($image.Width, $image.Height)
            $sourceX = [int](($image.Width - $side) / 2)
            $sourceY = [int](($image.Height - $side) / 2)
            $output = [System.Drawing.Bitmap]::new(
                1280,
                1280,
                [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
            )

            try {
                $output.SetResolution(72, 72)
                $graphics = [System.Drawing.Graphics]::FromImage($output)

                try {
                    $graphics.CompositingMode =
                        [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                    $graphics.CompositingQuality =
                        [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                    $graphics.InterpolationMode =
                        [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                    $graphics.SmoothingMode =
                        [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                    $graphics.PixelOffsetMode =
                        [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

                    $destination = [System.Drawing.Rectangle]::new(0, 0, 1280, 1280)
                    $graphics.DrawImage(
                        $image,
                        $destination,
                        $sourceX,
                        $sourceY,
                        $side,
                        $side,
                        [System.Drawing.GraphicsUnit]::Pixel
                    )
                } finally {
                    $graphics.Dispose()
                }

                # Saving a newly drawn bitmap omits EXIF, GPS, capture time,
                # device identifiers, and the original embedded thumbnail.
                $output.Save($outputPath, $jpegEncoder, $encoderParams)
            } finally {
                $output.Dispose()
            }
        } finally {
            $image.Dispose()
        }

        $written = Get-Item $outputPath
        "{0}: {1:N0} bytes" -f $written.Name, $written.Length
    }
} finally {
    $encoderParams.Dispose()
}
