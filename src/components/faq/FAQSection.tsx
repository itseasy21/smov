import { useState } from "react";

import FAQItem from "./FAQItem";
import { FAQ } from "./types";

function FAQSection({ faqs }: { faqs: FAQ[] }) {
  const [openFAQs, setOpenFAQs] = useState<number[]>([]);

  function toggleFAQ(index: number) {
    setOpenFAQs((prev: number[]) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">
        Frequently Asked Questions
      </h2>
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {faqs.map((faq, index) => (
          <FAQItem
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            faq={faq}
            isOpen={openFAQs.includes(index)}
            toggleFAQ={() => toggleFAQ(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default FAQSection;
