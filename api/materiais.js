const ORIGENS_PERMITIDAS = new Set([
  "https://pepimalta.github.io"
]);

function responder(res, status, dados) {
  res.status(status).json(dados);
}

function limparJson(texto) {
  return texto.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/i, "").trim();
}

export default async function handler(req, res) {
  const origem = req.headers.origin;
  if (origem && (ORIGENS_PERMITIDAS.has(origem) || origem.endsWith(".vercel.app"))) {
    res.setHeader("Access-Control-Allow-Origin", origem);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return responder(res, 405, { erro: "Método não permitido." });

  const termo = String(req.body?.termo || "").trim();
  if (termo.length < 2 || termo.length > 100) {
    return responder(res, 400, { erro: "Digite um material entre 2 e 100 caracteres." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return responder(res, 500, { erro: "A chave GEMINI_API_KEY não está configurada." });
  }

  const prompt = `Pesquise no Google produtos vendidos no Brasil para: "${termo}".
Retorne SOMENTE JSON válido, sem markdown, neste formato:
{"produtos":[{"nome":"...","preco":"R$ ...","loja":"...","link":"https://...","imagem":"https://...","observacao":"..."}]}
Regras: no máximo 6 produtos; use apenas links encontrados na pesquisa; não invente preço, loja, link ou imagem; quando um dado não estiver disponível use string vazia; prefira o menor preço total aparente; avise em observacao que preço e disponibilidade podem mudar.`;

  try {
    const resposta = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.1 }
        })
      }
    );

    const dados = await resposta.json();
    if (!resposta.ok) {
      console.error("Gemini:", dados?.error?.message || dados);
      return responder(res, resposta.status, { erro: "O Gemini não conseguiu fazer a pesquisa agora." });
    }

    const texto = dados?.candidates?.[0]?.content?.parts
      ?.map(parte => parte.text || "")
      .join("") || "";

    const resultado = JSON.parse(limparJson(texto));
    const produtos = Array.isArray(resultado.produtos)
      ? resultado.produtos.slice(0, 6).map(item => ({
          nome: String(item.nome || ""),
          preco: String(item.preco || ""),
          loja: String(item.loja || ""),
          link: /^https:\/\//i.test(item.link || "") ? item.link : "",
          imagem: /^https:\/\//i.test(item.imagem || "") ? item.imagem : "",
          observacao: String(item.observacao || "")
        }))
      : [];

    return responder(res, 200, { produtos });
  } catch (erro) {
    console.error(erro);
    return responder(res, 500, { erro: "Não foi possível concluir a pesquisa." });
  }
}
