```javascript
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================
// AYARLAR
// =====================================

const OLLAMA_URL = "http://127.0.0.1:11434";
const MODEL = "gemma3";

// =====================================
// EXPRESS
// =====================================

app.use(cors());

app.use(
    express.json({
        limit: "25mb"
    })
);

app.use(express.static(__dirname));

// =====================================
// ANA SAYFA
// =====================================

app.get("/", function (req, res) {
    res.sendFile(
        path.join(__dirname, "index.html")
    );
});

// =====================================
// SAĞLIK
// =====================================

app.get("/api/health", function (req, res) {
    res.json({
        status: "ok",
        dmn: "online",
        ai: "ollama",
        model: MODEL
    });
});

// =====================================
// CHAT
// =====================================

app.post("/api/chat", async function (req, res) {

    try {

        const message =
            typeof req.body.message === "string"
                ? req.body.message.trim()
                : "";

        const english =
            req.body.english === true;

        if (!message) {
            return res.status(400).json({
                error: "Mesaj gönderilmedi."
            });
        }

        // =====================================
        // DMN TALİMATI
        // =====================================

        let systemPrompt = "";

        if (english) {

            systemPrompt = `
You are DMN, a smart, friendly and helpful AI assistant.

Always answer in English.

Be natural, conversational and intelligent.

You are especially knowledgeable about:

Arduino
ESP32
electronics
programming
computers
technology
general knowledge

If the user asks who created you, who your developer is,
who made you, or who developed you, answer:

My developer is Devrim Tuğra Kurtulmuş.

If the user asks for code:

- Give complete working code.
- Never use "...".
- Include required libraries.
- Include required functions.
- Make the code ready to use.
- Do not unnecessarily shorten code.

If the user sends code:

- Find the errors.
- Explain the important problem briefly.
- Then provide the complete corrected code.

If the user says "only code":

- Give only the code.
- Do not add explanations.

Do not unnecessarily generate code during normal conversation.
`;

        } else {

            systemPrompt = `
Sen DMN adlı akıllı, yardımsever ve samimi Türkçe yapay zeka asistanısın.

Her zaman Türkçe konuş.

Doğal, anlaşılır, akıllı ve sohbet tarzında cevap ver.

Özellikle şu konularda bilgili ol:

Arduino
ESP32
elektronik
programlama
bilgisayar
teknoloji
genel bilgi

Kullanıcı sana seni kimin yaptığını sorarsa:

Benim yapımcım Devrim Tuğra Kurtulmuş.

şeklinde cevap ver.

Kullanıcı kod isterse:

- Tam ve eksiksiz çalışan kod ver.
- Kodu kısaltma.
- "..." kullanma.
- Gerekli kütüphaneleri ekle.
- Gerekli bütün fonksiyonları ekle.
- Kullanıma hazır kod ver.

Kullanıcı kod gönderirse:

- Hataları bul.
- Sorunu kısaca açıkla.
- Ardından düzeltilmiş TAM kodu ver.

Kullanıcı "sadece kod" derse:

- Yalnızca kod ver.
- Açıklama yazma.

Normal sohbet sırasında gereksiz yere kod üretme.
`;

        }

        // =====================================
        // OLLAMA
        // =====================================

        const ollamaResponse = await fetch(
            OLLAMA_URL + "/api/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    model: MODEL,

                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],

                    stream: false

                })
            }
        );

        if (!ollamaResponse.ok) {

            const errorText =
                await ollamaResponse.text();

            throw new Error(
                "Ollama hatası: " +
                errorText
            );
        }

        const data =
            await ollamaResponse.json();

        const reply =
            data &&
            data.message &&
            data.message.content
                ? data.message.content
                : "";

        if (!reply) {

            throw new Error(
                "DMN boş cevap aldı."
            );
        }

        // =====================================
        // CEVAP
        // =====================================

        res.json({
            reply: reply
        });

    } catch (error) {

        console.error(
            "DMN CHAT HATASI:",
            error
        );

        res.status(500).json({

            error:
                error.message ||
                "DMN cevap veremedi."

        });
    }
});

// =====================================
// GÖRSEL
// =====================================
// OpenAI olmadığı için burada ücretli
// görsel üretimi kullanılmıyor.

app.post(
    "/api/generate-image",
    function (req, res) {

        res.status(501).json({

            error:
                "Bu ücretsiz/local sürümde görsel üretimi kapalıdır."

        });

    }
);

// =====================================
// SERVER
// =====================================

app.listen(
    PORT,
    "0.0.0.0",
    function () {

        console.log(
            "================================="
        );

        console.log(
            "DMN çalışıyor."
        );

        console.log(
            "http://localhost:" + PORT
        );

        console.log(
            "AI: Ollama"
        );

        console.log(
            "Model: " + MODEL
        );

        console.log(
            "================================="
        );

    }
);
```
