const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.OPENROUTER_API_KEY;

if (!API_KEY) {
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

        const instructions =
            "Sen DMN adlı akıllı, yardımsever ve samimi bir yapay zeka asistanısın.\n\n" +
            "Her zaman Türkçe konuş.\n\n" +
            "Doğal, anlaşılır ve arkadaşça cevap ver.\n\n" +
            "Arduino, ESP32, elektronik, programlama, bilgisayar, teknoloji ve genel bilgi konularında yardımcı ol.\n\n" +
            "Kullanıcı seni kimin yaptığını sorarsa: Benim yapımcım Devrim Tuğra Kurtulmuş. şeklinde cevap ver.\n\n" +
            "Kullanıcı kod isterse tam ve çalışan kod ver. Kodları '...' ile kısaltma.\n" +
            "Gerekli kütüphaneleri ve fonksiyonları ekle.\n" +
            "Kullanıcı kod gönderirse hataları bul ve düzeltilmiş tam kodu ver.\n" +
            "Kullanıcı sadece kod isterse yalnızca kod ver.";

        const openRouterResponse = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + API_KEY,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://dmn-4obi.onrender.com",
                    "X-Title": "DMN AI"
                },
                body: JSON.stringify({
                    model: "openrouter/free",
                    messages: [
                        {
                            role: "system",
                            content: instructions
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ]
                })
            }
        );

        const data = await openRouterResponse.json();

        if (!openRouterResponse.ok) {
            console.error("OPENROUTER HATASI:", data);

            return res.status(openRouterResponse.status).json({
                error:
                    data &&
                    data.error &&
                    data.error.message
                        ? data.error.message
                        : "OpenRouter cevap vermedi."
            });
        }

        const reply =
            data &&
            data.choices &&
            data.choices[0] &&
            data.choices[0].message &&
            data.choices[0].message.content
                ? data.choices[0].message.content
                : "";

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
