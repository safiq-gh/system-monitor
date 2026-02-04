function connectWS() {
    const ws = new WebSocket("ws://127.0.0.1:8000/api/ws/metrics");

    ws.onopen = () => console.log("WS connected");

    ws.onmessage = (e) => {
        const data = JSON.parse(e.data);

        document.getElementById("cpu").innerText = data.cpu + "%";
        document.getElementById("memory").innerText = data.memory + "% used";
        document.getElementById("disk").innerText = data.disk + "% used";

        const list = document.getElementById("processes");
        list.innerHTML = "";
        data.processes.forEach(p => {
            const li = document.createElement("li");
            li.innerText = `${p.name} (CPU: ${p.cpu}%)`;
            list.appendChild(li);
        });
    };

    ws.onclose = () => {
        console.log("WS closed, reconnecting...");
        setTimeout(connectWS, 1000);
    };

    ws.onerror = () => ws.close();
}

connectWS();

