const input = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");
const chatArea = document.getElementById("chatArea");
const brainStatus = document.getElementById("brainStatus");
const voiceStatus = document.getElementById("voiceStatus");

const SERVER_URL = "https://jarvis-v41-1.onrender.com";

function addMessage(text, type) {
    const message = document.createElement("div");

    message.className = `message ${type}-message`;

    message.innerHTML = `
        <div class="message-label">
            ${type === "user" ? "VOCÊ" : "J.A.R.V.I.S."}
        </div>

        <div class="message-text"></div>
    `;

    message.querySelector(".message-text").textContent = text;

    chatArea.appendChild(message);

    message.scrollIntoView({
        behavior: "smooth",
        block: "end"
    });
}

async function sendMessage() {

    const text = input.value.trim();

    if (!text) return;

    addMessage(text, "user");

    input.value = "";

    brainStatus.textContent = "PROCESSING...";
    voiceStatus.textContent = "Consultando núcleo de inteligência...";

    sendButton.disabled = true;

    try {

        const response = await fetch(`${SERVER_URL}/api/chat`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: text
            })

        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Erro no servidor");
        }

        const answer =
            data.reply ||
            data.response ||
            "Não recebi uma resposta do núcleo de inteligência.";

        addMessage(answer, "jarvis");

        speak(answer);

        brainStatus.textContent = "NEURAL CORE READY";
        voiceStatus.textContent = "Sistema pronto";

    } catch (error) {

        console.error(error);

        addMessage(
            "Não consegui acessar meu núcleo de inteligência no momento.",
            "jarvis"
        );

        brainStatus.textContent = "CONNECTION ERROR";
        voiceStatus.textContent = "Erro de conexão com o servidor";

    } finally {

        sendButton.disabled = false;

        input.focus();

    }
}

function speak(text) {

    if (!("speechSynthesis" in window)) return;

    speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "pt-BR";
    speech.rate = 0.95;
    speech.pitch = 0.9;

    speechSynthesis.speak(speech);
}

sendButton.addEventListener("click", sendMessage);

input.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        sendMessage();
    }

});


// MICROFONE

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {

    const recognition = new SpeechRecognition();

    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;

    micButton.addEventListener("click", () => {

        try {

            recognition.start();

            micButton.classList.add("listening");

            voiceStatus.textContent =
                "Escutando...";

        } catch (error) {

            console.log(error);

        }

    });

    recognition.onresult = (event) => {

        const text =
            event.results[0][0].transcript;

        input.value = text;

        micButton.classList.remove("listening");

        voiceStatus.textContent =
            "Comando recebido";

        sendMessage();

    };

    recognition.onerror = () => {

        micButton.classList.remove("listening");

        voiceStatus.textContent =
            "Não consegui entender o comando";

    };

    recognition.onend = () => {

        micButton.classList.remove("listening");

    };

} else {

    micButton.addEventListener("click", () => {

        voiceStatus.textContent =
            "Reconhecimento de voz não disponível neste navegador";

    });

}
