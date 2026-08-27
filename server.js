const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY bulunamadi.");
    process.exit(1);
}

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/chat", async (req, res) => {
    try {
        const mesaj = req.body.message;
        const english = req.body.english === true;
        const codeMode = req.body.codeMode === true;
        const image = req.body.image || null;

        if (!mesaj && !image) {
            return res.status(400).json({
                error: "Mesaj veya fotograf gonderilmedi."
            });
        }

        let instructions = "";

        if (english) {
            instructions =
                "You are DMN, a friendly AI assistant.\n" +
                "Always answer in English.\n" +
                "Speak naturally and conversationally.\n" +
                "You are knowledgeable about Arduino, ESP32, electronics, programming, computers and technology.\n" +
                "Conversation mode is always enabled.\n" +
                "If the user asks for code, provide complete working code.\n" +
                "Never shorten code.\n" +
                "Never replace code with three dots.\n" +
                "Include required libraries and functions.\n" +
                "If the user asks for only code, give only the code.\n" +
                "If the user sends an image, analyze it carefully.\n" +
                "Answer questions about the image based on what you can see.";
        } else {
            instructions =
                "Sen DMN adli yapay zeka asistanisin.\n" +
                "Her zaman Turkce konus.\n" +
                "Sohbet modu her zaman aciktir.\n" +
                "Kullanici ile dogal, samimi ve anlasilir sekilde sohbet et.\n" +
                "Arduino, ESP32, elektronik, programlama, bilgisayar ve teknoloji konularinda uzmansin.\n" +
                "Kullanici normal bir sey sorarsa dogal bir sohbet asistani gibi cevap ver.\n" +
                "Kullanici kod isterse tam ve eksiksiz calisan kod ver.\n" +
                "Kodu kisaltma.\n" +
                "Uc nokta kullanarak kodu atlama.\n" +
                "Gerekli kutuphaneleri ve fonksiyonlari dahil et.\n" +
                "Kullanici sadece kod derse yalnizca kod ver.\n" +
                "Kullanici fotograf gonderirse fotografi dikkatlice incele.\n" +
                "Fotograf hakkindaki sorulari fotografi analiz ederek cevapla.";
        }

        if (codeMode) {
            instructions +=
                "\nKullanici kod istiyor. Tam ve eksiksiz kod vermeye oncelik ver.";
        }

        const content = [];

        if (mesaj) {
            content.push({
                type: "input_text",
                text: mesaj
            });
        }

        if (image) {
            content.push({
                type: "input_image",
                image_url: image
            });
        }

        const response = await client.responses.create({
            model: "gpt-5.4-mini",
            instructions: instructions,
            input: [
                {
                    role: "user",
                    content: content
                }
            ]
        });

        res.json({
            reply: response.output_text
        });

    } catch (error) {
        console.error("CHAT HATASI:", error);

        res.status(500).json({
            error: error.message || "DMN cevap olusturamadi."
        });
    }
});

app.listen(PORT, () => {
    console.log(
        "DMN sunucusu " + PORT + " portunda calisiyor."
    );
});
