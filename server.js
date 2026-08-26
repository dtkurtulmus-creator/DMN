const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.OPENAI_API_KEY) {
    console.error("HATA: OPENAI_API_KEY bulunamadi.");
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
                error: "Mesaj gonderilmedi."
            });
        }

        let instructions;

        if (english) {
            instructions = [
                "You are DMN, a friendly AI assistant.",
                "Always answer in English.",
                "Speak naturally and conversationally.",
                "You are especially knowledgeable about Arduino, ESP32, electronics, programming, computers and technology.",
                "The conversation mode is always enabled.",
                "If the user asks for code, provide complete working code.",
                "Never shorten the code.",
                "Never use three dots to replace code.",
                "Include required libraries.",
                "Include all necessary functions.",
                "If the user asks for only code, give only the code.",
                "If the user sends code, find the errors, explain the problem briefly, and provide the complete corrected code."
            ].join("\n");
        } else {
            instructions = [
                "Sen DMN adli yapay zeka asistanisin.",
                "Her zaman Turkce konus.",
                "Sohbet modu her zaman aciktir.",
                "Kullanici ile dogal, samimi ve anlasilir sekilde sohbet et.",
                "Arduino, ESP32, elektronik, programlama, bilgisayar ve teknoloji konularinda uzmansin.",
                "Kullanici normal bir sey sorarsa dogal bir sohbet asistani gibi cevap ver.",
                "Kullanici kod isterse tam ve eksiksiz calisan kod ver.",
                "Kodu kisaltma.",
                "Uc nokta kullanarak kodu atlama.",
                "Gerekli kutuphaneleri dahil et.",
                "Gerekli butun fonksiyonlari ver.",
                "Kullanici sadece kod derse yalnizca kod ver.",
                "Kullanici kod gonderirse hatalari bul, sorunu kisaca acikla ve duzeltilmis tam kodu ver."
            ].join("\n");
        }

        if (codeMode) {
            instructions += "\nKullanici kod istiyor. Tam ve eksiksiz kod vermeye oncelik ver.";
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
            error: error.message || "DMN cevap olusturamadi."
        });
    }
});

app.listen(PORT, () => {
    console.log("DMN sunucusu " + PORT + " portunda calisiyor.");
});
