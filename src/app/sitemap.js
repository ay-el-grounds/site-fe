export default function sitemap() {
    return [
      {
        url: 'https://aluminumgrounds.co',
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 1,
      },
      {
        url: 'https://aluminumgrounds.co/vroom',
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: 'https://aluminumgrounds.co/vroom/contribute',
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
      },
    ]
  }