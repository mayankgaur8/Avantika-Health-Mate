export async function askAI(question: string) {
  const response = await fetch("http://4.240.92.48:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3.1",
      prompt: question,
      stream: false
    })
  });

  const data = await response.json();
  return data.response;
}
