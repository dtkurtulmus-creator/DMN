const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.OPENAI_API_KEY) {
    console.error("HATA: OPENAI_API_KEY bulunamadı.");
    process.exit(1);
}

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

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
// CHAT
// =====================================

app.post("/api/chat", async function (req, res) {

    try {

        const message =
            typeof req.body.message === "string"
                ? req.body.message
                : "";

        const english =
            req.body.english === true;

        const codeMode =
            req.body.codeMode === true;

        const image =
            typeof req.body.image === "string"
                ? req.body.image
                : null;


        if (!message && !image) {

            return res.status(400).json({
                error: "Mesaj veya fotoğraf gönderilmedi."
            });

        }


        // =====================================
        // TALİMATLAR
        // =====================================

        let instructions = "";


        if (english) {

            instructions = `
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
- Never replace code with "..."
- Include required libraries.
- Include all required functions.
- Make the code ready to use.
- Keep important parts of the code intact.

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

            instructions = `
Sen DMN adlı akıllı, yardımsever ve samimi Türkçe yapay zeka asistanısın.

Her zaman Türkçe konuş.

Doğal, anlaşılır, akıllı ve sohbet tarzında cevaplar ver.

Özellikle şu konularda bilgili ol:

Arduino
ESP32
elektronik
programlama
bilgisayar
teknoloji
genel bilgi

Kullanıcı sana "Seni kim yaptı?",
"Yapımcın kim?",
"Seni kim geliştirdi?",
"Senin yapımcın kim?"
veya benzeri bir soru sorarsa:

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

Kullanıcı normal sohbet yapıyorsa gereksiz yere kod üretme.

Kullanıcı "sadece kod" derse:

- Yalnızca kod ver.
- Açıklama yazma.

Fotoğraf gönderilirse fotoğrafı dikkatlice analiz et.
Fotoğraftaki nesneleri, yazıları, devreleri veya hataları
olabildiğince doğru şekilde açıkla.
`;
        }


        if (codeMode) {

            instructions += `

The user is requesting programming code.

Prioritize complete, working and ready-to-use code.

Do not shorten the requested code.

Do not replace parts with "...".
`;
        }


        // =====================================
        // OPENAI INPUT
        // =====================================

        let input;


        if (image) {

            input = [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text:
                                message ||
                                "Bu fotoğrafı analiz et."
                        },
                        {
                            type: "input_image",
                            image_url: image
                        }
                    ]
                }
            ];

        } else {

            input = message;

        }


        // =====================================
        // OPENAI CEVABI
        // =====================================

        const response =
            await client.responses.create({

                model: "gpt-5.6-luna",

                instructions:
                    instructions,

                input:
                    input

            });


        const reply =
            response.output_text || "";


        res.json({
            reply: reply
        });


    } catch (error) {

        console.error(
            "CHAT HATASI:",
            error
        );


        res.status(500).json({

            error:
                error.message ||
                "DMN cevap oluşturamadı."

        });

    }

});


// =====================================
// GÖRSEL OLUŞTURMA
// =====================================

app.post(
    "/api/generate-image",
    async function (req, res) {

        try {

            const prompt =
                typeof req.body.prompt === "string"
                    ? req.body.prompt.trim()
                    : "";


            if (!prompt) {

                return res.status(400).json({

                    error:
                        "Görsel açıklaması gönderilmedi."

                });

            }


            console.log(
                "Görsel oluşturuluyor..."
            );


            const result =
                await client.images.generate({

                    model:
                        "gpt-image-2",

                    prompt:
                        prompt,

                    size:
                        "1024x1024"

                });


            if (
                !result ||
                !result.data ||
                !result.data[0]
            ) {

                throw new Error(
                    "Görsel oluşturulamadı."
                );

            }


            const imageData =
                result.data[0].b64_json;


            if (!imageData) {

                throw new Error(
                    "Görsel verisi alınamadı."
                );

            }


            res.json({

                image:
                    "data:image/png;base64," +
                    imageData

            });


        } catch (error) {

            console.error(
                "GORSEL HATASI:",
                error
            );


            res.status(500).json({

                error:
                    error.message ||
                    "Görsel oluşturulamadı."

            });

        }

    }
);


// =====================================
// SAĞLIK KONTROLÜ
// =====================================

app.get(
    "/api/health",
    function (req, res) {

        res.json({

            status:
                "ok",

            dmn:
                "online"

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
            "DMN sunucusu " +
            PORT +
            " portunda çalışıyor."
        );

    }
);
