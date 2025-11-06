import JackpotCard from "./JackpotCard";

const ActiveJackpots = () => {
  const jackpots = [
    {
      title: "Hourly Mega Draw",
      prize: "$5,000",
      ticketPrice: "$2.00",
      endTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes
      category: "hourly" as const,
    },
    {
      title: "Daily Fortune",
      prize: "$50,000",
      ticketPrice: "$10.00",
      endTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      category: "daily" as const,
    },
    {
      title: "Weekly Millionaire",
      prize: "$500,000",
      ticketPrice: "$25.00",
      endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
      category: "weekly" as const,
    },
    {
      title: "Monthly Grand Prize",
      prize: "$1,000,000",
      ticketPrice: "$50.00",
      endTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
      category: "monthly" as const,
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Active Jackpots
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your jackpot and start winning. New draws every hour!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {jackpots.map((jackpot, index) => (
            <JackpotCard key={index} {...jackpot} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ActiveJackpots;
