"use client";

import ProductCardAI from "./ProductCardAI";
import "./ChatMessage.css";

export default function ChatMessage({ message }: any) {
  return (
    <div className={`chat-message ${message.sender}`}>
      <p className="chat-text">{message.text}</p>

      {/* Product cards */}
      {message.products?.length > 0 && (
        <div className="ai-product-list">
          {message.products.map((p: any, index: number) => (
            <ProductCardAI key={index} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
