"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import Spline from "@splinetool/react-spline";
import Groq from "groq-sdk";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Chat() {
  const [messages, setMessages] = useState([
    { text: "Olá, sou o EcoBot! Estou aqui para ajudar com questões sobre sustentabilidade e combate às emissões de CO². Como posso ajudar?", isUser: false },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const groqClient = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const handleSend = async () => {
    if (input.trim() !== "") {
      setMessages((prev) => [...prev, { text: input, isUser: true }]);
      const userMessage = input;
      setInput("");
      setIsLoading(true);

      try {
        const response = await groqClient.chat.completions.create({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: "Você é o EcoBot, um assistente focado exclusivamente em sustentabilidade e combate às emissões de CO²; responda de forma clara, direta e concisa (máximo 4 frases), apenas sobre sustentabilidade e redução de CO²; se a pergunta estiver fora do escopo, redirecione gentilmente para temas relacionados ou informe que não pode ajudar." },
            { role: "user", content: userMessage },
          ],
        });

        if (!response?.choices || response.choices.length === 0) {
          throw new Error("Resposta vazia do servidor");
        }

        const botReply = response.choices[0]?.message?.content || "Desculpe, não consegui entender.";
        setMessages((prev) => [...prev, { text: botReply, isUser: false }]);
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
        ) {
          const err = error as { message: string };
          console.error("Erro ao obter resposta do chatbot:", err.message);
          const errorMessage = err.message.includes("Resposta vazia")
            ? "Não foi possível obter uma resposta válida no momento."
            : "Erro ao se comunicar com o servidor.";
          setMessages((prev) => [...prev, { text: errorMessage, isUser: false }]);
        } else {
          console.error("Erro ao obter resposta do chatbot:", error);
          setMessages((prev) => [...prev, { text: "Erro desconhecido ao se comunicar com o servidor.", isUser: false }]);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-b from-sky-400 to-white p-4">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/uvO9VMH2MygR2R2X/scene.splinecode" />
      </div>

      {/* Área de mensagens */}
      {/* Metade superior - espaço vazio ou modelo 3D */}
      <div className="flex-1"></div>

      {/* Metade inferior - bloco de mensagens */}
      <div className="relative z-10 flex flex-col h-1/2 overflow-y-auto space-y-4 backdrop-blur-[2px] mask-gradient [&::-webkit-scrollbar]:hidden">
        <div className="flex-1 "></div> {/* Spacer to push messages to the bottom */}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
          >
            <Card
              className={`max-w-[85%] p-4 ${
                message.isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
              }`}
            >
              <CardContent>
                <div className="text-[11px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.text}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Área de entrada de mensagens */}
      <div className="relative z-10 flex items-center gap-2 p-2 bg-white shadow-lg rounded-xl mt-5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => 
            {
              if (e.key === "Enter" && !isLoading) 
              {
                handleSend();
              }
            }
          }
          placeholder="Digite sua mensagem..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading}>
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

