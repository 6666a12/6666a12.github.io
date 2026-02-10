const pad = n => n.toString().padStart(2,'0');
const box = document.getElementById("clock");
let lastSec = -1;
function frame() {
    const now = new Date();
    const sec = now.getSeconds();
    if (sec !== lastSec) { 
        box.textContent = `现在的时间是 ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(sec)}`;
        lastSec = sec;
    }
    requestAnimationFrame(frame);
}
frame();