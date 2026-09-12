const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");
const voiceStatus = document.getElementById("voiceStatus");
const brainStatus = document.getElementById("brainStatus");
const connectionText = document.getElementById("connectionText");

const conversation = [];

const CONFIG = {
    serverURL: "/api/chat",
    language: "pt-BR",
    voice: true
};


/* =========================
   MENSAGENS
========================= */

function addMessage(type, text) {

    const message = document.createElement("div");

    message.className =
        type === "user"
            ? "message user-message"
            : "message jarvis-message";

    const label = document.createElement("div");

    label.className = "message-label";

    label.textContent =
        type === "user"
            ? "VOCÊ"
            : "J.A.R.V.I.S.";

    const content = document.createElement("div");

    content.className = "message-text";

    content.textContent = text;

    message.appendChild(label);
    message.appendChild(content);

    chatArea.appendChild(message);

    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });
}


/* =========================
   VOZ
========================= */

function speak(text) {

    if (!CONFIG.voice) return;

    if (!("speechSynthesis" in window)) return;

    speechSynthesis.cancel();

    const voice = new SpeechSynthesisUtterance(text);

    voice.lang = CONFIG.language;
    voice.rate = 0.92;
    voice.pitch = 0.82;
    voice.volume = 1;

    const voices = speechSynthesis.getVoices();

    const ptVoice = voices.find(v =>
        v.lang &&
        v.lang.toLowerCase().includes("pt-br")
    );

    if (ptVoice) {
        voice.voice = ptVoice;
    }

    speechSynthesis.speak(voice);
}


/* =========================
   STATUS
========================= */

function status(text) {
    brainStatus.textContent = text;
}


/* =========================
   CÉREBRO
========================= */

async function askJarvis(message) {

    status("PROCESSANDO...");

    connectionText.textContent = "PROCESSING";

    try {

        const response = await fetch(
            CONFIG.serverURL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message,
                    history: conversation
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Erro no servidor"
            );

        }


        if (!data.reply) {

            throw new Error(
                "A IA não retornou resposta"
            );

        }


        conversation.push({
            role: "user",
            content: message
        });

        conversation.push({
            role: "assistant",
            content: data.reply
        });


        addMessage(
            "jarvis",
            data.reply
        );


        speak(data.reply);


        status("NEURAL CORE READY");

        connectionText.textContent =
            "ONLINE";


    } catch (error) {

        console.error(error);


        addMessage(
            "jarvis",
            "Não consegui acessar meu núcleo de inteligência no momento."
        );


        status("NEURAL CORE OFFLINE");

        connectionText.textContent =
            "OFFLINE";
    }
}


/* =========================
   ENVIAR
========================= */

async function sendMessage() {

    const text =
        userInput.value.trim();

    if (!text) return;

    addMessage(
        "user",
        text
    );

    userInput.value = "";

    await askJarvis(text);
}


sendButton.addEventListener(
    "click",
    sendMessage
);


/* =========================
   ENTER
========================= */

userInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            sendMessage();
        }

    }
);


/* =========================
   MICROFONE
========================= */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.lang = "pt-BR";

    recognition.continuous = false;

    recognition.interimResults = false;


    recognition.onstart = () => {

        micButton.classList.add(
            "listening"
        );

        voiceStatus.textContent =
            "Ouvindo...";

        status(
            "VOICE INPUT ACTIVE"
        );
    };


    recognition.onresult = event => {

        const text =
            event.results[0][0].transcript;

        userInput.value = text;

        voiceStatus.textContent =
            "Comando recebido";

        sendMessage();
    };


    recognition.onerror = () => {

        voiceStatus.textContent =
            "Não consegui entender o áudio";
    };


    recognition.onend = () => {

        micButton.classList.remove(
            "listening"
        );

        voiceStatus.textContent =
            "Toque no microfone para falar";

        status(
            "NEURAL CORE READY"
        );
    };


    micButton.addEventListener(
        "click",
        () => {

            try {
                recognition.start();
            } catch (error) {
                console.log(error);
            }

        }
    );

} else {

    micButton.disabled = true;

    voiceStatus.textContent =
        "Reconhecimento de voz indisponível";
}


console.log(
    "J.A.R.V.I.S. V4.1 iniciado"
);
