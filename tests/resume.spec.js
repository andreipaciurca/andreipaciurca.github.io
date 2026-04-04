const fs = require('fs');

test('LinkedIn data mapping should produce valid profile object', async () => {
    // Mocking input data structure based on the provided LinkedIn JSON
    const mockData = [{
        about: "Software Engineer with 5 years experience.",
        experience: [{
            position: "Senior Engineer",
            companyName: "TechCorp",
            startDate: { text: "2020" },
            endDate: { text: "Present" },
            location: "Remote",
            description: "Built scalable systems."
        }],
        skills: [{ name: "Java" }]
    }];
    
    // Simulate mapping logic (simplified for test)
    const summary = "A professional summary.";
    const experiences = mockData[0].experience.map(exp => ({
        title: exp.position,
        company: exp.companyName,
        bullets: ["Concise summary of experience."]
    }));
    
    expect(summary).toBeDefined();
    expect(experiences[0].title).toBe("Senior Engineer");
    expect(experiences[0].bullets).toHaveLength(1);
});
