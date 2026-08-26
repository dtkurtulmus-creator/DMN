```javascript
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

// Render PORT'u kendisi verir.
// Lokal çalıştırırken 3000 kullanılır.
const PORT = process.env.PORT || 3000;


// =====================================
// OPENAI
// =====================================

if (!process.env.OPENAI_API_KEY) {

    console.error(
        "HATA: OPENAI_API_KEY bulunamadı."
    );

    process.exit(1);
}


const client =
    new OpenAI({
        apiKey:
            process.env.OPENAI_API_KEY
    });


// =====================================
// MIDDLEWARE
// =====================================

app.use(cors());

app.use(
    express.json()
);

app.use(
    express.static(__dirname)
);


// =====================================
// ANA SAYFA
// =====================================

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);


// =====================================
// CHAT
// =====================================

app.post(
    "/api/chat",
    async (req, res) => {

        try {

            const mesaj =
                req.body.message;

            const english =
                req.body.english === true;

            const codeMode =
                req.body.codeMode === true;


            if (!mesaj) {

                return res.status(400).json({

                    error:
                        "Mesaj gönderilmedi."

                });

            }


            // =================================
            // SİSTEM TALİMATI
            // =================================

            let instructions;


            if (english) {

                instructions = `

You are DMN, a friendly AI assistant.

Always answer in English.

You are especially knowledgeable about:
- Arduino
- ESP32
- electronics
- programming
- computers
- technology

The conversation mode is always enabled.

Speak naturally and conversationally.

If the user asks for code:
- Provide complete working code.
- Never shorten the code.
- Never use "..." to replace code.
- Include required libraries.
- Include all necessary functions.
- Make the code ready to use.

If the user asks for only code:
- Give only the code.
- Do not add explanations.

If the user sends code:
- Find the errors.
- Explain the important problem briefly.
- Then provide the COMPLETE corrected code.

`;

            } else {

                instructions = `

Sen DMN adlı Türkçe yapay zekâ asistanısın.

Her zaman Türkçe konuş.

Sohbet modu her zaman açıktır.

Kullanıcıyla doğal, samimi ve anlaşılır şekilde sohbet et.

Uzmanlığın:
- Arduino
- ESP32
- elektronik
- programlama
- bilgisayar
- teknoloji

Kullanıcı normal bir şey sorarsa:
- Doğal bir sohbet asistanı gibi cevap ver.
- Gereksiz yere kod üretme.

Kullanıcı kod isterse:
- Tam ve eksiksiz çalışan kod ver.
- Kodun hiçbir bölümünü kısaltma.
- "..." veya "devamı" kullanma.
- Gerekli kütüphaneleri dahil et.
- Gerekli bütün fonksiyonları ver.
- Kullanıma hazır kod ver.

Kullanıcı "sadece kod" derse:
- Yalnızca kod ver.
- Açıklama yazma.

Kullanıcı kod gönderirse:
- Hataları bul.
- Sorunu kısaca açıkla.
- Ardından düzeltilmiş TAM kodu ver.

`;

            }


            // =================================
            // KOD MODU
            // =================================

            if (codeMode) {

                instructions += `

The user appears to be requesting code.

Prioritize producing the requested code.

Do not unnecessarily refuse to provide code.

Provide complete code unless the user explicitly asks for a small snippet.

`;

            }


            // =================================
            // OPENAI
            // =================================

            const response =
                await client.responses.create({

                    model:
                        "gpt-5.4-mini",

                    instructions:
                        instructions,

                    input:
                        mesaj

                });


            res.json({

                reply:
                    response.output_text

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

    }
);


// =====================================
// SERVER
// =====================================

app.listen(
    PORT,
    () => {

        console.log(
            `DMN sunucusu ${PORT} portunda çalışıyor.`
        );

    }
);
```
