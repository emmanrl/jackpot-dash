import { Card, CardContent } from "./ui/card";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Adebayo O.",
      location: "Lagos",
      testimonial: "I won ₦500,000 on my first week! This platform is absolutely legitimate and the withdrawals are instant. Life-changing!",
      rating: 5,
      initials: "AO"
    },
    {
      name: "Chioma N.",
      location: "Abuja",
      testimonial: "Fast, secure, and transparent. I've won multiple times and the process is always smooth. Highly recommended!",
      rating: 5,
      initials: "CN"
    },
    {
      name: "Ibrahim M.",
      location: "Kano",
      testimonial: "The hourly draws are my favorite! Small ticket prices but real chances to win. Already withdrew ₦200K this month.",
      rating: 5,
      initials: "IM"
    },
    {
      name: "Grace E.",
      location: "Port Harcourt",
      testimonial: "Best lottery platform in Nigeria. Customer support is excellent and the draws are completely fair.",
      rating: 5,
      initials: "GE"
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-gradient-to-b from-muted/20 to-background scroll-smooth">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8 sm:mb-12 opacity-0 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            What Our Winners Say
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Join thousands of satisfied players who are winning every day
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="relative overflow-hidden border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-xl opacity-0 animate-fade-in group"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <CardContent className="p-4 sm:p-6">
                <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-primary/20 absolute top-4 right-4" />
                
                <div className="flex items-center gap-3 sm:gap-4 mb-4">
                  <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm sm:text-base">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h4 className="font-bold text-base sm:text-lg">{testimonial.name}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>

                <div className="flex gap-1 mb-3 sm:mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-primary text-primary" />
                  ))}
                </div>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  "{testimonial.testimonial}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
