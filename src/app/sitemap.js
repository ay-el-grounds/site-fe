export default function sitemap() {
  return [
    {
      url: "https://aluminumgrounds.co",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://aluminumgrounds.co/third-place",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
