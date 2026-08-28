```javascript
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
app.use(express.json({ limit: "20mb" }));
app.use(express.static(__dirname));

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/chat", async function (req, res) {
    try {
        const message = req.body.message || "";
        const english = req.body.english === true;
        const codeMode = req.body.codeMode === true;
        const image = req.body.image || null;

        let instructions;

        if (english) {
            instructions = `
You are DMN, a smart and friendly AI assistant.

Always answer in English.

You are especially knowledgeable about Arduino, ESP32, electronics, programming, computers, technology and general knowledge.

Be natural, helpful and conversational.

If the user asks who created you, who your developer is, or who made you, answer:

My developer is Devrim Tuğra Kurtulmuş.

If the user asks for code:
- Give complete working code.
- Never use "..." instead of code.
- Include required libraries.
- Include all required functions.
- Make the code ready to use.

If the user sends code:
- Find the errors.
- Briefly explain the problem.
- Then provide the complete corrected code.

If the user says "only code":
- Give only the code.
- Do not add explanations.
`;
        } else {
            instructions = `
Sen DMN adlı Türkçe yapay zeka asistanısın.

Her zaman Türkçe konuş.

Doğal, samimi, akıllı ve anlaşılır cevaplar ver.

Arduino, ESP32, elektronik, programlama, bilgisayar, teknoloji ve genel bilgi konularında özellikle bilgili ol.

Kullanıcı "Seni kim yaptı?", "Yapımcın kim?", "Seni kim geliştirdi?" veya benzeri bir şey sorarsa:

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
- Düzeltilmiş TAM kodu ver.

Kullanıcı normal sohbet yapıyorsa gereksiz yere kod üretme.

Kullanıcı "sadece kod" derse:
- Yalnızca kod ver.
- Açıklama yazma.
`;
        }

        if (codeMode) {
            instructions += `
The user is requesting programming code.
Prioritize complete and working code.
Do not shorten the code.
`;
        }

        let input;

        if (image) {
            input = [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: message || "Bu fotoğrafı analiz et."
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

        const response = await client.responses.create({
            model: "gpt-5.6-luna",
            instructions: instructions,
            input: input
        });

        res.json({
            reply: response.output_text || ""
        });

    } catch (error) {
        console.error("CHAT HATASI:", error);

        res.status(500).json({
            error: error.message || "DMN cevap oluşturamadı."
        });
    }
});

app.post("/api/generate-image", async function (req, res) {
    try {
        const prompt = req.body.prompt || "";

        if (!prompt) {
            return res.status(400).json({
                error: "Görsel açıklaması gönderilmedi."
            });
        }

        console.log("Görsel oluşturuluyor...");

        const result = await client.images.generate({
            model: "gpt-image-1",
            prompt: prompt,
            size: "1024x1024"
        });

        if (!result.data || !result.data[0]) {
            throw new Error("Görsel oluşturulamadı.");
        }

        const imageData = result.data[0].b64_json;

        if (!imageData) {
            throw new Error("Görsel verisi alınamadı.");
        }

        res.json({
            image: "data:image/png;base64," + imageData
        });

    } catch (error) {
        console.error("GORSEL HATASI:", error);

        res.status(500).json({
            error: error.message || "Görsel oluşturulamadı."
        });
    }
});

app.listen(PORT, "0.0.0.0", function () {
    console.log(
        "DMN sunucusu " + PORT + " portunda çalışıyor."
    );
});
```
