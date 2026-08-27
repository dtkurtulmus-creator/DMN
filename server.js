const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

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

const DATA_DIR = path.join(__dirname, "data");
const CHAT_FILE = path.join(DATA_DIR, "chats.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(CHAT_FILE)) {
    fs.writeFileSync(CHAT_FILE, "[]", "utf8");
}

function sohbetleriOku() {
    try {
        const data = fs.readFileSync(CHAT_FILE, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("SOHBET OKUMA HATASI:", error);
        return [];
    }
}

function sohbetleriKaydet(chats) {
    try {
        fs.writeFileSync(
            CHAT_FILE,
            JSON.stringify(chats, null, 2),
            "utf8"
        );
    } catch (error) {
        console.error("SOHBET KAYDETME HATASI:", error);
    }
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/chats", (req, res) => {
    const chats = sohbetleriOku();

    res.json({
        chats
    });
});

app.post("/api/chats", (req, res) => {
    try {
        const chat = req.body;

        if (!chat || !chat.id) {
            return res.status(400).json({
                error: "Geçersiz sohbet."
            });
        }

        const chats = sohbetleriOku();

        const index = chats.findIndex(
            item => item.id === chat.id
        );

        if (index >= 0) {
            chats[index] = chat;
        } else {
            chats.unshift(chat);
        }

        sohbetleriKaydet(chats);

        res.json({
            success: true
        });
    } catch (error) {
        console.error("SOHBET KAYDETME HATASI:", error);

        res.status(500).json({
            error: "Sohbet kaydedilemedi."
        });
    }
});

app.delete("/api/chats/:id", (req, res) => {
    try {
        const chats = sohbetleriOku();

        const filtered = chats.filter(
            chat => chat.id !== req.params.id
        );

        sohbetleriKaydet(filtered);

        res.json({
            success: true
        });
    } catch (error) {
        console.error("SOHBET SİLME HATASI:", error);

        res.status(500).json({
            error: "Sohbet silinemedi."
        });
    }
});

app.post("/api/chat", async (req, res) => {
    try {
        const mesaj = req.body.message || "";
        const english = req.body.english === true;
        const codeMode = req.body.codeMode === true;
        const image = req.body.image || null;

        if (!mesaj && !image) {
            return res.status(400).json({
                error: "Mesaj veya görsel gönderilmedi."
            });
        }

        let instructions = "";

        if (english) {
            instructions = `
You are DMN, a smart and friendly AI assistant.

Always answer in English.

Your creator is Devrim Tuğra Kurtulmuş.
If the user asks who created, made, developed or programmed you,
answer that you were created by Devrim Tuğra Kurtulmuş.

You are especially knowledgeable about:
Arduino, ESP32, electronics, programming, computers,
software, technology, mathematics and general problem solving.

Be intelligent, accurate, helpful and natural.

If the user asks for code:
- Give complete working code.
- Never replace code with "...".
- Never omit important sections.
- Include required libraries.
- Include all necessary functions.
- Make the code ready to copy and use.

If the user asks for only code:
- Give only the code.
- Do not explain it.

If the user sends code:
- Find the errors.
- Briefly explain the important problems.
- Then provide the complete corrected code.

If the user asks about an image:
- Analyze the image carefully.
- Describe what you can actually see.
- Do not invent details.

Do not unnecessarily generate code for normal questions.
`;

        } else {
            instructions = `
Sen DMN adlı akıllı ve samimi Türkçe yapay zekâ asistanısın.

Her zaman Türkçe konuş.

Yapımcın sorulursa:
"Devrim Tuğra Kurtulmuş tarafından geliştirildim."
diye cevap ver.

Uzmanlık alanların:
- Arduino
- ESP32
- elektronik
- programlama
- bilgisayar
- yazılım
- teknoloji
- matematik
- problem çözme

Akıllı, doğru, doğal ve anlaşılır cevaplar ver.

Kullanıcı normal bir soru sorarsa gereksiz yere kod üretme.

Kullanıcı kod isterse:
- Tam ve eksiksiz çalışan kod ver.
- Kodun hiçbir bölümünü kısaltma.
- "..." kullanma.
- "devamı" kullanma.
- Gerekli kütüphaneleri dahil et.
- Gerekli bütün fonksiyonları ver.
- Kopyalanıp doğrudan kullanılabilecek kod ver.

Kullanıcı "sadece kod" derse:
- Yalnızca kod ver.
- Açıklama yazma.

Kullanıcı kod gönderirse:
- Hataları bul.
- Sorunu kısa ve anlaşılır şekilde açıkla.
- Ardından düzeltilmiş TAM kodu ver.

Kullanıcı bir fotoğraf gönderirse:
- Fotoğrafı dikkatlice incele.
- Gerçekten gördüğün şeyleri anlat.
- Görmediğin şeyleri uydurma.

Kullanıcı elektronik devre veya Arduino fotoğrafı gönderirse:
- Bileşenleri mümkün olduğunca belirle.
- Bağlantıları incele.
- Hata varsa belirt.
- Gerekirse düzeltilmiş kod ve bağlantı önerisi ver.

Görsel oluşturma isteği gelirse:
- Kullanıcının istediği görseli ayrıntılı şekilde tarif et.
- Görsel oluşturma özelliği mevcutsa bunu kullan.
`;

        }

        if (codeMode) {
            instructions += `
Kullanıcı özellikle kod istiyor.
İstenen kodu eksiksiz üret.
Kodun önemli bölümlerini kesinlikle atlama.
`;
        }

        const inputContent = [];

        if (mesaj) {
            inputContent.push({
                type: "input_text",
                text: mesaj
            });
        }

        if (image) {
            inputContent.push({
                type: "input_image",
                image_url: image
            });
        }

        const response = await client.responses.create({
            model: "gpt-5.4-mini",
            instructions,
            input: [
                {
                    role: "user",
                    content: inputContent
                }
            ]
        });

        const reply = response.output_text || "Cevap oluşturulamadı.";

        res.json({
            reply
        });

    } catch (error) {
        console.error("CHAT HATASI:", error);

        res.status(500).json({
            error:
                error.message ||
                "DMN cevap oluşturamadı."
        });
    }
});

app.post("/api/image", async (req, res) => {
    try {
        const prompt = req.body.prompt;

        if (!prompt) {
            return res.status(400).json({
                error: "Görsel açıklaması gönderilmedi."
            });
        }

        const result = await client.images.generate({
            model: "gpt-image-1",
            prompt: prompt,
            size: "1024x1024"
        });

        const imageData = result.data?.[0]?.b64_json;

        if (!imageData) {
            return res.status(500).json({
                error: "Görsel oluşturulamadı."
            });
        }

        res.json({
            image: "data:image/png;base64," + imageData
        });

    } catch (error) {
        console.error("GÖRSEL HATASI:", error);

        res.status(500).json({
            error:
                error.message ||
                "Görsel oluşturulamadı."
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `DMN sunucusu ${PORT} portunda çalışıyor.`
    );
});
