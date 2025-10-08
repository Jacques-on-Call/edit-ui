const blogPostData = {
  title: 'The Future of AI in Content Creation',
  author: 'Jules, UX Architect',
  publishDate: 'October 8, 2025',
  heroImage: 'https://images.unsplash.com/photo-1677442135749-3a76819e6a8e?q=80&w=2070&auto=format&fit=crop',
  summary: 'A deep dive into how artificial intelligence is reshaping the landscape of digital content, from automated writing to personalized user experiences.',
  content: `
    <p>This is a mock blog post. The content here is just a placeholder to demonstrate how a real article would look within this layout.</p>
    <p>AI is no longer a futuristic concept; it's a tool that's actively being used today. In this article, we'll explore three key areas where AI is making a significant impact:</p>
    <ul>
      <li>Automated Content Generation</li>
      <li>Hyper-Personalization</li>
      <li>Predictive Analytics</li>
    </ul>
    <p>Join us as we unpack these topics and provide a glimpse into what's next.</p>
  `,
};

const servicePageData = {
  headline: 'Unlock Your Potential with Our Premier Services',
  subheading: 'We provide cutting-edge solutions to solve your most complex challenges.',
  ctaButtonText: 'Get Started Today',
  features: [
    {
      name: 'Advanced Analytics',
      description: 'Gain deep insights into your data with our powerful analytics platform.',
      icon: 'analytics',
    },
    {
      name: 'Cloud Integration',
      description: 'Seamlessly connect your entire technology stack in the cloud.',
      icon: 'cloud',
    },
    {
      name: '24/7 Support',
      description: 'Our team is always here to help you, no matter the time or day.',
      icon: 'support',
    },
  ],
};

export const getMockData = (pageType) => {
  switch (pageType.toLowerCase()) {
    case 'blogpost':
      return blogPostData;
    case 'service':
      return servicePageData;
    default:
      return {
        title: 'Generic Page',
        content: `<p>This is a preview for the page type: <strong>${pageType}</strong>. No specific mock data was found, so this generic content is being used.</p>`,
      };
  }
};