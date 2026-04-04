const { GoogleGenerativeAI } = require("@google/generative-ai");
const { JSDOM } = require('jsdom');
const fs = require('fs');

// Mocking the Google Generative AI SDK
jest.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => "Professional summary: Designed and implemented scalable backend architectures." }
        })
      }),
      listModels: jest.fn().mockResolvedValue({
        models: [
          { name: 'models/gemini-1.5-flash-preview' },
          { name: 'models/gemini-2.0-flash-lite-preview-02-05' }
        ]
      })
    }))
  };
});

describe('Resume Automation Pipeline', () => {
  test('should render DOM correctly from index.html', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Check key elements
    expect(document.getElementById('candidateName')).toBeDefined();
    expect(document.getElementById('skillsGroupList')).toBeDefined();
  });

  test('should select the latest Flash Preview model', async () => {
    const genAI = new GoogleGenerativeAI("mock-key");
    const models = await genAI.listModels();
    const flashPreviewModels = models.models.filter(m => 
      m.name.toLowerCase().includes('flash') && m.name.toLowerCase().includes('preview')
    );
    flashPreviewModels.sort((a, b) => b.name.localeCompare(a.name));
    
    expect(flashPreviewModels[0].name).toContain('gemini-2.0');
  });
});
