const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.OPENROUTER_API_KEY) {
    console.error("HATA: OPENROUTER_API_KEY bulunamadı.");
    process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        dmn: "online"
    });
});

app.post("/api/chat", async (req, res) => {
    try {
        const message =
            typeof req.body.message === "string"
                ? req.body.message.trim()
                : "";

        if (!message) {
            return res.status(400).json({
                error: "Mesaj boş."
            });
        }

        const systemPrompt = `
Sen DMN adlı akıllı, yardımsever ve samimi bir yapay zeka asistanısın.

Her zaman Türkçe cevap ver.

Doğal, anlaşılır ve arkadaşça konuş.

Arduino, ESP32, elektronik, programlama,
bilgisayar, teknoloji ve genel bilgi konularında
özellikle yardımcı ol.

Kullanıcı "Seni kim yaptı?",
"Yapımcın kim?" veya benzeri bir şey sorarsa:

Benim yapımcım Devrim Tuğra Kurtulmuş.

şeklinde cevap ver.

Kullanıcı kod isterse:
- Tam çalışan kod ver.
- "..." ile kodu kısaltma.
- Gerekli kütüphaneleri ekle.
- Gerekli fonksiyonları ekle.
- Kullanıma hazır kod ver.

Kullanıcı kod gönderirse:
- Hataları bul.
- Sorunu açıkla.
- Düzeltilmiş tam kodu ver.

Kullanıcı "sadece kod" derse sadece kod ver.
`;

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization":
                        "Bearer " +
                        process.env.OPENROUTER_API_KEY,

                    "Content-Type":
                        "application/json",

                    "HTTP-Referer":
                        "https://dmn-4obi.onrender.com",

                    "X-Title":
                        "DMN AI"
                },

                body: JSON.stringify({
                    model: "openrouter/free",

                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenRouter:", data);

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "OpenRouter cevap vermedi."
            });
        }

        const reply =
            data?.choices?.[0]?.message?.content;

        if (!reply) {
            return res.status(500).json({
                error: "DMN boş cevap verdi."
            });
        }

        res.json({
            reply: reply
        });

    } catch (error) {
        console.error("DMN HATASI:", error);

        res.status(500).json({
            error:
                error.message ||
                "DMN cevap oluşturamadı."
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        "DMN sunucusu " +
        PORT +
        " portunda çalışıyor."
    );

    console.log(
        "DMN ONLINE - OPENROUTER"
    );
});
