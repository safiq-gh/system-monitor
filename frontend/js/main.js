const API_BASE = "http://127.0.0.1:8000/api";

async function fetchMetrics() {
    try {
        const cpuRes = await fetch(`${API_BASE}/cpu`);
        const memRes = await fetch(`${API_BASE}/memory`);
        const diskRes = await fetch(`${API_BASE}/disk`);

        const cpuData = await cpuRes.json();
        const memData = await memRes.json();
        const diskData = await diskRes.json();

        document.getElementById("cpu").innerText =
            cpuData.cpu_percent + "%";

        document.getElementById("memory").innerText =
            memData.percent + "% used";

        document.getElementById("disk").innerText =
            diskData.percent + "% used";
	const procRes = await fetch(`${API_BASE}/processes`);
	const procData = await procRes.json();

	const list = document.getElementById("processes");
	list.innerHTML = "";

	procData.forEach(p => {
    	const li = document.createElement("li");
    	li.innerText = `${p.name} (CPU: ${p.cpu}%)`;
    	list.appendChild(li);
	});


    } catch (err) {
        console.error("Error fetching metrics:", err);
    }
}

fetchMetrics();
setInterval(fetchMetrics, 5000);

