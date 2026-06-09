import ai from "./config/gemini.js";

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: "Say hello in one sentence",
    });

    console.log(response.text);
  } catch (error) {
    console.error(error);
  }
}

test();
