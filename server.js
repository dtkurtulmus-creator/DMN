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
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/chat", async (req, res) => {
    try {
        const mesaj = req.body.message;
        const english = req.body.english === true;
        const codeMode = req.body.codeMode === true;

        if (!mesaj) {
            return res.status(400).json({
                error: "Mesaj gönderilmedi."
            });
        }

        let instructions = "";

        if (english) {
            instructions = `
You are DMN, a friendly AI assistant.

Always answer in English.

Speak naturally and conversationally.

You are especially knowledgeable about Arduino, ESP32, electronics, programming, computers and technology.

If the user asks for code:
- Provide complete working code.
- Do not shorten the code.
- Do not use "..." instead of code.
- Include required libraries.
- Include all necessary functions.

If the user asks for only code:
- Give only the code.
- Do not add explanations.

If the user sends code:
- Find the errors.
- Explain the problem briefly.
- Then provide the complete corrected code.
`;
        } else {
            instructions = `
Sen DMN adlı yapay zeka asistanısın.

Her zaman Türkçe konuş.

Sohbet modu her zaman açıktır.

Kullanıcıyla doğal, samimi ve anlaşılır şekilde sohbet et.

Uzman olduğun konular:
- Arduino
- ESP32
- elektronik
- programlama
- bilgisayar
- teknoloji

Kullanıcı normal bir şey sorarsa doğal bir sohbet asistanı gibi cevap ver.

Kullanıcı kod isterse:
- Tam ve eksiksiz çalışan kod ver.
- Kodun hiçbir bölümünü kısaltma.
- "..." veya "devamı" kullanma.
- Gerekli kütüphaneleri dahil et.
- Gerekli bütün fonksiyonları ver.

Kullanıcı "sadece kod" derse:
- Yalnızca kod ver.
- Açıklama yazma.

Kullanıcı kod gönderirse:
- Hataları bul.
- Sorunu kısaca açıkla.
- Ardından düzeltilmiş tam kodu ver.
`;
        }

        if (codeMode) {
            instructions += `
The user is asking for code.
Prioritize giving the complete requested code.
`;
        }

        const response = await client.responses.create({
            model: "gpt-5.4-mini",
            instructions: instructions,
            input: mesaj
        });

        res.json({
            reply: response.output_text
        });

    } catch (error) {
        console.error("CHAT HATASI:", error);

        res.status(500).json({
            error: error.message || "DMN cevap oluşturamadı."
        });
    }
});

app.listen(PORT, () => {
    console.log(`DMN sunucusu ${PORT} portunda çalışıyor.`);
});
```
