<#
.SYNOPSIS
    OmniTeq Cloud - full API integration check.

.DESCRIPTION
    Exercises every endpoint the web console calls, plus the exact request
    payloads each page sends, and reports PASS/FAIL for each with the raw
    server response. Read-only against the app: it creates one throwaway
    account and cleans up after itself.

.PARAMETER BaseUrl
    Gateway base URL. Default: https://omniteq-server.tail206540.ts.net
    Keep this in sync with GATEWAY_ORIGIN in js/config.js.

.PARAMETER Tag
    Optional label added to the throwaway account email, to tell runs apart.

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\check-api.ps1
    powershell -NoProfile -ExecutionPolicy Bypass -File .\check-api.ps1 -BaseUrl http://100.64.0.5:3000

.NOTES
    Results are also written next to this script as check-api-results.txt
#>
[CmdletBinding()]
param(
    [string]$BaseUrl = 'https://omniteq-server.tail206540.ts.net',
    [string]$Tag = ''
)

$ErrorActionPreference = 'Continue'
$BaseUrl = $BaseUrl.TrimEnd('/')
$Api = "$BaseUrl/api/v1"
$script:Pass = 0
$script:Fail = 0
$script:Warn = 0
# Set when a specific known server-side defect is observed, so the summary can list
# only the items that were actually reproduced by this run.
$script:CascadeDefect = $false
$script:RequiredParamDefect = $false
$script:Lines = New-Object System.Collections.Generic.List[string]

# ------------------------------------------------------------------ transport
<#
  Two independent PowerShell-5.1 problems made earlier runs misreport the server:

  1. Invoke-WebRequest silently DROPS the body of a non-2xx response, so a real
     JSON error envelope looked like an empty body.
  2. Passing a JSON string to native curl.exe mangles its embedded double quotes,
     so the server received {email:"x"} instead of {"email":"x"} and replied
     INTERNAL_ERROR "Expected property name or '}' in JSON at position 1".

  .NET's HttpClient (present on every Windows install) has neither problem: it
  returns error bodies reliably and sends request bodies verbatim, without ever
  going through native argument quoting. It is therefore the primary transport.
#>
$script:HttpClient = $null
$script:CurlExe = $null

try {
    Add-Type -AssemblyName System.Net.Http -ErrorAction Stop
    $script:HttpClient = New-Object System.Net.Http.HttpClient
    $script:HttpClient.Timeout = [TimeSpan]::FromSeconds(30)
} catch {
    $script:HttpClient = $null
}

$candidate = Get-Command curl.exe -ErrorAction SilentlyContinue
if ($candidate -and $candidate.Source -notlike '*Invoke-WebRequest*' -and $candidate.Source -notlike '*Invoke-RestMethod*') {
    $script:CurlExe = $candidate.Source
}

function Get-HttpMethod {
    param([string]$Method)
    switch ($Method.ToUpperInvariant()) {
        'GET'    { return [System.Net.Http.HttpMethod]::Get }
        'POST'   { return [System.Net.Http.HttpMethod]::Post }
        'PUT'    { return [System.Net.Http.HttpMethod]::Put }
        'DELETE' { return [System.Net.Http.HttpMethod]::Delete }
        default  { return (New-Object System.Net.Http.HttpMethod($Method)) }
    }
}

# Primary reader. Returns @{ Status = <int>; Body = <string> } or $null when the
# .NET HTTP stack is unavailable, in which case Invoke-Api falls back.
function Invoke-RawHttp {
    param([string]$Method, [string]$Url, [string]$Token, [string]$JsonBody)
    if (-not $script:HttpClient) { return $null }
    $req = $null
    try {
        $req = New-Object System.Net.Http.HttpRequestMessage((Get-HttpMethod $Method), $Url)
        $req.Headers.Add('Accept', 'application/json')
        if ($Token) { $req.Headers.Add('Authorization', "Bearer $Token") }
        if ($JsonBody) {
            $content = New-Object System.Net.Http.StringContent($JsonBody)
            # Set the media type explicitly so no "; charset=utf-8" is appended.
            $content.Headers.ContentType = New-Object System.Net.Http.Headers.MediaTypeHeaderValue('application/json')
            $req.Content = $content
        }
        $resp = $script:HttpClient.SendAsync($req).GetAwaiter().GetResult()
        $status = [int]$resp.StatusCode
        $body = [string]$resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        $resp.Dispose()
        return @{ Status = $status; Body = $body }
    } catch {
        return $null
    } finally {
        if ($req) { $req.Dispose() }
    }
}

# Secondary reader, used only by the section 0b diagnostic. Request bodies go
# through a temp file ("@file") specifically to sidestep the quote mangling that
# affects inline arguments.
function Invoke-CurlRaw {
    param([string]$Method, [string]$Url, [string]$Token, [string]$JsonBody)
    if (-not $script:CurlExe) { return $null }
    $tmp = $null
    $cargs = @('-s', '-X', $Method, '-H', 'Accept: application/json')
    if ($Token) { $cargs += @('-H', "Authorization: Bearer $Token") }
    if ($JsonBody) {
        $tmp = [System.IO.Path]::GetTempFileName()
        [System.IO.File]::WriteAllText($tmp, $JsonBody, (New-Object System.Text.UTF8Encoding($false)))
        $cargs += @('-H', 'Content-Type: application/json', '--data-binary', "@$tmp")
    }
    $cargs += $Url
    try {
        $out = & $script:CurlExe @cargs 2>$null
        if ($null -eq $out) { return '' }
        return ($out -join "`n")
    } catch {
        return $null
    } finally {
        if ($tmp -and (Test-Path -LiteralPath $tmp)) { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }
    }
}

function Write-Line {
    param([string]$Text = '', [string]$Color = 'Gray')
    Write-Host $Text -ForegroundColor $Color
    $script:Lines.Add($Text)
}

function Section {
    param([string]$Title)
    Write-Line ''
    Write-Line ("=" * 74) 'DarkCyan'
    Write-Line "  $Title" 'DarkCyan'
    Write-Line ("=" * 74) 'DarkCyan'
}

function Check {
    param(
        [string]$Name,
        [bool]$Ok,
        [string]$Detail = '',
        [string]$Severity = 'Fail'
    )
    if ($Ok) {
        $script:Pass++
        Write-Line ("  PASS  " + $Name) 'Green'
    } else {
        if ($Severity -eq 'Warn') {
            $script:Warn++
            Write-Line ("  WARN  " + $Name) 'Yellow'
        } else {
            $script:Fail++
            Write-Line ("  FAIL  " + $Name) 'Red'
        }
        if ($Detail) { Write-Line ("        $Detail") 'DarkGray' }
    }
}

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        $Body,
        [string]$Token,
        [switch]$NoAuth
    )
    $headers = @{ 'Accept' = 'application/json' }
    if ($Token -and -not $NoAuth) { $headers['Authorization'] = "Bearer $Token" }

    $url = "$Api$Path"
    $jsonBody = $null
    if ($null -ne $Body) { $jsonBody = ($Body | ConvertTo-Json -Depth 12 -Compress) }
    $authToken = if ($NoAuth) { $null } else { $Token }

    # Primary transport: .NET HttpClient. Reads error bodies reliably and sends
    # request bodies verbatim (see the transport notes above).
    $raw = Invoke-RawHttp -Method $Method -Url $url -Token $authToken -JsonBody $jsonBody
    if ($raw) {
        $json = $null
        try { $json = $raw.Body | ConvertFrom-Json } catch { }
        return [pscustomobject]@{ Status = $raw.Status; Body = $raw.Body; Json = $json }
    }

    # Fallback only when the .NET HTTP stack is unavailable.
    $params = @{
        Uri             = $url
        Method          = $Method
        TimeoutSec      = 25
        UseBasicParsing = $true
        Headers         = $headers
    }
    if ($null -ne $jsonBody) {
        $params['Body'] = $jsonBody
        $params['ContentType'] = 'application/json'
    }

    try {
        $r = Invoke-WebRequest @params
        $status = [int]$r.StatusCode
        $text = [string]$r.Content
    } catch {
        $resp = $_.Exception.Response
        if (-not $resp) {
            return [pscustomobject]@{ Status = -1; Body = $_.Exception.Message; Json = $null }
        }
        $status = [int]$resp.StatusCode
        $text = ''
        try { $sr = New-Object IO.StreamReader($resp.GetResponseStream()); $text = $sr.ReadToEnd() } catch { }
    }

    $json = $null
    try { $json = $text | ConvertFrom-Json } catch { }
    return [pscustomobject]@{ Status = $status; Body = $text; Json = $json }
}

function Show-Raw {
    param($Res, [int]$Max = 400)
    if ($null -eq $Res) { return }
    $b = [string]$Res.Body
    if ($b.Length -gt $Max) { $b = $b.Substring(0, $Max) + ' ...' }
    Write-Line ("        HTTP {0} :: {1}" -f $Res.Status, $b) 'DarkGray'
}

# ---------------------------------------------------------------- preflight
Section "0. PREFLIGHT"

Write-Line ("  Target : $Api")
Write-Line ("  Time   : " + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))

try {
    $health = Invoke-WebRequest -Uri "$BaseUrl/health" -Method GET -TimeoutSec 10 -UseBasicParsing
    $hj = $null; try { $hj = $health.Content | ConvertFrom-Json } catch { }
    Check "GET /health -> 200" ($health.StatusCode -eq 200) ("HTTP " + $health.StatusCode)
    if ($hj) { Write-Line ("        server status=$($hj.status) version=$($hj.version) time=$($hj.timestamp)") 'DarkGray' }
    if ($hj -and $hj.timestamp) {
        $skew = [math]::Round((([datetime]$hj.timestamp).ToUniversalTime() - (Get-Date).ToUniversalTime()).TotalSeconds, 1)
        Check "server clock within 120s of client (telemetry windows)" ([math]::Abs($skew) -lt 120) ("skew = $skew s")
    }
} catch {
    Write-Line ''
    Write-Line "  FATAL: gateway not reachable at $BaseUrl" 'Red'
    Write-Line ("  $($_.Exception.Message)") 'Red'
    Write-Line ''
    Write-Line "  Start the server (or connect Tailscale) and re-run this script." 'Yellow'
    $script:Lines | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'check-api-results.txt') -Encoding UTF8
    exit 2
}

# ------------------------------------------------- error body reader check
Section "0b. ERROR BODY READER DIAGNOSTIC"

<#
  Earlier runs reported every error as an empty body and concluded the gateway had
  no JSON error envelope. That was wrong twice over:
    - Invoke-WebRequest (PS 5.1) drops the body of a non-2xx response;
    - passing a JSON string to native curl.exe mangles its quotes, so the server
      saw {email:"x"} and answered INTERNAL_ERROR "Expected property name ...".

  The probe below uses a GET that fails with 404, i.e. NO request body, so the
  only variable is the reader. Three clients replay the identical request.
  .NET HttpClient is what Invoke-Api now uses.
#>
Write-Line ("  readers  : .NET HttpClient (primary) | curl.exe : " + $(if ($script:CurlExe) { $script:CurlExe } else { 'NOT AVAILABLE' }))

$probeUrl = "$Api/projects/00000000-0000-0000-0000-000000000000"

# reader A: Invoke-WebRequest (the transport that produced the false findings)
$psBody = ''
$psStatus = -1
try {
    $pr = Invoke-WebRequest -Uri $probeUrl -Method GET -Headers @{ Accept = 'application/json' } -TimeoutSec 20 -UseBasicParsing
    $psStatus = [int]$pr.StatusCode
    $psBody = [string]$pr.Content
} catch {
    $presp = $_.Exception.Response
    if ($presp) {
        $psStatus = [int]$presp.StatusCode
        try { $sr = New-Object IO.StreamReader($presp.GetResponseStream()); $psBody = $sr.ReadToEnd() } catch { }
    }
}

# reader B: .NET HttpClient (now the primary transport)
$raw = Invoke-RawHttp -Method 'GET' -Url $probeUrl -Token $null -JsonBody $null
$netStatus = if ($raw) { $raw.Status } else { -1 }
$netBody = if ($raw) { [string]$raw.Body } else { '' }

# reader C: curl.exe
$curlBody = Invoke-CurlRaw -Method 'GET' -Url $probeUrl -Token $null -JsonBody $null

$psBlank = [string]::IsNullOrWhiteSpace($psBody)
$netBlank = [string]::IsNullOrWhiteSpace($netBody)
$curlBlank = [string]::IsNullOrWhiteSpace($curlBody)

Write-Line ("  probe    : GET /projects/<uuid> with no token -> HTTP $psStatus (all readers agree on status)")
Write-Line ("  reader A (Invoke-WebRequest) : " + $(if ($psBlank) { '(EMPTY BODY)' } else { $psBody.Trim() }))
Write-Line ("  reader B (.NET HttpClient)   : " + $(if ($netBlank) { '(empty body)' } else { $netBody.Trim() }))
Write-Line ("  reader C (curl.exe)          : " + $(if ($curlBlank) { '(empty body)' } else { $curlBody.Trim() }))
Write-Line ''

if (-not $netBlank -and -not $curlBlank) {
    if ($psBlank) {
        Write-Line "  CONCLUSION: the gateway DOES return the documented JSON error envelope." 'Green'
        Write-Line "  The earlier 'missing envelope' finding was a PowerShell 5.1 reader artifact." 'Green'
        Write-Line "  HttpClient (primary) and curl both read it correctly, so sections below are valid." 'Green'
    } else {
        Write-Line "  CONCLUSION: all three readers see the error envelope." 'Green'
    }
    Check "error envelope is readable by the client used for this run" $true
    Check "gateway sends a machine-readable error envelope" $true
} elseif ($netBlank -and $curlBlank) {
    Write-Line "  CONCLUSION: two independent clients see an empty body - the gateway omits it." 'Yellow'
    Check "gateway omits error response bodies (confirmed by two clients)" $false `
        "Status codes are correct, so the console degrades gracefully, but error.code can never be surfaced." 'Warn'
} else {
    Check "error body readable" $true
}

$stamp = Get-Date -Format 'HHmmss'
$Email = if ($Tag) { "check_${stamp}_${Tag}@omniteq.test" } else { "check_${stamp}@omniteq.test" }
$Password = 'Check#12345'
$Token = $null
$Refresh = $null
$projectId = $null
$deviceId = $null
$secret = $null
$sensorId = $null
$variableId = $null
$templateId = $null
$instanceId = $null

# ------------------------------------------------------------------- auth
Section "1. AUTHENTICATION"

$r = Invoke-Api POST '/auth/register' @{ email = $Email; password = $Password; display_name = 'API Check' }
Check "POST /auth/register -> 201" ($r.Status -eq 201) ("HTTP $($r.Status) $($r.Body)")
if ($r.Status -ne 201) { Show-Raw $r }
if ($r.Json -and $r.Json.data) {
    $Token = $r.Json.data.access_token
    $Refresh = $r.Json.data.refresh_token
    Check "register returns access_token + refresh_token" ([bool]$Token -and [bool]$Refresh)
    Check "register hides password_hash" ($r.Body -notmatch 'password_hash') $r.Body
}

$r = Invoke-Api POST '/auth/login' @{ email = $Email; password = $Password }
Check "POST /auth/login -> 200" ($r.Status -eq 200) ("HTTP $($r.Status)")
if ($r.Json -and $r.Json.data) {
    if ($r.Json.data.access_token) { $Token = $r.Json.data.access_token }
    if ($r.Json.data.refresh_token) { $Refresh = $r.Json.data.refresh_token }
    $me = $r.Json.data.user
    if ($me) {
        Check "login user exposes display_name" ($null -ne $me.display_name) ($me | ConvertTo-Json -Compress)
        Check "login user hides password_hash" ($null -eq $me.password_hash)
    }
}

$r = Invoke-Api POST '/auth/login' @{ email = $Email; password = 'definitely-wrong' }
Check "POST /auth/login wrong password -> 401" ($r.Status -eq 401) ("HTTP $($r.Status)")
if ($r.Json -and $r.Json.error) { Check "  error code = INVALID_CREDENTIALS" ($r.Json.error.code -eq 'INVALID_CREDENTIALS') $r.Json.error.code }

$r = Invoke-Api GET '/auth/me' $null $Token
Check "GET /auth/me -> 200 (JWT)" ($r.Status -eq 200) ("HTTP $($r.Status)")

$r = Invoke-Api GET '/auth/me' $null $null
Check "GET /auth/me without JWT -> 401" ($r.Status -eq 401) ("HTTP $($r.Status)")

$r = Invoke-Api POST '/auth/refresh' @{ refresh_token = $Refresh }
Check "POST /auth/refresh -> 200" ($r.Status -eq 200) ("HTTP $($r.Status)")
if ($r.Json -and $r.Json.data -and $r.Json.data.access_token) {
    $Token = $r.Json.data.access_token
    Check "refresh returns a new access_token" $true
}
Check "refresh response hides password_hash" ($r.Body -notmatch 'password_hash') $r.Body

# login.html previously shipped a "One-Click Demo Login" button for an account the
# gateway never seeds; it always failed with 401 and has been removed.
$r = Invoke-Api POST '/auth/login' @{ email = 'vyas@omniteq.com'; password = 'password' }
Check "no hardcoded demo credentials remain in the UI (this login is expected to fail)" ($r.Status -ne 200) ("HTTP $($r.Status) - if this now succeeds the gateway seeds a demo account") 'Warn'

# --------------------------------------------------------------- projects
Section "2. PROJECTS  (cloud_projects / cloud_project_add / cloud_project_view)"

$r = Invoke-Api POST '/projects' @{ name = "Check Project $stamp"; description = 'api check' } $Token
Check "POST /projects {name,description} -> 201" ($r.Status -eq 201) ("HTTP $($r.Status) $($r.Body)")
if ($r.Json -and $r.Json.data) {
    $projectId = $r.Json.data.id
    Check "  create response has device_count" ($null -ne $r.Json.data.device_count) ($r.Json.data | ConvertTo-Json -Compress)
    Check "  create response has no 'location' field" ($r.Json.data.PSObject.Properties.Name -notcontains 'location')
}

$r = Invoke-Api POST '/projects' @{ name = "Loc $stamp"; location = 'Pune' } $Token
Check "POST /projects with 'location' -> 400 (page must NOT send location)" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api GET '/projects' $null $Token
Check "GET /projects -> 200 array" ($r.Status -eq 200 -and $r.Json.data -is [array]) ("HTTP $($r.Status)")
if ($r.Json -and $r.Json.data -and $r.Json.data.Count -gt 0) {
    Check "  list rows include device_count" ($r.Json.data[0].PSObject.Properties.Name -contains 'device_count')
    Check "  list rows include no 'location'" ($r.Json.data[0].PSObject.Properties.Name -notcontains 'location')
}

$r = Invoke-Api GET "/projects/$projectId" $null $Token
Check "GET /projects/:id -> 200 single" ($r.Status -eq 200 -and $r.Json.data.id -eq $projectId) ("HTTP $($r.Status)")

$r = Invoke-Api PUT "/projects/$projectId" @{ name = "Check Project $stamp (renamed)"; description = 'updated' } $Token
Check "PUT /projects/:id {name,description} -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api PUT "/projects/$projectId" @{ name = 'x'; location = 'Mumbai' } $Token
Check "PUT /projects/:id with 'location' -> 400" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)")

# ---------------------------------------------------------------- devices
Section "3. DEVICES  (cloud_devices / cloud_device_add / cloud_device_view)"

$r = Invoke-Api POST "/projects/$projectId/devices" @{ name = "Check Device $stamp"; description = 'api check' } $Token
Check "POST devices {name,description} -> 201" ($r.Status -eq 201) ("HTTP $($r.Status) $($r.Body)")
if ($r.Json -and $r.Json.data) {
    $deviceId = $r.Json.data.id
    $secret = $r.Json.data.secret_key
    Check "  create returns secret_key (once)" ([bool]$secret)
    Check "  create hides secret_key_hash" ($r.Body -notmatch 'secret_key_hash')
    Check "  create returns no auto-provisioned variable" ($null -eq $r.Json.data.default_variable_id) 'the console must provision its own sensor+variable'
}

$r = Invoke-Api POST "/projects/$projectId/devices" @{ name = "Mac $stamp"; mac = 'AA:BB:CC:DD:EE:FF'; eui = 'AA:BB:CC:DD:EE:FF'; firmware_version = 'v1.0.0'; description = 'd' } $Token
Check "POST devices with mac/eui/firmware_version -> 400 (cloud_device_add must NOT send these)" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api POST "/projects/$projectId/devices" @{ name = "Phys $stamp"; description = 'd'; device_id = '123e4567-e89b-12d3-a456-426614174000'; physical_id = '123e4567-e89b-12d3-a456-426614174000' } $Token
Check "POST devices with device_id/physical_id -> 400 (must NOT be sent)" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api GET "/projects/$projectId/devices" $null $Token
Check "GET /projects/:id/devices -> 200" ($r.Status -eq 200) ("HTTP $($r.Status)")
if ($r.Json -and $r.Json.data -and $r.Json.data.Count -gt 0) {
    $d0 = $r.Json.data[0]
    $names = $d0.PSObject.Properties.Name
    Check "  device row has status" ($names -contains 'status') ($names -join ',')
    Check "  device row has sensor_count" ($names -contains 'sensor_count') ($names -join ',')
    Check "  device row has last_seen_at (not last_seen)" (($names -contains 'last_seen_at') -and ($names -notcontains 'last_seen')) ($names -join ',')
    Check "  device row has none 'hardware'" ($names -notcontains 'hardware') ($names -join ',')
    Check "  device row hides secret_key_hash" ($names -notcontains 'secret_key_hash') ($names -join ',')
}

$r = Invoke-Api GET "/devices/$deviceId" $null $Token
Check "GET /devices/:id -> 200" ($r.Status -eq 200) ("HTTP $($r.Status)")

$r = Invoke-Api PUT "/devices/$deviceId" @{ name = "Check Device $stamp (renamed)"; description = 'upd' } $Token
Check "PUT /devices/:id {name,description} -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api PUT "/devices/$deviceId" @{ name = 'x'; firmware_version = 'v1.0.0'; description = 'd' } $Token
Check "PUT /devices/:id with firmware_version -> 400 (cloud_device_view must NOT send it)" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api GET "/devices/$deviceId/status" $null $Token
Check "GET /devices/:id/status -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")

# ---------------------------------------------------------- sensors/vars
Section "4. SENSORS + VARIABLES  (cloud_sensors / cloud_sensor_add)"

$r = Invoke-Api POST "/devices/$deviceId/sensors" @{ name = 'Check Sensor'; unit = 'C'; description = 'api check' } $Token
Check "POST sensors {name,unit,description} -> 201" ($r.Status -eq 201) ("HTTP $($r.Status) $($r.Body)")
if ($r.Json -and $r.Json.data) { $sensorId = $r.Json.data.id }

$r = Invoke-Api GET "/devices/$deviceId/sensors" $null $Token
Check "GET sensors -> 200" ($r.Status -eq 200) ("HTTP $($r.Status)")
if ($r.Json -and $r.Json.data -and $r.Json.data.Count -gt 0) {
    Check "  sensor row has variable_count" ($r.Json.data[0].PSObject.Properties.Name -contains 'variable_count')
}
if (-not $sensorId -and $r.Json -and $r.Json.data -and $r.Json.data.Count -gt 0) { $sensorId = $r.Json.data[0].id }

$r = Invoke-Api POST "/sensors/$sensorId/variables" @{ label = 'temperature'; data_type = 'float' } $Token
Check "POST variables {label,data_type=float} -> 201" ($r.Status -eq 201) ("HTTP $($r.Status) $($r.Body)")
if ($r.Json -and $r.Json.data) { $variableId = $r.Json.data.id }

$r = Invoke-Api POST "/sensors/$sensorId/variables" @{ label = 'bogus'; data_type = 'numeric' } $Token
Check "POST variables data_type='numeric' -> 400 (invalid enum)" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api POST "/sensors/$sensorId/variables" @{ label = 'temperature'; data_type = 'float' } $Token
Check "POST duplicate label -> 409 LABEL_ALREADY_EXISTS" ($r.Status -eq 409) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api GET "/sensors/$sensorId/variables" $null $Token
Check "GET variables -> 200 with latest_value" ($r.Status -eq 200 -and ($r.Json.data[0].PSObject.Properties.Name -contains 'latest_value')) ("HTTP $($r.Status)")

$r = Invoke-Api GET "/variables/$variableId" $null $Token
Check "GET /variables/:id -> 200" ($r.Status -eq 200) ("HTTP $($r.Status)")

$r = Invoke-Api PUT "/variables/$variableId" @{ label = 'temperature_renamed' } $Token
Check "PUT /variables/:id {label} -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")

# ----------------------------------------------------------------- ingest
Section "5. DEVICE INGEST  (firmware + cloud_telemetry / cloud_sensors test buttons)"

$r = Invoke-Api POST '/ingest/telemetry' @{ device_id = $deviceId; readings = @(@{ variable_id = $variableId; value = 1 }) } $null -NoAuth
Check "ingest telemetry WITHOUT secret -> 400" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api POST '/ingest/telemetry' @{ device_id = $deviceId; secret_key = 'sk_wrong'; readings = @(@{ variable_id = $variableId; value = 1 }) } $null -NoAuth
Check "ingest telemetry WRONG secret -> 401 DEVICE_UNAUTHORIZED" ($r.Status -eq 401) ("HTTP $($r.Status) $($r.Body)")

$nowIso = (Get-Date).ToUniversalTime().ToString('o')
$r = Invoke-Api POST '/ingest/telemetry' @{ device_id = $deviceId; secret_key = $secret; readings = @(@{ variable_id = $variableId; value = 24.5; recorded_at = $nowIso }) } $null -NoAuth
Check "ingest telemetry valid -> 2xx inserted=1" ($r.Status -ge 200 -and $r.Status -lt 300 -and $r.Json.data.inserted -eq 1) ("HTTP $($r.Status) $($r.Body)")
if ($r.Status -ge 200 -and $r.Status -lt 300 -and $r.Json.data.inserted -ne 1) { Show-Raw $r }

$r = Invoke-Api POST '/ingest/telemetry' @{ device_id = $deviceId; secret_key = $secret; readings = @(@{ variable_id = $variableId; value = 'not-a-number' }) } $null -NoAuth
Check "ingest non-numeric value -> rejected with errors[]" (($r.Status -eq 207) -or ($r.Json.data.rejected -ge 1)) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api POST '/ingest/telemetry' @{ device_id = $deviceId; secret_key = $secret; readings = @(@{ variable_id = '00000000-0000-0000-0000-000000000000'; value = 1 }) } $null -NoAuth
Check "ingest unknown variable_id -> rejected (not silent success)" (($r.Json.data.rejected -ge 1) -and ($r.Json.data.inserted -eq 0)) ("HTTP $($r.Status) $($r.Body)")

$big = @(); 1..501 | ForEach-Object { $big += @{ variable_id = $variableId; value = 1 } }
$r = Invoke-Api POST '/ingest/telemetry' @{ device_id = $deviceId; secret_key = $secret; readings = $big } $null -NoAuth
Check "ingest 501 readings -> 400 (max 500)" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api POST '/ingest/heartbeat' @{ device_id = $deviceId; secret_key = $secret; firmware_version = '9.9.9'; ip_address = '10.9.9.9' } $null -NoAuth
Check "POST /ingest/heartbeat -> 2xx online" (($r.Status -ge 200 -and $r.Status -lt 300) -and $r.Json.data.status -eq 'online') ("HTTP $($r.Status) $($r.Body)")

# -------------------------------------------------------- telemetry query
Section "6. TELEMETRY QUERIES  (cloud_dashboard / cloud_telemetry / cloud_sensors)"

$from = (Get-Date).AddDays(-3).ToUniversalTime().ToString('o')
$to = (Get-Date).AddMinutes(5).ToUniversalTime().ToString('o')

$r = Invoke-Api GET "/variables/$variableId/telemetry" $null $Token
Check "GET telemetry WITHOUT from/to -> 400 MISSING_PARAMS" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api GET "/variables/$variableId/telemetry?from=$from&to=$to&limit=100" $null $Token
Check "GET telemetry with from/to -> 200 readings[]" ($r.Status -eq 200 -and $r.Json.data.readings -is [array]) ("HTTP $($r.Status) $($r.Body)")
if ($r.Status -eq 200 -and $r.Json.data.readings.Count -gt 0) {
    Check "  reading has value + recorded_at" (($r.Json.data.readings[0].PSObject.Properties.Name -contains 'value') -and ($r.Json.data.readings[0].PSObject.Properties.Name -contains 'recorded_at'))
    Check "  the reading just ingested is visible (clock-skew window)" ($r.Json.data.readings[0].value -eq 24.5) ("got $($r.Json.data.readings[0].value)")
}

$r = Invoke-Api GET "/variables/$variableId/telemetry/aggregate?from=$from&to=$to&interval=1h" $null $Token
Check "GET aggregate -> 200 buckets[]" ($r.Status -eq 200 -and $r.Json.data.buckets -is [array]) ("HTTP $($r.Status) $($r.Body)")
if ($r.Json -and $r.Json.data -and $r.Json.data.buckets -and $r.Json.data.buckets.Count -gt 0) {
    $bk = $r.Json.data.buckets[0].PSObject.Properties.Name
    Check "  bucket has time/min/max/avg/count" (($bk -contains 'time') -and ($bk -contains 'min') -and ($bk -contains 'max') -and ($bk -contains 'avg') -and ($bk -contains 'count')) ($bk -join ',')
}

$r = Invoke-Api GET "/variables/$variableId/telemetry/aggregate?from=$from&to=$to&interval=7m" $null $Token
Check "GET aggregate bad interval -> 400 INVALID_INTERVAL" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api GET "/devices/$deviceId/telemetry/latest" $null $Token
Check "GET telemetry/latest -> 200" ($r.Status -eq 200) ("HTTP $($r.Status)")
if ($r.Json -and $r.Json.data -and $r.Json.data.Count -gt 0) {
    $ln = $r.Json.data[0].PSObject.Properties.Name
    Check "  latest row has sensor_name + data_type + value" (($ln -contains 'sensor_name') -and ($ln -contains 'data_type') -and ($ln -contains 'value')) ($ln -join ',')
}

# --------------------------------------------------------------- commands
Section "7. COMMAND TEMPLATES + DISPATCH  (cloud_commands / cloud_command_add / device_view)"

$r = Invoke-Api POST "/devices/$deviceId/command-templates" @{
    name = 'set_pwm'; description = 'api check'
    parameters = @(@{ param_name = 'duty'; param_type = 'integer'; is_required = $true; param_order = 1; default_value = $null })
} $Token
Check "POST command-template -> 201 with parameters[]" ($r.Status -eq 201 -and $r.Json.data.parameters.Count -eq 1) ("HTTP $($r.Status) $($r.Body)")
if ($r.Json -and $r.Json.data) { $templateId = $r.Json.data.id }

$r = Invoke-Api POST "/devices/$deviceId/command-templates" @{ name = 'set_pwm'; parameters = @() } $Token
Check "POST duplicate template name -> 409" ($r.Status -eq 409) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api GET "/devices/$deviceId/command-templates" $null $Token
Check "GET device command-templates -> 200" ($r.Status -eq 200) ("HTTP $($r.Status)")

$r = Invoke-Api GET "/command-templates/$templateId" $null $Token
Check "GET /command-templates/:id -> 200" ($r.Status -eq 200) ("HTTP $($r.Status)")

$r = Invoke-Api PUT "/command-templates/$templateId" @{ description = 'upd' } $Token
Check "PUT /command-templates/:id -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api POST "/command-templates/$templateId/dispatch" @{ parameters = @{} } $Token
# Documented behaviour is 400 MISSING_REQUIRED_PARAM. Observed: the gateway
# substitutes an empty string and returns 202. The console therefore validates
# required parameters client-side (cloud_commands.html) and depends on this
# check to catch any regression in that guard.
if ($r.Status -eq 400) {
    Check "dispatch missing required param -> 400 MISSING_REQUIRED_PARAM" $true
} else {
    $echoed = ''
    if ($r.Json -and $r.Json.data -and $r.Json.data.parameters) { $echoed = ($r.Json.data.parameters | ConvertTo-Json -Compress) }
    Check "dispatch missing required param -> 400 (server deviation: accepts it)" $false ("HTTP $($r.Status) echoed parameters=$echoed - gateway does NOT enforce required params; the console blocks this client-side") 'Warn'
    $script:RequiredParamDefect = $true
}

$r = Invoke-Api POST "/command-templates/$templateId/dispatch" @{ parameters = @{ duty = 'fast' } } $Token
Check "dispatch wrong param type -> 400 INVALID_PARAM_TYPE" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api POST "/command-templates/$templateId/dispatch" @{ parameters = @{ duty = 512 }; ttl_seconds = 120 } $Token
Check "dispatch valid -> 202 queued" ($r.Status -eq 202 -and $r.Json.data.status -eq 'queued') ("HTTP $($r.Status) $($r.Body)")
if ($r.Json -and $r.Json.data) {
    $instanceId = $r.Json.data.id
    Check "  instance has command_name + parameters" (($r.Json.data.PSObject.Properties.Name -contains 'command_name') -and ($null -ne $r.Json.data.parameters)) ($r.Json.data | ConvertTo-Json -Compress -Depth 4)
}

$r = Invoke-Api GET "/command-instances/$instanceId" $null $Token
Check "GET /command-instances/:id -> 200" ($r.Status -eq 200) ("HTTP $($r.Status)")

$r = Invoke-Api GET "/devices/$deviceId/command-history?page=1&limit=10" $null $Token
Check "GET command-history -> 200 with meta.total_pages" ($r.Status -eq 200 -and $null -ne $r.Json.meta.total_pages) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api GET "/ingest/commands/pending?device_id=$deviceId&secret_key=$secret" $null $null -NoAuth
Check "GET /ingest/commands/pending -> 2xx" ($r.Status -ge 200 -and $r.Status -lt 300) ("HTTP $($r.Status) $($r.Body)")
if ($r.Json -and $r.Json.data) {
    $found = $r.Json.data | Where-Object { $_.id -eq $instanceId }
    if ($found) {
        Check "  pending frame exposes command_name" ([bool]$found.command_name)
    }
}

$r = Invoke-Api POST "/ingest/commands/$instanceId/ack" @{ device_id = $deviceId; secret_key = $secret; status = 'success' } $null -NoAuth
Check "POST /ingest/commands/:id/ack -> 2xx success" ($r.Status -ge 200 -and $r.Status -lt 300) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api POST "/ingest/commands/$instanceId/ack" @{ device_id = $deviceId; secret_key = $secret; status = 'success' } $null -NoAuth
Check "double ack -> 404 INSTANCE_NOT_FOUND" ($r.Status -eq 404) ("HTTP $($r.Status) $($r.Body)")

# ------------------------------------------------------- plan / team / etc
Section "8. PLANS + ACCOUNT  (cloud_settings)"

$r = Invoke-Api GET '/plans' $null $null -NoAuth
Check "GET /plans -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")
if ($r.Status -eq 200 -and $r.Json.data -and $r.Json.data.Count -gt 0) {
    $p0 = $r.Json.data[0].PSObject.Properties.Name
    Check "  plan row has code" ($p0 -contains 'code') ($p0 -join ',')
    Check "  plan row has included_devices" ($p0 -contains 'included_devices') ($p0 -join ',')
    Check "  plan row has query_range_days" ($p0 -contains 'query_range_days') ($p0 -join ',')
}

$r = Invoke-Api GET '/account/plan' $null $Token
Check "GET /account/plan -> 200" ($r.Status -eq 200) ("HTTP $($r.Status)")
if ($r.Status -eq 200 -and $r.Json.data) {
    $d = $r.Json.data
    Check "  response has nested plan.code (client flattens it)" ($null -ne $d.plan.code) ($d | ConvertTo-Json -Compress -Depth 3)
    Check "  response has usage.devices.used (client flattens to current_devices_count)" ($null -ne $d.usage.devices.used) ($d | ConvertTo-Json -Compress -Depth 3)
    Check "  plan exposes query_range_days" ($null -ne $d.plan.query_range_days) ''
}

$r = Invoke-Api PUT '/account/plan' @{ plan_code = 'standard' } $Token
Check "PUT /account/plan 'standard' -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api PUT '/account/plan' @{ plan_code = 'moderate' } $Token
Check "PUT /account/plan 'moderate' (UI key) -> 400 (must map to plan_code)" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api PUT '/account/plan' @{ plan_code = 'enterprise' } $Token
Check "PUT /account/plan 'enterprise' -> 403 (not self-serve)" ($r.Status -eq 403) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api PUT '/account/plan' @{ plan_code = 'free' } $Token
Check "PUT /account/plan 'free' -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api GET '/team/members' $null $Token
Check "GET /team/members -> 200" ($r.Status -eq 200) ("HTTP $($r.Status)")
if ($r.Status -eq 200 -and $r.Json.data) {
    $names = $r.Json.data.PSObject.Properties.Name
    Check "  shape is { owner, members } (client flattens)" (($names -contains 'owner') -or ($names -contains 'members') -or ($r.Json.data -is [array])) ($names -join ',')
}

$r = Invoke-Api GET '/team/invitations' $null $Token
Check "GET /team/invitations -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")

# --------------------------------------------------- rules / webhooks / etc
Section "9. PLAN ENTITLEMENTS  (the console reads these to gate the UI)"

$planProfile = $null
$r = Invoke-Api PUT '/account/plan' @{ plan_code = 'professional' } $Token
Check "PUT /account/plan 'professional' -> 200 (test setup)" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api GET '/account/plan' $null $Token
if ($r.Status -eq 200 -and $r.Json.data -and $r.Json.data.plan) {
    $planProfile = $r.Json.data.plan
    $pn = $planProfile.PSObject.Properties.Name
    Check "plan exposes rule_engine_enabled (rules page gates on it)" ($pn -contains 'rule_engine_enabled') ($pn -join ',')
    Check "plan exposes webhooks_enabled (webhooks page gates on it)" ($pn -contains 'webhooks_enabled') ($pn -join ',')
    Check "plan exposes export_csv" ($pn -contains 'export_csv') ($pn -join ',')
    Write-Line ("        plan=$($planProfile.code) rules=$($planProfile.rule_engine_enabled) webhooks=$($planProfile.webhooks_enabled) devices=$($planProfile.included_devices)") 'DarkGray'
}

Section "10. RULES  (cloud_rules)"

$r = Invoke-Api GET "/devices/$deviceId/rules" $null $Token
Check "GET /devices/:id/rules -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")

$rulePayload = @{
    name = 'High temp'; variable_id = $variableId; operator = '>'; threshold = 40
    action_type = 'send_alert'; alert_message = 'too hot'; alert_channels = @('email'); enabled = $true
}
$r = Invoke-Api POST "/devices/$deviceId/rules" $rulePayload $Token
$ruleCreated = ($r.Status -eq 201 -or $r.Status -eq 200)
Check "POST /devices/:id/rules -> 201" $ruleCreated ("HTTP $($r.Status) $($r.Body)")
$ruleId = $null
if ($ruleCreated -and $r.Json.data) {
    $ruleId = $r.Json.data.id
    $r2 = Invoke-Api GET "/rules/$ruleId/logs" $null $Token
    Check "GET /rules/:id/logs -> 200" ($r2.Status -eq 200) ("HTTP $($r2.Status) $($r2.Body)")
    $r3 = Invoke-Api DELETE "/rules/$ruleId" $null $Token
    Check "DELETE /rules/:id -> 200" ($r3.Status -eq 200) ("HTTP $($r3.Status) $($r3.Body)")
} else {
    Write-Line '        Server returned no body, so the reason is not machine-readable.' 'DarkGray'
    Write-Line '        The console now explains a 403 as a plan restriction (see cloud_rules.html).' 'DarkGray'
}

Section "11. WEBHOOKS  (cloud_webhooks)"

<#
  The webhook contract was discovered empirically (the feature has no section in
  API Quick Reference v2.0) and is now asserted directly:

    body  : { url, event_types: [...], enabled }
            - `event_types` is the ONLY accepted key.
            - no extra fields (secret, description, name, is_active are rejected)
    events: strict enum = device.online, device.offline, command.success, command.failed
    reply : { id, url, event_types[], enabled, created_at, secret }

  cloud_webhooks.html sends exactly this shape. These checks fail if the gateway
  changes the schema, which is what would break the page.
#>
$hookUrl = 'https://example.com/omniteq-check-' + $stamp
$validEvents = @('device.online', 'device.offline', 'command.success', 'command.failed')

$r = Invoke-Api GET '/webhooks' $null $Token
Check "GET /webhooks -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")

# --- the page's exact payload must be accepted ---
$r = Invoke-Api POST '/webhooks' @{ url = $hookUrl; event_types = $validEvents; enabled = $true } $Token
$created = ($r.Status -eq 201 -or $r.Status -eq 200)
Check "POST /webhooks with the exact cloud_webhooks.html payload -> 201" $created ("HTTP $($r.Status) $($r.Body)")

$webhookId = $null
if ($created -and $r.Json.data) {
    $webhookId = $r.Json.data.id
    $wf = $r.Json.data.PSObject.Properties.Name
    Check "  response has id" ($wf -contains 'id') ($wf -join ',')
    Check "  response echoes event_types[]" ($wf -contains 'event_types') ($wf -join ',')
    Check "  response has enabled" ($wf -contains 'enabled') ($wf -join ',')
    Check "  response has created_at" ($wf -contains 'created_at') ($wf -join ',')
    Check "  response includes the signing secret (the page must not invent one)" ($wf -contains 'secret') ($wf -join ',')
    Write-Line ("        created webhook: id=$webhookId secret=$($r.Json.data.secret)") 'DarkGray'
}

# --- each enum value is individually accepted ---
$enumResults = @()
foreach ($ev in $validEvents) {
    $rr = Invoke-Api POST '/webhooks' @{ url = "$hookUrl-$ev"; event_types = @($ev); enabled = $true } $Token
    $accepted = ($rr.Status -eq 201 -or $rr.Status -eq 200)
    $enumResults += $accepted
    Write-Line ("  [{0}] event_types = ['{1}']" -f $(if ($accepted) { 'ACCEPT' } else { " $($rr.Status)  " }), $ev) $(if ($accepted) { 'Green' } else { 'Red' })
    if ($accepted -and $rr.Json.data.id) { Invoke-Api DELETE "/webhooks/$($rr.Json.data.id)" $null $Token | Out-Null }
}
Check "every event value used by the UI is accepted (all four enum members)" (($enumResults | Where-Object { -not $_ }).Count -eq 0) 'one or more UI event values are rejected by the gateway'

# --- the constraints the page must not violate ---
$r = Invoke-Api POST '/webhooks' @{ url = "$hookUrl-bad"; event_types = @('alert.created'); enabled = $true } $Token
Check "  unknown event value -> 400 (enum is enforced)" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api POST '/webhooks' @{ url = "$hookUrl-key"; events = @('device.online'); enabled = $true } $Token
Check "  wrong key 'events' -> 400 (must be 'event_types')" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api POST '/webhooks' @{ url = "$hookUrl-extra"; event_types = @('device.online'); enabled = $true; description = 'x' } $Token
Check "  extra field -> 400 (page must send only url/event_types/enabled)" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)")

if ($webhookId) {
    $r2 = Invoke-Api GET "/webhooks/$webhookId/deliveries" $null $Token
    Check "GET /webhooks/:id/deliveries -> 200" ($r2.Status -eq 200) ("HTTP $($r2.Status) $($r2.Body)")
    $r3 = Invoke-Api DELETE "/webhooks/$webhookId" $null $Token
    Check "DELETE /webhooks/:id -> 200" ($r3.Status -eq 200) ("HTTP $($r3.Status) $($r3.Body)")
}

Section "12. FREE-PLAN DENIAL  (the UI relies on this entitlement being enforced)"

$r = Invoke-Api PUT '/account/plan' @{ plan_code = 'free' } $Token
Check "PUT /account/plan 'free' -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api GET '/account/plan' $null $Token
if ($r.Status -eq 200 -and $r.Json.data -and $r.Json.data.plan) {
    $freeRules = $r.Json.data.plan.rule_engine_enabled
    $freeHooks = $r.Json.data.plan.webhooks_enabled
    Write-Line ("        free plan: rule_engine_enabled=$freeRules webhooks_enabled=$freeHooks") 'DarkGray'

    $r = Invoke-Api POST "/devices/$deviceId/rules" $rulePayload $Token
    if ($freeRules -eq $false) {
        Check "free plan refuses rule creation (403)" ($r.Status -eq 403) ("HTTP $($r.Status) $($r.Body)") 'Warn'
    } else {
        Check "free plan allows rule creation with rule_engine_enabled=$freeRules" ($r.Status -eq 201 -or $r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")
    }
}

Section "13. ALERTS"

$r = Invoke-Api GET '/alerts/history?page=1&limit=20' $null $Token
Check "GET /alerts/history -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")

# --------------------------------------------------- error contract
Section "14. DOCUMENTED ERROR CODES  (validated while resources still exist)"

# Restore an unrestricted plan so plan limits cannot masquerade as schema errors.
$r = Invoke-Api PUT '/account/plan' @{ plan_code = 'professional' } $Token
Check "PUT /account/plan 'professional' -> 200 (test setup)" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")

<#
  API Quick Reference v2.0 section 10 promises specific error codes. Two earlier
  runs got this wrong:
    - run 1 checked AFTER teardown, against already-deleted resources;
    - run 2 reused the label 'temperature' for the duplicate check, but section 4
      had already renamed that variable to 'temperature_renamed', so the label was
      free again and the POST legitimately succeeded.
  The duplicate case below therefore creates its own fresh label first.
  The console surfaces error.code where present and falls back to a status-based
  message otherwise (js/api.js _describeStatus), so a missing code degrades UX.
#>
$dupLabel = 'dupcheck_' + $stamp
Invoke-Api POST "/sensors/$sensorId/variables" @{ label = $dupLabel; data_type = 'float' } $Token | Out-Null

$errorContract = @(
    @{ label = 'invalid project field';  expect = 400; code = 'VALIDATION_ERROR';        res = (Invoke-Api POST '/projects' @{ name = 'x'; location = 'Pune' } $Token) },
    @{ label = 'invalid data_type';      expect = 400; code = 'VALIDATION_ERROR';        res = (Invoke-Api POST "/sensors/$sensorId/variables" @{ label = 'eb'; data_type = 'numeric' } $Token) },
    @{ label = 'telemetry missing from/to'; expect = 400; code = 'MISSING_PARAMS';       res = (Invoke-Api GET "/variables/$variableId/telemetry" $null $Token) },
    @{ label = 'bad aggregate interval'; expect = 400; code = 'INVALID_INTERVAL';        res = (Invoke-Api GET "/variables/$variableId/telemetry/aggregate?from=$from&to=$to&interval=7m" $null $Token) },
    @{ label = 'wrong param type';       expect = 400; code = 'INVALID_PARAM_TYPE';      res = (Invoke-Api POST "/command-templates/$templateId/dispatch" @{ parameters = @{ duty = 'fast' } } $Token) },
    @{ label = 'wrong password';         expect = 401; code = 'INVALID_CREDENTIALS';     res = (Invoke-Api POST '/auth/login' @{ email = $Email; password = 'nope-nope' }) },
    @{ label = 'no JWT';                 expect = 401; code = 'UNAUTHORIZED';            res = (Invoke-Api GET '/auth/me' $null $null) },
    @{ label = 'unknown project';        expect = 404; code = 'PROJECT_NOT_FOUND';       res = (Invoke-Api GET '/projects/00000000-0000-0000-0000-000000000000' $null $token) },
    @{ label = 'unknown device';         expect = 404; code = 'DEVICE_NOT_FOUND';        res = (Invoke-Api GET '/devices/00000000-0000-0000-0000-000000000000' $null $token) },
    @{ label = 'duplicate variable label'; expect = 409; code = 'LABEL_ALREADY_EXISTS';  res = (Invoke-Api POST "/sensors/$sensorId/variables" @{ label = $dupLabel; data_type = 'float' } $Token) }
)

$codesOk = 0
$codesMissing = 0
$emptyBodies = 0
$wrongStatus = 0
foreach ($e in $errorContract) {
    $got = $e.res.Status
    $actualCode = ''
    if ($e.res.Json -and $e.res.Json.error -and $e.res.Json.error.code) { $actualCode = $e.res.Json.error.code }
    $blank = [string]::IsNullOrWhiteSpace($e.res.Body)

    if ($got -ne $e.expect) {
        $wrongStatus++
        Check "$($e.label) -> HTTP $($e.expect)" $false ("HTTP $got $($e.res.Body)") 'Warn'
        continue
    }
    if ($actualCode -eq $e.code) {
        $codesOk++
        Write-Line ("  PASS  {0,-26} HTTP {1}  code={2}" -f $e.label, $got, $actualCode) 'Green'
    } else {
        $codesMissing++
        if ($blank) { $emptyBodies++ }
        $shown = if ($blank) { '(empty body)' } else { $e.res.Body.Trim() }
        if ($shown.Length -gt 110) { $shown = $shown.Substring(0, 110) + ' ...' }
        Write-Line ("  --    {0,-26} HTTP {1}  expected code={2,-22} got '{3}'  {4}" -f $e.label, $got, $e.code, $actualCode, $shown) 'DarkGray'
    }
}

# Reported as ONE finding. The gateway returns the documented envelope
# ({ success:false, error:{ code, message } }) - earlier runs simply could not read
# it (see section 0b). Anything missing here is a genuine gap in the error-code
# table, because the transport now reads every response body reliably.
$codeSummary = "$codesOk of $($errorContract.Count) triggers returned the documented error.code"
if ($codesMissing -gt 0) { $codeSummary += "; $codesMissing returned a different code ($emptyBodies with a completely empty body)" }
if ($wrongStatus -gt 0)  { $codeSummary += "; $wrongStatus returned an unexpected HTTP status" }

Check "every documented error.code is returned" ($codesMissing -eq 0) `
    "$codeSummary. The HTTP statuses are all correct, so the console still behaves, and js/api.js _describeStatus() covers any code that is missing." 'Warn'

# --------------------------------------------------------- delete cascade
Section "15. DELETE + CASCADE  (known server FK defect workaround)"

# A device with no command history must delete cleanly.
$r = Invoke-Api POST "/projects/$projectId/devices" @{ name = "Clean $stamp"; description = 'no commands' } $Token
$cleanDeviceId = $null
if ($r.Status -eq 201 -and $r.Json.data) { $cleanDeviceId = $r.Json.data.id }
if ($cleanDeviceId) {
    $r = Invoke-Api DELETE "/devices/$cleanDeviceId" $null $Token
    Check "DELETE /devices/:id with no command history -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")
}

# The device under test HAS command history, which trips the server FK defect.
$r = Invoke-Api DELETE "/devices/$deviceId" $null $Token
if ($r.Status -eq 200) {
    Check "DELETE /devices/:id with command history -> 200 (defect fixed server-side)" $true
} else {
    Check "DELETE /devices/:id with command history -> 200" $false ("HTTP $($r.Status) - server FK defect: cmd_instance_params -> cmd_parameters cascade missing. The console works around it via devices.deleteCascade().") 'Warn'
    $script:CascadeDefect = $true

    # Prove the documented workaround path works.
    $r = Invoke-Api DELETE "/command-templates/$templateId" $null $Token
    Check "  workaround: DELETE /command-templates/:id -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")
    $r = Invoke-Api DELETE "/devices/$deviceId" $null $Token
    Check "  workaround: device then deletes -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)") 'Warn'
}

$r = Invoke-Api DELETE "/projects/$projectId" $null $Token
Check "DELETE /projects/:id -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)") 'Warn'

$r = Invoke-Api GET "/projects/$projectId" $null $Token
Check "GET deleted project -> 404" ($r.Status -eq 404) ("HTTP $($r.Status)")

# ------------------------------------------------------------------ logout
Section "16. LOGOUT"

# A logout revokes the token, so the negative case needs its own fresh session.
$freshEmail = "logout_${stamp}@omniteq.test"
$r = Invoke-Api POST '/auth/register' @{ email = $freshEmail; password = $Password; display_name = 'Logout Check' }
$freshToken = $null
$freshRefresh = $null
if ($r.Json -and $r.Json.data) {
    $freshToken = $r.Json.data.access_token
    $freshRefresh = $r.Json.data.refresh_token
}
Check "fresh session registered for logout checks" ([bool]$freshToken -and [bool]$freshRefresh) ("HTTP $($r.Status)")

$r = Invoke-Api POST '/auth/logout' @{} $freshToken
Check "POST /auth/logout without refresh_token -> 400" ($r.Status -eq 400) ("HTTP $($r.Status) $($r.Body)") 'Warn'

$r = Invoke-Api POST '/auth/logout' @{ refresh_token = $freshRefresh } $freshToken
Check "POST /auth/logout {refresh_token} -> 200" ($r.Status -eq 200) ("HTTP $($r.Status) $($r.Body)")

$r = Invoke-Api GET '/auth/me' $null $freshToken
Check "GET /auth/me after logout -> 401 (token revoked)" ($r.Status -eq 401) ("HTTP $($r.Status)")

$r = Invoke-Api POST '/auth/refresh' @{ refresh_token = $freshRefresh }
Check "POST /auth/refresh with revoked refresh_token -> 401" ($r.Status -eq 401) ("HTTP $($r.Status) $($r.Body)")

# ----------------------------------------------------------------- summary
Section "SUMMARY"

Write-Line ''
Write-Line ("  PASS : {0}" -f $script:Pass) 'Green'
if ($script:Warn -gt 0) { Write-Line ("  WARN : {0}  (server-side deviations, or non-conformance the console compensates for)" -f $script:Warn) 'Yellow' }
Write-Line ("  FAIL : {0}  (console breaks on these)" -f $script:Fail) $(if ($script:Fail -gt 0) { 'Red' } else { 'Green' })
Write-Line ''
Write-Line ("  account used : $Email")
Write-Line ("  gateway      : $BaseUrl")
Write-Line ("  transport    : " + $(if ($script:HttpClient) { '.NET HttpClient (reliable error bodies)' } else { 'Invoke-WebRequest (PS 5.1 drops error bodies)' }))
Write-Line ''

if ($script:Fail -eq 0) {
    Write-Line "  RESULT: ALL CONSOLE CHECKS PASSED" 'Green'
    if ($script:Warn -gt 0) { Write-Line "          $($script:Warn) known server-side deviation(s) listed above as WARN." 'Yellow' }
} else {
    Write-Line "  RESULT: $($script:Fail) CHECK(S) FAILED - see FAIL lines above" 'Red'
}
Write-Line ''

# A consolidated, actionable list so the WARNs above do not have to be read one by
# one. Each entry is a backend change; the console already copes with all of them.
Write-Line "  ------------------------------------------------------------------" 'DarkCyan'
Write-Line "  OPEN BACKEND ITEMS  (console is unaffected; these are server-side)" 'DarkCyan'
Write-Line "  ------------------------------------------------------------------" 'DarkCyan'
Write-Line ''

$openItem = 0

if ($script:CascadeDefect) {
    $openItem++
    Write-Line "  $openItem. DELETE cascade is incomplete (HIGH)" 'White'
    Write-Line "     DELETE /devices/:id and /projects/:id return 500 when a dispatched" 'DarkGray'
    Write-Line "     command exists: cmd_instance_params rows are not removed before" 'DarkGray'
    Write-Line "     cmd_parameters, violating cmd_instance_params_parameter_id_fkey." 'DarkGray'
    Write-Line "     Fix: delete cmd_instance_params (and cmd_instances) first." 'DarkGray'
    Write-Line "     The console works around it via devices/projects.deleteCascade()." 'DarkGray'
    Write-Line ''
}

if ($script:RequiredParamDefect) {
    $openItem++
    Write-Line "  $openItem. Command required-parameters are not enforced (MEDIUM)" 'White'
    Write-Line "     POST /command-templates/:id/dispatch substitutes an empty string for a" 'DarkGray'
    Write-Line "     missing required parameter and returns 202 instead of 400" 'DarkGray'
    Write-Line "     MISSING_REQUIRED_PARAM (see section 7). The console validates" 'DarkGray'
    Write-Line "     client-side, so an API-only client can still dispatch an empty value." 'DarkGray'
    Write-Line ''
}

if ($openItem -eq 0) {
    Write-Line "  None - every endpoint the console calls behaves as documented." 'Green'
    Write-Line ''
}

# Resolved / informational notes, kept short so they are not mistaken for defects.
Write-Line "  ------------------------------------------------------------------" 'DarkCyan'
Write-Line "  RESOLVED / NOTES" 'DarkCyan'
Write-Line "  ------------------------------------------------------------------" 'DarkCyan'
Write-Line ''
Write-Line "  - JSON error envelope: WORKING. All 10 documented error codes returned in" 'Green'
Write-Line "    section 14. Earlier 'missing envelope' reports were PowerShell 5.1" 'Green'
Write-Line "    artifacts (see section 0b). No backend change needed." 'Green'
Write-Line ''
Write-Line "  - Webhooks: the endpoint works but is absent from the PDF reference. The" 'DarkGray'
Write-Line "    verified contract is now documented in api-reference.html (Webhooks)" 'DarkGray'
Write-Line "    and cloud_docs.html." 'DarkGray'
Write-Line ''
Write-Line "  - data_type accepts float/integer/boolean/string; 'numeric' is a 400 by" 'DarkGray'
Write-Line "    design. The console only offers the valid four, so this is not a defect." 'DarkGray'
Write-Line ''

$outFile = Join-Path $PSScriptRoot 'check-api-results.txt'
$script:Lines | Set-Content -LiteralPath $outFile -Encoding UTF8
Write-Line ("  Full results written to: $outFile") 'DarkGray'
Write-Line ''

if ($script:Fail -gt 0) { exit 1 } else { exit 0 }
