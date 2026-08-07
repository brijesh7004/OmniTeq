const GPS_URL = "https://jhatka-machine-default-rtdb.asia-southeast1.firebasedatabase.app/gps.json";
const OUTPUTS_URL = "https://jhatka-machine-default-rtdb.asia-southeast1.firebasedatabase.app/outputs.json";

const OUTPUTS = [
  { key: "led",    label: "LED (GPIO 13)" },
  { key: "relay",  label: "Relay (GPIO 33)" },
  { key: "gpio18", label: "GPIO 18" },
  { key: "gpio19", label: "GPIO 19" },
  { key: "gpio21", label: "GPIO 21" },
  { key: "gpio22", label: "GPIO 22" },
  { key: "gpio23", label: "GPIO 23" },
];

const latEl = document.getElementById("lat");
const lonEl = document.getElementById("lon");
const locSourceEl = document.getElementById("locSource");
const mapLinkEl = document.getElementById("mapLink");
const outputsBodyEl = document.getElementById("outputsBody");
const statusEl = document.getElementById("statusMsg");

// Only ever holds the outputs.json contents now - not mixed with gps data.
let currentOutputs = null;

function renderOutputsTable() {
  outputsBodyEl.innerHTML = "";

  OUTPUTS.forEach(output => {
    const state = currentOutputs && currentOutputs[output.key] === 1;

    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = output.label;

    const statusCell = document.createElement("td");
    statusCell.textContent = state ? "ON" : "OFF";

    const buttonCell = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "Toggle";
    btn.addEventListener("click", () => toggleOutput(output.key));
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

    if (data.mapUrl) {
      mapLinkEl.href = data.mapUrl;
    }
  } catch (err) {
    console.error("GPS fetch failed:", err);
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

async function fetchAll() {
  statusEl.textContent = "";
  await Promise.all([fetchGPS(), fetchOutputs()]);
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

fetchAll();
setInterval(fetchAll, 5000);