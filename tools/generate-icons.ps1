Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
foreach ($size in 16, 48, 128) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $scale = $size / 128.0
    $graphics.ScaleTransform([single]$scale, [single]$scale)
    $round = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $round.AddArc(0, 0, 60, 60, 180, 90)
    $round.AddArc(68, 0, 60, 60, 270, 90)
    $round.AddArc(68, 68, 60, 60, 0, 90)
    $round.AddArc(0, 68, 60, 60, 90, 90)
    $round.CloseFigure()
    $purple = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(117, 86, 184))
    $graphics.FillPath($purple, $round)
    $star = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $star.AddBezier(64, 18, 69, 43, 85, 59, 110, 64)
    $star.AddBezier(110, 64, 85, 69, 69, 85, 64, 110)
    $star.AddBezier(64, 110, 59, 85, 43, 69, 18, 64)
    $star.AddBezier(18, 64, 43, 59, 59, 43, 64, 18)
    $graphics.FillPath([System.Drawing.Brushes]::White, $star)
    $bitmap.Save((Join-Path $root "icons/icon$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $purple.Dispose(); $star.Dispose(); $round.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}
