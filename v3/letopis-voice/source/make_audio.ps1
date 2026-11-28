param([string]$Voice = 'Microsoft Irina Desktop')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$speech = New-Object System.Speech.Synthesis.SpeechSynthesizer
$wav = Join-Path $PSScriptRoot 'story.wav'
$mp3 = Join-Path $PSScriptRoot '..\assets\story.mp3'
try {
    $speech.SelectVoice($Voice)
    $speech.Rate = -1
    $speech.SetOutputToWaveFile($wav)
    $speech.Speak([IO.File]::ReadAllText((Join-Path $PSScriptRoot 'story.txt'), [Text.Encoding]::UTF8))
} finally {
    $speech.Dispose()
}
& ffmpeg -hide_banner -loglevel error -y -i $wav -ac 1 -codec:a libmp3lame -b:a 64k $mp3
if ($LASTEXITCODE -ne 0) { throw 'Could not encode MP3' }
& ffprobe -v error -show_entries format=duration,size -of json $mp3
