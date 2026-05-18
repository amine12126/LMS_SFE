$files = @(
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
)
New-Item -ItemType Directory -Force -Path public\models
foreach ($file in $files) {
    $url = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/$file"
    $out = "public\models\$file"
    Write-Host "Downloading $url"
    Invoke-WebRequest -Uri $url -OutFile $out
}
