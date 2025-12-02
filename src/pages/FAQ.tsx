import MainLayout from "@/components/MainLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>
        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-1">
            <AccordionTrigger>How do I participate?</AccordionTrigger>
            <AccordionContent>
              Sign up for an account, deposit funds into your wallet, and purchase tickets for any active jackpot draw.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>How are winners selected?</AccordionTrigger>
            <AccordionContent>
              Winners are selected randomly using a provably fair algorithm when the draw time is reached.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>How do I withdraw my winnings?</AccordionTrigger>
            <AccordionContent>
              Navigate to the Withdrawal page, add your bank account details, and request a withdrawal. Funds are processed within 24 hours.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </MainLayout>
  );
};

export default FAQ;
