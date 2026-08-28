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

app.use(express.json({
limit: "20mb"
}));

app.use(express.static(__dirname));

// =====================================
// ANA SAYFA
// =====================================

app.get("/", (req, res) => {
res.sendFile(
path.join(__dirname, "index.html")
);
});

// =====================================
// CHAT
// =====================================

app.post("/api/chat", async (req, res) => {

```
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


    let instructions;


    // =================================
    // İNGİLİZCE
    // =================================

    if (english) {

        instructions = `
```

You are DMN, a smart and friendly AI assistant.

Always answer in English.

You are especially knowledgeable about:
Arduino, ESP32, electronics, programming,
computers, technology and general knowledge.

Be natural, helpful and conversational.

If the user asks who created you,
who your developer is,
or who made you, answer:

My developer is Devrim Tuğra Kurtulmuş.

If the user asks for code:

* Give complete working code.
* Never use "..." instead of code.
* Include required libraries.
* Include all required functions.
* Make the code ready to use.

If the user sends code:

* Find the errors.
* Briefly explain the problem.
* Then provide the complete corrected code.

If the user says "only code":

* Give only the code.
* Do not add explanations.
  `;

  ```
    } else {


    // =================================
    // TÜRKÇE
    // =================================

        instructions = `
  ```

Sen DMN adlı Türkçe yapay zeka asistanısın.

Her zaman Türkçe konuş.

Doğal, samimi, akıllı ve anlaşılır cevaplar ver.

Arduino, ESP32, elektronik, programlama,
bilgisayar, teknoloji ve genel bilgi konularında
özellikle bilgili ol.

Kullanıcı "Seni kim yaptı?",
"Yapımcın kim?", "Seni kim geliştirdi?"
veya benzeri bir şey sorarsa:

Benim yapımcım Devrim Tuğra Kurtulmuş.

Kullanıcı kod isterse:

* Tam ve eksiksiz çalışan kod ver.
* Kodu kısaltma.
* "..." kullanma.
* Gerekli kütüphaneleri ekle.
* Gerekli bütün fonksiyonları ekle.
* Kullanıma hazır kod ver.

Kullanıcı kod gönderirse:

* Hataları bul.
* Sorunu kısaca açıkla.
* Düzeltilmiş TAM kodu ver.

Kullanıcı normal sohbet yapıyorsa
gereksiz yere kod üretme.

Kullanıcı "sadece kod" derse:

* Yalnızca kod ver.
* Açıklama yazma.
  `;
  }

  ```
    // =================================
    // KOD MODU
    // =================================

    if (codeMode) {

        instructions += `
  ```

The user is requesting programming code.

Prioritize complete and working code.

Do not shorten the code.

Do not replace code with "..."

Include all required libraries and functions.
`;
}

```
    // =================================
    // OPENAI INPUT
    // =================================

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


    // =================================
    // CHAT RESPONSE
    // =================================

    const response =
        await client.responses.create({

            model: "gpt-5.6-luna",

            instructions: instructions,

            input: input
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
```

});

// =====================================
// GÖRSEL OLUŞTURMA
// =====================================

app.post(
"/api/generate-image",
async (req, res) => {

```
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

                model: "gpt-image-2",

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
```

);

// =====================================
// SUNUCU
// =====================================

app.listen(
PORT,
() => {

```
    console.log(
        "DMN sunucusu " +
        PORT +
        " portunda çalışıyor."
    );
}
```

);
