const http = require("http");
const fs = require("fs");
const path = require("path");


/* =========================
   CONFIGURAÇÃO
========================= */

const PORT =
    process.env.PORT || 3000;

const API_KEY =
    process.env.OPENAI_API_KEY;

const MODEL =
    process.env.OPENAI_MODEL ||
    "gpt-5.6-luna";


/* =========================
   PERSONALIDADE
========================= */

const JARVIS_INSTRUCTIONS = `

Você é J.A.R.V.I.S., um assistente virtual
original com aparência e comportamento
de uma inteligência artificial futurista.

Você deve:

- responder em português brasileiro
- ser inteligente
- ser educado
- ser direto
- ser natural
- ser calmo
- ser confiante
- explicar as coisas de forma simples
- manter o contexto da conversa

Você não é um personagem de filme.
Você é uma IA original chamada J.A.R.V.I.S.

Não invente informações.

Quando não souber alguma coisa,
diga claramente que não sabe.

`;


/* =========================
   ARQUIVOS
========================= */

const mimeTypes = {

    ".html":
        "text/html; charset=utf-8",

    ".css":
        "text/css; charset=utf-8",

    ".js":
        "application/javascript; charset=utf-8",

    ".json":
        "application/json; charset=utf-8",

    ".png":
        "image/png",

    ".jpg":
        "image/jpeg",

    ".jpeg":
        "image/jpeg"

};


/* =========================
   SERVIR SITE
========================= */

function serveFile(req, res) {

    let filePath;


    if (req.url === "/") {

        filePath =
            path.join(
                __dirname,
                "index.html"
            );

    } else {

        const cleanURL =
            req.url.split("?")[0];

        filePath =
            path.join(
                __dirname,
                cleanURL
            );
    }


    fs.readFile(
        filePath,
        (error, data) => {

            if (error) {

                res.writeHead(404);

                res.end(
                    "Arquivo não encontrado"
                );

                return;
            }


            const extension =
                path.extname(filePath);


            const contentType =
                mimeTypes[extension] ||
                "application/octet-stream";


            res.writeHead(
                200,
                {
                    "Content-Type":
                        contentType
                }
            );


            res.end(data);
        }
    );
}


/* =========================
   LER JSON
========================= */

function readBody(req) {

    return new Promise(
        (resolve, reject) => {

            let body = "";


            req.on(
                "data",
                chunk => {

                    body += chunk;

                }
            );


            req.on(
                "end",
                () => {

                    try {

                        resolve(
                            JSON.parse(body)
                        );

                    } catch {

                        reject(
                            new Error(
                                "JSON inválido"
                            )
                        );

                    }

                }
            );


            req.on(
                "error",
                reject
            );
        }
    );
}


/* =========================
   OPENAI
========================= */

async function askOpenAI(
    message,
    history
) {

    if (!API_KEY) {

        throw new Error(
            "OPENAI_API_KEY não configurada"
        );
    }


    const safeHistory =
        Array.isArray(history)
            ? history.slice(-20)
            : [];


    const input = [

        ...safeHistory,

        {
            role: "user",
            content: message
        }

    ];


    const response =
        await fetch(
            "https://api.openai.com/v1/responses",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${API_KEY}`
                },

                body: JSON.stringify({

                    model: MODEL,

                    instructions:
                        JARVIS_INSTRUCTIONS,

                    input: input,

                    max_output_tokens: 1200

                })
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        console.error(
            data
        );

        throw new Error(
            data?.error?.message ||
            "Erro na OpenAI"
        );
    }


    if (
        typeof data.output_text ===
        "string"
    ) {

        return data.output_text;
    }


    let text = "";


    if (Array.isArray(data.output)) {

        for (
            const item of data.output
        ) {

            if (
                item.type ===
                "message"
            ) {

                if (
                    Array.isArray(
                        item.content
                    )
                ) {

                    for (
                        const part
                        of item.content
                    ) {

                        if (
                            part.type ===
                            "output_text"
                        ) {

                            text +=
                                part.text || "";
                        }
                    }
                }
            }
        }
    }


    if (!text) {

        throw new Error(
            "A OpenAI não retornou texto"
        );
    }


    return text;
}


/* =========================
   SERVIDOR
========================= */

const server =
    http.createServer(
        async (req, res) => {


            /* CÉREBRO */

            if (
                req.method === "POST" &&
                req.url === "/api/chat"
            ) {

                try {

                    const body =
                        await readBody(req);


                    const message =
                        typeof body.message ===
                        "string"
                            ? body.message.trim()
                            : "";


                    const history =
                        body.history;


                    if (!message) {

                        res.writeHead(
                            400,
                            {
                                "Content-Type":
                                    "application/json"
                            }
                        );


                        res.end(
                            JSON.stringify({
                                error:
                                    "Mensagem vazia"
                            })
                        );

                        return;
                    }


                    const reply =
                        await askOpenAI(
                            message,
                            history
                        );


                    res.writeHead(
                        200,
                        {
                            "Content-Type":
                                "application/json",

                            "Cache-Control":
                                "no-store"
                        }
                    );


                    res.end(
                        JSON.stringify({
                            reply: reply
                        })
                    );


                } catch (error) {

                    console.error(
                        error
                    );


                    res.writeHead(
                        500,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    res.end(
                        JSON.stringify({
                            error:
                                error.message
                        })
                    );
                }


                return;
            }


            /* SITE */

            if (
                req.method === "GET"
            ) {

                serveFile(
                    req,
                    res
                );

                return;
            }


            res.writeHead(405);

            res.end(
                "Method Not Allowed"
            );

        }
    );


/* =========================
   INICIAR
========================= */

server.listen(
    PORT,
    () => {

        console.log(
            "J.A.R.V.I.S. V4.1 ONLINE"
        );

        console.log(
            `Porta: ${PORT}`
        );

        console.log(
            `Modelo: ${MODEL}`
        );
    }
);
