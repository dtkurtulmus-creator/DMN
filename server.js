const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================
// OPENAI
// =====================================

if (!process.env.OPENAI_API_KEY) {
    console.error("HATA: OPENAI_API_KEY bulunamadı.");
    process.exit(1);
}

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// =====================================
// MIDDLEWARE
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
// KULLANIM
// =====================================
// Artık mesaj sınırı yok.
// Kullanıcı istediği kadar mesaj gönderebilir.
// Bu endpoint eski frontend ile uyumlu bırakıldı.

app.get("/api/usage", function (req, res) {
    res.json({
        messagesRemaining: 999999,
        unlimited: true
    });
});

// =====================================
// REWARD AD
// =====================================
// Reklam sistemi kaldırıldı.
// Eski frontend çağırırsa hata vermemesi için
// endpoint burada bırakıldı.

app.post("/api/reward-ad", function (req, res) {
    res.json({
        success: true,
        messagesAdded: 0,
        messagesRemaining: 999999,
        unlimited: true
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

        const codeMode =
            req.body.codeMode === true;

        const image =
            typeof req.body.image === "string"
                ? req.body.image
                : null;

        // =====================================
        // MESAJ KONTROLÜ
        // =====================================

        if (!message && !image) {

            return res.status(400).json({
                error: "Mesaj veya fotoğraf gönderilmedi."
            });

        }

        // =====================================
        // DMN TALİMATLARI
        // =====================================

        let instructions;

        if (english) {

            instructions = `
You are DMN, a smart, friendly and helpful AI assistant.

Always answer in English.

Be natural, conversational and intelligent.

You are especially knowledgeable about:

- Arduino
- ESP32
- electronics
- programming
- computers
- technology
- general knowledge

If the user asks who created you, who your developer is,
who made you, or who developed you, answer:

My developer is Devrim Tuğra Kurtulmuş.

If the user asks for code:

- Give complete working code.
- Never replace code with "...".
- Include required libraries.
- Include all required functions.
- Make the code ready to use.
- Do not unnecessarily shorten code.
- Make sure the syntax is correct.

If the user sends code:

- Find the errors.
- Briefly explain the important problem.
- Then provide the complete corrected code.

If the user says "only code":

- Give only the code.
- Do not add explanations.

Do not unnecessarily generate code during normal conversation.

If the user sends an image:

- Carefully analyze the image.
- Identify visible objects, text, circuits, components and errors.
- Explain what you see as accurately as possible.

There are NO subscriptions,
NO advertisements,
and NO message limits in DMN.

The user can use DMN freely.
`;

        } else {

            instructions = `
Sen DMN adlı akıllı, yardımsever ve samimi Türkçe yapay zeka asistanısın.

Her zaman Türkçe konuş.

Doğal, anlaşılır, akıllı ve sohbet tarzında cevap ver.

Özellikle şu konularda bilgili ol:

- Arduino
- ESP32
- elektronik
- programlama
- bilgisayar
- teknoloji
- genel bilgi

Kullanıcı sana:

"Seni kim yaptı?"
"Yapımcın kim?"
"Seni kim geliştirdi?"
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
- JavaScript, HTML, CSS, Python veya diğer dillerde sözdizimini doğru kullan.
- Kodun eksik bölümlerini bırakma.

Kullanıcı kod gönderirse:

- Hataları bul.
- Sorunu kısaca açıkla.
- Ardından düzeltilmiş TAM kodu ver.
- Kodun içinde JavaScript string hatası,
  eksik parantez,
  eksik tırnak veya benzeri syntax hataları bırakma.

Kullanıcı normal sohbet yapıyorsa gereksiz yere kod üretme.

Kullanıcı "sadece kod" derse:

- Yalnızca kod ver.
- Açıklama yazma.

Fotoğraf gönderilirse fotoğrafı dikkatlice analiz et.

Fotoğraftaki:

- nesneleri
- yazıları
- devreleri
- elektronik parçaları
- bağlantıları
- hataları

olabildiğince doğru şekilde açıkla.

DMN'de:

- abonelik yoktur
- reklam yoktur
- ücretli paket yoktur
- mesaj sınırı yoktur

Kullanıcı DMN'yi özgürce kullanabilir.
`;
        }

        // =====================================
        // CODE MODE
        // =====================================

        if (codeMode) {

            instructions += `

Kullanıcı özellikle kod istiyor.

Bu nedenle:

- Tam çalışan kod ver.
- Kodun hiçbir bölümünü "..." ile geçme.
- Eksik fonksiyon bırakma.
- Gerekli import/require satırlarını ekle.
- Kodun sözdizimini kontrol et.
- Kullanıcı "tüm kodu ver" diyorsa dosyanın tamamını ver.
- Kullanıcı mevcut kodundaki hatayı gösterdiyse düzeltilmiş tam sürümü ver.
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
        // OPENAI RESPONSE
        // =====================================

        const response =
            await client.responses.create({

                model: "gpt-5.6-luna",

                instructions: instructions,

                input: input

            });

        // =====================================
        // CEVAP
        // =====================================

        const reply =
            response.output_text || "";

        res.json({

            reply: reply,

            // Frontend eski sistemle uyumlu kalsın.
            // Gerçek limit yok.
            messagesRemaining: 999999,

            unlimited: true

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
                "DMN görsel oluşturuyor..."
            );

            const result =
                await client.images.generate({

                    model: "gpt-image-1",

                    prompt: prompt,

                    size: "1024x1024"

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

            status: "ok",

            dmn: "online",

            unlimited: true,

            ads: false,

            subscription: false

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

        console.log(
            "DMN ONLINE - SINIRSIZ KULLANIM"
        );

    }
);
