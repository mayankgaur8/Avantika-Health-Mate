import { useState } from "react";
import { askAI } from "../services/ollama";

export default function AIChat() {

  const [question,setQuestion] = useState("");
  const [answer,setAnswer] = useState("");

  const handleAsk = async () => {
    const result = await askAI(question);
    setAnswer(result);
  };

  return (
    <div style={{padding:"20px"}}>

      <h2>Avantika AI Assistant</h2>

      <input
        type="text"
        value={question}
        onChange={(e)=>setQuestion(e.target.value)}
        placeholder="Ask your health question..."
        style={{width:"400px"}}
      />

      <button onClick={handleAsk}>
        Ask AI
      </button>

      <div style={{marginTop:"20px"}}>
        <b>AI Answer:</b>
        <p>{answer}</p>
      </div>

    </div>
  );
}
