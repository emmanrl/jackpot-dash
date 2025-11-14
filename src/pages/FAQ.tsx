import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
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
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
