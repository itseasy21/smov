import { Button } from "../buttons/Button";
import { Icon, Icons } from "../Icon";
import { FAQ } from "./types";

function FAQItem({
  faq,
  isOpen,
  toggleFAQ,
}: {
  faq: FAQ;
  isOpen: boolean;
  toggleFAQ: () => void;
}) {
  return (
    <div className="border-b border-gray-700">
      <Button
        className="flex justify-between items-center w-full py-4 px-6 text-left focus:outline-none"
        onClick={toggleFAQ}
        theme="secondary"
      >
        <span className="text-lg font-semibold text-white">{faq.question}</span>
        <Icon
          icon={isOpen ? Icons.CHEVRON_UP : Icons.CHEVRON_DOWN}
          className={`text-white transition-transform duration-300 ${isOpen ? "transform rotate-180" : ""}`}
        />
      </Button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="py-4 px-6 text-gray-300">{faq.answer}</p>
      </div>
    </div>
  );
}

export default FAQItem;
