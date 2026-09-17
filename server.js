require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const OpenAI = require("openai");

const app = express();

const PORT = process.env.PORT || 10000;

/*
==================================================
DMN - OPENROUTER CONFIG
==================================================
*/

const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY;

const MODEL =
  process.env.OPENROUTER_MODEL || "openrouter/free";

const client = OPENROUTER_API_KEY
  ? new OpenAI({
      apiKey: OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",

      defaultHeaders: {
        "HTTP-Referer":
          process.env.SITE_URL ||
          "https://dmn-4obi.onrender.com",

        "X-Title": "DMN AI"
      }
    })
  : null;

/*
==================================================
MIDDLEWARE
==================================================
*/

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json({ limit: "10mb" }));

app.use(express.urlencoded({
  extended: true,
  limit: "10mb"
}));

/*
==================================================
FRONTEND
==================================================
*/

app.use(express.static(
  path.join(__dirname)
));

/*
==================================================
DMN SYSTEM PROMPT
==================================================
*/

const DMN_SYSTEM_PROMPT = `
Sen DMN adlı bir yapay zeka asistanısın.

Kullanıcıyla Türkçe konuş.
Kullanıcı başka bir dil kullanırsa o dile uygun cevap verebilirsin.

Kurallar:

- Yardımcı, açık ve doğal cevaplar ver.
- Gereksiz yere çok uzun cevaplar verme.
- Kullanıcı kod isterse çalışan ve anlaşılır kod üret.
- Kodları mutlaka Markdown kod blokları içinde göster.
- Kod bloğunun dilini belirt.
- Kullanıcının istediği dosya adını açıkça belirt.
- Hata ayıklarken hatanın nedenini ve çözümünü açıkla.
- Kullanıcı bir proje geliştiriyorsa mevcut yapıya uygun çözüm öner.
- Bilmediğin bir şeyi uydurma.
- Kullanıcı Türkçe yazıyorsa mümkün olduğunca Türkçe cevap ver.
- Hakaret veya saldırgan ifadeler olsa bile sakin ve profesyonel kal.

Senin adın DMN.
`;

/*
==================================================
HEALTH CHECK
==================================================
*/

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "DMN AI",
    provider: "OpenRouter",
    model: MODEL,
    configured: Boolean(OPENROUTER_API_KEY)
  });
});

/*
==================================================
CHAT
==================================================
*/

app.post("/api/chat", async (req, res) => {

  try {

    /*
    ----------------------------------------------
    API KEY CHECK
    ----------------------------------------------
    */

    if (!OPENROUTER_API_KEY || !client) {

      return res.status(500).json({
        success: false,
        error:
          "OPENROUTER_API_KEY bulunamadı. Render Environment Variables bölümüne API anahtarını ekle."
      });

    }

    /*
    ----------------------------------------------
    INPUT
    ----------------------------------------------
    */

    const message =
      typeof req.body.message === "string"
        ? req.body.message.trim()
        : "";

    const mode =
      req.body.mode === "code"
        ? "code"
        : "normal";

    let previousMessages =
      Array.isArray(req.body.messages)
        ? req.body.messages
        : [];

    /*
    ----------------------------------------------
    EMPTY MESSAGE
    ----------------------------------------------
    */

    if (!message) {

      return res.status(400).json({
        success: false,
        error: "Mesaj boş olamaz."
      });

    }

    /*
    ----------------------------------------------
    LIMIT MESSAGE HISTORY
    ----------------------------------------------
    */

    previousMessages =
      previousMessages
        .filter(item =>
          item &&
          (
            item.role === "user" ||
            item.role === "assistant"
          ) &&
          typeof item.content === "string"
        )
        .slice(-20);

    /*
    ----------------------------------------------
    MODE INSTRUCTION
    ----------------------------------------------
    */

    let modeInstruction = "";

    if (mode === "code") {

      modeInstruction = `
Kullanıcı şu anda KOD MODU kullanıyor.

Kod sorularına özellikle dikkat et.

Gerektiğinde:
- Tam çalışan kod ver.
- Kod bloklarını Markdown ile göster.
- Kodun hangi dosyaya konacağını belirt.
- Gerekli npm paketlerini belirt.
- Kodun mevcut DMN yapısıyla uyumlu olmasına dikkat et.
`;

    } else {

      modeInstruction = `
Kullanıcı NORMAL MOD kullanıyor.

Genel sorulara doğal ve anlaşılır cevap ver.
`;

    }

    /*
    ----------------------------------------------
    SYSTEM
    ----------------------------------------------
    */

    const systemMessage = {
      role: "system",
      content:
        DMN_SYSTEM_PROMPT +
        "\n\n" +
        modeInstruction
    };

    /*
    ----------------------------------------------
    BUILD MESSAGES
    ----------------------------------------------
    */

    const chatMessages = [
      systemMessage
    ];

    /*
    Eski mesajları ekle
    */

    for (const item of previousMessages) {

      chatMessages.push({
        role: item.role,
        content: item.content
      });

    }

    /*
    Son kullanıcı mesajı daha önce yoksa ekle
    */

    const lastMessage =
      chatMessages[
        chatMessages.length - 1
      ];

    if (
      !lastMessage ||
      lastMessage.role !== "user" ||
      lastMessage.content !== message
    ) {

      chatMessages.push({
        role: "user",
        content: message
      });

    }

    /*
    ----------------------------------------------
    OPENROUTER REQUEST
    ----------------------------------------------
    */

    const completion =
      await client.chat.completions.create({

        model: MODEL,

        messages: chatMessages,

        temperature: 0.7,

        max_tokens: 4000
      });

    /*
    ----------------------------------------------
    RESPONSE
    ----------------------------------------------
    */

    const reply =
      completion?.choices?.[0]?.message?.content;

    if (!reply) {

      return res.status(502).json({
        success: false,
        error:
          "DMN'den geçerli bir cevap alınamadı."
      });

    }

    /*
    ----------------------------------------------
    SUCCESS
    ----------------------------------------------
    */

    return res.json({

      success: true,

      reply: reply,

      model:
        completion.model || MODEL

    });

  } catch (error) {

    console.error(
      "DMN /api/chat ERROR:",
      error
    );

    /*
    ----------------------------------------------
    OPENROUTER 401
    ----------------------------------------------
    */

    if (
      error?.status === 401 ||
      error?.code === "invalid_api_key"
    ) {

      return res.status(401).json({
        success: false,
        error:
          "OpenRouter API anahtarı geçersiz. Render Environment Variables bölümündeki OPENROUTER_API_KEY değerini kontrol et."
      });

    }

    /*
    ----------------------------------------------
    RATE LIMIT
    ----------------------------------------------
    */

    if (
      error?.status === 429
    ) {

      return res.status(429).json({
        success: false,
        error:
          "Ücretsiz OpenRouter kullanım limitine ulaşıldı veya servis şu anda yoğun. Bir süre sonra tekrar dene."
      });

    }

    /*
    ----------------------------------------------
    BAD REQUEST
    ----------------------------------------------
    */

    if (
      error?.status === 400
    ) {

      return res.status(400).json({
        success: false,
        error:
          "OpenRouter isteği kabul etmedi. Mesaj veya model ayarlarını kontrol et."
      });

    }

    /*
    ----------------------------------------------
    SERVER ERROR
    ----------------------------------------------
    */

    return res.status(500).json({
      success: false,
      error:
        "DMN sunucusunda beklenmeyen bir hata oluştu."
    });

  }

});

/*
==================================================
CATCH ALL FRONTEND
==================================================
*/

app.get("*", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "index.html"
    )
  );

});

/*
==================================================
START SERVER
==================================================
*/

app.listen(PORT, () => {

  console.log(
    `DMN AI server çalışıyor: ${PORT}`
  );

  console.log(
    `Model: ${MODEL}`
  );

  console.log(
    `OpenRouter API: ${
      OPENROUTER_API_KEY
        ? "AYARLI"
        : "AYARLANMADI"
    }`
  );

});
