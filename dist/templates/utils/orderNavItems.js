export const orderNavItemsTemplate = `interface PagesProps {
  slug: string;
  title: string;
  date: string;
  category: string;
  categoryOrder?: number;
  order?: number;
}

interface AccProps {
  [key: string]: { categoryOrder: number; pages: { date: string; slug: string; title: string; order: number }[] };
}

function transformPagesToGroupedStructure(pages: PagesProps[]) {
  const grouped = pages.reduce((acc: AccProps, page: PagesProps) => {
    const category = page.category || 'Uncategorized';
    
    if (!acc[category]) {
      acc[category] = {
        categoryOrder: page.categoryOrder || 0,
        pages: []
      };
    }
    
    acc[category].pages.push({
      date: page.date,
      slug: page.slug,
      title: page.title,
      order: page.order || 0
    });
    
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort(([, a], [, b]) => a.categoryOrder - b.categoryOrder)
    .map(([categoryName, categoryData], index) => ({
      slug: index === 0 ? "" : categoryName.toLowerCase().replace(/\s+/g, '-'),
      label: categoryName,
      links: categoryData.pages.sort((a, b) => a.order - b.order)
    }));
}

export { transformPagesToGroupedStructure };
`;
