//const GPS_URL = "https://jhatka-machine-default-rtdb.asia-southeast1.firebasedatabase.app/gps.json";
//const OUTPUTS_URL = "https://jhatka-machine-default-rtdb.asia-southeast1.firebasedatabase.app/outputs.json";
const GPS_URL = "https://jatka-machine-default-rtdb.firebaseio.com/gps.json";
const OUTPUTS_URL = "https://jatka-machine-default-rtdb.firebaseio.com/outputs.json";
const INPUTS_URL = "https://jatka-machine-default-rtdb.firebaseio.com/inputs.json";
const STATUS_URL = "https://jatka-machine-default-rtdb.firebaseio.com/status.json";
const GPS_DATA_PATH = "gps-data";
const DEVICE_OFFLINE_THRESHOLD_MS = 30000;

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

const OUTPUTS = [
  { key: "relay",  label: "જટકા મશીન (18)" },
  { key: "led",    label: "પરીક્ષણ LED (32)" },
  //{ key: "gpio33", label: "Switch No-13" },
  //{ key: "gpio33", label: "Switch No-33" },
  //{ key: "gpio19", label: "Switch No-19" },
  //{ key: "gpio21", label: "Switch No-21" },
  //{ key: "gpio22", label: "Switch No-22" },
  //{ key: "gpio23", label: "Switch No-23" },
];

const latEl = document.getElementById("lat");
const lonEl = document.getElementById("lon");
const locSourceEl = document.getElementById("locSource");
const locationTimestampEl = document.getElementById("locationTimestamp");
const mapLinkEl = document.getElementById("mapLink");
const outputsBodyEl = document.getElementById("outputsBody");
const statusEl = document.getElementById("statusMsg");
const deviceStatusEl = document.getElementById("deviceStatus");
const deviceStatusTextEl = document.getElementById("deviceStatusText");
const gpsInitializedEl = document.getElementById("gpsInitialized");
const gsmInitializedEl = document.getElementById("gsmInitialized");
const lastSeenStatusEl = document.getElementById("lastSeenStatus");
const ledStatusEl = document.getElementById("ledStatus");
const simAvailableEl = document.getElementById("simAvailable");
const simNetworkEl = document.getElementById("simNetwork");
const wifiAvailableEl = document.getElementById("wifiAvailable");
const gpsHasGgaEl = document.getElementById("gpsHasGga");
const gpsHasRmcEl = document.getElementById("gpsHasRmc");
const gpsDataValidEl = document.getElementById("gpsDataValid");
const gpsUtcTimeEl = document.getElementById("gpsUtcTime");
const gpsDataLatitudeEl = document.getElementById("gpsDataLatitude");
const gpsDataLongitudeEl = document.getElementById("gpsDataLongitude");
const gpsDataLastUpdatedEl = document.getElementById("gpsDataLastUpdated");
const gpsRawNmeaEl = document.getElementById("gpsRawNmea");
const gpsRawLengthEl = document.getElementById("gpsRawLength");
const gpsRawNmea2El = document.getElementById("gpsRawNmea2");
const gpsRawLength2El = document.getElementById("gpsRawLength2");

const liveStatusEl = document.getElementById("liveStatus");
const liveDotEl = document.getElementById("liveDot");
const liveTextEl = document.getElementById("liveText");
const liveStatusEl2 = document.getElementById("liveStatus2");
const liveTextEl2 = document.getElementById("liveText2");
const liveStatusEl3 = document.getElementById("liveStatus3");
const liveTextEl3 = document.getElementById("liveText3");

// Only ever holds the outputs.json contents now - not mixed with gps data.
let currentOutputs = null;
let currentInputs = null;
let currentStatus = null;
let lastSeen = 0;
let isDeivceOnline = false;

function setBooleanStatus(element, value, trueText, falseText) {
  if (typeof value !== "boolean") {
    element.textContent = "--";
    element.className = "status-value unknown";
    return;
  }

  element.textContent = value ? trueText : falseText;
  element.className = "status-value " + (value ? "healthy" : "unhealthy");
}

function renderStatusDetails() {
  const status = currentStatus || {};

  setBooleanStatus(gpsInitializedEl, status.gps_initialized, "YES", "NO");
  setBooleanStatus(gsmInitializedEl, status.gsm_initialized, "YES", "NO");
  setBooleanStatus(simAvailableEl, status.sim_available, "YES", "NO");
  setBooleanStatus(wifiAvailableEl, status.wifi_available, "YES", "NO");

  if (status.led_status === 1 || status.led_status === 0) {
    const ledOn = status.led_status === 1;
    ledStatusEl.textContent = ledOn ? "ON" : "OFF";
    ledStatusEl.className = "status-value " + (ledOn ? "healthy" : "unhealthy");
  } else {
    ledStatusEl.textContent = "--";
    ledStatusEl.className = "status-value unknown";
  }

  simNetworkEl.textContent = status.sim_network || "--";
  simNetworkEl.className = "status-value " + (status.sim_network ? "neutral" : "unknown");

  if (lastSeen > 0) {
    const ageSeconds = Math.max(0, Math.floor((Date.now() - lastSeen) / 1000));
	
	const days = Math.floor(ageSeconds / (24 * 3600));
	const remainingAfterDays = ageSeconds % (24 * 3600);
	const hours = Math.floor(remainingAfterDays / 3600);
	const remainingAfterHours = remainingAfterDays % 3600;
	const minutes = Math.floor(remainingAfterHours / 60);
	const seconds = remainingAfterHours % 60;

	// Format with leading zeros if needed
	const dd = String(days).padStart(2, '0');
	const hh = String(hours).padStart(2, '0');
	const mm = String(minutes).padStart(2, '0');
	const ss = String(seconds).padStart(2, '0');

	const formattedTime = `${dd}:${hh}:${mm}:${ss}`;
	
    lastSeenStatusEl.innerHTML  = new Date(lastSeen).toLocaleString() + " <br> (" + formattedTime + " ago)";
    lastSeenStatusEl.className = "status-value " + (isDeivceOnline ? "healthy" : "unhealthy");
  } else {
    lastSeenStatusEl.textContent = "--";
    lastSeenStatusEl.className = "status-value unknown";
  }
}

function renderMachineAndFenceStatus() {
  const machineOn = currentStatus && currentStatus.relay_status === 1;

  if (!isDeivceOnline || !machineOn) {
    liveTextEl2.textContent = "જટકા મશીન: ---";
    liveStatusEl2.classList.toggle("online", false);
    liveStatusEl2.classList.toggle("offline", true);

    liveTextEl3.textContent = "વાડ: ---";
    liveStatusEl3.classList.toggle("online", false);
    liveStatusEl3.classList.toggle("offline", true);
    return;
  }

  liveTextEl2.textContent = "જટકા મશીન: ચાલુ";
  liveStatusEl2.classList.toggle("online", true);
  liveStatusEl2.classList.toggle("offline", false);

  const fenceHealthy = currentInputs && currentInputs.gpio23 === 0;
  liveTextEl3.textContent = "વાડ: " + (fenceHealthy ? "સારી" : "ખામીયુક્ત");
  liveStatusEl3.classList.toggle("online", fenceHealthy);
  liveStatusEl3.classList.toggle("offline", !fenceHealthy);
}

function renderDeviceStatus() {
  const heartbeatAge = Date.now() - lastSeen;
  const online = lastSeen > 0 && heartbeatAge <= DEVICE_OFFLINE_THRESHOLD_MS;
  isDeivceOnline = online;

  deviceStatusTextEl.textContent = "ઉપકરણ: " + (online ? "ઓનલાઇન" : "ઑફલાઇન");
  deviceStatusEl.classList.toggle("online", online);
  deviceStatusEl.classList.toggle("offline", !online);
  deviceStatusEl.classList.remove("pending");
  renderStatusDetails();
  
  renderOutputsTable();
  renderMachineAndFenceStatus();
  if(!isDeivceOnline){
	  liveTextEl.textContent = "વીજ પુરવઠો: ---";
	  liveStatusEl.classList.toggle("online", false);
	  liveStatusEl.classList.toggle("offline", true);
  }
}

function renderOutputsTable() {
  outputsBodyEl.innerHTML = "";

  OUTPUTS.forEach(output => {
    const state = currentOutputs && currentOutputs[output.key] === 1;

    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = output.label;

    const statusCell = document.createElement("td");
	if(isDeivceOnline) {
		statusCell.innerHTML = state
			? '<span class="badge on">● ચાલુ</span>'
			: '<span class="badge off">● બંધ</span>';		
	} else {
		statusCell.textContent = "---";
	}
	
	

    const buttonCell = document.createElement("td");
    const btn = document.createElement("button");
	if(isDeivceOnline) {
		btn.textContent = "બદલો";
		btn.addEventListener("click", () => toggleOutput(output.key));
	} else {
		btn.textContent = "---";
		btn.addEventListener("click", () => {});
	}
    buttonCell.appendChild(btn);

    row.appendChild(nameCell);
    row.appendChild(statusCell);
    row.appendChild(buttonCell);
    outputsBodyEl.appendChild(row);
  });
}

async function fetchGPS() {
  try {
    const res = await fetch(GPS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    if (!data) {
      latEl.textContent = "--";
      lonEl.textContent = "--";
      locSourceEl.textContent = "--";
      locationTimestampEl.textContent = "--";
      return;
    }

    latEl.textContent = typeof data.lat === "number" ? data.lat.toFixed(6) : "--";
    lonEl.textContent = typeof data.lon === "number" ? data.lon.toFixed(6) : "--";

    if (data.locationSource === "gps") {
      locSourceEl.textContent = "Accurate (GPS)";
    } else if (data.locationSource === "cell") {
      locSourceEl.textContent = "Cell Tower (approximate)";
    } else {
      locSourceEl.textContent = "--";
    }

    const locationTimestamp = Number(data.timestamp) || 0;
    locationTimestampEl.textContent = locationTimestamp > 0
      ? new Date(locationTimestamp).toLocaleString()
      : "--";

    if (data.mapUrl) {
      mapLinkEl.href = data.mapUrl;
    }
  } catch (err) {
    console.error("GPS fetch failed:", err);
    locationTimestampEl.textContent = "--";
  }
}

async function fetchOutputs() {
  try {
    const res = await fetch(OUTPUTS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    // data can be null if the node has never been written yet -
    // treat that as "everything off" rather than failing.
    currentOutputs = data || {};
    renderOutputsTable();
  } catch (err) {
    console.error("Outputs fetch failed:", err);
    statusEl.textContent = "Could not load output states.";
  }
}

async function fetchInputs() {
  try {
    const res = await fetch(INPUTS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
	currentInputs = data || {};

	if(isDeivceOnline){
		const live = data && data.gpio22 === 1;
		liveTextEl.textContent = "વીજ પુરવઠો: " + (live ? "ચાલુ" : "બંધ");
		liveStatusEl.classList.toggle("online", live);
		liveStatusEl.classList.toggle("offline", !live);
	}
	renderMachineAndFenceStatus();
  }
  catch (err) {
    console.error("Inputs fetch failed:", err);
    currentInputs = null;

    liveTextEl.textContent = "વીજ પુરવઠો: ---";
    liveStatusEl.classList.add("offline");
    renderMachineAndFenceStatus();
  }
}

function listenForStatus() {
  database.ref("status").on("value", (snapshot) => {
    currentStatus = snapshot.val() || {};
    lastSeen = Number(currentStatus.last_seen) || 0;
    renderDeviceStatus();
  }, (err) => {
    console.error("Status listener failed:", err);
    lastSeen = 0;	isDeivceOnline=false;
    renderDeviceStatus();
    liveTextEl2.textContent = "જટકા મશીન: ---";
    liveStatusEl2.classList.remove("online");
    liveStatusEl2.classList.add("offline");
  });
}

function renderGpsSentenceStatus(element, available) {
  if (typeof available !== "boolean") {
    element.textContent = "--";
    element.className = "status-value unknown";
    return;
  }

  element.textContent = available ? "RECEIVED" : "MISSING";
  element.className = "status-value " + (available ? "healthy" : "unhealthy");
}

function renderGpsData(data) {
  const gpsData = data || {};
  const rawNmea = typeof gpsData.raw_nmea === "string"
    ? gpsData.raw_nmea.slice(-200)
    : "";
  const rawNmea2 = typeof gpsData.raw_nmea2 === "string"
    ? gpsData.raw_nmea2.slice(-200)
    : "";

  renderGpsSentenceStatus(gpsHasGgaEl, gpsData.has_gga);
  renderGpsSentenceStatus(gpsHasRmcEl, gpsData.has_rmc);
  setBooleanStatus(gpsDataValidEl, gpsData.location_valid, "VALID", "NO FIX");

  gpsUtcTimeEl.textContent = gpsData.utc_time || "--";
  gpsDataLatitudeEl.textContent = typeof gpsData.latitude === "number"
    ? gpsData.latitude.toFixed(6)
    : "--";
  gpsDataLongitudeEl.textContent = typeof gpsData.longitude === "number"
    ? gpsData.longitude.toFixed(6)
    : "--";

  const updatedAt = Number(gpsData.last_updated) || 0;
  gpsDataLastUpdatedEl.textContent = updatedAt > 0
    ? new Date(updatedAt).toLocaleString()
    : "--";

  gpsRawNmeaEl.textContent = rawNmea || "Waiting for GPS NMEA data...";
  gpsRawLengthEl.textContent = rawNmea.length + " / 200 chars";
  gpsRawNmea2El.textContent = rawNmea2 || "Waiting for GGA and RMC sentences...";
  gpsRawLength2El.textContent = rawNmea2.length + " / 200 chars";
}

function listenForGpsData() {
  database.ref(GPS_DATA_PATH).on("value", (snapshot) => {
    renderGpsData(snapshot.val());
  }, (err) => {
    console.error("GPS data listener failed:", err);
    renderGpsData(null);
  });
}

async function fetchAll() {
  statusEl.textContent = "";
  await Promise.all([fetchGPS(), fetchOutputs(), fetchInputs()]);
}

async function toggleOutput(key) {
  if (!currentOutputs) return;

  statusEl.textContent = "Updating...";

  const newState = currentOutputs[key] === 1 ? 0 : 1;
  // Only merges with other OUTPUT keys - gps.json is a completely
  // separate node now, so this can never touch location data.
  const updatedBody = Object.assign({}, currentOutputs, { [key]: newState });

  try {
    const res = await fetch(OUTPUTS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedBody)
    });
    if (!res.ok) throw new Error("HTTP " + res.status);

    currentOutputs[key] = newState;
    renderOutputsTable();
    statusEl.textContent = "Updated.";	
  } catch (err) {
    statusEl.textContent = "Failed to update.";
  }
}

listenForStatus();
listenForGpsData();
fetchAll();
setInterval(fetchAll, 5000);
setInterval(renderDeviceStatus, 1000);
