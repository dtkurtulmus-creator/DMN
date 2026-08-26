const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = 3000;

if (!process.env.OPENAI_API_KEY) {
    console.error("HATA: OPENAI_API_KEY bulunamadı. .env dosyanı kontrol et.");
    process.exit(1);
}

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/chat", async (req, res) => {
    try {
        const mesaj = req.body.message;

        if (!mesaj) {
            return res.status(400).json({
                error: "Mesaj gönderilmedi."
            });
        }

        const response = await client.responses.create({
            model: "gpt-5.4-mini",

            instructions: `
Sen DMN adlı Türkçe yapay zekâ asistanısın.

Uzmanlığın Arduino, ESP32, elektronik ve programlamadır.

Her zaman Türkçe konuş.

Kullanıcı kod isterse:
- Tam ve eksiksiz çalışan kod ver.
- Kodun hiçbir bölümünü kısaltma.
- "..." veya "devamı" kullanma.
- Gerekli kütüphaneleri dahil et.
- setup() ve loop() bölümlerini eksiksiz ver.
- Kodları cpp kod bloğunda göster.

Kullanıcı "sadece kod" derse:
- Yalnızca kod ver.
- Açıklama yazma.
- "İstersen..." yazma.

Kullanıcı kod gönderirse:
- Hataları bul.
- Düzeltilmiş TAM kodu ver.
`,

            input: mesaj
        });

        res.json({
            reply: response.output_text
        });

    } catch (error) {
        console.error("CHAT HATASI:", error);

        res.status(500).json({
            error: "DMN cevap oluşturamadı."
        });
    }
});

app.post("/api/voice", async (req, res) => {
    try {
        const text = req.body.text;

        if (!text) {
            return res.status(400).json({
                error: "Seslendirilecek metin yok."
            });
        }

        console.log("Ses oluşturuluyor...");

        const speech = await client.audio.speech.create({
            model: "gpt-4o-mini-tts",
            voice: "alloy",
            input: text
        });

        const audioBuffer = Buffer.from(
            await speech.arrayBuffer()
        );

        console.log("Ses oluşturuldu.");

        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Content-Length", audioBuffer.length);

        res.end(audioBuffer);

    } catch (error) {
        console.error("SES HATASI:", error);

        res.status(500).json({
            error: error.message || "Ses oluşturulamadı."
        });
    }
});

app.listen(PORT, () => {
    console.log(`DMN sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
});